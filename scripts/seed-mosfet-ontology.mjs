import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  const envPath = resolve(process.cwd(), path);
  const content = readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile('.env.local');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const fieldId = 'semiconductor-physics';
const topicId = 'mosfet-gate-electrostatics';
const paperId = 'paper_mosfet_gate_electrostatics';

const categories = [
  {
    id: 'deviceArchitecture',
    stage: 'I',
    title: 'Device Architecture',
    subtitle: 'Physical MOS stack, terminals, material regions, and channel location',
    x: 110,
    y: 145,
    w: 620,
    h: 1760,
  },
  {
    id: 'controlMechanism',
    stage: 'II',
    title: 'Field-Effect Control',
    subtitle: 'Gate voltage controls surface electrostatics rather than injecting current',
    x: 790,
    y: 145,
    w: 640,
    h: 1760,
  },
  {
    id: 'electrostaticState',
    stage: 'III',
    title: 'Electrostatic Regimes',
    subtitle: 'Flat-band, accumulation, depletion, and strong inversion states',
    x: 1490,
    y: 145,
    w: 760,
    h: 1760,
  },
  {
    id: 'chargeCarrierState',
    stage: 'IV',
    title: 'Charge & Channel State',
    subtitle: 'Carrier redistribution determines whether a conducting channel exists',
    x: 2310,
    y: 145,
    w: 660,
    h: 1760,
  },
  {
    id: 'equationSystem',
    stage: 'V',
    title: 'Equation System',
    subtitle: 'Equations define voltage partition, charge state, depletion width, and threshold',
    x: 3030,
    y: 145,
    w: 780,
    h: 1760,
  },
  {
    id: 'mosfetClassification',
    stage: 'VI',
    title: 'MOSFET Classification',
    subtitle: 'Channel type and device mode classify normally-off and normally-on behavior',
    x: 3870,
    y: 145,
    w: 620,
    h: 1760,
  },
];

const paper = {
  id: paperId,
  graph_node_id: topicId,
  title: 'MOSFET Gate Electrostatics Ontology',
  authors: ['Physics Community'],
  year: null,
  venue: 'Course ontology',
  abstract: 'MOSFET operation is organized around gate-voltage control of surface electrostatics, carrier redistribution, channel formation, and drain-current modulation.',
  abstract_summary: 'MOSFET gate voltage controls the oxide electric field, surface potential, band bending, semiconductor charge, channel state, and drain current.',
  field_tags: ['semiconductor physics', 'device physics', 'electronics'],
  topic_tags: ['MOSFET', 'gate electrostatics', 'field effect', 'threshold voltage', 'inversion channel'],
  section_structure: [
    'Device Architecture',
    'Field-Effect Control',
    'Electrostatic Regimes',
    'Charge and Channel State',
    'Equation System',
    'MOSFET Classification',
  ],
  source_file_reference: {
    type: 'user_supplied_ontology',
    label: 'MOSFET gate electrostatics rewritten ontology',
  },
  citation_list: [],
  metadata: {
    canvas: {
      title: 'MOSFET Gate Electrostatics Ontology',
      subtitle: 'Device structure -> gate electrostatics -> charge state -> channel formation -> current control',
      width: 4560,
      height: 2040,
      categories,
    },
  },
};

const conceptRows = [
  {
    id: 'concept_mosfet_global',
    type: 'Concept',
    label: 'MOSFET',
    canonical_name: 'Metal-Oxide-Semiconductor Field-Effect Transistor',
    summary: 'A field-effect transistor whose insulated gate controls semiconductor surface charge and channel conductivity.',
    related_terms: ['field-effect transistor', 'gate oxide', 'inversion channel', 'threshold voltage'],
    aliases: ['MOS transistor', 'MOSFET'],
    tags: ['semiconductor device', 'electronics'],
    metadata: {},
  },
  {
    id: 'concept_field_effect_global',
    type: 'Concept',
    label: 'Field Effect',
    canonical_name: 'Field effect control',
    summary: 'Control of carrier distribution and conductivity through an electric field rather than direct current injection.',
    related_terms: ['gate voltage', 'surface potential', 'electric field'],
    aliases: ['field-effect control'],
    tags: ['electrostatics', 'device physics'],
    metadata: {},
  },
  {
    id: 'concept_strong_inversion_global',
    type: 'Concept',
    label: 'Strong Inversion',
    canonical_name: 'Strong inversion regime',
    summary: 'The MOS surface regime in which minority carriers form a conducting inversion layer at the oxide interface.',
    related_terms: ['threshold voltage', 'inversion layer', 'conducting channel'],
    aliases: ['inversion regime'],
    tags: ['MOS electrostatics'],
    metadata: {},
  },
];

