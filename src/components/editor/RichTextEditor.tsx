import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Edit2, Eye, Bold, Italic, Code, Image as ImageIcon, Sigma, Network, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import 'katex/dist/katex.min.css';
import { storage } from '../../data/storage';
import { conceptAPI } from '../../lib/concepts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, Button } from '../../components/ui';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}


export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const [mode, setMode] = useState<'write' | 'preview'>('write');
    // ... (rest of component state) ...
    const [isUploading, setIsUploading] = useState(false);

    // Concept Dialog State
    const [showConceptDialog, setShowConceptDialog] = useState(false);
    const [conceptTerm, setConceptTerm] = useState('');
    const [conceptDesc, setConceptDesc] = useState('');
    const [isCreatingConcept, setIsCreatingConcept] = useState(false);
    const [conceptStatus, setConceptStatus] = useState<'idle' | 'checking' | 'exists' | 'new'>('idle');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        if (selection) {
            checkConcept(selection);
        }
    };

    const checkConcept = async (term: string) => {
        if (!term) return;
        setConceptStatus('checking');
        try {
            const existing = await conceptAPI.getByLabel(term);
            setConceptStatus(existing ? 'exists' : 'new');
            if (existing && existing.data.description) {
                setConceptDesc(existing.data.description);
            }
        } catch (e) {
            console.error(e);
            setConceptStatus('new');
        }
    };

    const handleCreateConcept = async () => {
        if (!conceptTerm) return;
        setIsCreatingConcept(true);
        try {
            if (conceptStatus === 'new') {
                await conceptAPI.create(conceptTerm, conceptDesc);
            }
            // Just insert the link
            insertText(`[[${conceptTerm}]]`);
            setShowConceptDialog(false);
        } catch (e) {
            alert('Failed to create concept');
            console.error(e);
        } finally {
            setIsCreatingConcept(false);
        }
    };

    // Pre-process markdown to turn [[Link]] into [Link](/concept/Link)
    const processedValue = value?.replace(/\[\[(.*?)\]\]/g, (_, term) => {
        // Standard markdown link: [text](url). Url cannot have spaces unless encoded.
        // So we MUST encode spaces.
        return `[${term}](/concept/${encodeURIComponent(term)})`;
    });

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
            <div className="flex items-center justify-between p-2 border-b border-border/50 bg-secondary/20 rounded-t-md">
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

            {/* Concept Dialog */}
            <Dialog open={showConceptDialog} onOpenChange={setShowConceptDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Concept / Keyword</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Keyword Term</label>
                            <Input
                                value={conceptTerm}
                                onChange={(e) => {
                                    setConceptTerm(e.target.value);
                                    if (conceptStatus !== 'idle') setConceptStatus('idle');
                                }}
                                onBlur={() => checkConcept(conceptTerm)}
                                placeholder="e.g., Quantum Entanglement"
                            />
                        </div>

                        {conceptStatus === 'checking' && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Checking database...</div>}

                        {conceptStatus === 'exists' && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600">
                                <span className="font-semibold block mb-1">Concept Found!</span>
                                {conceptDesc ? conceptDesc : "No description available."}
                            </div>
                        )}

                        {conceptStatus === 'new' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description (New Concept)</label>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Enter a brief description for this concept..."
                                    value={conceptDesc}
                                    onChange={(e) => setConceptDesc(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">This will create a new node in the Graph DB.</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleCreateConcept} disabled={!conceptTerm || isCreatingConcept || conceptStatus === 'checking'}>
                                {isCreatingConcept ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {conceptStatus === 'new' ? 'Create & Link' : 'Insert Link'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                    strict: "ignore"
                                }]]}
                                components={{
                                    img: ({ node, ...props }) => (
                                        <img {...props} className="rounded-lg border border-border/50 my-4 max-h-[500px] object-contain bg-black/20" />
                                    ),
                                    a: ({ node, href, children, ...props }) => {
                                        if (href?.startsWith('/concept/')) {
                                            const term = decodeURIComponent(href.replace('/concept/', ''));
                                            return (
                                                <span
                                                    className="text-blue-500 font-bold underline decoration-dotted cursor-help hover:text-blue-400 transition-colors"
                                                    title={`Concept: ${term}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        alert(`Concept Info: ${term}\n(Click to navigate in future update)`);
                                                    }}
                                                >
                                                    {children}
                                                </span>
                                            );
                                        }
                                        return <a href={href} {...props}>{children}</a>;
                                    }
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
        </div>
    );
}

function ToolbarButton({ icon, onClick, label, disabled }: { icon: React.ReactNode, onClick: () => void, label: string, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title={label}
        >
            {icon}
        </button>
    );
}
