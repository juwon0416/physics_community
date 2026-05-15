---
id: api:author-topic
type: api
status: active
source_path: mcp-server/src/index.ts
source_kind: mcp-prompt
generated_from:
  - git-ls-files
  - api-handler-path
relations:
  outgoing:
    - file:index
  incoming:
    - none
evidence:
  - kind: api-handler-path
    source_path: mcp-server/src/index.ts
    detail: "server.registerPrompt('author_topic')"
confidence: high
---

# api:author-topic

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `api`
- Status: `active`
- Source path: `mcp-server/src/index.ts`
- Source kind: `mcp-prompt`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | defined-in | [[file-index]] | high | api-handler-path @ mcp-server/src/index.ts |
