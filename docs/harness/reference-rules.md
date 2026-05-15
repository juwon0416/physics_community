# Reference Rules

## Stable IDs

Use `type:lowercase-kebab-case`.

Examples:

- `agent:orchestrator`
- `skill:obsidian-site-code-registry`
- `workflow:extract-github-structure`
- `check:registry-drift`
- `component:graph-canvas`
- `page:topic-viewer`
- `api:graph-nodes`
- `table:graph-nodes`

Avoid uppercase letters, spaces, and arbitrary symbols in IDs.

## Catalog References

Every `agent:*`, `skill:*`, `workflow:*`, and `check:*` reference should resolve in `docs/harness/system-catalog.md`.

## Obsidian Wikilinks

Every Obsidian wikilink should resolve to an actual Markdown file in `docs/obsidian`.

Use generated node filenames derived from IDs by replacing `:` with `-`, such as:

- `page:home` -> `[[page-home]]`
- `component:manifold-3d-view` -> `[[component-manifold-3d-view]]`
- `table:graph-nodes` -> `[[table-graph-nodes]]`

## Registry Paths

Every active node in `docs/registry/site-code-graph.json` must have a `source_path` that exists in the repository checkout.

Every relation must include evidence. If the extractor cannot find evidence, record a warning and lower confidence instead of inventing the relation.
