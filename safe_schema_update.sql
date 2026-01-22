-- Safe Schema Update
-- Run this to insure your DB has all new tables/columns without errors.

-- 1. Add 'content' and 'image_url' to topics if missing
DO $$
BEGIN
    ALTER TABLE topics ADD COLUMN content TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE topics ADD COLUMN image_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Graph Tables (IF NOT EXISTS is safe)
create table if not exists graph_nodes (
    id text primary key,
    type text not null check (type in ('root', 'field', 'topic', 'concept', 'section')),
    label text not null,
    x float not null default 0,
    y float not null default 0,
    data jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists graph_edges (
    id uuid default uuid_generate_v4() primary key,
    source text references graph_nodes(id) on delete cascade,
    target text references graph_nodes(id) on delete cascade,
    label text
);

-- 3. RLS for Graph (Safe Policy Creation)
alter table graph_nodes enable row level security;
alter table graph_edges enable row level security;

DO $$
BEGIN
    create policy "Graph nodes viewable" on graph_nodes for select using (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    create policy "Graph edges viewable" on graph_edges for select using (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    create policy "Editors manage nodes" on graph_nodes for all using (
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'editor'))
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    create policy "Editors manage edges" on graph_edges for all using (
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'editor'))
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
