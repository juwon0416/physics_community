import type { GraphModel, GraphNode } from './graphModel';
import { runForceSimulation } from './graphLayout';
import type { SimulationNode } from './graphLayout';

// Types for Layout Results
export interface PositionedNode extends GraphNode {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
}

// ---------------------------------------------------------------------------
// CHRONOLOGICAL LAYOUT
// ---------------------------------------------------------------------------

export const layoutChronological = (model: GraphModel, width: number = 2000): PositionedNode[] => {
    // defined constants
    const MIN_YEAR = 1600;
    const MAX_YEAR = 2030;
    const YEAR_RANGE = MAX_YEAR - MIN_YEAR;

    // Y-Positions for "Lanes"
    const LANE_HEIGHT = 150;
    const FIELD_ORDER = ['classical', 'electrodynamics', 'statistical', 'quantum'];

    // Coordinate System
    const ROOT_X = 50;
    const FIELD_X = 220; // Hub for fields
    const TIMELINE_X0 = 400; // Start of timeline data

    // Timeline Scale
    // Reserve space for headers
    const AVAILABLE_WIDTH = width - TIMELINE_X0 - 50;
    const PX_PER_YEAR = AVAILABLE_WIDTH / YEAR_RANGE;

    // Stacking Constants


    // Helper to bucket duplicates
    const yearBuckets: Record<string, number> = {};

    return model.nodes.map(node => {
        let x = 0;
        let y = 0;

        if (node.type === 'root') {
            x = ROOT_X;
            y = (FIELD_ORDER.length * LANE_HEIGHT) / 2 - LANE_HEIGHT / 2; // Roughly center vertically
        } else if (node.type === 'field') {
            const fieldIndex = FIELD_ORDER.indexOf(node.id);
            if (fieldIndex !== -1) {
                x = FIELD_X;
                y = fieldIndex * LANE_HEIGHT;
            } else {
                x = 0; y = 0;
            }
        } else if (node.type === 'topic') {
            // Determine Y based on field
            const fieldId = node.data?.fieldId;
            const fieldIndex = FIELD_ORDER.indexOf(fieldId);
            const laneY = fieldIndex !== -1 ? fieldIndex * LANE_HEIGHT : 0;

            // Determine X based on year
            const year = node.data?.year;
            if (year) {
                x = TIMELINE_X0 + (year - MIN_YEAR) * PX_PER_YEAR;

                // Handle Collisions: Stacking
                // Simple hash for collision key: "fieldId-year"
                // Using 10-year buckets for stacking might be safer if dense, but user asked for robust same-year.
                // Let's strict year for now, maybe fuzzy if needed later.
                const key = `${fieldId}-${year}`;
                const count = yearBuckets[key] || 0;
                yearBuckets[key] = count + 1;

                // Stacking Logic: Downwards or Alternating?
                // Visual preference: Stacking downwards from the lane center line or just simple vertical list.
                // Simple one-way stack prevents overriding the lane above/below.
                // Lane Height is 150. Node Height is ~80. STACK_DY is 50.
                // If we stack 3 deep: 0, 50, 100. Might encroach next lane.
                // Let's try alternating small shifts: 0, 25, -25, 50, -50?
                // Or just offset by index.

                // Let's go with "Alternating up/down" to center gravity on the timeline.
                // i=0 -> 0
                // i=1 -> 40
                // i=2 -> -40
                const direction = count % 2 === 0 ? -1 : 1;
                const magnitude = Math.ceil(count / 2) * 40; // slightly tighter step
                const offset = count === 0 ? 0 : direction * magnitude;

                y = laneY + offset;

            } else {
                // Unknown year
                x = width - 50;
                y = laneY;
            }
        } else {
            // Concepts or others
            x = 0; y = 0;
        }

        return { ...node, x, y };
    });
};

// ---------------------------------------------------------------------------
// NETWORK LAYOUT
// ---------------------------------------------------------------------------

export const layoutNetwork = (
    model: GraphModel,
    previousPositions: Record<string, { x: number, y: number }> = {}
): PositionedNode[] => {

    // 1. Convert to SimulationNodes
    const simNodes: SimulationNode[] = model.nodes.map(n => {
        const prev = previousPositions[n.id];
        return {
            id: n.id,
            // If we have a previous position, use it. Otherwise random or 0
            x: prev ? prev.x : (Math.random() - 0.5) * 50,
            y: prev ? prev.y : (Math.random() - 0.5) * 50,
            // Fix Query: Root should be center?
            fx: n.id === 'root' ? 0 : undefined,
            fy: n.id === 'root' ? 0 : undefined,
        };
    });

    // 2. Run Simulation (First pass or Tick?)
    // If we want a static layout, we run N iterations. 
    // If we want dynamic, we might strictly return initial positions and let the component run the loop.
    // Based on `GraphOverviewPage` refactor plan, we might want to just initialize here.

    // Let's run a short burst to establish structure if no previous positions exist.
    if (Object.keys(previousPositions).length === 0) {
        runForceSimulation(simNodes, model.edges, 300); // 300 iterations
    }

    // 3. Map back to PositionedNode
    return model.nodes.map(n => {
        const simNode = simNodes.find(sn => sn.id === n.id);
        return {
            ...n,
            x: simNode?.x || 0,
            y: simNode?.y || 0
        };
    });
};
