# Registry Contract

The registry has two surfaces:

- `docs/registry/site-code-graph.json` is the machine-readable source for generated views.
- `docs/obsidian/generated/**` is the generated Obsidian projection and should not contain manual interpretation.

Every active node must have an existing `source_path`.

Every edge must have at least one evidence object whose `kind` is one of:

- `static-import`
- `dynamic-import`
- `route-definition`
- `file-path-convention`
- `api-handler-path`
- `supabase-query`
- `sql-schema`
- `migration`
- `config`
- `manual-curated-note`
