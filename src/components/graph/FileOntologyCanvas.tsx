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
    saveFileOntologyWorkflowMetadata,
    type FileOntologyEdge,
    type FileOntologyFile,
} from '../../lib/fileOntology';
import {
    buildOntologyWorkflow,
    type OntologyWorkflowMode,
    type OntologyWorkflowResult,
} from '../../lib/ontologyWorkflow';

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

interface WorkflowDraftState {
    mode: OntologyWorkflowMode;
    title: string;
    userGoal: string;
    researchNotes: string;
    paperMarkdown: string;
}

const MIN_SCALE = 0.08;
const MAX_SCALE = 4;
const TITLE_ONLY_SCALE = 0.26;
const MIN_NODE_WIDTH = 280;
const MIN_NODE_HEIGHT = 210;
const MAX_NODE_WIDTH = 1200;
const MAX_NODE_HEIGHT = 900;
const LAYOUT_COLUMN_GAP = 860;
const LAYOUT_ROW_GAP = 620;
const LAYOUT_ORIGIN_X = 160;
const LAYOUT_ORIGIN_Y = 160;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function optimizeFileOntologyLayout(files: FileOntologyFile[], edges: FileOntologyEdge[]) {
    const incomingCounts = new Map(files.map((file) => [file.id, 0]));
    const adjacency = new Map(files.map((file) => [file.id, [] as string[]]));

    edges.forEach((edge) => {
        if (!incomingCounts.has(edge.sourceFileId) || !incomingCounts.has(edge.targetFileId)) return;
        incomingCounts.set(edge.targetFileId, (incomingCounts.get(edge.targetFileId) ?? 0) + 1);
        adjacency.get(edge.sourceFileId)?.push(edge.targetFileId);
    });

    const rankById = new Map<string, number>();
    const queue = files.filter((file) => (incomingCounts.get(file.id) ?? 0) === 0).map((file) => file.id);
    if (queue.length === 0 && files[0]) queue.push(files[0].id);

    queue.forEach((fileId) => rankById.set(fileId, 0));

    const maxRelaxations = Math.max(1, files.length * files.length);
    for (let cursor = 0; cursor < queue.length && cursor < maxRelaxations; cursor += 1) {
        const fileId = queue[cursor];
        const nextRank = (rankById.get(fileId) ?? 0) + 1;
        adjacency.get(fileId)?.forEach((targetId) => {
            if ((rankById.get(targetId) ?? -1) < nextRank) {
                rankById.set(targetId, nextRank);
                queue.push(targetId);
            }
        });
    }

    files.forEach((file) => {
        if (!rankById.has(file.id)) rankById.set(file.id, 0);
    });

    const rowsByRank = new Map<number, FileOntologyFile[]>();
    files.forEach((file) => {
        const rank = rankById.get(file.id) ?? 0;
        rowsByRank.set(rank, [...(rowsByRank.get(rank) ?? []), file]);
    });

    const orderedRanks = Array.from(rowsByRank.keys()).sort((a, b) => a - b);
    const indexById = new Map(files.map((file, index) => [file.id, index]));

    return orderedRanks.flatMap((rank) => {
        const rankedFiles = [...(rowsByRank.get(rank) ?? [])].sort(
            (a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0),
        );

        return rankedFiles.map((file, row) => ({
            ...file,
            x: LAYOUT_ORIGIN_X + rank * LAYOUT_COLUMN_GAP,
            y: LAYOUT_ORIGIN_Y + row * LAYOUT_ROW_GAP,
        }));
    });
}

function isInteractiveCanvasTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest(
            'button, input, textarea, select, a, [role="button"], [data-no-canvas-pan="true"]',
        ),
    );
}

