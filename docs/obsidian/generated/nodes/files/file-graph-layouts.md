---
id: file:graph-layouts
type: file
status: active
source_path: src/lib/graphLayouts.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:graph-model
  incoming:
    - none
evidence:
  - kind: static-import
    source_path: src/lib/graphLayouts.ts
    detail: "./graphModel"
confidence: high
---

# file:graph-layouts

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/graphLayouts.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/lib/graphLayouts.ts |
