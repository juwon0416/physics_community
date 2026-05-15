function readEnv(name) {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : null;
}
export function requireEnv(name) {
    const value = readEnv(name);
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export function getSupabaseConfig() {
    const url = readEnv('MCP_SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL');
    const key = readEnv('MCP_SUPABASE_SERVICE_ROLE_KEY') ??
        readEnv('SUPABASE_SERVICE_ROLE_KEY') ??
        readEnv('MCP_SUPABASE_ANON_KEY') ??
        readEnv('VITE_SUPABASE_ANON_KEY');
    if (!url || !key) {
        throw new Error('Missing Supabase credentials. Set MCP_SUPABASE_URL and MCP_SUPABASE_SERVICE_ROLE_KEY for write access.');
    }
    return { url, key };
}
