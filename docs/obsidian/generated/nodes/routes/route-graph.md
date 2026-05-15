---
id: route:graph
type: route
status: active
source_path: src/App.tsx
source_kind: route-definition
generated_from:
  - git-ls-files
  - route-definition
relations:
  outgoing:
    - page:graph-overview-page
  incoming:
    - none
evidence:
  - kind: route-definition
    source_path: src/App.tsx
    detail: "<Route path=\"graph\" element={<GraphOverviewPage />"
confidence: high
---

# route:graph

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `route`
- Status: `active`
- Source path: `src/App.tsx`
- Source kind: `route-definition`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | renders | [[page-graph-overview-page]] | high | route-definition @ src/App.tsx |
