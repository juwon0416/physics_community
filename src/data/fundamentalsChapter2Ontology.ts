import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_2_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2: Motion Along a Straight Line, PDF pages 40-67.';

const CHAPTER_2_OVERVIEW = String.raw`# Fundamentals Chapter 2: Motion Along a Straight Line

## Abstract

This file is the chapter-level integration map for Halliday, Resnick, and Walker, *Fundamentals of Physics*, Chapter 2, "Motion Along a Straight Line." The chapter introduces kinematics as the description of motion without yet invoking force. Its ontology role is to transform Chapter 1 measurement language into a time-dependent model of position, velocity, and acceleration along a single axis.

The chapter is split into reusable concept files because its modules are not merely short examples. Each module introduces a durable concept, equation family, graph interpretation, or special case that later mechanics chapters reuse. The chapter node therefore acts as a source-level map, while the linked nodes carry the reusable concept explanations.

## Source Basis

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}

The extraction preserves the source's module structure: position and displacement, instantaneous velocity, acceleration, constant acceleration, free-fall acceleration, and graphical integration. The review and problem sections confirm that the chapter's learning target is equation choice, graph interpretation, sign discipline, and physical meaning rather than memorization.

## Ontology Boundary and Granularity

Chapter 2 should not be represented as one dense note in the way Chapter 1 is. Chapter 1 shares one methodological argument about measurement. Chapter 2 introduces a chain of reusable ideas:

- Position and displacement define the state variable and finite change.
- Average velocity turns displacement over time into a directed rate.
- Instantaneous velocity takes the limiting rate and becomes the slope of an x-versus-t graph.
- Acceleration becomes the derivative of velocity and the second derivative of position.
- Constant acceleration creates a special equation family.
- Free fall applies that family with vertical sign conventions and acceleration -g.
- Graphical integration reconstructs velocity and position changes from areas under curves.

Each of those ideas later becomes a prerequisite for vectors, projectile motion, Newton's laws, work-energy reasoning, oscillations, and field dynamics. Splitting them into concept files makes the graph more useful without producing noisy one-paragraph nodes.

## Argument Backbone

The chapter's logic can be reconstructed as:

1. Restrict the object to a particle or particle-like body moving along a straight axis.
2. Use a coordinate axis to assign position as a signed measured quantity.
3. Define displacement from final minus initial position, not from path length.
4. Define average velocity from displacement per elapsed time and average speed from total distance per elapsed time.
5. Take the limit of average velocity to get instantaneous velocity.
6. Define acceleration as the rate of change of velocity.
7. Treat constant acceleration as a special case that permits closed-form kinematic equations.
8. Apply the constant-acceleration model to vertical free fall by replacing x with y and a with -g.
9. Use graphical integration to reverse derivative information when acceleration or velocity is supplied as a graph.

## Core Equations

$$
\Delta x = x_2 - x_1
$$

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t}
$$

$$
v = \lim_{\Delta t \to 0}\frac{\Delta x}{\Delta t} = \frac{dx}{dt}
$$

$$
a = \frac{dv}{dt} = \frac{d^2x}{dt^2}
$$

For constant acceleration:

$$
v = v_0 + at
$$

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x - x_0)
$$

For free fall near Earth's surface with upward chosen as positive:

$$
a = -g,\qquad g = 9.8\ \mathrm{m/s^2}
$$

## Connections

Chapter 2 depends on Chapter 1 because every position, time, velocity, and acceleration statement is a measured quantity with units. It prepares Chapter 3 because one-dimensional signs are a limited version of vector direction. It prepares Chapters 4-6 because projectile motion and Newtonian dynamics both require the reader to interpret velocity and acceleration as time-dependent quantities rather than as ordinary speed words.

## Mastery Targets

- Distinguish position, displacement, distance, velocity, speed, and acceleration.
- Explain why displacement and velocity carry direction even in one dimension.
- Read slopes on position-time and velocity-time graphs.
- Choose constant-acceleration equations by the missing variable.
- Use the sign of acceleration as a direction, not as a synonym for speeding up.
- Apply the free-fall model without setting acceleration to zero at the top of a trajectory.
- Use graph area to recover changes in velocity or position.
`;

