import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Maximize2,
    Network,
    RefreshCw,
    Search,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { GraphEdge, GraphModel, GraphNode } from '../../lib/graphModel';
import { useTheme } from '../../lib/theme';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            math: any;
            mrow: any;
            mi: any;
            mo: any;
            mover: any;
            msub: any;
            mtext: any;
            mfrac: any;
            mspace: any;
            msup: any;
            mn: any;
        }
    }
}

declare module 'react/jsx-runtime' {
    namespace JSX {
        interface IntrinsicElements {
            math: any;
            mrow: any;
            mi: any;
            mo: any;
            mover: any;
            msub: any;
            mtext: any;
            mfrac: any;
            mspace: any;
            msup: any;
            mn: any;
        }
    }
}

const MIN_SCALE = 0.025;
const MAX_SCALE = 8;
const FIELD_MIN_WIDTH = 360;
const FIELD_MIN_HEIGHT = 220;
const FIELD_GAP = 460;
const FIELD_PADDING = 36;
const FIELD_HEADER_OFFSET = 128;
const TOPIC_MIN_WIDTH = 230;
const TOPIC_MIN_HEIGHT = 78;
const TOPIC_GAP = 34;
const PLANCK_CANVAS_WIDTH = 3740;
const PLANCK_CANVAS_HEIGHT = 1840;
const PLANCK_TOPIC_WIDTH = PLANCK_CANVAS_WIDTH;
const PLANCK_TOPIC_HEIGHT = PLANCK_CANVAS_HEIGHT;
const PLANCK_INSET_X = 0;
const PLANCK_INSET_Y = 0;
const PLANCK_TOPIC_IDS = new Set(['q1', 'planck-quantization']);
const PLANCK_TOPIC_SLUGS = new Set(['planck-quantization']);

type OntologyNodeKind = 'field' | 'topic' | 'section' | 'planck-category' | 'planck-box' | 'planck-outer';

type OntologyBox = {
    id: string;
    graphNodeId?: string;
    kind: OntologyNodeKind;
    parentId?: string | null;
    title: string;
    subtitle?: string;
    stage?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    nodes?: string[];
    isCore?: boolean;
    isOuter?: boolean;
    isContainer?: boolean;
};

type OntologyEdge = {
    fromId: string;
    toId: string;
    label: string;
    kind?: 'main' | 'support' | 'hierarchy';
    dir?: 'h' | 'v' | 'diagUp' | 'diagDown';
    fromAnchor?: Anchor;
    toAnchor?: Anchor;
    fromOffset?: [number, number];
    toOffset?: [number, number];
};

type DirectoryNode = {
    id: string;
    label: string;
    type: GraphNode['type'] | 'virtual-root';
    graphNode: GraphNode | null;
    children: DirectoryNode[];
};

type TransformState = {
    x: number;
    y: number;
    scale: number;
};

type OntologyLayout = {
    width: number;
    height: number;
    boxes: OntologyBox[];
    edges: OntologyEdge[];
    treeRoot: DirectoryNode;
    graphIdToBoxId: Map<string, string>;
    graphIdToBridgeBoxIds: Map<string, Record<string, string | undefined>>;
};

type Anchor = 'cl' | 'cr' | 'tc' | 'bc';

type DbOntologyPaper = {
    id: string;
    graph_node_id?: string | null;
    title: string;
    abstract_summary?: string | null;
    metadata?: Record<string, unknown> | null;
};

type DbOntologyNode = {
    id: string;
    type: string;
    label: string;
    summary?: string | null;
    equation_latex?: string | null;
    metadata?: Record<string, unknown> | null;
};

type DbOntologyEdge = {
    id: string;
    source: string;
    target: string;
    type: string;
    explanation?: string | null;
    metadata?: Record<string, unknown> | null;
};

type DbOntologyPayload = {
    paper: DbOntologyPaper;
    nodes: DbOntologyNode[];
    edges: DbOntologyEdge[];
};

export interface OntologyGraphHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    focusNode: (nodeId: string) => void;
}

interface OntologyGraphViewProps {
    model: GraphModel;
    focusedNodeId?: string | null;
    initialHeldNodeId?: string | null;
    onNodeFocus?: (nodeId: string | null) => void;
    onRefresh?: () => Promise<void> | void;
    headerActions?: ReactNode;
}

const planckCategories = [
    {
        id: 'problemDomain',
        stage: 'I',
        title: 'Problem Domain',
        subtitle: 'Define the universal black-body radiation target',
        x: 110,
        y: 145,
        w: 430,
        h: 1485,
    },
    {
        id: 'classicalInvariant',
        stage: 'II',
        title: 'Classical EM Structure',
        subtitle: 'Preserved Maxwellian cavity mode structure',
        x: 590,
        y: 145,
        w: 500,
        h: 1485,
    },
    {
        id: 'classicalFailure',
        stage: 'III',
        title: 'Classical Statistical Failure',
        subtitle: 'Where the classical mean-energy assignment breaks down',
        x: 1140,
        y: 145,
        w: 510,
        h: 1485,
    },
    {
        id: 'planckIntervention',
        stage: 'IV',
        title: "Planck's Statistical Intervention",
        subtitle: 'Finite energy elements, counting, entropy, and $\\varepsilon = h\\nu$',
        x: 1700,
        y: 145,
        w: 1180,
        h: 1485,
    },
    {
        id: 'synthesis',
        stage: 'V',
        title: 'Synthesis & Interpretation',
        subtitle: 'Planck law as preserved mode density plus replaced mean energy',
        x: 2930,
        y: 145,
        w: 700,
        h: 1485,
    },
];

const planckBoxes = [
    {
        id: 'targetProblem',
        category: 'problemDomain',
        cls: 'TargetProblem',
        x: 150,
        y: 285,
        w: 350,
        nodes: [
            'BlackBodyProblem',
            'object: equilibrium radiation spectrum',
            'target: universal $u(\\nu,T)$',
            'requires: material-independent law',
            'endpoint: PlanckRadiationLaw',
        ],
    },
    {
        id: 'empiricalConstraints',
        category: 'problemDomain',
        cls: 'Empirical / Thermodynamic Constraints',
        x: 150,
        y: 835,
        w: 350,
        nodes: [
            'KirchhoffUniversality',
            'WienDisplacementLaw',
            'WienEntropyScaling',
            'constraint: spectral form cannot be arbitrary',
            'role: restrict admissible entropy / energy scaling',
        ],
    },
    {
        id: 'equilibriumCavity',
        category: 'classicalInvariant',
        cls: 'EquilibriumCavitySystem',
        x: 640,
        y: 255,
        w: 400,
        nodes: [
            'Cavity',
            'RadiationField',
            'MaterialWall',
            'ThermalEquilibrium',
            'boundary: CavityBoundaryCondition',
            'role: realizes universal radiation field',
        ],
    },
    {
        id: 'maxwellModes',
        category: 'classicalInvariant',
        cls: 'MaxwellianModeStructure',
        x: 640,
        y: 710,
        w: 400,
        nodes: [
            'ElectromagneticNormalMode',
            'StandingWaveMode',
            'WaveVectorLattice',
            'CavityModeCounting',
            'ModeDensityPerVolume',
            'status: preserved by Planck',
        ],
    },
    {
        id: 'spectralFactorization',
        category: 'classicalInvariant',
        cls: 'SpectralFactorization',
        x: 640,
        y: 1185,
        w: 400,
        nodes: [
            '$u(\\nu,T)=\\dfrac{g(\\nu)}{V}\\,\\bar{E}(\\nu,T)$',
            'factor 1: mode density $g(\\nu)/V$',
            'factor 2: mean energy $\\bar{E}(\\nu,T)$',
            'logical split: counting vs energy assignment',
            'key: only factor 2 must be replaced',
        ],
    },
    {
        id: 'classicalEnergyHypothesis',
        category: 'classicalFailure',
        cls: 'ClassicalMeanEnergyHypothesis',
        x: 1190,
        y: 255,
        w: 410,
        nodes: [
            'ContinuousEnergyAssignment',
            'ClassicalEquipartition',
            'ClassicalMeanEnergy',
            '$\\bar{E}_{\\mathrm{cl}}(\\nu,T)=k_B T$',
            'assumption: every mode carries equal thermal energy',
        ],
    },
    {
        id: 'rayleighJeansRoute',
        category: 'classicalFailure',
        cls: 'RayleighJeansRoute',
        x: 1190,
        y: 710,
        w: 410,
        nodes: [
            'RayleighJeansLaw',
            '$u_{\\mathrm{RJ}}(\\nu,T)\\propto \\nu^2 k_B T$',
            'derivedFrom: ModeDensity + $\\bar{E}_{\\mathrm{cl}}$',
            'works: low-frequency limit',
            'fails: high-frequency limit',
        ],
    },
    {
        id: 'failureDiagnosis',
        category: 'classicalFailure',
        cls: 'FailureDiagnosis',
        x: 1190,
        y: 1185,
        w: 410,
        nodes: [
            'UltravioletCatastrophe',
            'HighFrequencyDivergence',
            'failureOf: unrestricted equipartition',
            'notFailureOf: Maxwell mode counting',
            'diagnosis: replace mean-energy function',
        ],
    },
    {
        id: 'resonatorExchange',
        category: 'planckIntervention',
        cls: 'ResonatorExchangeModel',
        x: 1750,
        y: 255,
        w: 500,
        nodes: [
            'PlanckResonatorModel',
            'HertzianResonator',
            'RadiationWallEnergyExchange',
            'FrequencySelectiveCoupling',
            'purpose: connect radiation frequency to material oscillator energy',
        ],
    },
    {
        id: 'countingProblem',
        category: 'planckIntervention',
        cls: 'DiscreteCountingProblem',
        x: 1750,
        y: 710,
        w: 500,
        nodes: [
            'FiniteEnergyElement',
            'EnergyElementDistribution',
            'NumberOfResonators $N$',
            'NumberOfEnergyElements $P$',
            'ComplexionNumber $W$',
            'operation: count discrete distributions of total energy',
        ],
    },
    {
        id: 'entropyConstruction',
        category: 'planckIntervention',
        cls: 'EntropyConstruction',
        x: 1750,
        y: 1185,
        w: 500,
        nodes: [
            'BoltzmannEntropy',
            '$S=k_B\\log W$',
            'PlanckEntropy',
            '$S=S(U/\\varepsilon)$',
            'meaning: entropy depends on $U$ measured in finite units $\\varepsilon$',
        ],
    },
    {
        id: 'wienCompatibility',
        category: 'planckIntervention',
        cls: 'WienCompatibilityCondition',
        x: 2320,
        y: 255,
        w: 500,
        nodes: [
            'CompatibilityWithWienScaling',
            'WienEntropyCondition',
            '$U/\\nu$ scaling',
            'requires: entropy form consistent with displacement law',
            'consequence: energy unit must scale with frequency',
        ],
    },
    {
        id: 'energyQuantum',
        category: 'planckIntervention',
        cls: 'EnergyQuantumPostulate',
        x: 2320,
        y: 710,
        w: 500,
        nodes: [
            'EnergyElement_hnu',
            'PlanckEnergyElement',
            'PlanckConstant $h$',
            '$\\varepsilon=h\\nu$',
            'conceptual move: finite element is frequency dependent',
        ],
    },
    {
        id: 'quantumMeanEnergy',
        category: 'planckIntervention',
        cls: 'QuantumMeanEnergyReplacement',
        x: 2320,
        y: 1185,
        w: 500,
        nodes: [
            'ThermodynamicTemperatureRelation',
            '$\\dfrac{1}{T}=\\dfrac{\\partial S}{\\partial U}$',
            'PlanckMeanEnergy',
            '$\\bar{E}_{P}(\\nu,T)=\\dfrac{h\\nu}{\\exp(h\\nu/k_B T)-1}$',
            'replaces: $\\bar{E}_{\\mathrm{cl}}=k_B T$',
        ],
    },
    {
        id: 'planckLawSynthesis',
        category: 'synthesis',
        cls: 'PlanckLawSynthesis',
        x: 2985,
        y: 300,
        w: 590,
        nodes: [
            'PlanckRadiationLaw',
            'derivedFrom: preserved ModeDensity',
            'derivedFrom: PlanckMeanEnergy',
            'resolves: UltravioletCatastrophe',
            'recovers: RayleighJeansLaw at $h\\nu \\ll k_B T$',
        ],
    },
    {
        id: 'historicalMeaning',
        category: 'synthesis',
        cls: 'HistoricalInterpretation',
        x: 2985,
        y: 805,
        w: 590,
        nodes: [
            'ModeDensityPreservationClaim',
            'MeanEnergyReplacementClaim',
            'ContinuityWithClassicalElectrodynamics',
            'RuptureWithClassicalStatistics',
            'QuantizationAsResonatorEnergyCounting',
        ],
    },
    {
        id: 'coreStatement',
        category: 'synthesis',
        isCore: true,
        cls: 'Core Ontology Statement',
        x: 2985,
        y: 1265,
        w: 590,
        nodes: [
            "Planck's law = classical cavity mode density + quantum-corrected mean energy.",
            'The ultraviolet catastrophe diagnoses the failure of classical equipartition, not the failure of Maxwellian mode counting.',
            'Quantization enters through $\\varepsilon=h\\nu$ and the resulting replacement of $\\bar{E}(\\nu,T)$.',
        ],
    },
];

