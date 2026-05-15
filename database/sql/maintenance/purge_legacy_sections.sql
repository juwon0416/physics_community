-- Purge Legacy Data Script

-- 1. Truncate the 'topic_sections' table as we have migrated to 'topics.content'
TRUNCATE TABLE topic_sections CASCADE;

-- 2. Remove all graph nodes of type 'section' (and their cascaded edges)
DELETE FROM graph_nodes WHERE type = 'section';

-- 3. Cleanup: Ensure no edges point to non-existent nodes (already handled by DELETE CASCADE usually, but good to be safe)
-- DELETE FROM graph_edges WHERE source NOT IN (SELECT id FROM graph_nodes) OR target NOT IN (SELECT id FROM graph_nodes);
