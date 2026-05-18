import type { FileOntologyEdge, FileOntologyFile } from '../lib/fileOntology';

export const FUNDAMENTALS_CHAPTER_2_SOURCE =
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2: Motion Along a Straight Line; OpenStax University Physics Volume 1, Chapter 3 Kinematics; MIT OpenCourseWare 8.01SC, Week 1 Kinematics and Chapter 4 One Dimensional Kinematics.';

const CHAPTER_2_REFERENCES = [
    'Halliday, Resnick, and Walker, Fundamentals of Physics, Chapter 2: Motion Along a Straight Line.',
    'OpenStax University Physics Volume 1, Chapter 3: Kinematics.',
    'MIT OpenCourseWare 8.01SC, Week 1 Kinematics and Chapter 4: One Dimensional Kinematics.',
];

function referencesBlock() {
    return [
        '## References',
        '',
        ...CHAPTER_2_REFERENCES.map((reference) => `- ${reference}`),
    ].join('\n');
}

const CHAPTER_2_OVERVIEW = String.raw`# Fundamentals Chapter 2: Motion Along a Straight Line

## Abstract

The conclusion of this chapter-level file node is that one-dimensional kinematics reconstructs motion from three nested time functions: [[ch2-position-displacement-average-velocity|position]], [[ch2-instantaneous-velocity-speed|velocity]], and [[ch2-acceleration|acceleration]]. Once position is modeled as a signed measured function \(x(t)\), velocity is the local rate of change of that function, acceleration is the local rate of change of velocity, and constant-acceleration motion is the special case where those derivative relations integrate into a compact equation family.

The deeper learning result is that kinematics is not a memorized list of formulas. It is a reversible structure: slopes move from position to velocity to acceleration, while signed areas move from acceleration back to velocity and displacement.

## 1. The One-Dimensional Model

Chapter 2 begins by restricting motion to a particle-like body along a straight coordinate axis. That restriction is powerful because direction can be represented by sign before full vector notation is introduced. The position coordinate \(x\) is not just a number on a page; it is a measured length relative to an origin, so this chapter silently inherits the unit discipline of [[fundamentals-ch1-measurement|measurement]].

The basic finite change is:

$$
\Delta x = x_2 - x_1
$$

This expression already contains the key convention: displacement is final position minus initial position, not total path length.

## 2. Rates of Motion

Average velocity is the finite rate:

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t}
$$

The symbol \(\Delta x\) refers back to [[ch2-position-displacement-average-velocity|position and displacement]], while \(\Delta t\) carries the measured time interval. Instantaneous velocity then asks what happens when the interval shrinks:

$$
v = \lim_{\Delta t \to 0}\frac{\Delta x}{\Delta t} = \frac{dx}{dt}
$$

This is why velocity belongs between position and acceleration. It is not a new primitive; it is the local change rate of position.

## 3. Change of a Rate

Acceleration is defined by applying the same rate idea one level higher:

$$
a = \frac{dv}{dt} = \frac{d^2x}{dt^2}
$$

The symbol \(v\) is [[ch2-instantaneous-velocity-speed|instantaneous velocity]]. The second derivative form points back to \(x(t)\), the [[ch2-position-displacement-average-velocity|position]] function.

## 4. Constant Acceleration as a Special Case

If acceleration is constant over the interval, the derivative definitions integrate into:

$$
v = v_0 + at
$$

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x - x_0)
$$

These equations are valid as a family only under the constant-acceleration assumption. They are not unrelated formulas; they are consequences of integrating [[ch2-acceleration|acceleration]] and then integrating [[ch2-instantaneous-velocity-speed|velocity]].

## 5. Free Fall and Signed Direction

Near Earth's surface, ideal free fall is the vertical constant-acceleration case. If upward is positive:

$$
a = -g,\qquad g = 9.8\ \mathrm{m/s^2}
$$

The magnitude \(g\) is positive, but the acceleration component is negative because the acceleration points downward. This is a sign convention inside [[ch2-free-fall-acceleration|free fall]], not a new law of algebra.

## 6. Accumulation Reverses Differentiation

The derivative chain also runs backward through signed area:

$$
v_1 - v_0 = \int_{t_0}^{t_1} a(t)\,dt
$$

$$
x_1 - x_0 = \int_{t_0}^{t_1} v(t)\,dt
$$

These relations belong to [[ch2-graphical-integration-motion-analysis|graphical integration]]. They let the learner recover a physical change from a rate graph without turning this overview into a full treatment of later energy or momentum topics.

${referencesBlock()}
`;

