import {
    normalizeFileOntologyLookup,
    type FileOntologyEdge,
    type FileOntologyFile,
} from './fileOntology';

export type OntologyWorkflowMode = 'auto' | 'concept' | 'paper';

export type OntologyWorkflowIntent = 'concept_file' | 'paper_integration';

export type OntologyWorkflowFileKind = 'concept' | 'paper' | 'stub' | 'integration_map';

type OntologySplitDecision = 'single_source_file' | 'source_plus_integration_map' | 'expanded_concept_neighborhood';

export interface OntologyWorkflowInput {
    mode: OntologyWorkflowMode;
    title: string;
    userGoal: string;
    researchNotes: string;
    paperMarkdown: string;
    existingFiles: FileOntologyFile[];
    existingEdges: FileOntologyEdge[];
}

export interface OntologyWorkflowFileDraft {
    file: FileOntologyFile;
    kind: OntologyWorkflowFileKind;
    action: 'create' | 'update';
}

export interface OntologyWorkflowEdgeDraft {
    edge: FileOntologyEdge;
    action: 'create' | 'skip_existing';
}

export interface OntologyWorkflowHighlightPlanItem {
    sourceFileId: string;
    targetFileId: string;
    anchorText: string;
    relation: string;
    context: string;
    required: boolean;
}

export interface OntologyWorkflowArtifact {
    artifactType: string;
    content: Record<string, unknown>;
}

export interface OntologyWorkflowResult {
    runId: string;
    intent: OntologyWorkflowIntent;
    sourceType: 'user_prompt' | 'paper_markdown';
    title: string;
    summary: string;
    files: OntologyWorkflowFileDraft[];
    edges: OntologyWorkflowEdgeDraft[];
    highlights: OntologyWorkflowHighlightPlanItem[];
    artifacts: OntologyWorkflowArtifact[];
    warnings: string[];
}

interface ConceptPattern {
    canonicalTitle: string;
    id: string;
    aliases: string[];
    summary: string;
    relation: string;
    stubSections: string[];
}

interface ResolvedConcept {
    title: string;
    id: string;
    summary: string;
    relation: string;
    existingFile: FileOntologyFile | null;
    source: 'catalog' | 'primary';
}

