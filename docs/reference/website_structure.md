# Website Structure

This document is a short human guide to the active website structure. For machine-readable structure, use `docs/registry/site-code-graph.json`.

## Active Website Flow

1. `src/main.tsx` mounts the app.
2. `src/App.tsx` defines the top-level routes.
3. `src/pages/` contains the page screens for those routes.
4. Each page composes `src/components/**` and reads data through `src/data/**` or `src/lib/**`.
5. Supabase-backed topic, archive, and graph data flow through the storage and schema helpers in `src/data/` and `src/lib/`.

## Important Active Files

- `src/App.tsx`
  - Router entry for the website.
- `src/pages/Home.tsx`
  - Landing page and primary navigation entry.
- `src/pages/TimelinePage.tsx`
  - Timeline-style topic browsing UI.
- `src/pages/TopicPage.tsx`
  - Topic detail page and document rendering flow.
- `src/pages/GraphOverviewPage.tsx`
  - File ontology workspace page mounted at `/graph`.
- `src/components/graph/FileOntologyCanvas.tsx`
  - Active markdown-file ontology canvas with DB-backed files, hidden summaries, and labeled edges.
- `src/components/graph/OntologyGraphView.tsx`
  - Preserved legacy concept ontology graph UI.
- `src/components/admin/KnowledgeImportManager.tsx`
  - Topic and knowledge import controls.
- `src/components/admin/DirectoryStructureManager.tsx`
  - Directory and structure management controls.
- `src/data/storage.ts`
  - Topic loading, archive access, and persistence helpers.
- `src/lib/supabase.ts`
  - Supabase client wiring.

## Folder Roles

```text
src/
├── components/
│   ├── admin/      # legacy graph import and structure panels
│   ├── auth/       # login dialog
│   ├── graph/      # active file ontology canvas and legacy graph rendering
│   ├── layout/     # navbar and shared shell
│   └── ui/         # shared buttons, dialogs, inputs, upload controls
├── data/           # topic storage and archive access layer
├── lib/            # schema checks, Supabase client, math/render helpers
└── pages/          # route-level screens
```

## SQL Layout

SQL files are now grouped by purpose under `database/sql/`:

```text
database/sql/
├── archive/        # archive schema only
├── maintenance/    # cleanup, purge, and admin-safe update SQL
├── migrations/     # incremental schema migrations
├── schema/         # baseline and variant schemas
└── README.md       # file-by-file SQL index
```

When the app reports that a schema is missing, use the exact file path mentioned in the error message or in `database/sql/README.md`.

## What Is Not Active

- Retired experiments and unused source are kept in `trash/`.
- Generated structure docs live in `docs/obsidian/generated/` and should not be edited manually.
