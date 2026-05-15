import type { KnowledgeNodeTemplate } from './knowledgeTaxonomy';
import { createKatexBlockMarkup } from './renderTopicMath';

type SymbolGlossaryItem = {
    symbol: string;
    meaning: string;
};

type ScholarlyNodeProfile = {
    formalStatement: string;
    assumptions: string[];
    equations: string[];
    symbols: SymbolGlossaryItem[];
    logicalSteps: string[];
    derivationSteps: string[];
    misconceptions: string[];
    masteryOutcomes: string[];
    example: string;
    limits: string[];
    nextNodes: string[];
};

export interface KnowledgeNodeDocumentSpec {
    summaryScope: string;
    requiredSections: string[];
    axioms: string[];
    canonicalEquations: string[];
    symbolGlossary: SymbolGlossaryItem[];
    logicalSteps: string[];
    derivationGoals: string[];
    misconceptionTargets: string[];
    masteryOutcomes: string[];
    selfStudyChecks: string[];
    nextNodes: string[];
}

export interface KnowledgeNodeDocumentContext {
    sourceTitle: string;
    sourceDocumentId: string;
    sphereName: string;
    clusterLabel: string;
    node: KnowledgeNodeTemplate;
    evidenceText: string;
    evidenceParagraphs: string[];
    equationCandidates: string[];
    relatedTitles: string[];
    prerequisiteTitles: string[];
    notes?: string;
}

export interface KnowledgeNodeDocumentParts {
    documentHtml: string;
    sourceSectionHtml: string;
    documentSpec: KnowledgeNodeDocumentSpec;
}

const REQUIRED_SECTION_TEMPLATES: Record<KnowledgeNodeTemplate['nodeType'], string[]> = {
    law: [
        'Overview',
        'Formal Statement',
        'Definitions and Symbols',
        'Assumptions and Scope',
        'Core Equations',
        'Logical Structure',
        'Derivation Roadmap',
        'Physical Interpretation',
        'Canonical Example',
        'Limits and Failure Modes',
        'Common Misconceptions',
        'Connections and Learning Path',
        'Mastery Targets',
        'Source Basis',
    ],
    quantity: [
        'Overview',
        'Definition',
        'Definitions and Symbols',
        'Scope and Measurement Role',
        'Core Equations',
        'Logical Structure',
        'Derivation Roadmap',
        'Physical Interpretation',
        'Canonical Example',
        'Limits and Failure Modes',
        'Common Misconceptions',
        'Connections and Learning Path',
        'Mastery Targets',
        'Source Basis',
    ],
    formalism: [
        'Overview',
        'Motivation',
        'Definitions and Symbols',
        'State Variables and Assumptions',
        'Core Equations',
        'Logical Structure',
        'Derivation Roadmap',
        'Interpretive Role',
        'Canonical Example',
        'Limits and Failure Modes',
        'Common Misconceptions',
        'Connections and Learning Path',
        'Mastery Targets',
        'Source Basis',
    ],
    concept: [
        'Overview',
        'Precise Meaning',
        'Definitions and Symbols',
        'Scope and Assumptions',
        'Core Equations',
        'Logical Structure',
        'Derivation Roadmap',
        'Interpretive Role',
        'Canonical Example',
        'Limits and Failure Modes',
        'Common Misconceptions',
        'Connections and Learning Path',
        'Mastery Targets',
        'Source Basis',
    ],
    problem_class: [
        'Overview',
        'Problem Setup',
        'Definitions and Symbols',
        'Assumptions and Idealizations',
        'Core Equations',
        'Logical Structure',
        'Derivation Roadmap',
        'Interpretive Role',
        'Canonical Example',
        'Limits and Failure Modes',
        'Common Misconceptions',
        'Connections and Learning Path',
        'Mastery Targets',
        'Source Basis',
    ],
};

