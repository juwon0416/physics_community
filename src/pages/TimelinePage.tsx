import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FIELDS, TIMELINE_TOPICS } from '../data/seed';
import { storage } from '../data/storage';
import type { Topic } from '../data/storage';
import { Button, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui';
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';

export function TimelinePage() {
    const { fieldSlug } = useParams();

    // Auth: Hardcoded for dev environment as requested or implied if hook missing
    const isEditor = true;

    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    // const [loading, setLoading] = useState(true); // Unused

    // Edit/Add State
    const [isAdding, setIsAdding] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [formData, setFormData] = useState<Partial<Topic>>({});

    // Derived Logic
    const field = FIELDS.find(f => f.slug === fieldSlug);

    // Load Data
    const loadTopics = async () => {
        if (!field) return;
        const loaded = await storage.getTopics(field.id);
        setTopics(loaded);
        // setLoading(false);
    };

    useEffect(() => {
        loadTopics();
    }, [fieldSlug]);

    const filteredTopics = useMemo(() => {
        return topics
            .filter(t =>
                t.title.toLowerCase().includes(search.toLowerCase()) ||
                t.year.includes(search)
            )
            .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }, [topics, search]);

    // Active Topic Management
    const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

    useEffect(() => {
        if (filteredTopics.length > 0 && !activeTopicId) {
            setActiveTopicId(filteredTopics[0].id);
        }
    }, [filteredTopics, activeTopicId]);

    const activeTopic = useMemo(() =>
        filteredTopics.find(t => t.id === activeTopicId) || filteredTopics[0],
        [filteredTopics, activeTopicId]
    );

    useEffect(() => {
        if (activeTopic) {
            const index = filteredTopics.findIndex(t => t.id === activeTopic.id);
            setActiveIndex(index >= 0 ? index : 0);
        }
    }, [activeTopic, filteredTopics]);

    // Scroll Logic
    useEffect(() => {
        if (containerRef.current && itemsRef.current[activeIndex]) {
            const container = containerRef.current;
            const item = itemsRef.current[activeIndex];

            if (item) {
                const containerWidth = container.offsetWidth;
                const itemWidth = item.offsetWidth;
                const itemLeft = item.offsetLeft;

                // Center the active item
                // scrollTo is smoother than scrollIntoView for custom carousels
                const scrollTo = itemLeft - (containerWidth / 2) + (itemWidth / 2);

                container.scrollTo({
                    left: scrollTo,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeIndex, filteredTopics]);


    // Handlers
    const handleNext = () => {
        const next = Math.min(activeIndex + 1, filteredTopics.length - 1);
        setActiveTopicId(filteredTopics[next].id);
    };

    const handlePrev = () => {
        const prev = Math.max(activeIndex - 1, 0);
        setActiveTopicId(filteredTopics[prev].id);
    };

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
        <div className="flex flex-col min-h-[calc(100dvh-64px)] overflow-x-hidden bg-background">

            {/* Top Area: Details */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8">
                {/* Field Background Opacity */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: BackgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }}
                />

                <AnimatePresence mode="wait">
                    {activeTopic ? (
                        <motion.div
                            key={activeTopic.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
                        >
                            {/* Featured Image (Mobile: Top, Desktop: Right - swapped order in code but grid handles it) */}
                            {/* We use order-first (default) on mobile, and md:order-last for desktop so text is left, image is right */}
                            <div className="order-first md:order-last relative aspect-video md:aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-muted/20 flex items-center justify-center w-full max-w-[400px] md:max-w-none mx-auto">
                                {activeTopic.image_url ? (
                                    <motion.img
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 5 }}
                                        src={activeTopic.image_url}
                                        alt={activeTopic.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-muted-foreground/30 text-6xl">
                                        <div className="w-16 h-16 border-4 border-current rounded-full opacity-50" />
                                    </div>
                                )}
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-0" />
                            </div>

                            {/* Text Content */}
                            <div className="space-y-4 md:space-y-6 text-center md:text-left">
                                <div>
                                    <Badge variant="outline" className="mb-2 md:mb-4 text-base md:text-lg px-3 py-1 border-primary/30 text-primary">
                                        {activeTopic.year}
                                    </Badge>
                                    <h1 className="text-3xl md:text-6xl font-display font-bold leading-tight text-foreground">
                                        {activeTopic.title}
                                    </h1>
                                </div>
                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-serif line-clamp-4 md:line-clamp-none">
                                    {activeTopic.summary}
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                    {activeTopic.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="px-3 py-1 border-muted-foreground/30 text-muted-foreground font-mono text-xs md:text-sm hover:bg-muted/50 transition-colors">#{tag}</Badge>
                                    ))}
                                </div>
                                <div className="pt-4 flex justify-center md:justify-start gap-4">
                                    <Link to={`/topic/${activeTopic.slug}`}>
                                        <Button size="lg" className="rounded-full px-6 md:px-8 text-base md:text-lg bg-foreground text-background hover:bg-foreground/80 font-serif tracking-wide shadow-md">
                                            Read More <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                    </Link>
                                    {isEditor && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={(e) => handleEditClick(e, activeTopic)}><Edit2 className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="icon" className="text-destructive" onClick={(e) => handleDelete(e, activeTopic.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <p>No topics found. Add one manually or load seed data.</p>
                            {isEditor && (
                                <Button onClick={handleMigrate} variant="outline" className="mt-4">
                                    Load Seed Data
                                </Button>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Area: Timeline Carousel */}
            <div className="border-t border-border/40 bg-background/50 backdrop-blur-sm relative z-20">
                <div className="container mx-auto max-w-screen-2xl h-24 md:h-32 flex items-center gap-2 md:gap-4 px-2 md:px-4">
                    {/* Controls & Search */}
                    <div className="flex items-center gap-2">
                        {isEditor && (
                            <Button onClick={handleAddClick} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 shrink-0">
                                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-primary/10 shrink-0"
                            onClick={handlePrev}
                            disabled={activeIndex === 0}
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>

                        {/* Mobile: Search hidden or smaller? keeping it visible but small */}
                        <div className="hidden md:block">
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Filter timeline..."
                                className="pl-4 bg-background rounded-full border-primary/20 w-40"
                            />
                        </div>
                    </div>

                    <div
                        ref={containerRef}
                        className="flex-1 overflow-x-auto no-scrollbar scroll-smooth py-4 md:py-8"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <div className="relative flex items-center gap-4 md:gap-8 px-[50%] w-max">
                            {filteredTopics.map((topic, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <div
                                        key={topic.id}
                                        ref={(el) => { itemsRef.current[index] = el; }}
                                        onClick={() => setActiveTopicId(topic.id)}
                                        className={`
                                            flex-shrink-0 cursor-pointer transition-all duration-500 ease-out
                                            flex flex-col items-center gap-2 group
                                            ${isActive ? 'scale-110 opacity-100 z-10' : 'scale-90 opacity-40 hover:opacity-80'}
                                        `}
                                    >
                                        <div className={`
                                            relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                            ${isActive
                                                ? 'bg-foreground text-background border-foreground shadow-md scale-110'
                                                : 'bg-background border-foreground/30 text-muted-foreground group-hover:border-foreground/60'}
                                        `}>
                                            <span className="font-bold font-mono text-xs md:text-sm tracking-tighter">{topic.year}</span>
                                            {/* Connector Line */}
                                            <div className={`absolute top-1/2 left-full w-4 md:w-8 h-0.5 -translate-y-1/2 ${isActive ? 'bg-foreground' : 'bg-foreground/20'} ${index === filteredTopics.length - 1 ? 'hidden' : ''}`} />
                                        </div>
                                        <span className={`text-[10px] md:text-xs font-medium max-w-[80px] md:max-w-[120px] text-center truncate px-2 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {topic.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-primary/10 shrink-0"
                        onClick={handleNext}
                        disabled={activeIndex === filteredTopics.length - 1}
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                </div>
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
