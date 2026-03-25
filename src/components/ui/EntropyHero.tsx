import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// --- 설정 및 유틸리티 ---
const PARTICLE_COUNT = 35000; // 밀도를 대폭 높여 빽빽한 유체 형성
const TEXT_Z_PLANE = 0; // 글자가 형성될 Z 평면

type LabelConfig = {
  text: string;
  x: number;
  y: number;
  scale: number;
  hue: number;
  slug: string;
};

const getLabels = (width: number): LabelConfig[] => {
  const isMobile = width < 768;
  if (isMobile) {
    return [
      { text: "Quantum", x: 0, y: 120, scale: 40, hue: 195, slug: "quantum" },
      { text: "Statistical", x: 0, y: 50, scale: 35, hue: 285, slug: "statistical" },
      { text: "Dynamics", x: 0, y: -20, scale: 40, hue: 335, slug: "electrodynamics" },
      { text: "Classical", x: 0, y: -90, scale: 35, hue: 45, slug: "classical" },
      { text: "Math Physics", x: 0, y: -160, scale: 32, hue: 225, slug: "mathematical-physics" },
    ];
  }
  return [
    { text: "Quantum Mechanics", x: -280, y: 150, scale: 55, hue: 195, slug: "quantum" },
    { text: "Statistical Mechanics", x: 280, y: 80, scale: 48, hue: 285, slug: "statistical" },
    { text: "Electrodynamics", x: -250, y: -50, scale: 52, hue: 335, slug: "electrodynamics" },
    { text: "Classical Mechanics", x: 290, y: -130, scale: 50, hue: 45, slug: "classical" },
    { text: "Mathematical Physics", x: 0, y: -260, scale: 48, hue: 225, slug: "mathematical-physics" },
  ];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function EntropyHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entropy, setEntropy] = useState(100);
  const navigate = useNavigate();

  // 시뮬레이션 상태 관리를 위한 Ref
  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    particles: THREE.Points | null;
    geometry: THREE.BufferGeometry | null;
    material: THREE.PointsMaterial | null;
    targetPoints: { x: number; y: number; z: number; hue: number }[];
    particleData: { velocity: THREE.Vector3; home: THREE.Vector3; noise: number; phase: number }[];
    mouse: { x: number; y: number };
    ordered: number;
    targetOrdered: number;
    frame: number;
    raf: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    particles: null,
    geometry: null,
    material: null,
    targetPoints: [],
    particleData: [],
    mouse: { x: 0, y: 0 },
    ordered: 0,
    targetOrdered: 0,
    frame: 0,
    raf: null
  });

  // 1. 텍스트 데이터로부터 목표 좌표 생성 (Offscreen Canvas 활용)
  const createTargetPoints = (width: number) => {
    const labels = getLabels(width);
    const points: { x: number; y: number; z: number; hue: number }[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return points;
    
    // 캔버스 크기를 2048x2048로 확장하여 하단 텍스트 잘림 방지
    canvas.width = 2048;
    canvas.height = 2048;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    labels.forEach((label) => {
      ctx.font = `bold ${label.scale * 2}px Inter, sans-serif`;
      // 중심점을 1024, 1024로 변경
      ctx.fillText(label.text, 1024 + label.x * 2, 1024 - label.y * 2);

      const imgData = ctx.getImageData(0, 0, 2048, 2048);
      const tempPoints: { x: number; y: number; z: number; hue: number }[] = [];
      const step = 6;

      for (let y = 0; y < 2048; y += step) {
        for (let x = 0; x < 2048; x += step) {
          if (imgData.data[(y * 2048 + x) * 4 + 3] > 128) {
            tempPoints.push({
              x: (x - 1024) / 2,
              y: (1024 - y) / 2,
              // 0% 엔트로피에서도 아주 미세한 Z축 분산을 주어 색상이 겹쳤을 때 더 풍부하게 표현되도록 함
              z: TEXT_Z_PLANE + (Math.random() - 0.5) * 5,
              hue: label.hue
            });
          }
        }
      }
      
      const countPerLabel = Math.floor(PARTICLE_COUNT / labels.length);
      for (let i = 0; i < countPerLabel; i++) {
        const p = tempPoints[Math.floor(Math.random() * tempPoints.length)] || { x: 0, y: 0, z: 0, hue: 0 };
        points.push(p);
      }
      ctx.clearRect(0, 0, 2048, 2048);
    });

    return points;
  };

  useEffect(() => {
    const initThree = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
      camera.position.z = 600;

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); // Disable antialias for better mobile perf
      renderer.setSize(width, height);
      // 모바일에서는 픽셀 비율을 1로 제한하여 메모리 부하 및 블랙아웃 방지
      const isMobile = width < 768;
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      const targetPoints = createTargetPoints(width);
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const colors = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);

      const particleData: { velocity: THREE.Vector3; home: THREE.Vector3; noise: number; phase: number }[] = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const target = targetPoints[i] || { x: 0, y: 0, z: 0, hue: 0 };
        const radius = 300 + Math.random() * 400;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);

        const x = radius * 1.8 * Math.sin(phi) * Math.cos(theta);
        const y = radius * 1.0 * Math.sin(phi) * Math.sin(theta);
        const z = radius * 0.8 * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const color = new THREE.Color(`hsl(${target.hue}, 80%, 60%)`);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 2 + 1;

        particleData.push({
          velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
          home: new THREE.Vector3(target.x, target.y, target.z),
          noise: Math.random(),
          phase: Math.random() * Math.PI * 2,
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 3));

      const material = new THREE.PointsMaterial({
        size: 6.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false, // Depth write false to prevent transparency artifacts
      });

      const pointsMesh = new THREE.Points(geometry, material);
      scene.add(pointsMesh);

      stateRef.current.scene = scene;
      stateRef.current.camera = camera;
      stateRef.current.renderer = renderer;
      stateRef.current.particles = pointsMesh;
      stateRef.current.geometry = geometry;
      stateRef.current.material = material;
      stateRef.current.targetPoints = targetPoints;
      stateRef.current.particleData = particleData;

      const animate = () => {
        const { scene, camera, renderer, geometry, particleData, mouse } = stateRef.current;
        if (!renderer || !scene || !camera || !geometry) return;

        // 보간 속도를 0.03에서 0.02로 낮추어 더 부드러운 상태 변화 유도
        stateRef.current.ordered = lerp(stateRef.current.ordered, stateRef.current.targetOrdered, 0.02);
        const ordered = stateRef.current.ordered;
        
        // 질서 회복의 임계점을 뒤로 늦추기 위해 5제곱 곡선 적용
        // 높은 엔트로피(초기)에서는 구심력이 거의 없다가, 낮은 엔트로피(후반)에서 매우 빠르게 질서가 형성됨.
        const lock = Math.pow(ordered, 5.0);
        // 난류는 질서가 완전히 잡히기 전까지 충분한 저항을 주도록 선형에 가깝게 유지
        const thermal = 1 - ordered;
        
        // 점성(Damping) 보간도 lock 곡선에 맞춰 더 늦게 활성화
        const currentDamping = lerp(0.95, 0.82, Math.pow(ordered, 2.0));
        
        stateRef.current.frame += 1;
        const time = stateRef.current.frame * 0.002;

        const positions = geometry.attributes.position.array as Float32Array;
        const sizes = geometry.attributes.size.array as Float32Array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const p = particleData[i];
          const idx = i * 3;

          const v1 = Math.sin(positions[idx+1] * 0.002 + time) * 0.6;
          const v2 = Math.cos(positions[idx+2] * 0.002 + time * 0.8) * 0.6;
          const v3 = Math.sin(positions[idx] * 0.002 + time * 1.2) * 0.6;

          p.velocity.x += v1 * thermal;
          p.velocity.y += v2 * thermal;
          p.velocity.z += v3 * thermal;

          p.velocity.x += (Math.random() - 0.5) * 0.8 * thermal;
          p.velocity.y += (Math.random() - 0.5) * 0.8 * thermal;
          p.velocity.z += (Math.random() - 0.5) * 0.8 * thermal;

          const ellipticalDist = Math.sqrt(
            Math.pow(positions[idx] / 1.8, 2) + 
            Math.pow(positions[idx+1] / 1.0, 2) + 
            Math.pow(positions[idx+2] / 0.8, 2)
          ) || 1;

          if (ellipticalDist > 700) {
            const pull = (ellipticalDist - 700) * 0.0002 * thermal;
            p.velocity.x -= (positions[idx] / ellipticalDist) * pull;
            p.velocity.y -= (positions[idx+1] / ellipticalDist) * pull;
            p.velocity.z -= (positions[idx+2] / ellipticalDist) * pull;
          }
          if (ellipticalDist < 250) {
            const push = (250 - ellipticalDist) * 0.0004 * thermal;
            p.velocity.x += (positions[idx] / ellipticalDist) * push;
            p.velocity.y += (positions[idx+1] / ellipticalDist) * push;
            p.velocity.z += (positions[idx+2] / ellipticalDist) * push;
          }

          // 구심력 계수를 질서의 5제곱에 비례하게 적용
          const homePull = lock * 0.045; 
          p.velocity.x += (p.home.x - positions[idx]) * homePull;
          p.velocity.y += (p.home.y - positions[idx+1]) * homePull;
          p.velocity.z += (p.home.z - positions[idx+2]) * homePull;

          const distToMouse = Math.sqrt(
            Math.pow(positions[idx] - mouse.x * 500, 2) + 
            Math.pow(positions[idx+1] - mouse.y * 300, 2)
          );
          if (distToMouse < 200) {
            const force = (1 - distToMouse / 200) * 2.5;
            p.velocity.x += (positions[idx] - mouse.x * 500) / distToMouse * force;
            p.velocity.y += (positions[idx+1] - mouse.y * 300) / distToMouse * force;
          }

          p.velocity.multiplyScalar(currentDamping);
          positions[idx] += p.velocity.x;
          positions[idx+1] += p.velocity.y;
          positions[idx+2] += p.velocity.z;

          sizes[i] = (2.0 + Math.abs(positions[idx+2]) / 150) * (1 - lock * 0.5) + (lock * 3.5);
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;

        camera.position.x += (mouse.x * 60 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 60 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // 질서가 회복될수록(0% 엔트로피) AdditiveBlending에 의한 화이트아웃 방지를 위해 opacity를 낮춤
        if (stateRef.current.material) {
          stateRef.current.material.opacity = lerp(0.85, 0.45, lock);
        }

        renderer.render(scene, camera);
        stateRef.current.raf = requestAnimationFrame(animate);
      };

      animate();
    };

    initThree();

    const handleResize = () => {
      const { camera, renderer } = stateRef.current;
      if (!camera || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      
      const { renderer, scene, geometry, material } = stateRef.current;
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (scene) {
        scene.children.forEach((child) => {
          if ((child as any).geometry) (child as any).geometry.dispose();
          if ((child as any).material) (child as any).material.dispose();
        });
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrolled = window.scrollY;
      const maxScroll = scrollRef.current.offsetHeight - window.innerHeight;
      const progress = clamp(scrolled / maxScroll, 0, 1);
      
      const easedProgress = easeInOutCubic(progress);
      setEntropy(Math.round((1 - easedProgress) * 100));
      stateRef.current.targetOrdered = easedProgress;
    };

    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = (e: MouseEvent) => {
      if (stateRef.current.ordered < 0.8) return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      const labels = getLabels(width);
      
      const mouseX = (e.clientX / width) * 2 - 1;
      const mouseY = -(e.clientY / height) * 2 + 1;
      
      // Raycasting 대신 2D 클릭 판정 (Three.js world coords mapping)
      // Camera fov 75, z 600 기준으로 대략적인 평면 좌표 변환
      const planeScale = Math.tan((75 * Math.PI) / 180 / 2) * 600 * 2;
      const worldX = mouseX * (planeScale / 2) * (width / height);
      const worldY = mouseY * (planeScale / 2);

      for (const label of labels) {
        const dx = worldX - label.x;
        const dy = worldY - label.y;
        const hitWidth = label.text.length * (label.scale * 0.6);
        const hitHeight = label.scale * 1.5;

        if (Math.abs(dx) < hitWidth / 2 && Math.abs(dy) < hitHeight / 2) {
          navigate(`/graph?field=${label.slug}`);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [navigate]);

  return (
    <div ref={scrollRef} className="relative min-h-[400vh] bg-[#020205] text-white selection:bg-purple-500/30 font-sans">
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />

      <div className="sticky top-0 h-screen w-full flex flex-col justify-between p-4 md:p-12 z-10 pointer-events-none">
        <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-8">
          <div className="w-[85%] sm:w-full md:max-w-2xl bg-black/20 backdrop-blur-xl p-3 md:p-6 rounded-xl md:rounded-3xl border border-white/10">
            <div className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-blue-400 mb-0.5 md:mb-2 font-bold">
              Thermodynamics of Information
            </div>
            <h1 className="text-lg md:text-5xl font-bold tracking-tight mb-1 md:mb-4 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent font-display">
              3D Kinetic Entropy Field
            </h1>
            <p className="hidden sm:block text-xs md:text-base text-white/50 leading-relaxed font-light">
              Scroll to observe the phase transition. In a high-entropy state, particles occupy 
              the full 3D volume. As entropy decreases, they condense into semantic structures.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-3 md:p-6 rounded-xl md:rounded-3xl border border-white/10 min-w-[100px] md:min-w-[160px] text-right self-end md:self-start">
            <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/40 mb-0.5 md:mb-1">Entropy</div>
            <div className="text-2xl md:text-6xl font-mono font-bold text-white tracking-tighter">
              {entropy}<span className="text-sm md:text-xl ml-0.5 text-white/30">%</span>
            </div>
            <div className="mt-1.5 md:mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${entropy}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 md:gap-4">
              <span className="px-2 md:px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">
                WebGL 3D
              </span>
              <span className="px-2 md:px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">
                Additive Blending
              </span>
            </div>
            <div className="text-[10px] md:text-xs text-white/30 font-light mt-1 md:mt-2">
              Move cursor to disturb the local 3D flow field
            </div>
          </div>

          <div className="group flex flex-col items-center gap-2 md:gap-4">
            <div className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-white/20 group-hover:text-white/50 transition-colors">
              Scroll to Organize
            </div>
            <div className="w-[1px] h-8 md:h-12 bg-gradient-to-b from-blue-500/50 to-transparent" />
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