const TYPE_LEVEL_DEFAULTS: Record<KnowledgeNodeTemplate['nodeType'], ScholarlyNodeProfile> = {
    law: {
        formalStatement:
            'State the governing relation precisely, define its domain of validity, and distinguish the exact mathematical claim from simplified textbook slogans.',
        assumptions: [
            'List the dynamical or constitutive assumptions that make the stated relation valid.',
            'Separate exact statements from low-velocity, weak-field, or linear-response approximations when relevant.',
        ],
        equations: [
            'Include the governing equation in its most informative form, together with any common special-case reduction.',
        ],
        symbols: [
            { symbol: 'variables', meaning: 'Define every symbol before using it in derivations or examples.' },
        ],
        logicalSteps: [
            'Identify the primitive quantities the law connects.',
            'Clarify whether the law is definitional, empirical, or derived from a broader formalism.',
            'Show how the law constrains admissible system evolution.',
        ],
        derivationSteps: [
            'State the mathematical starting point.',
            'List the intermediate identities or conservation statements needed.',
            'Mark the approximation or symmetry step where the final form appears.',
        ],
        misconceptions: [
            'Do not confuse a law with one computational shortcut or with one special coordinate representation.',
        ],
        masteryOutcomes: [
            'Be able to state the law with all symbols defined.',
            'Be able to decide when the law applies and when it does not.',
            'Be able to connect the law to neighboring nodes in the graph.',
        ],
        example:
            'Work a representative example that makes every assumption visible instead of hiding them inside algebra.',
        limits: [
            'Explain the boundary of validity and name at least one regime where a more general theory is needed.',
        ],
        nextNodes: [],
    },
    quantity: {
        formalStatement:
            'Define the quantity operationally and structurally: what it measures, how it is computed, and what more primitive objects it depends on.',
        assumptions: [
            'Specify the physical regime and coordinate or state-space context in which the quantity is defined.',
        ],
        equations: [
            'Include at least one defining relation and one relation showing how the quantity enters system dynamics.',
        ],
        symbols: [
            { symbol: 'units', meaning: 'Record dimension, units, or operator status when that distinction matters.' },
        ],
        logicalSteps: [
            'Identify the quantity as a node in a larger dependency chain.',
            'Show how the quantity is computed from more primitive variables.',
            'Show how downstream laws or conserved structures depend on it.',
        ],
        derivationSteps: [
            'Start from the precise definition.',
            'Derive the most common transformation or evolution rule for the quantity.',
        ],
        misconceptions: [
            'Separate the quantity itself from one of its numerical representations or units.',
        ],
        masteryOutcomes: [
            'Be able to define the quantity without circular language.',
            'Be able to compute it in a canonical example.',
            'Be able to explain why later nodes depend on it.',
        ],
        example:
            'Use a concrete physical configuration and compute the quantity step by step.',
        limits: [
            'State what the quantity does not capture by itself and what additional structure is needed.',
        ],
        nextNodes: [],
    },
    formalism: {
        formalStatement:
            'Present the formalism as a coherent representation of a theory: state variables, evolution rule, and organizing principle must all be explicit.',
        assumptions: [
            'Make clear what class of systems the formalism covers and what coordinate or phase-space structure it presupposes.',
        ],
        equations: [
            'Include the generating principle, the governing equations, and the map to observables or measurable consequences.',
        ],
        symbols: [
            { symbol: 'state variables', meaning: 'Define the minimal coordinates needed to state the formalism cleanly.' },
        ],
        logicalSteps: [
            'Explain why the formalism is introduced.',
            'State its primitive objects.',
            'Show how equations of motion or predictions emerge from those objects.',
        ],
        derivationSteps: [
            'Start from the organizing principle of the formalism.',
            'Derive the governing equations in a canonical setting.',
            'Map the formal result back to ordinary physical interpretation.',
        ],
        misconceptions: [
            'Do not present the formalism as mere notation; explain what conceptual work it performs.',
        ],
        masteryOutcomes: [
            'Be able to state the primitive objects of the formalism.',
            'Be able to derive its central equation in a canonical case.',
            'Be able to compare it with neighboring formalisms.',
        ],
        example:
            'Use a standard system to demonstrate how the formalism compresses the physics into a systematic derivation.',
        limits: [
            'State the assumptions under which the formalism is elegant, and what happens when those assumptions fail.',
        ],
        nextNodes: [],
    },
    concept: {
        formalStatement:
            'Give a precise conceptual definition that distinguishes the node from nearby ideas and from informal textbook language.',
        assumptions: [
            'State the conceptual frame and the mathematical structure in which the concept is meaningful.',
        ],
        equations: [
            'Include equations when the concept has a standard mathematical representation or diagnostic criterion.',
        ],
        symbols: [
            { symbol: 'representation', meaning: 'Define the mathematical objects used to represent the concept.' },
        ],
        logicalSteps: [
            'State the conceptual role of the node.',
            'Show what definitions it depends on.',
            'Show how it changes the interpretation of downstream laws or models.',
        ],
        derivationSteps: [
            'Give the minimal mathematical route needed to justify the standard representation of the concept.',
        ],
        misconceptions: [
            'Prevent the concept from collapsing into one overly concrete example.',
        ],
        masteryOutcomes: [
            'Be able to define the concept precisely.',
            'Be able to identify it in equations and physical arguments.',
            'Be able to connect it to prerequisite and downstream nodes.',
        ],
        example:
            'Use one sharp example to show what the concept adds beyond informal intuition.',
        limits: [
            'Name one neighboring concept that is often confused with this one and separate them carefully.',
        ],
        nextNodes: [],
    },
    problem_class: {
        formalStatement:
            'Describe the canonical problem family by its setup, symmetry, unknowns, and governing equations.',
        assumptions: [
            'Separate the essential idealizations of the problem class from optional simplifications used in elementary treatments.',
        ],
        equations: [
            'Write the canonical governing equations and the conditions that close the system.',
        ],
        symbols: [
            { symbol: 'unknowns', meaning: 'List the dependent variables solved for in the problem class.' },
        ],
        logicalSteps: [
            'State the geometric or physical setup.',
            'Identify the symmetry or conservation structure.',
            'Write the equations and boundary conditions.',
            'Interpret the solution family.',
        ],
        derivationSteps: [
            'Move from setup to governing equations.',
            'Reduce the equations using symmetry or conserved quantities.',
            'Interpret the resulting solution parameters.',
        ],
        misconceptions: [
            'Do not let one special worked example stand in for the entire problem class.',
        ],
        masteryOutcomes: [
            'Be able to recognize when a new exercise belongs to this problem class.',
            'Be able to set up the equations before solving them.',
            'Be able to interpret how the solution changes when assumptions change.',
        ],
        example:
            'Present one canonical instance that reveals the structure of the entire family.',
        limits: [
            'Explain which altered assumptions push the system into a different problem class.',
        ],
        nextNodes: [],
    },
};

