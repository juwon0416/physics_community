---
id: file:graph-spheres
type: file
status: active
source_path: src/lib/graphSpheres.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:graph-model
  incoming:
    - file:graph-model
    - file:storage
evidence:
  - kind: static-import
    source_path: src/lib/graphSpheres.ts
    detail: "./graphModel"
confidence: high
---

# file:graph-spheres

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/graphSpheres.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/lib/graphSpheres.ts |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
