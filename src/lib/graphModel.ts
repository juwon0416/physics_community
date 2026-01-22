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

    // strict 1:1 mapping for edge types
    const dynamicEdges: GraphEdge[] = (dbEdges || []).map(e => {
        let type: GraphEdge['type'] = 'relational';
        if (e.label === 'hierarchy') type = 'hierarchy';
        else if (e.label === 'temporal') type = 'temporal';
        else if (e.label === 'mentions') type = 'mentions';

        return {
            source: e.source,
            target: e.target,
            type
        };
    });

    // Deduplication Strategy:
    const nodeMap = new Map<string, GraphNode>();
    staticModel.nodes.forEach(n => nodeMap.set(n.id, n));
    dynamicNodes.forEach(n => nodeMap.set(n.id, n)); // Overwrite if exists

    // Edges: unique by source-target-type
    // We combine static and dynamic edges, but simple concat might have duplicates if static edges are also in DB.
    // For safety, let's use a Set for uniqueness based on "source|target|type"
    const uniqueEdges = new Map<string, GraphEdge>();

    [...staticModel.edges, ...dynamicEdges].forEach(edge => {
        const key = `${edge.source}|${edge.target}|${edge.type}`;
        uniqueEdges.set(key, edge);
    });

    return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(uniqueEdges.values())
    };
};
