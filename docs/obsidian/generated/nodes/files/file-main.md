---
id: file:main
type: file
status: active
source_path: src/main.tsx
source_kind: github-repo
generated_from:
  - git-ls-files
  - curated-core-file-list
relations:
  outgoing:
    - file:app
    - file:theme
  incoming:
    - none
evidence:
  - kind: static-import
    source_path: src/main.tsx
    detail: "./App.tsx"
  - kind: static-import
    source_path: src/main.tsx
    detail: "./lib/theme.tsx"
confidence: high
---

# file:main

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/main.tsx`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-app]] | high | static-import @ src/main.tsx |
| out | imports | [[file-theme]] | high | static-import @ src/main.tsx |
