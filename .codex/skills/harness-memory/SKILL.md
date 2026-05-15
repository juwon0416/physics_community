---
name: harness-memory
description: Use when a task fails, a command requires a workaround, an assumption proves wrong, a hidden project constraint is discovered, or a recurring mistake should be recorded so future agents avoid repeating it.
---

# Harness Memory

## Overview

Turn mistakes and discoveries into durable repo-local memory. The goal is not more documentation; it is fewer repeated failures.

## Load First

- `docs/harness/trial-and-error-log.md` before adding or checking a lesson.
- `docs/harness/index.md` for the overall harness structure.
- The task-specific skill that owns the affected artifact.
- `references/log-template.md` for the compact entry format.

## Workflow

1. Decide whether the event is worth preserving. Log failures, wrong assumptions, repeated friction, fragile commands, RLS issues, rendering pitfalls, or decisions future agents may need.
2. Append a short entry to `docs/harness/trial-and-error-log.md`.
3. Include context, false assumption or risk, signal, correction, prevention rule, and linked files.
4. If the same lesson appears twice, update the relevant skill or `docs/harness/verification.md`.
5. If a rule can be mechanically enforced at reasonable cost, prefer a test, script, lint, or checklist over prose.
6. When a failure involves Git, branching, push state, or deploying from the wrong revision, capture the exact mismatch and prevention rule.
7. Never log secrets, full environment values, private keys, or large raw command dumps.

## Promotion Rules

- One-off surprise: add a log entry.
- Repeated surprise: update a skill.
- Critical invariant: add verification or mechanical enforcement.
- Stale or contradicted lesson: mark it superseded rather than deleting history.
