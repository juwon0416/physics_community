import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { useNavigate } from 'react-router-dom';
import type { GraphModel } from '../../lib/graphModel';
import { applyTetrahedralConstraints3D, type PositionedNode3D } from '../../lib/graphLayouts';

interface Network3DViewProps {
    model: GraphModel;
    focusedNodeId?: string | null;
}

// Entropy Hero와 동일한 HSL 색상 체계 매핑
const colorMap: Record<string, string> = {
    'quantum': 'hsl(195, 80%, 60%)',           
    'statistical': 'hsl(285, 80%, 60%)',       
    'electrodynamics': 'hsl(335, 80%, 60%)',   
    'classical': 'hsl(45, 80%, 60%)',          
    'mathematical-physics': 'hsl(225, 80%, 60%)' 
};

// 유체 입자처럼 빛나는 텍스처 생성 유틸리티
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

const glowTexture = createGlowTexture();

export default function Network3DView({ model, focusedNodeId }: Network3DViewProps) {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const navigate = useNavigate();
    const [hoverNode, setHoverNode] = useState<PositionedNode3D | null>(null);

    const constrainedModel = useMemo(() => {
        return applyTetrahedralConstraints3D(model);
    }, [model]);

    const { nodes, links } = constrainedModel;

    useEffect(() => {
        const fg = fgRef.current;
        if (fg) {
            fg.d3Force('link')?.distance((link: any) => {
                if (link.type === 'hierarchy') return 45;
                if (link.type === 'temporal') return 35;
                if (link.type === 'mentions') return 70;
                return 50;
            }).strength((link: any) => {
                if (link.type === 'temporal') return 0.05;
                return 1;
            });
            fg.d3Force('charge')?.strength(-200);
        }
    }, [nodes, links]);

    useEffect(() => {
        if (focusedNodeId && fgRef.current) {
            const node = nodes.find(n => n.id === focusedNodeId);
            if (node && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
                const distance = 180;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                fgRef.current.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, 
                    node as any, 
                    2000  
                );
            }
        }
    }, [focusedNodeId, nodes]);

    const handleNodeHover = useCallback((node: any, prevNode: any) => {
        if (prevNode && prevNode.__threeObj) {
            const group = prevNode.__threeObj as THREE.Group;
            const sprite = group.children[0] as THREE.Sprite;
            const label = group.children[1] as SpriteText;
            
            // 원래 상태로 복구 (Tween 효과 대신 즉시 변경 - force-graph 내부 최적화)
            sprite.scale.set(group.userData.baseRadius * 2, group.userData.baseRadius * 2, 1);
            sprite.material.opacity = group.userData.type === 'concept' ? 0.4 : 0.8;
            
            if (label) {
                label.color = '#e5e7eb';
                label.material.opacity = 0.5;
            }
        }
        if (node && node.__threeObj) {
            const group = node.__threeObj as THREE.Group;
            const sprite = group.children[0] as THREE.Sprite;
            const label = group.children[1] as SpriteText;
            
            // 호버 시 강조: 크기 확대 및 불투명도 증가
            const scale = group.userData.baseRadius * 3.5;
            sprite.scale.set(scale, scale, 1);
            sprite.material.opacity = 1.0;
            
            if (label) {
                label.color = group.userData.baseColor;
                label.material.opacity = 1.0;
                label.visible = true; 
            }
        }
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
            backgroundColor="rgba(0,0,0,0)" 
            showNavInfo={false}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            nodeThreeObject={useCallback((node: any) => {
                const n = node as PositionedNode3D;
                let radius = 6;
                let colorStr = '#ffffff'; 
                
                if (n.type === 'root') { radius = 22; colorStr = '#ffffff'; }
                else if (n.type === 'field') { radius = 16; colorStr = colorMap[n.id] || colorMap[(n.data as any)?.fieldId as string] || '#ffffff'; }
                else if (n.type === 'topic') { radius = 10; colorStr = colorMap[(n.data as any)?.fieldId as string] || '#ffffff'; }
                else if (n.type === 'concept') { radius = 5; colorStr = '#9ca3af'; }

                const color = new THREE.Color(colorStr);
                const group = new THREE.Group();
                group.userData = { type: n.type, baseColor: colorStr, baseRadius: radius };
                
                // WebGL Sprite를 활용한 "유체 입자" 글로우 효과 구현
                const material = new THREE.SpriteMaterial({
                    map: glowTexture,
                    color: color,
                    transparent: true,
                    opacity: n.type === 'concept' ? 0.4 : 0.8,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                
                const sprite = new THREE.Sprite(material);
                sprite.scale.set(radius * 2, radius * 2, 1);
                group.add(sprite);

                if (n.label) {
                    const labelSprite = new SpriteText(n.label);
                    labelSprite.color = '#e5e7eb';
                    labelSprite.textHeight = n.type === 'root' ? 10 : (n.type === 'field' ? 8 : 5);
                    labelSprite.fontWeight = 'bold';
                    labelSprite.position.y = -(radius + labelSprite.textHeight + 2);
                    labelSprite.material.transparent = true;
                    labelSprite.material.opacity = 0.5;
                    labelSprite.raycast = () => {};
                    group.add(labelSprite);
                }
                return group;
            }, [])}
            linkDirectionalParticles={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                const isFocused = focusedNodeId && (link.source.id === focusedNodeId || link.target.id === focusedNodeId);
                return (isHovered || isFocused) ? 6 : 0;
            }}
            linkDirectionalParticleWidth={3}
            linkColor={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                const isFocused = focusedNodeId && (link.source.id === focusedNodeId || link.target.id === focusedNodeId);
                if (isHovered || isFocused) return 'rgba(255,255,255,0.8)';
                return 'rgba(255, 255, 255, 0.08)'; 
            }}
            linkWidth={(link: any) => {
                const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
                const isFocused = focusedNodeId && (link.source.id === focusedNodeId || link.target.id === focusedNodeId);
                return (isHovered || isFocused) ? 2.0 : 0.8;
            }}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
        />
    );
}
