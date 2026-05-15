# Design Decisions

## Generated Registry Separation

`docs/obsidian/generated/**` is rendered from `docs/registry/site-code-graph.json` and should not be manually edited.

## Evidence-First Relations

Relations in the graph manifest require evidence such as static imports, route definitions, API handler paths, Supabase queries, SQL schema files, migrations, config files, or explicit curated notes.

## Node Selection

The registry intentionally node-izes structural files and agent-critical files, not every file in the repository. Full file coverage belongs in `code-structure.md` and the manifest file index.
