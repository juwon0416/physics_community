---
id: file:concepts
type: file
status: active
source_path: src/lib/concepts.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:graph-model
    - file:supabase
  incoming:
    - file:knowledge-pipeline
    - file:storage
evidence:
  - kind: static-import
    source_path: src/lib/concepts.ts
    detail: "./graphModel"
  - kind: static-import
    source_path: src/lib/concepts.ts
    detail: "./supabase"
confidence: high
---

# file:concepts

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/concepts.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/lib/concepts.ts |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/concepts.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
