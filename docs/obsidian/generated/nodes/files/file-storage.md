---
id: file:storage
type: file
status: active
source_path: src/data/storage.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:archive-fundamentals
    - file:archive-schema
    - file:backlinks
    - file:concepts
    - file:graph-model
    - file:graph-spheres
    - file:seed
    - file:supabase
    - file:topic-content-overrides
    - file:topic-slug
    - table:fields
    - table:graph-edges
    - table:graph-nodes
    - table:questions
    - table:topic-sections
    - table:topics
  incoming:
    - component:directory-structure-manager
    - component:image-upload
    - file:knowledge-pipeline
    - page:timeline-page
    - page:topic-page
evidence:
  - kind: static-import
    source_path: src/data/storage.ts
    detail: "./archiveFundamentals"
  - kind: static-import
    source_path: src/data/storage.ts
    detail: "../lib/archiveSchema"
  - kind: static-import
    source_path: src/data/storage.ts
    detail: "../lib/backlinks"
  - kind: static-import
    source_path: src/data/storage.ts
    detail: "../lib/concepts"
  - kind: static-import
    source_path: src/data/storage.ts
    detail: "../lib/graphModel"
confidence: high
---

# file:storage

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/data/storage.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-archive-fundamentals]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-archive-schema]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-backlinks]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-concepts]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-graph-model]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-graph-spheres]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-seed]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-supabase]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-topic-content-overrides]] | high | static-import @ src/data/storage.ts |
| out | imports | [[file-topic-slug]] | high | static-import @ src/data/storage.ts |
| out | queries | [[table-fields]] | high | supabase-query @ src/data/storage.ts |
| out | queries | [[table-graph-edges]] | high | supabase-query @ src/data/storage.ts |
| out | queries | [[table-graph-nodes]] | high | supabase-query @ src/data/storage.ts |
| out | queries | [[table-questions]] | high | supabase-query @ src/data/storage.ts |
| out | queries | [[table-topic-sections]] | high | supabase-query @ src/data/storage.ts |
| out | queries | [[table-topics]] | high | supabase-query @ src/data/storage.ts |
| in | imports | [[component-directory-structure-manager]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| in | imports | [[component-image-upload]] | high | static-import @ src/components/ui/ImageUpload.tsx |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[page-timeline-page]] | high | static-import @ src/pages/TimelinePage.tsx |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
