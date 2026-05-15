import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Maximize2,
    Network,
    RefreshCw,
    Search,
    Section,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { GraphModel, GraphNode } from '../../lib/graphModel';
import { useTheme } from '../../lib/theme';

type DirectoryItemType = 'folder' | 'file';

type DirectoryTreeNode = {
    id: string;
    name: string;
    type: DirectoryItemType;
    graphNode: GraphNode | null;
    children: DirectoryTreeNode[];
};

type TreeMetaEntry = {
    id: string;
    name: string;
    type: DirectoryItemType;
    nodeType: GraphNode['type'] | 'virtual-root' | null;
    parentId: string | null;
    descendantIds: Set<string>;
};

type FlatGraphNode = {
    id: string;
    label: string;
    type: DirectoryItemType;
    nodeType: GraphNode['type'] | 'virtual-root';
    graphNode: GraphNode | null;
    parentId: string | null;
    groupId: string | null;
    x: number;
    y: number;
    vx: number;
    vy: number;
    fx: number | null;
    fy: number | null;
    orderIndex: number;
    siblingCount: number;
    hierarchyLevel: number;
    expandedSectionCount: number;
};

type FlatGraphLink = {
    id: string;
    source: FlatGraphNode;
    target: FlatGraphNode;
    type: 'structural' | 'cross' | 'temporal';
    originalType: string;
};

type DirectoryGraphPalette = {
    background: string;
    panel: string;
    panelBorder: string;
    text: string;
    textStrong: string;
    textMuted: string;
    control: string;
    controlHover: string;
    controlHoverText: string;
    input: string;
    inputFocus: string;
    shadow: string;
    lineStructural: string;
    lineStructuralActive: string;
    lineStructuralHold: string;
    lineCross: string;
    lineCrossActive: string;
    lineCrossHold: string;
    lineTemporal: string;
    lineTemporalActive: string;
    lineTemporalHold: string;
    nodeFill: string;
    nodeFolderFill: string;
    nodeSectionFill: string;
    nodeStroke: string;
    nodeStrokeSoft: string;
    halo: string;
    label: string;
    labelStrong: string;
    labelMuted: string;
    labelOutline: string;
};

type DirectoryGraphData = {
    treeRoot: DirectoryTreeNode;
    treeMeta: Record<string, TreeMetaEntry>;
    groupAnchors: Record<string, { x: number; y: number }>;
    nodes: FlatGraphNode[];
    links: FlatGraphLink[];
    crossLinks: FlatGraphLink[];
};

type HoldAttractionPair = {
    source: FlatGraphNode;
    target: FlatGraphNode;
    targetDistance: number;
    strength: number;
};

type HierarchyTracking = {
    getHoldScopeIds: (nodeId: string) => Set<string>;
    getTreePathIds: (nodeId: string) => Set<string>;
    isHigherHierarchy: (candidateId: string, heldId: string) => boolean;
};

type TreeNodeProps = {
    node: DirectoryTreeNode;
    level?: number;
    isLightTheme: boolean;
    selectedId: string | null;
    heldNodeIds: Set<string>;
    onSelect: (node: DirectoryTreeNode) => void;
    onToggleHold: (id: string) => void;
    searchQuery: string;
    expandedFolderIds: Set<string>;
    onToggleExpand: (id: string) => void;
    onDoubleClick: (node: DirectoryTreeNode) => void;
    isTreeCompressed: boolean;
    compressedVisibleSet: Set<string>;
};

export interface DirectoryGraphHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
    focusNode: (nodeId: string) => void;
}

interface DirectoryGraphViewProps {
    model: GraphModel;
    focusedNodeId?: string | null;
    initialHeldNodeId?: string | null;
    onNodeOpen?: (node: GraphNode) => void;
    onNodeFocus?: (nodeId: string | null) => void;
    onRefresh?: () => Promise<void> | void;
    headerActions?: ReactNode;
}

function getVisualNodeRadius(node: FlatGraphNode) {
    if (node.hierarchyLevel === 0) return 32;
    if (node.hierarchyLevel === 1) return 22;
    if (node.hierarchyLevel === 2) return node.type === 'folder' ? 10 : 6;
    if (node.hierarchyLevel === 3) return 4.5;
    return 3.5;
}

function getNodeCollisionRadius(node: FlatGraphNode) {
    const sectionExpansionPadding = node.expandedSectionCount > 0
        ? Math.min(72, 24 + node.expandedSectionCount * 10)
        : 0;
    const labelRadius =
        node.hierarchyLevel <= 1
            ? Math.min(150, Math.max(62, node.label.length * 4.2))
            : node.nodeType === 'section'
              ? Math.min(98, Math.max(34, node.label.length * 2.4))
              : Math.min(132, Math.max(38, node.label.length * 3.2));
    return getVisualNodeRadius(node) + labelRadius + sectionExpansionPadding + (node.hierarchyLevel <= 2 ? 24 : 18);
}

function getVisualLabelFontSize(node: FlatGraphNode, isSelected: boolean, isHovered: boolean, isStronglyHighlighted: boolean) {
    const baseSize =
        node.hierarchyLevel === 0
            ? 26
            : node.hierarchyLevel === 1
              ? 20
              : node.hierarchyLevel === 2
                ? 11
                : 9;

    if (isStronglyHighlighted) return baseSize + 1.4;
    if (isSelected || isHovered) return baseSize + 0.8;
    return baseSize;
}

function getVisualLabelWeight(node: FlatGraphNode, isSelected: boolean, isStronglyHighlighted: boolean) {
    if (node.hierarchyLevel <= 1) return '600';
    if (isStronglyHighlighted || isSelected) return '450';
    return node.nodeType === 'section' ? '350' : '400';
}

function getDirectoryGraphPalette(isLightTheme: boolean): DirectoryGraphPalette {
    if (isLightTheme) {
        return {
            background: '#ffffff',
            panel: '#ffffff',
            panelBorder: 'rgba(0,0,0,0)',
            text: '#000000',
            textStrong: '#000000',
            textMuted: 'rgba(0,0,0,0.6)',
            control: '#ffffff',
            controlHover: '#000000',
            controlHoverText: '#ffffff',
            input: '#ffffff',
            inputFocus: '#ffffff',
            shadow: 'none',
            lineStructural: 'rgba(0,0,0,0.9)',
            lineStructuralActive: 'rgba(0,0,0,1)',
            lineStructuralHold: 'rgba(0,0,0,1)',
            lineCross: 'rgba(0,0,0,0.88)',
            lineCrossActive: 'rgba(0,0,0,1)',
            lineCrossHold: 'rgba(0,0,0,1)',
            lineTemporal: 'rgba(0,0,0,0.82)',
            lineTemporalActive: 'rgba(0,0,0,1)',
            lineTemporalHold: 'rgba(0,0,0,1)',
            nodeFill: '#000000',
            nodeFolderFill: '#000000',
            nodeSectionFill: '#000000',
            nodeStroke: 'rgba(0,0,0,1)',
            nodeStrokeSoft: 'rgba(0,0,0,0.82)',
            halo: 'rgba(0,0,0,0.16)',
            label: '#000000',
            labelStrong: '#000000',
            labelMuted: 'rgba(0,0,0,0.62)',
            labelOutline: 'rgba(255,255,255,0.92)',
        };
    }

    return {
        background: '#000000',
        panel: '#000000',
        panelBorder: 'rgba(255,255,255,0)',
        text: '#ffffff',
        textStrong: '#ffffff',
        textMuted: 'rgba(255,255,255,0.62)',
        control: '#000000',
        controlHover: '#ffffff',
        controlHoverText: '#000000',
        input: '#000000',
        inputFocus: '#000000',
        shadow: 'none',
        lineStructural: 'rgba(255,255,255,0.92)',
        lineStructuralActive: 'rgba(255,255,255,1)',
        lineStructuralHold: 'rgba(255,255,255,1)',
        lineCross: 'rgba(255,255,255,0.88)',
        lineCrossActive: 'rgba(255,255,255,1)',
        lineCrossHold: 'rgba(255,255,255,1)',
        lineTemporal: 'rgba(255,255,255,0.84)',
        lineTemporalActive: 'rgba(255,255,255,1)',
        lineTemporalHold: 'rgba(255,255,255,1)',
        nodeFill: '#ffffff',
        nodeFolderFill: '#ffffff',
        nodeSectionFill: '#ffffff',
        nodeStroke: 'rgba(255,255,255,1)',
        nodeStrokeSoft: 'rgba(255,255,255,0.82)',
        halo: '#ffffff',
        label: '#ffffff',
        labelStrong: '#ffffff',
        labelMuted: 'rgba(255,255,255,0.62)',
        labelOutline: 'rgba(0,0,0,0.96)',
    };
}

function getVisualNodeFill(node: FlatGraphNode, palette: DirectoryGraphPalette) {
    if (node.nodeType === 'section') return palette.nodeSectionFill;
    if (node.type === 'folder') return palette.nodeFolderFill;
    return palette.nodeFill;
}

function getPhysicsLinkDistance(link: FlatGraphLink) {
    const parentLevel = Math.min(link.source.hierarchyLevel, link.target.hierarchyLevel);
    const branchDensity = Math.max(1, link.source.siblingCount, link.target.siblingCount);
    const targetFanout = Math.max(1, link.target.siblingCount);
    const expandedSectionCount = Math.max(link.source.expandedSectionCount, link.target.expandedSectionCount);
    const isSectionLink = link.source.nodeType === 'section' || link.target.nodeType === 'section';
    const expansionBoost = expandedSectionCount > 0
        ? Math.min(isSectionLink ? 82 : 170, (isSectionLink ? 34 : 70) + expandedSectionCount * (isSectionLink ? 8 : 18))
        : 0;

    if (parentLevel === 0) {
        return Math.max(860, Math.min(1320, 760 + branchDensity * 78));
    }

    if (parentLevel === 1) {
        const baseDistance = Math.max(280, Math.min(500, 248 + branchDensity * 22 + targetFanout * 8));
        return baseDistance + expansionBoost;
    }

    if (parentLevel === 2) {
        return isSectionLink
            ? Math.max(56, Math.min(96, 54 + branchDensity * 4 + targetFanout * 2)) + expansionBoost
            : Math.max(118, Math.min(198, 96 + branchDensity * 8 + targetFanout * 4)) + expansionBoost * 0.72;
    }

    return (isSectionLink
        ? Math.max(34, Math.min(72, 48 - parentLevel * 7 + branchDensity * 3))
        : Math.max(42, Math.min(98, 86 - parentLevel * 10 + branchDensity * 4))) + expansionBoost * 0.45;
}

function getDirectoryOrbitRadius(depth: number, siblingCount: number, expandedSectionCount = 0) {
    const expansionBoost = expandedSectionCount > 0
        ? Math.min(depth >= 3 ? 90 : 180, (depth >= 3 ? 30 : 74) + expandedSectionCount * (depth >= 3 ? 7 : 18))
        : 0;

    if (depth === 1) {
        return Math.max(940, Math.min(1480, 860 + siblingCount * 90));
    }

    if (depth === 2) {
        return Math.max(300, Math.min(520, 248 + siblingCount * 22)) + expansionBoost;
    }

    if (depth === 3) {
        return Math.max(62, Math.min(118, 58 + siblingCount * 5)) + expansionBoost * 0.52;
    }

    return Math.max(54, Math.min(128, 92 - depth * 9 + siblingCount * 5)) + expansionBoost * 0.42;
}

function getPhysicsChargeStrength(node: FlatGraphNode) {
    if (node.hierarchyLevel === 0) return -3000;
    if (node.hierarchyLevel === 1) return -1200;
    if (node.hierarchyLevel === 2) return -180;
    return -48;
}

function normalizeLabel(value: string | null | undefined) {
    return typeof value === 'string' ? value.replace(/\n+/g, ' ').trim() : '';
}

function isDirectoryGraphFolder(node: GraphNode) {
    return node.type === 'field' || node.type === 'cluster';
}

function isSectionGraphNode(node: GraphNode | null | undefined) {
    return node?.type === 'section';
}

function isTreeMetaSection(meta: TreeMetaEntry | undefined) {
    return meta?.nodeType === 'section';
}

function isWithinMathematicalPhysicsBranch(
    nodeId: string | null,
    treeMeta: Record<string, TreeMetaEntry>,
) {
    if (!nodeId) return false;

    const branchIds = new Set(['mathematical-physics', 'mathematical-physics-cluster']);
    let currentId: string | null = nodeId;

    while (currentId) {
        if (branchIds.has(currentId)) {
            return true;
        }

        const currentMeta: TreeMetaEntry | undefined = treeMeta[currentId];
        if (currentMeta?.name?.toLowerCase() === 'mathematical physics') {
            return true;
        }

        currentId = currentMeta?.parentId || null;
    }

    return false;
}

function isMathematicalPhysicsBoundaryLink(
    link: FlatGraphLink,
    treeMeta: Record<string, TreeMetaEntry>,
) {
    const sourceInMathematicalPhysics = isWithinMathematicalPhysicsBranch(link.source.id, treeMeta);
    const targetInMathematicalPhysics = isWithinMathematicalPhysicsBranch(link.target.id, treeMeta);
    return sourceInMathematicalPhysics !== targetInMathematicalPhysics;
}