const POSITION_DISPLACEMENT_CONTENT = String.raw`# Position, Displacement, and Average Velocity

## Abstract

The conclusion of this file node is that displacement and average velocity are signed quantities built from position change, while distance and average speed ignore direction. This distinction is the first structural reason that one-dimensional kinematics cannot be reduced to ordinary "how far" and "how fast" language.

## 1. Position on a Measured Axis

Position \(x\) is the location of a particle relative to a chosen origin on a scaled line. The word "scaled" matters: the coordinate has units supplied by [[fundamentals-ch1-measurement|measurement]], so \(x=2\ \mathrm{m}\) and \(x=2\ \mathrm{cm}\) are different physical claims.

The restriction to one straight axis lets direction be represented by sign. Positive and negative are not moral labels or indications of size; they state which side of the origin or which direction along the axis is being used.

## 2. Displacement and Distance

Displacement is final position minus initial position:

$$
\Delta x = x_2 - x_1
$$

Only the endpoints enter this equation. The path traveled between the endpoints affects distance, but it does not determine displacement. A round trip can therefore have nonzero distance but zero displacement.

## 3. Average Velocity and Average Speed

Average velocity is signed displacement per elapsed time:

$$
v_{\mathrm{avg}} = \frac{\Delta x}{\Delta t} = \frac{x_2 - x_1}{t_2 - t_1}
$$

Average speed uses total distance instead:

$$
s_{\mathrm{avg}} = \frac{\mathrm{total\ distance}}{\Delta t}
$$

The difference matters because average velocity keeps direction and average speed discards it. This is why \(v_{\mathrm{avg}}\) prepares [[ch2-instantaneous-velocity-speed|instantaneous velocity]], while average speed is only a magnitude summary.

## 4. Secant Slope Meaning

On an \(x(t)\) graph, average velocity is the slope of the secant line between the two endpoint events:

$$
\mathrm{slope}=\frac{\mathrm{rise}}{\mathrm{run}}=\frac{\Delta x}{\Delta t}
$$

When the interval \(\Delta t\) shrinks, this secant-slope idea becomes the tangent-slope idea used by [[ch2-instantaneous-velocity-speed|instantaneous velocity]].

${referencesBlock()}
`;

const INSTANTANEOUS_VELOCITY_CONTENT = String.raw`# Instantaneous Velocity and Speed

## Abstract

The conclusion of this file node is that instantaneous velocity is the derivative of [[ch2-position-displacement-average-velocity|position]] with respect to time, and instantaneous speed is its magnitude. Velocity keeps the sign of motion along the one-dimensional axis; speed discards that sign.

## 1. From Average Velocity to an Instant

Average velocity over a finite interval comes from [[ch2-position-displacement-average-velocity|displacement]] per elapsed time. Instantaneous velocity asks for the same rate at one event rather than across a wide interval.

The limiting definition is:

$$
v = \lim_{\Delta t \to 0}\frac{\Delta x}{\Delta t} = \frac{dx}{dt}
$$

The symbol \(\Delta x\) is the finite displacement from the position node. The derivative \(dx/dt\) says that \(v\) is the local rate at which the position function \(x(t)\) changes.

## 2. Tangent Slope Meaning

The finite secant slope becomes a tangent slope when the time interval shrinks. A positive tangent slope means positive velocity, a negative tangent slope means negative velocity, and a horizontal tangent means zero velocity at that instant.

On a graph of [[ch2-position-displacement-average-velocity|position as a time function]], the derivative is the tangent slope at the event.

## 3. Speed as Magnitude

Instantaneous speed is:

$$
\mathrm{speed}=|v|
$$

The absolute value removes direction. Speed is useful for everyday comparison, but it is less complete than velocity whenever the sign of motion matters. This distinction is necessary before [[ch2-acceleration|acceleration]] can be understood, because acceleration depends on changes in velocity, not merely changes in speed.

${referencesBlock()}
`;

