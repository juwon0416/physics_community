import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env.js';
let client = null;
export function getSupabase() {
    if (client)
        return client;
    const { url, key } = getSupabaseConfig();
    client = createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return client;
}
