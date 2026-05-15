---
id: file:index
type: file
status: active
source_path: mcp-server/src/index.ts
source_kind: mcp-server-source
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:repository
  incoming:
    - api:author-topic
    - api:create-concept-node
    - api:delete-graph-edge
    - api:get-graph-snapshot
    - api:get-topic
    - api:graph-overview
    - api:list-topics
    - api:upsert-graph-edge
    - api:upsert-section
    - api:upsert-topic
    - api:write-topic-draft
evidence:
  - kind: static-import
    source_path: mcp-server/src/index.ts
    detail: "./repository.js"
confidence: high
---

# file:index

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `mcp-server/src/index.ts`
- Source kind: `mcp-server-source`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-repository]] | high | static-import @ mcp-server/src/index.ts |
| in | defined-in | [[api-author-topic]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-create-concept-node]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-delete-graph-edge]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-get-graph-snapshot]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-get-topic]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-graph-overview]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-list-topics]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-upsert-graph-edge]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-upsert-section]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-upsert-topic]] | high | api-handler-path @ mcp-server/src/index.ts |
| in | defined-in | [[api-write-topic-draft]] | high | api-handler-path @ mcp-server/src/index.ts |
