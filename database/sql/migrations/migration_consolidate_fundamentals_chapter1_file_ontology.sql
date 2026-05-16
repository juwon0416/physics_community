-- Consolidate Halliday/Fundamentals Chapter 1 file ontology into one compact chapter node.
-- Rationale: Chapter 1 sections are short, so many tiny file nodes reduce graph readability.
-- This migration is idempotent and only targets the known Chapter 1 starter ontology ids.

begin;

insert into public.file_ontology_files (id, title, summary, content, x, y, width, height)
values (
    'fundamentals-ch1-measurement',
    'Fundamentals Chapter 1: Measurement',
    'Single-node ontology file for Halliday Fundamentals of Physics Chapter 1. Short sections are preserved inside one chapter file to avoid unnecessary graph fragmentation.',
    $markdown$# Fundamentals Chapter 1: Measurement

This file intentionally keeps Chapter 1 as one compact source node. The chapter sections are short introductory notes, so splitting them into many separate file nodes would make the ontology harder to read without adding much semantic value.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 1: Measurement, PDF pages 28-35.

Chapter 1 introduces measurement as the operational base of physics: physical quantities are compared against agreed standards and reported with numbers, units, and appropriate precision.

## Section 1-1: Measuring Things, Including Lengths

Measurement begins with a physical quantity and a standard unit. Length is the first concrete example: distances, sizes, and spatial separations are reported by comparing them with a reproducible length standard such as the meter.

Key ideas:

- A physical quantity needs both a number and a unit.
- Unit standards make measurements reproducible across observers and laboratories.
- The SI system organizes standard units and prefixes.
- Chain-link conversion rewrites the same measurement in equivalent units by multiplying by conversion factors equal to one.
- Significant figures and decimal places should reflect measurement precision rather than false exactness.

## Section 1-2: Time

Time is a base quantity used to order events and measure durations. Chapter 1 treats the second as the standard time unit and uses time measurement as another example of how physics depends on stable, reproducible standards.

Key ideas:

- Time measurements compare event intervals with a standard clock process.
- Atomic clocks provide highly reproducible standards.
- Later mechanics depends on time when defining velocity, acceleration, oscillation, and rates of change.

## Section 1-3: Mass

Mass is a base quantity associated with the amount of matter and inertia of an object. Chapter 1 introduces the kilogram as the mass standard and prepares the later use of mass in force, momentum, and energy.

Key ideas:

- Mass is treated as a base measurement category in mechanics.
- The kilogram anchors mass measurement inside SI.
- Later concepts such as force, momentum, work, and energy depend on mass units.

## Compact Ontology Design

For this chapter, the useful ontology boundary is the chapter itself rather than each small section. The internal section headings above preserve source structure, while the graph canvas stays readable with one file node.

Use separate file nodes only when a section or concept has enough independent explanatory weight to support its own note, substantial links, or reusable role across multiple sources.

## Local Concept Checklist

- Measurement: comparing physical quantities with standards.
- Physical quantity: measurable property reported as number plus unit.
- Base quantities: length, time, and mass.
- Derived quantities: quantities later built from base quantities.
- Unit standard: reproducible reference for a unit.
- SI system and prefixes: standardized unit framework.
- Chain-link conversion: algebraic unit conversion using equivalent ratios.
- Numerical precision: significant figures and decimal places.
$markdown$,
    720,
    120,
    680,
    560
)
on conflict (id) do update set
    title = excluded.title,
    summary = excluded.summary,
    content = excluded.content,
    x = excluded.x,
    y = excluded.y,
    width = excluded.width,
    height = excluded.height,
    updated_at = now();

with old_chapter_nodes(id) as (
    values
        ('fundamentals-ch1-measurement-map'),
        ('measurement-in-physics'),
        ('physical-quantity'),
        ('base-quantity'),
        ('derived-quantity'),
        ('unit-standard'),
        ('si-system'),
        ('si-prefixes'),
        ('chain-link-conversion'),
        ('conversion-factor'),
        ('length'),
        ('meter'),
        ('significant-figures'),
        ('decimal-places'),
        ('time'),
        ('second'),
        ('atomic-clock'),
        ('mass'),
        ('kilogram')
)
delete from public.file_ontology_edges edge
using old_chapter_nodes old_node
where edge.source_file_id = old_node.id
   or edge.target_file_id = old_node.id;

with old_chapter_nodes(id) as (
    values
        ('fundamentals-ch1-measurement-map'),
        ('measurement-in-physics'),
        ('physical-quantity'),
        ('base-quantity'),
        ('derived-quantity'),
        ('unit-standard'),
        ('si-system'),
        ('si-prefixes'),
        ('chain-link-conversion'),
        ('conversion-factor'),
        ('length'),
        ('meter'),
        ('significant-figures'),
        ('decimal-places'),
        ('time'),
        ('second'),
        ('atomic-clock'),
        ('mass'),
        ('kilogram')
)
delete from public.file_ontology_files file
using old_chapter_nodes old_node
where file.id = old_node.id;

-- Keep the starter documentation nodes readable and farther apart.
update public.file_ontology_files
set x = 80, y = 120, width = greatest(width, 440), height = greatest(height, 340), updated_at = now()
where id = 'file-ontology-index';

update public.file_ontology_files
set x = 80, y = 760, width = greatest(width, 420), height = greatest(height, 320), updated_at = now()
where id = 'file-ontology-links';

commit;
