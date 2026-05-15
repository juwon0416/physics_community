import type { GraphEdge, GraphModel, GraphNode } from '../lib/graphModel';
import { createKatexBlockMarkup } from '../lib/renderTopicMath';
import { ARCHIVE_FUNDAMENTALS_GROUNDING } from './archiveFundamentalsGrounding';

type ArchiveField = {
    id: string;
    label: string;
    name: string;
    description: string;
};

type ArchiveCluster = {
    key: string;
    label: string;
    fieldId: string;
    chapterNumbers: number[];
};

type ArchiveChapter = {
    number: number;
    title: string;
    sections: string[];
};

export interface ArchiveFallbackTopic {
    id: string;
    field_id: string;
    year: string;
    title: string;
    slug: string;
    summary: string;
    tags: string[];
    content: string;
}

const BOOK_TITLE = 'Fundamentals of Physics';
const BOOK_SOURCE_ID = 'archive-fundamentals-of-physics';

const ARCHIVE_FIELDS: ArchiveField[] = [
    {
        id: 'classical',
        label: 'CLASSICAL\nMECHANICS',
        name: 'Classical Mechanics',
        description: 'Measurement, motion, forces, energy, rotation, gravitation, fluids, and wave foundations.',
    },
    {
        id: 'thermodynamics',
        label: 'THERMO\nDYNAMICS',
        name: 'Thermodynamics',
        description: 'Temperature, heat, gases, entropy, and the thermodynamic laws.',
    },
    {
        id: 'electrodynamics',
        label: 'ELECTRO\nDYNAMICS',
        name: 'Electromagnetism',
        description: 'Electric fields, circuits, magnetism, induction, Maxwell theory, and electromagnetic waves.',
    },
    {
        id: 'optics',
        label: 'OPTICS',
        name: 'Optics',
        description: 'Geometric optics, interference, and diffraction.',
    },
    {
        id: 'modern-physics',
        label: 'MODERN\nPHYSICS',
        name: 'Modern Physics',
        description: 'Relativity, quantum foundations, atomic physics, solid-state physics, and nuclear physics.',
    },
];

const ARCHIVE_CLUSTERS: ArchiveCluster[] = [
    { key: 'measurement-motion', label: 'Measurement and Motion', fieldId: 'classical', chapterNumbers: [1, 2, 3, 4] },
    { key: 'dynamics-energy', label: 'Dynamics and Energy', fieldId: 'classical', chapterNumbers: [5, 6, 7, 8, 9] },
    { key: 'rotation-gravitation', label: 'Rotation and Gravitation', fieldId: 'classical', chapterNumbers: [10, 11, 12, 13] },
    { key: 'fluids-waves', label: 'Fluids, Oscillations, and Waves', fieldId: 'classical', chapterNumbers: [14, 15, 16, 17] },
    { key: 'thermal-physics', label: 'Thermal Physics', fieldId: 'thermodynamics', chapterNumbers: [18, 19, 20] },
    { key: 'electrostatics', label: 'Electrostatics', fieldId: 'electrodynamics', chapterNumbers: [21, 22, 23, 24, 25] },
    { key: 'circuits-magnetism', label: 'Circuits and Magnetism', fieldId: 'electrodynamics', chapterNumbers: [26, 27, 28, 29, 30] },
    { key: 'maxwell-systems', label: 'Maxwell Systems and Waves', fieldId: 'electrodynamics', chapterNumbers: [31, 32, 33] },
    { key: 'geometric-wave-optics', label: 'Geometric and Wave Optics', fieldId: 'optics', chapterNumbers: [34, 35, 36] },
    { key: 'relativity-quantum', label: 'Relativity and Quantum Foundations', fieldId: 'modern-physics', chapterNumbers: [37, 38, 39, 40] },
    { key: 'solids-nuclear', label: 'Solids, Nuclear, and Particle Physics', fieldId: 'modern-physics', chapterNumbers: [41, 42, 43, 44] },
];

