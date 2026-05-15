import { buildSiteCodeGraph } from './registry_core.js';

const { graph } = buildSiteCodeGraph(process.cwd());
console.log(JSON.stringify({
  database_nodes: graph.nodes.filter((node) => node.type === 'database'),
  database_edges: graph.edges.filter((edge) => ['defines', 'migrates', 'queries'].includes(edge.type)),
}, null, 2));
