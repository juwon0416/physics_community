import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const EXTRACTOR_VERSION = '0.1.0';

export const ALLOWED_EVIDENCE_KINDS = new Set([
  'static-import',
  'dynamic-import',
  'route-definition',
  'file-path-convention',
  'api-handler-path',
  'supabase-query',
  'sql-schema',
  'migration',
  'config',
  'manual-curated-note',
]);

const SOURCE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.sql',
  '.toml',
  '.md',
];

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css'];

const CONFIG_FILES = [
  'package.json',
  'vite.config.js',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'eslint.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'vercel.json',
  'mcp-server/package.json',
  'mcp-server/tsconfig.json',
  '.codex/config.toml',
  '.codex/project_pipeline_config.toml',
  'docs/registry/site-code-graph.schema.json',
];

const CORE_SOURCE_FILES = [
  'src/main.tsx',
  'src/App.tsx',
  'src/data/storage.ts',
  'src/data/seed.ts',
  'src/data/topicContentOverrides.ts',
  'src/data/archiveFundamentals.ts',
  'src/lib/archiveSchema.ts',
  'src/lib/backlinks.ts',
  'src/lib/concepts.ts',
  'src/lib/graphLayouts.ts',
  'src/lib/graphModel.ts',
  'src/lib/graphSpheres.ts',
  'src/lib/knowledgePipeline.ts',
  'src/lib/knowledgeSchema.ts',
  'src/lib/knowledgeTaxonomy.ts',
  'src/lib/knowledgeWriting.ts',
  'src/lib/renderTopicMath.ts',
  'src/lib/sourceText.ts',
  'src/lib/supabase.ts',
  'src/lib/theme.tsx',
  'src/lib/topicSlug.ts',
  'mcp-server/src/index.ts',
  'mcp-server/src/repository.ts',
  'mcp-server/src/supabase.ts',
  'tools/extraction/generate_site_code_graph.js',
  'tools/extraction/render_obsidian_registry.js',
  'tools/validation/validate_site_code_graph.js',
  'tools/validation/validate_source_paths.js',
  'tools/validation/validate_obsidian_links.js',
  'tools/validation/validate_registry_drift.js',
];

const EXCLUDED_PREFIXES = [
  '.git/',
  '.vercel/',
  'node_modules/',
  'dist/',
  'dist-ssr/',
  'trash/',
  'archive파일들/',
  'mcp-server/build/',
  'docs/obsidian/',
];

const EXCLUDED_FILES = new Set([
  'docs/registry/site-code-graph.json',
  'docs/registry/extraction-manifest.json',
]);

export function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function repoPath(root, relativePath) {
  return path.join(root, ...normalizePath(relativePath).split('/'));
}

export function readText(root, relativePath) {
  return fs.readFileSync(repoPath(root, relativePath), 'utf8');
}

export function pathExists(root, relativePath) {
  return fs.existsSync(repoPath(root, relativePath));
}

export function ensureDir(root, relativePath) {
  fs.mkdirSync(repoPath(root, relativePath), { recursive: true });
}

export function writeText(root, relativePath, content) {
  ensureDir(root, path.dirname(relativePath));
  fs.writeFileSync(repoPath(root, relativePath), content, 'utf8');
}

