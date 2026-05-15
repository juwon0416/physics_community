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
    content?: string;
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
    },
    {
        id: 'mathematical-physics',
        slug: 'mathematical-physics',
        name: 'Mathematical Physics',
        description: 'The application of mathematics to problems in physics and the development of mathematical methods for such applications.',
        icon: 'sigma', // distinct icon
        color: 'from-indigo-500 to-violet-400', // distinct color
        image: '/images/math-physics.png' // placeholder
    },
    {
        id: 'semiconductor-physics',
        slug: 'semiconductor-physics',
        name: 'Semiconductor Physics',
        description: 'The physics of semiconductor materials, device electrostatics, carrier transport, and integrated electronic devices.',
        icon: 'cpu',
        color: 'from-neutral-700 to-neutral-400',
        image: '/images/semiconductor-physics.png'
    }
];

export const TIMELINE_TOPICS: TimelineEntry[] = [    // Classical Mechanics
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
        tags: ['Waves', 'Matter'],
        content: `
<h1>Wave-Particle Duality</h1>
<h2>Abstract</h2>
<p>파동-입자 이중성은 미시적 대상이 고전역학에서 기대되는 단일한 존재론적 범주, 즉 입자 또는 파동 가운데 하나로만 환원되지 않는다는 사실을 드러내는 양자역학의 핵심 원리이다. 빛은 광전효과와 같은 현상에서 입자적 성격을, 간섭과 회절에서는 파동적 성격을 보인다. 전자와 같은 물질 입자 역시 드브로이 관계를 통해 파동성과 연결되며, 실제 전자 회절 실험은 이 예측을 정량적으로 지지한다. 현대적 이해에 따르면 파동-입자 이중성은 동일한 대상이 시간에 따라 파동과 입자로 바뀐다는 뜻이 아니라, 측정 맥락과 관측 가능한 물리량의 구조에 따라 하나의 양자상태가 서로 다른 실험적 양상으로 기술된다는 뜻에 가깝다. 본 문서는 파동-입자 이중성의 역사적 형성, 수학적 구조, 대표 실험, 해석적 함의를 체계적으로 정리한다.</p>
<h2>1. Introduction</h2>
<p>고전물리학에서 파동과 입자는 뚜렷이 구분되는 개념이었다. 입자는 국소화된 위치와 운동량을 가지며 충돌을 통해 상호작용하는 객체로 이해되었다. 반면 파동은 공간적으로 퍼져 있고, 중첩과 간섭, 회절을 통해 자신의 존재를 드러내는 연속적 교란으로 간주되었다. 그러나 20세기 초 복사 현상과 원자 현상을 설명하려는 시도는 이 이분법을 근본적으로 흔들었다.</p>
<p>파동-입자 이중성은 양자이론이 고전적 직관을 어떻게 수정했는지를 보여주는 대표 사례다. 이는 자연의 실재가 고전적 범주를 선험적으로 따르지 않으며, 물리적 대상에 대한 서술은 실험 배치와 측정 연산의 구조 속에서 재정의되어야 함을 시사한다.</p>
<h2>2. Historical Development</h2>
<p>빛의 파동성은 영의 이중슬릿 실험과 프레넬의 회절 이론, 그리고 맥스웰의 전자기파 이론을 통해 19세기에 강하게 확립되었다. 하지만 흑체복사 문제는 고전적 연속 에너지 분포가 자외선 파탄을 초래함을 드러냈고, 플랑크는 에너지 교환이 E = hν의 양자 단위로 이루어진다고 가정하였다.</p>
<p>이후 아인슈타인은 광전효과를 설명하기 위해 빛이 에너지 hν를 갖는 국소적 양자, 즉 광자로 흡수된다고 주장했다. 콤프턴 산란은 광자의 운동량 개념을 강화했고, 드브로이는 역으로 전자와 같은 물질 입자에도 λ = h/p의 파장을 부여하였다. 데이비슨-거머 실험은 이 가설을 직접 지지했다.</p>
<h2>3. Mathematical Structure</h2>
<p>비상대론적 양자역학에서 계의 상태는 힐베르트 공간의 벡터이며, 위치 표현에서는 파동함수 ψ(x, t)로 기술된다. 보른 규칙에 따르면 |ψ(x, t)|²는 위치 x에서 입자를 검출할 확률밀도를 준다. 따라서 상태의 진화는 파동적으로 표현되지만, 실제 측정은 개별적이고 국소적인 검출 사건으로 나타난다.</p>
<p>운동량 공간과 위치 공간은 푸리에 변환으로 연결된다. 어떤 상태가 위치에 강하게 국소화될수록 운동량 분포는 넓어지고, 반대로 거의 단일 운동량을 가지는 상태는 공간적으로 넓게 퍼진다. 이 구조는 불확정성 관계 ΔxΔp ≥ ħ/2 와 직접 연결된다.</p>
<h2>4. Double-Slit Experiment</h2>
<p>이중슬릿 실험은 파동-입자 이중성을 가장 선명하게 보여주는 장치다. 빛이나 전자를 두 개의 슬릿에 통과시키면 스크린 위에는 간섭무늬가 형성된다. 이는 각 슬릿을 통과하는 확률 진폭이 중첩되어 위상 차이에 따라 보강 간섭과 상쇄 간섭을 만들기 때문이다.</p>
<p>흥미로운 점은 입자를 하나씩 매우 드물게 쏘아도 장시간이 지나면 동일한 간섭 패턴이 누적된다는 사실이다. 각 검출 사건은 입자적이지만, 전체 분포는 파동적 확률 진폭의 구조를 따른다. 반대로 어느 슬릿을 통과했는지 경로 정보를 얻도록 장치를 배치하면 간섭무늬는 사라지거나 약화된다.</p>
<h2>5. Complementarity and Interpretation</h2>
<p>보어의 상보성 원리는 어떤 양자계가 특정 실험에서는 파동처럼, 다른 실험에서는 입자처럼 기술될 수 있으며, 이 두 기술은 동시에 완전하게 실현될 수 없지만 함께 계의 전체 물리적 내용을 구성한다고 말한다. 하이젠베르크의 불확정성 원리는 이러한 구조를 수학적으로 지지한다.</p>
<p>현대 해석들, 예를 들어 코펜하겐 해석, 다세계 해석, 관계적 해석은 측정과 상태 붕괴를 서로 다르게 설명하지만, 실험 예측 자체는 동일한 양자형식을 통해 산출된다. 따라서 파동-입자 이중성은 특정 해석에만 의존하는 명제가 아니라 양자형식의 구조적 결과다.</p>
<h2>6. Matter Waves and Modern Perspective</h2>
<p>드브로이의 λ = h/p 관계는 파동-입자 이중성을 빛에 국한하지 않고 물질 일반으로 확장했다. 전자, 중성자, 원자, 심지어 거대 분자 간섭 실험까지 이 관계를 지지하면서, 파동성은 양자상태를 갖는 모든 물질계의 일반 성질임이 드러났다.</p>
<p>상대론적 양자장론에서는 기본 객체가 장이며, 입자는 장의 양자화된 들뜸 상태로 이해된다. 이 관점에서 파동과 입자의 대립은 하나의 장이 서로 다른 실험 조건에서 어떤 현상학을 허용하는지를 묻는 문제로 재구성된다.</p>
<h2>7. Conclusion</h2>
<p>파동-입자 이중성은 양자현상의 역설적 표지이자, 고전적 범주를 넘어서는 이론적 전환의 상징이다. 빛과 물질은 간섭과 회절을 통해 파동적 구조를 드러내면서도, 검출에서는 불연속적이고 국소적인 사건으로 기록된다. 이러한 이중성은 단순한 모순이 아니라, 하나의 양자상태가 서로 다른 실험적 질문에 대해 서로 다른 방식으로 응답한다는 사실의 표현이다.</p>
<h2>References for Further Study</h2>
<p>Dirac, P. A. M., <em>The Principles of Quantum Mechanics</em>.</p>
<p>Feynman, R. P., Leighton, R. B., and Sands, M., <em>The Feynman Lectures on Physics, Vol. III</em>.</p>
<p>Sakurai, J. J. and Napolitano, J., <em>Modern Quantum Mechanics</em>.</p>
`
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
    },
    {
        id: 'e7',
        fieldId: 'electrodynamics',
        year: '1865',
        title: 'Perfect Conductor',
        slug: 'perfect-conductor',
        summary: 'The ideal limit in which free charges rearrange so that the interior electric field vanishes.',
        tags: ['Boundary Conditions', 'Surface Charge', 'Surface Current']
    },

    // Semiconductor Physics
    {
        id: 'field-effect-transistor-mos-capacitor',
        fieldId: 'semiconductor-physics',
        year: '7.1',
        title: 'Field Effect Transistor - MOS capacitor',
        slug: 'field-effect-transistor-mos-capacitor',
        summary: 'The MOS capacitor explains flat-band behavior, accumulation, depletion, inversion, and threshold formation in a field-effect device.',
        tags: ['MOS Capacitor', 'Field Effect Transistor', 'Flat-band', 'Threshold Voltage', 'Inversion']
    },
    {
        id: 'mosfet-gate-electrostatics',
        fieldId: 'semiconductor-physics',
        year: '7.2',
        title: 'Field Effect Transistor - MOSFET',
        slug: 'mosfet-gate-electrostatics',
        summary: 'Gate voltage controls surface potential, carrier regime, channel formation, and drain current in a MOSFET.',
        tags: ['MOSFET', 'Gate Electrostatics', 'Field Effect', 'Semiconductor Device', 'Threshold Voltage', 'Inversion']
    },

    // Mathematical Physics
    {
        id: 'm1',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Fourier Analysis',
        slug: 'fourier-analysis',
        summary: 'The study of the way general functions may be represented or approximated by sums of simpler trigonometric functions.',
        tags: ['Analysis', 'Signals']
    },
    {
        id: 'm2',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Green\'s Functions',
        slug: 'greens-functions',
        summary: 'Impulse response functions used to solve differential equations subject to boundary conditions.',
        tags: ['Calculus', 'Differential Equations']
    },
    {
        id: 'm3',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Riemannian Geometry',
        slug: 'riemannian-geometry',
        summary: 'The branch of differential geometry that studies Riemannian manifolds, essential for General Relativity.',
        tags: ['Geometry', 'Relativity']
    },
    {
        id: 'm4',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Lie Groups',
        slug: 'lie-groups',
        summary: 'Groups that are also smooth manifolds, representing continuous symmetries in physics.',
        tags: ['Algebra', 'Symmetry']
    },
    {
        id: 'm5',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Noether\'s Theorem',
        slug: 'noethers-theorem',
        summary: 'Propounds that every differentiable symmetry of the action of a physical system has a corresponding conservation law.',
        tags: ['Symmetry', 'Conservation']
    },
    {
        id: 'm6',
        fieldId: 'mathematical-physics',
        year: '',
        title: 'Functional Analysis',
        slug: 'functional-analysis',
        summary: 'The study of vector spaces endowed with some kind of limit-related structure, crucial for Quantum Mechanics.',
        tags: ['Math', 'Quantum']
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
    // Field Effect Transistor - MOS capacitor
    {
        id: 'k21',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Introduction and Device Idea',
        content: 'A field effect transistor uses an electric field to control charge in a semiconductor. The MOS structure achieves this by separating the gate from the semiconductor with an oxide, so the gate acts electrostatically rather than by direct current injection.'
    },
    {
        id: 'k22',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Ideal MOS Capacitor',
        content: 'In the ideal MOS capacitor the oxide has no charge, transport through the oxide is blocked, and the electrostatic potential varies linearly across the insulator. If the metal and semiconductor work functions match, the bands are flat at zero applied bias.'
    },
    {
        id: 'k23',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Applied Bias Regimes',
        content: 'For a p-type semiconductor, negative gate bias produces accumulation, small positive bias produces depletion, and large positive bias produces inversion. Those regimes are the main electrostatic states of the MOS capacitor.'
    },
    {
        id: 'k24',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Surface Potential and Depletion Width',
        content: 'The surface potential measures the band bending under the gate. As the surface potential increases, the depletion width grows according to the depletion approximation and the interface charge profile changes.'
    },
    {
        id: 'k25',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Threshold Voltage and Strong Inversion',
        content: 'Threshold occurs when the surface potential reaches approximately twice the Fermi potential. Beyond threshold the depletion width is nearly saturated and additional gate voltage mostly increases inversion charge.'
    },
    {
        id: 'k26',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Non-Ideal MOS and Flat-Band Voltage',
        content: 'Oxide charge and interface charge shift the flat-band condition away from the ideal case. The flat-band voltage and threshold voltage both move when the oxide is no longer perfectly clean.'
    },
    {
        id: 'k27',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Gate Voltage Characteristics',
        content: 'The gate-voltage curve is the device story in one plot: flat band, accumulation, depletion, and inversion appear in sequence as the gate bias is swept.'
    },
    {
        id: 'k28',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Capacitance-Voltage View',
        content: 'The C-V curve reflects the same electrostatics from a measurement perspective. As the surface moves between accumulation, depletion, and inversion, the measured capacitance changes because the depletion layer width changes.'
    },
    {
        id: 'k29',
        topicId: 'field-effect-transistor-mos-capacitor',
        title: 'Cross Links',
        content: "This lecture connects naturally to Coulomb's Law, Perfect Conductor, and Faraday's Induction because the MOS capacitor is an electrostatic boundary-value problem with screening and interface conditions."
    },

    // MOSFET Gate Electrostatics
    {
        id: 'k11',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Overview and Device Topology',
        content: 'A MOSFET is a field effect transistor in which the gate controls the semiconductor channel through the electric field across the oxide. The ontology starts with the chain gate voltage -> surface potential -> carrier density -> channel conduction.'
    },
    {
        id: 'k12',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Gate Voltage Effect',
        content: 'The gate-voltage argument follows MOS capacitor electrostatics. Flat-band, accumulation, depletion, and inversion are the main regimes, and the surface potential determines which regime is realized.'
    },
    {
        id: 'k13',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Drain Voltage Effect',
        content: 'Once an inversion channel exists, the drain voltage modifies the channel profile along source to drain. The local channel charge decreases near the drain as the potential rises, which leads toward pinch-off and saturation.'
    },
    {
        id: 'k14',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Drain Current',
        content: 'Drain current is the main output variable of the device. In the linear region the MOSFET behaves like a gate-controlled resistor, while in saturation the current is primarily set by gate overdrive and channel charge.'
    },
    {
        id: 'k15',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Types of MOSFET',
        content: 'NMOS and PMOS are distinguished by the carrier type in the inversion channel. Enhancement-mode devices require gate bias to create the channel, while depletion-mode devices are pre-biased to conduct more easily.'
    },
    {
        id: 'k16',
        topicId: 'mosfet-gate-electrostatics',
        title: 'Applications of MOSFET',
        content: 'MOSFETs are used as switches, amplifiers, and the basic building blocks of digital integrated circuits. Their argument role is that gate control gives a compact way to route and modulate current with very little input power.'
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
