# Frontend Map

## Routes

- `/` - `src/pages/Home.tsx`
- `/graph` - `src/pages/GraphOverviewPage.tsx`
- `/field/:fieldSlug` - `src/pages/TimelinePage.tsx`
- `/topic/:topicSlug` - `src/pages/TopicPage.tsx`

## Active Areas

- App shell: `src/components/layout/Layout.tsx`, `src/components/layout/Navbar.tsx`
- Graph overview: `src/pages/GraphOverviewPage.tsx`
- Active graph view: `src/components/graph/OntologyGraphView.tsx`
- Retired graph experiments: `trash/src-unused/components/graph/`
- Retired editor experiments: `trash/src-unused/components/editor/`
- Topic data access: `src/data/storage.ts`
- Graph assembly: `src/lib/graphModel.ts`
- Topic math rendering: `src/lib/renderTopicMath.ts`
- Theme and global styling: `src/lib/theme.tsx`, `src/index.css`

## Commands

- Build: `npm.cmd run build`
- Lint: `npm.cmd run lint`
- Dev server: `npm.cmd run dev`
