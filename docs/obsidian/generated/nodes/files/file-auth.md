---
id: file:auth
type: file
status: active
source_path: src/lib/auth.ts
source_kind: github-repo
generated_from:
  - git-ls-files
  - import-graph
relations:
  outgoing:
    - file:supabase
    - table:profiles
  incoming:
    - component:login-dialog
    - page:graph-overview-page
    - page:timeline-page
evidence:
  - kind: static-import
    source_path: src/lib/auth.ts
    detail: "./supabase"
  - kind: supabase-query
    source_path: src/lib/auth.ts
    detail: ".from('profiles')"
confidence: high
---

# file:auth

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `file`
- Status: `active`
- Source path: `src/lib/auth.ts`
- Source kind: `github-repo`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | imports | [[file-supabase]] | high | static-import @ src/lib/auth.ts |
| out | queries | [[table-profiles]] | high | supabase-query @ src/lib/auth.ts |
| in | imports | [[component-login-dialog]] | high | static-import @ src/components/auth/LoginDialog.tsx |
| in | imports | [[page-graph-overview-page]] | high | static-import @ src/pages/GraphOverviewPage.tsx |
| in | imports | [[page-timeline-page]] | high | static-import @ src/pages/TimelinePage.tsx |
