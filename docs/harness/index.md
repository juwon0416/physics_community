# Harness Index

This repository uses a harness-engineering style: make agent work legible, bounded, verifiable, and recoverable inside the repo. The short `AGENTS.md` is the table of contents; detailed operating knowledge lives in docs, skills, scripts, and logs.

Primary reference: OpenAI, "Harness engineering: leveraging Codex in an agent-first world" at `https://openai.com/index/harness-engineering/`.

## Harness Layers

- Entry map: `AGENTS.md`
- Reusable procedures: `.codex/skills/`
- Agent role specs: `.codex/agents/`
- Project knowledge: `docs/`
- Verification gates: `docs/harness/verification.md`
- Experience memory: `docs/harness/trial-and-error-log.md`
- Stable ID catalog: `docs/harness/system-catalog.md`
- Reference rules: `docs/harness/reference-rules.md`
- Machine-readable site/code graph: `docs/registry/site-code-graph.json`
- Obsidian generated view: `docs/obsidian/generated/**`

## Operating Principle

Give future agents a map, not a giant manual. Add only the context needed for repeatable decisions, and promote repeated mistakes into skills or mechanical checks.

## Skill Map

- `knowledge-reconstruction` owns canonical graph, node docs, provenance, and argument graph workflows.
- `website-content-authoring` owns Quill HTML, KaTeX, source-to-topic imports, and topic writing.
- `graph-data-stewardship` owns Supabase tables, schema migrations, graph scopes, and MCP write paths.
- `frontend-site-implementation` owns React/Vite UI, routing, graph views, editor UI, and browser-visible behavior.
- `harness-memory` owns the learning ledger and guardrail promotion loop.
- `obsidian-site-code-registry` owns repo extraction, graph manifest rendering, Obsidian generated views, and registry validation.

## Maintenance Rule

When an agent struggles, do not just retry. Ask what capability, context, validation, or constraint was missing, then encode the fix in the smallest durable place:

1. Log the lesson.
2. Update the relevant skill.
3. Add a checklist or verification step.
4. Add mechanical enforcement only when the invariant is important and cheap enough to maintain.
