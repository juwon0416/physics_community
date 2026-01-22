
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log("--- Debugging Purge Legacy ---");

    // 1. Check current count of 'section' nodes
    const { count: initialCount, error: countError } = await supabase
        .from('graph_nodes')
        .select('*', { count: 'exact', head: true }) // head: true only returns count
        .eq('type', 'section');

    if (countError) {
        console.error("Error checking initial count:", countError);
        return;
    }
    console.log(`Initial 'section' nodes count: ${initialCount}`);

    if (initialCount === 0) {
        console.log("No section nodes found. Purge already effective or RLS hiding them?");
    }

    // 2. Try to select one to see if we can read them
    const { data: sample, error: readError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('type', 'section')
        .limit(1);

    if (readError) {
        console.error("Error reading sample:", readError);
    } else {
        console.log("Sample node:", sample.length > 0 ? sample[0].label : "None visible");
    }

    // 3. Attempt Delete (simulating frontend)
    // We strictly select 'section' type
    // Note: If RLS prevents delete, this might return error OR count 0 without error.
    console.log("Attempting DELETE operation...");
    const { data: deletedData, error: deleteError, count: deletedCount } = await supabase
        .from('graph_nodes')
        .delete()
        .eq('type', 'section')
        .select(); // Select to see what returns

    if (deleteError) {
        console.error("DELETE Error:", deleteError);
    } else {
        console.log(`DELETE Success. Returned rows: ${deletedData?.length}`);
    }

    // 4. Verify count after
    const { count: finalCount } = await supabase
        .from('graph_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'section');

    console.log(`Final 'section' nodes count: ${finalCount}`);
}

runDebug();
