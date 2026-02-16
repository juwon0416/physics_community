import type { GraphModel, GraphNode } from './graphModel';
import type { SimulationNode } from './graphLayout';

// Physics Configuration
// Physics Configuration
const PHYSICS = {
    REPULSION: 40000,          // Reduced from 150k to prevent node explosion
    SPRING_LENGTH: 80,         // Slightly longer to relax
    SPRING_STRENGTH: 0.15,     // Softer springs
    SECTOR_STRENGTH: 0.1,      // Reduced sector force
    DAMPING: 0.90,             // Higher damping for stability
    GRAVITY: 0.05              // Stronger gravity to keep orphans close
};

// Angular Assignments (Fixed Sectors)
const FIELD_ANGLES: Record<string, number> = {
    'classical': 0,                   // 0 deg (East)
    'electrodynamics': Math.PI * 0.4, // 72 deg
    'statistical': Math.PI * 0.8,     // 144 deg
    'quantum': Math.PI * 1.2,         // 216 deg
    'mathematical-physics': Math.PI * 1.6 // 288 deg
};

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
    console.log("layoutChronological called with", model.nodes.length, "nodes");
    const MIN_YEAR = 1600;
    const MAX_YEAR = 2030;
    const YEAR_RANGE = MAX_YEAR - MIN_YEAR;
    const LANE_HEIGHT = 150;
    const FIELD_ORDER = ['classical', 'electrodynamics', 'statistical', 'quantum'];
    const ROOT_X = 50;
    const FIELD_X = 220;
    const TIMELINE_X0 = 400;
    const AVAILABLE_WIDTH = width - TIMELINE_X0 - 50;
    const PX_PER_YEAR = AVAILABLE_WIDTH / YEAR_RANGE;
    const yearBuckets: Record<string, number> = {};

    const base = model.nodes.map(node => {
        let x = 0; let y = 0;
        if (node.type === 'root') {
            x = ROOT_X;
            y = (FIELD_ORDER.length * LANE_HEIGHT) / 2 - LANE_HEIGHT / 2;
        } else if (node.type === 'field') {
            const fieldIndex = FIELD_ORDER.indexOf(node.id);
            if (fieldIndex !== -1) {
                x = FIELD_X;
                y = fieldIndex * LANE_HEIGHT;
            }
        } else if (node.type === 'topic') {
            const fieldId = node.data?.fieldId as string;
            const fieldIndex = FIELD_ORDER.indexOf(fieldId);
            const laneY = fieldIndex !== -1 ? fieldIndex * LANE_HEIGHT : 0;
            const year = node.data?.year as number;
            if (year) {
                x = TIMELINE_X0 + (year - MIN_YEAR) * PX_PER_YEAR;
                const key = `${fieldId}-${year}`;
                const count = yearBuckets[key] || 0;
                yearBuckets[key] = count + 1;
                const direction = count % 2 === 0 ? -1 : 1;
                const magnitude = Math.ceil(count / 2) * 40;
                const offset = count === 0 ? 0 : direction * magnitude;
                y = laneY + offset;
            } else {
                x = width - 50;
                y = laneY;
            }
        }
        return { ...node, x, y };
    });

    const byId = new Map(base.map(n => [n.id, n]));
    const childCount = new Map<string, number>();
    const relevantEdges = model.edges.filter(e =>
        e.type === 'mentions' || (e.type === 'hierarchy' && model.nodes.find(n => n.id === e.source)?.type === 'topic')
    );
    relevantEdges.sort((a, b) => a.target.localeCompare(b.target));

    for (const e of relevantEdges) {
        const src = byId.get(e.source);
        const tgt = byId.get(e.target);
        if (!src || !tgt || (tgt.type !== 'concept' && tgt.type !== 'section')) continue;
        if (tgt.x !== 0 || tgt.y !== 0) continue;

        const k = e.source;
        const idx = childCount.get(k) ?? 0;
        childCount.set(k, idx + 1);
        const STACK_PER_COL = 6;
        const col = Math.floor(idx / STACK_PER_COL);
        const row = idx % STACK_PER_COL;
        const dx = 140 + col * 120;
        const dy = (row - (STACK_PER_COL - 1) / 2) * 35;
        byId.set(tgt.id, { ...tgt, x: (src.x ?? 0) + dx, y: (src.y ?? 0) + dy });
    }
    return Array.from(byId.values()) as PositionedNode[];
};

