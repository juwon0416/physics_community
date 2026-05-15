---
name: frontend-site-implementation
description: Use when implementing or reviewing React, Vite, TypeScript, routing, graph views, editor UI, styling, visual layout, data loading, or browser-visible behavior in the Physics Community website.
---

# Frontend Site Implementation

## Overview

Implement website changes in the existing React/Vite app while preserving graph-native learning behavior, editor rendering, and the current visual language.

## Load First

- `README.md` for the active structure and commands.
- `src/App.tsx` when routes are involved.
- `src/lib/graphModel.ts` and `src/data/storage.ts` when UI behavior depends on graph or topic data.
- `docs/harness/verification.md` for validation gates.
- `references/frontend-map.md` for active component ownership.

## Workflow

1. Identify the visible route, data source, and component owner before editing.
2. Keep changes local to the affected page, component, or helper.
3. Preserve existing design system patterns unless the task explicitly asks for a redesign.
4. For topic/editor rendering, coordinate with `website-content-authoring`.
5. For graph persistence or schema behavior, coordinate with `graph-data-stewardship`.
6. Run `npm.cmd run build` for behavior changes and `npm.cmd run lint` when lint risk is meaningful.
7. If a local app target is obvious after a frontend change, verify in the browser when available.
8. After successful verification, stage and commit the frontend change as a focused Git checkpoint unless the user asked to avoid Git actions.
9. If the user also wants deployment, push the verified commit before deploying so the release maps to Git history.
10. Log new UI validation or rendering pitfalls with `harness-memory`.

## Guardrails

- React Router routes live in `src/App.tsx`.
- The graph overview flow centers on `src/pages/GraphOverviewPage.tsx`.
- Active graph UI currently renders through `src/components/graph/OntologyGraphView.tsx`.
- Retired graph/editor experiments are kept under `trash/src-unused/` or `trash/src-legacy/`.
- Topic rendering and PDF/content precedence live in `src/pages/TopicPage.tsx`.
