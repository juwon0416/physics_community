export interface Field {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    color: string;
    image?: string;
}

export interface TimelineEntry {
    id: string;
    fieldId: string;
    year: string;
    title: string;
    slug: string;
    summary: string;
    tags: string[];
}

export interface KeywordSection {
    id: string;
    topicId: string;
    title: string;
    content: string; // Markdown supported
}

export const FIELDS: Field[] = [
    {
        id: 'classical',
        slug: 'classical-mechanics',
        name: 'Classical Mechanics',
        description: 'The study of the motion of bodies under the action of forces.',
        icon: 'activity',
        color: 'from-blue-500 to-cyan-400',
        image: '/images/newton.png'
    },
    {
        id: 'quantum',
        slug: 'quantum-mechanics',
        name: 'Quantum Mechanics',
        description: 'A fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.',
        icon: 'atom',
        color: 'from-purple-500 to-pink-400',
        image: '/images/schrodinger.png'
    },
    {
        id: 'statistical',
        slug: 'statistical-mechanics',
        name: 'Statistical Mechanics',
        description: 'A branch of physics that applies probability theory to study the average behavior of a mechanical system.',
        icon: 'bar-chart-3',
        color: 'from-green-500 to-emerald-400',
        image: '/images/boltzmann.png'
    },
    {
        id: 'electrodynamics',
        slug: 'electrodynamics',
        name: 'Electrodynamics',
        description: 'The branch of physics which deals with rapidly changing electric and magnetic fields.',
        icon: 'zap',
        color: 'from-yellow-500 to-orange-400',
        image: '/images/maxwell.png'
    }
];

