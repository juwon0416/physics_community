---
id: file:cn
type: file
status: active
source_path: src/lib/cn.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - import-graph
relations:
  outgoing:
    - none
  incoming:
    - component:button
    - component:dialog
    - component:file-ontology-canvas
    - component:image-upload
    - component:input
    - component:navbar
    - page:home
    - page:topic-page
evidence:
  - kind: file-path-convention
    source_path: src/lib/cn.ts
confidence: high
---

# file:cn

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/cn.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[component-button]] | high | static-import @ src/components/ui/Button.tsx |
| in | imports | [[component-dialog]] | high | static-import @ src/components/ui/Dialog.tsx |
| in | imports | [[component-file-ontology-canvas]] | high | static-import @ src/components/graph/FileOntologyCanvas.tsx |
| in | imports | [[component-image-upload]] | high | static-import @ src/components/ui/ImageUpload.tsx |
| in | imports | [[component-input]] | high | static-import @ src/components/ui/Input.tsx |
| in | imports | [[component-navbar]] | high | static-import @ src/components/layout/Navbar.tsx |
| in | imports | [[page-home]] | high | static-import @ src/pages/Home.tsx |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
