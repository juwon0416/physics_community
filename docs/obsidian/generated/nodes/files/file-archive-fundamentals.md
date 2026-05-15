---
id: file:archive-fundamentals
type: file
status: active
source_path: src/data/archiveFundamentals.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:graph-model
    - file:render-topic-math
  incoming:
    - file:graph-model
    - file:storage
    - page:topic-page
evidence:
  - kind: static-import
    source_path: src/data/archiveFundamentals.ts
    detail: "../lib/graphModel"
  - kind: static-import
    source_path: src/data/archiveFundamentals.ts
    detail: "../lib/renderTopicMath"
confidence: high
---

# file:archive-fundamentals

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/data/archiveFundamentals.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/data/archiveFundamentals.ts |
| out | imports | [[file-render-topic-math]] | high | static-import @ src/data/archiveFundamentals.ts |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
