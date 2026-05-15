# Knowledge Reconstruction Architecture

## Goal

The system is no longer a one-file batch converter. It is a persistent knowledge reconstruction engine that keeps a canonical scholarly network alive across many uploads.

Each new source file should do one of two things:

1. bootstrap the repository when it is empty
2. expand or refine the existing repository when related knowledge already exists

The target outputs remain the same:

1. a knowledge graph with spheres, clusters, nodes, and typed edges
2. one detailed markdown document per canonical node
3. a linked markdown knowledge library with frontmatter and cross-node links
4. website-ready metadata for search, navigation, and expandable graph rendering
5. graph-native learning routes so a user can continue study inside the website without reopening the original textbook
6. graph-native argument routes so a user can trace a paper's problem, assumptions, derivations, evidence, and conclusions without relying on the original prose

The transformation is now:

```text
new upload
+ existing canonical repository
-> delta analysis
-> subgraph expansion
-> canonical graph update
-> node-level scholarly documents
-> linked markdown knowledge library
-> website graph rendering assets
```

## Core Design Shift

The repository, not the incoming file, is now the primary unit of reasoning.

That means:

- a general physics textbook can create broad spheres such as mechanics, electromagnetism, thermodynamics, and quantum mechanics
- a later advanced mechanics textbook should extend the existing mechanics sphere rather than creating a second disconnected mechanics graph
- node ids, sphere ids, and document paths must remain stable across uploads
- provenance must accumulate over time so one node can be grounded in multiple books, lecture notes, or papers

## Graph Layers

The repository should represent two related but distinct structures:

1. Concept Graph
   - stores concepts, laws, equations, theories, phenomena, and canonical scholarly topics
   - answers what a thing is, how it relates to neighboring concepts, and what it depends on
   - is optimized for prerequisite navigation and long-term knowledge reuse

2. Argument Graph
   - stores the logical skeleton of a paper or section
   - answers why a claim was made, which assumptions were used, how a result was derived, and what evidence supports it
   - is optimized for reconstructing the reasoning flow of a source, not just the concept inventory

The two layers must stay linked:

- concept nodes can be reused across many papers
- paper-specific claims and derivation steps should point back to canonical concept nodes
- a paper may introduce a new argument even when all of its concepts already exist in the repository
- a graph viewer should be able to switch between concept navigation and argument navigation without changing the canonical ids

## System Layers

### Layer 0: Persistent Repository Memory

This layer remembers what already exists.

It stores:

- the canonical graph
- sphere and node registries
- document registry
- provenance and evidence ledger
- prior change sets

Primary agent:

- `knowledge_repository_manager`

### Layer A: Incremental Graph Expansion

This layer decides how a new upload should attach to the existing repository.

It answers:

- which current spheres the upload belongs to
- whether it extends existing clusters or needs new clusters
- whether incoming concepts map to existing nodes or require new canonical nodes
- which edges and local neighborhoods must change

Primary agents:

- `upload_delta_analyzer`
- `top_classifier`
- `scope_judge`
- `recursive_subclassifier`
- `graph_expansion_planner`
- `category_graph_designer`
- `node_reuse_resolver`
- `graph_merger`
- `graph_normalizer`

### Layer B: Node Document Reconstruction

This layer decides how affected nodes should be documented or revised.

It answers:

- what each changed node document must explain
- how new evidence changes the node scope
- which links, equations, caveats, and examples must appear
- which existing markdown files can stay untouched
- how the node's concept role and argument role should be represented together
- how section-level reasoning should be mirrored in graph metadata

Primary agents:

- `node_spec_builder`
- `equation_extractor`
- `node_doc_planner`
- `derivation_reconstructor`
- `node_doc_writer`
- `node_doc_reviewer`
- `logical_structure_validator`
- `citation_grounder`
- `learning_path_builder`
- `markdown_packager`
- `web_mapper`

### Layer C: Argument Graph Reconstruction

This layer reconstructs paper logic as a first-class graph.

It answers:

