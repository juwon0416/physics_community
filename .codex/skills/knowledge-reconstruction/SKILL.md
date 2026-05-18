---
name: knowledge-reconstruction
description: Use when adding, importing, restructuring, or reviewing physics knowledge reconstruction artifacts, including source uploads, canonical graph spheres, clusters, nodes, node documents, provenance, evidence ledgers, learning paths, and source-specific argument graphs.
---

# Knowledge Reconstruction

## Overview

Maintain the repository as a persistent scholarly physics graph. New material should extend the canonical repository instead of rebuilding isolated summaries.

## Load First

- `docs/knowledge_reconstruction_architecture.md` for the full pipeline and quality gates.
- `docs/harness/trial-and-error-log.md` if a previous import, graph merge, or content packaging attempt failed.
- `.codex/agents/knowledge_reconstruction_orchestrator.toml` when coordinating agent roles or artifact boundaries.
- `references/artifact-contracts.md` when emitting or checking repository artifacts.

## Workflow

1. Snapshot the current repository state before proposing additions.
2. Decide whether the incoming source bootstraps an empty repository or extends existing spheres, clusters, and nodes.
3. Prefer node reuse, aliases, or local cluster expansion before creating a new top-level sphere.
4. Keep canonical concept ids separate from source-specific argument ids.
5. Plan affected neighborhoods first, then regenerate only affected node specs, node docs, graph files, metadata, and web assets.
6. Append provenance and evidence. Do not replace prior source grounding unless the task is an explicit correction.
7. Validate concept graph, argument graph, node document, and web mapping outputs against the quality gates.
8. If the process reveals a repeatable mistake, use `harness-memory` to update the trial-and-error log.

## Guardrails

- Graph first, documents second.
- Stable ids matter more than locally pretty names.
- A node document is incomplete if a reader cannot define the node, interpret central equations, and follow prerequisites without reopening the source.
- Argument graph direction should flow from problem and assumptions toward derivations, results, interpretations, and limits.
- Never flatten a paper's proof tree into a simple prerequisite list.
- Keep source chunk or section evidence attached to claims, derivation steps, and graph edges.
- In file-ontology learner content, use highlight links as inline prerequisite compression, not as a separate "graph links" or connectivity section. The body should stay on the local argument and link out only where explaining a sub-concept would make the node too long.