const POSITION_DISPLACEMENT_CONTENT = String.raw`# Position, Displacement, and Average Velocity

## Abstract

This node reconstructs the first module of Halliday Chapter 2. It defines the one-dimensional state variable, position, and the first finite-change quantities built from it: displacement, average velocity, and average speed.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-1.

The module assumes a particle or particle-like object moving along a single straight axis. That restriction lets direction be represented by algebraic sign while postponing the full vector language of Chapter 3.

## Definitions and Symbols

- $x$: position on a scaled axis, measured relative to an origin.
- $x_1, x_2$: initial and final positions.
- $\Delta x$: displacement, the signed change in position.
- $\Delta t$: elapsed time.
- $v_{\mathrm{avg}}$: average velocity over a time interval.
- $s_{\mathrm{avg}}$: average speed over a time interval.

## Core Equations

$$
\Delta x = x_2 - x_1
$$

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t} = \frac{x_2 - x_1}{t_2 - t_1}
$$

$$
s_{\mathrm{avg}} = \frac{\mathrm{total\ distance}}{\Delta t}
$$

## Logical Structure

Position gives a particle's location with respect to an origin. Displacement then compares two positions. The path traveled between the two positions does not determine displacement; only the initial and final positions do. A round trip can have nonzero distance but zero displacement.

Average velocity uses displacement, so it is directed. Average speed uses total distance, so it is a magnitude. This distinction is one of the first places where ordinary language can mislead a physics learner: "how fast" may refer to speed, but the kinematic state also needs direction.

## Graph Interpretation

On a graph of position $x$ versus time $t$, the average velocity over an interval is the slope of the secant line connecting the two endpoint events. A positive slope means positive average velocity. A negative slope means negative average velocity. A zero slope means no net displacement over that interval.

## Common Misconceptions

- Displacement is not the same as total distance traveled.
- A negative position is not automatically a negative displacement.
- Average velocity can be zero even when the object moved.
- Average speed is not generally the magnitude of average velocity unless motion never reverses.

## Connections

This node depends on Chapter 1 measurement and feeds directly into instantaneous velocity. It also prepares vectors by making direction visible before full vector notation is introduced.
`;

const INSTANTANEOUS_VELOCITY_CONTENT = String.raw`# Instantaneous Velocity and Speed

## Abstract

This node reconstructs Halliday Chapter 2's transition from average velocity over an interval to velocity at an instant. It is the first calculus-shaped idea in the chapter: a rate defined by a limiting process and represented graphically by a tangent slope.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-2.

The module uses one-dimensional motion and assumes position is known as a function of time or as a position-time graph.

## Definitions and Symbols

- $v$: instantaneous velocity.
- $x(t)$: position as a function of time.
- $\Delta x / \Delta t$: average velocity over a finite interval.
- $dx/dt$: derivative of position with respect to time.

## Core Equations

$$
v = \lim_{\Delta t \to 0}\frac{\Delta x}{\Delta t} = \frac{dx}{dt}
$$

$$
\mathrm{speed} = |v|
$$

## Logical Structure

Average velocity answers a finite-interval question: how much signed position change occurred per unit time? Instantaneous velocity asks the same question at one event. The finite interval is shrunk until the secant slope becomes the tangent slope of the position-time curve.

Speed is the magnitude of instantaneous velocity. It discards the sign and keeps only how rapidly the position is changing. That makes speed useful for many everyday comparisons, but it is less complete than velocity when the direction of motion matters.

## Graph Interpretation

On an $x(t)$ graph, instantaneous velocity is the slope of the tangent line at the chosen time. A horizontal tangent gives zero velocity even if the particle may accelerate immediately afterward. Steeper tangent magnitude means greater speed. The sign of the slope gives the direction along the axis.

## Common Misconceptions

- Instantaneous velocity is not found by dividing total trip distance by total trip time.
- A particle can have zero instantaneous velocity at one instant while still accelerating.
- Speed removes sign information; it should not be used when direction is needed.

## Connections

This node depends on displacement and average velocity. It is a prerequisite for acceleration because acceleration is defined by how velocity changes with time.
`;