export const TIMELINE_TOPICS: TimelineEntry[] = [
    // Classical Mechanics
    {
        id: 'c1',
        fieldId: 'classical',
        year: '1687',
        title: 'Newton\'s Laws of Motion',
        slug: 'newtons-laws',
        summary: 'The foundation of classical mechanics describing the relationship between a body and the forces acting upon it.',
        tags: ['Forces', 'Motion', 'Gravity']
    },
    // ... (rest of classical) ...
    // Note: To save token space I am not repeating all existing entries in the prompt but I must perform the REPLACE carefully.
    // The previous content ended at "Fluctuation Theorem".
    // I will append Electrodynamics topics at the END of TIMELINE_TOPICS.
    // Wait, the REPLACE block must match existing content.
    // I will target the END of FIELDS array and the END of TIMELINE_TOPICS array.
    // I'll do two separate replacements or one large one? The file is small enough.
    // Actually I can just add Electrodynamics to FIELDS first.
    // Then append topics to TIMELINE_TOPICS.

    // Classical Mechanics
    {
        id: 'c1',
        fieldId: 'classical',
        year: '1687',
        title: 'Newton\'s Laws of Motion',
        slug: 'newtons-laws',
        summary: 'The foundation of classical mechanics describing the relationship between a body and the forces acting upon it.',
        tags: ['Forces', 'Motion', 'Gravity']
    },
    {
        id: 'c2',
        fieldId: 'classical',
        year: '1788',
        title: 'Lagrangian Mechanics',
        slug: 'lagrangian-mechanics',
        summary: 'A reformulation of classical mechanics that combines conservation of momentum and energy.',
        tags: ['Energy', 'Calculus', 'Optimization']
    },
    {
        id: 'c3',
        fieldId: 'classical',
        year: '1833',
        title: 'Hamiltonian Mechanics',
        slug: 'hamiltonian-mechanics',
        summary: 'A theory that evolved from Lagrangian mechanics, providing a powerful framework for quantum mechanics.',
        tags: ['Phase Space', 'Energy', 'Dynamics']
    },
    { // Padding topics to meet requirement
        id: 'c4',
        fieldId: 'classical',
        year: '1609',
        title: 'Kepler\'s Laws',
        slug: 'keplers-laws',
        summary: 'Three scientific laws describing the motion of planets around the Sun.',
        tags: ['Astronomy', 'Orbits']
    },
    {
        id: 'c5',
        fieldId: 'classical',
        year: '1638',
        title: 'Galilean Relativity',
        slug: 'galilean-relativity',
        summary: 'The principle that the laws of motion are the same in all inertial frames.',
        tags: ['Relativity', 'Motion']
    },
    {
        id: 'c6',
        fieldId: 'classical',
        year: '1905',
        title: 'Special Relativity',
        slug: 'special-relativity',
        summary: 'Einstein\'s theory reconciling mechanics with electromagnetism.',
        tags: ['Einstein', 'Speed of Light']
    },

    // Quantum Mechanics
    {
        id: 'q1',
        fieldId: 'quantum',
        year: '1900',
        title: 'Planck\'s Quantization',
        slug: 'planck-quantization',
        summary: 'The discovery that energy is exchanged in discrete packets called quanta.',
        tags: ['Energy', 'Quanta']
    },
    {
        id: 'q2',
        fieldId: 'quantum',
        year: '1924',
        title: 'Wave-Particle Duality',
        slug: 'wave-particle-duality',
        summary: 'The concept that every particle or quantum entity may be described as either a particle or a wave.',
        tags: ['Waves', 'Matter']
    },
    {
        id: 'q3',
        fieldId: 'quantum',
        year: '1926',
        title: 'Schrödinger Equation',
        slug: 'schrodinger-equation',
        summary: 'A linear partial differential equation that governs the wave function of a quantum-mechanical system.',
        tags: ['Wave Function', 'Probability']
    },
    {
        id: 'q4',
        fieldId: 'quantum',
        year: '1927',
        title: 'Heisenberg Uncertainty',
        slug: 'heisenberg-uncertainty',
        summary: 'A fundamental limit to the precision with which certain pairs of physical properties can be known.',
        tags: ['Uncertainty', 'Measurement']
    },
    {
        id: 'q5',
        fieldId: 'quantum',
        year: '1964',
        title: 'Bell\'s Theorem',
        slug: 'bells-theorem',
        summary: 'A theorem that demonstrates that quantum mechanics is incompatible with local hidden-variable theories.',
        tags: ['Entanglement', 'Non-locality']
    },
    {
        id: 'q6',
        fieldId: 'quantum',
        year: '1981',
        title: 'Quantum Computing Ideas',
        slug: 'quantum-computing',
        summary: 'Feynman proposes using quantum systems to simulate physics.',
        tags: ['Computing', 'Simulation']
    },

    // Statistical Mechanics
    {
        id: 's1',
        fieldId: 'statistical',
        year: '1860',
        title: 'Maxwell-Boltzmann Dist.',
        slug: 'maxwell-boltzmann',
        summary: 'Describes particle speeds in idealized gases.',
        tags: ['Gas', 'Probability']
    },
    {
        id: 's2',
        fieldId: 'statistical',
        year: '1872',
        title: 'Boltzmann Entropy',
        slug: 'boltzmann-entropy',
        summary: 'The statistical definition of entropy and the H-theorem.',
        tags: ['Entropy', 'Thermodynamics']
    },
    {
        id: 's3',
        fieldId: 'statistical',
        year: '1876',
        title: 'Gibbs Phase Rule',
        slug: 'gibbs-phase-rule',
        summary: 'A criterion for the number of phases that can coexist in equilibrium.',
        tags: ['Phases', 'Equilibrium']
    },
    {
        id: 's4',
        fieldId: 'statistical',
        year: '1905',
        title: 'Brownian Motion',
        slug: 'brownian-motion',
        summary: 'The random motion of particles suspended in a medium.',
        tags: ['Random Walk', 'Fluctuations']
    },
    {
        id: 's5',
        fieldId: 'statistical',
        year: '1920',
        title: 'Ising Model',
        slug: 'ising-model',
        summary: 'A mathematical model of ferromagnetism in statistical mechanics.',
        tags: ['Magnetism', 'Phase Transitions']
    },
    {
        id: 's6',
        fieldId: 'statistical',
        year: '1940',
        title: 'Fluctuation Theorem',
        slug: 'fluctuation-theorem',
        summary: 'Relates validity of the Second Law of Thermodynamics to the size of the system.',
        tags: ['Non-equilibrium', 'Entropy']
    },

    // Electrodynamics
    {
        id: 'e1',
        fieldId: 'electrodynamics',
        year: '1785',
        title: 'Coulomb\'s Law',
        slug: 'coulombs-law',
        summary: 'The law describing the electrostatic force of interaction between electrically charged particles.',
        tags: ['Charge', 'Force']
    },
    {
        id: 'e2',
        fieldId: 'electrodynamics',
        year: '1820',
        title: 'Ampère\'s Force Law',
        slug: 'amperes-law',
        summary: 'Describes the magnetic force between two current-carrying wires.',
        tags: ['Magnetism', 'Current']
    },
    {
        id: 'e3',
        fieldId: 'electrodynamics',
        year: '1831',
        title: 'Faraday\'s Induction',
        slug: 'faradays-law',
        summary: 'The principle that a changing magnetic field creates an electric field.',
        tags: ['Induction', 'Fields']
    },
    {
        id: 'e4',
        fieldId: 'electrodynamics',
        year: '1861',
        title: 'Maxwell\'s Equations',
        slug: 'maxwells-equations',
        summary: 'A set of coupled partial differential equations that form the foundation of classical electromagnetism.',
        tags: ['Unified Theory', 'Light']
    },
    {
        id: 'e5',
        fieldId: 'electrodynamics',
        year: '1895',
        title: 'Lorentz Force',
        slug: 'lorentz-force',
        summary: 'The force exerted on a charged particle moving through electric and magnetic fields.',
        tags: ['Particle', 'Motion']
    },
    {
        id: 'e6',
        fieldId: 'electrodynamics',
        year: '1948',
        title: 'Quantum Electrodynamics',
        slug: 'qed',
        summary: 'The relativistic quantum field theory of electrodynamics (Feynman, Schwinger, Tomonaga).',
        tags: ['Quantum', 'Field Theory']
    }
];

