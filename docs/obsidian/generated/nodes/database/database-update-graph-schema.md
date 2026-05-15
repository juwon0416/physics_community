---
id: database:update-graph-schema
type: database
status: active
source_path: database/sql/schema/update_graph_schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:graph-nodes
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/schema/update_graph_schema.sql
    detail: "alter table graph_nodes"
confidence: medium
---

# database:update-graph-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/update_graph_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-graph-nodes]] | medium | migration @ database/sql/schema/update_graph_schema.sql |