const CONCEPT_PATTERNS: ConceptPattern[] = [
    {
        canonicalTitle: 'Schrodinger Equation',
        id: 'schrodinger-equation',
        aliases: ['schrodinger equation', 'schrödinger equation', '슈뢰딩거 방정식'],
        summary: 'Quantum evolution law for a wave function under a Hamiltonian operator.',
        relation: 'primary_topic',
        stubSections: ['Overview', 'Mathematical Form', 'Physical Meaning'],
    },
    {
        canonicalTitle: 'Partial Differential Equation',
        id: 'partial-differential-equation',
        aliases: ['partial differential equation', 'pde', '편미분 방정식'],
        summary: 'An equation involving partial derivatives of a function of several variables.',
        relation: 'uses_mathematical_form',
        stubSections: ['Definition', 'Role in Physics', 'Connections'],
    },
    {
        canonicalTitle: 'Wave Equation',
        id: 'wave-equation',
        aliases: ['wave equation', 'classical wave equation', '파동방정식', '파동 방정식'],
        summary: 'A differential equation describing propagation of waves in classical fields.',
        relation: 'analogical_background',
        stubSections: ['Definition', 'Classical Form', 'Relation to Quantum Waves'],
    },
    {
        canonicalTitle: 'Wave Function',
        id: 'wave-function',
        aliases: ['wave function', 'wavefunction', 'psi function', '파동함수', '파동 함수'],
        summary: 'A complex-valued state amplitude whose squared magnitude gives probability density.',
        relation: 'evolves',
        stubSections: ['Definition', 'Probability Interpretation', 'Normalization'],
    },
    {
        canonicalTitle: 'Hamiltonian Operator',
        id: 'hamiltonian-operator',
        aliases: ['hamiltonian operator', 'hamiltonian', '해밀토니안', '해밀토니안 연산자'],
        summary: 'The operator that represents total energy and generates quantum time evolution.',
        relation: 'governed_by',
        stubSections: ['Definition', 'Energy Operator', 'Time Evolution'],
    },
    {
        canonicalTitle: 'Probability Amplitude',
        id: 'probability-amplitude',
        aliases: ['probability amplitude', '확률진폭', '확률 진폭'],
        summary: 'A complex amplitude whose modulus squared determines a probability.',
        relation: 'interprets',
        stubSections: ['Definition', 'Born Rule Link', 'Phase Information'],
    },
    {
        canonicalTitle: 'Born Rule',
        id: 'born-rule',
        aliases: ['born rule', 'born interpretation', '보른 규칙', '보른 해석'],
        summary: 'The rule that converts quantum amplitudes into measurement probabilities.',
        relation: 'interprets',
        stubSections: ['Statement', 'Probability Density', 'Measurement Link'],
    },
    {
        canonicalTitle: 'Eigenvalue Problem',
        id: 'eigenvalue-problem',
        aliases: ['eigenvalue problem', 'eigenvalue equation', '고유값 문제', '고윳값 문제'],
        summary: 'A problem of finding states that are scaled by an operator.',
        relation: 'mathematical_background',
        stubSections: ['Definition', 'Operator Form', 'Physics Use'],
    },
    {
        canonicalTitle: 'Linear Operator',
        id: 'linear-operator',
        aliases: ['linear operator', '선형 연산자'],
        summary: 'A map between vector spaces that preserves addition and scalar multiplication.',
        relation: 'mathematical_background',
        stubSections: ['Definition', 'Operator Algebra', 'Physics Use'],
    },
    {
        canonicalTitle: 'Hilbert Space',
        id: 'hilbert-space',
        aliases: ['hilbert space', '힐베르트 공간'],
        summary: 'A complete inner-product vector space used as the state space of quantum mechanics.',
        relation: 'mathematical_background',
        stubSections: ['Definition', 'State Space', 'Inner Products'],
    },
    {
        canonicalTitle: 'Boundary Condition',
        id: 'boundary-condition',
        aliases: ['boundary condition', 'boundary conditions', '경계 조건'],
        summary: 'A constraint imposed on a solution at the boundary of a domain.',
        relation: 'requires_condition',
        stubSections: ['Definition', 'Physical Constraints', 'Solution Selection'],
    },
    {
        canonicalTitle: 'Laplacian Operator',
        id: 'laplacian-operator',
        aliases: ['laplacian operator', 'laplacian', '라플라시안', '라플라스 연산자'],
        summary: 'A second-order differential operator measuring spatial curvature or divergence of gradient.',
        relation: 'uses_mathematical_form',
        stubSections: ['Definition', 'Coordinate Forms', 'Wave Mechanics'],
    },
    {
        canonicalTitle: 'Time Evolution',
        id: 'time-evolution',
        aliases: ['time evolution', '시간발전', '시간 발전'],
        summary: 'The rule that determines how a physical state changes over time.',
        relation: 'explains',
        stubSections: ['Definition', 'Generators', 'Physics Examples'],
    },
    {
        canonicalTitle: 'Quantum Measurement',
        id: 'quantum-measurement',
        aliases: ['quantum measurement', 'measurement postulate', '양자 측정'],
        summary: 'The process by which a quantum state is associated with observable outcomes.',
        relation: 'interprets',
        stubSections: ['Definition', 'Observable Outcomes', 'State Update'],
    },
];

const PAPER_SECTION_PATTERN = /(^|\n)\s*#{1,3}\s+(abstract|introduction|references|conclusion|methods|results|discussion)\b/i;
const MARKDOWN_HEADING_PATTERN = /^\s*#{1,3}\s+.+$/gm;
const LIGHTWEIGHT_SECTION_PATTERN = /\b(chapter|section|섹션|장|절|introductory|overview|개요|입문)\b/i;
const FORCE_SPLIT_PATTERN = /\b(split|separate|node per|file per|detailed ontology|argument graph|claim graph|세분화|쪼개|나눠|파일 노드로 분리)\b/i;
const FORCE_SINGLE_FILE_PATTERN = /\b(single file|one file|one node|compact|do not split|don't split|통합|하나의 파일|하나로|나누지|쪼개지)\b/i;

function normalizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
}

