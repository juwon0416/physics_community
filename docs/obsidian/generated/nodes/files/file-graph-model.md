---
id: file:graph-model
type: file
status: active
source_path: src/lib/graphModel.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:archive-fundamentals
    - file:archive-schema
    - file:backlinks
    - file:graph-spheres
    - file:seed
    - file:supabase
    - file:topic-content-overrides
    - file:topic-slug
    - table:ontology-edges
    - table:ontology-nodes
    - table:ontology-papers
  incoming:
    - component:directory-structure-manager
    - component:knowledge-import-manager
    - component:ontology-graph-view
    - file:archive-fundamentals
    - file:concepts
    - file:graph-layouts
    - file:graph-spheres
    - file:knowledge-pipeline
    - file:storage
    - page:graph-overview-page
    - page:topic-page
evidence:
  - kind: static-import
    source_path: src/lib/graphModel.ts
    detail: "../data/archiveFundamentals"
  - kind: static-import
    source_path: src/lib/graphModel.ts
    detail: "./archiveSchema"
  - kind: static-import
    source_path: src/lib/graphModel.ts
    detail: "./backlinks"
  - kind: static-import
    source_path: src/lib/graphModel.ts
    detail: "./graphSpheres"
  - kind: static-import
    source_path: src/lib/graphModel.ts
    detail: "../data/seed"
confidence: high
---

# file:graph-model

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/graphModel.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-archive-fundamentals]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-archive-schema]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-backlinks]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-graph-spheres]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-seed]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-topic-content-overrides]] | high | static-import @ src/lib/graphModel.ts |
| out | imports | [[file-topic-slug]] | high | static-import @ src/lib/graphModel.ts |
| out | queries | [[table-ontology-edges]] | high | supabase-query @ src/lib/graphModel.ts |
| out | queries | [[table-ontology-nodes]] | high | supabase-query @ src/lib/graphModel.ts |
| out | queries | [[table-ontology-papers]] | high | supabase-query @ src/lib/graphModel.ts |
| in | imports | [[component-directory-structure-manager]] | high | static-import @ src/components/admin/DirectoryStructureManager.tsx |
| in | imports | [[component-knowledge-import-manager]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| in | imports | [[component-ontology-graph-view]] | high | static-import @ src/components/graph/OntologyGraphView.tsx |
| in | imports | [[file-archive-fundamentals]] | high | static-import @ src/data/archiveFundamentals.ts |
| in | imports | [[file-concepts]] | high | static-import @ src/lib/concepts.ts |
| in | imports | [[file-graph-layouts]] | high | static-import @ src/lib/graphLayouts.ts |
| in | imports | [[file-graph-spheres]] | high | static-import @ src/lib/graphSpheres.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
| in | imports | [[page-graph-overview-page]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| in | imports | [[page-topic-page]] | high | static-import @ src/pages/TopicPage.tsx |