const ACCELERATION_CONTENT = String.raw`# Acceleration

## Abstract

This node reconstructs Halliday Chapter 2's definition of acceleration as the time rate of change of velocity. It is the concept that lets kinematics describe not only motion, but changing motion.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-3.

The source emphasizes sign discipline: in physics, the sign of acceleration indicates direction along the axis, not automatically "speeding up" or "slowing down."

## Definitions and Symbols

- $a_{\mathrm{avg}}$: average acceleration over a time interval.
- $a$: instantaneous acceleration.
- $v(t)$: velocity as a function of time.
- $x(t)$: position as a function of time.

## Core Equations

$$
a_{\mathrm{avg}} = \frac{\Delta v}{\Delta t} = \frac{v_2 - v_1}{t_2 - t_1}
$$

$$
a = \frac{dv}{dt}
$$

$$
a = \frac{d^2x}{dt^2}
$$

## Logical Structure

Velocity describes the rate at which position changes. Acceleration describes the rate at which velocity changes. This means acceleration is one derivative beyond velocity and two derivatives beyond position.

The direction of acceleration is encoded by sign in one dimension. If velocity and acceleration have the same sign, the speed increases. If they have opposite signs, the speed decreases. If the velocity crosses zero, the same acceleration may describe slowing before the turn and speeding after the turn.

## Graph Interpretation

On a velocity-time graph, acceleration is the slope. On a position-time graph, acceleration is related to the curvature: a changing slope means nonzero acceleration. A straight position-time graph has constant velocity and zero acceleration.

## Common Misconceptions

- Negative acceleration does not always mean slowing down.
- Zero velocity does not imply zero acceleration.
- Large speed is not the same as large acceleration.
- A body can feel acceleration even when its speed is momentarily small.

## Connections

This node depends on instantaneous velocity and leads to constant acceleration, free fall, and graphical integration. It also prepares Newton's laws, where acceleration becomes the observable response to net force.
`;

const CONSTANT_ACCELERATION_CONTENT = String.raw`# Constant Acceleration

## Abstract

This node reconstructs Halliday Chapter 2's constant-acceleration model. The model is a special case, but it is important because it yields a compact family of equations connecting position, displacement, velocity, acceleration, and elapsed time.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-4.

The source repeatedly warns that these equations apply only when acceleration is constant or when the situation can be reasonably approximated that way.

## Definitions and Symbols

- $x_0$: position at $t=0$.
- $v_0$: velocity at $t=0$.
- $x$: position at later time $t$.
- $v$: velocity at later time $t$.
- $a$: constant acceleration.

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

The first two equations are the structural core. The velocity equation follows from constant acceleration as a constant slope on a velocity-time graph. The position equation follows by accumulating velocity over time. The other three equations are algebraic rearrangements useful when a particular variable is absent from the problem.

The practical skill is not memorizing all five equations in isolation. It is identifying which quantities are given, which one is missing, and whether the acceleration is truly constant over the interval being modeled.

## Derivation Roadmap

Starting from $a = dv/dt$, constant $a$ integrates to $v = v_0 + at$. Starting from $v = dx/dt$, substituting that velocity function and integrating gives $x - x_0 = v_0t + \frac{1}{2}at^2$. The remaining equations follow by eliminating one variable from those two core relations.

## Common Misconceptions

- The constant-acceleration equations are not general motion equations.
- Piecewise motion may require separate intervals with different accelerations.
- The equation without time is useful only when time is irrelevant or unavailable.
- Constant acceleration does not mean constant velocity.

## Connections

This node depends on acceleration and directly supports free fall. It also becomes the first serious problem-solving template for later projectile and force problems.
`;

