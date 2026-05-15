import { useMemo, useState } from 'react';
import { FilePlus2, FolderPlus, Link2, Loader2, X } from 'lucide-react';
import { FIELDS } from '../../data/seed';
import { storage } from '../../data/storage';
import type { GraphNode, GraphViewScope } from '../../lib/graphModel';
import { normalizeTopicSlug } from '../../lib/topicSlug';

interface DirectoryStructureManagerProps {
    graphView: GraphViewScope;
    nodes: GraphNode[];
    onClose: () => void;
    onUpdate: () => Promise<void> | void;
}

const ROOT_PARENT_ID = 'root';

function slugifyId(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return normalized.length > 0 ? normalized : `node-${crypto.randomUUID().slice(0, 8)}`;
}

function makeUniqueId(prefix: string, label: string, existingIds: Set<string>) {
    const base = `${prefix}-${slugifyId(label)}`;
    if (!existingIds.has(base)) {
        return base;
    }

    let index = 2;
    while (existingIds.has(`${base}-${index}`)) {
        index += 1;
    }

    return `${base}-${index}`;
}

function isFolderNode(node: GraphNode) {
    return node.type === 'field' || node.type === 'cluster';
}

function formatNodeType(node: GraphNode) {
    return node.type === 'field' ? 'Folder' : node.type === 'cluster' ? 'Folder' : node.type;
}

