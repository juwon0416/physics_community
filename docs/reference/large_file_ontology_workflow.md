# Large File Ontology Workflow

This document defines how large inputs should enter the graph-view ontology workflow.
The goal is to avoid treating a long paper, book chapter, or source bundle as one
prompt-sized text block. Large sources must be ingested as structured evidence,
chunked, summarized, mapped to the existing file ontology, and only then written
as file nodes, edges, and highlight mentions.

## Core Principle

Large input processing is not "paste everything into the authoring agent."

It is:

```text
large source
-> source manifest
-> structure-preserving extraction
-> chunk inventory
-> chunk-level concept and relation extraction
-> source-level synthesis
-> ontology expansion plan
-> paper mirror or concept files
-> highlight mentions and graph edges
-> validation
-> DB write
```

The system must keep these layers separate:

- Source mirror: preserves the original source structure.
- Chunk inventory: gives every extracted unit a stable evidence id.
- Ontology integration: maps source chunks to existing or new file nodes.
- Generated concept files: reusable wiki-style explanations, not copies of the source.

## File-Node Granularity

Do not split a source merely because it has headings. Decide whether each candidate
file node has enough independent explanatory weight to justify its own document.

Keep a source as one file node when:

- the sections are brief and share one central argument
- each section would mostly repeat the same definitions or setup
- most links are internal to the same chapter, paper, or source unit
- splitting would make the graph canvas noisier without improving study value

Split into multiple file nodes when:

- a subsection introduces a reusable concept, law, model, or equation family
- the section has its own derivation, assumptions, examples, and limitations
- multiple later sources are likely to cite the same subsection independently
- the argument graph needs distinct claim, definition, result, or derivation paths
- a single document would become difficult to navigate even with internal headings

Whenever a granularity decision is made, record the reason in workflow metadata.
The file node should also state why the source was kept whole or split.

## File-Node Content Standard

File nodes are allowed to be long. Prefer explanatory completeness over compact
summary. A high-quality node should read like a scholarly note, not an outline.

Minimum sections for a full node:

- Abstract
- Source scope and ontology boundary
- Central problem or thesis
- Definitions and symbols
- Logical structure or argument backbone
- Mathematical formulation with explained equations
- Worked analysis, derivation, or source-grounded example
- Limits and failure modes
- Common misconceptions
- Connections to prerequisite and later nodes
- Mastery targets

Compact placeholder nodes are acceptable only as temporary stubs. A finished
source or concept node should let the reader reconstruct the logic without
reopening the original source.

## Input Size Tiers

Use these tiers to choose the workflow.

| Tier | Typical input | Handling |
| --- | --- | --- |
| Small | Short prompt, short note, one abstract | Use the normal graph workflow directly. |
| Medium | Article or short paper that fits comfortably in browser state | Build a paper mirror and chunk by section before synthesis. |
| Large | Long paper, chapter, OCR output, or many pages | Require staged ingestion; never send the whole source into one generation step. |
| Corpus | Book, multiple PDFs, source bundle | Treat as a multi-run import with one manifest and many source documents. |

Rule of thumb:

- If the source has sections, preserve sections first.
- If the source has more than one major section, chunk before summarizing.
- If extraction quality is uncertain, stop after extraction and request review before ontology writing.

## Workflow

### 1. Intake and Classification

The first agent classifies the input:

- concept request
- paper integration
- book or chapter integration
- multi-source corpus
- unclear input

For a paper, the target action is paper integration. For a concept request with
large supporting material, the target action is concept creation with source
evidence.

Output:

```json
{
  "source_kind": "paper",
  "title": "Source title",
  "authors": [],
  "source_locator": "doi, arxiv, url, upload id, or local path",
  "target_action": "paper_integration",
  "requires_structure_review": false
}
```

### 2. Source Manifest

Every large input must produce a manifest before content generation.

Output:

```json
{
  "source_id": "source:paper_x",
  "title": "Paper title",
  "authors": [],
  "year": "YYYY",
  "source_type": "paper",
  "input_format": "pdf | markdown | tex | docx | text",
  "extraction_method": "provided_markdown | pdf_text | ocr | manual",
  "checksum": "optional stable checksum",
  "license_notes": "",
  "created_at": "ISO timestamp"
}
```

### 3. Structure-Preserving Extraction

For paper integration, the source mirror must preserve the original structure as
closely as the available extraction allows.

Required preservation targets:

- title
- authors and affiliation block when available
- abstract
- section and subsection hierarchy
- equations in original order
- figures and tables as placeholders when binary rendering is unavailable
- captions
- references
- appendices

The source mirror must not be rewritten as a wiki explanation. It is a preserved
source artifact. Wiki links and ontology commentary should be placed in an
integration map or highlight metadata, not by changing the source copy.

Mirror output:

```markdown
# Paper Title

## Abstract

Original abstract text...

## 1. Introduction

Original section text...

![Figure 1 placeholder](source:paper_x#figure-1)

Caption: Original caption text...

## References

[1] Original reference...
```

### 4. Chunk Inventory

After extraction, the source is split into stable chunks.

Chunking rules:

- Prefer section boundaries over arbitrary token boundaries.
- Keep equations with the paragraph that introduces or explains them.
- Keep figure captions with the figure placeholder.
- Split very long sections into paragraph groups.
- Assign stable chunk ids that include source id and section path.
- Store source span information when available.

