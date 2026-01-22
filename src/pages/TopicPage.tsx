import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, MessageCircle, Send, Database, BookOpen, Layers, Edit2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { FIELDS } from '../data/seed';
import { storage, type Question, type Topic } from '../data/storage';
import { useAuth } from '../lib/auth';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { RichTextEditor } from '../components/editor/RichTextEditor'; // Import RichTextEditor
import { PHYSICS_MACROS } from '../lib/latexMacros';
import { processConceptLinks, MarkdownLink } from '../lib/markdownUtils';
import { conceptAPI } from '../lib/concepts';

export function TopicPage() {
    const { topicSlug } = useParams();
    const { isEditor, nickname } = useAuth();


    // Topic State
    const [topic, setTopic] = useState<Topic | null>(null);
    const field = FIELDS.find(f => f.id === topic?.field_id); // Use field_id from DB topic

    const [questions, setQuestions] = useState<Question[]>([]);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'light' | 'detailed'>('light');

    // CMS Logic
    const [isMigrating, setIsMigrating] = useState(false);

    // QnA logic
    const [newQTitle, setNewQTitle] = useState('');
    const [newQBody, setNewQBody] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!topicSlug) return;
        const load = async () => {
            let data = await storage.getTopicBySlug(topicSlug);

            // If DB miss, fallback to seed logic handled in storage, but we typically expect data.
            // If data exists, check content.
            if (data) {
                // Auto-Migration Check: If no content but sections exist (from old schema used in DB)
                if (!data.content || data.content.trim() === '') {
                    // Ideally we check if sections exist. 
                    // We'll treat this as "Need Migration" or "Empty".
                    // Let's rely on manual migration button for safety or just lazy load.
                    // Or clearer: if existing, use it.

                    // For now, set topic.
                }
                setTopic(data);
                setEditContent(data.content || '');
            }
        };
        load();
    }, [topicSlug]);

    useEffect(() => {
        if (topic) {
            loadQuestions();
        }
    }, [topic?.id]);

    const loadQuestions = async () => {
        if (!topic) return;
        const qData = await storage.getQuestions(topic.id);
        setQuestions(qData);
    };

    const handleMigrateFromSections = async () => {
        if (!topic) return;
        if (!confirm('This will concatenate existing sections into the main content field. Continue?')) return;

        setIsMigrating(true);
        const { content, error } = await storage.migrateSectionsToContent(topic.id);
        setIsMigrating(false);

        if (!error && content) {
            setTopic(prev => prev ? { ...prev, content } : null);
            setEditContent(content);
            alert('Migration successful!');
        } else if (error) {
            alert('Migration failed: ' + error.message);
        } else {
            alert('No sections found to migrate.');
        }
    };

    const handleSave = async () => {
        if (!topic) return;
        setIsSaving(true);

        // 1. Update Content
        const { error } = await storage.updateTopic(topic.id, {
            content: editContent
        });

        if (error) {
            alert('Failed to save content');
            setIsSaving(false);
            return;
        }

        // 2. Sync Graph Edges (Topic -> Concepts)
        try {
            await conceptAPI.syncContentEdges(
                { id: topic.id, type: 'topic', label: topic.title, fieldId: topic.field_id },
                editContent
            );
        } catch (e) {
            console.error("Graph sync failed", e);
            // Warn user but don't block
        }

        setTopic(prev => prev ? { ...prev, content: editContent } : null);
        setIsEditing(false);
        setIsSaving(false);
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

    // Processed Content for View
    const processedContent = useMemo(() => {
        if (!topic?.content) return '';
        return processConceptLinks(topic.content);
    }, [topic?.content]);


    if (!topic) {
        // Only show loading if we are actually waiting, else redirect?
        // For simplicity, just return null or loader
        return null;
    }

    return (
        <div className="container px-4 py-8 max-w-screen-xl mx-auto">
            {/* View Mode Toggle (Bookmark Style) */}
            {!isEditing && (
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
            )}

            {/* Hero */}
            <div className="mb-12 pt-12 space-y-4 border-b border-border/50 pb-8 relative">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-${field?.color ? 'primary' : 'foreground'}`}>
                        {field?.name || 'Physics'}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="secondary">{topic.year}</Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold">{topic.title}</h1>
                <div className="flex justify-between items-start">
                    <p className="text-xl text-muted-foreground max-w-3xl font-serif leading-relaxed">{topic.summary}</p>

                    {/* Admin Controls */}
                    {isEditor && !isEditing && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleMigrateFromSections} disabled={isMigrating}>
                                <Database className="w-4 h-4 mr-2" />
                                {isMigrating ? 'Migrating...' : 'Migrate Sections'}
                            </Button>
                            <Button variant="secondary" size="sm" className="text-destructive bg-destructive/10 hover:bg-destructive/20 border-destructive/20" onClick={async () => {
                                if (confirm("Reset graph nodes for THIS topic only?\n\nThis will delete only the concept nodes directly linked to this topic. It is safe and will not affect other parts of the graph.")) {
                                    const res = await conceptAPI.purgeTopicNodes(topic.id);
                                    const error = res?.error;

                                    if (error) {
                                        alert("Purge failed: " + error.message);
                                    } else {
                                        alert(`Reset complete.\nDeleted ${res.data?.deleted_concepts ?? 0} concepts linked to this topic.`);
                                        window.location.reload();
                                    }
                                }
                            }}>
                                Reset Topic Graph
                            </Button>
                            <Button onClick={() => setIsEditing(true)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Article
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {viewMode === 'light' ? '2 min read' : '10 min read'}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {questions.length} Questions</span>
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-12">
                {/* Main Content */}
                <div className="space-y-16">
                    {isEditing ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-secondary/10 p-4 rounded-lg mb-4 border border-border/50">
                                <h3 className="font-bold mb-2">Editing: {topic.title}</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    You are editing the full article. Changes here will be synced to the knowledge graph (mentions).
                                </p>
                                <RichTextEditor
                                    value={editContent}
                                    onChange={setEditContent}
                                    className="min-h-[600px]"
                                />
                                <div className="flex justify-end gap-4 mt-4">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <article className="prose prose-lg prose-invert max-w-none text-foreground/90 font-serif leading-loose">
                            {(!topic.content || topic.content.trim() === '') ? (
                                <div className="py-12 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border/50">
                                    <p>No content yet.</p>
                                    {isEditor && (
                                        <p className="mt-2 text-sm">
                                            Click "Edit Article" to start writing or "Migrate Sections" if you have old data.
                                        </p>
                                    )}
                                </div>
                            ) : (
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
                                    {processedContent}
                                </ReactMarkdown>
                            )}
                        </article>
                    )}

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

                {/* Sidebar Navigation (Simple) */}
                <div className="hidden md:block">
                    <div className="sticky top-32 space-y-8">
                        <div>
                            <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground/80 mb-4">On this page</p>
                            <nav className="flex flex-col space-y-2 border-l border-border/50 pl-4">
                                <a
                                    href="#"
                                    className="text-sm py-1 text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all block"
                                >
                                    Topic Content
                                </a>
                                <a
                                    href="#qna"
                                    className="text-sm py-1 text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all block"
                                >
                                    Community Q&A
                                </a>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