export function writeJson(root, relativePath, value) {
  writeText(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function kebab(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s.:/\\]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function nodeFileName(id) {
  return `${id.replace(':', '-')}.md`;
}

export function nodeWiki(id) {
  return `[[${id.replace(':', '-')}]]`;
}

export function categoryForNode(node) {
  if (node.type === 'route') return 'routes';
  if (node.type === 'page') return 'pages';
  if (node.type === 'component') return 'components';
  if (node.type === 'api') return 'api';
  if (node.type === 'database' || node.id.startsWith('table:')) return 'database';
  if (node.type === 'config') return 'configs';
  return 'files';
}

function gitText(root, args, fallback = '') {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    const manual = readGitMetadata(root);
    if (args.join(' ') === 'branch --show-current') return manual.branch || fallback;
    if (args.join(' ') === 'rev-parse HEAD') return manual.commit || fallback;
    return fallback;
  }
}

function gitList(root, args) {
  try {
    const output = execFileSync('git', args, { cwd: root });
    return output
      .toString('utf8')
      .split('\0')
      .map(normalizePath)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readGitMetadata(root) {
  const gitRoot = repoPath(root, '.git');
  const headPath = path.join(gitRoot, 'HEAD');
  if (!fs.existsSync(headPath)) return { branch: '', commit: '' };

  const head = fs.readFileSync(headPath, 'utf8').trim();
  if (!head.startsWith('ref:')) return { branch: 'detached', commit: head };

  const ref = head.replace(/^ref:\s*/, '').trim();
  const branch = ref.replace(/^refs\/heads\//, '');
  const refPath = path.join(gitRoot, ...ref.split('/'));
  if (fs.existsSync(refPath)) {
    return { branch, commit: fs.readFileSync(refPath, 'utf8').trim() };
  }

  const packedRefsPath = path.join(gitRoot, 'packed-refs');
  if (fs.existsSync(packedRefsPath)) {
    const packed = fs.readFileSync(packedRefsPath, 'utf8').split(/\r?\n/);
    for (const line of packed) {
      if (line.endsWith(` ${ref}`)) {
        return { branch, commit: line.split(/\s+/)[0] };
      }
    }
  }

  return { branch, commit: '' };
}

function listFilesFromFileSystem(root) {
  const files = [];
  const walk = (relativeDirectory) => {
    const absoluteDirectory = repoPath(root, relativeDirectory || '.');
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = normalizePath(path.posix.join(relativeDirectory, entry.name));
      if (entry.isDirectory()) {
        const directoryPrefix = `${relativePath}/`;
        if (EXCLUDED_PREFIXES.some((prefix) => directoryPrefix.startsWith(prefix))) continue;
        if (directoryPrefix.includes('/node_modules/')) continue;
        if (directoryPrefix.includes('/dist/')) continue;
        if (directoryPrefix.includes('/build/')) continue;
        walk(relativePath);
        continue;
      }
      if (entry.isFile()) files.push(relativePath);
    }
  };
  walk('');
  return files.sort();
}

function shouldScanFile(filePath) {
  const normalized = normalizePath(filePath);
  if (EXCLUDED_FILES.has(normalized)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false;
  if (normalized.includes('/node_modules/')) return false;
  if (normalized.includes('/dist/')) return false;
  if (normalized.includes('/build/')) return false;
  if (normalized.endsWith('.local')) return false;
  return SOURCE_EXTENSIONS.includes(path.extname(normalized));
}

function sourceKindForPath(filePath) {
  if (filePath.endsWith('.sql')) return filePath.includes('migration') ? 'migration' : 'sql-schema';
  if (filePath.startsWith('src/pages/')) return 'react-page';
  if (filePath.startsWith('src/components/')) return 'react-component';
  if (filePath.startsWith('mcp-server/src/')) return 'mcp-server-source';
  if (filePath.startsWith('tools/')) return 'harness-tool';
  if (CONFIG_FILES.includes(filePath)) return 'config';
  return 'github-repo';
}

function fileKind(filePath) {
  if (CONFIG_FILES.includes(filePath)) return 'config';
  if (filePath.startsWith('src/pages/')) return 'page-source';
  if (filePath.startsWith('src/components/')) return 'component-source';
  if (filePath.startsWith('mcp-server/src/')) return 'mcp-source';
  if (filePath.startsWith('database/sql/')) return 'sql';
  if (filePath.startsWith('tools/')) return 'harness-tool';
  if (filePath.startsWith('docs/')) return 'docs';
  return 'source';
}

function baseNameNoExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function parseImports(sourceText) {
  const imports = [];
  const staticPatterns = [
    /\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]+\s+from\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of staticPatterns) {
    let match;
    while ((match = pattern.exec(sourceText)) !== null) {
      imports.push({ specifier: match[1], kind: 'static-import' });
    }
  }

  const dynamicPattern = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = dynamicPattern.exec(sourceText)) !== null) {
    imports.push({ specifier: match[1], kind: 'dynamic-import' });
  }
  return imports;
}

function parseNamedImports(sourceText) {
  const imports = new Map();
  const pattern = /\bimport\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(sourceText)) !== null) {
    const names = match[1]
      .split(',')
      .map((value) => value.trim().split(/\s+as\s+/i).pop()?.trim())
      .filter(Boolean);
    names.forEach((name) => imports.set(name, match[2]));
  }

  const defaultPattern = /\bimport\s+([A-Z][A-Za-z0-9_]*)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultPattern.exec(sourceText)) !== null) {
    imports.set(match[1], match[2]);
  }
  return imports;
}