Chunk shape:

```json
{
  "chunk_id": "source:paper_x:section_2:chunk_003",
  "source_id": "source:paper_x",
  "section_id": "section_2",
  "heading_path": ["2. Method", "2.1 Hamiltonian"],
  "text": "...",
  "equations": [],
  "figures": [],
  "local_order": 3
}
```

### 5. Per-Chunk Extraction

Each chunk is processed independently before any global writing.

Extract:

- concepts
- definitions
- assumptions
- equations
- claims
- derivation steps
- results
- limitations
- references to other work
- candidate highlight anchors

Per-chunk output:

```json
{
  "chunk_id": "source:paper_x:section_2:chunk_003",
  "concept_mentions": [],
  "claims": [],
  "equations": [],
  "candidate_relations": [
    {
      "source_anchor": "Schrodinger equation",
      "relation": "uses_mathematical_form",
      "target_concept": "partial differential equation",
      "evidence_chunk": "source:paper_x:section_2:chunk_003"
    }
  ]
}
```

### 6. Source-Level Synthesis

The synthesis agent reads chunk outputs, not the whole source text. It merges
duplicated concepts, detects contradictions, and builds a source profile.

Output:

```json
{
  "source_id": "source:paper_x",
  "main_problem": "",
  "main_claims": [],
  "core_concepts": [],
  "argument_backbone": [],
  "concept_relation_candidates": [],
  "missing_or_uncertain_evidence": []
}
```

### 7. Ontology Snapshot and Reuse Resolution

Before creating nodes, compare extracted concepts against the current file
ontology.

Decisions:

- reuse existing file node
- attach alias to existing node
- create stub node
- create full concept node
- create paper mirror node
- create integration map node

The resolver must prefer reuse over duplicate nodes.

### 8. Expansion Plan

The expansion planner converts the source profile into a graph delta.

For concept creation:

- one primary concept file
- prerequisite stubs or reused nodes
- highlight links inside the concept file
- typed edges

For paper integration:

- one paper mirror file
- one integration map file
- reused concept files where possible
- stub concept files for missing prerequisites
- paper-to-concept highlight mentions
- paper-specific argument graph metadata

### 9. Highlight and Mention Planning

Highlight mentions are first-class artifacts. They should not be inferred only
from edges.

Each mention records:

- source file id
- target file id
- anchor text
- relation label
- context excerpt
- evidence chunk id when available

Mention shape:

```json
{
  "source_file_id": "paper-schrodinger-1926",
  "target_file_id": "wave-function",
  "anchor_text": "wave function",
  "relation": "defines",
  "context_excerpt": "The paper introduces the wave function...",
  "evidence_chunk_id": "source:paper_x:section_1:chunk_004"
}
```

### 10. Validation Gates

Large input processing must pass these gates before DB write:

- The source mirror preserves section order.
- Every chunk has a stable id.
- Every major claim is traceable to at least one chunk.
- Every generated edge has a source or rationale.
- Every required highlight target exists or has a stub creation plan.
- No paper-specific argument node is merged into a reusable concept node.
- No self-loop edges are created.
- The generated concept file is not just a source summary.
- The paper mirror is not rewritten as an explanatory wiki article.

### 11. DB Write Order

Use this order to avoid dangling references:

1. Create or update source manifest.
2. Save paper mirror file when applicable.
3. Save integration map file when applicable.
4. Save concept/stub files.
5. Save file edges.
6. Save workflow run metadata.
7. Save artifacts.
8. Save link mentions.
9. Refresh graph view.

If metadata tables are unavailable, file and edge writes may still proceed, but
the UI must warn that workflow provenance was not persisted.

## Recommended Agents

Add these agents before the existing ontology workflow:

```text
large_input_orchestrator
|-- source_intake_classifier
|-- source_manifest_builder
|-- structure_preserving_extractor
|-- chunk_inventory_builder
|-- chunk_concept_extractor
|-- chunk_relation_extractor
|-- source_synthesis_agent
`-- extraction_quality_reviewer
```

Then pass the source-level synthesis to:

```text
ontology_snapshot_agent
node_reuse_resolver
ontology_expansion_planner
highlight_link_designer
logic_flow_architect
file_author_agent
graph_consistency_validator
db_writer_agent
```

## Failure Handling

Stop and request review when:

- PDF/OCR extraction loses equations or section boundaries.
- The source is too large to chunk deterministically in the browser.
- The paper license or copy status is unclear.
- The source has contradictory extracted structures.
- The workflow would create many near-duplicate concept nodes.

In those cases, persist only intake/extraction artifacts and do not write final
ontology files until the user approves the corrected extraction.

## Implementation Notes

The current graph workflow supports manual paper markdown input and direct
ontology expansion. Large binary file upload should be added as a staged feature
rather than by placing entire PDFs into React component state.

Recommended future storage:

- `source_documents`
- `source_chunks`
- `source_extraction_runs`
- `file_ontology_generation_runs`
- `file_ontology_generation_artifacts`
- `file_ontology_link_mentions`

The existing workflow metadata tables already cover the final generation stage.
Large input support should add durable intake and chunk tables ahead of that
stage.
