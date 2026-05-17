-- File ontology canvas schema.
-- This is additive and does not modify legacy graph tables.

create table if not exists public.file_ontology_files (
    id text primary key,
    title text not null,
    summary text not null default '',
    content text not null default '',
    x double precision not null default 120,
    y double precision not null default 120,
    width integer not null default 440,
    height integer not null default 340,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.file_ontology_edges (
    id text primary key,
    source_file_id text not null references public.file_ontology_files(id) on delete cascade,
    target_file_id text not null references public.file_ontology_files(id) on delete cascade,
    label text not null default 'relates to',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint file_ontology_edges_no_self_loop check (source_file_id <> target_file_id)
);

create index if not exists idx_file_ontology_edges_source_file_id
    on public.file_ontology_edges(source_file_id);

create index if not exists idx_file_ontology_edges_target_file_id
    on public.file_ontology_edges(target_file_id);

create or replace function public.touch_file_ontology_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_file_ontology_files_updated_at on public.file_ontology_files;
create trigger trg_file_ontology_files_updated_at
before update on public.file_ontology_files
for each row
execute function public.touch_file_ontology_updated_at();

drop trigger if exists trg_file_ontology_edges_updated_at on public.file_ontology_edges;
create trigger trg_file_ontology_edges_updated_at
before update on public.file_ontology_edges
for each row
execute function public.touch_file_ontology_updated_at();

alter table public.file_ontology_files enable row level security;
alter table public.file_ontology_edges enable row level security;

drop policy if exists "file ontology files are readable" on public.file_ontology_files;
create policy "file ontology files are readable"
on public.file_ontology_files
for select
using (true);

drop policy if exists "authenticated users can insert file ontology files" on public.file_ontology_files;
drop policy if exists "editors can insert file ontology files" on public.file_ontology_files;
create policy "editors can insert file ontology files"
on public.file_ontology_files
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);

drop policy if exists "authenticated users can update file ontology files" on public.file_ontology_files;
drop policy if exists "editors can update file ontology files" on public.file_ontology_files;
create policy "editors can update file ontology files"
on public.file_ontology_files
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);

drop policy if exists "authenticated users can delete file ontology files" on public.file_ontology_files;
drop policy if exists "editors can delete file ontology files" on public.file_ontology_files;
create policy "editors can delete file ontology files"
on public.file_ontology_files
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);

drop policy if exists "file ontology edges are readable" on public.file_ontology_edges;
create policy "file ontology edges are readable"
on public.file_ontology_edges
for select
using (true);

drop policy if exists "authenticated users can insert file ontology edges" on public.file_ontology_edges;
drop policy if exists "editors can insert file ontology edges" on public.file_ontology_edges;
create policy "editors can insert file ontology edges"
on public.file_ontology_edges
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);

drop policy if exists "authenticated users can update file ontology edges" on public.file_ontology_edges;
drop policy if exists "editors can update file ontology edges" on public.file_ontology_edges;
create policy "editors can update file ontology edges"
on public.file_ontology_edges
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);

drop policy if exists "authenticated users can delete file ontology edges" on public.file_ontology_edges;
drop policy if exists "editors can delete file ontology edges" on public.file_ontology_edges;
create policy "editors can delete file ontology edges"
on public.file_ontology_edges
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'editor')
    )
);