export const KEYWORD_SECTIONS: KeywordSection[] = [
    // Newton's Laws
    {
        id: 'k1',
        topicId: 'c1',
        title: 'First Law (Inertia)',
        content: 'An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.'
    },
    {
        id: 'k2',
        topicId: 'c1',
        title: 'Second Law (F=ma)',
        content: 'The acceleration of an object as produced by a net force is directly proportional to the magnitude of the net force, in the same direction as the net force, and inversely proportional to the mass of the object.'
    },
    {
        id: 'k3',
        topicId: 'c1',
        title: 'Third Law (Action-Reaction)',
        content: 'For every action, there is an equal and opposite reaction. This means that in every interaction, there is a pair of forces acting on the two interacting objects.'
    },
    {
        id: 'k4',
        topicId: 'c1',
        title: 'Historical Context',
        content: 'Published in *Philosophiæ Naturalis Principia Mathematica* in 1687, these laws laid the groundwork for classical mechanics.'
    },
    {
        id: 'k5',
        topicId: 'c1',
        title: 'Applications',
        content: 'These laws explain everything from the motion of planets to the safety features in cars like crumple zones and seat belts.'
    },

    // Schrodinger Equation
    {
        id: 'k6',
        topicId: 'q3',
        title: 'The Wave Function',
        content: 'The state of a quantum system is described by a wave function $\\Psi$, which contains all the information about the system.'
    },
    {
        id: 'k7',
        topicId: 'q3',
        title: 'Time-Dependent Equation',
        content: 'The core equation describes how the quantum state changes over time: $i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi$.'
    },
    {
        id: 'k8',
        topicId: 'q3',
        title: 'The Hamiltonian',
        content: '$\\hat{H}$ represents the total energy operator of the system, acting on the wave function to determine its evolution.'
    },
    {
        id: 'k9',
        topicId: 'q3',
        title: 'Interpretation',
        content: 'Max Born interpreted $|\\Psi|^2$ as the probability density function for finding the particle at a given position.'
    },
    {
        id: 'k10',
        topicId: 'q3',
        title: 'Schrödinger\'s Cat',
        content: 'A famous thought experiment illustrating the paradox of superposition, where a cat in a box is simultaneously alive and dead until observed.'
    },
];

// Fallback for other topics to have some content
TIMELINE_TOPICS.forEach(topic => {
    if (!KEYWORD_SECTIONS.some(k => k.topicId === topic.id)) {
        for (let i = 1; i <= 5; i++) {
            KEYWORD_SECTIONS.push({
                id: `gen-${topic.id}-${i}`,
                topicId: topic.id,
                title: `Key Aspect ${i}`,
                content: `Content placeholder for **${topic.title}**. This section would explain critical concept ${i} related to the topic. It supports *markdown* and math concepts.`
            })
        }
    }
});
