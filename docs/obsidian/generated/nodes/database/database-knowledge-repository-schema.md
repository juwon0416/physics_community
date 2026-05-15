---
id: database:knowledge-repository-schema
type: database
status: active
source_path: database/sql/schema/knowledge_repository_schema.sql
source_kind: sql-schema
generated_from:
  - git-ls-files
  - sql-schema
relations:
  outgoing:
    - table:archive-graph-nodes
    - table:graph-nodes
    - table:knowledge-change-sets
    - table:knowledge-change-sets
    - table:knowledge-ingestion-runs
    - table:knowledge-ingestion-runs
    - table:knowledge-node-sources
    - table:knowledge-node-sources
    - table:knowledge-repositories
    - table:knowledge-repositories
    - table:knowledge-source-documents
    - table:knowledge-source-documents
  incoming:
    - none
evidence:
  - kind: migration
    source_path: database/sql/schema/knowledge_repository_schema.sql
    detail: "alter table archive_graph_nodes"
  - kind: migration
    source_path: database/sql/schema/knowledge_repository_schema.sql
    detail: "alter table graph_nodes"
  - kind: sql-schema
    source_path: database/sql/schema/knowledge_repository_schema.sql
    detail: "create table knowledge_change_sets"
  - kind: migration
    source_path: database/sql/schema/knowledge_repository_schema.sql
    detail: "alter table knowledge_change_sets"
  - kind: sql-schema
    source_path: database/sql/schema/knowledge_repository_schema.sql
    detail: "create table knowledge_ingestion_runs"
confidence: medium
---

# database:knowledge-repository-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `database`
- Status: `active`
- Source path: `database/sql/schema/knowledge_repository_schema.sql`
- Source kind: `sql-schema`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | migrates | [[table-archive-graph-nodes]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-graph-nodes]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | defines | [[table-knowledge-change-sets]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-knowledge-change-sets]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | defines | [[table-knowledge-ingestion-runs]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-knowledge-ingestion-runs]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | defines | [[table-knowledge-node-sources]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-knowledge-node-sources]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | defines | [[table-knowledge-repositories]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-knowledge-repositories]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
| out | defines | [[table-knowledge-source-documents]] | high | sql-schema @ database/sql/schema/knowledge_repository_schema.sql |
| out | migrates | [[table-knowledge-source-documents]] | medium | migration @ database/sql/schema/knowledge_repository_schema.sql |
