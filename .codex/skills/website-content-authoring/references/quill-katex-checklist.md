# Quill and KaTeX Checklist

Use before declaring a topic import complete.

## Structure

- The document has one centered `<h1>` title.
- Expandable sections use real `<h2>` elements.
- Section order matches the source order.
- Paragraphs are short enough for the website reading layout.

## Formulas

- Inline formulas use `<span class="ql-formula" data-value="..."></span>`.
- Display formulas include `ql-formula-display` and `data-display="true"`.
- No raw `$$...$$` remains.
- No `\tag{}` appears inside `data-value`.
- Attribute values escape `&`, `"`, `<`, and `>`.
- Long formulas do not contain line breaks inside `data-value`.

## Overrides

- Override keys include the exact DB `slug`.
- Override keys include the exact DB `title`.
- Override keys include a lowercase-hyphenated compatibility key when useful.
