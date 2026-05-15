---
id: database:hierarchical-graph-schema
type: database
status: active
source_path: database/sql/schema/hierarchical_graph_schema.sql
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
    source_path: database/sql/schema/hierarchical_graph_schema.sql
    detail: "alter table graph_edges"
confidence: medium
---

# database:hierarchical-graph-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/hierarchical_graph_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-graph-edges]] | medium | migration @ database/sql/schema/hierarchical_graph_schema.sql |
