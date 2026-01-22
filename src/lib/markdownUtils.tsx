import { useNavigate } from 'react-router-dom';
import { conceptAPI } from './concepts';

/**
 * Replaces [[Concept]] patterns with markdown links [Concept](/concept/Concept)
 * Handles multiline content safely.
 */
export function processConceptLinks(content: string | undefined | null): string {
    if (!content) return '';
    return content.replace(/\[\[([\s\S]*?)\]\]/g, (_, term) => {
        const cleanTerm = term.trim();
        if (!cleanTerm) return `[[${term}]]`;
        return `[${cleanTerm}](/concept/${encodeURIComponent(cleanTerm)})`;
    });
}

/**
 * Custom renderer for markdown links to handle concept navigation.
 * Usage: <ReactMarkdown components={{ a: MarkdownLink }} ... />
 */
export const MarkdownLink = ({ href, children, ...props }: any) => {
    const navigate = useNavigate();

    // Handle Concept Links
    if (href && href.startsWith('/concept/')) {
        const term = decodeURIComponent(href.replace('/concept/', ''));
        return (
            <span
                className="text-blue-500 font-bold underline decoration-dotted cursor-help hover:text-blue-400 transition-colors inline-block"
                title={`Concept: ${term}`}
                onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        const concept = await conceptAPI.getByLabel(term);
                        if (concept?.data?.slug) {
                            navigate(concept.data.slug);
                        } else {
                            // Temporary alert until Concept Popover is ready
                            alert(`Concept: ${term}\n${concept?.data?.description || 'No description available.'}\n(Not yet a Topic Page)`);
                        }
                    } catch (err) {
                        console.error("Link navigation error:", err);
                    }
                }}
            >
                {children}
            </span>
        );
    }

    // Default Link
    return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">{children}</a>;
};
