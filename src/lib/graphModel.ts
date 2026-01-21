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
}

export interface GraphEdge {
    source: string;
    target: string;
    type?: 'hierarchy' | 'temporal' | 'relational';
}

export interface GraphModel {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export const buildGraphModel = (): GraphModel => {
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
