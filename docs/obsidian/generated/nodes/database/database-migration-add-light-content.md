---
id: database:migration-add-light-content
type: database
status: active
source_path: database/sql/migrations/migration_add_light_content.sql
source_kind: migration
generated_from:
  - git-ls-files
  - migration
relations:
  outgoing:
    - table:topic-sections
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/migrations/migration_add_light_content.sql
    detail: "alter table topic_sections"
confidence: medium
---

# database:migration-add-light-content

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/migrations/migration_add_light_content.sql`
- Source kind: `migration`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-topic-sections]] | medium | migration @ database/sql/migrations/migration_add_light_content.sql |