function countMarkdownHeadings(markdown: string) {
    return Array.from(markdown.matchAll(MARKDOWN_HEADING_PATTERN)).length;
}

function estimateWordCount(value: string) {
    const asciiWords = value.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
    const koreanRuns = value.match(/[가-힣]+/g)?.length ?? 0;
    return asciiWords + koreanRuns;
}

function decideSplitStrategy(input: OntologyWorkflowInput, intent: OntologyWorkflowIntent, detectedConceptCount: number): OntologySplitDecision {
    const text = [input.title, input.userGoal, input.researchNotes, input.paperMarkdown].join('\n');
    const wordCount = estimateWordCount(text);
    const headingCount = countMarkdownHeadings(input.paperMarkdown);
    const userAskedForSingleFile = FORCE_SINGLE_FILE_PATTERN.test(text);
    const userAskedForSplit = FORCE_SPLIT_PATTERN.test(text);
    const looksLikeLightweightChapter = LIGHTWEIGHT_SECTION_PATTERN.test(text) && wordCount < 1800;

    if (userAskedForSingleFile) return 'single_source_file';
    if (userAskedForSplit) return 'expanded_concept_neighborhood';

    if (intent === 'paper_integration') {
        if (wordCount < 1200 || headingCount <= 4 || looksLikeLightweightChapter || detectedConceptCount <= 2) {
            return 'single_source_file';
        }

        if (wordCount < 3200 || detectedConceptCount <= 4) {
            return 'source_plus_integration_map';
        }

        return 'expanded_concept_neighborhood';
    }

    if (detectedConceptCount > 5 && wordCount > 1200) return 'expanded_concept_neighborhood';
    return 'source_plus_integration_map';
}

function createRunId() {
    const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);

    return `file-generation-${suffix}`;
}

