# SQL File Index

This folder groups SQL by purpose so the active website structure is easier to read.

## Folders

- `archive/`
  - Archive-only schema setup.
- `schema/`
  - Baseline schemas and major schema variants.
- `migrations/`
  - Incremental changes layered on top of existing schemas.
- `maintenance/`
  - Cleanup, purge, inspection, and safe-update scripts.

## Key Files

- `archive/archive_graph_schema.sql`
  - Creates archive topic and archive graph tables.
- `schema/schema.sql`
  - Baseline site schema.
- `schema/knowledge_repository_schema.sql`
  - Knowledge import tables required by the knowledge ingestion flow.
- `schema/ontology_paper_system_schema.sql`
  - Ontology and paper-system oriented schema set.
- `schema/file_ontology_schema.sql`
  - Additive `/graph` file ontology canvas tables for markdown files, hidden summaries, positions, and labeled file edges.
- `migrations/`
  - Follow filename order by intent; each file is a targeted change, not a full reset.
- `maintenance/check_purge_status.sql`
  - Checks purge-related state.
- `maintenance/clean_edges.sql`
  - Cleanup for graph edge data.

## Rule Of Thumb

- Need a fresh feature schema: start in `schema/`
- Need to extend an existing deployment: check `migrations/`
- Need archive support: use `archive/`
- Need cleanup or diagnostics: check `maintenance/`
