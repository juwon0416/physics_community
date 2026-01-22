import { supabase } from './supabase';

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

export const conceptAPI = {
    // Search concepts by label (case-insensitive partial match)
    async search(query: string) {
        const { data, error } = await supabase
            .from('graph_nodes')
            .select('*')
            .eq('type', 'concept')
            .ilike('label', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data as Concept[];
    },

    // Get exact concept by label
    async getByLabel(label: string) {
        const { data, error } = await supabase
            .from('graph_nodes')
            .select('*')
            .eq('type', 'concept')
            .ilike('label', label) // ilike for case-insensitivity consistency
            .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? (data[0] as Concept) : null;
    },

    // Create a new concept (UPSERT safe)
    async create(label: string, description: string) {
        // Upsert based on label being unique (application logic)
        // Since we didn't add a unique constraint on label in SQL explicitly yet (relying on index),
        // we'll stick to "check-then-insert" or try insert-and-fetch.
        // Better: Use upsert with onConflict if we had a constraint.
        // For prototype, we will check existence first (already implemented).
        // Let's optimize to return existing if found without throwing.

        const existing = await this.getByLabel(label);
        if (existing) return existing;

        const { data, error } = await supabase
            .from('graph_nodes')
            .insert({
                id: crypto.randomUUID(),
                type: 'concept',
                label: label,
                x: 0,
                y: 0,
                data: { description }
            })
            .select()
            .single();

        if (error) throw error;
        return data as Concept;
    },

    // Create a relationship (edge) between two concepts
    async connect(sourceId: string, targetId: string, label: string = 'related_to') {
        const { data, error } = await supabase
            .from('graph_edges')
            .insert({
                source: sourceId,
                target: targetId,
                label: label
            })
            .select() // Returning might fail if on conflict do nothing isn't set, but we catch error
            .single();

        // If duplicate, error 23505. Ignore it.
        if (error && error.code !== '23505') throw error;
        return data;
    },

    // Batch connect multiple targets to one source (for hierarchical saving)
    async connectBatch(sourceId: string, targetIds: string[], label: string = 'hierarchy') {
        if (targetIds.length === 0) return;

        // Dedup and remove self-loops
        const uniqueTargets = [...new Set(targetIds)].filter(tid => tid !== sourceId);
        if (uniqueTargets.length === 0) return;

        const rows = uniqueTargets.map(targetId => ({
            source: sourceId,
            target: targetId,
            label: label
        }));

        const { error } = await supabase
            .from('graph_edges')
            .upsert(rows, { onConflict: 'source,target,label', ignoreDuplicates: true });

        if (error) throw error;
    },

    // Create a generic edge between two existing nodes (e.g. Topic -> Section)
    async createEdge(sourceId: string, targetId: string, label: string) {
        const { error } = await supabase
            .from('graph_edges')
            .upsert({
                source: sourceId,
                target: targetId,
                label: label
            }, { onConflict: 'source,target,label', ignoreDuplicates: true });

        if (error) throw error;
    },

    // Promote a concept to link to a topic page
    async promoteToTopic(label: string, slug: string) {
        // 1. Find the concept node
        const { data: nodes } = await supabase
            .from('graph_nodes')
            .select('*')
            .eq('type', 'concept')
            .eq('label', label)
            .limit(1);

        if (!nodes || nodes.length === 0) return;

        const node = nodes[0];
        const currentData = node.data || {};

        // 2. Update the node with the slug
        const { error } = await supabase
            .from('graph_nodes')
            .update({
                data: { ...currentData, slug, type: 'topic_link' }
            })
            .eq('id', node.id);

        if (error) {
            console.error('Failed to promote concept:', error);
        }
    },

    // Get concept details with relations (simple version)
    async getDetails(id: string) {
        const { data: concept, error: nodeError } = await supabase
            .from('graph_nodes')
            .select('*')
            .eq('id', id)
            .single();

        if (nodeError) throw nodeError;

        // Fetch outgoing edges
        const { data: edges, error: edgeError } = await supabase
            .from('graph_edges')
            .select('*, target_node:target(*)')
            .eq('source', id);

        if (edgeError) throw edgeError;

        return { concept, relations: edges };
    },

    // Sync edges extracting from content
    async syncContentEdges(source: { id: string; type: 'topic' | 'section'; label: string; fieldId?: string }, content: string) {
        // 1. Parse content for concepts
        const regexDouble = /\[\[([\s\S]*?)\]\]/g;
        const regexLink = /\[([\s\S]*?)\]\(\/concept\/[\s\S]*?\)/g;

        const matchesDouble = [...content.matchAll(regexDouble)].map(m => m[1]);
        const matchesLink = [...content.matchAll(regexLink)].map(m => m[1]);

        const allTerms = [...matchesDouble, ...matchesLink];
        const terms = [...new Set(allTerms.map(t => t.trim()).filter(Boolean))];

        console.log(`[syncContentEdges] Scanning content for source '${source.label}' (${source.id}). Terms found:`, terms);

        // 2. Upsert Source Node
        await supabase
            .from('graph_nodes')
            .upsert({
                id: source.id,
                type: source.type,
                label: source.label,
                data: source.fieldId ? { fieldId: source.fieldId } : {}
            });

        // 3. Delete existing mentions edges
        await supabase
            .from('graph_edges')
            .delete()
            .eq('source', source.id)
            .eq('label', 'mentions');

        if (terms.length === 0) {
            console.log('[syncContentEdges] No terms found. Exiting.');
            return [];
        }

        // 4. Process each term
        const targetIds: string[] = [];

        for (const term of terms) {
            // Check existence
            let node = await this.getByLabel(term); // Checks concept type

            // If not found as concept, check as topic (since we might link to existing topics)
            if (!node) {
                const { data } = await supabase.from('graph_nodes').select('*').eq('label', term).maybeSingle();
                if (data) node = data;
            }

            if (node) {
                console.log(`[syncContentEdges] Found existing node for '${term}':`, node.type, node.id);

                // AUTO-PROMOTION Logic for Legacy Concepts
                if (node.type === 'concept') {
                    console.log(`[syncContentEdges] AUTO-PROMOTING legacy concept '${term}' to TOPIC.`);
                    const targetField = 'mathematical-physics';
                    let slug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    if (!slug || slug.length < 2) slug = `topic-${node.id.slice(0, 8)}`;

                    // 1. Upsert Topic
                    const { error: tErr } = await supabase.from('topics').upsert({
                        id: node.id,
                        field_id: targetField,
                        title: term,
                        slug: slug,
                        year: '0',
                        summary: 'Auto-promoted concept.',
                        tags: []
                    }, { onConflict: 'id' });

                    if (!tErr) {
                        // 2. Update Graph Node Type
                        await supabase.from('graph_nodes').update({
                            type: 'topic',
                            data: { ...node.data, fieldId: targetField, slug, year: '0' }
                        }).eq('id', node.id);
                        console.log(`[syncContentEdges] Promotion success for ${term}`);
                    }
                }
            }

            if (!node) {
                // GLOBAL LOGIC: All new concepts become Mathematical Physics Topics
                console.log(`[syncContentEdges] Creating NEW PROMOTED topic for '${term}'. Source Field: '${source.fieldId}'`);

                // Always mathematical-physics
                const targetField = 'mathematical-physics';

                let slug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const newTopicId = crypto.randomUUID();

                // Fallback for non-ASCII
                if (!slug || slug.length < 2) {
                    slug = `topic-${newTopicId.slice(0, 8)}`;
                }

                console.log(`[syncContentEdges] Global Promotion: '${term}' -> TOPIC (slug: ${slug}) in ${targetField}`);

                // Insert into TOPICS table
                const { error: tErr } = await supabase.from('topics').insert({
                    id: newTopicId,
                    field_id: targetField,
                    title: term,
                    slug: slug,
                    year: '0',
                    summary: 'Auto-generated from concept link.',
                    tags: []
                });

                if (tErr) {
                    console.error("Failed to insert topic:", tErr);
                    throw tErr;
                }

                // Insert into GRAPH_NODES
                const { data: newNode, error: nErr } = await supabase.from('graph_nodes').insert({
                    id: newTopicId,
                    type: 'topic',
                    label: term,
                    data: { fieldId: targetField, slug, year: '0' }
                }).select().single();

                if (nErr) {
                    console.error("Failed to insert graph node for topic:", nErr);
                    throw nErr;
                }
                node = newNode;
            }

            if (node) targetIds.push(node.id);
        }

        // 5. Batch Insert Edges (UPSERT to avoid 409)
        const rows = targetIds.map(tid => ({
            source: source.id,
            target: tid,
            label: 'mentions'
        }));

        const { error } = await supabase.from('graph_edges').upsert(rows, { onConflict: 'source,target,label', ignoreDuplicates: true });
        if (error) console.error("Failed to insert edges:", error);

        return targetIds;
    },

    // Utility to purge nodes for a specific topic (and orphans)
    async purgeTopicNodes(topicId: string) {
        const { data, error } = await supabase.rpc('purge_topic_nodes', { target_topic_id: topicId });

        if (error) {
            console.error("Purge RPC failed", error);
            return { error };
        }

        console.log("Purge Result:", data);
        return { error: null, data };
    }
};
