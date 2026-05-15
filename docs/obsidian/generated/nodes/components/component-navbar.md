---
id: component:navbar
type: component
status: active
source_path: src/components/layout/Navbar.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - component:login-dialog
    - file:cn
    - file:seed
    - file:theme
  incoming:
    - component:layout
evidence:
  - kind: static-import
    source_path: src/components/layout/Navbar.tsx
    detail: "../auth/LoginDialog"
  - kind: static-import
    source_path: src/components/layout/Navbar.tsx
    detail: "../../lib/cn"
  - kind: static-import
    source_path: src/components/layout/Navbar.tsx
    detail: "../../data/seed"
  - kind: static-import
    source_path: src/components/layout/Navbar.tsx
    detail: "../../lib/theme"
confidence: high
---

# component:navbar

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/layout/Navbar.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-login-dialog]] | high | static-import @ src/components/layout/Navbar.tsx |
| out | imports | [[file-cn]] | high | static-import @ src/components/layout/Navbar.tsx |
| out | imports | [[file-seed]] | high | static-import @ src/components/layout/Navbar.tsx |
| out | imports | [[file-theme]] | high | static-import @ src/components/layout/Navbar.tsx |
| in | imports | [[component-layout]] | high | static-import @ src/components/layout/Layout.tsx |
