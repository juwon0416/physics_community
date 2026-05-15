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
    - component:file-ontology-canvas
    - file:auth
  incoming:
    - file:app
    - route:graph
evidence:
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../components/graph/FileOntologyCanvas"
  - kind: static-import
    source_path: src/pages/GraphOverviewPage.tsx
    detail: "../lib/auth"
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
| out | imports | [[component-file-ontology-canvas]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| out | imports | [[file-auth]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-graph]] | high | route-definition @ src/App.tsx |
