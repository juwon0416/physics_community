import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

const ALLOWED_TRACKED_ENV_FILES = new Set(['.env.example']);
const TEXT_EXTENSIONS = new Set([
  '',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const SKIPPED_PREFIXES = ['.git/', 'dist/', 'dist-ssr/', 'mcp-server/build/', 'node_modules/'];
const SECRET_NAME_PATTERN = /(?:API[_-]?KEY|ACCESS[_-]?TOKEN|REFRESH[_-]?TOKEN|AUTH[_-]?TOKEN|OIDC[_-]?TOKEN|SECRET|SERVICE[_-]?ROLE|PRIVATE[_-]?KEY|PASSWORD|DATABASE[_-]?URL|POSTGRES[_-]?URL)/i;
const ENV_ASSIGNMENT_PATTERN = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/;
const INLINE_SECRET_ASSIGNMENT_PATTERN = /\b([A-Z][A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|AUTH_TOKEN|OIDC_TOKEN|SECRET|SERVICE_ROLE|PRIVATE_KEY|PASSWORD|DATABASE_URL|POSTGRES_URL)[A-Z0-9_]*)\b\s*[:=]\s*["']?([^"',\s#]+)["']?/g;
const HIGH_SIGNAL_LITERAL_PATTERNS = [
  { kind: 'jwt-like-token', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { kind: 'openai-style-key', pattern: /sk-[A-Za-z0-9_-]{20,}/g },
  { kind: 'github-token', pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { kind: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
];

function repoPath(relativePath) {
  return path.join(root, ...relativePath.split('/'));
}

function gitFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: root });
  return output
    .toString('utf8')
    .split('\0')
    .map((item) => item.replace(/\\/g, '/'))
    .filter(Boolean);
}

function isSkipped(filePath) {
  return SKIPPED_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function isPlaceholder(value) {
  const normalized = value.trim().replace(/^['"]|['"]$/g, '');
  if (!normalized) return true;
  return [
    /^YOUR_/i,
    /^REPLACE_/i,
    /^CHANGE_/i,
    /^EXAMPLE_/i,
    /^DUMMY/i,
    /^\.\.\.$/,
    /^<.+>$/,
    /^\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}$/,
    /placeholder/i,
    /example/i,
    /localhost/i,
    /^https:\/\/placeholder\.supabase\.co$/i,
  ].some((pattern) => pattern.test(normalized));
}

function addIssue(issues, filePath, line, reason, key = '') {
  issues.push({
    filePath,
    line,
    reason,
    key,
  });
}

function scanEnvFile(filePath, content, issues) {
  const allowed = ALLOWED_TRACKED_ENV_FILES.has(filePath);
  const lines = content.split(/\r?\n/);

  if (!allowed) {
    addIssue(issues, filePath, 1, 'tracked environment file is not allowed');
  }

  lines.forEach((lineText, index) => {
    const match = lineText.match(ENV_ASSIGNMENT_PATTERN);
    if (!match) return;

    const [, key, rawValue] = match;
    const value = rawValue.replace(/\s+#.*$/, '').trim();
    if (!SECRET_NAME_PATTERN.test(key)) return;
    if (!allowed && value && !isPlaceholder(value)) {
      addIssue(issues, filePath, index + 1, 'tracked env file contains a non-placeholder secret-like value', key);
      return;
    }

    if (allowed && value && !isPlaceholder(value)) {
      addIssue(issues, filePath, index + 1, 'example env file must use placeholder values only', key);
    }
  });
}

function scanTextFile(filePath, content, issues) {
  const lines = content.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    if (filePath === 'tools/validation/validate_security_harness.js' && lineText.includes('_PATTERN')) {
      return;
    }

    for (const match of lineText.matchAll(INLINE_SECRET_ASSIGNMENT_PATTERN)) {
      const key = match[1];
      const value = match[2] ?? '';
      if (!isPlaceholder(value) && !value.startsWith('process.env') && !value.startsWith('import.meta.env')) {
        addIssue(issues, filePath, index + 1, 'possible hard-coded secret assignment', key);
      }
    }

    for (const { kind, pattern } of HIGH_SIGNAL_LITERAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(lineText)) {
        addIssue(issues, filePath, index + 1, `possible hard-coded ${kind}`);
      }
    }
  });
}

function localEnvWarnings(trackedFiles) {
  const tracked = new Set(trackedFiles);
  return fs.readdirSync(root)
    .filter((entry) => entry.startsWith('.env') && entry !== '.env.example')
    .filter((entry) => !tracked.has(entry))
    .map((entry) => `${entry}: local env file is present but not tracked`);
}

const issues = [];
let warnings = [];
let files;

try {
  files = gitFiles();
} catch (error) {
  console.error(`Security validation failed: could not list tracked files with git (${error.message}).`);
  process.exit(1);
}

for (const filePath of files) {
  if (isSkipped(filePath) || !isTextFile(filePath)) continue;

  let content = '';
  try {
    content = fs.readFileSync(repoPath(filePath), 'utf8');
  } catch {
    continue;
  }

  if (filePath.startsWith('.env')) {
    scanEnvFile(filePath, content, issues);
  }

  scanTextFile(filePath, content, issues);
}

warnings = localEnvWarnings(files);

if (issues.length > 0) {
  console.error('Security harness validation failed. Secret values are intentionally redacted.');
  issues.forEach((issue) => {
    const key = issue.key ? ` key=${issue.key}` : '';
    console.error(`- ${issue.filePath}:${issue.line}${key} - ${issue.reason}`);
  });
  if (warnings.length > 0) {
    console.warn('Local env warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
  process.exit(1);
}

console.log('Security harness validation passed. No tracked secret files or hard-coded secret literals were detected.');
if (warnings.length > 0) {
  console.warn('Local env warnings:');
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
