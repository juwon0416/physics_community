---
id: component:ontology-graph-view
type: component
status: active
source_path: src/components/graph/OntologyGraphView.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:graph-model
    - file:theme
  incoming:
    - page:graph-overview-page
evidence:
  - kind: static-import
    source_path: src/components/graph/OntologyGraphView.tsx
    detail: "../../lib/graphModel"
  - kind: static-import
    source_path: src/components/graph/OntologyGraphView.tsx
    detail: "../../lib/theme"
confidence: high
---

# component:ontology-graph-view

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/graph/OntologyGraphView.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-graph-model]] | high | static-import @ src/components/graph/OntologyGraphView.tsx |
| out | imports | [[file-theme]] | high | static-import @ src/components/graph/OntologyGraphView.tsx |
| in | imports | [[page-graph-overview-page]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
