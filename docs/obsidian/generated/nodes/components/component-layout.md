---
id: component:layout
type: component
status: active
source_path: src/components/layout/Layout.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - component:navbar
  incoming:
    - file:app
    - route:root-layout
evidence:
  - kind: static-import
    source_path: src/components/layout/Layout.tsx
    detail: "./Navbar"
confidence: high
---

# component:layout

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/layout/Layout.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-navbar]] | high | static-import @ src/components/layout/Layout.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-root-layout]] | high | route-definition @ src/App.tsx |
