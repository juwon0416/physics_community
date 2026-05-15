---
id: file:backlinks
type: file
status: active
source_path: src/lib/backlinks.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:graph-model
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: src/lib/backlinks.ts
confidence: high
---

# file:backlinks

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/backlinks.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