function titleFromMarkdown(markdown: string) {
    const heading = markdown.match(/^\s*#\s+(.+)$/m);
    return normalizeText(heading?.[1] ?? '');
}

function classifyIntent(input: OntologyWorkflowInput): OntologyWorkflowIntent {
    if (input.mode === 'concept') return 'concept_file';
    if (input.mode === 'paper') return 'paper_integration';

    const paperText = input.paperMarkdown.trim();
    if (paperText.length > 800) return 'paper_integration';
    if (PAPER_SECTION_PATTERN.test(paperText)) return 'paper_integration';
    if (/\b(doi|arxiv|abstract|references)\b/i.test(input.userGoal + '\n' + input.researchNotes)) {
        return 'paper_integration';
    }

    return 'concept_file';
}

function buildExistingLookup(files: FileOntologyFile[]) {
    const lookup = new Map<string, FileOntologyFile>();

    files.forEach((file) => {
        [file.id, file.title, normalizeFileOntologyLookup(file.title)].forEach((key) => {
            const normalized = normalizeFileOntologyLookup(key);
            if (normalized) lookup.set(normalized, file);
        });
    });

    return lookup;
}

function makeUniqueFileId(title: string, existingFiles: FileOntologyFile[], reservedIds: Set<string>, prefix = '') {
    const existingIds = new Set(existingFiles.map((file) => file.id));
    const base = normalizeFileOntologyLookup(`${prefix}${title}`) || `${prefix || 'file'}node`;
    let candidate = base;
    let index = 2;

    while (existingIds.has(candidate) || reservedIds.has(candidate)) {
        candidate = `${base}-${index}`;
        index += 1;
    }

    reservedIds.add(candidate);
    return candidate;
}

function createStableEdgeId(sourceFileId: string, targetFileId: string, label: string) {
    return `edge-${normalizeFileOntologyLookup(sourceFileId)}-${normalizeFileOntologyLookup(targetFileId)}-${normalizeFileOntologyLookup(label)}`;
}

function edgeExists(edge: FileOntologyEdge, existingEdges: FileOntologyEdge[], draftEdges: FileOntologyEdge[]) {
    return [...existingEdges, ...draftEdges].some(
        (candidate) =>
            candidate.sourceFileId === edge.sourceFileId &&
            candidate.targetFileId === edge.targetFileId &&
            candidate.label === edge.label,
    );
}

function filePosition(index: number, existingFiles: FileOntologyFile[]) {
    const maxX = Math.max(120, ...existingFiles.map((file) => file.x + file.width));
    const lanes = Math.max(1, Math.ceil(Math.sqrt(index + 1)));
    const column = index % lanes;
    const row = Math.floor(index / lanes);

    return {
        x: maxX + 240 + column * 760,
        y: 140 + row * 560,
    };
}

function patternMatches(pattern: ConceptPattern, text: string) {
    const normalizedText = text.toLowerCase();
    return pattern.aliases.some((alias) => normalizedText.includes(alias.toLowerCase()));
}

function resolveConcepts(input: OntologyWorkflowInput, primaryTitle: string, includePrimary: boolean) {
    const lookup = buildExistingLookup(input.existingFiles);
    const text = [input.title, input.userGoal, input.researchNotes, input.paperMarkdown].join('\n');
    const concepts: ResolvedConcept[] = [];
    const seen = new Set<string>();

    const primaryId = normalizeFileOntologyLookup(primaryTitle);
    const primaryPattern = CONCEPT_PATTERNS.find(
        (pattern) =>
            normalizeFileOntologyLookup(pattern.canonicalTitle) === primaryId ||
            pattern.aliases.some((alias) => normalizeFileOntologyLookup(alias) === primaryId),
    );

    if (primaryTitle && includePrimary) {
        const id = primaryPattern?.id ?? primaryId;
        concepts.push({
            title: primaryPattern?.canonicalTitle ?? primaryTitle,
            id,
            summary: primaryPattern?.summary ?? `Concept file for ${primaryTitle}.`,
            relation: 'primary_topic',
            existingFile: lookup.get(id) ?? lookup.get(normalizeFileOntologyLookup(primaryTitle)) ?? null,
            source: 'primary',
        });
        seen.add(id);
    }

    CONCEPT_PATTERNS.forEach((pattern) => {
        if (!patternMatches(pattern, text)) return;
        if (seen.has(pattern.id)) return;

        concepts.push({
            title: pattern.canonicalTitle,
            id: pattern.id,
            summary: pattern.summary,
            relation: pattern.relation,
            existingFile: lookup.get(pattern.id) ?? lookup.get(normalizeFileOntologyLookup(pattern.canonicalTitle)) ?? null,
            source: 'catalog',
        });
        seen.add(pattern.id);
    });

    return concepts.slice(0, 10);
}

function buildStubContent(concept: ResolvedConcept) {
    const pattern = CONCEPT_PATTERNS.find((candidate) => candidate.id === concept.id);
    const sections = pattern?.stubSections ?? ['Definition', 'Connections', 'Open Questions'];

    return [
        `# ${concept.title}`,
        '',
        concept.summary,
        '',
        ...sections.flatMap((section) => [
            `## ${section}`,
            '',
            'This stub exists so higher-level ontology files can link to this concept before a full note is written.',
            '',
        ]),
    ].join('\n').trimEnd();
}

function targetFileId(concept: ResolvedConcept) {
    return concept.existingFile?.id ?? concept.id;
}

function buildConceptContent(primary: ResolvedConcept, related: ResolvedConcept[], userGoal: string) {
    const linkLines = related
        .filter((concept) => targetFileId(concept) !== targetFileId(primary))
        .map((concept) => `- [[${targetFileId(concept)}|${concept.title}]]: ${concept.relation.replace(/_/g, ' ')}`);

    const inlineLinks = related
        .filter((concept) => targetFileId(concept) !== targetFileId(primary))
        .slice(0, 4)
        .map((concept) => `[[${targetFileId(concept)}|${concept.title}]]`);

    return [
        `# ${primary.title}`,
        '',
        '## Overview',
        '',
        inlineLinks.length > 0
            ? `${primary.title} should be read as part of a connected ontology rather than as an isolated note. It is directly connected to ${inlineLinks.join(', ')}.`
            : `${primary.title} is a new ontology file ready for expansion with linked prerequisite and neighboring concepts.`,
        '',
        '## Purpose',
        '',
        normalizeText(userGoal) || `Explain ${primary.title} with graph-native links to prerequisite and neighboring concepts.`,
        '',
        '## Required Background',
        '',
        linkLines.length > 0 ? linkLines.join('\n') : '- Add prerequisite links as the ontology grows.',
        '',
        '## Logic Flow',
        '',
        '1. Define the concept before using its equations or interpretations.',
        '2. Introduce the mathematical structure and link each required background node.',
        '3. Explain the physical meaning through connected concepts.',
        '4. Record limits, special cases, and common misunderstandings.',
        '',
        '## Connections',
        '',
        linkLines.length > 0 ? linkLines.join('\n') : '- No linked neighbor has been selected yet.',
    ].join('\n');
}

function buildPaperIntegrationMap(
    paperTitle: string,
    paperFileId: string,
    related: ResolvedConcept[],
    userGoal: string,
) {
    const relationRows = related.map(
        (concept) => `- [[${targetFileId(concept)}|${concept.title}]]: ${concept.relation.replace(/_/g, ' ')}`,
    );

    return [
        `# ${paperTitle} Wiki Integration Map`,
        '',
        '## Source Mirror',
        '',
        `The structure-preserving paper mirror is stored as [[${paperFileId}|${paperTitle}]]. This map integrates the paper into the wider file ontology without rewriting the source mirror.`,
        '',
        '## Integration Goal',
        '',
        normalizeText(userGoal) || 'Connect the paper to reusable concept files and argument-flow neighborhoods.',
        '',
        '## Concept Links',
        '',
        relationRows.length > 0 ? relationRows.join('\n') : '- No concept links were detected yet.',
        '',
        '## Argument Backbone',
        '',
        '- Problem or motivation: identify from the paper abstract and introduction.',
        '- Assumptions and definitions: map to concept files when possible.',
        '- Derivation steps: keep paper-specific argument nodes separate from reusable concept nodes.',
        '- Results and limitations: connect back to the concept graph through evidence-backed edges.',
        '',
        '## Next Expansion',
        '',
        '- Promote missing prerequisite stubs into full concept files.',
        '- Add finer highlight mentions for equations, definitions, and claims.',
    ].join('\n');
}

function mentionContext(sourceTitle: string, targetTitle: string) {
    return `${sourceTitle} connects to ${targetTitle} through the ontology expansion workflow.`;
}

function buildHighlightPlan(sourceFileId: string, sourceTitle: string, related: ResolvedConcept[]) {
    return related
        .filter((concept) => targetFileId(concept) !== sourceFileId)
        .map((concept) => ({
            sourceFileId,
            targetFileId: targetFileId(concept),
            anchorText: concept.title,
            relation: concept.relation,
            context: mentionContext(sourceTitle, concept.title),
            required: true,
        }));
}

function addEdgeDraft(
    sourceFileId: string,
    targetFileId: string,
    label: string,
    existingEdges: FileOntologyEdge[],
    edgeDrafts: OntologyWorkflowEdgeDraft[],
) {
    if (sourceFileId === targetFileId) return;

    const edge: FileOntologyEdge = {
        id: createStableEdgeId(sourceFileId, targetFileId, label),
        sourceFileId,
        targetFileId,
        label,
    };
    const createdEdges = edgeDrafts.map((draft) => draft.edge);

    edgeDrafts.push({
        edge,
        action: edgeExists(edge, existingEdges, createdEdges) ? 'skip_existing' : 'create',
    });
}

function artifact(artifactType: string, content: Record<string, unknown>): OntologyWorkflowArtifact {
    return { artifactType, content };
}

export function buildOntologyWorkflow(input: OntologyWorkflowInput): OntologyWorkflowResult {
    const runId = createRunId();
    const intent = classifyIntent(input);
    const title =
        normalizeText(input.title) ||
        titleFromMarkdown(input.paperMarkdown) ||
        (intent === 'paper_integration' ? 'Integrated Paper' : 'Untitled Concept');
    const warnings: string[] = [];
    const reservedIds = new Set<string>();
    const fileDrafts: OntologyWorkflowFileDraft[] = [];
    const edgeDrafts: OntologyWorkflowEdgeDraft[] = [];
    const sourceType = intent === 'paper_integration' ? 'paper_markdown' : 'user_prompt';
    const concepts = resolveConcepts(input, title, intent === 'concept_file');
    const splitDecision = decideSplitStrategy(input, intent, concepts.length);
    const shouldCreateConceptFiles = splitDecision === 'expanded_concept_neighborhood';
    const shouldCreateIntegrationMap = intent === 'paper_integration' && splitDecision !== 'single_source_file';

    if (intent === 'paper_integration' && !input.paperMarkdown.trim()) {
        warnings.push('Paper integration was selected, but no paper markdown was provided.');
    }

    const paperTitle = intent === 'paper_integration' ? title : '';
    const primaryConcept = concepts[0] ?? {
        title,
        id: normalizeFileOntologyLookup(title) || 'untitled-concept',
        summary: `Concept file for ${title}.`,
        relation: 'primary_topic',
        existingFile: null,
        source: 'primary' as const,
    };

    const relatedConcepts =
        splitDecision === 'single_source_file'
            ? []
            : intent === 'paper_integration'
              ? concepts
              : concepts.filter((concept) => concept.id !== primaryConcept.id);
    const linkableRelatedConcepts = relatedConcepts.filter(
        (concept) => shouldCreateConceptFiles || concept.existingFile,
    );

    if (!shouldCreateConceptFiles && relatedConcepts.some((concept) => !concept.existingFile)) {
        warnings.push(
            'Some detected concepts were kept inside the source file instead of being split into separate file nodes.',
        );
    }

    relatedConcepts.forEach((concept, index) => {
        if (!shouldCreateConceptFiles || concept.existingFile) return;

        const position = filePosition(fileDrafts.length + index, input.existingFiles);
        fileDrafts.push({
            kind: 'stub',
            action: 'create',
            file: {
                id: concept.id,
                title: concept.title,
                summary: concept.summary,
                content: buildStubContent(concept),
                x: position.x,
                y: position.y,
                width: 420,
                height: 300,
            },
        });
    });

    let primaryFileId = primaryConcept.id;
    let sourceFileId = primaryFileId;
    let sourceTitle = primaryConcept.title;

    if (intent === 'paper_integration') {
        const paperFileId = makeUniqueFileId(paperTitle, input.existingFiles, reservedIds, 'paper ');
        const paperPosition = filePosition(fileDrafts.length, input.existingFiles);
        const sourceContent = input.paperMarkdown.trim() || [
            `# ${paperTitle}`,
            '',
            normalizeText(input.researchNotes) || 'Source material is intentionally kept as one compact ontology file.',
        ].join('\n');

        fileDrafts.unshift({
            kind: 'paper',
            action: 'create',
            file: {
                id: paperFileId,
                title: paperTitle,
                summary:
                    splitDecision === 'single_source_file'
                        ? 'Compact source mirror kept as one file node because the material is lightweight or the user requested no split.'
                        : 'Structure-preserving source mirror. Wiki integration links are stored in the integration map and workflow metadata.',
                content: sourceContent,
                x: paperPosition.x,
                y: paperPosition.y,
                width: splitDecision === 'single_source_file' ? 680 : 560,
                height: splitDecision === 'single_source_file' ? 520 : 460,
            },
        });

        primaryFileId = paperFileId;

        if (shouldCreateIntegrationMap) {
            const mapFileId = makeUniqueFileId(`${paperTitle} Integration Map`, input.existingFiles, reservedIds);
            const mapPosition = filePosition(fileDrafts.length + 1, input.existingFiles);

            fileDrafts.splice(1, 0, {
                kind: 'integration_map',
                action: 'create',
                file: {
                    id: mapFileId,
                    title: `${paperTitle} Integration Map`,
                    summary: 'Connects a preserved source mirror to reusable concept files and argument-flow neighborhoods.',
                    content: buildPaperIntegrationMap(paperTitle, paperFileId, linkableRelatedConcepts, input.userGoal),
                    x: mapPosition.x,
                    y: mapPosition.y,
                    width: 520,
                    height: 420,
                },
            });

            sourceFileId = mapFileId;
            sourceTitle = `${paperTitle} Integration Map`;
            addEdgeDraft(mapFileId, paperFileId, 'preserves_source_structure', input.existingEdges, edgeDrafts);
        } else {
            sourceFileId = paperFileId;
            sourceTitle = paperTitle;
            warnings.push(
                'Split decision: single source file. Sections stay inside the markdown body instead of becoming separate file nodes.',
            );
        }
    } else {
        const existingPrimary = primaryConcept.existingFile;
        const content = buildConceptContent(primaryConcept, linkableRelatedConcepts, input.userGoal);

        if (existingPrimary) {
            fileDrafts.unshift({
                kind: 'concept',
                action: 'update',
                file: {
                    ...existingPrimary,
                    summary: existingPrimary.summary || primaryConcept.summary,
                    content: existingPrimary.content.includes('## Workflow Expansion')
                        ? existingPrimary.content
                        : `${existingPrimary.content.trimEnd()}\n\n## Workflow Expansion\n\n${content}`,
                },
            });
            primaryFileId = existingPrimary.id;
            sourceFileId = existingPrimary.id;
            sourceTitle = existingPrimary.title;
        } else {
            const position = filePosition(fileDrafts.length, input.existingFiles);
            fileDrafts.unshift({
                kind: 'concept',
                action: 'create',
                file: {
                    id: primaryConcept.id,
                    title: primaryConcept.title,
                    summary: primaryConcept.summary,
                    content,
                    x: position.x,
                    y: position.y,
                    width: 520,
                    height: 420,
                },
            });
        }
    }

    const highlights = buildHighlightPlan(sourceFileId, sourceTitle, linkableRelatedConcepts);
    linkableRelatedConcepts.forEach((concept) => {
        addEdgeDraft(sourceFileId, targetFileId(concept), concept.relation, input.existingEdges, edgeDrafts);
    });

    const createdCount = fileDrafts.filter((draft) => draft.action === 'create').length;
    const edgeCount = edgeDrafts.filter((draft) => draft.action === 'create').length;

    return {
        runId,
        intent,
        sourceType,
        title,
        summary:
            intent === 'paper_integration'
                ? splitDecision === 'single_source_file'
                    ? 'Single source file workflow: lightweight source sections were kept inside one file node.'
                    : `Source mirror workflow with ${highlights.length} planned concept highlights.`
                : `Concept workflow with ${highlights.length} planned ontology highlights.`,
        files: fileDrafts,
        edges: edgeDrafts,
        highlights,
        warnings,
        artifacts: [
            artifact('intent_decision', {
                intent,
                sourceType,
                title,
                split_decision: splitDecision,
                reason:
                    intent === 'paper_integration'
                        ? splitDecision === 'single_source_file'
                            ? 'Source was judged lightweight enough to preserve as one file node.'
                            : 'Paper/source markdown or paper-like structure was detected and needs integration.'
                        : 'Input is treated as a reusable concept file request.',
            }),
            artifact('node_reuse_resolution', {
                reused: concepts.filter((concept) => concept.existingFile).map((concept) => concept.id),
                created_or_stubbed: concepts.filter((concept) => !concept.existingFile).map((concept) => concept.id),
            }),
            artifact('ontology_expansion_plan', {
                primary_file_id: primaryFileId,
                files_to_create_or_update: createdCount,
                edges_to_create: edgeCount,
                related_concepts: linkableRelatedConcepts.map((concept) => ({
                    id: targetFileId(concept),
                    title: concept.title,
                    relation: concept.relation,
                })),
                kept_inside_source: relatedConcepts
                    .filter((concept) => !linkableRelatedConcepts.includes(concept))
                    .map((concept) => concept.title),
            }),
            artifact('highlight_link_plan', {
                highlights,
            }),
        ],
    };
}
