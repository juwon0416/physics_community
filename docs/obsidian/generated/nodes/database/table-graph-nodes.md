---
id: table:graph-nodes
type: database
status: active
source_path: database/sql/maintenance/safe_schema_update.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:complete-graph-schema
    - database:knowledge-repository-schema
    - database:safe-schema-update
    - database:safe-schema-update
    - database:schema
    - database:schema
    - database:update-graph-schema
    - file:repository
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: database/sql/maintenance/safe_schema_update.sql
confidence: high
---

# table:graph-nodes

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/maintenance/safe_schema_update.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | migrates | [[database-complete-graph-schema]] | medium | migration @ database/sql/schema/complete_graph_schema.sql |
| in | migrates | [[database-knowledge-repository-schema]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| in | defines | [[database-safe-schema-update]] | high | sql-schema @ database/sql/maintenance/safe_schema_update.sql |
| in | migrates | [[database-safe-schema-update]] | medium | migration @ database/sql/maintenance/safe_schema_update.sql |
| in | defines | [[database-schema]] | high | sql-schema @ database/sql/schema/schema.sql |
| in | migrates | [[database-schema]] | medium | migration @ database/sql/schema/schema.sql |
| in | migrates | [[database-update-graph-schema]] | medium | migration @ database/sql/schema/update_graph_schema.sql |
| in | queries | [[file-repository]] | high | supabase-query @ mcp-server/src/repository.ts |
| in | queries | [[file-storage]] | high | supabase-query @ src/data/storage.ts |
