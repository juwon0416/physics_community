# Code Structure

> GENERATED FILE. Do not edit directly.

- Files scanned: 168
- Nodes generated: 134
- Edges generated: 202

## .codex

- Files scanned: 41
- Registry nodes: 2

- `.codex/config.toml` -> [[config-config]]
- `.codex/project_pipeline_config.toml` -> [[config-project-pipeline-config]]

## AGENTS.md

- Files scanned: 1
- Registry nodes: 0

- No registry nodes in this group.

## database

- Files scanned: 25
- Registry nodes: 24

- `database/sql/archive/archive_graph_schema.sql` -> [[database-archive-graph-schema]], [[table-archive-topics]], [[table-archive-graph-nodes]], [[table-archive-graph-edges]]
- `database/sql/maintenance/check_purge_status.sql` -> [[database-check-purge-status]]
- `database/sql/maintenance/clean_edges.sql` -> [[database-clean-edges]], [[table-graph-edges]]
- `database/sql/maintenance/purge_legacy_sections.sql` -> [[database-purge-legacy-sections]]
- `database/sql/maintenance/safe_schema_update.sql` -> [[database-safe-schema-update]], [[table-graph-nodes]], [[table-topics]]
- `database/sql/migrations/migration_add_content.sql` -> [[database-migration-add-content]]
- `database/sql/migrations/migration_add_file_ontology_workflow.sql` -> [[database-migration-add-file-ontology-workflow]], [[table-file-ontology-generation-runs]], [[table-file-ontology-generation-artifacts]], [[table-file-ontology-link-mentions]]
- `database/sql/migrations/migration_add_light_content.sql` -> [[database-migration-add-light-content]], [[table-topic-sections]]
- `database/sql/migrations/migration_add_sync_trigger.sql` -> [[database-migration-add-sync-trigger]]
- `database/sql/migrations/migration_consolidate_fundamentals_chapter1_file_ontology.sql` -> [[database-migration-consolidate-fundamentals-chapter-1-file-ontology]]
- `database/sql/migrations/migration_expand_fundamentals_chapter1_file_ontology_content.sql` -> [[database-migration-expand-fundamentals-chapter-1-file-ontology-content]]
- `database/sql/migrations/migration_fix_wave_particle.sql` -> [[database-migration-fix-wave-particle]]
- `database/sql/migrations/migration_integrate_fundamentals_chapter2_file_ontology.sql` -> [[database-migration-integrate-fundamentals-chapter-2-file-ontology]]
- `database/sql/migrations/migration_prune_orphans.sql` -> [[database-migration-prune-orphans]]
- `database/sql/migrations/migration_purge_function.sql` -> [[database-migration-purge-function]]
- `database/sql/migrations/migration_sync_fields.sql` -> [[database-migration-sync-fields]]
- `database/sql/migrations/migration_sync_graph.sql` -> [[database-migration-sync-graph]]
- `database/sql/schema/complete_graph_schema.sql` -> [[database-complete-graph-schema]]
- `database/sql/schema/file_ontology_schema.sql` -> [[database-file-ontology-schema]], [[table-file-ontology-files]], [[table-file-ontology-edges]]
- `database/sql/schema/hierarchical_graph_schema.sql` -> [[database-hierarchical-graph-schema]]
- `database/sql/schema/knowledge_repository_schema.sql` -> [[database-knowledge-repository-schema]], [[table-knowledge-repositories]], [[table-knowledge-source-documents]], [[table-knowledge-ingestion-runs]], [[table-knowledge-node-sources]], [[table-knowledge-change-sets]]
- `database/sql/schema/ontology_paper_system_schema.sql` -> [[database-ontology-paper-system-schema]], [[table-ontology-papers]], [[table-ontology-global-concepts]], [[table-ontology-nodes]], [[table-ontology-edges]], [[table-ontology-concept-links]], [[table-ontology-inter-paper-relations]], [[table-ontology-concept-evolution]], [[table-ontology-model-lineage]], [[table-ontology-problem-solution-chains]], [[table-ontology-open-question-chains]], [[table-ontology-extraction-runs]]
- `database/sql/schema/schema.sql` -> [[database-schema]], [[table-fields]], [[table-questions]], [[table-profiles]]
- `database/sql/schema/update_graph_schema.sql` -> [[database-update-graph-schema]]

## docs

- Files scanned: 19
- Registry nodes: 1

- `docs/registry/site-code-graph.schema.json` -> [[config-site-code-graph-schema]]

## eslint.config.js

- Files scanned: 1
- Registry nodes: 1

- `eslint.config.js` -> [[config-eslint-config]]

## mcp-server

- Files scanned: 11
- Registry nodes: 5

