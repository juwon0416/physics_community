-- Migration: Sync Topics to Graph Nodes
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    r RECORD;
    prev_id TEXT := NULL;
    current_field TEXT := NULL;
BEGIN

    -- 1. Upsert Topics into Graph Nodes
    -- We map topics table to graph_nodes with type='topic'
    INSERT INTO graph_nodes (id, type, label, data, updated_at)
    SELECT 
        id,
        'topic',
        title,
        jsonb_build_object(
            'year', year,
            'slug', slug,
            'fieldId', field_id,
            'summary', summary
        ),
        now()
    FROM topics
    ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at;

    -- 2. Force Purge Legacy Sections (as requested)
    -- This handles the user's "Purge Legacy" request in bulk
    DELETE FROM graph_nodes WHERE type = 'section';
    DELETE FROM topic_sections WHERE id != 'placeholder';

    -- 3. Create Edges for Fields (Field -> Topic)
    -- Assuming we have field nodes? If not, we should probably create them or rely on seed.
    -- The user specifically asked for "topic들도 연대순으로 연결 (connect topics chronologically)".
    -- Let's focus on Topic -> Topic temporal edges.

    -- First, clear existing temporal edges to rebuild them cleanly
    DELETE FROM graph_edges WHERE label = 'temporal';

    -- Loop through topics ordered by field and year
    -- We can't easily do a window function insert in one go for edges without a complex query,
    -- but we can use a recursive CTE or just a window function query.

    INSERT INTO graph_edges (source, target, label)
    SELECT
        lag(id) OVER (PARTITION BY field_id ORDER BY year::int ASC),
        id,
        'temporal'
    FROM topics
    WHERE field_id IS NOT NULL;

    -- Cleanup: Remove any edges where source is null (first item in chain)
    DELETE FROM graph_edges WHERE source IS NULL AND label = 'temporal';

END $$;