function resolveImport(root, sourcePath, specifier, fileSet) {
  if (!specifier.startsWith('.')) return null;
  const sourceDir = path.dirname(sourcePath);
  const raw = normalizePath(path.posix.normalize(path.posix.join(sourceDir, specifier)));
  const candidates = [raw];
  const rawExt = path.posix.extname(raw);
  if (['.js', '.jsx', '.mjs', '.cjs'].includes(rawExt)) {
    const withoutExt = raw.slice(0, -rawExt.length);
    candidates.push(`${withoutExt}.ts`, `${withoutExt}.tsx`);
  }
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${raw}${ext}`));
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${raw}/index${ext}`));

  for (const candidate of candidates) {
    if (fileSet.has(candidate) && pathExists(root, candidate)) return candidate;
  }
  return null;
}

function uniqueNodeId(type, label, filePath, nodesById) {
  const primary = `${type}:${kebab(label)}`;
  if (!nodesById.has(primary)) return primary;
  const parent = path.dirname(filePath).split('/').filter(Boolean).pop() || type;
  const withParent = `${type}:${kebab(`${parent}-${label}`)}`;
  if (!nodesById.has(withParent)) return withParent;
  return `${type}:${kebab(`${parent}-${label}-${nodesById.size + 1}`)}`;
}

function makeEvidence(kind, sourcePath, detail = undefined) {
  return {
    kind,
    source_path: sourcePath,
    ...(detail ? { detail } : {}),
  };
}

function addEdge(edgesByKey, from, to, type, evidence, confidence = 'high') {
  if (!from || !to || from === to) return;
  const normalizedEvidence = Array.isArray(evidence) ? evidence : [evidence];
  const key = `${from}|${to}|${type}|${normalizedEvidence.map((item) => `${item.kind}:${item.source_path}:${item.detail || ''}`).join(',')}`;
  if (edgesByKey.has(key)) return;
  edgesByKey.set(key, {
    id: `edge:${kebab(`${from}-${type}-${to}`)}`,
    from,
    to,
    type,
    evidence: normalizedEvidence,
    confidence,
  });
}

