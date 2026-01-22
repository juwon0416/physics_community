-- Comprehensive Graph Schema Fix
-- Run this in Supabase SQL Editor to ensure all graph features work.

-- 0. Enable Extensions (Must be first for indexes to work)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Update Graph Nodes Type Constraint
-- First, drop the existing constraint if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'graph_nodes_type_check') THEN 
        ALTER TABLE graph_nodes DROP CONSTRAINT graph_nodes_type_check; 
    END IF; 
END $$;

-- Add the new, expanded constraint
ALTER TABLE graph_nodes 
ADD CONSTRAINT graph_nodes_type_check 
CHECK (type IN ('root', 'field', 'topic', 'concept', 'section'));

-- 2. Update Graph Edges Constraints
-- Prevent Duplicate Edges (Source, Target, Label)
ALTER TABLE graph_edges 
DROP CONSTRAINT IF EXISTS unique_edge_triplet;

ALTER TABLE graph_edges 
ADD CONSTRAINT unique_edge_triplet UNIQUE (source, target, label);

-- Prevent Self-Loops
ALTER TABLE graph_edges 
DROP CONSTRAINT IF EXISTS no_self_loops;

ALTER TABLE graph_edges 
ADD CONSTRAINT no_self_loops CHECK (source <> target);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target);
CREATE INDEX IF NOT EXISTS idx_graph_edges_label ON graph_edges(label);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_label_trgm ON graph_nodes USING gin (label gin_trgm_ops);


