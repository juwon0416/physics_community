# Physics Community

Physics Community is a Vite + React + TypeScript site for browsing physics topics, reading archived topic documents, and managing ontology-style graph content backed by Supabase.

## Where To Look

- Website entry and routes: `src/App.tsx`
- Page-level screens: `src/pages/`
- Active graph page: `src/pages/GraphOverviewPage.tsx`
- Active graph UI: `src/components/graph/FileOntologyCanvas.tsx`
- Legacy concept graph UI: `src/components/graph/OntologyGraphView.tsx`
- Graph admin tools: `src/components/admin/KnowledgeImportManager.tsx`, `src/components/admin/DirectoryStructureManager.tsx`
- Topic rendering and storage: `src/data/`, `src/lib/`
- SQL source files: `database/sql/`
- Repo-derived structure map: `docs/registry/site-code-graph.json`
- Human-readable structure notes: `docs/obsidian/generated/`, `docs/reference/website_structure.md`

## Current Structure

```text
physics_community/
├── src/
│   ├── components/
│   │   ├── admin/      # graph import and directory admin panels
│   │   ├── auth/       # sign-in dialog
│   │   ├── graph/      # active ontology graph view
│   │   ├── layout/     # navbar and page shell
│   │   └── ui/         # shared UI controls
│   ├── data/           # topic storage, archive access, seed fallbacks
│   ├── lib/            # Supabase client, graph helpers, render helpers
│   └── pages/          # Home, Timeline, Topic, Graph pages
├── public/             # runtime static assets
├── database/
│   └── sql/
│       ├── archive/    # archive-only schema
│       ├── maintenance/# cleanup and one-off maintenance SQL
│       ├── migrations/ # incremental schema changes
│       ├── schema/     # baseline and variant schemas
│       └── README.md   # SQL file index
├── docs/
│   ├── harness/        # harness operating rules and checks
│   ├── obsidian/       # generated + curated structure notes
│   ├── reference/      # human-authored reference docs
│   └── registry/       # machine-readable repo graph
├── mcp-server/         # MCP server for content and graph operations
└── trash/              # retired code and scratch artifacts kept out of active flow
```

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## MCP Server

```bash
cd mcp-server
npm install
npm run build
node build/index.js
```

Setup details live in `mcp-server/README.md`.

## Notes

- `docs/reference/website_structure.md` is the short human guide to the active website structure.
- `docs/registry/site-code-graph.json` is the source-of-truth manifest for the derived structure registry.
- Retired experiments are preserved under `trash/` rather than mixed into active source folders.
