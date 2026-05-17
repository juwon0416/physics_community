-- Integrate Halliday/Fundamentals Chapter 2 into the file ontology canvas.
-- Also removes the old generic starter documentation nodes from persisted canvases.

begin;

delete from public.file_ontology_edges
where id = 'edge-file-ontology-index-file-ontology-links'
   or source_file_id in ('file-ontology-index', 'file-ontology-links')
   or target_file_id in ('file-ontology-index', 'file-ontology-links');

delete from public.file_ontology_files
where id in ('file-ontology-index', 'file-ontology-links');

insert into public.file_ontology_files (id, title, summary, content, x, y, width, height)
values
    (
        'fundamentals-ch2-motion-along-straight-line',
        'Fundamentals Chapter 2: Motion Along a Straight Line',
        'Chapter-level integration map for one-dimensional kinematics, split into reusable concept nodes because the chapter introduces durable rate, derivative, and constant-acceleration structures.',
        $markdown$# Fundamentals Chapter 2: Motion Along a Straight Line

## Abstract

This file is the chapter-level integration map for Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, "Motion Along a Straight Line." The chapter introduces kinematics as the description of motion without yet invoking force. Its ontology role is to transform Chapter 1 measurement language into a time-dependent model of position, velocity, and acceleration along a single axis.

## Source Basis

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2: Motion Along a Straight Line, PDF pages 40-67.

## Ontology Boundary and Granularity

Chapter 2 should be split rather than kept as one dense file because its modules become reusable prerequisites. Position and displacement define the state variable. Average velocity and instantaneous velocity define finite and limiting rates. Acceleration becomes the derivative of velocity and the second derivative of position. Constant acceleration produces a special equation family. Free fall applies that family with a = -g. Graphical integration reconstructs change from area.

## Argument Backbone

1. Restrict the object to particle-like motion along one straight axis.
2. Assign position as a signed measured coordinate.
3. Define displacement as final minus initial position.
4. Define average velocity from displacement per elapsed time and average speed from total distance per elapsed time.
5. Take the limit of average velocity to obtain instantaneous velocity.
6. Define acceleration as the rate of change of velocity.
7. Use constant acceleration as the special case that permits closed-form equations.
8. Treat free fall as vertical constant acceleration with upward positive and a = -g.
9. Use graph area to recover changes in velocity and position.

## Core Equations

$$
\Delta x = x_2 - x_1
$$

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t}
$$

$$
v = \frac{dx}{dt}
$$

$$
a = \frac{dv}{dt} = \frac{d^2x}{dt^2}
$$

$$
v = v_0 + at
$$

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

## Mastery Targets

- Distinguish position, displacement, distance, velocity, speed, and acceleration.
- Read slopes on position-time and velocity-time graphs.
- Choose constant-acceleration equations by the missing variable.
- Use acceleration signs as directions, not as ordinary language labels.
- Apply the free-fall model without setting acceleration to zero at the top of a trajectory.
- Use signed graph area to recover changes in velocity or position.
$markdown$,
        1580,
        120,
        760,
        640
    ),
    (
        'ch2-position-displacement-average-velocity',
        'Position, Displacement, and Average Velocity',
        'Defines one-dimensional position, signed displacement, average velocity, and average speed as the finite-change base of kinematics.',
        $markdown$# Position, Displacement, and Average Velocity

## Abstract

This node defines the one-dimensional state variable, position, and the first finite-change quantities built from it: displacement, average velocity, and average speed.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-1.

## Definitions and Symbols

- $x$: position on a scaled axis.
- $x_1, x_2$: initial and final positions.
- $\Delta x$: signed displacement.
- $\Delta t$: elapsed time.
- $v_{\mathrm{avg}}$: average velocity.
- $s_{\mathrm{avg}}$: average speed.

## Core Equations

$$
\Delta x = x_2 - x_1
$$

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t}
$$

$$
s_{\mathrm{avg}} = \frac{\mathrm{total\ distance}}{\Delta t}
$$

## Logical Structure

Position gives a particle's location relative to an origin. Displacement compares two positions and ignores the path traveled between them. Average velocity uses displacement, so it is directed. Average speed uses total distance, so it is a magnitude.

## Graph Interpretation

