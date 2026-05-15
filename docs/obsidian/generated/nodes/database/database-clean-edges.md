---
id: database:clean-edges
type: database
status: active
source_path: database/sql/maintenance/clean_edges.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:graph-edges
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/maintenance/clean_edges.sql
    detail: "alter table graph_edges"
confidence: medium
---

# database:clean-edges

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/maintenance/clean_edges.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-graph-edges]] | medium | migration @ database/sql/maintenance/clean_edges.sql |
