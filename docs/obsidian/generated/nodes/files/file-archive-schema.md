---
id: file:archive-schema
type: file
status: active
source_path: src/lib/archiveSchema.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:supabase
  incoming:
    - component:knowledge-import-manager
    - file:graph-model
    - file:knowledge-pipeline
    - file:storage
    - page:topic-page
evidence:
  - kind: static-import
    source_path: src/lib/archiveSchema.ts
    detail: "./supabase"
confidence: high
---

# file:archive-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/archiveSchema.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/archiveSchema.ts |
| in | imports | [[component-knowledge-import-manager]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
