---
id: file:supabase
type: file
status: active
source_path: src/lib/supabase.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:archive-schema
    - file:auth
    - file:concepts
    - file:file-ontology
    - file:graph-model
    - file:knowledge-pipeline
    - file:knowledge-schema
    - file:storage
evidence:
  - kind: file-path-convention
    source_path: src/lib/supabase.ts
confidence: high
---

# file:supabase

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/supabase.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-archive-schema]] | high | static-import @ src/lib/archiveSchema.ts |
| in | imports | [[file-auth]] | high | static-import @ src/lib/auth.ts |
| in | imports | [[file-concepts]] | high | static-import @ src/lib/concepts.ts |
| in | imports | [[file-file-ontology]] | high | static-import @ src/lib/fileOntology.ts |
| in | imports | [[file-graph-model]] | high | static-import @ src/lib/graphModel.ts |
| in | imports | [[file-knowledge-pipeline]] | high | static-import @ src/lib/knowledgePipeline.ts |
| in | imports | [[file-knowledge-schema]] | high | static-import @ src/lib/knowledgeSchema.ts |
| in | imports | [[file-storage]] | high | static-import @ src/data/storage.ts |
