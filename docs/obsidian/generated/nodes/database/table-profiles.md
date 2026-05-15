---
id: table:profiles
type: database
status: active
source_path: database/sql/schema/schema.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:schema
    - database:schema
    - file:auth
evidence:
  - kind: file-path-convention
    source_path: database/sql/schema/schema.sql
confidence: high
---

# table:profiles

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/schema.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-schema]] | high | sql-schema @ database/sql/schema/schema.sql |
| in | migrates | [[database-schema]] | medium | migration @ database/sql/schema/schema.sql |
| in | queries | [[file-auth]] | high | supabase-query @ src/lib/auth.ts |
