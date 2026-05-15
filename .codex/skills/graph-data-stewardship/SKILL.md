---
name: graph-data-stewardship
description: Use when changing graph data behavior, Supabase schemas, SQL migrations, archive or legacy graph scopes, MCP server tools, node and edge persistence, ontology tables, or graph/data fallback behavior.
---

# Graph Data Stewardship

## Overview

Make graph and database changes safely while preserving stable identities, incremental updates, and local fallback behavior.

## Load First

- `README.md` for the active app and MCP overview.
- `mcp-server/README.md` before changing MCP tools or write flows.
- `docs/knowledge_reconstruction_architecture.md` for graph identity and provenance rules.
- `docs/harness/verification.md` for database and MCP checks.
- `references/db-and-mcp-rules.md` for compact safety rules.

## Workflow

1. Determine whether the change touches legacy graph tables, archive graph tables, ontology tables, or static seed fallback.
2. Inspect current table names and scope routing in `src/data/storage.ts` and `src/lib/graphModel.ts`.
3. Preserve node ids, slugs, and edge semantics unless the task is an explicit migration.
4. Prefer idempotent migrations and additive schema changes.
5. Do not print secrets. Check whether service role keys are present without echoing values.
6. If RLS blocks writes, stop retrying anon writes and choose MCP with service role, SQL migration, or static override fallback.
7. Keep graph extraction compatible with topic content headings and inline backlinks.
8. Validate the app build, MCP build, and `npm.cmd run security:check` when behavior crosses the frontend/MCP boundary.
9. After verification, stage and commit schema, MCP, or data-logic changes as a focused Git checkpoint.
10. Push the verified commit before any deployment or release-facing database rollout.
11. Log recurring data-shape or RLS pitfalls with `harness-memory`.

## Guardrails

- Static fallback exists for resilience. Do not remove it casually.
- Archive and legacy scopes may use different table names.
- Concept graph and ontology payloads are attached in `graphModel.ts`; avoid breaking topic nodes that lack ontology rows.
- Bulk delete and rewrite flows are high risk under RLS and should be avoided unless explicitly requested.
- Service role keys must stay in MCP/server runtime environment variables and never move into React, generated docs, or committed `.env*` files.
