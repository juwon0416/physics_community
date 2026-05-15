# Artifact Contracts

Use this reference when producing or reviewing knowledge reconstruction artifacts.

## Canonical Repository

- `knowledge_reconstruction/repository/canonical_graph.json`
- `knowledge_reconstruction/repository/sphere_registry.json`
- `knowledge_reconstruction/repository/node_registry.json`
- `knowledge_reconstruction/repository/document_registry.json`
- `knowledge_reconstruction/repository/evidence_ledger.json`

Rules:

- Preserve canonical ids across uploads.
- Record aliases, merges, splits, and scope changes explicitly.
- Append new evidence instead of overwriting previous provenance.

## Concept Graph

Required properties:

- spheres, clusters, nodes, and typed edges
- stable reusable concept ids
- prerequisite-aware learning routes
- one canonical markdown document per canonical node

## Argument Graph

Required properties:

- source-specific directed ids such as `argument:paper_x:claim_001`
- claims supported by evidence, equations, derivation steps, or citations
- derivation steps with at least one input and one output
- concept links by reference only, never by merging argument nodes into concept nodes

## Web Package

Required properties:

- content and graph metadata align by stable ids
- search, navigation, rendering, and learning path manifests can be rebuilt without re-reading the original source
- only affected web assets are changed for incremental updates