function parseRoutes(root, fileSet, nodesById, sourcePathToNodeId, edgesByKey, warnings) {
  const appPath = 'src/App.tsx';
  if (!fileSet.has(appPath) || !pathExists(root, appPath)) return;

  const source = readText(root, appPath);
  const namedImports = parseNamedImports(source);
  const routePattern = /<Route\b([^>]*)>/g;
  let match;

  while ((match = routePattern.exec(source)) !== null) {
    const attrs = match[1];
    const isIndex = /\bindex\b/.test(attrs);
    const pathMatch = attrs.match(/\bpath=["']([^"']+)["']/);
    const elementMatch = attrs.match(/\belement=\{\s*<([A-Z][A-Za-z0-9_]*)\b/);
    const componentName = elementMatch?.[1] || null;
    const rawPath = isIndex ? '/' : pathMatch?.[1] || null;
    if (!rawPath) continue;

    const routePath =
      rawPath === '/' ? '/' :
        rawPath.startsWith('/') ? rawPath :
          `/${rawPath}`;
    const id =
      isIndex ? 'route:home' :
        rawPath === '/' && componentName === 'Layout' ? 'route:root-layout' :
          rawPath === '*' ? 'route:not-found' :
            `route:${kebab(routePath.replace(/:/g, ''))}`;

    if (!nodesById.has(id)) {
      nodesById.set(id, {
        id,
        type: 'route',
        status: 'active',
        label: routePath,
        source_path: appPath,
        source_kind: 'route-definition',
        route_path: routePath,
        generated_from: ['git-ls-files', 'route-definition'],
      });
    }

    if (!componentName) continue;
    const specifier = namedImports.get(componentName);
    if (!specifier) {
      warnings.push({
        level: 'warning',
        source_path: appPath,
        message: `Route component ${componentName} does not have a simple import in App.tsx.`,
      });
      continue;
    }

    const targetPath = resolveImport(root, appPath, specifier, fileSet);
    const targetId = targetPath ? sourcePathToNodeId.get(targetPath) : null;
    if (!targetId) {
      warnings.push({
        level: 'warning',
        source_path: appPath,
        message: `Route ${routePath} target ${componentName} could not be resolved to a registry node.`,
      });
      continue;
    }

    addEdge(
      edgesByKey,
      id,
      targetId,
      'renders',
      makeEvidence('route-definition', appPath, `<Route ${attrs.trim()}>`),
      'high',
    );
  }
}

function parseApiNodes(root, fileSet, nodesById, sourcePathToNodeId, edgesByKey) {
  const apiPath = 'mcp-server/src/index.ts';
  if (!fileSet.has(apiPath) || !pathExists(root, apiPath)) return;

  const source = readText(root, apiPath);
  const pattern = /server\.register(Tool|Resource|Prompt)\(\s*['"]([^'"]+)['"]/g;
  let match;
  const indexNodeId = sourcePathToNodeId.get(apiPath);

  while ((match = pattern.exec(source)) !== null) {
    const apiKind = match[1].toLowerCase();
    const apiName = match[2];
    const id = `api:${kebab(apiName)}`;
    nodesById.set(id, {
      id,
      type: 'api',
      status: 'active',
      label: apiName,
      source_path: apiPath,
      source_kind: `mcp-${apiKind}`,
      generated_from: ['git-ls-files', 'api-handler-path'],
    });

    if (indexNodeId) {
      addEdge(
        edgesByKey,
        id,
        indexNodeId,
        'defined-in',
        makeEvidence('api-handler-path', apiPath, `server.register${match[1]}('${apiName}')`),
        'high',
      );
    }
  }
}

function parseSqlNodes(root, scannedFiles, nodesById, sourcePathToNodeId, edgesByKey) {
  const sqlFiles = scannedFiles
    .filter((filePath) => filePath.startsWith('database/sql/') && filePath.endsWith('.sql'))
    .sort();

  const tableByName = new Map();

  for (const sqlPath of sqlFiles) {
    const schemaId = uniqueNodeId('database', baseNameNoExt(sqlPath), sqlPath, nodesById);
    const schemaKind = sqlPath.includes('migration') ? 'migration' : 'sql-schema';
    nodesById.set(schemaId, {
      id: schemaId,
      type: 'database',
      status: 'active',
      label: baseNameNoExt(sqlPath),
      source_path: sqlPath,
      source_kind: schemaKind,
      generated_from: ['git-ls-files', schemaKind],
    });
    if (!sourcePathToNodeId.has(sqlPath)) sourcePathToNodeId.set(sqlPath, schemaId);

    const source = readText(root, sqlPath);
    const createPattern = /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?["']?([a-zA-Z0-9_.]+)["']?/gi;
    let match;
    while ((match = createPattern.exec(source)) !== null) {
      const tableName = match[1].split('.').pop();
      const tableId = `table:${kebab(tableName)}`;
      if (!nodesById.has(tableId)) {
        nodesById.set(tableId, {
          id: tableId,
          type: 'database',
          status: 'active',
          label: tableName,
          source_path: sqlPath,
          source_kind: 'sql-table',
          generated_from: ['git-ls-files', 'sql-schema'],
        });
        tableByName.set(tableName, tableId);
      }

      addEdge(
        edgesByKey,
        schemaId,
        tableId,
        'defines',
        makeEvidence(schemaKind === 'migration' ? 'migration' : 'sql-schema', sqlPath, `create table ${tableName}`),
        schemaKind === 'migration' ? 'medium' : 'high',
      );
    }

    const alterPattern = /\balter\s+table\s+["']?([a-zA-Z0-9_.]+)["']?/gi;
    while ((match = alterPattern.exec(source)) !== null) {
      const tableName = match[1].split('.').pop();
      const tableId = tableByName.get(tableName) || `table:${kebab(tableName)}`;
      if (!nodesById.has(tableId)) {
        nodesById.set(tableId, {
          id: tableId,
          type: 'database',
          status: 'active',
          label: tableName,
          source_path: sqlPath,
          source_kind: 'sql-table',
          generated_from: ['git-ls-files', 'migration'],
        });
      }
      addEdge(
        edgesByKey,
        schemaId,
        tableId,
        'migrates',
        makeEvidence('migration', sqlPath, `alter table ${tableName}`),
        'medium',
      );
    }
  }
}

function parseSupabaseQueries(root, scannedFiles, nodesById, sourcePathToNodeId, edgesByKey) {
  const tableIds = new Set([...nodesById.keys()].filter((id) => id.startsWith('table:')));
  const queryPattern = /\.from\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const filePath of scannedFiles) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) continue;
    const sourceId = sourcePathToNodeId.get(filePath);
    if (!sourceId || !pathExists(root, filePath)) continue;

    const source = readText(root, filePath);
    let match;
    while ((match = queryPattern.exec(source)) !== null) {
      const tableId = `table:${kebab(match[1])}`;
      if (!tableIds.has(tableId)) continue;
      addEdge(
        edgesByKey,
        sourceId,
        tableId,
        'queries',
        makeEvidence('supabase-query', filePath, `.from('${match[1]}')`),
        'high',
      );
    }
  }
}

export function listRepositoryFiles(root) {
  let trackedFiles = gitList(root, ['ls-files', '-z']);
  let untrackedFiles = gitList(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  let fileListMode = 'git-ls-files';
  if (trackedFiles.length === 0 && untrackedFiles.length === 0) {
    fileListMode = 'filesystem-fallback';
    trackedFiles = [];
    untrackedFiles = listFilesFromFileSystem(root);
  }
  const trackedSet = new Set(trackedFiles);
  const untrackedSet = new Set(untrackedFiles);
  const allCandidateFiles = [...new Set([...trackedFiles, ...untrackedFiles])].sort();
  const missingTrackedFiles = trackedFiles.filter((filePath) => !pathExists(root, filePath));
  const existingFiles = allCandidateFiles.filter((filePath) => pathExists(root, filePath));
  const scannedFiles = existingFiles.filter(shouldScanFile);

  return {
    trackedFiles,
    untrackedFiles,
    trackedSet,
    untrackedSet,
    missingTrackedFiles,
    existingFiles,
    scannedFiles,
    fileListMode,
  };
}

export function buildSiteCodeGraph(root = process.cwd()) {
  const branch = gitText(root, ['branch', '--show-current'], 'unknown');
  const commit = gitText(root, ['rev-parse', 'HEAD'], 'unknown');
  const {
    trackedFiles,
    untrackedFiles,
    trackedSet,
    untrackedSet,
    missingTrackedFiles,
    scannedFiles,
    fileListMode,
  } = listRepositoryFiles(root);

  const fileSet = new Set(scannedFiles);
  const nodesById = new Map();
  const edgesByKey = new Map();
  const sourcePathToNodeId = new Map();
  const warnings = [];

  if (fileListMode === 'filesystem-fallback') {
    warnings.push({
      level: 'warning',
      source_path: '.git',
      message: 'Node child_process could not execute git ls-files in this sandbox, so extraction used a filesystem fallback and manual .git metadata parsing.',
    });
  }

  missingTrackedFiles.forEach((filePath) => {
    warnings.push({
      level: 'warning',
      source_path: filePath,
      message: 'Tracked path is missing from the current working tree and was excluded from active nodes.',
    });
  });

  const importRecords = new Map();
  const incomingCounts = new Map();
  for (const sourcePath of scannedFiles) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(sourcePath)) continue;
    const imports = parseImports(readText(root, sourcePath))
      .map((entry) => ({
        ...entry,
        target_path: resolveImport(root, sourcePath, entry.specifier, fileSet),
      }));
    importRecords.set(sourcePath, imports);
    imports.forEach((entry) => {
      if (entry.target_path) {
        incomingCounts.set(entry.target_path, (incomingCounts.get(entry.target_path) || 0) + 1);
      } else if (entry.specifier.startsWith('.')) {
        warnings.push({
          level: 'warning',
          source_path: sourcePath,
          message: `Could not resolve relative import ${entry.specifier}.`,
        });
      }
    });
  }

  const addNode = (node, { primary = true } = {}) => {
    nodesById.set(node.id, node);
    if (primary && !sourcePathToNodeId.has(node.source_path)) {
      sourcePathToNodeId.set(node.source_path, node.id);
    }
  };

  CONFIG_FILES
    .filter((filePath) => fileSet.has(filePath))
    .forEach((filePath) => {
      const id = uniqueNodeId('config', baseNameNoExt(filePath), filePath, nodesById);
      addNode({
        id,
        type: 'config',
        status: 'active',
        label: filePath,
        source_path: filePath,
        source_kind: 'config',
        generated_from: ['git-ls-files', 'config'],
      });
    });

  scannedFiles
    .filter((filePath) => filePath.startsWith('src/pages/') && filePath.endsWith('.tsx'))
    .sort()
    .forEach((filePath) => {
      const id = uniqueNodeId('page', baseNameNoExt(filePath), filePath, nodesById);
      addNode({
        id,
        type: 'page',
        status: 'active',
        label: baseNameNoExt(filePath),
        source_path: filePath,
        source_kind: 'react-page',
        generated_from: ['git-ls-files', 'file-path-convention'],
      });
    });

  scannedFiles
    .filter((filePath) => filePath.startsWith('src/components/') && filePath.endsWith('.tsx'))
    .filter((filePath) => baseNameNoExt(filePath).toLowerCase() !== 'index')
    .sort()
    .forEach((filePath) => {
      const id = uniqueNodeId('component', baseNameNoExt(filePath), filePath, nodesById);
      addNode({
        id,
        type: 'component',
        status: 'active',
        label: baseNameNoExt(filePath),
        source_path: filePath,
        source_kind: 'react-component',
        generated_from: ['git-ls-files', 'file-path-convention'],
      });
    });

  CORE_SOURCE_FILES
    .filter((filePath) => fileSet.has(filePath))
    .forEach((filePath) => {
      if (sourcePathToNodeId.has(filePath)) return;
      const id = uniqueNodeId('file', baseNameNoExt(filePath), filePath, nodesById);
      addNode({
        id,
        type: 'file',
        status: 'active',
        label: filePath,
        source_path: filePath,
        source_kind: sourceKindForPath(filePath),
        generated_from: ['git-ls-files', 'curated-core-file-list'],
      });
    });

  [...incomingCounts.entries()]
    .filter(([filePath, count]) => count >= 2 && /^(src\/lib|src\/data)\//.test(filePath))
    .filter(([filePath]) => !sourcePathToNodeId.has(filePath))
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([filePath]) => {
      const id = uniqueNodeId('file', baseNameNoExt(filePath), filePath, nodesById);
      addNode({
        id,
        type: 'file',
        status: 'active',
        label: filePath,
        source_path: filePath,
        source_kind: sourceKindForPath(filePath),
        generated_from: ['git-ls-files', 'import-graph'],
      });
    });

  parseSqlNodes(root, scannedFiles, nodesById, sourcePathToNodeId, edgesByKey);
  parseApiNodes(root, fileSet, nodesById, sourcePathToNodeId, edgesByKey);
  parseRoutes(root, fileSet, nodesById, sourcePathToNodeId, edgesByKey, warnings);

  for (const [sourcePath, imports] of importRecords.entries()) {
    const sourceId = sourcePathToNodeId.get(sourcePath);
    if (!sourceId) continue;
    for (const entry of imports) {
      if (!entry.target_path) continue;
      const targetId = sourcePathToNodeId.get(entry.target_path);
      if (!targetId) continue;
      addEdge(
        edgesByKey,
        sourceId,
        targetId,
        'imports',
        makeEvidence(entry.kind, sourcePath, entry.specifier),
        entry.kind === 'dynamic-import' ? 'medium' : 'high',
      );
    }
  }

  parseSupabaseQueries(root, scannedFiles, nodesById, sourcePathToNodeId, edgesByKey);

  const nodeBySource = new Map();
  for (const node of nodesById.values()) {
    if (!nodeBySource.has(node.source_path)) nodeBySource.set(node.source_path, []);
    nodeBySource.get(node.source_path).push(node.id);
  }

  const fileIndex = scannedFiles.map((filePath) => ({
    path: filePath,
    tracked: trackedSet.has(filePath),
    untracked: untrackedSet.has(filePath),
    kind: fileKind(filePath),
    node_ids: nodeBySource.get(filePath) || [],
  }));

  const nodes = [...nodesById.values()].sort((left, right) => left.id.localeCompare(right.id));
  const edges = [...edgesByKey.values()].sort((left, right) => `${left.from}|${left.to}|${left.type}`.localeCompare(`${right.from}|${right.to}|${right.type}`));

  const graph = {
    meta: {
      branch,
      commit,
      generated_at: new Date().toISOString(),
      extractor_version: EXTRACTOR_VERSION,
      file_list_mode: fileListMode,
      tracked_file_count: trackedFiles.length,
      untracked_file_count: untrackedFiles.length,
      scanned_file_count: scannedFiles.length,
      node_count: nodes.length,
      edge_count: edges.length,
    },
    framework: {
      app: 'Vite + React + TypeScript',
      routing: 'react-router-dom',
      database: 'Supabase/PostgreSQL',
      mcp_server: 'mcp-server',
    },
    nodes,
    edges,
    file_index: fileIndex,
    warnings,
  };

  const manifest = {
    branch,
    commit,
    extraction_command: 'node tools/extraction/generate_site_code_graph.js',
    extraction_timestamp: graph.meta.generated_at,
    extractor_version: EXTRACTOR_VERSION,
    scanned_paths: [
      'src/',
      'mcp-server/src/',
      'database/sql/',
      'tools/',
      'docs/harness/',
      'config files',
    ],
    generated_files: [
      'docs/registry/site-code-graph.json',
      'docs/registry/extraction-manifest.json',
      'docs/obsidian/00-index.md',
      'docs/obsidian/generated/website-structure.md',
      'docs/obsidian/generated/code-structure.md',
      'docs/obsidian/generated/relation-map.md',
      'docs/obsidian/generated/extraction-log.md',
      'docs/obsidian/generated/nodes/**',
    ],
    counts: {
      tracked_files: trackedFiles.length,
      untracked_files: untrackedFiles.length,
      scanned_files: scannedFiles.length,
      nodes: nodes.length,
      edges: edges.length,
      warnings: warnings.length,
    },
    warnings,
  };

  return { graph, manifest };
}

