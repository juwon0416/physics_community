---
id: file:app
type: file
status: active
source_path: src/App.tsx
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - component:layout
    - page:graph-overview-page
    - page:home
    - page:timeline-page
    - page:topic-page
  incoming:
    - file:main
evidence:
  - kind: static-import
    source_path: src/App.tsx
    detail: "./components/layout/Layout"
  - kind: static-import
    source_path: src/App.tsx
    detail: "./pages/GraphOverviewPage"
  - kind: static-import
    source_path: src/App.tsx
    detail: "./pages/Home"
  - kind: static-import
    source_path: src/App.tsx
    detail: "./pages/TimelinePage"
  - kind: static-import
    source_path: src/App.tsx
    detail: "./pages/TopicPage"
confidence: high
---

# file:app

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/App.tsx`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[component-layout]] | high | static-import @ src/App.tsx |
| out | imports | [[page-graph-overview-page]] | high | static-import @ src/App.tsx |
| out | imports | [[page-home]] | high | static-import @ src/App.tsx |
| out | imports | [[page-timeline-page]] | high | static-import @ src/App.tsx |
| out | imports | [[page-topic-page]] | high | static-import @ src/App.tsx |
| in | imports | [[file-main]] | high | static-import @ src/main.tsx |
