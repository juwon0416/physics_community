---
id: database:ontology-paper-system-schema
type: database
status: active
source_path: database/sql/schema/ontology_paper_system_schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:ontology-concept-evolution
    - table:ontology-concept-evolution
    - table:ontology-concept-links
    - table:ontology-concept-links
    - table:ontology-edges
    - table:ontology-edges
    - table:ontology-extraction-runs
    - table:ontology-extraction-runs
    - table:ontology-global-concepts
    - table:ontology-global-concepts
    - table:ontology-inter-paper-relations
    - table:ontology-inter-paper-relations
    - table:ontology-model-lineage
    - table:ontology-model-lineage
    - table:ontology-nodes
    - table:ontology-nodes
    - table:ontology-open-question-chains
    - table:ontology-open-question-chains
    - table:ontology-papers
    - table:ontology-papers
    - table:ontology-problem-solution-chains
    - table:ontology-problem-solution-chains
  incoming:
    - none
evidence:
  - kind: sql-schema
    source_path: database/sql/schema/ontology_paper_system_schema.sql
    detail: "create table ontology_concept_evolution"
  - kind: migration
    source_path: database/sql/schema/ontology_paper_system_schema.sql
    detail: "alter table ontology_concept_evolution"
  - kind: sql-schema
    source_path: database/sql/schema/ontology_paper_system_schema.sql
    detail: "create table ontology_concept_links"
  - kind: migration
    source_path: database/sql/schema/ontology_paper_system_schema.sql
    detail: "alter table ontology_concept_links"
  - kind: sql-schema
    source_path: database/sql/schema/ontology_paper_system_schema.sql
    detail: "create table ontology_edges"
confidence: medium
---

# database:ontology-paper-system-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/ontology_paper_system_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defines | [[table-ontology-concept-evolution]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-concept-evolution]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-concept-links]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-concept-links]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-edges]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-edges]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-extraction-runs]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-extraction-runs]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-global-concepts]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-global-concepts]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-inter-paper-relations]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-inter-paper-relations]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-model-lineage]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-model-lineage]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-nodes]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-nodes]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-open-question-chains]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-open-question-chains]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-papers]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-papers]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
| out | defines | [[table-ontology-problem-solution-chains]] | high | sql-schema @ database/sql/schema/ontology_paper_system_schema.sql |
| out | migrates | [[table-ontology-problem-solution-chains]] | medium | migration @ database/sql/schema/ontology_paper_system_schema.sql |