const ARCHIVE_CHAPTERS: ArchiveChapter[] = [
    { number: 1, title: 'Measurement', sections: ['Measuring Things, Including Lengths', 'Time', 'Mass'] },
    { number: 2, title: 'Motion Along a Straight Line', sections: ['Position, Displacement, and Average Velocity', 'Instantaneous Velocity and Speed', 'Acceleration', 'Constant Acceleration', 'Free-Fall Acceleration', 'Graphical Integration in Motion Analysis'] },
    { number: 3, title: 'Vectors', sections: ['Vectors and Their Components', 'Unit Vectors, Adding Vectors by Components', 'Multiplying Vectors'] },
    { number: 4, title: 'Motion in Two and Three Dimensions', sections: ['Position and Displacement', 'Average Velocity and Instantaneous Velocity', 'Average Acceleration and Instantaneous Acceleration', 'Projectile Motion', 'Uniform Circular Motion', 'Relative Motion in One Dimension', 'Relative Motion in Two Dimensions'] },
    { number: 5, title: 'Force and Motion I', sections: ["Newton's First and Second Laws", 'Some Particular Forces', "Applying Newton's Laws"] },
    { number: 6, title: 'Force and Motion II', sections: ['Friction', 'The Drag Force and Terminal Speed', 'Uniform Circular Motion'] },
    { number: 7, title: 'Kinetic Energy and Work', sections: ['Kinetic Energy', 'Work and Kinetic Energy', 'Work Done by the Gravitational Force', 'Work Done by a Spring Force', 'Work Done by a General Variable Force', 'Power'] },
    { number: 8, title: 'Potential Energy and Conservation of Energy', sections: ['Potential Energy', 'Conservation of Mechanical Energy', 'Reading a Potential Energy Curve', 'Work Done on a System by an External Force', 'Conservation of Energy'] },
    { number: 9, title: 'Center of Mass and Linear Momentum', sections: ['Center of Mass', "Newton's Second Law for a System of Particles", 'Linear Momentum', 'Collision and Impulse', 'Conservation of Linear Momentum', 'Momentum and Kinetic Energy in Collisions', 'Elastic Collisions in One Dimension', 'Collisions in Two Dimensions', 'Systems with Varying Mass: A Rocket'] },
    { number: 10, title: 'Rotation', sections: ['Rotational Variables', 'Rotation with Constant Angular Acceleration', 'Relating the Linear and Angular Variables', 'Kinetic Energy of Rotation', 'Calculating the Rotational Inertia', 'Torque', "Newton's Second Law for Rotation", 'Work and Rotational Kinetic Energy'] },
    { number: 11, title: 'Rolling, Torque, and Angular Momentum', sections: ['Rolling as Translation and Rotation Combined', 'Forces and Kinetic Energy of Rolling', 'The Yo-Yo', 'Torque Revisited', 'Angular Momentum', "Newton's Second Law in Angular Form", 'Angular Momentum of a Rigid Body', 'Conservation of Angular Momentum', 'Precession of a Gyroscope'] },
    { number: 12, title: 'Equilibrium and Elasticity', sections: ['Equilibrium', 'Some Examples of Static Equilibrium', 'Elasticity'] },
    { number: 13, title: 'Gravitation', sections: ["Newton's Law of Gravitation", 'Gravitation and the Principle of Superposition', "Gravitation Near Earth's Surface", 'Gravitation Inside Earth', 'Gravitational Potential Energy', "Planets and Satellites: Kepler's Laws", 'Satellites: Orbits and Energy', 'Einstein and Gravitation'] },
    { number: 14, title: 'Fluids', sections: ['Fluids, Density, and Pressure', 'Fluids at Rest', 'Measuring Pressure', "Pascal's Principle", "Archimedes' Principle", 'The Equation of Continuity', "Bernoulli's Equation"] },
    { number: 15, title: 'Oscillations', sections: ['Simple Harmonic Motion', 'Energy in Simple Harmonic Motion', 'An Angular Simple Harmonic Oscillator', 'Pendulums, Circular Motion', 'Damped Simple Harmonic Motion', 'Forced Oscillations and Resonance'] },
    { number: 16, title: 'Waves I', sections: ['Transverse Waves', 'Wave Speed on a Stretched String', 'Energy and Power of a Wave Traveling Along a String', 'The Wave Equation', 'Interference of Waves', 'Phasors', 'Standing Waves and Resonance'] },
    { number: 17, title: 'Waves II', sections: ['Speed of Sound', 'Traveling Sound Waves', 'Interference', 'Intensity and Sound Level', 'Sources of Musical Sound', 'Beats', 'The Doppler Effect', 'Supersonic Speeds, Shock Waves'] },
    { number: 18, title: 'Temperature, Heat, and the First Law of Thermodynamics', sections: ['Temperature', 'The Celsius and Fahrenheit Scales', 'Thermal Expansion', 'Absorption of Heat', 'The First Law of Thermodynamics', 'Heat Transfer Mechanisms'] },
    { number: 19, title: 'The Kinetic Theory of Gases', sections: ["Avogadro's Number", 'Ideal Gases', 'Pressure, Temperature, and RMS Speed', 'Translational Kinetic Energy', 'Mean Free Path', 'The Distribution of Molecular Speeds', 'The Molar Specific Heats of an Ideal Gas', 'Degrees of Freedom and Molar Specific Heats', 'The Adiabatic Expansion of an Ideal Gas'] },
    { number: 20, title: 'Entropy and the Second Law of Thermodynamics', sections: ['Entropy', 'Entropy in the Real World: Engines', 'Refrigerators and Real Engines', 'A Statistical View of Entropy'] },
    { number: 21, title: "Coulomb's Law", sections: ["Coulomb's Law", 'Charge Is Quantized', 'Charge Is Conserved'] },
    { number: 22, title: 'Electric Fields', sections: ['The Electric Field', 'The Electric Field Due to a Charged Particle', 'The Electric Field Due to a Dipole', 'The Electric Field Due to a Line of Charge', 'The Electric Field Due to a Charged Disk', 'A Point Charge in an Electric Field', 'A Dipole in an Electric Field'] },
    { number: 23, title: "Gauss' Law", sections: ['Electric Flux', "Gauss' Law", 'A Charged Isolated Conductor', "Applying Gauss' Law: Cylindrical Symmetry", "Applying Gauss' Law: Planar Symmetry", "Applying Gauss' Law: Spherical Symmetry"] },
    { number: 24, title: 'Electric Potential', sections: ['Electric Potential', 'Equipotential Surfaces and the Electric Field', 'Potential Due to a Charged Particle', 'Potential Due to an Electric Dipole', 'Potential Due to a Continuous Charge Distribution', 'Calculating the Field from the Potential', 'Electric Potential Energy of a System of Charged Particles', 'Potential of a Charged Isolated Conductor'] },
    { number: 25, title: 'Capacitance', sections: ['Capacitance', 'Calculating the Capacitance', 'Capacitors in Parallel and in Series', 'Energy Stored in an Electric Field', 'Capacitor with a Dielectric', "Dielectrics and Gauss' Law"] },
    { number: 26, title: 'Current and Resistance', sections: ['Electric Current', 'Current Density', 'Resistance and Resistivity', "Ohm's Law", 'Power, Semiconductors, Superconductors'] },
    { number: 27, title: 'Circuits', sections: ['Single-Loop Circuits', 'Multiloop Circuits', 'The Ammeter and the Voltmeter', 'RC Circuits'] },
    { number: 28, title: 'Magnetic Fields', sections: ['Magnetic Fields and the Definition of B', 'Crossed Fields: Discovery of the Electron', 'Crossed Fields: The Hall Effect', 'A Circulating Charged Particle', 'Cyclotrons and Synchrotrons', 'Magnetic Force on a Current-Carrying Wire', 'Torque on a Current Loop', 'The Magnetic Dipole Moment'] },
    { number: 29, title: 'Magnetic Fields Due to Currents', sections: ['Magnetic Field Due to a Current', 'Force Between Two Parallel Currents', "Ampere's Law", 'Solenoids and Toroids', 'A Current-Carrying Coil as a Magnetic Dipole'] },
    { number: 30, title: 'Induction and Inductance', sections: ["Faraday's Law and Lenz's Law", 'Induction and Energy Transfers', 'Induced Electric Fields', 'Inductors and Inductance', 'Self-Induction', 'RL Circuits', 'Energy Stored in a Magnetic Field', 'Energy Density of a Magnetic Field', 'Mutual Induction'] },
    { number: 31, title: 'Electromagnetic Oscillations and Alternating Current', sections: ['LC Oscillations', 'Damped Oscillations in an RLC Circuit', 'Forced Oscillations of Three Simple Circuits', 'The Series RLC Circuit', 'Power in Alternating-Current Circuits', 'Transformers'] },
    { number: 32, title: "Maxwell's Equations; Magnetism of Matter", sections: ["Gauss' Law for Magnetic Fields", 'Induced Magnetic Fields', 'Displacement Current', 'Magnets', 'Magnetism and Electrons', 'Diamagnetism', 'Paramagnetism', 'Ferromagnetism'] },
    { number: 33, title: 'Electromagnetic Waves', sections: ['Electromagnetic Waves', 'Energy Transport and the Poynting Vector', 'Radiation Pressure', 'Polarization', 'Reflection and Refraction', 'Total Internal Reflection', 'Polarization by Reflection'] },
    { number: 34, title: 'Images', sections: ['Images and Plane Mirrors', 'Spherical Mirrors', 'Spherical Refracting Surfaces', 'Thin Lenses', 'Optical Instruments', 'Three Proofs'] },
    { number: 35, title: 'Interference', sections: ['Light as a Wave', "Young's Interference Experiment", 'Interference and Double-Slit Intensity', 'Interference from Thin Films', "Michelson's Interferometer"] },
    { number: 36, title: 'Diffraction', sections: ['Single-Slit Diffraction', 'Intensity in Single-Slit Diffraction', 'Diffraction by a Circular Aperture', 'Diffraction by a Double Slit', 'Diffraction Gratings', 'Gratings: Dispersion and Resolving Power', 'X-Ray Diffraction'] },
    { number: 37, title: 'Relativity', sections: ['Simultaneity and Time Dilation', 'The Relativity of Length', 'The Lorentz Transformation', 'The Relativity of Velocities', 'Doppler Effect for Light', 'Momentum and Energy'] },
    { number: 38, title: 'Photons and Matter Waves', sections: ['The Photon, the Quantum of Light', 'The Photoelectric Effect', 'Photons, Momentum, Compton Scattering, Light Interference', 'The Birth of Quantum Physics', 'Electrons and Matter Waves', "Schrodinger's Equation", "Heisenberg's Uncertainty Principle", 'Reflection from a Potential Step', 'Tunneling Through a Potential Barrier'] },
    { number: 39, title: 'More About Matter Waves', sections: ['Energies of a Trapped Electron', 'Wave Functions of a Trapped Electron', 'An Electron in a Finite Well', 'Two- and Three-Dimensional Electron Traps', 'The Hydrogen Atom'] },
    { number: 40, title: 'All About Atoms', sections: ['Properties of Atoms', 'The Stern-Gerlach Experiment', 'Magnetic Resonance', 'Exclusion Principle and Multiple Electrons in a Trap', 'Building the Periodic Table', 'X Rays and the Ordering of the Elements', 'Lasers'] },
    { number: 41, title: 'Conduction of Electricity in Solids', sections: ['The Electrical Properties of Metals', 'Semiconductors and Doping', 'The p-n Junction and the Transistor'] },
    { number: 42, title: 'Nuclear Physics', sections: ['Discovering the Nucleus', 'Some Nuclear Properties', 'Radioactive Decay', 'Alpha Decay', 'Beta Decay', 'Radioactive Dating', 'Measuring Radiation Dosage', 'Nuclear Models'] },
    { number: 43, title: 'Energy from the Nucleus', sections: ['Nuclear Fission', 'The Nuclear Reactor', 'A Natural Nuclear Reactor', 'Thermonuclear Fusion: The Basic Process', 'Thermonuclear Fusion in the Sun and Other Stars', 'Controlled Thermonuclear Fusion'] },
    { number: 44, title: 'Quarks, Leptons, and the Big Bang', sections: ['General Properties of Elementary Particles', 'Leptons, Hadrons, and Strangeness', 'Quarks and Messenger Particles', 'Cosmology'] },
];

