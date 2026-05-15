export interface KnowledgeFieldSeed {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export interface KnowledgeNodeTemplate {
    key: string;
    title: string;
    nodeType: 'concept' | 'law' | 'formalism' | 'problem_class' | 'quantity';
    keywords: string[];
    summary: string;
    related?: string[];
    prerequisites?: string[];
}

export interface KnowledgeClusterTemplate {
    key: string;
    title: string;
    keywords: string[];
    nodes: KnowledgeNodeTemplate[];
}

export interface KnowledgeSphereTemplate {
    id: string;
    label: string;
    keywords: string[];
    field: KnowledgeFieldSeed;
    clusters: KnowledgeClusterTemplate[];
}

function node(
    key: string,
    title: string,
    nodeType: KnowledgeNodeTemplate['nodeType'],
    keywords: string[],
    summary: string,
    related: string[] = [],
    prerequisites: string[] = [],
): KnowledgeNodeTemplate {
    return { key, title, nodeType, keywords, summary, related, prerequisites };
}

export const KNOWLEDGE_SPHERE_TEMPLATES: KnowledgeSphereTemplate[] = [
    {
        id: 'classical',
        label: 'GENERAL\nMECHANICS',
        keywords: ['mechanics', 'newton', 'lagrangian', 'hamiltonian', 'rigid body', 'oscillation', 'kinematics'],
        field: {
            id: 'classical',
            slug: 'classical-mechanics',
            name: 'General Mechanics',
            description: 'The study of motion, force, energy, and variational structure in classical systems.',
            icon: 'activity',
            color: 'from-blue-500 to-cyan-400',
        },
        clusters: [
            {
                key: 'kinematics',
                title: 'Kinematics',
                keywords: ['kinematics', 'position', 'velocity', 'acceleration', 'trajectory'],
                nodes: [
                    node('position', 'Position', 'quantity', ['position', 'coordinate'], 'Position locates a system in configuration space.'),
                    node('velocity', 'Velocity', 'quantity', ['velocity', 'speed'], 'Velocity measures the rate of change of position.', ['Position']),
                    node('acceleration', 'Acceleration', 'quantity', ['acceleration'], 'Acceleration measures the rate of change of velocity.', ['Velocity']),
                ],
            },
            {
                key: 'dynamics',
                title: 'Dynamics',
                keywords: ['force', 'momentum', 'newton', 'inertial frame', 'dynamics'],
                nodes: [
                    node('force', 'Force', 'quantity', ['force'], 'Force is the interaction responsible for changing motion.'),
                    node('momentum', 'Momentum', 'quantity', ['momentum'], 'Momentum encodes the dynamical state of translational motion.', ['Force']),
                    node('newtons_second_law', "Newton's Second Law", 'law', ['newton', 'f=ma', 'second law'], 'Newton’s second law relates net force to the rate of change of momentum.', ['Force', 'Momentum'], ['Force', 'Acceleration']),
                ],
            },
            {
                key: 'variational_mechanics',
                title: 'Variational Mechanics',
                keywords: ['lagrangian', 'hamiltonian', 'action', 'canonical', 'phase space'],
                nodes: [
                    node('lagrangian_mechanics', 'Lagrangian Mechanics', 'formalism', ['lagrangian', 'action'], 'Lagrangian mechanics reformulates dynamics through the principle of stationary action.', ['Hamiltonian Mechanics']),
                    node('euler_lagrange_equation', 'Euler-Lagrange Equation', 'law', ['euler-lagrange', 'euler lagrange'], 'The Euler-Lagrange equation gives equations of motion from an action functional.', ['Lagrangian Mechanics']),
                    node('hamiltonian_mechanics', 'Hamiltonian Mechanics', 'formalism', ['hamiltonian', 'phase space', 'canonical'], 'Hamiltonian mechanics expresses dynamics on phase space using canonical variables.', ['Lagrangian Mechanics']),
                ],
            },
        ],
    },
    {
        id: 'electrodynamics',
        label: 'ELECTRO\nDYNAMICS',
        keywords: ['electric', 'magnetic', 'maxwell', 'coulomb', 'field', 'electromagnetic', 'gauss'],
        field: {
            id: 'electrodynamics',
            slug: 'electrodynamics',
            name: 'Electromagnetism',
            description: 'Electric and magnetic fields, charge, radiation, and Maxwellian dynamics.',
            icon: 'zap',
            color: 'from-yellow-500 to-orange-400',
        },
        clusters: [
            {
                key: 'electrostatics',
                title: 'Electrostatics',
                keywords: ['charge', 'electrostatic', 'coulomb', 'potential'],
                nodes: [
                    node('electric_charge', 'Electric Charge', 'quantity', ['charge'], 'Electric charge sources electromagnetic interactions.'),
                    node('coulombs_law', "Coulomb's Law", 'law', ['coulomb'], 'Coulomb’s law determines the electrostatic interaction between charges.', ['Electric Charge']),
                    node('electric_potential', 'Electric Potential', 'quantity', ['potential', 'voltage'], 'Electric potential organizes electrostatic work and field structure.', ['Electric Charge']),
                ],
            },
            {
                key: 'magnetostatics',
                title: 'Magnetostatics',
                keywords: ['magnetic', 'ampere', 'current', 'biot', 'savart'],
                nodes: [
                    node('electric_current', 'Electric Current', 'quantity', ['current'], 'Electric current measures the flow of charge.'),
                    node('magnetic_field', 'Magnetic Field', 'quantity', ['magnetic field', 'magnetism'], 'The magnetic field describes magnetic influence in space.', ['Electric Current']),
                    node('amperes_law', "Ampère's Law", 'law', ['ampere'], 'Ampère’s law relates circulating magnetic field to current.', ['Electric Current', 'Magnetic Field']),
                ],
            },
            {
                key: 'maxwell_and_waves',
                title: 'Maxwell and Waves',
                keywords: ['maxwell', 'wave', 'faraday', 'induction', 'radiation'],
                nodes: [
                    node('faradays_law', "Faraday's Law", 'law', ['faraday', 'induction'], 'Faraday’s law links changing magnetic flux to induced electric fields.', ['Magnetic Field']),
                    node('maxwells_equations', "Maxwell's Equations", 'law', ['maxwell', 'gauss'], 'Maxwell’s equations unify electric and magnetic field dynamics.', ['Faraday\'s Law', "Ampère's Law"]),
                    node('electromagnetic_wave', 'Electromagnetic Waves', 'concept', ['electromagnetic wave', 'radiation'], 'Electromagnetic waves propagate coupled electric and magnetic disturbances.', ["Maxwell's Equations"]),
                ],
            },
        ],
    },
    {
        id: 'semiconductor-physics',
        label: 'SEMICONDUCTOR\nPHYSICS',
        keywords: [
            'semiconductor',
            'mosfet',
            'field effect transistor',
            'gate voltage',
            'drain current',
            'threshold voltage',
            'inversion',
            'accumulation',
            'depletion',
            'channel',
            'surface potential',
        ],
        field: {
            id: 'semiconductor-physics',
            slug: 'semiconductor-physics',
            name: 'Semiconductor Physics',
            description: 'The physics of semiconductor materials, charge control, and field-effect devices.',
            icon: 'cpu',
            color: 'from-neutral-700 to-neutral-400',
        },
        clusters: [
            {
                key: 'mos_electrostatics',
                title: 'MOS Electrostatics',
                keywords: ['mos capacitor', 'flat-band', 'surface potential', 'oxide', 'work function'],
                nodes: [
                    node(
                        'field_effect_transistor',
                        'Field Effect Transistor',
                        'concept',
                        ['field effect transistor', 'fet', 'gate'],
                        'A field effect transistor uses an electric field to control carrier motion in a semiconductor region.',
                    ),
                    node(
                        'mos_capacitor',
                        'MOS Capacitor',
                        'formalism',
                        ['mos capacitor', 'oxide', 'gate oxide'],
                        'The MOS capacitor is the electrostatic backbone behind MOSFET gate control.',
                        ['Field Effect Transistor'],
                    ),
                    node(
                        'flat_band_condition',
                        'Flat-Band Condition',
                        'law',
                        ['flat band', 'flat-band', 'band bending'],
                        'The flat-band condition is the reference bias where net semiconductor charge vanishes in the idealized MOS structure.',
                        ['MOS Capacitor'],
                        ['MOS Capacitor'],
                    ),
                    node(
                        'surface_potential',
                        'Surface Potential',
                        'quantity',
                        ['surface potential', 'surface potential'],
                        'Surface potential measures how strongly the gate bias bends the semiconductor bands near the interface.',
                        ['MOS Capacitor', 'Flat-Band Condition'],
                    ),
                ],
            },
            {
                key: 'carrier_regimes',
                title: 'Carrier Regimes',
                keywords: ['accumulation', 'depletion', 'inversion', 'threshold', 'channel'],
                nodes: [
                    node(
                        'accumulation',
                        'Accumulation',
                        'concept',
                        ['accumulation', 'accumulation mode'],
                        'Accumulation is the regime where majority carriers pile up near the surface under gate bias.',
                        ['Surface Potential'],
                    ),
                    node(
                        'depletion',
                        'Depletion',
                        'concept',
                        ['depletion', 'depletion mode'],
                        'Depletion is the regime where mobile carriers are pushed away and fixed charge dominates near the interface.',
                        ['Surface Potential'],
                    ),
                    node(
                        'inversion_layer',
                        'Inversion Layer',
                        'concept',
                        ['inversion', 'inversion layer', 'channel'],
                        'An inversion layer is the carrier sheet that forms the conducting channel between source and drain.',
                        ['Depletion', 'Surface Potential'],
                    ),
                    node(
                        'threshold_voltage',
                        'Threshold Voltage',
                        'quantity',
                        ['threshold voltage', 'threshold', 'vth'],
                        'Threshold voltage marks the onset of strong inversion and channel formation.',
                        ['Depletion', 'Inversion Layer'],
                    ),
                ],
            },
            {
                key: 'drain_transport',
                title: 'Drain Transport',
                keywords: ['drain current', 'source', 'drain', 'saturation', 'pinch-off', 'mobility'],
                nodes: [
                    node(
                        'drain_current',
                        'Drain Current',
                        'quantity',
                        ['drain current', 'id'],
                        'Drain current is the observable controlled by gate bias and channel charge.',
                        ['Inversion Layer', 'Threshold Voltage'],
                    ),
                    node(
                        'linear_region',
                        'Linear Region',
                        'concept',
                        ['linear region', 'ohmic region'],
                        'In the linear region the MOSFET behaves like a gate-controlled resistor.',
                        ['Drain Current'],
                    ),
                    node(
                        'saturation_region',
                        'Saturation Region',
                        'concept',
                        ['saturation', 'saturation region', 'pinch-off'],
                        'In saturation the channel pinches off near the drain and current becomes only weakly dependent on drain bias.',
                        ['Drain Current'],
                    ),
                    node(
                        'channel_length_modulation',
                        'Channel Length Modulation',
                        'concept',
                        ['channel length modulation'],
                        'Channel length modulation captures the residual drain-bias dependence of the saturation current.',
                        ['Saturation Region'],
                    ),
                ],
            },
            {
                key: 'device_types_and_use_cases',
                title: 'Device Types and Applications',
                keywords: ['nmos', 'pmos', 'enhancement', 'depletion', 'application', 'switch', 'amplifier'],
                nodes: [
                    node(
                        'nmos',
                        'NMOS',
                        'concept',
                        ['nmos', 'n-channel'],
                        'NMOS is the electron-channel version of the MOSFET.',
                        ['Inversion Layer'],
                    ),
                    node(
                        'pmos',
                        'PMOS',
                        'concept',
                        ['pmos', 'p-channel'],
                        'PMOS is the hole-channel version of the MOSFET.',
                        ['Inversion Layer'],
                    ),
                    node(
                        'enhancement_mode_mosfet',
                        'Enhancement-Mode MOSFET',
                        'formalism',
                        ['enhancement mode', 'enhancement'],
                        'Enhancement-mode devices require gate bias to create a conducting channel.',
                        ['Threshold Voltage'],
                    ),
                    node(
                        'mosfet_application',
                        'MOSFET Applications',
                        'problem_class',
                        ['application', 'switch', 'amplifier', 'digital logic'],
                        'MOSFET applications include switching, amplification, and integrated circuit logic.',
                        ['NMOS', 'PMOS'],
                    ),
                ],
            },
        ],
    },
    {
        id: 'quantum',
        label: 'QUANTUM\nMECHANICS',
        keywords: ['quantum', 'wavefunction', 'schrodinger', 'operator', 'hilbert', 'uncertainty', 'superposition'],
        field: {
            id: 'quantum',
            slug: 'quantum-mechanics',
            name: 'Quantum Mechanics',
            description: 'Quantum states, operators, measurement, and the structure of microscopic dynamics.',
            icon: 'atom',
            color: 'from-purple-500 to-pink-400',
        },
        clusters: [
            {
                key: 'foundations',
                title: 'Foundations',
                keywords: ['wavefunction', 'superposition', 'measurement', 'probability', 'born'],
                nodes: [
                    node('wave_function', 'Wave Function', 'concept', ['wave function', 'wavefunction', 'psi'], 'The wave function encodes the quantum state of a system.'),
                    node('superposition_principle', 'Superposition Principle', 'law', ['superposition'], 'Quantum superposition allows states to combine linearly.', ['Wave Function']),
                    node('born_rule', 'Born Rule', 'law', ['born rule', 'probability density'], 'The Born rule extracts measurable probabilities from amplitudes.', ['Wave Function']),
                ],
            },
            {
                key: 'dynamics',
                title: 'Quantum Dynamics',
                keywords: ['schrodinger', 'hamiltonian', 'eigenvalue', 'operator'],
                nodes: [
                    node('schrodinger_equation', 'Schrödinger Equation', 'law', ['schrodinger'], 'The Schrödinger equation governs unitary time evolution.', ['Wave Function']),
                    node('quantum_hamiltonian', 'Quantum Hamiltonian', 'quantity', ['hamiltonian'], 'The Hamiltonian operator generates quantum dynamics.', ['Schrödinger Equation']),
                    node('eigenstate', 'Eigenstate', 'concept', ['eigenstate', 'eigenvalue'], 'Eigenstates organize measurements and stationary solutions.', ['Quantum Hamiltonian']),
                ],
            },
            {
                key: 'measurement_and_spin',
                title: 'Measurement and Spin',
                keywords: ['spin', 'observable', 'uncertainty', 'commutator'],
                nodes: [
                    node('observable', 'Observable', 'concept', ['observable', 'operator'], 'Observables represent measurable quantities in operator form.'),
                    node('heisenberg_uncertainty', 'Heisenberg Uncertainty Principle', 'law', ['uncertainty', 'heisenberg'], 'The uncertainty principle bounds joint precision for noncommuting observables.', ['Observable']),
                    node('spin', 'Spin', 'quantity', ['spin'], 'Spin is intrinsic angular momentum with uniquely quantum behavior.', ['Observable']),
                ],
            },
        ],
    },
    {
        id: 'statistical',
        label: 'STATISTICAL\nMECHANICS',
        keywords: ['entropy', 'ensemble', 'partition function', 'boltzmann', 'gibbs', 'phase transition', 'statistical'],
        field: {
            id: 'statistical',
            slug: 'statistical-mechanics',
            name: 'Statistical Mechanics',
            description: 'Probability, ensembles, entropy, and emergent macroscopic structure.',
            icon: 'bar-chart-3',
            color: 'from-green-500 to-emerald-400',
        },
        clusters: [
            {
                key: 'ensembles',
                title: 'Ensembles',
                keywords: ['ensemble', 'canonical ensemble', 'microcanonical', 'grand canonical'],
                nodes: [
                    node('microcanonical_ensemble', 'Microcanonical Ensemble', 'formalism', ['microcanonical'], 'The microcanonical ensemble describes isolated systems at fixed energy.'),
                    node('canonical_ensemble', 'Canonical Ensemble', 'formalism', ['canonical ensemble'], 'The canonical ensemble describes systems in thermal equilibrium with a bath.'),
                    node('grand_canonical_ensemble', 'Grand Canonical Ensemble', 'formalism', ['grand canonical'], 'The grand canonical ensemble permits particle exchange with a reservoir.'),
                ],
            },
            {
                key: 'entropy_and_free_energy',
                title: 'Entropy and Free Energy',
                keywords: ['entropy', 'free energy', 'partition function', 'boltzmann'],
                nodes: [
                    node('boltzmann_entropy', 'Boltzmann Entropy', 'quantity', ['boltzmann entropy', 'entropy'], 'Boltzmann entropy connects macrostates to microscopic multiplicity.'),
                    node('partition_function', 'Partition Function', 'quantity', ['partition function'], 'The partition function generates thermodynamic observables and probabilities.', ['Canonical Ensemble']),
                    node('free_energy', 'Free Energy', 'quantity', ['free energy'], 'Free energy measures equilibrium tradeoffs between energy and entropy.', ['Partition Function']),
                ],
            },
            {
                key: 'phase_transitions',
                title: 'Phase Transitions',
                keywords: ['phase transition', 'critical', 'ising', 'order parameter'],
                nodes: [
                    node('ising_model', 'Ising Model', 'problem_class', ['ising'], 'The Ising model is a canonical system for studying cooperative order.'),
                    node('order_parameter', 'Order Parameter', 'quantity', ['order parameter'], 'Order parameters summarize symmetry breaking across phases.', ['Ising Model']),
                    node('critical_phenomena', 'Critical Phenomena', 'concept', ['critical phenomena', 'critical point'], 'Critical phenomena describe scale-sensitive behavior near phase transitions.', ['Order Parameter']),
                ],
            },
        ],
    },
    {
        id: 'thermodynamics',
        label: 'THERMO\nDYNAMICS',
        keywords: ['thermodynamics', 'temperature', 'heat', 'first law', 'second law', 'thermodynamic', 'engine'],
        field: {
            id: 'thermodynamics',
            slug: 'thermodynamics',
            name: 'Thermodynamics',
            description: 'Heat, work, state variables, and the macroscopic laws of equilibrium and irreversibility.',
            icon: 'flame',
            color: 'from-rose-500 to-orange-400',
        },
        clusters: [
            {
                key: 'state_variables',
                title: 'State Variables',
                keywords: ['temperature', 'pressure', 'volume', 'equation of state'],
                nodes: [
                    node('temperature', 'Temperature', 'quantity', ['temperature'], 'Temperature measures thermal state and equilibrium ordering.'),
                    node('pressure', 'Pressure', 'quantity', ['pressure'], 'Pressure quantifies normal mechanical stress in fluids.', ['Temperature']),
                    node('equation_of_state', 'Equation of State', 'law', ['equation of state'], 'An equation of state constrains macroscopic state variables.', ['Temperature', 'Pressure']),
                ],
            },
            {
                key: 'laws_of_thermodynamics',
                title: 'Laws of Thermodynamics',
                keywords: ['first law', 'second law', 'entropy', 'heat engine'],
                nodes: [
                    node('first_law_of_thermodynamics', 'First Law of Thermodynamics', 'law', ['first law'], 'The first law enforces energy accounting through heat and work.', ['Temperature']),
                    node('second_law_of_thermodynamics', 'Second Law of Thermodynamics', 'law', ['second law'], 'The second law constrains irreversible processes through entropy increase.', ['First Law of Thermodynamics']),
                    node('heat_engine', 'Heat Engine', 'problem_class', ['heat engine', 'carnot'], 'Heat engines turn thermal gradients into work under thermodynamic constraints.', ['Second Law of Thermodynamics']),
                ],
            },
        ],
    },
    {
        id: 'mathematical-physics',
        label: 'MATHEMATICAL\nPHYSICS',
        keywords: ['tensor', 'fourier', 'green function', 'symmetry', 'lie group', 'manifold', 'functional analysis'],
        field: {
            id: 'mathematical-physics',
            slug: 'mathematical-physics',
            name: 'Mathematical Physics',
            description: 'Formal mathematical tools that structure physical theories and calculations.',
            icon: 'sigma',
            color: 'from-indigo-500 to-violet-400',
        },
        clusters: [
            {
                key: 'analysis_tools',
                title: 'Analysis Tools',
                keywords: ['fourier', 'green function', 'distribution', 'operator theory'],
                nodes: [
                    node('fourier_analysis', 'Fourier Analysis', 'formalism', ['fourier'], 'Fourier analysis decomposes functions into mode content.'),
                    node('greens_function', "Green's Function", 'formalism', ['green function', 'greens function'], 'Green’s functions solve linear response and boundary-value problems.'),
                    node('functional_analysis', 'Functional Analysis', 'formalism', ['functional analysis'], 'Functional analysis studies infinite-dimensional vector spaces used across physics.', ['Fourier Analysis']),
                ],
            },
            {
                key: 'geometry_and_symmetry',
                title: 'Geometry and Symmetry',
                keywords: ['manifold', 'riemannian', 'lie group', 'symmetry', 'noether'],
                nodes: [
                    node('riemannian_geometry', 'Riemannian Geometry', 'formalism', ['riemannian', 'manifold'], 'Riemannian geometry equips manifolds with metric structure.'),
                    node('lie_group', 'Lie Groups', 'concept', ['lie group', 'symmetry'], 'Lie groups encode continuous symmetries in physical systems.', ['Riemannian Geometry']),
                    node('noethers_theorem', "Noether's Theorem", 'law', ['noether'], 'Noether’s theorem links continuous symmetries to conservation laws.', ['Lie Groups']),
                ],
            },
        ],
    },
];

export const KNOWLEDGE_SPHERE_MAP = new Map(
    KNOWLEDGE_SPHERE_TEMPLATES.map((template) => [template.id, template]),
);
