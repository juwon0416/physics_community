import { supabase } from './supabase';
import type { GraphViewScope } from './graphModel';

export interface Concept {
    id: string;
    label: string;
    type: 'concept';
    data: {
        description?: string;
        slug?: string;
    };
    created_at?: string;
}

type GraphNodeRecord = {
    id: string;
    label: string;
    type: string;
    data?: Record<string, unknown> | null;
    created_at?: string;
};

type ContentEdgeSource = {
    id: string;
    type: 'topic' | 'section';
    label: string;
    fieldId?: string;
};

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

function buildTopicSlug(label: string, fallbackId: string) {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (slug.length >= 2) {
        return slug;
    }

    return `topic-${fallbackId.slice(0, 8)}`;
}

function toNodeData(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return { ...(value as Record<string, unknown>) };
}

export const conceptAPI = {
    async search(query: string, scope: GraphViewScope = 'legacy') {
        const { graphNodeTable } = getScopedTableNames(scope);
        const { data, error } = await supabase
            .from(graphNodeTable)
            .select('*')
            .eq('type', 'concept')
            .ilike('label', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data as Concept[];
    },

    async getByLabel(label: string, scope: GraphViewScope = 'legacy') {
        const { graphNodeTable } = getScopedTableNames(scope);
        const { data, error } = await supabase
            .from(graphNodeTable)
            .select('*')
            .eq('type', 'concept')
            .ilike('label', label)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? (data[0] as Concept) : null;
    },

    async create(label: string, description: string, scope: GraphViewScope = 'legacy') {
        const { graphNodeTable } = getScopedTableNames(scope);
        const existing = await this.getByLabel(label, scope);
        if (existing) return existing;

        const { data, error } = await supabase
            .from(graphNodeTable)
            .insert({
                id: crypto.randomUUID(),
                type: 'concept',
                label,
                x: 0,
                y: 0,
                data: { description },
            })
            .select()
            .single();

        if (error) throw error;
        return data as Concept;
    },

    async connect(
        sourceId: string,
        targetId: string,
        label: string = 'related_to',
        scope: GraphViewScope = 'legacy',
    ) {
        const { graphEdgeTable } = getScopedTableNames(scope);
        const { data, error } = await supabase
            .from(graphEdgeTable)
            .insert({
                source: sourceId,
                target: targetId,
                label,
            })
            .select()
            .single();

        if (error && error.code !== '23505') throw error;
        return data;
    },

    async connectBatch(
        sourceId: string,
        targetIds: string[],
        label: string = 'hierarchy',
        scope: GraphViewScope = 'legacy',
    ) {
        if (targetIds.length === 0) return;

        const { graphEdgeTable } = getScopedTableNames(scope);
        const uniqueTargets = [...new Set(targetIds)].filter((targetId) => targetId !== sourceId);
        if (uniqueTargets.length === 0) return;

        const rows = uniqueTargets.map((targetId) => ({
            source: sourceId,
            target: targetId,
            label,
        }));

        const { error } = await supabase
            .from(graphEdgeTable)
            .upsert(rows, { onConflict: 'source,target,label', ignoreDuplicates: true });

        if (error) throw error;
    },

    async createEdge(
        sourceId: string,
        targetId: string,
        label: string,
        scope: GraphViewScope = 'legacy',
    ) {
        const { graphEdgeTable } = getScopedTableNames(scope);
        const { error } = await supabase
            .from(graphEdgeTable)
            .upsert(
                {
                    source: sourceId,
                    target: targetId,
                    label,
                },
                { onConflict: 'source,target,label', ignoreDuplicates: true },
            );

        if (error) throw error;
    },

    async promoteToTopic(label: string, slug: string, scope: GraphViewScope = 'legacy') {
        const { graphNodeTable } = getScopedTableNames(scope);
        const { data: nodes } = await supabase
            .from(graphNodeTable)
            .select('*')
            .eq('type', 'concept')
            .eq('label', label)
            .limit(1);

        if (!nodes || nodes.length === 0) return;

        const node = nodes[0] as GraphNodeRecord;
        const currentData = toNodeData(node.data);

        const { error } = await supabase
            .from(graphNodeTable)
            .update({
                data: { ...currentData, slug, type: 'topic_link' },
            })
            .eq('id', node.id);

        if (error) {
            console.error('Failed to promote concept:', error);
        }
    },

    async getDetails(id: string, scope: GraphViewScope = 'legacy') {
        const { graphNodeTable, graphEdgeTable } = getScopedTableNames(scope);
        const { data: concept, error: nodeError } = await supabase
            .from(graphNodeTable)
            .select('*')
            .eq('id', id)
            .single();

        if (nodeError) throw nodeError;

        const { data: edges, error: edgeError } = await supabase
            .from(graphEdgeTable)
            .select('*, target_node:target(*)')
            .eq('source', id);

        if (edgeError) throw edgeError;

        return { concept, relations: edges };
    },

    async syncContentEdges(
        source: ContentEdgeSource,
        content: string,
        scope: GraphViewScope = 'legacy',
    ) {
        const { topicTable, graphNodeTable, graphEdgeTable } = getScopedTableNames(scope);
        const regexDouble = /\[\[([\s\S]*?)\]\]/g;
        const regexLink = /\[([\s\S]*?)\]\(\/concept\/[\s\S]*?\)/g;

        const matchesDouble = [...content.matchAll(regexDouble)].map((match) => match[1]);
        const matchesLink = [...content.matchAll(regexLink)].map((match) => match[1]);
        const terms = [...new Set([...matchesDouble, ...matchesLink].map((term) => term.trim()).filter(Boolean))];

        const { data: existingSrc, error: sourceLookupError } = await supabase
            .from(graphNodeTable)
            .select('data')
            .eq('id', source.id)
            .maybeSingle();

        if (sourceLookupError) throw sourceLookupError;

        const mergedSrcData = toNodeData(existingSrc?.data);
        if (source.fieldId) {
            mergedSrcData.fieldId = source.fieldId;
        }

        const { error: sourceUpsertError } = await supabase
            .from(graphNodeTable)
            .upsert({
                id: source.id,
                type: source.type,
                label: source.label,
                data: mergedSrcData,
            });

        if (sourceUpsertError) throw sourceUpsertError;

        const { error: deleteError } = await supabase
            .from(graphEdgeTable)
            .delete()
            .eq('source', source.id)
            .eq('label', 'mentions');

        if (deleteError) throw deleteError;

        if (terms.length === 0) {
            return [];
        }

        const targetIds: string[] = [];

        for (const term of terms) {
            let node = (await this.getByLabel(term, scope)) as GraphNodeRecord | null;

            if (!node) {
                const { data, error } = await supabase
                    .from(graphNodeTable)
                    .select('*')
                    .eq('label', term)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    node = data as GraphNodeRecord;
                }
            }

            if (node && node.type === 'concept') {
                const targetField = 'mathematical-physics';
                const slug = buildTopicSlug(term, node.id);
                const { error: topicUpsertError } = await supabase
                    .from(topicTable)
                    .upsert(
                        {
                            id: node.id,
                            field_id: targetField,
                            title: term,
                            slug,
                            year: '0',
                            summary: 'Auto-promoted concept.',
                            tags: [],
                        },
                        { onConflict: 'id' },
                    );

                if (!topicUpsertError) {
                    const nextNodeData = {
                        ...toNodeData(node.data),
                        fieldId: targetField,
                        slug,
                        year: '0',
                    };

                    const { error: nodeUpdateError } = await supabase
                        .from(graphNodeTable)
                        .update({
                            type: 'topic',
                            data: nextNodeData,
                        })
                        .eq('id', node.id);

                    if (!nodeUpdateError) {
                        node = { ...node, type: 'topic', data: nextNodeData };
                    }
                }
            }

            if (!node) {
                const targetField = 'mathematical-physics';
                const newTopicId = crypto.randomUUID();
                const slug = buildTopicSlug(term, newTopicId);

                const { error: topicInsertError } = await supabase
                    .from(topicTable)
                    .insert({
                        id: newTopicId,
                        field_id: targetField,
                        title: term,
                        slug,
                        year: '0',
                        summary: 'Auto-generated from concept link.',
                        tags: [],
                    });

                if (topicInsertError) {
                    throw topicInsertError;
                }

                const { data: newNode, error: nodeInsertError } = await supabase
                    .from(graphNodeTable)
                    .insert({
                        id: newTopicId,
                        type: 'topic',
                        label: term,
                        data: { fieldId: targetField, slug, year: '0' },
                    })
                    .select()
                    .single();

                if (nodeInsertError) {
                    throw nodeInsertError;
                }

                node = newNode as GraphNodeRecord;
            }

            if (node) {
                targetIds.push(node.id);
            }
        }

        const uniqueTargetIds = [...new Set(targetIds)].filter((targetId) => targetId !== source.id);
        if (uniqueTargetIds.length === 0) {
            return [];
        }

        const rows = uniqueTargetIds.map((targetId) => ({
            source: source.id,
            target: targetId,
            label: 'mentions',
        }));

        const { error } = await supabase
            .from(graphEdgeTable)
            .upsert(rows, { onConflict: 'source,target,label', ignoreDuplicates: true });

        if (error) {
            console.error('Failed to insert edges:', error);
        }

        return uniqueTargetIds;
    },

    async purgeTopicNodes(topicId: string) {
        const { data, error } = await supabase.rpc('purge_topic_nodes', { target_topic_id: topicId });

        if (error) {
            console.error('Purge RPC failed', error);
            return { error };
        }

        console.log('Purge Result:', data);
        return { error: null, data };
    },
};
