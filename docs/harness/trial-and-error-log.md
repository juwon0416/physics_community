# Trial and Error Log

This ledger stores compact lessons from failed runs, surprising constraints, and repeated project-specific mistakes. Append entries instead of relying on chat memory.

## When To Append

- A command fails for a non-obvious project reason.
- A DB, RLS, environment, encoding, rendering, or deployment assumption was wrong.
- A workaround is needed and likely to be needed again.
- A user correction changes how future agents should operate.
- A lesson should be promoted into a skill or verification step.

## Entry Template

```markdown
### YYYY-MM-DD - Short lesson title

- Context:
- False assumption or risk:
- Signal:
- Correction:
- Prevention:
- Related files:
```

## Active Lessons

### 2026-05-15 - Project-local skill initialization may need elevated filesystem access

- Context: Creating folders under `.codex/skills/` with the skill initialization script.
- False assumption or risk: Workspace write access always permits normal creation under `.codex`.
- Signal: Windows returned `Access to the path ... is denied` for new skill directories.
- Correction: Re-run the official `skill-creator` initialization with explicit approval for `.codex/skills` writes.
- Prevention: If `.codex/skills` writes fail with access denied, request approval for the same official skill script or the specific directory creation, not a broad filesystem command.
- Related files: `.codex/skills/`, `AGENTS.md`

### 2026-05-15 - MCP and Supabase writes require service role access

- Context: Writing topics, graph nodes, or graph edges through MCP or Supabase.
- False assumption or risk: An anon Supabase key can persist graph/topic edits.
- Signal: Writes can fail with RLS errors such as row-level security policy violations.
- Correction: Use MCP with `MCP_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` when available; otherwise use static content overrides or SQL migrations appropriate to the task.
- Prevention: Check service role key presence without printing values before attempting write flows. Do not repeatedly retry anon writes.
- Related files: `mcp-server/README.md`, `docs/file_to_website_markdown_pipeline.md`, `src/data/topicContentOverrides.ts`

### 2026-05-15 - Website topic math should use Quill formula spans

- Context: Converting physics notes into website/editor content.
- False assumption or risk: Raw Markdown or raw `$$...$$` will render consistently across editor, read-only topic page, and graph section extraction.
- Signal: The working content path expects Quill-style HTML and `ql-formula` spans.
- Correction: Convert inline and display math to Quill `span` elements with `data-value`; use `ql-formula-display` plus `data-display="true"` for display math.
- Prevention: Run the Quill/KaTeX checklist before build or deploy.
- Related files: `docs/file_to_website_markdown_pipeline.md`, `.codex/skills/website-content-authoring/references/quill-katex-checklist.md`

### 2026-05-15 - Topic override keys are case-sensitive

- Context: Adding fallback content through `TOPIC_CONTENT_OVERRIDES`.
- False assumption or risk: `normalizeTopicSlug` lowercases or hyphenates all lookup keys.
- Signal: Overrides can fail when DB slug or title casing differs from the new key.
- Correction: Add exact DB `slug`, exact DB `title`, and a lowercase-hyphenated compatibility key when useful.
- Prevention: Query or inspect the actual topic slug/title before choosing override keys.
- Related files: `src/data/topicContentOverrides.ts`, `src/lib/topicSlug.ts`, `docs/file_to_website_markdown_pipeline.md`

### 2026-05-15 - Section graph order depends on real heading order

- Context: Directory and graph section nodes are extracted from topic content.
- False assumption or risk: Section nodes can be sorted alphabetically or inferred from Markdown headings.
- Signal: `graphModel.ts` extracts real HTML heading order and section metadata uses `sectionIndex`.
- Correction: Use real `<h2>` headings in source order and preserve `sectionIndex` ordering in UI.
- Prevention: Validate section extraction after topic content imports.
- Related files: `src/lib/graphModel.ts`

### 2026-05-15 - Generated Obsidian docs can drift if edited manually

