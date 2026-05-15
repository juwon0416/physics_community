---
id: database:file-ontology-schema
type: database
status: active
source_path: database/sql/schema/file_ontology_schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:file-ontology-edges
    - table:file-ontology-edges
    - table:file-ontology-files
    - table:file-ontology-files
  incoming:
    - none
evidence:
  - kind: sql-schema
    source_path: database/sql/schema/file_ontology_schema.sql
    detail: "create table file_ontology_edges"
  - kind: migration
    source_path: database/sql/schema/file_ontology_schema.sql
    detail: "alter table file_ontology_edges"
  - kind: sql-schema
    source_path: database/sql/schema/file_ontology_schema.sql
    detail: "create table file_ontology_files"
  - kind: migration
    source_path: database/sql/schema/file_ontology_schema.sql
    detail: "alter table file_ontology_files"
confidence: medium
---

# database:file-ontology-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/file_ontology_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-file-ontology-edges]] | high | sql-schema @ database/sql/schema/file_ontology_schema.sql |
| out | migrates | [[table-file-ontology-edges]] | medium | migration @ database/sql/schema/file_ontology_schema.sql |
| out | defines | [[table-file-ontology-files]] | high | sql-schema @ database/sql/schema/file_ontology_schema.sql |
| out | migrates | [[table-file-ontology-files]] | medium | migration @ database/sql/schema/file_ontology_schema.sql |
