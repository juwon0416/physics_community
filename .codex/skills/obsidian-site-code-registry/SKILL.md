---
name: obsidian-site-code-registry
description: Use when extracting the real repository structure into docs/registry/site-code-graph.json, rendering Obsidian-compatible generated structure notes, or validating route, component, API, DB, config, source path, relation evidence, and registry drift.
id: skill:obsidian-site-code-registry
type: codex-skill
allowed_agents:
  - agent:orchestrator
  - agent:frontend-builder
  - agent:graph-steward
  - agent:harness-keeper
related_workflows:
  - workflow:extract-github-structure
  - workflow:update-site-code-registry
inputs:
  - current repository checkout
  - git tracked file list
  - route definitions
  - component source files
  - API endpoint files
  - database schema and migration files
outputs:
  - docs/registry/site-code-graph.json
  - docs/registry/extraction-manifest.json
  - docs/obsidian/generated/**
  - docs/obsidian/generated/extraction-log.md
verification:
  - check:repo-extraction-success
  - check:site-code-graph-schema-validity
  - check:source-path-validity
  - check:obsidian-link-integrity
  - check:relation-evidence-validity
  - check:registry-drift
---

# Obsidian Site Code Registry

## Overview

Extract the actual repository checkout into a machine-readable site/code graph and render a generated Obsidian view. Treat source files as the source of truth; generated Markdown is a derived artifact.

## Workflow

1. Run `git ls-files` to obtain the tracked file list.
2. Inspect package and config files to identify the framework and build surface.
3. Extract route and page structure from route definitions.
4. Extract component structure from source files.
5. Extract API endpoint structure from MCP/server files.
6. Extract DB schema and migration structure from SQL files.
7. Extract static and dynamic import relations.
8. Generate `docs/registry/site-code-graph.json`.
9. Render `docs/obsidian/generated/**` from the JSON graph.
10. Validate source paths, wikilinks, relation evidence, schema shape, and drift.
11. Stage and commit the registry refresh together with the source-structure change that required it, unless the user explicitly wants a dirty checkpoint.
12. If the refreshed structure is part of a deployment, push the commit before deploying so the generated registry matches the remote commit.
13. Record results and warnings in `docs/obsidian/generated/extraction-log.md`.

## Commands

```powershell
node tools/extraction/generate_site_code_graph.js
node tools/extraction/render_obsidian_registry.js
node tools/validation/validate_site_code_graph.js
node tools/validation/validate_source_paths.js
node tools/validation/validate_obsidian_links.js
node tools/validation/validate_registry_drift.js
```

## Hard Rules

- Do not create an active node for a file that does not exist.
- Allow planned or deprecated nodes only with explicit evidence.
- Do not manually edit `docs/obsidian/generated/**`.
- Put human interpretation in `docs/obsidian/curated/**` or `docs/obsidian/overlays/**`.
- Do not create relations from inference alone.
- Every relation needs evidence such as static import, route definition, API handler path, Supabase query, SQL schema, migration, config, or curated note.
- If evidence is unclear, lower relation confidence or record an extraction warning.
- Do not node-ize every file. Prefer routes, pages, major components, APIs, DB tables, schemas/migrations, graph/editor modules, content pipeline modules, shared modules, and files agents frequently confuse.
- Do not deploy repo-structure changes from an unpushed working tree when the generated registry is part of the release artifact.
