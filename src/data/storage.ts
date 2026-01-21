import { supabase } from '../lib/supabase';
import { TIMELINE_TOPICS as SEED_TOPICS, KEYWORD_SECTIONS } from './seed';
import { conceptAPI } from '../lib/concepts';

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
        } catch (e: any) {
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
        } catch (e) {
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
        } catch (e: any) {
            return { data: null, error: new Error(e.message) };
        }
    },

    updateSection: async (id: string, updates: { title?: string; content?: string; content_light?: string }): Promise<{ error: Error | null }> => {
        try {
            const { error } = await supabase
                .from('topic_sections')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e: any) {
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
        } catch (e: any) {
            return { error: e instanceof Error ? e : new Error('Unknown error') };
        }
    },

    // Timeline Topics CRUD
    getTopics: async (fieldId: string): Promise<Topic[]> => {
        try {
            const { data, error } = await supabase
                .from('topics')
                .select('*')
                .eq('field_id', fieldId)
                .order('year', { ascending: true });

            if (error) throw error;
            const dbTopics = (data || []) as Topic[];

            // Merge with Seed Data
            const dbSlugs = new Set(dbTopics.map(t => t.slug));
            const seedTopics = SEED_TOPICS
                .filter(t => t.fieldId === fieldId)
                .filter(t => !dbSlugs.has(t.slug))
                .map(t => ({
                    id: t.id,
                    field_id: t.fieldId,
                    year: t.year,
                    title: t.title,
                    slug: t.slug,
                    summary: t.summary,
                    tags: t.tags,
                    image_url: t.slug === 'quantum-mechanics' ? '/images/schrodinger.png' :
                        t.slug === 'classical-mechanics' ? '/images/newton.png' :
                            t.slug === 'statistical-mechanics' ? '/images/boltzmann.png' :
                                t.slug === 'electrodynamics' ? '/images/maxwell.png' : undefined
                } as Topic));

            return [...dbTopics, ...seedTopics].sort((a, b) => parseInt(a.year) - parseInt(b.year));
        } catch (e) {
            // Fallback completely to seed
            return SEED_TOPICS
                .filter(t => t.fieldId === fieldId)
                .map(t => ({
                    id: t.id,
                    field_id: t.fieldId,
                    year: t.year,
                    title: t.title,
                    slug: t.slug,
                    summary: t.summary,
                    tags: t.tags,
                } as Topic))
                .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        }
    },

    getTopic: async (id: string): Promise<Topic | null> => {
        try {
            const { data } = await supabase.from('topics').select('*').eq('id', id).single();
            if (data) return data as Topic;
        } catch { }

        const seed = SEED_TOPICS.find(t => t.id === id);
        if (seed) {
            return {
                id: seed.id,
                field_id: seed.fieldId,
                year: seed.year,
                title: seed.title,
                slug: seed.slug,
                summary: seed.summary,
                tags: seed.tags,
            } as Topic;
        }
        return null;
    },

    getTopicBySlug: async (slug: string): Promise<Topic | null> => {
        try {
            const { data } = await supabase.from('topics').select('*').eq('slug', slug).single();
            if (data) return data as Topic;
        } catch { }

        const seed = SEED_TOPICS.find(t => t.slug === slug);
        if (seed) {
            return {
                id: seed.id,
                field_id: seed.fieldId,
                year: seed.year,
                title: seed.title,
                slug: seed.slug,
                summary: seed.summary,
                tags: seed.tags,
            } as Topic;
        }
        return null;
    },

    addTopic: async (topic: Omit<Topic, 'id'>): Promise<{ data: Topic | null; error: Error | null }> => {
        try {
            const { data, error } = await supabase
                .from('topics')
                .insert([{
                    id: crypto.randomUUID(),
                    field_id: topic.field_id,
                    year: topic.year,
                    title: topic.title,
                    slug: topic.slug,
                    summary: topic.summary,
                    tags: topic.tags,
                    image_url: topic.image_url
                }])
                .select()
                .single();

            if (error) return { data: null, error: new Error(error.message) };

            // Auto-promote concept if exists
            conceptAPI.promoteToTopic(topic.title, `/topic/${topic.slug}`).catch(console.error);

            // Sync graph node for topic
            conceptAPI.syncContentEdges(
                { id: data.id, type: 'topic', label: topic.title },
                topic.summary || ''
            ).catch(console.error);

            return { data: data as Topic, error: null };
        } catch (e: any) {
            return { data: null, error: e };
        }
    },

    updateTopic: async (id: string, updates: Partial<Topic>): Promise<{ error: Error | null }> => {
        try {
            const { error } = await supabase
                .from('topics')
                .update(updates)
                .eq('id', id);

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e: any) {
            return { error: e };
        }
    },

    deleteTopic: async (id: string): Promise<{ error: Error | null }> => {
        try {
            const { error } = await supabase
                .from('topics')
                .delete()
                .eq('id', id);

            if (error) return { error: new Error(error.message) };
            return { error: null };
        } catch (e: any) {
            return { error: e };
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
        } catch (e: any) {
            return { url: null, error: e instanceof Error ? e : new Error('Unknown upload error') };
        }
    },

    // Graph Data
    getGraphData: async (): Promise<{ nodes: any[]; edges: any[]; error: Error | null }> => {
        try {
            const { data: nodes, error: nError } = await supabase.from('graph_nodes').select('*');
            const { data: edges, error: eError } = await supabase.from('graph_edges').select('*');

            if (nError) throw nError;
            if (eError) throw eError;

            return { nodes: nodes || [], edges: edges || [], error: null };
        } catch (e: any) {
            return { nodes: [], edges: [], error: e };
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

    saveGraphData: async (nodes: any[], edges: any[]): Promise<{ error: Error | null }> => {
        try {
            // Transaction-like: Delete all and insert all (Simplest for "Sync")
            // Note: Postgres RLS might block delete all if not admin.

            const { error: d1 } = await supabase.from('graph_edges').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (d1) throw d1;
            const { error: d2 } = await supabase.from('graph_nodes').delete().neq('id', 'PLACEHOLDER');
            if (d2) throw d2;

            const { error: i1 } = await supabase.from('graph_nodes').insert(nodes);
            if (i1) throw i1;

            const { error: i2 } = await supabase.from('graph_edges').insert(edges);
            if (i2) throw i2;

            return { error: null };
        } catch (e: any) {
            return { error: e };
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
}