const nodes = [
  {
    id: 'device_architecture_mosfet',
    type: 'PhysicalSystem',
    label: 'MOSFET Device Architecture',
    summary: 'A MOSFET contains gate, oxide, semiconductor substrate, source, drain, body, and a channel region below the gate.',
    global_concept_id: 'concept_mosfet_global',
    tags: ['MOSFET', 'device architecture'],
    metadata: {
      layout: { category: 'deviceArchitecture', x: 150, y: 285, w: 500 },
      items: [
        'MOSFET isA FieldEffectTransistor',
        'hasTerminal: Source, Drain, Gate, Body',
        'contains: SemiconductorSubstrate, OxideLayer, MetalGate',
        'contains: SourceRegion and DrainRegion',
        'formsAtSurface: ChannelRegion below Gate',
      ],
    },
  },
  {
    id: 'terminal_material_stack_mosfet',
    type: 'Concept',
    label: 'Gate-Oxide-Semiconductor Stack',
    summary: 'The gate is separated from the semiconductor by oxide, allowing electric-field coupling while blocking direct gate current.',
    tags: ['gate oxide', 'MOS stack'],
    metadata: {
      layout: { category: 'deviceArchitecture', x: 150, y: 820, w: 500 },
      items: [
        'Gate separatedFromSemiconductorBy OxideLayer',
        'OxideLayer preventsDirectCurrentBetween Gate and SemiconductorSubstrate',
        'OxideLayer allows ElectricFieldCoupling',
        'ChannelRegion connects Source and Drain',
        'ChannelRegion enables DrainCurrent',
      ],
    },
  },
  {
    id: 'field_effect_control_mosfet',
    type: 'KeyClaim',
    label: 'Field-Effect Control Principle',
    summary: 'MOSFET current is controlled by gate-induced electric field modulation of carrier distribution and channel conductivity.',
    global_concept_id: 'concept_field_effect_global',
    tags: ['field effect', 'gate voltage'],
    metadata: {
      layout: { category: 'controlMechanism', x: 830, y: 285, w: 520 },
      items: [
        'FieldEffect means ElectricFieldControlsCarrierDistribution',
        'implementedIn: FieldEffectTransistor',
        'controls: ChannelConductivity',
        'thereforeControls: DrainCurrent',
      ],
    },
  },
  {
    id: 'gate_voltage_control_chain_mosfet',
    type: 'PhysicalInterpretation',
    label: 'Gate Voltage Control Chain',
    summary: 'Gate voltage creates oxide electric field, changes surface potential, bends bands, modifies surface charge, and controls channel state.',
    tags: ['surface potential', 'band bending', 'channel formation'],
    metadata: {
      layout: { category: 'controlMechanism', x: 830, y: 710, w: 520 },
      items: [
        '$V_G$ -> ElectricFieldAcrossOxide',
        'ElectricFieldAcrossOxide -> SurfacePotential $\\phi_s$',
        '$\\phi_s$ -> BandBending',
        'BandBending -> SurfaceCarrierConcentration',
        'SurfaceCharge -> ChannelFormation -> DrainCurrent $I_D$',
      ],
    },
  },
  {
    id: 'bjt_fet_control_contrast_mosfet',
    type: 'BackgroundContext',
    label: 'BJT vs FET Control Contrast',
    summary: 'BJT uses base current to control collector current, whereas FET uses gate voltage and electric field to control drain current.',
    tags: ['BJT', 'FET', 'control input'],
    metadata: {
      layout: { category: 'controlMechanism', x: 830, y: 1265, w: 520 },
      items: [
        'BipolarJunctionTransistor hasControlInput BaseCurrent',
        'BJT controls CollectorCurrent',
        'FieldEffectTransistor hasControlInput GateVoltage',
        'FET uses ElectricField',
        'FET controls DrainCurrent',
      ],
    },
  },
  {
    id: 'flatband_condition_mosfet',
    type: 'ValidityRegime',
    label: 'Flat-Band Condition',
    summary: 'Flat-band condition means no band bending, zero semiconductor charge, and defines the flat-band reference voltage.',
    tags: ['flat-band voltage', 'reference state'],
    metadata: {
      layout: { category: 'electrostaticState', x: 1530, y: 285, w: 520 },
      items: [
        'means: NoBandBending',
        'definedBy: SemiconductorChargeEqualsZero',
        'condition: $Q_s = 0$',
        'setsReferenceVoltage: FlatBandVoltage $V_{FB}$',
      ],
    },
  },
  {
    id: 'accumulation_mode_mosfet',
    type: 'ValidityRegime',
    label: 'Accumulation Mode',
    summary: 'For n-MOS on p-type substrate, gate voltage below flat-band accumulates holes and does not form an electron inversion channel.',
    tags: ['accumulation', 'hole accumulation'],
    metadata: {
      layout: { category: 'electrostaticState', x: 1530, y: 690, w: 520 },
      items: [
        'condition: $V_G < V_{FB}$',
        'hasSurfacePotential: $\\phi_s < 0$',
        'causes: HoleAccumulation',
        'doesNotForm: ElectronInversionChannel',
        'prevents: SourceDrainCurrent',
      ],
    },
  },
  {
    id: 'depletion_mode_mosfet',
    type: 'ValidityRegime',
    label: 'Depletion Mode',
    summary: 'Between flat-band and threshold, holes are repelled, ionized acceptors remain, and depletion width expands without strong inversion.',
    tags: ['depletion', 'ionized acceptors'],
    metadata: {
      layout: { category: 'electrostaticState', x: 1530, y: 1115, w: 520 },
      items: [
        'condition: $V_{FB} < V_G < V_{th}$',
        'hasSurfacePotential: $\\phi_s > 0$',
        'causes: HoleDepletion',
        'forms: DepletionRegion',
        'doesNotForm: InversionChannel',
      ],
    },
  },
  {
    id: 'strong_inversion_mode_mosfet',
    type: 'ValidityRegime',
    label: 'Strong Inversion Mode',
    summary: 'Above threshold, surface potential is near twice the Fermi potential and an electron inversion layer forms as a conducting channel.',
    global_concept_id: 'concept_strong_inversion_global',
    tags: ['strong inversion', 'threshold voltage'],
    metadata: {
      layout: { category: 'electrostaticState', x: 1530, y: 1540, w: 520 },
      items: [
        'condition: $V_G > V_{th}$',
        'hasSurfacePotential: $\\phi_s \\approx 2V_{fp}$',
        'forms: ElectronInversionLayer',
        'forms: ConductingChannel',
        'enables: SourceDrainCurrent',
      ],
    },
  },
  {
    id: 'semiconductor_charge_state_mosfet',
    type: 'Concept',
    label: 'Semiconductor Charge State',
    summary: 'Semiconductor charge decomposes into accumulation, depletion, and inversion charge depending on the electrostatic regime.',
    tags: ['semiconductor charge', 'charge balance'],
    metadata: {
      layout: { category: 'chargeCarrierState', x: 2350, y: 390, w: 500 },
      items: [
        'SemiconductorCharge decomposesInto AccumulationCharge',
        'SemiconductorCharge decomposesInto DepletionCharge',
        'SemiconductorCharge decomposesInto InversionCharge',
        'ChargeBalance links gate charge to semiconductor charge',
      ],
    },
  },
  {
    id: 'carrier_redistribution_mosfet',
    type: 'PhysicalInterpretation',
    label: 'Carrier Redistribution',
    summary: 'Band bending changes majority and minority carrier populations near the oxide-semiconductor interface.',
    tags: ['carrier concentration', 'band bending'],
    metadata: {
      layout: { category: 'chargeCarrierState', x: 2350, y: 880, w: 500 },
      items: [
        'HoleAccumulation occursAt SemiconductorOxideInterface',
        'HoleDepletion leavesBehind IonizedAcceptors',
        'ElectronInversionLayer locatedAt SemiconductorOxideInterface',
        'additional $V_G$ beyond threshold mostly increases $Q_{inv}$',
      ],
    },
  },
  {
    id: 'conducting_channel_mosfet',
    type: 'KeyResult',
    label: 'Conducting Channel Formation',
    summary: 'The inversion layer connects source and drain, producing a conductive channel that enables drain current under drain bias.',
    tags: ['conducting channel', 'drain current'],
    metadata: {
      layout: { category: 'chargeCarrierState', x: 2350, y: 1370, w: 500 },
      items: [
        'ElectronInversionLayer actsAs ConductingChannel',
        'ConductingChannel connects Source',
        'ConductingChannel connects Drain',
        'ConductingChannel enables DrainCurrent $I_D$',
        '$I_D$ controlledBy GateVoltage and drivenBy DrainVoltage',
      ],
    },
  },
  {
    id: 'flatband_voltage_equation_mosfet',
    type: 'Equation',
    label: 'Flat-Band Voltage Equation',
    summary: 'Flat-band voltage is set by metal-semiconductor work-function difference and oxide/interface charge.',
    equation_latex: 'V_{FB}=\\phi_{ms}-\\frac{Q_{ss}}{C_{ox}}',
    tags: ['flat-band voltage', 'oxide charge'],
    metadata: {
      layout: { category: 'equationSystem', x: 3070, y: 255, w: 600 },
      items: [
        'defines: FlatBandVoltage',
        'uses: WorkFunctionDifference $\\phi_{ms}$',
        'uses: OxideInterfaceCharge $Q_{ss}$',
        'uses: OxideCapacitance $C_{ox}$',
        '$V_{FB}=\\phi_{ms}-Q_{ss}/C_{ox}$',
      ],
    },
  },
  {
    id: 'gate_voltage_equation_mosfet',
    type: 'Equation',
    label: 'Gate Voltage Equation',
    summary: 'Gate voltage partitions into oxide voltage, surface potential, and flat-band voltage and is central to all regime analysis.',
    equation_latex: 'V_G=V_{ox}+\\phi_s+V_{FB}',
    tags: ['gate voltage', 'surface potential'],
    metadata: {
      layout: { category: 'equationSystem', x: 3070, y: 560, w: 600 },
      items: [
        'relates: GateVoltage $V_G$',
        'relates: OxideVoltage $V_{ox}$',
        'relates: SurfacePotential $\\phi_s$',
        'usedIn: Accumulation, Depletion, Threshold, Inversion analysis',
        '$V_G = V_{ox}+\\phi_s+V_{FB}$',
      ],
    },
  },
  {
    id: 'depletion_charge_equation_mosfet',
    type: 'Equation',
    label: 'Depletion Charge Equation',
    summary: 'Depletion charge is determined by acceptor concentration and depletion width.',
    equation_latex: 'Q_{dep}=-qN_Ax_d',
    tags: ['depletion charge'],
    metadata: {
      layout: { category: 'equationSystem', x: 3070, y: 895, w: 600 },
      items: [
        'validIn: DepletionMode',
        'defines: DepletionCharge',
        'dependsOn: AcceptorConcentration $N_A$',
        'dependsOn: DepletionWidth $x_d$',
        '$Q_{dep}=-qN_Ax_d$',
      ],
    },
  },
  {
    id: 'depletion_width_equation_mosfet',
    type: 'Equation',
    label: 'Depletion Width Equation',
    summary: 'Depletion width grows with surface potential and decreases with acceptor concentration.',
    equation_latex: 'x_d=\\sqrt{\\frac{2\\epsilon_s\\phi_s}{qN_A}}',
    tags: ['depletion width', 'surface potential'],
    metadata: {
      layout: { category: 'equationSystem', x: 3070, y: 1225, w: 600 },
      items: [
        'validIn: DepletionMode',
        'defines: DepletionWidth',
        'uses: SurfacePotential $\\phi_s$',
        'uses: AcceptorConcentration $N_A$',
        '$x_d=\\sqrt{2\\epsilon_s\\phi_s/(qN_A)}$',
      ],
    },
  },
  {
    id: 'threshold_voltage_equation_mosfet',
    type: 'Equation',
    label: 'Threshold Voltage Equation',
    summary: 'Threshold voltage is the minimum gate voltage required for strong inversion and conducting channel formation.',
    equation_latex: 'V_{th}=\\phi_{ms}-\\frac{Q_{ss}}{C_{ox}}+2V_{fp}+\\frac{\\sqrt{2qN_A\\epsilon_s(2V_{fp})}}{C_{ox}}',
    tags: ['threshold voltage', 'strong inversion'],
    metadata: {
      layout: { category: 'equationSystem', x: 3070, y: 1555, w: 600, isCore: true },
      items: [
        'defines: ThresholdVoltage',
        'validAt: OnsetOfStrongInversion',
        'uses: $\\phi_s=2V_{fp}$',
        'marks: ConductingChannelFormation',
        '$V_{th}=V_{FB}+2V_{fp}+\\sqrt{2qN_A\\epsilon_s(2V_{fp})}/C_{ox}$',
      ],
    },
  },
  {
    id: 'inversion_charge_equation_mosfet',
    type: 'Equation',
    label: 'Inversion Charge Equation',
    summary: 'Beyond threshold, gate overdrive mostly increases inversion charge and therefore channel conductance.',
    equation_latex: 'Q_{inv}=-C_{ox}(V_G-V_{th})',
    tags: ['inversion charge', 'gate overdrive'],
    metadata: {
      layout: { category: 'equationSystem', x: 3335, y: 1875, w: 430 },
      items: [
        'validIn: StrongInversionMode',
        'defines: InversionCharge',
        'GateOverdrive: $V_G-V_{th}$',
        'controls: ChannelConductance',
        '$Q_{inv}=-C_{ox}(V_G-V_{th})$',
      ],
    },
  },
  {
    id: 'mosfet_type_classification_mosfet',
    type: 'Concept',
    label: 'MOSFET Type Classification',
    summary: 'MOSFETs are classified by channel type and device mode.',
    tags: ['classification', 'channel type', 'device mode'],
    metadata: {
      layout: { category: 'mosfetClassification', x: 3910, y: 390, w: 480 },
      items: [
        'MOSFET classifiedBy ChannelType',
        'ChannelType: NChannel or PChannel',
        'MOSFET classifiedBy DeviceMode',
        'DeviceMode: EnhancementMode or DepletionMode',
      ],
    },
  },
  {
    id: 'enhancement_mode_mosfet',
    type: 'Model',
    label: 'Enhancement Mode MOSFET',
    summary: 'An enhancement-mode MOSFET has no conducting channel at zero gate voltage and is normally off.',
    tags: ['enhancement mode', 'normally off'],
    metadata: {
      layout: { category: 'mosfetClassification', x: 3910, y: 870, w: 480 },
      items: [
        'conditionAtZeroGateVoltage: ChannelNotFormed',
        'outputBehavior: NormallyOff',
        'NChannelEnhancementMOSFET hasCarrierType Electron',
        'requiresPositiveGateVoltageForChannel: True',
      ],
    },
  },
  {
    id: 'depletion_mode_device_mosfet',
    type: 'Model',
    label: 'Depletion Mode MOSFET',
    summary: 'A depletion-mode MOSFET already has a channel at zero gate voltage and is normally on.',
    tags: ['depletion mode device', 'normally on'],
    metadata: {
      layout: { category: 'mosfetClassification', x: 3910, y: 1305, w: 480 },
      items: [
        'conditionAtZeroGateVoltage: ChannelAlreadyExists',
        'outputBehavior: NormallyOn',
        'NChannelDepletionMOSFET hasThresholdVoltageSign Negative',
        'satisfies: $V_G=0>V_{th}$',
        'PChannelDepletionMOSFET hasCarrierType Hole',
      ],
    },
  },
];

