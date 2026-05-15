---
id: table:topics
type: database
status: active
source_path: database/sql/maintenance/safe_schema_update.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - migration
relations:
  outgoing:
    - none
  incoming:
    - database:migration-add-content
    - database:migration-add-sync-trigger
    - database:safe-schema-update
    - database:schema
    - database:schema
    - file:repository
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: database/sql/maintenance/safe_schema_update.sql
confidence: high
---

# table:topics

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/maintenance/safe_schema_update.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | migrates | [[database-migration-add-content]] | medium | migration @ database/sql/migrations/migration_add_content.sql |
| in | migrates | [[database-migration-add-sync-trigger]] | medium | migration @ database/sql/migrations/migration_add_sync_trigger.sql |
| in | migrates | [[database-safe-schema-update]] | medium | migration @ database/sql/maintenance/safe_schema_update.sql |
| in | defines | [[database-schema]] | high | sql-schema @ database/sql/schema/schema.sql |
| in | migrates | [[database-schema]] | medium | migration @ database/sql/schema/schema.sql |
| in | queries | [[file-repository]] | high | supabase-query @ mcp-server/src/repository.ts |
| in | queries | [[file-storage]] | high | supabase-query @ src/data/storage.ts |
