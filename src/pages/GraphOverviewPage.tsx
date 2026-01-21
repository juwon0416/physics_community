import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, RefreshCw, Sparkles, Calendar, Share2 } from 'lucide-react';

import { Button } from '../components/ui';


import type { GraphModel } from '../lib/graphModel';
import { buildGraphModel } from '../lib/graphModel';
import type { PositionedNode } from '../lib/graphLayouts';
import { layoutChronological, layoutNetwork } from '../lib/graphLayouts';

export function GraphOverviewPage() {
    const navigate = useNavigate();
    // const { isEditor } = useAuth();

    // View State
    const [activeTab, setActiveTab] = useState<'chronological' | 'network'>('chronological');
    const [model, setModel] = useState<GraphModel | null>(null);
    const [nodes, setNodes] = useState<PositionedNode[]>([]);

    // Cache for network positions to avoid re-simulating
    const networkCache = useRef<PositionedNode[] | null>(null);

    // Viewport
    const [scale, setScale] = useState(1);
    const [viewX, setViewX] = useState(0);
    const [viewY, setViewY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Initialization
    useEffect(() => {
        // Build agnostic model once
        const graphModel = buildGraphModel();
        setModel(graphModel);
    }, []);

    // Layout Effect
    useEffect(() => {
        if (!model) return;

        if (activeTab === 'chronological') {
            const layout = layoutChronological(model);
            setNodes(layout);
            // Reset View to start?
            // setViewX(0); setViewY(0); setScale(0.8);
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



    // Render Logic
    const edges = useMemo(() => {
        if (!model) return [];
        // Filter edges based on view
        if (activeTab === 'chronological') {
            // Only show 'temporal' or 'hierarchy' within same field for cleaner look
            return model.edges.filter(e => e.type === 'temporal' || (e.type === 'hierarchy' && nodes.find(n => n.id === e.source)?.type === 'field'));
        } else {
            return model.edges;
        }
    }, [model, activeTab, nodes]);

    // Background Layers
    const renderBackground = () => {
        if (activeTab === 'chronological') {
            // Draw horizontal lanes
            const LANES = [
                { y: 0, label: 'CLASSICAL MECHANICS' },
                { y: 150, label: 'ELECTRODYNAMICS' },
                { y: 300, label: 'STATISTICAL MECHANICS' },
                { y: 450, label: 'QUANTUM MECHANICS' },
            ];

            return (
                <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" className="overflow-visible absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <g>
                            {LANES.map(lane => (
                                <g key={lane.label}>
                                    {/* Lane Background/Line */}
                                    <rect x="-5000" y={lane.y - 60} width="10000" height="140" fill={lane.label.includes('CLASSICAL') ? '#eff6ff' : lane.label.includes('ELECTRO') ? '#fff7ed' : lane.label.includes('STAT') ? '#f0fdf4' : '#faf5ff'} fillOpacity="0.3" />
                                    <line x1="-5000" y1={lane.y} x2="5000" y2={lane.y} stroke="#000" strokeOpacity="0.05" strokeWidth="2" strokeDasharray="4 4" />

                                    {/* Label */}
                                    <text x="-50" y={lane.y} fill="currentColor" fillOpacity="0.1" fontSize="40" fontWeight="bold" fontFamily="serif" alignmentBaseline="middle" textAnchor="end">
                                        {lane.label}
                                    </text>
                                </g>
                            ))}
                            {/* Time Axis Markers (Simplified) */}
                            <line x1="100" y1="-200" x2="100" y2="700" stroke="red" strokeOpacity="0.1" strokeDasharray="2 2" />
                            <text x="110" y="-180" fill="red" fillOpacity="0.3" fontSize="12">TIME &rarr;</text>
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

    return (
        <div className="w-full h-[calc(100dvh-64px)] bg-[#e6e0d6] relative overflow-hidden cursor-move select-none">
            {/* Background */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                >
                    {renderBackground()}
                </motion.div>
            </AnimatePresence>

            {/* UI Controls */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="bg-white/80 backdrop-blur p-1 rounded-lg border border-black/10 shadow-sm flex gap-1">
                    <Button
                        variant={activeTab === 'chronological' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('chronological'); setScale(0.8); setViewX(-200); setViewY(100); }}
                        className="text-xs font-serif"
                    >
                        <Calendar className="w-3 h-3 mr-2" />
                        Timeline
                    </Button>
                    <Button
                        variant={activeTab === 'network' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setActiveTab('network'); setScale(1); setViewX(0); setViewY(0); }}
                        className="text-xs font-serif"
                    >
                        <Share2 className="w-3 h-3 mr-2" />
                        Network
                    </Button>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={() => setScale(s => Math.min(s + 0.1, 2))}><ZoomIn className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="bg-[#e6e0d6]" onClick={() => { setViewX(0); setViewY(0); setScale(1); }}><RefreshCw className="w-4 h-4" /></Button>
            </div>

            {/* SVG Canvas */}
            <div
                className="w-full h-full"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={(e) => {
                    if (isDragging) {
                        setViewX(p => p + e.movementX);
                        setViewY(p => p + e.movementY);
                    }
                }}
            >
                <motion.div
                    className="w-full h-full origin-center"
                    animate={{ x: viewX, y: viewY, scale }}
                    transition={{ type: "tween", duration: 0.05 }} // Fast response for drag
                >
                    <svg width="100%" height="100%" className="-translate-x-1/2 -translate-y-1/2 overflow-visible absolute top-1/2 left-1/2 pointer-events-none">
                        {/* Edges */}
                        <AnimatePresence>
                            {edges.map((edge) => {
                                const source = nodes.find(n => n.id === edge.source);
                                const target = nodes.find(n => n.id === edge.target);
                                if (!source || !target) return null;

                                return (
                                    <motion.line
                                        key={`${edge.source}-${edge.target}-${activeTab}`}
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: activeTab === 'chronological' ? 0.3 : 0.2,
                                            x1: source.x, y1: source.y, x2: target.x, y2: target.y
                                        }}
                                        exit={{ opacity: 0 }}
                                        stroke="#1f1b1f"
                                        strokeWidth={activeTab === 'chronological' ? 2 : 1.5}
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {/* Nodes */}
                        {nodes.map((node) => {
                            // Style Logic (Matches previous aesthetic)
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
                                    x={node.x - (node.type === 'root' ? 64 : node.type === 'concept' ? 60 : 80)} // Adjusted center offset
                                    y={node.y - (node.type === 'root' ? 64 : node.type === 'concept' ? 20 : 30)}
                                    width={node.type === 'root' ? 128 : 200}
                                    height={node.type === 'root' ? 128 : 100}
                                    className="pointer-events-auto overflow-visible"
                                >
                                    <motion.div
                                        layout
                                        initial={false}
                                        animate={{ x: 0, y: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        className="flex items-center justify-center h-full w-full p-2"
                                    >
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
                                    </motion.div>
                                </foreignObject>
                            );
                        })}
                    </svg>
                </motion.div>
            </div>
        </div>
    );
}

