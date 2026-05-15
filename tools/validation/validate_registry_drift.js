import { execFileSync } from 'node:child_process';

function run(args) {
  execFileSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

try {
  run(['tools/extraction/generate_site_code_graph.js', '--check']);
  run(['tools/extraction/render_obsidian_registry.js', '--check']);
  console.log('Registry and generated Obsidian docs have no drift.');
} catch {
  console.error('Registry drift validation failed.');
  process.exit(1);
}
