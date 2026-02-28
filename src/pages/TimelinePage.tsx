import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FIELDS, TIMELINE_TOPICS } from '../data/seed';
import { storage } from '../data/storage';
import type { Topic } from '../data/storage';
import { Button, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui';
import { ArrowRight, Plus, Edit2, Trash2 } from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';

export function TimelinePage() {
    const { fieldSlug } = useParams();

    // Auth: Hardcoded for dev environment as requested or implied if hook missing
    const isEditor = true;

    const [search, setSearch] = useState('');
    const [topics, setTopics] = useState<Topic[]>([]);

    // Edit/Add State
    const [isAdding, setIsAdding] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [formData, setFormData] = useState<Partial<Topic>>({});

    // Derived Logic
    const field = FIELDS.find(f => f.slug === fieldSlug);

    // Load Data
    const loadTopics = React.useCallback(async () => {
        if (!field) return;
        try {
            const loaded = await storage.getTopics(field.id);
            if (!loaded || loaded.length === 0) {
                // Auto Fallback to Seed Data if DB is empty or fails
                const seedForField = TIMELINE_TOPICS.filter(t => t.fieldId === field.id).map(t => ({
                    id: t.id,
                    field_id: t.fieldId,
                    year: t.year,
                    title: t.title,
                    slug: t.slug,
                    summary: t.summary,
                    tags: t.tags
                }));
                setTopics(seedForField);
                return;
            }
            setTopics(loaded);
        } catch (e) {
            console.error("Failed to load topics from Supabase, using local seed", e);
            const seedForField = TIMELINE_TOPICS.filter(t => t.fieldId === field.id).map(t => ({
                id: t.id,
                field_id: t.fieldId,
                year: t.year,
                title: t.title,
                slug: t.slug,
                summary: t.summary,
                tags: t.tags
            }));
            setTopics(seedForField);
        }
    }, [field]);

    useEffect(() => {
        // eslint-disable-next-line
        loadTopics();
    }, [loadTopics]);

    const isDictionaryMode = field?.slug === 'mathematical-physics';

    const filteredTopics = useMemo(() => {
        const result = topics.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.year.includes(search)
        );

        if (isDictionaryMode) {
            // A-Z Sort for Dictionary
            return result.sort((a, b) => a.title.localeCompare(b.title));
        }
        // Year Sort for Timeline
        return result.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }, [topics, search, isDictionaryMode]);

    // Handlers
    const handleEditClick = (e: React.MouseEvent, topic: Topic) => {
        e.stopPropagation();
        setEditingTopic(topic);
        setFormData(topic);
    };

    const handleAddClick = () => {
        setIsAdding(true);
        setFormData({
            field_id: field?.id, // Note: storage uses field_id, seed uses fieldId. storage.Topic is correct here.
            year: '',
            title: '',
            slug: '',
            summary: '',
            tags: [],
            image_url: ''
        });
    };

    const handleMigrate = async () => {
        if (!confirm('Load seed data? This will overwrite current field data.')) return;
        // setLoading(true);
        const seedForField = TIMELINE_TOPICS.filter(t => t.fieldId === field?.id);
        for (const t of seedForField) {
            // Map TimelineEntry (seed) to Topic (storage)
            const newTopic: Omit<Topic, 'id'> = {
                field_id: t.fieldId,
                year: t.year,
                title: t.title,
                slug: t.slug,
                summary: t.summary,
                tags: t.tags,
                image_url: undefined
            };
            await storage.addTopic(newTopic);
        }
        loadTopics();
    };

    const handleSave = async () => {
        if (!formData.title || !formData.year || !formData.slug) {
            alert('Title, Year, and Slug are required');
            return;
        }
        let result;
        if (editingTopic) {
            result = await storage.updateTopic(editingTopic.id, formData);
        } else {
            result = await storage.addTopic(formData as Omit<Topic, 'id'>);
        }
        if (result.error) {
            alert('Failed to save topic: ' + result.error.message);
            console.error(result.error);
            return;
        }
        setEditingTopic(null);
        setIsAdding(false);
        loadTopics();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this topic?')) return;
        await storage.deleteTopic(id);
        loadTopics();
    };

    const handleTagsChange = (val: string) => {
        setFormData(prev => ({ ...prev, tags: val.split(',').map(s => s.trim()).filter(Boolean) }));
    };

    if (!field) return <Navigate to="/" replace />;

    const BackgroundImage = field.image ? `url(${field.image})` : undefined;

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden bg-background">
            {/* Field Background Opacity */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
                style={{ backgroundImage: BackgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }}
            />

            {/* Header Controls (Fixed at Top of Timeline/Dictionary) */}
            <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto max-w-screen-2xl flex items-center p-4 gap-4">
                    {isEditor && (
                        <Button onClick={handleAddClick} size="icon" className="rounded-full h-10 w-10 shrink-0">
                            <Plus className="w-5 h-5" />
                        </Button>
                    )}

                    {!isDictionaryMode && topics.length > 0 && (
                        <div className="text-sm font-medium text-muted-foreground mr-auto hidden md:block">
                            Scroll down to explore timeline
                        </div>
                    )}

                    <div className="ml-auto w-full md:w-auto">
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter topics..."
                            className="bg-background rounded-full border-primary/20 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 relative z-10">
                {filteredTopics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4">
                        <p>No topics found. Add one manually or load seed data.</p>
                        {isEditor && (
                            <Button onClick={handleMigrate} variant="outline">
                                Load Seed Data
                            </Button>
                        )}
                    </div>
                ) : isDictionaryMode ? (
                    /* Dictionary Grid View (Unchanged Structure) */
                    <div className="container mx-auto p-4 md:p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredTopics.map((topic) => (
                                <Link to={`/topic/${topic.slug}`} key={topic.id} className="block">
                                    <div className="cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md hover:border-primary/50 flex flex-col items-center text-center gap-2 bg-card">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-xs shrink-0">
                                            {topic.title.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium leading-tight line-clamp-2">
                                            {topic.title}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Vertical Stacked Cards Timeline View */
                    <div className="flex flex-col w-full">
                        {filteredTopics.map((topic, index) => {
                            // Calculate a slight top margin based on index so cards stack nicely and don't completely cover the top margin of the card below
                            const stickyTopOffset = `calc(4rem + ${index * 1}rem)`;

                            return (
                                <section
                                    key={topic.id}
                                    className="sticky w-full h-[100dvh] md:h-screen md:min-h-[600px] flex items-center justify-center p-2 md:p-8"
                                    style={{
                                        top: stickyTopOffset,
                                    }}
                                >
                                    {/* Card Container */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: false, margin: "-20%" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="w-full max-w-5xl bg-background border border-border/50 shadow-2xl rounded-3xl overflow-hidden relative overflow-y-auto max-h-[95dvh] grid grid-cols-1 md:grid-cols-2"
                                    >
                                        {/* Image Section */}
                                        <div className="relative aspect-video md:aspect-auto md:h-full bg-muted/20 flex items-center justify-center overflow-hidden">
                                            {topic.image_url ? (
                                                <img
                                                    src={topic.image_url}
                                                    alt={topic.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="text-muted-foreground/20 text-6xl md:text-8xl font-serif opacity-30">
                                                    {topic.year}
                                                </div>
                                            )}
                                            {/* Gradient Overlay for Text Readability if needed on image side */}
                                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background/90 via-background/20 to-transparent md:pointer-events-none" />

                                            {/* Large Floating Year Mobile Only */}
                                            <div className="absolute bottom-4 left-4 md:hidden">
                                                <Badge variant="secondary" className="text-2xl font-bold bg-background/80 backdrop-blur-sm">
                                                    {topic.year}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-4 md:p-12 flex flex-col justify-center space-y-3 md:space-y-6 relative z-10 bg-background/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                                            <div className="hidden md:block">
                                                <Badge variant="outline" className="mb-4 text-xl px-4 py-1 border-primary/30 text-primary font-mono bg-background">
                                                    {topic.year}
                                                </Badge>
                                            </div>

                                            <h2 className="text-2xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-foreground">
                                                {topic.title}
                                            </h2>

                                            <p className="text-sm md:text-xl text-muted-foreground leading-relaxed font-serif line-clamp-3 md:line-clamp-none">
                                                {topic.summary}
                                            </p>

                                            <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1 md:pt-2">
                                                {topic.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="px-2 py-0.5 md:px-3 md:py-1 font-mono text-[10px] md:text-sm">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className="pt-3 md:pt-6 flex flex-wrap items-center gap-3 md:gap-4">
                                                <Link to={`/topic/${topic.slug}`}>
                                                    <Button size="default" className="md:h-11 md:px-8 rounded-full text-sm md:text-lg font-serif tracking-wide shadow-md">
                                                        Explore Theory <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                                                    </Button>
                                                </Link>
                                                {isEditor && (
                                                    <div className="flex gap-2 ml-auto">
                                                        <Button variant="outline" size="icon" onClick={(e) => handleEditClick(e, topic)}><Edit2 className="w-4 h-4" /></Button>
                                                        <Button variant="outline" size="icon" className="text-destructive" onClick={(e) => handleDelete(e, topic.id)}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </section>
                            );
                        })}
                        {/* Empty spacing at bottom so last card can scroll fully up */}
                        <div className="h-[50vh] w-full" />
                    </div>
                )}
            </div>

            {/* Edit/Add Dialog */}
            <Dialog open={!!editingTopic || isAdding} onOpenChange={(open) => !open && (setEditingTopic(null), setIsAdding(false))}>
                <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{isAdding ? 'Add New Topic' : 'Edit Topic'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Year</label>
                                <Input value={formData.year || ''} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 1905" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug (URL)</label>
                                <Input value={formData.slug || ''} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. special-relativity" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Topic Title" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Image URL (Optional)</label>
                            <ImageUpload
                                value={formData.image_url || ''}
                                onChange={(url) => setFormData(p => ({ ...p, image_url: url }))}
                                placeholder="Drag cover image here or click to upload"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Summary</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.summary || ''}
                                onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                                placeholder="Brief summary for the card..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tags (comma separated)</label>
                            <Input value={formData.tags?.join(', ') || ''} onChange={e => handleTagsChange(e.target.value)} placeholder="Physics, Theory, etc." />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
