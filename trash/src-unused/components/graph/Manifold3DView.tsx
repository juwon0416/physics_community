import {
    useCallback,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import * as THREE from 'three';
import type { GraphModel, GraphNode } from '../../lib/graphModel';
import {
    buildGraphSphereConfigsFromNodes,
    type GraphSphereConfig,
} from '../../lib/graphSpheres';

interface Manifold3DViewProps {
    model: GraphModel;
    activeField: string;
    focusedNodeId?: string | null;
    onNodeSelect?: (slug: string) => void;
}

export interface Manifold3DHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    focusNode: (nodeId: string) => void;
}

type GroupId = string;

type ViewState = {
    masterQuaternion: THREE.Quaternion;
    zoomZ: number;
    navX: number;
    navY: number;
    navZ: number;
    isFlattened: boolean;
    flattenedCameraPreset: FlattenedCameraPreset | null;
    flattenedCameraQuaternion: THREE.Quaternion;
    groupQuaternions: Record<string, THREE.Quaternion>;
};

type NodeVisualSpec = {
    node: GraphNode;
    groupId: GroupId;
    basePos: THREE.Vector3;
    flatPos: THREE.Vector3;
    clickable: boolean;
};

type GroupVisualSpec = {
    id: GroupId;
    label: string;
    radius: number;
    basePos: THREE.Vector3;
    flatPos: THREE.Vector3;
    flatWidth: number;
    flatHeight: number;
    nodes: NodeVisualSpec[];
    intraEdges: Array<{ source: string; target: string }>;
};

type InterGroupEdgeSpec = {
    source: string;
    target: string;
    bendDirection: THREE.Vector3;
};

type SceneSpec = {
    groups: GroupVisualSpec[];
    interEdges: InterGroupEdgeSpec[];
    pivotCenter: THREE.Vector3;
    navMax: number;
    rootGroupId: string;
};

type GroupSceneState = {
    id: GroupId;
    group: THREE.Group;
    hitbox: THREE.Mesh;
    wireMaterial: THREE.LineBasicMaterial;
    flatMaterial: THREE.LineBasicMaterial;
    focusMaterial: THREE.LineBasicMaterial;
    edgeMaterial: THREE.LineBasicMaterial;
    labelSprite: THREE.Sprite;
    labelBasePos: THREE.Vector3;
    labelFlatPos: THREE.Vector3;
    nodeMeshes: Map<string, THREE.Mesh>;
    nodeLabels: Map<string, THREE.Sprite>;
    intraEdgeLines: THREE.LineSegments | null;
    highlightEdgeLines: THREE.LineSegments | null;
    intraEdges: Array<{ source: string; target: string }>;
    basePos: THREE.Vector3;
    flatPos: THREE.Vector3;
    restQuaternion: THREE.Quaternion;
    orbitAxis: THREE.Vector3;
    orbitPhase: number;
    orbitSpeed: number;
    spinAxis: THREE.Vector3;
    spinSpeed: number;
};

type PointerState = {
    isPointerDown: boolean;
    downX: number;
    downY: number;
    lastX: number;
    lastY: number;
    candidateGroupId: string | null;
    candidateNodeId: string | null;
    dragMode: 'none' | 'group' | 'master';
};

type FlattenedCameraPreset = 'top-down' | 'angled-45';

const IDENTITY_QUATERNION = new THREE.Quaternion();
const FRONT_VECTOR = new THREE.Vector3(0, 0, 1);
const DEFAULT_ZOOM = 60;
const MIN_ZOOM = 22;
const MAX_ZOOM = 150;
const FLAT_Z_SPACING = -42;
const FIBER_SEGMENTS = 12;
const NODE_RADIUS = 0.28;
const LABEL_PIXEL_THRESHOLD = 11;
const DRAG_ROTATION_SPEED = 0.0052;
const FLATTEN_SNAP_THRESHOLD = 0.999;
const ROTATION_SNAP_THRESHOLD = 0.0005;

const FLATTENED_CAMERA_PRESETS: Array<{
    id: FlattenedCameraPreset;
    label: string;
}> = [
    { id: 'top-down', label: 'Top' },
    { id: 'angled-45', label: '45°' },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function getSnappedFlattenProgress(progress: number) {
    if (progress >= FLATTEN_SNAP_THRESHOLD) return 1;
    if (progress <= 1 - FLATTEN_SNAP_THRESHOLD) return 0;
    return progress;
}

function hashString(input: string) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededUnit(input: string, salt: string) {
    return hashString(`${input}:${salt}`) / 4294967295;
}

function composeQuaternion(
    rotations: Array<{ axis: THREE.Vector3; angle: number }>,
) {
    return rotations.reduce((quaternion, rotation) => {
        const step = new THREE.Quaternion().setFromAxisAngle(rotation.axis, rotation.angle);
        return quaternion.multiply(step);
    }, new THREE.Quaternion());
}

function createDefaultMasterQuaternion() {
    return composeQuaternion([
        { axis: new THREE.Vector3(1, 0, 0), angle: -0.24 },
        { axis: new THREE.Vector3(0, 1, 0), angle: 0.32 },
        { axis: new THREE.Vector3(0, 0, 1), angle: 0.06 },
    ]);
}

function createFlattenedPresetQuaternion(preset: FlattenedCameraPreset) {
    if (preset === 'top-down') {
        return new THREE.Quaternion();
    }

    const virtualCamera = new THREE.PerspectiveCamera();
    virtualCamera.position.set(-1, 0, 1);
    virtualCamera.up.set(1, 0, 0);
    virtualCamera.lookAt(0, 0, 0);
    return virtualCamera.quaternion.clone().invert().multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
    );
}

function createFlattenedPresetSpinQuaternion(
    preset: FlattenedCameraPreset,
    spin: number,
) {
    return createFlattenedPresetQuaternion(preset)
        .clone()
        .multiply(
            new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 0, 1),
                spin,
            ),
        )
        .normalize();
}

function applyFlattenedPresetSpin(
    target: THREE.Quaternion,
    preset: FlattenedCameraPreset,
    spin: number,
) {
    target.copy(
        createFlattenedPresetSpinQuaternion(preset, spin),
    );
}

function createDefaultGroupQuaternion(groupId: string) {
    return composeQuaternion([
        {
            axis: new THREE.Vector3(1, 0, 0),
            angle: (seededUnit(groupId, 'rx') - 0.5) * Math.PI * 0.7,
        },
        {
            axis: new THREE.Vector3(0, 1, 0),
            angle: (seededUnit(groupId, 'ry') - 0.5) * Math.PI * 0.9,
        },
        {
            axis: new THREE.Vector3(0, 0, 1),
            angle: (seededUnit(groupId, 'rz') - 0.5) * Math.PI * 0.55,
        },
    ]);
}

function createDragQuaternion(
    deltaX: number,
    deltaY: number,
    camera: THREE.Camera,
    parent: THREE.Object3D | null,
) {
    if (Math.abs(deltaX) < 0.0001 && Math.abs(deltaY) < 0.0001) {
        return new THREE.Quaternion();
    }

    const cameraQuaternion = camera.getWorldQuaternion(new THREE.Quaternion());
    const upAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(cameraQuaternion).normalize();
    const rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion).normalize();

    if (parent) {
        const parentInverseQuaternion = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        upAxis.applyQuaternion(parentInverseQuaternion).normalize();
        rightAxis.applyQuaternion(parentInverseQuaternion).normalize();
    }

    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(
        upAxis,
        deltaX * DRAG_ROTATION_SPEED,
    );
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(
        rightAxis,
        deltaY * DRAG_ROTATION_SPEED,
    );

    return yawQuaternion.multiply(pitchQuaternion).normalize();
}

function createIdleSpinQuaternion(
    groupState: Pick<GroupSceneState, 'spinAxis' | 'spinSpeed'>,
    idleTime: number,
) {
    return new THREE.Quaternion().setFromAxisAngle(groupState.spinAxis, idleTime * groupState.spinSpeed);
}

function createSphereConfigLookup(configs: GraphSphereConfig[]) {
    return new Map(configs.map((config) => [config.id, config]));
}

