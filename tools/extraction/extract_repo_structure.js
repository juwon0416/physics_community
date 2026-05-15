import { buildSiteCodeGraph } from './registry_core.js';

const { graph } = buildSiteCodeGraph(process.cwd());
console.log(JSON.stringify({
  meta: graph.meta,
  framework: graph.framework,
  file_index: graph.file_index,
  warnings: graph.warnings,
}, null, 2));
