import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Edit2, Eye, Bold, Italic, Code, Image as ImageIcon, Sigma, Network, Loader2, FunctionSquare } from 'lucide-react';
import { cn } from '../../lib/cn';
import 'katex/dist/katex.min.css';
import { storage } from '../../data/storage';
import { conceptAPI } from '../../lib/concepts';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { PHYSICS_MACROS } from '../../lib/latexMacros';
import { processConceptLinks, MarkdownLink } from '../../lib/markdownUtils';
import { FIELDS, TIMELINE_TOPICS } from '../../data/seed';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onConceptLinked?: (conceptId: string) => void;
}


// UI Grouping for the Dropdown
const MACRO_GROUPS = [
    {
        title: "Quantum",
        items: [
            { label: "|ψ⟩ Ket", tex: "\\ket{", suffix: "}" },
            { label: "⟨ψ| Bra", tex: "\\bra{", suffix: "}" },
            { label: "⟨φ|ψ⟩ Inner Prod", tex: "\\braket{", suffix: "}{}" }, // default cursor handling will be tricky for 2 args, simplified
            { label: "† Dagger", tex: "\\dag" },
            { label: "H Hamiltonian", tex: "\\H" },
        ]
    },
    {
        title: "Vector / Calc",
        items: [
            { label: "∇ Grad", tex: "\\grad " },
            { label: "∇⋅ Div", tex: "\\div " },
            { label: "∇× Curl", tex: "\\curl " },
            { label: "∂y/∂x Partial", tex: "\\pd{y}{x}" }, // Placeholder defaults
            { label: "dy/dx Total", tex: "\\dd{y}{x}" },
        ]
    },
];

