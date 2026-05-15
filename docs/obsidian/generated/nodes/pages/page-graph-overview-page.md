---
id: page:graph-overview-page
type: page
status: active
source_path: src/pages/GraphOverviewPage.tsx
source_kind: react-page
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - component:directory-structure-manager
    - component:knowledge-import-manager
    - component:ontology-graph-view
    - file:auth
    - file:graph-model
  incoming:
    - file:app
    - route:graph
evidence:
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../components/admin/DirectoryStructureManager"
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../components/admin/KnowledgeImportManager"
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../components/graph/OntologyGraphView"
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../lib/auth"
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../lib/graphModel"
confidence: high
---

# page:graph-overview-page

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `page`
- Status: `active`
- Source path: `src/pages/GraphOverviewPage.tsx`
- Source kind: `react-page`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-directory-structure-manager]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| out | imports | [[component-knowledge-import-manager]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| out | imports | [[component-ontology-graph-view]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| out | imports | [[file-auth]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| out | imports | [[file-graph-model]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-graph]] | high | route-definition @ src/App.tsx |
