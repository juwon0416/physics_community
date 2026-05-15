import { buildSiteCodeGraph } from './registry_core.js';

const { graph } = buildSiteCodeGraph(process.cwd());
console.log(JSON.stringify({
  import_edges: graph.edges.filter((edge) => edge.type === 'imports'),
  unresolved_import_warnings: graph.warnings.filter((warning) => warning.message.includes('import')),
}, null, 2));
