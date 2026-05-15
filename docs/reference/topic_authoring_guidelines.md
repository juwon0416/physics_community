# Topic Authoring Guidelines

This guideline defines the default writing standard for topic content added to the Physics Community editor and graph-linked topic pages.

## Goal

Write topic articles so they read like compact academic notes rather than casual summaries. The target voice is formal, explanatory, and mathematically literate.

## Default Structure

Use this order unless the topic strongly requires a different arrangement.

1. Centered title
2. Centered subtitle or short classification line
3. Abstract
4. Introduction
5. Historical or conceptual background
6. Formal structure or derivation
7. Canonical experiments or examples
8. Interpretation or significance
9. Conclusion
10. References for further study

## Tone

- Write in clear academic English by default.
- Prefer full sentences and logically connected paragraphs.
- Avoid blog-style phrasing, hype, or conversational filler.
- Keep claims precise and avoid overstating philosophical conclusions.

## Layout

- Main title should be centered.
- Abstract and major section headings may be centered when the article is intentionally paper-like.
- Long explanatory paragraphs may also be centered only when matching the established page style.
- Use blank paragraphs sparingly to separate major sections.

## Math

- Include formulas whenever they materially improve understanding.
- Inline math should be used for short relations such as `E = h\nu` or `\lambda = h/p`.
- Standalone equations should be placed on their own centered line.
- Important displayed equations should have breathing room above and below for readability.
- Prefer a short explanatory paragraph immediately before or after each major equation.

## Equation Formatting

- For standalone equations in Quill/Katex content, place the formula alone inside a centered paragraph.
- Example pattern:

```html
<p class="ql-align-center"><span class="ql-formula" data-value="E = h\nu"></span></p>
```

- Do not place extra text in the same paragraph as a displayed equation.

## Content Standards

- Define symbols when they first appear.
- Distinguish clearly between historical motivation, formal derivation, and interpretation.
- If a statement is approximate, say so explicitly.
- When discussing measurement or interpretation, separate empirical facts from interpretive claims.

## References

- End with a short “References for Further Study” section.
- Prefer standard textbooks, lecture notes, or classic papers over vague web references.

## Editing Rules

- Prefer updating existing topic structure instead of mixing multiple writing styles in one page.
- If a page already uses a paper-style centered layout, preserve it.
- If formulas are central to the topic, include several representative equations rather than a single token formula.
- Keep HTML Quill-friendly and avoid unsupported custom markup.
