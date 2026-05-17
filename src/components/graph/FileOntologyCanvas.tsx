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
    createFileOntologyId,
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
          isSummoned: boolean;
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

interface SummonedFilePosition {
    sourceFileId: string;
    x: number;
    y: number;
    anchorX: number;
    anchorY: number;
}

interface FileOntologyLayer {
    id: string;
    title: string;
    fileIds: string[];
    accentColor: string;
    accentBackground: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

type ViewportRenderMode = 'content' | 'title' | 'layer';

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
const LAYER_ONLY_SCALE = 0.16;
const MIN_NODE_WIDTH = 280;
const MIN_NODE_HEIGHT = 210;
const MAX_NODE_WIDTH = 1200;
const MAX_NODE_HEIGHT = 900;
const LAYOUT_ORIGIN_X = 160;
const LAYOUT_ORIGIN_Y = 160;
const GROUP_NODE_COLUMN_GAP = 1180;
const GROUP_NODE_ROW_GAP = 760;
const GROUP_PADDING_X = 260;
const GROUP_PADDING_Y = 210;
const GROUP_GAP_X = 720;
const LAYER_BOUNDARY_GAP = 120;
const NODE_COLLISION_PADDING = 132;
const EDGE_LABEL_MIN_CENTER_DISTANCE = 980;
const MAX_SPLIT_FILE_PANES = 6;
const SUMMON_RETURN_DISTANCE = 420;
const VIEWPORT_STATE_COMMIT_DELAY_MS = 90;
const FILE_TITLE_ONLY_SCREEN_FONT_SIZE = 10.5;

const FILE_ONTOLOGY_LAYER_TITLES = new Map<string, string>([
    ['measurement-foundations', 'Measurement Foundations'],
    ['one-dimensional-kinematics', 'One-Dimensional Kinematics'],
]);
const FILE_ONTOLOGY_LAYER_ACCENTS = [
    {
        color: 'hsla(205, 78%, 36%, 0.78)',
        background: 'hsla(205, 78%, 44%, 0.065)',
    },
    {
        color: 'hsla(28, 78%, 39%, 0.78)',
        background: 'hsla(28, 78%, 48%, 0.065)',
    },
    {
        color: 'hsla(146, 46%, 34%, 0.78)',
        background: 'hsla(146, 46%, 42%, 0.065)',
    },
    {
        color: 'hsla(354, 62%, 42%, 0.78)',
        background: 'hsla(354, 62%, 50%, 0.055)',
    },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function getViewportRenderMode(scale: number): ViewportRenderMode {
    if (scale < LAYER_ONLY_SCALE) return 'layer';
    if (scale < TITLE_ONLY_SCALE) return 'title';
    return 'content';
}

function scaleViewportAroundScreenPoint(
    current: Viewport,
    nextScale: number,
    anchorX: number,
    anchorY: number,
): Viewport {
    const worldX = (anchorX - current.x) / current.scale;
    const worldY = (anchorY - current.y) / current.scale;

    return {
        ...current,
        x: anchorX - worldX * nextScale,
        y: anchorY - worldY * nextScale,
        scale: nextScale,
    };
}

function getFileOntologyLayerId(file: FileOntologyFile) {
    const identityLookup = normalizeFileOntologyLookup(`${file.id} ${file.title}`);
    const lookup = normalizeFileOntologyLookup(`${file.id} ${file.title} ${file.summary}`);

    if (
        identityLookup.includes('ch2') ||
        identityLookup.includes('chapter 2') ||
        identityLookup.includes('motion') ||
        identityLookup.includes('kinematic') ||
        identityLookup.includes('position') ||
        identityLookup.includes('velocity') ||
        identityLookup.includes('acceleration') ||
        identityLookup.includes('free fall')
    ) {
        return 'one-dimensional-kinematics';
    }

    if (
        identityLookup.includes('ch1') ||
        identityLookup.includes('chapter 1') ||
        identityLookup.includes('measurement')
    ) {
        return 'measurement-foundations';
    }

    if (
        lookup.includes('measurement') ||
        lookup.includes('unit') ||
        lookup.includes('dimension') ||
        lookup.includes('standard')
    ) {
        return 'measurement-foundations';
    }

    if (
        lookup.includes('ch2') ||
        lookup.includes('chapter 2') ||
        lookup.includes('motion') ||
        lookup.includes('kinematic') ||
        lookup.includes('position') ||
        lookup.includes('velocity') ||
        lookup.includes('acceleration') ||
        lookup.includes('free fall')
    ) {
        return 'one-dimensional-kinematics';
    }

    return lookup.split('-').slice(0, 2).join('-') || 'general-ontology';
}

function getFileOntologyLayerTitle(layerId: string, files: FileOntologyFile[]) {
    const knownTitle = FILE_ONTOLOGY_LAYER_TITLES.get(layerId);
    if (knownTitle) return knownTitle;

    const firstTitle = files[0]?.title.trim();
    if (!firstTitle) return 'Ontology Files';

    return firstTitle
        .split(/\s+/)
        .slice(0, 3)
        .join(' ');
}

function getFileOntologyLayerAccent(layerId: string) {
    const knownIndex = Array.from(FILE_ONTOLOGY_LAYER_TITLES.keys()).indexOf(layerId);
    const fallbackIndex = Array.from(layerId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const paletteIndex = knownIndex >= 0 ? knownIndex : fallbackIndex;

    return FILE_ONTOLOGY_LAYER_ACCENTS[paletteIndex % FILE_ONTOLOGY_LAYER_ACCENTS.length];
}

function groupFilesByOntologyLayer(files: FileOntologyFile[]) {
    const groups = new Map<string, FileOntologyFile[]>();

    files.forEach((file) => {
        const layerId = getFileOntologyLayerId(file);
        groups.set(layerId, [...(groups.get(layerId) ?? []), file]);
    });

    return groups;
}

function calculateLayerBounds(layerId: string, files: FileOntologyFile[]): FileOntologyLayer {
    const minX = Math.min(...files.map((file) => file.x));
    const minY = Math.min(...files.map((file) => file.y));
    const maxX = Math.max(...files.map((file) => file.x + file.width));
    const maxY = Math.max(...files.map((file) => file.y + file.height));
    const accent = getFileOntologyLayerAccent(layerId);

    return {
        id: layerId,
        title: getFileOntologyLayerTitle(layerId, files),
        fileIds: files.map((file) => file.id),
        accentColor: accent.color,
        accentBackground: accent.background,
        x: minX - GROUP_PADDING_X,
        y: minY - GROUP_PADDING_Y,
        width: maxX - minX + GROUP_PADDING_X * 2,
        height: maxY - minY + GROUP_PADDING_Y * 2,
    };
}

function calculateFileOntologyLayers(files: FileOntologyFile[]) {
    return Array.from(groupFilesByOntologyLayer(files).entries())
        .filter(([, groupFiles]) => groupFiles.length > 0)
        .map(([layerId, groupFiles]) => calculateLayerBounds(layerId, groupFiles))
        .sort((a, b) => a.x - b.x || a.y - b.y);
}

function fileOntologyEdgesNeedClearance(files: FileOntologyFile[], edges: FileOntologyEdge[]) {
    const fileById = new Map(files.map((file) => [file.id, file]));

    return edges.some((edge) => {
        const source = fileById.get(edge.sourceFileId);
        const target = fileById.get(edge.targetFileId);
        if (!source || !target) return false;

        const sourceX = source.x + source.width / 2;
        const sourceY = source.y + source.height / 2;
        const targetX = target.x + target.width / 2;
        const targetY = target.y + target.height / 2;

        return Math.hypot(targetX - sourceX, targetY - sourceY) < EDGE_LABEL_MIN_CENTER_DISTANCE;
    });
}

function fileOntologyLayoutNeedsNormalization(files: FileOntologyFile[], edges: FileOntologyEdge[]) {
    const layers = calculateFileOntologyLayers(files);
    const layerCollision = layers.some((layer, layerIndex) =>
        layers
            .slice(layerIndex + 1)
            .some((otherLayer) => rectsOverlap(layer, otherLayer, LAYER_BOUNDARY_GAP)),
    );
    if (layerCollision) return true;

    const fileCollision = files.some((file, fileIndex) =>
        files
            .slice(fileIndex + 1)
            .some((otherFile) => rectsOverlap(fileRect(file), fileRect(otherFile), NODE_COLLISION_PADDING / 2)),
    );
    if (fileCollision) return true;

    return fileOntologyEdgesNeedClearance(files, edges);
}

function calculateFileRanks(files: FileOntologyFile[], edges: FileOntologyEdge[]) {
    const fileIds = new Set(files.map((file) => file.id));
    const incomingCounts = new Map(files.map((file) => [file.id, 0]));
    const adjacency = new Map(files.map((file) => [file.id, [] as string[]]));

    edges.forEach((edge) => {
        if (!fileIds.has(edge.sourceFileId) || !fileIds.has(edge.targetFileId)) return;
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

    return rankById;
}

function optimizeFileOntologyLayout(files: FileOntologyFile[], edges: FileOntologyEdge[]) {
    const indexById = new Map(files.map((file, index) => [file.id, index]));
    const groups = Array.from(groupFilesByOntologyLayer(files).entries())
        .map(([, groupFiles]) => ({ files: groupFiles }))
        .sort(
            (a, b) =>
                Math.min(...a.files.map((file) => indexById.get(file.id) ?? 0)) -
                Math.min(...b.files.map((file) => indexById.get(file.id) ?? 0)),
        );

    let groupCursorX = LAYOUT_ORIGIN_X;

    return groups.flatMap((group) => {
        const rankById = calculateFileRanks(group.files, edges);
        const rowsByRank = new Map<number, FileOntologyFile[]>();

        group.files.forEach((file) => {
            const rank = rankById.get(file.id) ?? 0;
            rowsByRank.set(rank, [...(rowsByRank.get(rank) ?? []), file]);
        });

        const orderedRanks = Array.from(rowsByRank.keys()).sort((a, b) => a - b);
        const groupWidth =
            GROUP_PADDING_X * 2 +
            (orderedRanks.length - 1) * GROUP_NODE_COLUMN_GAP +
            Math.max(...group.files.map((file) => file.width));
        const positionedGroupFiles = orderedRanks.flatMap((rank) => {
            const rankedFiles = [...(rowsByRank.get(rank) ?? [])].sort(
                (a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0),
            );

            return rankedFiles.map((file, row) => ({
                ...file,
                x: groupCursorX + GROUP_PADDING_X + rank * GROUP_NODE_COLUMN_GAP,
                y: LAYOUT_ORIGIN_Y + GROUP_PADDING_Y + row * GROUP_NODE_ROW_GAP,
            }));
        });

        groupCursorX += groupWidth + GROUP_GAP_X;
        return positionedGroupFiles;
    });
}

function fileRect(file: FileOntologyFile, x = file.x, y = file.y) {
    return {
        x,
        y,
        width: file.width,
        height: file.height,
    };
}

function rectsOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
    padding = 0,
) {
    return (
        a.x < b.x + b.width + padding &&
        a.x + a.width + padding > b.x &&
        a.y < b.y + b.height + padding &&
        a.y + a.height + padding > b.y
    );
}

function collidesWithFiles(
    target: FileOntologyFile,
    x: number,
    y: number,
    files: FileOntologyFile[],
    padding = NODE_COLLISION_PADDING,
) {
    const candidateRect = fileRect(target, x, y);
    return files
        .filter((file) => file.id !== target.id)
        .some((file) => rectsOverlap(candidateRect, fileRect(file), padding));
}

function findOpenSpotNearFile(source: FileOntologyFile, target: FileOntologyFile, files: FileOntologyFile[]) {
    const sourceCenterX = source.x + source.width / 2;
    const sourceCenterY = source.y + source.height / 2;
    const angles = [0, 0.35, -0.35, 0.72, -0.72, 1.35, -1.35, Math.PI, 2.35, -2.35];

    for (let ring = 0; ring < 8; ring += 1) {
        const radiusX = source.width / 2 + target.width / 2 + NODE_COLLISION_PADDING + ring * 260;
        const radiusY = source.height / 2 + target.height / 2 + NODE_COLLISION_PADDING + ring * 220;

        for (const angle of angles) {
            const x = Math.round(sourceCenterX + Math.cos(angle) * radiusX - target.width / 2);
            const y = Math.round(sourceCenterY + Math.sin(angle) * radiusY - target.height / 2);

            if (!collidesWithFiles(target, x, y, files)) return { x, y };
        }
    }

    return {
        x: Math.round(source.x + source.width + NODE_COLLISION_PADDING * 2),
        y: Math.round(source.y),
    };
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

function isScrollbarGutterPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    if (element.scrollHeight <= element.clientHeight) return false;

    const rect = element.getBoundingClientRect();
    return event.clientX >= rect.right - 16;
}

function clearGraphTextSelection() {
    window.getSelection()?.removeAllRanges();
}

function compactWhitespace(value: string) {
    return value.trim().replace(/\s+/g, ' ');
}

function titleFromHighlight(anchorText: string) {
    const compact = compactWhitespace(anchorText);
    if (compact.length <= 88) return compact;
    return `${compact.slice(0, 85).trimEnd()}...`;
}

function buildHighlightExpansionContent(title: string, sourceFile: FileOntologyFile, anchorText: string) {
    return [
        `# ${title}`,
        '',
        '## Abstract',
        '',
        `This file node exists to make the highlighted idea from [[${sourceFile.id}|${sourceFile.title}]] independently learnable. The conclusion should be stated first: this node explains the hidden step, definition, calculation, or submodel that the parent file relies on at the highlighted passage.`,
        '',
        '## Source Highlight',
        '',
        `> ${anchorText}`,
        '',
        '## Core Claim',
        '',
        'State the result this node lets the reader understand. If the highlighted passage contains an equation, this section should say what the equation computes, under which assumptions, and why it belongs at this point in the parent argument.',
        '',
        '## Definitions and Symbols',
        '',
        'Define only the quantities needed to understand the highlighted claim. Keep broader ontology policy, generation notes, and granularity reasoning out of the learner-facing body.',
        '',
        '## Logical Development',
        '',
        'Reconstruct the smallest reasoning path from definitions to the highlighted result. Use file links for reusable background concepts instead of turning this section into a prerequisite checklist.',
        '',
        '## Equations and Conditions',
        '',
        'Add equations with symbol meanings, assumptions, sign conventions, and validity conditions. Omit equations that do not directly support the highlighted claim.',
        '',
        '## Scope and Links',
        '',
        `- Parent highlight: [[${sourceFile.id}|${sourceFile.title}]]`,
        '- Add graph edges from this file to the reusable concept files that justify the calculation or definition.',
    ].join('\n');
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
    onActivateLink: (targetFileId: string) => void,
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
                        if (linkedFile) onActivateLink(linkedFile.id);
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
    sourceFileId,
    files,
    onActivateLink,
    onHoverLink,
    compact = false,
    centered = false,
}: {
    content: string;
    sourceFileId: string;
    files: FileOntologyFile[];
    onActivateLink: (sourceFileId: string, targetFileId: string) => void;
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
                'text-left text-foreground',
                compact ? 'space-y-2 text-[12.5px] leading-[1.48]' : 'space-y-3 text-[13.5px] leading-[1.62]',
                centered ? 'mx-auto w-full max-w-[68ch]' : null,
            )}
        >
            {blocks.map((block, index) => {
                const key = `${block.type}-${index}`;

                if (block.type === 'heading') {
                    const headingClass =
                        block.level === 1
                            ? compact
                                ? 'text-[1.14em]'
                                : 'text-[1.42em]'
                            : block.level === 2
                              ? compact
                                  ? 'text-[1.02em]'
                                  : 'text-[1.18em]'
                              : compact
                                ? 'text-[1em]'
                                : 'text-[1.08em]';

                    return (
                        <div
                            key={key}
                            className={cn('font-semibold tracking-tight text-foreground', headingClass)}
                        >
                            {renderInlineMarkdown(
                                block.text,
                                lookup,
                                (targetFileId) => onActivateLink(sourceFileId, targetFileId),
                                onHoverLink,
                            )}
                        </div>
                    );
                }

                if (block.type === 'list') {
                    return (
                        <ul key={key} className="list-disc space-y-1 pl-5">
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-${itemIndex}`}>
                                    {renderInlineMarkdown(
                                        item,
                                        lookup,
                                        (targetFileId) => onActivateLink(sourceFileId, targetFileId),
                                        onHoverLink,
                                    )}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'quote') {
                    return (
                        <blockquote key={key} className="border-l-2 border-border pl-3 text-muted-foreground">
                            {renderInlineMarkdown(
                                block.text,
                                lookup,
                                (targetFileId) => onActivateLink(sourceFileId, targetFileId),
                                onHoverLink,
                            )}
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
                        {renderInlineMarkdown(
                            block.text,
                            lookup,
                            (targetFileId) => onActivateLink(sourceFileId, targetFileId),
                            onHoverLink,
                        )}
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

function maximizedPaneGridClass(paneCount: number) {
    if (paneCount <= 1) return 'grid-cols-1';
    if (paneCount === 2) return 'grid-cols-1 xl:grid-cols-2';
    if (paneCount <= 4) return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3';
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
    const displayFilesRef = useRef<FileOntologyFile[]>([]);
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const dragPointerIdRef = useRef<number | null>(null);
    const dragCaptureTargetRef = useRef<Element | null>(null);
    const viewportRef = useRef<Viewport>({ x: 80, y: 40, scale: 0.92 });
    const pendingViewportRef = useRef<Viewport | null>(null);
    const transformFrameRef = useRef<number | null>(null);
    const viewportCommitTimeoutRef = useRef<number | null>(null);
    const viewportRenderModeRef = useRef<ViewportRenderMode>(getViewportRenderMode(viewportRef.current.scale));
    const summonedFilePositionsRef = useRef<Record<string, SummonedFilePosition>>({});
    const [files, setFiles] = useState<FileOntologyFile[]>([]);
    const [edges, setEdges] = useState<FileOntologyEdge[]>([]);
    const [drafts, setDrafts] = useState<Record<string, FileDraft>>({});
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [maximizedFileId, setMaximizedFileId] = useState<string | null>(null);
    const [splitFileIds, setSplitFileIds] = useState<string[]>([]);
    const [summonedFilePositions, setSummonedFilePositions] = useState<Record<string, SummonedFilePosition>>({});
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

    const writeSceneTransform = useCallback((nextViewport: Viewport) => {
        if (!sceneRef.current) return;

        sceneRef.current.style.transform = `translate3d(${nextViewport.x}px, ${nextViewport.y}px, 0) scale(${nextViewport.scale})`;
    }, []);

    const applySceneTransform = useCallback(
        (nextViewport: Viewport, immediate = false) => {
            viewportRef.current = nextViewport;
            pendingViewportRef.current = nextViewport;

            if (immediate) {
                if (transformFrameRef.current !== null) {
                    window.cancelAnimationFrame(transformFrameRef.current);
                    transformFrameRef.current = null;
                }
                writeSceneTransform(nextViewport);
                pendingViewportRef.current = null;
                return;
            }

            if (transformFrameRef.current !== null) return;

            transformFrameRef.current = window.requestAnimationFrame(() => {
                transformFrameRef.current = null;
                const pendingViewport = pendingViewportRef.current;
                if (!pendingViewport) return;

                writeSceneTransform(pendingViewport);
                pendingViewportRef.current = null;
            });
        },
        [writeSceneTransform],
    );

    const scheduleViewportStateCommit = useCallback((nextViewport: Viewport, sync = false) => {
        const nextMode = getViewportRenderMode(nextViewport.scale);
        const modeChanged = nextMode !== viewportRenderModeRef.current;

        if (viewportCommitTimeoutRef.current !== null) {
            window.clearTimeout(viewportCommitTimeoutRef.current);
            viewportCommitTimeoutRef.current = null;
        }

        if (sync || modeChanged) {
            viewportRenderModeRef.current = nextMode;
            setViewport(nextViewport);
            return;
        }

        viewportCommitTimeoutRef.current = window.setTimeout(() => {
            viewportCommitTimeoutRef.current = null;
            const latestViewport = viewportRef.current;
            viewportRenderModeRef.current = getViewportRenderMode(latestViewport.scale);

            setViewport((current) =>
                current.x === latestViewport.x &&
                current.y === latestViewport.y &&
                current.scale === latestViewport.scale
                    ? current
                    : latestViewport,
            );
        }, VIEWPORT_STATE_COMMIT_DELAY_MS);
    }, []);

    const displayFiles = useMemo(
        () =>
            files.map((file) => {
                const summoned = summonedFilePositions[file.id];
                return summoned
                    ? {
                          ...file,
                          x: summoned.x,
                          y: summoned.y,
                      }
                    : file;
            }),
        [files, summonedFilePositions],
    );

    const fileById = useMemo(() => {
        const map = new Map<string, FileOntologyFile>();
        displayFiles.forEach((file) => map.set(file.id, file));
        return map;
    }, [displayFiles]);

    const fileLayers = useMemo(() => calculateFileOntologyLayers(displayFiles), [displayFiles]);
    const layerByFileId = useMemo(() => {
        const map = new Map<string, FileOntologyLayer>();
        fileLayers.forEach((layer) => {
            layer.fileIds.forEach((fileId) => map.set(fileId, layer));
        });
        return map;
    }, [fileLayers]);
    const isLayerOnlyView = viewport.scale < LAYER_ONLY_SCALE;

    const maximizedFile = maximizedFileId ? fileById.get(maximizedFileId) || null : null;
    const maximizedSplitFiles = useMemo(() => {
        if (!maximizedFile) return [];
        const ids = splitFileIds.length > 0 ? splitFileIds : [maximizedFile.id];
        const uniqueIds = Array.from(new Set([maximizedFile.id, ...ids])).slice(0, MAX_SPLIT_FILE_PANES);

        return uniqueIds
            .map((fileId) => fileById.get(fileId) || null)
            .filter((file): file is FileOntologyFile => Boolean(file));
    }, [fileById, maximizedFile, splitFileIds]);

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
        const maxX = Math.max(
            1800,
            ...displayFiles.map((file) => file.x + file.width + 520),
            ...fileLayers.map((layer) => layer.x + layer.width + 360),
        );
        const maxY = Math.max(
            1200,
            ...displayFiles.map((file) => file.y + file.height + 420),
            ...fileLayers.map((layer) => layer.y + layer.height + 300),
        );
        return { width: maxX, height: maxY };
    }, [displayFiles, fileLayers]);

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
            const loadedFiles = fileOntologyLayoutNeedsNormalization(result.model.files, result.model.edges)
                ? optimizeFileOntologyLayout(result.model.files, result.model.edges)
                : result.model.files;
            const firstFile = loadedFiles[0] ?? null;
            const nextDrafts = Object.fromEntries(
                loadedFiles.map((file) => [file.id, draftFromFile(file)]),
            );

            setFiles(loadedFiles);
            setEdges(result.model.edges);
            setDrafts(nextDrafts);
            setSelectedFileId(firstFile?.id ?? null);
            setMaximizedFileId(null);
            setSplitFileIds([]);
            setSummonedFilePositions({});
            setStatusMessage(
                result.warning ||
                    (loadedFiles === result.model.files
                        ? null
                        : 'Rebalanced file layers locally to prevent overlap. Use Optimize layout to save it.'),
            );
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
        displayFilesRef.current = displayFiles;
    }, [displayFiles]);

    useEffect(() => {
        summonedFilePositionsRef.current = summonedFilePositions;
    }, [summonedFilePositions]);

    useEffect(() => {
        if (!maximizedFileId) {
            setSplitFileIds([]);
            return;
        }

        setSplitFileIds((current) => {
            if (current[0] === maximizedFileId) return current;
            return [maximizedFileId];
        });
    }, [maximizedFileId]);

    useEffect(() => {
        viewportRenderModeRef.current = getViewportRenderMode(viewport.scale);
        applySceneTransform(viewport, true);
    }, [applySceneTransform, viewport]);

    useEffect(
        () => () => {
            if (transformFrameRef.current !== null) {
                window.cancelAnimationFrame(transformFrameRef.current);
            }

            if (viewportCommitTimeoutRef.current !== null) {
                window.clearTimeout(viewportCommitTimeoutRef.current);
            }
        },
        [],
    );

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
                const currentScale = viewportRef.current.scale;
                const nextX = dragState.originX + (event.clientX - dragState.startClientX) / currentScale;
                const nextY = dragState.originY + (event.clientY - dragState.startClientY) / currentScale;

                if (dragState.isSummoned) {
                    setSummonedFilePositions((current) => {
                        const summoned = current[dragState.fileId];
                        if (!summoned) return current;

                        return {
                            ...current,
                            [dragState.fileId]: {
                                ...summoned,
                                x: Math.round(nextX),
                                y: Math.round(nextY),
                            },
                        };
                    });
                } else {
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
                }
                return;
            }

            const currentScale = viewportRef.current.scale;
            const nextWidth = dragState.originWidth + (event.clientX - dragState.startClientX) / currentScale;
            const nextHeight = dragState.originHeight + (event.clientY - dragState.startClientY) / currentScale;

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
            if (dragState.kind === 'move' && dragState.isSummoned) {
                const summoned = summonedFilePositionsRef.current[dragState.fileId];
                if (summoned) {
                    const distance = Math.hypot(summoned.x - summoned.anchorX, summoned.y - summoned.anchorY);
                    if (distance > SUMMON_RETURN_DISTANCE) {
                        setSummonedFilePositions((current) => {
                            const next = { ...current };
                            delete next[dragState.fileId];
                            return next;
                        });
                        setStatusMessage('Linked highlight node returned to its saved graph position.');
                    }
                }
            } else if ((dragState.kind === 'move' || dragState.kind === 'resize') && isEditable) {
                const file = filesRef.current.find((candidate) => candidate.id === dragState.fileId);
                if (file) {
                    saveFileOntologyFilePosition(file).catch((error) => {
                        const message = error instanceof Error ? error.message : 'Failed to save node layout';
                        setStatusMessage(`Layout save failed: ${message}`);
                    });
                }
            }

            if (dragState.kind === 'pan') {
                const latestViewport = viewportRef.current;
                applySceneTransform(latestViewport, true);
                scheduleViewportStateCommit(latestViewport, true);
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
    }, [applySceneTransform, dragState, isEditable, scheduleViewportStateCommit]);

    const focusFile = useCallback((fileId: string) => {
        const file =
            displayFilesRef.current.find((candidate) => candidate.id === fileId) ||
            filesRef.current.find((candidate) => candidate.id === fileId);
        if (!file) return;

        setSelectedFileId(fileId);
        setConnectFromFileId(null);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const currentViewport = viewportRef.current;
        const nextViewport = {
            ...currentViewport,
            x: rect.width * 0.42 - (file.x + file.width / 2) * currentViewport.scale,
            y: rect.height * 0.5 - (file.y + file.height / 2) * currentViewport.scale,
        };

        applySceneTransform(nextViewport);
        scheduleViewportStateCommit(nextViewport, true);
    }, [applySceneTransform, scheduleViewportStateCommit]);

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

    const summonLinkedFile = useCallback((sourceFileId: string, targetFileId: string) => {
        if (sourceFileId === targetFileId) {
            focusFile(targetFileId);
            return;
        }

        const source =
            displayFilesRef.current.find((candidate) => candidate.id === sourceFileId) ||
            filesRef.current.find((candidate) => candidate.id === sourceFileId);
        const target = filesRef.current.find((candidate) => candidate.id === targetFileId);

        if (!source || !target) {
            focusFile(targetFileId);
            return;
        }

        const occupiedFiles = displayFilesRef.current.length > 0 ? displayFilesRef.current : filesRef.current;
        const openSpot = findOpenSpotNearFile(source, target, occupiedFiles);
        const anchorX = openSpot.x;
        const anchorY = openSpot.y;

        setSummonedFilePositions((current) => ({
            ...current,
            [targetFileId]: {
                sourceFileId,
                x: anchorX,
                y: anchorY,
                anchorX,
                anchorY,
            },
        }));
        setSelectedFileId(targetFileId);
        setStatusMessage(
            `Opened "${target.title}" beside the highlighted file. Drag it away to return it to its saved position.`,
        );
    }, [focusFile]);

    const addFileToSplitView = useCallback((targetFileId: string) => {
        const target = filesRef.current.find((candidate) => candidate.id === targetFileId);
        if (!target) return;

        setSplitFileIds((current) => {
            const base = current.length > 0 ? current : maximizedFileId ? [maximizedFileId] : [];
            if (base.includes(targetFileId)) return base;
            if (base.length >= MAX_SPLIT_FILE_PANES) {
                setStatusMessage('Split view is limited to six file nodes: three on the top row and three below.');
                return base;
            }

            setStatusMessage(`Added "${target.title}" to the split file view.`);
            return [...base, targetFileId];
        });
    }, [maximizedFileId]);

    const handleFileLinkActivate = useCallback(
        (sourceFileId: string, targetFileId: string) => {
            if (maximizedFileId) {
                addFileToSplitView(targetFileId);
                return;
            }

            summonLinkedFile(sourceFileId, targetFileId);
        },
        [addFileToSplitView, maximizedFileId, summonLinkedFile],
    );

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (
            isInteractiveCanvasTarget(event.target) ||
            isSelectedNodeScrollTarget(event.target, selectedFileId, null)
        ) {
            event.stopPropagation();
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const rect = canvasRef.current?.getBoundingClientRect();
        const anchorX = rect ? rect.width / 2 : 0;
        const anchorY = rect ? rect.height / 2 : 0;
        const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
        const currentViewport = viewportRef.current;
        const nextScale = clamp(currentViewport.scale * zoomFactor, MIN_SCALE, MAX_SCALE);
        const nextViewport = scaleViewportAroundScreenPoint(currentViewport, nextScale, anchorX, anchorY);

        applySceneTransform(nextViewport);
        scheduleViewportStateCommit(nextViewport);
    };

    const handleDragStartCapture = (event: React.DragEvent<HTMLDivElement>) => {
        if (isInteractiveCanvasTarget(event.target)) return;
        clearGraphTextSelection();
        event.preventDefault();
        event.stopPropagation();
    };

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        if (isInteractiveCanvasTarget(event.target)) return;

        clearGraphTextSelection();
        event.preventDefault();
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
            originX: viewportRef.current.x,
            originY: viewportRef.current.y,
        });
    };

    const handleFileMovePointerDown = (
        event: React.PointerEvent<HTMLDivElement>,
        file: FileOntologyFile,
    ) => {
        event.stopPropagation();
        setSelectedFileId(file.id);

        if (event.button !== 0 || maximizedFileId) return;

        const isSummoned = Boolean(summonedFilePositionsRef.current[file.id]);
        if (!isSummoned && !isEditable) return;

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
            isSummoned,
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
        const optimizedViewport = { x: 80, y: 40, scale: 0.72 };
        applySceneTransform(optimizedViewport, true);
        scheduleViewportStateCommit(optimizedViewport, true);
        setStatusMessage('Optimized graph layout into collision-free topic clusters.');

        if (!isEditable) return;

        try {
            await Promise.all(optimizedFiles.map((file) => saveFileOntologyFilePosition(file)));
            setStatusMessage('Optimized topic-cluster layout and saved node positions.');
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

        const canonicalFile = filesRef.current.find((candidate) => candidate.id === file.id) || file;
        const draft = getDraft(canonicalFile);
        const updatedFile: FileOntologyFile = {
            ...canonicalFile,
            title: draft.title.trim() || canonicalFile.title,
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
            setSplitFileIds((current) => current.filter((fileId) => fileId !== file.id));
            setSummonedFilePositions((current) => {
                const next = { ...current };
                delete next[file.id];
                return next;
            });
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

    const createHighlightFileFromSelection = async (sourceFile: FileOntologyFile) => {
        if (!isEditable) return;

        const canonicalSource = filesRef.current.find((candidate) => candidate.id === sourceFile.id) || sourceFile;
        const draft = drafts[canonicalSource.id] || draftFromFile(canonicalSource);
        const textarea = textareaRefs.current[canonicalSource.id];
        const start = textarea?.selectionStart ?? draft.content.length;
        const end = textarea?.selectionEnd ?? draft.content.length;
        const selectedText = compactWhitespace(draft.content.slice(start, end));

        if (!selectedText) {
            setStatusMessage('Select a sentence or phrase first, then create a highlight file node.');
            return;
        }

        const title = titleFromHighlight(selectedText);
        const id = createFileOntologyId(title);
        const nextContent = `${draft.content.slice(0, start)}[[${id}|${selectedText}]]${draft.content.slice(end)}`;
        const updatedSource: FileOntologyFile = {
            ...canonicalSource,
            title: draft.title.trim() || canonicalSource.title,
            summary: draft.summary.trim(),
            content: nextContent,
        };
        const linkedFile: FileOntologyFile = {
            id,
            title,
            summary: `Expands a highlighted sub-concept from ${canonicalSource.title}.`,
            content: buildHighlightExpansionContent(title, canonicalSource, selectedText),
            x: Math.round(canonicalSource.x + canonicalSource.width + 96),
            y: Math.round(canonicalSource.y + 80),
            width: 560,
            height: 420,
        };

        setFiles((current) => {
            const next = current.map((file) => (file.id === updatedSource.id ? updatedSource : file));
            return [...next, linkedFile];
        });
        setDrafts((current) => ({
            ...current,
            [updatedSource.id]: draftFromFile(updatedSource),
            [linkedFile.id]: draftFromFile(linkedFile),
        }));
        setSelectedFileId(linkedFile.id);
        setConnectFromFileId(linkedFile.id);
        setStatusMessage('Creating highlighted sub-file node...');

        try {
            const [savedSource, savedLinkedFile] = await Promise.all([
                saveFileOntologyFile(updatedSource),
                saveFileOntologyFile(linkedFile),
            ]);

            setFiles((current) =>
                current.map((file) => {
                    if (file.id === savedSource.id) return savedSource;
                    if (file.id === savedLinkedFile.id) return savedLinkedFile;
                    return file;
                }),
            );
            setDrafts((current) => ({
                ...current,
                [savedSource.id]: draftFromFile(savedSource),
                [savedLinkedFile.id]: draftFromFile(savedLinkedFile),
            }));
            setStatusMessage(
                'Highlight file node created. Choose the concept file it depends on to create the logical edge.',
            );
        } catch (error) {
            reportWriteError('Highlight file create', error);
        }

        window.setTimeout(() => {
            textareaRefs.current[canonicalSource.id]?.focus();
            textareaRefs.current[canonicalSource.id]?.setSelectionRange(
                start + selectedText.length + id.length + 5,
                start + selectedText.length + id.length + 5,
            );
        }, 0);
    };

    const zoomBy = (factor: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        const anchorX = rect ? rect.width / 2 : 0;
        const anchorY = rect ? rect.height / 2 : 0;

        const currentViewport = viewportRef.current;
        const nextScale = clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE);
        const nextViewport = scaleViewportAroundScreenPoint(currentViewport, nextScale, anchorX, anchorY);

        applySceneTransform(nextViewport);
        scheduleViewportStateCommit(nextViewport, true);
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
                            title="Highlight selected text with an existing file link"
                        >
                            <Link2 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => void createHighlightFileFromSelection(file)}
                            disabled={!isEditable}
                            title="Create a new file node from the selected highlight"
                        >
                            <Plus className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                    <textarea
                        ref={setTextareaRef(file.id)}
                        value={draft.content}
                        onChange={(event) => updateDraftForFile(file, { content: event.target.value })}
                        disabled={!isEditable}
                        className={cn(
                            'file-ontology-scrollbar w-full resize-none bg-transparent p-3 font-mono leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-70',
                            expanded ? 'h-[calc(100vh-330px)] min-h-[420px] text-[13px]' : 'h-[260px] min-h-[220px] text-sm',
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
            ? 13.5
            : clamp(Math.round(file.width / 44), 11, 15);

        return (
            <div
                className={cn(
                    'h-full min-h-0 flex-1 select-none p-4',
                    scrollable
                        ? 'file-ontology-scrollbar overflow-y-auto overflow-x-hidden'
                        : 'overflow-hidden',
                )}
                data-file-node-scroll={scrollable ? 'true' : undefined}
                onDragStartCapture={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onPointerDown={
                    scrollable
                        ? (event) => {
                              if (isScrollbarGutterPointerDown(event)) {
                                  event.stopPropagation();
                              }
                          }
                        : undefined
                }
                style={{ fontSize: adaptiveFontSize, lineHeight: expanded ? 1.62 : 1.5 }}
            >
                <MarkdownPreview
                    content={file.content}
                    sourceFileId={file.id}
                    files={files}
                    onActivateLink={handleFileLinkActivate}
                    onHoverLink={handleHoverLink}
                    compact={!expanded}
                    centered
                />
            </div>
        );
    };

    const renderSplitPane = (file: FileOntologyFile, isPrimary: boolean) => (
        <article
            key={file.id}
            className={cn(
                'pointer-events-auto flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem] border bg-background/95 text-foreground backdrop-blur-xl',
                'shadow-[0_24px_80px_hsl(var(--foreground)/0.12)]',
                isPrimary
                    ? 'border-foreground/45 ring-1 ring-foreground/10'
                    : 'border-border/90 ring-1 ring-border/35',
            )}
            data-file-node-id={file.id}
        >
            <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-muted/20 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-foreground/80" />
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold leading-5 text-foreground">{file.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                            {isPrimary ? 'primary reader pane' : 'highlight-linked reader pane'}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <ToolbarButton
                        onClick={() => setEditingFileId(editingFileId === file.id ? null : file.id)}
                        disabled={!isEditable}
                        title={editingFileId === file.id ? 'Close editor' : 'Edit file'}
                        active={editingFileId === file.id}
                    >
                        <Edit3 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => {
                            if (isPrimary) {
                                setMaximizedFileId(null);
                                setSplitFileIds([]);
                                return;
                            }

                            setSplitFileIds((current) => current.filter((fileId) => fileId !== file.id));
                        }}
                        title={isPrimary ? 'Exit reader panes' : 'Close reader pane'}
                    >
                        {isPrimary ? <Minimize2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </ToolbarButton>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
                {editingFileId === file.id
                    ? (
                          <div className="file-ontology-scrollbar flex h-full min-h-0 flex-col overflow-auto p-4">
                              {renderNodeEditor(file, true)}
                          </div>
                      )
                    : renderNodePreview(file, true, true)}
            </div>
        </article>
    );

    const renderFileNode = (file: FileOntologyFile) => {
        const isSelected = selectedFileId === file.id;
        const isConnectSource = connectFromFileId === file.id;
        const isEditing = editingFileId === file.id;
        const isTitleOnly = viewport.scale < TITLE_ONLY_SCALE;
        const isSummoned = Boolean(summonedFilePositions[file.id]);
        const layer = layerByFileId.get(file.id) || null;
        const titleOnlyFontSize = Math.round(
            clamp(FILE_TITLE_ONLY_SCREEN_FONT_SIZE / Math.max(viewport.scale, MIN_SCALE), 18, 44),
        );

        return (
            <div
                key={file.id}
                className={cn(
                    'absolute flex flex-col overflow-hidden rounded-xl border bg-background/95 text-foreground shadow-[0_18px_48px_hsl(var(--foreground)/0.06)] backdrop-blur-sm',
                    isSelected ? 'border-foreground' : 'border-border',
                    isConnectSource ? 'outline outline-2 outline-foreground' : null,
                    isSummoned ? 'ring-2 ring-foreground/20' : null,
                )}
                style={{
                    left: file.x,
                    top: file.y,
                    width: file.width,
                    height: file.height,
                    borderTopColor: layer?.accentColor,
                    borderTopWidth: layer ? 3 : undefined,
                }}
                data-file-node-id={file.id}
                onClick={(event) => {
                    event.stopPropagation();
                    setSelectedFileId(file.id);
                }}
            >
                <div
                    className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-muted/10 px-3 py-2 active:cursor-grabbing"
                    onPointerDown={(event) => handleFileMovePointerDown(event, file)}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-foreground" />
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{file.title}</div>
                            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                                {layer ? (
                                    <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: layer.accentColor }}
                                    />
                                ) : null}
                                <span className="truncate">
                                    {isSummoned ? 'linked highlight preview' : layer?.title || file.id}
                                </span>
                            </div>
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
                                    setSplitFileIds([file.id]);
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
                        <div
                            className="max-w-full px-4 font-semibold leading-tight text-foreground"
                            style={{
                                display: '-webkit-box',
                                fontSize: titleOnlyFontSize,
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                            }}
                        >
                            {file.title}
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col p-0">
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

                {isEditable && !isTitleOnly && !isSummoned ? (
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
            onDragStartCapture={handleDragStartCapture}
            onWheelCapture={handleWheel}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 18% 12%, hsl(var(--accent) / 0.10), transparent 34rem), linear-gradient(to right, hsl(var(--border) / 0.28) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.28) 1px, transparent 1px)',
                    backgroundSize: 'auto, 40px 40px, 40px 40px',
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
                        transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        contain: 'layout paint size',
                    }}
                >
                    {fileLayers.map((layer) => {
                        const layerTitleFontSize = Math.round(
                            isLayerOnlyView
                                ? clamp(28 / Math.max(viewport.scale, MIN_SCALE), 96, 220)
                                : clamp(16 / Math.max(viewport.scale, 0.45), 22, 48),
                        );
                        const layerBadgeFontSize = Math.round(clamp(12 / Math.max(viewport.scale, 0.45), 16, 32));

                        return (
                            <div
                                key={layer.id}
                                className={cn(
                                    'pointer-events-none absolute rounded-[2rem] border-2 transition-colors duration-200',
                                    isLayerOnlyView
                                        ? 'bg-background/70'
                                        : 'bg-background/20',
                                )}
                                style={{
                                    backgroundColor: isLayerOnlyView ? 'hsl(var(--background) / 0.72)' : layer.accentBackground,
                                    borderColor: layer.accentColor,
                                    boxShadow: `inset 0 0 0 1px ${layer.accentColor}`,
                                    left: layer.x,
                                    top: layer.y,
                                    width: layer.width,
                                    height: layer.height,
                                }}
                            >
                                {!isLayerOnlyView ? (
                                    <div
                                        className="absolute left-7 top-6 flex items-center gap-3 rounded-full border bg-background/90 px-4 py-2 font-semibold text-foreground shadow-[0_0_0_3px_hsl(var(--background))]"
                                        style={{
                                            borderColor: layer.accentColor,
                                            fontSize: layerBadgeFontSize,
                                        }}
                                    >
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: layer.accentColor }}
                                        />
                                        <span>{layer.title}</span>
                                        <span className="text-muted-foreground">{layer.fileIds.length} files</span>
                                    </div>
                                ) : null}
                                <div
                                    className={cn(
                                        'absolute left-1/2 top-1/2 w-[90%] -translate-x-1/2 -translate-y-1/2 text-center font-display font-bold leading-none text-foreground transition-opacity duration-200',
                                        isLayerOnlyView ? 'opacity-100' : 'opacity-10',
                                    )}
                                    style={{ fontSize: layerTitleFontSize }}
                                >
                                    {layer.title}
                                </div>
                            </div>
                        );
                    })}

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
                        {!isLayerOnlyView && edges.map((edge) => {
                            const source = fileById.get(edge.sourceFileId);
                            const target = fileById.get(edge.targetFileId);
                            if (!source || !target) return null;

                            const anchors = edgeAnchors(source, target);
                            const labelScale = clamp(1 / Math.max(viewport.scale, 0.32), 1, 2.8);
                            const labelWidth = Math.round(360 * labelScale);
                            const labelHeight = Math.round(76 * labelScale);
                            const labelFontSize = Math.round(11.5 * labelScale);

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
                                        x={anchors.labelX - labelWidth / 2}
                                        y={anchors.labelY - labelHeight / 2}
                                        width={labelWidth}
                                        height={labelHeight}
                                    >
                                        <div
                                            className="flex h-full items-center justify-center gap-1.5"
                                            data-no-canvas-pan="true"
                                            onPointerDown={(event) => event.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                className="rounded-2xl border border-foreground/25 bg-background/95 px-3 py-2 text-center font-semibold leading-tight text-foreground shadow-[0_0_0_3px_hsl(var(--background))] backdrop-blur"
                                                style={{
                                                    maxWidth: Math.round(300 * labelScale),
                                                    fontSize: labelFontSize,
                                                    maxHeight: Math.round(56 * labelScale),
                                                    overflow: 'hidden',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'normal',
                                                }}
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
                                                    className="rounded-full border border-foreground/30 bg-background p-1 text-muted-foreground shadow-[0_0_0_2px_hsl(var(--background))] hover:text-foreground"
                                                    style={{
                                                        width: Math.round(24 * labelScale),
                                                        height: Math.round(24 * labelScale),
                                                    }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDeleteEdge(edge);
                                                    }}
                                                    title="Delete edge"
                                                >
                                                    <X className="h-full w-full" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </foreignObject>
                                </g>
                            );
                        })}
                    </svg>

                    {!isLayerOnlyView ? displayFiles.map(renderFileNode) : null}
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 top-4 z-50 flex items-start justify-between gap-3">
                <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-background/90 p-1.5 text-foreground shadow-[0_16px_44px_hsl(var(--foreground)/0.08)] backdrop-blur-xl">
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
                        onClick={() => {
                            const resetViewport = { x: 80, y: 40, scale: 0.92 };
                            applySceneTransform(resetViewport, true);
                            scheduleViewportStateCommit(resetViewport, true);
                        }}
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
                <>
                    <div
                        className="fixed inset-0 z-[110] bg-background/72 backdrop-blur-[3px]"
                        data-no-canvas-pan="true"
                        onPointerDown={(event) => event.stopPropagation()}
                        onWheelCapture={(event) => event.stopPropagation()}
                    />
                    <div
                        className="fixed inset-0 z-[120] overflow-hidden p-4 text-foreground sm:p-5"
                        data-file-node-id={maximizedFile.id}
                        data-no-canvas-pan="true"
                        onPointerDown={(event) => event.stopPropagation()}
                        onWheelCapture={(event) => event.stopPropagation()}
                    >
                        <div
                            className={cn(
                                'grid h-full min-h-0 auto-rows-[minmax(0,1fr)] gap-4',
                                maximizedPaneGridClass(maximizedSplitFiles.length),
                            )}
                            data-file-node-scroll="true"
                        >
                            {maximizedSplitFiles.map((file) =>
                                renderSplitPane(file, file.id === maximizedFile.id),
                            )}
                        </div>
                    </div>
                </>
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