// ---------------------------------------------------------------------------
// NETWORK LAYOUT (STRICT SECTOR PHYSICS)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// NETWORK LAYOUT (RADIAL / STARBURST PHYSICS)
// ---------------------------------------------------------------------------

export const runForceSimulation = (
    nodes: SimulationNode[],
    edges: { source: string; target: string; type?: string }[],
    iterations: number = 300,
    nodeDataMap: Map<string, unknown>
): SimulationNode[] => {
    console.log(`Starting Force Simulation with ${nodes.length} nodes and ${edges.length} edges`);

    // Initialize velocities
    nodes.forEach(n => { n.vx = n.vx || 0; n.vy = n.vy || 0; });
    const nodeIdMap = new Map(nodes.map(n => [n.id, n]));
    const nodeCount = nodes.length;

    // Mathematical Physics Special Handling
    // We want Math Physics to be a "Star" - central node with children radiating

    for (let i = 0; i < iterations; i++) {
        // 1. Repulsion (Global)
        for (let j = 0; j < nodeCount; j++) {
            const nodeA = nodes[j];
            for (let k = j + 1; k < nodeCount; k++) {
                const nodeB = nodes[k];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                let distSq = dx * dx + dy * dy;
                if (distSq === 0) distSq = 0.1;

                // Stronger repulsion to separate clusters
                const force = (PHYSICS.REPULSION * 1.5) / (distSq + 200);
                const dist = Math.sqrt(distSq);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (nodeA.fx === undefined) { nodeA.vx! += fx; nodeA.vy! += fy; }
                if (nodeB.fx === undefined) { nodeB.vx! -= fx; nodeB.vy! -= fy; }
            }
        }

        // 2. Spring Attraction (Edges)
        edges.forEach(edge => {
            const source = nodeIdMap.get(edge.source);
            const target = nodeIdMap.get(edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            let length = PHYSICS.SPRING_LENGTH;
            // Tighter springs for hierarchy to keep children close to parents (Starburst)
            if (edge.type === 'hierarchy' || edge.type === 'run') length = 40;

            // Mathematical Physics children: Allow slightly more spread but strict radial pull
            if (source.id === 'mathematical-physics' || target.id === 'mathematical-physics') {
                length = 100;
            }

            const strength = PHYSICS.SPRING_STRENGTH * 1.2; // Stiffer springs

            const force = (dist - length) * strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (source.fx === undefined) { source.vx! += fx; source.vy! += fy; }
            if (target.fx === undefined) { target.vx! -= fx; target.vy! -= fy; }
        });

        // 3. Radial / Sector Forces
        nodes.forEach(node => {
            if (node.fx !== undefined) return;

            // Root Gravity (Pull to center)
            const distToCenter = Math.sqrt(node.x * node.x + node.y * node.y) || 1;
            const gravityStrength = 0.02;
            node.vx! -= (node.x / distToCenter) * gravityStrength * distToCenter;
            node.vy! -= (node.y / distToCenter) * gravityStrength * distToCenter;

            // Identify Sector Preference
            const data = nodeDataMap.get(node.id) as { fieldId?: string } | undefined;
            let targetAngle: number | undefined;

            if (node.type === 'field' && FIELD_ANGLES[node.id] !== undefined) {
                targetAngle = FIELD_ANGLES[node.id];
            } else if (data?.fieldId && FIELD_ANGLES[data.fieldId] !== undefined) {
                targetAngle = FIELD_ANGLES[data.fieldId];
            } else if (node.id === 'root') {
                // Root stays at 0,0
            }

            if (targetAngle !== undefined) {
                const currentAngle = Math.atan2(node.y, node.x);
                let diff = targetAngle - currentAngle;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                const restoreForce = diff * PHYSICS.SECTOR_STRENGTH * 2.0; // Stronger sector enforcement

                // Tangential force
                const tx = -node.y / distToCenter;
                const ty = node.x / distToCenter;

                node.vx! += tx * restoreForce;
                node.vy! += ty * restoreForce;
            }
        });

        // 4. Update Positions
        nodes.forEach(node => {
            if (node.fx !== undefined) return;
            node.vx! *= PHYSICS.DAMPING;
            node.vy! *= PHYSICS.DAMPING;
            node.x += node.vx!;
            node.y += node.vy!;
        });
    }

    console.log("Force Simulation Complete. First Node Stats:", nodes[0]);
    return nodes;
};

export const getChronologicalEdges = (model: GraphModel) => {
    // 1. Keep non-topic/non-hierarchical edges (like mentions that cross fields)
    const otherEdges = model.edges.filter(e => {
        const sourceNode = model.nodes.find(n => n.id === e.source);
        const targetNode = model.nodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) return false;

        // Remove standard hierarchy edges that we will re-generate as a chain
        if (sourceNode.type === 'field' && targetNode.type === 'topic') return false;
        if (sourceNode.type === 'topic' && targetNode.type === 'topic' &&
            sourceNode.data?.fieldId === targetNode.data?.fieldId &&
            sourceNode.data?.year && targetNode.data?.year) return false;

        return true;
    });

    const chainEdges: { source: string; target: string; type: 'temporal' | 'hierarchy' }[] = [];
    const topics = model.nodes.filter(n => n.type === 'topic' && n.data?.fieldId && n.data?.year);

    // Group by field
    const topicsByField: Record<string, typeof topics> = {};
    topics.forEach(t => {
        const fid = t.data!.fieldId as string;
        if (!topicsByField[fid]) topicsByField[fid] = [];
        topicsByField[fid].push(t);
    });

    // Create Chain: Field -> Topic (Year 1) -> Topic (Year 2) -> ...
    Object.entries(topicsByField).forEach(([fieldId, fieldTopics]) => {
        // Sort effectively by year
        fieldTopics.sort((a, b) => parseInt(a.data!.year as string) - parseInt(b.data!.year as string));

        if (fieldTopics.length > 0) {
            // Connect Field to First Topic
            chainEdges.push({ source: fieldId, target: fieldTopics[0].id, type: 'hierarchy' });
        }

        // Connect Topic i to Topic i+1
        for (let i = 0; i < fieldTopics.length - 1; i++) {
            chainEdges.push({ source: fieldTopics[i].id, target: fieldTopics[i + 1].id, type: 'temporal' });
        }
    });

    return [...otherEdges, ...chainEdges];
};

