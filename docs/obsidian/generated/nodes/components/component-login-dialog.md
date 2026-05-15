---
id: component:login-dialog
type: component
status: active
source_path: src/components/auth/LoginDialog.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:auth
  incoming:
    - component:navbar
evidence:
  - kind: static-import
    source_path: src/components/auth/LoginDialog.tsx
    detail: "../../lib/auth"
confidence: high
---

# component:login-dialog

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/auth/LoginDialog.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-auth]] | high | static-import @ src/components/auth/LoginDialog.tsx |
| in | imports | [[component-navbar]] | high | static-import @ src/components/layout/Navbar.tsx |
