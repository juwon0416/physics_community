---
id: component:file-ontology-canvas
type: component
status: active
source_path: src/components/graph/FileOntologyCanvas.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:cn
  incoming:
    - page:graph-overview-page
evidence:
  - kind: static-import
    source_path: src/components/graph/FileOntologyCanvas.tsx
    detail: "../../lib/cn"
confidence: high
---

# component:file-ontology-canvas

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/graph/FileOntologyCanvas.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-cn]] | high | static-import @ src/components/graph/FileOntologyCanvas.tsx |
| in | imports | [[page-graph-overview-page]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
