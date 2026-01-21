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
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found
        return data as Concept | null;
    },

    // Create a new concept
    async create(label: string, description: string) {
        // First check if exists
        const existing = await this.getByLabel(label);
        if (existing) throw new Error('Concept already exists');

        const { data, error } = await supabase
            .from('graph_nodes')
            .insert({
                id: crypto.randomUUID(),
                type: 'concept',
                label: label,
                x: 0, // Default positions, let layout handler update later if needed
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
            .select()
            .single();

        if (error) throw error;
        return data;
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
    async syncContentEdges(source: { id: string; type: 'topic' | 'section'; label: string }, content: string) {
        // 1. Parse content for [[concepts]]
        const regex = /\[\[(.*?)\]\]/g;
        const matches = [...content.matchAll(regex)];
        const terms = [...new Set(matches.map(m => m[1]))]; // dedup

        // 2. Upsert Source Node (Topic or Section)
        await supabase
            .from('graph_nodes')
            .upsert({
                id: source.id,
                type: source.type,
                label: source.label,
                data: {}
            });

        if (terms.length === 0) return;

        // 3. Process each term
        const conceptIds: string[] = [];

        for (const term of terms) {
            // Get or Create Concept Node
            let concept = await this.getByLabel(term);
            if (!concept) {
                concept = await this.create(term, '');
            }
            conceptIds.push(concept.id);

            // 4. Ensure Edge exists
            // Check if edge exists
            const { data: existingEdge } = await supabase
                .from('graph_edges')
                .select('id')
                .eq('source', source.id)
                .eq('target', concept.id)
                .single();

            if (!existingEdge) {
                await this.connect(source.id, concept.id, 'mentions');
            }
        }

        // 5. Cleanup removed edges (optional but good for sync)
        // Delete edges from this source where target is NOT in current conceptIds AND target type is concept
        // This requires a more complex query or fetching all edges first.
        // For MVP, just adding is safer.
    }
};