const NODE_LEVEL_PROFILES: Record<string, Partial<ScholarlyNodeProfile>> = {
    velocity: {
        equations: ['\\( \\mathbf{v} = d\\mathbf{r}/dt \\)', '\\( v_{avg} = \\Delta x / \\Delta t \\)'],
        symbols: [
            { symbol: '\\(\\mathbf{r}(t)\\)', meaning: 'position as a function of time' },
            { symbol: '\\(\\mathbf{v}(t)\\)', meaning: 'instantaneous velocity vector' },
        ],
    },
    acceleration: {
        equations: ['\\( \\mathbf{a} = d\\mathbf{v}/dt = d^2\\mathbf{r}/dt^2 \\)'],
    },
    force: {
        equations: ['\\( \\sum \\mathbf{F}_{ext} = d\\mathbf{p}/dt \\)'],
        misconceptions: ['Force is not the same thing as motion; force governs changes in momentum.'],
    },
    momentum: {
        equations: ['\\( \\mathbf{p} = m\\mathbf{v} \\)', '\\( d\\mathbf{p}/dt = \\sum \\mathbf{F}_{ext} \\)'],
    },
    newtons_second_law: {
        formalStatement:
            "Newton's second law is the dynamical statement that the net external force equals the time rate of change of momentum; the familiar \\(\\sum \\mathbf{F}=m\\mathbf{a}\\) form is the constant-mass special case.",
        equations: ['\\( \\sum \\mathbf{F}_{ext} = d\\mathbf{p}/dt \\)', '\\( \\sum \\mathbf{F}_{ext} = m\\mathbf{a} \\) for constant mass'],
        symbols: [
            { symbol: '\\(\\mathbf{F}_{ext}\\)', meaning: 'net external force' },
            { symbol: '\\(\\mathbf{p}\\)', meaning: 'linear momentum' },
            { symbol: '\\(m\\)', meaning: 'mass' },
            { symbol: '\\(\\mathbf{a}\\)', meaning: 'acceleration' },
        ],
        derivationSteps: [
            'Start from momentum as the dynamical state variable.',
            'Take its time derivative and identify the external interaction balance.',
            'Only after that impose constant mass to obtain the elementary \\(m\\mathbf{a}\\) form.',
        ],
        misconceptions: [
            'The law is not merely \\(F=ma\\); the momentum form is the more general statement.',
        ],
        nextNodes: ['Work', 'Energy', 'Angular Momentum'],
    },
    lagrangian_mechanics: {
        equations: ['\\( S[q] = \\int_{t_1}^{t_2} L(q, \\dot q, t)\\,dt \\)', '\\( \\delta S = 0 \\)'],
    },
    euler_lagrange_equation: {
        equations: ['\\( \\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot q_i} - \\frac{\\partial L}{\\partial q_i} = 0 \\)'],
    },
    hamiltonian_mechanics: {
        equations: ['\\( H(q,p,t) = \\sum_i p_i \\dot q_i - L \\)', '\\( \\dot q_i = \\partial H / \\partial p_i \\)', '\\( \\dot p_i = -\\partial H / \\partial q_i \\)'],
    },
    coulombs_law: {
        equations: ['\\( \\mathbf{F}_{12} = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}\\hat{\\mathbf{r}} \\)'],
    },
    electric_potential: {
        equations: ['\\( V = U/q \\)', '\\( \\mathbf{E} = -\\nabla V \\)'],
    },
    amperes_law: {
        equations: ['\\( \\oint \\mathbf{B}\\cdot d\\mathbf{l} = \\mu_0 I_{enc} \\)'],
    },
    faradays_law: {
        equations: ['\\( \\oint \\mathbf{E}\\cdot d\\mathbf{l} = -\\frac{d\\Phi_B}{dt} \\)'],
    },
    maxwells_equations: {
        equations: [
            '\\( \\nabla\\cdot\\mathbf{E} = \\rho/\\varepsilon_0 \\)',
            '\\( \\nabla\\cdot\\mathbf{B} = 0 \\)',
            '\\( \\nabla\\times\\mathbf{E} = -\\partial \\mathbf{B}/\\partial t \\)',
            '\\( \\nabla\\times\\mathbf{B} = \\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\,\\partial \\mathbf{E}/\\partial t \\)',
        ],
    },
    electromagnetic_wave: {
        equations: ['\\( c = 1/\\sqrt{\\mu_0\\varepsilon_0} \\)', '\\( \\nabla^2 \\mathbf{E} - \\frac{1}{c^2}\\frac{\\partial^2 \\mathbf{E}}{\\partial t^2} = 0 \\)'],
    },
    born_rule: {
        equations: ['\\( P(x) = |\\psi(x)|^2 \\)', '\\( \\int |\\psi(x)|^2 dx = 1 \\)'],
    },
    schrodinger_equation: {
        equations: ['\\( i\\hbar \\partial_t \\psi = \\hat H \\psi \\)', '\\( \\hat H \\psi = E\\psi \\) for stationary states'],
    },
    heisenberg_uncertainty: {
        equations: ['\\( \\Delta A\\,\\Delta B \\ge \\frac{1}{2}|\\langle [\\hat A, \\hat B] \\rangle| \\)', '\\( \\Delta x\\,\\Delta p \\ge \\hbar/2 \\)'],
    },
    partition_function: {
        equations: ['\\( Z = \\sum_i e^{-\\beta E_i} \\)', '\\( F = -k_B T \\ln Z \\)'],
    },
    free_energy: {
        equations: ['\\( F = U - TS \\)', '\\( F = -k_B T \\ln Z \\)'],
    },
    first_law_of_thermodynamics: {
        equations: ['\\( dU = \\delta Q - \\delta W \\)'],
    },
    second_law_of_thermodynamics: {
        equations: ['\\( dS \\ge \\delta Q/T \\)', '\\( \\Delta S_{isolated} \\ge 0 \\)'],
    },
    fourier_analysis: {
        equations: ['\\( f(x) = \\int \\tilde f(k)e^{ikx}dk \\)', '\\( \\tilde f(k) = \\frac{1}{2\\pi}\\int f(x)e^{-ikx}dx \\)'],
    },
    greens_function: {
        equations: ['\\( L G(x,x\') = \\delta(x-x\') \\)', '\\( u(x) = \\int G(x,x\')f(x\')dx\' \\)'],
    },
    noethers_theorem: {
        equations: ['Continuous symmetry of the action \\(S\\) implies a conserved current or conserved quantity.'],
    },
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeUniqueList(values: Array<string | null | undefined>) {
    return Array.from(
        new Set(
            values
                .flatMap((value) =>
                    typeof value === 'string'
                        ? value
                              .split(/\n+/)
                              .map((entry) => entry.trim())
                              .filter(Boolean)
                        : [],
                ),
        ),
    );
}

function renderParagraph(text: string) {
    return `<p>${escapeHtml(text)}</p>`;
}

function renderWikiLinkText(items: string[]) {
    return items.length > 0 ? items.map((item) => `[[${item}]]`).join(', ') : 'To be expanded.';
}

function renderList(items: string[], ordered = false) {
    if (items.length === 0) {
        return '<p>To be expanded.</p>';
    }

    const tag = ordered ? 'ol' : 'ul';
    const markup = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    return `<${tag}>${markup}</${tag}>`;
}

function renderSymbolGlossary(items: SymbolGlossaryItem[]) {
    if (items.length === 0) {
        return '<p>Define the active symbols before extending this node further.</p>';
    }

    const rows = items
        .map(
            (item) =>
                `<tr><td><code>${escapeHtml(item.symbol)}</code></td><td>${escapeHtml(item.meaning)}</td></tr>`,
        )
        .join('');

    return `
<table>
  <thead>
    <tr><th>Symbol</th><th>Meaning</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`.trim();
}

function renderEquations(equations: string[]) {
    if (equations.length === 0) {
        return '<p>No explicit governing equation has been extracted yet. This node still requires equation grounding.</p>';
    }

    return equations
        .map((equation) => {
            const trimmed = equation.trim();
            if (!trimmed) return '';

            const inlineWrappedMatch = trimmed.match(/^\\\(([\s\S]+)\\\)$/);
            if (inlineWrappedMatch) {
                return createKatexBlockMarkup(inlineWrappedMatch[1]);
            }

            const blockWrappedMatch = trimmed.match(/^\\\[([\s\S]+)\\\]$/);
            if (blockWrappedMatch) {
                return createKatexBlockMarkup(blockWrappedMatch[1]);
            }

            const looksMathLike =
                /[=^_]|\\frac|\\sum|\\int|\\partial|\\nabla|\\cdot|\\times|\\hat|\\psi|\\phi|\\omega|\\Delta|\\lambda/.test(trimmed) ||
                /[A-Za-z]\s*=\s*/.test(trimmed);

            return looksMathLike
                ? createKatexBlockMarkup(trimmed)
                : `<p>${escapeHtml(trimmed)}</p>`;
        })
        .join('');
}

function explainKnowledgeEquation(equation: string, nodeTitle: string) {
    const trimmed = equation.trim();

    if (/\\frac\{d/.test(trimmed) || /\\partial/.test(trimmed)) {
        return `${nodeTitle} uses this relation to express change, so the learner should identify what varies, with respect to what, and under which assumptions the derivative exists.`;
    }

    if (/\\sum/.test(trimmed) || /\\oint/.test(trimmed) || /\\int/.test(trimmed)) {
        return `${nodeTitle} uses this equation as a balance law: local pieces are being assembled into one global constraint or conserved quantity.`;
    }

    if (/=/.test(trimmed)) {
        return `${nodeTitle} treats this expression as part of its formal backbone, so every symbol should be given a physical role before the equation is used computationally.`;
    }

    return `${nodeTitle} uses this statement as a compact formal claim that must be unpacked into definitions, scope conditions, and consequences.`;
}

function renderEquationCommentary(equations: string[], nodeTitle: string) {
    if (equations.length === 0) {
        return '<p>Equation-level commentary will appear after the node is grounded against richer source derivations.</p>';
    }

    return equations
        .map((equation) => {
            const trimmed = equation.trim();
            if (!trimmed) return '';

            return `
<div class="space-y-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
  ${renderEquations([trimmed])}
  <p>${escapeHtml(explainKnowledgeEquation(trimmed, nodeTitle))}</p>
</div>`.trim();
        })
        .join('');
}

function buildSelfStudyChecks(context: KnowledgeNodeDocumentContext, profile: ScholarlyNodeProfile) {
    return normalizeUniqueList([
        `State ${context.node.title} precisely without collapsing it into one memorized slogan.`,
        profile.equations[0]
            ? `Rewrite the first governing equation of ${context.node.title} from memory and define every symbol in words.`
            : `Identify which mathematical relation would count as the governing equation of ${context.node.title}.`,
        context.prerequisiteTitles[0]
            ? `Explain why [[${context.prerequisiteTitles[0]}]] is genuinely prerequisite to ${context.node.title}.`
            : `Name one prerequisite idea that must be mastered before ${context.node.title} can be used reliably.`,
        context.relatedTitles[0]
            ? `Compare ${context.node.title} with [[${context.relatedTitles[0]}]] and state what changes in the logic of the argument.`
            : `Name one downstream node whose logic would fail without ${context.node.title}.`,
    ]);
}

function mergeProfile(node: KnowledgeNodeTemplate, equationCandidates: string[]): ScholarlyNodeProfile {
    const typeDefaults = TYPE_LEVEL_DEFAULTS[node.nodeType];
    const nodeProfile = NODE_LEVEL_PROFILES[node.key] || {};

    return {
        formalStatement: nodeProfile.formalStatement || typeDefaults.formalStatement,
        assumptions: normalizeUniqueList([
            ...typeDefaults.assumptions,
            ...(nodeProfile.assumptions || []),
        ]),
        equations: normalizeUniqueList([
            ...(nodeProfile.equations || []),
            ...equationCandidates,
            ...typeDefaults.equations,
        ]),
        symbols: [
            ...typeDefaults.symbols,
            ...(nodeProfile.symbols || []),
        ],
        logicalSteps: normalizeUniqueList([
            ...typeDefaults.logicalSteps,
            ...(nodeProfile.logicalSteps || []),
        ]),
        derivationSteps: normalizeUniqueList([
            ...typeDefaults.derivationSteps,
            ...(nodeProfile.derivationSteps || []),
        ]),
        misconceptions: normalizeUniqueList([
            ...typeDefaults.misconceptions,
            ...(nodeProfile.misconceptions || []),
        ]),
        masteryOutcomes: normalizeUniqueList([
            ...typeDefaults.masteryOutcomes,
            ...(nodeProfile.masteryOutcomes || []),
        ]),
        example: nodeProfile.example || typeDefaults.example,
        limits: normalizeUniqueList([
            ...typeDefaults.limits,
            ...(nodeProfile.limits || []),
        ]),
        nextNodes: normalizeUniqueList([
            ...(node.related || []),
            ...(node.prerequisites || []),
            ...(nodeProfile.nextNodes || []),
            ...typeDefaults.nextNodes,
        ]),
    };
}

function buildNodeDefinitionLine(node: KnowledgeNodeTemplate, evidenceText: string) {
    switch (node.nodeType) {
        case 'law':
            return `${node.title} should be stated as a law-level claim, with its exact domain of validity separated from the simplified mnemonic form. ${evidenceText}`;
        case 'quantity':
            return `${node.title} should be defined as a quantity with clear operational meaning, precise symbols, and an explicit role inside later dynamical or statistical relations. ${evidenceText}`;
        case 'formalism':
            return `${node.title} should be presented as a formalism with state variables, governing principle, and a clear map from formal manipulations to physical interpretation. ${evidenceText}`;
        case 'problem_class':
            return `${node.title} should be framed as a recurring class of problems with a standard setup, governing equations, and a recognizable solution strategy. ${evidenceText}`;
        default:
            return `${node.title} should be defined precisely enough that it can support later laws, examples, and derivations without ambiguity. ${evidenceText}`;
    }
}

export function buildKnowledgeNodeDocument(
    context: KnowledgeNodeDocumentContext,
): KnowledgeNodeDocumentParts {
    const profile = mergeProfile(context.node, context.equationCandidates);
    const requiredSections = REQUIRED_SECTION_TEMPLATES[context.node.nodeType];
    const selfStudyChecks = buildSelfStudyChecks(context, profile);
    const documentSpec: KnowledgeNodeDocumentSpec = {
        summaryScope: context.evidenceText,
        requiredSections,
        axioms: profile.assumptions,
        canonicalEquations: profile.equations,
        symbolGlossary: profile.symbols,
        logicalSteps: profile.logicalSteps,
        derivationGoals: profile.derivationSteps,
        misconceptionTargets: profile.misconceptions,
        masteryOutcomes: profile.masteryOutcomes,
        selfStudyChecks,
        nextNodes: profile.nextNodes,
    };

    const prerequisiteLinks = renderWikiLinkText(context.prerequisiteTitles);
    const relatedLinks = renderWikiLinkText(context.relatedTitles);
    const nextLinks = renderWikiLinkText(profile.nextNodes);
    const evidenceParagraphs = context.evidenceParagraphs.length > 0
        ? context.evidenceParagraphs.map(renderParagraph).join('')
        : renderParagraph(context.evidenceText);

    const sourceSectionHtml = `
<section data-source-document="${escapeHtml(context.sourceDocumentId)}">
  <h2>Source Basis</h2>
  <p>This node was reconstructed from <strong>${escapeHtml(context.sourceTitle)}</strong> inside the ${escapeHtml(context.sphereName)} sphere and the ${escapeHtml(context.clusterLabel)} cluster.</p>
  ${evidenceParagraphs}
  ${context.notes ? `<p><em>Import note:</em> ${escapeHtml(context.notes)}</p>` : ''}
</section>`.trim();

    const documentHtml = `
<article data-generated-knowledge-doc="true" data-node-key="${escapeHtml(context.node.key)}" data-node-type="${escapeHtml(context.node.nodeType)}">
  <h1>${escapeHtml(context.node.title)}</h1>
  <h2>Overview</h2>
  <p>${escapeHtml(context.node.summary)}</p>
  <p>This node lives in <strong>${escapeHtml(context.sphereName)}</strong> / <strong>${escapeHtml(context.clusterLabel)}</strong> and is treated as a <strong>${escapeHtml(context.node.nodeType)}</strong> node in the knowledge graph.</p>
  <h2>${escapeHtml(requiredSections[1])}</h2>
  <p>${escapeHtml(profile.formalStatement)}</p>
  <p>${escapeHtml(buildNodeDefinitionLine(context.node, context.evidenceText))}</p>
  <h2>Definitions and Symbols</h2>
  ${renderSymbolGlossary(profile.symbols)}
  <h2>${escapeHtml(requiredSections[3])}</h2>
  ${renderList(profile.assumptions)}
  <h2>Core Equations</h2>
  ${renderEquations(profile.equations)}
  <h2>Equation Commentary</h2>
  ${renderEquationCommentary(profile.equations, context.node.title)}
  <h2>Logical Structure</h2>
  ${renderList(profile.logicalSteps, true)}
  <h2>Derivation Roadmap</h2>
  ${renderList(profile.derivationSteps, true)}
  <h2>${escapeHtml(
        context.node.nodeType === 'law' || context.node.nodeType === 'quantity'
            ? 'Physical Interpretation'
            : 'Interpretive Role',
    )}</h2>
  <p>${escapeHtml(
        `${context.node.title} should be understood not as an isolated label but as a bridge between prerequisite structure and downstream arguments in the ${context.clusterLabel} cluster.`,
    )}</p>
  <h2>Canonical Example</h2>
  <p>${escapeHtml(profile.example)}</p>
  <h2>Limits and Failure Modes</h2>
  ${renderList(profile.limits)}
  <h2>Common Misconceptions</h2>
  ${renderList(profile.misconceptions)}
  <h2>Connections and Learning Path</h2>
  <p><strong>Prerequisites:</strong> ${prerequisiteLinks}</p>
  <p><strong>Related nodes:</strong> ${relatedLinks}</p>
  <p><strong>Suggested next nodes:</strong> ${nextLinks}</p>
  <h2>Mastery Targets</h2>
  ${renderList(profile.masteryOutcomes)}
  <h2>Self-Study Checks</h2>
  ${renderList(selfStudyChecks)}
  ${sourceSectionHtml}
</article>`.trim();

    return {
        documentHtml,
        sourceSectionHtml,
        documentSpec,
    };
}
