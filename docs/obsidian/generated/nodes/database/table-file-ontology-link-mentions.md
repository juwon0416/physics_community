---
id: table:file-ontology-link-mentions
type: database
status: active
source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:migration-add-file-ontology-workflow
    - database:migration-add-file-ontology-workflow
evidence:
  - kind: file-path-convention
    source_path: database/sql/migrations/migration_add_file_ontology_workflow.sql
confidence: high
---

# table:file-ontology-link-mentions

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/migrations/migration_add_file_ontology_workflow.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-migration-add-file-ontology-workflow]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
| in | migrates | [[database-migration-add-file-ontology-workflow]] | medium | migration @ database/sql/migrations/migration_add_file_ontology_workflow.sql |
