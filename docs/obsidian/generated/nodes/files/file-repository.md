---
id: file:repository
type: file
status: active
source_path: mcp-server/src/repository.ts
source_kind: mcp-server-source
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:src-supabase
    - table:graph-edges
    - table:graph-nodes
    - table:topic-sections
    - table:topics
  incoming:
    - file:index
evidence:
  - kind: static-import
    source_path: mcp-server/src/repository.ts
    detail: "./supabase.js"
  - kind: supabase-query
    source_path: mcp-server/src/repository.ts
    detail: ".from('graph_edges')"
  - kind: supabase-query
    source_path: mcp-server/src/repository.ts
    detail: ".from('graph_nodes')"
  - kind: supabase-query
    source_path: mcp-server/src/repository.ts
    detail: ".from('topic_sections')"
  - kind: supabase-query
    source_path: mcp-server/src/repository.ts
    detail: ".from('topics')"
confidence: high
---

# file:repository

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `mcp-server/src/repository.ts`
- Source kind: `mcp-server-source`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-src-supabase]] | high | static-import @ mcp-server/src/repository.ts |
| out | queries | [[table-graph-edges]] | high | supabase-query @ mcp-server/src/repository.ts |
| out | queries | [[table-graph-nodes]] | high | supabase-query @ mcp-server/src/repository.ts |
| out | queries | [[table-topic-sections]] | high | supabase-query @ mcp-server/src/repository.ts |
| out | queries | [[table-topics]] | high | supabase-query @ mcp-server/src/repository.ts |
| in | imports | [[file-index]] | high | static-import @ mcp-server/src/index.ts |
