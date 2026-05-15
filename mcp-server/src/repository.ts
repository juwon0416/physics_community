import { randomUUID } from 'node:crypto';
import { FIELD_IDS, type FieldId } from './constants.js';
import { normalizeTopicSlug } from './slug.js';
import { getSupabase } from './supabase.js';
import type { GraphEdgeRecord, GraphNodeRecord, Topic, TopicSection } from './types.js';

function ensureFieldId(value: string): FieldId {
    if ((FIELD_IDS as readonly string[]).includes(value)) {
        return value as FieldId;
    }
    throw new Error(`Unsupported field_id: ${value}`);
}

function topicToNodeData(topic: Topic) {
    return {
        fieldId: topic.field_id,
        slug: topic.slug,
        year: topic.year,
        description: topic.summary,
    };
}

export async function listTopics(fieldId?: string) {
    const supabase = getSupabase();
    let query = supabase.from('topics').select('*').order('year', { ascending: true });
    if (fieldId) {
        query = query.eq('field_id', ensureFieldId(fieldId));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Topic[];
}

export async function getTopicBySlug(slug: string) {
    const normalizedSlug = normalizeTopicSlug(slug);
    if (!normalizedSlug) {
        throw new Error('Invalid slug');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.from('topics').select('*').eq('slug', normalizedSlug).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Topic | null) ?? null;
}

export async function getSectionsByTopic(topicId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('topic_sections')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as TopicSection[];
}

export async function getGraphSnapshot() {
    const supabase = getSupabase();
    const [{ data: nodes, error: nodeError }, { data: edges, error: edgeError }] = await Promise.all([
        supabase.from('graph_nodes').select('*'),
        supabase.from('graph_edges').select('*'),
    ]);

    if (nodeError) throw new Error(nodeError.message);
    if (edgeError) throw new Error(edgeError.message);

    return {
        nodes: (nodes ?? []) as GraphNodeRecord[],
        edges: (edges ?? []) as GraphEdgeRecord[],
    };
}

export async function createOrUpdateTopic(input: {
    id?: string;
    field_id: string;
    year?: string;
    title: string;
    slug?: string;
    summary?: string;
    tags?: string[];
    content?: string;
    image_url?: string;
    pdf_url?: string;
}) {
    const supabase = getSupabase();
    const id = input.id ?? randomUUID();
    const slug = normalizeTopicSlug(input.slug ?? input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ?? `topic-${id.slice(0, 8)}`;

    const topic: Topic = {
        id,
        field_id: ensureFieldId(input.field_id),
        year: input.year?.trim() || '0',
        title: input.title.trim(),
        slug,
        summary: input.summary?.trim() ?? '',
        tags: input.tags ?? [],
        content: input.content,
        image_url: input.image_url,
        pdf_url: input.pdf_url,
    };

    const { data, error } = await supabase
        .from('topics')
        .upsert(topic, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw new Error(error.message);

    await supabase.from('graph_nodes').upsert(
        {
            id: topic.id,
            type: 'topic',
            label: topic.title,
            data: topicToNodeData(topic),
        },
        { onConflict: 'id' },
    );

    return data as Topic;
}

export async function writeTopicDraft(input: {
    slug: string;
    mode: 'append' | 'replace';
    content: string;
    summary?: string;
}) {
    const topic = await getTopicBySlug(input.slug);
    if (!topic) {
        throw new Error(`Topic not found for slug: ${input.slug}`);
    }

    const nextContent =
        input.mode === 'replace'
            ? input.content
            : [topic.content ?? '', input.content].filter(Boolean).join('\n\n');

    return createOrUpdateTopic({
        id: topic.id,
        field_id: topic.field_id,
        year: topic.year,
        title: topic.title,
        slug: topic.slug,
        summary: input.summary ?? topic.summary,
        tags: topic.tags,
        content: nextContent,
        image_url: topic.image_url,
        pdf_url: topic.pdf_url,
    });
}

export async function createOrUpdateSection(input: {
    id?: string;
    topic_id: string;
    title: string;
    content: string;
    content_light?: string;
    order_index?: number;
}) {
    const supabase = getSupabase();
    const id = input.id ?? randomUUID();

    let orderIndex = input.order_index;
    if (typeof orderIndex !== 'number') {
        const existingSections = await getSectionsByTopic(input.topic_id);
        orderIndex = existingSections.length;
    }

    const section: TopicSection = {
        id,
        topic_id: input.topic_id,
        title: input.title,
        content: input.content,
        content_light: input.content_light,
        order_index: orderIndex,
    };

    const { data, error } = await supabase
        .from('topic_sections')
        .upsert(
            {
                ...section,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
        )
        .select()
        .single();

    if (error) throw new Error(error.message);

    await supabase.from('graph_nodes').upsert(
        {
            id: section.id,
            type: 'section',
            label: section.title,
            data: {
                topicId: section.topic_id,
            },
        },
        { onConflict: 'id' },
    );

    await upsertGraphEdge(section.topic_id, section.id, 'hierarchy');

    return data as TopicSection;
}

export async function createConceptNode(input: {
    label: string;
    description?: string;
    slug?: string;
}) {
    const supabase = getSupabase();

    const { data: existing, error: existingError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('type', 'concept')
        .ilike('label', input.label)
        .limit(1)
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) {
        return existing as GraphNodeRecord;
    }

    const node: GraphNodeRecord = {
        id: randomUUID(),
        type: 'concept',
        label: input.label,
        x: 0,
        y: 0,
        data: {
            description: input.description ?? '',
            slug: normalizeTopicSlug(input.slug),
        },
    };

    const { data, error } = await supabase.from('graph_nodes').insert(node).select().single();
    if (error) throw new Error(error.message);
    return data as GraphNodeRecord;
}

export async function upsertGraphEdge(source: string, target: string, label: string) {
    if (source === target) {
        throw new Error('Self-loop edges are not allowed');
    }

    const supabase = getSupabase();
    const edge = { source, target, label };

    const { data, error } = await supabase
        .from('graph_edges')
        .upsert(edge, { onConflict: 'source,target,label', ignoreDuplicates: true })
        .select()
        .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as GraphEdgeRecord | null) ?? edge;
}

export async function deleteGraphEdge(source: string, target: string, label: string) {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('graph_edges')
        .delete()
        .eq('source', source)
        .eq('target', target)
        .eq('label', label);

    if (error) throw new Error(error.message);
    return { source, target, label };
}
