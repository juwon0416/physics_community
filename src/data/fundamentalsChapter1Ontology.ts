import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_1_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 1: Measurement; OpenStax University Physics Volume 1, 1.2 Units and Standards; NIST SP 330 / BIPM SI Brochure, 9th edition; MIT OpenCourseWare 8.01SC Chapter 2, Units, Dimensional Analysis, Problem Solving, and Estimation.';

const FUNDAMENTALS_CHAPTER_1_CONTENT = String.raw`# Fundamentals Chapter 1: Measurement

## Abstract

The conclusion of this file node is that measurement is the operation that turns a qualitative claim about the world into a public, testable, and transferable physical statement. A number becomes physics only when it names a property, a numerical value, a unit, a reproducible standard, and a justified precision.

The practical result is that every later mechanics variable inherits a measurement contract. [[ch2-position-displacement-average-velocity|Position]] is meaningful because length can be measured relative to an origin; [[ch2-instantaneous-velocity-speed|velocity]] is meaningful because length and time can be combined into a rate; [[ch2-acceleration|acceleration]] is meaningful because a rate can itself change with time. This file does not re-teach those later nodes. It gives the common unit, standard, dimensional, and precision structure that lets those nodes make physical claims.

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

Physics begins when a claim can be checked against the world. "The body moved," "the clock ran briefly," or "the sample is heavy" can guide intuition, but those statements are not yet transferable scientific claims. They become physics when they are recast as measured quantities.

The structure is compact:

- a property of a system is identified;
- a unit is chosen for comparing that property;
- a standard defines the unit reproducibly;
- a numerical value is assigned by measurement;
- uncertainty and significant figures state how much trust the value deserves.

This is why measurement sits at the root of introductory mechanics. It is the interface between physical reality and mathematical structure. Later topics can be abstract only because their variables already carry units, standards, and justified precision.

## 2. Quantity Equals Property, Number, Unit, and Precision

A physical quantity is not a bare number. It is a quantified property. The expression \(3.0\) has no physical content by itself, while \(3.0\ \mathrm{m}\), \(3.0\ \mathrm{s}\), and \(3.0\ \mathrm{kg}\) make different claims about different properties.

Symbolically:

$$
Q = n[u]
$$

Here \(Q\) is the physical quantity, \(n\) is the numerical value, and \([u]\) is the unit. The unit is not decoration attached after calculation. It is part of the meaning of the claim. The numerical value changes when the unit changes, but the physical quantity should remain invariant.

A reported value also carries precision. The difference between \(2.3\ \mathrm{m}\) and \(2.300\ \mathrm{m}\) is not typographic. The second statement claims a more precise measurement process. Physics therefore asks not only "what number did the calculator return?" but also "what measurement justified that many digits?"

## 3. Standards Make Measurements Public

A unit works only if different observers can reproduce it. Modern SI standards are designed to be stable, coherent, and tied to reproducible definitions rather than local artifacts. A private ruler, a private clock, or a private mass reference cannot sustain physics at scale.

For introductory mechanics, the most immediate base quantities are length, time, and mass. Length gives spatial coordinates; time orders events and allows rates; mass prepares the later transition from kinematics to dynamics. Those descendants should not all be taught here. Instead, this file fixes the measurement grammar that later lets \(x\), \(v\), \(a\), \(p=mv\), \(F=ma\), work, and energy become meaningful quantities.

## 4. SI Coherence and Derived Quantities

The SI is powerful because base units and derived units form a connected system. Dimensions constrain how quantities can combine:

- area has dimension \(L^2\);
- volume has dimension \(L^3\);
- [[ch2-instantaneous-velocity-speed|velocity]] has dimension \(L T^{-1}\);
- [[ch2-acceleration|acceleration]] has dimension \(L T^{-2}\);
- force later has dimension \(M L T^{-2}\).

The word "derived" does not mean secondary in importance. It means structurally built. Velocity is position change per time; acceleration is velocity change per time. Measurement supplies the dimensional grammar, while the kinematics files carry the full motion argument.

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

The right side has the dimension of [[ch2-instantaneous-velocity-speed|velocity]], not displacement. The proposal is wrong before numerical substitution begins. A displacement caused by constant [[ch2-acceleration|acceleration]] must contain \(t^2\), though dimensional analysis alone cannot supply the coefficient \(\frac{1}{2}\).

This is the compact reason Chapter 2 can introduce \(x(t)\), \(v(t)\), and \(a(t)\) without rebuilding the unit system every time. The measurement argument stays local: dimensions decide which algebraic combinations can even be physical.

## 6. Conversion as Invariance

Unit conversion should be understood as invariance, not as a trick for moving decimal points. A conversion factor is a ratio equal to one. Multiplying by it changes representation while preserving the physical quantity.

For example:

$$
72 \frac{\mathrm{km}}{\mathrm{h}}
\times \frac{1000 \mathrm{m}}{1 \mathrm{km}}
\times \frac{1 \mathrm{h}}{3600 \mathrm{s}}
= 20 \frac{\mathrm{m}}{\mathrm{s}}
$$

The kilometer and hour units cancel because the conversion factors have been oriented correctly. The result is not a new speed; it is the same speed written in a different unit language. This habit scales: errors in unit conversion often become errors in acceleration, force, work, or energy.

## 7. Significant Figures as Epistemic Discipline

Significant figures prevent a calculation from pretending to know more than the measurement process knew. A calculator may output ten digits, but the physical result must be rounded to a precision justified by the inputs, model assumptions, and instrument resolution.

The working rule is:

- carry enough guard digits internally to avoid needless rounding error;
- report the final value with precision supported by the data;
- keep units attached through the calculation;
- distinguish accuracy, precision, and numerical display.

This is not a cosmetic rule. It is part of scientific honesty. If the length, time, or mass values entering a problem are rough, then a highly precise final answer is misleading even when the arithmetic is exact.

## 8. Scale, Prefixes, and Scientific Notation

Physics moves across scales: atomic distances, human-scale motion, planetary orbits, and astronomical baselines. SI prefixes and scientific notation compress this range without changing the underlying dimension.

Examples:

- \(1\ \mathrm{km}=10^3\ \mathrm{m}\);
- \(1\ \mathrm{cm}=10^{-2}\ \mathrm{m}\);
- \(1\ \mathrm{mm}=10^{-3}\ \mathrm{m}\);
- \(1\ \mathrm{\mu m}=10^{-6}\ \mathrm{m}\);
- \(1\ \mathrm{nm}=10^{-9}\ \mathrm{m}\).

The prefix changes the numerical value used to express the measurement, but it does not create a new physical dimension. A nanometer and a kilometer are both length. The core message is therefore simple but deep: if the unit, standard, and precision structure is absent, the number is not yet physics.

## References

- Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 1: Measurement.
- OpenStax University Physics Volume 1, Section 1.2, Units and Standards.
- NIST SP 330 and the BIPM SI Brochure, 9th edition.
- MIT OpenCourseWare 8.01SC, Chapter 2, Units, Dimensional Analysis, Problem Solving, and Estimation.
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
