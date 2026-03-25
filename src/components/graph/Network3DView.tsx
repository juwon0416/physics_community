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
            fg.d3Force('charge')?.strength(-150); // High repulsion to keep chronological chains physically separated from each other
        }
    }, [nodes, links]);

    const handleNodeHover = useCallback((node: any, prevNode: any) => {
        // 1. Revert the previously hovered node natively
        if (prevNode && prevNode.__threeObj) {
            const group = prevNode.__threeObj as THREE.Group;
            const sphere = group.children[0] as THREE.Mesh;
            const sprite = group.children[1] as SpriteText;

            if (sphere && sphere.material instanceof THREE.MeshLambertMaterial) {
                sphere.material.emissiveIntensity = 0;
            }
            if (sprite) {
                sprite.color = '#e5e7eb';
                sprite.material.depthTest = true;
                sprite.renderOrder = 0;
                // Labels are now always visible, so no need to hide them on unhover
            }
        }

        // 2. Highlight the newly hovered node natively
        if (node && node.__threeObj) {
            const group = node.__threeObj as THREE.Group;
            const userData = group.userData;
            const sphere = group.children[0] as THREE.Mesh;
            const sprite = group.children[1] as SpriteText;

            if (sphere && sphere.material instanceof THREE.MeshLambertMaterial) {
                sphere.material.emissive.set(userData.baseColor);
                sphere.material.emissiveIntensity = 0.6;
            }
            if (sprite) {
                sprite.color = userData.baseColor;
                sprite.material.depthTest = false;
                sprite.renderOrder = 999;
                sprite.visible = true; // Ensure visibility
            }
        }

        // 3. Trigger React state update ONLY for Link rendering, ForceGraph handles links efficiently via databinding
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
            graphData={constrainedModel}
            nodeId="id"
            // Visual configuration
            backgroundColor="rgba(0,0,0,0)" // Transparent to match the rest of the dark theme
            showNavInfo={false}


            // Physics Properties
            d3AlphaDecay={0.05} // Faster decay for quicker settling
            d3VelocityDecay={0.4} // Higher friction to stop runaway nodes on hover

            // Node Renderer (Stabilized reference to halt infinite re-render geometry rebuild loops)
            nodeThreeObject={useCallback((node: any) => {
                const n = node as PositionedNode3D;

                let radius = 4;
                let color = '#9ca3af'; // muted-foreground default
                let showLabel = true; // ALL labels visible by default now

                if (n.type === 'root') {
                    radius = 16;
                    color = '#ffffff'; // text-foreground
                } else if (n.type === 'field') {
                    radius = 12;
                    color = colorMap[n.id] || colorMap[(n.data as any)?.fieldId as string] || color;
                } else if (n.type === 'topic') {
                    radius = 6;
                    color = colorMap[(n.data as any)?.fieldId as string] || color;
                } else if (n.type === 'concept') {
                    radius = 3;
                    color = '#6b7280'; // muted
                }

                const group = new THREE.Group();
                group.userData = { type: n.type, baseColor: color, baseRadius: radius };

                // 1. Sphere
                const geometry = new THREE.SphereGeometry(radius, 16, 16);
                const material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: true,
                    opacity: n.type === 'concept' ? 0.6 : 1,
                    emissive: '#000000',
                    emissiveIntensity: 0
                });
                const sphere = new THREE.Mesh(geometry, material);
                group.add(sphere);

                // 2. Label
                if (n.label) {
                    const sprite = new SpriteText(n.label);
                    sprite.color = '#e5e7eb';
                    sprite.textHeight = n.type === 'root' ? 8 : (n.type === 'field' ? 6 : 4);
                    sprite.fontWeight = n.type === 'root' || n.type === 'field' ? 'bold' : 'normal';
                    sprite.position.y = -(radius + sprite.textHeight + 1);
                    sprite.visible = showLabel;

                    // CRITICAL: Block SpriteText from receiving hover raycasts so it doesn't trigger jitter!
                    sprite.raycast = function () { };

                    group.add(sprite);
                }

                return group;
            }, [])}

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
                return 'rgba(156, 163, 175, 0.45)'; // text-muted-foreground with higher opacity for visibility
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
