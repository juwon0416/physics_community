---
id: file:render-topic-math
type: file
status: active
source_path: src/lib/renderTopicMath.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:archive-fundamentals
    - file:knowledge-writing
    - page:topic-page
evidence:
  - kind: file-path-convention
    source_path: src/lib/renderTopicMath.ts
confidence: high
---

# file:render-topic-math

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/renderTopicMath.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-archive-fundamentals]] | high | static-import @ src/data/archiveFundamentals.ts |
| in | imports | [[file-knowledge-writing]] | high | static-import @ src/lib/knowledgeWriting.ts |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
