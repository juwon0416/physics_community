import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Clock, MessageCircle, Send, Plus, Database, BookOpen, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { TIMELINE_TOPICS, FIELDS, KEYWORD_SECTIONS } from '../data/seed';
import { storage, type Question, type TopicSection } from '../data/storage';
import { useAuth } from '../lib/auth';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { PHYSICS_MACROS } from '../lib/latexMacros';
import { processConceptLinks, MarkdownLink } from '../lib/markdownUtils';

export function TopicPage() {
    const { topicSlug } = useParams();
    const navigate = useNavigate();
    const { isEditor, nickname } = useAuth();
    const topic = TIMELINE_TOPICS.find(t => t.slug === topicSlug);
    const field = FIELDS.find(f => f.id === topic?.fieldId);

    const [sections, setSections] = useState<TopicSection[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    // View Mode State
    const [viewMode, setViewMode] = useState<'light' | 'detailed'>('light');

    // CMS Logic
    const [isMigrating, setIsMigrating] = useState(false);

    // QnA logic
    const [newQTitle, setNewQTitle] = useState('');
    const [newQBody, setNewQBody] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (topic) {
            loadData();
        }
    }, [topic]);

    const loadData = async () => {
        if (!topic) return;
        const [qData, sData] = await Promise.all([
            storage.getQuestions(topic.id),
            storage.getSectionsByTopic(topic.id)
        ]);
        setQuestions(qData);
        setSections(sData);
    };

    const handleMigrateData = async () => {
        if (!topic) return;
        if (!confirm('This will populate the database with default seed data for this topic. Continue?')) return;

        setIsMigrating(true);
        const seedSections = KEYWORD_SECTIONS.filter(k => k.topicId === topic.id);

        for (const [index, seed] of seedSections.entries()) {
            await storage.addSection({
                topic_id: topic.id,
                title: seed.title,
                content: seed.content,
                order_index: index
            });
        }

        await loadData();
        setIsMigrating(false);
    };

    const handlePostQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!newQTitle.trim() || !newQBody.trim()) return;
        if (!topic) return;

        setIsSubmitting(true);
        const { data, error } = await storage.addQuestion({
            topic_id: topic.id,
            title: newQTitle,
            body: newQBody,
            nickname: nickname || 'Anonymous'
        });
        setIsSubmitting(false);

        if (error) {
            setSubmitError(error.message);
            return;
        }

        if (data) {
            setQuestions(prev => [data, ...prev]);
            setNewQTitle('');
            setNewQBody('');
        }
    };

    // Helper to strip math for Light Mode or use explicit light content
    const getDisplayContent = (section: TopicSection) => {
        if (viewMode === 'detailed') return section.content;
        // If explicit light content exists, use it.
        if (section.content_light && section.content_light.trim().length > 0) return section.content_light;

        // Fallback: If no light content is defined, show the detailed content as is.
        // (User requested to remove the automatic math hiding function)
        return section.content;
    };

    if (!topic) return <Navigate to="/" replace />;

    return (
        <div className="container px-4 py-8 max-w-screen-xl mx-auto">

            {/* View Mode Toggle (Bookmark Style) */}
            <div className="sticky top-20 z-30 flex justify-end md:justify-start mb-[-40px] md:mb-0 pointer-events-none">
                <div className="pointer-events-auto bg-background/95 backdrop-blur shadow-lg border border-border/50 rounded-b-xl px-4 py-3 flex gap-2 items-center transform -translate-y-4 hover:translate-y-0 transition-transform duration-300">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Mode</span>
                    <Button
                        size="sm"
                        variant={viewMode === 'light' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('light')}
                        className={viewMode === 'light' ? "bg-[#c15b4d] text-white hover:bg-[#a94b3e]" : ""}
                    >
                        <BookOpen className="w-4 h-4 mr-2" /> Light
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('detailed')}
                        className={viewMode === 'detailed' ? "bg-[#1f1b1f] text-white hover:bg-black" : ""}
                    >
                        <Layers className="w-4 h-4 mr-2" /> Detailed
                    </Button>
                </div>
            </div>

            {/* Hero */}
            <div className="mb-12 pt-12 space-y-4 border-b border-border/50 pb-8 relative">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-${field?.color ? 'primary' : 'foreground'}`}>
                        {field?.name}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="secondary">{topic.year}</Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold">{topic.title}</h1>
                <p className="text-xl text-muted-foreground max-w-3xl font-serif leading-relaxed">{topic.summary}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {viewMode === 'light' ? '2 min read' : '10 min read'}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {questions.length} Questions</span>
                </div>

                {/* Admin Migration Tool */}
                {isEditor && sections.length === 0 && (
                    <div className="absolute top-0 right-0">
                        <Button variant="outline" size="sm" onClick={handleMigrateData} disabled={isMigrating}>
                            <Database className="w-4 h-4 mr-2" />
                            {isMigrating ? 'Migrating...' : 'Load Seed Data'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-12">
                {/* Main Content */}
                <div className="space-y-16">
                    {/* Content Sections (Rendered Inline) */}
                    <div className="space-y-16">
                        {sections.map((section, idx) => (
                            <section key={section.id} id={section.id} className="scroll-mt-24 group relative">
                                <div className="absolute -left-8 top-0 text-4xl font-display font-bold text-border/40 select-none hidden md:block">
                                    {String(idx + 1).padStart(2, '0')}
                                </div>
                                <h2 className="text-3xl font-bold font-display mb-6 text-foreground flex items-center">
                                    {section.title}
                                    {isEditor && (
                                        <Button variant="ghost" size="sm" className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/topic/${topicSlug}/section/${section.id}`)}>
                                            Edit
                                        </Button>
                                    )}
                                </h2>
                                <div className="prose prose-lg prose-invert max-w-none text-foreground/90 font-serif leading-loose">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[[rehypeKatex, { macros: PHYSICS_MACROS }]]}
                                        components={{
                                            img: ({ node, ...props }) => (
                                                <figure className="my-8">
                                                    <img {...props} className="rounded-xl border border-border/50 w-full max-h-[500px] object-contain bg-black/5" />
                                                    {props.alt && <figcaption className="text-center text-sm text-muted-foreground mt-2 font-sans">{props.alt}</figcaption>}
                                                </figure>
                                            ),
                                            h1: ({ node, ...props }) => <h3 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                                            h2: ({ node, ...props }) => <h4 className="text-xl font-bold mt-6 mb-3" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-6 whitespace-pre-wrap" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#c15b4d]/50 pl-6 italic my-8 text-muted-foreground bg-muted/10 p-4 rounded-r-lg" {...props} />,
                                            a: MarkdownLink
                                        }}
                                    >
                                        {processConceptLinks(getDisplayContent(section))}
                                    </ReactMarkdown>
                                </div>
                            </section>
                        ))}

                        {sections.length === 0 && !isEditor && (
                            <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border/50">
                                <p>No detailed content available yet. Try loading seed data.</p>
                            </div>
                        )}
                    </div>

                    {/* QnA Section */}
                    <div className="pt-12 border-t border-border/50" id="qna">
                        <h2 className="text-2xl font-bold font-display mb-6">Community Q&A</h2>

                        {/* Ask Form */}
                        <Card className="mb-8 border-dashed bg-transparent shadow-none">
                            <CardHeader>
                                <CardTitle className="text-base">Ask a question about this topic</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePostQuestion} className="space-y-4">
                                    <Input
                                        placeholder="What's your question title?"
                                        value={newQTitle}
                                        onChange={e => setNewQTitle(e.target.value)}
                                        required
                                        minLength={5}
                                        className="bg-transparent"
                                    />
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="Elaborate on your question..."
                                        value={newQBody}
                                        onChange={e => setNewQBody(e.target.value)}
                                        required
                                        minLength={10}
                                    />
                                    {submitError && (
                                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                            Failed to post: {submitError}
                                        </div>
                                    )}
                                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                        <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Posting...' : 'Post Question'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Question List */}
                        <div className="space-y-4">
                            {questions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No questions yet. Be the first to ask!</p>
                            ) : (
                                questions.map(q => (
                                    <div key={q.id} className="p-4 rounded-xl border border-secondary bg-secondary/10 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-foreground">{q.title}</h3>
                                            <Badge variant={q.status === 'answered' ? 'default' : 'outline'}>{q.status}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{q.body}</p>
                                        <div className="text-xs text-muted-foreground pt-2 flex items-center justify-between">
                                            <span>by {q.nickname}</span>
                                            <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="hidden md:block">
                    <div className="sticky top-32 space-y-8">
                        <div>
                            <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground/80 mb-4">On this page</p>
                            <nav className="flex flex-col space-y-2 border-l border-border/50 pl-4">
                                {sections.map(s => (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className="text-sm py-1 text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all block"
                                    >
                                        {s.title}
                                    </a>
                                ))}
                                <a
                                    href="#qna"
                                    className="text-sm py-1 text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all block mt-4 pt-4 border-t border-dashed border-border/50"
                                >
                                    Community Q&A
                                </a>
                            </nav>
                        </div>

                        {/* Editor Controls */}
                        {isEditor && (
                            <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <p className="text-xs font-bold uppercase mb-2">Editor</p>
                                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/topic/${topicSlug}/section/new`)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Section
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