- Context: Generated registry views are rendered from `docs/registry/site-code-graph.json`.
- False assumption or risk: A generated Markdown file can safely hold human interpretation.
- Signal: Manual edits would be overwritten or diverge from the machine-readable manifest.
- Correction: Keep generated files repo-derived only and put interpretation in `docs/obsidian/curated/**` or `docs/obsidian/overlays/**`.
- Prevention: Run `check:generated-docs-not-manually-edited` through `node tools/validation/validate_registry_drift.js`.
- Related files: `docs/obsidian/generated/`, `docs/obsidian/curated/`, `docs/obsidian/overlays/`

### 2026-05-15 - AI can hallucinate route, component, API, or DB relations

- Context: AI agents often infer architecture from naming patterns.
- False assumption or risk: A plausible relation is enough to add a registry edge.
- Signal: The registry requires relation evidence such as imports, route definitions, API handler paths, Supabase queries, SQL schema, migrations, config, or curated notes.
- Correction: Add edges only when evidence exists; otherwise lower confidence and log a warning.
- Prevention: Run `check:relation-evidence-validity` and inspect extraction warnings.
- Related files: `docs/registry/site-code-graph.json`, `tools/extraction/registry_core.js`

### 2026-05-15 - Node-izing every file creates graph noise

- Context: The repo contains runtime files, docs, legacy trash, generated build output, SQL, and assets.
- False assumption or risk: Every file should become an Obsidian node.
- Signal: The requested registry should help agents navigate key structures, not mirror every file as a node.
- Correction: Node-ize routes, pages, major components, APIs, DB tables, schema/migrations, graph/editor modules, content pipeline modules, shared modules, and confusing high-risk files.
- Prevention: Keep non-node files in `file_index` and generated `code-structure.md`.
- Related files: `docs/registry/site-code-graph.json`, `docs/obsidian/generated/code-structure.md`

### 2026-05-15 - Active nodes without source_path break safe editing

- Context: Generated registry nodes guide agents to source files.
- False assumption or risk: Conceptual architecture nodes can be marked active without a real source path.
- Signal: The registry validation requires every active node to have an existing `source_path`.
- Correction: Use only existing files for active nodes; represent future ideas outside generated registry unless explicit evidence exists.
- Prevention: Run `node tools/validation/validate_source_paths.js`.
- Related files: `tools/validation/validate_source_paths.js`, `docs/harness/reference-rules.md`

### 2026-05-15 - Import graph is evidence, not full runtime dependency truth

- Context: Static imports can be extracted reliably, but runtime behavior can also depend on routing, data, dynamic lookups, and Supabase state.
- False assumption or risk: Import edges fully describe runtime dependencies.
- Signal: The registry distinguishes evidence kinds and confidence.
- Correction: Treat static imports as high-confidence code relations, but use route-definition, API-handler, Supabase-query, SQL, and migration evidence for other relation types.
- Prevention: Review edge evidence kind before using a relation as a behavioral claim.
- Related files: `tools/extraction/extract_import_graph.js`, `docs/registry/site-code-graph.schema.json`

### 2026-05-15 - DB relations need query or SQL evidence

- Context: Tables and graph relations can be guessed from names.
- False assumption or risk: A DB edge can be added because a file name resembles a table.
- Signal: Supabase `.from(...)`, SQL `create table`, `alter table`, or migration evidence is required.
- Correction: Use `supabase-query`, `sql-schema`, or `migration` evidence; lower confidence or warn when evidence is incomplete.
- Prevention: Run DB extraction and relation evidence validation before relying on DB edges.
- Related files: `tools/extraction/extract_db_schema.js`, `database/sql/`, `src/data/storage.ts`

### 2026-05-15 - Tracked env files can leak deployment credentials

