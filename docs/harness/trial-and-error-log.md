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
