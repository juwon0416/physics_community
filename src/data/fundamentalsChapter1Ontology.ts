import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_1_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 1: Measurement; OpenStax University Physics Volume 1, 1.2 Units and Standards; NIST SP 330 / BIPM SI Brochure, 9th edition; MIT OpenCourseWare 8.01SC Chapter 2, Units, Dimensional Analysis, Problem Solving, and Estimation.';

const FUNDAMENTALS_CHAPTER_1_CONTENT = String.raw`# Fundamentals Chapter 1: Measurement

## Abstract

The conclusion of this node is that measurement is not a preliminary bookkeeping step before "real physics"; it is the operation that turns a qualitative claim about the world into a public, testable, and transferable mathematical statement. A physical quantity is meaningful only when a property, a numerical value, a unit, a standard, and a justified precision travel together.

The practical result is that every later node in mechanics inherits a measurement contract. [[ch2-position-displacement-average-velocity|Position]] is a length-valued function of time; [[ch2-instantaneous-velocity-speed|velocity]] is length per time; [[ch2-acceleration|acceleration]] is length per time squared; force later becomes mass times acceleration. The measurement chapter does not need to re-derive those later concepts. It fixes the unit, standard, dimensional, and precision rules that let those concepts become physical claims instead of bare algebra.

## Source Basis

Source basis: ${FUNDAMENTALS_CHAPTER_1_SOURCE}

Halliday supplies the local chapter sequence. OpenStax supplies a complementary open textbook framing of units, standards, and derived quantities. NIST and the BIPM SI Brochure supply the official standards perspective. MIT OCW supplies the bridge from units and dimensional analysis to problem solving. This file synthesizes those sources into one graph-native essay rather than treating any one source as the sole authority.

## Keywords

- Measurement
- Physical quantity
- Unit standard
- SI base unit
- Length
- Time
- Mass
- Dimensional analysis
- Chain-link conversion
- Significant figures
- Scientific notation
- Measurement precision

## 1. Measurement as the Entry Point to Physics

Physics begins when a claim can be checked against the world. "The body moved," "the clock ran briefly," or "the sample is heavy" can guide intuition, but they cannot yet be compared by distant observers, used in equations, or tested against predictions. The statement becomes physics when it is recast as a measured quantity.

The structure is compact:

- a property of a system is identified;
- a unit is chosen for comparing that property;
- a standard defines the unit reproducibly;
- a numerical value is assigned by measurement;
- uncertainty and significant figures state how much trust the value deserves.

This is why measurement belongs at the root of the ontology. It is the interface between physical reality and mathematical structure. Later topics can be abstract and elegant because their variables already carry units, standards, and justified precision.

## 2. Quantity Equals Property, Number, Unit, and Precision

A physical quantity is not a bare number. It is a quantified property. The expression \(3.0\) has no physical content by itself, while \(3.0\ \mathrm{m}\), \(3.0\ \mathrm{s}\), and \(3.0\ \mathrm{kg}\) make different claims about different properties.

Symbolically:

$$
Q = n[u]
$$

Here \(Q\) is the quantity, \(n\) is the numerical value, and \([u]\) is the unit. The unit is not decoration attached after calculation. It is part of the meaning of the claim. The numerical value changes when the unit changes, but the quantity should remain the same.

A reported value also carries precision. The difference between \(2.3\ \mathrm{m}\) and \(2.300\ \mathrm{m}\) is not typographic. The second statement claims a more precise measurement process. Physics therefore asks not only "what number did the calculator return?" but also "what measurement justified that many digits?"

## 3. Standards Make Measurements Public

A unit works only if different observers can reproduce it. Modern SI standards are designed to be stable, coherent, and tied to reproducible definitions rather than local artifacts. NIST and the BIPM frame SI as an international measurement language: a way for laboratories, classrooms, industries, and scientific communities to compare claims without renegotiating the meaning of meter, second, kilogram, and derived units each time.

This public character matters philosophically and practically. A private ruler, a private clock, or a private mass reference cannot sustain physics at scale. Standards turn measurement into a shared infrastructure. They allow a value measured here and now to be compared with a value measured elsewhere and later.

For introductory mechanics, the most immediate base quantities are length, time, and mass. They are not arbitrary examples. They are the ingredients from which displacement, speed, velocity, acceleration, momentum, force, work, and energy will be built.

## 4. SI Coherence and Derived Quantities

The SI is powerful because it is coherent. Base units and derived units are not isolated labels. They form a connected system in which dimensions constrain how quantities can combine.

Examples:

- area has dimension \(L^2\);
- volume has dimension \(L^3\);
- velocity has dimension \(L T^{-1}\);
- acceleration has dimension \(L T^{-2}\);
- force later has dimension \(M L T^{-2}\).

The word "derived" does not mean secondary in importance. It means structurally built. [[ch2-instantaneous-velocity-speed|Velocity]] is not a new primitive kind of measurement; it is position change per time. [[ch2-acceleration|Acceleration]] is velocity change per time. This chapter stays focused on the unit structure that all rates inherit instead of expanding every later rate concept inside the measurement argument.

## 5. Dimensions Are the Grammar of Equations

Dimensional analysis is the grammar checker of physics. It cannot prove that an equation is true, but it can often prove that a proposed equation is impossible.

For a quantity \(Q\):

$$
[Q] = L^aT^bM^c
$$

The exponents record how the quantity is built from length, time, and mass. If a proposed displacement formula contains \(at\), then:

$$
[at] = (LT^{-2})(T) = LT^{-1}
$$

The right side has the dimension of velocity, not displacement. The proposal is wrong before numerical substitution begins. A displacement caused by constant acceleration must contain \(t^2\), though dimensional analysis alone cannot supply the coefficient \(\frac{1}{2}\).

This is the compact reason Chapter 2 can introduce \(x(t)\), \(v(t)\), and \(a(t)\) without repeatedly rebuilding the unit system. The reader who needs the kinematic meaning can open [[fundamentals-ch2-motion-along-straight-line|motion along a straight line]], but the measurement argument itself stays local: dimensions decide which algebraic combinations can even be physical.

## 6. Conversion as Invariance

Unit conversion should be understood as invariance, not as a trick for moving decimal points. A conversion factor is a ratio equal to one. Multiplying by it changes representation while preserving the physical quantity.

For example:

$$
72 \frac{\mathrm{km}}{\mathrm{h}}
\times \frac{1000 \mathrm{m}}{1 \mathrm{km}}
\times \frac{1 \mathrm{h}}{3600 \mathrm{s}}
= 20 \frac{\mathrm{m}}{\mathrm{s}}
$$

The kilometer and hour units cancel because the conversion factors have been oriented correctly. The result is not a new speed; it is the same speed written in a different unit language.

This habit scales. In later mechanics, errors in unit conversion often become errors in acceleration, force, work, or energy. Chain-link conversion is therefore a small algebraic ritual that protects physical meaning.

## 7. Significant Figures as Epistemic Discipline

Significant figures are a compact way to prevent a calculation from pretending to know more than the measurement process knew. A calculator may output ten digits, but the physical result must be rounded to a precision justified by the inputs, model assumptions, and instrument resolution.

This is not a cosmetic rule. It is part of scientific honesty. If the length, time, or mass values entering a problem are rough, then a highly precise final answer is misleading even if the arithmetic is exact.

The working rule is:

- carry enough guard digits internally to avoid needless rounding error;
- report the final value with precision supported by the data;
- keep units attached through the calculation;
- distinguish accuracy, precision, and numerical display.

## 8. Length, Time, and Mass as Mechanics Seeds

Length gives mechanics its spatial coordinate. Time orders events and allows rates. Mass prepares the later transition from kinematics to dynamics, where acceleration becomes a response to force.

Their later descendants include \(x\), \(\Delta x\), distance, and path length from length; \(v = dx/dt\) from length and time; \(a = dv/dt\) from length and time; \(p = mv\) from mass, length, and time; \(F = ma\) from mass, length, and time; and kinetic energy from mass and speed squared. Those descendants should not all be taught inside this file. The file only states the common measurement grammar; the linked descendants carry their own definitions when a learner needs that layer.

## 9. Scale, Prefixes, and Scientific Notation

Physics moves across scales: atomic distances, human-scale motion, planetary orbits, and astronomical baselines. SI prefixes and scientific notation compress this range without changing the underlying dimension.

Examples:

- \(1\ \mathrm{km}=10^3\ \mathrm{m}\);
- \(1\ \mathrm{cm}=10^{-2}\ \mathrm{m}\);
- \(1\ \mathrm{mm}=10^{-3}\ \mathrm{m}\);
- \(1\ \mathrm{\mu m}=10^{-6}\ \mathrm{m}\);
- \(1\ \mathrm{nm}=10^{-9}\ \mathrm{m}\).

The prefix changes the numerical value used to express the measurement, but it does not create a new physical dimension. A nanometer and a kilometer are both length. The core message is therefore simple but deep: if the unit, standard, and precision structure is absent, the number is not yet physics.
`;

export const FUNDAMENTALS_CHAPTER_1_FILES: FileOntologyFile[] = [
    {
        id: 'fundamentals-ch1-measurement',
        title: 'Fundamentals Chapter 1: Measurement',
        summary:
            'Multi-source ontology file for measurement as the standards, unit, dimensional, and precision foundation of introductory physics.',
        content: FUNDAMENTALS_CHAPTER_1_CONTENT,
        x: 720,
        y: 120,
        width: 760,
        height: 640,
    },
];

export const FUNDAMENTALS_CHAPTER_1_EDGES: FileOntologyEdge[] = [];
