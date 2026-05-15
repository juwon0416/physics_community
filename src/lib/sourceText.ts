import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const MAX_PDF_PAGES = 40;
const MAX_TEXT_CHARS = 180_000;

export type SourceDocumentKind = 'pdf' | 'markdown' | 'text';

export interface ExtractedSourceText {
    kind: SourceDocumentKind;
    text: string;
    preview: string;
    pageCount: number | null;
    headings: string[];
    paragraphs: string[];
    equationCandidates: string[];
}

function normalizeWhitespace(value: string) {
    return value
        .replace(/\u0000/g, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
}

function uniqueItems(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractParagraphsFromText(text: string) {
    const paragraphs = text
        .split(/\n{2,}/)
        .flatMap((block) => {
            const normalized = block.trim();
            if (normalized.length < 80) {
                return normalized ? [normalized] : [];
            }

            return [normalized];
        });

    return uniqueItems(paragraphs).slice(0, 80);
}

function extractEquationCandidates(text: string) {
    const lineCandidates = text
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => line.length >= 6 && line.length <= 180)
        .filter((line) =>
            /=|∂|∫|Σ|Δ|∇|d\/dt|dx|dv|dp|\\frac|->|→|<=|>=|[A-Za-z]+\([^)]+\)/.test(line),
        );

    const inlineMatches = Array.from(
        text.matchAll(
            /\b([A-Za-z][A-Za-z0-9_]*\s*=\s*[^.;,\n]{2,80}|d[A-Za-z]\/dt\s*=\s*[^.;,\n]{2,80}|\\frac\{[^}]+\}\{[^}]+\}|[A-Za-z]\([^)]*\)\s*=\s*[^.;,\n]{2,80})/g,
        ),
    ).map((match) => match[1].replace(/\s+/g, ' ').trim());

    return uniqueItems([...lineCandidates, ...inlineMatches]).slice(0, 40);
}

function extractHeadingsFromText(text: string) {
    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const headings = new Set<string>();

    lines.forEach((line) => {
        if (line.startsWith('#')) {
            const markdownHeading = line.replace(/^#+\s*/, '').trim();
            if (markdownHeading.length >= 3) {
                headings.add(markdownHeading);
            }
            return;
        }

        const isLikelyHeading =
            line.length >= 4 &&
            line.length <= 80 &&
            !/[.?!]$/.test(line) &&
            /^[A-Za-z0-9 ,:;()/'"-]+$/.test(line);

        if (isLikelyHeading) {
            headings.add(line);
        }
    });

    return Array.from(headings).slice(0, 40);
}

async function extractPdfText(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageLimit = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .filter(Boolean)
            .join(' ');
        pageTexts.push(pageText);
    }

    const normalizedText = truncateText(normalizeWhitespace(pageTexts.join('\n\n')), MAX_TEXT_CHARS);
    return {
        kind: 'pdf' as const,
        text: normalizedText,
        preview: truncateText(normalizedText, 1200),
        pageCount: pdf.numPages,
        headings: extractHeadingsFromText(normalizedText),
        paragraphs: extractParagraphsFromText(normalizedText),
        equationCandidates: extractEquationCandidates(normalizedText),
    };
}

async function extractPlainText(file: File, kind: SourceDocumentKind) {
    const rawText = await file.text();
    const normalizedText = truncateText(normalizeWhitespace(rawText), MAX_TEXT_CHARS);

    return {
        kind,
        text: normalizedText,
        preview: truncateText(normalizedText, 1200),
        pageCount: null,
        headings: extractHeadingsFromText(normalizedText),
        paragraphs: extractParagraphsFromText(normalizedText),
        equationCandidates: extractEquationCandidates(normalizedText),
    };
}

export async function extractSourceText(file: File): Promise<ExtractedSourceText> {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return extractPdfText(file);
    }

    const isMarkdown =
        file.type === 'text/markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.markdown');

    if (isMarkdown) {
        return extractPlainText(file, 'markdown');
    }

    return extractPlainText(file, 'text');
}
