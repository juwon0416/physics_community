-- Persist graph-view file generation workflow runs, artifacts, and highlight mentions.
-- This migration is additive and keeps paper mirror files separate from wiki integration overlays.

create table if not exists public.file_ontology_generation_runs (
    id text primary key,
    intent text not null check (intent in ('concept_file', 'paper_integration')),
    source_type text not null check (source_type in ('user_prompt', 'paper_markdown')),
    title text not null,
    user_goal text not null default '',
    status text not null default 'draft',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.file_ontology_generation_artifacts (
    id text primary key,
    run_id text not null references public.file_ontology_generation_runs(id) on delete cascade,
    artifact_type text not null,
    content_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.file_ontology_link_mentions (
    id text primary key,
    source_file_id text not null references public.file_ontology_files(id) on delete cascade,
    target_file_id text not null references public.file_ontology_files(id) on delete cascade,
    anchor_text text not null,
    relation text not null,
    context_excerpt text not null default '',
    generation_run_id text references public.file_ontology_generation_runs(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint file_ontology_link_mentions_no_self_loop check (source_file_id <> target_file_id)
);

create index if not exists idx_file_ontology_generation_artifacts_run_id
    on public.file_ontology_generation_artifacts(run_id);

create index if not exists idx_file_ontology_link_mentions_source_file_id
    on public.file_ontology_link_mentions(source_file_id);

create index if not exists idx_file_ontology_link_mentions_target_file_id
    on public.file_ontology_link_mentions(target_file_id);

create index if not exists idx_file_ontology_link_mentions_generation_run_id
    on public.file_ontology_link_mentions(generation_run_id);

create or replace function public.touch_file_ontology_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_file_ontology_generation_runs_updated_at on public.file_ontology_generation_runs;
create trigger trg_file_ontology_generation_runs_updated_at
before update on public.file_ontology_generation_runs
for each row
execute function public.touch_file_ontology_updated_at();

drop trigger if exists trg_file_ontology_link_mentions_updated_at on public.file_ontology_link_mentions;
create trigger trg_file_ontology_link_mentions_updated_at
before update on public.file_ontology_link_mentions
for each row
execute function public.touch_file_ontology_updated_at();

alter table public.file_ontology_generation_runs enable row level security;
alter table public.file_ontology_generation_artifacts enable row level security;
alter table public.file_ontology_link_mentions enable row level security;

drop policy if exists "file ontology generation runs are readable" on public.file_ontology_generation_runs;
create policy "file ontology generation runs are readable"
on public.file_ontology_generation_runs
for select
using (true);

drop policy if exists "file ontology generation artifacts are readable" on public.file_ontology_generation_artifacts;
create policy "file ontology generation artifacts are readable"
on public.file_ontology_generation_artifacts
for select
using (true);

drop policy if exists "file ontology link mentions are readable" on public.file_ontology_link_mentions;
create policy "file ontology link mentions are readable"
on public.file_ontology_link_mentions
for select
using (true);

drop policy if exists "editors can insert file ontology generation runs" on public.file_ontology_generation_runs;
create policy "editors can insert file ontology generation runs"
on public.file_ontology_generation_runs
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

drop policy if exists "editors can update file ontology generation runs" on public.file_ontology_generation_runs;
create policy "editors can update file ontology generation runs"
on public.file_ontology_generation_runs
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

drop policy if exists "editors can insert file ontology generation artifacts" on public.file_ontology_generation_artifacts;
create policy "editors can insert file ontology generation artifacts"
on public.file_ontology_generation_artifacts
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

drop policy if exists "editors can update file ontology generation artifacts" on public.file_ontology_generation_artifacts;
create policy "editors can update file ontology generation artifacts"
on public.file_ontology_generation_artifacts
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

drop policy if exists "editors can insert file ontology link mentions" on public.file_ontology_link_mentions;
create policy "editors can insert file ontology link mentions"
on public.file_ontology_link_mentions
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

drop policy if exists "editors can update file ontology link mentions" on public.file_ontology_link_mentions;
create policy "editors can update file ontology link mentions"
on public.file_ontology_link_mentions
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
