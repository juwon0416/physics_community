import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Trash2, Layers, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { storage, type TopicSection } from '../data/storage';
import { useAuth } from '../lib/auth';
import { Button, Input } from '../components/ui';
import { RichTextEditor } from '../components/editor/RichTextEditor';
import { conceptAPI } from '../lib/concepts';
import { PHYSICS_MACROS } from '../lib/latexMacros';
import { processConceptLinks, MarkdownLink } from '../lib/markdownUtils';




export function SectionPage() {
    const { topicSlug, sectionId } = useParams();
    const navigate = useNavigate();
    const { isEditor } = useAuth();

    const [section, setSection] = useState<TopicSection | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);

    // Editor State
    const [activeTab, setActiveTab] = useState<'detailed' | 'light'>('detailed');
    const [editDetailedContent, setEditDetailedContent] = useState('');
    const [editLightContent, setEditLightContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    // Track concepts linked during this session
    const [linkedConceptIds, setLinkedConceptIds] = useState<Set<string>>(new Set());

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (sectionId) {
            loadSection();
        }
    }, [sectionId]);

    const loadSection = async () => {
        setLoading(true);
        const data = await storage.getSectionById(sectionId!);

        if (!data) {
            setSection(null);
            setLoading(false);
            return;
        }

        // Validate Routing: Compare URL slug with actual topic slug
        const topic = await storage.getTopic(data.topic_id);
        if (topic && topic.slug !== topicSlug) {
            navigate(`/topic/${topic.slug}/section/${sectionId}`, { replace: true });
            return;
        }

        setSection(data);
        if (data) {
            setEditDetailedContent(data.content);
            setEditLightContent(data.content_light || '');
            setEditTitle(data.title);
            document.title = `${data.title} - Physics Community`;
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!section) return;
        setIsSaving(true);
        const { error } = await storage.updateSection(section.id, {
            title: editTitle,
            content: editDetailedContent,
            content_light: editLightContent
        });

        if (!error) {
            // Save Graph Edges (Hierarchy)
            try {
                // 1. Sync edges from text content (Section -> Concepts)
                await conceptAPI.syncContentEdges(
                    { id: section.id, type: 'section', label: editTitle },
                    editDetailedContent
                );

                // 2. Link Topic -> Section (So section isn't orphaned)
                if (section.topic_id) {
                    await conceptAPI.createEdge(section.topic_id, section.id, 'hierarchy');
                }

                // 3. Batch save manual links (Add-Only policy)
                await conceptAPI.connectBatch(section.id, Array.from(linkedConceptIds));
            } catch (e: any) {
                console.error("Failed to sync graph edges:", e);
                // Alert user to DB errors so they know why graph isn't updating
                alert(`Graph Sync Error: ${e.message || JSON.stringify(e)}. Please run complete_graph_schema.sql in Supabase!`);
            }
        }

        setIsSaving(false);

        if (!error) {
            setSection(prev => prev ? {
                ...prev,
                title: editTitle,
                content: editDetailedContent,
                content_light: editLightContent
            } : null);
            setIsEditing(false);
        } else {
            alert('Failed to save');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this section?')) return;
        const { error } = await storage.deleteSection(sectionId!);
        if (!error) {
            navigate(`/topic/${topicSlug}`);
        } else {
            alert('Failed to delete');
        }
    };

    if (loading) {
        return <div className="container py-20 text-center text-muted-foreground">Loading section...</div>;
    }

    if (!section) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Section not found</h2>
                <Link to={`/topic/${topicSlug}`}>
                    <Button>Return to Topic</Button>
                </Link>
            </div>
        );
    }

    // Generate processed content for view mode
    const processedContent = useMemo(() => {
        if (!section?.content) return '';
        return processConceptLinks(section.content);
    }, [section?.content]);

    return (
        <div className="container px-4 py-8 max-w-screen-lg mx-auto min-h-screen">
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
                <Link to={`/topic/${topicSlug}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Topic
                </Link>

                {isEditor && !isEditing && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Page
                        </Button>
                    </div>
                )}

                {isEditor && isEditing && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {isEditing ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Page Title</label>
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="text-2xl font-bold h-auto py-3"
                        />
                    </div>

                    {/* Editor Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-lg w-fit mb-4">
                        <button
                            onClick={() => setActiveTab('detailed')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'detailed' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Layers className="w-4 h-4 mr-2" /> Detailed Content
                        </button>
                        <button
                            onClick={() => setActiveTab('light')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'light' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <BookOpen className="w-4 h-4 mr-2" /> Light Content
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-muted-foreground">
                                {activeTab === 'detailed' ? 'Content for Detailed View (Include Math)' : 'Content for Light View (Simplified)'}
                            </label>
                            {activeTab === 'light' && !editLightContent && (
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditLightContent(editDetailedContent)}>
                                    Copy from Detailed
                                </Button>
                            )}
                        </div>

                        {activeTab === 'detailed' ? (
                            <RichTextEditor
                                value={editDetailedContent}
                                onChange={setEditDetailedContent}
                                className="min-h-[500px]"
                                onConceptLinked={(id) => setLinkedConceptIds(prev => new Set(prev).add(id))}
                            />
                        ) : (
                            <RichTextEditor
                                value={editLightContent}
                                onChange={setEditLightContent}
                                className="min-h-[500px] border-orange-500/20"
                                placeholder="Enter simplified content here..."
                            />
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            {activeTab === 'detailed'
                                ? "This content is shown when 'Detailed' mode is selected. Use LaTeX for math."
                                : "This content is shown when 'Light' mode is selected. Simplify concepts and avoid complex math."}
                        </p>
                    </div>

                    <div className="fixed bottom-8 right-8 flex gap-4 z-50">
                        <Button variant="outline" size="lg" className="shadow-lg bg-background/80 backdrop-blur" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button size="lg" className="shadow-lg" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                {section.title}
                            </h1>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>Last updated {section.updated_at ? new Date(section.updated_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        {isEditor && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Section
                            </Button>
                        )}
                    </div>

                    <article className="prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-img:rounded-xl">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[[rehypeKatex, {
                                throwOnError: false,
                                globalGroup: true,
                                trust: true,
                                strict: "ignore",
                                macros: PHYSICS_MACROS
                            }]]}
                            components={{
                                img: ({ node, ...props }) => (
                                    <img {...props} className="rounded-xl border border-border/50 shadow-lg my-8 w-full max-h-[600px] object-contain bg-black/5" />
                                ),
                                a: MarkdownLink
                            }}
                        >
                            {processedContent}
                        </ReactMarkdown>
                    </article>
                </div>
            )}

            {!isEditing && (
                <div className="mt-20 pt-8 border-t border-border/50 flex justify-between text-sm text-muted-foreground">
                    <Link to={`/topic/${topicSlug}`} className="hover:text-foreground">← Back to {topicSlug}</Link>
                    <span>Last updated: {new Date(section.updated_at || new Date()).toLocaleDateString()}</span>
                </div>
            )}
        </div>
    );
}
