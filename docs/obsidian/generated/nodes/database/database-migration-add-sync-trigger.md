---
id: database:migration-add-sync-trigger
type: database
status: active
source_path: database/sql/migrations/migration_add_sync_trigger.sql
source_kind: migration
generated_from:
  - git-ls-files
  - migration
relations:
  outgoing:
    - table:topics
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/migrations/migration_add_sync_trigger.sql
    detail: "alter table topics"
confidence: medium
---

# database:migration-add-sync-trigger

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/migrations/migration_add_sync_trigger.sql`
- Source kind: `migration`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-topics]] | medium | migration @ database/sql/migrations/migration_add_sync_trigger.sql |
