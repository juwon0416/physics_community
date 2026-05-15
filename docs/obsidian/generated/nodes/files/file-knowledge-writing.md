---
id: file:knowledge-writing
type: file
status: active
source_path: src/lib/knowledgeWriting.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:knowledge-taxonomy
    - file:render-topic-math
  incoming:
    - file:knowledge-pipeline
evidence:
  - kind: static-import
    source_path: src/lib/knowledgeWriting.ts
    detail: "./knowledgeTaxonomy"
  - kind: static-import
    source_path: src/lib/knowledgeWriting.ts
    detail: "./renderTopicMath"
confidence: high
---

# file:knowledge-writing

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/knowledgeWriting.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-knowledge-taxonomy]] | high | static-import @ src/lib/knowledgeWriting.ts |
| out | imports | [[file-render-topic-math]] | high | static-import @ src/lib/knowledgeWriting.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
