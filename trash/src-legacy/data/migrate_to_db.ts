
import { createClient } from '@supabase/supabase-js';
import { TIMELINE_TOPICS, KEYWORD_SECTIONS, FIELDS } from './seed';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_ROLE_KEY if we had it, but anon works if RLS is open or we are just testing

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Fields
    console.log('Migrating Fields...');
    const { error: fError } = await supabase
        .from('fields')
        .upsert(FIELDS, { onConflict: 'id' });
    if (fError) console.error('Error migrating fields:', fError);

    // 2. Topics
    console.log('Migrating Topics...');
    // Mapping seed data to DB schema if needed, but they match closely
    const topicsData = TIMELINE_TOPICS.map(t => ({
        id: t.id,
        field_id: t.fieldId, // Note camcelCase to snake_case mapping if needed? Schema says field_id
        year: t.year,
        title: t.title,
        slug: t.slug,
        summary: t.summary,
        tags: t.tags
    }));

    // Check if topics needs field_id mapping. In schema.sql: "field_id text references fields(id)"
    // In seed.ts: fieldId. So we need to map.

    const { error: tError } = await supabase
        .from('topics')
        .upsert(topicsData, { onConflict: 'id' });
    if (tError) console.error('Error migrating topics:', tError);

    // 3. Sections
    console.log('Migrating Sections...');
    const sectionsData = KEYWORD_SECTIONS.map((s, index) => ({
        id: s.id,
        topic_id: s.topicId,
        title: s.title,
        content: s.content,
        order_index: index // Simple ordering
    }));

    const { error: sError } = await supabase
        .from('topic_sections')
        .upsert(sectionsData, { onConflict: 'id' });
    if (sError) console.error('Error migrating sections:', sError);

    console.log('Migration complete!');
}

migrate();
