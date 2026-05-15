-- Check counts of legacy data
SELECT count(*) as section_nodes_count FROM graph_nodes WHERE type = 'section';
SELECT count(*) as section_table_count FROM topic_sections;

-- If these numbers are > 0 after purge, the delete failed (likely RLS).

-- To confirm what labels exist (to see if they are 'key aspect' or something else)
SELECT * FROM graph_nodes WHERE type = 'section' LIMIT 5;

-- To force delete directly via SQL Editor (Bypassing Role if run as Superuser in dashboard)
-- DELETE FROM graph_nodes WHERE type = 'section';
-- DELETE FROM topic_sections;
