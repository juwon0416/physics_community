# DB and MCP Rules

## Environment

- Use `MCP_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` for write-capable MCP flows.
- Do not print environment variable values.
- If only anon keys are available, expect RLS to block graph/topic writes.

## Tables and Scopes

- Legacy scope uses `topics`, `graph_nodes`, and `graph_edges`.
- Archive scope uses `archive_topics`, `archive_graph_nodes`, and `archive_graph_edges`.
- Ontology payloads use `ontology_papers`, `ontology_nodes`, and `ontology_edges`.

## Safer Change Pattern

1. Read current schema or table access path.
2. Make additive or idempotent changes.
3. Preserve ids and slugs.
4. Validate read fallback.
5. Validate write path only with an authorized key.

## Known Risk

`saveGraphData` deletes and reinserts graph rows. Treat that as a destructive synchronization path and do not invoke it casually.
