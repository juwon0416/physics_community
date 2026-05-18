# Harness Index

This repository uses a harness-engineering style: make agent work legible, bounded, verifiable, and recoverable inside the repo. The short `AGENTS.md` is the table of contents; detailed operating knowledge lives in docs, skills, scripts, and logs.

Primary references:

- OpenAI, "Harness engineering: leveraging Codex in an agent-first world" at `https://openai.com/index/harness-engineering/`.
- Andrei Karpathy-style agent harness framing: the LLM is the reasoning core, but reliable work comes from the surrounding context, tools, memory, evals, and feedback loop encoded in the repository.

## Harness Layers

- Entry map: `AGENTS.md`
- Reusable procedures: `.codex/skills/`
- Agent role specs: `.codex/agents/`
- Project knowledge: `docs/`
- Verification gates: `docs/harness/verification.md`
- Security gates: `docs/harness/security.md`
- Experience memory: `docs/harness/trial-and-error-log.md`
- Stable ID catalog: `docs/harness/system-catalog.md`
- Reference rules: `docs/harness/reference-rules.md`
- Machine-readable site/code graph: `docs/registry/site-code-graph.json`
- Obsidian generated view: `docs/obsidian/generated/**`

## Operating Principle

Give future agents a map, not a giant manual. Add only the context needed for repeatable decisions, and promote repeated mistakes into skills or mechanical checks.

## Clarity Gate

Before implementation, unresolved product or data-shape ambiguity should be surfaced as `명확하지 않은 부분 -> 질문`. Do this especially when a request changes persistence, source-of-truth ownership, routing, database access, or user-visible editing workflows.

## Skill Map

- `knowledge-reconstruction` owns canonical graph, node docs, provenance, and argument graph workflows.
- `website-content-authoring` owns Quill HTML, KaTeX, source-to-topic imports, and topic writing.
- `graph-data-stewardship` owns Supabase tables, schema migrations, graph scopes, and MCP write paths.
- `frontend-site-implementation` owns React/Vite UI, routing, graph views, editor UI, and browser-visible behavior.
- `harness-engineering` owns AGENTS.md routing, project-local skills, Karpathy-style harness workflow, verification gates, and agent scaffolding.
- `harness-memory` owns the learning ledger and guardrail promotion loop.
- `obsidian-site-code-registry` owns repo extraction, graph manifest rendering, Obsidian generated views, and registry validation.
- `security-harness` owns secret handling, tracked env file checks, and deployment security gates.

## Maintenance Rule

When an agent struggles, do not just retry. Ask what capability, context, validation, or constraint was missing, then encode the fix in the smallest durable place:

1. Log the lesson.
2. Update the relevant skill.
3. Add a checklist or verification step.
4. Add mechanical enforcement only when the invariant is important and cheap enough to maintain.
