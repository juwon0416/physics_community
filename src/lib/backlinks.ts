export interface LegacyBacklinkEntry {
    targetId: string;
    label: string;
}

export interface InlineBacklinkToken {
    targetText: string;
}

export interface ResolvedBacklinkEdge {
    source: string;
    target: string;
    label: 'mentions';
    type: 'mentions';
}

const LEGACY_BACKLINK_METADATA_PATTERN = /<!--\s*physics-community-backlinks:([\s\S]*?)-->/gi;
const INLINE_BACKLINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;

function normalizeLegacyBacklinkTargetId(value: unknown) {
    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function normalizeLegacyBacklinkLabel(value: unknown) {
    if (typeof value !== 'string') return 'mentions';

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : 'mentions';
}

export function normalizeInlineBacklinkTarget(value: string | null | undefined) {
    if (typeof value !== 'string') return null;

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
}

export function stripLegacyBacklinkMetadata(content: string | null | undefined) {
    return (content || '').replace(LEGACY_BACKLINK_METADATA_PATTERN, '').trim();
}

export function extractLegacyBacklinksFromContent(content: string | null | undefined) {
    const extractedEntries: LegacyBacklinkEntry[] = [];
    let hasMetadata = false;

    const strippedContent = (content || '').replace(
        LEGACY_BACKLINK_METADATA_PATTERN,
        (_match, serializedPayload) => {
            hasMetadata = true;

            try {
                const payload = JSON.parse(serializedPayload.trim()) as {
                    links?: Array<{ targetId?: unknown; label?: unknown }>;
                };

                if (Array.isArray(payload.links)) {
                    payload.links.forEach((link) => {
                        const targetId = normalizeLegacyBacklinkTargetId(link.targetId);
                        if (!targetId) return;

                        extractedEntries.push({
                            targetId,
                            label: normalizeLegacyBacklinkLabel(link.label),
                        });
                    });
                }
            } catch (error) {
                console.warn('Failed to parse legacy backlink metadata from topic content.', error);
            }

            return '';
        },
    );

    const dedupedEntries = new Map<string, LegacyBacklinkEntry>();
    extractedEntries.forEach((entry) => {
        dedupedEntries.set(`${entry.targetId}|${entry.label}`, entry);
    });

    return {
        content: strippedContent.trim(),
        backlinks: Array.from(dedupedEntries.values()),
        hasMetadata,
    };
}

export function extractInlineBacklinksFromContent(content: string | null | undefined): InlineBacklinkToken[] {
    const strippedContent = stripLegacyBacklinkMetadata(content);
    const dedupedTokens = new Map<string, InlineBacklinkToken>();

    strippedContent.replace(INLINE_BACKLINK_PATTERN, (_match, capturedTarget) => {
        const targetText = normalizeInlineBacklinkTarget(capturedTarget);
        if (!targetText) return '';

        dedupedTokens.set(targetText.toLowerCase(), { targetText });
        return '';
    });

    return Array.from(dedupedTokens.values());
}

export function createInlineBacklinkMarkup(targetText: string) {
    const normalized = normalizeInlineBacklinkTarget(targetText);
    return normalized ? `[[${normalized}]]` : null;
}

export function appendInlineBacklinksToContent(content: string, wikiLinks: string[]) {
    const normalizedLinks = Array.from(
        new Set(
            wikiLinks
                .map((wikiLink) => wikiLink.trim())
                .filter((wikiLink) => wikiLink.length > 0),
        ),
    );

    const strippedContent = stripLegacyBacklinkMetadata(content);
    if (normalizedLinks.length === 0) {
        return strippedContent;
    }

    const generatedParagraph = `<p>${normalizedLinks.join(', ')}</p>`;
    if (!strippedContent) {
        return generatedParagraph;
    }

    return `${strippedContent}\n${generatedParagraph}`;
}

export function backlinksToResolvedEdges(sourceId: string, backlinkTargets: string[]): ResolvedBacklinkEdge[] {
    return Array.from(new Set(backlinkTargets))
        .filter((targetId) => targetId !== sourceId)
        .map((targetId) => ({
            source: sourceId,
            target: targetId,
            label: 'mentions',
            type: 'mentions',
        }));
}
