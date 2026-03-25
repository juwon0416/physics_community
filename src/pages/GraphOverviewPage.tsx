import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RefreshCw, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui';
import type { GraphModel } from '../lib/graphModel';
import { fetchGraphModel, buildStaticGraphModel } from '../lib/graphModel';
import type { PositionedNode } from '../lib/graphLayouts';
import { layoutNetwork, getChronologicalEdges } from '../lib/graphLayouts';

const Network3DView = lazy(() => import('../components/graph/Network3DView'));

export function GraphOverviewPage() {
    const [searchParams] = useSearchParams();
    const initialField = searchParams.get('field') || 'all';
    const [activeFieldFilter, setActiveFieldFilter] = useState<string>(initialField);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [model, setModel] = useState<GraphModel | null>(null);
    const [, setNodes] = useState<PositionedNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredNetworkModel, setFilteredNetworkModel] = useState<GraphModel | null>(null);
    const networkCache = useRef<PositionedNode[] | null>(null);
    const [scale, setScale] = useState(1);
    const [viewX, setViewX] = useState(0);
    const [viewY, setViewY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setScale(1);
        setViewX(window.innerWidth / 2);
        setViewY(window.innerHeight / 2);

        const loadGraph = async () => {
            setIsLoading(true);
            try {
                const data = await fetchGraphModel();
                networkCache.current = null;
                setModel(data);
            } catch (e) {
                console.error("Failed to load graph from DB, falling back to static model:", e);
                setModel(buildStaticGraphModel());
            } finally {
                setIsLoading(false);
            }
        };
        loadGraph();
    }, []);

    useEffect(() => {
        if (!model) return;

        let activeNodes = model.nodes;
        const mentionsIds = new Set<string>();
        model.edges.forEach(e => {
            if (e.type === 'mentions') {
                mentionsIds.add(e.source);
                mentionsIds.add(e.target);
            }
        });

        const coreFieldNodeIds = new Set<string>();
        if (activeFieldFilter !== 'all') {
            coreFieldNodeIds.add(activeFieldFilter);
            model.nodes.forEach(n => {
                if (n.data?.fieldId === activeFieldFilter) {
                    coreFieldNodeIds.add(n.id);
                }
            });
        }

        const linkedToCoreIds = new Set<string>();
        if (activeFieldFilter !== 'all') {
            model.edges.forEach(e => {
                if (coreFieldNodeIds.has(e.source)) linkedToCoreIds.add(e.target);
                if (coreFieldNodeIds.has(e.target)) linkedToCoreIds.add(e.source);
            });
        }

        activeNodes = activeNodes.filter(n => {
            if (n.id === 'mathematical-physics') return false;

            if (activeFieldFilter !== 'all') {
                if (n.id === 'root') return false;
                if (coreFieldNodeIds.has(n.id)) return true;

                const isConcept = n.type === 'concept';
                const isMathPhysicsTopic = n.data?.fieldId === 'mathematical-physics';

                if ((isConcept || isMathPhysicsTopic) && linkedToCoreIds.has(n.id)) return true;
                return false;
            } else {
                if (n.data?.fieldId === 'mathematical-physics') {
                    return mentionsIds.has(n.id);
                }
                const connectedIds = new Set<string>();
                model.edges.forEach(e => {
                    connectedIds.add(e.source);
                    connectedIds.add(e.target);
                });
                if (n.type === 'concept') return connectedIds.has(n.id);
                return true;
            }
        });

        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        let activeEdges = model.edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
        activeEdges = getChronologicalEdges({ nodes: activeNodes, edges: activeEdges });

        if (networkCache.current && networkCache.current.length === activeNodes.length) {
            setNodes(networkCache.current);
        } else {
            const layout = layoutNetwork({ nodes: activeNodes, edges: activeEdges });
            networkCache.current = layout;
            setNodes(layout);
        }
        setFilteredNetworkModel({ nodes: activeNodes, edges: activeEdges });
    }, [activeFieldFilter, model]);

    const viewportRef = useRef({ x: viewX, y: viewY, scale });
    useEffect(() => { viewportRef.current = { x: viewX, y: viewY, scale }; }, [viewX, viewY, scale]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { x, y, scale } = viewportRef.current;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomFactor = Math.exp(-e.deltaY * 0.001);
            const newScale = Math.min(Math.max(scale * zoomFactor, 0.2), 3.0);

            const worldX = (mouseX - x) / scale;
            const worldY = (mouseY - y) / scale;

            setViewX(mouseX - worldX * newScale);
            setViewY(mouseY - worldY * newScale);
            setScale(newScale);
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

    const touchStateRef = useRef<{ lastPinchDist: number | null; lastTouchPos: { x: number; y: number } | null; }>({ lastPinchDist: null, lastTouchPos: null });

    const handleDragMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setViewX(prev => prev + e.movementX);
        setViewY(prev => prev + e.movementY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStateRef.current.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            setViewX(prev => prev + (currentX - touchStateRef.current.lastTouchPos!.x));
            setViewY(prev => prev + (currentY - touchStateRef.current.lastTouchPos!.y));
            touchStateRef.current.lastTouchPos = { x: currentX, y: currentY };
        } else if (e.touches.length === 2 && touchStateRef.current.lastPinchDist) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scaleRatio = dist / touchStateRef.current.lastPinchDist;

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = centerX - rect.left;
            const mouseY = centerY - rect.top;

            const worldX = (mouseX - viewX) / scale;
            const worldY = (mouseY - viewY) / scale;

            const newScale = Math.min(Math.max(scale * scaleRatio, 0.1), 3);
            setScale(newScale);
            setViewX(mouseX - worldX * newScale);
            setViewY(mouseY - worldY * newScale);
            touchStateRef.current.lastPinchDist = dist;
        }
    };

    const handleTouchEnd = () => {
        touchStateRef.current.lastTouchPos = null;
        touchStateRef.current.lastPinchDist = null;
    };

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

    const resetView = () => {
        setScale(1);
        setViewX(window.innerWidth / 2);
        setViewY(window.innerHeight / 2);
    };

    const chronologicalTopics = model?.nodes
        .filter(n => n.type === 'topic' && n.data?.fieldId === activeFieldFilter)
        .sort((a, b) => (Number(a.data?.year) || 0) - (Number(b.data?.year) || 0)) || [];

    return (
        <div
            ref={containerRef}
            className={`w-full h-[calc(100vh-64px)] relative overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} bg-transparent text-foreground touch-none`}
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
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                        <span className="text-sm text-muted-foreground font-serif">Loading Knowledge Graph...</span>
                    </div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: viewX, y: viewY, scale }}
                transition={{ type: "tween", duration: 0 }}
                style={{ transformOrigin: "0 0" }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="absolute inset-0 opacity-[0.1] pointer-events-none text-muted-foreground"
                    style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />
            </motion.div>

            <div className="fixed top-[80px] left-4 z-20 flex flex-col gap-2" onMouseDown={e => e.stopPropagation()}>
                <div className="glass p-1.5 rounded-lg flex items-center shadow-md pointer-events-auto w-fit max-w-[80vw] overflow-x-auto gap-1">
                    {[
                        { id: 'all', label: 'All Fields' },
                        { id: 'quantum', label: 'Quantum' },
                        { id: 'statistical', label: 'Statistical' },
                        { id: 'electrodynamics', label: 'E-Dynamics' },
                        { id: 'classical', label: 'Classical' }
                    ].map(f => (
                        <Button
                            key={f.id}
                            variant={activeFieldFilter === f.id ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFieldFilter(f.id)}
                            className={`rounded-md px-2 h-7 transition-all duration-300 text-[10px] sm:text-xs whitespace-nowrap ${activeFieldFilter === f.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'hover:bg-accent/30 text-muted-foreground'
                                }`}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="fixed top-[80px] right-4 z-20 flex flex-col gap-2" onMouseDown={e => e.stopPropagation()}>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => setScale(s => Math.min(s + 0.1, 3))}><ZoomIn className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}><ZoomOut className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="glass hover:bg-white/20" onClick={() => { resetView(); reloadGraph(); }}><RefreshCw className="w-4 h-4" /></Button>
            </div>

            {activeFieldFilter !== 'all' && chronologicalTopics.length > 0 && (
                <div className="fixed top-[115px] left-3 z-20 flex flex-col gap-1 w-32 sm:w-56 max-h-[calc(100vh-200px)] overflow-y-auto glass p-1.5 sm:p-3 rounded-lg shadow-md pointer-events-auto transition-all" onMouseDown={e => e.stopPropagation()}>
                    <h3 className="text-[7px] sm:text-[10px] font-semibold text-primary/80 uppercase tracking-widest mb-0.5 border-b border-primary/20 pb-0.5">Timeline</h3>
                    <div className="flex flex-col gap-0 border-l hover:border-primary/40 border-primary/20 ml-1 sm:ml-2 pl-1.5 sm:pl-3 py-0.5 transition-colors">
                        {chronologicalTopics.map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => setFocusedNodeId(topic.id)}
                                className="text-left py-1 sm:py-1.5 relative group outline-none"
                            >
                                <div className={`absolute -left-[7.5px] sm:-left-[17px] top-1/2 -translate-y-1/2 w-1 h-1 sm:w-2 sm:h-2 rounded-full transition-colors ${focusedNodeId === topic.id ? 'bg-primary shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-primary/30 group-hover:bg-primary/70'}`} />
                                <div className={`text-[8px] sm:text-xs leading-tight transition-colors ${focusedNodeId === topic.id ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary/90'}`}>
                                    {String(topic.label)}
                                </div>
                                {topic.data?.year ? (
                                    <div className="text-[7px] sm:text-[9px] text-muted-foreground/40 font-mono mt-0">{String(topic.data.year)}</div>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filteredNetworkModel && (
                <div className="absolute inset-0 z-10 w-full h-full pointer-events-auto">
                    <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                        <Network3DView model={filteredNetworkModel} focusedNodeId={focusedNodeId} />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
