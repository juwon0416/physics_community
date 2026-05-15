import { FIELDS } from '../data/seed';
import { storage, type Topic } from '../data/storage';
import { conceptAPI } from './concepts';
import type { GraphViewScope } from './graphModel';
import { supabase } from './supabase';
import { normalizeTopicSlug } from './topicSlug';
import { extractSourceText, type ExtractedSourceText, type SourceDocumentKind } from './sourceText';
import { buildKnowledgeNodeDocument } from './knowledgeWriting';
import {
    KNOWLEDGE_SPHERE_MAP,
    KNOWLEDGE_SPHERE_TEMPLATES,
    type KnowledgeFieldSeed,
    type KnowledgeNodeTemplate,
} from './knowledgeTaxonomy';
import {
    KNOWLEDGE_SCHEMA_SETUP_MESSAGE,
    checkKnowledgeSchemaReady,
} from './knowledgeSchema';
import {
    ARCHIVE_SCHEMA_SETUP_MESSAGE,
    checkArchiveSchemaReady,
} from './archiveSchema';

type RepositoryRow = {
    id: string;
    scope: GraphViewScope;
};

type SourceDocumentRow = {
    id: string;
    title: string;
    file_name: string;
    status: string;
    metadata?: Record<string, unknown> | null;
    created_at: string;
};

type IngestionRunRow = {
    id: string;
    status: string;
    summary?: Record<string, unknown> | null;
    created_at: string;
};

type FieldRow = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
};

type GraphNodeRow = {
    id: string;
    label: string;
    type: string;
    x: number | null;
    y: number | null;
    data?: Record<string, unknown> | null;
};

type ClusterPlan = {
    clusterId: string;
    clusterLabel: string;
    keywords: string[];
    nodes: Array<{
        template: KnowledgeNodeTemplate;
        score: number;
    }>;
};

export interface KnowledgeImportParams {
    file: File;
    title?: string;
    notes?: string;
    scope: GraphViewScope;
    userId?: string | null;
}

export interface KnowledgeImportSummary {
    repositoryId: string;
    sourceDocumentId: string;
    runId: string;
    createdSpheres: string[];
    reusedSpheres: string[];
    createdClusters: string[];
    createdTopics: string[];
    updatedTopics: string[];
    linkedTopics: string[];
    warnings: string[];
}

const MAX_SENTENCE_COUNT = 3;

function getScopedTableNames(scope: GraphViewScope) {
    if (scope === 'archive') {
        return {
            topicTable: 'archive_topics',
            graphNodeTable: 'archive_graph_nodes',
            graphEdgeTable: 'archive_graph_edges',
        } as const;
    }

    return {
        topicTable: 'topics',
        graphNodeTable: 'graph_nodes',
        graphEdgeTable: 'graph_edges',
    } as const;
}

function countKeywordMatches(text: string, keywords: string[]) {
    return keywords.reduce((total, keyword) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) return total;
        const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = text.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g'));
        return total + (matches?.length || 0);
    }, 0);
}

function splitIntoSentences(text: string) {
    return text
        .split(/(?<=[.?!])\s+/)
        .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
        .filter((sentence) => sentence.length >= 24);
}

function sanitizeFileName(value: string) {
    const sanitized = value
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');

    return sanitized || `source-${crypto.randomUUID()}`;
}

function inferSourceKind(file: File): SourceDocumentKind {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown')) return 'markdown';
    return 'text';
}

function createSphereLabel(field: KnowledgeFieldSeed) {
    return field.name
        .split(/\s+/)
        .map((part) => part.toUpperCase())
        .join('\n');
}

function createSpherePosition(index: number) {
    const angle = (index / Math.max(1, index + 3)) * Math.PI * 2;
    const radius = 20 + (index % 4) * 3;
    return {
        x: Number((Math.cos(angle) * radius).toFixed(2)),
        y: Number((Math.sin(angle) * radius).toFixed(2)),
        z: Number((-10 - (index % 3) * 5).toFixed(2)),
    };
}

