---
id: table:archive-topics
type: database
status: active
source_path: database/sql/archive/archive_graph_schema.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:archive-graph-schema
    - database:archive-graph-schema
evidence:
  - kind: file-path-convention
    source_path: database/sql/archive/archive_graph_schema.sql
confidence: high
---

# table:archive-topics

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/archive/archive_graph_schema.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-archive-graph-schema]] | high | sql-schema @ database/sql/archive/archive_graph_schema.sql |
| in | migrates | [[database-archive-graph-schema]] | medium | migration @ database/sql/archive/archive_graph_schema.sql |
