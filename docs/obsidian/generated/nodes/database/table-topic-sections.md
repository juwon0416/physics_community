---
id: table:topic-sections
type: database
status: active
source_path: database/sql/migrations/migration_add_light_content.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - migration
relations:
  outgoing:
    - none
  incoming:
    - database:migration-add-light-content
    - database:schema
    - database:schema
    - file:repository
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: database/sql/migrations/migration_add_light_content.sql
confidence: high
---

# table:topic-sections

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/migrations/migration_add_light_content.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | migrates | [[database-migration-add-light-content]] | medium | migration @ database/sql/migrations/migration_add_light_content.sql |
| in | defines | [[database-schema]] | high | sql-schema @ database/sql/schema/schema.sql |
| in | migrates | [[database-schema]] | medium | migration @ database/sql/schema/schema.sql |
| in | queries | [[file-repository]] | high | supabase-query @ mcp-server/src/repository.ts |
| in | queries | [[file-storage]] | high | supabase-query @ src/data/storage.ts |
