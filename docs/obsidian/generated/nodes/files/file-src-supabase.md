---
id: file:src-supabase
type: file
status: active
source_path: mcp-server/src/supabase.ts
source_kind: mcp-server-source
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - none
  incoming:
    - file:repository
evidence:
  - kind: file-path-convention
    source_path: mcp-server/src/supabase.ts
confidence: high
---

# file:src-supabase

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `mcp-server/src/supabase.ts`
- Source kind: `mcp-server-source`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| in | imports | [[file-repository]] | high | static-import @ mcp-server/src/repository.ts |
