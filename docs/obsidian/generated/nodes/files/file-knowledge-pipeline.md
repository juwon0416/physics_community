---
id: file:knowledge-pipeline
type: file
status: active
source_path: src/lib/knowledgePipeline.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:archive-schema
    - file:concepts
    - file:graph-model
    - file:knowledge-schema
    - file:knowledge-taxonomy
    - file:knowledge-writing
    - file:seed
    - file:source-text
    - file:storage
    - file:supabase
    - file:topic-slug
    - table:fields
    - table:knowledge-change-sets
    - table:knowledge-ingestion-runs
    - table:knowledge-node-sources
    - table:knowledge-repositories
    - table:knowledge-source-documents
  incoming:
    - component:knowledge-import-manager
evidence:
  - kind: static-import
    source_path: src/lib/knowledgePipeline.ts
    detail: "./archiveSchema"
  - kind: static-import
    source_path: src/lib/knowledgePipeline.ts
    detail: "./concepts"
  - kind: static-import
    source_path: src/lib/knowledgePipeline.ts
    detail: "./graphModel"
  - kind: static-import
    source_path: src/lib/knowledgePipeline.ts
    detail: "./knowledgeSchema"
  - kind: static-import
    source_path: src/lib/knowledgePipeline.ts
    detail: "./knowledgeTaxonomy"
confidence: high
---

# file:knowledge-pipeline

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/knowledgePipeline.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-archive-schema]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-concepts]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-graph-model]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-knowledge-schema]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-knowledge-taxonomy]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-knowledge-writing]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-seed]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-source-text]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-storage]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | imports | [[file-topic-slug]] | high | static-import @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-fields]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-knowledge-change-sets]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-knowledge-ingestion-runs]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-knowledge-node-sources]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-knowledge-repositories]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| out | queries | [[table-knowledge-source-documents]] | high | supabase-query @ src/lib/knowledgePipeline.ts |
| in | imports | [[component-knowledge-import-manager]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
