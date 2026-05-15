import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_1_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 1: Measurement, PDF pages 28-35.';

export const FUNDAMENTALS_CHAPTER_1_FILES: FileOntologyFile[] = [
    {
        id: 'fundamentals-ch1-measurement-map',
        title: 'Fundamentals Chapter 1: Measurement Map',
        summary: 'Small-node ontology map for Chapter 1, linking measurement to units, standards, conversion, length, time, and mass.',
        content: `# Fundamentals Chapter 1: Measurement Map

This map organizes Chapter 1 of *Fundamentals of Physics* into small reusable ontology files rather than one large chapter summary.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_1_SOURCE}

The chapter introduces [[measurement-in-physics|measurement in physics]] as the basis for quantitative science. The local neighborhood is built from [[physical-quantity|physical quantities]], [[base-quantity|base quantities]], [[unit-standard|unit standards]], and the [[si-system|SI system]].

## Local Learning Route

1. Start with [[measurement-in-physics|measurement in physics]].
2. Separate [[base-quantity|base quantities]] from [[derived-quantity|derived quantities]].
3. Study the standard units: [[meter|meter]], [[second|second]], and [[kilogram|kilogram]].
4. Use [[chain-link-conversion|chain-link conversion]] to move between unit systems.
5. Check numerical reporting with [[significant-figures|significant figures]] and [[decimal-places|decimal places]].

## Chapter Modules

- 1-1 Measuring things, including lengths: [[length|length]], [[meter|meter]], [[si-prefixes|SI prefixes]], and [[chain-link-conversion|chain-link conversion]].
- 1-2 Time: [[time|time]], [[second|second]], and [[atomic-clock|atomic clocks]].
- 1-3 Mass: [[mass|mass]] and [[kilogram|kilogram]].
`,
        x: 120,
        y: 120,
        width: 540,
        height: 420,
    },
    {
        id: 'measurement-in-physics',
        title: 'Measurement in Physics',
        summary: 'Physics makes quantitative claims by measuring physical quantities against agreed standards.',
        content: `# Measurement in Physics

## Core Idea

Physics depends on comparing aspects of the world with agreed [[unit-standard|unit standards]]. A measurement assigns a number and a unit to a [[physical-quantity|physical quantity]].

## Role in the Chapter

Chapter 1 uses measurement to introduce the operational base of mechanics: [[length|length]], [[time|time]], and [[mass|mass]]. These are treated as [[base-quantity|base quantities]] whose standards support later definitions of [[derived-quantity|derived quantities]].

## Connections

- [[physical-quantity|Physical quantity]]: what is being measured.
- [[unit-standard|Unit standard]]: the reference used for comparison.
- [[si-system|SI system]]: the international unit framework.
- [[chain-link-conversion|Chain-link conversion]]: how equivalent measurements are rewritten in different units.
`,
        x: 760,
        y: 80,
        width: 460,
        height: 330,
    },
    {
        id: 'physical-quantity',
        title: 'Physical Quantity',
        summary: 'A measurable property of a physical system, expressed as a number multiplied by a unit.',
        content: `# Physical Quantity

## Definition

A physical quantity is any property that can be compared with a [[unit-standard|standard]] and reported with a unit.

## Examples

Chapter 1 focuses on [[length|length]], [[time|time]], and [[mass|mass]]. Later physics builds many [[derived-quantity|derived quantities]] from these base measurements.

## Logic

Measurement requires a physical quantity, a [[unit-standard|standard]], and a rule for comparison. Without the unit, the numerical value has no clear physical meaning.
`,
        x: 1300,
        y: 80,
        width: 430,
        height: 310,
    },
    {
        id: 'base-quantity',
        title: 'Base Quantity',
        summary: 'A fundamental measurement category whose unit is defined independently in the unit system.',
        content: `# Base Quantity

## Definition

A base quantity is a measurement category selected as fundamental inside a unit system. Chapter 1 emphasizes [[length|length]], [[time|time]], and [[mass|mass]].

## Why It Matters

Once base quantities have stable standards, the system can define [[derived-quantity|derived quantities]] such as area, volume, speed, and acceleration.

## Connected Standards

- [[length|Length]] uses the [[meter|meter]].
- [[time|Time]] uses the [[second|second]].
- [[mass|Mass]] uses the [[kilogram|kilogram]].
`,
        x: 760,
        y: 500,
        width: 450,
        height: 320,
    },
    {
        id: 'derived-quantity',
        title: 'Derived Quantity',
        summary: 'A physical quantity defined from base quantities, such as area, volume, speed, or density.',
        content: `# Derived Quantity

## Definition

A derived quantity is built from one or more [[base-quantity|base quantities]]. It inherits its unit structure from the base units.

## Examples

Area depends on [[length|length]] squared. Volume depends on length cubed. Speed depends on length divided by [[time|time]].

## Ontology Role

This node connects Chapter 1 measurement concepts to later mechanics, where quantities such as velocity, acceleration, force, work, and energy are introduced through defined unit combinations.
`,
        x: 1300,
        y: 500,
        width: 430,
        height: 320,
    },
    {
        id: 'unit-standard',
        title: 'Unit Standard',
        summary: 'An agreed reference that makes measurements reproducible across observers and laboratories.',
        content: `# Unit Standard

## Definition

A unit standard is the reference used to define a unit. It must be stable enough that different observers can reproduce the same measurement.

## Chapter Role

The chapter connects [[unit-standard|standards]] to the [[si-system|SI system]], where [[meter|meter]], [[second|second]], and [[kilogram|kilogram]] serve as standard units for the base quantities.

## Design Requirement

A useful standard must be practical, internationally agreed, and reproducible with high precision.
`,
        x: 1840,
        y: 80,
        width: 430,
        height: 310,
    },
    {
        id: 'si-system',
        title: 'SI System',
        summary: 'The International System of Units used to standardize physical measurements.',
        content: `# SI System

## Definition

The SI system is the internationally standardized unit system used for scientific measurement.

## Chapter 1 Role

Chapter 1 uses SI to organize the base standards for [[length|length]], [[time|time]], and [[mass|mass]]. It also introduces [[si-prefixes|SI prefixes]] for powers of ten.

## Connections

- [[meter|Meter]] for length.
- [[second|Second]] for time.
- [[kilogram|Kilogram]] for mass.
- [[chain-link-conversion|Chain-link conversion]] for changing units without changing the physical quantity.
`,
        x: 1840,
        y: 500,
        width: 430,
        height: 330,
    },
    {
        id: 'si-prefixes',
        title: 'SI Prefixes',
        summary: 'Powers-of-ten labels such as milli-, centi-, kilo-, mega-, nano-, and micro-.',
        content: `# SI Prefixes

## Definition

SI prefixes are compact labels for powers of ten attached to SI units.

## Use

Prefixes let measurements be written at human-friendly scales. A length can be expressed in [[meter|meters]], millimeters, centimeters, or kilometers without changing the underlying [[physical-quantity|physical quantity]].

## Connection to Conversion

Prefixes are common inputs to [[chain-link-conversion|chain-link conversion]], where conversion factors are arranged so unwanted units cancel.
`,
        x: 2380,
        y: 500,
        width: 430,
        height: 310,
    },
    {
        id: 'chain-link-conversion',
        title: 'Chain-Link Conversion',
        summary: 'A unit-conversion method that multiplies by conversion factors equal to one.',
        content: `# Chain-Link Conversion

## Definition

Chain-link conversion rewrites a measurement in new units by multiplying by [[conversion-factor|conversion factors]] that equal one.

## Logic

The method tracks units algebraically. Units in numerator and denominator cancel until the desired final unit remains.

## Why It Matters

This is the chapter's operational method for moving between unit systems while preserving the same [[physical-quantity|physical quantity]].

## Connected Nodes

- [[si-prefixes|SI prefixes]] supply common powers-of-ten conversions.
- [[length|Length]], area, and volume examples show how unit powers affect conversion.
`,
        x: 2380,
        y: 80,
        width: 460,
        height: 350,
    },
    {
        id: 'conversion-factor',
        title: 'Conversion Factor',
        summary: 'A ratio of equivalent quantities used to change units without changing the measured quantity.',
        content: `# Conversion Factor

## Definition

A conversion factor is a ratio between equivalent measurements. Because the numerator and denominator represent the same physical amount, the ratio is treated as one.

## In Chain-Link Conversion

[[chain-link-conversion|Chain-link conversion]] uses conversion factors to cancel old units and introduce new ones.

## Caution

For area or volume, conversion factors must be squared or cubed when the unit itself is squared or cubed.
`,
        x: 2920,
        y: 80,
        width: 420,
        height: 310,
    },
    {
        id: 'length',
        title: 'Length',
        summary: 'A base quantity measuring spatial separation, standardized in SI by the meter.',
        content: `# Length

## Definition

Length is a [[base-quantity|base quantity]] used to measure spatial separation or spatial extent.

## SI Standard

The SI unit for length is the [[meter|meter]]. Chapter 1 presents length measurement as the first concrete case of measurement standards and unit conversion.

## Reporting

Length measurements must be reported with appropriate [[significant-figures|significant figures]] and, when relevant, [[decimal-places|decimal places]].
`,
        x: 760,
        y: 920,
        width: 430,
        height: 320,
    },
    {
        id: 'meter',
        title: 'Meter',
        summary: 'The SI unit of length, defined through a reproducible standard tied to the speed of light.',
        content: `# Meter

## Definition

The meter is the SI unit for [[length|length]].

## Ontology Role

It is the standard unit that anchors spatial measurement in Chapter 1. Through the [[si-system|SI system]], it connects length to [[si-prefixes|prefix-scaled]] units such as millimeter, centimeter, and kilometer.

## Connection

The meter is used in [[chain-link-conversion|chain-link conversion]] when translating between length units or between derived units such as area and volume.
`,
        x: 1300,
        y: 920,
        width: 430,
        height: 320,
    },
    {
        id: 'significant-figures',
        title: 'Significant Figures',
        summary: 'Digits in a measured value that communicate the precision justified by the measurement.',
        content: `# Significant Figures

## Definition

Significant figures are the digits in a reported measurement that carry meaningful precision.

## Chapter Role

Chapter 1 links significant figures to the limits of measurement and numerical reporting. The concept is especially relevant when reporting [[length|length]] or results from [[chain-link-conversion|unit conversions]].

## Caution

Extra digits can imply unjustified precision. Too few digits can discard useful measurement information.
`,
        x: 1840,
        y: 920,
        width: 430,
        height: 320,
    },
    {
        id: 'decimal-places',
        title: 'Decimal Places',
        summary: 'The number of digits written to the right of the decimal point in a numerical value.',
        content: `# Decimal Places

## Definition

Decimal places count the digits to the right of a decimal point.

## Relation to Significant Figures

[[decimal-places|Decimal places]] and [[significant-figures|significant figures]] both describe numerical reporting, but they answer different questions. Decimal places track position after the decimal point; significant figures track meaningful precision.

## Measurement Role

A measurement report should choose decimal places in a way that does not misrepresent measurement precision.
`,
        x: 2380,
        y: 920,
        width: 430,
        height: 320,
    },
    {
        id: 'time',
        title: 'Time',
        summary: 'A base quantity used to order events and measure durations.',
        content: `# Time

## Definition

Time is a [[base-quantity|base quantity]] used for ordering events and measuring intervals.

## Two Roles

Chapter 1 separates two practical uses: identifying when an event occurs and determining how long an event lasts.

## SI Standard

The SI unit for time is the [[second|second]], realized through high-precision [[atomic-clock|atomic clocks]].
`,
        x: 760,
        y: 1320,
        width: 430,
        height: 320,
    },
    {
        id: 'second',
        title: 'Second',
        summary: 'The SI unit of time, defined through a reproducible atomic-frequency standard.',
        content: `# Second

## Definition

The second is the SI unit for [[time|time]].

## Standardization

Chapter 1 presents the second as a unit whose standard must support both event ordering and duration measurement.

## Connection

The practical realization of the second is tied to [[atomic-clock|atomic clocks]], which provide highly reproducible timekeeping.
`,
        x: 1300,
        y: 1320,
        width: 430,
        height: 310,
    },
    {
        id: 'atomic-clock',
        title: 'Atomic Clock',
        summary: 'A clock that uses atomic transitions as a highly reproducible timing standard.',
        content: `# Atomic Clock

## Definition

An atomic clock uses an atomic process as the reference for measuring [[time|time]].

## Chapter Role

Atomic clocks illustrate why a [[unit-standard|unit standard]] should be reproducible and precise. They support the practical definition of the [[second|second]].

## Ontology Connection

This node links measurement standards to experimental reproducibility and precision.
`,
        x: 1840,
        y: 1320,
        width: 430,
        height: 310,
    },
    {
        id: 'mass',
        title: 'Mass',
        summary: 'A base quantity associated with the amount of matter or inertia, standardized in SI by the kilogram.',
        content: `# Mass

## Definition

Mass is a [[base-quantity|base quantity]] used throughout mechanics.

## SI Standard

Chapter 1 introduces mass through the [[kilogram|kilogram]] standard. It belongs with [[length|length]] and [[time|time]] as a base measurement for later mechanics.

## Later Use

Mass becomes central in dynamics, momentum, energy, and gravitation. This chapter establishes only the measurement foundation.
`,
        x: 760,
        y: 1700,
        width: 430,
        height: 320,
    },
    {
        id: 'kilogram',
        title: 'Kilogram',
        summary: 'The SI unit of mass, used as the mass standard in Chapter 1 measurement.',
        content: `# Kilogram

## Definition

The kilogram is the SI unit for [[mass|mass]].

## Chapter Role

Chapter 1 uses the kilogram as the mass standard within the [[si-system|SI system]].

## Connection

Together with the [[meter|meter]] and [[second|second]], the kilogram anchors the base measurement structure used by later mechanics.
`,
        x: 1300,
        y: 1700,
        width: 430,
        height: 300,
    },
];

