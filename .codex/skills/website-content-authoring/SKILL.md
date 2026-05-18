---
name: website-content-authoring
description: Use when converting or editing physics topic content for the website, including TeX, PDF, DOCX, markdown, or plain text imports, Quill-compatible HTML, KaTeX formula spans, topic authoring, and TOPIC_CONTENT_OVERRIDES updates.
---

# Website Content Authoring

## Overview

Convert physics sources into editor-ready topic content that renders correctly in topic pages, the graph directory, and Quill-compatible editor flows.

## Load First

- `docs/file_to_website_markdown_pipeline.md` for the active import workflow.
- `docs/reference/topic_authoring_guidelines.md` for writing style.
- `docs/harness/trial-and-error-log.md` before repeating a content import that previously failed.
- `references/quill-katex-checklist.md` for the compact validation checklist.

## Workflow

1. Identify the target topic slug, title, graph node, and whether DB writes are possible.
2. Prefer MCP or Supabase writes only when a service role key is available. Otherwise use `src/data/topicContentOverrides.ts`.
3. Rewrite source material as compact academic notes, not a raw page-layout copy.
4. Use real HTML headings. The first `<h1>` is the title; graph sections should be `<h2>`.
5. Convert formulas to Quill `ql-formula` spans.
6. Avoid raw `$$...$$`, raw TeX layout commands, and `\tag{}` inside formula attributes.
7. Add override keys for exact DB slug, exact DB title, and a lowercase-hyphenated future-proof key when using overrides.
8. Validate formula rendering and section extraction before build or deploy.
9. For bundled file ontology Markdown in `src/data/*Ontology.ts`, run `npm.cmd run ontology:math:check` before build.
10. For file ontology files, author both reading layers: `summary` is the concise graph-card preview that states what the node contains and how it connects; `content` is the full maximized reader document with detailed derivation and references.
11. Log new rendering pitfalls with `harness-memory`.

## Guardrails

- Preserve existing page style when editing an established topic.
- Keep `data-value` formula attributes one line and HTML-escaped.
- If `TopicPage.tsx` prefers a `pdf_url`, inspect page logic before assuming content is missing.
- Section order must follow source order, not alphabetical sorting.
- File ontology Markdown supports multi-line `$$ ... $$` display math and `\(...\)` inline math; do not rely on raw TeX appearing as plain text in graph nodes.
- Normal graph cards should not render the full file body. Keep graph-preview summaries compact and push detailed explanation into the full file content.
- Graph-card summaries should expose the core conclusion, core equation, and prerequisite flow in a compact scan-friendly form; use full reader content for derivations and references.