function mergeStringArrays(...sources: Array<string[] | null | undefined>) {
    return Array.from(
        new Set(
            sources
                .flatMap((source) => source || [])
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    );
}

function toSentenceSnippet(text: string, keywords: string[]) {
    const sentences = splitIntoSentences(text);
    const keywordSet = keywords.map((keyword) => keyword.toLowerCase());
    const matches = sentences.filter((sentence) =>
        keywordSet.some((keyword) => sentence.toLowerCase().includes(keyword)),
    );

    const picked = (matches.length > 0 ? matches : sentences).slice(0, MAX_SENTENCE_COUNT);
    return picked.join(' ');
}

function appendSourceSection(existingContent: string | undefined, nextSection: string, sourceDocumentId: string) {
    const normalizedExisting = existingContent?.trim() || '';
    if (normalizedExisting.includes(`data-source-document="${sourceDocumentId}"`)) {
        return normalizedExisting;
    }

    if (!normalizedExisting) {
        return nextSection;
    }

    return `${normalizedExisting}\n<hr/>\n${nextSection}`;
}

function isGeneratedKnowledgeDocument(existingContent: string | undefined) {
    return (existingContent || '').includes('data-generated-knowledge-doc="true"');
}

function pickEvidenceParagraphs(paragraphs: string[], keywords: string[]) {
    const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
    const matchingParagraphs = paragraphs.filter((paragraph) =>
        normalizedKeywords.some((keyword) => paragraph.toLowerCase().includes(keyword)),
    );

    return (matchingParagraphs.length > 0 ? matchingParagraphs : paragraphs).slice(0, 4);
}

function pickEquationCandidates(equations: string[], keywords: string[]) {
    const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
    const matchingEquations = equations.filter((equation) =>
        normalizedKeywords.some((keyword) => equation.toLowerCase().includes(keyword)),
    );

    return (matchingEquations.length > 0 ? matchingEquations : equations).slice(0, 6);
}

function pickSpherePlans(
    text: string,
    headings: string[],
    notes: string | undefined,
    title: string,
) {
    const analysisText = `${title}\n${notes || ''}\n${headings.join('\n')}\n${text}`.toLowerCase();
    const sphereScores = KNOWLEDGE_SPHERE_TEMPLATES.map((template) => ({
        template,
        score: countKeywordMatches(analysisText, template.keywords),
    }));

    const selected = sphereScores
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4);

    const fallback = selected.length > 0
        ? selected
        : [{ template: KNOWLEDGE_SPHERE_MAP.get('mathematical-physics')!, score: 1 }];

    return fallback.map(({ template, score }) => {
        const clusters = template.clusters
            .map((cluster) => ({
                cluster,
                score: countKeywordMatches(analysisText, cluster.keywords),
            }))
            .filter((entry) => entry.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, 3);

        const activeClusters = (clusters.length > 0 ? clusters : [{
            cluster: template.clusters[0],
            score: 1,
        }]).map(({ cluster }) => {
            const nodes = cluster.nodes
                .map((nodeTemplate) => ({
                    template: nodeTemplate,
                    score: countKeywordMatches(analysisText, nodeTemplate.keywords),
                }))
                .filter((entry) => entry.score > 0)
                .sort((left, right) => right.score - left.score)
                .slice(0, 4);

            return {
                clusterId: `cluster-${template.id}-${cluster.key}`,
                clusterLabel: cluster.title,
                keywords: cluster.keywords,
                nodes: nodes.length > 0 ? nodes : cluster.nodes.slice(0, 2).map((nodeTemplate) => ({
                    template: nodeTemplate,
                    score: 1,
                })),
            };
        });

        return {
            template,
            score,
            clusters: activeClusters,
        };
    });
}

