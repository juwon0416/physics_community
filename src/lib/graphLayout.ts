
export interface SimulationNode {
    id: string;
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    fx?: number | null; // Fixed x
    fy?: number | null; // Fixed y
    type?: string;
}

export interface SimulationEdge {
    source: string;
    target: string;
}

export const runForceSimulation = (
    nodes: SimulationNode[],
    edges: SimulationEdge[],
    iterations: number = 300
): SimulationNode[] => {
    // Constants
    const REPULSION = 20000; // Increased repulsion to spread nodes out
    const SPRING_LENGTH = 150;
    const SPRING_STRENGTH = 0.05;
    const DAMPING = 0.9;
    const CENTER_STRENGTH = 0.01;

    // Initialize velocities if missing
    nodes.forEach(n => {
        n.vx = n.vx || 0;
        n.vy = n.vy || 0;

        // Randomize 0,0 positions to prevent singularities and stacking
        if (Math.abs(n.x) < 1 && Math.abs(n.y) < 1 && n.id !== 'root') {
            n.x = (Math.random() - 0.5) * 100;
            n.y = (Math.random() - 0.5) * 100;
        }
    });

    const nodeIdMap = new Map(nodes.map(n => [n.id, n]));

    for (let i = 0; i < iterations; i++) {
        // 1. Repulsion (Canvas-wide) - simplified O(N^2)
        for (let j = 0; j < nodes.length; j++) {
            const nodeA = nodes[j];
            for (let k = j + 1; k < nodes.length; k++) {
                const nodeB = nodes[k];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                let distSq = dx * dx + dy * dy;
                if (distSq === 0) {
                    distSq = 0.1; // Avoid division by zero
                    // Jitter
                }
                const dist = Math.sqrt(distSq);

                const force = REPULSION / (distSq + 100); // Softened repulsion
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (nodeA.fx === undefined) {
                    nodeA.vx! += fx;
                    nodeA.vy! += fy;
                }
                if (nodeB.fx === undefined) {
                    nodeB.vx! -= fx;
                    nodeB.vy! -= fy;
                }
            }
        }

        // 2. Attraction (Edges)
        edges.forEach(edge => {
            const source = nodeIdMap.get(edge.source);
            const target = nodeIdMap.get(edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Hooke's Law
            const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (source.fx === undefined) {
                source.vx! += fx;
                source.vy! += fy;
            }
            if (target.fx === undefined) {
                target.vx! -= fx;
                target.vy! -= fy;
            }
        });

        // 3. Center Gravity
        nodes.forEach(node => {
            if (node.fx !== undefined) return;
            const dx = 0 - node.x;
            const dy = 0 - node.y;
            node.vx! += dx * CENTER_STRENGTH;
            node.vy! += dy * CENTER_STRENGTH;
        });

        // 4. Update Positions
        nodes.forEach(node => {
            if (node.fx !== undefined) return;
            node.vx! *= DAMPING;
            node.vy! *= DAMPING;
            node.x += node.vx!;
            node.y += node.vy!;
        });
    }

    return nodes;
};
