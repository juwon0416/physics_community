import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from 'react';
import katex from 'katex';
import {
    Bold,
    Edit3,
    FileText,
    GitBranch,
    Italic,
    Link2,
    Loader2,
    Move,
    Plus,
    RefreshCw,
    Save,
    Sigma,
    Trash2,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '../ui';
import { cn } from '../../lib/cn';
import {
    createBlankFileOntologyFile,
    createFileOntologyEdgeId,
    deleteFileOntologyEdge,
    deleteFileOntologyFile,
    fetchFileOntologyModel,
    normalizeFileOntologyLookup,
    saveFileOntologyEdge,
    saveFileOntologyFile,
    saveFileOntologyFilePosition,
    type FileOntologyEdge,
    type FileOntologyFile,
} from '../../lib/fileOntology';

interface FileOntologyCanvasProps {
    isEditable: boolean;
    currentUserLabel?: string;
}

interface FileDraft {
    title: string;
    summary: string;
    content: string;
}

interface Viewport {
    x: number;
    y: number;
    scale: number;
}

type DragState =
    | {
          kind: 'pan';
          startClientX: number;
          startClientY: number;
          originX: number;
          originY: number;
      }
    | {
          kind: 'file';
          fileId: string;
          startClientX: number;
          startClientY: number;
          originX: number;
          originY: number;
      };

interface HoverSummaryState {
    file: FileOntologyFile;
    x: number;
    y: number;
}

type MarkdownBlock =
    | { type: 'heading'; level: number; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'quote'; text: string }
    | { type: 'code'; text: string }
    | { type: 'math'; text: string };

const MIN_SCALE = 0.45;
const MAX_SCALE = 1.65;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function draftFromFile(file: FileOntologyFile): FileDraft {
    return {
        title: file.title,
        summary: file.summary,
        content: file.content,
    };
}

function buildFileLookup(files: FileOntologyFile[]) {
    const lookup = new Map<string, FileOntologyFile>();

    files.forEach((file) => {
        [
            file.id,
            file.title,
            normalizeFileOntologyLookup(file.id),
            normalizeFileOntologyLookup(file.title),
        ].forEach((key) => {
            if (key) lookup.set(key.toLowerCase(), file);
        });
    });

    return lookup;
}

function resolveLinkedFile(target: string, lookup: Map<string, FileOntologyFile>) {
    const normalized = target.trim();
    return (
        lookup.get(normalized.toLowerCase()) ||
        lookup.get(normalizeFileOntologyLookup(normalized).toLowerCase()) ||
        null
    );
}

function parseWikiLinkToken(token: string) {
    const inner = token.slice(2, -2).trim();
    const separatorIndex = inner.indexOf('|');

    if (separatorIndex === -1) {
        return {
            target: inner,
            label: inner,
        };
    }

    return {
        target: inner.slice(0, separatorIndex).trim(),
        label: inner.slice(separatorIndex + 1).trim() || inner.slice(0, separatorIndex).trim(),
    };
}

function renderMath(tex: string, displayMode: boolean) {
    try {
        return {
            __html: katex.renderToString(tex, {
                displayMode,
                throwOnError: false,
                strict: 'ignore',
                trust: false,
            }),
        };
    } catch {
        return { __html: tex };
    }
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    let paragraphBuffer: string[] = [];
    let listBuffer: string[] = [];
    let codeBuffer: string[] = [];
    let isInsideCodeFence = false;

    const flushParagraph = () => {
        if (paragraphBuffer.length === 0) return;
        blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
        paragraphBuffer = [];
    };

    const flushList = () => {
        if (listBuffer.length === 0) return;
        blocks.push({ type: 'list', items: listBuffer });
        listBuffer = [];
    };

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            flushParagraph();
            flushList();
            if (isInsideCodeFence) {
                blocks.push({ type: 'code', text: codeBuffer.join('\n') });
                codeBuffer = [];
                isInsideCodeFence = false;
            } else {
                isInsideCodeFence = true;
                codeBuffer = [];
            }
            return;
        }

        if (isInsideCodeFence) {
            codeBuffer.push(line);
            return;
        }

        if (!trimmed) {
            flushParagraph();
            flushList();
            return;
        }

        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
            flushParagraph();
            flushList();
            blocks.push({ type: 'math', text: trimmed.slice(2, -2).trim() });
            return;
        }

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            blocks.push({
                type: 'heading',
                level: headingMatch[1].length,
                text: headingMatch[2],
            });
            return;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            flushParagraph();
            listBuffer.push(trimmed.slice(2).trim());
            return;
        }

        if (trimmed.startsWith('>')) {
            flushParagraph();
            flushList();
            blocks.push({ type: 'quote', text: trimmed.replace(/^>\s?/, '') });
            return;
        }

        flushList();
        paragraphBuffer.push(trimmed);
    });

    if (isInsideCodeFence) {
        blocks.push({ type: 'code', text: codeBuffer.join('\n') });
    }

    flushParagraph();
    flushList();

    return blocks;
}