export const layoutNetwork = (
    model: GraphModel,
    previousPositions: Record<string, { x: number, y: number }> = {}
): PositionedNode[] => {
    console.log("layoutNetwork called");

    const nodeDataMap = new Map(model.nodes.map(n => [n.id, n.data]));

    // Initialize nodes with radial preference
    const simNodes: SimulationNode[] = model.nodes.map(n => {
        const prev = previousPositions[n.id];
        let x = 0; let y = 0;
        let fx = undefined; let fy = undefined;

        if (n.id === 'root') {
            fx = 0; fy = 0;
        } else {
            // Start with a rough radial layout
            let angle = Math.random() * Math.PI * 2;
            let radius = 100 + Math.random() * 300;

            const fieldId = (n.data as any)?.fieldId;
            if (n.type === 'field' && FIELD_ANGLES[n.id] !== undefined) {
                angle = FIELD_ANGLES[n.id];
                radius = 250;
            } else if (fieldId && FIELD_ANGLES[fieldId] !== undefined) {
                angle = FIELD_ANGLES[fieldId];
                // Math Physics Starburst initialization
                if (fieldId === 'mathematical-physics') {
                    // Random scatter around the angle for "burst" look
                    const jitter = (Math.random() - 0.5) * 1.5;
                    angle += jitter;
                    radius = 400 + Math.random() * 200;
                }
            }

            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius;
        }

        if (fx === undefined && prev) { x = prev.x; y = prev.y; }
        if (fx !== undefined && fy !== undefined) { x = fx; y = fy; }

        const sn: SimulationNode = { id: n.id, x, y, fx, fy, vx: 0, vy: 0, type: n.type };
        return sn;
    });

    // Use our chain edges for the simulation structure
    const simulationEdges = getChronologicalEdges(model);

    runForceSimulation(simNodes, simulationEdges, 500, nodeDataMap);

    return model.nodes.map(n => {
        const simNode = simNodes.find(sn => sn.id === n.id);
        return { ...n, x: simNode?.x || 0, y: simNode?.y || 0 };
    });
};