const ACCELERATION_CONTENT = String.raw`# Acceleration

## Abstract

The conclusion of this file node is that acceleration is the time derivative of [[ch2-instantaneous-velocity-speed|velocity]] and the second derivative of [[ch2-position-displacement-average-velocity|position]]. In one dimension its sign gives direction along the axis, not a universal label for "speeding up" or "slowing down."

## 1. Definitions and Symbols

- \(a_{\mathrm{avg}}\): average acceleration, defined from a change in [[ch2-instantaneous-velocity-speed|velocity]] over a measured time interval.
- \(a\): instantaneous acceleration.
- \(v(t)\): [[ch2-instantaneous-velocity-speed|velocity]] as a function of time.
- \(x(t)\): [[ch2-position-displacement-average-velocity|position]] as a function of time.

## 2. Core Equations

Average acceleration is:

$$
a_{\mathrm{avg}} = \frac{\Delta v}{\Delta t} = \frac{v_2 - v_1}{t_2 - t_1}
$$

Instantaneous acceleration is the derivative of velocity:

$$
a = \frac{dv}{dt}
$$

Since [[ch2-instantaneous-velocity-speed|velocity]] is already \(dx/dt\), acceleration is also the second derivative of [[ch2-position-displacement-average-velocity|position]]:

$$
a = \frac{d^2x}{dt^2}
$$

## 3. Logical Development

Velocity describes the rate at which position changes. Acceleration describes the rate at which velocity changes. This means acceleration is one derivative beyond velocity and two derivatives beyond position.

The sign of acceleration is a direction along the chosen axis. If velocity and acceleration have the same sign, the speed increases. If they have opposite signs, the speed decreases. If velocity crosses zero, the same acceleration may describe slowing before the turn and speeding after the turn.

## 4. Constant and Nonconstant Cases

When \(a\) remains fixed during the interval, the motion falls into [[ch2-constant-acceleration|constant acceleration]]. When \(a\) varies, the derivative definition still holds, but the simple constant-acceleration equation family no longer applies without integration or a more detailed model.

${referencesBlock()}
`;

const CONSTANT_ACCELERATION_CONTENT = String.raw`# Constant Acceleration

## Abstract

The conclusion of this file node is that constant acceleration turns the derivative definitions of motion into a compact equation family. The equations are powerful because one fixed acceleration lets [[ch2-instantaneous-velocity-speed|velocity]] grow linearly with time and [[ch2-position-displacement-average-velocity|position]] grow quadratically with time.

## 1. Assumption and Symbols

The defining assumption is \(a=\mathrm{constant}\), where \(a\) is [[ch2-acceleration|acceleration]]. The remaining symbols are:

- \(x_0\): initial [[ch2-position-displacement-average-velocity|position]].
- \(v_0\): initial [[ch2-instantaneous-velocity-speed|velocity]].
- \(x\): position at a later time.
- \(v\): velocity at a later time.
- \(t\): elapsed time.

## 2. Core Equation Family

The velocity equation is:

$$
v = v_0 + at
$$

The position equation is:

$$
x - x_0 = v_0t + \frac{1}{2}at^2
$$

Eliminating \(t\) gives:

$$
v^2 = v_0^2 + 2a(x - x_0)
$$

Two useful companion forms are:

$$
x - x_0 = \frac{1}{2}(v_0 + v)t
$$

$$
x - x_0 = vt - \frac{1}{2}at^2
$$

## 3. Why the Equations Follow

Starting from \(a=dv/dt\), constant \(a\) integrates to \(v=v_0+at\). Starting from [[ch2-instantaneous-velocity-speed|velocity]] as \(v=dx/dt\), substituting that velocity function and integrating gives \(x-x_0=v_0t+\frac{1}{2}at^2\).

The practical skill is not memorizing all five equations in isolation. It is checking whether acceleration is truly constant and then choosing the equation whose variables match the problem. [[ch2-free-fall-acceleration|Free fall]] is the first major application because the vertical acceleration can often be treated as constant near Earth's surface.

${referencesBlock()}
`;

