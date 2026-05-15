---
id: table:file-ontology-edges
type: database
status: active
source_path: database/sql/schema/file_ontology_schema.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:file-ontology-schema
    - database:file-ontology-schema
evidence:
  - kind: file-path-convention
    source_path: database/sql/schema/file_ontology_schema.sql
confidence: high
---

# table:file-ontology-edges

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/file_ontology_schema.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-file-ontology-schema]] | high | sql-schema @ database/sql/schema/file_ontology_schema.sql |
| in | migrates | [[database-file-ontology-schema]] | medium | migration @ database/sql/schema/file_ontology_schema.sql |