- Context: Security review of Git-tracked files and deployment environment files.
- False assumption or risk: `.gitignore` rules protect `.env*` files even after one has already been tracked.
- Signal: `.env.vercel` was present in Git history and included secret-like deployment variables.
- Correction: Remove `.env.vercel` from the current Git index, keep it local and ignored, and run a tracked-file secret scan.
- Prevention: Run `npm.cmd run security:check` before deployment and after any environment or deployment config change.
- Related files: `.gitignore`, `tools/validation/validate_security_harness.js`, `docs/harness/security.md`

### 2026-05-15 - Product ambiguity should become explicit questions before implementation

- Context: Large graph-view changes can alter data source, persistence, routing, and editing behavior at once.
- False assumption or risk: An agent may choose a persistence or UX model that conflicts with the user's intended workflow.
- Signal: The request explicitly asked to ask questions before implementation when parts are unclear.
- Correction: Add a clarity gate requiring `명확하지 않은 부분 -> 질문` before behavior changes when product or data-shape choices are unresolved.
- Prevention: Check `AGENTS.md` and the task-specific skill workflow before implementing broad feature changes.
- Related files: `AGENTS.md`, `.codex/skills/frontend-site-implementation/SKILL.md`, `docs/harness/index.md`

### 2026-05-15 - File ontology canvas must stay separate from legacy graph tables

- Context: Replacing `/graph` with a markdown-file ontology canvas while preserving the existing database.
- False assumption or risk: File nodes and file-to-file edges could be stored in legacy `graph_nodes` and `graph_edges`, mixing concept ontology data with editable file workspace data.
- Signal: The user clarified that the new graph view should not connect to the old graph DB path, while markdown files and file relations should persist in DB.
- Correction: Use dedicated `file_ontology_files` and `file_ontology_edges` tables for markdown content, hidden summaries, canvas coordinates, and editable edge labels.
- Prevention: For `/graph` file canvas work, inspect imports for `src/lib/fileOntology.ts` and avoid `fetchGraphModel`, `saveGraphData`, `graph_nodes`, and `graph_edges` write paths unless explicitly migrating legacy data.
- Related files: `src/components/graph/FileOntologyCanvas.tsx`, `src/lib/fileOntology.ts`, `database/sql/schema/file_ontology_schema.sql`, `.codex/skills/graph-data-stewardship/references/db-and-mcp-rules.md`

### 2026-05-15 - Registry extraction and Obsidian rendering must run sequentially

- Context: Updating the site-code registry after route, component, and SQL schema changes.
- False assumption or risk: `generate_site_code_graph.js` and `render_obsidian_registry.js` can be run in parallel.
- Signal: `validate_registry_drift.js` reported missing generated nodes even though extraction had just succeeded.
- Correction: Run extraction first, then render generated Obsidian docs, then validate drift.
- Prevention: Use `node tools/extraction/generate_site_code_graph.js`, wait for success, then `node tools/extraction/render_obsidian_registry.js`; do not parallelize those two commands.
- Related files: `docs/registry/site-code-graph.json`, `docs/obsidian/generated/**`, `tools/validation/validate_registry_drift.js`

### 2026-05-15 - Registry checks may need elevated git access on Windows

- Context: Running extraction and drift validation from the desktop sandbox.
- False assumption or risk: Filesystem fallback is equivalent to `git ls-files` for registry source-of-truth checks.
- Signal: The manifest reported fallback extraction warnings, or drift validation reported false drift after a successful elevated extraction.
- Correction: Re-run `node tools/extraction/generate_site_code_graph.js` and `node tools/validation/validate_registry_drift.js` with enough permission for Git when sandboxed `git ls-files` returns EPERM.
- Prevention: Treat fallback extraction as a warning state for final registry artifacts; final registry validation should pass with Git tracked-file access.
- Related files: `tools/extraction/registry_core.js`, `tools/validation/validate_registry_drift.js`, `docs/registry/extraction-manifest.json`