function createSphereBindingLookup(configs: GraphSphereConfig[]) {
    const lookup = new Map<string, string>();

    configs.forEach((config) => {
        lookup.set(config.id, config.id);
        if (config.bindingKey) {
            lookup.set(config.bindingKey, config.id);
        }
    });

    return lookup;
}

function getNodeFieldId(
    node: GraphNode,
    groupConfigById: Map<string, GraphSphereConfig>,
    bindingLookup: Map<string, string>,
): GroupId | null {
    if ((node.type === 'root' || node.type === 'field') && groupConfigById.has(node.id)) {
        return node.id;
    }

    const value = node.data?.fieldId;
    if (typeof value === 'string') {
        return bindingLookup.get(value) ?? null;
    }

    return null;
}

function createNodeDirection(nodeId: string) {
    const longitude = seededUnit(nodeId, 'lon') * Math.PI * 2;
    const z = seededUnit(nodeId, 'z') * 1.96 - 0.98;
    const radial = Math.sqrt(Math.max(0.0001, 1 - z * z));
    return new THREE.Vector3(Math.cos(longitude) * radial, z, Math.sin(longitude) * radial).normalize();
}

function createFlatGridGeometry(width: number, height: number, columns: number, rows: number) {
    const positions: number[] = [];

    for (let row = 0; row <= rows; row += 1) {
        const y = THREE.MathUtils.lerp(-height / 2, height / 2, row / rows);
        positions.push(-width / 2, y, 0, width / 2, y, 0);
    }

    for (let column = 0; column <= columns; column += 1) {
        const x = THREE.MathUtils.lerp(-width / 2, width / 2, column / columns);
        positions.push(x, -height / 2, 0, x, height / 2, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}

function createFlatFocusGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    return geometry;
}

function createLabelSprite(label: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const context = canvas.getContext('2d');
    if (!context) {
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: fallbackTexture, transparent: true }));
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "300 34px 'Helvetica Neue', Arial, sans-serif";
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255,255,255,0.92)';

    const lines = label.split('\n');
    const lineHeight = 42;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10.5, 5.25, 1);
    sprite.renderOrder = 20;
    return sprite;
}

function createNodeLabelSprite(label: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    if (!context) {
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                opacity: 0,
            }),
        );
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "500 28px 'Helvetica Neue', Arial, sans-serif";
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255,255,255,0.96)';
    context.fillText(label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(7.2, 1.8, 1);
    sprite.renderOrder = 30;
    sprite.visible = false;
    return sprite;
}

function pickDominantGroup(candidates: GroupId[], rootGroupId: string) {
    const nonRoot = candidates.filter((candidate) => candidate !== rootGroupId);
    const targetCandidates = nonRoot.length > 0 ? nonRoot : candidates;
    const scores = new Map<GroupId, number>();

    targetCandidates.forEach((candidate) => {
        scores.set(candidate, (scores.get(candidate) ?? 0) + 1);
    });

    let best = targetCandidates[0];
    let bestScore = -1;
    scores.forEach((value, key) => {
        if (value > bestScore) {
            best = key;
            bestScore = value;
        }
    });
    return best;
}

function inferGroupAssignments(
    model: GraphModel,
    groupConfigs: GraphSphereConfig[],
    rootGroupId: string,
) {
    const groupConfigById = createSphereConfigLookup(groupConfigs);
    const bindingLookup = createSphereBindingLookup(groupConfigs);
    const assignments = new Map<string, GroupId>();
    const neighbors = new Map<string, Set<string>>();

    model.nodes.forEach((node) => {
        if (node.type === 'root' && groupConfigById.has(node.id)) {
            assignments.set(node.id, node.id);
            return;
        }

        const explicitGroupId = getNodeFieldId(node, groupConfigById, bindingLookup);
        if (explicitGroupId) {
            assignments.set(node.id, explicitGroupId);
        }
    });

    model.edges.forEach((edge) => {
        if (!neighbors.has(edge.source)) neighbors.set(edge.source, new Set());
        if (!neighbors.has(edge.target)) neighbors.set(edge.target, new Set());
        neighbors.get(edge.source)?.add(edge.target);
        neighbors.get(edge.target)?.add(edge.source);
    });

    for (let pass = 0; pass < model.nodes.length; pass += 1) {
        let changed = false;

        model.nodes.forEach((node) => {
            if (assignments.has(node.id)) return;

            const candidateGroups = Array.from(neighbors.get(node.id) ?? [])
                .map((neighborId) => assignments.get(neighborId))
                .filter((value): value is GroupId => Boolean(value));

            if (candidateGroups.length === 0) return;

            assignments.set(node.id, pickDominantGroup(candidateGroups, rootGroupId));
            changed = true;
        });

        if (!changed) break;
    }

    model.nodes.forEach((node) => {
        if (!assignments.has(node.id)) {
            assignments.set(node.id, rootGroupId);
        }
    });

    return assignments;
}

function disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        const material = (mesh.material ?? null) as THREE.Material | THREE.Material[] | null;
        if (Array.isArray(material)) {
            material.forEach((entry) => entry.dispose());
        } else {
            material?.dispose();
        }

        if (child instanceof THREE.Sprite) {
            child.material.map?.dispose();
        }
    });
}

function buildSceneSpec(model: GraphModel): SceneSpec {
    const groupConfigs = buildGraphSphereConfigsFromNodes(model.nodes);
    const groupConfigById = createSphereConfigLookup(groupConfigs);
    const rootGroupId =
        groupConfigs.find((config) => config.nodeType === 'root')?.id ??
        groupConfigs[0]?.id ??
        'root';
    const assignments = inferGroupAssignments(model, groupConfigs, rootGroupId);
    const nodesById = new Map(model.nodes.map((node) => [node.id, node]));
    const groupNodes = new Map<GroupId, NodeVisualSpec[]>();

    groupConfigs.forEach((groupConfig) => {
        groupNodes.set(groupConfig.id, []);
    });

    model.nodes
        .slice()
        .sort((left, right) => left.id.localeCompare(right.id))
        .forEach((node) => {
            const groupId = assignments.get(node.id) ?? rootGroupId;
            const groupConfig = groupConfigById.get(groupId);
            if (!groupConfig) return;

            const direction = createNodeDirection(node.id);
            const basePos = direction.clone().multiplyScalar(groupConfig.radius);
            const longitude = Math.atan2(direction.z, direction.x);
            const latitude = Math.asin(direction.y);
            const flatPos = new THREE.Vector3(
                (longitude / Math.PI) * (groupConfig.flatWidth / 2),
                (latitude / (Math.PI / 2)) * (groupConfig.flatHeight / 2),
                0.45,
            );

            groupNodes.get(groupId)?.push({
                node,
                groupId,
                basePos,
                flatPos,
                clickable: node.type === 'topic' && typeof node.slug === 'string' && node.slug.length > 0,
            });
        });

    const groups = groupConfigs.map((config, index) => ({
        id: config.id,
        label: config.label,
        radius: config.radius,
        basePos: new THREE.Vector3(config.position.x, config.position.y, config.position.z),
        flatPos: new THREE.Vector3(0, 0, FLAT_Z_SPACING * index),
        flatWidth: config.flatWidth,
        flatHeight: config.flatHeight,
        nodes: groupNodes.get(config.id) ?? [],
        intraEdges: [] as Array<{ source: string; target: string }>,
    }));

    const baseCenter = groups.reduce(
        (center, group) => center.add(group.basePos),
        new THREE.Vector3(),
    );
    if (groups.length > 0) {
        baseCenter.divideScalar(groups.length);
    }

    groups.forEach((group) => {
        group.basePos.sub(baseCenter);
    });

    const groupLookup = new Map(groups.map((group) => [group.id, group]));
    const seenIntraEdgeKeys = new Set<string>();
    const seenInterEdgeKeys = new Set<string>();
    const interEdges: InterGroupEdgeSpec[] = [];

    model.edges.forEach((edge) => {
        if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) return;
        const sourceGroup = assignments.get(edge.source) ?? rootGroupId;
        const targetGroup = assignments.get(edge.target) ?? rootGroupId;
        if (!groupLookup.has(sourceGroup) || !groupLookup.has(targetGroup)) return;

        if (sourceGroup === targetGroup) {
            const key = [edge.source, edge.target].sort().join('|');
            if (seenIntraEdgeKeys.has(key)) return;
            seenIntraEdgeKeys.add(key);
            groupLookup.get(sourceGroup)?.intraEdges.push({ source: edge.source, target: edge.target });
            return;
        }

        const interKey = [edge.source, edge.target].sort().join('|');
        if (seenInterEdgeKeys.has(interKey)) return;
        seenInterEdgeKeys.add(interKey);

        interEdges.push({
            source: edge.source,
            target: edge.target,
            bendDirection: createNodeDirection(`${interKey}:bend`),
        });
    });

    const pivotCenter = groups.reduce((center, group) => center.add(group.basePos), new THREE.Vector3());
    if (groups.length > 0) {
        pivotCenter.divideScalar(groups.length);
    }

    return {
        groups,
        interEdges: interEdges.slice(0, 180),
        pivotCenter,
        navMax: Math.max(0, (groups.length - 1) * Math.abs(FLAT_Z_SPACING)),
        rootGroupId,
    };
}

