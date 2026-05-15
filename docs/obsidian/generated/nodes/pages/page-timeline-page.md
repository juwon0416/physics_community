---
id: page:timeline-page
type: page
status: active
source_path: src/pages/TimelinePage.tsx
source_kind: react-page
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - component:image-upload
    - file:auth
    - file:seed
    - file:storage
  incoming:
    - file:app
    - route:field-field-slug
evidence:
  - kind: static-import
    source_path: src/pages/TimelinePage.tsx
    detail: "../components/ui/ImageUpload"
  - kind: static-import
    source_path: src/pages/TimelinePage.tsx
    detail: "../lib/auth"
  - kind: static-import
    source_path: src/pages/TimelinePage.tsx
    detail: "../data/seed"
  - kind: static-import
    source_path: src/pages/TimelinePage.tsx
    detail: "../data/storage"
confidence: high
---

# page:timeline-page

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `page`
- Status: `active`
- Source path: `src/pages/TimelinePage.tsx`
- Source kind: `react-page`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-image-upload]] | high | static-import @ src/pages/TimelinePage.tsx |
| out | imports | [[file-auth]] | high | static-import @ src/pages/TimelinePage.tsx |
| out | imports | [[file-seed]] | high | static-import @ src/pages/TimelinePage.tsx |
| out | imports | [[file-storage]] | high | static-import @ src/pages/TimelinePage.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-field-field-slug]] | high | route-definition @ src/App.tsx |
