import fs from 'node:fs';
import { readJson, repoPath } from '../extraction/registry_core.js';

const root = process.cwd();
const graph = readJson(root, 'docs/registry/site-code-graph.json');
const errors = [];

for (const node of graph.nodes || []) {
  if (node.status !== 'active') continue;
  if (!node.source_path) {
    errors.push({ id: node.id, reason: 'active node is missing source_path' });
    continue;
  }
  if (!fs.existsSync(repoPath(root, node.source_path))) {
    errors.push({ id: node.id, source_path: node.source_path, reason: 'source_path does not exist' });
  }
}

if (errors.length > 0) {
  console.error('Source path validation failed:');
  errors.forEach((error) => console.error(`- ${error.id} :: ${error.source_path || '<missing>'} :: ${error.reason}`));
  process.exit(1);
}

console.log('All active registry node source_path values exist.');
