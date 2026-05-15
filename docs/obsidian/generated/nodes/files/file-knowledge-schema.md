---
id: file:knowledge-schema
type: file
status: active
source_path: src/lib/knowledgeSchema.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:supabase
  incoming:
    - component:knowledge-import-manager
    - file:knowledge-pipeline
evidence:
  - kind: static-import
    source_path: src/lib/knowledgeSchema.ts
    detail: "./supabase"
confidence: high
---

# file:knowledge-schema

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/knowledgeSchema.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/knowledgeSchema.ts |
| in | imports | [[component-knowledge-import-manager]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
