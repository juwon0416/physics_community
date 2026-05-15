---
id: file:knowledge-taxonomy
type: file
status: active
source_path: src/lib/knowledgeTaxonomy.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:knowledge-pipeline
    - file:knowledge-writing
evidence:
  - kind: file-path-convention
    source_path: src/lib/knowledgeTaxonomy.ts
confidence: high
---

# file:knowledge-taxonomy

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/knowledgeTaxonomy.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-knowledge-writing]] | high | static-import @ src/lib/knowledgeWriting.ts |