### 2026-05-15 - File ontology DB availability requires applying SQL, not only deploying frontend code

- Context: `/graph` showed the file ontology starter fallback and save failed because `file_ontology_files` and `file_ontology_edges` did not exist in Supabase.
- False assumption or risk: Adding `database/sql/schema/file_ontology_schema.sql` to the repo is enough for the deployed website to persist file ontology data.
- Signal: The UI reported that file ontology tables were unavailable, and save operations could not reach the table.
- Correction: Apply the idempotent SQL schema to Supabase with a server-side database connection, then verify public read and editor/admin write paths without printing secrets.
- Prevention: For new DB-backed frontend features, perform both code deploy and database rollout; a frontend deploy alone will not create Supabase tables.
- Related files: `database/sql/schema/file_ontology_schema.sql`, `src/lib/fileOntology.ts`, `src/components/graph/FileOntologyCanvas.tsx`

### 2026-05-15 - Full-viewport graph routes must disable document scroll and capture pointer exit states

- Context: `/graph` uses a canvas-like workspace with fixed top controls, wheel zoom, and drag navigation.
- False assumption or risk: Keeping the normal route footer or relying on `window` `pointerup` alone is enough for a stable canvas interaction model.
- Signal: The page gained a browser-side vertical scrollbar, the floating toolbar could drift under the sticky navbar, and pan drag occasionally stayed active after mouse release during lag or pointer loss.
- Correction: Treat `/graph` as a true viewport-owned route by removing page overflow sources there, handling wheel zoom at the canvas capture layer, and ending drags on pointer capture release, `pointercancel`, `blur`, and visibility changes.
- Prevention: For any full-screen graph/editor route, verify that the document itself does not scroll and that pointer interactions recover cleanly when the cursor leaves the window.
- Related files: `src/components/layout/Layout.tsx`, `src/components/graph/FileOntologyCanvas.tsx`

### 2026-05-17 - Build and security checks may need elevated process access on Windows

- Context: Running deployment verification from the desktop sandbox after file-ontology content and workflow changes.
- False assumption or risk: `npm.cmd run build` and `npm.cmd run security:check` will always complete inside the default sandbox.
- Signal: Vite failed while spawning the esbuild service with `spawn EPERM`, and the security harness failed while invoking `git` with `spawnSync git EPERM`.
- Correction: Re-run the same commands with elevated execution when the first failure is an OS-level process or Git access denial, then record the successful result.
- Prevention: Treat `EPERM` from esbuild or Git-backed validation as a sandbox permission issue before chasing code changes.
- Related files: `package.json`, `tools/validation/validate_security_harness.js`, `docs/harness/verification.md`

### 2026-05-17 - File ontology scroll bugs can be layout and native-drag issues, not only wheel handlers

- Context: A `/graph` file node still would not scroll in normal node mode, and dragging near node content could show the browser's prohibited drag cursor after an earlier event-propagation fix.
- False assumption or risk: Allowing selected-node wheel events through the canvas capture handler is enough to make embedded file content scrollable.
- Signal: The normal node preview had `overflow-y-auto`, but its parent was not a flex column and the preview did not receive a constrained height; video evidence also showed native text/drag behavior entering the canvas interaction path.
- Correction: Make the node body a constrained flex column, give the preview `h-full min-h-0`, suppress preview native drag/text selection, and clear any browser text selection before starting canvas pan.
- Prevention: For canvas-like nodes with embedded content, verify DOM height constraints, native `dragstart`, text selection state, wheel capture, and pointer pan behavior together in a browser.
- Related files: `src/components/graph/FileOntologyCanvas.tsx`, `docs/harness/verification.md`

### 2026-05-18 - Full lint currently has legacy baseline failures

