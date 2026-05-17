import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_2_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2: Motion Along a Straight Line, PDF pages 40-67.';

const CHAPTER_2_OVERVIEW = String.raw`# Fundamentals Chapter 2: Motion Along a Straight Line

## Abstract

The conclusion of Chapter 2 is that one-dimensional motion can be reconstructed from three linked time-dependent quantities: position, velocity, and acceleration. Once position is treated as a signed function of time, velocity becomes its rate of change, acceleration becomes the rate of change of velocity, and constant-acceleration motion becomes a solvable special case that includes ideal free fall.

This chapter node is a source-level map. It does not try to teach every sub-concept in one body. Instead, it points to the reusable files that carry the actual learning load: [[ch2-position-displacement-average-velocity|position and displacement]], [[ch2-instantaneous-velocity-speed|instantaneous velocity]], [[ch2-acceleration|acceleration]], [[ch2-constant-acceleration|constant acceleration]], [[ch2-free-fall-acceleration|free fall]], and [[ch2-graphical-integration-motion-analysis|graphical integration]].

## Source Basis

Source basis: ${FUNDAMENTALS_CHAPTER_2_SOURCE}

The reconstruction follows the source modules on motion along a straight line. The important learning target is not memorizing equations, but seeing how each equation follows from a definition, a graph interpretation, or the assumption that acceleration is constant.

## Logical Development

The chapter's reasoning path is:

1. Restrict the body to particle-like motion along one straight axis.
2. Use a coordinate axis to assign position as a signed measured quantity.
3. Define displacement from final minus initial position, not from path length.
4. Define average velocity from displacement per elapsed time and average speed from total distance per elapsed time.
5. Take the limit of average velocity to get instantaneous velocity.
6. Define acceleration as the rate of change of velocity.
7. Treat constant acceleration as a special case that permits closed-form kinematic equations.
8. Apply the constant-acceleration model to vertical free fall by replacing x with y and a with -g.
9. Use graphical integration to reverse derivative information when acceleration or velocity is supplied as a graph.

## Definitions and Symbols

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

Here \(\Delta x\) is displacement, \(v_{\mathrm{avg}}\) is average velocity, \(v\) is instantaneous velocity, and \(a\) is acceleration. The derivative notation says that velocity is the slope of \(x(t)\), while acceleration is the slope of \(v(t)\).

## Constant-Acceleration Result

$$
v = v_0 + at
$$

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x - x_0)
$$

These equations are valid as a family only when \(a\) is constant over the interval. They should be read as consequences of the derivative definitions, not as unrelated formulas.

## Free-Fall Result

For free fall near Earth's surface with upward chosen positive:

$$
a = -g,\qquad g = 9.8\ \mathrm{m/s^2}
$$

The sign belongs to the chosen coordinate direction. The magnitude \(g\) is positive; the acceleration component is negative because the acceleration points downward.

## Scope and Graph Links

Chapter 2 depends on [[fundamentals-ch1-measurement|measurement]] because every kinematic variable is a measured quantity with units. It prepares vector kinematics by using sign as a one-dimensional version of direction, and it prepares Newtonian dynamics by making acceleration a precise time-dependent quantity before force is introduced.
`;

const POSITION_DISPLACEMENT_CONTENT = String.raw`# Position, Displacement, and Average Velocity

## Abstract

The conclusion of this node is that displacement and average velocity are signed quantities built from position change, while distance and average speed ignore direction. This distinction is the first structural reason that one-dimensional kinematics cannot be reduced to ordinary "how far" and "how fast" language.

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

## Logical Development

Position gives a particle's location with respect to an origin. Displacement then compares two positions. The path traveled between the two positions does not determine displacement; only the initial and final positions do. A round trip can have nonzero distance but zero displacement.

Average velocity uses displacement, so it is directed. Average speed uses total distance, so it is a magnitude. This distinction is one of the first places where ordinary language can mislead a physics learner: "how fast" may refer to speed, but the kinematic state also needs direction.

## Graph Interpretation

On a graph of position $x$ versus time $t$, the average velocity over an interval is the slope of the secant line connecting the two endpoint events. A positive slope means positive average velocity. A negative slope means negative average velocity. A zero slope means no net displacement over that interval.

## Scope and Graph Links

This node depends on [[fundamentals-ch1-measurement|measurement]] because position and time must carry units before rates can be defined. It feeds directly into [[ch2-instantaneous-velocity-speed|instantaneous velocity]], where the finite interval \(\Delta t\) is shrunk toward an instant.
`;

const INSTANTANEOUS_VELOCITY_CONTENT = String.raw`# Instantaneous Velocity and Speed

## Abstract

The conclusion of this node is that instantaneous velocity is the derivative of position with respect to time, and instantaneous speed is its magnitude. In graph language, velocity at an instant is the tangent slope of the position-time curve.

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

## Logical Development

Average velocity answers a finite-interval question: how much signed position change occurred per unit time? Instantaneous velocity asks the same question at one event. The finite interval is shrunk until the secant slope becomes the tangent slope of the position-time curve.

Speed is the magnitude of instantaneous velocity. It discards the sign and keeps only how rapidly the position is changing. That makes speed useful for many everyday comparisons, but it is less complete than velocity when the direction of motion matters.

## Graph Interpretation

On an $x(t)$ graph, instantaneous velocity is the slope of the tangent line at the chosen time. A horizontal tangent gives zero velocity even if the particle may accelerate immediately afterward. Steeper tangent magnitude means greater speed. The sign of the slope gives the direction along the axis.

## Scope and Graph Links

This node depends on [[ch2-position-displacement-average-velocity|position, displacement, and average velocity]]. It leads to [[ch2-acceleration|acceleration]] because acceleration asks how this instantaneous velocity changes with time.
`;

