---
id: file:theme
type: file
status: active
source_path: src/lib/theme.tsx
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - component:navbar
    - component:ontology-graph-view
    - file:main
    - page:home
    - page:topic-page
evidence:
  - kind: file-path-convention
    source_path: src/lib/theme.tsx
confidence: high
---

# file:theme

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/theme.tsx`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[component-navbar]] | high | static-import @ src/components/layout/Navbar.tsx |
| in | imports | [[component-ontology-graph-view]] | high | static-import @ src/components/graph/OntologyGraphView.tsx |
| in | imports | [[file-main]] | high | static-import @ src/main.tsx |
| in | imports | [[page-home]] | high | static-import @ src/pages/Home.tsx |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
