# File to Website Markdown Pipeline

This note is the reusable workflow for converting an incoming source file into a website editor document. Read this first before doing another file import. It records the current website-specific rules so the next run can avoid re-discovering rendering, section, and deployment details.

## Goal

Convert a user-provided file, such as `.tex`, `.pdf`, `.docx`, or plain text, into content that works naturally inside the Physics Community website editor and graph/directory views.

The final website content should usually be **Quill-compatible HTML**, not raw Markdown, because the editor and the already-working `Wave-Particle Duality` file use Quill HTML.

For large graph-view ontology inputs, read `docs/reference/large_file_ontology_workflow.md` first. Large files should be ingested through a manifest, structure-preserving extraction, chunk inventory, and ontology expansion plan before any final file or edge writes.

## Important Repo Files

- `src/data/topicContentOverrides.ts`
  - Current safest fallback path when DB writes are blocked by Supabase RLS.
  - Use this for topic-level content overrides such as `planck-quantization`.
- `src/data/storage.ts`
  - Merges DB topic data with seed/override content for topic pages.
- `src/lib/graphModel.ts`
  - Builds graph and directory section nodes from topic content headings.
  - Graph section extraction depends on real HTML headings: `<h1>`, `<h2>`, etc.
- `src/lib/renderTopicMath.ts`
  - Converts Quill formulas and math placeholders into KaTeX HTML.
- `src/pages/TopicPage.tsx`
  - Read-only topic display and spacing/styling for rendered content.
- `src/components/graph/OntologyGraphView.tsx`
  - Active graph display used by `GraphOverviewPage`.
  - Retired graph view experiments are preserved in `trash/src-unused/components/graph/`.
- `mcp-server/`
  - Local MCP server exists, but DB write tools require service role access.

## Preferred Content Format

Use Quill-style HTML modeled after `Wave-Particle Duality`.

### Headings

Use centered headings:

```html
<h1 class="ql-align-center">Planck Quantization</h1>
<h2 class="ql-align-center">1. The Black-Body Problem</h2>
```

Rules:

- The first `<h1>` is treated as the document title and should not become a section node.
- Use `<h2>` for file sections that should appear when the file is expanded in the directory/graph view.
- Keep section order in the source content. `graphModel.ts` extracts headings in source order.

### Paragraphs

Use centered paragraphs:

```html
<p class="ql-align-center">Text goes here.</p>
```

For explanatory notes:

```html
<p class="ql-align-center"><span style="color: rgba(255, 255, 255, 0.72);">mode density x mean energy per mode</span></p>
```

Keep paragraphs shorter than a paper-style block. The website reads better when content is rewritten as a structured archive note.

## Math Format

The safest format is `ql-formula`, matching the existing working `Wave-Particle Duality` content.

### Inline Math

```html
<span class="ql-formula" data-value="h\nu"></span>
```

### Display Math

```html
<p class="ql-align-center math-block">
  <span class="ql-formula ql-formula-display" data-display="true" data-value="u(\nu,T)=\frac{8\pi h\nu^3}{c^3}\frac{1}{\exp(h\nu/k_{\mathrm B}T)-1}"></span>
</p>
```

Rules:

- Do not leave raw `$$...$$` in final editor content.
- Do not use custom `data-katex-*` placeholders for final website content unless there is a specific reason.
- Do not put `\tag{}` inside `data-value`; Quill-style formula rendering can break. If equation numbers are requested, put numbers outside the formula span. In the current preferred style, omit equation numbers.
- Avoid line breaks inside `data-value`. Normalize long formulas to one line.
- Escape attribute values:
  - `&` to `&amp;`
  - `"` to `&quot;`
  - `<` to `&lt;`
  - `>` to `&gt;`

## Recommended Document Structure

For physics notes, prefer this shape:

1. Title
2. Short subtitle/context paragraph
3. Abstract
4. Numbered conceptual sections as `<h2>`
5. Display formulas separated by short explanatory paragraphs
6. Summary
7. References, if useful

Example:

```html
<h1 class="ql-align-center">Planck Quantization</h1>
<p class="ql-align-center"><strong>Black-Body Radiation, Resonators, and the Energy Element</strong></p>

<h2 class="ql-align-center">Abstract</h2>
<p class="ql-align-center">Planck quantization begins with the universal spectrum of black-body radiation...</p>

<h2 class="ql-align-center">1. The Black-Body Problem</h2>
<p class="ql-align-center">The quantity to be explained is the spectral energy density...</p>
<p class="ql-align-center math-block"><span class="ql-formula ql-formula-display" data-display="true" data-value="u(\nu,T)"></span></p>
```

## Conversion Strategy by Source Type

### TeX

1. Extract title, author/date if needed, abstract, sections, display equations, inline math, references.
2. Rewrite into editor-friendly sections unless the user explicitly asks for exact preservation.
3. Convert inline `$...$` to `ql-formula`.
4. Convert display math environments to block `ql-formula-display`.
5. Remove LaTeX layout commands:
   - `\twocolumn`
   - `\maketitle`
   - `\begingroup`
   - `\small`
   - `\section{...}`
   - `\begin{equation}` / `\end{equation}`
6. Do not include equation numbers unless explicitly requested.

### PDF

1. Extract text using available workspace PDF tools if needed.
2. Reconstruct headings manually if PDF extraction loses structure.
3. Convert math carefully. If source math is image-only or OCR-corrupted, prefer rewriting formulas manually.

### DOCX / Plain Text

1. Extract headings and body.
2. Normalize headings to `<h2 class="ql-align-center">`.
3. Convert math-like fragments into `ql-formula`.
4. Preserve logical structure, not page layout.

## DB and MCP Notes

