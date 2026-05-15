import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { storage, type Topic } from '../data/storage';
import { Loader2, ChevronLeft } from 'lucide-react';
import { ARCHIVE_SCHEMA_SETUP_MESSAGE, checkArchiveSchemaReady } from '../lib/archiveSchema';
import { normalizeGraphViewScope } from '../lib/graphModel';
import { renderTopicMathHtml } from '../lib/renderTopicMath';
import { getArchiveFundamentalsTopics } from '../data/archiveFundamentals';
import { TIMELINE_TOPICS } from '../data/seed';
import { cn } from '../lib/cn';
import { useTheme } from '../lib/theme';
import 'katex/dist/katex.min.css';

function ReadOnlyTopicDocument({
    title,
    content,
    graphView,
    onBack,
}: {
    title: string;
    content: string;
    graphView: 'legacy' | 'archive';
    onBack: () => void;
}) {
    const { isLight } = useTheme();
    const resolveWikiTarget = useMemo(() => {
        const entries =
            graphView === 'archive'
                ? getArchiveFundamentalsTopics().map((topic) => [topic.title, topic.slug] as const)
                : TIMELINE_TOPICS.map((topic) => [topic.title, topic.slug] as const);

        const topicHrefByTitle = new Map<string, string>();
        entries.forEach(([entryTitle, slug]) => {
            topicHrefByTitle.set(entryTitle.trim().toLowerCase(), `/topic/${slug}?view=${graphView}`);
        });

        return (targetText: string) => topicHrefByTitle.get(targetText.trim().toLowerCase()) || null;
    }, [graphView]);

    const renderedContent = useMemo(
        () => renderTopicMathHtml(content, { resolveWikiTarget }),
        [content, resolveWikiTarget],
    );

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            <header className="relative flex h-14 shrink-0 items-center border-b border-border px-4 shadow-sm">
                <button onClick={onBack} className="z-10 mr-4 rounded-md p-2 transition hover:bg-muted">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                    <div className="text-lg font-semibold px-4 line-clamp-1">{title}</div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-4xl px-6 py-10">
                    <article
                        className={cn(
                            'prose max-w-none rounded-[2rem] border border-border bg-card/80 px-6 py-8 shadow-xl prose-headings:font-semibold prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-xl prose-p:my-5 prose-p:leading-8 prose-table:table-auto [&_.katex-display]:my-8 [&_.katex-display]:overflow-x-auto [&_.katex-display_.katex]:text-[1.14em] [&_.math-block]:my-8 [&_.ql-align-center]:text-center',
                            isLight
                                ? 'prose-slate prose-p:text-slate-700 prose-li:text-slate-700 prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-50 prose-code:text-blue-700 prose-th:text-slate-700 prose-td:text-slate-700'
                                : 'prose-invert prose-p:text-white/78 prose-li:text-white/72 prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/35 prose-code:text-cyan-200 prose-th:text-white/72 prose-td:text-white/70',
                        )}
                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                    />
                </div>
            </div>
        </div>
    );
}

export function TopicPage() {
    const { topicSlug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const graphView = normalizeGraphViewScope(searchParams.get('view'));
    
    const [topic, setTopic] = useState<Topic | null>(null);
    const [isLoadingTopic, setIsLoadingTopic] = useState(true);
    const [isArchiveSchemaReady, setIsArchiveSchemaReady] = useState(true);

    useEffect(() => {
        let isMounted = true;

        if (graphView !== 'archive') {
            setIsArchiveSchemaReady(true);
            return () => {
                isMounted = false;
            };
        }

        const loadArchiveSchemaState = async () => {
            try {
                const ready = await checkArchiveSchemaReady();
                if (isMounted) {
                    setIsArchiveSchemaReady(ready);
                }
            } catch {
                if (isMounted) {
                    setIsArchiveSchemaReady(false);
                }
            }
        };

        void loadArchiveSchemaState();

        return () => {
            isMounted = false;
        };
    }, [graphView]);

    useEffect(() => {
        if (!topicSlug) return;
        const load = async () => {
            setIsLoadingTopic(true);
            const data = await storage.getTopicBySlug(topicSlug, graphView);
            setTopic(data);
            setIsLoadingTopic(false);
        };
        void load();
    }, [graphView, topicSlug]);

    if (isLoadingTopic) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-6 text-foreground">
                <div className="max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl">
                    <h1 className="text-xl font-semibold">
                        {graphView === 'archive' && !isArchiveSchemaReady ? 'Archive DB Not Ready' : 'Topic Not Found'}
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        {graphView === 'archive' && !isArchiveSchemaReady
                            ? ARCHIVE_SCHEMA_SETUP_MESSAGE
                            : `The requested topic does not exist in the ${graphView} graph database.`}
                    </p>
                    <button
                        onClick={() => navigate('/graph')}
                        className="mt-6 inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Graph
                    </button>
                </div>
            </div>
        );
    }

    if (topic.content && topic.content.trim().length > 0) {
        return (
            <ReadOnlyTopicDocument
                title={topic.title}
                content={topic.content}
                graphView={graphView}
                onBack={() => navigate(-1)}
            />
        );
    }

    // No editor content attached
    return (
        <div className="flex h-screen flex-col bg-background font-sans text-foreground">
            <header className="relative flex h-14 shrink-0 items-center border-b border-border px-4 shadow-sm">
                <button onClick={() => navigate(-1)} className="z-10 mr-4 rounded-md p-2 transition hover:bg-muted">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                    <div className="text-lg font-semibold px-4 line-clamp-1">{topic.title}</div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl">
                    <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">No Content Available</h2>
                    <p className="text-sm text-muted-foreground">Editor content has not been written for this topic yet.</p>
                </div>
            </div>
        </div>
    );
}
