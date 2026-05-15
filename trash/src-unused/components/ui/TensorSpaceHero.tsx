import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../lib/theme';

export default function TensorSpaceHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isLight } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. 씬, 카메라, 렌더러 설정
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(isLight ? 0xffffff : 0x020203, isLight ? 0.018 : 0.03);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 25);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // 2. 기하학 및 매테리얼 설정 (와이어프레임 매니폴드)
        // 복잡한 구조를 위해 구(Sphere)를 기본으로 사용하고 나중에 정점을 변형합니다.
        const segments = 128; 
        const geometry = new THREE.SphereGeometry(12, segments, segments);
        
        // 원본 정점 위치를 저장하여 매 프레임 변형 계산의 기준으로 사용
        const basePositions = geometry.attributes.position.clone();

        // 격자의 대각선(삼각형)을 제거하고 사각형(Quad) 형태만 남기기 위한 커스텀 인덱스 생성
        const indices = [];
        for (let y = 0; y <= segments; y++) {
            for (let x = 0; x <= segments; x++) {
                const i = y * (segments + 1) + x;
                if (x < segments) indices.push(i, i + 1); // 가로선 연결
                if (y < segments) indices.push(i, i + segments + 1); // 세로선 연결
            }
        }
        geometry.setIndex(indices);

        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: isLight ? 0x334155 : 0x556677,
            transparent: true,
            opacity: isLight ? 0.18 : 0.3,
            blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending
        });

        // Mesh 대신 LineSegments를 사용하여 대각선이 없는 깔끔한 격자 렌더링
        const manifold = new THREE.LineSegments(geometry, wireframeMaterial);
        scene.add(manifold);

        // 3. 텐서 필드 설정 (표면을 따라 흐르는 화살표/벡터)
        const vectorCount = geometry.attributes.position.count;
        
        // 화살표를 훨씬 얇고 날렵하게 수정 (Stem 두께 감소, 길이 조정)
        const stemGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.7, 4);
        stemGeo.translate(0, 0.35, 0); // 줄기 밑동을 원점에 위치
        stemGeo.rotateX(Math.PI / 2); // Z축을 향하도록 회전
        
        // 머리(Head) 부분도 얇은 줄기에 맞춰 작고 날렵하게 수정
        const headGeo = new THREE.ConeGeometry(0.04, 0.15, 4);
        headGeo.translate(0, 0.7 + 0.075, 0); // 줄기 끝에 머리 위치
        headGeo.rotateX(Math.PI / 2); 

        const arrowMat = new THREE.MeshBasicMaterial({
            color: isLight ? 0x0f172a : 0xffffff,
            transparent: true,
            opacity: isLight ? 0.2 : 0.4,
            depthWrite: false // 많은 수의 투명 객체가 겹칠 때 생기는 그래픽 깨짐 방지
        });

        // 두 개의 InstancedMesh를 결합하여 하나의 화살표처럼 렌더링
        const stemMesh = new THREE.InstancedMesh(stemGeo, arrowMat, vectorCount);
        const headMesh = new THREE.InstancedMesh(headGeo, arrowMat, vectorCount);
        scene.add(stemMesh);
        scene.add(headMesh);

        // 변환 계산을 위한 임시 객체들
        const dummy = new THREE.Object3D();
        const vertex = new THREE.Vector3();
        const target = new THREE.Vector3();

        let animationFrameId: number;

        // 4. 애니메이션 루프
        function animate() {
            animationFrameId = requestAnimationFrame(animate);

            const time = performance.now() * 0.0005; // 시간 변수 (애니메이션 속도 제어)
            const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

            // 모든 정점을 순회하며 형태 변형 및 벡터 필드 갱신
            for (let i = 0; i < vectorCount; i++) {
                vertex.fromBufferAttribute(basePositions, i);

                // 구면 좌표계 변환
                const r = vertex.length();
                const theta = Math.atan2(vertex.y, vertex.x);
                const phi = Math.acos(vertex.z / r);

                // Zesty Tensor Space 수학적 변형 (리만 구면 임베딩 느낌의 일그러짐)
                // 여러 주파수의 사인/코사인 파동을 겹쳐 복잡한 형태 생성
                const wave1 = Math.sin(theta * 5.0 + time) * Math.cos(phi * 3.0 - time) * 3.0;
                const wave2 = Math.cos(theta * 2.0 - time * 1.5) * Math.sin(phi * 4.0 + time) * 1.5;
                const newRadius = r + wave1 + wave2;

                // 새로운 위치 계산
                const nx = newRadius * Math.sin(phi) * Math.cos(theta);
                const ny = newRadius * Math.sin(phi) * Math.sin(theta);
                const nz = newRadius * Math.cos(phi);

                // 와이어프레임 기하학 업데이트
                positionAttribute.setXYZ(i, nx, ny, nz);

                // 텐서 필드 (화살표) 업데이트
                dummy.position.set(nx, ny, nz);

                // 단순 회전이 아닌, 난류(Turbulence)와 텐서 장의 특징을 살린 다이나믹한 벡터 계산
                const flowX = Math.sin(ny * 0.5 + time * 1.2) * 2.0 + Math.cos(theta * 3.0 - time);
                const flowY = Math.cos(nx * 0.5 - time * 0.8) * 2.0 + Math.sin(phi * 4.0 + time * 1.5);
                const flowZ = Math.sin(nx * 0.3 + time) * 1.5 - Math.cos(ny * 0.4 - time * 0.9);
                
                target.set(nx + flowX, ny + flowY, nz + flowZ);
                
                dummy.lookAt(target);
                
                // 모든 점에 벡터를 표시 (조건문 제거)
                const scale = 0.6 + Math.abs(Math.sin(theta * 8 + time)) * 0.6;
                dummy.scale.set(scale, scale, scale);
                
                dummy.updateMatrix();
                stemMesh.setMatrixAt(i, dummy.matrix);
                headMesh.setMatrixAt(i, dummy.matrix);
            }

            // 그래픽 카드에 데이터 갱신 알림
            positionAttribute.needsUpdate = true;
            stemMesh.instanceMatrix.needsUpdate = true;
            headMesh.instanceMatrix.needsUpdate = true;

            renderer.render(scene, camera);
        }

        // 5. 윈도우 리사이즈 대응
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        
        // 애니메이션 시작
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            
            // Cleanup resources
            geometry.dispose();
            wireframeMaterial.dispose();
            stemGeo.dispose();
            headGeo.dispose();
            arrowMat.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, [isLight]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 h-[100dvh] w-full pointer-events-none"
            style={{ background: isLight ? '#ffffff' : '#020203' }}
        />
    );
}
