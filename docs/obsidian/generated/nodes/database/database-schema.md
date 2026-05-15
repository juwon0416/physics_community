---
id: database:schema
type: database
status: active
source_path: database/sql/schema/schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:fields
    - table:graph-edges
    - table:graph-edges
    - table:graph-nodes
    - table:graph-nodes
    - table:profiles
    - table:profiles
    - table:questions
    - table:questions
    - table:topic-sections
    - table:topic-sections
    - table:topics
    - table:topics
  incoming:
    - none
evidence:
  - kind: sql-schema
    source_path: database/sql/schema/schema.sql
    detail: "create table fields"
  - kind: sql-schema
    source_path: database/sql/schema/schema.sql
    detail: "create table graph_edges"
  - kind: migration
    source_path: database/sql/schema/schema.sql
    detail: "alter table graph_edges"
  - kind: sql-schema
    source_path: database/sql/schema/schema.sql
    detail: "create table graph_nodes"
  - kind: migration
    source_path: database/sql/schema/schema.sql
    detail: "alter table graph_nodes"
confidence: medium
---

# database:schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-fields]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | defines | [[table-graph-edges]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-graph-edges]] | medium | migration @ database/sql/schema/schema.sql |
| out | defines | [[table-graph-nodes]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-graph-nodes]] | medium | migration @ database/sql/schema/schema.sql |
| out | defines | [[table-profiles]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-profiles]] | medium | migration @ database/sql/schema/schema.sql |
| out | defines | [[table-questions]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-questions]] | medium | migration @ database/sql/schema/schema.sql |
| out | defines | [[table-topic-sections]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-topic-sections]] | medium | migration @ database/sql/schema/schema.sql |
| out | defines | [[table-topics]] | high | sql-schema @ database/sql/schema/schema.sql |
| out | migrates | [[table-topics]] | medium | migration @ database/sql/schema/schema.sql |
