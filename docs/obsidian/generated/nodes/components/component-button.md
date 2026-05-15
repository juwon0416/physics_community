---
id: component:button
type: component
status: active
source_path: src/components/ui/Button.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:cn
  incoming:
    - component:image-upload
evidence:
  - kind: static-import
    source_path: src/components/ui/Button.tsx
    detail: "../../lib/cn"
confidence: high
---

# component:button

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/ui/Button.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-cn]] | high | static-import @ src/components/ui/Button.tsx |
| in | imports | [[component-image-upload]] | high | static-import @ src/components/ui/ImageUpload.tsx |
