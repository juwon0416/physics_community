import { buildSiteCodeGraph, normalizeForDrift, readJson, writeJson } from './registry_core.js';

const root = process.cwd();
const checkMode = process.argv.includes('--check');
const { graph, manifest } = buildSiteCodeGraph(root);

if (checkMode) {
  const currentGraph = readJson(root, 'docs/registry/site-code-graph.json');
  const currentManifest = readJson(root, 'docs/registry/extraction-manifest.json');
  const graphMatches = JSON.stringify(normalizeForDrift(currentGraph)) === JSON.stringify(normalizeForDrift(graph));
  const manifestMatches = JSON.stringify(normalizeForDrift(currentManifest)) === JSON.stringify(normalizeForDrift(manifest));
  if (!graphMatches || !manifestMatches) {
    console.error('Registry drift detected. Run node tools/extraction/generate_site_code_graph.js.');
    process.exit(1);
  }
  console.log('Registry manifest is up to date.');
  process.exit(0);
}

writeJson(root, 'docs/registry/site-code-graph.json', graph);
writeJson(root, 'docs/registry/extraction-manifest.json', manifest);

console.log(JSON.stringify({
  branch: graph.meta.branch,
  commit: graph.meta.commit,
  files_scanned: graph.meta.scanned_file_count,
  nodes: graph.nodes.length,
  edges: graph.edges.length,
  warnings: graph.warnings.length,
}, null, 2));
