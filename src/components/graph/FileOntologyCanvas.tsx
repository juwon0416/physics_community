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
    Maximize2,
    Minimize2,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '../ui';
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
          kind: 'move';
          fileId: string;
          startClientX: number;
          startClientY: number;
          originX: number;
          originY: number;
      }
    | {
          kind: 'resize';
          fileId: string;
          startClientX: number;
          startClientY: number;
          originWidth: number;
          originHeight: number;
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

interface LinkDialogState {
    fileId: string;
    search: string;
}

const MIN_SCALE = 0.45;
const MAX_SCALE = 1.65;
const MIN_NODE_WIDTH = 280;
const MIN_NODE_HEIGHT = 210;
const MAX_NODE_WIDTH = 1200;
const MAX_NODE_HEIGHT = 900;

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
                            ? 'border-foreground/60 bg-muted text-foreground hover:bg-secondary'
                            : 'border-foreground/30 bg-transparent text-muted-foreground',
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
                <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.9em] text-foreground">
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
    compact = false,
}: {
    content: string;
    files: FileOntologyFile[];
    onNavigate: (fileId: string) => void;
    onHoverLink: (file: FileOntologyFile | null, event?: ReactMouseEvent) => void;
    compact?: boolean;
}) {
    const lookup = useMemo(() => buildFileLookup(files), [files]);
    const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

    if (!content.trim()) {
        return <p className="text-sm italic text-muted-foreground">Empty markdown file</p>;
    }

    return (
        <div className={cn('space-y-3 leading-6 text-foreground', compact ? 'text-sm' : 'text-base')}>
            {blocks.map((block, index) => {
                const key = `${block.type}-${index}`;

                if (block.type === 'heading') {
                    const headingClass =
                        block.level === 1
                            ? compact
                                ? 'text-lg'
                                : 'text-3xl'
                            : block.level === 2
                              ? compact
                                  ? 'text-base'
                                  : 'text-2xl'
                              : compact
                                ? 'text-sm'
                                : 'text-xl';

                    return (
                        <div
                            key={key}
                            className={cn('font-semibold tracking-tight text-foreground', headingClass)}
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
                        <blockquote key={key} className="border-l-2 border-border pl-3 text-muted-foreground">
                            {renderInlineMarkdown(block.text, lookup, onNavigate, onHoverLink)}
                        </blockquote>
                    );
                }

                if (block.type === 'code') {
                    return (
                        <pre
                            key={key}
                            className="file-ontology-scrollbar overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs text-foreground"
                        >
                            <code>{block.text}</code>
                        </pre>
                    );
                }

                if (block.type === 'math') {
                    return (
                        <div
                            key={key}
                            className="file-ontology-scrollbar overflow-x-auto rounded-md border border-border bg-muted p-3"
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

function ToolbarButton({
    children,
    onClick,
    disabled,
    title,
    active,
}: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    title: string;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            disabled={disabled}
            title={title}
            className={cn(
                'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-transparent px-2 text-sm transition disabled:pointer-events-none disabled:opacity-35',
                active
                    ? 'border-foreground bg-foreground text-background'
                    : 'text-foreground hover:border-border hover:bg-muted',
            )}
        >
            {children}
        </button>
    );
}

export default function FileOntologyCanvas({ isEditable, currentUserLabel }: FileOntologyCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const filesRef = useRef<FileOntologyFile[]>([]);
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const [files, setFiles] = useState<FileOntologyFile[]>([]);
    const [edges, setEdges] = useState<FileOntologyEdge[]>([]);
    const [drafts, setDrafts] = useState<Record<string, FileDraft>>({});
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [maximizedFileId, setMaximizedFileId] = useState<string | null>(null);
    const [connectFromFileId, setConnectFromFileId] = useState<string | null>(null);
    const [viewport, setViewport] = useState<Viewport>({ x: 80, y: 40, scale: 0.92 });
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [hoverSummary, setHoverSummary] = useState<HoverSummaryState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingId, setIsSavingId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);

    const fileById = useMemo(() => {
        const map = new Map<string, FileOntologyFile>();
        files.forEach((file) => map.set(file.id, file));
        return map;
    }, [files]);

    const maximizedFile = maximizedFileId ? fileById.get(maximizedFileId) || null : null;

    const filteredLinkTargets = useMemo(() => {
        if (!linkDialog) return [];
        const query = normalizeFileOntologyLookup(linkDialog.search);

        return files.filter((file) => {
            if (file.id === linkDialog.fileId) return false;
            if (!query) return true;

            return (
                normalizeFileOntologyLookup(file.title).includes(query) ||
                normalizeFileOntologyLookup(file.id).includes(query)
            );
        });
    }, [files, linkDialog]);

    const worldSize = useMemo(() => {
        const maxX = Math.max(1800, ...files.map((file) => file.x + file.width + 520));
        const maxY = Math.max(1200, ...files.map((file) => file.y + file.height + 420));
        return { width: maxX, height: maxY };
    }, [files]);

    const setTextareaRef = (fileId: string) => (element: HTMLTextAreaElement | null) => {
        textareaRefs.current[fileId] = element;
    };

    const getDraft = useCallback(
        (file: FileOntologyFile) => drafts[file.id] || draftFromFile(file),
        [drafts],
    );

    const updateDraftForFile = (file: FileOntologyFile, patch: Partial<FileDraft>) => {
        setDrafts((current) => ({
            ...current,
            [file.id]: {
                ...(current[file.id] || draftFromFile(file)),
                ...patch,
            },
        }));
    };

    const updateDraft = (fileId: string, patch: Partial<FileDraft>) => {
        const file = filesRef.current.find((candidate) => candidate.id === fileId);
        if (!file) return;

        updateDraftForFile(file, patch);
    };

    const loadFileOntology = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await fetchFileOntologyModel();
            const firstFile = result.model.files[0] ?? null;
            const nextDrafts = Object.fromEntries(
                result.model.files.map((file) => [file.id, draftFromFile(file)]),
            );

            setFiles(result.model.files);
            setEdges(result.model.edges);
            setDrafts(nextDrafts);
            setSelectedFileId(firstFile?.id ?? null);
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

            if (dragState.kind === 'move') {
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
                return;
            }

            const nextWidth = dragState.originWidth + (event.clientX - dragState.startClientX) / viewport.scale;
            const nextHeight = dragState.originHeight + (event.clientY - dragState.startClientY) / viewport.scale;

            setFiles((currentFiles) =>
                currentFiles.map((file) =>
                    file.id === dragState.fileId
                        ? {
                              ...file,
                              width: Math.round(clamp(nextWidth, MIN_NODE_WIDTH, MAX_NODE_WIDTH)),
                              height: Math.round(clamp(nextHeight, MIN_NODE_HEIGHT, MAX_NODE_HEIGHT)),
                          }
                        : file,
                ),
            );
        };

        const handlePointerUp = () => {
            if ((dragState.kind === 'move' || dragState.kind === 'resize') && isEditable) {
                const file = filesRef.current.find((candidate) => candidate.id === dragState.fileId);
                if (file) {
                    saveFileOntologyFilePosition(file).catch((error) => {
                        const message = error instanceof Error ? error.message : 'Failed to save node layout';
                        setStatusMessage(`Layout save failed: ${message}`);
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

    const focusFile = useCallback((fileId: string) => {
        const file = filesRef.current.find((candidate) => candidate.id === fileId);
        if (!file) return;

        setSelectedFileId(fileId);
        setConnectFromFileId(null);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setViewport((current) => ({
            ...current,
            x: rect.width * 0.42 - (file.x + file.width / 2) * current.scale,
            y: rect.height * 0.5 - (file.y + file.height / 2) * current.scale,
        }));
    }, []);

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

    const handleFileMovePointerDown = (
        event: React.PointerEvent<HTMLDivElement>,
        file: FileOntologyFile,
    ) => {
        event.stopPropagation();
        setSelectedFileId(file.id);

        if (!isEditable || event.button !== 0 || maximizedFileId) return;

        setDragState({
            kind: 'move',
            fileId: file.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            originX: file.x,
            originY: file.y,
        });
    };

    const handleFileResizePointerDown = (
        event: React.PointerEvent<HTMLButtonElement>,
        file: FileOntologyFile,
    ) => {
        event.stopPropagation();
        if (!isEditable || event.button !== 0 || maximizedFileId) return;

        setSelectedFileId(file.id);
        setDragState({
            kind: 'resize',
            fileId: file.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            originWidth: file.width,
            originHeight: file.height,
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
        setDrafts((current) => ({ ...current, [file.id]: draftFromFile(file) }));
        setSelectedFileId(file.id);
        setEditingFileId(file.id);
        setStatusMessage('Saving new file node...');

        try {
            const savedFile = await saveFileOntologyFile(file);
            setFiles((current) => current.map((candidate) => (candidate.id === file.id ? savedFile : candidate)));
            setDrafts((current) => ({ ...current, [savedFile.id]: draftFromFile(savedFile) }));
            setStatusMessage('File node saved.');
        } catch (error) {
            reportWriteError('File create', error);
        }
    };

    const handleSaveFile = async (file: FileOntologyFile) => {
        if (!isEditable) return;

        const draft = getDraft(file);
        const updatedFile: FileOntologyFile = {
            ...file,
            title: draft.title.trim() || file.title,
            summary: draft.summary.trim(),
            content: draft.content,
        };

        setIsSavingId(file.id);
        setFiles((current) => current.map((candidate) => (candidate.id === updatedFile.id ? updatedFile : candidate)));
        setStatusMessage('Saving markdown file...');

        try {
            const savedFile = await saveFileOntologyFile(updatedFile);
            setFiles((current) => current.map((candidate) => (candidate.id === savedFile.id ? savedFile : candidate)));
            setDrafts((current) => ({ ...current, [savedFile.id]: draftFromFile(savedFile) }));
            setStatusMessage('Markdown file saved.');
        } catch (error) {
            reportWriteError('File save', error);
        } finally {
            setIsSavingId(null);
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
            setDrafts((current) => {
                const next = { ...current };
                delete next[file.id];
                return next;
            });
            if (selectedFileId === file.id) setSelectedFileId(null);
            if (editingFileId === file.id) setEditingFileId(null);
            if (maximizedFileId === file.id) setMaximizedFileId(null);
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

    const insertAroundSelection = (fileId: string, before: string, after = before) => {
        const file = filesRef.current.find((candidate) => candidate.id === fileId);
        if (!file) return;

        const draft = drafts[fileId] || draftFromFile(file);
        const textarea = textareaRefs.current[fileId];
        const start = textarea?.selectionStart ?? draft.content.length;
        const end = textarea?.selectionEnd ?? draft.content.length;
        const selectedText = draft.content.slice(start, end);
        const nextContent =
            draft.content.slice(0, start) +
            before +
            selectedText +
            after +
            draft.content.slice(end);

        updateDraft(fileId, { content: nextContent });

        window.setTimeout(() => {
            textareaRefs.current[fileId]?.focus();
            textareaRefs.current[fileId]?.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const insertFileLink = (targetFile: FileOntologyFile) => {
        if (!linkDialog) return;
        const sourceFile = filesRef.current.find((candidate) => candidate.id === linkDialog.fileId);
        if (!sourceFile) return;

        const draft = drafts[sourceFile.id] || draftFromFile(sourceFile);
        const textarea = textareaRefs.current[sourceFile.id];
        const start = textarea?.selectionStart ?? draft.content.length;
        const end = textarea?.selectionEnd ?? draft.content.length;
        const selectedText = draft.content.slice(start, end).replace(/\s+/g, ' ').trim();
        const markup = selectedText
            ? `[[${targetFile.id}|${selectedText}]]`
            : `[[${targetFile.id}]]`;
        const nextContent = draft.content.slice(0, start) + markup + draft.content.slice(end);

        updateDraft(sourceFile.id, { content: nextContent });
        setLinkDialog(null);

        window.setTimeout(() => {
            textareaRefs.current[sourceFile.id]?.focus();
            textareaRefs.current[sourceFile.id]?.setSelectionRange(start + markup.length, start + markup.length);
        }, 0);
    };

    const zoomBy = (factor: number) => {
        setViewport((current) => ({
            ...current,
            scale: clamp(current.scale * factor, MIN_SCALE, MAX_SCALE),
        }));
    };

    const renderNodeEditor = (file: FileOntologyFile, expanded = false) => {
        const draft = getDraft(file);

        return (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Title
                    <Input
                        value={draft.title}
                        onChange={(event) => updateDraftForFile(file, { title: event.target.value })}
                        disabled={!isEditable}
                        className="border-border bg-background text-foreground"
                    />
                </label>

                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Hidden summary metadata
                    <textarea
                        value={draft.summary}
                        onChange={(event) => updateDraftForFile(file, { summary: event.target.value })}
                        disabled={!isEditable}
                        className="file-ontology-scrollbar min-h-[64px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-foreground disabled:opacity-60"
                        placeholder="Shown only in hover tooltips."
                    />
                </label>

                <div className="min-h-0 flex-1 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-1 border-b border-border p-1.5">
                        <ToolbarButton
                            onClick={() => insertAroundSelection(file.id, '**')}
                            disabled={!isEditable}
                            title="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => insertAroundSelection(file.id, '*')}
                            disabled={!isEditable}
                            title="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => insertAroundSelection(file.id, '$')}
                            disabled={!isEditable}
                            title="Inline formula"
                        >
                            <Sigma className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => setLinkDialog({ fileId: file.id, search: '' })}
                            disabled={!isEditable || files.length <= 1}
                            title="Insert Obsidian-style file link"
                        >
                            <Link2 className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                    <textarea
                        ref={setTextareaRef(file.id)}
                        value={draft.content}
                        onChange={(event) => updateDraftForFile(file, { content: event.target.value })}
                        disabled={!isEditable}
                        className={cn(
                            'file-ontology-scrollbar w-full resize-none bg-transparent p-3 font-mono leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-70',
                            expanded ? 'h-[calc(100vh-330px)] min-h-[420px] text-base' : 'h-[260px] min-h-[220px] text-sm',
                        )}
                        placeholder="Write markdown with [[file-id|highlighted phrase]] links and $math$."
                    />
                </div>

                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-foreground bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-40"
                        onClick={(event) => {
                            event.stopPropagation();
                            void handleSaveFile(file);
                        }}
                        disabled={!isEditable || isSavingId === file.id}
                    >
                        {isSavingId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </button>
                    <span className="truncate text-xs text-muted-foreground">{file.id}</span>
                </div>
            </div>
        );
    };

    const renderNodePreview = (file: FileOntologyFile, expanded = false) => {
        const adaptiveFontSize = expanded
            ? 16
            : clamp(Math.round(file.width / 34), 12, 17);

        return (
            <div
                className="file-ontology-scrollbar min-h-0 flex-1 overflow-auto p-4"
                style={{ fontSize: adaptiveFontSize, lineHeight: 1.55 }}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <MarkdownPreview
                    content={file.content}
                    files={files}
                    onNavigate={focusFile}
                    onHoverLink={handleHoverLink}
                    compact={!expanded}
                />
            </div>
        );
    };

    const renderFileNode = (file: FileOntologyFile) => {
        const isSelected = selectedFileId === file.id;
        const isConnectSource = connectFromFileId === file.id;
        const isEditing = editingFileId === file.id;

        return (
            <div
                key={file.id}
                className={cn(
                    'absolute flex flex-col overflow-hidden rounded-lg border bg-background text-foreground shadow-none',
                    isSelected ? 'border-foreground' : 'border-border',
                    isConnectSource ? 'outline outline-2 outline-foreground' : null,
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
                }}
            >
                <div
                    className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background px-3 py-2 active:cursor-grabbing"
                    onPointerDown={(event) => handleFileMovePointerDown(event, file)}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-foreground" />
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{file.title}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{file.id}</div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <ToolbarButton
                            onClick={() => setEditingFileId(isEditing ? null : file.id)}
                            disabled={!isEditable}
                            title={isEditing ? 'Close editor' : 'Edit file'}
                            active={isEditing}
                        >
                            <Edit3 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => void handleConnectFile(file)}
                            disabled={!isEditable}
                            title="Connect file edge"
                            active={isConnectSource}
                        >
                            <GitBranch className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => setMaximizedFileId(file.id)}
                            title="Maximize file"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => void handleDeleteFile(file)}
                            disabled={!isEditable}
                            title="Delete file"
                        >
                            <Trash2 className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                </div>

                <div className="min-h-0 flex-1 p-0">
                    {isEditing ? (
                        <div
                            className="file-ontology-scrollbar flex h-full flex-col overflow-auto p-3"
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            {renderNodeEditor(file)}
                        </div>
                    ) : (
                        renderNodePreview(file)
                    )}
                </div>

                {isEditable ? (
                    <button
                        type="button"
                        className="absolute bottom-1.5 right-1.5 h-4 w-4 cursor-nwse-resize border-b-2 border-r-2 border-foreground/50 bg-transparent"
                        onPointerDown={(event) => handleFileResizePointerDown(event, file)}
                        title="Resize node"
                    />
                ) : null}
            </div>
        );
    };

    return (
        <div
            ref={canvasRef}
            className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-background text-foreground"
            onWheel={handleWheel}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, hsl(var(--border) / 0.45) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.45) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

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
                                <path d="M2,2 L10,6 L2,10 Z" fill="hsl(var(--foreground) / 0.75)" />
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
                                        stroke="hsl(var(--foreground) / 0.6)"
                                        strokeWidth="2"
                                        markerEnd="url(#file-ontology-arrow)"
                                    />
                                    <foreignObject
                                        x={anchors.labelX - 96}
                                        y={anchors.labelY - 20}
                                        width="192"
                                        height="40"
                                    >
                                        <div className="flex h-full items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                className="max-w-[142px] truncate rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
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
                                                    className="rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
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

                    {files.map(renderFileNode)}
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 top-4 z-50 flex items-start justify-between gap-3">
                <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-lg border border-border bg-background/95 p-1.5 text-foreground shadow-none backdrop-blur">
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-foreground bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-40"
                        onClick={handleAddFile}
                        disabled={!isEditable}
                        title={isEditable ? 'Create markdown file node' : 'Admin access required to edit'}
                    >
                        <Plus className="h-4 w-4" />
                        File
                    </button>
                    <ToolbarButton onClick={() => zoomBy(1.1)} title="Zoom in">
                        <ZoomIn className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => zoomBy(0.9)} title="Zoom out">
                        <ZoomOut className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setViewport({ x: 80, y: 40, scale: 0.92 })}
                        title="Reset view"
                    >
                        <Move className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => void loadFileOntology()} title="Reload file ontology">
                        <RefreshCw className="h-4 w-4" />
                    </ToolbarButton>
                    <div className="mx-1 h-6 w-px bg-border" />
                    <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                        <span>{files.length} files</span>
                        <span>{edges.length} edges</span>
                        {connectFromFileId ? <span>choose target</span> : null}
                        {currentUserLabel ? <span className="hidden sm:inline">editor: {currentUserLabel}</span> : null}
                    </div>
                </div>
            </div>

            {statusMessage ? (
                <div className="absolute bottom-4 left-4 z-50 max-w-xl rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-none">
                    {statusMessage}
                </div>
            ) : null}

            {hoverSummary ? (
                <div
                    className="pointer-events-none fixed z-[1000] w-72 rounded-md border border-border bg-background p-3 text-sm text-foreground shadow-none"
                    style={{
                        left: Math.min(hoverSummary.x + 16, window.innerWidth - 304),
                        top: Math.min(hoverSummary.y + 18, window.innerHeight - 180),
                    }}
                >
                    <div className="mb-1 font-semibold text-foreground">{hoverSummary.file.title}</div>
                    <div className="text-xs leading-5 text-muted-foreground">
                        {hoverSummary.file.summary || 'No hidden summary metadata yet.'}
                    </div>
                </div>
            ) : null}

            {maximizedFile ? (
                <div className="absolute inset-4 z-[80] flex flex-col overflow-hidden rounded-lg border border-foreground bg-background text-foreground shadow-none">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold">{maximizedFile.title}</div>
                                <div className="truncate text-xs text-muted-foreground">{maximizedFile.id}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <ToolbarButton
                                onClick={() =>
                                    setEditingFileId(editingFileId === maximizedFile.id ? null : maximizedFile.id)
                                }
                                disabled={!isEditable}
                                title={editingFileId === maximizedFile.id ? 'Close editor' : 'Edit file'}
                                active={editingFileId === maximizedFile.id}
                            >
                                <Edit3 className="h-4 w-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => setMaximizedFileId(null)}
                                title="Exit maximized view"
                            >
                                <Minimize2 className="h-4 w-4" />
                            </ToolbarButton>
                        </div>
                    </div>
                    <div className="file-ontology-scrollbar min-h-0 flex-1 overflow-auto p-5">
                        {editingFileId === maximizedFile.id
                            ? renderNodeEditor(maximizedFile, true)
                            : renderNodePreview(maximizedFile, true)}
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <div className="absolute inset-0 z-[90] flex items-center justify-center bg-background/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background px-6 py-5 text-foreground shadow-none">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading file ontology canvas...</span>
                    </div>
                </div>
            ) : null}

            <Dialog open={Boolean(linkDialog)} onOpenChange={(open) => !open && setLinkDialog(null)}>
                <DialogContent className="max-w-lg border-border bg-background text-foreground">
                    <DialogHeader>
                        <DialogTitle>Insert File Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            value={linkDialog?.search || ''}
                            onChange={(event) =>
                                linkDialog && setLinkDialog({ ...linkDialog, search: event.target.value })
                            }
                            placeholder="Search files..."
                            className="border-border bg-background text-foreground"
                            autoFocus
                        />
                        <div className="file-ontology-scrollbar max-h-[360px] space-y-2 overflow-y-auto pr-1">
                            {filteredLinkTargets.length > 0 ? (
                                filteredLinkTargets.map((file) => (
                                    <button
                                        key={file.id}
                                        type="button"
                                        className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted"
                                        onClick={() => insertFileLink(file)}
                                    >
                                        <div className="font-medium text-foreground">{file.title}</div>
                                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                            {file.summary || file.id}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
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
