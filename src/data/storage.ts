import { supabase } from '../lib/supabase';
import { TIMELINE_TOPICS as SEED_TOPICS, KEYWORD_SECTIONS } from './seed';
import { conceptAPI } from '../lib/concepts';
import type { GraphNode } from '../lib/graphModel';
import {
    appendInlineBacklinksToContent,
    createInlineBacklinkMarkup,
    extractInlineBacklinksFromContent,
    extractLegacyBacklinksFromContent,
    normalizeInlineBacklinkTarget,
    type LegacyBacklinkEntry,
} from '../lib/backlinks';
import {
    ARCHIVE_SCHEMA_SETUP_MESSAGE,
    checkArchiveSchemaReady,
    isArchiveSchemaMissingError,
} from '../lib/archiveSchema';
import type { GraphViewScope } from '../lib/graphModel';
import {
    createGraphSphereNodeData,
    getDefaultGraphSphereConfigs,
    type GraphSphereConfig,
} from '../lib/graphSpheres';
import { normalizeTopicSlug } from '../lib/topicSlug';
import {
    getArchiveFundamentalsTopicById,
    getArchiveFundamentalsTopicBySlug,
    getArchiveFundamentalsTopicsByField,
} from './archiveFundamentals';
import { TOPIC_CONTENT_OVERRIDES } from './topicContentOverrides';

const buildSeedTopicRecord = (seedTopic: typeof SEED_TOPICS[number]): Topic => ({
    id: seedTopic.id,
    field_id: seedTopic.fieldId,
    year: seedTopic.year,
    title: seedTopic.title,
    slug: seedTopic.slug,
    summary: seedTopic.summary,
    tags: seedTopic.tags,
    content: seedTopic.content,
});

const hasMeaningfulText = (value: string | null | undefined) =>
    typeof value === 'string' && value.trim().length > 0;

const getSeedTopicImageUrl = (slug: string) =>
    slug === 'quantum-mechanics' ? '/images/schrodinger.png' :
        slug === 'classical-mechanics' ? '/images/newton.png' :
            slug === 'statistical-mechanics' ? '/images/boltzmann.png' :
                slug === 'electrodynamics' ? '/images/maxwell.png' : undefined;

const mergeTopicWithSeed = (topic: Topic, seedTopic?: typeof SEED_TOPICS[number] | null): Topic => {
    if (!seedTopic) return applyTopicContentOverride(topic);
    const contentOverride = TOPIC_CONTENT_OVERRIDES[topic.slug] ?? TOPIC_CONTENT_OVERRIDES[seedTopic.slug];

    return applyTopicContentOverride({
        ...buildSeedTopicRecord(seedTopic),
        ...topic,
        summary: hasMeaningfulText(topic.summary) ? topic.summary : seedTopic.summary,
        content: contentOverride ?? (hasMeaningfulText(topic.content) ? topic.content : seedTopic.content),
        tags: Array.isArray(topic.tags) && topic.tags.length > 0 ? topic.tags : seedTopic.tags,
        image_url: topic.image_url || getSeedTopicImageUrl(seedTopic.slug),
    });
};

const getTopicContentOverride = (topic: Pick<Topic, 'slug' | 'title'>) => {
    const normalizedSlug = normalizeTopicSlug(topic.slug);
    const normalizedTitle = normalizeTopicSlug(topic.title);

    return (
        (normalizedSlug ? TOPIC_CONTENT_OVERRIDES[normalizedSlug] : undefined)
        ?? (normalizedTitle ? TOPIC_CONTENT_OVERRIDES[normalizedTitle] : undefined)
    );
};

const applyTopicContentOverride = (topic: Topic): Topic => {
    const contentOverride = getTopicContentOverride(topic);
    return contentOverride ? { ...topic, content: contentOverride } : topic;
};

const toLegacyBacklinkEntries = (
    edges: Array<{ target: string; label?: string | null }>,
) =>
    Array.from(
        new Map(
            edges
                .map((edge) => ({
                    targetId: edge.target,
                    label: edge.label || 'mentions',
                }))
                .filter((edge) => edge.targetId.trim().length > 0)
                .map((edge) => [`${edge.targetId}|${edge.label}`, edge] as const),
        ).values(),
    );

