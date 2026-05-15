import { supabase } from './supabase';

const REQUIRED_KNOWLEDGE_TABLES = [
    'knowledge_repositories',
    'knowledge_source_documents',
    'knowledge_ingestion_runs',
    'knowledge_node_sources',
    'knowledge_change_sets',
] as const;

export const KNOWLEDGE_SCHEMA_SETUP_MESSAGE =
    'Knowledge import database is not initialized yet. Run database/sql/schema/knowledge_repository_schema.sql in Supabase SQL Editor first.';

function isMissingRelationMessage(message: string) {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('schema cache') ||
        normalized.includes('does not exist') ||
        normalized.includes('could not find the table') ||
        normalized.includes('relation') ||
        normalized.includes('invalid table')
    );
}

export function isKnowledgeSchemaMissingError(error: unknown) {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as { message?: string };
    return typeof candidate.message === 'string' && isMissingRelationMessage(candidate.message);
}

export async function checkKnowledgeSchemaReady() {
    try {
        const checks = await Promise.all(
            REQUIRED_KNOWLEDGE_TABLES.map(async (table) => {
                const { error } = await supabase.from(table).select('id').limit(1);
                return !error;
            }),
        );

        return checks.every(Boolean);
    } catch (error) {
        if (isKnowledgeSchemaMissingError(error)) {
            return false;
        }

        throw error;
    }
}