function yamlScalar(value) {
  if (Array.isArray(value)) return value.map((item) => `  - ${item}`).join('\n');
  return String(value).includes(':') ? `"${value}"` : String(value);
}

function renderNodeFrontmatter(node, incoming, outgoing) {
  const evidence = outgoing.flatMap((edge) => edge.evidence || []).slice(0, 5);
  const lines = [
    '---',
    `id: ${node.id}`,
    `type: ${node.type}`,
    `status: ${node.status}`,
    `source_path: ${node.source_path}`,
    `source_kind: ${node.source_kind}`,
    'generated_from:',
    ...(node.generated_from || []).map((item) => `  - ${item}`),
    'relations:',
    '  outgoing:',
    ...(outgoing.length ? outgoing.map((edge) => `    - ${edge.to}`) : ['    - none']),
    '  incoming:',
    ...(incoming.length ? incoming.map((edge) => `    - ${edge.from}`) : ['    - none']),
    'evidence:',
    ...(evidence.length
      ? evidence.map((item) => `  - kind: ${yamlScalar(item.kind)}\n    source_path: ${yamlScalar(item.source_path)}${item.detail ? `\n    detail: ${JSON.stringify(item.detail)}` : ''}`)
      : ['  - kind: file-path-convention', `    source_path: ${yamlScalar(node.source_path)}`]),
    `confidence: ${outgoing.some((edge) => edge.confidence === 'low') ? 'low' : outgoing.some((edge) => edge.confidence === 'medium') ? 'medium' : 'high'}`,
    '---',
  ];
  return `${lines.join('\n')}\n`;
}

