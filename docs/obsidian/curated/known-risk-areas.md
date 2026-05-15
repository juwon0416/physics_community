# Known Risk Areas

- [[file-graph-model]] combines static fallback, dynamic Supabase reads, section extraction, inline backlinks, archive scope, and ontology payload attachment.
- [[file-storage]] handles topic CRUD, graph updates, archive fallback, topic overrides, and destructive graph save paths.
- [[component-directory-structure-manager]] and [[component-knowledge-import-manager]] can affect graph structure through UI flows.
- [[component-ontology-graph-view]] is the active graph view and is large enough to require careful, localized edits.
- [[file-render-topic-math]] is sensitive to Quill and KaTeX storage formats.
- [[api-upsert-topic]], [[api-write-topic-draft]], and [[api-upsert-graph-edge]] require write-capable Supabase credentials.
- [[table-graph-nodes]] and [[table-graph-edges]] are protected by RLS in the main schema.

When changing these areas, refresh the registry and run the validation checks in `docs/harness/verification.md`.