export function DirectoryStructureManager({
    graphView,
    nodes,
    onClose,
    onUpdate,
}: DirectoryStructureManagerProps) {
    const [folderLabel, setFolderLabel] = useState('');
    const [folderParentId, setFolderParentId] = useState(ROOT_PARENT_ID);
    const [fileTitle, setFileTitle] = useState('');
    const [fileSlug, setFileSlug] = useState('');
    const [fileFieldId, setFileFieldId] = useState('mathematical-physics');
    const [fileYear, setFileYear] = useState('0');
    const [fileParentId, setFileParentId] = useState(ROOT_PARENT_ID);
    const [edgeSourceId, setEdgeSourceId] = useState('');
    const [edgeTargetId, setEdgeTargetId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const existingIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);

    const folderOptions = useMemo(
        () =>
            [
                { id: ROOT_PARENT_ID, label: 'Knowledge Graph root' },
                ...nodes
                    .filter((node) => isFolderNode(node))
                    .map((node) => ({
                        id: node.id,
                        label: `${node.label} (${formatNodeType(node)})`,
                    })),
            ].sort((left, right) => left.label.localeCompare(right.label)),
        [nodes],
    );

    const nodeOptions = useMemo(
        () =>
            [
                { id: ROOT_PARENT_ID, label: 'Knowledge Graph root' },
                ...nodes.map((node) => ({
                    id: node.id,
                    label: `${node.label} (${node.type})`,
                })),
            ].sort((left, right) => left.label.localeCompare(right.label)),
        [nodes],
    );

    const fieldOptions = useMemo(() => {
        const knownFieldIds = new Set(FIELDS.map((field) => field.id));
        const dynamicFieldIds = nodes
            .filter((node) => node.type === 'field')
            .map((node) => node.data && typeof node.data.fieldId === 'string' ? node.data.fieldId : node.id)
            .filter((fieldId): fieldId is string => Boolean(fieldId));

        return Array.from(new Set([...FIELDS.map((field) => field.id), ...dynamicFieldIds]))
            .filter((fieldId) => knownFieldIds.has(fieldId) || dynamicFieldIds.includes(fieldId))
            .map((fieldId) => ({
                id: fieldId,
                label: FIELDS.find((field) => field.id === fieldId)?.name || fieldId,
            }))
            .sort((left, right) => left.label.localeCompare(right.label));
    }, [nodes]);

    const clearFeedback = () => {
        if (error) setError('');
        if (message) setMessage('');
    };

    const handleCreateFolder = async () => {
        const label = folderLabel.trim();
        if (!label) return;

        setIsSaving(true);
        setError('');
        setMessage('');

        const id = makeUniqueId('folder', label, existingIds);
        const result = await storage.addGraphNode(
            {
                id,
                type: 'cluster',
                label,
                data: {
                    directoryType: 'folder',
                },
            },
            graphView,
        );

        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        if (folderParentId && folderParentId !== ROOT_PARENT_ID) {
            const edgeResult = await storage.addHierarchyEdge(folderParentId, id, graphView);
            if (edgeResult.error) {
                setError(edgeResult.error.message);
                setIsSaving(false);
                return;
            }
        }

        setFolderLabel('');
        setFolderParentId(ROOT_PARENT_ID);
        await onUpdate();
        setMessage(`Created folder "${label}".`);
        setIsSaving(false);
    };

    const handleCreateFile = async () => {
        const title = fileTitle.trim();
        if (!title) return;

        setIsSaving(true);
        setError('');
        setMessage('');

        const normalizedSlug = normalizeTopicSlug(fileSlug.trim()) || normalizeTopicSlug(title) || slugifyId(title);
        const year = fileYear.trim() || '0';

        const { data, error: topicError } = await storage.addTopic(
            {
                field_id: fileFieldId,
                year,
                title,
                slug: normalizedSlug,
                summary: '',
                tags: [],
                content: '',
            },
            graphView,
        );

        if (topicError || !data) {
            setError(topicError?.message || 'Failed to create file.');
            setIsSaving(false);
            return;
        }

        if (fileParentId && fileParentId !== ROOT_PARENT_ID) {
            const edgeResult = await storage.addHierarchyEdge(fileParentId, data.id, graphView);
            if (edgeResult.error) {
                setError(edgeResult.error.message);
                setIsSaving(false);
                return;
            }
        }

        setFileTitle('');
        setFileSlug('');
        setFileYear('0');
        setFileParentId(ROOT_PARENT_ID);
        await onUpdate();
        setMessage(`Created file "${title}".`);
        setIsSaving(false);
    };

    const handleCreateHierarchyEdge = async () => {
        if (!edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId) return;

        setIsSaving(true);
        setError('');
        setMessage('');

        const result = await storage.addHierarchyEdge(edgeSourceId, edgeTargetId, graphView);
        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        setEdgeSourceId('');
        setEdgeTargetId('');
        await onUpdate();
        setMessage('Hierarchy link created.');
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <FolderPlus className="h-5 w-5" />
                            Directory Structure Manager
                        </h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                            {graphView} graph view
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/60 transition hover:bg-white/8 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-3">
                    <div className="border-b border-white/10 px-5 py-5 text-white lg:border-b-0 lg:border-r lg:border-white/10">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h3 className="flex items-center gap-2 text-sm font-medium text-white/92">
                                <FolderPlus className="h-4 w-4" />
                                Add Folder
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-white/52">
                                Creates a directory folder node and optionally attaches it under an existing parent.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Folder Label
                                    </label>
                                    <input
                                        value={folderLabel}
                                        onChange={(event) => {
                                            setFolderLabel(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        placeholder="Mathematical Methods"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Parent Folder
                                    </label>
                                    <select
                                        value={folderParentId}
                                        onChange={(event) => {
                                            setFolderParentId(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                    >
                                        {folderOptions.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleCreateFolder()}
                                disabled={isSaving || folderLabel.trim().length === 0}
                                className="mt-4 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                                Create Folder
                            </button>
                        </div>
                    </div>

                    <div className="border-b border-white/10 px-5 py-5 text-white lg:border-b-0 lg:border-r lg:border-white/10">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h3 className="flex items-center gap-2 text-sm font-medium text-white/92">
                                <FilePlus2 className="h-4 w-4" />
                                Add File
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-white/52">
                                Creates a topic file and places it under a selected folder. The file can later be opened and edited.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Title
                                    </label>
                                    <input
                                        value={fileTitle}
                                        onChange={(event) => {
                                            setFileTitle(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        placeholder="Fourier Analysis Notes"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Slug
                                    </label>
                                    <input
                                        value={fileSlug}
                                        onChange={(event) => {
                                            setFileSlug(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        placeholder="fourier-analysis-notes"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                            Field
                                        </label>
                                        <select
                                            value={fileFieldId}
                                            onChange={(event) => {
                                                setFileFieldId(event.target.value);
                                                clearFeedback();
                                            }}
                                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        >
                                            {fieldOptions.map((field) => (
                                                <option key={field.id} value={field.id}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                            Year
                                        </label>
                                        <input
                                            value={fileYear}
                                            onChange={(event) => {
                                                setFileYear(event.target.value);
                                                clearFeedback();
                                            }}
                                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Parent Folder
                                    </label>
                                    <select
                                        value={fileParentId}
                                        onChange={(event) => {
                                            setFileParentId(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                    >
                                        {folderOptions.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleCreateFile()}
                                disabled={isSaving || fileTitle.trim().length === 0}
                                className="mt-4 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                                Create File
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-5 text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h3 className="flex items-center gap-2 text-sm font-medium text-white/92">
                                <Link2 className="h-4 w-4" />
                                Create Hierarchy Link
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-white/52">
                                Connect any existing node as parent to child using a hierarchy edge.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Parent Node
                                    </label>
                                    <select
                                        value={edgeSourceId}
                                        onChange={(event) => {
                                            setEdgeSourceId(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                    >
                                        <option value="">Select parent</option>
                                        {nodeOptions.map((option) => (
                                            <option key={`source-${option.id}`} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Child Node
                                    </label>
                                    <select
                                        value={edgeTargetId}
                                        onChange={(event) => {
                                            setEdgeTargetId(event.target.value);
                                            clearFeedback();
                                        }}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                    >
                                        <option value="">Select child</option>
                                        {nodeOptions.map((option) => (
                                            <option key={`target-${option.id}`} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleCreateHierarchyEdge()}
                                disabled={isSaving || !edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId}
                                className="mt-4 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                                Add Hierarchy
                            </button>

                            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/48">
                                Use this panel for directory structure only. The editor link button creates inline
                                backlink mentions, not hierarchy edges.
                            </div>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="border-t border-white/10 px-5 py-3 text-sm text-red-300">
                        {error}
                    </div>
                ) : null}

                {!error && message ? (
                    <div className="border-t border-white/10 px-5 py-3 text-sm text-emerald-200">
                        {message}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default DirectoryStructureManager;