function renderInlineMarkdown(
    text: string,
    lookup: Map<string, FileOntologyFile>,
    onNavigate: (fileId: string) => void,
    onHoverLink: (file: FileOntologyFile | null, event?: ReactMouseEvent) => void,
): ReactNode[] {
    const nodes: ReactNode[] = [];
    const tokenPattern = /(\[\[[^\]]+\]\]|\$[^$\n]+\$|`[^`\n]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const key = `${match.index}-${token}`;

        if (token.startsWith('[[')) {
            const { target, label } = parseWikiLinkToken(token);
            const linkedFile = resolveLinkedFile(target, lookup);

            nodes.push(
                <button
                    key={key}
                    type="button"
                    className={cn(
                        'mx-0.5 rounded-sm border-b border-dashed px-1 text-left font-medium transition',
                        linkedFile
                            ? 'border-cyan-300/70 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
                            : 'border-amber-300/70 bg-amber-300/10 text-amber-100',
                    )}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (linkedFile) onNavigate(linkedFile.id);
                    }}
                    onMouseEnter={(event) => {
                        if (linkedFile) onHoverLink(linkedFile, event);
                    }}
                    onMouseMove={(event) => {
                        if (linkedFile) onHoverLink(linkedFile, event);
                    }}
                    onMouseLeave={() => onHoverLink(null)}
                    title={linkedFile ? `Open ${linkedFile.title}` : `Unresolved link: ${target}`}
                >
                    {label}
                </button>,
            );
        } else if (token.startsWith('$')) {
            nodes.push(
                <span
                    key={key}
                    className="mx-0.5 inline-block align-middle"
                    dangerouslySetInnerHTML={renderMath(token.slice(1, -1), false)}
                />,
            );
        } else if (token.startsWith('`')) {
            nodes.push(
                <code key={key} className="rounded bg-black/30 px-1 py-0.5 text-[0.9em] text-emerald-100">
                    {token.slice(1, -1)}
                </code>,
            );
        } else if (token.startsWith('**')) {
            nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('*')) {
            nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
        }

        lastIndex = tokenPattern.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function MarkdownPreview({
    content,
    files,
    onNavigate,
    onHoverLink,
}: {
    content: string;
    files: FileOntologyFile[];
    onNavigate: (fileId: string) => void;
    onHoverLink: (file: FileOntologyFile | null, event?: ReactMouseEvent) => void;
}) {
    const lookup = useMemo(() => buildFileLookup(files), [files]);
    const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

    if (!content.trim()) {
        return <p className="text-sm italic text-slate-400">Empty markdown file</p>;
    }

    return (
        <div className="space-y-3 text-sm leading-6 text-slate-100">
            {blocks.map((block, index) => {
                const key = `${block.type}-${index}`;

                if (block.type === 'heading') {
                    const headingClass =
                        block.level === 1
                            ? 'text-xl'
                            : block.level === 2
                              ? 'text-lg'
                              : 'text-base';

                    return (
                        <div
                            key={key}
                            className={cn('font-semibold tracking-tight text-white', headingClass)}
                        >
                            {renderInlineMarkdown(block.text, lookup, onNavigate, onHoverLink)}
                        </div>
                    );
                }

                if (block.type === 'list') {
                    return (
                        <ul key={key} className="list-disc space-y-1 pl-5">
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-${itemIndex}`}>
                                    {renderInlineMarkdown(item, lookup, onNavigate, onHoverLink)}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'quote') {
                    return (
                        <blockquote key={key} className="border-l-2 border-cyan-300/40 pl-3 text-slate-300">
                            {renderInlineMarkdown(block.text, lookup, onNavigate, onHoverLink)}
                        </blockquote>
                    );
                }

                if (block.type === 'code') {
                    return (
                        <pre
                            key={key}
                            className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-emerald-100"
                        >
                            <code>{block.text}</code>
                        </pre>
                    );
                }

                if (block.type === 'math') {
                    return (
                        <div
                            key={key}
                            className="overflow-x-auto rounded-lg border border-cyan-300/10 bg-cyan-300/5 p-3"
                            dangerouslySetInnerHTML={renderMath(block.text, true)}
                        />
                    );
                }

                return (
                    <p key={key}>
                        {renderInlineMarkdown(block.text, lookup, onNavigate, onHoverLink)}
                    </p>
                );
            })}
        </div>
    );
}

function edgeAnchors(source: FileOntologyFile, target: FileOntologyFile) {
    const sourceX = source.x + source.width / 2;
    const sourceY = source.y + source.height / 2;
    const targetX = target.x + target.width / 2;
    const targetY = target.y + target.height / 2;

    return {
        sourceX,
        sourceY,
        targetX,
        targetY,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2,
    };
}

export default function FileOntologyCanvas({ isEditable, currentUserLabel }: FileOntologyCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const filesRef = useRef<FileOntologyFile[]>([]);
    const [files, setFiles] = useState<FileOntologyFile[]>([]);
    const [edges, setEdges] = useState<FileOntologyEdge[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [connectFromFileId, setConnectFromFileId] = useState<string | null>(null);
    const [draft, setDraft] = useState<FileDraft | null>(null);
    const [viewport, setViewport] = useState<Viewport>({ x: 80, y: 40, scale: 0.92 });
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [hoverSummary, setHoverSummary] = useState<HoverSummaryState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkSearch, setLinkSearch] = useState('');

    const selectedFile = useMemo(
        () => files.find((file) => file.id === selectedFileId) || null,
        [files, selectedFileId],
    );

    const fileById = useMemo(() => {
        const map = new Map<string, FileOntologyFile>();
        files.forEach((file) => map.set(file.id, file));
        return map;
    }, [files]);

    const filteredLinkTargets = useMemo(() => {
        const query = normalizeFileOntologyLookup(linkSearch);
        return files.filter((file) => {
            if (file.id === selectedFileId) return false;
            if (!query) return true;

            return (
                normalizeFileOntologyLookup(file.title).includes(query) ||
                normalizeFileOntologyLookup(file.id).includes(query)
            );
        });
    }, [files, linkSearch, selectedFileId]);

    const worldSize = useMemo(() => {
        const maxX = Math.max(1800, ...files.map((file) => file.x + file.width + 520));
        const maxY = Math.max(1200, ...files.map((file) => file.y + file.height + 420));
        return { width: maxX, height: maxY };
    }, [files]);

    const loadFileOntology = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await fetchFileOntologyModel();
            const firstFile = result.model.files[0] ?? null;
            setFiles(result.model.files);
            setEdges(result.model.edges);
            setSelectedFileId(firstFile?.id ?? null);
            setDraft(firstFile ? draftFromFile(firstFile) : null);
            setStatusMessage(result.warning || null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown file ontology load error';
            setStatusMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadFileOntology();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadFileOntology]);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (event: PointerEvent) => {
            if (dragState.kind === 'pan') {
                setViewport((current) => ({
                    ...current,
                    x: dragState.originX + event.clientX - dragState.startClientX,
                    y: dragState.originY + event.clientY - dragState.startClientY,
                }));
                return;
            }

            const nextX = dragState.originX + (event.clientX - dragState.startClientX) / viewport.scale;
            const nextY = dragState.originY + (event.clientY - dragState.startClientY) / viewport.scale;

            setFiles((currentFiles) =>
                currentFiles.map((file) =>
                    file.id === dragState.fileId
                        ? {
                              ...file,
                              x: Math.round(nextX),
                              y: Math.round(nextY),
                          }
                        : file,
                ),
            );
        };

        const handlePointerUp = () => {
            if (dragState.kind === 'file') {
                const file = filesRef.current.find((candidate) => candidate.id === dragState.fileId);
                if (file && isEditable) {
                    saveFileOntologyFilePosition(file).catch((error) => {
                        const message = error instanceof Error ? error.message : 'Failed to save node position';
                        setStatusMessage(`Position save failed: ${message}`);
                    });
                }
            }

            setDragState(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragState, isEditable, viewport.scale]);

    const focusFile = useCallback(
        (fileId: string) => {
            const file = filesRef.current.find((candidate) => candidate.id === fileId);
            if (!file) return;

            setSelectedFileId(fileId);
            setDraft(draftFromFile(file));
            setConnectFromFileId(null);

            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            setViewport((current) => ({
                ...current,
                x: rect.width * 0.38 - (file.x + file.width / 2) * current.scale,
                y: rect.height * 0.5 - (file.y + file.height / 2) * current.scale,
            }));
        },
        [],
    );

    const handleHoverLink = useCallback((file: FileOntologyFile | null, event?: ReactMouseEvent) => {
        if (!file || !event) {
            setHoverSummary(null);
            return;
        }

        setHoverSummary({
            file,
            x: event.clientX,
            y: event.clientY,
        });
    }, []);

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
        event.preventDefault();

        const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
        setViewport((current) => ({
            ...current,
            scale: clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE),
        }));
    };

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        setDragState({
            kind: 'pan',
            startClientX: event.clientX,
            startClientY: event.clientY,
            originX: viewport.x,
            originY: viewport.y,
        });
    };

    const handleFilePointerDown = (event: React.PointerEvent<HTMLDivElement>, file: FileOntologyFile) => {
        event.stopPropagation();
        setSelectedFileId(file.id);
        setDraft(draftFromFile(file));

        if (!isEditable || event.button !== 0) return;

        setDragState({
            kind: 'file',
            fileId: file.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            originX: file.x,
            originY: file.y,
        });
    };

    const reportWriteError = (action: string, error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error';
        setStatusMessage(`${action} failed: ${message}`);
    };

    const handleAddFile = async () => {
        if (!isEditable) return;

        const file = createBlankFileOntologyFile(files.length);
        setFiles((current) => [...current, file]);
        setSelectedFileId(file.id);
        setDraft(draftFromFile(file));
        setStatusMessage('Saving new file node...');

        try {
            const savedFile = await saveFileOntologyFile(file);
            setFiles((current) => current.map((candidate) => (candidate.id === file.id ? savedFile : candidate)));
            setStatusMessage('File node saved.');
        } catch (error) {
            reportWriteError('File create', error);
        }
    };

    const handleSaveDraft = async () => {
        if (!selectedFile || !draft || !isEditable) return;

        const updatedFile: FileOntologyFile = {
            ...selectedFile,
            title: draft.title.trim() || selectedFile.title,
            summary: draft.summary.trim(),
            content: draft.content,
        };

        setIsSaving(true);
        setFiles((current) => current.map((file) => (file.id === updatedFile.id ? updatedFile : file)));
        setStatusMessage('Saving markdown file...');

        try {
            const savedFile = await saveFileOntologyFile(updatedFile);
            setFiles((current) => current.map((file) => (file.id === savedFile.id ? savedFile : file)));
            setStatusMessage('Markdown file saved.');
        } catch (error) {
            reportWriteError('File save', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFile = async (file: FileOntologyFile) => {
        if (!isEditable) return;
        const confirmed = window.confirm(`Delete "${file.title}" and its edges?`);
        if (!confirmed) return;

        try {
            await deleteFileOntologyFile(file.id);
            setFiles((current) => current.filter((candidate) => candidate.id !== file.id));
            setEdges((current) =>
                current.filter(
                    (edge) => edge.sourceFileId !== file.id && edge.targetFileId !== file.id,
                ),
            );
            if (selectedFileId === file.id) {
                setSelectedFileId(null);
                setDraft(null);
            }
            setStatusMessage('File node deleted.');
        } catch (error) {
            reportWriteError('File delete', error);
        }
    };

    const handleConnectFile = async (targetFile: FileOntologyFile) => {
        if (!isEditable) return;

        if (!connectFromFileId) {
            setConnectFromFileId(targetFile.id);
            setStatusMessage(`Choose a target file for "${targetFile.title}".`);
            return;
        }

        if (connectFromFileId === targetFile.id) {
            setConnectFromFileId(null);
            setStatusMessage('Self-links are skipped. Choose a different target file.');
            return;
        }

        const edge: FileOntologyEdge = {
            id: createFileOntologyEdgeId(connectFromFileId, targetFile.id),
            sourceFileId: connectFromFileId,
            targetFileId: targetFile.id,
            label: 'relates to',
        };

        setEdges((current) => [...current, edge]);
        setConnectFromFileId(null);

        try {
            const savedEdge = await saveFileOntologyEdge(edge);
            setEdges((current) => current.map((candidate) => (candidate.id === edge.id ? savedEdge : candidate)));
            setStatusMessage('File edge saved.');
        } catch (error) {
            reportWriteError('Edge create', error);
        }
    };

    const handleEditEdgeLabel = async (edge: FileOntologyEdge) => {
        if (!isEditable) return;

        const nextLabel = window.prompt('Edge label', edge.label)?.trim();
        if (!nextLabel || nextLabel === edge.label) return;

        const updatedEdge = { ...edge, label: nextLabel };
        setEdges((current) =>
            current.map((candidate) => (candidate.id === edge.id ? updatedEdge : candidate)),
        );

        try {
            const savedEdge = await saveFileOntologyEdge(updatedEdge);
            setEdges((current) =>
                current.map((candidate) => (candidate.id === edge.id ? savedEdge : candidate)),
            );
            setStatusMessage('Edge label saved.');
        } catch (error) {
            reportWriteError('Edge label save', error);
        }
    };

    const handleDeleteEdge = async (edge: FileOntologyEdge) => {
        if (!isEditable) return;
        const confirmed = window.confirm(`Delete edge "${edge.label}"?`);
        if (!confirmed) return;

        try {
            await deleteFileOntologyEdge(edge.id);
            setEdges((current) => current.filter((candidate) => candidate.id !== edge.id));
            setStatusMessage('Edge deleted.');
        } catch (error) {
            reportWriteError('Edge delete', error);
        }
    };

    const insertAroundSelection = (before: string, after = before) => {
        if (!draft) return;
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? draft.content.length;
        const end = textarea?.selectionEnd ?? draft.content.length;
        const selectedText = draft.content.slice(start, end);
        const nextContent =
            draft.content.slice(0, start) +
            before +
            selectedText +
            after +
            draft.content.slice(end);

        setDraft({ ...draft, content: nextContent });

        window.setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertFileLink = (targetFile: FileOntologyFile) => {
        if (!draft) return;
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? draft.content.length;
        const end = textarea?.selectionEnd ?? draft.content.length;
        const selectedText = draft.content.slice(start, end).replace(/\s+/g, ' ').trim();
        const markup = selectedText
            ? `[[${targetFile.id}|${selectedText}]]`
            : `[[${targetFile.id}]]`;
        const nextContent = draft.content.slice(0, start) + markup + draft.content.slice(end);

        setDraft({ ...draft, content: nextContent });
        setLinkDialogOpen(false);
        setLinkSearch('');

        window.setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(start + markup.length, start + markup.length);
        }, 0);
    };

    const zoomBy = (factor: number) => {
        setViewport((current) => ({
            ...current,
            scale: clamp(current.scale * factor, MIN_SCALE, MAX_SCALE),
        }));
    };

    return (
        <div
            ref={canvasRef}
            className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-[#08111f] text-white"
            onWheel={handleWheel}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.12),transparent_30%),linear-gradient(135deg,#08111f_0%,#0c1728_45%,#101827_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onPointerDown={handleCanvasPointerDown}
            >
                <div
                    className="absolute left-0 top-0 origin-top-left"
                    style={{
                        width: worldSize.width,
                        height: worldSize.height,
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    }}
                >
                    <svg
                        className="absolute left-0 top-0 overflow-visible"
                        width={worldSize.width}
                        height={worldSize.height}
                    >
                        <defs>
                            <marker
                                id="file-ontology-arrow"
                                markerWidth="12"
                                markerHeight="12"
                                refX="10"
                                refY="6"
                                orient="auto"
                                markerUnits="strokeWidth"
                            >
                                <path d="M2,2 L10,6 L2,10 Z" fill="rgba(125, 211, 252, 0.85)" />
                            </marker>
                        </defs>
                        {edges.map((edge) => {
                            const source = fileById.get(edge.sourceFileId);
                            const target = fileById.get(edge.targetFileId);
                            if (!source || !target) return null;

                            const anchors = edgeAnchors(source, target);

                            return (
                                <g key={edge.id} className="pointer-events-auto">
                                    <line
                                        x1={anchors.sourceX}
                                        y1={anchors.sourceY}
                                        x2={anchors.targetX}
                                        y2={anchors.targetY}
                                        stroke="rgba(125, 211, 252, 0.72)"
                                        strokeWidth="2.5"
                                        markerEnd="url(#file-ontology-arrow)"
                                    />
                                    <foreignObject
                                        x={anchors.labelX - 96}
                                        y={anchors.labelY - 22}
                                        width="192"
                                        height="44"
                                    >
                                        <div className="flex h-full items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                className="max-w-[142px] truncate rounded-full border border-cyan-200/40 bg-slate-950/90 px-3 py-1 text-xs font-medium text-cyan-50 shadow-lg shadow-cyan-950/30"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void handleEditEdgeLabel(edge);
                                                }}
                                                title={isEditable ? 'Rename edge' : edge.label}
                                            >
                                                {edge.label}
                                            </button>
                                            {isEditable ? (
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-white/10 bg-slate-950/80 p-1 text-slate-300 hover:text-red-200"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDeleteEdge(edge);
                                                    }}
                                                    title="Delete edge"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </foreignObject>
                                </g>
                            );
                        })}
                    </svg>

                    {files.map((file) => {
                        const isSelected = selectedFileId === file.id;
                        const isConnectSource = connectFromFileId === file.id;

                        return (
                            <div
                                key={file.id}
                                className={cn(
                                    'absolute flex flex-col overflow-hidden rounded-2xl border bg-slate-950/86 shadow-2xl backdrop-blur-xl transition-shadow',
                                    isSelected
                                        ? 'border-cyan-200 shadow-cyan-500/25'
                                        : 'border-white/12 shadow-black/35',
                                    isConnectSource ? 'ring-2 ring-emerald-300' : null,
                                )}
                                style={{
                                    left: file.x,
                                    top: file.y,
                                    width: file.width,
                                    height: file.height,
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedFileId(file.id);
                                    setDraft(draftFromFile(file));
                                }}
                            >
                                <div
                                    className="flex cursor-grab items-center justify-between gap-3 border-b border-white/10 bg-white/[0.055] px-4 py-3 active:cursor-grabbing"
                                    onPointerDown={(event) => handleFilePointerDown(event, file)}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0 text-cyan-200" />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-white">
                                                {file.title}
                                            </div>
                                            <div className="truncate text-[11px] text-slate-400">{file.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {isEditable ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-cyan-100"
                                                    onPointerDown={(event) => event.stopPropagation()}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleConnectFile(file);
                                                    }}
                                                    title="Connect file edge"
                                                >
                                                    <GitBranch className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-red-100"
                                                    onPointerDown={(event) => event.stopPropagation()}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDeleteFile(file);
                                                    }}
                                                    title="Delete file"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>

                                <div
                                    className="min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-color:rgba(125,211,252,.55)_rgba(15,23,42,.65)] [scrollbar-width:thin]"
                                    onPointerDown={(event) => event.stopPropagation()}
                                >
                                    {file.summary ? (
                                        <div className="mb-3 rounded-xl border border-cyan-200/10 bg-cyan-200/5 px-3 py-2 text-xs leading-5 text-cyan-50/80">
                                            {file.summary}
                                        </div>
                                    ) : null}
                                    <MarkdownPreview
                                        content={file.content}
                                        files={files}
                                        onNavigate={focusFile}
                                        onHoverLink={handleHoverLink}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute left-4 top-4 flex max-w-[calc(100%-360px)] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/78 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                    onClick={handleAddFile}
                    disabled={!isEditable}
                    title={isEditable ? 'Create markdown file node' : 'Admin access required to edit'}
                >
                    <Plus className="h-4 w-4" />
                    File
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={() => zoomBy(1.1)}
                    title="Zoom in"
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={() => zoomBy(0.9)}
                    title="Zoom out"
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={() => setViewport({ x: 80, y: 40, scale: 0.92 })}
                    title="Reset view"
                >
                    <Move className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={() => void loadFileOntology()}
                    title="Reload file ontology"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-2 px-2 text-xs text-slate-300">
                    {connectFromFileId ? (
                        <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-emerald-100">
                            choose target
                        </span>
                    ) : (
                        <span>{files.length} files</span>
                    )}
                    <span>{edges.length} edges</span>
                    {currentUserLabel ? <span className="hidden sm:inline">editor: {currentUserLabel}</span> : null}
                </div>
            </div>

            {statusMessage ? (
                <div className="absolute bottom-4 left-4 max-w-xl rounded-2xl border border-amber-200/20 bg-slate-950/88 px-4 py-3 text-sm text-amber-50 shadow-2xl shadow-black/30 backdrop-blur-xl">
                    {statusMessage}
                </div>
            ) : null}

            <aside className="absolute bottom-4 right-4 top-4 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/86 shadow-2xl shadow-black/35 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                        <div className="text-sm font-semibold text-white">Markdown File</div>
                        <div className="text-xs text-slate-400">
                            {isEditable ? 'DB-backed editor' : 'Read-only view'}
                        </div>
                    </div>
                    <Edit3 className="h-4 w-4 text-cyan-200" />
                </div>

                {selectedFile && draft ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                        <label className="space-y-1.5 text-xs font-medium text-slate-300">
                            Title
                            <Input
                                value={draft.title}
                                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                                disabled={!isEditable}
                                className="border-white/10 bg-white/5 text-white"
                            />
                        </label>

                        <label className="space-y-1.5 text-xs font-medium text-slate-300">
                            Hidden summary metadata
                            <textarea
                                value={draft.summary}
                                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                                disabled={!isEditable}
                                className="min-h-[72px] w-full resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200 disabled:opacity-60"
                                placeholder="Shown only in hover tooltips."
                            />
                        </label>

                        <div className="rounded-xl border border-white/10 bg-white/[0.045]">
                            <div className="flex items-center gap-1 border-b border-white/10 p-2">
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                    onClick={() => insertAroundSelection('**')}
                                    disabled={!isEditable}
                                    title="Bold"
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                    onClick={() => insertAroundSelection('*')}
                                    disabled={!isEditable}
                                    title="Italic"
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                    onClick={() => insertAroundSelection('$')}
                                    disabled={!isEditable}
                                    title="Inline formula"
                                >
                                    <Sigma className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                    onClick={() => setLinkDialogOpen(true)}
                                    disabled={!isEditable || files.length <= 1}
                                    title="Insert Obsidian-style file link"
                                >
                                    <Link2 className="h-4 w-4" />
                                </button>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={draft.content}
                                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                                disabled={!isEditable}
                                className="min-h-[330px] w-full resize-y bg-transparent p-3 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-70"
                                placeholder="Write markdown with [[file-id|highlighted phrase]] links and $math$."
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="secondary"
                                className="gap-2 bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                                onClick={() => void handleSaveDraft()}
                                disabled={!isEditable || isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save
                            </Button>
                            <div className="truncate text-xs text-slate-500">{selectedFile.id}</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
                        Select a file node to inspect or edit it.
                    </div>
                )}
            </aside>

            {hoverSummary ? (
                <div
                    className="pointer-events-none fixed z-[1000] w-72 rounded-lg border border-cyan-200/25 bg-slate-950/96 p-3 text-sm shadow-2xl shadow-cyan-950/30"
                    style={{
                        left: Math.min(hoverSummary.x + 16, window.innerWidth - 304),
                        top: Math.min(hoverSummary.y + 18, window.innerHeight - 180),
                    }}
                >
                    <div className="mb-1 font-semibold text-cyan-100">{hoverSummary.file.title}</div>
                    <div className="text-xs leading-5 text-slate-300">
                        {hoverSummary.file.summary || 'No hidden summary metadata yet.'}
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-6 py-5 shadow-2xl shadow-black/30">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
                        <span className="text-sm text-slate-300">Loading file ontology canvas...</span>
                    </div>
                </div>
            ) : null}

            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent className="max-w-lg border-white/10 bg-slate-950 text-white">
                    <DialogHeader>
                        <DialogTitle>Insert File Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            value={linkSearch}
                            onChange={(event) => setLinkSearch(event.target.value)}
                            placeholder="Search files..."
                            className="border-white/10 bg-white/5 text-white"
                            autoFocus
                        />
                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                            {filteredLinkTargets.length > 0 ? (
                                filteredLinkTargets.map((file) => (
                                    <button
                                        key={file.id}
                                        type="button"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:border-cyan-200/40 hover:bg-cyan-200/10"
                                        onClick={() => insertFileLink(file)}
                                    >
                                        <div className="font-medium text-white">{file.title}</div>
                                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                            {file.summary || file.id}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">
                                    No target files found.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