function createInitialViewState(sceneSpec: SceneSpec): ViewState {
    const groupQuaternions: Record<string, THREE.Quaternion> = {};
    sceneSpec.groups.forEach((group) => {
        groupQuaternions[group.id] = createDefaultGroupQuaternion(group.id);
    });

    return {
        masterQuaternion: createDefaultMasterQuaternion(),
        zoomZ: DEFAULT_ZOOM,
        navX: 0,
        navY: 0,
        navZ: 0,
        isFlattened: false,
        flattenedCameraPreset: null,
        flattenedCameraQuaternion: new THREE.Quaternion(),
        groupQuaternions,
    };
}

const Manifold3DView = forwardRef<Manifold3DHandle, Manifold3DViewProps>(function Manifold3DView(
    { model, activeField, focusedNodeId, onNodeSelect },
    ref,
) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const masterPivotGroupRef = useRef<THREE.Group | null>(null);
    const masterRotationGroupRef = useRef<THREE.Group | null>(null);
    const masterNavGroupRef = useRef<THREE.Group | null>(null);
    const contentGroupRef = useRef<THREE.Group | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2(-10, -10));
    const hoveredNodeRef = useRef<THREE.Mesh | null>(null);
    const focusedNodeIdRef = useRef<string | null>(focusedNodeId ?? null);
    const scenePivotCenterRef = useRef(new THREE.Vector3());
    const targetZoomRef = useRef(DEFAULT_ZOOM);
    const targetNavXYRef = useRef(new THREE.Vector2(0, 0));
    const targetNavRef = useRef(0);
    const masterTargetQuaternionRef = useRef(createDefaultMasterQuaternion());
    const flattenProgressRef = useRef(0);
    const isFlattenedRef = useRef(false);
    const flattenedCameraPresetRef = useRef<FlattenedCameraPreset | null>(null);
    const flattenedCameraSpinRef = useRef(0);
    const flattenedCameraQuaternionRef = useRef(new THREE.Quaternion());
    const idleAnimationTimeRef = useRef(0);
    const lastAnimationTimestampRef = useRef<number | null>(null);
    const pointerStateRef = useRef<PointerState>({
        isPointerDown: false,
        downX: 0,
        downY: 0,
        lastX: 0,
        lastY: 0,
        candidateGroupId: null,
        candidateNodeId: null,
        dragMode: 'none',
    });
    const activeFieldRef = useRef(activeField);
    const previousFilterRef = useRef(activeField);
    const onNodeSelectRef = useRef(onNodeSelect);
    const rebuildSceneRef = useRef<() => void>(() => undefined);
    const focusNodeInternalRef = useRef<(nodeId: string) => void>(() => undefined);
    const viewStateCacheRef = useRef<Record<string, ViewState>>({});
    const hoverableNodesRef = useRef<THREE.Mesh[]>([]);
    const interactiveNodesRef = useRef<THREE.Mesh[]>([]);
    const hitboxesRef = useRef<THREE.Mesh[]>([]);
    const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const groupsRef = useRef<Map<string, GroupSceneState>>(new Map());
    const fiberStateRef = useRef<{
        line: THREE.LineSegments | null;
        highlightLine: THREE.LineSegments | null;
        interEdges: InterGroupEdgeSpec[];
    }>({
        line: null,
        highlightLine: null,
        interEdges: [],
    });
    const [isFlattenedUi, setIsFlattenedUi] = useState(false);
    const [flattenedCameraPresetUi, setFlattenedCameraPresetUi] = useState<FlattenedCameraPreset | null>(null);
    const [navSliderValue, setNavSliderValue] = useState(0);
    const [navMax, setNavMax] = useState(0);

    const sceneSpec = useMemo(() => buildSceneSpec(model), [model]);

    const getFlattenedTargetQuaternion = useCallback(() => {
        if (!flattenedCameraPresetRef.current) {
            return new THREE.Quaternion();
        }

        return flattenedCameraQuaternionRef.current.clone();
    }, []);

    const applyFlattenedCameraPreset = useCallback((preset: FlattenedCameraPreset | null) => {
        const currentQuaternion =
            masterRotationGroupRef.current?.quaternion.clone() ??
            masterTargetQuaternionRef.current.clone();

        flattenedCameraPresetRef.current = preset;
        setFlattenedCameraPresetUi(preset);

        if (!preset) {
            flattenedCameraSpinRef.current = 0;
            flattenedCameraQuaternionRef.current.identity();

            if (isFlattenedRef.current) {
                masterTargetQuaternionRef.current.copy(currentQuaternion);
            }
            return;
        }

        flattenedCameraSpinRef.current = 0;
        applyFlattenedPresetSpin(
            flattenedCameraQuaternionRef.current,
            preset,
            flattenedCameraSpinRef.current,
        );

        if (!isFlattenedRef.current) {
            return;
        }

        masterTargetQuaternionRef.current.copy(getFlattenedTargetQuaternion());
    }, [getFlattenedTargetQuaternion]);

    useEffect(() => {
        onNodeSelectRef.current = onNodeSelect;
    }, [onNodeSelect]);

    const persistCurrentViewState = (fieldKey: string) => {
        if (!fieldKey) return;

        const snapshot: ViewState = {
            masterQuaternion:
                masterRotationGroupRef.current?.quaternion.clone() ??
                masterTargetQuaternionRef.current.clone(),
            zoomZ: targetZoomRef.current,
            navX: targetNavXYRef.current.x,
            navY: targetNavXYRef.current.y,
            navZ: targetNavRef.current,
            isFlattened: isFlattenedRef.current,
            flattenedCameraPreset: flattenedCameraPresetRef.current,
            flattenedCameraQuaternion: flattenedCameraQuaternionRef.current.clone(),
            groupQuaternions: {},
        };

        groupsRef.current.forEach((groupState) => {
            snapshot.groupQuaternions[groupState.id] = groupState.restQuaternion.clone();
        });

        viewStateCacheRef.current[fieldKey] = snapshot;
    };

    const applyViewState = (viewState: ViewState, spec: SceneSpec) => {
        masterTargetQuaternionRef.current.copy(viewState.masterQuaternion);
        targetZoomRef.current = clamp(viewState.zoomZ, MIN_ZOOM, MAX_ZOOM);
        targetNavXYRef.current.set(viewState.navX ?? 0, viewState.navY ?? 0);
        targetNavRef.current = clamp(viewState.navZ, 0, spec.navMax || 0);
        isFlattenedRef.current = viewState.isFlattened;
        flattenedCameraPresetRef.current = viewState.flattenedCameraPreset ?? null;
        const restoredFlattenedQuaternion =
            viewState.flattenedCameraQuaternion ??
            (viewState.flattenedCameraPreset
                ? createFlattenedPresetQuaternion(viewState.flattenedCameraPreset)
                : new THREE.Quaternion());
        if (viewState.flattenedCameraPreset) {
            flattenedCameraSpinRef.current = 0;
            applyFlattenedPresetSpin(
                flattenedCameraQuaternionRef.current,
                viewState.flattenedCameraPreset,
                flattenedCameraSpinRef.current,
            );
        } else {
            flattenedCameraSpinRef.current = 0;
            flattenedCameraQuaternionRef.current.copy(restoredFlattenedQuaternion);
        }
        flattenProgressRef.current = viewState.isFlattened ? 1 : 0;
        masterPivotGroupRef.current?.position.set(
            scenePivotCenterRef.current.x + targetNavXYRef.current.x,
            scenePivotCenterRef.current.y + targetNavXYRef.current.y,
            scenePivotCenterRef.current.z,
        );
        masterRotationGroupRef.current?.quaternion.copy(viewState.masterQuaternion);

        groupsRef.current.forEach((groupState) => {
            const restoredQuaternion =
                viewState.groupQuaternions[groupState.id] ?? createDefaultGroupQuaternion(groupState.id);
            groupState.restQuaternion.copy(restoredQuaternion);
            groupState.group.quaternion.copy(restoredQuaternion);
        });

        setIsFlattenedUi(viewState.isFlattened);
        setFlattenedCameraPresetUi(viewState.flattenedCameraPreset ?? null);
        setNavSliderValue(spec.navMax - targetNavRef.current);
        setNavMax(spec.navMax);
    };

    const buildOrRestoreViewState = (fieldKey: string, spec: SceneSpec) => {
        const cached = viewStateCacheRef.current[fieldKey];
        if (!cached) {
            const initial = createInitialViewState(spec);
            viewStateCacheRef.current[fieldKey] = initial;
            return initial;
        }

        const hydrated: ViewState = {
            masterQuaternion: cached.masterQuaternion.clone(),
            zoomZ: cached.zoomZ,
            navX: cached.navX ?? 0,
            navY: cached.navY ?? 0,
            navZ: cached.navZ,
            isFlattened: cached.isFlattened,
            flattenedCameraPreset: cached.flattenedCameraPreset ?? null,
            flattenedCameraQuaternion:
                cached.flattenedCameraQuaternion?.clone() ??
                (cached.flattenedCameraPreset
                    ? createFlattenedPresetQuaternion(cached.flattenedCameraPreset)
                    : new THREE.Quaternion()),
            groupQuaternions: {},
        };

        spec.groups.forEach((group) => {
            hydrated.groupQuaternions[group.id] =
                cached.groupQuaternions[group.id]?.clone() ?? createDefaultGroupQuaternion(group.id);
        });

        return hydrated;
    };

    const clearSceneContent = () => {
        if (fiberStateRef.current.line) {
            fiberStateRef.current.line.removeFromParent();
            disposeObject(fiberStateRef.current.line);
        }
        if (fiberStateRef.current.highlightLine) {
            fiberStateRef.current.highlightLine.removeFromParent();
            disposeObject(fiberStateRef.current.highlightLine);
        }
        fiberStateRef.current = { line: null, highlightLine: null, interEdges: [] };

        groupsRef.current.forEach((groupState) => {
            groupState.group.removeFromParent();
            disposeObject(groupState.group);
        });

        groupsRef.current.clear();
        nodeMeshesRef.current.clear();
        hoverableNodesRef.current = [];
        interactiveNodesRef.current = [];
        hitboxesRef.current = [];
        hoveredNodeRef.current = null;
    };

    const rebuildScene = useCallback(() => {
        const contentGroup = contentGroupRef.current;
        const masterPivotGroup = masterPivotGroupRef.current;
        if (!contentGroup || !masterPivotGroup) return;

        clearSceneContent();

        scenePivotCenterRef.current.copy(sceneSpec.pivotCenter);
        masterPivotGroup.position.copy(sceneSpec.pivotCenter);
        contentGroup.position.copy(sceneSpec.pivotCenter.clone().multiplyScalar(-1));

        sceneSpec.groups.forEach((groupSpec) => {
            const group = new THREE.Group();
            const restQuaternion = createDefaultGroupQuaternion(groupSpec.id);
            group.position.copy(groupSpec.basePos);
            group.quaternion.copy(restQuaternion);

            const wireMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
            });
            const wire = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.SphereGeometry(groupSpec.radius, 22, 22)),
                wireMaterial,
            );
            wire.renderOrder = 4;
            group.add(wire);

            const flatMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.04,
                depthTest: false,
            });
            const flatGrid = new THREE.LineSegments(
                createFlatGridGeometry(groupSpec.flatWidth, groupSpec.flatHeight, 14, 9),
                flatMaterial,
            );
            flatGrid.position.z = 0.4;
            flatGrid.renderOrder = 10;
            group.add(flatGrid);

            const focusMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.08,
                depthTest: false,
            });
            const focusGrid = new THREE.LineSegments(
                createFlatFocusGeometry(),
                focusMaterial,
            );
            focusGrid.position.z = 0.52;
            focusGrid.renderOrder = 11;
            group.add(focusGrid);

            const hitbox = new THREE.Mesh(
                new THREE.SphereGeometry(groupSpec.radius, 16, 16),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                }),
            );
            hitbox.userData.groupId = groupSpec.id;
            group.add(hitbox);
            hitboxesRef.current.push(hitbox);

            const nodeMeshes = new Map<string, THREE.Mesh>();
            const nodeLabels = new Map<string, THREE.Sprite>();
            groupSpec.nodes.forEach((nodeSpec) => {
                const material = new THREE.MeshBasicMaterial({
                    color: nodeSpec.clickable ? 0xffffff : 0xaeb4bd,
                    transparent: true,
                    opacity: nodeSpec.clickable ? 0.88 : 0.52,
                });
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(NODE_RADIUS, 16, 16), material);
                mesh.position.copy(nodeSpec.basePos);
                mesh.userData = {
                    nodeId: nodeSpec.node.id,
                    label: nodeSpec.node.label,
                    slug: nodeSpec.node.slug,
                    groupId: groupSpec.id,
                    clickable: nodeSpec.clickable,
                    basePos: nodeSpec.basePos.clone(),
                    flatPos: nodeSpec.flatPos.clone(),
                    baseOpacity: nodeSpec.clickable ? 0.88 : 0.52,
                    baseColor: nodeSpec.clickable ? 0xffffff : 0xaeb4bd,
                };
                group.add(mesh);
                nodeMeshes.set(nodeSpec.node.id, mesh);
                nodeMeshesRef.current.set(nodeSpec.node.id, mesh);
                hoverableNodesRef.current.push(mesh);

                if (nodeSpec.node.label) {
                    const labelSprite = createNodeLabelSprite(nodeSpec.node.label);
                    labelSprite.position.copy(nodeSpec.basePos).add(new THREE.Vector3(0, 1.05, 0.32));
                    group.add(labelSprite);
                    nodeLabels.set(nodeSpec.node.id, labelSprite);
                }

                if (nodeSpec.clickable) {
                    interactiveNodesRef.current.push(mesh);
                }
            });

            let intraEdgeLines: THREE.LineSegments | null = null;
            let highlightEdgeLines: THREE.LineSegments | null = null;
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.22,
            });

            if (groupSpec.intraEdges.length > 0) {
                const edgePositions = new Float32Array(groupSpec.intraEdges.length * 6);
                const edgeGeometry = new THREE.BufferGeometry();
                edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
                intraEdgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
                intraEdgeLines.renderOrder = 8;
                group.add(intraEdgeLines);

                const highlightGeometry = new THREE.BufferGeometry();
                highlightGeometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(new Float32Array(groupSpec.intraEdges.length * 6), 3),
                );
                highlightGeometry.setDrawRange(0, 0);
                highlightEdgeLines = new THREE.LineSegments(
                    highlightGeometry,
                    new THREE.LineBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0,
                        depthTest: false,
                        blending: THREE.AdditiveBlending,
                    }),
                );
                highlightEdgeLines.renderOrder = 14;
                group.add(highlightEdgeLines);
            }

            const labelSprite = createLabelSprite(groupSpec.label);
            const labelBasePos = new THREE.Vector3(0, 0, groupSpec.radius + 2.8);
            const labelFlatPos = new THREE.Vector3(0, groupSpec.flatHeight / 2 + 3.2, 1.2);
            labelSprite.position.copy(labelBasePos);
            group.add(labelSprite);

            contentGroup.add(group);

            const orbitAxis = new THREE.Vector3(
                (seededUnit(groupSpec.id, 'orbit-ax') - 0.5) * 0.35,
                1,
                (seededUnit(groupSpec.id, 'orbit-az') - 0.5) * 0.35,
            ).normalize();
            const spinAxis = createNodeDirection(`${groupSpec.id}:spin-axis`);

            groupsRef.current.set(groupSpec.id, {
                id: groupSpec.id,
                group,
                hitbox,
                wireMaterial,
                flatMaterial,
                focusMaterial,
                edgeMaterial,
                labelSprite,
                labelBasePos,
                labelFlatPos,
                nodeMeshes,
                nodeLabels,
                intraEdgeLines,
                highlightEdgeLines,
                intraEdges: groupSpec.intraEdges,
                basePos: groupSpec.basePos.clone(),
                flatPos: groupSpec.flatPos.clone(),
                restQuaternion,
                orbitAxis,
                orbitPhase: seededUnit(groupSpec.id, 'orbit-phase') * Math.PI * 2,
                orbitSpeed: 0.035 + seededUnit(groupSpec.id, 'orbit-speed') * 0.018,
                spinAxis,
                spinSpeed: 0.05 + seededUnit(groupSpec.id, 'spin-speed') * 0.03,
            });
        });

        if (sceneSpec.interEdges.length > 0) {
            const totalPoints = sceneSpec.interEdges.length * FIBER_SEGMENTS * 2;
            const positions = new Float32Array(totalPoints * 3);
            const fiberGeometry = new THREE.BufferGeometry();
            fiberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const fiberMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.22,
                depthTest: false,
            });
            const fiberLines = new THREE.LineSegments(fiberGeometry, fiberMaterial);
            fiberLines.renderOrder = 12;
            contentGroup.add(fiberLines);

            const highlightGeometry = new THREE.BufferGeometry();
            highlightGeometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(totalPoints * 3), 3),
            );
            highlightGeometry.setDrawRange(0, 0);
            const highlightLine = new THREE.LineSegments(
                highlightGeometry,
                new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0,
                    depthTest: false,
                    blending: THREE.AdditiveBlending,
                }),
            );
            highlightLine.renderOrder = 15;
            contentGroup.add(highlightLine);

            fiberStateRef.current = {
                line: fiberLines,
                highlightLine,
                interEdges: sceneSpec.interEdges,
            };
        }

        applyViewState(buildOrRestoreViewState(activeField, sceneSpec), sceneSpec);
    }, [activeField, sceneSpec]);

    const updateHoverState = () => {
        const camera = cameraRef.current;
        if (!camera || pointerStateRef.current.isPointerDown || hoverableNodesRef.current.length === 0) {
            return;
        }

        const raycaster = raycasterRef.current;
        raycaster.setFromCamera(mouseRef.current, camera);
        const intersections = raycaster.intersectObjects(hoverableNodesRef.current, false);
        hoveredNodeRef.current = intersections.length > 0 ? (intersections[0].object as THREE.Mesh) : null;
    };

    const focusNodeInternal = useCallback((nodeId: string) => {
        const nodeMesh = nodeMeshesRef.current.get(nodeId);
        const masterRotationGroup = masterRotationGroupRef.current;
        const scene = sceneRef.current;
        if (!nodeMesh || !masterRotationGroup || !scene) return;

        focusedNodeIdRef.current = nodeId;
        const groupId =
            typeof nodeMesh.userData.groupId === 'string' ? nodeMesh.userData.groupId : null;

        if (isFlattenedRef.current && groupId) {
            const groupState = groupsRef.current.get(groupId);
            if (groupState) {
                const nextNav = clamp(-groupState.flatPos.z, 0, sceneSpec.navMax || 0);
                targetNavRef.current = nextNav;
                setNavSliderValue((sceneSpec.navMax || 0) - nextNav);
            }
            masterTargetQuaternionRef.current.copy(getFlattenedTargetQuaternion());
            targetZoomRef.current = Math.min(targetZoomRef.current, 54);
            return;
        }

        targetNavRef.current = 0;
        setNavSliderValue(sceneSpec.navMax || 0);
        scene.updateMatrixWorld(true);

        const worldPosition = nodeMesh.getWorldPosition(new THREE.Vector3());
        const relativeDirection = masterRotationGroup.worldToLocal(worldPosition);
        if (relativeDirection.lengthSq() < 0.001) return;

        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            relativeDirection.clone().normalize(),
            FRONT_VECTOR.clone(),
        );
        masterTargetQuaternionRef.current.copy(targetQuaternion);
        targetZoomRef.current = Math.min(targetZoomRef.current, 46);
    }, [getFlattenedTargetQuaternion, sceneSpec.navMax]);

    useEffect(() => {
        rebuildSceneRef.current = rebuildScene;
        focusNodeInternalRef.current = focusNodeInternal;
    }, [rebuildScene, focusNodeInternal]);

    useImperativeHandle(
        ref,
        () => ({
            zoomIn() {
                targetZoomRef.current = clamp(targetZoomRef.current - 10, MIN_ZOOM, MAX_ZOOM);
            },
            zoomOut() {
                targetZoomRef.current = clamp(targetZoomRef.current + 10, MIN_ZOOM, MAX_ZOOM);
            },
            resetView() {
                const resetState = createInitialViewState(sceneSpec);
                viewStateCacheRef.current[activeFieldRef.current] = resetState;
                applyViewState(resetState, sceneSpec);
            },
            focusNode(nodeId: string) {
                focusNodeInternal(nodeId);
            },
        }),
        [focusNodeInternal, sceneSpec],
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 18, 120);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.set(0, 0, DEFAULT_ZOOM);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        const masterPivotGroup = new THREE.Group();
        const masterRotationGroup = new THREE.Group();
        const masterNavGroup = new THREE.Group();
        const contentGroup = new THREE.Group();

        masterPivotGroup.add(masterRotationGroup);
        masterRotationGroup.add(masterNavGroup);
        masterNavGroup.add(contentGroup);
        scene.add(masterPivotGroup);

        masterPivotGroupRef.current = masterPivotGroup;
        masterRotationGroupRef.current = masterRotationGroup;
        masterNavGroupRef.current = masterNavGroup;
        contentGroupRef.current = contentGroup;

        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(1600 * 3);
        for (let index = 0; index < particlePositions.length; index += 1) {
            particlePositions[index] = (Math.random() - 0.5) * 420;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particlesRef.current = particles;
        scene.add(particles);

        const resize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width <= 0 || height <= 0) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        resize();
        resizeObserverRef.current = new ResizeObserver(() => {
            window.requestAnimationFrame(resize);
        });
        resizeObserverRef.current.observe(container);

        const handleWheel = (event: WheelEvent) => {
            targetZoomRef.current = clamp(targetZoomRef.current + event.deltaY * 0.05, MIN_ZOOM, MAX_ZOOM);
        };

        const getPointerHits = (clientX: number, clientY: number) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = raycasterRef.current;
            raycaster.setFromCamera(mouseRef.current, camera);

            const nodeIntersections = raycaster.intersectObjects(interactiveNodesRef.current, false);
            if (nodeIntersections.length > 0) {
                const hitNode = nodeIntersections[0].object as THREE.Mesh;
                return {
                    hitNode,
                    hitGroupId: typeof hitNode.userData.groupId === 'string' ? hitNode.userData.groupId : null,
                };
            }

            const hitboxIntersections = raycaster.intersectObjects(hitboxesRef.current, false);
            if (hitboxIntersections.length > 0) {
                const hitbox = hitboxIntersections[0].object as THREE.Mesh;
                return {
                    hitNode: null,
                    hitGroupId: typeof hitbox.userData.groupId === 'string' ? hitbox.userData.groupId : null,
                };
            }

            return { hitNode: null as THREE.Mesh | null, hitGroupId: null as string | null };
        };

        const handlePointerDown = (event: PointerEvent) => {
            const hits = getPointerHits(event.clientX, event.clientY);
            pointerStateRef.current = {
                isPointerDown: true,
                downX: event.clientX,
                downY: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY,
                candidateGroupId: hits.hitGroupId,
                candidateNodeId:
                    hits.hitNode && typeof hits.hitNode.userData.nodeId === 'string'
                        ? hits.hitNode.userData.nodeId
                        : null,
                dragMode: 'none',
            };

            renderer.domElement.setPointerCapture(event.pointerId);
        };

        const handlePointerMove = (event: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const pointerState = pointerStateRef.current;
            if (!pointerState.isPointerDown) return;

            const totalDistance = Math.hypot(event.clientX - pointerState.downX, event.clientY - pointerState.downY);
            const deltaX = event.clientX - pointerState.lastX;
            const deltaY = event.clientY - pointerState.lastY;

            if (pointerState.dragMode === 'none' && totalDistance > 4) {
                pointerState.dragMode =
                    !isFlattenedRef.current && pointerState.candidateGroupId ? 'group' : 'master';
            }

            if (pointerState.dragMode === 'group' && pointerState.candidateGroupId) {
                const groupState = groupsRef.current.get(pointerState.candidateGroupId);
                if (groupState) {
                    const rotation = createDragQuaternion(
                        deltaX,
                        deltaY,
                        camera,
                        groupState.group.parent,
                    );
                    groupState.group.quaternion.premultiply(rotation);
                    const snappedFlattenProgress = getSnappedFlattenProgress(flattenProgressRef.current);
                    if (!isFlattenedRef.current && snappedFlattenProgress === 0) {
                        const idleSpinQuaternion = createIdleSpinQuaternion(
                            groupState,
                            idleAnimationTimeRef.current,
                        );
                        groupState.restQuaternion
                            .copy(groupState.group.quaternion)
                            .multiply(idleSpinQuaternion.invert())
                            .normalize();
                    } else {
                        groupState.restQuaternion.copy(groupState.group.quaternion).normalize();
                    }
                }
            } else if (pointerState.dragMode === 'master') {
                if (isFlattenedRef.current && flattenedCameraPresetRef.current) {
                    if (
                        projectPointerOntoFlattenedPlane(pointerState.lastX, pointerState.lastY, tempPointerPrevious) &&
                        projectPointerOntoFlattenedPlane(event.clientX, event.clientY, tempPointerCurrent)
                    ) {
                        tempPanDeltaWorld.subVectors(tempPointerCurrent, tempPointerPrevious);

                        targetNavXYRef.current.x += tempPanDeltaWorld.x;
                        targetNavXYRef.current.y += tempPanDeltaWorld.y;
                        masterPivotGroup.position.x = scenePivotCenterRef.current.x + targetNavXYRef.current.x;
                        masterPivotGroup.position.y = scenePivotCenterRef.current.y + targetNavXYRef.current.y;
                    }

                    masterTargetQuaternionRef.current.copy(getFlattenedTargetQuaternion());
                    pointerState.lastX = event.clientX;
                    pointerState.lastY = event.clientY;
                    return;
                }

                const rotation = createDragQuaternion(
                    deltaX,
                    deltaY,
                    camera,
                    masterRotationGroup.parent,
                );
                masterRotationGroup.quaternion.premultiply(rotation);
                masterTargetQuaternionRef.current.copy(masterRotationGroup.quaternion);
            }

            pointerState.lastX = event.clientX;
            pointerState.lastY = event.clientY;
        };

        const handlePointerUp = (event: PointerEvent) => {
            const pointerState = pointerStateRef.current;
            if (!pointerState.isPointerDown) return;

            const totalDistance = Math.hypot(event.clientX - pointerState.downX, event.clientY - pointerState.downY);
            if (totalDistance < 5 && pointerState.candidateNodeId) {
                const hitNode = nodeMeshesRef.current.get(pointerState.candidateNodeId);
                if (
                    hitNode &&
                    hitNode.userData.clickable &&
                    typeof hitNode.userData.slug === 'string' &&
                    hitNode.userData.slug.length > 0
                ) {
                    onNodeSelectRef.current?.(hitNode.userData.slug);
                }
            }

            pointerStateRef.current = {
                isPointerDown: false,
                downX: 0,
                downY: 0,
                lastX: 0,
                lastY: 0,
                candidateGroupId: null,
                candidateNodeId: null,
                dragMode: 'none',
            };
        };

        renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });
        renderer.domElement.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        const tempDragPlane = new THREE.Plane();
        const tempPlanePoint = new THREE.Vector3();
        const tempPointerPrevious = new THREE.Vector3();
        const tempPointerCurrent = new THREE.Vector3();
        const tempPanDeltaWorld = new THREE.Vector3();
        const tempPointerNdc = new THREE.Vector2();
        const tempVectorA = new THREE.Vector3();
        const tempVectorB = new THREE.Vector3();
        const tempMid = new THREE.Vector3();
        const tempCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
        );
        const tempOrbitQuaternion = new THREE.Quaternion();
        const tempSpinQuaternion = new THREE.Quaternion();
        const tempGroupQuaternion = new THREE.Quaternion();
        const tempAnimatedBasePos = new THREE.Vector3();
        const tempLabelWorld = new THREE.Vector3();
        const tempLabelView = new THREE.Vector3();
        const projectPointerOntoFlattenedPlane = (
            clientX: number,
            clientY: number,
            target: THREE.Vector3,
        ) => {
            if (!flattenedCameraPresetRef.current) {
                return false;
            }

            const bounds = renderer.domElement.getBoundingClientRect();
            tempPointerNdc.set(
                ((clientX - bounds.left) / bounds.width) * 2 - 1,
                -((clientY - bounds.top) / bounds.height) * 2 + 1,
            );
            raycasterRef.current.setFromCamera(tempPointerNdc, camera);

            contentGroup.getWorldPosition(tempPlanePoint);
            tempDragPlane.setFromNormalAndCoplanarPoint(FRONT_VECTOR, tempPlanePoint);

            return raycasterRef.current.ray.intersectPlane(tempDragPlane, target) !== null;
        };

        const animate = (timestamp: number) => {
            animationFrameRef.current = window.requestAnimationFrame(animate);

            const currentScene = sceneRef.current;
            const currentCamera = cameraRef.current;
            const currentRenderer = rendererRef.current;
            const currentPivotGroup = masterPivotGroupRef.current;
            const currentRotationGroup = masterRotationGroupRef.current;
            const currentNavGroup = masterNavGroupRef.current;
            if (
                !currentScene ||
                !currentCamera ||
                !currentRenderer ||
                !currentPivotGroup ||
                !currentRotationGroup ||
                !currentNavGroup
            ) {
                return;
            }

            const previousTimestamp = lastAnimationTimestampRef.current;
            if (previousTimestamp === null) {
                idleAnimationTimeRef.current = timestamp * 0.001;
            } else {
                const isUserInteracting =
                    pointerStateRef.current.isPointerDown || pointerStateRef.current.dragMode !== 'none';
                if (!isFlattenedRef.current && !isUserInteracting) {
                    idleAnimationTimeRef.current += Math.max(0, timestamp - previousTimestamp) * 0.001;
                }
            }
            lastAnimationTimestampRef.current = timestamp;

            currentCamera.position.z += (targetZoomRef.current - currentCamera.position.z) * 0.08;
            const nextNavX =
                isFlattenedRef.current && flattenedCameraPresetRef.current ? targetNavXYRef.current.x : 0;
            const nextNavY =
                isFlattenedRef.current && flattenedCameraPresetRef.current ? targetNavXYRef.current.y : 0;
            currentPivotGroup.position.x +=
                (scenePivotCenterRef.current.x + nextNavX - currentPivotGroup.position.x) * 0.12;
            currentPivotGroup.position.y +=
                (scenePivotCenterRef.current.y + nextNavY - currentPivotGroup.position.y) * 0.12;
            currentPivotGroup.position.z = scenePivotCenterRef.current.z;
            currentNavGroup.position.x = 0;
            currentNavGroup.position.y = 0;
            currentNavGroup.position.z += (targetNavRef.current - currentNavGroup.position.z) * 0.1;
            if (pointerStateRef.current.dragMode === 'master') {
                currentRotationGroup.quaternion.copy(masterTargetQuaternionRef.current);
            } else {
                currentRotationGroup.quaternion.slerp(masterTargetQuaternionRef.current, 0.09);
            }
            const flattenedTargetQuaternion = getFlattenedTargetQuaternion();
            if (isFlattenedRef.current && flattenedCameraPresetRef.current) {
                masterTargetQuaternionRef.current.copy(flattenedTargetQuaternion);
            }
            if (
                isFlattenedRef.current &&
                pointerStateRef.current.dragMode !== 'master' &&
                currentRotationGroup.quaternion.angleTo(flattenedTargetQuaternion) < ROTATION_SNAP_THRESHOLD
            ) {
                currentRotationGroup.quaternion.copy(flattenedTargetQuaternion);
                masterTargetQuaternionRef.current.copy(flattenedTargetQuaternion);
            }

            const targetFlattenProgress = isFlattenedRef.current ? 1 : 0;
            flattenProgressRef.current += (targetFlattenProgress - flattenProgressRef.current) * 0.08;
            if (Math.abs(targetFlattenProgress - flattenProgressRef.current) < 0.001) {
                flattenProgressRef.current = targetFlattenProgress;
            }

            const fogNearTarget = isFlattenedRef.current ? currentCamera.position.z - 8 : 18;
            const fogFarTarget = isFlattenedRef.current ? currentCamera.position.z + 90 : 120;
            if (currentScene.fog instanceof THREE.Fog) {
                currentScene.fog.near += (fogNearTarget - currentScene.fog.near) * 0.06;
                currentScene.fog.far += (fogFarTarget - currentScene.fog.far) * 0.06;
            }

            const idleTime = idleAnimationTimeRef.current;
            const localProgress = flattenProgressRef.current;
            const snappedFlattenProgress = getSnappedFlattenProgress(localProgress);
            const hasIdlePose = !isFlattenedRef.current && snappedFlattenProgress === 0;

            groupsRef.current.forEach((groupState) => {
                tempAnimatedBasePos.copy(groupState.basePos);
                if (hasIdlePose) {
                    tempOrbitQuaternion.setFromAxisAngle(
                        groupState.orbitAxis,
                        groupState.orbitPhase + idleTime * groupState.orbitSpeed,
                    );
                    tempAnimatedBasePos.applyQuaternion(tempOrbitQuaternion);
                }

                if (snappedFlattenProgress === 1) {
                    groupState.group.position.copy(groupState.flatPos);
                } else {
                    groupState.group.position.lerpVectors(
                        tempAnimatedBasePos,
                        groupState.flatPos,
                        snappedFlattenProgress,
                    );
                }

                tempGroupQuaternion.copy(groupState.restQuaternion);
                if (hasIdlePose) {
                    tempSpinQuaternion.setFromAxisAngle(groupState.spinAxis, idleTime * groupState.spinSpeed);
                    tempGroupQuaternion.multiply(tempSpinQuaternion).normalize();
                }

                if (snappedFlattenProgress === 1) {
                    groupState.group.quaternion.copy(IDENTITY_QUATERNION);
                } else {
                    groupState.group.quaternion
                        .copy(tempGroupQuaternion)
                        .slerp(IDENTITY_QUATERNION, snappedFlattenProgress);
                }

                if (snappedFlattenProgress === 1) {
                    groupState.labelSprite.position.copy(groupState.labelFlatPos);
                } else {
                    groupState.labelSprite.position.lerpVectors(
                        groupState.labelBasePos,
                        groupState.labelFlatPos,
                        snappedFlattenProgress,
                    );
                }
                groupState.wireMaterial.opacity = 0.18 * (1 - snappedFlattenProgress);
                groupState.flatMaterial.opacity = 0.04 + snappedFlattenProgress * 0.24;
                groupState.focusMaterial.opacity = 0.08 + snappedFlattenProgress * 0.36;
                groupState.edgeMaterial.opacity = 0.12 + (1 - snappedFlattenProgress) * 0.14;
                groupState.hitbox.scale.set(1, 1, 1 - snappedFlattenProgress * 0.92);

                groupState.nodeMeshes.forEach((mesh) => {
                    if (snappedFlattenProgress === 1) {
                        mesh.position.copy(mesh.userData.flatPos as THREE.Vector3);
                        return;
                    }

                    mesh.position.lerpVectors(
                        mesh.userData.basePos as THREE.Vector3,
                        mesh.userData.flatPos as THREE.Vector3,
                        snappedFlattenProgress,
                    );
                });

                if (groupState.intraEdgeLines) {
                    const positionAttribute =
                        groupState.intraEdgeLines.geometry.attributes.position as THREE.BufferAttribute;
                    let edgeIndex = 0;
                    groupState.intraEdges.forEach((edge) => {
                        const sourceMesh = groupState.nodeMeshes.get(edge.source);
                        const targetMesh = groupState.nodeMeshes.get(edge.target);
                        if (!sourceMesh || !targetMesh) return;
                        positionAttribute.setXYZ(
                            edgeIndex,
                            sourceMesh.position.x,
                            sourceMesh.position.y,
                            sourceMesh.position.z,
                        );
                        edgeIndex += 1;
                        positionAttribute.setXYZ(
                            edgeIndex,
                            targetMesh.position.x,
                            targetMesh.position.y,
                            targetMesh.position.z,
                        );
                        edgeIndex += 1;
                    });
                    positionAttribute.needsUpdate = true;
                }
            });

                if (fiberStateRef.current.line) {
                    const positionAttribute =
                        fiberStateRef.current.line.geometry.attributes.position as THREE.BufferAttribute;
                    let fiberIndex = 0;
                    fiberStateRef.current.interEdges.forEach((fiber) => {
                        const sourceMesh = nodeMeshesRef.current.get(fiber.source);
                        const targetMesh = nodeMeshesRef.current.get(fiber.target);
                        if (!sourceMesh || !targetMesh) return;

                        sourceMesh.getWorldPosition(tempVectorA);
                        targetMesh.getWorldPosition(tempVectorB);
                        contentGroup.worldToLocal(tempVectorA);
                        contentGroup.worldToLocal(tempVectorB);
                        const distance = tempVectorA.distanceTo(tempVectorB);
                        tempMid.copy(tempVectorA).lerp(tempVectorB, 0.5);
                        tempMid.add(fiber.bendDirection.clone().multiplyScalar(distance * 0.12));
                        tempMid.add(tempMid.clone().normalize().multiplyScalar(distance * 0.05));

                        tempCurve.v0.copy(tempVectorA);
                        tempCurve.v1.copy(tempMid);
                        tempCurve.v2.copy(tempVectorB);

                        const points = tempCurve.getPoints(FIBER_SEGMENTS);
                        for (let index = 0; index < FIBER_SEGMENTS; index += 1) {
                            positionAttribute.setXYZ(fiberIndex, points[index].x, points[index].y, points[index].z);
                            fiberIndex += 1;
                            positionAttribute.setXYZ(
                                fiberIndex,
                                points[index + 1].x,
                                points[index + 1].y,
                                points[index + 1].z,
                            );
                            fiberIndex += 1;
                        }
                    });
                    positionAttribute.needsUpdate = true;
                }

            particlesRef.current?.rotateY(0.00035);
            updateHoverState();

            const hoveredNodeId =
                hoveredNodeRef.current &&
                typeof hoveredNodeRef.current.userData.nodeId === 'string'
                    ? (hoveredNodeRef.current.userData.nodeId as string)
                    : null;

            groupsRef.current.forEach((groupState) => {
                if (!groupState.highlightEdgeLines) return;

                const highlightPositionAttribute =
                    groupState.highlightEdgeLines.geometry.attributes.position as THREE.BufferAttribute;
                let highlightIndex = 0;

                groupState.intraEdges.forEach((edge) => {
                    if (!hoveredNodeId || (edge.source !== hoveredNodeId && edge.target !== hoveredNodeId)) {
                        return;
                    }

                    const sourceMesh = groupState.nodeMeshes.get(edge.source);
                    const targetMesh = groupState.nodeMeshes.get(edge.target);
                    if (!sourceMesh || !targetMesh) return;

                    highlightPositionAttribute.setXYZ(
                        highlightIndex,
                        sourceMesh.position.x,
                        sourceMesh.position.y,
                        sourceMesh.position.z,
                    );
                    highlightIndex += 1;
                    highlightPositionAttribute.setXYZ(
                        highlightIndex,
                        targetMesh.position.x,
                        targetMesh.position.y,
                        targetMesh.position.z,
                    );
                    highlightIndex += 1;
                });

                highlightPositionAttribute.needsUpdate = true;
                groupState.highlightEdgeLines.geometry.setDrawRange(0, highlightIndex);
                groupState.highlightEdgeLines.visible = highlightIndex > 0;
                (groupState.highlightEdgeLines.material as THREE.LineBasicMaterial).opacity =
                    highlightIndex > 0 ? 0.92 - snappedFlattenProgress * 0.12 : 0;
            });

            if (fiberStateRef.current.highlightLine) {
                const highlightPositionAttribute =
                    fiberStateRef.current.highlightLine.geometry.attributes.position as THREE.BufferAttribute;
                let highlightIndex = 0;

                fiberStateRef.current.interEdges.forEach((fiber) => {
                    if (!hoveredNodeId || (fiber.source !== hoveredNodeId && fiber.target !== hoveredNodeId)) {
                        return;
                    }

                    const sourceMesh = nodeMeshesRef.current.get(fiber.source);
                    const targetMesh = nodeMeshesRef.current.get(fiber.target);
                    if (!sourceMesh || !targetMesh) return;

                    sourceMesh.getWorldPosition(tempVectorA);
                    targetMesh.getWorldPosition(tempVectorB);
                    contentGroup.worldToLocal(tempVectorA);
                    contentGroup.worldToLocal(tempVectorB);
                    const distance = tempVectorA.distanceTo(tempVectorB);
                    tempMid.copy(tempVectorA).lerp(tempVectorB, 0.5);
                    tempMid.add(fiber.bendDirection.clone().multiplyScalar(distance * 0.12));
                    tempMid.add(tempMid.clone().normalize().multiplyScalar(distance * 0.05));

                    tempCurve.v0.copy(tempVectorA);
                    tempCurve.v1.copy(tempMid);
                    tempCurve.v2.copy(tempVectorB);

                    const points = tempCurve.getPoints(FIBER_SEGMENTS);
                    for (let index = 0; index < FIBER_SEGMENTS; index += 1) {
                        highlightPositionAttribute.setXYZ(
                            highlightIndex,
                            points[index].x,
                            points[index].y,
                            points[index].z,
                        );
                        highlightIndex += 1;
                        highlightPositionAttribute.setXYZ(
                            highlightIndex,
                            points[index + 1].x,
                            points[index + 1].y,
                            points[index + 1].z,
                        );
                        highlightIndex += 1;
                    }
                });

                highlightPositionAttribute.needsUpdate = true;
                fiberStateRef.current.highlightLine.geometry.setDrawRange(0, highlightIndex);
                fiberStateRef.current.highlightLine.visible = highlightIndex > 0;
                (fiberStateRef.current.highlightLine.material as THREE.LineBasicMaterial).opacity =
                    highlightIndex > 0 ? 0.96 - snappedFlattenProgress * 0.14 : 0;
            }

            const focalLengthPx =
                currentRenderer.domElement.clientHeight /
                (2 * Math.tan(THREE.MathUtils.degToRad(currentCamera.fov * 0.5)));

            nodeMeshesRef.current.forEach((mesh, nodeId) => {
                const isHovered = hoveredNodeRef.current === mesh;
                const isFocused = focusedNodeIdRef.current === nodeId;
                const pulse = isFocused ? 0.18 * (1 + Math.sin(performance.now() * 0.006)) : 0;
                const targetScale = isHovered ? 1.8 : isFocused ? 1.2 + pulse : 1;
                mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.18);

                const material = mesh.material as THREE.MeshBasicMaterial;
                const targetOpacity = isHovered || isFocused ? 1 : (mesh.userData.baseOpacity as number);
                material.opacity += (targetOpacity - material.opacity) * 0.22;
                material.color.setHex(isHovered || isFocused ? 0xffffff : (mesh.userData.baseColor as number));

                const groupId =
                    typeof mesh.userData.groupId === 'string' ? mesh.userData.groupId : null;
                const labelSprite = groupId ? groupsRef.current.get(groupId)?.nodeLabels.get(nodeId) : undefined;
                if (!labelSprite) return;

                mesh.getWorldPosition(tempLabelWorld);
                tempLabelView.copy(tempLabelWorld).applyMatrix4(currentCamera.matrixWorldInverse);
                const depth = Math.max(Math.abs(tempLabelView.z), 0.01);
                const nodePixelDiameter = ((NODE_RADIUS * mesh.scale.x * 2) * focalLengthPx) / depth;
                const showLabel =
                    nodePixelDiameter >= LABEL_PIXEL_THRESHOLD || isHovered || isFocused;

                labelSprite.position.copy(mesh.position);
                labelSprite.position.y += NODE_RADIUS * mesh.scale.y + 0.82;
                labelSprite.position.z += 0.4;

                const labelMaterial = labelSprite.material as THREE.SpriteMaterial;
                const targetLabelOpacity = showLabel ? 1 : 0;
                labelMaterial.opacity += (targetLabelOpacity - labelMaterial.opacity) * 0.16;
                labelSprite.visible = labelMaterial.opacity > 0.03;
            });

            currentRenderer.render(currentScene, currentCamera);
        };

        animationFrameRef.current = window.requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }

            persistCurrentViewState(activeFieldRef.current);
            clearSceneContent();

            resizeObserverRef.current?.disconnect();
            renderer.domElement.removeEventListener('wheel', handleWheel);
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            lastAnimationTimestampRef.current = null;

            if (particlesRef.current) {
                particlesRef.current.removeFromParent();
                disposeObject(particlesRef.current);
            }

            masterPivotGroup.removeFromParent();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    useEffect(() => {
        activeFieldRef.current = activeField;
    }, [activeField]);

    useEffect(() => {
        if (!sceneRef.current) return;
        persistCurrentViewState(previousFilterRef.current);
        const frame = window.requestAnimationFrame(() => {
            rebuildSceneRef.current();
            previousFilterRef.current = activeField;
        });
        return () => window.cancelAnimationFrame(frame);
    }, [activeField, sceneSpec]);

    useEffect(() => {
        focusedNodeIdRef.current = focusedNodeId ?? null;
        if (focusedNodeId) {
            focusNodeInternalRef.current(focusedNodeId);
        }
    }, [focusedNodeId]);

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden select-none">
            <div
                className="pointer-events-none absolute inset-0 z-[2]"
                style={{
                    background:
                        'radial-gradient(circle at center, transparent 28%, rgba(0, 0, 0, 0.84) 100%)',
                }}
            />

            <button
                type="button"
                onClick={() => {
                    isFlattenedRef.current = !isFlattenedRef.current;
                    targetNavXYRef.current.set(0, 0);
                    targetNavRef.current = 0;
                    setNavSliderValue(sceneSpec.navMax);
                    setIsFlattenedUi(isFlattenedRef.current);
                    if (isFlattenedRef.current) {
                        masterTargetQuaternionRef.current.copy(getFlattenedTargetQuaternion());
                    }
                }}
                className={`absolute bottom-5 right-5 z-[12] rounded-full border px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.28em] transition-all ${
                    isFlattenedUi
                        ? 'border-white bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.18)]'
                        : 'border-white/24 bg-black/24 text-white/86 backdrop-blur-md hover:border-white/48 hover:bg-white/8'
                }`}
            >
                Exponential Map {isFlattenedUi ? '[ ON ]' : '[ OFF ]'}
            </button>

            <div
                className={`absolute right-5 top-1/2 z-[12] -translate-y-1/2 rounded-2xl border border-white/12 bg-black/42 px-3 py-3 backdrop-blur-xl transition-all ${
                    isFlattenedUi ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            >
                <div className="mb-3 flex flex-col gap-2">
                    {FLATTENED_CAMERA_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                                const nextPreset =
                                    flattenedCameraPresetRef.current === preset.id ? null : preset.id;
                                applyFlattenedCameraPreset(nextPreset);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.24em] transition-all ${
                                flattenedCameraPresetUi === preset.id
                                    ? 'border-white bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.16)]'
                                    : 'border-white/16 bg-white/[0.03] text-white/78 hover:border-white/40 hover:bg-white/10'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="flex h-40 w-5 items-center justify-center">
                    <input
                        type="range"
                        min={0}
                        max={navMax}
                        step={1}
                        value={navSliderValue}
                        onChange={(event) => {
                            const nextDisplayValue = Number(event.target.value);
                            const nextNav = navMax - nextDisplayValue;
                            targetNavRef.current = nextNav;
                            setNavSliderValue(nextDisplayValue);
                        }}
                        aria-label="Flattened manifold depth"
                        className="h-1 w-40 -rotate-90 accent-white"
                    />
                </div>
            </div>
        </div>
    );
});

export default Manifold3DView;