There is a local MCP server in `mcp-server/` with tools such as:

- `list_topics`
- `get_topic`
- `write_topic_draft`
- `upsert_topic`
- `upsert_section`

However, writing through MCP currently requires a Supabase service role key. Without it, writes fail with RLS errors such as:

```text
new row violates row-level security policy for table "graph_nodes"
```

Recommended decision:

- If `MCP_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is available, use MCP `write_topic_draft`.
- If service role key is missing, do not spend time retrying anon writes. Use `src/data/topicContentOverrides.ts` and deploy.

Check for service role key presence without printing secrets:

```powershell
$names = @('MCP_SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SERVICE_ROLE_KEY')
foreach ($name in $names) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if ($value) { Write-Output "$name=present" } else { Write-Output "$name=missing" }
}
```

## Validation Checklist

Before build/deploy:

- Content uses `ql-formula`, not raw `$$`.
- Display math has both:
  - `class="ql-formula ql-formula-display"`
  - `data-display="true"`
- No `\tag{}` in formula `data-value`.
- No raw TeX layout commands remain.
- Headings are real `<h2>` elements.
- Section order in source is correct.
- Long `data-value` attributes have no line breaks.

Useful Node validation pattern:

```js
const fs = require('node:fs');
const katex = require('katex');

const source = fs.readFileSync('src/data/topicContentOverrides.ts', 'utf8');
const literal = source.match(/'planck-quantization': (.*),\n};/s)?.[1];
const content = JSON.parse(literal);

const formulas = [...content.matchAll(/<span\b([^>]*\bclass="[^"]*\bql-formula\b[^"]*"[^>]*)><\/span>/g)]
  .map((match) => {
    const attrs = match[1];
    const raw = attrs.match(/\bdata-value="([^"]*)"/i)?.[1] || '';
    const value = raw
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const display = /data-display="true"/i.test(attrs) || /ql-formula-display/.test(attrs);
    return { value, display };
  });

const errors = [];
for (const [index, formula] of formulas.entries()) {
  try {
    katex.renderToString(formula.value, {
      displayMode: formula.display,
      throwOnError: true,
      strict: 'ignore',
    });
  } catch (error) {
    errors.push({ index: index + 1, formula, error: error.message });
  }
}

console.log({
  formulaCount: formulas.length,
  displayCount: formulas.filter((formula) => formula.display).length,
  errors,
});
```

## Build and Deploy

Use Windows `.cmd` commands because PowerShell can block `npm.ps1`.

Build:

```powershell
npm.cmd run build
```

Deploy:

```powershell
C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -Command "npx.cmd vercel --prod --yes"
```

Expected production alias:

```text
https://physicscommunity.vercel.app
```

## Override Key Matching

`TOPIC_CONTENT_OVERRIDES` is a plain JS object. Keys are matched **case-sensitively** against:

1. `normalizeTopicSlug(topic.slug)` — the DB `slug` column.
2. `normalizeTopicSlug(topic.title)` — the DB `title` column.

`normalizeTopicSlug` strips URL prefixes, query params, and `topic/` prefix, but it does **not** lowercase or hyphenate. Therefore a DB slug like `Many-Body Physics` will never match an override key `density-of-state`.

### Diagnostic Steps

When an override is not applying:

1. Query the DB to find the actual `slug` and `title` for the target topic:

```powershell
node -e "const{createClient}=require('@supabase/supabase-js');const c=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_ANON_KEY);(async()=>{const{data}=await c.from('topics').select('id,slug,title').ilike('title','%TARGET_KEYWORD%');console.log(JSON.stringify(data,null,2))})()"
```

2. Also check the `graph_nodes` table for the node's `data.slug` field (this is what `handleNodeOpen` reads):

```powershell
node -e "const{createClient}=require('@supabase/supabase-js');const c=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_ANON_KEY);(async()=>{const{data}=await c.from('graph_nodes').select('id,label,data').ilike('label','%TARGET_KEYWORD%');console.log(JSON.stringify(data,null,2))})()"
```

3. Add **all case-exact variants** to the override map:

```typescript
export const TOPIC_CONTENT_OVERRIDES: Record<string, string> = {
    'density-of-state': content,       // lowercase-hyphenated (future-proofing)
    'Density of State': content,       // exact DB title
    'Many-Body Physics': content,      // exact DB slug (can differ from title!)
};
```

### Key Rule

Always add override entries for:
- The exact DB `slug` value (as-is, no transformation).
- The exact DB `title` value (as-is, no transformation).
- A lowercase-hyphenated form for forward compatibility.

## Common Pitfalls

- Raw Markdown may not render like the editor. Prefer Quill HTML.
- Raw `$...$` can work in read-only rendering, but is less stable for editor compatibility.
- `data-katex-*` can work in `renderTopicMathHtml`, but it does not match the existing editor storage style.
- `\tag{}` inside formula spans can break or render inconsistently. Avoid it.
- If target topic has `pdf_url`, `TopicPage.tsx` may prefer PDF display over content. Check page logic before assuming content will show in read-only view.
- DB content and override content can differ. Graph/directory section generation must receive the same content source as the topic page.
- Directory section order can be broken if sections are sorted alphabetically. Ensure graph section nodes preserve `sectionIndex` from `graphModel.ts`.
- **Override keys are case-sensitive.** `normalizeTopicSlug` does not lowercase. Always verify the exact DB slug and title before choosing override keys.

## Short Next-Time Prompt for Codex

Use this when importing a new file:

```text
Read docs/file_to_website_markdown_pipeline.md first. Convert the attached/source file into Quill-compatible website content using ql-formula math, h2 section headings, natural editor-friendly structure, no equation numbers unless requested, validate KaTeX formulas, then build and deploy.
```
