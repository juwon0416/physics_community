import { buildSiteCodeGraph } from './registry_core.js';

const { graph } = buildSiteCodeGraph(process.cwd());
console.log(JSON.stringify({
  routes: graph.nodes.filter((node) => node.type === 'route'),
  pages: graph.nodes.filter((node) => node.type === 'page'),
  route_edges: graph.edges.filter((edge) => edge.type === 'renders'),
}, null, 2));