function isPrerequisiteHierarchyLink(link: FlatGraphLink) {
    return link.originalType === 'prerequisite' || link.originalType === 'prereq';
}

function buildHierarchyTracking(
    treeMeta: Record<string, TreeMetaEntry>,
    links: FlatGraphLink[],
): HierarchyTracking {
    const semanticParentByChild = new Map<string, string>();
    const semanticChildrenByParent = new Map<string, Set<string>>();

    links.forEach((link) => {
        if (!isPrerequisiteHierarchyLink(link)) return;
        if (link.source.id === link.target.id) return;

        if (!semanticParentByChild.has(link.target.id)) {
            semanticParentByChild.set(link.target.id, link.source.id);
        }

        const currentChildren = semanticChildrenByParent.get(link.source.id) || new Set<string>();
        currentChildren.add(link.target.id);
        semanticChildrenByParent.set(link.source.id, currentChildren);
    });

    const treeAncestorCache = new Map<string, Set<string>>();
    const semanticAncestorCache = new Map<string, Set<string>>();
    const semanticDescendantCache = new Map<string, Set<string>>();
    const holdScopeCache = new Map<string, Set<string>>();
    const treePathCache = new Map<string, Set<string>>();

    const getTreeAncestors = (nodeId: string) => {
        const cached = treeAncestorCache.get(nodeId);
        if (cached) return cached;

        const ancestors = new Set<string>();
        let currentId: string | null = treeMeta[nodeId]?.parentId || null;
        while (currentId) {
            ancestors.add(currentId);
            currentId = treeMeta[currentId]?.parentId || null;
        }

        treeAncestorCache.set(nodeId, ancestors);
        return ancestors;
    };

    const getTreePathIds = (nodeId: string) => {
        const cached = treePathCache.get(nodeId);
        if (cached) return cached;

        const pathIds = new Set<string>([nodeId]);
        getTreeAncestors(nodeId).forEach((ancestorId) => pathIds.add(ancestorId));
        treePathCache.set(nodeId, pathIds);
        return pathIds;
    };

    const getSemanticAncestors = (nodeId: string) => {
        const cached = semanticAncestorCache.get(nodeId);
        if (cached) return cached;

        const ancestors = new Set<string>();
        const visited = new Set<string>();
        let currentId: string | null = semanticParentByChild.get(nodeId) || null;

        while (currentId) {
            if (visited.has(currentId)) break;
            visited.add(currentId);
            ancestors.add(currentId);
            currentId = semanticParentByChild.get(currentId) || null;
        }

        semanticAncestorCache.set(nodeId, ancestors);
        return ancestors;
    };

    const getSemanticDescendants = (nodeId: string) => {
        const cached = semanticDescendantCache.get(nodeId);
        if (cached) return cached;

        const descendants = new Set<string>();
        const stack = [nodeId];
        const visited = new Set<string>([nodeId]);

        while (stack.length > 0) {
            const currentId = stack.pop()!;
            const children = semanticChildrenByParent.get(currentId);
            if (!children) continue;

            children.forEach((childId) => {
                if (visited.has(childId)) return;
                visited.add(childId);
                descendants.add(childId);
                stack.push(childId);
            });
        }

        semanticDescendantCache.set(nodeId, descendants);
        return descendants;
    };

    const getHoldScopeIds = (nodeId: string) => {
        const cached = holdScopeCache.get(nodeId);
        if (cached) return cached;

        const scopeIds = new Set<string>();
        scopeIds.add(nodeId);

        const treeDescendants = treeMeta[nodeId]?.descendantIds || new Set<string>();
        treeDescendants.forEach((descendantId) => {
            if (isTreeMetaSection(treeMeta[descendantId])) return;
            scopeIds.add(descendantId);
        });

        getSemanticDescendants(nodeId).forEach((descendantId) => {
            scopeIds.add(descendantId);
        });

        holdScopeCache.set(nodeId, scopeIds);
        return scopeIds;
    };

    const isHigherHierarchy = (candidateId: string, heldId: string) => {
        if (candidateId === heldId) return false;
        return getTreeAncestors(heldId).has(candidateId) || getSemanticAncestors(heldId).has(candidateId);
    };

    return {
        getHoldScopeIds,
        getTreePathIds,
        isHigherHierarchy,
    };
}

function sortTreeChildren(left: DirectoryTreeNode, right: DirectoryTreeNode) {
    const leftSectionIndex =
        left.graphNode?.type === 'section' && typeof left.graphNode.data?.sectionIndex === 'number'
            ? (left.graphNode.data.sectionIndex as number)
            : null;
    const rightSectionIndex =
        right.graphNode?.type === 'section' && typeof right.graphNode.data?.sectionIndex === 'number'
            ? (right.graphNode.data.sectionIndex as number)
            : null;

    if (leftSectionIndex !== null && rightSectionIndex !== null && leftSectionIndex !== rightSectionIndex) {
        return leftSectionIndex - rightSectionIndex;
    }

    if (left.type !== right.type) {
        return left.type === 'folder' ? -1 : 1;
    }

    const leftYear =
        left.graphNode && typeof left.graphNode.data?.year === 'number'
            ? (left.graphNode.data.year as number)
            : Number(left.graphNode?.data?.year) || null;
    const rightYear =
        right.graphNode && typeof right.graphNode.data?.year === 'number'
            ? (right.graphNode.data.year as number)
            : Number(right.graphNode?.data?.year) || null;

    if (typeof leftYear === 'number' && typeof rightYear === 'number' && leftYear !== rightYear) {
        return leftYear - rightYear;
    }

    return left.name.localeCompare(right.name);
}

function buildTreeMetadata(rootNode: DirectoryTreeNode) {
    const metadata: Record<string, TreeMetaEntry> = {};

    const traverse = (node: DirectoryTreeNode, parentId: string | null) => {
        const descendants = new Set<string>();
        node.children.forEach((child) => {
            descendants.add(child.id);
            const childDescendants = traverse(child, node.id);
            childDescendants.forEach((descendantId) => descendants.add(descendantId));
        });

        metadata[node.id] = {
            id: node.id,
            name: node.name,
            type: node.type,
            nodeType: node.graphNode?.type || null,
            parentId,
            descendantIds: descendants,
        };

        return descendants;
    };

    traverse(rootNode, null);
    return metadata;
}

function getDefaultExpandedDirectoryIds(treeRoot: DirectoryTreeNode) {
    const defaultExpanded = new Set<string>();
    defaultExpanded.add(treeRoot.id);
    treeRoot.children.forEach((child) => {
        if (child.type === 'folder') {
            defaultExpanded.add(child.id);
        }
    });
    return defaultExpanded;
}

function buildDirectoryGraphData(
    model: GraphModel,
    expandedNodeIds: Set<string> = new Set(),
): DirectoryGraphData {
    const graphNodeById = new Map(model.nodes.map((node) => [node.id, node]));
    const childIdsByParentId = new Map<string, string[]>();
    const parentIdByNodeId = new Map<string, string>();
    const validHierarchyEdges = model.edges.filter((edge) => {
        if (edge.type !== 'hierarchy') return false;

        const source = graphNodeById.get(edge.source);
        const target = graphNodeById.get(edge.target);
        if (!source || !target || source.id === target.id) return false;

        return target.type !== 'root';
    });

    validHierarchyEdges.forEach((edge) => {
        const currentChildren = childIdsByParentId.get(edge.source) || [];
        currentChildren.push(edge.target);
        childIdsByParentId.set(edge.source, currentChildren);

        if (!parentIdByNodeId.has(edge.target)) {
            parentIdByNodeId.set(edge.target, edge.source);
        }
    });

    const buildTreeNode = (nodeId: string, ancestors = new Set<string>()): DirectoryTreeNode => {
        const graphNode = graphNodeById.get(nodeId) || null;
        const childIds = childIdsByParentId.get(nodeId) || [];
        const nodeLabel = normalizeLabel(graphNode?.label || graphNode?.slug || nodeId) || nodeId;
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(nodeId);
        const children = childIds
            .flatMap((childId) => {
                if (nextAncestors.has(childId)) {
                    return [];
                }

                const childNode = buildTreeNode(childId, nextAncestors);
                const childLabel = normalizeLabel(childNode.name);
                const shouldFlattenDuplicateFolder =
                    childNode.type === 'folder' &&
                    childLabel.length > 0 &&
                    childLabel.toLowerCase() === nodeLabel.toLowerCase();

                return shouldFlattenDuplicateFolder ? childNode.children : [childNode];
            })
            .sort(sortTreeChildren);

        return {
            id: nodeId,
            name: nodeLabel,
            type: graphNode && isDirectoryGraphFolder(graphNode) ? 'folder' : 'file',
            graphNode,
            children,
        };
    };

    const getSectionParentId = (nodeId: string) => {
        const node = graphNodeById.get(nodeId);
        if (!isSectionGraphNode(node)) return null;

        const parentTopicId =
            typeof node?.data?.parentTopicId === 'string'
                ? (node.data.parentTopicId as string)
                : null;

        return parentIdByNodeId.get(nodeId) || parentTopicId;
    };

    const isSectionVisibleInGraph = (nodeId: string) => {
        const parentId = getSectionParentId(nodeId);
        return parentId !== null && expandedNodeIds.has(parentId);
    };

    const resolveVisibleGraphNodeId = (nodeId: string) => {
        const node = graphNodeById.get(nodeId);
        if (!isSectionGraphNode(node)) return nodeId;

        const parentId = getSectionParentId(nodeId);
        if (!parentId) return nodeId;

        return expandedNodeIds.has(parentId) ? nodeId : parentId;
    };

    const rootNode = model.nodes.find((node) => node.type === 'root');
    const rootChildIds = new Set(rootNode ? childIdsByParentId.get(rootNode.id) || [] : []);
    const topLevelNodeIds = model.nodes
        .filter((node) => node.type !== 'root')
        .filter((node) => rootChildIds.has(node.id) || !parentIdByNodeId.has(node.id))
        .map((node) => node.id)
        .sort((leftId, rightId) => {
            const leftNode = graphNodeById.get(leftId)!;
            const rightNode = graphNodeById.get(rightId)!;
            return sortTreeChildren(
                {
                    id: leftNode.id,
                    name: normalizeLabel(leftNode.label) || leftNode.id,
                    type: isDirectoryGraphFolder(leftNode) ? 'folder' : 'file',
                    graphNode: leftNode,
                    children: [],
                },
                {
                    id: rightNode.id,
                    name: normalizeLabel(rightNode.label) || rightNode.id,
                    type: isDirectoryGraphFolder(rightNode) ? 'folder' : 'file',
                    graphNode: rightNode,
                    children: [],
                },
            );
        });

    const treeRoot: DirectoryTreeNode = {
        id: '__virtual_root__',
        name: 'Knowledge Graph',
        type: 'folder',
        graphNode: null,
        children: topLevelNodeIds.map((nodeId) => buildTreeNode(nodeId)).sort(sortTreeChildren),
    };

    const treeMeta = buildTreeMetadata(treeRoot);
    const groupAnchors: Record<string, { x: number; y: number }> = {};
    const nodes: FlatGraphNode[] = [];
    const nodeById = new Map<string, FlatGraphNode>();
    const structuralLinks: FlatGraphLink[] = [];
    const topLevelCount = Math.max(1, treeRoot.children.length);
    const rootGraphNode = rootNode || null;
    const rootFlatNode: FlatGraphNode = {
        id: rootGraphNode?.id || treeRoot.id,
        label: normalizeLabel(rootGraphNode?.label || treeRoot.name) || 'PHYSICS',
        type: 'folder',
        nodeType: rootGraphNode?.type || 'virtual-root',
        graphNode: rootGraphNode,
        parentId: null,
        groupId: null,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        orderIndex: 0,
        siblingCount: 1,
        hierarchyLevel: 0,
        expandedSectionCount: 0,
    };

    nodes.push(rootFlatNode);
    nodeById.set(rootFlatNode.id, rootFlatNode);

    treeRoot.children.forEach((child, index) => {
        const angle = (index / topLevelCount) * Math.PI * 2 - Math.PI / 2;
        const anchorRadiusX = topLevelCount > 1
            ? Math.min(960, Math.max(620, topLevelCount * 150))
            : 0;
        const anchorRadiusY = topLevelCount > 1
            ? Math.min(700, Math.max(420, topLevelCount * 105))
            : 0;

        groupAnchors[child.id] = {
            x: Math.cos(angle) * anchorRadiusX,
            y: Math.sin(angle) * anchorRadiusY,
        };
    });

    const addFlatNode = (
        node: DirectoryTreeNode,
        parentId: string | null,
        groupId: string | null,
        depth: number,
        siblingIndex: number,
        siblingCount: number,
    ) => {
        const resolvedGroupId = groupId || node.id;
        const groupAnchor = groupAnchors[resolvedGroupId] || { x: 0, y: 0 };
        const isSection = isSectionGraphNode(node.graphNode);
        const visibleGraphChildren = node.children.filter((child) => {
            if (!isSectionGraphNode(child.graphNode)) return true;
            return isSectionVisibleInGraph(child.id);
        });
        const expandedSectionCount = visibleGraphChildren.filter((child) => isSectionGraphNode(child.graphNode)).length;
        const angle = siblingCount > 0
            ? -Math.PI / 2 + (siblingIndex / Math.max(1, siblingCount)) * Math.PI * 2
            : -Math.PI / 2;
        const parentNode = parentId ? nodeById.get(parentId) : null;
        const sectionRadius = Math.max(42, Math.min(82, 38 + siblingCount * 5));
        const childRadius = isSection
            ? sectionRadius
            : getDirectoryOrbitRadius(depth, siblingCount, expandedSectionCount);
        const x = parentNode
            ? parentNode.x + Math.cos(angle) * childRadius
            : parentId === null
                ? groupAnchor.x
                : groupAnchor.x + Math.cos(angle) * childRadius + depth * 18;
        const y = parentNode
            ? parentNode.y + Math.sin(angle) * childRadius
            : parentId === null
                ? groupAnchor.y
                : groupAnchor.y + Math.sin(angle) * childRadius;

        const flatNode: FlatGraphNode = {
            id: node.id,
            label: node.name,
            type: node.type,
            nodeType: node.graphNode?.type || 'virtual-root',
            graphNode: node.graphNode,
            parentId,
            groupId: resolvedGroupId,
            x,
            y,
            vx: 0,
            vy: 0,
            fx: null,
            fy: null,
            orderIndex: siblingIndex,
            siblingCount,
            hierarchyLevel: depth,
            expandedSectionCount,
        };

        nodes.push(flatNode);
        nodeById.set(flatNode.id, flatNode);

        visibleGraphChildren.forEach((child, index) => {
            addFlatNode(child, node.id, resolvedGroupId, depth + 1, index, visibleGraphChildren.length);
        });
    };

    treeRoot.children.forEach((child, index) => {
        addFlatNode(child, rootFlatNode.id, child.id, 1, index, topLevelCount);
    });

    validHierarchyEdges.forEach((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) return;

        structuralLinks.push({
            id: `${edge.source}-${edge.target}`,
            source,
            target,
            type: 'structural',
            originalType: 'hierarchy',
        });
    });

    const expandedSectionRelationKeys = new Set<string>();
    model.edges
        .filter((edge) => edge.type !== 'hierarchy')
        .forEach((edge) => {
            const sourceNode = graphNodeById.get(edge.source);
            const targetNode = graphNodeById.get(edge.target);
            const sourceIsVisibleSection = isSectionGraphNode(sourceNode) && isSectionVisibleInGraph(edge.source);
            const targetIsVisibleSection = isSectionGraphNode(targetNode) && isSectionVisibleInGraph(edge.target);
            if (!sourceIsVisibleSection && !targetIsVisibleSection) return;

            const visibleSourceId = resolveVisibleGraphNodeId(edge.source);
            const visibleTargetId = resolveVisibleGraphNodeId(edge.target);
            const collapsedSourceId = sourceIsVisibleSection
                ? getSectionParentId(edge.source)
                : visibleSourceId;
            const collapsedTargetId = targetIsVisibleSection
                ? getSectionParentId(edge.target)
                : visibleTargetId;

            if (!collapsedSourceId || !collapsedTargetId || collapsedSourceId === collapsedTargetId) return;

            expandedSectionRelationKeys.add(`${collapsedSourceId}|${collapsedTargetId}|${edge.type || edge.label || 'relational'}`);
        });

    const relationLinks = model.edges
        .filter((edge) => edge.type !== 'hierarchy')
        .flatMap((edge, index) => {
            const visibleSourceId = resolveVisibleGraphNodeId(edge.source);
            const visibleTargetId = resolveVisibleGraphNodeId(edge.target);
            if (visibleSourceId === visibleTargetId) return [];

            const sourceGraphNode = graphNodeById.get(edge.source);
            const targetGraphNode = graphNodeById.get(edge.target);
            const relationKey = `${visibleSourceId}|${visibleTargetId}|${edge.type || edge.label || 'relational'}`;
            const isExpandedSectionEndpoint =
                (isSectionGraphNode(sourceGraphNode) && isSectionVisibleInGraph(edge.source)) ||
                (isSectionGraphNode(targetGraphNode) && isSectionVisibleInGraph(edge.target));
            if (!isExpandedSectionEndpoint && expandedSectionRelationKeys.has(relationKey)) {
                return [];
            }

            const source = nodeById.get(visibleSourceId);
            const target = nodeById.get(visibleTargetId);
            if (!source || !target) return [];

            const sourceParentId = source.parentId;
            const targetParentId = target.parentId;
            const isSameDirectoryFiles =
                source.type === 'file' &&
                target.type === 'file' &&
                sourceParentId !== null &&
                sourceParentId === targetParentId;

            if (isSameDirectoryFiles) {
                return [];
            }

            return [
                {
                    id: edge.label
                        ? `${edge.label}-${index}-${visibleSourceId}-${visibleTargetId}`
                        : `${index}-${visibleSourceId}-${visibleTargetId}`,
                    source,
                    target,
                    type: edge.type === 'temporal' ? 'temporal' : 'cross',
                    originalType: edge.type || edge.label || 'relational',
                } satisfies FlatGraphLink,
            ];
        });

    const uniqueRelationLinks = Array.from(
        new Map(
            relationLinks.map((link) => [
                `${link.source.id}|${link.target.id}|${link.type}|${link.originalType}`,
                link,
            ]),
        ).values(),
    );

    const crossLinks = uniqueRelationLinks.filter((link) => {
        const sameDirectoryFiles =
            link.source.type === 'file' &&
            link.target.type === 'file' &&
            link.source.parentId !== null &&
            link.source.parentId === link.target.parentId;

        return !sameDirectoryFiles;
    });

    return {
        treeRoot,
        treeMeta,
        groupAnchors,
        nodes,
        links: [...structuralLinks, ...uniqueRelationLinks],
        crossLinks,
    };
}

