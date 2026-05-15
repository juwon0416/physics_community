-- 0. Ensure updated_at exists
ALTER TABLE topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Function to sync topics -> graph_nodes
CREATE OR REPLACE FUNCTION sync_topic_to_graph_node() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO graph_nodes (id, type, label, data, updated_at)
    VALUES (
        NEW.id,
        'topic',
        NEW.title,
        jsonb_build_object(
            'year', NEW.year,
            'slug', NEW.slug,
            'fieldId', NEW.field_id,
            'summary', NEW.summary
        ),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS trigger_sync_topic_graph ON topics;
CREATE TRIGGER trigger_sync_topic_graph
AFTER INSERT OR UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION sync_topic_to_graph_node();

-- Force Sync All Topics Now (to fix current stale data)
UPDATE topics SET updated_at = now();
