---
id: page:topic-page
type: page
status: active
source_path: src/pages/TopicPage.tsx
source_kind: react-page
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:archive-fundamentals
    - file:archive-schema
    - file:cn
    - file:graph-model
    - file:render-topic-math
    - file:seed
    - file:storage
    - file:theme
  incoming:
    - file:app
    - route:topic-topic-slug
evidence:
  - kind: static-import
    source_path: src/pages/TopicPage.tsx
    detail: "../data/archiveFundamentals"
  - kind: static-import
    source_path: src/pages/TopicPage.tsx
    detail: "../lib/archiveSchema"
  - kind: static-import
    source_path: src/pages/TopicPage.tsx
    detail: "../lib/cn"
  - kind: static-import
    source_path: src/pages/TopicPage.tsx
    detail: "../lib/graphModel"
  - kind: static-import
    source_path: src/pages/TopicPage.tsx
    detail: "../lib/renderTopicMath"
confidence: high
---

# page:topic-page

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `page`
- Status: `active`
- Source path: `src/pages/TopicPage.tsx`
- Source kind: `react-page`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-archive-fundamentals]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-archive-schema]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-cn]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-graph-model]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-render-topic-math]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-seed]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-storage]] | high | static-import @ src/pages/TopicPage.tsx |
| out | imports | [[file-theme]] | high | static-import @ src/pages/TopicPage.tsx |
| in | imports | [[file-app]] | high | static-import @ src/App.tsx |
| in | renders | [[route-topic-topic-slug]] | high | route-definition @ src/App.tsx |
