import { supabase } from './supabase';

const ARCHIVE_TABLES = [
    'archive_topics',
    'archive_graph_nodes',
    'archive_graph_edges',
] as const;

export const ARCHIVE_SCHEMA_SETUP_MESSAGE =
    'Archive database is not initialized yet. Run database/sql/archive/archive_graph_schema.sql in Supabase SQL Editor first.';

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return '';
}

export function isArchiveSchemaMissingError(error: unknown) {
    const message = getErrorMessage(error).toLowerCase();
    return (
        message.includes('archive_') &&
        (message.includes('schema cache') || message.includes('could not find the table'))
    );
}

export async function checkArchiveSchemaReady() {
    for (const table of ARCHIVE_TABLES) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            if (isArchiveSchemaMissingError(error)) {
                return false;
            }

            throw error;
        }
    }

    return true;
}