function renderNodeFile(node, graph) {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const outgoing = graph.edges.filter((edge) => edge.from === node.id);
  const frontmatter = renderNodeFrontmatter(node, incoming, outgoing);
  const relationRows = [...outgoing.map((edge) => ({ direction: 'out', edge })), ...incoming.map((edge) => ({ direction: 'in', edge }))];
  const relationTable = relationRows.length
    ? relationRows.map(({ direction, edge }) => {
      const otherId = direction === 'out' ? edge.to : edge.from;
      const evidence = edge.evidence.map((item) => `${item.kind} @ ${item.source_path}`).join('; ');
      return `| ${direction} | ${edge.type} | ${nodeWiki(otherId)} | ${edge.confidence} | ${evidence} |`;
    }).join('\n')
    : '| none | none | none | none | none |';

  return `${frontmatter}\n# ${node.id}\n\n> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.\n\n- Type: \`${node.type}\`\n- Status: \`${node.status}\`\n- Source path: \`${node.source_path}\`\n- Source kind: \`${node.source_kind}\`\n\n## Relations\n\n| Direction | Type | Node | Confidence | Evidence |\n| --- | --- | --- | --- | --- |\n${relationTable}\n`;
}

function renderWebsiteStructure(graph) {
  const routeRows = graph.nodes
    .filter((node) => node.type === 'route')
    .map((route) => {
      const targets = graph.edges.filter((edge) => edge.from === route.id && edge.type === 'renders').map((edge) => nodeWiki(edge.to)).join(', ') || 'none';
      return `| ${nodeWiki(route.id)} | \`${route.route_path || route.label}\` | ${targets} | \`${route.source_path}\` |`;
    })
    .join('\n');

  const pageRows = graph.nodes
    .filter((node) => node.type === 'page')
    .map((page) => `| ${nodeWiki(page.id)} | \`${page.source_path}\` |`)
    .join('\n');

  return `# Website Structure\n\n> GENERATED FILE. Do not edit directly.\n\n## Routes\n\n| Route | Path | Renders | Evidence source |\n| --- | --- | --- | --- |\n${routeRows || '| none | none | none | none |'}\n\n## Pages\n\n| Page | Source path |\n| --- | --- |\n${pageRows || '| none | none |'}\n`;
}

