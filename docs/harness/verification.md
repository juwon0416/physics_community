# Verification Matrix

Use the narrowest check that proves the change, then add broader checks when the touched surface justifies it.

## General Frontend

- Build: `npm.cmd run build`
- Lint: `npm.cmd run lint`
- Security: `npm.cmd run security:check`
- Dev server: `npm.cmd run dev`

Run build for TypeScript, route, graph model, data loading, editor, and rendering changes. Run lint when changes touch code style, hooks, unused imports, or broader refactors.

## Frontend Visual Behavior

- Open the relevant route in a browser when a local app target is running.
- Check desktop and mobile if layout, navigation, or graph interaction changed.
- For topic pages, check whether `pdf_url` changes content precedence.

## Website Content Imports

- Confirm content is Quill-compatible HTML.
- Confirm expandable sections use real `<h2>` headings.
- Confirm formulas use `ql-formula` spans.
- Confirm no raw `$$...$$`, `\tag{}`, or TeX layout commands remain.
- Validate KaTeX rendering for all formula `data-value` attributes.
- Confirm override keys match exact DB slug/title when using `TOPIC_CONTENT_OVERRIDES`.

## Graph and Data Changes

- Inspect whether the affected scope is `legacy`, `archive`, or ontology.
- Confirm stable ids and slugs are preserved.
- Confirm fallback behavior still works when Supabase reads fail.
- Avoid destructive sync paths unless explicitly requested.
- For schema changes, prefer idempotent SQL and inspect existing migrations first.

## MCP Server

From `mcp-server/`:

```powershell
npm.cmd run build
```

Before write testing, check service role key presence without printing secret values.

## Security Harness

Run this before deployment and after any change to `.env*`, deployment config, Supabase setup, MCP credential handling, or scripts that read provider tokens:

```powershell
npm.cmd run security:check
```

The command reports file paths, line numbers, and variable names only. It must not print secret values.

### `check:secret-file-tracking`

- Purpose: Confirm no secret-bearing environment file is tracked by Git.
- Target files: `.env*`, `.gitignore`
- Command: `npm.cmd run security:check`
- Failure example: `.env.vercel` is tracked.
- Pass criteria: Only `.env.example` may be tracked.
- Recovery: Run `git rm --cached <env-file>`, keep the file local if needed, and rotate any credential that was already committed.

### `check:secret-pattern-scan`

- Purpose: Detect high-signal hard-coded credential literals in tracked text files.
- Target files: tracked source, docs, scripts, config, and harness files.
- Command: `npm.cmd run security:check`
- Failure example: A JWT-like token, provider API key, private key block, or hard-coded secret assignment appears in source.
- Pass criteria: No high-signal secret literal is detected in tracked files.
- Recovery: Move the value to the deployment environment or local `.env*`, replace tracked docs with placeholders, and rotate exposed credentials.

### `check:env-example-safety`

- Purpose: Keep `.env.example` useful without leaking real values.
- Target files: `.env.example`
- Command: `npm.cmd run security:check`
- Failure example: `.env.example` contains a real token instead of `YOUR_*`.
- Pass criteria: All secret-like values in `.env.example` are placeholders.
- Recovery: Replace real values with placeholders and rotate any value that was committed.

## Skills and Harness Docs

Validate each changed skill:

```powershell
python C:\Users\user\.codex\skills\.system\skill-creator\scripts\quick_validate.py .codex\skills\<skill-name>
```

If a harness lesson was learned, update `docs/harness/trial-and-error-log.md`.

## Obsidian Registry Checks

### `check:repo-extraction-success`

- Purpose: Confirm the checkout can be scanned into the registry manifest.
- Target files: `tools/extraction/generate_site_code_graph.js`, `docs/registry/site-code-graph.json`, `docs/registry/extraction-manifest.json`
- Command: `node tools/extraction/generate_site_code_graph.js`
- Failure example: Git is unavailable, no files are scanned, or the script throws before writing JSON.
- Pass criteria: The command exits 0 and reports scanned files, generated nodes, generated edges, and warnings.
- Recovery: Inspect the thrown path or parser error, fix the extractor, and rerun the command.

### `check:site-code-graph-schema-validity`

- Purpose: Confirm the graph manifest has required metadata, nodes, edges, IDs, and catalog references.
- Target files: `docs/registry/site-code-graph.json`, `docs/registry/site-code-graph.schema.json`, `docs/harness/system-catalog.md`
- Command: `node tools/validation/validate_site_code_graph.js`
- Failure example: A node is missing `source_path`, an edge points to an unknown node, or a catalog ID is missing.
- Pass criteria: The command exits 0 and prints that schema, references, and evidence are valid.
- Recovery: Regenerate the graph or correct the catalog/reference mismatch.

### `check:source-path-validity`

- Purpose: Confirm every active registry node points to a real file in the checkout.
- Target files: `docs/registry/site-code-graph.json`
- Command: `node tools/validation/validate_source_paths.js`
- Failure example: `component:foo` has `source_path: src/components/Foo.tsx` but the file does not exist.
- Pass criteria: Every active node path exists.
- Recovery: Regenerate the registry, remove stale active nodes, or mark non-existing ideas as planned only with explicit evidence.

### `check:obsidian-link-integrity`

- Purpose: Confirm generated and curated Obsidian wikilinks resolve.
- Target files: `docs/obsidian/**/*.md`
- Command: `node tools/validation/validate_obsidian_links.js`
- Failure example: `[[component-graph-canvas]]` appears but no matching `component-graph-canvas.md` exists.
- Pass criteria: All wikilinks resolve to Markdown files under `docs/obsidian`.
- Recovery: Regenerate generated docs or fix curated links to match generated node filenames.

### `check:relation-evidence-validity`

- Purpose: Confirm every relation has accepted evidence.
- Target files: `docs/registry/site-code-graph.json`
- Command: `node tools/validation/validate_site_code_graph.js`
- Failure example: An edge lacks evidence or uses an unsupported evidence kind.
- Pass criteria: Every edge has one or more evidence entries using the allowed evidence kinds.
- Recovery: Add extractor evidence, lower confidence with a warning, or remove the relation.

### `check:generated-docs-not-manually-edited`

- Purpose: Confirm generated Obsidian docs match the renderer output.
- Target files: `docs/obsidian/generated/**`
- Command: `node tools/validation/validate_registry_drift.js`
- Failure example: A generated node file was manually edited or a stale node file remains.
- Pass criteria: Renderer check mode reports no differences.
- Recovery: Move manual interpretation to `docs/obsidian/curated/**` or `docs/obsidian/overlays/**`, then rerender generated docs.

### `check:registry-drift`

- Purpose: Confirm the manifest and generated docs reflect the current checkout.
- Target files: `docs/registry/site-code-graph.json`, `docs/registry/extraction-manifest.json`, `docs/obsidian/generated/**`
- Command: `node tools/validation/validate_registry_drift.js`
- Failure example: A route/component/API/DB file changed but the registry was not regenerated.
- Pass criteria: Extraction check mode and render check mode both pass.
- Recovery: Run `node tools/extraction/generate_site_code_graph.js` and `node tools/extraction/render_obsidian_registry.js`, then rerun validation.