const ARCHIVE_CROSSLINKS: Array<[number, number]> = [
    [1, 2], [2, 3], [3, 4],
    [5, 6], [7, 8], [8, 9],
    [10, 11], [11, 13], [15, 16], [16, 17],
    [18, 19], [19, 20],
    [21, 22], [22, 23], [23, 24], [24, 25],
    [26, 27], [28, 29], [29, 30], [30, 31], [31, 32], [32, 33],
    [33, 35], [34, 35], [35, 36],
    [37, 38], [38, 39], [39, 40],
    [41, 42], [42, 43], [43, 44],
];

function chapterId(number: number) {
    return `archive-fop-ch${String(number).padStart(2, '0')}`;
}

function clusterId(cluster: ArchiveCluster) {
    return `archive-fop-cluster-${cluster.key}`;
}

function chapterSlug(chapter: ArchiveChapter) {
    const base = chapter.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return `fop-${String(chapter.number).padStart(2, '0')}-${base}`;
}

function getFieldById(fieldId: string) {
    return ARCHIVE_FIELDS.find((field) => field.id === fieldId)!;
}

function getClusterByChapterNumber(chapterNumber: number) {
    return ARCHIVE_CLUSTERS.find((cluster) => cluster.chapterNumbers.includes(chapterNumber))!;
}

