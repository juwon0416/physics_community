---
id: database:safe-schema-update
type: database
status: active
source_path: database/sql/maintenance/safe_schema_update.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:graph-edges
    - table:graph-edges
    - table:graph-nodes
    - table:graph-nodes
    - table:topics
  incoming:
    - none
evidence:
  - kind: sql-schema
    source_path: database/sql/maintenance/safe_schema_update.sql
    detail: "create table graph_edges"
  - kind: migration
    source_path: database/sql/maintenance/safe_schema_update.sql
    detail: "alter table graph_edges"
  - kind: sql-schema
    source_path: database/sql/maintenance/safe_schema_update.sql
    detail: "create table graph_nodes"
  - kind: migration
    source_path: database/sql/maintenance/safe_schema_update.sql
    detail: "alter table graph_nodes"
  - kind: migration
    source_path: database/sql/maintenance/safe_schema_update.sql
    detail: "alter table topics"
confidence: medium
---

# database:safe-schema-update

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/maintenance/safe_schema_update.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-graph-edges]] | high | sql-schema @ database/sql/maintenance/safe_schema_update.sql |
| out | migrates | [[table-graph-edges]] | medium | migration @ database/sql/maintenance/safe_schema_update.sql |
| out | defines | [[table-graph-nodes]] | high | sql-schema @ database/sql/maintenance/safe_schema_update.sql |
| out | migrates | [[table-graph-nodes]] | medium | migration @ database/sql/maintenance/safe_schema_update.sql |
| out | migrates | [[table-topics]] | medium | migration @ database/sql/maintenance/safe_schema_update.sql |
