---
id: file:file-ontology
type: file
status: active
source_path: src/lib/fileOntology.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - import-graph
relations:
  outgoing:
    - file:supabase
  incoming:
    - component:file-ontology-canvas
evidence:
  - kind: static-import
    source_path: src/lib/fileOntology.ts
    detail: "./supabase"
confidence: high
---

# file:file-ontology

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/fileOntology.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/fileOntology.ts |
| in | imports | [[component-file-ontology-canvas]] | high | static-import @ src/components/graph/FileOntologyCanvas.tsx |