const planckEdges: OntologyEdge[] = [
    { fromId: 'targetProblem', fromAnchor: 'bc', toId: 'empiricalConstraints', toAnchor: 'tc', label: 'restricted by', dir: 'v', kind: 'support' },
    { fromId: 'targetProblem', fromAnchor: 'cr', toId: 'equilibriumCavity', toAnchor: 'cl', label: 'realized as', dir: 'h' },
    { fromId: 'equilibriumCavity', fromAnchor: 'bc', toId: 'maxwellModes', toAnchor: 'tc', label: 'imposes', dir: 'v' },
    { fromId: 'maxwellModes', fromAnchor: 'bc', toId: 'spectralFactorization', toAnchor: 'tc', label: 'gives', dir: 'v' },
    { fromId: 'spectralFactorization', fromAnchor: 'cr', toId: 'rayleighJeansRoute', toAnchor: 'cl', fromOffset: [0, -45], toOffset: [0, -60], label: 'insert $\\bar{E}_{\\mathrm{cl}}$', dir: 'diagUp' },
    { fromId: 'classicalEnergyHypothesis', fromAnchor: 'bc', toId: 'rayleighJeansRoute', toAnchor: 'tc', label: 'supplies $\\bar{E}_{\\mathrm{cl}}$', dir: 'v' },
    { fromId: 'rayleighJeansRoute', fromAnchor: 'bc', toId: 'failureDiagnosis', toAnchor: 'tc', label: 'diverges into', dir: 'v' },
    { fromId: 'failureDiagnosis', fromAnchor: 'cr', toId: 'resonatorExchange', toAnchor: 'cl', label: 'motivates', dir: 'h' },
    { fromId: 'resonatorExchange', fromAnchor: 'bc', toId: 'countingProblem', toAnchor: 'tc', label: 'introduces', dir: 'v' },
    { fromId: 'countingProblem', fromAnchor: 'bc', toId: 'entropyConstruction', toAnchor: 'tc', label: 'yields', dir: 'v' },
    { fromId: 'empiricalConstraints', fromAnchor: 'cr', toId: 'wienCompatibility', toAnchor: 'cl', fromOffset: [0, -80], toOffset: [0, -80], label: 'requires', dir: 'diagUp', kind: 'support' },
    { fromId: 'entropyConstruction', fromAnchor: 'cr', toId: 'wienCompatibility', toAnchor: 'cl', toOffset: [0, 70], label: 'must satisfy', dir: 'diagUp' },
    { fromId: 'wienCompatibility', fromAnchor: 'bc', toId: 'energyQuantum', toAnchor: 'tc', label: 'forces', dir: 'v' },
    { fromId: 'energyQuantum', fromAnchor: 'bc', toId: 'quantumMeanEnergy', toAnchor: 'tc', label: 'determines', dir: 'v' },
    { fromId: 'spectralFactorization', fromAnchor: 'cr', toId: 'planckLawSynthesis', toAnchor: 'cl', fromOffset: [0, 35], toOffset: [0, -85], label: 'preserves $g(\\nu)/V$', dir: 'diagUp', kind: 'support' },
    { fromId: 'quantumMeanEnergy', fromAnchor: 'cr', toId: 'planckLawSynthesis', toAnchor: 'cl', toOffset: [0, 75], label: 'inserts $\\bar{E}_{P}$', dir: 'diagUp' },
    { fromId: 'failureDiagnosis', fromAnchor: 'cr', toId: 'planckLawSynthesis', toAnchor: 'cl', fromOffset: [0, 55], label: 'resolved by', dir: 'diagUp', kind: 'support' },
    { fromId: 'planckLawSynthesis', fromAnchor: 'bc', toId: 'historicalMeaning', toAnchor: 'tc', label: 'implies', dir: 'v' },
    { fromId: 'energyQuantum', fromAnchor: 'cr', toId: 'historicalMeaning', toAnchor: 'cl', toOffset: [0, 40], label: 'historical meaning', dir: 'h', kind: 'support' },
    { fromId: 'historicalMeaning', fromAnchor: 'bc', toId: 'coreStatement', toAnchor: 'tc', label: 'summarized as', dir: 'v' },
];

function splitMathSegments(text: ReactNode) {
    return String(text ?? '').split(/(\$[^$]+\$)/g).filter(Boolean);
}

function normalizeMath(math: ReactNode) {
    return String(math ?? '').replace(/\s+/g, '');
}

function EBar({ sub }: { sub?: string }) {
    if (!sub) {
        return (
            <mover>
                <mi>E</mi>
                <mo>¯</mo>
            </mover>
        );
    }

    return (
        <msub>
            <mover>
                <mi>E</mi>
                <mo>¯</mo>
            </mover>
            <mtext>{sub}</mtext>
        </msub>
    );
}

function UOfNuT({ name = 'u', sub }: { name?: string; sub?: string }) {
    const head = sub ? (
        <msub>
            <mi>{name}</mi>
            <mtext>{sub}</mtext>
        </msub>
    ) : (
        <mi>{name}</mi>
    );

    return (
        <>
            {head}
            <mo>(</mo>
            <mi>ν</mi>
            <mo>,</mo>
            <mi>T</mi>
            <mo>)</mo>
        </>
    );
}

function KBT() {
    return (
        <>
            <msub>
                <mi>k</mi>
                <mi>B</mi>
            </msub>
            <mi>T</mi>
        </>
    );
}