const edgeSpecs = [
  ['device_architecture_mosfet', 'terminal_material_stack_mosfet', 'contains', 'Device architecture specifies the terminals and MOS material stack.', 'v', 'bc', 'tc'],
  ['terminal_material_stack_mosfet', 'field_effect_control_mosfet', 'enables', 'The oxide-separated gate stack enables electric-field coupling without direct current injection.', 'h', 'cr', 'cl'],
  ['field_effect_control_mosfet', 'gate_voltage_control_chain_mosfet', 'implemented as', 'Field-effect control is realized as a gate-voltage-to-surface-potential control chain.', 'v', 'bc', 'tc'],
  ['field_effect_control_mosfet', 'bjt_fet_control_contrast_mosfet', 'contrasts with', 'The FET control input is voltage/electric field rather than BJT base current.', 'v', 'bc', 'tc'],
  ['gate_voltage_control_chain_mosfet', 'flatband_condition_mosfet', 'sets reference for', 'Surface potential and band bending analysis is referenced to flat-band.', 'h', 'cr', 'cl'],
  ['gate_voltage_control_chain_mosfet', 'accumulation_mode_mosfet', 'leads to', 'Negative surface potential produces accumulation.', 'h', 'cr', 'cl'],
  ['gate_voltage_control_chain_mosfet', 'depletion_mode_mosfet', 'leads to', 'Positive gate bias below threshold produces depletion.', 'h', 'cr', 'cl'],
  ['gate_voltage_control_chain_mosfet', 'strong_inversion_mode_mosfet', 'leads to', 'Gate bias above threshold produces strong inversion.', 'h', 'cr', 'cl'],
  ['flatband_condition_mosfet', 'flatband_voltage_equation_mosfet', 'defined by', 'The flat-band state is quantified by the flat-band voltage equation.', 'h', 'cr', 'cl'],
  ['flatband_condition_mosfet', 'accumulation_mode_mosfet', 'bounds', 'Flat-band voltage separates accumulation from depletion/inversion regimes.', 'v', 'bc', 'tc'],
  ['accumulation_mode_mosfet', 'semiconductor_charge_state_mosfet', 'sets charge state', 'Accumulation is one component of semiconductor charge state.', 'h', 'cr', 'cl'],
  ['depletion_mode_mosfet', 'semiconductor_charge_state_mosfet', 'sets charge state', 'Depletion charge dominates below threshold.', 'h', 'cr', 'cl'],
  ['strong_inversion_mode_mosfet', 'semiconductor_charge_state_mosfet', 'sets charge state', 'Strong inversion adds minority-carrier inversion charge.', 'h', 'cr', 'cl'],
  ['semiconductor_charge_state_mosfet', 'carrier_redistribution_mosfet', 'explains', 'Charge state is produced by carrier redistribution near the surface.', 'v', 'bc', 'tc'],
  ['carrier_redistribution_mosfet', 'conducting_channel_mosfet', 'determines', 'Carrier redistribution determines whether a conducting inversion channel forms.', 'v', 'bc', 'tc'],
  ['depletion_mode_mosfet', 'depletion_charge_equation_mosfet', 'validates', 'Depletion mode uses the depletion charge relation.', 'h', 'cr', 'cl'],
  ['depletion_mode_mosfet', 'depletion_width_equation_mosfet', 'uses', 'Depletion width is computed from surface potential and doping.', 'h', 'cr', 'cl'],
  ['strong_inversion_mode_mosfet', 'threshold_voltage_equation_mosfet', 'defined by', 'Strong inversion begins at the threshold voltage condition.', 'h', 'cr', 'cl'],
  ['strong_inversion_mode_mosfet', 'inversion_charge_equation_mosfet', 'uses', 'Beyond threshold, additional gate voltage increases inversion charge.', 'h', 'cr', 'cl'],
  ['gate_voltage_equation_mosfet', 'threshold_voltage_equation_mosfet', 'used in', 'Threshold voltage derivation uses the gate voltage partition relation.', 'v', 'bc', 'tc'],
  ['threshold_voltage_equation_mosfet', 'inversion_charge_equation_mosfet', 'sets reference for', 'Inversion charge depends on gate overdrive relative to threshold voltage.', 'v', 'bc', 'tc'],
  ['conducting_channel_mosfet', 'mosfet_type_classification_mosfet', 'classified by', 'Channel formation behavior contributes to MOSFET mode classification.', 'h', 'cr', 'cl'],
  ['mosfet_type_classification_mosfet', 'enhancement_mode_mosfet', 'specializes into', 'Enhancement mode is a MOSFET mode classification.', 'v', 'bc', 'tc'],
  ['mosfet_type_classification_mosfet', 'depletion_mode_device_mosfet', 'specializes into', 'Depletion mode is a MOSFET mode classification.', 'v', 'bc', 'tc'],
];

