create extension if not exists "uuid-ossp";

create table if not exists knowledge_repositories (
  id uuid default uuid_generate_v4() primary key,
  scope text not null unique check (scope in ('legacy', 'archive')),
  label text not null,
  status text not null default 'ready' check (status in ('ready', 'processing', 'error')),
  stats jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists knowledge_source_documents (
  id uuid default uuid_generate_v4() primary key,
  repository_id uuid not null references knowledge_repositories(id) on delete cascade,
  scope text not null check (scope in ('legacy', 'archive')),
  title text not null,
  source_kind text not null default 'pdf' check (source_kind in ('pdf', 'markdown', 'text', 'notes', 'paper', 'book', 'other')),
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size bigint,
  extracted_text text,
  preview_text text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists knowledge_ingestion_runs (
  id uuid default uuid_generate_v4() primary key,
  repository_id uuid not null references knowledge_repositories(id) on delete cascade,
  source_document_id uuid not null references knowledge_source_documents(id) on delete cascade,
  scope text not null check (scope in ('legacy', 'archive')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

create table if not exists knowledge_node_sources (
  id uuid default uuid_generate_v4() primary key,
  repository_id uuid not null references knowledge_repositories(id) on delete cascade,
  source_document_id uuid not null references knowledge_source_documents(id) on delete cascade,
  ingestion_run_id uuid not null references knowledge_ingestion_runs(id) on delete cascade,
  scope text not null check (scope in ('legacy', 'archive')),
  node_id text not null,
  topic_id text not null,
  relation_type text not null default 'evidence' check (relation_type in ('created', 'updated', 'evidence')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists knowledge_change_sets (
  id uuid default uuid_generate_v4() primary key,
  repository_id uuid not null references knowledge_repositories(id) on delete cascade,
  ingestion_run_id uuid not null references knowledge_ingestion_runs(id) on delete cascade,
  source_document_id uuid not null references knowledge_source_documents(id) on delete cascade,
  scope text not null check (scope in ('legacy', 'archive')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists idx_knowledge_node_sources_unique
  on knowledge_node_sources(scope, source_document_id, node_id, relation_type);

create index if not exists idx_knowledge_source_documents_scope_created_at
  on knowledge_source_documents(scope, created_at desc);

create index if not exists idx_knowledge_ingestion_runs_scope_created_at
  on knowledge_ingestion_runs(scope, created_at desc);

create index if not exists idx_knowledge_node_sources_scope_node_id
  on knowledge_node_sources(scope, node_id);

create index if not exists idx_knowledge_change_sets_scope_created_at
  on knowledge_change_sets(scope, created_at desc);

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'graph_nodes') then
    if exists (select 1 from pg_constraint where conname = 'graph_nodes_type_check') then
      alter table graph_nodes drop constraint graph_nodes_type_check;
    end if;

    alter table graph_nodes
      add constraint graph_nodes_type_check
      check (type in ('root', 'field', 'cluster', 'topic', 'concept', 'section'));
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'archive_graph_nodes') then
    if exists (select 1 from pg_constraint where conname = 'archive_graph_nodes_type_check') then
      alter table archive_graph_nodes drop constraint archive_graph_nodes_type_check;
    end if;

    alter table archive_graph_nodes
      add constraint archive_graph_nodes_type_check
      check (type in ('root', 'field', 'cluster', 'topic', 'concept', 'section'));
  end if;
end $$;

alter table knowledge_repositories enable row level security;
alter table knowledge_source_documents enable row level security;
alter table knowledge_ingestion_runs enable row level security;
alter table knowledge_node_sources enable row level security;
alter table knowledge_change_sets enable row level security;

drop policy if exists "Knowledge repositories are viewable by everyone" on knowledge_repositories;
create policy "Knowledge repositories are viewable by everyone"
  on knowledge_repositories for select
  using (true);

drop policy if exists "Knowledge source documents are viewable by everyone" on knowledge_source_documents;
create policy "Knowledge source documents are viewable by everyone"
  on knowledge_source_documents for select
  using (true);

drop policy if exists "Knowledge ingestion runs are viewable by everyone" on knowledge_ingestion_runs;
create policy "Knowledge ingestion runs are viewable by everyone"
  on knowledge_ingestion_runs for select
  using (true);

drop policy if exists "Knowledge node sources are viewable by everyone" on knowledge_node_sources;
create policy "Knowledge node sources are viewable by everyone"
  on knowledge_node_sources for select
  using (true);

drop policy if exists "Knowledge change sets are viewable by everyone" on knowledge_change_sets;
create policy "Knowledge change sets are viewable by everyone"
  on knowledge_change_sets for select
  using (true);

drop policy if exists "Editors can manage knowledge repositories" on knowledge_repositories;
create policy "Editors can manage knowledge repositories"
  on knowledge_repositories for all
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

drop policy if exists "Editors can manage knowledge source documents" on knowledge_source_documents;
create policy "Editors can manage knowledge source documents"
  on knowledge_source_documents for all
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

drop policy if exists "Editors can manage knowledge ingestion runs" on knowledge_ingestion_runs;
create policy "Editors can manage knowledge ingestion runs"
  on knowledge_ingestion_runs for all
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

drop policy if exists "Editors can manage knowledge node sources" on knowledge_node_sources;
create policy "Editors can manage knowledge node sources"
  on knowledge_node_sources for all
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

drop policy if exists "Editors can manage knowledge change sets" on knowledge_change_sets;
create policy "Editors can manage knowledge change sets"
  on knowledge_change_sets for all
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
