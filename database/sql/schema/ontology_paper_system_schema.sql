create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists ontology_papers (
  id text primary key,
  graph_node_id text,
  source_document_id uuid,
  title text not null,
  authors jsonb not null default '[]'::jsonb,
  year integer,
  venue text,
  abstract text,
  abstract_summary text,
  field_tags jsonb not null default '[]'::jsonb,
  topic_tags jsonb not null default '[]'::jsonb,
  section_structure jsonb not null default '[]'::jsonb,
  source_file_reference jsonb not null default '{}'::jsonb,
  citation_list jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_global_concepts (
  id text primary key,
  type text not null default 'Concept',
  label text not null,
  canonical_name text,
  summary text,
  related_terms jsonb not null default '[]'::jsonb,
  aliases jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_nodes (
  id text primary key,
  type text not null check (
    type in (
      'Paper',
      'ResearchProblem',
      'BackgroundContext',
      'PhysicalSystem',
      'Assumption',
      'Approximation',
      'ValidityRegime',
      'Model',
      'Hamiltonian',
      'Equation',
      'MathematicalObject',
      'Method',
      'DerivationStep',
      'KeyClaim',
      'KeyResult',
      'Prediction',
      'Experiment',
      'Evidence',
      'Figure',
      'Limitation',
      'OpenQuestion',
      'PhysicalInterpretation',
      'Concept'
    )
  ),
  label text not null,
  summary text,
  paper_id text references ontology_papers(id) on delete cascade,
  global_concept_id text references ontology_global_concepts(id) on delete set null,
  equation_latex text,
  source_location jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_edges (
  id text primary key,
  source text not null references ontology_nodes(id) on delete cascade,
  target text not null references ontology_nodes(id) on delete cascade,
  type text not null,
  scope text not null default 'intra_paper' check (scope in ('intra_paper', 'inter_paper', 'global_concept')),
  paper_id text references ontology_papers(id) on delete cascade,
  source_paper_id text references ontology_papers(id) on delete cascade,
  target_paper_id text references ontology_papers(id) on delete cascade,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint ontology_edges_no_self_loops check (source <> target)
);

create table if not exists ontology_concept_links (
  id uuid default uuid_generate_v4() primary key,
  node_id text not null references ontology_nodes(id) on delete cascade,
  global_concept_id text not null references ontology_global_concepts(id) on delete cascade,
  type text not null check (
    type in (
      'instantiates_concept',
      'refines_concept',
      'reinterprets_concept',
      'specializes_concept',
      'generalizes_concept'
    )
  ),
  explanation text,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (node_id, global_concept_id, type)
);

create table if not exists ontology_inter_paper_relations (
  id text primary key,
  source_node_id text not null references ontology_nodes(id) on delete cascade,
  target_node_id text not null references ontology_nodes(id) on delete cascade,
  type text not null,
  source_paper_id text not null references ontology_papers(id) on delete cascade,
  target_paper_id text not null references ontology_papers(id) on delete cascade,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint ontology_inter_paper_relations_no_self_loops check (source_node_id <> target_node_id)
);

create table if not exists ontology_concept_evolution (
  id text primary key,
  concept_id text references ontology_global_concepts(id) on delete cascade,
  label text not null,
  summary text,
  stages jsonb not null default '[]'::jsonb,
  relations jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_model_lineage (
  id text primary key,
  root_model_node_id text references ontology_nodes(id) on delete set null,
  label text not null,
  summary text,
  models jsonb not null default '[]'::jsonb,
  relations jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_problem_solution_chains (
  id text primary key,
  root_problem_node_id text references ontology_nodes(id) on delete set null,
  label text not null,
  summary text,
  stages jsonb not null default '[]'::jsonb,
  relations jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_open_question_chains (
  id text primary key,
  root_open_question_node_id text references ontology_nodes(id) on delete set null,
  label text not null,
  summary text,
  stages jsonb not null default '[]'::jsonb,
  relations jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0.75 check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ontology_extraction_runs (
  id uuid default uuid_generate_v4() primary key,
  paper_id text references ontology_papers(id) on delete set null,
  source_document_id uuid,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  model_name text,
  prompt_version text,
  pipeline_version text,
  input_hash text,
  output_json jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

create index if not exists idx_ontology_papers_graph_node_id on ontology_papers(graph_node_id);
create index if not exists idx_ontology_papers_source_document_id on ontology_papers(source_document_id);
create index if not exists idx_ontology_nodes_paper_id on ontology_nodes(paper_id);
create index if not exists idx_ontology_nodes_type on ontology_nodes(type);
create index if not exists idx_ontology_nodes_global_concept_id on ontology_nodes(global_concept_id);
create index if not exists idx_ontology_edges_source on ontology_edges(source);
create index if not exists idx_ontology_edges_target on ontology_edges(target);
create index if not exists idx_ontology_edges_paper_id on ontology_edges(paper_id);
create index if not exists idx_ontology_edges_type on ontology_edges(type);
create index if not exists idx_ontology_concept_links_node_id on ontology_concept_links(node_id);
create index if not exists idx_ontology_concept_links_global_concept_id on ontology_concept_links(global_concept_id);
create index if not exists idx_ontology_inter_paper_relations_source_node_id on ontology_inter_paper_relations(source_node_id);
create index if not exists idx_ontology_inter_paper_relations_target_node_id on ontology_inter_paper_relations(target_node_id);
create index if not exists idx_ontology_inter_paper_relations_type on ontology_inter_paper_relations(type);
create index if not exists idx_ontology_extraction_runs_paper_id on ontology_extraction_runs(paper_id);
create index if not exists idx_ontology_extraction_runs_source_document_id on ontology_extraction_runs(source_document_id);

drop trigger if exists trg_ontology_papers_updated_at on ontology_papers;
create trigger trg_ontology_papers_updated_at
  before update on ontology_papers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_global_concepts_updated_at on ontology_global_concepts;
create trigger trg_ontology_global_concepts_updated_at
  before update on ontology_global_concepts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_nodes_updated_at on ontology_nodes;
create trigger trg_ontology_nodes_updated_at
  before update on ontology_nodes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_edges_updated_at on ontology_edges;
create trigger trg_ontology_edges_updated_at
  before update on ontology_edges
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_inter_paper_relations_updated_at on ontology_inter_paper_relations;
create trigger trg_ontology_inter_paper_relations_updated_at
  before update on ontology_inter_paper_relations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_concept_evolution_updated_at on ontology_concept_evolution;
create trigger trg_ontology_concept_evolution_updated_at
  before update on ontology_concept_evolution
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_model_lineage_updated_at on ontology_model_lineage;
create trigger trg_ontology_model_lineage_updated_at
  before update on ontology_model_lineage
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_problem_solution_chains_updated_at on ontology_problem_solution_chains;
create trigger trg_ontology_problem_solution_chains_updated_at
  before update on ontology_problem_solution_chains
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ontology_open_question_chains_updated_at on ontology_open_question_chains;
create trigger trg_ontology_open_question_chains_updated_at
  before update on ontology_open_question_chains
  for each row execute function public.set_updated_at();

alter table ontology_papers enable row level security;
alter table ontology_global_concepts enable row level security;
alter table ontology_nodes enable row level security;
alter table ontology_edges enable row level security;
alter table ontology_concept_links enable row level security;
alter table ontology_inter_paper_relations enable row level security;
alter table ontology_concept_evolution enable row level security;
alter table ontology_model_lineage enable row level security;
alter table ontology_problem_solution_chains enable row level security;
alter table ontology_open_question_chains enable row level security;
alter table ontology_extraction_runs enable row level security;

drop policy if exists "Ontology papers are viewable by everyone" on ontology_papers;
create policy "Ontology papers are viewable by everyone"
  on ontology_papers for select
  using (true);

drop policy if exists "Ontology global concepts are viewable by everyone" on ontology_global_concepts;
create policy "Ontology global concepts are viewable by everyone"
  on ontology_global_concepts for select
  using (true);

drop policy if exists "Ontology nodes are viewable by everyone" on ontology_nodes;
create policy "Ontology nodes are viewable by everyone"
  on ontology_nodes for select
  using (true);

drop policy if exists "Ontology edges are viewable by everyone" on ontology_edges;
create policy "Ontology edges are viewable by everyone"
  on ontology_edges for select
  using (true);

drop policy if exists "Ontology concept links are viewable by everyone" on ontology_concept_links;
create policy "Ontology concept links are viewable by everyone"
  on ontology_concept_links for select
  using (true);

drop policy if exists "Ontology inter-paper relations are viewable by everyone" on ontology_inter_paper_relations;
create policy "Ontology inter-paper relations are viewable by everyone"
  on ontology_inter_paper_relations for select
  using (true);

drop policy if exists "Ontology concept evolution is viewable by everyone" on ontology_concept_evolution;
create policy "Ontology concept evolution is viewable by everyone"
  on ontology_concept_evolution for select
  using (true);

drop policy if exists "Ontology model lineage is viewable by everyone" on ontology_model_lineage;
create policy "Ontology model lineage is viewable by everyone"
  on ontology_model_lineage for select
  using (true);

drop policy if exists "Ontology problem-solution chains are viewable by everyone" on ontology_problem_solution_chains;
create policy "Ontology problem-solution chains are viewable by everyone"
  on ontology_problem_solution_chains for select
  using (true);

drop policy if exists "Ontology open-question chains are viewable by everyone" on ontology_open_question_chains;
create policy "Ontology open-question chains are viewable by everyone"
  on ontology_open_question_chains for select
  using (true);

drop policy if exists "Ontology extraction runs are viewable by everyone" on ontology_extraction_runs;
create policy "Ontology extraction runs are viewable by everyone"
  on ontology_extraction_runs for select
  using (true);

drop policy if exists "Editors can manage ontology papers" on ontology_papers;
create policy "Editors can manage ontology papers"
  on ontology_papers for all
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

drop policy if exists "Editors can manage ontology global concepts" on ontology_global_concepts;
create policy "Editors can manage ontology global concepts"
  on ontology_global_concepts for all
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

drop policy if exists "Editors can manage ontology nodes" on ontology_nodes;
create policy "Editors can manage ontology nodes"
  on ontology_nodes for all
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

drop policy if exists "Editors can manage ontology edges" on ontology_edges;
create policy "Editors can manage ontology edges"
  on ontology_edges for all
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

drop policy if exists "Editors can manage ontology concept links" on ontology_concept_links;
create policy "Editors can manage ontology concept links"
  on ontology_concept_links for all
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

drop policy if exists "Editors can manage ontology inter-paper relations" on ontology_inter_paper_relations;
create policy "Editors can manage ontology inter-paper relations"
  on ontology_inter_paper_relations for all
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

drop policy if exists "Editors can manage ontology concept evolution" on ontology_concept_evolution;
create policy "Editors can manage ontology concept evolution"
  on ontology_concept_evolution for all
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

drop policy if exists "Editors can manage ontology model lineage" on ontology_model_lineage;
create policy "Editors can manage ontology model lineage"
  on ontology_model_lineage for all
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

drop policy if exists "Editors can manage ontology problem-solution chains" on ontology_problem_solution_chains;
create policy "Editors can manage ontology problem-solution chains"
  on ontology_problem_solution_chains for all
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

drop policy if exists "Editors can manage ontology open-question chains" on ontology_open_question_chains;
create policy "Editors can manage ontology open-question chains"
  on ontology_open_question_chains for all
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

drop policy if exists "Editors can manage ontology extraction runs" on ontology_extraction_runs;
create policy "Editors can manage ontology extraction runs"
  on ontology_extraction_runs for all
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
