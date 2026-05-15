---
id: file:seed
type: file
status: active
source_path: src/data/seed.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - component:directory-structure-manager
    - component:navbar
    - file:graph-model
    - file:knowledge-pipeline
    - file:storage
    - page:timeline-page
    - page:topic-page
evidence:
  - kind: file-path-convention
    source_path: src/data/seed.ts
confidence: high
---

# file:seed

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/data/seed.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[component-directory-structure-manager]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| in | imports | [[component-navbar]] | high | static-import @ src/components/layout/Navbar.tsx |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
| in | imports | [[page-timeline-page]] | high | static-import @ src/pages/TimelinePage.tsx |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
