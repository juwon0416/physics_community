---
id: component:directory-structure-manager
type: component
status: active
source_path: src/components/admin/DirectoryStructureManager.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:graph-model
    - file:seed
    - file:storage
    - file:topic-slug
  incoming:
    - none
evidence:
  - kind: static-import
    source_path: src/components/admin/DirectoryStructureManager.tsx
    detail: "../../lib/graphModel"
  - kind: static-import
    source_path: src/components/admin/DirectoryStructureManager.tsx
    detail: "../../data/seed"
  - kind: static-import
    source_path: src/components/admin/DirectoryStructureManager.tsx
    detail: "../../data/storage"
  - kind: static-import
    source_path: src/components/admin/DirectoryStructureManager.tsx
    detail: "../../lib/topicSlug"
confidence: high
---

# component:directory-structure-manager

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/admin/DirectoryStructureManager.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| out | imports | [[file-seed]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| out | imports | [[file-storage]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| out | imports | [[file-topic-slug]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
