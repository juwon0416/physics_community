---
name: harness-engineering
description: "Use when changing the project agent harness itself: AGENTS.md routing, .codex/skills workflows, docs/harness maps, verification gates, agent memory, or Karpathy-style scaffolding around AI agent work."
---

# Harness Engineering

## Overview

This project treats harness engineering as the repo-local operating system around AI work: context, tools, workflows, checks, memory, and recovery paths that make future agent runs legible and reliable.

Use the Andrei Karpathy style mental model: the LLM is only the CPU. The useful system is the harness around it — context loading, tool calls, skill routing, evaluations, memory, guardrails, and feedback loops. Do not bury this in external notes. Durable agent operating knowledge belongs in `AGENTS.md`, `.codex/skills/`, `docs/harness/`, scripts, and verification checks.

## When to Use

Use this skill when the task involves:

- Editing `AGENTS.md` or the skill router.
- Creating, deleting, splitting, or rewriting `.codex/skills/*/SKILL.md`.
- Defining agent workflows, role boundaries, or repo-local operating loops.
- Turning a repeated mistake into a skill, checklist, verification script, or trial-and-error log entry.
- Deciding where durable agent knowledge should live.
- Building agent scaffolding inspired by Karpathy/OpenAI harness engineering rather than adding end-user content.

Do **not** use this skill for ordinary feature implementation unless the task changes how agents should work in this repository.

## Source of Truth Placement

Use this placement order:

1. `AGENTS.md` — short project map, core invariants, and skill router only.
2. `.codex/skills/<skill>/SKILL.md` — reusable procedures for agent tasks.
3. `.codex/skills/<skill>/references/*.md` — deeper checklists, examples, templates, and rationale.
4. `docs/harness/*.md` — cross-skill maps, verification rules, system catalog, and learning ledger.
5. `scripts/` or `tools/validation/` — mechanical checks when prose is too weak.
6. Obsidian vaults — human study notes only, not the source of project agent operating rules.

## Karpathy-Style Harness Lens

When designing a workflow, explicitly define the surrounding harness:

- **Context window**: what files must be read before acting?
- **Tool interface**: what commands, scripts, MCP tools, or APIs perform the action?
- **State and memory**: what durable file records lessons and decisions?
- **Evaluation**: what small check proves the result?
- **Recovery**: what should happen when a command fails or ambiguity appears?
- **Routing**: which skill owns the artifact, and how does `AGENTS.md` point to it?
- **Compression**: how do we avoid one giant manual while keeping enough map to navigate?

## Workflow For Harness Changes

1. **Identify the harness layer being changed**
   - Entry map: `AGENTS.md`
   - Task procedure: `.codex/skills/<skill>/SKILL.md`
   - Deep reference: `.codex/skills/<skill>/references/*.md`
   - Cross-skill docs: `docs/harness/*.md`
   - Mechanical gate: scripts or validation tools

2. **Inspect existing routing first**
   - Read `AGENTS.md`.
   - Read `docs/harness/index.md`.
   - Read the task-specific skill if one already owns the area.
   - Avoid creating duplicate skills when extending an existing skill is clearer.

3. **Keep `AGENTS.md` short**
   - Add only the routing line or invariant future agents need immediately.
   - Put procedural detail in a skill.
   - Put long rationale or examples in a reference file.

4. **Write skills as executable procedures**
   - Trigger conditions.
   - Load-first files.
   - Step-by-step workflow.
   - Pitfalls and guardrails.
   - Verification checklist.

5. **Promote mistakes deliberately**
   - One-off surprise: append to `docs/harness/trial-and-error-log.md`.
   - Repeated surprise: update the relevant skill.
   - Critical invariant: add a verification script or checklist.

6. **Verify the harness**
   - Ensure links and referenced paths exist.
   - Ensure `AGENTS.md` routes to the new or updated skill.
   - If a skill file changed, check frontmatter has `name` and `description`.
   - If the change affects generated registry/Obsidian docs, run the relevant registry validation.

## Skill Authoring Pattern

A project-local skill should include:

```markdown
---
name: short-kebab-name
description: Use when ...
---

# Human Title

## Overview
## When to Use
## Load First
## Workflow
## Common Pitfalls
## Verification Checklist
```

Keep the skill short enough to load quickly. Move examples, templates, and long rationale into `references/`.

## Common Pitfalls

1. **Putting agent operating rules in Obsidian.** Obsidian can mirror or explain, but future agents load repo-local files. Use `AGENTS.md`, `.codex/skills/`, and `docs/harness/`.

2. **Making `AGENTS.md` encyclopedic.** It should route, not teach every procedure.

3. **Creating a new skill for every task.** Prefer updating the owning skill unless the new procedure has a distinct trigger and lifecycle.

4. **Skipping verification.** A harness change without a path check or checklist can misroute future agents.

5. **Relying on chat memory.** If a future run needs it, encode it in repo files.

## Verification Checklist

- [ ] `AGENTS.md` routes to the owning skill if future agents need it.
- [ ] The skill path exists under `.codex/skills/`.
- [ ] Long references live under `references/`, not in `AGENTS.md`.
- [ ] `docs/harness/index.md` reflects any new major harness layer.
- [ ] Any user correction worth preserving is logged in `docs/harness/trial-and-error-log.md` or promoted into a skill.
- [ ] No project agent operating rule was left only in an external Obsidian vault.
