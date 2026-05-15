---
id: table:knowledge-change-sets
type: database
status: active
source_path: database/sql/schema/knowledge_repository_schema.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:knowledge-repository-schema
    - database:knowledge-repository-schema
    - file:knowledge-pipeline
evidence:
  - kind: file-path-convention
    source_path: database/sql/schema/knowledge_repository_schema.sql
confidence: high
---

# table:knowledge-change-sets

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/knowledge_repository_schema.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-knowledge-repository-schema]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| in | migrates | [[database-knowledge-repository-schema]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| in | queries | [[file-knowledge-pipeline]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
