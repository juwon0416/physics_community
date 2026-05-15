---
id: file:topic-slug
type: file
status: active
source_path: src/lib/topicSlug.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - component:directory-structure-manager
    - file:graph-model
    - file:knowledge-pipeline
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: src/lib/topicSlug.ts
confidence: high
---

# file:topic-slug

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/topicSlug.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[component-directory-structure-manager]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
