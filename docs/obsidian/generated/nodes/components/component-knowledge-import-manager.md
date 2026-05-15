---
id: component:knowledge-import-manager
type: component
status: active
source_path: src/components/admin/KnowledgeImportManager.tsx
source_kind: react-component
generated_from:
  - git-ls-files
  - file-path-convention
relations:
  outgoing:
    - file:archive-schema
    - file:graph-model
    - file:knowledge-pipeline
    - file:knowledge-schema
  incoming:
    - page:graph-overview-page
evidence:
  - kind: static-import
    source_path: src/components/admin/KnowledgeImportManager.tsx
    detail: "../../lib/archiveSchema"
  - kind: static-import
    source_path: src/components/admin/KnowledgeImportManager.tsx
    detail: "../../lib/graphModel"
  - kind: static-import
    source_path: src/components/admin/KnowledgeImportManager.tsx
    detail: "../../lib/knowledgePipeline"
  - kind: static-import
    source_path: src/components/admin/KnowledgeImportManager.tsx
    detail: "../../lib/knowledgeSchema"
confidence: high
---

# component:knowledge-import-manager

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `component`
- Status: `active`
- Source path: `src/components/admin/KnowledgeImportManager.tsx`
- Source kind: `react-component`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-archive-schema]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| out | imports | [[file-graph-model]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| out | imports | [[file-knowledge-pipeline]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| out | imports | [[file-knowledge-schema]] | high | static-import @ src/components/admin/KnowledgeImportManager.tsx |
| in | imports | [[page-graph-overview-page]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
