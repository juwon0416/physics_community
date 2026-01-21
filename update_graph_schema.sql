-- Allow 'concept' type in graph_nodes
ALTER TABLE graph_nodes DROP CONSTRAINT IF EXISTS graph_nodes_type_check;
ALTER TABLE graph_nodes ADD CONSTRAINT graph_nodes_type_check CHECK (type IN ('root', 'field', 'topic', 'concept', 'section'));

-- Index for faster lookup by label (since we search concepts by name)
CREATE INDEX IF NOT EXISTS idx_graph_nodes_label ON graph_nodes(label);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
