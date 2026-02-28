import { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';

const Network3DView = lazy(() => import('../components/graph/Network3DView'));
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, RefreshCw, Calendar, Share2, Loader2 } from 'lucide-react';

import { Button } from '../components/ui';

import type { GraphModel } from '../lib/graphModel';
import { fetchGraphModel, buildStaticGraphModel } from '../lib/graphModel';
import type { PositionedNode } from '../lib/graphLayouts';
import { layoutChronological, layoutNetwork, getChronologicalEdges } from '../lib/graphLayouts';

export function GraphOverviewPage() {
    const navigate = useNavigate();

    // View State
    const [activeTab, setActiveTab] = useState<'chronological' | 'network'>('chronological');
    const [model, setModel] = useState<GraphModel | null>(null);
    const [nodes, setNodes] = useState<PositionedNode[]>([]);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredNetworkModel, setFilteredNetworkModel] = useState<GraphModel | null>(null);

    // Cache for network positions to avoid re-simulating
    const networkCache = useRef<PositionedNode[] | null>(null);

    // Viewport State
    // origin-0 coordinate system: Screen = World * Scale + [viewX, viewY]
    const [scale, setScale] = useState(1);
    const [viewX, setViewX] = useState(0);
    const [viewY, setViewY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Initialization: Center the view & Load Data
    useEffect(() => {
        // Find best fit scale for the 2500px timeline.
        // Assuming average laptop ~1200px width. So 0.4 scale shows most of it.
        const START_SCALE = activeTab === 'chronological' ? 0.4 : 1;
        setScale(START_SCALE);

        // Adjust initial translation so timeline is near center/top
        if (activeTab === 'chronological') {
            setViewX(100);
            setViewY(100);
        } else {
            setViewX(window.innerWidth / 2);
            setViewY(window.innerHeight / 2);
        }

        // Load Graph Data
        const loadGraph = async () => {
            setIsLoading(true);
            try {
                const data = await fetchGraphModel();
                networkCache.current = null; // Clear layout cache on new data
                setModel(data);
            } catch (e) {
                console.error("Failed to load graph from DB, falling back to static model:", e);
                // Fallback to static model
                const staticData = buildStaticGraphModel();
                setModel(staticData);
            } finally {
                setIsLoading(false);
            }
        };
        loadGraph();
    }, []);

    // Layout Effect
    // Layout Effect
    useEffect(() => {
        if (!model) {
            console.log("GraphOverviewPage: No model loaded yet.");
            return;
        }

        console.log("GraphOverviewPage: Model loaded", { nodes: model.nodes.length, edges: model.edges.length });

        // 1. Filter Nodes based on View Rules
        let activeNodes = model.nodes;

        // Rule A & B Combined: View-Only Orphan Filtering + Mathematical Physics Exception
        // 1. Hide 'concept' nodes that are not connected to any edge.
        // 2. Hide 'mathematical-physics' nodes UNLESS they are explicitly connected via a 'mentions' edge.
        const connectedIds = new Set<string>();
        const mentionsIds = new Set<string>();

        model.edges.forEach(e => {
            connectedIds.add(e.source);
            connectedIds.add(e.target);
            if (e.type === 'mentions') {
                mentionsIds.add(e.source);
                mentionsIds.add(e.target);
            }
        });

        activeNodes = activeNodes.filter(n => {
            // RULE: The Mathematical Physics main field node itself is NEVER shown in any view.
            if (n.id === 'mathematical-physics') {
                return false;
            }

            // RULE: For child topics of Mathematical Physics, only show in Network View IF explicitly mentioned.
            if (n.data?.fieldId === 'mathematical-physics') {
                if (activeTab === 'chronological') return false;
                return mentionsIds.has(n.id);
            }

            if (n.type === 'concept') {
                return connectedIds.has(n.id);
            }

            return true; // Always show other Topics/Fields regardless of connection
        });

        // 2. Filter Edges to match Active Nodes (Fixes "Dropped Edge" warnings)
        // NOTE: For Network view, we use generated backbone edges for layout, but here we can just pass default.
        // The layoutNetwork function calculates its own backbone internally.
        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        const activeEdges = model.edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

        console.log(`Graph Layout Update. Nodes: ${activeNodes.length}, Edges: ${activeEdges.length}`);

        if (activeTab === 'chronological') {
            // Pass filtered model to layout
            const layout = layoutChronological({ nodes: activeNodes, edges: activeEdges });
            console.log("Chronological Nodes Layout Result:", layout.length, layout[0]);
            setNodes(layout);
        } else if (activeTab === 'network') {
            // Check cache (simple length check optimization)
            if (networkCache.current && networkCache.current.length === activeNodes.length) {
                console.log("Using cached network layout");
                setNodes(networkCache.current);
            } else {
                console.log("Running network simulation...");
                // Initial simulation with filtered nodes
                const layout = layoutNetwork({ nodes: activeNodes, edges: activeEdges });
                console.log("Network Simulation Result:", layout.length, layout[0]);
                networkCache.current = layout;
                setNodes(layout);
            }
            setFilteredNetworkModel({ nodes: activeNodes, edges: activeEdges });
        }
    }, [activeTab, model]);


    // Helper for viewport refs for event handlers
    const viewportRef = useRef({ x: viewX, y: viewY, scale: scale });
    useEffect(() => {
        viewportRef.current = { x: viewX, y: viewY, scale };
    }, [viewX, viewY, scale]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { x, y, scale } = viewportRef.current;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const delta = e.deltaY;
            const zoomFactor = Math.exp(-delta * 0.001);
            const newScale = Math.min(Math.max(scale * zoomFactor, 0.2), 3.0);

            // World Point under mouse
            const worldX = (mouseX - x) / scale;
            const worldY = (mouseY - y) / scale;

            // New View Position
            // mouseX = worldX * newScale + newX
            const newX = mouseX - worldX * newScale;
            const newY = mouseY - worldY * newScale;

            setViewX(newX);
            setViewY(newY);
            setScale(newScale);
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

    // Touch State for Mobile
    const touchStateRef = useRef<{
        lastPinchDist: number | null;
        lastTouchPos: { x: number; y: number } | null;
    }>({ lastPinchDist: null, lastTouchPos: null });

    // Pan Handlers
    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setViewX(prev => prev + e.movementX);
        setViewY(prev => prev + e.movementY);
    };

    // Touch Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStateRef.current.lastTouchPos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            touchStateRef.current.lastPinchDist = null;
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchStateRef.current.lastPinchDist = Math.sqrt(dx * dx + dy * dy);
            touchStateRef.current.lastTouchPos = null;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && touchStateRef.current.lastTouchPos) {
            // Panning
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - touchStateRef.current.lastTouchPos.x;
            const deltaY = currentY - touchStateRef.current.lastTouchPos.y;

            setViewX(prev => prev + deltaX);
            setViewY(prev => prev + deltaY);

            touchStateRef.current.lastTouchPos = { x: currentX, y: currentY };
        } else if (e.touches.length === 2 && touchStateRef.current.lastPinchDist) {
            // Pinch to zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const scaleRatio = dist / touchStateRef.current.lastPinchDist;

            // Calculate center of pinch to zoom towards it
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = centerX - rect.left;
            const mouseY = centerY - rect.top;

            const worldX = (mouseX - viewX) / scale;
            const worldY = (mouseY - viewY) / scale;

            let newScale = scale * scaleRatio;
            newScale = Math.min(Math.max(newScale, 0.1), 3); // constraints

            const newX = mouseX - worldX * newScale;
            const newY = mouseY - worldY * newScale;

            setScale(newScale);
            setViewX(newX);
            setViewY(newY);

            touchStateRef.current.lastPinchDist = dist;
        }
    };

    const handleTouchEnd = () => {
        touchStateRef.current.lastTouchPos = null;
        touchStateRef.current.lastPinchDist = null;
    };

    // Render Logic
    const edges = useMemo(() => {
        if (!model) return [];

        let filteredEdges = model.edges;

        // Use Generated Backbone Edges for Network View
        if (activeTab === 'network') {
            // Use chronological sequential edges strictly for visual representation 
            // to show flow from node to node rather than parent to all.
            filteredEdges = getChronologicalEdges(model);
        } else if (activeTab === 'chronological') {
            // Chronological View uses the backbone chain (Field -> Year 1 -> Year 2)
            filteredEdges = getChronologicalEdges(model);
        }

        // Validity Check & Debugging for Dropouts
        const validEdges = filteredEdges.filter(e => {
            const hasSource = nodes.some(n => n.id === e.source);
            const hasTarget = nodes.some(n => n.id === e.target);

            if ((!hasSource || !hasTarget) && process.env.NODE_ENV === 'development') {
                // Supply quiet console or ignore
            }
            return hasSource && hasTarget;
        });

        return validEdges;
    }, [model, activeTab, nodes]);


    // Background Layers
    const renderBackground = () => {
        const isTimeline = activeTab === 'chronological';
        const strokeWidth = 1 / scale;

        if (isTimeline) {
            // Constants must match graphLayouts
            const PADDING_X = 400; // Matches TIMELINE_X0 in layout
            const TIMELINE_WIDTH = 2500;
            const AVAILABLE_WIDTH = TIMELINE_WIDTH - PADDING_X - 50;
            const MIN_YEAR = 1600;
            const MAX_YEAR = 2030;
            const PX_PER_YEAR = AVAILABLE_WIDTH / (MAX_YEAR - MIN_YEAR);
            const LANE_HEIGHT = 300;
            const FIELD_ORDER = ['classical', 'electrodynamics', 'statistical', 'quantum'];

            const majorTicks = [];
            const minorTicks = [];
            const labels = [];

            for (let year = Math.ceil(MIN_YEAR / 20) * 20; year <= MAX_YEAR; year += 20) {
                const x = PADDING_X + (year - MIN_YEAR) * PX_PER_YEAR;
                const isMajor = year % 100 === 0;

                if (isMajor) {
                    majorTicks.push(
                        <line
                            key={`maj-${year}`} x1={x} y1={-50} x2={x} y2={1200}
                            stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={0.2}
                            strokeDasharray={`${4 / scale} ${4 / scale}`}
                            className="text-muted-foreground"
                        />
                    );
                    labels.push(
                        <text
                            key={`lbl-${year}`} x={x + 5} y={-60}
                            fill="currentColor"
                            fontSize={12 / scale} fontFamily="var(--font-mono)" // Modern Mono
                            className="text-muted-foreground"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {year}
                        </text>
                    );
                } else {
                    minorTicks.push(
                        <line
                            key={`min-${year}`} x1={x} y1={-20} x2={x} y2={1200}
                            stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={0.1}
                            className="text-border"
                        />
                    );
                }
            }

            return (
                <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" className="overflow-visible absolute top-0 left-0">
                        <g>
                            {/* Ticks & Labels */}
                            {majorTicks}
                            {minorTicks}
                            {labels}

                            {/* Lane Guides (Subtle) */}
                            {FIELD_ORDER.map((field, i) => {
                                const y = i * LANE_HEIGHT;
                                return (
                                    <line
                                        key={`lane-${field}`}
                                        x1={PADDING_X} y1={y} x2={2500} y2={y}
                                        stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={0.05}
                                        className="text-primary"
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>
            )
        }

        // Network Background (Subtle Dot Grid)
        if (activeTab === 'network') return null; // Let 3D handle its own background
        return (
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none text-muted-foreground"
                style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
        );
    }

    // Data Refresh
    const reloadGraph = async () => {
        setIsLoading(true);
        try {
            const data = await fetchGraphModel();
            networkCache.current = null;
            setModel(data);
        } catch (e) {
            console.error("Failed to reload graph:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const resetView = (tab: 'chronological' | 'network' = activeTab) => {
        if (tab === 'chronological') {
            setScale(0.4);
            setViewX(100);
            setViewY(100);
        } else {
            setScale(1);
            setViewX(window.innerWidth / 2);
            setViewY(window.innerHeight / 2);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`w-full h-[calc(100vh-64px)] relative overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
                bg-transparent text-foreground touch-none`} // Key Fix: Transparent background and touch-none to prevent default scrolling
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleDragMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ overscrollBehavior: 'none' }}
        >
            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                        <span className="text-sm text-muted-foreground font-serif">Loading Knowledge Graph...</span>
                    </div>
                </div>
            )}

            {/* Background Container - Moves with Viewport */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: viewX, y: viewY, scale }}
                exit={{ opacity: 0 }}
                transition={{ type: "tween", duration: 0 }}
                style={{ transformOrigin: "0 0" }}
                className="absolute inset-0 pointer-events-none"
            >
                {renderBackground()}
            </motion.div>

            {/* UI Controls */}
            {/* Using top-4 with an absolute container inside a relative container that's already offset by the header. */}
            <div className="absolute top-4 left-4 z-20 flex gap-2" onMouseDown={e => e.stopPropagation()}>
                <div className="glass p-1 rounded-lg flex gap-1">
                    <Button
                        variant={activeTab === 'chronological' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('chronological'); resetView('chronological'); }}
                        className="text-xs"
                    >
                        <Calendar className="w-3 h-3 mr-2" />
                        Timeline
                    </Button>
                    <Button
                        variant={activeTab === 'network' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('network'); resetView('network'); }}
                        className="text-xs"
                    >
                        <Share2 className="w-3 h-3 mr-2" />
                        Network
                    </Button>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2" onMouseDown={e => e.stopPropagation()}>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => setScale(s => Math.min(s + 0.1, 3))}><ZoomIn className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => { resetView(); reloadGraph(); }}><RefreshCw className="w-4 h-4" /></Button>
            </div>

            {/* Content Canvas */}
            {activeTab === 'network' && filteredNetworkModel ? (
                <div className="absolute inset-0 z-10 w-full h-full pointer-events-auto">
                    <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                        <Network3DView model={filteredNetworkModel} />
                    </Suspense>
                </div>
            ) : (
                <div className="w-full h-full pointer-events-none">
                    <motion.div
                        className="w-full h-full"
                        animate={{ x: viewX, y: viewY, scale }}
                        transition={{ type: "tween", duration: 0 }}
                        style={{ transformOrigin: "0 0" }}
                    >
                        <svg width="100%" height="100%" className="overflow-visible absolute top-0 left-0">
                            <defs>
                                <marker
                                    id="arrow-vintage"
                                    viewBox="0 0 10 10"
                                    refX="10"
                                    refY="5"
                                    markerWidth="6"
                                    markerHeight="6"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-muted-foreground" opacity="0.5" />
                                </marker>
                                <marker
                                    id="arrow-network"
                                    viewBox="0 0 10 10"
                                    refX="22" // Adjust based on node size approx
                                    refY="5"
                                    markerWidth="5"
                                    markerHeight="5"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-muted-foreground" opacity="0.3" />
                                </marker>
                                <marker
                                    id="arrow-network-hover"
                                    viewBox="0 0 10 10"
                                    refX="22"
                                    refY="5"
                                    markerWidth="6"
                                    markerHeight="6"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-primary" opacity="1" />
                                </marker>
                            </defs>

                            {/* Edges */}
                            <AnimatePresence>
                                {edges.map((edge) => {
                                    const source = nodes.find(n => n.id === edge.source);
                                    const target = nodes.find(n => n.id === edge.target);

                                    // Strict coordinate check to prevent SVG errors
                                    if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.y) ||
                                        !target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
                                        return null;
                                    }

                                    const isTimeline = activeTab === 'chronological';
                                    const isHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

                                    let strokeOpacity = 0.2;
                                    let strokeWidth = 1.5;
                                    let markerEnd = "";
                                    let className = "text-muted-foreground";

                                    if (isTimeline) {
                                        className = "text-border";
                                        strokeOpacity = 0.3;
                                        strokeWidth = 1 / scale;

                                        if (isHovered) {
                                            className = "text-primary";
                                            strokeOpacity = 1;
                                            strokeWidth = 2.5 / scale;
                                        }
                                    } else {
                                        // Network Style
                                        strokeOpacity = 0.2;
                                        if (edge.type === 'hierarchy' || edge.type === 'mentions') {
                                            markerEnd = isHovered ? "url(#arrow-network-hover)" : "url(#arrow-network)";
                                        }

                                        if (isHovered) {
                                            className = "text-primary";
                                            strokeOpacity = 0.8;
                                            strokeWidth = 2;
                                        }
                                    }

                                    return (
                                        <motion.line
                                            key={`${edge.source}-${edge.target}-${activeTab}`}
                                            x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: strokeOpacity }}
                                            exit={{ opacity: 0 }}
                                            stroke="currentColor"
                                            className={className}
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            markerEnd={markerEnd}
                                        />
                                    );
                                })}
                            </AnimatePresence>

                            {/* Stems for Timeline Stacked Nodes */}
                            {activeTab === 'chronological' && nodes.map((node) => {
                                const baselineY = node.data?.baselineY as number | undefined;
                                if (baselineY !== undefined && Math.abs(node.y - baselineY) > 5) {
                                    return (
                                        <motion.line
                                            key={`stem-${node.id}`}
                                            x1={node.x} y1={baselineY} x2={node.x} y2={node.y}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.3 }}
                                            exit={{ opacity: 0 }}
                                            stroke="currentColor"
                                            className="text-border"
                                            strokeWidth={1 / scale}
                                            strokeDasharray={`${4 / scale} ${4 / scale}`}
                                        />
                                    );
                                }
                                return null;
                            })}

                        </svg>

                        {/* HTML Node Overlay Layer to Bypass Safari SVG foreignObject Bugs */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {nodes.map((node) => {
                                // Verify node position safety
                                if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return null;

                                const isTimeline = activeTab === 'chronological';

                                if (isTimeline) {
                                    const isRoot = node.type === 'root';
                                    const isField = node.type === 'field';

                                    // Glassmorphism Node Style
                                    let containerStyle = "glass-card border border-white/20 text-foreground flex flex-col items-center justify-center text-center p-2 backdrop-blur-md";
                                    let fontClass = "font-sans text-[10px] leading-tight";
                                    let shapeClass = "min-w-[100px] max-w-[120px] min-h-[50px] rounded-xl";

                                    if (isRoot) {
                                        containerStyle = "bg-card text-foreground border border-border z-20 shadow-lg";
                                        fontClass = "font-display text-base uppercase tracking-widest font-bold text-muted-foreground";
                                        shapeClass = "aspect-square rounded-full w-24 h-24 flex items-center justify-center";
                                    } else if (isField) {
                                        // Field badges in timeline
                                        containerStyle = "bg-primary/20 border border-primary/30 text-primary-foreground z-10 backdrop-blur-sm";
                                        fontClass = "font-display font-bold text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest";
                                        shapeClass = "px-2 py-1.5 md:px-4 min-w-[170px] max-w-[180px] text-center rounded-lg";
                                    }

                                    const isHovered = hoveredNodeId === node.id;
                                    if (isHovered && !isRoot) {
                                        containerStyle += " shadow-2xl scale-105 border-primary z-30 bg-primary text-primary-foreground";
                                    }

                                    return (
                                        <div
                                            key={node.id}
                                            style={{
                                                position: 'absolute',
                                                left: node.x - (isRoot ? 48 : (isField ? 90 : 50)),
                                                top: node.y - (isRoot ? 48 : 25),
                                                width: isRoot ? 96 : (isField ? 180 : 100),
                                                height: isRoot ? 96 : 60
                                            }}
                                            className="pointer-events-auto"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onMouseEnter={() => setHoveredNodeId(node.id)}
                                            onMouseLeave={() => setHoveredNodeId(null)}
                                        >
                                            <div className="flex items-center justify-center h-full w-full p-1">
                                                <div
                                                    className={`
                                                     cursor-pointer transition-all duration-300
                                                     ${containerStyle}
                                                     ${shapeClass}
                                                 `}
                                                    onClick={() => {
                                                        if (node.slug) navigate(`/topic/${node.slug}`);
                                                    }}
                                                >
                                                    {!isRoot && !isField && (node.data as any)?.year && (
                                                        <div className="absolute -top-2 -right-2 bg-background border border-border px-1 rounded text-[9px] font-mono text-muted-foreground shadow-sm">
                                                            {(node.data as any).year}
                                                        </div>
                                                    )}

                                                    <div className={`${fontClass} z-10 line-clamp-2`}>{node.label}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // --- Network Render (Modern Dots as SVG inside HTML wrapper) ---
                                let radius = 6;
                                let className = "text-muted";
                                let stroke = "none";
                                let strokeWidth = 0;
                                let opacity = 0.8;
                                let fontSize = 10;
                                let fontWeight = "normal";
                                let textYOffset = 12;

                                if (node.type === 'root') {
                                    radius = 20;
                                    className = "text-foreground";
                                    fontSize = 16;
                                    fontWeight = "bold";
                                    textYOffset = 30;
                                } else if (node.type === 'field') {
                                    radius = 14;
                                    // Field Colors
                                    const colorMap: Record<string, string> = {
                                        'classical': 'text-blue-400',
                                        'quantum': 'text-pink-400',
                                        'statistical': 'text-green-400',
                                        'electrodynamics': 'text-yellow-400',
                                        'mathematical-physics': 'text-purple-400'
                                    };
                                    className = colorMap[(node.data as any)?.fieldId as string] || 'text-muted';
                                    fontSize = 14;
                                    fontWeight = "600";
                                    textYOffset = 22;
                                    opacity = 1;
                                } else if (node.type === 'topic') {
                                    radius = 6;
                                    className = "text-foreground";
                                    opacity = 0.9;
                                    fontSize = 10;
                                    textYOffset = 14;
                                } else if (node.type === 'section') {
                                    radius = 4;
                                    className = "text-muted-foreground";
                                    fontSize = 0; // Hide
                                    opacity = 0.5;
                                } else if (node.type === 'concept') {
                                    radius = 3;
                                    className = "text-muted";
                                    fontSize = 8;
                                    opacity = 0.6;
                                    textYOffset = 8;
                                }

                                const isHovered = hoveredNodeId === node.id;
                                if (isHovered) {
                                    className = "text-primary";
                                    radius *= 1.2;
                                    opacity = 1;
                                    fontSize = Math.max(fontSize, 10);
                                }

                                return (
                                    <div
                                        key={node.id}
                                        style={{
                                            position: 'absolute',
                                            left: node.x - 50, // bounding box for interactions
                                            top: node.y - 50,
                                            width: 100,
                                            height: 100,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'none', // Div container shouldn't block
                                        }}
                                    >
                                        <svg width="100" height="100" className="overflow-visible pointer-events-none">
                                            <g
                                                className={`pointer-events-auto transition-all duration-300 ${className}`}
                                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                                onMouseLeave={() => setHoveredNodeId(null)}
                                                onClick={() => {
                                                    if (node.slug) navigate(`/topic/${node.slug}`);
                                                }}
                                                style={{ cursor: node.slug ? 'pointer' : 'default', transform: 'translate(50px, 50px)' }}
                                            >
                                                <circle
                                                    cx={0}
                                                    cy={0}
                                                    r={radius}
                                                    fill="currentColor"
                                                    stroke={stroke}
                                                    strokeWidth={strokeWidth}
                                                    opacity={opacity}
                                                    className="shadow-sm"
                                                />
                                                {/* Halo on Hover */}
                                                {isHovered && (
                                                    <circle
                                                        cx={0}
                                                        cy={0}
                                                        r={radius + 4}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={1}
                                                        opacity={0.5}
                                                    />
                                                )}

                                                {/* Text Below */}
                                                {(node.type !== 'section' || isHovered) && (
                                                    <text
                                                        x={0}
                                                        y={textYOffset}
                                                        textAnchor="middle"
                                                        fill="currentColor"
                                                        fontSize={fontSize}
                                                        fontFamily="var(--font-sans)"
                                                        fontWeight={fontWeight}
                                                        className="text-foreground pointer-events-none drop-shadow-md"
                                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                                        opacity={isHovered ? 1 : 0.8}
                                                    >
                                                        {node.label}
                                                    </text>
                                                )}
                                            </g>
                                        </svg>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