const FREE_FALL_CONTENT = String.raw`# Free-Fall Acceleration

## Abstract

This node reconstructs Halliday Chapter 2's free-fall model as a vertical special case of constant acceleration. It is the learner's first encounter with a physical acceleration that is treated as constant near Earth's surface.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-5.

The source assumes air resistance can be neglected. Under that assumption, the acceleration is downward and has magnitude $g$ independent of the falling object's mass, density, or shape.

## Definitions and Symbols

- $y$: vertical position, usually positive upward in this chapter.
- $v_0$: initial vertical velocity.
- $v$: vertical velocity at a later time.
- $g$: magnitude of free-fall acceleration near Earth's surface.
- $a = -g$: vertical acceleration when upward is chosen as positive.

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

Free fall is not a new kinematic theory. It is the constant-acceleration model applied to vertical motion with a specific acceleration. The sign convention matters: if upward is positive, the acceleration is negative throughout the flight, even when the object is moving upward.

At the top of an upward toss, the velocity is momentarily zero. The acceleration is not zero. It remains downward, so the velocity immediately begins becoming negative after the top point.

## Assumptions and Limits

- Air resistance is neglected.
- The motion occurs close enough to Earth's surface that $g$ can be treated as constant.
- The object is modeled as a particle or particle-like body.
- The vertical coordinate convention must be chosen and kept consistent.

## Common Misconceptions

- Heavier objects do not have larger free-fall acceleration in the ideal model.
- The acceleration at maximum height is not zero.
- $g$ is a positive magnitude; the sign enters through the coordinate direction.
- Upward motion with downward acceleration is not contradictory.

## Connections

This node depends on constant acceleration and prepares projectile motion, where horizontal motion and vertical free fall are combined.
`;

const GRAPHICAL_INTEGRATION_CONTENT = String.raw`# Graphical Integration in Motion Analysis

## Abstract

This node reconstructs Halliday Chapter 2's graphical integration module. It shows how velocity and position changes can be recovered from areas under acceleration-time and velocity-time graphs.

## Source Scope

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}, Module 2-6.

The module closes the chapter by linking the derivative definitions of velocity and acceleration to the inverse operation: accumulation over time.

## Core Equations

$$
v_1 - v_0 = \int_{t_0}^{t_1} a(t)\,dt
$$

$$
x_1 - x_0 = \int_{t_0}^{t_1} v(t)\,dt
$$

## Logical Structure

If acceleration is the derivative of velocity, then the accumulated signed area under an acceleration-time graph gives the change in velocity. If velocity is the derivative of position, then the accumulated signed area under a velocity-time graph gives the change in position.

The graph area carries units. Area under $a(t)$ has units of velocity because $(\mathrm{m/s^2})(\mathrm{s}) = \mathrm{m/s}$. Area under $v(t)$ has units of position because $(\mathrm{m/s})(\mathrm{s}) = \mathrm{m}$.

## Graph Interpretation

Area above the time axis contributes positively. Area below the time axis contributes negatively. Piecewise graphs can be analyzed by splitting the area into simple regions such as rectangles and triangles, then adding signed contributions.

## Common Misconceptions

- The area under an acceleration graph gives change in velocity, not position directly.
- The area under a velocity graph gives displacement, not total distance unless velocity never changes sign.
- Negative area is physically meaningful because it records direction.
- Integration from a graph gives a change; an initial value is still needed to recover the final value.

## Connections

This node depends on instantaneous velocity and acceleration. It prepares later work-energy reasoning, impulse-momentum reasoning, and any topic where a rate graph must be accumulated into a physical change.
`;

