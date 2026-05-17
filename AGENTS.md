# AGENTS.md

## Purpose

Physics Community is a Vite + React + TypeScript site for graph-native physics study. It combines a public learning UI, Quill/KaTeX topic content, Supabase-backed graph data, a local MCP server, and a persistent knowledge reconstruction pipeline.

Treat this file as the project map, not the encyclopedia. Keep detailed procedures in `docs/` and project-local skills under `.codex/skills/`.

## Harness Operating Loop

1. Identify the user goal, ambiguity, success criteria, and likely files before coding.
2. Load only the relevant project skill from `.codex/skills/<skill>/SKILL.md`.
3. Inspect the real code and docs before changing behavior.
4. If an implementation choice is unclear, pause and report `명확하지 않은 부분 -> 질문` before changing behavior.
5. Make the smallest surgical change that satisfies the goal.
6. Verify with the narrowest useful checks, then broaden only if risk justifies it.
7. Stage, commit, and push meaningful completed work unless the user explicitly asks not to.
8. If a deployment is requested, deploy from a committed and pushed state so the deployed artifact maps to Git history.
9. If a failure, workaround, or surprising constraint appears, update `docs/harness/trial-and-error-log.md` through the `harness-memory` skill.

## Project Map

- `src/` - React app, routes, graph views, editor, UI, data access, and graph model logic.
- `public/` - runtime image assets used by the site.
- `database/sql/` - Supabase schemas and migrations.
- `mcp-server/` - MCP tools for topics, drafts, concept nodes, and graph edges.
- `docs/` - system-of-record project knowledge and task references.
- `docs/harness/` - agent harness map, verification matrix, and learning ledger.
- `.codex/agents/` - role definitions for the knowledge reconstruction pipeline.
- `.codex/skills/` - reusable agent procedures for this repository.
- `docs/registry/site-code-graph.json` - machine-readable graph manifest extracted from the repo checkout.
- `docs/obsidian/generated/` - generated Obsidian views rendered from the graph manifest. Do not edit directly.
- `docs/obsidian/curated/` and `docs/obsidian/overlays/` - human-written interpretation and annotations.
- `trash/` and archive folders - retired or reference material. Do not edit unless the task explicitly targets them.

## Skill Router

Read the matching skill before substantial work:

- `.codex/skills/knowledge-reconstruction/SKILL.md` - source uploads, canonical physics graph expansion, node documents, provenance, argument graph work.
- `.codex/skills/website-content-authoring/SKILL.md` - Quill HTML, KaTeX formulas, topic imports, `TOPIC_CONTENT_OVERRIDES`, editor-ready content.
- `.codex/skills/graph-data-stewardship/SKILL.md` - Supabase graph tables, SQL migrations, MCP data tools, graph model persistence.
- `.codex/skills/frontend-site-implementation/SKILL.md` - React/Vite UI, routes, graph views, editor UI, styling, frontend validation.
- `.codex/skills/harness-memory/SKILL.md` - failure logs, decision logs, recurring mistakes, guardrail updates.
- `.codex/skills/obsidian-site-code-registry/SKILL.md` - repo extraction, site-code graph manifest, Obsidian generated registry, and registry validation.
- `.codex/skills/security-harness/SKILL.md` - secret handling, tracked env files, credential hygiene, and deployment security gates.

If multiple skills apply, start with the one that owns the artifact being changed. Use `harness-memory` when learning something that should affect future runs.

## Core Invariants

- Repository knowledge is the system of record. Do not rely on hidden chat context for durable project rules.
- Prefer maps plus progressive disclosure over one giant instruction document.
- Git history is part of the system of record. Do not leave completed code or deployable structure changes only in the working tree.
- Preserve stable graph, topic, node, and slug identities unless a task explicitly asks for a migration.
- Extend existing spheres, clusters, and nodes before creating near-duplicates.
- Keep concept graph nodes and source-specific argument graph nodes separate.
- Topic content intended for the website should be Quill-compatible HTML with `ql-formula` KaTeX spans.
- Supabase writes may be blocked by RLS without a service role key. Do not retry anon writes repeatedly.
- Never print secrets from `.env*` or environment variables.
- Never commit `.env*` files except `.env.example`, and keep `.env.example` placeholder-only.
- Service role keys and provider tokens must stay server-side and out of generated client bundles.
- Respect the dirty worktree. Do not revert unrelated user changes.
- Prefer boring, inspectable, repo-local mechanisms over opaque abstractions when they improve agent legibility.
- Visible frontend changes should be implemented as part of the route-level layout and interaction system, not as isolated feature accretion.
- When the user explicitly asks for design-specialist help, use a critique-only design review pass before or alongside frontend implementation.
- Route, component, API, DB, schema, or config changes should refresh and validate the site-code registry.
- Every active registry node needs an existing `source_path`; every relation needs evidence.

## Git And Deploy Hygiene

- After meaningful code, docs, harness, or schema work, create a focused Git commit with a message that explains the intent.
- Before deployment, ensure the intended changes are committed and pushed so the deploy can be traced to a remote commit.
- When a deployment is completed, report the branch, whether the branch was pushed, and the commit used for the deployment.
- Do not mix unrelated work into the same commit unless the user asks for a bulk checkpoint.
- If the worktree contains unrelated user changes, commit only the files that belong to the current task.

## Verification

Use Windows `.cmd` commands when PowerShell script shims may block execution.

- General frontend check: `npm.cmd run build`
- Lint check: `npm.cmd run lint`
- Browser visual check: after visible frontend changes, open the affected local route in Browser when available and compare the actual UI against the requested behavior.
- Dev server: `npm.cmd run dev`
- MCP server check: run `npm.cmd run build` inside `mcp-server/`
- Security check: `npm.cmd run security:check`
- Content import check: validate KaTeX formulas and confirm real `<h2>` section headings.
- Graph/data change check: inspect affected Supabase table/schema assumptions and confirm fallback behavior.
- Before deployment, verify the relevant build and `npm.cmd run security:check`, then commit and push the exact changes being deployed.

If verification cannot be run, report why and state the remaining risk.

## Reporting After Changes

Summarize:

- what changed
- why it changed
- files touched
- verification performed
- git actions performed
- remaining risks or assumptions