const FREE_FALL_CONTENT = String.raw`# Free-Fall Acceleration

## Abstract

The conclusion of this file node is that ideal free fall near Earth's surface is [[ch2-constant-acceleration|constant-acceleration]] motion with vertical [[ch2-acceleration|acceleration]] directed downward. If upward is chosen positive, the acceleration component is \(a=-g\) throughout the flight, even at the top of an upward toss.

## 1. Model Assumptions

Free fall is not a new kinematic theory. It is [[ch2-constant-acceleration|constant acceleration]] applied to vertical motion under gravity. The model assumes:

- air resistance is neglected;
- the motion occurs close enough to Earth's surface that \(g\) is approximately constant;
- the object can be modeled as a particle or particle-like body;
- a vertical coordinate convention has been chosen and kept consistent.

## 2. Symbols and Equations

The vertical coordinate is \(y\), the vertical velocity is \(v\), and the magnitude of gravitational acceleration near Earth's surface is:

$$
g = 9.8\ \mathrm{m/s^2}
$$

If upward is positive:

$$
a = -g
$$

The corresponding constant-acceleration equations are:

$$
v = v_0 - gt
$$

$$
y - y_0 = v_0t - \frac{1}{2}gt^2
$$

The \(v\) in these equations is [[ch2-instantaneous-velocity-speed|velocity]], and \(a=-g\) is the vertical component of [[ch2-acceleration|acceleration]].

## 3. Sign Discipline

At the top of an upward toss, the velocity is momentarily zero. The acceleration is not zero. It remains downward, so the velocity immediately begins becoming negative after the top point.

This sign discipline is the main conceptual burden of the node. The learner should not memorize \(a=-g\) as a magic replacement rule; it follows from the chosen positive direction and the downward acceleration vector.

${referencesBlock()}
`;

const GRAPHICAL_INTEGRATION_CONTENT = String.raw`# Graphical Integration in Motion Analysis

## Abstract

The conclusion of this file node is that graph area reverses the derivative relationships of kinematics. Signed area under an [[ch2-acceleration|acceleration]]-time graph gives change in [[ch2-instantaneous-velocity-speed|velocity]], and signed area under a velocity-time graph gives [[ch2-position-displacement-average-velocity|displacement]].

## 1. Accumulating Acceleration

Because [[ch2-acceleration|acceleration]] is \(dv/dt\), accumulating acceleration over time gives a change in [[ch2-instantaneous-velocity-speed|velocity]]:

$$
v_1 - v_0 = \int_{t_0}^{t_1} a(t)\,dt
$$

For a graph, this integral is signed area. Area above the time axis contributes positively; area below it contributes negatively.

## 2. Accumulating Velocity

Because [[ch2-instantaneous-velocity-speed|velocity]] is \(dx/dt\), accumulating velocity over time gives displacement:

$$
x_1 - x_0 = \int_{t_0}^{t_1} v(t)\,dt
$$

Here \(x_1-x_0\) is [[ch2-position-displacement-average-velocity|displacement]], not total distance. That distinction is why the sign of area matters.

## 3. Units and Piecewise Regions

The area under \(a(t)\) has units of velocity because \((\mathrm{m/s^2})(\mathrm{s})=\mathrm{m/s}\). The area under \(v(t)\) has units of position because \((\mathrm{m/s})(\mathrm{s})=\mathrm{m}\).

When the graph is piecewise simple, rectangles and triangles can be added as signed contributions. This keeps the file focused on accumulation; later work-energy or impulse-momentum interpretations should live in their own nodes.

${referencesBlock()}
`;

export const FUNDAMENTALS_CHAPTER_2_FILES: FileOntologyFile[] = [
    {
        id: 'fundamentals-ch2-motion-along-straight-line',
        title: 'Fundamentals Chapter 2: Motion Along a Straight Line',
        summary:
            'Multi-source chapter-level map for one-dimensional kinematics as a derivative, integral, graph, and constant-acceleration structure.',
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