- Context: Running verification after adding Halliday Chapter 2 file-ontology data and graph-route navbar styling.
- False assumption or risk: A failing `npm.cmd run lint` means the current task introduced lint errors.
- Signal: Full lint failed in pre-existing areas: `src/components/graph/OntologyGraphView.tsx`, `src/lib/renderTopicMath.ts`, `src/lib/sourceText.ts`, `src/lib/theme.tsx`, and `src/pages/TopicPage.tsx`; targeted eslint on the changed files passed.
- Correction: Record both results and use targeted lint for changed files until the legacy lint baseline is cleaned up.
- Prevention: When reporting verification, distinguish full-repo lint baseline failures from changed-file lint results.
- Related files: `src/components/graph/OntologyGraphView.tsx`, `src/lib/renderTopicMath.ts`, `src/lib/sourceText.ts`, `src/lib/theme.tsx`, `src/pages/TopicPage.tsx`

### 2026-05-18 - Bundled file ontology seeds must merge with DB reads

- Context: Halliday Chapter 2 file-ontology nodes were added to bundled starter data and deployed, but did not appear on `/graph`.
- False assumption or risk: A frontend deploy that adds static starter files will affect a deployed site whose `file_ontology_files` table already has rows.
- Signal: `fetchFileOntologyModel` returned database rows whenever the table was non-empty, so fallback Chapter 2 nodes were ignored unless the SQL migration was separately applied.
- Correction: Merge missing bundled ontology files and edges into database read results while preserving database rows for matching ids; when older bundled learner content is detected by retired section markers, show the refreshed bundled body until DB rows are saved or migrated.
- Prevention: For bundled ontology content, verify empty-table fallback, non-empty database reads, and stale-seed content reads before assuming a deploy will make nodes and body revisions visible.
- Related files: `src/lib/fileOntology.ts`, `src/data/fundamentalsChapter2Ontology.ts`, `database/sql/migrations/migration_integrate_fundamentals_chapter2_file_ontology.sql`

### 2026-05-18 - Visible UI changes need system-level browser QA

- Context: File ontology zoom/title/layer features were implemented incrementally, but title-only text became too large and topic layers could overlap or fail to communicate node membership.
- False assumption or risk: Passing build and adding the requested feature is enough for a graph-view UI change.
- Signal: The user reported that the visual result did not fit the overall website structure even though the individual features existed.
- Correction: Treat graph UI changes as a route-level visual system: tune screen-perceived typography, make ownership boundaries explicit, prevent layer collisions, and verify the actual route in a browser.
- Prevention: After visible frontend changes, run the Browser QA loop from `frontend-site-implementation`; inspect normal, title-only, and layer-only zoom states for `/graph`.
- Related files: `src/components/graph/FileOntologyCanvas.tsx`, `.codex/skills/frontend-site-implementation/SKILL.md`, `AGENTS.md`

### 2026-05-18 - Maximized ontology readers need independent panes

- Context: Highlight-linked file reading initially used one large maximized container with an internal split grid, making files feel trapped inside a single document shell.
- False assumption or risk: A grid inside a modal is equivalent to independent reader panes.
- Signal: The user expected each opened file node to become its own independently scrollable reading surface, not a section inside one parent box.
- Correction: Render maximized file nodes as independent cards directly on the overlay workspace, each with its own header, controls, and scroll body; keep the overlay shell visually quiet.
- Prevention: For ontology reader work, verify single-pane and multi-pane maximized states in Browser and check that scroll behavior is pane-local.
- Related files: `src/components/graph/FileOntologyCanvas.tsx`, `.codex/skills/frontend-site-implementation/SKILL.md`, `.codex/agents/frontend_design_reviewer.toml`

### 2026-05-18 - Skill validation script may need PyYAML

