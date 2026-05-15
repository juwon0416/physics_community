# System Catalog

This catalog defines stable IDs used by harness docs, skills, workflows, checks, and generated registry artifacts.

## Agents Table

| ID | Role | Current source |
| --- | --- | --- |
| `agent:orchestrator` | Coordinates multi-step harness and reconstruction work. | `.codex/agents/knowledge_reconstruction_orchestrator.toml` |
| `agent:knowledge-architect` | Maintains canonical physics knowledge architecture. | `.codex/agents/knowledge_repository_manager.toml` |
| `agent:content-author` | Writes and reviews physics topic content. | `.codex/agents/node_doc_writer.toml` |
| `agent:graph-steward` | Maintains graph, schema, and merge integrity. | `.codex/agents/graph_merger.toml` |
| `agent:frontend-builder` | Implements and verifies website UI changes. | `.codex/skills/frontend-site-implementation/SKILL.md` |
| `agent:harness-keeper` | Maintains harness memory, checks, and generated registry rules. | `.codex/skills/harness-memory/SKILL.md` |

## Skills Table

| ID | Path | Purpose |
| --- | --- | --- |
| `skill:knowledge-reconstruction` | `.codex/skills/knowledge-reconstruction/SKILL.md` | Canonical graph, node docs, provenance, and argument graph workflows. |
| `skill:website-content-authoring` | `.codex/skills/website-content-authoring/SKILL.md` | Quill, KaTeX, topic imports, and editor-ready content. |
| `skill:graph-data-stewardship` | `.codex/skills/graph-data-stewardship/SKILL.md` | Supabase, SQL, graph scopes, and MCP data tools. |
| `skill:frontend-site-implementation` | `.codex/skills/frontend-site-implementation/SKILL.md` | React/Vite routes, UI, graph views, and editor implementation. |
| `skill:harness-memory` | `.codex/skills/harness-memory/SKILL.md` | Failure logs and guardrail promotion. |
| `skill:obsidian-site-code-registry` | `.codex/skills/obsidian-site-code-registry/SKILL.md` | Repo extraction, graph manifest, generated Obsidian registry, and registry validation. |

## Workflows Table

| ID | Purpose | Primary skill |
| --- | --- | --- |
| `workflow:extract-github-structure` | Scan the real checkout into a source-backed graph manifest. | `skill:obsidian-site-code-registry` |
| `workflow:update-site-code-registry` | Regenerate Obsidian generated views and registry manifests after structural changes. | `skill:obsidian-site-code-registry` |
| `workflow:add-physics-topic` | Add or update physics learning content with graph-aware structure. | `skill:website-content-authoring` |
| `workflow:add-graph-relation` | Add graph relations with stable IDs and evidence. | `skill:graph-data-stewardship` |
| `workflow:fix-repeated-failure` | Convert repeated mistakes into logs, skills, or checks. | `skill:harness-memory` |

## Checks Table

| ID | Purpose | Command or source |
| --- | --- | --- |
| `check:repo-extraction-success` | Confirm extraction completed and wrote registry artifacts. | `node tools/extraction/generate_site_code_graph.js` |
| `check:site-code-graph-schema-validity` | Confirm manifest shape and required fields. | `node tools/validation/validate_site_code_graph.js` |
| `check:source-path-validity` | Confirm active node paths exist. | `node tools/validation/validate_source_paths.js` |
| `check:obsidian-link-integrity` | Confirm Obsidian wikilinks resolve to Markdown files. | `node tools/validation/validate_obsidian_links.js` |
| `check:relation-evidence-validity` | Confirm every edge has accepted evidence. | `node tools/validation/validate_site_code_graph.js` |
| `check:generated-docs-not-manually-edited` | Confirm generated views match the registry renderer. | `node tools/validation/validate_registry_drift.js` |
| `check:registry-drift` | Confirm extracted manifest and rendered docs are up to date. | `node tools/validation/validate_registry_drift.js` |
| `check:provenance-integrity` | Confirm content/graph changes retain source evidence. | `skill:knowledge-reconstruction` |
| `check:npm-build` | Confirm app build still passes. | `npm.cmd run build` |