function renderCodeStructure(graph) {
  const groups = new Map();
  graph.file_index.forEach((entry) => {
    const top = entry.path.split('/')[0] || '.';
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top).push(entry);
  });

  const groupText = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([top, entries]) => {
      const important = entries.filter((entry) => entry.node_ids.length > 0);
      const sample = important.slice(0, 25).map((entry) => {
        const links = entry.node_ids.map(nodeWiki).join(', ');
        return `- \`${entry.path}\`${links ? ` -> ${links}` : ''}`;
      }).join('\n') || '- No registry nodes in this group.';
      return `## ${top}\n\n- Files scanned: ${entries.length}\n- Registry nodes: ${important.length}\n\n${sample}`;
    })
    .join('\n\n');

  return `# Code Structure\n\n> GENERATED FILE. Do not edit directly.\n\n- Files scanned: ${graph.meta.scanned_file_count}\n- Nodes generated: ${graph.nodes.length}\n- Edges generated: ${graph.edges.length}\n\n${groupText}\n`;
}

function renderRelationMap(graph) {
  const rows = graph.edges.map((edge) => {
    const evidence = edge.evidence.map((item) => `${item.kind} @ ${item.source_path}`).join('; ');
    return `| ${nodeWiki(edge.from)} | ${edge.type} | ${nodeWiki(edge.to)} | ${edge.confidence} | ${evidence} |`;
  }).join('\n');

  return `# Relation Map\n\n> GENERATED FILE. Do not edit directly.\n\n| From | Relation | To | Confidence | Evidence |\n| --- | --- | --- | --- | --- |\n${rows || '| none | none | none | none | none |'}\n`;
}

