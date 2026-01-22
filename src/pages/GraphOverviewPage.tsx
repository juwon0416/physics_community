import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, RefreshCw, Sparkles, Calendar, Share2, Loader2 } from 'lucide-react';

import { Button } from '../components/ui';

import type { GraphModel } from '../lib/graphModel';
import { fetchGraphModel } from '../lib/graphModel';
import type { PositionedNode } from '../lib/graphLayouts';
import { layoutChronological, layoutNetwork } from '../lib/graphLayouts';

export function GraphOverviewPage() {
    const navigate = useNavigate();

    // View State
    const [activeTab, setActiveTab] = useState<'chronological' | 'network'>('chronological');
    const [model, setModel] = useState<GraphModel | null>(null);
    const [nodes, setNodes] = useState<PositionedNode[]>([]);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        // Initial center
        setViewX(window.innerWidth / 2);
        setViewY(window.innerHeight / 2);

        // Load Graph Data
        const loadGraph = async () => {
            setIsLoading(true);
            try {
                const data = await fetchGraphModel();
                setModel(data);
            } catch (e) {
                console.error("Failed to load graph:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadGraph();
    }, []);

    // Layout Effect
    useEffect(() => {
        if (!model) return;

        if (activeTab === 'chronological') {
            const layout = layoutChronological(model);
            setNodes(layout);
        } else if (activeTab === 'network') {
            // Check cache
            if (networkCache.current) {
                setNodes(networkCache.current);
            } else {
                // Initial simulation
                const layout = layoutNetwork(model);
                networkCache.current = layout;
                setNodes(layout);
            }
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

    // Pan Handlers
    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setViewX(prev => prev + e.movementX);
        setViewY(prev => prev + e.movementY);
    };

    // Render Logic
    const edges = useMemo(() => {
        if (!model) return [];
        if (activeTab === 'chronological') {
            // Show temporal and hierarchy edges in chronological view
            // hierarchy edges only if source is a field (connecting field to topic/concept)
            return model.edges.filter(e => e.type === 'temporal' || (e.type === 'hierarchy' && nodes.find(n => n.id === e.source)?.type === 'field'));
        } else {
            return model.edges;
        }
    }, [model, activeTab, nodes]);


    // Background Layers
    const renderBackground = () => {
        const isVintage = activeTab === 'chronological';
        const strokeWidth = 1 / scale;

        if (isVintage) {
            // Constants must match graphLayouts
            const PADDING_X = 400; // Matches TIMELINE_X0 in layout
            const AVAILABLE_WIDTH = 2000 - PADDING_X - 50;
            const MIN_YEAR = 1600;
            const MAX_YEAR = 2030;
            const PX_PER_YEAR = AVAILABLE_WIDTH / (MAX_YEAR - MIN_YEAR);
            const LANE_HEIGHT = 150;
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
                            key={`maj-${year}`} x1={x} y1={-50} x2={x} y2={600}
                            stroke="var(--grid)" strokeWidth={strokeWidth} strokeOpacity={0.8}
                            strokeDasharray={`${4 / scale} ${4 / scale}`}
                        />
                    );
                    labels.push(
                        <text
                            key={`lbl-${year}`} x={x + 5} y={-60}
                            fill="var(--muted)"
                            fontSize={12 / scale} fontFamily="serif"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            {year}
                        </text>
                    );
                } else {
                    minorTicks.push(
                        <line
                            key={`min-${year}`} x1={x} y1={-20} x2={x} y2={600}
                            stroke="var(--grid)" strokeWidth={strokeWidth} strokeOpacity={0.3}
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
                                        x1={PADDING_X} y1={y} x2={2000} y2={y}
                                        stroke="var(--grid)" strokeWidth={strokeWidth} strokeOpacity={0.2}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>
            )
        }

        return (
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#1f1b1f 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
        );
    }

    const resetView = () => {
        setScale(1);
        setViewX(window.innerWidth / 2);
        setViewY(window.innerHeight / 2);
    };

    return (
        <div
            ref={containerRef}
            className={`w-full h-[calc(100dvh-64px)] relative overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
                ${activeTab === 'chronological' ? 'timeline-vintage bg-[var(--paper)] text-[var(--ink)]' : 'bg-[#e6e0d6]'}`}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleDragMove}
            style={{ touchAction: 'none', overscrollBehavior: 'none' }}
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
            <div className="absolute top-4 left-4 z-20 flex gap-2" onMouseDown={e => e.stopPropagation()}>
                <div className="bg-white/80 backdrop-blur p-1 rounded-lg border border-black/10 shadow-sm flex gap-1">
                    <Button
                        variant={activeTab === 'chronological' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('chronological'); resetView(); }}
                        className="text-xs font-serif"
                    >
                        <Calendar className="w-3 h-3 mr-2" />
                        Timeline
                    </Button>
                    <Button
                        variant={activeTab === 'network' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('network'); resetView(); }}
                        className="text-xs font-serif"
                    >
                        <Share2 className="w-3 h-3 mr-2" />
                        Network
                    </Button>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2" onMouseDown={e => e.stopPropagation()}>
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={() => setScale(s => Math.min(s + 0.1, 3))}><ZoomIn className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={resetView}><RefreshCw className="w-4 h-4" /></Button>
            </div>

            {/* Content Canvas */}
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
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" opacity="0.5" />
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
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f1b1f" opacity="0.3" />
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
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" opacity="1" />
                            </marker>
                        </defs>

                        {/* Edges */}
                        <AnimatePresence>
                            {edges.map((edge) => {
                                const source = nodes.find(n => n.id === edge.source);
                                const target = nodes.find(n => n.id === edge.target);
                                if (!source || !target) return null;

                                const isVintage = activeTab === 'chronological';
                                const isHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

                                let strokeColor = "#1f1b1f";
                                let strokeOpacity = 0.2;
                                let strokeWidth = 1.5;
                                let markerEnd = "";

                                if (isVintage) {
                                    strokeColor = "var(--grid)";
                                    strokeOpacity = 0.3;
                                    strokeWidth = 1 / scale;

                                    if (source.type === 'root' || target.type === 'root') {
                                        strokeColor = "var(--ink)";
                                        strokeOpacity = 0.6;
                                        strokeWidth = 1.5 / scale;
                                    }

                                    if (isHovered) {
                                        strokeColor = "var(--accent)";
                                        strokeOpacity = 1;
                                        strokeWidth = 2.5 / scale;
                                    }
                                } else {
                                    // Network Style
                                    strokeOpacity = 0.2;
                                    // Arrows for hierarchy/mentions
                                    if (edge.type === 'hierarchy' || edge.type === 'mentions') {
                                        markerEnd = isHovered ? "url(#arrow-network-hover)" : "url(#arrow-network)";
                                    }

                                    if (isHovered) {
                                        strokeColor = "var(--accent)"; // Or a dark color
                                        strokeOpacity = 0.8;
                                        strokeWidth = 2;
                                    }
                                }

                                return (
                                    <motion.line
                                        key={`${edge.source}-${edge.target}-${activeTab}`}
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: strokeOpacity,
                                            x1: source.x, y1: source.y, x2: target.x, y2: target.y
                                        }}
                                        exit={{ opacity: 0 }}
                                        stroke={strokeColor}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        markerEnd={markerEnd}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {/* Nodes */}
                        {nodes.map((node) => {
                            const isVintage = activeTab === 'chronological';

                            if (isVintage) {
                                const isRoot = node.type === 'root';
                                const isField = node.type === 'field';

                                let containerStyle = "bg-[var(--paper)] border border-[var(--muted)] text-[var(--ink)] shadow-sm transition-all";
                                let fontClass = "font-serif text-[10px] leading-tight";
                                let shapeClass = "px-2 py-1 min-w-[100px] max-w-[110px] min-h-[50px] rounded-sm";

                                if (isRoot) {
                                    containerStyle = "bg-[var(--ink)] text-[var(--paper)] border-4 border-double border-[var(--paper)] z-20";
                                    fontClass = "font-display text-base uppercase tracking-widest";
                                    shapeClass = "aspect-square rounded-full w-24 h-24 flex items-center justify-center";
                                } else if (isField) {
                                    containerStyle = "bg-[var(--paper)] border-2 border-[var(--ink)] text-[var(--ink)] z-10";
                                    fontClass = "font-display font-bold text-xs uppercase tracking-wider";
                                    shapeClass = "px-3 py-1 min-w-[100px] text-center rounded-lg";
                                }

                                const isHovered = hoveredNodeId === node.id;
                                if (isHovered && !isRoot) {
                                    containerStyle += " border-[var(--accent)] ring-1 ring-[var(--accent)] z-30";
                                }

                                return (
                                    <foreignObject
                                        key={node.id}
                                        x={node.x - (isRoot ? 48 : 50)}
                                        y={node.y - (isRoot ? 48 : 25)}
                                        width={isRoot ? 96 : 100}
                                        height={isRoot ? 96 : 80}
                                        className="pointer-events-auto overflow-visible"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onMouseEnter={() => setHoveredNodeId(node.id)}
                                        onMouseLeave={() => setHoveredNodeId(null)}
                                    >
                                        <div className="flex items-center justify-center h-full w-full p-1">
                                            <div
                                                className={`
                                                     flex flex-col items-center justify-center text-center cursor-pointer relative group
                                                     ${containerStyle}
                                                     ${shapeClass}
                                                 `}
                                                onClick={() => {
                                                    if (node.slug) navigate(`/topic/${node.slug}`);
                                                }}
                                            >
                                                {!isRoot && !isField && node.data?.year && (
                                                    <div className="absolute top-0.5 right-1.5 text-[8px] font-mono opacity-60 text-[var(--muted)]">
                                                        {node.data.year}
                                                    </div>
                                                )}

                                                <div className={`${fontClass} z-10 line-clamp-2`}>{node.label}</div>
                                            </div>
                                        </div>
                                    </foreignObject>
                                );
                            }

                            // Network Render (Original)
                            let containerStyle = "bg-[#f4f1ea] border border-[#1f1b1f]/20 text-[#1f1b1f] shadow-sm";
                            let fontClass = "font-serif";
                            let shapeClass = "aspect-[3/2] rounded-sm";

                            if (node.type === 'root') {
                                containerStyle = "bg-[#1f1b1f] text-[#f4f1ea] border-double border-4 border-[#f4f1ea]/20 shadow-2xl";
                                fontClass = "font-display tracking-widest text-lg uppercase";
                                shapeClass = "aspect-square rounded-full w-32 h-32 flex items-center justify-center";
                            } else if (node.type === 'field') {
                                containerStyle = "bg-[#eaddcf] border-2 border-[#1f1b1f] text-[#1f1b1f] shadow-[3px_3px_0px_0px_rgba(31,27,31,0.2)]";
                                fontClass = "font-display font-bold text-base md:text-lg";
                                shapeClass = "px-4 py-2 min-w-[160px] rounded-lg";
                            } else if (node.type === 'topic') {
                                containerStyle = "bg-[#fcfbf9] border border-[#1f1b1f]/30 hover:border-[#1f1b1f] hover:shadow-md transition-all";
                                fontClass = "font-serif text-sm";
                                shapeClass = "px-3 py-2 min-w-[140px] rounded-sm";
                            }

                            return (
                                <foreignObject
                                    key={node.id}
                                    x={node.x - (node.type === 'root' ? 64 : node.type === 'concept' ? 60 : 80)}
                                    y={node.y - (node.type === 'root' ? 64 : node.type === 'concept' ? 20 : 30)}
                                    width={node.type === 'root' ? 128 : 200}
                                    height={node.type === 'root' ? 128 : 100}
                                    className="pointer-events-auto overflow-visible"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-center h-full w-full p-2">
                                        <div
                                            className={`
                                                 flex flex-col items-center justify-center text-center cursor-pointer relative
                                                 ${containerStyle}
                                                 ${shapeClass}
                                             `}
                                            onClick={() => {
                                                if (node.slug) navigate(`/topic/${node.slug}`);
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none rounded-[inherit]" />
                                            {node.type === 'concept' && <Sparkles className="w-3 h-3 mb-1 text-[#d4b483]" />}
                                            <div className={`${fontClass} z-10 leading-snug`}>{node.label}</div>
                                            {node.description && node.type === 'topic' && (
                                                <div className="text-[10px] font-mono tracking-tighter opacity-70 mt-1 z-10 text-[#c15b4d]">
                                                    {node.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </foreignObject>
                            );
                        })}
                    </svg>
                </motion.div>
            </div>
        </div>
    );
}
