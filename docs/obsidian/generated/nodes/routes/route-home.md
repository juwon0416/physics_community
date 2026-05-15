---
id: route:home
type: route
status: active
source_path: src/App.tsx
source_kind: route-definition
generated_from:
  - git-ls-files
  - route-definition
relations:
  outgoing:
    - page:home
  incoming:
    - none
evidence:
  - kind: route-definition
    source_path: src/App.tsx
    detail: "<Route index element={<Home />"
confidence: high
---

# route:home

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `route`
- Status: `active`
- Source path: `src/App.tsx`
- Source kind: `route-definition`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | renders | [[page-home]] | high | route-definition @ src/App.tsx |
