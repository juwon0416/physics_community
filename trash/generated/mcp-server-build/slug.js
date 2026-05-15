export function normalizeTopicSlug(value) {
    if (typeof value !== 'string')
        return null;
    let normalized = value.trim();
    if (!normalized)
        return null;
    normalized = normalized.split(/[?#]/, 1)[0];
    normalized = normalized.replace(/^https?:\/\/[^/]+/i, '');
    normalized = normalized.replace(/^\/+/, '');
    if (normalized.startsWith('topic/')) {
        normalized = normalized.slice('topic/'.length);
    }
    normalized = normalized.replace(/^\/+/, '').replace(/\/+$/, '');
    return normalized || null;
}
