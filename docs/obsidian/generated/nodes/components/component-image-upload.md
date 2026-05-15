---
id: component:image-upload
type: component
status: active
source_path: src/components/ui/ImageUpload.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - component:button
    - file:cn
    - file:storage
  incoming:
    - page:timeline-page
evidence:
  - kind: static-import
    source_path: src/components/ui/ImageUpload.tsx
    detail: "./Button"
  - kind: static-import
    source_path: src/components/ui/ImageUpload.tsx
    detail: "../../lib/cn"
  - kind: static-import
    source_path: src/components/ui/ImageUpload.tsx
    detail: "../../data/storage"
confidence: high
---

# component:image-upload

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/ui/ImageUpload.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-button]] | high | static-import @ src/components/ui/ImageUpload.tsx |
| out | imports | [[file-cn]] | high | static-import @ src/components/ui/ImageUpload.tsx |
| out | imports | [[file-storage]] | high | static-import @ src/components/ui/ImageUpload.tsx |
| in | imports | [[page-timeline-page]] | high | static-import @ src/pages/TimelinePage.tsx |
