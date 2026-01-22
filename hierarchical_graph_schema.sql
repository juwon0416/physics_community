-- Hierarchy Graph Schema Update

-- 1. Ensure `graph_nodes` constraints
-- (ID is already primary key, but we need meaningful labels/slugs to be unique if possible, 
--  but for now we rely on application logic for deduplication by label).

-- 2. Update `graph_edges` for robustness
ALTER TABLE graph_edges 
    DROP CONSTRAINT IF EXISTS graph_edges_unique_rel;

ALTER TABLE graph_edges
    ADD CONSTRAINT graph_edges_unique_rel UNIQUE (source, target, label);
    -- Note: using 'label' as 'type' discriminator here, as per existing schema where 'label' column exists.
    -- If we strictly want 'type', we should add a 'type' column, but 'label'='hierarchy' works for prototype.

-- 3. Prevent Self-Loops
ALTER TABLE graph_edges
    DROP CONSTRAINT IF EXISTS graph_edges_no_self_loop;

ALTER TABLE graph_edges
    ADD CONSTRAINT graph_edges_no_self_loop CHECK (source <> target);

-- 4. Indexes for graph traversal performance
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target);
CREATE INDEX IF NOT EXISTS idx_graph_edges_label ON graph_edges(label);
