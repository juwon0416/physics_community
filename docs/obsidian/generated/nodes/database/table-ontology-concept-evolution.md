---
id: table:ontology-concept-evolution
type: database
status: active
source_path: database/sql/schema/ontology_paper_system_schema.sql
source_kind: sql-table
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - none
  incoming:
    - database:ontology-paper-system-schema
    - database:ontology-paper-system-schema
evidence:
  - kind: file-path-convention
    source_path: database/sql/schema/ontology_paper_system_schema.sql
confidence: high
---

# table:ontology-concept-evolution

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/ontology_paper_system_schema.sql`
- Source kind: `sql-table`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | defines | [[database-ontology-paper-system-schema]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| in | migrates | [[database-ontology-paper-system-schema]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