async function ensureRepository(scope: GraphViewScope, userId: string | null | undefined) {
    const { data: existing, error: lookupError } = await supabase
        .from('knowledge_repositories')
        .select('id, scope')
        .eq('scope', scope)
        .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) return existing as RepositoryRow;

    const { data, error } = await supabase
        .from('knowledge_repositories')
        .insert({
            scope,
            label: scope === 'archive' ? 'Archive Knowledge Repository' : 'Legacy Knowledge Repository',
            status: 'ready',
            created_by: userId || null,
        })
        .select('id, scope')
        .single();

    if (error) throw error;
    return data as RepositoryRow;
}

async function uploadKnowledgeSourceFile(file: File, scope: GraphViewScope) {
    const fileName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const filePath = `knowledge/${scope}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
}

async function createSourceDocumentRow(params: {
    repositoryId: string;
    scope: GraphViewScope;
    title: string;
    file: File;
    fileUrl: string;
    notes?: string;
    userId?: string | null;
}) {
    const { data, error } = await supabase
        .from('knowledge_source_documents')
        .insert({
            repository_id: params.repositoryId,
            scope: params.scope,
            title: params.title,
            source_kind: inferSourceKind(params.file),
            file_name: params.file.name,
            file_url: params.fileUrl,
            mime_type: params.file.type || null,
            file_size: params.file.size,
            metadata: {
                notes: params.notes || null,
            },
            status: 'processing',
            created_by: params.userId || null,
        })
        .select('id, title, file_name, status, metadata, created_at')
        .single();

    if (error) throw error;
    return data as SourceDocumentRow;
}

async function createRunRow(params: {
    repositoryId: string;
    scope: GraphViewScope;
    sourceDocumentId: string;
    userId?: string | null;
}) {
    const { data, error } = await supabase
        .from('knowledge_ingestion_runs')
        .insert({
            repository_id: params.repositoryId,
            scope: params.scope,
            source_document_id: params.sourceDocumentId,
            status: 'processing',
            created_by: params.userId || null,
        })
        .select('id, status, summary, created_at')
        .single();

    if (error) throw error;
    return data as IngestionRunRow;
}

async function updateSourceDocumentRow(
    sourceDocumentId: string,
    updates: Record<string, unknown>,
) {
    const { error } = await supabase
        .from('knowledge_source_documents')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', sourceDocumentId);

    if (error) throw error;
}

async function updateRunRow(
    runId: string,
    updates: Record<string, unknown>,
) {
    const { error } = await supabase
        .from('knowledge_ingestion_runs')
        .update(updates)
        .eq('id', runId);

    if (error) throw error;
}

async function ensureFieldRecord(field: KnowledgeFieldSeed) {
    const existingSeed = FIELDS.find((entry) => entry.id === field.id);
    const payload = {
        id: field.id,
        slug: field.slug,
        name: field.name,
        description: field.description,
        icon: field.icon,
        color: existingSeed?.color || field.color,
    };

    const { error } = await supabase
        .from('fields')
        .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
}

async function fetchFieldRows() {
    const { data, error } = await supabase.from('fields').select('*');
    if (error) throw error;
    return (data || []) as FieldRow[];
}

async function fetchGraphNodeRows(scope: GraphViewScope) {
    const { graphNodeTable } = getScopedTableNames(scope);
    const { data, error } = await supabase.from(graphNodeTable).select('*');
    if (error) throw error;
    return (data || []) as GraphNodeRow[];
}

async function ensureRootSphere(scope: GraphViewScope) {
    const result = await storage.initializeDefaultGraphSpheres(scope);
    if (result.error) {
        throw result.error;
    }
}

async function ensureSphereGraphNode(
    scope: GraphViewScope,
    field: KnowledgeFieldSeed,
    sortOrder: number,
    totalExistingFields: number,
) {
    await ensureFieldRecord(field);
    const result = await storage.upsertGraphSphere(
        {
            id: field.id,
            label: createSphereLabel(field),
            nodeType: 'field',
            radius: 6.4,
            position: createSpherePosition(totalExistingFields + sortOrder),
            flatWidth: 54,
            flatHeight: 28,
            sortOrder,
            bindingKey: field.id,
        },
        scope,
    );

    if (result.error) {
        throw result.error;
    }

    await conceptAPI.createEdge('root', field.id, 'hierarchy', scope);
}

async function upsertClusterNode(scope: GraphViewScope, sphereFieldId: string, clusterPlan: ClusterPlan) {
    const { graphNodeTable } = getScopedTableNames(scope);
    const { data: existingNode, error: readError } = await supabase
        .from(graphNodeTable)
        .select('data')
        .eq('id', clusterPlan.clusterId)
        .maybeSingle();

    if (readError) throw readError;

    const existingData =
        existingNode?.data && typeof existingNode.data === 'object' && !Array.isArray(existingNode.data)
            ? (existingNode.data as Record<string, unknown>)
            : {};

    const { error } = await supabase
        .from(graphNodeTable)
        .upsert(
            {
                id: clusterPlan.clusterId,
                type: 'cluster',
                label: clusterPlan.clusterLabel,
                x: 0,
                y: 0,
                data: {
                    ...existingData,
                    fieldId: sphereFieldId,
                    clusterKey: clusterPlan.clusterId,
                    keywords: clusterPlan.keywords,
                },
            },
            { onConflict: 'id' },
        );

    if (error) throw error;

    await conceptAPI.createEdge(sphereFieldId, clusterPlan.clusterId, 'hierarchy', scope);
}

async function mergeTopicNodeData(
    scope: GraphViewScope,
    nodeId: string,
    updates: Record<string, unknown>,
) {
    const { graphNodeTable } = getScopedTableNames(scope);
    const { data: existingNode, error: readError } = await supabase
        .from(graphNodeTable)
        .select('data')
        .eq('id', nodeId)
        .maybeSingle();

    if (readError) throw readError;

    const existingData =
        existingNode?.data && typeof existingNode.data === 'object' && !Array.isArray(existingNode.data)
            ? (existingNode.data as Record<string, unknown>)
            : {};

    const nextData = {
        ...existingData,
        ...updates,
        sourceDocuments: mergeStringArrays(
            Array.isArray(existingData.sourceDocuments)
                ? existingData.sourceDocuments.filter((entry): entry is string => typeof entry === 'string')
                : [],
            Array.isArray(updates.sourceDocuments)
                ? updates.sourceDocuments.filter((entry): entry is string => typeof entry === 'string')
                : [],
        ),
    };

    const { error } = await supabase
        .from(graphNodeTable)
        .update({
            data: nextData,
        })
        .eq('id', nodeId);

    if (error) throw error;
}

async function connectTopicToCluster(scope: GraphViewScope, clusterId: string, topicId: string) {
    await conceptAPI.createEdge(clusterId, topicId, 'hierarchy', scope);
}

async function createNodeSourceLink(params: {
    repositoryId: string;
    scope: GraphViewScope;
    sourceDocumentId: string;
    ingestionRunId: string;
    nodeId: string;
    topicId: string;
    relationType: 'created' | 'updated' | 'evidence';
    evidence: Record<string, unknown>;
}) {
    const { error } = await supabase
        .from('knowledge_node_sources')
        .upsert(
            {
                repository_id: params.repositoryId,
                scope: params.scope,
                source_document_id: params.sourceDocumentId,
                ingestion_run_id: params.ingestionRunId,
                node_id: params.nodeId,
                topic_id: params.topicId,
                relation_type: params.relationType,
                evidence: params.evidence,
            },
            { onConflict: 'scope,source_document_id,node_id,relation_type' },
        );

    if (error) throw error;
}

async function createChangeSet(params: {
    repositoryId: string;
    ingestionRunId: string;
    sourceDocumentId: string;
    scope: GraphViewScope;
    summary: Record<string, unknown>;
}) {
    const { error } = await supabase.from('knowledge_change_sets').insert({
        repository_id: params.repositoryId,
        ingestion_run_id: params.ingestionRunId,
        source_document_id: params.sourceDocumentId,
        scope: params.scope,
        summary: params.summary,
    });

    if (error) throw error;
}

async function ensureTopic(
    scope: GraphViewScope,
    fieldId: string,
    clusterPlan: ClusterPlan,
    nodeTemplate: KnowledgeNodeTemplate,
    sourceTitle: string,
    sourceDocumentId: string,
    extractedSource: ExtractedSourceText,
    notes: string | undefined,
) {
    const slug = normalizeTopicSlug(nodeTemplate.title) || normalizeTopicSlug(nodeTemplate.key) || nodeTemplate.key;
    const existingTopic = await storage.getTopicBySlug(slug, scope);
    const evidenceText = toSentenceSnippet(extractedSource.text, nodeTemplate.keywords) || nodeTemplate.summary;
    const evidenceParagraphs = pickEvidenceParagraphs(extractedSource.paragraphs, nodeTemplate.keywords);
    const equationCandidates = pickEquationCandidates(extractedSource.equationCandidates, nodeTemplate.keywords);
    const relatedTitles = nodeTemplate.related || [];
    const prerequisiteTitles = nodeTemplate.prerequisites || [];
    const sphere =
        KNOWLEDGE_SPHERE_MAP.get(fieldId) ||
        KNOWLEDGE_SPHERE_TEMPLATES.find((entry) => entry.field.id === fieldId)!;
    const documentParts = buildKnowledgeNodeDocument({
        sourceTitle,
        sourceDocumentId,
        sphereName: sphere.field.name,
        clusterLabel: clusterPlan.clusterLabel,
        node: nodeTemplate,
        evidenceText,
        evidenceParagraphs,
        equationCandidates,
        relatedTitles,
        prerequisiteTitles,
        notes,
    });

    const nextSummary = existingTopic?.summary?.trim()
        ? existingTopic.summary
        : nodeTemplate.summary;

    const nextTags = mergeStringArrays(
        existingTopic?.tags,
        [fieldId, clusterPlan.clusterLabel.toLowerCase().replace(/\s+/g, '-')],
        nodeTemplate.keywords.slice(0, 4),
    );

    if (existingTopic) {
        const nextContent = isGeneratedKnowledgeDocument(existingTopic.content)
            ? documentParts.documentHtml
            : appendSourceSection(
                existingTopic.content,
                documentParts.sourceSectionHtml,
                sourceDocumentId,
            );
        const result = await storage.updateTopic(
            existingTopic.id,
            {
                field_id: fieldId,
                summary: nextSummary,
                tags: nextTags,
                content: nextContent,
            },
            scope,
        );

        if (result.error) throw result.error;

        await mergeTopicNodeData(scope, existingTopic.id, {
            fieldId,
            clusterId: clusterPlan.clusterId,
            nodeType: nodeTemplate.nodeType,
            sourceDocuments: [sourceDocumentId],
            documentSpec: documentParts.documentSpec,
            evidenceSummary: evidenceText,
        });

        return {
            topic: {
                ...existingTopic,
                summary: nextSummary,
                tags: nextTags,
                content: nextContent,
                field_id: fieldId,
            } as Topic,
            created: false,
            evidenceText,
        };
    }

    const result = await storage.addTopic(
        {
            field_id: fieldId,
            year: '0',
            title: nodeTemplate.title,
            slug,
            summary: nextSummary,
            tags: nextTags,
            content: documentParts.documentHtml,
        },
        scope,
    );

    if (result.error || !result.data) {
        throw result.error || new Error('Topic creation failed');
    }

    await mergeTopicNodeData(scope, result.data.id, {
        fieldId,
        clusterId: clusterPlan.clusterId,
        nodeType: nodeTemplate.nodeType,
        sourceDocuments: [sourceDocumentId],
        documentSpec: documentParts.documentSpec,
        evidenceSummary: evidenceText,
    });

    return {
        topic: result.data,
        created: true,
        evidenceText,
    };
}

async function createSemanticEdgesForTopic(
    scope: GraphViewScope,
    topic: Topic,
    titleByNormalizedSlug: Map<string, string>,
    nodeTemplate: KnowledgeNodeTemplate,
) {
    const edgeTitles = mergeStringArrays(nodeTemplate.related, nodeTemplate.prerequisites);

    for (const title of edgeTitles) {
        const slug = normalizeTopicSlug(title);
        if (!slug) continue;
        const linkedTitle = titleByNormalizedSlug.get(slug);
        if (!linkedTitle || linkedTitle === topic.title) continue;

        const linkedTopic = await storage.getTopicBySlug(slug, scope);
        if (!linkedTopic) continue;

        const label = (nodeTemplate.prerequisites || []).includes(title) ? 'prereq' : 'related';
        await conceptAPI.createEdge(topic.id, linkedTopic.id, label, scope);
    }
}

export async function listKnowledgeSourceDocuments(scope: GraphViewScope, limit = 6) {
    const schemaReady = await checkKnowledgeSchemaReady().catch(() => false);
    if (!schemaReady) return [];

    const { data, error } = await supabase
        .from('knowledge_source_documents')
        .select('id, title, file_name, status, metadata, created_at')
        .eq('scope', scope)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []) as SourceDocumentRow[];
}

export async function listKnowledgeIngestionRuns(scope: GraphViewScope, limit = 6) {
    const schemaReady = await checkKnowledgeSchemaReady().catch(() => false);
    if (!schemaReady) return [];

    const { data, error } = await supabase
        .from('knowledge_ingestion_runs')
        .select('id, status, summary, created_at')
        .eq('scope', scope)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []) as IngestionRunRow[];
}

export async function importKnowledgeSource({
    file,
    title,
    notes,
    scope,
    userId,
}: KnowledgeImportParams): Promise<KnowledgeImportSummary> {
    const knowledgeSchemaReady = await checkKnowledgeSchemaReady();
    if (!knowledgeSchemaReady) {
        throw new Error(KNOWLEDGE_SCHEMA_SETUP_MESSAGE);
    }

    if (scope === 'archive') {
        const archiveReady = await checkArchiveSchemaReady();
        if (!archiveReady) {
            throw new Error(ARCHIVE_SCHEMA_SETUP_MESSAGE);
        }
    }

    await ensureRootSphere(scope);

    const repository = await ensureRepository(scope, userId);
    const fileUrl = await uploadKnowledgeSourceFile(file, scope);
    const documentTitle = title?.trim() || file.name.replace(/\.[^.]+$/, '');
    const sourceDocument = await createSourceDocumentRow({
        repositoryId: repository.id,
        scope,
        title: documentTitle,
        file,
        fileUrl,
        notes,
        userId,
    });
    const run = await createRunRow({
        repositoryId: repository.id,
        scope,
        sourceDocumentId: sourceDocument.id,
        userId,
    });

    try {
        const extracted = await extractSourceText(file);
        const fieldRows = await fetchFieldRows();
        const graphNodeRows = await fetchGraphNodeRows(scope);
        const spherePlans = pickSpherePlans(extracted.text, extracted.headings, notes, documentTitle);
        const existingFieldIds = new Set(fieldRows.map((field) => field.id));
        const existingGraphNodeIds = new Set(graphNodeRows.map((node) => node.id));
        const titleByNormalizedSlug = new Map<string, string>();

        const createdSpheres: string[] = [];
        const reusedSpheres: string[] = [];
        const createdClusters: string[] = [];
        const createdTopics: string[] = [];
        const updatedTopics: string[] = [];
        const linkedTopics: string[] = [];
        const warnings: string[] = [];
        const pendingSemanticEdges: Array<{ topic: Topic; template: KnowledgeNodeTemplate }> = [];

        spherePlans.forEach((plan) => {
            plan.clusters.forEach((cluster) => {
                cluster.nodes.forEach(({ template }) => {
                    const slug = normalizeTopicSlug(template.title);
                    if (slug) {
                        titleByNormalizedSlug.set(slug, template.title);
                    }
                });
            });
        });

        for (const [index, spherePlan] of spherePlans.entries()) {
            const field = spherePlan.template.field;
            const fieldExists = existingFieldIds.has(field.id);
            await ensureSphereGraphNode(scope, field, index + 1, existingFieldIds.size + index);
            if (fieldExists) {
                reusedSpheres.push(field.name);
            } else {
                createdSpheres.push(field.name);
                existingFieldIds.add(field.id);
            }

            for (const clusterPlan of spherePlan.clusters) {
                if (!existingGraphNodeIds.has(clusterPlan.clusterId)) {
                    createdClusters.push(`${field.name} / ${clusterPlan.clusterLabel}`);
                    existingGraphNodeIds.add(clusterPlan.clusterId);
                }

                await upsertClusterNode(scope, field.id, clusterPlan);

                for (const { template } of clusterPlan.nodes) {
                    const { topic, created, evidenceText } = await ensureTopic(
                        scope,
                        field.id,
                        clusterPlan,
                        template,
                        documentTitle,
                        sourceDocument.id,
                        extracted,
                        notes,
                    );

                    await connectTopicToCluster(scope, clusterPlan.clusterId, topic.id);
                    pendingSemanticEdges.push({ topic, template });

                    if (created) {
                        createdTopics.push(topic.title);
                    } else {
                        updatedTopics.push(topic.title);
                    }

                    linkedTopics.push(topic.title);
                    await createNodeSourceLink({
                        repositoryId: repository.id,
                        scope,
                        sourceDocumentId: sourceDocument.id,
                        ingestionRunId: run.id,
                        nodeId: topic.id,
                        topicId: topic.id,
                        relationType: created ? 'created' : 'updated',
                        evidence: {
                            sphereId: field.id,
                            clusterId: clusterPlan.clusterId,
                            evidenceText,
                        },
                    });
                }
            }
        }

        for (const pendingEdge of pendingSemanticEdges) {
            await createSemanticEdgesForTopic(
                scope,
                pendingEdge.topic,
                titleByNormalizedSlug,
                pendingEdge.template,
            );
        }

        if (spherePlans.length === 0) {
            warnings.push('No sphere plan was detected from the uploaded source.');
        }

        const summary = {
            createdSpheres,
            reusedSpheres,
            createdClusters,
            createdTopics,
            updatedTopics,
            linkedTopics,
            warnings,
        };

        await updateSourceDocumentRow(sourceDocument.id, {
            status: 'completed',
            source_kind: extracted.kind,
            extracted_text: extracted.text,
            preview_text: extracted.preview,
            metadata: {
                ...(sourceDocument.metadata || {}),
                headings: extracted.headings,
                pageCount: extracted.pageCount,
                paragraphCount: extracted.paragraphs.length,
                equationCandidates: extracted.equationCandidates,
                plannedSpheres: spherePlans.map((plan) => plan.template.field.name),
                notes: notes || null,
            },
        });

        await updateRunRow(run.id, {
            status: 'completed',
            summary,
            completed_at: new Date().toISOString(),
        });

        await createChangeSet({
            repositoryId: repository.id,
            ingestionRunId: run.id,
            sourceDocumentId: sourceDocument.id,
            scope,
            summary,
        });

        return {
            repositoryId: repository.id,
            sourceDocumentId: sourceDocument.id,
            runId: run.id,
            createdSpheres,
            reusedSpheres,
            createdClusters,
            createdTopics,
            updatedTopics,
            linkedTopics,
            warnings,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown knowledge import error';

        await updateSourceDocumentRow(sourceDocument.id, {
            status: 'failed',
            metadata: {
                ...(sourceDocument.metadata || {}),
                notes: notes || null,
                errorMessage,
            },
        }).catch(() => undefined);

        await updateRunRow(run.id, {
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
        }).catch(() => undefined);

        throw error instanceof Error ? error : new Error(errorMessage);
    }
}