const ACCELERATION_CONTENT = String.raw`# Acceleration

## Abstract

The conclusion of this node is that acceleration is the time derivative of velocity and the second derivative of position. In one dimension its sign gives direction along the axis, not a universal label for "speeding up" or "slowing down."

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

## Logical Development

Velocity describes the rate at which position changes. Acceleration describes the rate at which velocity changes. This means acceleration is one derivative beyond velocity and two derivatives beyond position.

The direction of acceleration is encoded by sign in one dimension. If velocity and acceleration have the same sign, the speed increases. If they have opposite signs, the speed decreases. If the velocity crosses zero, the same acceleration may describe slowing before the turn and speeding after the turn.

## Graph Interpretation

On a velocity-time graph, acceleration is the slope. On a position-time graph, acceleration is related to the curvature: a changing slope means nonzero acceleration. A straight position-time graph has constant velocity and zero acceleration.

## Scope and Graph Links

This node depends on [[ch2-instantaneous-velocity-speed|instantaneous velocity]]. It leads to [[ch2-constant-acceleration|constant acceleration]], [[ch2-free-fall-acceleration|free fall]], and [[ch2-graphical-integration-motion-analysis|graphical integration]]. It also prepares Newton's laws, where acceleration becomes the observable response to net force.
`;

const CONSTANT_ACCELERATION_CONTENT = String.raw`# Constant Acceleration

## Abstract

The conclusion of this node is that constant acceleration turns the derivative definitions of motion into a compact equation family. The equations are powerful because one fixed acceleration lets velocity grow linearly with time and position grow quadratically with time.

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

## Logical Development

The first two equations are the structural core. The velocity equation follows from constant acceleration as a constant slope on a velocity-time graph. The position equation follows by accumulating velocity over time. The other three equations are algebraic rearrangements useful when a particular variable is absent from the problem.

The practical skill is not memorizing all five equations in isolation. It is identifying which quantities are given, which one is missing, and whether the acceleration is truly constant over the interval being modeled.

## Derivation Roadmap

Starting from $a = dv/dt$, constant $a$ integrates to $v = v_0 + at$. Starting from $v = dx/dt$, substituting that velocity function and integrating gives $x - x_0 = v_0t + \frac{1}{2}at^2$. The remaining equations follow by eliminating one variable from those two core relations.

## Scope and Graph Links

This node depends on [[ch2-acceleration|acceleration]] and directly supports [[ch2-free-fall-acceleration|free fall]]. It also becomes the first reusable equation family for later projectile and force problems.
`;

const FREE_FALL_CONTENT = String.raw`# Free-Fall Acceleration

## Abstract

The conclusion of this node is that ideal free fall near Earth's surface is constant-acceleration motion with vertical acceleration directed downward. If upward is chosen positive, the acceleration component is \(a=-g\) throughout the flight, even at the top of an upward toss.

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

## Logical Development

Free fall is not a new kinematic theory. It is the constant-acceleration model applied to vertical motion with a specific acceleration. The sign convention matters: if upward is positive, the acceleration is negative throughout the flight, even when the object is moving upward.

At the top of an upward toss, the velocity is momentarily zero. The acceleration is not zero. It remains downward, so the velocity immediately begins becoming negative after the top point.

## Assumptions and Limits

- Air resistance is neglected.
- The motion occurs close enough to Earth's surface that $g$ can be treated as constant.
- The object is modeled as a particle or particle-like body.
- The vertical coordinate convention must be chosen and kept consistent.

## Scope and Graph Links

This node depends on [[ch2-constant-acceleration|constant acceleration]] and prepares projectile motion, where horizontal motion and vertical free fall are combined.
`;

const GRAPHICAL_INTEGRATION_CONTENT = String.raw`# Graphical Integration in Motion Analysis

## Abstract

The conclusion of this node is that graph area reverses the derivative relationships of kinematics. Signed area under an acceleration-time graph gives change in velocity, and signed area under a velocity-time graph gives displacement.

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

## Logical Development

If acceleration is the derivative of velocity, then the accumulated signed area under an acceleration-time graph gives the change in velocity. If velocity is the derivative of position, then the accumulated signed area under a velocity-time graph gives the change in position.

The graph area carries units. Area under $a(t)$ has units of velocity because $(\mathrm{m/s^2})(\mathrm{s}) = \mathrm{m/s}$. Area under $v(t)$ has units of position because $(\mathrm{m/s})(\mathrm{s}) = \mathrm{m}$.

## Graph Interpretation

Area above the time axis contributes positively. Area below the time axis contributes negatively. Piecewise graphs can be analyzed by splitting the area into simple regions such as rectangles and triangles, then adding signed contributions.

## Scope and Graph Links

This node depends on [[ch2-instantaneous-velocity-speed|instantaneous velocity]] and [[ch2-acceleration|acceleration]]. It prepares later work-energy reasoning, impulse-momentum reasoning, and any topic where a rate graph must be accumulated into a physical change.
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
