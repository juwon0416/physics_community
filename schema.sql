-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Tables

-- Fields (Static but can be stored in DB)
create table if not exists fields (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  color text
);

-- Topics (Timeline)
create table if not exists topics (
  id text primary key,
  field_id text references fields(id),
  year text not null,
  title text not null,
  slug text unique not null,
  summary text,
  tags text[],
  image_url text
);
-- Migration for existing tables:
alter table topics add column if not exists image_url text;

-- 1. Topics RLS
alter table topics enable row level security;

create policy "Topics are viewable by everyone"
  on topics for select
  using ( true );

create policy "Editors can insert topics"
  on topics for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors can update topics"
  on topics for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors can delete topics"
  on topics for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- Questions (Dynamic User Content)
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  topic_id text references topics(id),
  title text not null,
  body text not null,
  nickname text default 'Anonymous',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'open' check (status in ('open', 'answered'))
);

alter table questions enable row level security;

create policy "Public questions are viewable by everyone"
  on questions for select
  using ( true );

create policy "Anyone can upload a question"
  on questions for insert
  with check ( true );

-- User Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Topic Sections
create table if not exists topic_sections (
  id text primary key,
  topic_id text references topics(id),
  title text not null,
  content text not null,
  order_index int default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Topic Sections RLS
alter table topic_sections enable row level security;

create policy "Sections are viewable by everyone"
  on topic_sections for select
  using ( true );

create policy "Editors can insert sections"
  on topic_sections for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors can update sections"
  on topic_sections for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

create policy "Editors can delete sections"
  on topic_sections for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- 3. Storage RLS (Images Bucket)
-- Note: You must create a bucket named 'images' in Supabase Dashboard or via API if not exists.
-- The following policies control access to objects in 'images' bucket.

-- Allow public read access to images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Allow Editors to upload images
create policy "Editors can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'images' and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- Allow Editors to delete images
create policy "Editors can delete images"
  on storage.objects for delete
  using (
    bucket_id = 'images' and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- 4. Graph Overview Data
create table if not exists graph_nodes (
    id text primary key,
    type text not null check (type in ('root', 'field', 'topic')),
    label text not null,
    x float not null default 0,
    y float not null default 0,
    data jsonb default '{}'::jsonb, -- Store slug, year, color, etc.
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists graph_edges (
    id uuid default uuid_generate_v4() primary key,
    source text references graph_nodes(id) on delete cascade,
    target text references graph_nodes(id) on delete cascade,
    label text
);

alter table graph_nodes enable row level security;
alter table graph_edges enable row level security;

-- Public Read
create policy "Graph nodes are viewable by everyone" on graph_nodes for select using (true);
create policy "Graph edges are viewable by everyone" on graph_edges for select using (true);

-- Admin Write
create policy "Editors can manage nodes" on graph_nodes for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'editor'))
);
create policy "Editors can manage edges" on graph_edges for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'editor'))
);