- Context: `skill-creator` recommends `quick_validate.py` after skill edits, but the default `python` environment in this workspace did not include `yaml`.
- False assumption or risk: The validation script can always run with the ambient Python interpreter.
- Signal: `python .../quick_validate.py .codex/skills/frontend-site-implementation` failed with `ModuleNotFoundError: No module named 'yaml'`.
- Correction: Report the blocked validation and rely on direct SKILL.md/openai.yaml inspection unless a Python environment with PyYAML is available.
- Prevention: If skill validation becomes a repeated gate, use a repo-local or bundled Python environment that includes PyYAML instead of the ambient interpreter.
- Related files: `.codex/skills/frontend-site-implementation/SKILL.md`, `C:/Users/user/.codex/skills/.system/skill-creator/scripts/quick_validate.py`

### 2026-05-18 - Normal file-ontology reconciliation should not surface as a warning toast

- Context: `/graph` displayed a bottom warning that the database file ontology was missing bundled nodes even though the canvas was correctly showing the merged bundled seed files.
- False assumption or risk: Every DB/static-seed mismatch should become a user-facing status message.
- Signal: The warning exposed deployment and migration internals during normal graph browsing, and a follow-up Browser check showed the automatic local layout rebalance message occupied the same warning-like surface.
- Correction: Keep real read/schema warnings, but suppress normal bundled-node reconciliation and initial automatic layout rebalance messages on page load.
- Prevention: For graph load states, only show bottom status toasts for user-actionable errors or explicit user actions; silent recovery paths should be verified in Browser without UI noise.
- Related files: `src/lib/fileOntology.ts`, `src/components/graph/FileOntologyCanvas.tsx`

### 2026-05-18 - Highlight links are prerequisite compression, not connectivity sections

- Context: Chapter 1 and Chapter 2 file-ontology bodies contained learner-facing sections such as "What This Node Contributes to the Graph" and "Scope and Graph Links."
- False assumption or risk: File nodes should explain their graph connectivity in a dedicated section.
- Signal: The user clarified that highlights should keep the main argument compact by linking prerequisite or lower-level concepts only where the body would otherwise become too long.
- Correction: Remove dedicated connectivity sections from bundled Chapter 1 and Chapter 2 content, update file-node templates and workflow prompts to place links inline, and refresh old DB rows when those retired headings are detected.
- Prevention: When authoring file-ontology content, keep the local argument primary; use `[[target|phrase]]` links at the exact sentence that needs a sub-concept, never as a standalone graph-link catalog.
- Related files: `src/data/fundamentalsChapter1Ontology.ts`, `src/data/fundamentalsChapter2Ontology.ts`, `src/lib/fileOntology.ts`, `src/lib/ontologyWorkflow.ts`, `src/components/graph/FileOntologyCanvas.tsx`, `.codex/skills/knowledge-reconstruction/SKILL.md`

### 2026-05-18 - File ontology links must appear at first prerequisite use

- Context: After removing explicit graph-link sections, Chapter 2 still kept `Graph Interpretation` and `Source Scope` sections, so prerequisite links were clustered after the concept had already used terms such as velocity and position.
- False assumption or risk: Moving graph links out of one section is enough if another later section still carries the relationship explanation.
- Signal: The user pointed to the acceleration node: a learner who does not know velocity needs the velocity file at the definition and equation where \(v(t)\), \(\Delta v\), or \(dv/dt\) first appears.
- Correction: Rewrite Chapter 1 and Chapter 2 file bodies so prerequisite terms are linked at first use, remove `Source Scope` and broad `Graph Interpretation` sections, place citations in final `References`, and add a dedicated `file_ontology_content_writer` agent role.
- Prevention: Before approving file-node content, scan definitions and equations for imported concepts; each imported concept should either be locally defined because it belongs to the node, or linked inline to its prerequisite file at first use.
- Related files: `src/data/fundamentalsChapter1Ontology.ts`, `src/data/fundamentalsChapter2Ontology.ts`, `src/lib/fileOntology.ts`, `src/lib/ontologyWorkflow.ts`, `.codex/agents/file_ontology_content_writer.toml`, `.codex/skills/knowledge-reconstruction/SKILL.md`