- `mcp-server/package.json` -> [[config-mcp-server-package]]
- `mcp-server/src/index.ts` -> [[file-index]], [[api-list-topics]], [[api-get-topic]], [[api-upsert-topic]], [[api-write-topic-draft]], [[api-upsert-section]], [[api-create-concept-node]], [[api-upsert-graph-edge]], [[api-delete-graph-edge]], [[api-get-graph-snapshot]], [[api-graph-overview]], [[api-author-topic]]
- `mcp-server/src/repository.ts` -> [[file-repository]]
- `mcp-server/src/supabase.ts` -> [[file-src-supabase]]
- `mcp-server/tsconfig.json` -> [[config-mcp-server-tsconfig]]

## package-lock.json

- Files scanned: 1
- Registry nodes: 0

- No registry nodes in this group.

## package.json

- Files scanned: 1
- Registry nodes: 1

- `package.json` -> [[config-package]]

## postcss.config.js

- Files scanned: 1
- Registry nodes: 1

- `postcss.config.js` -> [[config-postcss-config]]

## README.md

- Files scanned: 1
- Registry nodes: 0

- No registry nodes in this group.

## scripts

- Files scanned: 2
- Registry nodes: 0

- No registry nodes in this group.

## src

- Files scanned: 46
- Registry nodes: 39

- `src/App.tsx` -> [[file-app]], [[route-root-layout]], [[route-home]], [[route-graph]], [[route-field-field-slug]], [[route-topic-topic-slug]], [[route-not-found]]
- `src/components/admin/DirectoryStructureManager.tsx` -> [[component-directory-structure-manager]]
- `src/components/admin/KnowledgeImportManager.tsx` -> [[component-knowledge-import-manager]]
- `src/components/auth/LoginDialog.tsx` -> [[component-login-dialog]]
- `src/components/graph/FileOntologyCanvas.tsx` -> [[component-file-ontology-canvas]]
- `src/components/graph/OntologyGraphView.tsx` -> [[component-ontology-graph-view]]
- `src/components/layout/Layout.tsx` -> [[component-layout]]
- `src/components/layout/Navbar.tsx` -> [[component-navbar]]
- `src/components/ui/Button.tsx` -> [[component-button]]
- `src/components/ui/Dialog.tsx` -> [[component-dialog]]
- `src/components/ui/ImageUpload.tsx` -> [[component-image-upload]]
- `src/components/ui/Input.tsx` -> [[component-input]]
- `src/data/archiveFundamentals.ts` -> [[file-archive-fundamentals]]
- `src/data/seed.ts` -> [[file-seed]]
- `src/data/storage.ts` -> [[file-storage]]
- `src/data/topicContentOverrides.ts` -> [[file-topic-content-overrides]]
- `src/lib/archiveSchema.ts` -> [[file-archive-schema]]
- `src/lib/auth.ts` -> [[file-auth]]
- `src/lib/backlinks.ts` -> [[file-backlinks]]
- `src/lib/cn.ts` -> [[file-cn]]
- `src/lib/concepts.ts` -> [[file-concepts]]
- `src/lib/fileOntology.ts` -> [[file-file-ontology]]
- `src/lib/graphLayouts.ts` -> [[file-graph-layouts]]
- `src/lib/graphModel.ts` -> [[file-graph-model]]
- `src/lib/graphSpheres.ts` -> [[file-graph-spheres]]

## tailwind.config.js

- Files scanned: 1
- Registry nodes: 1

- `tailwind.config.js` -> [[config-tailwind-config]]

## tools

- Files scanned: 12
- Registry nodes: 6

- `tools/extraction/generate_site_code_graph.js` -> [[file-generate-site-code-graph]]
- `tools/extraction/render_obsidian_registry.js` -> [[file-render-obsidian-registry]]
- `tools/validation/validate_obsidian_links.js` -> [[file-validate-obsidian-links]]
- `tools/validation/validate_registry_drift.js` -> [[file-validate-registry-drift]]
- `tools/validation/validate_site_code_graph.js` -> [[file-validate-site-code-graph]]
- `tools/validation/validate_source_paths.js` -> [[file-validate-source-paths]]

## tsconfig.app.json

- Files scanned: 1
- Registry nodes: 1

- `tsconfig.app.json` -> [[config-tsconfig-app]]

## tsconfig.json

- Files scanned: 1
- Registry nodes: 1

- `tsconfig.json` -> [[config-tsconfig]]

## tsconfig.node.json

- Files scanned: 1
- Registry nodes: 1

- `tsconfig.node.json` -> [[config-tsconfig-node]]

## vercel.json

- Files scanned: 1
- Registry nodes: 1

- `vercel.json` -> [[config-vercel]]

## vite.config.js

- Files scanned: 1
- Registry nodes: 1

- `vite.config.js` -> [[config-vite-config]]
