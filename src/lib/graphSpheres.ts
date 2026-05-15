import type { GraphNode } from './graphModel';

export type GraphSphereNodeType = 'root' | 'field';

export interface GraphSpherePosition {
    x: number;
    y: number;
    z: number;
}

export interface GraphSphereConfig {
    id: string;
    label: string;
    nodeType: GraphSphereNodeType;
    radius: number;
    position: GraphSpherePosition;
    flatWidth: number;
    flatHeight: number;
    sortOrder: number;
    bindingKey: string | null;
}

type SphereDataShape = {
    radius?: unknown;
    position?: unknown;
    flatWidth?: unknown;
    flatHeight?: unknown;
    sortOrder?: unknown;
    bindingKey?: unknown;
};

const DEFAULT_FLAT_WIDTH = 54;
const DEFAULT_FLAT_HEIGHT = 28;

const DEFAULT_GRAPH_SPHERES: GraphSphereConfig[] = [
    {
        id: 'root',
        label: 'PHYSICS',
        nodeType: 'root',
        radius: 12,
        position: { x: 0, y: 0, z: 0 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 0,
        bindingKey: null,
    },
    {
        id: 'quantum',
        label: 'QUANTUM\nMECHANICS',
        nodeType: 'field',
        radius: 7,
        position: { x: -22, y: 12, z: -10 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 1,
        bindingKey: 'quantum',
    },
    {
        id: 'classical',
        label: 'CLASSICAL\nMECHANICS',
        nodeType: 'field',
        radius: 8,
        position: { x: 24, y: -10, z: 5 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 2,
        bindingKey: 'classical',
    },
    {
        id: 'statistical',
        label: 'STATISTICAL\nMECHANICS',
        nodeType: 'field',
        radius: 5.5,
        position: { x: -15, y: -18, z: -25 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 3,
        bindingKey: 'statistical',
    },
    {
        id: 'electrodynamics',
        label: 'ELECTRO\nDYNAMICS',
        nodeType: 'field',
        radius: 4.5,
        position: { x: 18, y: 20, z: -15 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 4,
        bindingKey: 'electrodynamics',
    },
    {
        id: 'mathematical-physics',
        label: 'MATHEMATICAL\nPHYSICS',
        nodeType: 'field',
        radius: 6,
        position: { x: 0, y: 25, z: -20 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 5,
        bindingKey: 'mathematical-physics',
    },
    {
        id: 'semiconductor-physics',
        label: 'SEMICONDUCTOR\nPHYSICS',
        nodeType: 'field',
        radius: 5.2,
        position: { x: 28, y: 8, z: -24 },
        flatWidth: DEFAULT_FLAT_WIDTH,
        flatHeight: DEFAULT_FLAT_HEIGHT,
        sortOrder: 6,
        bindingKey: 'semiconductor-physics',
    },
];

const DEFAULT_GRAPH_SPHERES_BY_ID = new Map(
    DEFAULT_GRAPH_SPHERES.map((config) => [config.id, config]),
);

function getNodeDataRecord(node: GraphNode): Record<string, unknown> {
    if (!node.data || typeof node.data !== 'object' || Array.isArray(node.data)) {
        return {};
    }

    return node.data;
}

function getSphereData(node: GraphNode): SphereDataShape {
    const nodeData = getNodeDataRecord(node);
    const sphereData = nodeData.sphere;
    if (!sphereData || typeof sphereData !== 'object' || Array.isArray(sphereData)) {
        return {};
    }

    return sphereData as SphereDataShape;
}

function getNumber(value: unknown, fallback: number) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
}

function getPosition(value: unknown, fallback: GraphSpherePosition): GraphSpherePosition {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fallback;
    }

    const record = value as Record<string, unknown>;
    return {
        x: getNumber(record.x, fallback.x),
        y: getNumber(record.y, fallback.y),
        z: getNumber(record.z, fallback.z),
    };
}

function createAutoPosition(index: number, total: number): GraphSpherePosition {
    const safeTotal = Math.max(total, 1);
    const angle = (index / safeTotal) * Math.PI * 2 - Math.PI / 2;
    const orbitRadius = 24 + (index % 3) * 3.5;
    return {
        x: Number((Math.cos(angle) * orbitRadius).toFixed(2)),
        y: Number((Math.sin(angle) * orbitRadius).toFixed(2)),
        z: Number((-12 - ((index % 4) - 1.5) * 6).toFixed(2)),
    };
}

export function getDefaultGraphSphereConfigs() {
    return DEFAULT_GRAPH_SPHERES.map((config) => ({
        ...config,
        position: { ...config.position },
    }));
}

export function getDefaultGraphSphereConfig(nodeId: string) {
    const config = DEFAULT_GRAPH_SPHERES_BY_ID.get(nodeId);
    if (!config) return null;

    return {
        ...config,
        position: { ...config.position },
    };
}

export function buildGraphSphereConfigFromNode(
    node: GraphNode,
    index: number,
    total: number,
): GraphSphereConfig | null {
    if (node.type !== 'root' && node.type !== 'field') {
        return null;
    }

    const fallback =
        getDefaultGraphSphereConfig(node.id) ?? {
            id: node.id,
            label: node.label,
            nodeType: node.type,
            radius: node.type === 'root' ? 12 : 6,
            position: createAutoPosition(index, total),
            flatWidth: DEFAULT_FLAT_WIDTH,
            flatHeight: DEFAULT_FLAT_HEIGHT,
            sortOrder: node.type === 'root' ? -1000 : index + 100,
            bindingKey: node.type === 'field' ? node.id : null,
        };

    const sphereData = getSphereData(node);
    const label = typeof node.label === 'string' && node.label.trim().length > 0
        ? node.label
        : fallback.label;

    return {
        id: node.id,
        label,
        nodeType: node.type,
        radius: getNumber(sphereData.radius, fallback.radius),
        position: getPosition(sphereData.position, fallback.position),
        flatWidth: getNumber(sphereData.flatWidth, fallback.flatWidth),
        flatHeight: getNumber(sphereData.flatHeight, fallback.flatHeight),
        sortOrder: getNumber(sphereData.sortOrder, fallback.sortOrder),
        bindingKey:
            typeof sphereData.bindingKey === 'string' && sphereData.bindingKey.trim().length > 0
                ? sphereData.bindingKey
                : fallback.bindingKey,
    };
}

export function buildGraphSphereConfigsFromNodes(nodes: GraphNode[]) {
    const sphereNodes = nodes.filter((node) => node.type === 'root' || node.type === 'field');
    const configs = sphereNodes
        .map((node, index) => buildGraphSphereConfigFromNode(node, index, sphereNodes.length))
        .filter((config): config is GraphSphereConfig => Boolean(config))
        .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));

    return configs;
}

export function createGraphSphereNodeData(config: GraphSphereConfig) {
    return {
        ...(config.nodeType === 'field' ? { fieldId: config.bindingKey || config.id } : {}),
        sphere: {
            radius: config.radius,
            position: { ...config.position },
            flatWidth: config.flatWidth,
            flatHeight: config.flatHeight,
            sortOrder: config.sortOrder,
            bindingKey: config.bindingKey,
        },
    };
}