- what problem the paper is trying to solve
- what assumptions and definitions are introduced
- what derivation steps lead to each intermediate and final result
- which claims are supported by which evidence or equations
- where the paper generalizes, limits, or interprets its results

Primary agents:

- `claim_extractor`
- `assumption_miner`
- `definition_locator`
- `derivation_stepper`
- `evidence_chain_builder`
- `argument_graph_designer`
- `paper_backbone_builder`
- `argument_graph_validator`

## Orchestrator Tree

```text
knowledge_reconstruction_orchestrator
|-- knowledge_repository_manager
|-- file_reader
|-- corpus_profiler
|-- upload_delta_analyzer
|-- top_classifier
|-- scope_judge
|-- recursive_subclassifier
|-- graph_expansion_planner
|-- category_graph_designer
|-- node_reuse_resolver
|-- node_spec_builder
|-- equation_extractor
|-- node_doc_planner
|-- derivation_reconstructor
|-- node_doc_writer
|-- node_doc_reviewer
|-- logical_structure_validator
|-- claim_extractor
|-- assumption_miner
|-- definition_locator
|-- derivation_stepper
|-- evidence_chain_builder
|-- argument_graph_designer
|-- paper_backbone_builder
|-- argument_graph_validator
|-- citation_grounder
|-- learning_path_builder
|-- graph_merger
|-- graph_normalizer
|-- markdown_packager
`-- web_mapper
```

## End-to-End Flow

### Stage 0. Repository Snapshot

- `knowledge_repository_manager`

Artifacts:

- `knowledge_reconstruction/repository/canonical_graph.json`
- `knowledge_reconstruction/repository/sphere_registry.json`
- `knowledge_reconstruction/repository/node_registry.json`
- `knowledge_reconstruction/repository/document_registry.json`
- `knowledge_reconstruction/repository/evidence_ledger.json`
- `knowledge_reconstruction/work/repository/repository_snapshot.json`

Purpose:

- bootstrap an empty repository on the first upload
- load the current graph state on later uploads
- expose stable ids and prior provenance to downstream agents

### Stage 1. Intake

- `file_reader`
- `corpus_profiler`

Artifacts:

- `knowledge_reconstruction/work/intake/file_manifest.json`
- `knowledge_reconstruction/work/intake/document_outlines.json`
- `knowledge_reconstruction/work/intake/chunk_inventory.json`
- `knowledge_reconstruction/work/corpus/corpus_profile.json`

### Stage 2. Delta Analysis

- `upload_delta_analyzer`

Artifacts:

- `knowledge_reconstruction/work/delta/upload_delta.json`
- `knowledge_reconstruction/work/delta/affected_neighborhoods.json`

Purpose:

- compare the new upload with the current repository
- identify likely spheres, clusters, and nodes to extend
- bound the rewrite scope so incremental updates stay local

### Stage 3. Classification and Scope Control

- `top_classifier`
- `scope_judge`
- `recursive_subclassifier`

Artifacts:

- `knowledge_reconstruction/work/classification/top_level_spheres.json`
- `knowledge_reconstruction/work/classification/scope_decisions.json`
- `knowledge_reconstruction/work/classification/scope_tree.json`

Key rule:

- classification is relative to the repository, not just the upload itself

### Stage 4. Expansion Planning

- `graph_expansion_planner`

Artifacts:

- `knowledge_reconstruction/work/expansion/expansion_plan.json`
- `knowledge_reconstruction/work/expansion/affected_nodes.json`
- `knowledge_reconstruction/work/expansion/new_scope_candidates.json`

This stage decides:

- extend existing sphere
- extend existing cluster
- add new cluster inside an existing sphere
- create a new top-level sphere only when necessary

### Stage 5. Incremental Subgraph Design

- `category_graph_designer`
- `node_reuse_resolver`

Artifacts:

- `knowledge_reconstruction/work/graphs/per_category/*.json`
- `knowledge_reconstruction/work/reuse/node_mapping.json`
- `knowledge_reconstruction/work/reuse/new_node_candidates.json`
- `knowledge_reconstruction/work/reuse/alias_registry_updates.json`

This is where the system chooses between:

- reuse existing canonical node
- attach as alias or synonym
- create a new canonical node

### Stage 6. Node Specification and Document Planning

- `node_spec_builder`
- `equation_extractor`
- `node_doc_planner`
- `derivation_reconstructor`
- `claim_extractor`
- `assumption_miner`
- `definition_locator`
- `paper_backbone_builder`

Artifacts:

- `knowledge_reconstruction/work/node_specs/*.json`
- `knowledge_reconstruction/work/node_specs/changed_node_set.json`
- `knowledge_reconstruction/work/equations/*.json`
- `knowledge_reconstruction/work/node_doc_plans/*.json`
- `knowledge_reconstruction/work/derivations/*.json`
- `knowledge_reconstruction/work/argument_backbones/*.json`
- `knowledge_reconstruction/work/argument_nodes/*.json`
- `knowledge_reconstruction/work/claims/*.json`
- `knowledge_reconstruction/work/assumptions/*.json`
- `knowledge_reconstruction/work/definitions/*.json`

Canonical node spec shape:

```json
{
  "node_id": "newton_second_law",
  "title": "Newton's Second Law",
  "node_class": "Concept",
  "node_type": "law",
  "sphere": "general_mechanics",
  "cluster": "dynamics",
  "summary_scope": "classical point-particle mechanics",
  "graph_roles": {
    "concept_graph": true,
    "argument_graph": false
  },
  "used_in_arguments": [
    "argument:general_mechanics:newton_second_law:section_3",
    "argument:advanced_mechanics:hamiltonian_dynamics:section_2"
  ],
  "symbols": [
    { "symbol": "F", "meaning": "net external force" },
    { "symbol": "p", "meaning": "linear momentum" }
  ],
  "assumptions": [
    "classical point-particle mechanics",
    "inertial reference frame"
  ],
  "required_sections": [
    "Definition",
    "Definitions and Symbols",
    "Assumptions and Scope",
    "Physical Meaning",
    "Mathematical Formulation",
    "Derivation Roadmap",
    "Special Cases",
    "Relation to Momentum",
    "Examples",
    "Common Misunderstandings",
    "Connections to Other Nodes"
  ],
  "equation_targets": [
    "sum F = dp/dt",
    "sum F = ma"
  ],
  "derivation_goals": [
    "show why the momentum form is more general than the constant-mass form"
  ],
  "mastery_outcomes": [
    "state the law precisely",
    "identify when the constant-mass form applies",
    "connect the law to momentum and work-energy structure"
  ],
  "prerequisites": ["force", "mass", "acceleration"],
  "related_nodes": ["momentum", "inertial_frame", "newton_first_law"],
  "source_chunks": ["c12", "c13", "c14"],
  "source_documents": ["general_physics_textbook", "advanced_mechanics_textbook"]
}
```

### Stage 6b. Argument Backbone Specification

The argument backbone must be recorded separately from the concept node when the source contains paper-like reasoning.

Concept nodes keep stable reusable identifiers.

Argument nodes keep source-specific identifiers and directional proof structure.

Recommended id rules:

```text
concept:newton_second_law
concept:berry_connection
concept:equipartition_theorem

argument:paper_x:claim_001
argument:paper_x:assumption_001
argument:paper_x:derivation_step_003
argument:paper_x:result_001
argument:paper_x:section_2
```

Recommended directionality rule:

- argument graphs must be directed
- the path should usually flow from problem and motivation toward assumptions, definitions, derivation steps, claims, results, interpretation, and limitations
- `DerivationStep` nodes should explicitly connect both to equations they use and to claims or results they produce
- `Section` nodes may contain local argument subgraphs, while `Paper` nodes contain the paper-wide backbone

Recommended argument node classes:

```json
{
  "argument_node_classes": [
    "Paper",
    "Section",
    "Problem",
    "ResearchQuestion",
    "Motivation",
    "Assumption",
    "Definition",
    "Equation",
    "Claim",
    "Lemma",
    "DerivationStep",
    "Result",
    "Interpretation",
    "Limitation",
    "Evidence",
    "Figure",
    "Citation"
  ],
  "external_linkable_node_classes": [
    "Concept"
  ]
}
```

Minimal argument node schema:

```json
{
  "id": "argument:paper_x:claim_002",
  "node_class": "Claim",
  "source_id": "paper_x",
  "scope": "section_2",
  "statement": "The closed-loop Berry phase is gauge invariant modulo 2pi.",
  "depends_on": [
    "argument:paper_x:assumption_001",
    "concept:berry_connection"
  ],
  "supported_by": [
    "argument:paper_x:derivation_step_003"
  ],
  "evidence_chunks": [
    "chunk_12",
    "chunk_13"
  ],
  "confidence": "high"
}
```

Recommended edge taxonomy:

```json
{
  "edge_types": [
    "CONTAINS",
    "INTRODUCES",
    "MOTIVATES",
    "DEFINES",
    "ASSUMES",
    "USES",
    "DERIVES",
    "IMPLIES",
    "SUPPORTS",
    "EVIDENCED_BY",
    "EXPLAINS",
    "INTERPRETS",
    "GENERALIZES",
    "SPECIAL_CASE_OF",
    "CONTRASTS_WITH",
    "LIMITED_BY",
    "LEADS_TO",
    "DEPENDS_ON",
    "CONNECTS_TO"
  ]
}
```

Minimal argument edge schema:

```json
{
  "edge_id": "edge_00042",
  "source": "argument:paper_x:derivation_step_003",
  "type": "USES",
  "target": "concept:berry_connection",
  "evidence_chunks": [
    "chunk_18"
  ],
  "rationale": "The derivation applies the Berry connection line integral to compute the phase.",
  "confidence": "high"
}
```

Recommended section backbone shape:

```json
{
  "argument_id": "argument:paper_x:section_2",
  "source_id": "paper_x",
  "scope": "section_2",
  "argument_backbone": {
    "main_problem": ["problem_1"],
    "main_claims": ["claim_1", "claim_2"],
    "assumptions": ["assumption_1"],
    "definitions": ["definition_1", "definition_2"],
    "derivation_chain": [
      "derivation_step_1",
      "derivation_step_2",
      "result_1"
    ],
    "interpretations": ["interpretation_1"],
    "limitations": ["limitation_1"],
    "connections_to_prior_work": ["paper_y", "concept_z"],
    "concept_links": ["newton_second_law", "momentum", "inertial_frame"]
  }
}
```

Recommended paper-wide backbone shape:

```json
{
  "argument_id": "argument:paper_x",
  "source_id": "paper_x",
  "scope": "paper",
  "section_backbones": [
    "argument:paper_x:section_1",
    "argument:paper_x:section_2",
    "argument:paper_x:section_3"
  ],
  "thesis": "main thesis of the paper",
  "main_problem": ["problem_1"],
  "main_claims": ["claim_1", "claim_2"],
  "assumptions": ["assumption_1"],
  "definitions": ["definition_1"],
  "derivation_chain": [
    "derivation_step_1",
    "derivation_step_2",
    "result_1"
  ],
  "interpretations": ["interpretation_1"],
  "limitations": ["limitation_1"],
  "concept_links": ["newton_second_law", "momentum", "inertial_frame"]
}
```

Recommended graph linkage rule:

```json
{
  "argument_edge_examples": [
    "argument:paper_x:derivation_step_003 USES concept:newton_second_law",
    "argument:paper_x:claim_002 DEPENDS_ON concept:momentum",
    "argument:paper_x:result_001 INTERPRETS concept:force"
  ]
}
```

Recommended argument graph validation rules:

```text
1. Every Claim must be supported by at least one Evidence, Equation, DerivationStep, or Citation.
2. Every DerivationStep must have at least one input node and one output node.
3. Every Result must be reachable from a Problem or Motivation node through directed edges.
4. Every Assumption must be connected to at least one Claim, DerivationStep, or Result.
5. Every argument edge must include evidence_chunks.
6. No argument node may be merged into a canonical concept node.
7. Paper-wide backbone must reference all section-level backbones that contain major claims.
8. External Concept nodes may be referenced by argument nodes, but they are never reclassified as argument nodes.
```

### Stage 7. Node Document Reconstruction

- `node_doc_writer`
- `node_doc_reviewer`
- `logical_structure_validator`
- `argument_graph_validator`
- `citation_grounder`
- `learning_path_builder`

Artifacts:

- `knowledge_reconstruction/work/node_docs/*.md`
- `knowledge_reconstruction/work/reviews/node_doc_reviews/*.json`
- `knowledge_reconstruction/work/reviews/logical_structure/*.json`
- `knowledge_reconstruction/work/reviews/argument_graph/*.json`
- `knowledge_reconstruction/work/citations/*.json`
- `knowledge_reconstruction/work/learning_paths/*.json`

Key rule:

- only affected node documents should be regenerated
- untouched nodes keep their paths and ids
- new evidence should enrich existing node docs rather than fork duplicate docs
- each regenerated node document must be logically self-contained enough for serious graph-native study
- the node doc should explain both the concept role and the argument role when the source uses the node in a proof, derivation, or claim chain
- the markdown library should preserve the argument backbone in metadata, not only in prose
- argument graph validation outputs should confirm node schema, directionality, evidence-backed edges, and separation from canonical concept nodes

### Stage 8. Canonical Merge and Normalization

- `graph_merger`
- `graph_normalizer`

Artifacts:

- `knowledge_reconstruction/work/graphs/merged_graph.json`
- `knowledge_reconstruction/work/graphs/change_set.json`
- `graph/spheres.json`
- `graph/clusters.json`
- `graph/nodes.json`
- `graph/edges.json`
- `graph/knowledge_map.json`

### Stage 9. Packaging and Web Mapping

- `markdown_packager`
- `web_mapper`

Artifacts:

- `content/**`
- `metadata/content_manifest.json`
- `metadata/navigation_map.json`
- `metadata/learning_paths.json`
- `web/web_manifest.json`
- `web/search_index.json`
- `web/rendering_index.json`

## Repository Layout

```text
knowledge_reconstruction/
  repository/
    canonical_graph.json
    sphere_registry.json
    node_registry.json
    document_registry.json
    evidence_ledger.json
  work/
    repository/
      repository_snapshot.json
    delta/
      upload_delta.json
      affected_neighborhoods.json
    expansion/
      expansion_plan.json
      affected_nodes.json
      new_scope_candidates.json
    reuse/
      node_mapping.json
      new_node_candidates.json
      alias_registry_updates.json

content/
  spheres/
    general_mechanics/
      index.md
      dynamics/
        force.md
        mass.md
        newtons_second_law.md
      analytical_mechanics/
        lagrangian.md
        euler_lagrange_equation.md
    electromagnetism/
      index.md
    quantum_mechanics/
      index.md

graph/
  spheres.json
  clusters.json
  nodes.json
  edges.json
  knowledge_map.json
  argument_graph.json
  argument_backbones.json

metadata/
  content_manifest.json
  navigation_map.json

web/
  web_manifest.json
  search_index.json
  rendering_index.json
```

## Example Behavior

### Upload 1: General physics textbook

Expected effect:

- create broad spheres such as general mechanics, electromagnetism, thermodynamics, and quantum mechanics
- create foundational nodes inside each sphere
- publish the first repository-wide graph and markdown library

### Upload 2: Advanced mechanics textbook

Expected effect:

- attach primarily to the existing mechanics sphere
- refine or add mechanics clusters such as variational methods, constrained systems, rigid body motion, or Hamiltonian mechanics
- reuse existing nodes like force, momentum, and Newtonian dynamics when appropriate
- add new nodes only where the upload introduces genuinely new scope
- update only the affected mechanics subgraph, node docs, and web indexes

The second upload must not create a disconnected second mechanics sphere unless the new material is truly a different domain.

## Node Document Principle

Documents must be reconstructed around the canonical node, not merely summarized from one source file. A node can accumulate evidence from many uploads over time.

When a source is paper-like or proof-heavy, the node document should point to the argument structure that connects assumptions, derivation steps, claims, and results. In that case, the markdown file is a concept page with references into the separate argument graph.

Recommended frontmatter:

```yaml
---
id: node_newton_second_law
title: Newton's Second Law
type: law
sphere: general_mechanics
cluster: dynamics
node_class: Concept
graph_roles:
  concept_graph: true
  argument_graph: false
used_in_arguments:
  - argument:general_mechanics:newton_second_law:section_3
  - argument:advanced_mechanics:hamiltonian_dynamics:section_2
prerequisites:
  - force
  - mass
  - acceleration
related_nodes:
  - momentum
  - inertial_frame
  - newton_first_law
source_basis:
  documents:
    - general_physics_textbook
    - advanced_mechanics_textbook
  chunk_ids:
    - c12
    - c13
    - c14
    - am221
    - am222
---
```

Recommended section skeleton:

```markdown
# Newton's Second Law

## 1. Overview
## 2. Formal Statement
## 3. Definitions and Symbols
## 4. Assumptions and Scope
## 5. Core Equations
## 6. Logical Structure
## 7. Derivation Roadmap
## 8. Physical Meaning
## 9. Worked Example
## 10. Limits and Failure Modes
## 11. Common Misconceptions
## 12. Argument Backbone
## 13. Connections to Other Nodes
## 14. Suggested Next Nodes
## 15. Mastery Targets
```

## Operating Rules

1. Graph first, documents second.
2. Reuse canonical node ids whenever concepts are semantically equivalent.
3. Prefer extending an existing sphere or cluster over creating a near-duplicate branch.
4. Regenerate only affected node specs, node docs, graph neighborhoods, and web assets.
5. Append provenance instead of replacing it.
6. Record merges, splits, aliases, and scope changes explicitly in the repository ledger.
7. A node document is not complete unless a reader can define the node, interpret its equations, and follow its logical dependency chain without consulting the original source.
8. If the source contains proof, derivation, or theorem-style reasoning, the repository must also record the paper's argument backbone as structured metadata.
9. The concept graph may be stable even when the argument graph changes, but the argument graph must never be flattened into a simple prerequisite list.
10. Canonical concept ids and source-specific argument ids must remain separate so a concept page never pretends to be the paper's proof tree.

## Quality Gates

The system is successful only when all of the following are true:

- the graph contains spheres, clusters, nodes, and typed edges
- the graph distinguishes concept nodes from argument nodes where appropriate
- concept nodes use stable reusable ids while argument nodes use source-specific directed ids
- paper-level argument backbones can be reconstructed from the graph without reading the original prose
- section-level and paper-level argument backbones are both supported when the source needs local and global proof structure
- each canonical node has exactly one canonical markdown document
- later uploads extend the existing repository unless a new domain is clearly justified
- documents are linked to prerequisites, related nodes, and parent-child structure
- graph ids and markdown ids are aligned and stable across uploads
- source provenance is retained at chunk or section level across multiple documents
- website assets support search, navigation, and expandable graph rendering without rebuilding the conceptual graph at runtime
- metadata supports prerequisite-aware learning paths, equation-aware discovery, and argument-route discovery inside the website

## Recommended Future Extensions

These fit naturally into the persistent network architecture:

- `equation_extractor`
- `figure_mapper`
- `difficulty_ranker`
- `learning_path_builder`
- `search_index_builder`
- `evidence_reconciler`
- `subgraph_regenerator`
- `logical_structure_validator`
- `claim_extractor`
- `assumption_miner`
- `definition_locator`
- `argument_graph_designer`
- `paper_backbone_builder`
