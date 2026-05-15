---
id: database:archive-graph-schema
type: database
status: active
source_path: database/sql/archive/archive_graph_schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:archive-graph-edges
    - table:archive-graph-edges
    - table:archive-graph-nodes
    - table:archive-graph-nodes
    - table:archive-topics
    - table:archive-topics
  incoming:
    - none
evidence:
  - kind: sql-schema
    source_path: database/sql/archive/archive_graph_schema.sql
    detail: "create table archive_graph_edges"
  - kind: migration
    source_path: database/sql/archive/archive_graph_schema.sql
    detail: "alter table archive_graph_edges"
  - kind: sql-schema
    source_path: database/sql/archive/archive_graph_schema.sql
    detail: "create table archive_graph_nodes"
  - kind: migration
    source_path: database/sql/archive/archive_graph_schema.sql
    detail: "alter table archive_graph_nodes"
  - kind: sql-schema
    source_path: database/sql/archive/archive_graph_schema.sql
    detail: "create table archive_topics"
confidence: medium
---

# database:archive-graph-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/archive/archive_graph_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-archive-graph-edges]] | high | sql-schema @ database/sql/archive/archive_graph_schema.sql |
| out | migrates | [[table-archive-graph-edges]] | medium | migration @ database/sql/archive/archive_graph_schema.sql |
| out | defines | [[table-archive-graph-nodes]] | high | sql-schema @ database/sql/archive/archive_graph_schema.sql |
| out | migrates | [[table-archive-graph-nodes]] | medium | migration @ database/sql/archive/archive_graph_schema.sql |
| out | defines | [[table-archive-topics]] | high | sql-schema @ database/sql/archive/archive_graph_schema.sql |
| out | migrates | [[table-archive-topics]] | medium | migration @ database/sql/archive/archive_graph_schema.sql |