const edges = edgeSpecs.map(([source, target, type, explanation, dir, fromAnchor, toAnchor], index) => ({
  id: `edge_mosfet_${index + 1}_${source}_to_${target}`.slice(0, 180),
  source,
  target,
  type,
  scope: 'intra_paper',
  paper_id: paperId,
  source_paper_id: null,
  target_paper_id: null,
  explanation,
  evidence: {
    source_text: 'Derived from the user-provided MOSFET gate electrostatics ontology.',
    source_location: { section: 'User-provided ontology', page: null, paragraph: null },
  },
  confidence: 0.92,
  metadata: {
    label: type,
    dir,
    fromAnchor,
    toAnchor,
    kind: type === 'contrasts with' ? 'support' : 'main',
  },
}));

const nodesForInsert = nodes.map((node) => ({
  id: node.id,
  type: node.type,
  label: node.label,
  summary: node.summary,
  paper_id: paperId,
  global_concept_id: node.global_concept_id || null,
  equation_latex: node.equation_latex || null,
  source_location: {
    section: node.metadata.layout.category,
    page: null,
    paragraph: null,
  },
  confidence: 0.92,
  tags: node.tags,
  metadata: node.metadata,
}));

async function checked(label, promise) {
  const result = await promise;
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

await checked('upsert fields', supabase.from('fields').upsert({
  id: fieldId,
  slug: 'semiconductor-physics',
  name: 'Semiconductor Physics',
  description: 'The physics of semiconductor materials, device electrostatics, carrier transport, and integrated electronic devices.',
  icon: 'cpu',
  color: 'from-neutral-700 to-neutral-400',
}, { onConflict: 'id' }));

await checked('upsert topic', supabase.from('topics').upsert({
  id: topicId,
  field_id: fieldId,
  year: '',
  title: 'MOSFET Gate Electrostatics',
  slug: 'mosfet-gate-electrostatics',
  summary: 'An ontology of how MOSFET gate voltage controls surface potential, charge redistribution, channel formation, and drain current.',
  tags: ['MOSFET', 'Gate Electrostatics', 'Field Effect', 'Semiconductor Device'],
  content: '',
}, { onConflict: 'id' }));

await checked('upsert graph nodes', supabase.from('graph_nodes').upsert([
  {
    id: 'root',
    type: 'root',
    label: 'PHYSICS',
    x: 0,
    y: 0,
    data: {},
  },
  {
    id: fieldId,
    type: 'field',
    label: 'Semiconductor Physics',
    x: 0,
    y: 0,
    data: {
      fieldId,
      slug: 'semiconductor-physics',
      description: 'The physics of semiconductor materials, device electrostatics, carrier transport, and integrated electronic devices.',
      sphere: {
        radius: 5.2,
        position: { x: 28, y: 8, z: -24 },
        sortOrder: 6,
        bindingKey: fieldId,
      },
    },
  },
  {
    id: topicId,
    type: 'topic',
    label: 'MOSFET Gate Electrostatics',
    x: 0,
    y: 0,
    data: {
      fieldId,
      slug: 'mosfet-gate-electrostatics',
      year: null,
      description: 'Gate-controlled surface electrostatics, channel formation, and current control in MOSFETs.',
    },
  },
], { onConflict: 'id' }));

await checked('delete graph edges root-field', supabase
  .from('graph_edges')
  .delete()
  .eq('source', 'root')
  .eq('target', fieldId));
await checked('delete graph edges field-topic', supabase
  .from('graph_edges')
  .delete()
  .eq('source', fieldId)
  .eq('target', topicId));
await checked('insert graph edges', supabase.from('graph_edges').insert([
  { source: 'root', target: fieldId, label: 'hierarchy' },
  { source: fieldId, target: topicId, label: 'hierarchy' },
]));

await checked('delete ontology edges', supabase.from('ontology_edges').delete().eq('paper_id', paperId));
await checked('delete ontology nodes', supabase.from('ontology_nodes').delete().eq('paper_id', paperId));
await checked('delete ontology paper', supabase.from('ontology_papers').delete().eq('id', paperId));

await checked('upsert global concepts', supabase.from('ontology_global_concepts').upsert(conceptRows, { onConflict: 'id' }));
await checked('insert ontology paper', supabase.from('ontology_papers').insert(paper));
await checked('insert ontology nodes', supabase.from('ontology_nodes').insert(nodesForInsert));
await checked('insert ontology edges', supabase.from('ontology_edges').insert(edges));

console.log(JSON.stringify({
  status: 'ok',
  graphNodeId: topicId,
  paperId,
  ontologyNodes: nodesForInsert.length,
  ontologyEdges: edges.length,
}));
