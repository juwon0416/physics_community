import { supabase } from './supabase';
import { FIELDS, TIMELINE_TOPICS } from '../data/seed';

export interface GraphNode {
    id: string;
    type: 'root' | 'field' | 'topic' | 'concept' | 'section';
    label: string;
    // Base properties, coordinates will be injected by layout
    color?: string;
    description?: string;
    slug?: string;
    data?: any; // For flexible extra data (e.g. year)
    x?: number; // Optional from DB
    y?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    type?: 'hierarchy' | 'temporal' | 'relational' | 'mentions';
}

export interface GraphModel {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export const buildStaticGraphModel = (): GraphModel => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Root
    nodes.push({ id: 'root', type: 'root', label: 'PHYSICS', color: '#ffffff' });

    // 2. Fields
    FIELDS.forEach(field => {
        nodes.push({
            id: field.id,
            type: 'field',
            label: field.name,
            color: field.color,
            description: field.description,
            data: { fieldId: field.id }
        });

        // Edge from Root -> Field
        edges.push({ source: 'root', target: field.id, type: 'hierarchy' });

        // 3. Topics
        const fieldTopics = TIMELINE_TOPICS.filter(t => t.fieldId === field.id)
            .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Sort by year for easier sequential linking if needed

        fieldTopics.forEach((topic, index) => {
            nodes.push({
                id: topic.id,
                type: 'topic',
                label: topic.title,
                slug: topic.slug,
                description: topic.year,
                data: {
                    year: parseInt(topic.year) || null, // Parse year immediately
                    fieldId: field.id
                }
            });

            // Edge from Field -> Topic (Hierarchy)
            edges.push({ source: field.id, target: topic.id, type: 'hierarchy' });

            // Optional: Temporal Edge (Topic -> Next Topic in same field)
            if (index > 0) {
                edges.push({ source: fieldTopics[index - 1].id, target: topic.id, type: 'temporal' });
            }
        });
    });

    return { nodes, edges };
};

export const fetchGraphModel = async (): Promise<GraphModel> => {
    // 1. Fetch from DB
    const { data: dbNodes, error: nodeError } = await supabase
        .from('graph_nodes')
        .select('*');

    const { data: dbEdges, error: edgeError } = await supabase
        .from('graph_edges')
        .select('*');

    if (nodeError) throw nodeError;
    if (edgeError) throw edgeError;

    // 2. Build Static Base (for fallback/hybrid)
    // Ideally user might want ONLY DB if we fully migrated. 
    // But for now, let's Merge.
    // If DB has data, prefer DB? 
    // Strategy: Use Static Model as base, overwrite/append with DB.
    // However, duplicate IDs?
    // Let's assume DB nodes MIGHT mirror static nodes if we synced.
    // If not, we just concat.

    // For this prototype, user is adding "Concepts" which are dynamic.
    // Topics might be static or dynamic.
    // Let's simpler: Return DB nodes. If DB is empty, return Static.
    // Or better: Combine.

    const staticModel = buildStaticGraphModel();

    // Map DB nodes to GraphNode
    const dynamicNodes: GraphNode[] = (dbNodes || []).map(n => ({
        id: n.id,
        type: n.type as any,
        label: n.label,
        x: n.x,
        y: n.y,
        data: n.data,
        slug: n.data?.slug,
        description: n.data?.description
    }));

    const dynamicEdges: GraphEdge[] = (dbEdges || []).map(e => ({
        source: e.source,
        target: e.target,
        type: (e.label === 'hierarchy' || e.label === 'mentions') ? 'hierarchy' : 'relational' // map label to type
    }));

    // Deduplication Strategy:
    // If ID exists in both, prefer DB (it might have positions).
    // Actually, static model has no positions.

    const nodeMap = new Map<string, GraphNode>();
    staticModel.nodes.forEach(n => nodeMap.set(n.id, n));
    dynamicNodes.forEach(n => nodeMap.set(n.id, n)); // Overwrite if exists

    // Edges: unique by source-target-type
    // We can just concat and let the layout/renderer handle it, or dedup.
    // Simpler to just concat for now.

    return {
        nodes: Array.from(nodeMap.values()),
        edges: [...staticModel.edges, ...dynamicEdges]
    };
};
