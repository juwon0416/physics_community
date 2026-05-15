import { FIELDS, TIMELINE_TOPICS } from '../data/seed';
import {
    backlinksToResolvedEdges,
    extractInlineBacklinksFromContent,
    normalizeInlineBacklinkTarget,
} from './backlinks';
import {
    createGraphSphereNodeData,
    getDefaultGraphSphereConfig,
} from './graphSpheres';
import { supabase } from './supabase';
import { checkArchiveSchemaReady } from './archiveSchema';
import { buildArchiveFundamentalsGraphModel } from '../data/archiveFundamentals';
import { TOPIC_CONTENT_OVERRIDES } from '../data/topicContentOverrides';
import { normalizeTopicSlug } from './topicSlug';

export interface GraphNode {
    id: string;
    type: 'root' | 'field' | 'cluster' | 'topic' | 'concept' | 'section';
    label: string;
    color?: string;
    description?: string;
    slug?: string;
    data?: Record<string, unknown>;
    x?: number;
    y?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    type?: 'hierarchy' | 'temporal' | 'relational' | 'mentions' | 'prerequisite';
    label?: string;
}

export interface GraphModel {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export type GraphViewScope = 'legacy' | 'archive';
export type UnifiedGraphScope = GraphViewScope | 'combined';

type FetchGraphModelOptions = {
    includeStaticFallback?: boolean;
};

type DatabaseTopic = {
    id: string;
    slug?: string | null;
    title?: string | null;
    content?: string | null;
};

type OntologyPaperRow = {
    id: string;
    graph_node_id?: string | null;
    title: string;
    authors?: unknown;
    year?: number | null;
    venue?: string | null;
    abstract?: string | null;
    abstract_summary?: string | null;
    field_tags?: unknown;
    topic_tags?: unknown;
    section_structure?: unknown;
    source_file_reference?: unknown;
    citation_list?: unknown;
    metadata?: Record<string, unknown> | null;
};

type OntologyNodeRow = {
    id: string;
    type: string;
    label: string;
    summary?: string | null;
    paper_id?: string | null;
    global_concept_id?: string | null;
    equation_latex?: string | null;
    source_location?: unknown;
    confidence?: number | null;
    tags?: unknown;
    metadata?: Record<string, unknown> | null;
};

type OntologyEdgeRow = {
    id: string;
    source: string;
    target: string;
    type: string;
    scope?: string | null;
    paper_id?: string | null;
    source_paper_id?: string | null;
    target_paper_id?: string | null;
    explanation: string;
    evidence?: unknown;
    confidence?: number | null;
    metadata?: Record<string, unknown> | null;
};

function decodeHtmlText(value: string) {
    const withoutTags = value.replace(/<[^>]+>/g, ' ');
    if (typeof document === 'undefined') {
        return withoutTags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = withoutTags;
    return textarea.value.replace(/\s+/g, ' ').trim();
}

function slugifySectionId(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        || 'section';
}

function extractSectionHeadingsFromContent(
    content: string | null | undefined,
    topicLabel: string,
) {
    const sourceContent = content || '';
    const headings: Array<{
        title: string;
        level: number;
        bodyHtml: string;
    }> = [];
    const headingMatches: Array<{
        title: string;
        level: number;
        startIndex: number;
        contentStartIndex: number;
        isInitialTitleHeading: boolean;
    }> = [];
    const normalizedTopicLabel = normalizeInlineBacklinkTarget(topicLabel)?.toLowerCase() || '';
    const headingPattern = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
    let match: RegExpExecArray | null;
    let headingIndex = 0;

    while ((match = headingPattern.exec(sourceContent)) !== null) {
        const level = Number(match[1]);
        const title = decodeHtmlText(match[2]);
        const normalizedTitle = normalizeInlineBacklinkTarget(title)?.toLowerCase() || '';
        if (!title) continue;

        const isInitialTitleHeading =
            headingIndex === 0 &&
            level === 1 &&
            (
                normalizedTitle.length > 0 &&
                normalizedTitle === normalizedTopicLabel
                    ? true
                    : sourceContent.slice(0, match.index).replace(/<[^>]*>/g, ' ').trim().length === 0
            );

        headingIndex += 1;
        headingMatches.push({
            title,
            level,
            startIndex: match.index,
            contentStartIndex: headingPattern.lastIndex,
            isInitialTitleHeading,
        });
    }

    headingMatches.forEach((heading, index) => {
        if (heading.isInitialTitleHeading) return;

        const nextHeading = headingMatches[index + 1];
        headings.push({
            title: heading.title,
            level: heading.level,
            bodyHtml: sourceContent.slice(
                heading.contentStartIndex,
                nextHeading ? nextHeading.startIndex : sourceContent.length,
            ),
        });
    });

    return headings;
}

function buildSectionId(topicId: string, title: string, index: number) {
    return `${topicId}::section::${index + 1}-${slugifySectionId(title)}`;
}

const hierarchyOverrideSpecs = [
    {
        source: 'planck-quantization',
        targets: ['density-of-state', 'density-of-states', 'Density of State'],
        label: 'prerequisite',
    },
    {
        source: 'planck-quantization',
        targets: ['perfect-conductor', 'Perfect Conductor', 'perfect conductor'],
        label: 'prerequisite',
    },
] as const;

function normalizeLookupKey(value: string | null | undefined) {
    return normalizeInlineBacklinkTarget(value)?.toLowerCase() || null;
}

function appendHierarchyOverrideEdges(
    resolveNodeId: (lookupValue: string) => string | null,
    edges: GraphEdge[],
) {
    hierarchyOverrideSpecs.forEach(({ source, targets, label }) => {
        const sourceId = resolveNodeId(source);
        if (!sourceId) return;

        targets.forEach((target) => {
            const targetId = resolveNodeId(target);
            if (!targetId || targetId === sourceId) return;

            edges.push({
                source: sourceId,
                target: targetId,
                type: 'prerequisite',
                label,
            });
        });
    });
}

function parseGraphViewScope(value: unknown): GraphViewScope | null {
    if (typeof value !== 'string') return null;

    const normalized = value.trim().toLowerCase();
    if (normalized === 'archive') {
        return 'archive';
    }
    if (normalized === 'legacy') {
        return 'legacy';
    }

    return null;
}

export function normalizeGraphViewScope(value: string | null | undefined): GraphViewScope {
    return parseGraphViewScope(value) ?? 'legacy';
}

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

function mapDatabaseEdgeLabelToType(label: string | null | undefined): GraphEdge['type'] {
    if (label === 'hierarchy') return 'hierarchy';
    if (label === 'temporal') return 'temporal';
    if (label === 'mentions') return 'mentions';
    if (label === 'prerequisite' || label === 'prereq') return 'prerequisite';
    return 'relational';
}

function annotateNodeScope(node: GraphNode, scope: UnifiedGraphScope): GraphNode {
    return {
        ...node,
        data: {
            ...(node.data || {}),
            graphScope: scope,
        },
    };
}

function annotateModelScope(model: GraphModel, scope: GraphViewScope): GraphModel {
    return {
        nodes: model.nodes.map((node) => annotateNodeScope(node, scope)),
        edges: model.edges.map((edge) => ({ ...edge })),
    };
}

function mergeGraphModels(
    models: Array<{ scope: GraphViewScope; model: GraphModel }>,
): GraphModel {
    const nodeMap = new Map<string, GraphNode>();
    const edgeMap = new Map<string, GraphEdge>();

    models.forEach(({ scope, model }) => {
        model.nodes.forEach((rawNode) => {
            const node = annotateNodeScope(rawNode, scope);
            const existing = nodeMap.get(node.id);
            if (!existing) {
                nodeMap.set(node.id, node);
                return;
            }

            nodeMap.set(node.id, {
                ...existing,
                ...node,
                color: existing.color || node.color,
                description: existing.description || node.description,
                slug: existing.slug || node.slug,
                x: typeof existing.x === 'number' ? existing.x : node.x,
                y: typeof existing.y === 'number' ? existing.y : node.y,
                data: {
                    ...(existing.data || {}),
                    ...(node.data || {}),
                    graphScope: 'combined',
                },
            });
        });

        model.edges.forEach((edge) => {
            const key = `${edge.source}|${edge.target}|${edge.type || edge.label || 'relational'}`;
            if (!edgeMap.has(key)) {
                edgeMap.set(key, { ...edge });
            }
        });
    });

    return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
    };
}

async function attachOntologyPayloads(model: GraphModel): Promise<GraphModel> {
    try {
        const [
            { data: papers, error: paperError },
            { data: nodes, error: nodeError },
            { data: edges, error: edgeError },
        ] = await Promise.all([
            supabase.from('ontology_papers').select('*'),
            supabase.from('ontology_nodes').select('*'),
            supabase.from('ontology_edges').select('*'),
        ]);

        if (paperError) throw paperError;
        if (nodeError) throw nodeError;
        if (edgeError) throw edgeError;

        const papersByGraphNodeId = new Map<string, OntologyPaperRow[]>();
        ((papers || []) as OntologyPaperRow[]).forEach((paper) => {
            if (!paper.graph_node_id) return;
            const list = papersByGraphNodeId.get(paper.graph_node_id) || [];
            list.push(paper);
            papersByGraphNodeId.set(paper.graph_node_id, list);
        });

        if (papersByGraphNodeId.size === 0) {
            return model;
        }

        const nodesByPaperId = new Map<string, OntologyNodeRow[]>();
        ((nodes || []) as OntologyNodeRow[]).forEach((node) => {
            if (!node.paper_id) return;
            const list = nodesByPaperId.get(node.paper_id) || [];
            list.push(node);
            nodesByPaperId.set(node.paper_id, list);
        });

        const edgesByPaperId = new Map<string, OntologyEdgeRow[]>();
        ((edges || []) as OntologyEdgeRow[]).forEach((edge) => {
            const paperId = edge.paper_id || edge.source_paper_id || edge.target_paper_id;
            if (!paperId) return;
            const list = edgesByPaperId.get(paperId) || [];
            list.push(edge);
            edgesByPaperId.set(paperId, list);
        });

        return {
            nodes: model.nodes.map((node) => {
                const ontologyPapers = papersByGraphNodeId.get(node.id);
                if (!ontologyPapers || ontologyPapers.length === 0) {
                    return node;
                }

                const ontologyPayloads = ontologyPapers.map((paper) => ({
                    paper,
                    nodes: nodesByPaperId.get(paper.id) || [],
                    edges: edgesByPaperId.get(paper.id) || [],
                }));

                return {
                    ...node,
                    data: {
                        ...(node.data || {}),
                        ontology: ontologyPayloads[0],
                        ontologies: ontologyPayloads,
                    },
                };
            }),
            edges: model.edges,
        };
    } catch (error) {
        console.warn('attachOntologyPayloads: ontology tables unavailable, using graph model without DB ontology.', error);
        return model;
    }
}

export const buildStaticGraphModel = (scope: GraphViewScope = 'legacy'): GraphModel => {
    if (scope === 'archive') {
        return annotateModelScope(buildArchiveFundamentalsGraphModel(), scope);
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const fieldClusterOverrides: Partial<Record<string, GraphNode>> = {
    };
    const sectionNodes: GraphNode[] = [];
    const sectionEdges: GraphEdge[] = [];

    const rootSphere = getDefaultGraphSphereConfig('root');
    nodes.push({
        id: 'root',
        type: 'root',
        label: rootSphere?.label || 'PHYSICS',
        color: '#ffffff',
        data: rootSphere ? createGraphSphereNodeData(rootSphere) : undefined,
    });

    FIELDS.forEach((field) => {
        const fieldSphere = getDefaultGraphSphereConfig(field.id);
        nodes.push({
            id: field.id,
            type: 'field',
            label: fieldSphere?.label || field.name,
            color: field.color,
            description: field.description,
            data: fieldSphere
                ? createGraphSphereNodeData(fieldSphere)
                : { fieldId: field.id },
        });

        edges.push({ source: 'root', target: field.id, type: 'hierarchy', label: 'hierarchy' });

        const clusterOverride = fieldClusterOverrides[field.id];
        const topicParentId = clusterOverride?.id || field.id;

        if (clusterOverride) {
            nodes.push({
                ...clusterOverride,
                color: field.color,
                data: {
                    ...(clusterOverride.data || {}),
                    fieldId: field.id,
                },
            });

            edges.push({
                source: field.id,
                target: clusterOverride.id,
                type: 'hierarchy',
                label: 'hierarchy',
            });
        }

        const fieldTopics = TIMELINE_TOPICS
            .filter((topic) => topic.fieldId === field.id)
            .filter(() => scope === 'legacy')
            .sort((left, right) => parseInt(left.year) - parseInt(right.year));

        fieldTopics.forEach((topic, index) => {
            nodes.push({
                id: topic.id,
                type: 'topic',
                label: topic.title,
                slug: topic.slug,
                description: topic.year,
                data: {
                    year: parseInt(topic.year) || null,
                    fieldId: field.id,
                    clusterId: clusterOverride?.id || null,
                },
            });

            edges.push({ source: topicParentId, target: topic.id, type: 'hierarchy', label: 'hierarchy' });

            if (index > 0) {
                edges.push({
                    source: fieldTopics[index - 1].id,
                    target: topic.id,
                    type: 'temporal',
                    label: 'temporal',
                });
            }
        });
    });

    TIMELINE_TOPICS.forEach((topic) => {
        const content =
            TOPIC_CONTENT_OVERRIDES[topic.slug] ||
            TOPIC_CONTENT_OVERRIDES[topic.title] ||
            topic.content ||
            '';

        if (typeof content !== 'string' || content.trim().length === 0) {
            return;
        }

        const sections = extractSectionHeadingsFromContent(content, topic.title);
        if (sections.length === 0) {
            return;
        }

        sections.forEach((section, sectionIndex) => {
            const sectionId = buildSectionId(topic.id, section.title, sectionIndex);
            sectionNodes.push({
                id: sectionId,
                type: 'section',
                label: section.title,
                description: `Section heading level ${section.level}`,
                data: {
                    parentTopicId: topic.id,
                    sectionIndex,
                    headingLevel: section.level,
                },
            });

            sectionEdges.push({
                source: topic.id,
                target: sectionId,
                type: 'hierarchy',
                label: 'hierarchy',
            });
        });
    });

    nodes.push(...sectionNodes);
    edges.push(...sectionEdges);

    const staticNodeIdByLookupKey = new Map<string, string>();
    const registerStaticLookup = (lookupValue: string | null | undefined, nodeId: string) => {
        const normalized = normalizeLookupKey(lookupValue);
        if (!normalized) return;

        if (!staticNodeIdByLookupKey.has(normalized)) {
            staticNodeIdByLookupKey.set(normalized, nodeId);
        }
    };

    nodes.forEach((node) => {
        registerStaticLookup(node.id, node.id);
        registerStaticLookup(node.label, node.id);
        registerStaticLookup(node.slug, node.id);
    });

    appendHierarchyOverrideEdges(
        (lookupValue) => staticNodeIdByLookupKey.get(normalizeLookupKey(lookupValue) || '') || null,
        edges,
    );

    return annotateModelScope({ nodes, edges }, scope);
};

export const fetchGraphModel = async (
    scope: GraphViewScope = 'legacy',
    options: FetchGraphModelOptions = {},
): Promise<GraphModel> => {
    const { includeStaticFallback = true } = options;

    try {
        const { topicTable, graphNodeTable, graphEdgeTable } = getScopedTableNames(scope);
        const [
            { data: dbNodes, error: nodeError },
            { data: dbEdges, error: edgeError },
            { data: dbTopics, error: topicError },
        ] = await Promise.all([
            supabase.from(graphNodeTable).select('*'),
            supabase.from(graphEdgeTable).select('*'),
            supabase.from(topicTable).select('id, slug, title, content'),
        ]);

        if (nodeError) throw nodeError;
        if (edgeError) throw edgeError;
        if (topicError) throw topicError;

        const staticModel = buildStaticGraphModel(scope);
        if ((!dbNodes || dbNodes.length === 0) && (!dbEdges || dbEdges.length === 0)) {
            return attachOntologyPayloads(includeStaticFallback ? staticModel : { nodes: [], edges: [] });
        }

        const dynamicNodes: GraphNode[] = (dbNodes || []).map((node) => ({
            id: node.id,
            type: node.type as GraphNode['type'],
            label: node.label,
            x: node.x,
            y: node.y,
            data: node.data,
            slug: node.data?.slug,
            description: node.data?.description,
        }));

        const dynamicEdges: GraphEdge[] = (dbEdges || []).map((edge) => ({
            source: edge.source,
            target: edge.target,
            label: edge.label || 'relational',
            type: mapDatabaseEdgeLabelToType(edge.label),
        }));

        const nodeMap = new Map<string, GraphNode>();
        staticModel.nodes.forEach((node) => nodeMap.set(node.id, node));

        dynamicNodes.forEach((node) => {
            const staticNode = nodeMap.get(node.id);
            if (staticNode) {
                node.data = { ...staticNode.data, ...(node.data || {}) };
                if (!node.slug) node.slug = staticNode.slug;
                if (!node.description) node.description = staticNode.description;
                if (!node.label) node.label = staticNode.label;
                if (!node.color) node.color = staticNode.color;
            }

            nodeMap.set(node.id, node);
        });

        const sectionHierarchyEdges: GraphEdge[] = [];
        const sectionContentById = new Map<string, string>();
        const addSectionNodesForTopic = (
            topicId: string,
            content: string | null | undefined,
        ) => {
            const topicNode = nodeMap.get(topicId);
            if (!topicNode || topicNode.type !== 'topic') return;

            extractSectionHeadingsFromContent(content, topicNode.label).forEach((section, index) => {
                const sectionId = buildSectionId(topicId, section.title, index);
                sectionContentById.set(sectionId, section.bodyHtml);
                nodeMap.set(sectionId, {
                    id: sectionId,
                    type: 'section',
                    label: section.title,
                    data: {
                        ...(topicNode.data || {}),
                        fieldId: typeof topicNode.data?.fieldId === 'string' ? topicNode.data.fieldId : null,
                        parentTopicId: topicId,
                        sectionIndex: index,
                        headingLevel: section.level,
                    },
                });
                sectionHierarchyEdges.push({
                    source: topicId,
                    target: sectionId,
                    type: 'hierarchy',
                    label: 'hierarchy',
                });
            });
        };

        const getTopicContentForGraph = (topic: DatabaseTopic) => {
            const staticTopic = TIMELINE_TOPICS.find((candidate) => candidate.id === topic.id);
            const normalizedSlug = topic.slug ? normalizeTopicSlug(topic.slug) : null;
            const normalizedTitle = topic.title ? normalizeTopicSlug(topic.title) : null;
            return (
                (normalizedSlug ? TOPIC_CONTENT_OVERRIDES[normalizedSlug] : undefined)
                ?? (normalizedTitle ? TOPIC_CONTENT_OVERRIDES[normalizedTitle] : undefined)
                ?? (staticTopic ? TOPIC_CONTENT_OVERRIDES[staticTopic.slug] : undefined)
                ?? topic.content
            );
        };

        const dbTopicIdsWithContent = new Set(
            ((dbTopics || []) as DatabaseTopic[])
                .filter((topic) => {
                    const content = getTopicContentForGraph(topic);
                    return typeof content === 'string' && content.trim().length > 0;
                })
                .map((topic) => topic.id),
        );

        if (scope === 'legacy') {
            TIMELINE_TOPICS.forEach((topic) => {
                if (dbTopicIdsWithContent.has(topic.id)) {
                    return;
                }

                addSectionNodesForTopic(topic.id, topic.content);
            });
        }

        ((dbTopics || []) as DatabaseTopic[]).forEach((topic) => {
            addSectionNodesForTopic(topic.id, getTopicContentForGraph(topic));
        });

        const nodeIdByLookupKey = new Map<string, string>();
        const registerLookupKey = (lookupValue: string | null | undefined, nodeId: string) => {
            const normalized = normalizeLookupKey(lookupValue);
            if (!normalized) return;

            if (!nodeIdByLookupKey.has(normalized)) {
                nodeIdByLookupKey.set(normalized, nodeId);
            }
        };

        nodeMap.forEach((node) => {
            registerLookupKey(node.id, node.id);
            registerLookupKey(node.label, node.id);
            registerLookupKey(node.slug, node.id);

            const slugFromData =
                typeof node.data?.slug === 'string' ? (node.data.slug as string) : null;
            registerLookupKey(slugFromData, node.id);
        });

        const inferredHierarchyEdges: GraphEdge[] = [];
        appendHierarchyOverrideEdges(
            (lookupValue) => nodeIdByLookupKey.get(normalizeLookupKey(lookupValue) || '') || null,
            inferredHierarchyEdges,
        );

        const topicSourcesWithInlineBacklinks = new Set<string>();
        const inlineBacklinkEdges: GraphEdge[] = [];
        const sectionBacklinkEdges: GraphEdge[] = [];

        ((dbTopics || []) as DatabaseTopic[]).forEach((topic) => {
            if (!nodeMap.has(topic.id)) {
                return;
            }

            const inlineBacklinks = extractInlineBacklinksFromContent(getTopicContentForGraph(topic) || '');
            if (inlineBacklinks.length === 0) {
                return;
            }

            const resolvedTargetIds = inlineBacklinks
                .map((backlink) => nodeIdByLookupKey.get(backlink.targetText.toLowerCase()) || null)
                .filter((targetId): targetId is string => Boolean(targetId));

            if (resolvedTargetIds.length === 0) {
                return;
            }

            topicSourcesWithInlineBacklinks.add(topic.id);
            inlineBacklinkEdges.push(
                ...backlinksToResolvedEdges(topic.id, resolvedTargetIds).map((edge) => ({
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    type: edge.type,
                })),
            );
        });

        sectionContentById.forEach((sectionContent, sectionId) => {
            if (!nodeMap.has(sectionId)) {
                return;
            }

            const inlineBacklinks = extractInlineBacklinksFromContent(sectionContent);
            if (inlineBacklinks.length === 0) {
                return;
            }

            const resolvedTargetIds = inlineBacklinks
                .map((backlink) => nodeIdByLookupKey.get(backlink.targetText.toLowerCase()) || null)
                .filter((targetId): targetId is string => Boolean(targetId));

            sectionBacklinkEdges.push(
                ...backlinksToResolvedEdges(sectionId, resolvedTargetIds).map((edge) => ({
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    type: edge.type,
                })),
            );
        });

        const filteredLegacyEdges = dynamicEdges.filter((edge) => {
            if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return false;

            if (!topicSourcesWithInlineBacklinks.has(edge.source)) {
                return true;
            }

            return edge.type === 'hierarchy' || edge.type === 'temporal' || edge.type === 'prerequisite';
        });

        const uniqueEdges = new Map<string, GraphEdge>();

        [
            ...staticModel.edges,
            ...filteredLegacyEdges,
            ...sectionHierarchyEdges,
            ...inlineBacklinkEdges,
            ...sectionBacklinkEdges,
            ...inferredHierarchyEdges,
        ].forEach((edge) => {
            if (!edge.source || !edge.target || edge.source === edge.target) {
                return;
            }

            const key = `${edge.source}|${edge.target}|${edge.type || 'relational'}`;
            uniqueEdges.set(key, edge);
        });

        return attachOntologyPayloads(annotateModelScope({
            nodes: Array.from(nodeMap.values()),
            edges: Array.from(uniqueEdges.values()),
        }, scope));
    } catch (error) {
        console.warn('fetchGraphModel: Failed fetching from Supabase. Returning static model natively.', error);
        return attachOntologyPayloads(includeStaticFallback ? buildStaticGraphModel(scope) : { nodes: [], edges: [] });
    }
};

export const fetchUnifiedGraphModel = async (): Promise<GraphModel> => {
    const legacyModel = await fetchGraphModel('legacy');

    try {
        const isArchiveReady = await checkArchiveSchemaReady();
        if (!isArchiveReady) {
            return legacyModel;
        }
    } catch (error) {
        console.warn('fetchUnifiedGraphModel: Archive schema unavailable, using legacy graph only.', error);
        return legacyModel;
    }

    const archiveModel = await fetchGraphModel('archive', { includeStaticFallback: false });
    if (archiveModel.nodes.length === 0 && archiveModel.edges.length === 0) {
        return legacyModel;
    }

    return mergeGraphModels([
        { scope: 'legacy', model: legacyModel },
        { scope: 'archive', model: archiveModel },
    ]);
};