function TreeNode({
    node,
    level = 0,
    isLightTheme,
    selectedId,
    heldNodeIds,
    onSelect,
    onToggleHold,
    searchQuery,
    expandedFolderIds,
    onToggleExpand,
    onDoubleClick,
    isTreeCompressed,
    compressedVisibleSet,
}: TreeNodeProps) {
    if (isTreeCompressed && !compressedVisibleSet.has(node.id)) {
        return null;
    }

    const isSelected = selectedId === node.id;
    const isFolder = node.type === 'folder';
    const isSection = isSectionGraphNode(node.graphNode);
    const isExpandable = node.children.length > 0;
    const isOpen = expandedFolderIds.has(node.id);
    const isHeld = heldNodeIds.has(node.id);
    const itemBaseClass = isLightTheme
        ? 'border-transparent text-black/88 hover:bg-black/[0.04] hover:text-black'
        : 'border-transparent text-white/92 hover:bg-white/[0.06] hover:text-white';
    const itemSelectedClass = isLightTheme
        ? 'border-black/12 bg-white text-black shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]'
        : 'border-white/10 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]';
    const chevronClass = isLightTheme ? 'text-black/60' : 'text-white/70';
    const folderClass = isLightTheme ? 'text-black' : 'text-white';
    const sectionClass = isLightTheme ? 'text-black/96' : 'text-white/90';
    const fileClass = isLightTheme ? 'text-black/78' : 'text-white/84';
    const searchButtonClass = isLightTheme
        ? 'text-black/55 opacity-0 hover:bg-black/[0.06] hover:text-black group-hover:opacity-100'
        : 'text-white/62 opacity-0 hover:bg-white/[0.08] hover:text-white group-hover:opacity-100';
    const dividerClass = isLightTheme ? 'bg-black/[0.06]' : 'bg-white/[0.06]';

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span
                    key={`${node.id}-${index}`}
                    className={isLightTheme
                        ? 'rounded-sm bg-black px-[2px] font-medium text-white'
                        : 'rounded-sm bg-white px-[2px] font-medium text-black'}
                >
                    {part}
                </span>
            ) : (
                <React.Fragment key={`${node.id}-${index}`}>{part}</React.Fragment>
            ),
        );
    };

    const handleToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (isExpandable) {
            onToggleExpand(node.id);
        }
    };

    return (
        <div className="relative z-10 flex flex-col">
            <div
                data-node-id={node.id}
                className={`group mx-3 mt-[2px] flex cursor-pointer items-center rounded-md border px-2 py-[7px] backdrop-blur-sm transition-all duration-300 ${
                    isSelected
                        ? itemSelectedClass
                        : itemBaseClass
                }`}
                style={{ paddingLeft: `${level * 16 + 10}px` }}
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect(node);
                }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    onDoubleClick(node);
                }}
            >
                <div
                    className={`mr-1 flex h-5 w-5 items-center justify-center rounded-sm transition-colors ${isLightTheme ? 'hover:bg-black/[0.06]' : 'hover:bg-white/10'}`}
                    onClick={handleToggle}
                >
                    {isExpandable ? (
                        isOpen ? (
                            <ChevronDown size={14} className={chevronClass} />
                        ) : (
                            <ChevronRight size={14} className={chevronClass} />
                        )
                    ) : (
                        <span className="w-4" />
                    )}
                </div>

                {isFolder ? (
                    isOpen ? (
                        <FolderOpen size={14} className={`mr-2 drop-shadow-none ${folderClass}`} />
                    ) : (
                        <Folder size={14} className={`mr-2 ${folderClass}`} />
                    )
                ) : (
                    isSection ? (
                        <Section size={14} className={`mr-2 ${sectionClass}`} />
                    ) : (
                        <FileText size={14} className={`mr-2 ${fileClass}`} />
                    )
                )}

                <span className="flex-1 truncate text-[12px] font-light tracking-[0.05em]">
                    {highlightMatch(node.name, searchQuery)}
                </span>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleHold(node.id);
                    }}
                    className={`ml-2 flex-shrink-0 rounded-md p-1 transition-all duration-300 ${
                        isHeld
                            ? isLightTheme
                                ? 'bg-black text-white opacity-100'
                                : 'bg-white/20 text-white opacity-100'
                            : searchButtonClass
                    }`}
                    title="Search & squash related nodes"
                >
                    <Search size={12} strokeWidth={isHeld ? 2.5 : 1.5} />
                </button>
            </div>

            {isExpandable && isOpen ? (
                <div className="relative mt-[2px] flex flex-col">
                    <div className={`absolute bottom-0 left-[18px] top-0 ml-[0.5px] w-[1px] ${dividerClass}`} />
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            isLightTheme={isLightTheme}
                            selectedId={selectedId}
                            heldNodeIds={heldNodeIds}
                            onSelect={onSelect}
                            onToggleHold={onToggleHold}
                            searchQuery={searchQuery}
                            expandedFolderIds={expandedFolderIds}
                            onToggleExpand={onToggleExpand}
                            onDoubleClick={onDoubleClick}
                            isTreeCompressed={isTreeCompressed}
                            compressedVisibleSet={compressedVisibleSet}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export const DirectoryGraphView = forwardRef<DirectoryGraphHandle, DirectoryGraphViewProps>(
    function DirectoryGraphView(
        {
            model,
            focusedNodeId = null,
            initialHeldNodeId = null,
            onNodeOpen,
            onNodeFocus,
            onRefresh,
            headerActions,
        },
        ref,
    ) {
        const { isLight } = useTheme();
        const graphPalette = useMemo(() => getDirectoryGraphPalette(isLight), [isLight]);
        const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
        const graphData = useMemo(
            () => buildDirectoryGraphData(model, expandedFolderIds),
            [expandedFolderIds, model],
        );
        const [graphSnapshot, setGraphSnapshot] = useState<DirectoryGraphData>(graphData);
        const nodesRef = useRef<FlatGraphNode[]>(graphData.nodes);
        const linksRef = useRef<FlatGraphLink[]>(graphData.links);
        const nodeByIdRef = useRef<Map<string, FlatGraphNode>>(
            new Map(graphData.nodes.map((node) => [node.id, node])),
        );
        const svgRef = useRef<SVGSVGElement | null>(null);
        const transformRef = useRef({ x: 0, y: 0, k: 1 });
        const autoFitFrameBudgetRef = useRef(0);
        const userViewportTouchedRef = useRef(false);
        const isDraggingViewport = useRef(false);
        const dragStartPos = useRef({ x: 0, y: 0 });
        const simRef = useRef<{ alpha: number; frameId: number | null }>({ alpha: 1, frameId: null });
        const flyAnimFrame = useRef<number | null>(null);
        const activeInfoRef = useRef<{ id: string | null; neighbors: Set<string> }>({
            id: null,
            neighbors: new Set(),
        });
        const holdAttractionPairsRef = useRef<HoldAttractionPair[]>([]);
        const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusedNodeId);
        const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
        const [heldNodeIds, setHeldNodeIds] = useState<Set<string>>(new Set());
        const [autoHeldNodeId, setAutoHeldNodeId] = useState<string | null>(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [isTreeCompressed, setIsTreeCompressed] = useState(false);
        const isTreeCompressedRef = useRef(false);
        const appliedInitialHeldNodeIdRef = useRef<string | null>(null);

        useEffect(() => {
            setGraphSnapshot(graphData);
            nodesRef.current = graphData.nodes;
            linksRef.current = graphData.links;
            nodeByIdRef.current = new Map(graphData.nodes.map((node) => [node.id, node]));
            setSelectedNodeId((previous) =>
                previous && graphData.nodes.some((node) => node.id === previous) ? previous : null,
            );
            setHoveredNodeId(null);
            setHeldNodeIds((previous) => {
                const next = new Set<string>();
                previous.forEach((id) => {
                    if (graphData.nodes.some((node) => node.id === id)) {
                        next.add(id);
                    }
                });
                return next;
            });
            setAutoHeldNodeId((previous) =>
                previous && graphData.nodes.some((node) => node.id === previous) ? previous : null,
            );
            if (!userViewportTouchedRef.current) {
                autoFitFrameBudgetRef.current = 90;
            }
            simRef.current.alpha = 1;
        }, [graphData]);

        useEffect(() => {
            const initialGraphData = buildDirectoryGraphData(model);
            const defaultExpanded = getDefaultExpandedDirectoryIds(initialGraphData.treeRoot);

            setExpandedFolderIds(defaultExpanded);
            setSelectedNodeId((previous) =>
                previous && initialGraphData.nodes.some((node) => node.id === previous) ? previous : null,
            );
            setHoveredNodeId(null);
            setIsTreeCompressed(false);
            isTreeCompressedRef.current = false;
            setAutoHeldNodeId((previous) =>
                previous && initialGraphData.nodes.some((node) => node.id === previous) ? previous : null,
            );
            nodeByIdRef.current = new Map(initialGraphData.nodes.map((node) => [node.id, node]));
            transformRef.current = { x: 0, y: 0, k: 1 };
            userViewportTouchedRef.current = false;
            autoFitFrameBudgetRef.current = 110;
            simRef.current.alpha = 1;
        }, [model]);

        const wakeUpSimulation = useCallback((alpha = 0.45) => {
            simRef.current.alpha = Math.max(simRef.current.alpha, alpha);
        }, []);

        const flyToNode = useCallback((nodeId: string) => {
            const node = nodesRef.current.find((entry) => entry.id === nodeId);
            if (!node || !svgRef.current) return;

            userViewportTouchedRef.current = true;
            autoFitFrameBudgetRef.current = 0;

            if (flyAnimFrame.current) {
                cancelAnimationFrame(flyAnimFrame.current);
            }

            const svgRect = svgRef.current.getBoundingClientRect();
            const centerX = svgRect.width / 2;
            const centerY = svgRect.height / 2;
            const targetScale = Math.max(transformRef.current.k, 1.25);
            const startX = transformRef.current.x;
            const startY = transformRef.current.y;
            const startScale = transformRef.current.k;
            const targetX = centerX - node.x * targetScale;
            const targetY = centerY - node.y * targetScale;
            const duration = 700;
            let startTime: number | null = null;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const ease =
                    progress < 0.5
                        ? 16 * progress * progress * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 5) / 2;

                transformRef.current.x = startX + (targetX - startX) * ease;
                transformRef.current.y = startY + (targetY - startY) * ease;
                transformRef.current.k = startScale + (targetScale - startScale) * ease;

                const container = document.getElementById('directory-graph-transform-container');
                if (container) {
                    container.setAttribute(
                        'transform',
                        `translate(${transformRef.current.x}, ${transformRef.current.y}) scale(${transformRef.current.k})`,
                    );
                }

                if (progress < 1) {
                    flyAnimFrame.current = requestAnimationFrame(animate);
                } else {
                    flyAnimFrame.current = null;
                }
            };

            flyAnimFrame.current = requestAnimationFrame(animate);
        }, []);

        useEffect(() => {
            if (!initialHeldNodeId) {
                appliedInitialHeldNodeIdRef.current = null;
                return;
            }

            if (appliedInitialHeldNodeIdRef.current === initialHeldNodeId) {
                return;
            }

            if (!graphSnapshot.nodes.some((node) => node.id === initialHeldNodeId)) {
                return;
            }

            appliedInitialHeldNodeIdRef.current = initialHeldNodeId;
            setAutoHeldNodeId(initialHeldNodeId);
            setSelectedNodeId(initialHeldNodeId);
            setHoveredNodeId(null);
            setIsTreeCompressed(true);
            isTreeCompressedRef.current = true;
            onNodeFocus?.(initialHeldNodeId);

            setExpandedFolderIds((previous) => {
                const next = new Set(previous);
                let currentId: string | null = initialHeldNodeId;
                while (currentId) {
                    next.add(currentId);
                    currentId = graphSnapshot.treeMeta[currentId]?.parentId || null;
                }
                return next;
            });

            wakeUpSimulation(1);
            requestAnimationFrame(() => {
                flyToNode(initialHeldNodeId);
            });
        }, [
            flyToNode,
            graphSnapshot.nodes,
            graphSnapshot.treeMeta,
            initialHeldNodeId,
            onNodeFocus,
            wakeUpSimulation,
        ]);

        const activeHeldNodeIds = useMemo(() => {
            const next = new Set(heldNodeIds);
            if (autoHeldNodeId) {
                next.add(autoHeldNodeId);
            }
            return next;
        }, [autoHeldNodeId, heldNodeIds]);
        const isHoldModeActive = activeHeldNodeIds.size > 0;
        const hierarchyTracking = useMemo(
            () => buildHierarchyTracking(graphSnapshot.treeMeta, graphSnapshot.links),
            [graphSnapshot.links, graphSnapshot.treeMeta],
        );
        const heldTreePathIds = useMemo(() => {
            const pathIds = new Set<string>();
            activeHeldNodeIds.forEach((id) => {
                hierarchyTracking.getTreePathIds(id).forEach((pathId) => pathIds.add(pathId));
            });
            return pathIds;
        }, [activeHeldNodeIds, hierarchyTracking]);
        const heldHierarchyScopes = useMemo(() => {
            const scopes = new Map<string, Set<string>>();
            activeHeldNodeIds.forEach((id) => {
                scopes.set(id, hierarchyTracking.getHoldScopeIds(id));
            });
            return scopes;
        }, [activeHeldNodeIds, hierarchyTracking]);
        const isLinkAllowedUnderHold = useCallback(
            (link: FlatGraphLink, resolvedSourceId?: string, resolvedTargetId?: string) => {
                if (heldHierarchyScopes.size === 0) {
                    return true;
                }

                const sourceId = resolvedSourceId || link.source.id;
                const targetId = resolvedTargetId || link.target.id;

                for (const [heldId, scopeIds] of heldHierarchyScopes.entries()) {
                    const treePathIds = hierarchyTracking.getTreePathIds(heldId);
                    const sourceInScope = scopeIds.has(sourceId);
                    const targetInScope = scopeIds.has(targetId);
                    const sourceOnPath = treePathIds.has(sourceId);
                    const targetOnPath = treePathIds.has(targetId);
                    const touchesScope = sourceInScope || targetInScope;
                    const touchesPath = sourceOnPath || targetOnPath;

                    if (link.type === 'structural') {
                        if (touchesScope || touchesPath) {
                            return true;
                        }
                        continue;
                    }

                    if (!touchesScope) {
                        continue;
                    }

                    if (sourceInScope && !hierarchyTracking.isHigherHierarchy(targetId, heldId)) {
                        return true;
                    }
                    if (targetInScope && !hierarchyTracking.isHigherHierarchy(sourceId, heldId)) {
                        return true;
                    }
                }

                return false;
            },
            [heldHierarchyScopes, hierarchyTracking],
        );
        const holdSubgraphVisibleNodeIds = useMemo(() => {
            if (!isHoldModeActive) {
                return new Set(graphSnapshot.nodes.map((node) => node.id));
            }

            const visible = new Set<string>(heldTreePathIds);
            const expandable = new Set<string>();
            const queue: string[] = [];

            const enqueue = (nodeId: string) => {
                if (heldTreePathIds.has(nodeId) || expandable.has(nodeId)) return;
                expandable.add(nodeId);
                queue.push(nodeId);
            };

            activeHeldNodeIds.forEach((id) => {
                const scopeIds = heldHierarchyScopes.get(id) || hierarchyTracking.getHoldScopeIds(id);
                scopeIds.forEach((scopeId) => {
                    visible.add(scopeId);
                    enqueue(scopeId);
                });
            });

            while (queue.length > 0) {
                const currentId = queue.shift()!;

                graphSnapshot.links.forEach((link) => {
                    if (!isLinkAllowedUnderHold(link)) {
                        return;
                    }
                    if (link.source.id !== currentId && link.target.id !== currentId) {
                        return;
                    }

                    const otherId = link.source.id === currentId ? link.target.id : link.source.id;
                    if (!visible.has(otherId)) {
                        visible.add(otherId);
                    }

                    if (!heldTreePathIds.has(otherId) && !expandable.has(otherId)) {
                        expandable.add(otherId);
                        queue.push(otherId);
                    }
                });
            }

            graphSnapshot.nodes.forEach((node) => {
                if (!isTreeMetaSection(graphSnapshot.treeMeta[node.id])) {
                    return;
                }

                const parentId = graphSnapshot.treeMeta[node.id]?.parentId || null;
                if (parentId && visible.has(parentId)) {
                    visible.add(node.id);
                }
            });

            return visible;
        }, [
            activeHeldNodeIds,
            graphSnapshot.links,
            graphSnapshot.nodes,
            heldHierarchyScopes,
            heldTreePathIds,
            hierarchyTracking,
            isHoldModeActive,
            isLinkAllowedUnderHold,
        ]);

        const resolveHoldVisibleNodeId = useCallback(
            (nodeId: string) => {
                if (!isHoldModeActive) {
                    return nodeId;
                }

                let currentId: string | null = nodeId;
                while (currentId && !holdSubgraphVisibleNodeIds.has(currentId)) {
                    currentId = graphSnapshot.treeMeta[currentId]?.parentId || null;
                }

                return currentId;
            },
            [graphSnapshot.treeMeta, holdSubgraphVisibleNodeIds, isHoldModeActive],
        );

        const resolveHoldVisibleLink = useCallback(
            (link: FlatGraphLink) => {
                if (!isHoldModeActive) {
                    return {
                        sourceId: link.source.id,
                        targetId: link.target.id,
                        source: link.source,
                        target: link.target,
                    };
                }

                const sourceId = resolveHoldVisibleNodeId(link.source.id);
                const targetId = resolveHoldVisibleNodeId(link.target.id);
                if (!sourceId || !targetId || sourceId === targetId) {
                    return null;
                }

                const source = nodeByIdRef.current.get(sourceId);
                const target = nodeByIdRef.current.get(targetId);
                if (!source || !target || source.id === target.id) {
                    return null;
                }

                return {
                    sourceId,
                    targetId,
                    source,
                    target,
                };
            },
            [isHoldModeActive, resolveHoldVisibleNodeId],
        );

        const isFileHoldModeActive = useMemo(
            () =>
                Array.from(activeHeldNodeIds).some((id) => {
                    const meta = graphSnapshot.treeMeta[id];
                    return meta?.type === 'file' && meta.nodeType !== 'section';
                }),
            [activeHeldNodeIds, graphSnapshot.treeMeta],
        );

        const applyTransform = useCallback(() => {
            const container = document.getElementById('directory-graph-transform-container');
            if (container) {
                container.setAttribute(
                    'transform',
                    `translate(${transformRef.current.x}, ${transformRef.current.y}) scale(${transformRef.current.k})`,
                );
            }
        }, []);

        const fitGraphInViewport = useCallback(() => {
            const svg = svgRef.current;
            if (!svg || nodesRef.current.length === 0) return;

            const rect = svg.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const bounds = nodesRef.current.reduce(
                (accumulator, node) => {
                    const radius = getVisualNodeRadius(node);
                    const labelWidth =
                        node.hierarchyLevel <= 1
                            ? Math.min(340, Math.max(120, node.label.length * 13))
                            : Math.min(240, Math.max(48, node.label.length * 8));
                    const labelHeight = node.hierarchyLevel <= 1 ? 72 : 34;
                    const leftPadding = node.hierarchyLevel <= 1 ? labelWidth / 2 : radius + 8;
                    const rightPadding = node.hierarchyLevel <= 1 ? labelWidth / 2 : radius + labelWidth;
                    const topPadding = node.hierarchyLevel <= 1 ? radius + labelHeight : radius + labelHeight / 2;
                    const bottomPadding = radius + labelHeight / 2;

                    return {
                        minX: Math.min(accumulator.minX, node.x - leftPadding),
                        maxX: Math.max(accumulator.maxX, node.x + rightPadding),
                        minY: Math.min(accumulator.minY, node.y - topPadding),
                        maxY: Math.max(accumulator.maxY, node.y + bottomPadding),
                    };
                },
                {
                    minX: Number.POSITIVE_INFINITY,
                    maxX: Number.NEGATIVE_INFINITY,
                    minY: Number.POSITIVE_INFINITY,
                    maxY: Number.NEGATIVE_INFINITY,
                },
            );

            if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.maxX)) return;

            const minX = bounds.minX;
            const maxX = bounds.maxX;
            const minY = bounds.minY;
            const maxY = bounds.maxY;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const graphWidth = Math.max(1, maxX - minX);
            const graphHeight = Math.max(1, maxY - minY);
            const padding = Math.max(72, Math.min(150, Math.min(rect.width, rect.height) * 0.09));
            const availableWidth = Math.max(320, rect.width - padding * 2);
            const availableHeight = Math.max(260, rect.height - padding * 2);
            const fittedScale = Math.max(
                0.12,
                Math.min(1.05, availableWidth / graphWidth, availableHeight / graphHeight),
            );

            transformRef.current.k = fittedScale;
            transformRef.current.x = rect.width / 2 - centerX * fittedScale;
            transformRef.current.y = rect.height / 2 - centerY * fittedScale;
            applyTransform();
        }, [applyTransform]);

        useEffect(() => {
            const centerTimer = requestAnimationFrame(() => {
                if (!userViewportTouchedRef.current) {
                    fitGraphInViewport();
                }
            });

            return () => {
                cancelAnimationFrame(centerTimer);
            };
        }, [fitGraphInViewport, graphSnapshot.nodes]);

        const zoomByFactor = useCallback(
            (factor: number) => {
                const svg = svgRef.current;
                if (!svg) return;

                userViewportTouchedRef.current = true;
                autoFitFrameBudgetRef.current = 0;

                const rect = svg.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const currentScale = transformRef.current.k;
                const nextScale = Math.max(0.18, Math.min(currentScale * factor, 4.4));

                transformRef.current.x = centerX - (centerX - transformRef.current.x) * (nextScale / currentScale);
                transformRef.current.y = centerY - (centerY - transformRef.current.y) * (nextScale / currentScale);
                transformRef.current.k = nextScale;
                applyTransform();
            },
            [applyTransform],
        );

        const setFocusedNode = useCallback(
            (nodeId: string | null) => {
                setSelectedNodeId(nodeId);
                onNodeFocus?.(nodeId);
                if (nodeId) {
                    flyToNode(nodeId);
                }
            },
            [flyToNode, onNodeFocus],
        );

        useEffect(() => {
            if (!focusedNodeId) return;
            if (!graphSnapshot.nodes.some((node) => node.id === focusedNodeId)) return;
            setSelectedNodeId(focusedNodeId);
            flyToNode(focusedNodeId);
        }, [focusedNodeId, flyToNode, graphSnapshot.nodes]);

        const activeNodeId = hoveredNodeId || selectedNodeId;

        const visualHighlightedSet = useMemo(() => {
            const highlighted = new Set<string>();
            const activeNodeInMathematicalPhysics = isWithinMathematicalPhysicsBranch(activeNodeId, graphSnapshot.treeMeta);
            if (activeNodeId) highlighted.add(activeNodeId);

            if (!isHoldModeActive && activeNodeId) {
                graphSnapshot.links.forEach((link) => {
                    const isBoundaryLink = isMathematicalPhysicsBoundaryLink(link, graphSnapshot.treeMeta);
                    if (activeNodeInMathematicalPhysics && isBoundaryLink) {
                        return;
                    }

                    if (activeNodeId === link.source.id || activeNodeId === link.target.id) {
                        highlighted.add(link.source.id);
                        highlighted.add(link.target.id);
                    }
                });
            }

            heldHierarchyScopes.forEach((scopeIds, heldId) => {
                highlighted.add(heldId);
                hierarchyTracking.getTreePathIds(heldId).forEach((pathId) => highlighted.add(pathId));
                scopeIds.forEach((descendantId) => {
                    if (isTreeMetaSection(graphSnapshot.treeMeta[descendantId])) return;
                    highlighted.add(descendantId);
                });

                graphSnapshot.links.forEach((link) => {
                    const isBoundaryLink = isMathematicalPhysicsBoundaryLink(link, graphSnapshot.treeMeta);
                    if (activeNodeInMathematicalPhysics && isBoundaryLink) {
                        return;
                    }

                    const sourceInScope = scopeIds.has(link.source.id);
                    const targetInScope = scopeIds.has(link.target.id);
                    if (!sourceInScope && !targetInScope) {
                        return;
                    }

                    if (sourceInScope && hierarchyTracking.isHigherHierarchy(link.target.id, heldId)) {
                        return;
                    }
                    if (targetInScope && hierarchyTracking.isHigherHierarchy(link.source.id, heldId)) {
                        return;
                    }

                    highlighted.add(link.source.id);
                    highlighted.add(link.target.id);
                });
            });

            return highlighted;
        }, [activeNodeId, graphSnapshot.links, graphSnapshot.treeMeta, heldHierarchyScopes, hierarchyTracking, isHoldModeActive]);

        const structuralHighlightedSet = useMemo(() => {
            const highlighted = new Set<string>();
            heldHierarchyScopes.forEach((scopeIds, heldId) => {
                highlighted.add(heldId);
                hierarchyTracking.getTreePathIds(heldId).forEach((pathId) => highlighted.add(pathId));
                scopeIds.forEach((descendantId) => {
                    if (isTreeMetaSection(graphSnapshot.treeMeta[descendantId])) return;
                    highlighted.add(descendantId);
                });

                graphSnapshot.links.forEach((link) => {
                    const sourceInScope = scopeIds.has(link.source.id);
                    const targetInScope = scopeIds.has(link.target.id);
                    if (!sourceInScope && !targetInScope) {
                        return;
                    }

                    if (sourceInScope && hierarchyTracking.isHigherHierarchy(link.target.id, heldId)) {
                        return;
                    }
                    if (targetInScope && hierarchyTracking.isHigherHierarchy(link.source.id, heldId)) {
                        return;
                    }

                    highlighted.add(link.source.id);
                    highlighted.add(link.target.id);
                });
            });

            return highlighted;
        }, [graphSnapshot.links, graphSnapshot.treeMeta, heldHierarchyScopes, hierarchyTracking]);

        const compressedVisibleSet = useMemo(() => {
            const visible = new Set<string>();
            structuralHighlightedSet.forEach((id) => {
                if (isTreeMetaSection(graphSnapshot.treeMeta[id])) return;
                let currentId: string | null = id;
                while (currentId) {
                    if (isTreeMetaSection(graphSnapshot.treeMeta[currentId])) break;
                    visible.add(currentId);
                    currentId = graphSnapshot.treeMeta[currentId]?.parentId || null;
                }
            });

            expandedFolderIds.forEach((id) => {
                const meta = graphSnapshot.treeMeta[id];
                if (!meta || meta.type !== 'file' || !visible.has(id)) return;

                meta.descendantIds.forEach((descendantId) => {
                    visible.add(descendantId);
                });
            });

            return visible;
        }, [expandedFolderIds, graphSnapshot.treeMeta, structuralHighlightedSet]);

        const filteredTree = useMemo(() => {
            if (!searchQuery.trim()) {
                return graphSnapshot.treeRoot;
            }

            const query = searchQuery.toLowerCase();
            const filterTreeNode = (node: DirectoryTreeNode): DirectoryTreeNode | null => {
                const isMatch = node.name.toLowerCase().includes(query);
                const filteredChildren = node.children
                    .map(filterTreeNode)
                    .filter((child): child is DirectoryTreeNode => Boolean(child));

                if (isMatch || filteredChildren.length > 0 || node.id === graphSnapshot.treeRoot.id) {
                    return {
                        ...node,
                        children: filteredChildren,
                    };
                }

                return null;
            };

            return filterTreeNode(graphSnapshot.treeRoot);
        }, [graphSnapshot.treeRoot, searchQuery]);

        useEffect(() => {
            if (!searchQuery.trim() || !filteredTree) return;

            setExpandedFolderIds((previous) => {
                const nextExpanded = new Set(previous);
                let changed = false;

                const expandParents = (node: DirectoryTreeNode) => {
                    if (node.children.length === 0) return;
                    if (!nextExpanded.has(node.id)) {
                        nextExpanded.add(node.id);
                        changed = true;
                    }
                    node.children.forEach(expandParents);
                };

                expandParents(filteredTree);
                return changed ? nextExpanded : previous;
            });
        }, [filteredTree, searchQuery]);

        useEffect(() => {
            if (structuralHighlightedSet.size === 0) return;

            setExpandedFolderIds((previous) => {
                const next = new Set(previous);
                let changed = false;

                structuralHighlightedSet.forEach((id) => {
                    if (isTreeMetaSection(graphSnapshot.treeMeta[id])) return;
                    let parentId = graphSnapshot.treeMeta[id]?.parentId || null;
                    while (parentId) {
                        if (isTreeMetaSection(graphSnapshot.treeMeta[parentId])) break;
                        if (!next.has(parentId)) {
                            next.add(parentId);
                            changed = true;
                        }
                        parentId = graphSnapshot.treeMeta[parentId]?.parentId || null;
                    }
                });

                return changed ? next : previous;
            });
        }, [graphSnapshot.treeMeta, structuralHighlightedSet]);

        useEffect(() => {
            if (activeHeldNodeIds.size === 0) {
                holdAttractionPairsRef.current = [];
                return;
            }

            const seenPairKeys = new Set<string>();
            const nextPairs: HoldAttractionPair[] = [];

            heldHierarchyScopes.forEach((scopeIds, heldId) => {
                graphSnapshot.links.forEach((link) => {
                    const resolvedLink = resolveHoldVisibleLink(link);
                    if (!resolvedLink) {
                        return;
                    }

                    if (!isLinkAllowedUnderHold(link, resolvedLink.sourceId, resolvedLink.targetId)) {
                        return;
                    }

                    const sourceInScope = scopeIds.has(resolvedLink.sourceId);
                    const targetInScope = scopeIds.has(resolvedLink.targetId);
                    if (!sourceInScope && !targetInScope) {
                        return;
                    }

                    if (sourceInScope && hierarchyTracking.isHigherHierarchy(resolvedLink.targetId, heldId)) {
                        return;
                    }
                    if (targetInScope && hierarchyTracking.isHigherHierarchy(resolvedLink.sourceId, heldId)) {
                        return;
                    }

                    const pairKey = [resolvedLink.sourceId, resolvedLink.targetId].sort().join('::');
                    if (seenPairKeys.has(pairKey)) return;
                    seenPairKeys.add(pairKey);

                    const baseDistance = link.type === 'structural'
                        ? Math.min(96, Math.max(58, getPhysicsLinkDistance(link) * 0.36))
                        : link.type === 'temporal'
                          ? 118
                          : 108;

                    nextPairs.push({
                        source: resolvedLink.source,
                        target: resolvedLink.target,
                        targetDistance: baseDistance,
                        strength: link.type === 'structural' ? 0.28 : 0.22,
                    });
                });
            });

            holdAttractionPairsRef.current = nextPairs;
            setIsTreeCompressed(true);
            isTreeCompressedRef.current = true;
            wakeUpSimulation(1);
        }, [
            activeHeldNodeIds,
            graphSnapshot.links,
            holdSubgraphVisibleNodeIds,
            hierarchyTracking,
            heldHierarchyScopes,
            isLinkAllowedUnderHold,
            resolveHoldVisibleLink,
            wakeUpSimulation,
        ]);

        useEffect(() => {
            const activeId = selectedNodeId;
            const neighbors = new Set<string>();
            if (activeId) neighbors.add(activeId);
            const activeNodeInMathematicalPhysics = isWithinMathematicalPhysicsBranch(
                activeId,
                graphSnapshot.treeMeta,
            );
            const activeHeldRoot = activeId && activeHeldNodeIds.has(activeId) ? activeId : null;

            graphSnapshot.links.forEach((link) => {
                if (activeNodeInMathematicalPhysics && isMathematicalPhysicsBoundaryLink(link, graphSnapshot.treeMeta)) {
                    return;
                }

                if (isHoldModeActive && activeHeldRoot) {
                    if (link.source.id === activeId) {
                        if (!hierarchyTracking.isHigherHierarchy(link.target.id, activeHeldRoot)) {
                            neighbors.add(link.target.id);
                        }
                    }
                    if (link.target.id === activeId) {
                        if (!hierarchyTracking.isHigherHierarchy(link.source.id, activeHeldRoot)) {
                            neighbors.add(link.source.id);
                        }
                    }
                    return;
                }

                if (link.source.id === activeId) neighbors.add(link.target.id);
                if (link.target.id === activeId) neighbors.add(link.source.id);
            });

            activeInfoRef.current = { id: activeId, neighbors };
            if (activeId) {
                wakeUpSimulation(0.85);
            }
        }, [
            activeHeldNodeIds,
            graphSnapshot.links,
            graphSnapshot.treeMeta,
            hierarchyTracking,
            isHoldModeActive,
            selectedNodeId,
            wakeUpSimulation,
        ]);

        useEffect(() => {
            const LINK_STR_STRUCT = 0.14;
            const LINK_STR_CROSS = 0.005;
            const LINK_STR_TEMPORAL = 0.01;
            const CENTER_GRAVITY = 0.006;
            const ROOT_CENTER_GRAVITY = 0.12;
            const LEVEL_GRAVITY = 0.028;
            const COLLISION_STRENGTH = 0.18;
            const FRICTION = 0.82;

            const tick = () => {
                if (simRef.current.alpha < 0.005) {
                    simRef.current.frameId = requestAnimationFrame(tick);
                    return;
                }

                const alpha = simRef.current.alpha;
                const nodes = nodesRef.current;
                const links = linksRef.current;
                const physicsNodes = isHoldModeActive
                    ? nodes.filter((node) => holdSubgraphVisibleNodeIds.has(node.id))
                    : nodes;
                const physicsLinks = isHoldModeActive
                    ? links.flatMap((link) => {
                        const resolvedLink = resolveHoldVisibleLink(link);
                        return resolvedLink
                            ? [{
                                ...link,
                                source: resolvedLink.source,
                                target: resolvedLink.target,
                            }]
                            : [];
                    })
                    : links;

                for (let leftIndex = 0; leftIndex < physicsNodes.length; leftIndex += 1) {
                    for (let rightIndex = leftIndex + 1; rightIndex < physicsNodes.length; rightIndex += 1) {
                        let dx = physicsNodes[rightIndex].x - physicsNodes[leftIndex].x;
                        let dy = physicsNodes[rightIndex].y - physicsNodes[leftIndex].y;
                        let distSq = dx * dx + dy * dy;
                        if (distSq === 0) {
                            dx = 0.1;
                            dy = 0.1;
                            distSq = 0.02;
                        }

                        const distance = Math.sqrt(distSq);
                        const chargeRange = 1800000;
                        if (distSq < chargeRange) {
                            const leftCharge = getPhysicsChargeStrength(physicsNodes[leftIndex]);
                            const rightCharge = getPhysicsChargeStrength(physicsNodes[rightIndex]);
                            const force = ((leftCharge + rightCharge) / 2 / distSq) * alpha;
                            const fx = (dx / distance) * force;
                            const fy = (dy / distance) * force;

                            physicsNodes[leftIndex].vx += fx;
                            physicsNodes[leftIndex].vy += fy;
                            physicsNodes[rightIndex].vx -= fx;
                            physicsNodes[rightIndex].vy -= fy;
                        }
                    }
                }

                for (let iteration = 0; iteration < 3; iteration += 1) {
                    for (let leftIndex = 0; leftIndex < physicsNodes.length; leftIndex += 1) {
                        for (let rightIndex = leftIndex + 1; rightIndex < physicsNodes.length; rightIndex += 1) {
                            let dx = physicsNodes[rightIndex].x - physicsNodes[leftIndex].x;
                            let dy = physicsNodes[rightIndex].y - physicsNodes[leftIndex].y;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance === 0) {
                                dx = 0.1;
                                dy = 0.1;
                                distance = 0.141;
                            }

                            const collisionDistance =
                                getNodeCollisionRadius(physicsNodes[leftIndex]) +
                                getNodeCollisionRadius(physicsNodes[rightIndex]);
                            if (distance >= collisionDistance) continue;

                            const overlap = collisionDistance - distance;
                            const collisionForce = overlap * COLLISION_STRENGTH * alpha;
                            const fx = (dx / distance) * collisionForce;
                            const fy = (dy / distance) * collisionForce;

                            physicsNodes[leftIndex].vx -= fx;
                            physicsNodes[leftIndex].vy -= fy;
                            physicsNodes[rightIndex].vx += fx;
                            physicsNodes[rightIndex].vy += fy;
                        }
                    }
                }

                physicsLinks.forEach((link) => {
                    if (isHoldModeActive && !isLinkAllowedUnderHold(link, link.source.id, link.target.id)) {
                        return;
                    }

                    const dx = link.target.x - link.source.x;
                    const dy = link.target.y - link.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const targetDistance =
                        link.type === 'structural'
                            ? getPhysicsLinkDistance(link)
                            : link.type === 'temporal'
                              ? 245
                              : 315;

                    const strength =
                        link.type === 'structural'
                            ? LINK_STR_STRUCT
                            : link.type === 'temporal'
                              ? LINK_STR_TEMPORAL
                              : LINK_STR_CROSS;

                    const force = (distance - targetDistance) * strength * alpha;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    link.source.vx += fx;
                    link.source.vy += fy;
                    link.target.vx -= fx;
                    link.target.vy -= fy;
                });

                holdAttractionPairsRef.current.forEach((pair) => {
                    const dx = pair.target.x - pair.source.x;
                    const dy = pair.target.y - pair.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (distance - pair.targetDistance) * pair.strength * alpha;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    pair.source.vx += fx;
                    pair.source.vy += fy;
                    pair.target.vx -= fx;
                    pair.target.vy -= fy;
                });

                const { id: activeId, neighbors } = activeInfoRef.current;
                if (activeId) {
                    const activeNode = physicsNodes.find((node) => node.id === activeId);
                    if (activeNode) {
                        physicsNodes.forEach((node) => {
                            if (node.id === activeId || !neighbors.has(node.id)) return;

                            const dx = activeNode.x - node.x;
                            const dy = activeNode.y - node.y;
                            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                            if (distance <= 46) return;

                            const force = (distance - 46) * 0.16 * alpha;
                            node.vx += (dx / distance) * force;
                            node.vy += (dy / distance) * force;
                        });
                    }
                }

                const centerX = 0;
                const centerY = 0;
                physicsNodes.forEach((node) => {
                    if (node.fx !== null && node.fy !== null) {
                        node.x = node.fx;
                        node.y = node.fy;
                        node.vx = 0;
                        node.vy = 0;
                    } else if (node.id === activeId) {
                        node.vx = 0;
                        node.vy = 0;
                    } else {
                        const sectionParent = node.nodeType === 'section' && node.parentId
                            ? nodes.find((candidate) => candidate.id === node.parentId)
                            : null;
                        const directoryParent = node.nodeType !== 'section' && node.parentId
                            ? nodes.find((candidate) => candidate.id === node.parentId)
                            : null;
                        const sectionAngle =
                            -Math.PI / 2 +
                            (node.orderIndex / Math.max(1, node.siblingCount)) * Math.PI * 2;
                        const sectionRadius = Math.max(42, Math.min(82, 38 + node.siblingCount * 5));
                        const directoryAngle =
                            -Math.PI / 2 +
                            (node.orderIndex / Math.max(1, node.siblingCount)) * Math.PI * 2;
                        const directoryRadius = Math.max(
                            68,
                            Math.min(
                                940,
                                getDirectoryOrbitRadius(
                                    node.hierarchyLevel,
                                    node.siblingCount,
                                    node.expandedSectionCount,
                                ),
                            ),
                        );
                        const anchor = node.groupId ? graphSnapshot.groupAnchors[node.groupId] : null;
                        const targetX = sectionParent
                            ? sectionParent.x + Math.cos(sectionAngle) * sectionRadius
                            : directoryParent
                              ? directoryParent.x + Math.cos(directoryAngle) * directoryRadius
                            : anchor?.x ?? centerX;
                        const targetY = sectionParent
                            ? sectionParent.y + Math.sin(sectionAngle) * sectionRadius
                            : directoryParent
                              ? directoryParent.y + Math.sin(directoryAngle) * directoryRadius
                            : anchor?.y ?? centerY;
                        const nodeGravity = sectionParent
                            ? 0.16
                            : directoryParent
                              ? LEVEL_GRAVITY
                            : anchor
                                ? node.type === 'folder'
                                    ? LEVEL_GRAVITY
                                    : LEVEL_GRAVITY * 0.55
                                : CENTER_GRAVITY;
                        node.vx += (targetX - node.x) * nodeGravity * alpha;
                        node.vy += (targetY - node.y) * nodeGravity * alpha;
                        node.vx += (centerX - node.x) * CENTER_GRAVITY * alpha;
                        node.vy += (centerY - node.y) * CENTER_GRAVITY * alpha;
                        if (node.hierarchyLevel === 0) {
                            node.vx += (centerX - node.x) * ROOT_CENTER_GRAVITY * alpha;
                            node.vy += (centerY - node.y) * ROOT_CENTER_GRAVITY * alpha;
                        }
                        node.vx *= FRICTION;
                        node.vy *= FRICTION;
                        node.vx = Math.max(-18, Math.min(18, node.vx));
                        node.vy = Math.max(-18, Math.min(18, node.vy));
                        node.x += node.vx;
                        node.y += node.vy;
                    }

                    const nodeElement = document.getElementById(`directory-node-${node.id}`);
                    if (nodeElement) {
                        nodeElement.setAttribute('transform', `translate(${node.x}, ${node.y})`);
                    }
                });

                links.forEach((link) => {
                    const linkElement = document.getElementById(`directory-link-${link.id}`);
                    if (linkElement) {
                        linkElement.setAttribute('x1', String(link.source.x));
                        linkElement.setAttribute('y1', String(link.source.y));
                        linkElement.setAttribute('x2', String(link.target.x));
                        linkElement.setAttribute('y2', String(link.target.y));
                    }
                });

                simRef.current.alpha *= 0.95;
                if (
                    autoFitFrameBudgetRef.current > 0 &&
                    !userViewportTouchedRef.current &&
                    !isDraggingViewport.current
                ) {
                    fitGraphInViewport();
                    autoFitFrameBudgetRef.current -= 1;
                }
                simRef.current.frameId = requestAnimationFrame(tick);
            };

            if (simRef.current.frameId) {
                cancelAnimationFrame(simRef.current.frameId);
            }

            simRef.current.alpha = 1;
            simRef.current.frameId = requestAnimationFrame(tick);

            return () => {
                if (simRef.current.frameId) {
                    cancelAnimationFrame(simRef.current.frameId);
                    simRef.current.frameId = null;
                }
            };
        }, [
            fitGraphInViewport,
            graphSnapshot.groupAnchors,
            graphSnapshot.links,
            graphSnapshot.nodes,
            holdSubgraphVisibleNodeIds,
            isHoldModeActive,
            resolveHoldVisibleLink,
        ]);

        const handleToggleHold = useCallback((id: string) => {
            if (autoHeldNodeId === id) {
                setAutoHeldNodeId(null);
                if (heldNodeIds.size === 0) {
                    setIsTreeCompressed(false);
                    isTreeCompressedRef.current = false;
                }
                wakeUpSimulation(1);
                return;
            }

            setHeldNodeIds((previous) => {
                const next = new Set(previous);
                if (next.has(id)) {
                    next.delete(id);
                    if (next.size === 0 && !autoHeldNodeId) {
                        setIsTreeCompressed(false);
                        isTreeCompressedRef.current = false;
                    }
                } else {
                    next.add(id);
                }
                return next;
            });
            wakeUpSimulation(1);
        }, [autoHeldNodeId, heldNodeIds.size, wakeUpSimulation]);

        const handleTreeSelect = useCallback(
            (node: DirectoryTreeNode) => {
                setFocusedNode(node.id);
            },
            [setFocusedNode],
        );

        const handleTreeDoubleClick = useCallback(
            (node: DirectoryTreeNode) => {
                if (!node.graphNode?.slug) return;
                onNodeOpen?.(node.graphNode);
            },
            [onNodeOpen],
        );

        const handleToggleExpand = useCallback((id: string) => {
            setExpandedFolderIds((previous) => {
                const next = new Set(previous);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
            wakeUpSimulation(1);
        }, [wakeUpSimulation]);

        const resetDirectoryState = useCallback(() => {
            setIsTreeCompressed(false);
            isTreeCompressedRef.current = false;
            setHeldNodeIds(new Set());
            setAutoHeldNodeId(null);
            setHoveredNodeId(null);
            setSelectedNodeId(null);
            onNodeFocus?.(null);
        }, [onNodeFocus]);

        const resetView = useCallback(() => {
            if (flyAnimFrame.current) {
                cancelAnimationFrame(flyAnimFrame.current);
                flyAnimFrame.current = null;
            }

            const baseGraphData = buildDirectoryGraphData(model);
            const defaultExpanded = getDefaultExpandedDirectoryIds(baseGraphData.treeRoot);
            const resetGraphData = buildDirectoryGraphData(model, defaultExpanded);

            setExpandedFolderIds(defaultExpanded);
            setGraphSnapshot(resetGraphData);
            nodesRef.current = resetGraphData.nodes;
            linksRef.current = resetGraphData.links;
            resetDirectoryState();
            transformRef.current = { x: 0, y: 0, k: 1 };
            userViewportTouchedRef.current = false;
            autoFitFrameBudgetRef.current = 120;
            applyTransform();
            wakeUpSimulation(1);

            requestAnimationFrame(() => {
                fitGraphInViewport();
                wakeUpSimulation(1);
            });
        }, [applyTransform, fitGraphInViewport, model, resetDirectoryState, wakeUpSimulation]);

        const clearHoverHighlight = useCallback(() => {
            if (flyAnimFrame.current) {
                cancelAnimationFrame(flyAnimFrame.current);
            }

            setAutoHeldNodeId(null);
            if (heldNodeIds.size === 0) {
                setIsTreeCompressed(false);
                isTreeCompressedRef.current = false;
            }
            setHoveredNodeId(null);
            setSelectedNodeId(null);
            onNodeFocus?.(null);
        }, [heldNodeIds.size, onNodeFocus]);

        useImperativeHandle(
            ref,
            () => ({
                zoomIn() {
                    zoomByFactor(1.18);
                },
                zoomOut() {
                    zoomByFactor(1 / 1.18);
                },
                resetView() {
                    resetView();
                },
                focusNode(nodeId: string) {
                    setFocusedNode(nodeId);
                },
            }),
            [resetView, setFocusedNode, zoomByFactor],
        );

        const handleSvgMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
            if (flyAnimFrame.current) {
                cancelAnimationFrame(flyAnimFrame.current);
            }

            userViewportTouchedRef.current = true;
            autoFitFrameBudgetRef.current = 0;
            isDraggingViewport.current = true;
            dragStartPos.current = {
                x: event.clientX - transformRef.current.x,
                y: event.clientY - transformRef.current.y,
            };

            if (svgRef.current) {
                svgRef.current.style.cursor = 'grabbing';
            }
        }, []);

        const handleSvgMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
            if (!isDraggingViewport.current) return;

            transformRef.current.x = event.clientX - dragStartPos.current.x;
            transformRef.current.y = event.clientY - dragStartPos.current.y;

            const container = document.getElementById('directory-graph-transform-container');
            if (container) {
                container.setAttribute(
                    'transform',
                    `translate(${transformRef.current.x}, ${transformRef.current.y}) scale(${transformRef.current.k})`,
                );
            }
        }, []);

        const handleSvgMouseUp = useCallback(() => {
            isDraggingViewport.current = false;
            if (svgRef.current) {
                svgRef.current.style.cursor = 'grab';
            }
        }, []);

        const handleWheel = useCallback((event: WheelEvent) => {
            event.preventDefault();
            if (!svgRef.current) return;

            if (flyAnimFrame.current) {
                cancelAnimationFrame(flyAnimFrame.current);
            }

            userViewportTouchedRef.current = true;
            autoFitFrameBudgetRef.current = 0;
            const zoomSensitivity = 0.001;
            const delta = -event.deltaY * zoomSensitivity;
            const nextScale = Math.max(0.18, Math.min(transformRef.current.k * Math.exp(delta), 4.4));
            const rect = svgRef.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (nextScale / transformRef.current.k);
            transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (nextScale / transformRef.current.k);
            transformRef.current.k = nextScale;

            const container = document.getElementById('directory-graph-transform-container');
            if (container) {
                container.setAttribute(
                    'transform',
                    `translate(${transformRef.current.x}, ${transformRef.current.y}) scale(${transformRef.current.k})`,
                );
            }
        }, []);

        useEffect(() => {
            const svg = svgRef.current;
            if (!svg) return;

            svg.addEventListener('wheel', handleWheel, { passive: false });
            return () => {
                svg.removeEventListener('wheel', handleWheel);
            };
        }, [handleWheel]);

        useEffect(() => {
            let animationFrameId = 0;

            const getVisibleElement = (nodeId: string) => {
                let currentId: string | null = nodeId;
                let element = document.querySelector<HTMLElement>(`[data-node-id="${currentId}"]`);
                while (!element && currentId) {
                    currentId = graphSnapshot.treeMeta[currentId]?.parentId || null;
                    if (currentId) {
                        element = document.querySelector<HTMLElement>(`[data-node-id="${currentId}"]`);
                    }
                }
                return { element, id: currentId };
            };

            const syncSidebarEdges = () => {
                const wrapper = document.getElementById('directory-tree-wrapper');
                if (!wrapper) return;

                const wrapperRect = wrapper.getBoundingClientRect();
                const needsCompression = isHoldModeActive;

                graphSnapshot.crossLinks.forEach((link) => {
                    const { element: sourceElement, id: sourceId } = getVisibleElement(link.source.id);
                    const { element: targetElement, id: targetId } = getVisibleElement(link.target.id);
                    const pathElement = document.getElementById(`directory-sidebar-edge-${link.id}`);
                    const isAllowedHoldLink =
                        !isHoldModeActive || isLinkAllowedUnderHold(link, sourceId ?? undefined, targetId ?? undefined);

                    if (sourceElement && targetElement && sourceId !== targetId && pathElement) {
                        const sourceRect = sourceElement.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        const y1 = sourceRect.top - wrapperRect.top + sourceRect.height / 2;
                        const y2 = targetRect.top - wrapperRect.top + targetRect.height / 2;
                        const x1 = sourceRect.right - wrapperRect.left + 6;
                        const x2 = targetRect.right - wrapperRect.left + 6;
                        const bulgeMagnitude = Math.min(Math.max(Math.abs(y2 - y1) * 0.08 + 4, 8), 18);
                        const controlX = Math.min(
                            wrapperRect.width - 12,
                            Math.max(x1, x2) + bulgeMagnitude,
                        );

                        pathElement.setAttribute(
                            'd',
                            `M ${x1},${y1} C ${controlX},${y1} ${controlX},${y2} ${x2},${y2}`,
                        );
                        pathElement.style.opacity = !isFileHoldModeActive || !isAllowedHoldLink ? '0' : '1';

                        const isHoldLinked =
                            isAllowedHoldLink &&
                            (
                                activeHeldNodeIds.has(link.source.id) ||
                                activeHeldNodeIds.has(link.target.id) ||
                                (sourceId ? activeHeldNodeIds.has(sourceId) : false) ||
                                (targetId ? activeHeldNodeIds.has(targetId) : false)
                            );
                        const isHoverLinked =
                            (activeNodeId === link.source.id ||
                                activeNodeId === link.target.id ||
                                activeNodeId === sourceId ||
                                activeNodeId === targetId);
                        const isVisuallyActive = isFileHoldModeActive && (isHoldModeActive ? isHoldLinked : isHoverLinked);

                        pathElement.setAttribute(
                            'stroke',
                            isVisuallyActive
                                ? isHoldModeActive
                                    ? graphPalette.lineStructuralHold
                                    : graphPalette.lineStructuralActive
                                : graphPalette.lineCross,
                        );
                        pathElement.setAttribute('stroke-width', isVisuallyActive ? (isHoldModeActive ? '1.1' : '0.7') : '0.5');
                        pathElement.setAttribute('stroke-dasharray', isVisuallyActive ? 'none' : '2 4');
                    } else if (pathElement) {
                        pathElement.style.opacity = '0';
                    }
                });

                if (needsCompression && !isTreeCompressedRef.current) {
                    isTreeCompressedRef.current = true;
                    setIsTreeCompressed(true);
                }
            };

            animationFrameId = requestAnimationFrame(() => requestAnimationFrame(syncSidebarEdges));
            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        }, [
            activeNodeId,
            activeHeldNodeIds,
            expandedFolderIds,
            graphSnapshot.crossLinks,
            graphSnapshot.treeMeta,
            graphPalette,
            isFileHoldModeActive,
            isTreeCompressed,
            isHoldModeActive,
            searchQuery,
        ]);

        const handleNodeMouseDown = useCallback(
            (event: React.MouseEvent<SVGGElement>, node: FlatGraphNode) => {
                event.stopPropagation();
                setFocusedNode(node.id);

                const svg = svgRef.current;
                if (!svg) return;

                const startClientX = event.clientX;
                const startClientY = event.clientY;
                const rect = svg.getBoundingClientRect();
                const transform = transformRef.current;
                const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
                const mouseY = (event.clientY - rect.top - transform.y) / transform.k;
                const offsetX = mouseX - node.x;
                const offsetY = mouseY - node.y;

                node.fx = node.x;
                node.fy = node.y;
                wakeUpSimulation(0.82);

                const onMouseMove = (moveEvent: MouseEvent) => {
                    const nextX = (moveEvent.clientX - rect.left - transform.x) / transform.k;
                    const nextY = (moveEvent.clientY - rect.top - transform.y) / transform.k;
                    node.fx = nextX - offsetX;
                    node.fy = nextY - offsetY;
                    wakeUpSimulation(0.35);
                };

                const onMouseUp = (upEvent: MouseEvent) => {
                    node.fx = null;
                    node.fy = null;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    const dx = upEvent.clientX - startClientX;
                    const dy = upEvent.clientY - startClientY;
                    if (Math.sqrt(dx * dx + dy * dy) < 5 && node.graphNode?.slug) {
                        onNodeOpen?.(node.graphNode);
                    }
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            },
            [onNodeOpen, setFocusedNode, wakeUpSimulation],
        );

        const renderableTree = filteredTree || graphSnapshot.treeRoot;
        const renderableTreeChildren = renderableTree.children;

        return (
            <div
                className={isLight
                    ? 'directory-graph-shell flex h-full w-full overflow-hidden text-black selection:bg-black/15'
                    : 'directory-graph-shell flex h-full w-full overflow-hidden text-white selection:bg-white/20'}
                data-theme-mode={isLight ? 'light' : 'dark'}
                style={
                    {
                        background: graphPalette.background,
                        color: graphPalette.text,
                        '--directory-graph-text': graphPalette.text,
                        '--directory-graph-text-strong': graphPalette.textStrong,
                        '--directory-graph-text-muted': graphPalette.textMuted,
                        '--directory-graph-panel': graphPalette.panel,
                        '--directory-graph-border': graphPalette.panelBorder,
                        '--directory-graph-control': graphPalette.control,
                        '--directory-graph-control-hover': graphPalette.controlHover,
                        '--directory-graph-control-hover-text': graphPalette.controlHoverText,
                        '--directory-graph-input': graphPalette.input,
                        '--directory-graph-input-focus': graphPalette.inputFocus,
                    } as React.CSSProperties
                }
            >
                <aside
                    className={isLight
                        ? 'z-20 flex h-full w-[320px] flex-shrink-0 flex-col border-r border-transparent bg-white transition-all duration-300'
                        : 'z-20 flex h-full w-[320px] flex-shrink-0 flex-col border-r border-transparent bg-black transition-all duration-300'}
                    style={{
                        background: graphPalette.panel,
                        borderRightColor: graphPalette.panelBorder,
                        boxShadow: graphPalette.shadow,
                    }}
                >
                    <div className={isLight ? 'flex h-[70px] flex-shrink-0 items-center justify-between border-b border-black/[0.08] bg-transparent px-6' : 'flex h-[70px] flex-shrink-0 items-center justify-between border-b border-white/[0.08] bg-transparent px-6'}>
                        <div className={isLight ? 'flex items-center gap-3 text-black' : 'flex items-center gap-3 text-white'}>
                            <div className={isLight ? 'rounded-sm border border-black/20 bg-white p-1.5' : 'rounded-sm border border-white/20 bg-white/[0.02] p-1.5'}>
                                <Network size={16} className={isLight ? 'text-black' : 'text-white'} strokeWidth={1.5} />
                            </div>
                            <span className="text-[14px] font-light uppercase tracking-[0.25em] drop-shadow-md">
                                Physics Archive
                            </span>
                        </div>
                    </div>

                    <div className={isLight ? 'border-b border-black/[0.06] px-5 py-4' : 'border-b border-white/[0.04] px-5 py-4'}>
                        <div className="group relative flex w-full items-center">
                            <Search
                                size={14}
                                strokeWidth={1.5}
                                className={isLight ? 'absolute left-3.5 text-black/35 transition-colors group-focus-within:text-black' : 'absolute left-3.5 text-white/30 transition-colors group-focus-within:text-white'}
                            />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className={isLight ? 'w-full rounded-sm border border-black/[0.12] bg-white py-2 pl-10 pr-8 text-[12px] font-light tracking-[0.1em] text-black placeholder:text-black/30 focus:border-black focus:bg-white focus:outline-none' : 'w-full rounded-sm border border-white/[0.1] bg-white/[0.02] py-2 pl-10 pr-8 text-[12px] font-light tracking-[0.1em] text-white placeholder:text-white/20 focus:border-white focus:bg-white/[0.05] focus:outline-none'}
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className={isLight ? 'absolute right-3.5 text-black/35 transition-colors hover:text-black' : 'absolute right-3.5 text-white/30 transition-colors hover:text-white'}
                                >
                                    <X size={12} strokeWidth={1.5} />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="custom-scrollbar relative flex-1 overflow-y-auto py-2">
                        <div id="directory-tree-wrapper" className="relative min-h-full pb-10 pr-[45px]">
                            {isTreeCompressed ? (
                                <div className="sticky top-0 z-20 mb-1 flex w-full justify-end px-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetDirectoryState}
                                        className={isLight ? 'animate-pulse rounded-sm border border-black/20 bg-white px-2.5 py-1 text-[8px] font-light uppercase tracking-[0.2em] text-black/90 shadow-md backdrop-blur-md transition-all hover:bg-black hover:text-white' : 'animate-pulse rounded-sm border border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-light uppercase tracking-[0.2em] text-white/90 shadow-md backdrop-blur-md transition-all hover:bg-white/20 hover:text-white'}
                                    >
                                        Reset Dir
                                    </button>
                                </div>
                            ) : null}

                            {renderableTreeChildren.map((child) => (
                                <TreeNode
                                    key={child.id}
                                    node={child}
                                    isLightTheme={isLight}
                                    selectedId={selectedNodeId}
                                    heldNodeIds={activeHeldNodeIds}
                                    onSelect={handleTreeSelect}
                                    onToggleHold={handleToggleHold}
                                    searchQuery={searchQuery}
                                    expandedFolderIds={expandedFolderIds}
                                    onToggleExpand={handleToggleExpand}
                                    onDoubleClick={handleTreeDoubleClick}
                                    isTreeCompressed={isTreeCompressed}
                                    compressedVisibleSet={compressedVisibleSet}
                                />
                            ))}

                            <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
                                {graphSnapshot.crossLinks.map((link) => (
                                    <path
                                        key={`directory-sidebar-edge-${link.id}`}
                                        id={`directory-sidebar-edge-${link.id}`}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="transition-all duration-300"
                                        style={{ opacity: 0 }}
                                    />
                                ))}
                            </svg>
                        </div>
                    </div>
                </aside>

                <main className="relative flex-1 overflow-hidden bg-transparent">
                    <div className="pointer-events-none absolute left-6 right-6 top-6 z-10 flex items-center justify-between">
                        <div />

                        <div className="pointer-events-auto flex items-center gap-2">
                            {headerActions}
                            <button
                                type="button"
                                onClick={() => void onRefresh?.()}
                                className={isLight ? 'flex h-10 w-10 items-center justify-center border border-black/20 bg-white text-black transition-all duration-300 hover:bg-black hover:text-white' : 'flex h-10 w-10 items-center justify-center border border-white/20 bg-[#000]/60 text-white transition-all duration-300 hover:bg-white hover:text-black'}
                                title="Reload graph"
                            >
                                <RefreshCw size={13} strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => zoomByFactor(1.18)}
                                className={isLight ? 'flex h-10 w-10 items-center justify-center border border-black/20 bg-white text-black transition-all duration-300 hover:bg-black hover:text-white' : 'flex h-10 w-10 items-center justify-center border border-white/20 bg-[#000]/60 text-white transition-all duration-300 hover:bg-white hover:text-black'}
                                title="Zoom in"
                            >
                                <ZoomIn size={13} strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => zoomByFactor(1 / 1.18)}
                                className={isLight ? 'flex h-10 w-10 items-center justify-center border border-black/20 bg-white text-black transition-all duration-300 hover:bg-black hover:text-white' : 'flex h-10 w-10 items-center justify-center border border-white/20 bg-[#000]/60 text-white transition-all duration-300 hover:bg-white hover:text-black'}
                                title="Zoom out"
                            >
                                <ZoomOut size={13} strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={clearHoverHighlight}
                                className={isLight ? 'flex items-center gap-2 border border-black/20 bg-white px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-black hover:text-white' : 'flex items-center gap-2 border border-white/20 bg-[#000]/60 px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-white hover:text-black'}
                            >
                                <Maximize2 size={12} strokeWidth={1.5} />
                                Reset View
                            </button>
                        </div>
                    </div>

                    <div
                        className="absolute inset-0 transition-all duration-500 ease-out"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                resetDirectoryState();
                            }
                        }}
                    >
                        <svg
                            ref={svgRef}
                            className="h-full w-full cursor-grab active:cursor-grabbing"
                            onMouseDown={handleSvgMouseDown}
                            onMouseMove={handleSvgMouseMove}
                            onMouseUp={handleSvgMouseUp}
                            onMouseLeave={handleSvgMouseUp}
                        >
                            <defs>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <g
                                id="directory-graph-transform-container"
                                transform={`translate(${transformRef.current.x}, ${transformRef.current.y}) scale(${transformRef.current.k})`}
                            >
                                <g className="links">
                                    {graphSnapshot.links.map((link) => {
                                        const renderedLink = isHoldModeActive ? resolveHoldVisibleLink(link) : {
                                            sourceId: link.source.id,
                                            targetId: link.target.id,
                                            source: link.source,
                                            target: link.target,
                                        };
                                        if (!renderedLink) {
                                            return null;
                                        }

                                        const isHoveredLink =
                                            hoveredNodeId !== null &&
                                            (renderedLink.sourceId === hoveredNodeId || renderedLink.targetId === hoveredNodeId);
                                        const isSelectedLink =
                                            hoveredNodeId === null &&
                                            selectedNodeId !== null &&
                                            (renderedLink.sourceId === selectedNodeId || renderedLink.targetId === selectedNodeId);
                                        const isAllowedHoldLink =
                                            !isHoldModeActive ||
                                            isLinkAllowedUnderHold(link, renderedLink.sourceId, renderedLink.targetId);
                                        const isHoldVisibleLink =
                                            structuralHighlightedSet.has(renderedLink.sourceId) &&
                                            structuralHighlightedSet.has(renderedLink.targetId);
                                        const isHoldDirectLink =
                                            isAllowedHoldLink &&
                                            (activeHeldNodeIds.has(renderedLink.sourceId) ||
                                                activeHeldNodeIds.has(renderedLink.targetId));
                                        const isEmphasizedLink = isHoldModeActive
                                            ? isHoldDirectLink || isHoveredLink
                                            : isHoveredLink || isSelectedLink;
                                        const isActiveLink = isHoldModeActive
                                            ? isAllowedHoldLink && isHoldVisibleLink
                                            : visualHighlightedSet.has(renderedLink.sourceId) &&
                                                visualHighlightedSet.has(renderedLink.targetId);
                                        const isRelationLink = link.type !== 'structural';
                                        const isRelationVisible = !isRelationLink || (isFileHoldModeActive && isActiveLink);
                                        const stroke =
                                            !isRelationVisible
                                                ? 'rgba(255,255,255,0)'
                                                : link.type === 'structural'
                                                  ? isEmphasizedLink
                                                      ? isHoldModeActive
                                                          ? graphPalette.lineStructuralHold
                                                          : graphPalette.lineStructuralActive
                                                      : graphPalette.lineStructural
                                                  : link.type === 'temporal'
                                                    ? isEmphasizedLink
                                                        ? isHoldModeActive
                                                            ? graphPalette.lineTemporalHold
                                                            : graphPalette.lineTemporalActive
                                                        : graphPalette.lineTemporal
                                                    : isEmphasizedLink
                                                      ? isHoldModeActive
                                                          ? graphPalette.lineCrossHold
                                                          : graphPalette.lineCrossActive
                                                    : graphPalette.lineCross;
                                        const opacity = !isRelationVisible
                                            ? 0
                                            : isHoldModeActive
                                              ? isActiveLink
                                                  ? 1
                                                  : 0.12
                                              : 1;

                                        return (
                                            <line
                                                key={link.id}
                                                id={`directory-link-${link.id}`}
                                                stroke={stroke}
                                                x1={renderedLink.source.x}
                                                y1={renderedLink.source.y}
                                                x2={renderedLink.target.x}
                                                y2={renderedLink.target.y}
                                                strokeWidth={
                                                    !isRelationVisible
                                                        ? 0
                                                        : isEmphasizedLink
                                                        ? isHoldModeActive
                                                            ? 1.85
                                                            : 1.35
                                                        : isActiveLink
                                                          ? 1.28
                                                          : link.type === 'structural'
                                                            ? 1.08
                                                            : 0.82
                                                }
                                                strokeDasharray={
                                                    link.type === 'structural'
                                                        ? 'none'
                                                        : link.type === 'temporal'
                                                          ? '4 5'
                                                          : '2 4'
                                                }
                                                className="transition-opacity duration-500"
                                                style={{ opacity }}
                                            />
                                        );
                                    })}
                                </g>

                                <g className="nodes">
                                    {graphSnapshot.nodes.map((node) => {
                                        if (isHoldModeActive && !holdSubgraphVisibleNodeIds.has(node.id)) {
                                            return null;
                                        }

                                        const isSelected = selectedNodeId === node.id;
                                        const isHovered = hoveredNodeId === node.id;
                                        const isHeld = activeHeldNodeIds.has(node.id);
                                        const isHoldVisibleNode = structuralHighlightedSet.has(node.id);
                                        const isHoldFaded = isHoldModeActive && !isHoldVisibleNode;
                                        const isStronglyHighlighted = isHoldModeActive && (isHovered || isHeld);
                                        const radius = getVisualNodeRadius(node);
                                        const fill = getVisualNodeFill(node, graphPalette);
                                        const labelFontSize = getVisualLabelFontSize(
                                            node,
                                            isSelected,
                                            isHovered,
                                            isStronglyHighlighted,
                                        );
                                        const labelWeight = getVisualLabelWeight(node, isSelected, isStronglyHighlighted);
                                        const labelOpacity = isHoldFaded
                                            ? graphPalette.labelMuted
                                            : isStronglyHighlighted || isSelected || isHovered
                                              ? graphPalette.labelStrong
                                              : node.hierarchyLevel <= 1
                                                ? graphPalette.labelStrong
                                                : graphPalette.label;
                                        const labelDirection = node.hierarchyLevel <= 1 ? 1 : (node.x >= 0 ? 1 : -1);
                                        const labelX = node.hierarchyLevel <= 1 ? 0 : labelDirection * (radius + 12);
                                        const labelDy = node.hierarchyLevel <= 1 ? -(radius + 20) : 3;
                                        const labelAnchor = node.hierarchyLevel <= 1
                                            ? 'middle'
                                            : labelDirection > 0
                                              ? 'start'
                                              : 'end';

                                        return (
                                            <g
                                                key={node.id}
                                                id={`directory-node-${node.id}`}
                                                className="cursor-pointer transition-opacity duration-500"
                                                style={{ opacity: isHoldFaded ? 0.16 : 1 }}
                                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                                onMouseLeave={() => setHoveredNodeId(null)}
                                                onMouseDown={(event) => handleNodeMouseDown(event, node)}
                                            >
                                                <circle r={15} fill="transparent" />
                                                {isSelected || isHovered || isHeld ? (
                                                    <circle
                                                        r={radius + (isStronglyHighlighted ? 7 : 5)}
                                                        fill={graphPalette.halo}
                                                        opacity={
                                                            isStronglyHighlighted
                                                                ? '0.32'
                                                                : isHovered
                                                                  ? '0.12'
                                                                  : '0.1'
                                                        }
                                                        filter="url(#glow)"
                                                    />
                                                ) : null}
                                                <circle
                                                    r={radius}
                                                    fill={fill}
                                                    stroke={
                                                        isStronglyHighlighted
                                                            ? graphPalette.nodeStroke
                                                        : isHovered
                                                            ? graphPalette.nodeStroke
                                                            : isSelected
                                                              ? graphPalette.nodeStroke
                                                              : node.hierarchyLevel <= 1
                                                                ? graphPalette.nodeStroke
                                                                : graphPalette.nodeStrokeSoft
                                                    }
                                                    strokeWidth={
                                                        isStronglyHighlighted
                                                            ? 2.1
                                                            : isHovered
                                                              ? 1.35
                                                              : isSelected
                                                                ? 1.45
                                                                : node.hierarchyLevel <= 1
                                                                  ? node.hierarchyLevel === 0 ? 2 : 1.5
                                                                  : 0.45
                                                    }
                                                    className="transition-all duration-300"
                                                />
                                                {node.hierarchyLevel <= 1 ? (
                                                    <circle
                                                        r={node.hierarchyLevel === 0 ? 5 : 3}
                                                        fill={graphPalette.nodeStroke}
                                                        opacity={isHoldFaded ? 0.2 : 0.92}
                                                        className="transition-all duration-300"
                                                    />
                                                ) : null}
                                                <text
                                                    x={labelX}
                                                    textAnchor={labelAnchor}
                                                    dy={labelDy}
                                                    fill="none"
                                                    stroke={graphPalette.labelOutline}
                                                    strokeWidth={4.4}
                                                    strokeLinejoin="round"
                                                    strokeLinecap="round"
                                                    fontSize={`${labelFontSize}px`}
                                                    fontWeight={labelWeight}
                                                    className="select-none transition-all duration-300"
                                                    style={{ pointerEvents: 'none', letterSpacing: '0.12em' }}
                                                >
                                                    {node.label}
                                                </text>
                                                <text
                                                    x={labelX}
                                                    textAnchor={labelAnchor}
                                                    dy={labelDy}
                                                    fill={labelOpacity}
                                                    fontSize={`${labelFontSize}px`}
                                                    fontWeight={labelWeight}
                                                    className="select-none transition-all duration-300"
                                                    style={{ pointerEvents: 'none', letterSpacing: '0.12em' }}
                                                >
                                                    {node.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            </g>
                        </svg>

                    </div>

                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--directory-graph-border); }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--directory-graph-text-muted); }

                        .directory-graph-shell[data-theme-mode="light"] [class*="text-white"] {
                            color: var(--directory-graph-text) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] [class*="border-white"] {
                            border-color: var(--directory-graph-border) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] [class*="bg-[#000]"],
                        .directory-graph-shell[data-theme-mode="light"] [class*="bg-white"] {
                            background: var(--directory-graph-control) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] input {
                            background: var(--directory-graph-input) !important;
                            border-color: var(--directory-graph-border) !important;
                            color: var(--directory-graph-text-strong) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] input:focus {
                            background: var(--directory-graph-input-focus) !important;
                            border-color: var(--directory-graph-text-strong) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] input::placeholder {
                            color: var(--directory-graph-text-muted) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] button:hover {
                            background: var(--directory-graph-control-hover) !important;
                            border-color: var(--directory-graph-control-hover) !important;
                            color: var(--directory-graph-control-hover-text) !important;
                        }

                        .directory-graph-shell[data-theme-mode="light"] button:hover svg {
                            color: var(--directory-graph-control-hover-text) !important;
                        }
                    `}</style>
                </main>
            </div>
        );
    },
);

export default DirectoryGraphView;