export const FUNDAMENTALS_CHAPTER_2_FILES: FileOntologyFile[] = [
    {
        id: 'fundamentals-ch2-motion-along-straight-line',
        title: 'Fundamentals Chapter 2: Motion Along a Straight Line',
        summary:
            'Chapter-level integration map for one-dimensional kinematics, split into reusable concept nodes because the chapter introduces durable rate, derivative, and constant-acceleration structures.',
        content: CHAPTER_2_OVERVIEW,
        x: 1580,
        y: 120,
        width: 760,
        height: 640,
    },
    {
        id: 'ch2-position-displacement-average-velocity',
        title: 'Position, Displacement, and Average Velocity',
        summary:
            'Defines one-dimensional position, signed displacement, average velocity, and average speed as the finite-change base of kinematics.',
        content: POSITION_DISPLACEMENT_CONTENT,
        x: 2460,
        y: 120,
        width: 720,
        height: 620,
    },
    {
        id: 'ch2-instantaneous-velocity-speed',
        title: 'Instantaneous Velocity and Speed',
        summary:
            'Turns average velocity into a limiting rate and reads instantaneous velocity as the tangent slope of the position-time graph.',
        content: INSTANTANEOUS_VELOCITY_CONTENT,
        x: 3340,
        y: 120,
        width: 720,
        height: 600,
    },
    {
        id: 'ch2-acceleration',
        title: 'Acceleration',
        summary:
            'Defines acceleration as the derivative of velocity and second derivative of position, with careful sign interpretation.',
        content: ACCELERATION_CONTENT,
        x: 4220,
        y: 120,
        width: 720,
        height: 600,
    },
    {
        id: 'ch2-constant-acceleration',
        title: 'Constant Acceleration',
        summary:
            'Organizes the special constant-acceleration equation family and explains when those equations are valid.',
        content: CONSTANT_ACCELERATION_CONTENT,
        x: 5100,
        y: 120,
        width: 760,
        height: 640,
    },
    {
        id: 'ch2-free-fall-acceleration',
        title: 'Free-Fall Acceleration',
        summary:
            'Applies constant acceleration to vertical motion near Earth with upward positive and acceleration a = -g.',
        content: FREE_FALL_CONTENT,
        x: 5980,
        y: 120,
        width: 720,
        height: 600,
    },
    {
        id: 'ch2-graphical-integration-motion-analysis',
        title: 'Graphical Integration in Motion Analysis',
        summary:
            'Uses signed graph area to recover changes in velocity from acceleration-time graphs and displacement from velocity-time graphs.',
        content: GRAPHICAL_INTEGRATION_CONTENT,
        x: 5100,
        y: 860,
        width: 760,
        height: 600,
    },
];

export const FUNDAMENTALS_CHAPTER_2_EDGES: FileOntologyEdge[] = [
    {
        id: 'edge-fundamentals-ch1-measurement-fundamentals-ch2-motion',
        sourceFileId: 'fundamentals-ch1-measurement',
        targetFileId: 'fundamentals-ch2-motion-along-straight-line',
        label: 'measurement units prepare kinematics',
    },
    {
        id: 'edge-fundamentals-ch2-motion-position-displacement',
        sourceFileId: 'fundamentals-ch2-motion-along-straight-line',
        targetFileId: 'ch2-position-displacement-average-velocity',
        label: 'introduces state and finite change',
    },
    {
        id: 'edge-position-displacement-instantaneous-velocity',
        sourceFileId: 'ch2-position-displacement-average-velocity',
        targetFileId: 'ch2-instantaneous-velocity-speed',
        label: 'finite interval limit',
    },
    {
        id: 'edge-instantaneous-velocity-acceleration',
        sourceFileId: 'ch2-instantaneous-velocity-speed',
        targetFileId: 'ch2-acceleration',
        label: 'velocity change defines acceleration',
    },
    {
        id: 'edge-acceleration-constant-acceleration',
        sourceFileId: 'ch2-acceleration',
        targetFileId: 'ch2-constant-acceleration',
        label: 'special constant case',
    },
    {
        id: 'edge-constant-acceleration-free-fall',
        sourceFileId: 'ch2-constant-acceleration',
        targetFileId: 'ch2-free-fall-acceleration',
        label: 'vertical special case',
    },
    {
        id: 'edge-acceleration-graphical-integration',
        sourceFileId: 'ch2-acceleration',
        targetFileId: 'ch2-graphical-integration-motion-analysis',
        label: 'integrate acceleration to velocity',
    },
    {
        id: 'edge-instantaneous-velocity-graphical-integration',
        sourceFileId: 'ch2-instantaneous-velocity-speed',
        targetFileId: 'ch2-graphical-integration-motion-analysis',
        label: 'integrate velocity to displacement',
    },
];
