import { useEffect, useMemo, useState } from 'react';
import { CircleDot, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import type { GraphNode, GraphViewScope } from '../../lib/graphModel';
import {
    buildGraphSphereConfigsFromNodes,
    getDefaultGraphSphereConfig,
    type GraphSphereConfig,
} from '../../lib/graphSpheres';
import { storage } from '../../data/storage';

interface GraphSphereManagerProps {
    graphView: GraphViewScope;
    nodes: GraphNode[];
    onClose: () => void;
    onUpdate: () => Promise<void> | void;
}

type SphereDraft = GraphSphereConfig;

function slugifySphereId(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (normalized.length >= 2) {
        return normalized;
    }

    return `sphere-${crypto.randomUUID().slice(0, 8)}`;
}

function toSphereDraft(config: GraphSphereConfig): SphereDraft {
    return {
        ...config,
        position: { ...config.position },
    };
}

export function GraphSphereManager({
    graphView,
    nodes,
    onClose,
    onUpdate,
}: GraphSphereManagerProps) {
    const [sphereDrafts, setSphereDrafts] = useState<SphereDraft[]>([]);
    const [newSphereLabel, setNewSphereLabel] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const sortedSpheres = useMemo(
        () => buildGraphSphereConfigsFromNodes(nodes).map(toSphereDraft),
        [nodes],
    );

    useEffect(() => {
        setSphereDrafts(sortedSpheres);
    }, [sortedSpheres]);

    const updateDraft = (id: string, updater: (draft: SphereDraft) => SphereDraft) => {
        setSphereDrafts((current) =>
            current.map((draft) => (draft.id === id ? updater(draft) : draft)),
        );
        if (error) setError('');
        if (message) setMessage('');
    };

    const handleSaveSphere = async (draft: SphereDraft) => {
        setIsSaving(true);
        setError('');
        setMessage('');

        const result = await storage.upsertGraphSphere(draft, graphView);
        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        await onUpdate();
        setMessage(`Saved sphere "${draft.label}".`);
        setIsSaving(false);
    };

    const handleInitializeDefaults = async () => {
        if (!window.confirm('Reset the default sphere layout in this graph view?')) {
            return;
        }

        setIsSaving(true);
        setError('');
        setMessage('');

        const result = await storage.initializeDefaultGraphSpheres(graphView);
        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        await onUpdate();
        setMessage('Default sphere layout was initialized.');
        setIsSaving(false);
    };

    const handleCreateSphere = async () => {
        const label = newSphereLabel.trim();
        if (!label) return;

        const id = slugifySphereId(label);
        if (sphereDrafts.some((draft) => draft.id === id)) {
            setError(`A sphere with id "${id}" already exists.`);
            return;
        }

        const nextDraft: SphereDraft = {
            id,
            label,
            nodeType: 'field',
            radius: 6,
            position: { x: 0, y: 0, z: -12 },
            flatWidth: 54,
            flatHeight: 28,
            sortOrder: sphereDrafts.length + 1,
            bindingKey: id,
        };

        setIsSaving(true);
        setError('');
        setMessage('');

        const result = await storage.upsertGraphSphere(nextDraft, graphView);
        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        setNewSphereLabel('');
        await onUpdate();
        setMessage(`Created sphere "${label}".`);
        setIsSaving(false);
    };

    const handleDeleteSphere = async (draft: SphereDraft) => {
        if (!window.confirm(`Delete sphere "${draft.label}"?`)) {
            return;
        }

        setIsSaving(true);
        setError('');
        setMessage('');

        const result = await storage.deleteGraphSphere(draft.id, graphView);
        if (result.error) {
            setError(result.error.message);
            setIsSaving(false);
            return;
        }

        await onUpdate();
        setMessage(`Deleted sphere "${draft.label}".`);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <CircleDot className="h-5 w-5" />
                            Sphere Layout Manager
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

                <div className="flex flex-col gap-4 overflow-auto px-5 py-4 text-white">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleInitializeDefaults}
                                    disabled={isSaving}
                                    className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Initialize Defaults
                                </button>
                                <span className="text-xs text-white/45">
                                    Sphere layout is now stored in `graph_nodes.data.sphere`.
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <h3 className="text-sm font-medium text-white/90">Add Sphere</h3>
                            <input
                                value={newSphereLabel}
                                onChange={(event) => setNewSphereLabel(event.target.value)}
                                placeholder="Sphere label"
                                className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                            />
                            <button
                                type="button"
                                onClick={handleCreateSphere}
                                disabled={isSaving || newSphereLabel.trim().length === 0}
                                className="mt-3 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    ) : null}

                    {!error && message ? (
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {message}
                        </div>
                    ) : null}

                    <div className="grid gap-4">
                        {sphereDrafts.map((draft) => {
                            const isDefaultSphere = Boolean(getDefaultGraphSphereConfig(draft.id));
                            const canDelete = draft.nodeType === 'field' && !isDefaultSphere;

                            return (
                                <div
                                    key={draft.id}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                >
                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_220px_auto]">
                                        <div>
                                            <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                                Label
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={draft.label}
                                                onChange={(event) =>
                                                    updateDraft(draft.id, (current) => ({
                                                        ...current,
                                                        label: event.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                                Radius
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={draft.radius}
                                                onChange={(event) =>
                                                    updateDraft(draft.id, (current) => ({
                                                        ...current,
                                                        radius: Number(event.target.value) || 0,
                                                    }))
                                                }
                                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {(['x', 'y', 'z'] as const).map((axis) => (
                                                <div key={axis}>
                                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                                        {axis}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={draft.position[axis]}
                                                        onChange={(event) =>
                                                            updateDraft(draft.id, (current) => ({
                                                                ...current,
                                                                position: {
                                                                    ...current.position,
                                                                    [axis]: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleSaveSphere(draft)}
                                                disabled={isSaving || draft.label.trim().length === 0}
                                                className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteSphere(draft)}
                                                disabled={!canDelete || isSaving}
                                                className="inline-flex items-center justify-center rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-30"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        <div>
                                            <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                                Binding Key
                                            </label>
                                            <input
                                                value={draft.bindingKey || ''}
                                                onChange={(event) =>
                                                    updateDraft(draft.id, (current) => ({
                                                        ...current,
                                                        bindingKey: event.target.value.trim() || null,
                                                    }))
                                                }
                                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                                Flat Order
                                            </label>
                                            <input
                                                type="number"
                                                step="1"
                                                value={draft.sortOrder}
                                                onChange={(event) =>
                                                    updateDraft(draft.id, (current) => ({
                                                        ...current,
                                                        sortOrder: Number(event.target.value) || 0,
                                                    }))
                                                }
                                                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                            />
                                        </div>
                                        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-white/50">
                                            <div>ID: <span className="font-mono text-white/75">{draft.id}</span></div>
                                            <div className="mt-2">Type: <span className="font-mono text-white/75">{draft.nodeType}</span></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
