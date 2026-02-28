import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { useNavigate } from 'react-router-dom';
import type { GraphModel } from '../../lib/graphModel';
import { applyTetrahedralConstraints3D, type PositionedNode3D } from '../../lib/graphLayouts';

interface Network3DViewProps {
    model: GraphModel;
}

// Map Fields to Distinct Colors
const colorMap: Record<string, string> = {
    'classical': '#60a5fa',         // blue-400
    'quantum': '#f472b6',           // pink-400
    'statistical': '#4ade80',       // green-400
    'electrodynamics': '#facc15',   // yellow-400
    'mathematical-physics': '#c084fc' // purple-400
};

export default function Network3DView({ model }: Network3DViewProps) {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const navigate = useNavigate();

    // Maintain hover state for selective rendering
    const [hoverNode, setHoverNode] = useState<PositionedNode3D | null>(null);

    // Filter out Mathematical Physics branches (strict condition for 3D as requested originally or keep it consistent)
    // Here we include 'mathematical-physics' strictly if it's naturally connected or if we just want it out, 
    // but the user's latest prompt implies we want 5 core nodes: physics(root) + 4 main fields.
    const constrainedModel = useMemo(() => {
        return applyTetrahedralConstraints3D(model);
    }, [model]);

    const { nodes, links } = constrainedModel;

    // Tuning the physical simulation upon mount
    useEffect(() => {
        const fg = fgRef.current;
        if (fg) {
            // Adjust D3 force settings for better aesthetics and stability
            fg.d3Force('link')?.distance((link: any) => {
                if (link.type === 'hierarchy') return 30;
                if (link.type === 'temporal') return 30;
                if (link.type === 'mentions') return 60;
                return 40;
            }).strength((link: any) => {
                // Weak temporal link forces so the starburst shape isn't compressed
                if (link.type === 'temporal') return 0.05;
                return 1;
            });
            fg.d3Force('charge')?.strength(-40); // Less repulsion for tighter clusters
        }
    }, [nodes, links]);

    const handleNodeHover = useCallback((node: any) => {
        // Apply pointer cursor directly on canvas, ForceGraph handles internally mostly but we trigger state
        setHoverNode(node || null);
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        if (node && node.slug) {
            navigate(`/topic/${node.slug}`);
        }
    }, [navigate]);

    return (
        <ForceGraph3D
            ref={fgRef}
            graphData={{ nodes, links }}
            nodeId="id"
            // Visual configuration
            backgroundColor="rgba(0,0,0,0)" // Transparent to match the rest of the dark theme
            showNavInfo={false}

            // Physics Properties
            d3AlphaDecay={0.05} // Faster decay for quicker settling
            d3VelocityDecay={0.4} // Higher friction to stop runaway nodes on hover

            // Node Renderer
            nodeThreeObject={(node: any) => {
                const n = node as PositionedNode3D;
                const isHovered = hoverNode?.id === n.id;

                let radius = 4;
                let color = '#9ca3af'; // muted-foreground default
                let showLabel = false;

                if (n.type === 'root') {
                    radius = 16;
                    color = '#ffffff'; // text-foreground
                    showLabel = true;
                } else if (n.type === 'field') {
                    radius = 12;
                    color = colorMap[n.id] || colorMap[(n.data as any)?.fieldId as string] || color;
                    showLabel = true;
                } else if (n.type === 'topic') {
                    radius = 6;
                    color = colorMap[(n.data as any)?.fieldId as string] || color;
                    // Show topic labels if hovering over it, or we could hide them
                    showLabel = isHovered;
                } else if (n.type === 'concept') {
                    radius = 3;
                    color = '#6b7280'; // muted
                    showLabel = isHovered;
                }

                // If hovered, highlight styling without changing physical radius
                if (isHovered) {
                    // Just ensure label is shown and add a glow to the material
                    // We DO NOT change `radius` to prevent raycast glitching (runaway nodes)
                    showLabel = true;
                }

                const group = new THREE.Group();

                // 1. Sphere
                const geometry = new THREE.SphereGeometry(radius, 16, 16);
                const material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: true,
                    opacity: n.type === 'concept' && !isHovered ? 0.6 : 1,
                    emissive: isHovered ? color : '#000000',
                    emissiveIntensity: isHovered ? 0.4 : 0
                });
                const sphere = new THREE.Mesh(geometry, material);
                group.add(sphere);

                // 2. Label
                if (showLabel && n.label) {
                    const sprite = new SpriteText(n.label);
                    sprite.color = isHovered ? color : '#e5e7eb'; // Hover accent vs normal light gray
                    sprite.textHeight = n.type === 'root' ? 8 : (n.type === 'field' ? 6 : 4);

                    // font weighting
                    sprite.fontWeight = n.type === 'root' || n.type === 'field' ? 'bold' : 'normal';

                    // offset text safely below
                    sprite.position.y = -(radius + sprite.textHeight + 1);

                    if (isHovered) {
                        sprite.material.depthTest = false; // Render on top of everything
                        sprite.renderOrder = 999;
                    }

                    group.add(sprite);
                }

                return group;
            }}

            // Link Renderer
            linkDirectionalArrowLength={(link: any) => (link.type === 'mentions' || link.type === 'hierarchy' || link.type === 'temporal' ? 3.5 : 0)}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                return isHovered ? 4 : 0;
            }}
            linkDirectionalParticleWidth={2}
            linkColor={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                if (isHovered) return 'rgba(255,255,255,0.8)';
                return 'rgba(156, 163, 175, 0.2)'; // text-muted-foreground at 0.2
            }}
            linkWidth={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                return isHovered ? 1.5 : 0.5;
            }}

            // Interaction
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
        />
    );
}
