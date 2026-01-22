-- Migration: Sync Missing Fields and Graph Nodes
-- Run this in Supabase SQL Editor

-- 1. Insert Fields into 'fields' table
INSERT INTO fields (id, name, slug, description)
VALUES 
    (
        'electrodynamics', 
        'Electrodynamics', 
        'electrodynamics', 
        'The branch of physics which deals with rapidly changing electric and magnetic fields.'
    ),
    (
        'mathematical-physics', 
        'Mathematical Physics', 
        'mathematical-physics', 
        'The application of mathematics to problems in physics and the development of mathematical methods for such applications.'
    )
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- 2. Ensure they exist in 'graph_nodes' (for Graph View)
-- Also ensure ROOT exists
INSERT INTO graph_nodes (id, type, label, data)
VALUES 
    ('root', 'root', 'PHYSICS', '{"color": "#ffffff"}'::jsonb),
    (
        'electrodynamics', 
        'field', 
        'Electrodynamics', 
        '{"fieldId": "electrodynamics", "color": "from-yellow-500 to-orange-400"}'::jsonb
    ),
    (
        'mathematical-physics', 
        'field', 
        'Mathematical Physics', 
        '{"fieldId": "mathematical-physics", "color": "from-indigo-500 to-violet-400"}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Connect Root -> New Fields in 'graph_edges'
INSERT INTO graph_edges (source, target, label)
VALUES 
    ('root', 'electrodynamics', 'hierarchy'),
    ('root', 'mathematical-physics', 'hierarchy')
ON CONFLICT (source, target, label) DO NOTHING;