function isSelectedNodeScrollTarget(
    target: EventTarget | null,
    selectedFileId: string | null,
    maximizedFileId: string | null,
) {
    if (!(target instanceof HTMLElement)) return false;

    const scrollArea = target.closest<HTMLElement>('[data-file-node-scroll="true"]');
    const node = target.closest<HTMLElement>('[data-file-node-id]');
    const fileId = node?.dataset.fileNodeId;

    return Boolean(scrollArea && fileId && (fileId === selectedFileId || fileId === maximizedFileId));
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
    centered = false,
}: {
    content: string;
    files: FileOntologyFile[];
    onNavigate: (fileId: string) => void;
    onHoverLink: (file: FileOntologyFile | null, event?: ReactMouseEvent) => void;
    compact?: boolean;
    centered?: boolean;
}) {
    const lookup = useMemo(() => buildFileLookup(files), [files]);
    const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

    if (!content.trim()) {
        return <p className="text-sm italic text-muted-foreground">Empty markdown file</p>;
    }

    return (
        <div
            className={cn(
                'space-y-3 leading-6 text-left text-foreground',
                compact ? 'text-sm' : 'text-base',
                centered ? 'mx-auto w-full max-w-[72ch]' : null,
            )}
        >
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
            onPointerDown={(event) => event.stopPropagation()}
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

function artifactValue(content: Record<string, unknown>, key: string) {
    const value = content[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

export default function FileOntologyCanvas({ isEditable, currentUserLabel }: FileOntologyCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const filesRef = useRef<FileOntologyFile[]>([]);
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const dragPointerIdRef = useRef<number | null>(null);
    const dragCaptureTargetRef = useRef<Element | null>(null);
    const viewportRef = useRef<Viewport>({ x: 80, y: 40, scale: 0.92 });
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
    const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
    const [workflowDraft, setWorkflowDraft] = useState<WorkflowDraftState>({
        mode: 'auto',
        title: '',
        userGoal: '',
        researchNotes: '',
        paperMarkdown: '',
    });
    const [workflowResult, setWorkflowResult] = useState<OntologyWorkflowResult | null>(null);
    const [isWorkflowWriting, setIsWorkflowWriting] = useState(false);

    const granularityPreview = useMemo(() => {
        const content = workflowResult?.artifacts.find(
            (artifact) => artifact.artifactType === 'granularity_assessment',
        )?.content;

        if (!content) return null;

        return {
            decision: artifactValue(content, 'decision').replace(/_/g, ' '),
            rationale: artifactValue(content, 'file_node_policy'),
            depth: artifactValue(content, 'content_depth_target'),
        };
    }, [workflowResult]);

    const applySceneTransform = useCallback((nextViewport: Viewport) => {
        viewportRef.current = nextViewport;

        if (sceneRef.current) {
            sceneRef.current.style.transform = `translate(${nextViewport.x}px, ${nextViewport.y}px) scale(${nextViewport.scale})`;
        }
    }, []);

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
        applySceneTransform(viewport);
    }, [applySceneTransform, viewport]);

    useEffect(() => {
        if (!dragState) return;
        const activeCaptureTarget = dragCaptureTargetRef.current;

        const handlePointerMove = (event: PointerEvent) => {
            if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) {
                return;
            }

            if (event.buttons === 0) {
                finishDrag();
                return;
            }

            if (dragState.kind === 'pan') {
                applySceneTransform({
                    ...viewportRef.current,
                    x: dragState.originX + event.clientX - dragState.startClientX,
                    y: dragState.originY + event.clientY - dragState.startClientY,
                });
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

        const releasePointerCapture = () => {
            const captureTarget = dragCaptureTargetRef.current;
            const activePointerId = dragPointerIdRef.current;

            if (
                captureTarget instanceof Element &&
                activePointerId !== null &&
                'releasePointerCapture' in captureTarget
            ) {
                try {
                    captureTarget.releasePointerCapture(activePointerId);
                } catch {
                    // Pointer may already be released.
                }
            }

            dragCaptureTargetRef.current = null;
            dragPointerIdRef.current = null;
        };

        const finishDrag = () => {
            if ((dragState.kind === 'move' || dragState.kind === 'resize') && isEditable) {
                const file = filesRef.current.find((candidate) => candidate.id === dragState.fileId);
                if (file) {
                    saveFileOntologyFilePosition(file).catch((error) => {
                        const message = error instanceof Error ? error.message : 'Failed to save node layout';
                        setStatusMessage(`Layout save failed: ${message}`);
                    });
                }
            }

            if (dragState.kind === 'pan') {
                setViewport(viewportRef.current);
            }

            releasePointerCapture();
            setDragState(null);
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) {
                return;
            }

            finishDrag();
        };

        const handlePointerCancel = (event: PointerEvent) => {
            if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) {
                return;
            }

            finishDrag();
        };

        const handleLostPointerCapture = ((event: PointerEvent) => {
            if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) {
                return;
            }

            finishDrag();
        }) as EventListener;

        const handleWindowBlur = () => {
            finishDrag();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                finishDrag();
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);
        window.addEventListener('blur', handleWindowBlur);
        activeCaptureTarget?.addEventListener('lostpointercapture', handleLostPointerCapture);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
            window.removeEventListener('blur', handleWindowBlur);
            activeCaptureTarget?.removeEventListener('lostpointercapture', handleLostPointerCapture);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [applySceneTransform, dragState, isEditable, viewport.scale]);

    const focusFile = useCallback((fileId: string) => {
        const file = filesRef.current.find((candidate) => candidate.id === fileId);
        if (!file) return;

        setSelectedFileId(fileId);
        setConnectFromFileId(null);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setViewport((current) => {
            const nextViewport = {
                ...current,
                x: rect.width * 0.42 - (file.x + file.width / 2) * current.scale,
                y: rect.height * 0.5 - (file.y + file.height / 2) * current.scale,
            };

            applySceneTransform(nextViewport);
            return nextViewport;
        });
    }, [applySceneTransform]);

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
        if (
            isInteractiveCanvasTarget(event.target) ||
            isSelectedNodeScrollTarget(event.target, selectedFileId, maximizedFileId)
        ) {
            event.stopPropagation();
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
        setViewport((current) => {
            const nextViewport = {
                ...current,
                scale: clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE),
            };

            applySceneTransform(nextViewport);
            return nextViewport;
        });
    };

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        if (isInteractiveCanvasTarget(event.target)) return;

        dragPointerIdRef.current = event.pointerId;
        dragCaptureTargetRef.current = event.currentTarget;

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Some browsers may fail to capture when the pointer is already transitioning.
        }

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

        dragPointerIdRef.current = event.pointerId;
        dragCaptureTargetRef.current = event.currentTarget;

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer capture is best-effort for drag stability.
        }

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
        dragPointerIdRef.current = event.pointerId;
        dragCaptureTargetRef.current = event.currentTarget;

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer capture is best-effort for drag stability.
        }

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

    const updateWorkflowDraft = (patch: Partial<WorkflowDraftState>) => {
        setWorkflowDraft((current) => ({ ...current, ...patch }));
        setWorkflowResult(null);
    };

    const handleBuildWorkflowPreview = () => {
        const result = buildOntologyWorkflow({
            ...workflowDraft,
            existingFiles: files,
            existingEdges: edges,
        });

        setWorkflowResult(result);
        setStatusMessage(
            `Workflow preview ready: ${result.files.length} files, ${result.edges.filter((draft) => draft.action === 'create').length} new edges.`,
        );
    };

    const handleWriteWorkflowResult = async () => {
        if (!isEditable || !workflowResult) return;

        setIsWorkflowWriting(true);
        setStatusMessage('Writing ontology workflow result...');

        try {
            const savedFiles: FileOntologyFile[] = [];
            for (const draft of workflowResult.files) {
                savedFiles.push(await saveFileOntologyFile(draft.file));
            }

            const savedEdges: FileOntologyEdge[] = [];
            for (const draft of workflowResult.edges) {
                if (draft.action !== 'create') continue;
                savedEdges.push(await saveFileOntologyEdge(draft.edge));
            }

            const metadataResult = await saveFileOntologyWorkflowMetadata({
                run: {
                    id: workflowResult.runId,
                    intent: workflowResult.intent,
                    sourceType: workflowResult.sourceType,
                    title: workflowResult.title,
                    userGoal: workflowDraft.userGoal,
                    status: 'published',
                },
                artifacts: workflowResult.artifacts.map((artifact) => ({
                    id: `${workflowResult.runId}-${normalizeFileOntologyLookup(artifact.artifactType)}`,
                    runId: workflowResult.runId,
                    artifactType: artifact.artifactType,
                    contentJson: artifact.content,
                })),
                linkMentions: workflowResult.highlights.map((highlight) => ({
                    id: `${workflowResult.runId}-${normalizeFileOntologyLookup(highlight.sourceFileId)}-${normalizeFileOntologyLookup(highlight.targetFileId)}-${normalizeFileOntologyLookup(highlight.anchorText)}`,
                    sourceFileId: highlight.sourceFileId,
                    targetFileId: highlight.targetFileId,
                    anchorText: highlight.anchorText,
                    relation: highlight.relation,
                    contextExcerpt: highlight.context,
                    generationRunId: workflowResult.runId,
                })),
            });

            setFiles((current) => {
                const next = new Map(current.map((file) => [file.id, file]));
                savedFiles.forEach((file) => next.set(file.id, file));
                return Array.from(next.values());
            });
            setDrafts((current) => ({
                ...current,
                ...Object.fromEntries(savedFiles.map((file) => [file.id, draftFromFile(file)])),
            }));
            setEdges((current) => {
                const next = [...current];
                savedEdges.forEach((edge) => {
                    const exists = next.some(
                        (candidate) =>
                            candidate.sourceFileId === edge.sourceFileId &&
                            candidate.targetFileId === edge.targetFileId &&
                            candidate.label === edge.label,
                    );
                    if (!exists) next.push(edge);
                });
                return next;
            });

            const primaryFile = savedFiles[0] ?? null;
            if (primaryFile) {
                setSelectedFileId(primaryFile.id);
                focusFile(primaryFile.id);
            }

            setWorkflowResult(null);
            setIsWorkflowDialogOpen(false);
            setStatusMessage(
                metadataResult.warning
                    ? `Workflow files saved. ${metadataResult.warning}`
                    : 'Ontology workflow files, edges, and highlight metadata saved.',
            );
        } catch (error) {
            reportWriteError('Workflow write', error);
        } finally {
            setIsWorkflowWriting(false);
        }
    };

    const handleOptimizeLayout = async () => {
        const optimizedFiles = optimizeFileOntologyLayout(filesRef.current, edges);
        setFiles(optimizedFiles);
        setSelectedFileId(optimizedFiles[0]?.id ?? null);
        setViewport({ x: 80, y: 40, scale: 0.72 });
        setStatusMessage('Optimized graph layout with wider file-node spacing.');

        if (!isEditable) return;

        try {
            await Promise.all(optimizedFiles.map((file) => saveFileOntologyFilePosition(file)));
            setStatusMessage('Optimized graph layout and saved node positions.');
        } catch (error) {
            reportWriteError('Layout optimize', error);
        }
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
        setViewport((current) => {
            const nextViewport = {
                ...current,
                scale: clamp(current.scale * factor, MIN_SCALE, MAX_SCALE),
            };

            applySceneTransform(nextViewport);
            return nextViewport;
        });
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

    const renderNodePreview = (file: FileOntologyFile, expanded = false, scrollable = false) => {
        const adaptiveFontSize = expanded
            ? 16
            : clamp(Math.round(file.width / 34), 12, 17);

        return (
            <div
                className={cn(
                    'min-h-0 flex-1 p-4',
                    scrollable
                        ? 'file-ontology-scrollbar overflow-y-auto overflow-x-hidden'
                        : 'overflow-hidden',
                )}
                data-file-node-scroll={scrollable ? 'true' : undefined}
                style={{ fontSize: adaptiveFontSize, lineHeight: 1.55 }}
            >
                <MarkdownPreview
                    content={file.content}
                    files={files}
                    onNavigate={focusFile}
                    onHoverLink={handleHoverLink}
                    compact={!expanded}
                    centered
                />
            </div>
        );
    };

    const renderFileNode = (file: FileOntologyFile) => {
        const isSelected = selectedFileId === file.id;
        const isConnectSource = connectFromFileId === file.id;
        const isEditing = editingFileId === file.id;
        const isTitleOnly = viewport.scale < TITLE_ONLY_SCALE;

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
                data-file-node-id={file.id}
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
                    {!isTitleOnly ? (
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
                                onClick={() => {
                                    setSelectedFileId(file.id);
                                    setMaximizedFileId(file.id);
                                }}
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
                    ) : null}
                </div>

                {isTitleOnly ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-center">
                        <div className="max-w-full truncate text-lg font-semibold text-foreground">{file.title}</div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 p-0">
                        {isEditing ? (
                            <div
                                className="file-ontology-scrollbar flex h-full flex-col overflow-auto p-3"
                                data-file-node-scroll="true"
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                {renderNodeEditor(file)}
                            </div>
                        ) : (
                            renderNodePreview(file, false, isSelected)
                        )}
                    </div>
                )}

                {isEditable && !isTitleOnly ? (
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
            className="relative h-[calc(100dvh-56px)] w-full overflow-hidden overscroll-none touch-none bg-background text-foreground"
            onWheelCapture={handleWheel}
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
                className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
                onPointerDown={handleCanvasPointerDown}
            >
                <div
                    ref={sceneRef}
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
                                        <div
                                            className="flex h-full items-center justify-center gap-1"
                                            data-no-canvas-pan="true"
                                            onPointerDown={(event) => event.stopPropagation()}
                                        >
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
                    <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
                        onClick={() => {
                            setWorkflowResult(null);
                            setIsWorkflowDialogOpen(true);
                        }}
                        disabled={!isEditable}
                        title={isEditable ? 'Run ontology workflow' : 'Admin access required to edit'}
                    >
                        <GitBranch className="h-4 w-4" />
                        Workflow
                    </button>
                    <ToolbarButton onClick={() => zoomBy(1.1)} title="Zoom in">
                        <ZoomIn className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => zoomBy(0.9)} title="Zoom out">
                        <ZoomOut className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => void handleOptimizeLayout()} title="Optimize layout spacing">
                        <GitBranch className="h-4 w-4" />
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
                <div
                    className="absolute inset-4 z-[80] flex flex-col overflow-hidden rounded-lg border border-foreground bg-background text-foreground shadow-none"
                    data-file-node-id={maximizedFile.id}
                    onPointerDown={(event) => event.stopPropagation()}
                >
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
                    <div
                        className="file-ontology-scrollbar min-h-0 flex-1 overflow-auto p-5"
                        data-file-node-scroll="true"
                    >
                        {editingFileId === maximizedFile.id
                            ? renderNodeEditor(maximizedFile, true)
                            : renderNodePreview(maximizedFile, true, true)}
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

            <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden border-border bg-background text-foreground">
                    <DialogHeader>
                        <DialogTitle>Ontology Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="grid min-h-0 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                        <div className="file-ontology-scrollbar max-h-[74vh] space-y-4 overflow-y-auto pr-1">
                            <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Mode
                                <select
                                    value={workflowDraft.mode}
                                    onChange={(event) =>
                                        updateWorkflowDraft({ mode: event.target.value as OntologyWorkflowMode })
                                    }
                                    className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="concept">Concept file</option>
                                    <option value="paper">Paper integration</option>
                                </select>
                            </label>

                            <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Title
                                <Input
                                    value={workflowDraft.title}
                                    onChange={(event) => updateWorkflowDraft({ title: event.target.value })}
                                    placeholder="Schrodinger Equation"
                                    className="border-border bg-background text-foreground"
                                />
                            </label>

                            <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Goal
                                <textarea
                                    value={workflowDraft.userGoal}
                                    onChange={(event) => updateWorkflowDraft({ userGoal: event.target.value })}
                                    className="file-ontology-scrollbar min-h-[92px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                                    placeholder="Create or integrate this node with prerequisite and neighboring concepts."
                                />
                            </label>

                            <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Research notes
                                <textarea
                                    value={workflowDraft.researchNotes}
                                    onChange={(event) => updateWorkflowDraft({ researchNotes: event.target.value })}
                                    className="file-ontology-scrollbar min-h-[120px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                                    placeholder="Source cards, search findings, DOI/arXiv notes, or extracted concept relations."
                                />
                            </label>

                            <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Paper markdown
                                <textarea
                                    value={workflowDraft.paperMarkdown}
                                    onChange={(event) => updateWorkflowDraft({ paperMarkdown: event.target.value })}
                                    className="file-ontology-scrollbar min-h-[180px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none focus:border-foreground"
                                    placeholder="# Paper Title&#10;&#10;Abstract...&#10;&#10;## 1. Introduction..."
                                />
                            </label>

                            <button
                                type="button"
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-foreground bg-foreground px-3 text-sm font-medium text-background transition hover:opacity-80"
                                onClick={handleBuildWorkflowPreview}
                            >
                                <GitBranch className="h-4 w-4" />
                                Build Preview
                            </button>
                        </div>

                        <div className="file-ontology-scrollbar max-h-[74vh] min-h-[480px] overflow-y-auto rounded-lg border border-border bg-background p-4">
                            {workflowResult ? (
                                <div className="space-y-5">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{workflowResult.title}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {workflowResult.intent.replace(/_/g, ' ')} · {workflowResult.summary}
                                        </div>
                                    </div>

                                    {workflowResult.warnings.length > 0 ? (
                                        <div className="rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
                                            {workflowResult.warnings.join(' ')}
                                        </div>
                                    ) : null}

                                    {granularityPreview ? (
                                        <div className="rounded-md border border-border p-3">
                                            <div className="text-xs uppercase text-muted-foreground">Granularity</div>
                                            <div className="mt-1 text-sm font-medium text-foreground">
                                                {granularityPreview.decision}
                                            </div>
                                            <div className="mt-2 text-xs leading-5 text-muted-foreground">
                                                {granularityPreview.rationale}
                                            </div>
                                            <div className="mt-2 text-xs leading-5 text-muted-foreground">
                                                {granularityPreview.depth}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-md border border-border p-3">
                                            <div className="text-xs uppercase text-muted-foreground">Files</div>
                                            <div className="mt-1 text-2xl font-semibold text-foreground">
                                                {workflowResult.files.length}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-border p-3">
                                            <div className="text-xs uppercase text-muted-foreground">New Edges</div>
                                            <div className="mt-1 text-2xl font-semibold text-foreground">
                                                {workflowResult.edges.filter((draft) => draft.action === 'create').length}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-border p-3">
                                            <div className="text-xs uppercase text-muted-foreground">Highlights</div>
                                            <div className="mt-1 text-2xl font-semibold text-foreground">
                                                {workflowResult.highlights.length}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold uppercase text-muted-foreground">File Drafts</div>
                                        {workflowResult.files.map((draft) => (
                                            <div key={draft.file.id} className="rounded-md border border-border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-foreground">
                                                            {draft.file.title}
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {draft.file.id}
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                                        {draft.kind} · {draft.action}
                                                    </span>
                                                </div>
                                                <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                    {draft.file.summary}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold uppercase text-muted-foreground">Edges</div>
                                        <div className="space-y-1">
                                            {workflowResult.edges.map((draft) => (
                                                <div
                                                    key={draft.edge.id}
                                                    className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                                                >
                                                    <span className="text-foreground">{draft.edge.sourceFileId}</span>
                                                    {' -> '}
                                                    <span className="text-foreground">{draft.edge.targetFileId}</span>
                                                    {' · '}
                                                    {draft.edge.label}
                                                    {draft.action === 'skip_existing' ? ' · existing' : ''}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold uppercase text-muted-foreground">Highlight Plan</div>
                                        <div className="space-y-1">
                                            {workflowResult.highlights.map((highlight) => (
                                                <div
                                                    key={`${highlight.sourceFileId}-${highlight.targetFileId}-${highlight.anchorText}`}
                                                    className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                                                >
                                                    <span className="text-foreground">{highlight.anchorText}</span>
                                                    {' -> '}
                                                    {highlight.targetFileId}
                                                    {' · '}
                                                    {highlight.relation}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                                        <button
                                            type="button"
                                            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                                            onClick={() => setWorkflowResult(null)}
                                            disabled={isWorkflowWriting}
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-foreground bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-40"
                                            onClick={() => void handleWriteWorkflowResult()}
                                            disabled={isWorkflowWriting}
                                        >
                                            {isWorkflowWriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Write to Graph
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[420px] items-center justify-center rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    No workflow preview yet.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
