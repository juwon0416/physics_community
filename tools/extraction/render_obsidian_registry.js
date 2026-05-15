import fs from 'node:fs';
import { readJson, renderObsidianFiles, writeRenderedObsidian, repoPath } from './registry_core.js';

const root = process.cwd();
const checkMode = process.argv.includes('--check');
const graph = readJson(root, 'docs/registry/site-code-graph.json');

if (checkMode) {
  const expected = renderObsidianFiles(graph);
  const mismatches = [];
  for (const [relativePath, content] of expected.entries()) {
    const absolutePath = repoPath(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      mismatches.push(`${relativePath}: missing`);
      continue;
    }
    const current = fs.readFileSync(absolutePath, 'utf8');
    if (current !== content) mismatches.push(`${relativePath}: content differs`);
  }
  if (mismatches.length > 0) {
    console.error('Generated Obsidian registry drift detected:');
    mismatches.slice(0, 50).forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }
  console.log('Generated Obsidian registry is up to date.');
  process.exit(0);
}

const files = writeRenderedObsidian(root, graph);
console.log(JSON.stringify({
  rendered_files: files.length,
  generated_root: 'docs/obsidian/generated',
}, null, 2));
