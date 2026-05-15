import fs from 'node:fs';
import path from 'node:path';
import { repoPath, normalizePath } from '../extraction/registry_core.js';

const root = process.cwd();
const obsidianRoot = repoPath(root, 'docs/obsidian');
const markdownFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(absolute);
  }
}

walk(obsidianRoot);

const basenames = new Set(markdownFiles.map((filePath) => path.basename(filePath, '.md')));
const relativeByBase = new Map(markdownFiles.map((filePath) => [path.basename(filePath, '.md'), normalizePath(path.relative(root, filePath))]));
const errors = [];
const linkPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

for (const filePath of markdownFiles) {
  const text = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = linkPattern.exec(text)) !== null) {
    const target = match[1].trim();
    const targetBase = path.basename(target);
    if (!basenames.has(targetBase)) {
      errors.push({
        file: normalizePath(path.relative(root, filePath)),
        id: target,
        reason: 'wikilink target does not resolve to a Markdown file under docs/obsidian',
      });
    }
  }
}

if (errors.length > 0) {
  console.error('Obsidian link validation failed:');
  errors.forEach((error) => console.error(`- ${error.file} :: ${error.id} :: ${error.reason}`));
  console.error('Known Markdown basenames include:');
  [...relativeByBase.entries()].slice(0, 50).forEach(([base, file]) => console.error(`- ${base} -> ${file}`));
  process.exit(1);
}

console.log('All Obsidian wikilinks resolve.');