function Formula({ math }: { math: string }) {
    try {
        return (
            <span
                className="ontology-katex mx-0.5 inline-block max-w-full overflow-x-auto align-[-0.12em]"
                dangerouslySetInnerHTML={{
                    __html: katex.renderToString(math, {
                        displayMode: false,
                        throwOnError: false,
                        strict: false,
                        trust: false,
                        output: 'html',
                    }),
                }}
            />
        );
    } catch (_) {
        return (
            <span className="mx-0.5 inline-block max-w-full overflow-x-auto align-[-0.12em]">
                {prettyMath(math)}
            </span>
        );
    }

    const key = normalizeMath(math);
    let body: ReactNode = null;

    if (key === 'u(\\nu,T)') {
        body = <UOfNuT />;
    } else if (key === 'u(\\nu,T)=\\dfrac{g(\\nu)}{V}\\,\\bar{E}(\\nu,T)') {
        body = (
            <>
                <UOfNuT />
                <mo>=</mo>
                <mfrac>
                    <mrow>
                        <mi>g</mi>
                        <mo>(</mo>
                        <mi>ν</mi>
                        <mo>)</mo>
                    </mrow>
                    <mi>V</mi>
                </mfrac>
                <mspace width="0.25em" />
                <EBar />
                <mo>(</mo>
                <mi>ν</mi>
                <mo>,</mo>
                <mi>T</mi>
                <mo>)</mo>
            </>
        );
    } else if (key === 'g(\\nu)/V') {
        body = (
            <mfrac>
                <mrow>
                    <mi>g</mi>
                    <mo>(</mo>
                    <mi>ν</mi>
                    <mo>)</mo>
                </mrow>
                <mi>V</mi>
            </mfrac>
        );
    } else if (key === '\\bar{E}(\\nu,T)') {
        body = (
            <>
                <EBar />
                <mo>(</mo>
                <mi>ν</mi>
                <mo>,</mo>
                <mi>T</mi>
                <mo>)</mo>
            </>
        );
    } else if (key === '\\bar{E}_{\\mathrm{cl}}') {
        body = <EBar sub="cl" />;
    } else if (key === '\\bar{E}_{P}') {
        body = <EBar sub="P" />;
    } else if (key === '\\bar{E}_{\\mathrm{cl}}=k_BT') {
        body = (
            <>
                <EBar sub="cl" />
                <mo>=</mo>
                <KBT />
            </>
        );
    } else if (key === '\\bar{E}_{\\mathrm{cl}}(\\nu,T)=k_BT') {
        body = (
            <>
                <EBar sub="cl" />
                <mo>(</mo>
                <mi>ν</mi>
                <mo>,</mo>
                <mi>T</mi>
                <mo>)</mo>
                <mo>=</mo>
                <KBT />
            </>
        );
    } else if (key === 'u_{\\mathrm{RJ}}(\\nu,T)\\propto\\nu^2k_BT') {
        body = (
            <>
                <UOfNuT sub="RJ" />
                <mo>∝</mo>
                <msup>
                    <mi>ν</mi>
                    <mn>2</mn>
                </msup>
                <KBT />
            </>
        );
    } else if (key === 'S=k_B\\logW') {
        body = (
            <>
                <mi>S</mi>
                <mo>=</mo>
                <msub>
                    <mi>k</mi>
                    <mi>B</mi>
                </msub>
                <mi>log</mi>
                <mi>W</mi>
            </>
        );
    } else if (key === 'S=S(U/\\varepsilon)') {
        body = (
            <>
                <mi>S</mi>
                <mo>=</mo>
                <mi>S</mi>
                <mo>(</mo>
                <mfrac>
                    <mi>U</mi>
                    <mi>ε</mi>
                </mfrac>
                <mo>)</mo>
            </>
        );
    } else if (key === 'U/\\nu') {
        body = (
            <mfrac>
                <mi>U</mi>
                <mi>ν</mi>
            </mfrac>
        );
    } else if (key === '\\varepsilon=h\\nu') {
        body = (
            <>
                <mi>ε</mi>
                <mo>=</mo>
                <mi>h</mi>
                <mi>ν</mi>
            </>
        );
    } else if (key === '\\dfrac{1}{T}=\\dfrac{\\partialS}{\\partialU}') {
        body = (
            <>
                <mfrac>
                    <mn>1</mn>
                    <mi>T</mi>
                </mfrac>
                <mo>=</mo>
                <mfrac>
                    <mrow>
                        <mo>∂</mo>
                        <mi>S</mi>
                    </mrow>
                    <mrow>
                        <mo>∂</mo>
                        <mi>U</mi>
                    </mrow>
                </mfrac>
            </>
        );
    } else if (key === '\\bar{E}_{P}(\\nu,T)=\\dfrac{h\\nu}{\\exp(h\\nu/k_BT)-1}') {
        body = (
            <>
                <EBar sub="P" />
                <mo>(</mo>
                <mi>ν</mi>
                <mo>,</mo>
                <mi>T</mi>
                <mo>)</mo>
                <mo>=</mo>
                <mfrac>
                    <mrow>
                        <mi>h</mi>
                        <mi>ν</mi>
                    </mrow>
                    <mrow>
                        <mi>exp</mi>
                        <mo>(</mo>
                        <mfrac>
                            <mrow>
                                <mi>h</mi>
                                <mi>ν</mi>
                            </mrow>
                            <mrow>
                                <msub>
                                    <mi>k</mi>
                                    <mi>B</mi>
                                </msub>
                                <mi>T</mi>
                            </mrow>
                        </mfrac>
                        <mo>)</mo>
                        <mo>−</mo>
                        <mn>1</mn>
                    </mrow>
                </mfrac>
            </>
        );
    } else if (key === 'h\\nu\\llk_BT') {
        body = (
            <>
                <mi>h</mi>
                <mi>ν</mi>
                <mo>≪</mo>
                <KBT />
            </>
        );
    } else if (key === 'N' || key === 'P' || key === 'W' || key === 'h' || key === 'U') {
        body = <mi>{key}</mi>;
    } else {
        body = <mtext>{prettyMath(math)}</mtext>;
    }

    return (
        <math className="mx-0.5 inline-block align-[-0.12em] text-[1.08em]">
            <mrow>{body}</mrow>
        </math>
    );
}

function prettyMath(math: string) {
    return String(math ?? '')
        .replaceAll('\\nu', 'ν')
        .replaceAll('\\varepsilon', 'ε')
        .replaceAll('\\epsilon', 'ε')
        .replaceAll('\\partial', '∂')
        .replaceAll('\\propto', '∝')
        .replaceAll('\\ll', '≪')
        .replaceAll('\\approx', '≈')
        .replaceAll('\\sqrt', 'sqrt')
        .replaceAll('\\phi', 'φ')
        .replaceAll('\\bar{E}', 'Ē')
        .replaceAll('\\mathrm{cl}', 'cl')
        .replaceAll('\\mathrm{RJ}', 'RJ')
        .replaceAll('\\log', 'log')
        .replaceAll('\\exp', 'exp')
        .replaceAll('\\dfrac', 'frac')
        .replaceAll('\\,', ' ')
        .replace(/[{}]/g, '');
}

function MathText({ children, className = '' }: { children: ReactNode; className?: string }) {
    const parts = splitMathSegments(children);
    return (
        <span className={className}>
            {parts.map((part, index) => (
                part.startsWith('$') && part.endsWith('$')
                    ? <Formula key={index} math={part.slice(1, -1)} />
                    : <React.Fragment key={index}>{part}</React.Fragment>
            ))}
        </span>
    );
}

function normalizeLabel(value: string | null | undefined) {
    return (value || '').replace(/\s+/g, ' ').trim();
}

function isPlanckNode(node: GraphNode | null | undefined) {
    if (!node) return false;
    return PLANCK_TOPIC_IDS.has(node.id) || PLANCK_TOPIC_SLUGS.has(node.slug || '');
}

function getOntologyPayload(node: GraphNode | null | undefined): DbOntologyPayload | null {
    const payload = node?.data?.ontology;
    if (!payload || typeof payload !== 'object') return null;

    const candidate = payload as Partial<DbOntologyPayload>;
    if (!candidate.paper || !Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
        return null;
    }

    return candidate as DbOntologyPayload;
}

function hasDetailedOntology(node: GraphNode | null | undefined) {
    return Boolean(getOntologyPayload(node)) || isPlanckNode(node);
}

function isDirectoryStructureNode(node: GraphNode | null | undefined) {
    return node?.type === 'field' || node?.type === 'cluster' || node?.type === 'topic';
}

function estimatePlainTextLength(value: string) {
    return prettyMath(value).replace(/\s+/g, ' ').trim().length;
}

function estimateOntologyItemHeight(value: string, availableCharsPerLine: number) {
    const plainLength = estimatePlainTextLength(value);
    const rows = Math.max(1, Math.ceil(plainLength / availableCharsPerLine));
    const mathSegmentCount = splitMathSegments(value)
        .filter((part) => part.startsWith('$') && part.endsWith('$'))
        .length;
    const hasTallMath = /\\dfrac|\\frac|\\partial|\\exp|\\bar|\\sum|\\int|\\sqrt/.test(value);
    const baseHeight = hasTallMath ? 70 : mathSegmentCount > 0 ? 44 : 34;
    const wrappedLineHeight = hasTallMath ? 20 : 18;

    return baseHeight + Math.max(0, rows - 1) * wrappedLineHeight;
}

function getAdaptivePlanckBoxSize(box: { w: number; nodes: string[]; isCore?: boolean; maxW?: number }) {
    const maxNodeLength = Math.max(0, ...box.nodes.map(estimatePlainTextLength));
    const maxWidth = Math.max(260, box.maxW ?? 760);
    const width = Math.min(maxWidth, Math.max(box.w, Math.min(760, Math.ceil(maxNodeLength * 6.9) + 72)));
    const availableCharsPerLine = Math.max(16, Math.floor((width - 58) / 7.4));
    const nodeHeight = box.nodes.reduce(
        (sum, node) => sum + estimateOntologyItemHeight(node, availableCharsPerLine),
        0,
    );
    const nodeGap = Math.max(0, box.nodes.length - 1) * 9;
    const chromeHeight = 84;
    const safetyPadding = box.nodes.some((node) => /\\dfrac|\\frac|\\partial|\\exp|\\bar/.test(node)) ? 18 : 10;
    const minHeight = box.isCore ? 0 : 0;

    return {
        w: width,
        h: Math.max(minHeight, Math.ceil(chromeHeight + nodeHeight + nodeGap + safetyPadding)),
    };
}

