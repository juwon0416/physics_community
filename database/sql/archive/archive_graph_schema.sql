create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

create table if not exists archive_topics (
  id text primary key,
  field_id text references fields(id),
  year text not null,
  title text not null,
  slug text unique not null,
  summary text,
  tags text[],
  image_url text,
  content text,
  pdf_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table archive_topics add column if not exists image_url text;
alter table archive_topics add column if not exists content text;
alter table archive_topics add column if not exists pdf_url text;
alter table archive_topics add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

create table if not exists archive_graph_nodes (
  id text primary key,
  type text not null,
  label text not null,
  x float not null default 0,
  y float not null default 0,
  data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists archive_graph_edges (
  id uuid default uuid_generate_v4() primary key,
  source text references archive_graph_nodes(id) on delete cascade,
  target text references archive_graph_nodes(id) on delete cascade,
  label text
);

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'archive_graph_nodes_type_check') then
    alter table archive_graph_nodes drop constraint archive_graph_nodes_type_check;
  end if;
end $$;

alter table archive_graph_nodes
add constraint archive_graph_nodes_type_check
check (type in ('root', 'field', 'cluster', 'topic', 'concept', 'section'));

alter table archive_graph_edges drop constraint if exists archive_unique_edge_triplet;
alter table archive_graph_edges
add constraint archive_unique_edge_triplet unique (source, target, label);

alter table archive_graph_edges drop constraint if exists archive_no_self_loops;
alter table archive_graph_edges
add constraint archive_no_self_loops check (source <> target);

alter table archive_topics enable row level security;
alter table archive_graph_nodes enable row level security;
alter table archive_graph_edges enable row level security;

drop policy if exists "Archive topics are viewable by everyone" on archive_topics;
create policy "Archive topics are viewable by everyone"
  on archive_topics for select
  using (true);

drop policy if exists "Editors can insert archive topics" on archive_topics;
create policy "Editors can insert archive topics"
  on archive_topics for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

drop policy if exists "Editors can update archive topics" on archive_topics;
create policy "Editors can update archive topics"
  on archive_topics for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

drop policy if exists "Editors can delete archive topics" on archive_topics;
create policy "Editors can delete archive topics"
  on archive_topics for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

drop policy if exists "Archive graph nodes are viewable by everyone" on archive_graph_nodes;
create policy "Archive graph nodes are viewable by everyone"
  on archive_graph_nodes for select
  using (true);

drop policy if exists "Editors can manage archive graph nodes" on archive_graph_nodes;
create policy "Editors can manage archive graph nodes"
  on archive_graph_nodes for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

drop policy if exists "Archive graph edges are viewable by everyone" on archive_graph_edges;
create policy "Archive graph edges are viewable by everyone"
  on archive_graph_edges for select
  using (true);

drop policy if exists "Editors can manage archive graph edges" on archive_graph_edges;
create policy "Editors can manage archive graph edges"
  on archive_graph_edges for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create index if not exists idx_archive_graph_nodes_type on archive_graph_nodes(type);
create index if not exists idx_archive_graph_nodes_label_trgm on archive_graph_nodes using gin (label gin_trgm_ops);
create index if not exists idx_archive_graph_edges_source on archive_graph_edges(source);
create index if not exists idx_archive_graph_edges_target on archive_graph_edges(target);
create index if not exists idx_archive_graph_edges_label on archive_graph_edges(label);

create or replace function sync_archive_topic_to_graph_node() returns trigger as $$
begin
  insert into archive_graph_nodes (id, type, label, data, updated_at)
  values (
    new.id,
    'topic',
    new.title,
    jsonb_build_object(
      'year', new.year,
      'slug', new.slug,
      'fieldId', new.field_id,
      'summary', new.summary
    ),
    now()
  )
  on conflict (id) do update set
    label = excluded.label,
    data = excluded.data,
    updated_at = excluded.updated_at;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_sync_archive_topic_graph on archive_topics;
create trigger trigger_sync_archive_topic_graph
after insert or update on archive_topics
for each row
execute function sync_archive_topic_to_graph_node();

update archive_topics set updated_at = now();
