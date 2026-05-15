import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '../ui';
import type { Topic } from '../../data/storage';

interface Gallery3DProps {
    topics: Topic[];
    isAdmin?: boolean;
    onEdit?: (e: React.MouseEvent, topic: Topic) => void;
    onDelete?: (e: React.MouseEvent, id: string) => void;
}

export function Gallery3D({ topics, isAdmin, onEdit, onDelete }: Gallery3DProps) {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const trackerTicksRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);

    const [isDragging, setIsDragging] = useState(false);
    const [expandedTopic, setExpandedTopic] = useState<Topic | null>(null);

    // Lock body scroll when expanded
    useEffect(() => {
        if (expandedTopic) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [expandedTopic]);

    // Physics State Variables (Using Refs to avoid re-renders during animation loop)
    const physics = useRef({
        currentRotation: 0,
        targetRotation: 0,
        velocity: 0,
        startX: 0,
        lastX: 0,
        lastTime: 0,
        isDragging: false,
        dragDelta: 0, // to distinguish click vs drag
    });

    const totalItems = topics.length;
    const anglePerItem = 45; // Increased to prevent overlap
    const maxRotation = 0;
    const minRotation = -(totalItems - 1) * anglePerItem;

    const friction = 0.95;
    const lerpFactor = 0.1;
    const dragSensitivity = 0.15;
    const scrollSensitivity = 0.1;
    const parallaxFactor = 1.2;

    const getRadius = () => window.innerWidth < 768 ? 280 : 500;
    const radiusRef = useRef(getRadius());

    useEffect(() => {
        const handleResize = () => {
            radiusRef.current = getRadius();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getClientX = (e: React.TouchEvent | React.MouseEvent | MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            return e.touches[0].clientX;
        }
        return (e as React.MouseEvent | MouseEvent).clientX;
    };

    const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (expandedTopic) return;

        // Prevent default only if it's an image or card itself to avoid breaking scroll on other elements if they existed,
        // but here the whole container is the drag area.
        if ((e.target as HTMLElement).tagName === 'IMG' || (e.target as HTMLElement).closest('.gallery-card')) {
             if(e.cancelable) e.preventDefault();
        }

        setIsDragging(true);
        physics.current.isDragging = true;
        physics.current.startX = getClientX(e);
        physics.current.lastX = physics.current.startX;
        physics.current.velocity = 0;
        physics.current.lastTime = performance.now();
        physics.current.dragDelta = 0;
    };

    const handleDragMove = (e: React.TouchEvent | React.MouseEvent | MouseEvent | TouchEvent) => {
        if (!physics.current.isDragging || expandedTopic) return;
        if (e.cancelable) e.preventDefault();

        const currentX = getClientX(e);
        const deltaX = currentX - physics.current.lastX;

        physics.current.dragDelta += Math.abs(deltaX);
        physics.current.targetRotation -= deltaX * dragSensitivity;

        const currentTime = performance.now();
        const deltaTime = currentTime - physics.current.lastTime;

        if (deltaTime > 0) {
            physics.current.velocity = -deltaX * (16 / deltaTime) * dragSensitivity;
        }

        physics.current.lastX = currentX;
        physics.current.lastTime = currentTime;
    };

    const handleDragEnd = () => {
        if(expandedTopic) return;
        setIsDragging(false);
        physics.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
        if (expandedTopic) return;
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        physics.current.targetRotation -= delta * scrollSensitivity;
    };

    const handleCardClick = (e: React.MouseEvent, topic: Topic) => {
        if (physics.current.dragDelta > 5) {
            // It was a drag, not a click
            e.preventDefault();
            return;
        }
        setExpandedTopic(topic);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Attach non-passive wheel listener
        container.addEventListener('wheel', handleWheel, { passive: false });

        // Document level mouse/touch up to catch drags outside container
        document.addEventListener('mousemove', handleDragMove, { passive: false });
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('mouseleave', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);

        return () => {
             container.removeEventListener('wheel', handleWheel);
             document.removeEventListener('mousemove', handleDragMove);
             document.removeEventListener('mouseup', handleDragEnd);
             document.removeEventListener('mouseleave', handleDragEnd);
             document.removeEventListener('touchmove', handleDragMove);
             document.removeEventListener('touchend', handleDragEnd);
        };
    }, [expandedTopic]);

    // Animation Loop
    useEffect(() => {
        const renderLoop = () => {
             if (expandedTopic) {
                  requestRef.current = requestAnimationFrame(renderLoop);
                  return; // Pause physics while expanded
             }

            const p = physics.current;

            if (!p.isDragging) {
                p.targetRotation += p.velocity;
                p.velocity *= friction;
            }

            // Bounce effect
            if (p.targetRotation > maxRotation) {
                p.targetRotation -= (p.targetRotation - maxRotation) * 0.15;
                if (!p.isDragging) p.velocity *= 0.8;
            } else if (p.targetRotation < minRotation) {
                p.targetRotation -= (p.targetRotation - minRotation) * 0.15;
                if (!p.isDragging) p.velocity *= 0.8;
            }

            p.currentRotation += (p.targetRotation - p.currentRotation) * lerpFactor;

            // Update Tracker
            if (trackerTicksRef.current) {
                const trackerShift = (p.currentRotation * 5) % 150;
                trackerTicksRef.current.style.transform = `translateX(${-trackerShift}px)`;
            }

            // Update Cards
            if (carouselRef.current) {
                const cards = carouselRef.current.getElementsByClassName('gallery-card');
                const images = carouselRef.current.getElementsByClassName('gallery-card-img');

                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i] as HTMLElement;
                    const img = images[i] as HTMLElement;

                    const baseAngle = i * anglePerItem;
                    const absoluteAngle = baseAngle + p.currentRotation;

                    card.style.transform = `translate(-50%, -50%) rotateY(${absoluteAngle}deg) translateZ(${radiusRef.current}px)`;

                    // Visible Range check
                    if (Math.abs(absoluteAngle) < 90) {
                        card.style.visibility = 'visible';
                        const zDistance = Math.cos(absoluteAngle * Math.PI / 180);
                        card.style.opacity = (0.3 + (zDistance * 0.7)).toString(); // slightly brighter min opacity
                    } else {
                        card.style.visibility = 'hidden';
                    }

                    if (img) {
                        const translateX = absoluteAngle * parallaxFactor;
                        img.style.transform = `translateX(${translateX}px)`;
                    }
                }
            }

            requestRef.current = requestAnimationFrame(renderLoop);
        };

        requestRef.current = requestAnimationFrame(renderLoop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [topics.length, expandedTopic]);


    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden bg-background text-foreground select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${expandedTopic ? 'pointer-events-none' : ''}`}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
        >
            {/* Tracker UI */}
            <div
                 className="absolute top-16 left-1/2 -translate-x-1/2 w-[200px] h-[20px] overflow-hidden z-10 opacity-50"
                 style={{ maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' }}
            >
                <div ref={trackerTicksRef} className="flex items-center h-full will-change-transform">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <div
                             key={i}
                             className={`w-[1px] bg-foreground mr-[15px] shrink-0 transition-all duration-300 ${i % 5 === 0 ? 'h-[15px] opacity-100' : 'h-[8px] opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* 3D Scene */}
            <div className="relative w-full h-full" style={{ perspective: '1200px' }}>
                {/* Adjusting top margin to visually match design. Subtracted space for tracker. */}
                <div ref={carouselRef} className="absolute w-full h-full top-[10%] sm:top-0" style={{ transformStyle: 'preserve-3d' }}>
                    {topics.map((topic) => (
                        <div
                            key={topic.id}
                            className="gallery-card absolute top-1/2 left-1/2 w-[140px] h-[220px] sm:w-[200px] sm:h-[320px] xl:w-[280px] xl:h-[440px] bg-card overflow-hidden transition-[filter] duration-300 ease-out origin-center will-change-transform pointer-events-auto"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                filter: isDragging ? 'none' : undefined,
                            }}
                            onClick={(e) => handleCardClick(e, topic)}
                            onMouseEnter={(e) => {
                                 if(!isDragging) {
                                      e.currentTarget.style.filter = 'brightness(1.3) drop-shadow(0 0 10px rgba(255,255,255,0.2))';
                                 }
                            }}
                            onMouseLeave={(e) => {
                                 e.currentTarget.style.filter = 'none';
                            }}
                        >
                            <div className="relative w-full h-full overflow-hidden rounded-xl border border-white/10 group">
                                {topic.image_url ? (
                                    <img
                                        src={topic.image_url}
                                        alt={topic.title}
                                        className="gallery-card-img absolute top-0 -left-[20%] w-[140%] h-full object-cover will-change-transform pointer-events-none filter grayscale-[40%] contrast-110 group-hover:grayscale-0 transition-[filter] duration-500"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="gallery-card-img absolute top-0 -left-[20%] w-[140%] h-full flex flex-col items-center justify-center bg-muted/20 pointer-events-none">
                                          <span className="text-4xl sm:text-6xl font-serif text-muted-foreground/30 px-4 text-center">{topic.year}</span>
                                    </div>
                                )}
                                
                                {/* Label Overlay */}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                         <span className="text-xs font-mono text-primary/80">{topic.year}</span>
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <h3 className="text-sm sm:text-base font-bold font-display leading-tight text-white line-clamp-2">{topic.title}</h3>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="icon" className="h-6 w-6 bg-background/50 border-white/20" onClick={(e) => { e.stopPropagation(); onEdit?.(e, topic); }}><span className="text-xs">✎</span></Button>
                                            <Button variant="outline" size="icon" className="h-6 w-6 text-destructive bg-background/50 border-white/20" onClick={(e) => { e.stopPropagation(); onDelete?.(e, topic.id); }}><span className="text-xs">✕</span></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fullscreen Expanded Overlay */}
            {expandedTopic && (
                <div className="fixed inset-0 z-[100] w-screen h-[100dvh] flex items-center justify-center bg-background/95 backdrop-blur-3xl pointer-events-auto animate-in fade-in zoom-in-95 duration-500">
                    <div className="absolute top-6 right-6 z-50">
                        <Button variant="ghost" size="icon" onClick={() => setExpandedTopic(null)} className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="w-full h-full max-w-[100vw] mx-auto flex flex-col md:flex-row shadow-2xl overflow-hidden relative">
                         {/* Optional Background Blur of same image */}
                         {expandedTopic.image_url && (
                             <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                                  <img src={expandedTopic.image_url} className="w-full h-full object-cover blur-3xl scale-110" alt=""/>
                             </div>
                         )}

                        {/* Image Side */}
                        <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-muted/10 relative z-10 flex items-center justify-center overflow-hidden">
                             {expandedTopic.image_url ? (
                                <img
                                    src={expandedTopic.image_url}
                                    alt={expandedTopic.title}
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="text-muted-foreground/20 text-8xl md:text-9xl font-serif">
                                    {expandedTopic.year}
                                </div>
                             )}
                        </div>

                        {/* Content Side */}
                        <div className="w-full md:w-1/2 h-[60vh] md:h-full p-8 md:p-16 flex flex-col justify-center bg-background/90 z-10 overflow-y-auto">
                            <span className="text-primary font-mono text-sm md:text-xl md:tracking-widest mb-4 opacity-80">{expandedTopic.year}</span>
                            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight tracking-tight drop-shadow-sm">{expandedTopic.title}</h2>
                            <p className="text-lg md:text-2xl text-muted-foreground font-serif leading-relaxed mb-12 font-light">
                                {expandedTopic.summary}
                            </p>
                            <div className="mt-auto md:mt-0 pt-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate(`/topic/${expandedTopic.slug}`)}
                                >
                                    Explore Topic <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Footer Decorative Text */}
            <div className="absolute bottom-6 left-6 text-[10px] tracking-widest uppercase font-semibold text-foreground/50 z-10 pointer-events-none hidden sm:block">
                TIMELINE<br/>ARCHIVE
            </div>
        </div>
    );
}
