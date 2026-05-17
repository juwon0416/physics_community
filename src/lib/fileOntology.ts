import { supabase } from './supabase';
import {
    FUNDAMENTALS_CHAPTER_1_EDGES,
    FUNDAMENTALS_CHAPTER_1_FILES,
} from '../data/fundamentalsChapter1Ontology';
import {
    FUNDAMENTALS_CHAPTER_2_EDGES,
    FUNDAMENTALS_CHAPTER_2_FILES,
} from '../data/fundamentalsChapter2Ontology';

export interface FileOntologyFile {
    id: string;
    title: string;
    summary: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface FileOntologyEdge {
    id: string;
    sourceFileId: string;
    targetFileId: string;
    label: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface FileOntologyGenerationRunRecord {
    id: string;
    intent: string;
    sourceType: string;
    title: string;
    userGoal: string;
    status: string;
}

export interface FileOntologyGenerationArtifactRecord {
    id: string;
    runId: string;
    artifactType: string;
    contentJson: Record<string, unknown>;
}

export interface FileOntologyLinkMentionRecord {
    id: string;
    sourceFileId: string;
    targetFileId: string;
    anchorText: string;
    relation: string;
    contextExcerpt: string;
    generationRunId?: string | null;
}

export interface FileOntologyWorkflowMetadataInput {
    run: FileOntologyGenerationRunRecord;
    artifacts: FileOntologyGenerationArtifactRecord[];
    linkMentions: FileOntologyLinkMentionRecord[];
}

export interface FileOntologyModel {
    files: FileOntologyFile[];
    edges: FileOntologyEdge[];
}

export interface FileOntologyLoadResult {
    model: FileOntologyModel;
    source: 'database' | 'starter';
    warning?: string;
}

interface FileOntologyFileRow {
    id: string;
    title: string;
    summary: string | null;
    content: string | null;
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface FileOntologyEdgeRow {
    id: string;
    source_file_id: string;
    target_file_id: string;
    label: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

const FILE_TABLE = 'file_ontology_files';
const EDGE_TABLE = 'file_ontology_edges';
const GENERATION_RUN_TABLE = 'file_ontology_generation_runs';
const GENERATION_ARTIFACT_TABLE = 'file_ontology_generation_artifacts';
const LINK_MENTION_TABLE = 'file_ontology_link_mentions';

const FILE_SELECT = 'id,title,summary,content,x,y,width,height,created_at,updated_at';
const EDGE_SELECT = 'id,source_file_id,target_file_id,label,created_at,updated_at';

const REMOVED_STARTER_FILE_IDS = new Set(['file-ontology-index', 'file-ontology-links']);

export const FILE_ONTOLOGY_SCHEMA_SETUP_MESSAGE =
    'File ontology tables are not available yet. Apply database/sql/schema/file_ontology_schema.sql in Supabase, then refresh /graph.';
export const FILE_ONTOLOGY_WORKFLOW_SCHEMA_SETUP_MESSAGE =
    'File ontology workflow metadata tables are not available yet. Apply database/sql/migrations/migration_add_file_ontology_workflow.sql in Supabase to persist workflow runs and highlight mentions.';

function cloneFile(file: FileOntologyFile): FileOntologyFile {
    return { ...file };
}

function cloneEdge(edge: FileOntologyEdge): FileOntologyEdge {
    return { ...edge };
}

export function getStarterFileOntologyModel(): FileOntologyModel {
    return {
        files: [
            ...FUNDAMENTALS_CHAPTER_1_FILES,
            ...FUNDAMENTALS_CHAPTER_2_FILES,
        ],
        edges: [
            ...FUNDAMENTALS_CHAPTER_1_EDGES,
            ...FUNDAMENTALS_CHAPTER_2_EDGES,
        ],
    };
}

function mergeBundledOntologyModel(
    databaseFiles: FileOntologyFile[],
    databaseEdges: FileOntologyEdge[],
    bundledModel: FileOntologyModel,
) {
    const files = databaseFiles.filter((file) => !REMOVED_STARTER_FILE_IDS.has(file.id));
    const fileIds = new Set(files.map((file) => file.id));
    const bundledFiles = bundledModel.files
        .filter((file) => !REMOVED_STARTER_FILE_IDS.has(file.id) && !fileIds.has(file.id))
        .map(cloneFile);

    const mergedFiles = [...files, ...bundledFiles];
    const mergedFileIds = new Set(mergedFiles.map((file) => file.id));
    const edges = databaseEdges.filter(
        (edge) => mergedFileIds.has(edge.sourceFileId) && mergedFileIds.has(edge.targetFileId),
    );
    const edgeIds = new Set(edges.map((edge) => edge.id));
    const bundledEdges = bundledModel.edges
        .filter(
            (edge) =>
                !edgeIds.has(edge.id) &&
                mergedFileIds.has(edge.sourceFileId) &&
                mergedFileIds.has(edge.targetFileId),
        )
        .map(cloneEdge);

    return {
        model: {
            files: mergedFiles,
            edges: [...edges, ...bundledEdges],
        },
        addedBundledFilesCount: bundledFiles.length,
    };
}

function isMissingAnyRelationError(
    error: { message?: string; code?: string } | null | undefined,
    relationNames: string[],
) {
    if (!error) return false;

    const message = (error.message || '').toLowerCase();
    return (
        error.code === '42P01' ||
        message.includes('does not exist') ||
        relationNames.some((relationName) => message.includes(relationName))
    );
}

function isMissingRelationError(error: { message?: string; code?: string } | null | undefined) {
    return isMissingAnyRelationError(error, [FILE_TABLE, EDGE_TABLE]);
}

function isMissingWorkflowRelationError(error: { message?: string; code?: string } | null | undefined) {
    return isMissingAnyRelationError(error, [
        GENERATION_RUN_TABLE,
        GENERATION_ARTIFACT_TABLE,
        LINK_MENTION_TABLE,
    ]);
}

function toFile(row: FileOntologyFileRow): FileOntologyFile {
    return {
        id: row.id,
        title: row.title,
        summary: row.summary || '',
        content: row.content || '',
        x: Number(row.x ?? 120),
        y: Number(row.y ?? 120),
        width: Number(row.width ?? 440),
        height: Number(row.height ?? 340),
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
    };
}

function toEdge(row: FileOntologyEdgeRow): FileOntologyEdge {
    return {
        id: row.id,
        sourceFileId: row.source_file_id,
        targetFileId: row.target_file_id,
        label: row.label || 'relates to',
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
    };
}

function toFileRow(file: FileOntologyFile) {
    return {
        id: file.id,
        title: file.title,
        summary: file.summary,
        content: file.content,
        x: file.x,
        y: file.y,
        width: file.width,
        height: file.height,
    };
}

function toEdgeRow(edge: FileOntologyEdge) {
    return {
        id: edge.id,
        source_file_id: edge.sourceFileId,
        target_file_id: edge.targetFileId,
        label: edge.label,
    };
}

export function normalizeFileOntologyLookup(value: string | null | undefined) {
    return (value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function createFileOntologyId(title: string) {
    const slug = normalizeFileOntologyLookup(title) || 'markdown-file';
    const randomSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);

    return `${slug}-${randomSuffix}`;
}

export function createFileOntologyEdgeId(sourceFileId: string, targetFileId: string) {
    const randomSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);

    return `edge-${sourceFileId}-${targetFileId}-${randomSuffix}`;
}

export function createBlankFileOntologyFile(index: number): FileOntologyFile {
    const title = `Untitled File ${index + 1}`;
    const id = createFileOntologyId(title);
    const offset = index * 36;

    return {
        id,
        title,
        summary: 'Add a short hidden summary for hover tooltips.',
        content: `# ${title}\n\nWrite markdown here. Select text and use the link button to create [[${id}|file links]].`,
        x: 140 + offset,
        y: 140 + offset,
        width: 440,
        height: 340,
    };
}

export async function fetchFileOntologyModel(): Promise<FileOntologyLoadResult> {
    const starter = getStarterFileOntologyModel();

    const { data: fileRows, error: fileError } = await supabase
        .from(FILE_TABLE)
        .select(FILE_SELECT)
        .order('created_at', { ascending: true });

    if (fileError) {
        const warning = isMissingRelationError(fileError)
            ? FILE_ONTOLOGY_SCHEMA_SETUP_MESSAGE
            : `File ontology read failed: ${fileError.message}`;

        return {
            model: {
                files: starter.files.map(cloneFile),
                edges: starter.edges.map(cloneEdge),
            },
            source: 'starter',
            warning,
        };
    }

    const files = (fileRows || []).map((row) => toFile(row as FileOntologyFileRow));

    const { data: edgeRows, error: edgeError } = await supabase
        .from(EDGE_TABLE)
        .select(EDGE_SELECT)
        .order('created_at', { ascending: true });

    if (edgeError) {
        const merged = mergeBundledOntologyModel(files, [], starter);

        return {
            model: merged.model.files.length > 0
                ? merged.model
                : {
                      files: starter.files.map(cloneFile),
                      edges: starter.edges.map(cloneEdge),
                  },
            source: merged.model.files.length > 0 ? 'database' : 'starter',
            warning: isMissingRelationError(edgeError)
                ? FILE_ONTOLOGY_SCHEMA_SETUP_MESSAGE
                : `File ontology edge read failed: ${edgeError.message}`,
        };
    }

    if (files.length === 0) {
        return {
            model: {
                files: starter.files.map(cloneFile),
                edges: starter.edges.map(cloneEdge),
            },
            source: 'starter',
            warning: 'File ontology tables are empty. Showing a starter canvas until the first file is saved.',
        };
    }

    const merged = mergeBundledOntologyModel(
        files,
        (edgeRows || []).map((row) => toEdge(row as FileOntologyEdgeRow)),
        starter,
    );

    return {
        model: merged.model,
        source: 'database',
        warning:
            merged.addedBundledFilesCount > 0
                ? 'Database file ontology is missing bundled ontology nodes. Showing bundled seed nodes until the database migration is applied or the nodes are saved.'
                : undefined,
    };
}

export async function saveFileOntologyFile(file: FileOntologyFile) {
    const { data, error } = await supabase
        .from(FILE_TABLE)
        .upsert(toFileRow(file), { onConflict: 'id' })
        .select(FILE_SELECT)
        .single();

    if (error) throw new Error(error.message);
    return toFile(data as FileOntologyFileRow);
}

export async function saveFileOntologyFilePosition(file: FileOntologyFile) {
    const { data, error } = await supabase
        .from(FILE_TABLE)
        .update({
            x: file.x,
            y: file.y,
            width: file.width,
            height: file.height,
        })
        .eq('id', file.id)
        .select(FILE_SELECT)
        .single();

    if (error) throw new Error(error.message);
    return toFile(data as FileOntologyFileRow);
}

export async function deleteFileOntologyFile(fileId: string) {
    const { error } = await supabase.from(FILE_TABLE).delete().eq('id', fileId);
    if (error) throw new Error(error.message);
}

export async function saveFileOntologyEdge(edge: FileOntologyEdge) {
    const { data, error } = await supabase
        .from(EDGE_TABLE)
        .upsert(toEdgeRow(edge), { onConflict: 'id' })
        .select(EDGE_SELECT)
        .single();

    if (error) throw new Error(error.message);
    return toEdge(data as FileOntologyEdgeRow);
}

export async function deleteFileOntologyEdge(edgeId: string) {
    const { error } = await supabase.from(EDGE_TABLE).delete().eq('id', edgeId);
    if (error) throw new Error(error.message);
}

export async function saveFileOntologyWorkflowMetadata(input: FileOntologyWorkflowMetadataInput) {
    const { error: runError } = await supabase.from(GENERATION_RUN_TABLE).upsert(
        {
            id: input.run.id,
            intent: input.run.intent,
            source_type: input.run.sourceType,
            title: input.run.title,
            user_goal: input.run.userGoal,
            status: input.run.status,
        },
        { onConflict: 'id' },
    );

    if (runError) {
        if (isMissingWorkflowRelationError(runError)) {
            return { warning: FILE_ONTOLOGY_WORKFLOW_SCHEMA_SETUP_MESSAGE };
        }
        throw new Error(runError.message);
    }

    if (input.artifacts.length > 0) {
        const { error: artifactError } = await supabase.from(GENERATION_ARTIFACT_TABLE).upsert(
            input.artifacts.map((artifact) => ({
                id: artifact.id,
                run_id: artifact.runId,
                artifact_type: artifact.artifactType,
                content_json: artifact.contentJson,
            })),
            { onConflict: 'id' },
        );

        if (artifactError) throw new Error(artifactError.message);
    }

    if (input.linkMentions.length > 0) {
        const { error: mentionError } = await supabase.from(LINK_MENTION_TABLE).upsert(
            input.linkMentions.map((mention) => ({
                id: mention.id,
                source_file_id: mention.sourceFileId,
                target_file_id: mention.targetFileId,
                anchor_text: mention.anchorText,
                relation: mention.relation,
                context_excerpt: mention.contextExcerpt,
                generation_run_id: mention.generationRunId,
            })),
            { onConflict: 'id' },
        );

        if (mentionError) throw new Error(mentionError.message);
    }

    return {};
}
