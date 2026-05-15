export type GraphNodeType = 'root' | 'field' | 'topic' | 'concept' | 'section';

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
    pdf_url?: string;
}

export interface TopicSection {
    id: string;
    topic_id: string;
    title: string;
    content: string;
    content_light?: string;
    order_index: number;
    updated_at?: string;
}

export interface GraphNodeRecord {
    id: string;
    type: GraphNodeType;
    label: string;
    x?: number | null;
    y?: number | null;
    data?: Record<string, unknown> | null;
    created_at?: string;
}

export interface GraphEdgeRecord {
    source: string;
    target: string;
    label: string;
}