function getAdaptiveTopicBoxSize(label: string) {
    const titleLength = normalizeLabel(label).length;
    return {
        w: Math.max(TOPIC_MIN_WIDTH, Math.min(360, titleLength * 8 + 86)),
        h: TOPIC_MIN_HEIGHT,
    };
}

function numberFromMetadata(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringFromMetadata(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function stringArrayFromMetadata(value: unknown) {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
}

function getOntologyCanvas(payload: DbOntologyPayload | null, fallbackTitle: string) {
    const canvas = payload?.paper.metadata?.canvas as Record<string, unknown> | undefined;
    const categories = Array.isArray(canvas?.categories)
        ? (canvas.categories as Array<Record<string, unknown>>)
        : [];
    const categoryBounds = categories.map((category) => ({
        id: stringFromMetadata(category.id, ''),
        x: numberFromMetadata(category.x, 0),
        y: numberFromMetadata(category.y, 0),
        w: numberFromMetadata(category.w, 0),
        h: numberFromMetadata(category.h, 0),
    }));
    const categoryBoundById = new Map(categoryBounds.map((category) => [category.id, category]));
    const nodeBounds = (payload?.nodes || []).map((node, index) => {
        const layout = node.metadata?.layout as Record<string, unknown> | undefined;
        const items = stringArrayFromMetadata(node.metadata?.items);
        const fallbackItems = [
            node.summary || '',
            node.equation_latex ? `$${node.equation_latex}$` : '',
        ].filter(Boolean);
        const relativeX = numberFromMetadata(layout?.x, 160 + (index % 3) * 560);
        const categoryId = stringFromMetadata(layout?.category, '');
        const categoryBound = categoryBoundById.get(categoryId);
        const categoryMaxW = categoryBound
            ? Math.max(220, categoryBound.x + categoryBound.w - relativeX - 42)
            : undefined;
        const size = getAdaptivePlanckBoxSize({
            w: numberFromMetadata(layout?.w, 420),
            nodes: items.length > 0 ? items : fallbackItems,
            isCore: Boolean(layout?.isCore),
            maxW: categoryMaxW,
        });
        const nodeX = categoryBound
            ? Math.min(relativeX, categoryBound.x + categoryBound.w - size.w - 42)
            : relativeX;

        return {
            categoryId,
            x: Math.max(0, nodeX),
            y: numberFromMetadata(layout?.y, 285 + Math.floor(index / 3) * 420),
            w: size.w,
            h: size.h,
        };
    });
    const adjustedCategoryBounds = categoryBounds.map((category) => {
        const containedNodes = nodeBounds.filter((node) => node.categoryId === category.id);
        if (containedNodes.length === 0) return category;

        const maxNodeRight = Math.max(...containedNodes.map((node) => node.x + node.w));
        const maxNodeBottom = Math.max(...containedNodes.map((node) => node.y + node.h));

        return {
            ...category,
            w: Math.max(category.w, Math.ceil(maxNodeRight - category.x + 48)),
            h: Math.max(category.h, Math.ceil(maxNodeBottom - category.y + 70)),
        };
    });
    const bounds = [...adjustedCategoryBounds, ...nodeBounds];
    const computedWidth = bounds.length > 0
        ? Math.ceil(Math.max(...bounds.map((box) => box.x + box.w)) + 70)
        : PLANCK_TOPIC_WIDTH;
    const computedHeight = bounds.length > 0
        ? Math.ceil(Math.max(...bounds.map((box) => box.y + box.h)) + 90)
        : PLANCK_TOPIC_HEIGHT;

    return {
        title: stringFromMetadata(canvas?.title, payload?.paper.title || fallbackTitle),
        subtitle: stringFromMetadata(canvas?.subtitle, payload?.paper.abstract_summary || ''),
        width: computedWidth,
        height: computedHeight,
        categories: categories.map((category) => {
            const id = stringFromMetadata(category.id, '');
            const adjusted = adjustedCategoryBounds.find((bound) => bound.id === id);
            return adjusted
                ? { ...category, w: adjusted.w, h: adjusted.h }
                : category;
        }),
    };
}

function buildDirectoryTree(model: GraphModel): DirectoryNode {
    const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
    const childrenByParentId = new Map<string, string[]>();

    model.edges
        .filter((edge) => edge.type === 'hierarchy')
        .forEach((edge) => {
            const next = childrenByParentId.get(edge.source) || [];
            next.push(edge.target);
            childrenByParentId.set(edge.source, next);
        });

    const sortIds = (ids: string[]) => ids
        .filter((id) => nodeById.has(id))
        .sort((leftId, rightId) => {
            const left = nodeById.get(leftId)!;
            const right = nodeById.get(rightId)!;
            const leftYear = Number(left.data?.year ?? 0);
            const rightYear = Number(right.data?.year ?? 0);
            if (left.type === 'topic' && right.type === 'topic' && leftYear !== rightYear) {
                return leftYear - rightYear;
            }
            return normalizeLabel(left.label).localeCompare(normalizeLabel(right.label));
        });

    const visit = (id: string, seen = new Set<string>()): DirectoryNode | null => {
        const graphNode = nodeById.get(id);
        if (!graphNode || !isDirectoryStructureNode(graphNode) || seen.has(id)) return null;

        const nextSeen = new Set(seen);
        nextSeen.add(id);
        const childIds = graphNode.type === 'topic'
            ? []
            : sortIds(childrenByParentId.get(id) || [])
                .filter((childId) => isDirectoryStructureNode(nodeById.get(childId)));

        return {
            id,
            label: normalizeLabel(graphNode.label) || id,
            type: graphNode.type,
            graphNode,
            children: childIds.flatMap((childId) => {
                const child = visit(childId, nextSeen);
                return child ? [child] : [];
            }),
        };
    };

    const rootNode = nodeById.get('root');
    const fieldIds = model.nodes
        .filter((node) => node.type === 'field')
        .map((node) => node.id);

    return {
        id: rootNode?.id || 'root',
        label: rootNode?.label || 'Physics',
        type: rootNode?.type || 'virtual-root',
        graphNode: rootNode || null,
        children: sortIds(childrenByParentId.get(rootNode?.id || 'root') || fieldIds)
            .filter((fieldId) => isDirectoryStructureNode(nodeById.get(fieldId)))
            .flatMap((fieldId) => {
                const child = visit(fieldId);
                return child ? [child] : [];
            }),
    };
}

function buildOntologyLayout(model: GraphModel): OntologyLayout {
    const treeRoot = buildDirectoryTree(model);
    const graphIdToBoxId = new Map<string, string>();
    const graphIdToBridgeBoxIds = new Map<string, Record<string, string | undefined>>();
    const boxes: OntologyBox[] = [];
    const edges: OntologyEdge[] = [];

    const fieldPanels = treeRoot.children.filter((node) => node.type === 'field');
    const fieldLayouts = fieldPanels.map((field) => {
        const topics = field.children.filter((node) => node.type === 'topic' || node.type === 'cluster');
        const topicSpecs = topics.map((topic) => {
            const ontologyPayload = getOntologyPayload(topic.graphNode);
            const hasOntology = hasDetailedOntology(topic.graphNode);
            const ontologyCanvas = getOntologyCanvas(ontologyPayload, topic.label);
            const adaptiveSize = getAdaptiveTopicBoxSize(topic.label);
            return {
                topic,
                hasOntology,
                ontologyPayload,
                ontologyCanvas,
                w: hasOntology ? ontologyCanvas.width : adaptiveSize.w,
                h: hasOntology ? ontologyCanvas.height : adaptiveSize.h,
            };
        });
        const normalSpecs = topicSpecs.filter((spec) => !spec.hasOntology);
        const normalCols = normalSpecs.length <= 2 ? Math.max(1, normalSpecs.length) : 2;
        const normalRows = Math.ceil(normalSpecs.length / Math.max(1, normalCols));
        const rowHeights = Array.from({ length: normalRows }, (_, row) => {
            const rowItems = normalSpecs.slice(row * normalCols, row * normalCols + normalCols);
            return Math.max(TOPIC_MIN_HEIGHT, ...rowItems.map((spec) => spec.h));
        });
        const colWidths = Array.from({ length: normalCols }, (_, col) => {
            const colItems = normalSpecs.filter((_, index) => index % normalCols === col);
            return Math.max(TOPIC_MIN_WIDTH, ...colItems.map((spec) => spec.w));
        });
        const normalWidth = normalCols > 0
            ? colWidths.reduce((sum, value) => sum + value, 0) + Math.max(0, normalCols - 1) * TOPIC_GAP
            : 0;
        const normalHeight = normalRows > 0
            ? rowHeights.reduce((sum, value) => sum + value, 0) + Math.max(0, normalRows - 1) * TOPIC_GAP
            : 0;
        const ontologySpecs = topicSpecs.filter((spec) => spec.hasOntology);
        const ontologyWidth = Math.max(0, ...ontologySpecs.map((spec) => spec.w));
        const ontologyHeight = ontologySpecs.reduce((sum, spec) => sum + spec.h, 0)
            + Math.max(0, ontologySpecs.length - 1) * TOPIC_GAP;
        const contentWidth = Math.max(normalWidth, ontologyWidth);
        const contentHeight = normalHeight + (ontologySpecs.length > 0 ? TOPIC_GAP + ontologyHeight : 0);
        const fieldW = Math.max(FIELD_MIN_WIDTH, FIELD_PADDING * 2 + contentWidth);
        const fieldH = Math.max(FIELD_MIN_HEIGHT, FIELD_HEADER_OFFSET + contentHeight + FIELD_PADDING);
        return { field, topicSpecs, normalCols, rowHeights, colWidths, fieldW, fieldH };
    });

    let currentX = 180;
    const topY = 180;

    fieldLayouts.forEach(({ field, topicSpecs, normalCols, rowHeights, colWidths, fieldW, fieldH }, fieldIndex) => {
        const fieldX = currentX;
        const fieldBoxId = `field-${field.id}`;
        graphIdToBoxId.set(field.id, fieldBoxId);
        boxes.push({
            id: fieldBoxId,
            graphNodeId: field.id,
            kind: 'field',
            title: field.label,
            subtitle: field.graphNode?.description || '',
            x: fieldX,
            y: topY,
            w: fieldW,
            h: fieldH,
            stage: String(fieldIndex + 1).padStart(2, '0'),
            isContainer: true,
        });

        const normalSpecs = topicSpecs.filter((spec) => !spec.hasOntology);
        let cursorY = topY + FIELD_HEADER_OFFSET;
        normalSpecs.forEach(({ topic, w: topicW, h: topicH }, index) => {
            const row = Math.floor(index / Math.max(1, normalCols));
            const col = index % Math.max(1, normalCols);
            const topicBoxId = `topic-${topic.id}`;
            const topicX = fieldX + FIELD_PADDING + colWidths.slice(0, col).reduce((sum, value) => sum + value, 0) + col * TOPIC_GAP;
            const topicY = cursorY + rowHeights.slice(0, row).reduce((sum, value) => sum + value, 0) + row * TOPIC_GAP;
            graphIdToBoxId.set(topic.id, topicBoxId);
            boxes.push({
                id: topicBoxId,
                graphNodeId: topic.id,
                kind: 'topic',
                parentId: fieldBoxId,
                title: topic.label,
                x: topicX,
                y: topicY,
                w: topicW,
                h: topicH,
                isContainer: true,
            });
        });

        const normalRows = Math.ceil(normalSpecs.length / Math.max(1, normalCols));
        cursorY += normalRows > 0
            ? rowHeights.reduce((sum, value) => sum + value, 0) + Math.max(0, normalRows - 1) * TOPIC_GAP + TOPIC_GAP
            : 0;

        topicSpecs
            .filter((spec) => spec.hasOntology)
            .forEach(({ topic, ontologyPayload, ontologyCanvas }) => {
                const topicBoxId = `topic-${topic.id}`;
                const topicX = fieldX + FIELD_PADDING;
                const topicY = cursorY;
                graphIdToBoxId.set(topic.id, topicBoxId);
                boxes.push({
                    id: topicBoxId,
                    graphNodeId: topic.id,
                    kind: 'planck-outer',
                    parentId: fieldBoxId,
                    title: ontologyCanvas.title,
                    subtitle: ontologyCanvas.subtitle,
                    x: topicX,
                    y: topicY,
                    w: ontologyCanvas.width,
                    h: ontologyCanvas.height,
                    isOuter: true,
                    isContainer: true,
                });
                if (ontologyPayload) {
                    const categoryIds = new Set<string>();
                    const categoryLayoutById = new Map<string, { x: number; y: number; w: number; h: number }>();
                    ontologyCanvas.categories.forEach((category, index) => {
                        const categoryId = stringFromMetadata(category.id, `category-${index + 1}`);
                        const categoryLayout = {
                            x: numberFromMetadata(category.x, 110 + index * 520),
                            y: numberFromMetadata(category.y, 145),
                            w: numberFromMetadata(category.w, 520),
                            h: numberFromMetadata(category.h, Math.max(480, ontologyCanvas.height - 260)),
                        };
                        categoryIds.add(categoryId);
                        categoryLayoutById.set(categoryId, categoryLayout);
                        boxes.push({
                            id: `ontology-category-${topic.id}-${categoryId}`,
                            kind: 'planck-category',
                            parentId: topicBoxId,
                            title: stringFromMetadata(category.title, categoryId),
                            subtitle: stringFromMetadata(category.subtitle, ''),
                            stage: stringFromMetadata(category.stage, ''),
                            x: topicX + PLANCK_INSET_X + categoryLayout.x,
                            y: topicY + PLANCK_INSET_Y + categoryLayout.y,
                            w: categoryLayout.w,
                            h: categoryLayout.h,
                        });
                    });

                    const ontologyNodeIdToBoxId = new Map<string, string>();
                    ontologyPayload.nodes.forEach((ontologyNode, index) => {
                        const layout = ontologyNode.metadata?.layout as Record<string, unknown> | undefined;
                        const items = stringArrayFromMetadata(ontologyNode.metadata?.items);
                        const fallbackItems = [
                            ontologyNode.summary || '',
                            ontologyNode.equation_latex ? `$${ontologyNode.equation_latex}$` : '',
                        ].filter(Boolean);
                        const nodeItems = items.length > 0 ? items : fallbackItems;
                        const categoryId = stringFromMetadata(layout?.category, '');
                        const boxId = `ontology-node-${ontologyNode.id}`;
                        const parentId = categoryIds.has(categoryId)
                            ? `ontology-category-${topic.id}-${categoryId}`
                            : topicBoxId;
                        const baseW = numberFromMetadata(layout?.w, 420);
                        const categoryLayout = categoryLayoutById.get(categoryId);
                        const relativeX = numberFromMetadata(layout?.x, 160 + (index % 3) * 560);
                        const categoryMaxW = categoryLayout
                            ? Math.max(220, categoryLayout.x + categoryLayout.w - relativeX - 42)
                            : undefined;
                        const adaptiveSize = getAdaptivePlanckBoxSize({
                            w: baseW,
                            nodes: nodeItems,
                            isCore: Boolean(layout?.isCore),
                            maxW: categoryMaxW,
                        });
                        const nodeX = categoryLayout
                            ? Math.min(relativeX, categoryLayout.x + categoryLayout.w - adaptiveSize.w - 42)
                            : relativeX;
                        ontologyNodeIdToBoxId.set(ontologyNode.id, boxId);
                        boxes.push({
                            id: boxId,
                            graphNodeId: ontologyNode.id,
                            kind: 'planck-box',
                            parentId,
                            title: ontologyNode.label,
                            x: topicX + PLANCK_INSET_X + Math.max(PLANCK_INSET_X, nodeX),
                            y: topicY + PLANCK_INSET_Y + numberFromMetadata(layout?.y, 285 + Math.floor(index / 3) * 420),
                            w: adaptiveSize.w,
                            h: adaptiveSize.h,
                            nodes: nodeItems,
                            isCore: Boolean(layout?.isCore),
                        });
                    });

                    const findBridgeBoxId = (patterns: RegExp[]) => {
                        const match = ontologyPayload.nodes.find((node) => (
                            patterns.some((pattern) => pattern.test(node.id) || pattern.test(node.label))
                        ));
                        return match ? ontologyNodeIdToBoxId.get(match.id) || null : null;
                    };
                    const bridgeBoxIds = {
                        default:
                            findBridgeBoxId([/planckLawSynthesis/i, /PlanckLawSynthesis/i, /PlanckRadiationLaw/i])
                            || findBridgeBoxId([/quantumMeanEnergy/i, /PlanckMeanEnergy/i])
                            || ontologyNodeIdToBoxId.values().next().value,
                        temporal:
                            findBridgeBoxId([/historicalMeaning/i, /HistoricalInterpretation/i])
                            || findBridgeBoxId([/coreStatement/i, /Core Ontology Statement/i])
                            || ontologyNodeIdToBoxId.values().next().value,
                        prerequisite:
                            findBridgeBoxId([/spectralFactorization/i, /ModeDensity/i, /equilibriumCavity/i])
                            || findBridgeBoxId([/targetProblem/i])
                            || ontologyNodeIdToBoxId.values().next().value,
                        relational:
                            findBridgeBoxId([/planckLawSynthesis/i, /energyQuantum/i, /quantumMeanEnergy/i])
                            || ontologyNodeIdToBoxId.values().next().value,
                    };
                    graphIdToBridgeBoxIds.set(topic.id, bridgeBoxIds);

                    ontologyPayload.edges.forEach((ontologyEdge) => {
                        const edgeMetadata = ontologyEdge.metadata || {};
                        const fromId = ontologyNodeIdToBoxId.get(ontologyEdge.source);
                        const toId = ontologyNodeIdToBoxId.get(ontologyEdge.target);
                        if (!fromId || !toId) return;
                        edges.push({
                            fromId,
                            toId,
                            label: stringFromMetadata(edgeMetadata.label, ontologyEdge.type),
                            kind: stringFromMetadata(edgeMetadata.kind, 'main') === 'support' ? 'support' : 'main',
                            dir: stringFromMetadata(edgeMetadata.dir, 'h') as OntologyEdge['dir'],
                            fromAnchor: stringFromMetadata(edgeMetadata.fromAnchor, 'cr') as Anchor,
                            toAnchor: stringFromMetadata(edgeMetadata.toAnchor, 'cl') as Anchor,
                            fromOffset: Array.isArray(edgeMetadata.fromOffset) ? edgeMetadata.fromOffset as [number, number] : undefined,
                            toOffset: Array.isArray(edgeMetadata.toOffset) ? edgeMetadata.toOffset as [number, number] : undefined,
                        });
                    });
                } else {
                    planckCategories.forEach((category) => {
                        boxes.push({
                            id: `planck-category-${category.id}`,
                            kind: 'planck-category',
                            parentId: topicBoxId,
                            title: category.title,
                            subtitle: category.subtitle,
                            stage: category.stage,
                            x: topicX + PLANCK_INSET_X + category.x,
                            y: topicY + PLANCK_INSET_Y + category.y,
                            w: category.w,
                            h: category.h,
                        });
                    });

                    planckBoxes.forEach((box) => {
                        const adaptiveSize = getAdaptivePlanckBoxSize(box);
                        boxes.push({
                            id: `planck-${box.id}`,
                            kind: 'planck-box',
                            parentId: `planck-category-${box.category}`,
                            title: box.cls,
                            x: topicX + PLANCK_INSET_X + box.x,
                            y: topicY + PLANCK_INSET_Y + box.y,
                            w: adaptiveSize.w,
                            h: adaptiveSize.h,
                            nodes: box.nodes,
                            isCore: box.isCore,
                        });
                    });

                    planckEdges.forEach((edge) => {
                        edges.push({
                            ...edge,
                            fromId: `planck-${edge.fromId}`,
                            toId: `planck-${edge.toId}`,
                        });
                    });
                }
                cursorY += ontologyCanvas.height + TOPIC_GAP;
            });

        currentX += fieldW + FIELD_GAP;
    });

    model.edges
        .filter((edge) => edge.type !== 'hierarchy')
        .forEach((edge) => {
            const resolveGraphEdgeEndpoint = (
                graphNodeId: string,
                role: GraphEdge['type'] | undefined,
            ) => {
                const bridge = graphIdToBridgeBoxIds.get(graphNodeId);
                if (!bridge) return graphIdToBoxId.get(graphNodeId);
                return bridge[role || 'relational'] || bridge.relational || bridge.default || graphIdToBoxId.get(graphNodeId);
            };
            const fromId = resolveGraphEdgeEndpoint(edge.source, edge.type);
            const toId = resolveGraphEdgeEndpoint(edge.target, edge.type);
            if (!fromId || !toId || fromId === toId) return;

            const fromBox = boxes.find((box) => box.id === fromId);
            const toBox = boxes.find((box) => box.id === toId);
            if (!fromBox || !toBox) return;

            const fromCenterX = fromBox.x + fromBox.w / 2;
            const toCenterX = toBox.x + toBox.w / 2;
            edges.push({
                fromId,
                toId,
                label: edge.label || edge.type || 'relation',
                kind: edge.type === 'temporal' ? 'support' : 'main',
                dir: Math.abs(fromCenterX - toCenterX) > 800 ? 'h' : 'diagDown',
                fromAnchor: fromCenterX <= toCenterX ? 'cr' : 'cl',
                toAnchor: fromCenterX <= toCenterX ? 'cl' : 'cr',
            });
        });

    const width = Math.max(currentX + 180, 4200);
    const height = Math.max(...boxes.map((box) => box.y + box.h), 2600) + 220;

    return {
        width,
        height,
        boxes,
        edges,
        treeRoot,
        graphIdToBoxId,
        graphIdToBridgeBoxIds,
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function anchorPoint(box: OntologyBox, anchor: Anchor = 'cr', offset: [number, number] = [0, 0]) {
    const inset = Math.min(18, Math.max(0, Math.min(box.w, box.h) / 2 - 1));
    const points: Record<Anchor, { x: number; y: number }> = {
        cl: { x: box.x, y: box.y + box.h / 2 },
        cr: { x: box.x + box.w, y: box.y + box.h / 2 },
        tc: { x: box.x + box.w / 2, y: box.y },
        bc: { x: box.x + box.w / 2, y: box.y + box.h },
    };
    const point = { x: points[anchor].x + offset[0], y: points[anchor].y + offset[1] };

    if (anchor === 'cl' || anchor === 'cr') {
        return {
            x: anchor === 'cl' ? box.x : box.x + box.w,
            y: clamp(point.y, box.y + inset, box.y + box.h - inset),
        };
    }

    return {
        x: clamp(point.x, box.x + inset, box.x + box.w - inset),
        y: anchor === 'tc' ? box.y : box.y + box.h,
    };
}

function getBezierControlPoints(from: { x: number; y: number }, to: { x: number; y: number }, dir: OntologyEdge['dir'] = 'h') {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dir === 'v') {
        return { cp1x: from.x, cp1y: from.y + dy * 0.46, cp2x: to.x, cp2y: to.y - dy * 0.46 };
    }
    if (dir === 'diagUp') {
        return { cp1x: from.x + dx * 0.36, cp1y: from.y - Math.abs(dy) * 0.34 - 45, cp2x: to.x - dx * 0.34, cp2y: to.y + Math.abs(dy) * 0.12 };
    }
    if (dir === 'diagDown') {
        return { cp1x: from.x + dx * 0.36, cp1y: from.y + Math.abs(dy) * 0.34 + 45, cp2x: to.x - dx * 0.34, cp2y: to.y - Math.abs(dy) * 0.12 };
    }
    return { cp1x: from.x + dx * 0.42, cp1y: from.y, cp2x: to.x - dx * 0.42, cp2y: to.y };
}

function pathFor(edge: OntologyEdge, boxMap: Map<string, OntologyBox>) {
    const fromBox = boxMap.get(edge.fromId);
    const toBox = boxMap.get(edge.toId);
    if (!fromBox || !toBox) return '';
    const from = anchorPoint(fromBox, edge.fromAnchor, edge.fromOffset);
    const to = anchorPoint(toBox, edge.toAnchor || 'cl', edge.toOffset);
    const { cp1x, cp1y, cp2x, cp2y } = getBezierControlPoints(from, to, edge.dir);
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

function labelPoint(edge: OntologyEdge, boxMap: Map<string, OntologyBox>) {
    const fromBox = boxMap.get(edge.fromId);
    const toBox = boxMap.get(edge.toId);
    if (!fromBox || !toBox) return { x: 0, y: 0 };
    const from = anchorPoint(fromBox, edge.fromAnchor, edge.fromOffset);
    const to = anchorPoint(toBox, edge.toAnchor || 'cl', edge.toOffset);
    const { cp1x, cp1y, cp2x, cp2y } = getBezierControlPoints(from, to, edge.dir);
    return {
        x: 0.125 * from.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * to.x,
        y: 0.125 * from.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * to.y,
    };
}

function getHighlightState(activeBoxId: string | null, edges: OntologyEdge[]) {
    const relatedBoxIds = new Set<string>();
    const activeEdgeIndexes = new Set<number>();
    if (!activeBoxId) return { relatedBoxIds, activeEdgeIndexes };
    relatedBoxIds.add(activeBoxId);
    edges.forEach((edge, index) => {
        if (edge.fromId === activeBoxId || edge.toId === activeBoxId) {
            activeEdgeIndexes.add(index);
            relatedBoxIds.add(edge.fromId);
            relatedBoxIds.add(edge.toId);
        }
    });
    return { relatedBoxIds, activeEdgeIndexes };
}

function getHoldAdjustedBoxes(boxes: OntologyBox[], edges: OntologyEdge[], heldBoxId: string | null) {
    if (!heldBoxId) return boxes;
    const focus = boxes.find((box) => box.id === heldBoxId);
    if (!focus) return boxes;

    const { relatedBoxIds } = getHighlightState(heldBoxId, edges);
    const parentById = new Map(boxes.map((box) => [box.id, box.parentId || null]));
    const boxById = new Map(boxes.map((box) => [box.id, box]));
    const focusCenter = { x: focus.x + focus.w / 2, y: focus.y + focus.h / 2 };
    const getFieldContainerId = (boxId: string) => {
        let currentId: string | null | undefined = boxId;
        while (currentId) {
            const currentBox = boxById.get(currentId);
            if (currentBox?.kind === 'field') return currentId;
            currentId = parentById.get(currentId);
        }
        return boxId;
    };
    const heldFieldId = getFieldContainerId(heldBoxId);
    const groupShifts = new Map<string, { x: number; y: number }>();

    relatedBoxIds.forEach((boxId) => {
        if (boxId === heldBoxId) return;
        const box = boxById.get(boxId);
        if (!box) return;
        const groupId = getFieldContainerId(boxId);
        if (groupId === heldFieldId) return;
        if (groupShifts.has(groupId)) return;

        const groupBox = boxById.get(groupId) || box;
        const groupCenter = { x: groupBox.x + groupBox.w / 2, y: groupBox.y + groupBox.h / 2 };
        const dx = (focusCenter.x - groupCenter.x) * 0.24;
        const dy = (focusCenter.y - groupCenter.y) * 0.24;
        const distance = Math.hypot(dx, dy);
        const cap = 1050;
        const ratio = distance > cap ? cap / distance : 1;
        groupShifts.set(groupId, { x: dx * ratio, y: dy * ratio });
    });

    return boxes.map((box) => {
        if (box.id === heldBoxId) {
            return box;
        }

        const groupShift = groupShifts.get(getFieldContainerId(box.id));
        if (groupShift) {
            return {
                ...box,
                x: box.x + groupShift.x,
                y: box.y + groupShift.y,
            };
        }

        if (relatedBoxIds.has(box.id) && getFieldContainerId(box.id) === heldFieldId) {
            const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
            return {
                ...box,
                x: box.x + (focusCenter.x - center.x) * 0.16,
                y: box.y + (focusCenter.y - center.y) * 0.16,
            };
        }

        return box;
    });
}

function fitTransformToBox(
    box: OntologyBox,
    rect: DOMRect,
    currentScale: number,
    options: { preserveZoom?: boolean } = {},
): TransformState {
    const viewportPadding = 84;
    const fitScale = Math.min(
        (rect.width - viewportPadding * 2) / Math.max(1, box.w),
        (rect.height - viewportPadding * 2) / Math.max(1, box.h),
    );
    const preferredScale = options.preserveZoom
        ? Math.min(currentScale, fitScale)
        : fitScale;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, preferredScale));

    return {
        scale,
        x: rect.width / 2 - (box.x + box.w / 2) * scale,
        y: rect.height / 2 - (box.y + box.h / 2) * scale,
    };
}

function DirectoryTree({
    node,
    level = 0,
    heldBoxId,
    graphIdToBoxId,
    expandedIds,
    onToggle,
    onSelect,
    onToggleHold,
    isLight,
}: {
    node: DirectoryNode;
    level?: number;
    heldBoxId: string | null;
    graphIdToBoxId: Map<string, string>;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onSelect: (node: DirectoryNode) => void;
    onToggleHold: (boxId: string) => void;
    isLight: boolean;
}) {
    const hasChildren = node.children.length > 0;
    const isOpen = expandedIds.has(node.id);
    const boxId = graphIdToBoxId.get(node.id) || null;
    const isHeld = heldBoxId === boxId;
    const textClass = isLight ? 'text-black' : 'text-white';
    const mutedClass = isLight ? 'text-black/58' : 'text-white/62';

    if (node.type === 'root' || node.type === 'virtual-root') {
        return (
            <div className="flex flex-col gap-1">
                {node.children.map((child) => (
                    <DirectoryTree
                        key={child.id}
                        node={child}
                        level={level}
                        heldBoxId={heldBoxId}
                        graphIdToBoxId={graphIdToBoxId}
                        expandedIds={expandedIds}
                        onToggle={onToggle}
                        onSelect={onSelect}
                        onToggleHold={onToggleHold}
                        isLight={isLight}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div
                className={`group mx-3 mt-1 flex cursor-pointer items-center rounded-md border px-2 py-2 text-[12px] transition-colors ${
                    isHeld
                        ? isLight
                            ? 'border-black bg-black text-white'
                            : 'border-white bg-white text-black'
                        : isLight
                          ? 'border-transparent text-black/72 hover:bg-black/[0.05] hover:text-black'
                          : 'border-transparent text-white/76 hover:bg-white/[0.06] hover:text-white'
                }`}
                style={{ paddingLeft: level * 14 + 10 }}
                onClick={() => onSelect(node)}
            >
                <button
                    type="button"
                    className="mr-1 flex h-5 w-5 items-center justify-center rounded-sm"
                    onClick={(event) => {
                        event.stopPropagation();
                        if (hasChildren) onToggle(node.id);
                    }}
                >
                    {hasChildren ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="h-4 w-4" />
                    )}
                </button>
                {node.type === 'field' ? (
                    isOpen ? <FolderOpen size={14} className="mr-2" /> : <Folder size={14} className="mr-2" />
                ) : (
                    <FileText size={14} className={`mr-2 ${isHeld ? '' : mutedClass}`} />
                )}
                <span className={`flex-1 truncate ${isHeld ? '' : textClass}`}>{node.label}</span>
                {boxId ? (
                    <button
                        type="button"
                        className={`ml-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                            isHeld ? 'opacity-100' : ''
                        }`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleHold(boxId);
                        }}
                    >
                        <Search size={12} strokeWidth={isHeld ? 2.6 : 1.7} />
                    </button>
                ) : null}
            </div>
            {hasChildren && isOpen ? (
                <div className="flex flex-col">
                    {node.children.map((child) => (
                        <DirectoryTree
                            key={child.id}
                            node={child}
                            level={level + 1}
                            heldBoxId={heldBoxId}
                            graphIdToBoxId={graphIdToBoxId}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onToggleHold={onToggleHold}
                            isLight={isLight}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function OntologyPanelBox({
    box,
    active,
    connected,
    dimmed,
    isLight,
    onToggleHold,
    onHover,
    onLeave,
    held,
}: {
    box: OntologyBox;
    active: boolean;
    connected: boolean;
    dimmed: boolean;
    isLight: boolean;
    onToggleHold: (id: string) => void;
    onHover?: (id: string) => void;
    onLeave?: () => void;
    held: boolean;
}) {
    const isPlanckOuter = box.kind === 'planck-outer';
    const isPlanckCategory = box.kind === 'planck-category';
    const isPlanckBox = box.kind === 'planck-box';
    const polarity = isLight
        ? {
            base: 'border-black bg-white text-black',
            soft: 'border-black bg-white',
            muted: 'text-black/70',
            highlight: 'border-black shadow-[0_0_42px_rgba(0,0,0,0.22)]',
        }
        : {
            base: 'border-white bg-black text-white',
            soft: 'border-white/24 bg-black',
            muted: 'text-white/72',
            highlight: 'border-white shadow-[0_0_42px_rgba(255,255,255,0.26)]',
        };

    const isLargePanel = box.kind === 'field' || isPlanckCategory || isPlanckOuter;
    const isTopic = box.kind === 'topic' || box.kind === 'section';
    const showHoldButton = !isLargePanel && !isPlanckBox;
    const isHoverHighlightable = box.kind === 'planck-box' || box.kind === 'section';
    const hasBody = Boolean(box.nodes && box.nodes.length > 0);
    const showDivider = hasBody || Boolean(box.subtitle) || isLargePanel;

    return (
        <div
            className={`absolute border transition-all duration-500 ease-out ${
                polarity.base
            } ${active || connected || held ? polarity.highlight : ''} ${
                box.isCore ? (isLight ? 'border-black bg-white' : 'border-white bg-black') : ''
            } ${dimmed ? 'opacity-24' : 'opacity-100'} ${
                isLargePanel
                    ? 'pointer-events-none rounded-lg p-6'
                    : 'z-20 rounded-lg p-4 shadow-[0_0_28px_rgba(255,255,255,0.10)]'
            }`}
            style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
            }}
            onPointerEnter={isHoverHighlightable ? () => onHover?.(box.id) : undefined}
            onPointerLeave={isHoverHighlightable ? onLeave : undefined}
        >
            <div className={`flex items-start gap-3 ${
                showDivider ? `mb-3 border-b pb-2 ${isLight ? 'border-black' : 'border-white/55'}` : ''
            }`}>
                {box.stage ? <span className={`text-[13px] font-bold ${polarity.muted}`}>{box.stage}</span> : null}
                <div className="min-w-0 flex-1">
                    <div className={`${
                        box.isOuter ? 'text-[28px]' : isTopic ? 'text-[14px]' : isPlanckCategory ? 'text-[20px]' : 'text-[15px]'
                    } font-bold tracking-wide`}>
                        <MathText>{box.title}</MathText>
                    </div>
                    {box.subtitle ? (
                        <div className={`mt-1 text-[12px] font-medium tracking-wide ${polarity.muted}`}>
                            <MathText>{box.subtitle}</MathText>
                        </div>
                    ) : null}
                </div>
                {showHoldButton ? (
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`pointer-events-auto rounded-md border p-1.5 ${
                            held
                                ? isLight ? 'border-black bg-black text-white' : 'border-white bg-white text-black'
                                : isLight ? 'border-black/18 text-black' : 'border-white/18 text-white'
                        }`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleHold(box.id);
                        }}
                    >
                        <Search size={13} />
                    </button>
                ) : null}
            </div>
            {hasBody ? (
                <div className="min-w-0 space-y-2 text-[13px] leading-snug">
                    {box.nodes!.map((node, index) => (
                        <div
                            key={index}
                            className={`min-w-0 rounded-md border px-3 py-2 break-words ${polarity.soft}`}
                        >
                            <MathText className="block max-w-full whitespace-normal break-words">{node}</MathText>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export const OntologyGraphView = forwardRef<OntologyGraphHandle, OntologyGraphViewProps>(
    function OntologyGraphView(
        {
            model,
            focusedNodeId = null,
            initialHeldNodeId = null,
            onNodeFocus,
            onRefresh,
            headerActions,
        },
        ref,
    ) {
        const { isLight } = useTheme();
        const containerRef = useRef<HTMLDivElement | null>(null);
        const transformRef = useRef<TransformState>({ x: 0, y: 0, scale: 1 });
        const [transform, setTransformState] = useState<TransformState>({ x: 0, y: 0, scale: 1 });
        const [dragState, setDragState] = useState<{ id: number; x: number; y: number } | null>(null);
        const [heldBoxId, setHeldBoxId] = useState<string | null>(null);
        const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
        const layout = useMemo(() => buildOntologyLayout(model), [model]);
        const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(layout.treeRoot.children.map((node) => node.id)));
        const setTransform = useCallback((next: TransformState | ((previous: TransformState) => TransformState)) => {
            setTransformState((previous) => {
                const resolved = typeof next === 'function'
                    ? (next as (previous: TransformState) => TransformState)(previous)
                    : next;
                transformRef.current = resolved;
                return resolved;
            });
        }, []);

        const rawBoxMap = useMemo(() => new Map(layout.boxes.map((box) => [box.id, box])), [layout.boxes]);
        const adjustedBoxes = useMemo(
            () => getHoldAdjustedBoxes(layout.boxes, layout.edges, heldBoxId),
            [heldBoxId, layout.boxes, layout.edges],
        );
        const boxMap = useMemo(() => new Map(adjustedBoxes.map((box) => [box.id, box])), [adjustedBoxes]);
        const activeForHighlight = heldBoxId || hoveredBoxId;
        const { relatedBoxIds, activeEdgeIndexes } = useMemo(
            () => getHighlightState(activeForHighlight, layout.edges),
            [activeForHighlight, layout.edges],
        );
        const backgroundBoxes = adjustedBoxes.filter((box) => (
            box.kind === 'field'
            || box.kind === 'topic'
            || box.kind === 'planck-outer'
            || box.kind === 'planck-category'
        ));
        const foregroundBoxes = adjustedBoxes.filter((box) => !backgroundBoxes.includes(box));

        const resetView = useCallback(() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const scale = Math.min(rect.width / layout.width, rect.height / layout.height) * 0.95;
            const fittedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
            setTransform({
                scale: fittedScale,
                x: (rect.width - layout.width * fittedScale) / 2,
                y: (rect.height - layout.height * fittedScale) / 2,
            });
        }, [layout.height, layout.width]);

        const zoomBy = useCallback((delta: number) => {
            setTransform((prev) => ({
                ...prev,
                scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * Math.exp(delta))),
            }));
        }, []);

        const focusBox = useCallback((boxId: string | null) => {
            if (!boxId) return;
            const box = rawBoxMap.get(boxId);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!box || !rect) return;
            setTransform(fitTransformToBox(box, rect, transformRef.current.scale, { preserveZoom: false }));
        }, [rawBoxMap, setTransform]);

        useImperativeHandle(ref, () => ({
            zoomIn: () => zoomBy(0.16),
            zoomOut: () => zoomBy(-0.16),
            resetView,
            focusNode: (nodeId: string) => {
                const boxId = layout.graphIdToBoxId.get(nodeId);
                focusBox(boxId || null);
            },
        }), [focusBox, layout.graphIdToBoxId, resetView, zoomBy]);

        useEffect(() => {
            resetView();
        }, [resetView]);

        useEffect(() => {
            const boxId = focusedNodeId ? layout.graphIdToBoxId.get(focusedNodeId) || null : null;
            if (boxId) {
                focusBox(boxId);
            }
        }, [focusBox, focusedNodeId, layout.graphIdToBoxId]);

        useEffect(() => {
            if (!initialHeldNodeId) return;
            const boxId = layout.graphIdToBoxId.get(initialHeldNodeId) || null;
            setHeldBoxId(boxId);
        }, [initialHeldNodeId, layout.graphIdToBoxId]);

        useEffect(() => {
            const onResize = () => resetView();
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }, [resetView]);

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return undefined;

            const handleWheel = (event: WheelEvent) => {
                if (event.cancelable) event.preventDefault();
                const rect = container.getBoundingClientRect();
                const zoomFactor = Math.exp(-event.deltaY * 0.0012);
                setTransform((prev) => {
                    const previousScale = Number.isFinite(prev.scale) && prev.scale > 0 ? prev.scale : 1;
                    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, previousScale * zoomFactor));
                    const ratio = newScale / previousScale;
                    const mouseX = event.clientX - rect.left;
                    const mouseY = event.clientY - rect.top;
                    return {
                        scale: newScale,
                        x: mouseX - (mouseX - prev.x) * ratio,
                        y: mouseY - (mouseY - prev.y) * ratio,
                    };
                });
            };

            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }, []);

        const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const currentTransform = transformRef.current;
            setDragState({ id: event.pointerId, x: event.clientX - currentTransform.x, y: event.clientY - currentTransform.y });
        };

        const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragState) return;
            setTransform((prev) => ({
                ...prev,
                x: event.clientX - dragState.x,
                y: event.clientY - dragState.y,
            }));
        };

        const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
            if (dragState?.id === event.pointerId) {
                try {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                } catch {
                    // Pointer capture can already be released by the browser.
                }
                setDragState(null);
            }
        };

        const handleSelectDirectoryNode = (node: DirectoryNode) => {
            const boxId = layout.graphIdToBoxId.get(node.id) || null;
            onNodeFocus?.(node.id);
            focusBox(boxId);
        };

        const toggleExpanded = (id: string) => {
            setExpandedIds((previous) => {
                const next = new Set(previous);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        };

        const toggleHold = (boxId: string) => {
            setHeldBoxId((previous) => previous === boxId ? null : boxId);
            const graphNodeId = rawBoxMap.get(boxId)?.graphNodeId;
            if (graphNodeId) onNodeFocus?.(graphNodeId);
        };

        const palette = isLight
            ? {
                shell: '#ffffff',
                panel: '#ffffff',
                text: '#000000',
                muted: 'rgba(0,0,0,0.56)',
                line: '#000000',
                support: '#000000',
                activeLine: '#000000',
                grid: 'rgba(0,0,0,0.12)',
            }
            : {
                shell: '#000000',
                panel: '#000000',
                text: '#ffffff',
                muted: 'rgba(255,255,255,0.62)',
                line: '#ffffff',
                support: '#ffffff',
                activeLine: '#ffffff',
                grid: 'rgba(255,255,255,0.16)',
            };

        return (
            <div
                className="flex h-full w-full overflow-hidden"
                style={{ background: palette.shell, color: palette.text }}
            >
                <aside
                    className="z-30 flex h-full w-[320px] flex-shrink-0 flex-col border-r"
                    style={{ background: palette.panel, borderColor: 'transparent' }}
                >
                    <div className="flex h-[70px] flex-shrink-0 items-center justify-between border-b px-6" style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-3">
                            <div className="rounded-md border p-1.5" style={{ borderColor: isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)' }}>
                                <Network size={16} strokeWidth={1.6} />
                            </div>
                            <span className="text-[13px] font-semibold uppercase">Ontology</span>
                        </div>
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto py-3">
                        <DirectoryTree
                            node={layout.treeRoot}
                            heldBoxId={heldBoxId}
                            graphIdToBoxId={layout.graphIdToBoxId}
                            expandedIds={expandedIds}
                            onToggle={toggleExpanded}
                            onSelect={handleSelectDirectoryNode}
                            onToggleHold={toggleHold}
                            isLight={isLight}
                        />
                    </div>
                </aside>

                <main
                    ref={containerRef}
                    className="relative flex-1 touch-none select-none overflow-hidden"
                    style={{ cursor: dragState ? 'grabbing' : 'grab' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            opacity: 0.45,
                            backgroundImage: `linear-gradient(${palette.grid} 1px, transparent 1px), linear-gradient(90deg, ${palette.grid} 1px, transparent 1px)`,
                            backgroundSize: `${Math.max(8, 40 * transform.scale)}px ${Math.max(8, 40 * transform.scale)}px`,
                            backgroundPosition: `${transform.x}px ${transform.y}px`,
                        }}
                    />

                    <div className="pointer-events-none absolute left-6 right-6 top-6 z-50 flex items-center justify-end">
                        <div className="pointer-events-auto flex items-center gap-2">
                            {headerActions}
                            <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => void onRefresh?.()}
                                className="flex h-10 w-10 items-center justify-center border"
                                style={{ borderColor: palette.support, background: palette.panel, color: palette.text }}
                                title="Reload ontology"
                            >
                                <RefreshCw size={13} />
                            </button>
                            <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => zoomBy(0.16)}
                                className="flex h-10 w-10 items-center justify-center border"
                                style={{ borderColor: palette.support, background: palette.panel, color: palette.text }}
                                title="Zoom in"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => zoomBy(-0.16)}
                                className="flex h-10 w-10 items-center justify-center border"
                                style={{ borderColor: palette.support, background: palette.panel, color: palette.text }}
                                title="Zoom out"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={resetView}
                                className="flex h-10 w-10 items-center justify-center border"
                                style={{ borderColor: palette.support, background: palette.panel, color: palette.text }}
                                title="Fit ontology"
                            >
                                <Maximize2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div
                        className="absolute left-0 top-0 origin-top-left"
                        style={{
                            width: layout.width,
                            height: layout.height,
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        }}
                    >
                        <>
                            {backgroundBoxes.map((box) => {
                                const active = heldBoxId === box.id;
                                const held = heldBoxId === box.id;
                                const connected = Boolean(heldBoxId && relatedBoxIds.has(box.id) && !active && !held);
                                const dimmed = Boolean(heldBoxId && !relatedBoxIds.has(box.id) && box.id !== heldBoxId);
                                return (
                                    <OntologyPanelBox
                                        key={box.id}
                                        box={box}
                                        active={active}
                                        connected={connected}
                                        dimmed={dimmed}
                                        isLight={isLight}
                                        held={held}
                                        onToggleHold={toggleHold}
                                    />
                                );
                            })}

                            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                                    <defs>
                                        <marker id="ontology-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                            <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.line} />
                                        </marker>
                                        <marker id="ontology-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                                            <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.activeLine} />
                                        </marker>
                                    </defs>
                                    {layout.edges.map((edge, index) => {
                                        const edgePath = pathFor(edge, boxMap);
                                        if (!edgePath) return null;
                                        const point = labelPoint(edge, boxMap);
                                        const edgeActive = activeEdgeIndexes.has(index);
                                        const edgeDimmed = Boolean(activeForHighlight && !edgeActive);
                                        const stroke = edgeActive ? palette.activeLine : palette.line;
                                        return (
                                            <g
                                                key={`${edge.fromId}-${edge.toId}-${index}`}
                                                className="transition-opacity duration-200"
                                                opacity={edgeDimmed ? 0.12 : 1}
                                            >
                                                <path
                                                    d={edgePath}
                                                    fill="none"
                                                    stroke={stroke}
                                                    strokeWidth={edgeActive ? 3.2 : 2.1}
                                                    strokeDasharray={edge.kind === 'support' && !edgeActive ? '7 7' : '0'}
                                                    markerEnd={edgeActive ? 'url(#ontology-arrow-active)' : 'url(#ontology-arrow)'}
                                                />
                                                <foreignObject x={point.x - 150} y={point.y - 15} width={300} height={34} className="overflow-visible">
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <span
                                                            className="rounded-md border px-3 py-1 text-[12px] font-medium"
                                                            style={{ borderColor: stroke, background: palette.panel, color: palette.text }}
                                                        >
                                                            <MathText>{edge.label}</MathText>
                                                        </span>
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        );
                                    })}
                            </svg>

                            {foregroundBoxes.map((box) => {
                                const active = activeForHighlight === box.id;
                                const held = heldBoxId === box.id;
                                const connected = Boolean(activeForHighlight && relatedBoxIds.has(box.id) && !active && !held);
                                const dimmed = Boolean(activeForHighlight && !relatedBoxIds.has(box.id) && box.id !== heldBoxId);
                                return (
                                    <OntologyPanelBox
                                        key={box.id}
                                        box={box}
                                        active={active}
                                        connected={connected}
                                        dimmed={dimmed}
                                        isLight={isLight}
                                        held={held}
                                        onToggleHold={toggleHold}
                                        onHover={setHoveredBoxId}
                                        onLeave={() => setHoveredBoxId(null)}
                                    />
                                );
                            })}
                        </>
                    </div>

                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${palette.support}; }
                        .ontology-katex { vertical-align: -0.12em; }
                        .ontology-katex .katex { max-width: 100%; font-size: 1em; white-space: nowrap; }
                        .ontology-katex::-webkit-scrollbar { height: 0; }
                    `}</style>
                </main>
            </div>
        );
    },
);

export default OntologyGraphView;
