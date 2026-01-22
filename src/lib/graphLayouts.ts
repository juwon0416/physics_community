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
        let x = 0; let y = 0; let isPositioned = false;
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
            const fieldId = node.data?.fieldId;
            const fieldIndex = FIELD_ORDER.indexOf(fieldId);
            const laneY = fieldIndex !== -1 ? fieldIndex * LANE_HEIGHT : 0;
            const year = node.data?.year;
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

export const runForceSimulation = (
    nodes: SimulationNode[],
    edges: { source: string; target: string; type?: string }[],
    iterations: number = 300,
    nodeDataMap: Map<string, any>
): SimulationNode[] => {

    // Initialize velocities
    nodes.forEach(n => { n.vx = n.vx || 0; n.vy = n.vy || 0; });
    const nodeIdMap = new Map(nodes.map(n => [n.id, n]));
    const nodeCount = nodes.length;

    for (let i = 0; i < iterations; i++) {
        // 1. Repulsion
        for (let j = 0; j < nodeCount; j++) {
            const nodeA = nodes[j];
            for (let k = j + 1; k < nodeCount; k++) {
                const nodeB = nodes[k];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                let distSq = dx * dx + dy * dy;
                if (distSq === 0) distSq = 0.1;

                const force = PHYSICS.REPULSION / (distSq + 500);
                const dist = Math.sqrt(distSq);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (nodeA.fx === undefined) { nodeA.vx! += fx; nodeA.vy! += fy; }
                if (nodeB.fx === undefined) { nodeB.vx! -= fx; nodeB.vy! -= fy; }
            }
        }

        // 2. Spring Attraction
        edges.forEach(edge => {
            const source = nodeIdMap.get(edge.source);
            const target = nodeIdMap.get(edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Adjust length based on edge type or hierarchy
            let length = PHYSICS.SPRING_LENGTH;
            // Shorten implicit chains
            if (edge.type === 'run' || edge.type === 'hierarchy') length = 50;

            let strength = PHYSICS.SPRING_STRENGTH;

            const force = (dist - length) * strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (source.fx === undefined) { source.vx! += fx; source.vy! += fy; }
            if (target.fx === undefined) { target.vx! -= fx; target.vy! -= fy; }
        });

        // 3. Sector Restoration Force (The Wall)
        nodes.forEach(node => {
            if (node.fx !== undefined) return;

            // Identify Sector
            const data = nodeDataMap.get(node.id);
            let targetAngle: number | undefined;

            if (node.type === 'field') {
                targetAngle = FIELD_ANGLES[node.id];
            } else if (data?.fieldId && FIELD_ANGLES[data.fieldId] !== undefined) {
                targetAngle = FIELD_ANGLES[data.fieldId];
            }

            if (targetAngle !== undefined) {
                // Calculate current angle
                const currentAngle = Math.atan2(node.y, node.x);
                let diff = targetAngle - currentAngle;
                // Normalize diff to -PI, PI
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                // Apply tangential force to correct angle
                const distToCenter = Math.sqrt(node.x * node.x + node.y * node.y) || 1;

                // Force increases if deviation is high
                const restoreForce = diff * PHYSICS.SECTOR_STRENGTH * distToCenter;

                // Tangential unit vectors from (x,y): (-y, x) is +90deg (CCW)
                const tx = -node.y / distToCenter;
                const ty = node.x / distToCenter;

                node.vx! += tx * restoreForce * 0.1;
                node.vy! += ty * restoreForce * 0.1;
            }
        });

        // 4. Update
        nodes.forEach(node => {
            if (node.fx !== undefined) return;
            node.vx! *= PHYSICS.DAMPING;
            node.vy! *= PHYSICS.DAMPING;
            node.x += node.vx!;
            node.y += node.vy!;
        });
    }

    return nodes;
};

export const getChronologicalEdges = (model: GraphModel) => {
    const otherEdges = model.edges.filter(e => {
        const sourceNode = model.nodes.find(n => n.id === e.source);
        const targetNode = model.nodes.find(n => n.id === e.target);

        if (!sourceNode || !targetNode) return false;

        // 1. Remove explicit Field -> Topic edges (we replace them with our single link)
        const isFieldTopic = sourceNode.type === 'field' && targetNode.type === 'topic';

        // 2. Remove explicit Topic -> Topic edges (we replace them with chronological chain)
        // FIX: Only remove if BOTH are part of the backbone (have years) AND belong to the SAME Field.
        // - Same Field + Years: The backbone already connects them A->B->C. Explicit A->C creates a triangle. Remove it.
        // - Different Fields: This is a cross-reference (e.g. Quantum -> Classical). Keep it.
        // - Missing Years: This is a floating topic attached to a parent. Keep it.
        const isTopicTopic = sourceNode.type === 'topic' && targetNode.type === 'topic';
        if (isTopicTopic) {
            const bothHaveYears = sourceNode.data?.year && targetNode.data?.year;
            // Use loose comparison or strict? data.fieldId should be string.
            const sameField = sourceNode.data?.fieldId && targetNode.data?.fieldId &&
                (sourceNode.data.fieldId === targetNode.data.fieldId);

            if (bothHaveYears && sameField) return false;
            return true;
        }

        return !isFieldTopic;
    });

    const chainEdges: { source: string; target: string; type: string }[] = [];
    const topics = model.nodes.filter(n => n.type === 'topic' && n.data?.fieldId && n.data?.year);
    const topicsByField: Record<string, typeof topics> = {};
    topics.forEach(t => {
        const fid = t.data!.fieldId!;
        if (!topicsByField[fid]) topicsByField[fid] = [];
        topicsByField[fid].push(t);
    });

    Object.entries(topicsByField).forEach(([fieldId, fieldTopics]) => {
        fieldTopics.sort((a, b) => parseInt(a.data!.year!) - parseInt(b.data!.year!));
        if (fieldTopics.length > 0) {
            chainEdges.push({ source: fieldId, target: fieldTopics[0].id, type: 'hierarchy' });
        }
        for (let i = 0; i < fieldTopics.length - 1; i++) {
            chainEdges.push({ source: fieldTopics[i].id, target: fieldTopics[i + 1].id, type: 'run' });
        }
    });

    return [...otherEdges, ...chainEdges];
};

export const layoutNetwork = (
    model: GraphModel,
    previousPositions: Record<string, { x: number, y: number }> = {}
): PositionedNode[] => {

    const nodeDataMap = new Map(model.nodes.map(n => [n.id, n.data]));

    const simNodes: SimulationNode[] = model.nodes.map(n => {
        const prev = previousPositions[n.id];
        let x = 0; let y = 0;
        let fx = undefined; let fy = undefined;

        // Initialization Logic for Sector Separation
        if (n.id === 'root') {
            fx = 0; fy = 0;
        } else {
            let angle = Math.random() * Math.PI * 2;
            let radius = 200 + Math.random() * 200;

            const fieldId = n.data?.fieldId;
            if (n.type === 'field' && FIELD_ANGLES[n.id] !== undefined) {
                angle = FIELD_ANGLES[n.id];
                radius = 300;
                fx = Math.cos(angle) * radius; // Anchor fields strictly
                fy = Math.sin(angle) * radius;
            } else if (fieldId && FIELD_ANGLES[fieldId] !== undefined) {
                angle = FIELD_ANGLES[fieldId];
                if (n.type === 'topic') {
                    // Spread topics out along the ray
                    const year = parseInt(n.data?.year || '1900');
                    const offset = (year - 1600) / 400; // 0..1
                    radius = 350 + offset * 600;
                } else {
                    radius = 400 + Math.random() * 200; // Concepts further out
                }
                const jitter = (Math.random() - 0.5) * 50;
                x = Math.cos(angle) * radius - Math.sin(angle) * jitter;
                y = Math.sin(angle) * radius + Math.cos(angle) * jitter;
            } else {
                x = (Math.random() - 0.5) * 1000;
                y = (Math.random() - 0.5) * 1000;
            }
        }

        if (fx === undefined && prev) { x = prev.x; y = prev.y; }
        if (fx !== undefined) { x = fx; y = fy; }

        const sn: any = { id: n.id, x, y, fx, fy, vx: 0, vy: 0 };
        sn.type = n.type;
        return sn;
    });

    const simulationEdges = getChronologicalEdges(model);

    // Pass nodeDataMap to simulation for sector lookup
    runForceSimulation(simNodes, simulationEdges, 500, nodeDataMap);

    return model.nodes.map(n => {
        const simNode = simNodes.find(sn => sn.id === n.id);
        return { ...n, x: simNode?.x || 0, y: simNode?.y || 0 };
    });
};
