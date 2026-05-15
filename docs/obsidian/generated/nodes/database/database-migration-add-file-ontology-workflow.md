---
id: database:migration-add-file-ontology-workflow
type: database
status: active
source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
source_kind: migration
generated_from:
  - git-ls-files
  - migration
relations:
  outgoing:
    - table:file-ontology-generation-artifacts
    - table:file-ontology-generation-artifacts
    - table:file-ontology-generation-runs
    - table:file-ontology-generation-runs
    - table:file-ontology-link-mentions
    - table:file-ontology-link-mentions
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
    detail: "create table file_ontology_generation_artifacts"
  - kind: migration
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
    detail: "alter table file_ontology_generation_artifacts"
  - kind: migration
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
    detail: "create table file_ontology_generation_runs"
  - kind: migration
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
    detail: "alter table file_ontology_generation_runs"
  - kind: migration
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
    detail: "create table file_ontology_link_mentions"
confidence: medium
---

# database:migration-add-file-ontology-workflow

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/migrations/migration_add_file_ontology_workflow.sql`
- Source kind: `migration`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-file-ontology-generation-artifacts]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| out | migrates | [[table-file-ontology-generation-artifacts]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| out | defines | [[table-file-ontology-generation-runs]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| out | migrates | [[table-file-ontology-generation-runs]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| out | defines | [[table-file-ontology-link-mentions]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| out | migrates | [[table-file-ontology-link-mentions]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
