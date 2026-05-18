---
name: frontend-site-implementation
description: Use when implementing or reviewing React, Vite, TypeScript, routing, graph views, editor UI, styling, visual layout, data loading, or browser-visible behavior in the Physics Community website.
---

# Frontend Site Implementation

## Overview

Implement website changes in the existing React/Vite app while preserving graph-native learning behavior, editor rendering, and the current visual language. Treat visible UI work as product-system work, not feature accretion: every change should fit the route's information architecture, interaction model, layout rhythm, performance budget, and visual hierarchy.

## Load First

- `README.md` for the active structure and commands.
- `src/App.tsx` when routes are involved.
- `src/lib/graphModel.ts` and `src/data/storage.ts` when UI behavior depends on graph or topic data.
- `docs/harness/verification.md` for validation gates.
- `references/frontend-map.md` for active component ownership.

## Workflow

1. Identify the visible route, data source, and component owner before editing.
2. Before adding UI behavior, map the route-level system: primary user goal, visual hierarchy, zoom/responsive states, ownership of state, persistence boundary, and performance-sensitive surfaces.
3. Keep changes local to the affected page, component, or helper.
4. If the requested user workflow, persistence model, route, or data source is unclear, report `명확하지 않은 부분 -> 질문` before implementation.
5. Preserve existing design system patterns unless the task explicitly asks for a redesign.
6. For topic/editor rendering, coordinate with `website-content-authoring`.
7. For graph persistence or schema behavior, coordinate with `graph-data-stewardship`.
8. Run `npm.cmd run build` for behavior changes, `npm.cmd run lint` when lint risk is meaningful, and `npm.cmd run security:check` before deployment.
9. After visible frontend changes, open the affected route in the Browser plugin when available and verify the actual UI state against the user's intent; do not treat TypeScript build success as visual QA.
10. After successful verification, stage and commit the frontend change as a focused Git checkpoint unless the user asked to avoid Git actions.
11. If the user also wants deployment, push the verified commit before deploying so the release maps to Git history.
12. Log new UI validation or rendering pitfalls with `harness-memory`.

## Design Review Gate

- When the user explicitly asks to call a design AI, design specialist, or visual design reviewer, delegate a bounded critique-only pass before or alongside implementation. Include route, screenshot/context, component owner, constraints, target tone, and the exact interaction states to review.
- For design-heavy changes even without delegation, write a short internal design brief before editing: audience, reading task, information density, typography scale, interaction priority, and what must not change.
- Keep the main home page untouched unless the user specifically targets it. For ontology view work, optimize the graph canvas, file nodes, reader panes, layers, edge labels, and browser-visible interaction states.
- Prefer calm technical reading surfaces: independent panes, subtle borders, restrained shadows, readable line length, stable layer accents, and clear ownership labels. Avoid oversized headings, decorative borders that compete with content, or a single parent container that makes independent files feel trapped.

## System-Level UI Standards

- Avoid bolting on isolated controls or visual states. Integrate new behavior into the page's navigation, hierarchy, and existing mental model.
- For graph/editor views, define zoom states, node density, label scale, layer membership, collision behavior, and interaction priority before coding.
- Prefer explicit visual ownership: a node's group, active state, editable state, and data source should be visually legible without relying on hidden implementation knowledge.
- Optimize for perceived smoothness on the main interaction path. Avoid rerendering large markdown, graph, or editor subtrees during pan/zoom when a compositor transform is sufficient.
- Tune typography by screen-perceived size across breakpoints and zoom levels, not only by CSS values in world coordinates.
- In maximized ontology readers, each file should behave as an independent pane with its own header, controls, and scroll region; do not place split files inside one large bordered parent reader.
- Edge labels must be readable as relationship labels, not hidden metadata: reserve enough node spacing, allow short multiline labels, and avoid truncation as the default.
- File ontology node bodies are document surfaces, not decorative graph labels. Avoid transform choices that visibly rasterize text or KaTeX while zooming; verify normal graph previews and maximized reader panes for crisp text.
- File ontology has two reading surfaces: graph nodes render the concise `summary` preview for relationship scanning, while maximized reader panes render the full `content` document. Do not put the full learner document back into normal graph cards.
- Graph-card preview scaling must stay centered and screen-readable across zoom levels. Prefer screen-pixel target formulas and center-origin transforms over CSS `zoom` or top-left scaling hacks.
- When the user reports a visual issue caused by a previous feature addition, look for the underlying system mismatch and update this skill or harness memory if it should change future behavior.

## Browser QA Loop

- For visible UI work, start the local app if needed, open the affected route, and verify the exact interaction or layout state in a browser.
- For `/graph`, check at least normal zoom, title-only zoom, layer-only zoom, maximized reader panes, and one representative interaction such as pan, wheel zoom, maximize, or highlighted-link opening when relevant.
- For `/graph` math rendering, inspect the DOM for raw `$$`, `\(`, `\)`, `.katex-error`, and `.file-ontology-math-fallback`; formulas should render as KaTeX in both graph previews and maximized panes.
- Capture screenshots or DOM observations when they materially confirm the fix; if Browser is unavailable, report that explicitly and state the residual visual risk.

## Guardrails

- React Router routes live in `src/App.tsx`.
- The graph overview flow centers on `src/pages/GraphOverviewPage.tsx`.
- Active `/graph` UI currently renders through `src/components/graph/FileOntologyCanvas.tsx`.
- `src/components/graph/OntologyGraphView.tsx` is preserved as the legacy concept ontology canvas and should not be assumed to own `/graph`.
- Retired graph/editor experiments are kept under `trash/src-unused/` or `trash/src-legacy/`.
- Topic rendering and PDF/content precedence live in `src/pages/TopicPage.tsx`.
- Frontend code may use `VITE_*` values through `import.meta.env`, but must not hard-code real Supabase URLs, anon keys, or service role keys.