function renderExtractionLog(graph) {
  const warnings = graph.warnings.length
    ? graph.warnings.map((warning) => `- ${warning.level}: ${warning.message}${warning.source_path ? ` (\`${warning.source_path}\`)` : ''}`).join('\n')
    : '- No warnings.';

  return `# Extraction Log\n\n> GENERATED FILE. Do not edit directly.\n\n- Branch: \`${graph.meta.branch}\`\n- Commit: \`${graph.meta.commit}\`\n- Generated at: \`${graph.meta.generated_at}\`\n- Extractor version: \`${graph.meta.extractor_version}\`\n- Files scanned: ${graph.meta.scanned_file_count}\n- Nodes generated: ${graph.nodes.length}\n- Edges generated: ${graph.edges.length}\n- Warnings: ${graph.warnings.length}\n\n## Warnings\n\n${warnings}\n`;
}

export function renderObsidianFiles(graph) {
  const files = new Map();
  files.set('docs/obsidian/00-index.md', `# Physics Community Obsidian Registry\n\nThis vault section separates generated repo facts from curated interpretation.\n\n## Generated Views\n\n- [[website-structure]]\n- [[code-structure]]\n- [[relation-map]]\n- [[extraction-log]]\n\n## Curated Notes\n\n- [[architecture-overview]]\n- [[design-decisions]]\n- [[domain-model]]\n- [[known-risk-areas]]\n\n## Generated Node Areas\n\n- Routes: generated from \`src/App.tsx\`\n- Pages: generated from \`src/pages/**\`\n- Components: generated from \`src/components/**\`\n- API: generated from \`mcp-server/src/index.ts\`\n- Database: generated from \`database/sql/**\`\n- Files and configs: generated from selected source paths\n`);
  files.set('docs/obsidian/generated/website-structure.md', renderWebsiteStructure(graph));
  files.set('docs/obsidian/generated/code-structure.md', renderCodeStructure(graph));
  files.set('docs/obsidian/generated/relation-map.md', renderRelationMap(graph));
  files.set('docs/obsidian/generated/extraction-log.md', renderExtractionLog(graph));

  graph.nodes.forEach((node) => {
    const category = categoryForNode(node);
    files.set(`docs/obsidian/generated/nodes/${category}/${nodeFileName(node.id)}`, renderNodeFile(node, graph));
  });

  return files;
}

export function writeRenderedObsidian(root, graph) {
  const nodesRoot = repoPath(root, 'docs/obsidian/generated/nodes');
  const generatedRoot = repoPath(root, 'docs/obsidian/generated');
  if (!nodesRoot.startsWith(generatedRoot)) {
    throw new Error(`Refusing to clean unexpected generated node path: ${nodesRoot}`);
  }
  fs.rmSync(nodesRoot, { recursive: true, force: true });

  const files = renderObsidianFiles(graph);
  for (const [relativePath, content] of files.entries()) {
    writeText(root, relativePath, content);
  }
  return [...files.keys()].sort();
}

export function normalizeForDrift(value) {
  const clone = JSON.parse(JSON.stringify(value));
  if (clone.meta) clone.meta.generated_at = '<ignored>';
  if (clone.extraction_timestamp) clone.extraction_timestamp = '<ignored>';
  return clone;
}

export function readJson(root, relativePath) {
  return JSON.parse(readText(root, relativePath));
}