function getChapterByNumber(chapterNumber: number) {
    return ARCHIVE_CHAPTERS.find((chapter) => chapter.number === chapterNumber)!;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildTopicHref(chapter: ArchiveChapter) {
    return `/topic/${chapterSlug(chapter)}?view=archive`;
}

function renderTopicLink(chapter: ArchiveChapter) {
    return `<a href="${escapeHtml(buildTopicHref(chapter))}">${escapeHtml(chapter.title)}</a>`;
}

function buildSummary(chapter: ArchiveChapter, field: ArchiveField) {
    const topics = chapter.sections.slice(0, 3).map((section) => section.toLowerCase());
    return `${BOOK_TITLE} chapter ${chapter.number} introduces ${chapter.title.toLowerCase()} within ${field.name.toLowerCase()}, focusing on ${topics.join(', ')}.`;
}

function inferRepresentativeEquations(chapter: ArchiveChapter) {
    const sectionText = chapter.sections.join(' ').toUpperCase();
    const equations: string[] = [];

    if (sectionText.includes('VELOCITY')) equations.push('v = \\frac{dx}{dt}');
    if (sectionText.includes('ACCELERATION')) equations.push('a = \\frac{dv}{dt} = \\frac{d^2x}{dt^2}');
    if (sectionText.includes('PROJECTILE')) equations.push('x = v_0 \\cos\\theta\\, t, \\qquad y = v_0 \\sin\\theta\\, t - \\frac{1}{2}gt^2');
    if (sectionText.includes('NEWTON')) equations.push('\\sum \\mathbf{F} = \\frac{d\\mathbf{p}}{dt}, \\qquad \\sum \\mathbf{F} = m\\mathbf{a}');
    if (sectionText.includes('KINETIC ENERGY')) equations.push('K = \\frac{1}{2}mv^2');
    if (sectionText.includes('POTENTIAL ENERGY')) equations.push('E = K + U');
    if (sectionText.includes('LINEAR MOMENTUM')) equations.push('\\mathbf{p} = m\\mathbf{v}');
    if (sectionText.includes('TORQUE')) equations.push('\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F}');
    if (sectionText.includes('ANGULAR MOMENTUM')) equations.push('\\mathbf{L} = \\mathbf{r} \\times \\mathbf{p}');
    if (sectionText.includes('GRAVITATION')) equations.push('F = G\\frac{mM}{r^2}');
    if (sectionText.includes('BERNOULLI')) equations.push('P + \\frac{1}{2}\\rho v^2 + \\rho g y = \\text{constant}');
    if (sectionText.includes('SIMPLE HARMONIC MOTION')) equations.push('\\frac{d^2x}{dt^2} + \\omega^2 x = 0');
    if (sectionText.includes('WAVE EQUATION')) equations.push('\\frac{\\partial^2 y}{\\partial x^2} = \\frac{1}{v^2}\\frac{\\partial^2 y}{\\partial t^2}');
    if (sectionText.includes('IDEAL GASES')) equations.push('PV = nRT');
    if (sectionText.includes('FIRST LAW')) equations.push('dU = \\delta Q - \\delta W');
    if (sectionText.includes('ENTROPY')) equations.push('\\Delta S \\ge \\int \\frac{\\delta Q_{rev}}{T}');
    if (sectionText.includes('COULOMB')) equations.push('F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}');
    if (sectionText.includes('ELECTRIC FIELD')) equations.push('\\mathbf{E} = \\frac{\\mathbf{F}}{q}');
    if (sectionText.includes('GAUSS')) equations.push('\\oint \\mathbf{E}\\cdot d\\mathbf{A} = \\frac{Q_{enc}}{\\varepsilon_0}');
    if (sectionText.includes('POTENTIAL')) equations.push('\\mathbf{E} = -\\nabla V');
    if (sectionText.includes('CAPACITANCE')) equations.push('C = \\frac{Q}{V}');
    if (sectionText.includes('OHM')) equations.push('V = IR');
    if (sectionText.includes('MAGNETIC FIELD')) equations.push('\\mathbf{F} = q\\mathbf{v} \\times \\mathbf{B}');
    if (sectionText.includes('AMPERE')) equations.push('\\oint \\mathbf{B}\\cdot d\\mathbf{l} = \\mu_0 I_{enc}');
    if (sectionText.includes('FARADAY')) equations.push('\\oint \\mathbf{E}\\cdot d\\mathbf{l} = -\\frac{d\\Phi_B}{dt}');
    if (sectionText.includes('INDUCTANCE')) equations.push('V_L = L\\frac{dI}{dt}');
    if (sectionText.includes('LC OSCILLATIONS')) equations.push('\\omega = \\frac{1}{\\sqrt{LC}}');
    if (sectionText.includes('DISPLACEMENT CURRENT')) equations.push('\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}');
    if (sectionText.includes('ELECTROMAGNETIC WAVES')) equations.push('c = \\frac{1}{\\sqrt{\\mu_0\\varepsilon_0}}');
    if (sectionText.includes('THIN LENSES')) equations.push('\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}');
    if (sectionText.includes('INTERFERENCE')) equations.push('d\\sin\\theta = m\\lambda');
    if (sectionText.includes('DIFFRACTION')) equations.push('a\\sin\\theta = m\\lambda');
    if (sectionText.includes('RELATIVITY')) equations.push('\\Delta t = \\gamma\\Delta t_0, \\qquad \\gamma = \\frac{1}{\\sqrt{1-v^2/c^2}}');
    if (sectionText.includes('PHOTON')) equations.push('E = hf, \\qquad p = \\frac{h}{\\lambda}');
    if (sectionText.includes('SCHRODINGER')) equations.push('i\\hbar\\frac{\\partial \\psi}{\\partial t} = \\hat H\\psi');
    if (sectionText.includes('UNCERTAINTY')) equations.push('\\Delta x\\,\\Delta p \\ge \\frac{\\hbar}{2}');
    if (sectionText.includes('HYDROGEN')) equations.push('E_n = -\\frac{13.6\\,\\text{eV}}{n^2}');
    if (sectionText.includes('RADIOACTIVE DECAY')) equations.push('N(t) = N_0 e^{-\\lambda t}');
    if (sectionText.includes('FISSION') || sectionText.includes('FUSION')) equations.push('E = \\Delta m c^2');

    return Array.from(new Set(equations)).slice(0, 5);
}

function inferLogicalThreads(chapter: ArchiveChapter) {
    return [
        `Start by treating ${chapter.title.toLowerCase()} as a structured topic rather than a checklist of formulas.`,
        ...chapter.sections.slice(0, 3).map((section) => `Unpack the section "${section}" as one logical dependency in the chapter argument.`),
        `Finish by linking ${chapter.title.toLowerCase()} back to the wider ${getFieldById(getClusterByChapterNumber(chapter.number).fieldId).name.toLowerCase()} sphere.`,
    ].slice(0, 5);
}

function inferMasteryTargets(chapter: ArchiveChapter) {
    const cluster = getClusterByChapterNumber(chapter.number);
    return [
        `Be able to restate the main problem of ${chapter.title.toLowerCase()} without relying on the original textbook wording.`,
        `Be able to identify which section of ${cluster.label.toLowerCase()} this chapter extends.`,
        `Be able to connect the representative equations of this chapter to at least one neighboring chapter node.`,
    ];
}

function inferMisconceptions(chapter: ArchiveChapter) {
    const chapterTitle = chapter.title.toLowerCase();

    if (chapterTitle.includes('motion')) {
        return ['Do not confuse position, velocity, and acceleration as interchangeable descriptors of motion.'];
    }
    if (chapterTitle.includes('thermodynamics') || chapterTitle.includes('entropy')) {
        return ['Do not treat heat, temperature, and entropy as the same physical idea.'];
    }
    if (chapterTitle.includes('electric') || chapterTitle.includes('magnetic')) {
        return ['Do not collapse field, potential, and force into one undifferentiated electrical quantity.'];
    }
    if (chapterTitle.includes('quantum') || chapterTitle.includes('matter waves')) {
        return ['Do not read the wave function as a literal classical wave in ordinary space without stating its probabilistic role.'];
    }

    return ['Distinguish the precise formal statement of the chapter from one memorized slogan or shortcut formula.'];
}

function inferFormalCoreParagraphs(chapter: ArchiveChapter, cluster: ArchiveCluster, field: ArchiveField) {
    const firstSection = chapter.sections[0]?.toLowerCase() || chapter.title.toLowerCase();
    const lastSection = chapter.sections.at(-1)?.toLowerCase() || chapter.title.toLowerCase();

    return [
        `${chapter.title} should be read as a structured argument inside ${field.name}, not as a flat catalog of formulas. The chapter begins by identifying the primitive objects around ${firstSection}, and it closes by turning them into reusable reasoning patterns around ${lastSection}.`,
        `Within the ${cluster.label} cluster, this node supplies one of the canonical transitions from definition to prediction: define the active variables, state the governing constraint, and only then compute observable consequences.`,
        `A complete reading of this node should leave the learner able to say which quantities are fundamental, which equations are defining, which assumptions are idealizations, and which neighboring chapters inherit the resulting structure.`,
    ];
}

function describeSectionRole(section: string, chapter: ArchiveChapter) {
    const normalized = section.toLowerCase();

    if (/(measure|definition|position|vectors?|temperature|charge is|current|capacitance|electric field|potential|center of mass|entropy|ideal gases|simple harmonic motion)/.test(normalized)) {
        return `Use "${section}" to define the primitive objects and observables that the rest of ${chapter.title.toLowerCase()} will manipulate.`;
    }

    if (/(law|laws|equation|equations|principle|gauss|faraday|ampere|ohm|kepler|schrodinger|uncertainty)/.test(normalized)) {
        return `Treat "${section}" as the governing rule of the chapter: this is where descriptive language is compressed into a predictive mathematical statement.`;
    }

    if (/(energy|momentum|potential|flux|pressure|power|torque|inductance|resistance|capacitance|work|inertia|field)/.test(normalized)) {
        return `Read "${section}" as the chapter's compact bookkeeping layer, where many concrete situations are unified by one scalar, vector, or integral quantity.`;
    }

    if (/(projectile|collision|orbit|pendulum|yo-yo|instrument|reactor|laser|hall effect|thin films|x-ray|transistor|rocket|free-fall|circular motion)/.test(normalized)) {
        return `Use "${section}" as a canonical model problem that exposes how the formal statements of the chapter are actually deployed in calculations.`;
    }

    if (/(symmetry|resonance|interference|diffraction|polarization|relativity|tunneling|damped|forced|precession|superposition|dispersion)/.test(normalized)) {
        return `This section reveals the structural regime in which ${chapter.title.toLowerCase()} becomes especially informative, so it should be read as a stress test of the chapter's formal core.`;
    }

    return `Use "${section}" to extend the chapter argument by adding one more layer of interpretation, mathematical closure, or physically relevant special case.`;
}

function explainEquation(equation: string, chapter: ArchiveChapter) {
    if (equation.includes('v = \\frac{dx}{dt}')) {
        return `This is the rate-based definition of motion: ${chapter.title.toLowerCase()} begins by distinguishing location itself from how quickly location changes.`;
    }
    if (equation.includes('a = \\frac{dv}{dt}')) {
        return 'This equation adds curvature in time to the motion description, so the learner can separate changing speed from merely having a nonzero speed.';
    }
    if (equation.includes('\\sum \\mathbf{F}')) {
        return `This is the chapter's main dynamical closure relation: once forces are modeled, the resulting motion is fixed by the momentum balance.`;
    }
    if (equation.includes('K = \\frac{1}{2}mv^2')) {
        return 'This converts motion into a scalar resource, which is why work arguments can replace repeated vector force calculations in many problems.';
    }
    if (equation.includes('E = K + U')) {
        return 'This is the basic conservation ledger for conservative systems, and it turns geometric configuration into dynamical predictability.';
    }
    if (equation.includes('\\mathbf{p} = m\\mathbf{v}')) {
        return 'This equation defines the conserved translation quantity that survives collisions, impulses, and many-body bookkeeping.';
    }
    if (equation.includes('\\boldsymbol{\\tau}')) {
        return 'This is the rotational analogue of force balance: it tells you how lever arm and applied force conspire to change angular motion.';
    }
    if (equation.includes('\\mathbf{L} = \\mathbf{r} \\times \\mathbf{p}')) {
        return 'This packages rotational state into a conserved quantity whose symmetry meaning is at least as important as its computational use.';
    }
    if (equation.includes('G\\frac{mM}{r^2}')) {
        return 'This is the inverse-square force law that explains why orbital geometry, escape conditions, and field strength all scale together.';
    }
    if (equation.includes('Bernoulli')) {
        return 'This relation balances pressure, kinetic, and gravitational terms along a streamline, making fluid flow look like a conservation argument.';
    }
    if (equation.includes('\\frac{d^2x}{dt^2} + \\omega^2 x = 0')) {
        return 'This is the normal form of simple harmonic motion: once a restoring effect is proportional to displacement, oscillation follows.';
    }
    if (equation.includes('\\frac{\\partial^2 y}{\\partial x^2}')) {
        return 'This differential equation links curvature in space to curvature in time, which is the mathematical heart of wave propagation.';
    }
    if (equation.includes('PV = nRT')) {
        return 'This equation of state is the macroscopic closure of the ideal-gas model, tying pressure, temperature, and amount of substance into one thermodynamic surface.';
    }
    if (equation.includes('dU = \\delta Q - \\delta W')) {
        return 'This is the first-law bookkeeping rule: internal energy changes only through heat transfer and work exchange.';
    }
    if (equation.includes('\\Delta S')) {
        return 'This is the entropy criterion that distinguishes reversible bookkeeping from the actual arrow of macroscopic processes.';
    }
    if (equation.includes('q_1 q_2')) {
        return 'This inverse-square law is the electrostatic force analogue of gravitation, but now the sign of charge matters as much as magnitude.';
    }
    if (equation.includes('\\mathbf{E} = \\frac{\\mathbf{F}}{q}')) {
        return 'This defines the electric field operationally, separating the source-produced field from the properties of the test charge used to probe it.';
    }
    if (equation.includes('\\oint \\mathbf{E}\\cdot d\\mathbf{A}')) {
        return 'This integral law converts local field behavior into a global flux statement, which is why symmetry becomes such a powerful calculational tool.';
    }
    if (equation.includes('\\mathbf{E} = -\\nabla V')) {
        return 'This states that electric force can be recovered from a scalar potential, compressing vector information into one energy-like function.';
    }
    if (equation.includes('C = \\frac{Q}{V}')) {
        return 'This defines how much charge configuration can be stored per unit potential difference, which is the organizing idea of capacitance.';
    }
    if (equation.includes('V = IR')) {
        return 'This is the constitutive rule that closes elementary circuit problems by relating current flow to the potential drop across a resistive element.';
    }
    if (equation.includes('q\\mathbf{v} \\times \\mathbf{B}')) {
        return 'This force law makes it explicit that magnetic effects bend motion rather than doing work through a parallel push.';
    }
    if (equation.includes('\\oint \\mathbf{B}\\cdot d\\mathbf{l}')) {
        return 'This circulation law relates current to magnetic winding, which is why loops, solenoids, and toroids become natural test geometries.';
    }
    if (equation.includes('\\frac{d\\Phi_B}{dt}')) {
        return 'This is the induction law: changing magnetic flux generates electric circulation, tying fields and circuits into one dynamical system.';
    }
    if (equation.includes('V_L = L\\frac{dI}{dt}')) {
        return 'This equation shows that inductors resist changes in current in the same structural way that masses resist changes in velocity.';
    }
    if (equation.includes('\\omega = \\frac{1}{\\sqrt{LC}}')) {
        return 'This natural frequency reveals that charge storage and magnetic energy storage form one oscillatory pair.';
    }
    if (equation.includes('\\nabla \\times \\mathbf{B}')) {
        return 'This Maxwell-Ampere law closes classical electrodynamics by showing that both current and changing electric fields source magnetic circulation.';
    }
    if (equation.includes('c = \\frac{1}{\\sqrt{\\mu_0\\varepsilon_0}}')) {
        return 'This equation identifies light as a dynamical consequence of field constants rather than a separate empirical curiosity.';
    }
    if (equation.includes('\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}')) {
        return 'This thin-lens equation summarizes the imaging geometry that links source placement, image location, and focal length.';
    }
    if (equation.includes('d\\sin\\theta = m\\lambda')) {
        return 'This path-difference condition is the compact phase rule behind interference and grating patterns.';
    }
    if (equation.includes('a\\sin\\theta = m\\lambda')) {
        return 'This aperture condition tells you where diffraction minima or angular structure must appear when wavefronts are spatially truncated.';
    }
    if (equation.includes('\\gamma = \\frac{1}{\\sqrt{1-v^2/c^2}}')) {
        return 'This Lorentz factor is the algebraic core of special relativity, governing time dilation, length contraction, and relativistic energy-momentum relations.';
    }
    if (equation.includes('E = hf')) {
        return 'This relation quantizes radiation into discrete packets, forcing wave phenomena and particle bookkeeping into the same theory.';
    }
    if (equation.includes('i\\hbar\\frac{\\partial \\psi}{\\partial t}')) {
        return 'This is the central evolution law of nonrelativistic quantum mechanics, determining how amplitudes change in time.';
    }
    if (equation.includes('\\Delta x\\,\\Delta p')) {
        return 'This inequality marks the boundary between classical joint specification and quantum-limited state preparation.';
    }
    if (equation.includes('E_n = -\\frac{13.6\\,\\text{eV}}{n^2}')) {
        return 'This spectrum formula shows how quantization becomes visible in the discrete bound-state energies of hydrogen.';
    }
    if (equation.includes('N(t) = N_0 e^{-\\lambda t}')) {
        return 'This exponential law is the statistical signature of radioactive decay and underlies both lifetime measurement and dating methods.';
    }
    if (equation.includes('E = \\Delta m c^2')) {
        return 'This mass-energy relation is the accounting bridge that makes nuclear binding, fission, and fusion quantitatively intelligible.';
    }

    return `Read this expression as one compressed claim in the formal spine of ${chapter.title.toLowerCase()}: every symbol should be expanded into a physical meaning before the equation is used computationally.`;
}

function inferRelatedChapters(chapter: ArchiveChapter) {
    const relatedNumbers = new Set<number>();

    ARCHIVE_CROSSLINKS.forEach(([source, target]) => {
        if (source === chapter.number) {
            relatedNumbers.add(target);
        }
        if (target === chapter.number) {
            relatedNumbers.add(source);
        }
    });

    return Array.from(relatedNumbers)
        .map((chapterNumber) => getChapterByNumber(chapterNumber))
        .sort((left, right) => left.number - right.number);
}

function buildSectionArchitectureMarkup(chapter: ArchiveChapter) {
    return chapter.sections
        .map(
            (section) =>
                `<li><strong>${escapeHtml(section)}.</strong> ${escapeHtml(describeSectionRole(section, chapter))}</li>`,
        )
        .join('');
}

function buildEquationCommentaryMarkup(chapter: ArchiveChapter, equations: string[]) {
    if (equations.length === 0) {
        return '<p>This chapter still needs deeper equation extraction from the source text.</p>';
    }

    return equations
        .map(
            (equation) => `
<div class="space-y-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
  ${createKatexBlockMarkup(equation)}
  <p>${escapeHtml(explainEquation(equation, chapter))}</p>
</div>`.trim(),
        )
        .join('');
}

function buildDerivationRoadmap(chapter: ArchiveChapter) {
    const firstSection = chapter.sections[0] || chapter.title;
    const secondSection = chapter.sections[1] || chapter.sections[0] || chapter.title;
    const thirdSection = chapter.sections[2] || chapter.sections[1] || chapter.title;

    return [
        `Begin with ${firstSection.toLowerCase()} so that the state variables and observables are fixed before any law is applied.`,
        `Translate ${secondSection.toLowerCase()} into the governing equation or constitutive rule that closes the chapter's model.`,
        `Use ${thirdSection.toLowerCase()} to show how the formal rule changes predictions, conserved quantities, or measurable patterns.`,
        `Finish by checking which approximations were silently used and which nearby chapter would be needed when those approximations fail.`,
    ];
}

function buildStudyChecks(chapter: ArchiveChapter, relatedChapters: ArchiveChapter[]) {
    return [
        `State the central claim of ${chapter.title.toLowerCase()} without quoting the textbook verbatim.`,
        `Write the representative equations from memory and explain every symbol in words before performing algebra.`,
        `Identify one assumption or idealization in this chapter that would force you into a different node if removed.`,
        relatedChapters[0]
            ? `Explain how ${chapter.title.toLowerCase()} connects to ${relatedChapters[0].title.toLowerCase()} in the graph.`
            : `Explain how ${chapter.title.toLowerCase()} propagates forward into the rest of the sphere.`,
    ];
}

function buildContent(chapter: ArchiveChapter, cluster: ArchiveCluster, field: ArchiveField) {
    const previous = getChapterByNumber(chapter.number - 1);
    const next = getChapterByNumber(chapter.number + 1);
    const grounding = ARCHIVE_FUNDAMENTALS_GROUNDING[chapter.number];
    const representativeEquations = inferRepresentativeEquations(chapter);
    const relatedChapters = inferRelatedChapters(chapter);
    const sectionMarkup = chapter.sections.map((section) => `<li>${escapeHtml(section)}</li>`).join('');
    const equationMarkup = representativeEquations.map((equation) => createKatexBlockMarkup(equation)).join('');
    const equationCommentaryMarkup = buildEquationCommentaryMarkup(chapter, representativeEquations);
    const logicalMarkup = inferLogicalThreads(chapter).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const masteryMarkup = inferMasteryTargets(chapter).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const misconceptionMarkup = inferMisconceptions(chapter).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const formalCoreMarkup = inferFormalCoreParagraphs(chapter, cluster, field)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
    const sectionArchitectureMarkup = buildSectionArchitectureMarkup(chapter);
    const roadmapMarkup = buildDerivationRoadmap(chapter).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const studyCheckMarkup = buildStudyChecks(chapter, relatedChapters).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const relatedChapterMarkup = relatedChapters.length > 0
        ? relatedChapters.map((entry) => `<li>${renderTopicLink(entry)}</li>`).join('')
        : '<li>Cross-domain archive links will expand as more archive sources are imported.</li>';

    const navigationLinks = [
        previous ? renderTopicLink(previous) : null,
        next ? renderTopicLink(next) : null,
    ].filter(Boolean);

    return `
<h1>${chapter.number}. ${escapeHtml(chapter.title)}</h1>
<h2>Overview</h2>
<p>${escapeHtml(buildSummary(chapter, field))}</p>
<h2>Sphere and Cluster</h2>
<p>Sphere: <strong>${escapeHtml(field.name)}</strong><br/>Cluster: <strong>${escapeHtml(cluster.label)}</strong></p>
<h2>Formal Core</h2>
${formalCoreMarkup}
${grounding?.sourceExcerpt ? `<h2>Source-Grounded Entry Point</h2><p>${escapeHtml(grounding.sourceExcerpt)}</p>` : ''}
<h2>Logical Decomposition</h2>
<ol>${logicalMarkup}</ol>
<h2>Representative Equations</h2>
${equationMarkup || '<p>This chapter still needs explicit equation extraction from the full source text.</p>'}
<h2>Equation Commentary</h2>
${equationCommentaryMarkup}
<h2>Chapter Outline</h2>
<ul>${sectionMarkup}</ul>
<h2>Section-by-Section Reconstruction</h2>
<ol>${sectionArchitectureMarkup}</ol>
<h2>Derivation Roadmap</h2>
<ol>${roadmapMarkup}</ol>
<h2>Common Misconceptions</h2>
<ul>${misconceptionMarkup}</ul>
<h2>Mastery Targets</h2>
<ul>${masteryMarkup}</ul>
<h2>Self-Study Checks</h2>
<ul>${studyCheckMarkup}</ul>
<h2>Related Chapter Nodes</h2>
<ul>${relatedChapterMarkup}</ul>
<h2>Suggested Navigation</h2>
<p>${navigationLinks.length > 0 ? navigationLinks.join(', ') : 'Use the archive graph to continue exploring related chapters.'}</p>
<h2>Source Note</h2>
<p>This archive node was reconstructed from <strong>${escapeHtml(BOOK_TITLE)}</strong> by David Halliday, Robert Resnick, and Jearl Walker. It is intended as a structured study guide inside the graph rather than a page-by-page reproduction.${grounding ? ` The current node was re-grounded from PDF page ${grounding.pdfStartPage}.` : ''}</p>
`.trim();
}

function buildTopics(): ArchiveFallbackTopic[] {
    return ARCHIVE_CHAPTERS.map((chapter) => {
        const cluster = getClusterByChapterNumber(chapter.number);
        const field = getFieldById(cluster.fieldId);

        return {
            id: chapterId(chapter.number),
            field_id: field.id,
            year: String(chapter.number).padStart(2, '0'),
            title: chapter.title,
            slug: chapterSlug(chapter),
            summary: buildSummary(chapter, field),
            tags: [BOOK_SOURCE_ID, field.id, cluster.key, `chapter-${chapter.number}`],
            content: buildContent(chapter, cluster, field),
        };
    });
}

const ARCHIVE_FUNDAMENTALS_TOPICS = buildTopics();

export function getArchiveFundamentalsTopics() {
    return ARCHIVE_FUNDAMENTALS_TOPICS.map((topic) => ({ ...topic }));
}

export function getArchiveFundamentalsTopicById(id: string) {
    const topic = ARCHIVE_FUNDAMENTALS_TOPICS.find((entry) => entry.id === id);
    return topic ? { ...topic } : null;
}

export function getArchiveFundamentalsTopicBySlug(slug: string) {
    const normalized = slug.trim().toLowerCase();
    const topic = ARCHIVE_FUNDAMENTALS_TOPICS.find((entry) => entry.slug === normalized);
    return topic ? { ...topic } : null;
}

export function getArchiveFundamentalsTopicsByField(fieldId: string) {
    return ARCHIVE_FUNDAMENTALS_TOPICS
        .filter((topic) => topic.field_id === fieldId)
        .map((topic) => ({ ...topic }));
}

export function buildArchiveFundamentalsGraphModel(): GraphModel {
    const nodes: GraphNode[] = [
        {
            id: 'root',
            type: 'root',
            label: 'PHYSICS',
            data: {
                sourceDocumentId: BOOK_SOURCE_ID,
            },
        },
    ];
    const edges: GraphEdge[] = [];

    ARCHIVE_FIELDS.forEach((field, index) => {
        nodes.push({
            id: field.id,
            type: 'field',
            label: field.label,
            description: field.description,
            data: {
                fieldId: field.id,
                sourceDocumentId: BOOK_SOURCE_ID,
                sphere: {
                    radius: field.id === 'classical' ? 8 : 6,
                    position: {
                        x: Number((Math.cos((index / ARCHIVE_FIELDS.length) * Math.PI * 2) * 24).toFixed(2)),
                        y: Number((Math.sin((index / ARCHIVE_FIELDS.length) * Math.PI * 2) * 24).toFixed(2)),
                        z: Number((-8 - (index % 3) * 5).toFixed(2)),
                    },
                    flatWidth: 54,
                    flatHeight: 28,
                    sortOrder: index + 1,
                    bindingKey: field.id,
                },
            },
        });
        edges.push({
            source: 'root',
            target: field.id,
            type: 'hierarchy',
            label: 'hierarchy',
        });
    });

    ARCHIVE_CLUSTERS.forEach((cluster) => {
        nodes.push({
            id: clusterId(cluster),
            type: 'cluster',
            label: cluster.label,
            data: {
                fieldId: cluster.fieldId,
                clusterKey: cluster.key,
                sourceDocumentId: BOOK_SOURCE_ID,
            },
        });
        edges.push({
            source: cluster.fieldId,
            target: clusterId(cluster),
            type: 'hierarchy',
            label: 'hierarchy',
        });
    });

    ARCHIVE_FUNDAMENTALS_TOPICS.forEach((topic) => {
        const chapterNumber = Number(topic.year);
        const cluster = getClusterByChapterNumber(chapterNumber);
        nodes.push({
            id: topic.id,
            type: 'topic',
            label: topic.title,
            slug: topic.slug,
            description: `Chapter ${chapterNumber}`,
            data: {
                fieldId: topic.field_id,
                year: chapterNumber,
                slug: topic.slug,
                sourceDocumentId: BOOK_SOURCE_ID,
                clusterId: clusterId(cluster),
                summary: topic.summary,
            },
        });
        edges.push({
            source: clusterId(cluster),
            target: topic.id,
            type: 'hierarchy',
            label: 'hierarchy',
        });
    });

    ARCHIVE_CROSSLINKS.forEach(([sourceNumber, targetNumber]) => {
        edges.push({
            source: chapterId(sourceNumber),
            target: chapterId(targetNumber),
            type: 'mentions',
            label: 'mentions',
        });
    });

    return { nodes, edges };
}
