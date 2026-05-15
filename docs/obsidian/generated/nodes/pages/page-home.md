---
id: page:home
type: page
status: active
source_path: src/pages/Home.tsx
source_kind: react-page
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:cn
    - file:theme
  incoming:
    - file:app
    - route:home
evidence:
  - kind: static-import
    source_path: src/pages/Home.tsx
    detail: "../lib/cn"
  - kind: static-import
    source_path: src/pages/Home.tsx
    detail: "../lib/theme"
confidence: high
---

# page:home

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `page`
- Status: `active`
- Source path: `src/pages/Home.tsx`
- Source kind: `react-page`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-cn]] | high | static-import @ src/pages/Home.tsx |
| out | imports | [[file-theme]] | high | static-import @ src/pages/Home.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-home]] | high | route-definition @ src/App.tsx |
