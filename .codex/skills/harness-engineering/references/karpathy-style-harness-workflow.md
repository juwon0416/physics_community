# Karpathy-Style Harness Workflow

## Mental Model

Think of the model as a reasoning engine embedded inside a larger harness. The model is not the product; the workflow around it is the product.

A useful project harness answers:

- What context is loaded before action?
- What tools are available and bounded?
- What state is durable across sessions?
- What tests or checks judge success?
- What happens on ambiguity or failure?
- How are lessons promoted into future behavior?

## Workflow Template

```text
request
→ route via AGENTS.md
→ load one owning skill
→ inspect source-of-truth files
→ act with smallest safe change
→ verify with narrow checks
→ record lesson if needed
→ report files, verification, git state
```

## Artifact Placement

- `AGENTS.md`: compact router and invariants.
- `.codex/skills/*/SKILL.md`: reusable operating procedures.
- `.codex/skills/*/references/*.md`: examples, templates, longer checklists.
- `docs/harness/*.md`: cross-project maps, verification strategy, learning ledger.
- `tools/validation/*` or scripts: mechanical checks.

## Design Heuristics

1. **Route before reasoning.** A future agent should know which skill owns the task before it reads the whole repo.
2. **Prefer procedures over prose.** A skill should tell an agent what to inspect, change, and verify.
3. **Prefer checks over wishes.** If a rule matters and can be cheaply checked, encode a validation step.
4. **Keep memory local to the system of record.** Chat memory helps, but repo-local docs and skills are what future agents can inspect.
5. **Close the loop.** Every surprising failure should either be logged, turned into a skill update, or converted into a mechanical check.

## Anti-Patterns

- Putting agent workflow rules only in Obsidian or external notes.
- Making a huge AGENTS.md that nobody can quickly route through.
- Creating duplicate skills for overlapping responsibilities.
- Adding a rule without a verification path.
- Leaving a completed harness change uncommitted when the repo treats Git history as the system of record.