export function RichTextEditor({ value, onChange, placeholder, className, onConceptLinked }: RichTextEditorProps) {
    const [mode, setMode] = useState<'write' | 'preview'>('write');
    const [isUploading, setIsUploading] = useState(false);

    // Concept Dialog State
    const [showConceptDialog, setShowConceptDialog] = useState(false);
    const [conceptTerm, setConceptTerm] = useState('');
    const [conceptDesc, setConceptDesc] = useState('');
    const [isCreatingConcept, setIsCreatingConcept] = useState(false);
    const [conceptStatus, setConceptStatus] = useState<'idle' | 'checking' | 'exists' | 'new'>('idle');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]); // Track which accordion open
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Macros Menu State
    const [showMacroDialog, setShowMacroDialog] = useState(false);
    // const macrosMenuRef = useRef<HTMLDivElement>(null); // Removed

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close macros menu when clicking outside - REMOVED (Dialog handles this)
    /* 
    useEffect(() => {
        ...
    }, []);
    */

    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const handleConceptClick = async () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) || '';

        setConceptTerm(selection);
        setConceptDesc('');
        setConceptStatus('idle');
        setShowConceptDialog(true);
        setSearchResults([]);

        // Auto-search if text was highlighted, or fetch latest overall
        checkConcept(selection || '');
    };

    const checkConcept = async (query: string) => {
        setConceptStatus('checking');

        try {
            // Get search suggestions list
            const results = await conceptAPI.search(query || '');
            setSearchResults(results || []);

            if (query.trim() === '') {
                setConceptStatus('idle');
                return;
            }

            // Check if exact match exists for the specific query
            const exactMatch = results.find(r => r.label.toLowerCase() === query.trim().toLowerCase());

            if (exactMatch) {
                setConceptStatus('exists');
                if (exactMatch.data?.description) setConceptDesc(exactMatch.data.description);
            } else {
                setConceptStatus('new');
                setConceptDesc('');
            }
        } catch (e) {
            console.error(e);
            setConceptStatus('new');
            setSearchResults([]);
        }
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
        );
    };

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setConceptTerm(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            checkConcept(val);
        }, 300);
    };

    const handleInsertLink = (label: string) => {
        insertText(`[[${label}]]`);
        setShowConceptDialog(false);
    };

    const handleCreateConcept = async () => {
        if (!conceptTerm) return;
        setIsCreatingConcept(true);
        try {
            if (conceptStatus === 'new') {
                const newC = await conceptAPI.create(conceptTerm, conceptDesc);
                if (newC && onConceptLinked) onConceptLinked(newC.id);
            }
            handleInsertLink(conceptTerm);
        } catch (e) {
            alert('Failed to create/link concept');
            console.error(e);
        } finally {
            setIsCreatingConcept(false);
        }
    };

    // Pre-process markdown to turn [[Link]] into [Link](/concept/Link)
    const processedValue = React.useMemo(() => {
        if (mode !== 'preview') return '';
        return processConceptLinks(value);
    }, [value, mode]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsUploading(true);
            const { url, error } = await storage.uploadFile(file);
            setIsUploading(false);

            if (error) {
                alert('Image upload failed: ' + error.message);
            } else if (url) {
                insertText(`![Image](${url})`);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn("border border-border/50 rounded-md bg-background/50", className)}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-border/50 bg-secondary/20 rounded-t-md relative">
                <div className="flex items-center gap-1 overflow-x-auto">
                    <button onClick={() => setMode('write')} className={cn("p-2 rounded hover:bg-secondary transition-colors", mode === 'write' ? "bg-secondary text-primary" : "text-muted-foreground")}>
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMode('preview')} className={cn("p-2 rounded hover:bg-secondary transition-colors", mode === 'preview' ? "bg-secondary text-primary" : "text-muted-foreground")}>
                        <Eye className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border/50 mx-2" />
                    <ToolbarButton icon={<Bold className="w-4 h-4" />} onClick={() => insertText('**', '**')} label="Bold" disabled={mode === 'preview'} />
                    <ToolbarButton icon={<Italic className="w-4 h-4" />} onClick={() => insertText('*', '*')} label="Italic" disabled={mode === 'preview'} />
                    <ToolbarButton icon={<Code className="w-4 h-4" />} onClick={() => insertText('`', '`')} label="Code" disabled={mode === 'preview'} />
                    <ToolbarButton icon={<Sigma className="w-4 h-4" />} onClick={() => insertText('$', '$')} label="Math" disabled={mode === 'preview'} />

                    {/* Macros Button */}
                    <ToolbarButton
                        icon={<FunctionSquare className="w-4 h-4" />}
                        onClick={() => setShowMacroDialog(true)}
                        label="Physics Macros"
                        disabled={mode === 'preview'}
                        active={showMacroDialog}
                    />

                    <ToolbarButton icon={<Network className="w-4 h-4" />} onClick={handleConceptClick} label="Concept/Keyword" disabled={mode === 'preview'} />
                    <ToolbarButton
                        icon={<ImageIcon className={cn("w-4 h-4", isUploading && "animate-pulse text-primary")} />}
                        onClick={() => fileInputRef.current?.click()}
                        label="Upload Image"
                        disabled={mode === 'preview' || isUploading}
                    />
                </div>
                <div className="text-xs text-muted-foreground px-2">
                    Markdown + LaTeX
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[300px] relative rounded-b-md overflow-hidden">
                {mode === 'write' ? (
                    <textarea
                        ref={textareaRef}
                        className="editor-input w-full h-full min-h-[300px] p-4 bg-transparent resize-y outline-none font-mono text-sm leading-relaxed"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Write with Markdown and LaTeX (e.g., $E=mc^2$)..."}
                    />
                ) : (
                    <div className="p-6 prose prose-invert max-w-none min-h-[300px] overflow-auto">
                        {value ? (
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
                                    img: ({ ...props }) => (
                                        <img {...props} className="rounded-lg border border-border/50 my-4 max-h-[500px] object-contain bg-black/20" />
                                    ),
                                    a: MarkdownLink
                                }}
                            >
                                {processedValue}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-muted-foreground italic">Nothing to preview</p>
                        )}
                    </div>
                )}
            </div>

            {/* Physics Macros Dialog */}
            <Dialog open={showMacroDialog} onOpenChange={setShowMacroDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Insert Physics Symbol</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {MACRO_GROUPS.map((group) => (
                            <div key={group.title} className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-1">
                                    {group.title}
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => {
                                                insertText(item.tex, item.suffix || '');
                                                setShowMacroDialog(false);
                                            }}
                                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/30 hover:border-primary/50 transition-all gap-2 group h-24"
                                        >
                                            <span className="text-lg font-serif font-medium text-foreground group-hover:scale-110 transition-transform">
                                                {item.label.split(' ')[0]}
                                            </span>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                    {item.label.split(' ').slice(1).join(' ')}
                                                </span>
                                                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary font-mono opacity-70 group-hover:opacity-100">
                                                    {item.tex}
                                                </code>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Concept Dialog */}
            <Dialog open={showConceptDialog} onOpenChange={setShowConceptDialog}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Insert Link / Concept</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4 overflow-hidden h-full">
                        <div className="space-y-2 shrink-0">
                            <Input
                                value={conceptTerm}
                                onChange={handleSearchInput}
                                placeholder="Search existing topics/concepts..."
                                autoFocus
                            />
                        </div>

                        {conceptStatus === 'checking' && <div className="text-sm text-muted-foreground flex items-center gap-2 shrink-0"><Loader2 className="w-3 h-3 animate-spin" /> Searching database...</div>}

                        {/* DB Results & Folder Tree Hybrid View */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 border border-border/50 rounded-md p-2 bg-secondary/10">

                            {/* If actively searching, show flat DB results */}
                            {conceptTerm.trim() !== '' ? (
                                <>
                                    {searchResults.length === 0 && conceptStatus !== 'checking' && (
                                        <p className="text-sm text-center text-muted-foreground py-4">No exact matches found.</p>
                                    )}
                                    {searchResults.map((res) => (
                                        <button
                                            key={res.id}
                                            onClick={() => handleInsertLink(res.label)}
                                            className="w-full text-left p-2 rounded-md hover:bg-secondary border border-transparent hover:border-border/50 transition-colors flex flex-col"
                                        >
                                            <span className="font-semibold text-sm">{res.label}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{res.type}</span>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                /* Folder View (Empty Search Input) */
                                <div className="space-y-1 select-none">
                                    {FIELDS.map(field => {
                                        const isExpanded = expandedFolders.includes(field.id);
                                        // Merge seeded topics with dynamic DB topics for this field
                                        const seededTopics = TIMELINE_TOPICS.filter(t => t.fieldId === field.id).map(t => ({ id: t.id, label: t.title, type: 'topic' }));
                                        const dbTopics = searchResults.filter(r => r.type === 'topic' && r.data?.fieldId === field.id);

                                        // Deduplicate
                                        const mergedTopics = [...seededTopics];
                                        dbTopics.forEach(dt => {
                                            if (!mergedTopics.some(mt => mt.label === dt.label)) mergedTopics.push(dt);
                                        });

                                        return (
                                            <div key={field.id} className="border border-border/30 rounded-md overflow-hidden bg-background">
                                                <button
                                                    onClick={() => toggleFolder(field.id)}
                                                    className="w-full flex items-center justify-between p-2.5 hover:bg-secondary/50 text-left transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{field.name}</span>
                                                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{mergedTopics.length} File(s)</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="p-1 bg-secondary/10 border-t border-border/30">
                                                        {mergedTopics.length === 0 ? (
                                                            <div className="p-2 text-xs text-muted-foreground italic pl-6">- Empty folder -</div>
                                                        ) : (
                                                            mergedTopics.map(topic => (
                                                                <button
                                                                    key={topic.id}
                                                                    onClick={() => handleInsertLink(topic.label)}
                                                                    className="w-full text-left p-2 pl-6 rounded-md hover:bg-secondary hover:text-primary transition-colors flex items-center gap-2"
                                                                >
                                                                    <div className="w-1 h-1 rounded-full bg-border" />
                                                                    <span className="text-sm">{topic.label}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Other Concepts Folder */}
                                    {(() => {
                                        const conceptsOnly = searchResults.filter(r => r.type === 'concept');
                                        const isExpanded = expandedFolders.includes('other-concepts');

                                        return (
                                            <div className="border border-border/30 rounded-md overflow-hidden bg-background mt-2">
                                                <button
                                                    onClick={() => toggleFolder('other-concepts')}
                                                    className="w-full flex items-center justify-between p-2.5 hover:bg-secondary/50 text-left transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Other References</span>
                                                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{conceptsOnly.length} Concept(s)</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                                                </button>
                                                {isExpanded && (
                                                    <div className="p-1 bg-secondary/10 border-t border-border/30">
                                                        {conceptsOnly.length === 0 ? (
                                                            <div className="p-2 text-xs text-muted-foreground italic pl-6">- No miscellaneous concepts -</div>
                                                        ) : (
                                                            conceptsOnly.map(concept => (
                                                                <button
                                                                    key={concept.id}
                                                                    onClick={() => handleInsertLink(concept.label)}
                                                                    className="w-full text-left p-2 pl-6 rounded-md hover:bg-secondary hover:text-primary transition-colors flex items-center gap-2"
                                                                >
                                                                    <div className="w-1 h-1 rounded-full bg-border" />
                                                                    <span className="text-sm text-muted-foreground">{concept.label}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {conceptStatus === 'new' && conceptTerm.trim().length > 0 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 shrink-0 border-t border-border/50 pt-4 mt-2">
                                <label className="text-sm font-medium leading-none text-primary">Create New Concept: "{conceptTerm}"</label>
                                <textarea
                                    className="w-full min-h-[60px] p-2 rounded-md border bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Brief description (optional)..."
                                    value={conceptDesc}
                                    onChange={(e) => setConceptDesc(e.target.value)}
                                />
                                <Button className="w-full" onClick={handleCreateConcept} disabled={isCreatingConcept}>
                                    {isCreatingConcept ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create & Insert Link
                                </Button>
                            </div>
                        )}

                        {conceptStatus !== 'new' && (
                            <div className="flex justify-end pt-2 shrink-0 border-t border-border/50 mt-2">
                                <Button variant="secondary" onClick={() => setShowConceptDialog(false)}>Cancel</Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ToolbarButton({ icon, onClick, label, disabled, active }: { icon: React.ReactNode, onClick: () => void, label: string, disabled?: boolean, active?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-2 rounded text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0",
                active ? "bg-secondary text-primary hover:bg-secondary/90" : "hover:bg-secondary hover:text-foreground"
            )}
            title={label}
        >
            {icon}
        </button>
    );
}