function getScopedTableNames(scope: GraphViewScope = 'legacy') {
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

function shouldUseSeedFallback(scope: GraphViewScope = 'legacy') {
    return scope === 'legacy';
}

function shouldUseArchiveFallback(scope: GraphViewScope = 'legacy') {
    return scope === 'archive';
}

async function ensureScopeSchemaReady(scope: GraphViewScope) {
    if (scope !== 'archive') {
        return { error: null };
    }

    try {
        const ready = await checkArchiveSchemaReady();
        if (ready) {
            return { error: null };
        }

        return { error: new Error(ARCHIVE_SCHEMA_SETUP_MESSAGE) };
    } catch (error) {
        if (isArchiveSchemaMissingError(error)) {
            return { error: new Error(ARCHIVE_SCHEMA_SETUP_MESSAGE) };
        }

        return {
            error: error instanceof Error ? error : new Error('Unknown error'),
        };
    }
}

export interface Question {
    id: string;
    topic_id: string; // Changed from topicId to match DB snake_case
    title: string;
    body: string;
    nickname: string;
    created_at: string; // Changed from number to string (ISO data)
    status: 'open' | 'answered';
}

export const storage = {
    getQuestions: async (topicId: string): Promise<Question[]> => {
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching questions:', error);
                return [];
            }

            return data as Question[];
        } catch (e) {
            console.error("Failed to load questions", e);
            return [];
        }
    },

    addQuestion: async (question: Omit<Question, 'id' | 'created_at' | 'status'>): Promise<{ data: Question | null; error: Error | null }> => {
        try {
            const { data, error } = await supabase
                .from('questions')
                .insert([{
                    topic_id: question.topic_id,
                    title: question.title,
                    body: question.body,
                    nickname: question.nickname
                }])
                .select()
                .single();

            if (error) {
                console.error('Supabase Error adding question:', error);
                return { data: null, error: new Error(error.message) };
            }

            return { data: data as Question, error: null };
            return { data: data as Question, error: null };
        } catch (e) {
            console.error("Exception saving question:", e);
            return { data: null, error: e instanceof Error ? e : new Error('Unknown error occurred') };
        }
    },

    getSectionById: async (id: string): Promise<TopicSection | null> => {
        try {
            const { data, error } = await supabase
                .from('topic_sections')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return null;
            return data as TopicSection;
        } catch {
            return null;
        }
    },

    getSectionsByTopic: async (topicId: string): Promise<TopicSection[]> => {
        try {
            const { data } = await supabase
                .from('topic_sections')
                .select('*')
                .eq('topic_id', topicId)
                .order('order_index', { ascending: true });

            const dbSections = data || [];
            if (dbSections.length > 0) return dbSections as TopicSection[];

            // Fallback
            const seedSections = KEYWORD_SECTIONS.filter(k => k.topicId === topicId);
            if (seedSections.length > 0) {
                return seedSections.map((s, i) => ({
                    id: s.id,
                    topic_id: s.topicId,
                    title: s.title,
                    content: s.content,
                    order_index: i,
                    updated_at: new Date().toISOString()
                }));
            }
            return [];
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    addSection: async (section: Omit<TopicSection, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: TopicSection | null; error: Error | null }> => {
        try {
            const { data, error } = await supabase
                .from('topic_sections')
                .insert([section])
                .select()
                .single();

            if (error) return { data: null, error: new Error(error.message) };

            // Sync graph edges
            conceptAPI.syncContentEdges(
                { id: data.id, type: 'section', label: data.title },
                data.content
            ).catch(console.error);

            return { data: data as TopicSection, error: null };
        } catch (e) {
            return { data: null, error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    updateSection: async (id: string, updates: { title?: string; content?: string; content_light?: string }): Promise<{ error: Error | null }> => {
        try {
            const { error } = await supabase
                .from('topic_sections')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return { error: new Error(error.message) };

            // Sync graph edges on update
            if (updates.title || updates.content) {
                const { data: section } = await supabase.from('topic_sections').select('*').eq('id', id).single();
                if (section) {
                    conceptAPI.syncContentEdges(
                        { id: section.id, type: 'section', label: section.title },
                        section.content
                    ).catch(console.error);
                }
            }

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    deleteSection: async (id: string): Promise<{ error: Error | null }> => {
        try {
            const { error } = await supabase
                .from('topic_sections')
                .delete()
                .eq('id', id);

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    // Timeline Topics CRUD
    getTopics: async (fieldId: string, scope: GraphViewScope = 'legacy'): Promise<Topic[]> => {
        try {
            const { topicTable } = getScopedTableNames(scope);
            const { data, error } = await supabase
                .from(topicTable)
                .select('*')
                .eq('field_id', fieldId)
                .order('year', { ascending: true });

            if (error) throw error;
            const dbTopics = ((data || []) as Topic[]).map((topic) => (
                shouldUseSeedFallback(scope)
                    ? mergeTopicWithSeed(
                        topic,
                        SEED_TOPICS.find((seedTopic) => seedTopic.slug === topic.slug),
                    )
                    : applyTopicContentOverride(topic)
            ));

            // Merge with Seed Data
            if (!shouldUseSeedFallback(scope)) {
                if (shouldUseArchiveFallback(scope) && dbTopics.length === 0) {
                    return (getArchiveFundamentalsTopicsByField(fieldId) as Topic[]).map(applyTopicContentOverride);
                }

                if (fieldId === 'mathematical-physics') {
                    return dbTopics.sort((a, b) => a.title.localeCompare(b.title));
                }

                return dbTopics.sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
            }

            const dbSlugs = new Set(dbTopics.map(t => t.slug));
            const seedTopics = SEED_TOPICS
                .filter(t => t.fieldId === fieldId)
                .filter(t => !dbSlugs.has(t.slug))
                .map(t => ({
                    ...buildSeedTopicRecord(t),
                    image_url: getSeedTopicImageUrl(t.slug),
                } as Topic));

            const sortedTopics = [...dbTopics, ...seedTopics];

            if (fieldId === 'mathematical-physics') {
                return sortedTopics.sort((a, b) => a.title.localeCompare(b.title));
            } else {
                return sortedTopics.sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
            }
        } catch {
            if (!shouldUseSeedFallback(scope)) {
                return shouldUseArchiveFallback(scope)
                    ? (getArchiveFundamentalsTopicsByField(fieldId) as Topic[]).map(applyTopicContentOverride)
                    : [];
            }

            // Fallback completely to seed
            const seed = SEED_TOPICS
                .filter(t => t.fieldId === fieldId)
                .map(t => ({
                    id: t.id,
                    field_id: t.fieldId,
                    year: t.year,
                    title: t.title,
                    slug: t.slug,
                    summary: t.summary,
                    tags: t.tags,
                } as Topic));

            if (fieldId === 'mathematical-physics') {
                return seed.sort((a, b) => a.title.localeCompare(b.title));
            }
            return seed.sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
        }
    },

    getTopic: async (id: string, scope: GraphViewScope = 'legacy'): Promise<Topic | null> => {
        try {
            const { topicTable } = getScopedTableNames(scope);
            const { data } = await supabase.from(topicTable).select('*').eq('id', id).single();
            if (data) {
                return shouldUseSeedFallback(scope)
                    ? mergeTopicWithSeed(
                        data as Topic,
                        SEED_TOPICS.find((topic) => topic.id === id),
                    )
                    : applyTopicContentOverride(data as Topic);
            }
        } catch { /* ignore */ }

        if (!shouldUseSeedFallback(scope)) {
            return shouldUseArchiveFallback(scope)
                ? ((topic) => topic ? applyTopicContentOverride(topic as Topic) : null)(getArchiveFundamentalsTopicById(id) as Topic | null)
                : null;
        }

        const seed = SEED_TOPICS.find(t => t.id === id);
        if (seed) {
            return applyTopicContentOverride({
                id: seed.id,
                field_id: seed.fieldId,
                year: seed.year,
                title: seed.title,
                slug: seed.slug,
                summary: seed.summary,
                tags: seed.tags,
            } as Topic);
        }
        return null;
    },

    getTopicBySlug: async (slug: string, scope: GraphViewScope = 'legacy'): Promise<Topic | null> => {
        const normalizedSlug = normalizeTopicSlug(slug);
        if (!normalizedSlug) return null;

        try {
            const { topicTable } = getScopedTableNames(scope);
            const { data } = await supabase.from(topicTable).select('*').eq('slug', normalizedSlug).single();
            if (data) {
                return shouldUseSeedFallback(scope)
                    ? mergeTopicWithSeed(
                        data as Topic,
                        SEED_TOPICS.find((topic) => topic.slug === normalizedSlug),
                    )
                    : applyTopicContentOverride(data as Topic);
            }
        } catch { /* ignore */ }

        if (!shouldUseSeedFallback(scope)) {
            return shouldUseArchiveFallback(scope)
                ? ((topic) => topic ? applyTopicContentOverride(topic as Topic) : null)(getArchiveFundamentalsTopicBySlug(normalizedSlug) as Topic | null)
                : null;
        }

        const seed = SEED_TOPICS.find(t => t.slug === normalizedSlug);
        if (seed) {
            return applyTopicContentOverride({
                id: seed.id,
                field_id: seed.fieldId,
                year: seed.year,
                title: seed.title,
                slug: seed.slug,
                summary: seed.summary,
                tags: seed.tags,
            } as Topic);
        }
        return null;
    },

    addTopic: async (
        topic: Omit<Topic, 'id'>,
        scope: GraphViewScope = 'legacy',
    ): Promise<{ data: Topic | null; error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { data: null, error: schemaCheck.error };
            }

            const { topicTable } = getScopedTableNames(scope);
            const { data, error } = await supabase
                .from(topicTable)
                .insert([{
                    id: crypto.randomUUID(),
                    field_id: topic.field_id,
                    year: topic.year,
                    title: topic.title,
                    slug: topic.slug,
                    summary: topic.summary,
                    tags: topic.tags,
                    image_url: topic.image_url,
                    content: topic.content
                }])
                .select()
                .single();

            if (error) return { data: null, error: new Error(error.message) };

            // Auto-promote concept if exists
            conceptAPI.promoteToTopic(
                topic.title,
                topic.slug,
                scope,
            ).catch(console.error);

            // Sync graph node for topic
            conceptAPI.syncContentEdges(
                { id: data.id, type: 'topic', label: topic.title, fieldId: topic.field_id },
                topic.summary || '',
                scope,
            ).catch(console.error);

            return { data: data as Topic, error: null };
        } catch (e) {
            return { data: null, error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    addGraphNode: async (
        node: {
            id: string;
            type: GraphNode['type'];
            label: string;
            data?: Record<string, unknown>;
            x?: number;
            y?: number;
        },
        scope: GraphViewScope = 'legacy',
    ): Promise<{ data: GraphNode | null; error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { data: null, error: schemaCheck.error };
            }

            const { graphNodeTable } = getScopedTableNames(scope);
            const { data, error } = await supabase
                .from(graphNodeTable)
                .upsert(
                    {
                        id: node.id,
                        type: node.type,
                        label: node.label,
                        x: typeof node.x === 'number' ? node.x : 0,
                        y: typeof node.y === 'number' ? node.y : 0,
                        data: node.data || {},
                    },
                    { onConflict: 'id' },
                )
                .select()
                .single();

            if (error) return { data: null, error: new Error(error.message) };
            return { data: data as GraphNode, error: null };
        } catch (e) {
            return { data: null, error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    addHierarchyEdge: async (
        source: string,
        target: string,
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { graphEdgeTable } = getScopedTableNames(scope);
            const { error } = await supabase
                .from(graphEdgeTable)
                .upsert(
                    {
                        source,
                        target,
                        label: 'hierarchy',
                    },
                    { onConflict: 'source,target,label', ignoreDuplicates: true },
                );

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    updateTopic: async (
        id: string,
        updates: Partial<Topic>,
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { topicTable } = getScopedTableNames(scope);
            const baseTopic = await storage.getTopic(id, scope);
            if (!baseTopic) {
                const seedTopic = SEED_TOPICS.find((topic) => topic.id === id);
                if (!seedTopic || !shouldUseSeedFallback(scope)) {
                    return { error: new Error('Topic not found') };
                }
            }

            const fallbackSeedTopic =
                shouldUseSeedFallback(scope) ? SEED_TOPICS.find((topic) => topic.id === id) : null;
            const mergedTopic = {
                ...(baseTopic || (fallbackSeedTopic ? buildSeedTopicRecord(fallbackSeedTopic) : null)),
                ...updates,
                id,
                tags: updates.tags ?? baseTopic?.tags ?? fallbackSeedTopic?.tags ?? [],
            };

            if (!mergedTopic) {
                return { error: new Error('Topic not found') };
            }

            const { data: savedTopic, error } = await supabase
                .from(topicTable)
                .upsert([mergedTopic], { onConflict: 'id' })
                .select()
                .single();

            if (error) return { error: new Error(error.message) };

            // Sync graph edges on update
            if (updates.title || updates.summary || updates.content) {
                if (savedTopic) {
                    conceptAPI.syncContentEdges(
                        { id: savedTopic.id, type: 'topic', label: savedTopic.title, fieldId: savedTopic.field_id },
                        (savedTopic.summary || '') + ' ' + (savedTopic.content || ''),
                        scope,
                    ).catch(console.error);
                }
            }

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    deleteTopic: async (id: string, scope: GraphViewScope = 'legacy'): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { topicTable } = getScopedTableNames(scope);
            const { error } = await supabase
                .from(topicTable)
                .delete()
                .eq('id', id);

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    upsertGraphSphere: async (
        config: GraphSphereConfig,
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { graphNodeTable } = getScopedTableNames(scope);
            const { data: existingNode, error: readError } = await supabase
                .from(graphNodeTable)
                .select('id, x, y, data')
                .eq('id', config.id)
                .maybeSingle();

            if (readError) {
                return { error: new Error(readError.message) };
            }

            const existingData =
                existingNode?.data && typeof existingNode.data === 'object' && !Array.isArray(existingNode.data)
                    ? (existingNode.data as Record<string, unknown>)
                    : {};

            const nextData = {
                ...existingData,
                ...createGraphSphereNodeData(config),
            };

            if (config.nodeType === 'field') {
                const fieldId = config.bindingKey || config.id;
                const normalizedFieldLabel = config.label.replace(/\n+/g, ' ').trim() || fieldId;
                const fieldSlug = normalizeTopicSlug(fieldId) || fieldId;

                const { error: fieldError } = await supabase
                    .from('fields')
                    .upsert(
                        {
                            id: fieldId,
                            slug: fieldSlug,
                            name: normalizedFieldLabel,
                            description: `${normalizedFieldLabel} sphere`,
                            icon: 'circle',
                        },
                        { onConflict: 'id' },
                    );

                if (fieldError) {
                    return { error: new Error(fieldError.message) };
                }
            }

            const { error } = await supabase
                .from(graphNodeTable)
                .upsert(
                    {
                        id: config.id,
                        type: config.nodeType,
                        label: config.label,
                        x: typeof existingNode?.x === 'number' ? existingNode.x : 0,
                        y: typeof existingNode?.y === 'number' ? existingNode.y : 0,
                        data: nextData,
                    },
                    { onConflict: 'id' },
                );

            if (error) {
                return { error: new Error(error.message) };
            }

            if (config.nodeType === 'field') {
                const { graphEdgeTable } = getScopedTableNames(scope);
                const { error: edgeError } = await supabase
                    .from(graphEdgeTable)
                    .upsert(
                        {
                            source: 'root',
                            target: config.id,
                            label: 'hierarchy',
                        },
                        { onConflict: 'source,target,label', ignoreDuplicates: true },
                    );

                if (edgeError) {
                    return { error: new Error(edgeError.message) };
                }
            }

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    initializeDefaultGraphSpheres: async (
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const defaults = getDefaultGraphSphereConfigs();
            for (const config of defaults) {
                const result = await storage.upsertGraphSphere(config, scope);
                if (result.error) {
                    return result;
                }
            }

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    deleteGraphSphere: async (
        id: string,
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { graphNodeTable } = getScopedTableNames(scope);
            const { error } = await supabase
                .from(graphNodeTable)
                .delete()
                .eq('id', id);

            if (error) {
                return { error: new Error(error.message) };
            }

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    uploadFile: async (file: File): Promise<{ url: string | null; error: Error | null }> => {
        try {
            // Validation
            if (!file.type.startsWith('image/')) {
                return { url: null, error: new Error('Only image files are allowed') };
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                return { url: null, error: new Error('File size should be less than 5MB') };
            }

            const fileExt = file.name.split('.').pop();
            // Using UUID for unique filename
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images') // Using 'images' bucket
                .upload(filePath, file);

            if (uploadError) {
                return { url: null, error: new Error(uploadError.message) };
            }

            const { data } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return { url: data.publicUrl, error: null };
        } catch (e) {
            return { url: null, error: e instanceof Error ? e : new Error('Unknown upload error') };
        }
    },

    migrateLegacyEdgesToInlineBacklinks: async (): Promise<{ migratedCount: number; error: Error | null }> => {
        try {
            const { data: topics, error: topicError } = await supabase
                .from('topics')
                .select('id, content');
            if (topicError) throw topicError;

            const { data: edges, error: edgeError } = await supabase
                .from('graph_edges')
                .select('source, target, label');
            if (edgeError) throw edgeError;

            const { data: nodes, error: nodeError } = await supabase
                .from('graph_nodes')
                .select('id, label');
            if (nodeError) throw nodeError;

            const nodeLabelById = new Map<string, string>(
                ((nodes || []) as Array<{ id: string; label: string }>).map((node) => [node.id, node.label]),
            );
            const legacyBacklinksBySource = new Map<string, LegacyBacklinkEntry[]>();

            ((edges || []) as Array<{ source: string; target: string; label?: string | null }>).forEach((edge) => {
                if (edge.label === 'hierarchy' || edge.label === 'temporal') {
                    return;
                }

                const currentEntries = legacyBacklinksBySource.get(edge.source) || [];
                currentEntries.push({
                    targetId: edge.target,
                    label: edge.label || 'mentions',
                });
                legacyBacklinksBySource.set(edge.source, currentEntries);
            });

            let migratedCount = 0;
            for (const topic of (topics || []) as Array<{ id: string; content?: string | null }>) {
                const legacyMetadata = extractLegacyBacklinksFromContent(topic.content || '');
                const graphEdgeBacklinks = legacyBacklinksBySource.get(topic.id) || [];
                const combinedLegacyBacklinks = toLegacyBacklinkEntries([
                    ...graphEdgeBacklinks.map((backlink) => ({
                        target: backlink.targetId,
                        label: backlink.label,
                    })),
                    ...legacyMetadata.backlinks.map((backlink) => ({
                        target: backlink.targetId,
                        label: backlink.label,
                    })),
                ]);

                const inlineBacklinks = extractInlineBacklinksFromContent(legacyMetadata.content);
                const inlineTargetSet = new Set(
                    inlineBacklinks
                        .map((backlink) => normalizeInlineBacklinkTarget(backlink.targetText)?.toLowerCase() || '')
                        .filter(Boolean),
                );

                const missingWikiLinks = combinedLegacyBacklinks
                    .map((backlink) => nodeLabelById.get(backlink.targetId) || backlink.targetId)
                    .map((targetLabel) => normalizeInlineBacklinkTarget(targetLabel))
                    .filter((targetLabel): targetLabel is string => Boolean(targetLabel))
                    .filter((targetLabel) => !inlineTargetSet.has(targetLabel.toLowerCase()))
                    .map((targetLabel) => createInlineBacklinkMarkup(targetLabel))
                    .filter((wikiLink): wikiLink is string => Boolean(wikiLink));

                if (!legacyMetadata.hasMetadata && missingWikiLinks.length === 0) {
                    continue;
                }

                const nextContent = appendInlineBacklinksToContent(legacyMetadata.content, missingWikiLinks);
                const { error: updateError } = await supabase
                    .from('topics')
                    .update({ content: nextContent })
                    .eq('id', topic.id);

                if (updateError) throw updateError;
                migratedCount += 1;
            }

            return { migratedCount, error: null };
        } catch (error) {
            return {
                migratedCount: 0,
                error: error instanceof Error ? error : new Error('Unknown error'),
            };
        }
    },

    // Graph Data
    getGraphData: async (
        scope: GraphViewScope = 'legacy',
    ): Promise<{ nodes: Record<string, unknown>[]; edges: Record<string, unknown>[]; error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { nodes: [], edges: [], error: schemaCheck.error };
            }

            const { graphNodeTable, graphEdgeTable } = getScopedTableNames(scope);
            const { data: nodes, error: nError } = await supabase.from(graphNodeTable).select('*');
            const { data: edges, error: eError } = await supabase.from(graphEdgeTable).select('*');

            if (nError) throw nError;
            if (eError) throw eError;

            return { nodes: nodes || [], edges: edges || [], error: null };
        } catch (e) {
            return { nodes: [], edges: [], error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    syncGraphFromTopics: async (): Promise<{ error: Error | null }> => {
        try {
            // 1. Fetch all fields and topics
            // We need to fetch fields from somewhere. Currently they are static in seed.ts but we should store them in DB 'fields' table?
            // The schema has 'fields' table.

            // For this implementation, we will use the static data from seed.ts as reference for FIELDS because 'fields' table might be empty.
            // But ideally we should use DB data. Let's assume we use the data we can get.

            // Note: In a real app we would read from 'fields' table. For now we will rely on client-side logic to determining structure
            // passing it to this function, OR we just clear and rewrite based on current 'topics' table.

            // To be safe and simple: This function will receive the full graph structure to save?
            // Or it calculates it? Calculating on server (edge function) is best, but client-side calc + bulk insert is easier for now.

            // Let's change this to saveGraphData(nodes, edges).
            return { error: new Error("Not implemented on server. Use saveGraphData.") };
        } catch (e) {
            return { error: e as Error };
        }
    },

    saveGraphData: async (
        nodes: Record<string, unknown>[],
        edges: Record<string, unknown>[],
        scope: GraphViewScope = 'legacy',
    ): Promise<{ error: Error | null }> => {
        try {
            const schemaCheck = await ensureScopeSchemaReady(scope);
            if (schemaCheck.error) {
                return { error: schemaCheck.error };
            }

            const { graphNodeTable, graphEdgeTable } = getScopedTableNames(scope);
            // Transaction-like: Delete all and insert all (Simplest for "Sync")
            // Note: Postgres RLS might block delete all if not admin.

            const { error: d1 } = await supabase.from(graphEdgeTable).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (d1) throw d1;
            const { error: d2 } = await supabase.from(graphNodeTable).delete().neq('id', 'PLACEHOLDER');
            if (d2) throw d2;

            const { error: i1 } = await supabase.from(graphNodeTable).insert(nodes);
            if (i1) throw i1;

            const { error: i2 } = await supabase.from(graphEdgeTable).insert(edges);
            if (i2) throw i2;

            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    // Migration Helper
    migrateSectionsToContent: async (topicId: string): Promise<{ content: string | null; error: Error | null }> => {
        try {
            const sections = await storage.getSectionsByTopic(topicId);
            if (sections.length === 0) return { content: null, error: null };

            const fullContent = sections
                .map(s => `## ${s.title}\n\n${s.content}`)
                .join('\n\n---\n\n');

            // Save to topic
            const { error } = await supabase
                .from('topics')
                .update({ content: fullContent })
                .eq('id', topicId);

            if (error) throw error;
            return { content: fullContent, error: null };
        } catch (e) {
            return { content: null, error: e instanceof Error ? e : new Error('Unknown error') };
        }
    }
};

export interface TopicSection {
    id: string;
    topic_id: string;
    title: string;
    content: string;
    content_light?: string;
    order_index: number;
    updated_at?: string;
}

export interface Topic {
    id: string;
    field_id: string;
    year: string;
    title: string;
    slug: string;
    summary: string;
    tags: string[];
    image_url?: string;
    content?: string;
}
