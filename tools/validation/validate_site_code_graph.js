import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_EVIDENCE_KINDS, readJson, repoPath } from '../extraction/registry_core.js';

const root = process.cwd();
const graph = readJson(root, 'docs/registry/site-code-graph.json');
const errors = [];

function fail(file, id, reason) {
  errors.push({ file, id, reason });
}

if (!graph.meta?.branch) fail('docs/registry/site-code-graph.json', 'meta.branch', 'missing branch');
if (!graph.meta?.commit) fail('docs/registry/site-code-graph.json', 'meta.commit', 'missing commit');
if (!graph.meta?.generated_at) fail('docs/registry/site-code-graph.json', 'meta.generated_at', 'missing generated_at');
if (!graph.meta?.extractor_version) fail('docs/registry/site-code-graph.json', 'meta.extractor_version', 'missing extractor_version');
if (!Array.isArray(graph.nodes)) fail('docs/registry/site-code-graph.json', 'nodes', 'nodes must be an array');
if (!Array.isArray(graph.edges)) fail('docs/registry/site-code-graph.json', 'edges', 'edges must be an array');

const nodeIds = new Set();
for (const node of graph.nodes || []) {
  if (!node.id) fail('docs/registry/site-code-graph.json', '<node>', 'missing id');
  if (node.id && !/^[a-z]+:[a-z0-9-]+$/.test(node.id)) fail('docs/registry/site-code-graph.json', node.id, 'id must be type:lowercase-kebab-case');
  if (nodeIds.has(node.id)) fail('docs/registry/site-code-graph.json', node.id, 'duplicate node id');
  nodeIds.add(node.id);
  for (const field of ['type', 'status', 'source_path', 'source_kind']) {
    if (!node[field]) fail('docs/registry/site-code-graph.json', node.id || '<node>', `missing ${field}`);
  }
}

for (const edge of graph.edges || []) {
  const edgeId = edge.id || `${edge.from}->${edge.to}`;
  if (!nodeIds.has(edge.from)) fail('docs/registry/site-code-graph.json', edgeId, `edge from does not resolve: ${edge.from}`);
  if (!nodeIds.has(edge.to)) fail('docs/registry/site-code-graph.json', edgeId, `edge to does not resolve: ${edge.to}`);
  if (!edge.type) fail('docs/registry/site-code-graph.json', edgeId, 'missing edge type');
  if (!['high', 'medium', 'low'].includes(edge.confidence)) fail('docs/registry/site-code-graph.json', edgeId, 'confidence must be high, medium, or low');
  if (!Array.isArray(edge.evidence) || edge.evidence.length === 0) {
    fail('docs/registry/site-code-graph.json', edgeId, 'edge evidence is required');
    continue;
  }
  for (const evidence of edge.evidence) {
    if (!ALLOWED_EVIDENCE_KINDS.has(evidence.kind)) fail('docs/registry/site-code-graph.json', edgeId, `invalid evidence kind: ${evidence.kind}`);
    if (!evidence.source_path) fail('docs/registry/site-code-graph.json', edgeId, 'evidence.source_path is required');
  }
}

const catalogPath = repoPath(root, 'docs/harness/system-catalog.md');
if (fs.existsSync(catalogPath)) {
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const requiredIds = [
    'agent:orchestrator',
    'agent:knowledge-architect',
    'agent:content-author',
    'agent:graph-steward',
    'agent:frontend-builder',
    'agent:harness-keeper',
    'skill:knowledge-reconstruction',
    'skill:website-content-authoring',
    'skill:graph-data-stewardship',
    'skill:frontend-site-implementation',
    'skill:harness-memory',
    'skill:obsidian-site-code-registry',
    'workflow:extract-github-structure',
    'workflow:update-site-code-registry',
    'workflow:add-physics-topic',
    'workflow:add-graph-relation',
    'workflow:fix-repeated-failure',
    'check:repo-extraction-success',
    'check:site-code-graph-schema-validity',
    'check:source-path-validity',
    'check:obsidian-link-integrity',
    'check:relation-evidence-validity',
    'check:generated-docs-not-manually-edited',
    'check:registry-drift',
    'check:provenance-integrity',
    'check:npm-build',
  ];
  requiredIds.forEach((id) => {
    if (!catalog.includes(id)) fail('docs/harness/system-catalog.md', id, 'required catalog ID is missing');
  });
} else {
  fail('docs/harness/system-catalog.md', 'system-catalog', 'file missing');
}

const skillPaths = {
  'skill:knowledge-reconstruction': '.codex/skills/knowledge-reconstruction/SKILL.md',
  'skill:website-content-authoring': '.codex/skills/website-content-authoring/SKILL.md',
  'skill:graph-data-stewardship': '.codex/skills/graph-data-stewardship/SKILL.md',
  'skill:frontend-site-implementation': '.codex/skills/frontend-site-implementation/SKILL.md',
  'skill:harness-memory': '.codex/skills/harness-memory/SKILL.md',
  'skill:obsidian-site-code-registry': '.codex/skills/obsidian-site-code-registry/SKILL.md',
};
for (const [id, relativePath] of Object.entries(skillPaths)) {
  if (!fs.existsSync(repoPath(root, relativePath))) fail('docs/harness/system-catalog.md', id, `skill path missing: ${relativePath}`);
}

if (errors.length > 0) {
  console.error('Site code graph validation failed:');
  errors.forEach((error) => console.error(`- ${error.file} :: ${error.id} :: ${error.reason}`));
  process.exit(1);
}

console.log('Site code graph schema, references, and relation evidence are valid.');