On an $x(t)$ graph, average velocity is the slope of the secant line connecting the endpoints of a time interval.

## Common Misconceptions

- Displacement is not total distance traveled.
- Average velocity can be zero even when an object moved.
- Average speed and average velocity only coincide in special no-reversal cases.
$markdown$,
        2460,
        120,
        720,
        620
    ),
    (
        'ch2-instantaneous-velocity-speed',
        'Instantaneous Velocity and Speed',
        'Turns average velocity into a limiting rate and reads instantaneous velocity as the tangent slope of the position-time graph.',
        $markdown$# Instantaneous Velocity and Speed

## Abstract

This node explains the transition from average velocity over an interval to velocity at an instant. It is the chapter's first explicit limiting-rate idea.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-2.

## Core Equations

$$
v = \lim_{\Delta t \to 0}\frac{\Delta x}{\Delta t} = \frac{dx}{dt}
$$

$$
\mathrm{speed} = |v|
$$

## Logical Structure

Average velocity answers a finite-interval question. Instantaneous velocity asks the same question at one event by shrinking the interval until the secant slope becomes the tangent slope. Speed keeps only the magnitude of that velocity.

## Graph Interpretation

On a position-time graph, instantaneous velocity is the tangent slope at the chosen time. A horizontal tangent gives zero velocity at that instant.

## Common Misconceptions

- Instantaneous velocity is not total distance divided by total time.
- Zero velocity at one instant does not imply zero acceleration.
- Speed removes direction information.
$markdown$,
        3340,
        120,
        720,
        600
    ),
    (
        'ch2-acceleration',
        'Acceleration',
        'Defines acceleration as the derivative of velocity and second derivative of position, with careful sign interpretation.',
        $markdown$# Acceleration

## Abstract

This node defines acceleration as the time rate of change of velocity. It lets kinematics describe changing motion, not merely motion itself.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-3.

## Core Equations

$$
a_{\mathrm{avg}} = \frac{\Delta v}{\Delta t}
$$

$$
a = \frac{dv}{dt}
$$

$$
a = \frac{d^2x}{dt^2}
$$

## Logical Structure

Velocity describes how position changes. Acceleration describes how velocity changes. The sign of acceleration is a direction along the axis. If velocity and acceleration have the same sign, speed increases; if they have opposite signs, speed decreases.

## Graph Interpretation

On a velocity-time graph, acceleration is slope. On a position-time graph, acceleration appears as changing slope or curvature.

## Common Misconceptions

- Negative acceleration does not always mean slowing down.
- Zero velocity does not imply zero acceleration.
- Large speed is not the same thing as large acceleration.
$markdown$,
        4220,
        120,
        720,
        600
    ),
    (
        'ch2-constant-acceleration',
        'Constant Acceleration',
        'Organizes the special constant-acceleration equation family and explains when those equations are valid.',
        $markdown$# Constant Acceleration

## Abstract

This node reconstructs the constant-acceleration model. It is a special case, but it yields the compact equation family used throughout introductory mechanics.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-4.

## Core Equations

$$
v = v_0 + at
$$

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x - x_0)
$$

$$
x - x_0 = \frac{1}{2}(v_0 + v)t
$$

$$
x - x_0 = vt - \frac{1}{2}at^2
$$

## Logical Structure

The first two equations are the structural core. The velocity equation follows from constant acceleration as constant slope on a velocity-time graph. The position equation follows by accumulating velocity over time. The remaining equations eliminate one variable for useful problem-solving cases.

## Common Misconceptions