export const FUNDAMENTALS_CHAPTER_1_EDGES: FileOntologyEdge[] = [
    { id: 'edge-fundamentals-ch1-measurement-map-measurement-in-physics-contains', sourceFileId: 'fundamentals-ch1-measurement-map', targetFileId: 'measurement-in-physics', label: 'contains' },
    { id: 'edge-fundamentals-ch1-measurement-map-length-contains', sourceFileId: 'fundamentals-ch1-measurement-map', targetFileId: 'length', label: 'contains' },
    { id: 'edge-fundamentals-ch1-measurement-map-time-contains', sourceFileId: 'fundamentals-ch1-measurement-map', targetFileId: 'time', label: 'contains' },
    { id: 'edge-fundamentals-ch1-measurement-map-mass-contains', sourceFileId: 'fundamentals-ch1-measurement-map', targetFileId: 'mass', label: 'contains' },
    { id: 'edge-measurement-in-physics-physical-quantity-measures', sourceFileId: 'measurement-in-physics', targetFileId: 'physical-quantity', label: 'measures' },
    { id: 'edge-measurement-in-physics-unit-standard-compares-against', sourceFileId: 'measurement-in-physics', targetFileId: 'unit-standard', label: 'compares_against' },
    { id: 'edge-measurement-in-physics-base-quantity-establishes', sourceFileId: 'measurement-in-physics', targetFileId: 'base-quantity', label: 'establishes' },
    { id: 'edge-physical-quantity-base-quantity-classifies-as', sourceFileId: 'physical-quantity', targetFileId: 'base-quantity', label: 'classifies_as' },
    { id: 'edge-physical-quantity-derived-quantity-classifies-as', sourceFileId: 'physical-quantity', targetFileId: 'derived-quantity', label: 'classifies_as' },
    { id: 'edge-base-quantity-derived-quantity-builds', sourceFileId: 'base-quantity', targetFileId: 'derived-quantity', label: 'builds' },
    { id: 'edge-unit-standard-si-system-standardized-by', sourceFileId: 'unit-standard', targetFileId: 'si-system', label: 'standardized_by' },
    { id: 'edge-si-system-meter-defines', sourceFileId: 'si-system', targetFileId: 'meter', label: 'defines_unit' },
    { id: 'edge-si-system-second-defines', sourceFileId: 'si-system', targetFileId: 'second', label: 'defines_unit' },
    { id: 'edge-si-system-kilogram-defines', sourceFileId: 'si-system', targetFileId: 'kilogram', label: 'defines_unit' },
    { id: 'edge-si-system-si-prefixes-uses', sourceFileId: 'si-system', targetFileId: 'si-prefixes', label: 'uses' },
    { id: 'edge-si-prefixes-chain-link-conversion-supports', sourceFileId: 'si-prefixes', targetFileId: 'chain-link-conversion', label: 'supports' },
    { id: 'edge-chain-link-conversion-conversion-factor-uses', sourceFileId: 'chain-link-conversion', targetFileId: 'conversion-factor', label: 'uses' },
    { id: 'edge-chain-link-conversion-physical-quantity-preserves', sourceFileId: 'chain-link-conversion', targetFileId: 'physical-quantity', label: 'preserves' },
    { id: 'edge-length-meter-measured-in', sourceFileId: 'length', targetFileId: 'meter', label: 'measured_in' },
    { id: 'edge-length-significant-figures-reported-with', sourceFileId: 'length', targetFileId: 'significant-figures', label: 'reported_with' },
    { id: 'edge-significant-figures-decimal-places-contrasts-with', sourceFileId: 'significant-figures', targetFileId: 'decimal-places', label: 'contrasts_with' },
    { id: 'edge-time-second-measured-in', sourceFileId: 'time', targetFileId: 'second', label: 'measured_in' },
    { id: 'edge-second-atomic-clock-realized-by', sourceFileId: 'second', targetFileId: 'atomic-clock', label: 'realized_by' },
    { id: 'edge-atomic-clock-unit-standard-exemplifies', sourceFileId: 'atomic-clock', targetFileId: 'unit-standard', label: 'exemplifies' },
    { id: 'edge-mass-kilogram-measured-in', sourceFileId: 'mass', targetFileId: 'kilogram', label: 'measured_in' },
    { id: 'edge-kilogram-si-system-part-of', sourceFileId: 'kilogram', targetFileId: 'si-system', label: 'part_of' },
];
