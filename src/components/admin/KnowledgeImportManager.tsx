import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { FileText, History, Loader2, UploadCloud, X } from 'lucide-react';
import type { GraphViewScope } from '../../lib/graphModel';
import {
    importKnowledgeSource,
    listKnowledgeIngestionRuns,
    listKnowledgeSourceDocuments,
    type KnowledgeImportSummary,
} from '../../lib/knowledgePipeline';
import {
    KNOWLEDGE_SCHEMA_SETUP_MESSAGE,
    checkKnowledgeSchemaReady,
} from '../../lib/knowledgeSchema';
import {
    ARCHIVE_SCHEMA_SETUP_MESSAGE,
    checkArchiveSchemaReady,
} from '../../lib/archiveSchema';

interface KnowledgeImportManagerProps {
    graphView: GraphViewScope;
    userId?: string | null;
    onClose: () => void;
    onImported: () => Promise<void> | void;
}

function formatRelativeTimestamp(value: string) {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return value;

    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
}

export function KnowledgeImportManager({
    graphView,
    userId,
    onClose,
    onImported,
}: KnowledgeImportManagerProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [schemaError, setSchemaError] = useState('');
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<KnowledgeImportSummary | null>(null);
    const [recentDocuments, setRecentDocuments] = useState<Array<{
        id: string;
        title: string;
        file_name: string;
        status: string;
        created_at: string;
    }>>([]);
    const [recentRuns, setRecentRuns] = useState<Array<{
        id: string;
        status: string;
        created_at: string;
        summary?: Record<string, unknown> | null;
    }>>([]);

    const canSubmit = useMemo(
        () => Boolean(selectedFile) && title.trim().length > 0 && !isImporting && !schemaError,
        [isImporting, schemaError, selectedFile, title],
    );

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setIsHistoryLoading(true);
            setSchemaError('');

            try {
                const knowledgeReady = await checkKnowledgeSchemaReady();
                if (!knowledgeReady) {
                    if (isMounted) {
                        setSchemaError(KNOWLEDGE_SCHEMA_SETUP_MESSAGE);
                        setRecentDocuments([]);
                        setRecentRuns([]);
                    }
                    return;
                }

                if (graphView === 'archive') {
                    const archiveReady = await checkArchiveSchemaReady();
                    if (!archiveReady) {
                        if (isMounted) {
                            setSchemaError(ARCHIVE_SCHEMA_SETUP_MESSAGE);
                            setRecentDocuments([]);
                            setRecentRuns([]);
                        }
                        return;
                    }
                }

                const [documents, runs] = await Promise.all([
                    listKnowledgeSourceDocuments(graphView),
                    listKnowledgeIngestionRuns(graphView),
                ]);

                if (!isMounted) return;

                setRecentDocuments(documents);
                setRecentRuns(runs);
            } catch (loadError) {
                if (!isMounted) return;
                setSchemaError(loadError instanceof Error ? loadError.message : 'Failed to load import history.');
            } finally {
                if (isMounted) {
                    setIsHistoryLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [graphView]);

    const refreshHistory = async () => {
        try {
            const [documents, runs] = await Promise.all([
                listKnowledgeSourceDocuments(graphView),
                listKnowledgeIngestionRuns(graphView),
            ]);

            setRecentDocuments(documents);
            setRecentRuns(runs);
        } catch (refreshError) {
            setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh import history.');
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        if (file && title.trim().length === 0) {
            setTitle(file.name.replace(/\.[^.]+$/, ''));
        }
        if (error) setError('');
        if (summary) setSummary(null);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setError('');
        setSummary(null);

        try {
            const result = await importKnowledgeSource({
                file: selectedFile,
                title: title.trim(),
                notes: notes.trim() || undefined,
                scope: graphView,
                userId,
            });

            setSummary(result);
            await onImported();
            await refreshHistory();
        } catch (importError) {
            setError(importError instanceof Error ? importError.message : 'Knowledge import failed.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <UploadCloud className="h-5 w-5" />
                            Knowledge Import Pipeline
                        </h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                            {graphView} repository expansion
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

                <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_420px]">
                    <div className="flex min-h-0 flex-col overflow-y-auto border-r border-white/10 px-5 py-5 text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h3 className="text-sm font-medium text-white/92">Upload Source</h3>
                            <p className="mt-2 text-sm leading-6 text-white/52">
                                Upload a textbook, lecture note, paper, markdown, or text file. The importer will
                                extend the current knowledge graph instead of rebuilding it from scratch, and it will
                                scaffold equation-aware, logic-first node documents instead of shallow summary stubs.
                            </p>

                            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/14 bg-black/20 px-6 py-10 text-center transition hover:border-white/28 hover:bg-white/[0.03]">
                                <UploadCloud className="mb-3 h-8 w-8 text-white/52" />
                                <div className="text-sm text-white/82">
                                    {selectedFile ? selectedFile.name : 'Choose a source file'}
                                </div>
                                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/34">
                                    PDF, MD, Markdown, TXT
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.md,.markdown,.txt,text/markdown,text/plain,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isImporting}
                                />
                            </label>

                            <div className="mt-5 grid gap-4">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Document Title
                                    </label>
                                    <input
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        disabled={isImporting}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        placeholder="Advanced Classical Mechanics"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                                        Import Note
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        disabled={isImporting}
                                        rows={4}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/30"
                                        placeholder="Optional note about the source scope, expected sphere, or merge intent."
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={!canSubmit}
                                    className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/88 transition hover:border-white/30 hover:bg-white/8 hover:text-white disabled:opacity-50"
                                >
                                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                    Import and Merge
                                </button>
                                <span className="text-xs text-white/42">
                                    Existing spheres and nodes are reused first, then only affected subgraphs and scholarly node docs are expanded.
                                </span>
                            </div>
                        </div>

                        {schemaError ? (
                            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                {schemaError}
                            </div>
                        ) : null}

                        {!schemaError && error ? (
                            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        ) : null}

                        {!schemaError && !error && summary ? (
                            <div className="mt-4 rounded-2xl border border-emerald-400/18 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                                <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-50">
                                    Import Result
                                </h3>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Created Spheres</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.createdSpheres.length > 0 ? summary.createdSpheres.join(', ') : 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Reused Spheres</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.reusedSpheres.length > 0 ? summary.reusedSpheres.join(', ') : 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Created Clusters</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.createdClusters.length > 0 ? summary.createdClusters.join(', ') : 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Created Topics</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.createdTopics.length > 0 ? summary.createdTopics.join(', ') : 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Updated Topics</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.updatedTopics.length > 0 ? summary.updatedTopics.join(', ') : 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">Warnings</div>
                                        <div className="mt-2 text-emerald-50/92">
                                            {summary.warnings.length > 0 ? summary.warnings.join(', ') : 'None'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex min-h-0 flex-col overflow-y-auto px-5 py-5 text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-white/65" />
                                <h3 className="text-sm font-medium text-white/92">Recent Imports</h3>
                            </div>

                            {isHistoryLoading ? (
                                <div className="mt-5 flex items-center gap-2 text-sm text-white/45">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading history...
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                                            Source Documents
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {recentDocuments.length > 0 ? recentDocuments.map((document) => (
                                                <div
                                                    key={document.id}
                                                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm text-white/88">
                                                                {document.title}
                                                            </div>
                                                            <div className="mt-1 truncate text-xs text-white/38">
                                                                {document.file_name}
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 rounded-full border border-white/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/52">
                                                            {document.status}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/24">
                                                        {formatRelativeTimestamp(document.created_at)}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-4 text-sm text-white/38">
                                                    No source documents yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
                                            <FileText className="h-3.5 w-3.5" />
                                            Ingestion Runs
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {recentRuns.length > 0 ? recentRuns.map((run) => (
                                                <div
                                                    key={run.id}
                                                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm text-white/84">{run.status}</div>
                                                        <div className="text-[11px] uppercase tracking-[0.14em] text-white/24">
                                                            {formatRelativeTimestamp(run.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-white/38">
                                                        {run.summary && typeof run.summary === 'object'
                                                            ? `${Array.isArray((run.summary as Record<string, unknown>).createdTopics)
                                                                ? ((run.summary as Record<string, unknown>).createdTopics as unknown[]).length
                                                                : 0} created / ${Array.isArray((run.summary as Record<string, unknown>).updatedTopics)
                                                                    ? ((run.summary as Record<string, unknown>).updatedTopics as unknown[]).length
                                                                    : 0} updated`
                                                            : 'No summary yet.'}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-4 text-sm text-white/38">
                                                    No ingestion runs yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KnowledgeImportManager;
