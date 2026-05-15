import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(
  env.VITE_SUPABASE_URL || env.SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY,
);

const paperId = 'paper_mosfet_gate_electrostatics';
const graphNodeId = 'mosfet-gate-electrostatics';

const [paper, nodes, edges, graphNode] = await Promise.all([
  supabase.from('ontology_papers').select('id,graph_node_id,title').eq('id', paperId).single(),
  supabase.from('ontology_nodes').select('id', { count: 'exact', head: true }).eq('paper_id', paperId),
  supabase.from('ontology_edges').select('id', { count: 'exact', head: true }).eq('paper_id', paperId),
  supabase.from('graph_nodes').select('id,type,label').eq('id', graphNodeId).single(),
]);

const errors = [paper.error, nodes.error, edges.error, graphNode.error]
  .filter(Boolean)
  .map((error) => error.message);

if (errors.length > 0) {
  throw new Error(errors.join('; '));
}

console.log(JSON.stringify({
  paper: paper.data,
  ontologyNodes: nodes.count,
  ontologyEdges: edges.count,
  graphNode: graphNode.data,
}));
