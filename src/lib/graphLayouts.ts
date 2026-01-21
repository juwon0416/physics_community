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

    // Scale X
    // Reserve padding
    const PADDING_X = 100;
    const AVAILABLE_WIDTH = width - (PADDING_X * 2);
    const PX_PER_YEAR = AVAILABLE_WIDTH / YEAR_RANGE;

    // Helper to bucket duplicates
    const yearBuckets: Record<string, number> = {};

    return model.nodes.map(node => {
        let x = 0;
        let y = 0;

        if (node.type === 'root') {
            x = width / 2; // Center? Or far left? Let's put Root far left or hidden
            y = -100; // Above everything
        } else if (node.type === 'field') {
            const fieldIndex = FIELD_ORDER.indexOf(node.id);
            if (fieldIndex !== -1) {
                x = 50; // Fields act as labels on the left
                y = fieldIndex * LANE_HEIGHT;
            } else {
                // Fallback
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
                x = PADDING_X + (year - MIN_YEAR) * PX_PER_YEAR;

                // Handle Collisions: Stacking
                // Simple hash for collision key: "fieldId-year"
                const key = `${fieldId}-${year}`;
                const count = yearBuckets[key] || 0;
                yearBuckets[key] = count + 1;

                // Alternate down/up or just down
                // e.g. 0 -> 0, 1 -> 40, 2 -> -40...
                const offset = count === 0 ? 0 : (count % 2 === 1 ? 40 * Math.ceil(count / 2) : -40 * (count / 2));
                y = laneY + offset;

            } else {
                // Unknown year
                x = width - 50; // Far right?
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
