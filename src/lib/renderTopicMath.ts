import katex from 'katex';

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function decodeMathSource(value: string | null | undefined) {
    if (!value) return '';

    const htmlDecodedValue = value
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

    try {
        return decodeURIComponent(htmlDecodedValue);
    } catch {
        return htmlDecodedValue;
    }
}

function looksLikeMathSource(expression: string) {
    const trimmed = expression.trim();
    if (!trimmed) return false;

    return (
        /[=^_]/.test(trimmed) ||
        /\\(?:frac|sum|int|partial|nabla|cdot|times|hat|psi|phi|omega|Delta|lambda|sqrt|vec|mathbf|boldsymbol)/.test(trimmed) ||
        /[A-Za-z]\s*(?:[+\-*/=<>]|\\,)/.test(trimmed) ||
        /[A-Za-z]\d/.test(trimmed)
    );
}

function normalizeDelimitedMath(html: string) {
    return html
        .replace(
            /<p>\s*\$\$([\s\S]*?)\$\$\s*<\/p>/g,
            (_match, expression: string) =>
                `<div data-katex-block="${escapeAttribute(encodeURIComponent(expression.trim()))}"></div>`,
        )
        .replace(
            /\$\$([\s\S]*?)\$\$/g,
            (_match, expression: string) =>
                `<div data-katex-block="${escapeAttribute(encodeURIComponent(expression.trim()))}"></div>`,
        )
        .replace(
            /<p>\s*\\\[(.*?)\\\]\s*<\/p>/gs,
            (_, expression: string) =>
                `<div data-katex-block="${escapeAttribute(encodeURIComponent(expression.trim()))}"></div>`,
        )
        .replace(
            /\\\[(.*?)\\\]/gs,
            (_, expression: string) =>
                `<div data-katex-block="${escapeAttribute(encodeURIComponent(expression.trim()))}"></div>`,
        )
        .replace(
            /\\\((.*?)\\\)/gs,
            (_, expression: string) =>
                `<span data-katex-inline="${escapeAttribute(encodeURIComponent(expression.trim()))}"></span>`,
        )
        .replace(
            /(^|[^\\$])\$([^\$\n]+?)\$/g,
            (_match, prefix: string, expression: string) => {
                if (!looksLikeMathSource(expression)) {
                    return `${prefix}$${expression}$`;
                }

                return `${prefix}<span data-katex-inline="${escapeAttribute(encodeURIComponent(expression.trim()))}"></span>`;
            },
        );
}

function renderMathSource(source: string, displayMode: boolean) {
    return katex.renderToString(source, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
    });
}

function getAttributeFromHtml(attributeText: string, attributeName: string) {
    const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = attributeText.match(new RegExp(`\\b${escapedName}="([^"]*)"`, 'i'));
    return match ? match[1] : null;
}

function shouldRenderFormulaAsDisplay(attributeText: string) {
    return (
        /\bdata-display="true"/i.test(attributeText) ||
        /\bclass="[^"]*\bql-formula-display\b[^"]*"/i.test(attributeText)
    );
}

function renderKatexPlaceholders(html: string) {
    return html
        .replace(
            /<span\b([^>]*\bclass="[^"]*\bql-formula\b[^"]*"[^>]*)><\/span>/g,
            (match, attributeText: string) => {
                const source = decodeMathSource(getAttributeFromHtml(attributeText, 'data-value'));
                if (!source.trim()) return match;

                return renderMathSource(source, shouldRenderFormulaAsDisplay(attributeText));
            },
        )
        .replace(
            /<span\b[^>]*data-katex-inline="([^"]+)"[^>]*><\/span>/g,
            (_match, encodedSource: string) => {
                const source = decodeMathSource(encodedSource);
                return source.trim() ? renderMathSource(source, false) : '';
            },
        )
        .replace(
            /<div\b[^>]*data-katex-block="([^"]+)"[^>]*><\/div>/g,
            (_match, encodedSource: string) => {
                const source = decodeMathSource(encodedSource);
                return source.trim() ? renderMathSource(source, true) : '';
            },
        );
}

export interface RenderTopicHtmlOptions {
    resolveWikiTarget?: (targetText: string) => string | null;
}

export function createKatexBlockMarkup(source: string) {
    return `<div data-katex-block="${escapeAttribute(encodeURIComponent(source.trim()))}"></div>`;
}

export function createKatexInlineMarkup(source: string) {
    return `<span data-katex-inline="${escapeAttribute(encodeURIComponent(source.trim()))}"></span>`;
}

function normalizeWikiLinks(html: string, resolveWikiTarget?: RenderTopicHtmlOptions['resolveWikiTarget']) {
    if (!resolveWikiTarget) {
        return html;
    }

    return html.replace(/\[\[([^[\]]+?)\]\]/g, (_match, rawTarget: string) => {
        const targetText = rawTarget.trim();
        if (!targetText) {
            return _match;
        }

        const href = resolveWikiTarget(targetText);
        if (!href) {
            return `<span class="text-white/70">${escapeHtml(targetText)}</span>`;
        }

        return `<a href="${escapeAttribute(href)}">${escapeHtml(targetText)}</a>`;
    });
}

export function renderTopicMathHtml(html: string, options: RenderTopicHtmlOptions = {}) {
    const normalizedHtml = renderKatexPlaceholders(
        normalizeWikiLinks(normalizeDelimitedMath(html), options.resolveWikiTarget),
    );

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return normalizedHtml;
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(`<body>${normalizedHtml}</body>`, 'text/html');

    document.body.querySelectorAll<HTMLElement>('span.ql-formula').forEach((element) => {
        const source = element.dataset.value || element.textContent || '';
        if (!source.trim()) return;

        const displayMode =
            element.dataset.display === 'true' ||
            element.classList.contains('ql-formula-display') ||
            element.closest('p')?.textContent?.trim() === element.textContent?.trim();

        element.outerHTML = renderMathSource(source, displayMode);
    });

    document.body.querySelectorAll<HTMLElement>('[data-katex-block]').forEach((element) => {
        const source = decodeMathSource(element.getAttribute('data-katex-block'));
        if (!source.trim()) return;

        element.outerHTML = renderMathSource(source, true);
    });

    document.body.querySelectorAll<HTMLElement>('[data-katex-inline]').forEach((element) => {
        const source = decodeMathSource(element.getAttribute('data-katex-inline'));
        if (!source.trim()) return;

        element.outerHTML = renderMathSource(source, false);
    });

    return document.body.innerHTML;
}