- These are not general motion equations.
- Piecewise motion may require separate intervals.
- Constant acceleration does not mean constant velocity.
$markdown$,
        5100,
        120,
        760,
        640
    ),
    (
        'ch2-free-fall-acceleration',
        'Free-Fall Acceleration',
        'Applies constant acceleration to vertical motion near Earth with upward positive and acceleration a = -g.',
        $markdown$# Free-Fall Acceleration

## Abstract

This node treats free fall as a vertical special case of constant acceleration near Earth's surface.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-5.

## Assumptions

- Air resistance is neglected.
- The object is modeled as a particle or particle-like body.
- The motion is close enough to Earth's surface that $g$ is constant.
- Upward is chosen as the positive y direction.

## Core Equations

$$
g = 9.8\ \mathrm{m/s^2}
$$

$$
a = -g
$$

$$
v = v_0 - gt
$$

$$
y - y_0 = v_0t - \frac{1}{2}gt^2
$$

## Logical Structure

The acceleration is downward throughout the flight. At the top of an upward toss, velocity is momentarily zero, but acceleration is still $-g$.

## Common Misconceptions

- Heavier objects do not fall faster in the ideal free-fall model.
- The acceleration at maximum height is not zero.
- $g$ is a positive magnitude; the coordinate convention supplies the sign.
$markdown$,
        5980,
        120,
        720,
        600
    ),
    (
        'ch2-graphical-integration-motion-analysis',
        'Graphical Integration in Motion Analysis',
        'Uses signed graph area to recover changes in velocity from acceleration-time graphs and displacement from velocity-time graphs.',
        $markdown$# Graphical Integration in Motion Analysis

## Abstract

This node explains how velocity and position changes can be recovered from signed areas under acceleration-time and velocity-time graphs.

## Source Scope

Source basis: Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2, Module 2-6.

## Core Equations

$$
v_1 - v_0 = \int_{t_0}^{t_1} a(t)\,dt
$$

$$
x_1 - x_0 = \int_{t_0}^{t_1} v(t)\,dt
$$

## Logical Structure

If acceleration is the derivative of velocity, accumulated acceleration over time gives change in velocity. If velocity is the derivative of position, accumulated velocity over time gives displacement.

## Graph Interpretation

Area above the time axis contributes positively. Area below the time axis contributes negatively. The unit of area under $a(t)$ is velocity, and the unit of area under $v(t)$ is position.

## Common Misconceptions

- Area under acceleration gives change in velocity, not position directly.
- Area under velocity gives displacement, not total distance unless velocity never changes sign.
- An initial value is still needed to recover the final value from a change.
$markdown$,
        5100,
        860,
        760,
        600
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

with edge_values(id, source_file_id, target_file_id, label) as (
    values
    (
        'edge-fundamentals-ch1-measurement-fundamentals-ch2-motion',
        'fundamentals-ch1-measurement',
        'fundamentals-ch2-motion-along-straight-line',
        'measurement units prepare kinematics'
    ),
    (
        'edge-fundamentals-ch2-motion-position-displacement',
        'fundamentals-ch2-motion-along-straight-line',
        'ch2-position-displacement-average-velocity',
        'introduces state and finite change'
    ),
    (
        'edge-position-displacement-instantaneous-velocity',
        'ch2-position-displacement-average-velocity',
        'ch2-instantaneous-velocity-speed',
        'finite interval limit'
    ),
    (
        'edge-instantaneous-velocity-acceleration',
        'ch2-instantaneous-velocity-speed',
        'ch2-acceleration',
        'velocity change defines acceleration'
    ),
    (
        'edge-acceleration-constant-acceleration',
        'ch2-acceleration',
        'ch2-constant-acceleration',
        'special constant case'
    ),
    (
        'edge-constant-acceleration-free-fall',
        'ch2-constant-acceleration',
        'ch2-free-fall-acceleration',
        'vertical special case'
    ),
    (
        'edge-acceleration-graphical-integration',
        'ch2-acceleration',
        'ch2-graphical-integration-motion-analysis',
        'integrate acceleration to velocity'
    ),
    (
        'edge-instantaneous-velocity-graphical-integration',
        'ch2-instantaneous-velocity-speed',
        'ch2-graphical-integration-motion-analysis',
        'integrate velocity to displacement'
    )
)
insert into public.file_ontology_edges (id, source_file_id, target_file_id, label)
select edge_values.id, edge_values.source_file_id, edge_values.target_file_id, edge_values.label
from edge_values
where exists (
    select 1
    from public.file_ontology_files file
    where file.id = edge_values.source_file_id
)
and exists (
    select 1
    from public.file_ontology_files file
    where file.id = edge_values.target_file_id
)
on conflict (id) do update set
    source_file_id = excluded.source_file_id,
    target_file_id = excluded.target_file_id,
    label = excluded.label,
    updated_at = now();

commit;
