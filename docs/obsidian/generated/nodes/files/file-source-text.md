---
id: file:source-text
type: file
status: active
source_path: src/lib/sourceText.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:knowledge-pipeline
evidence:
  - kind: file-path-convention
    source_path: src/lib/sourceText.ts
confidence: high
---

# file:source-text

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/sourceText.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
