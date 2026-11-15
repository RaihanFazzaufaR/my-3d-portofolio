import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS, type PlanetData, type MoonData } from '../data/portfolioData';
import { playHoverSound, playSelectSound, playSunSound, playCloseSound } from '../utils/audio';
import { getPlanetTextures, getSunTexture } from '../utils/planetTextures';

type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;

interface PlanetMoonsProps {
  moons: MoonData[];
  simulationSpeed: number;
}

const PlanetMoons = memo(function PlanetMoons({ moons, simulationSpeed }: PlanetMoonsProps) {
  const moonRefs = useRef<(THREE.Mesh | null)[]>([]);
  const anglesRef = useRef<number[]>(moons.map((_, i) => i * 1.8));

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    for (let i = 0; i < moons.length; i++) {
      const mesh = moonRefs.current[i];
      const moon = moons[i];
      if (mesh && moon) {
        anglesRef.current[i] += safeDelta * moon.speed * (simulationSpeed || 1);
        const a = anglesRef.current[i];
        // Move moon directly in the inclined group's local X-Z plane
        const x = Math.cos(a) * moon.distance;
        const z = Math.sin(a) * moon.distance;
        mesh.position.set(x, 0, z);
        mesh.rotation.y += safeDelta * 0.6;
      }
    }
  });

  return (
    <group>
      {moons.map((moon, i) => (
        <group key={moon.name} rotation={[moon.inclination || 0, 0, (moon.inclination || 0) * 0.35]}>
          {/* Faint Orbit Ring for Moon - sharing exact local plane and radius */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[moon.distance - 0.02, moon.distance + 0.02, 64]} />
            <meshBasicMaterial
              color={moon.color || '#94a3b8'}
              opacity={0.16}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Moon Celestial Body - rides dead-center on the orbit ring */}
          <mesh
            ref={(el) => {
              moonRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[moon.size, 16, 16]} />
            <meshStandardMaterial
              color={moon.color || '#cbd5e1'}
              emissive={moon.color || '#94a3b8'}
              emissiveIntensity={0.2}
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
});

interface PlanetProps {
  planet: PlanetData;
  isSelected: boolean;
  simulationSpeed: number;
  onSelect: (planet: PlanetData) => void;
  onHover?: (planet: PlanetData | null) => void;
  onRegisterGroup?: (id: string, group: THREE.Group | null) => void;
}

const Planet = memo(function Planet({ planet, isSelected, simulationSpeed, onSelect, onHover, onRegisterGroup }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setIsHovered] = useState(false);

  // Register group ref with the camera controller
  useEffect(() => {
    const currentGroup = groupRef.current;
    if (currentGroup) {
      onRegisterGroup?.(planet.id, currentGroup);
    }
    return () => {
      onRegisterGroup?.(planet.id, null);
    };
  }, [planet.id, onRegisterGroup]);

  // Procedural canvas texture & bump map
  const textures = useMemo(() => getPlanetTextures(planet.id), [planet.id]);

  // Deterministic starting angle based on distance
  const angleRef = useRef<number>((planet.distance * 2.5) % (Math.PI * 2));

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);

    // Planets always orbit along their path if speed > 0, even while selected
    if (simulationSpeed > 0) {
      angleRef.current += safeDelta * planet.speed * simulationSpeed;
    }

    const x = Math.cos(angleRef.current) * planet.distance;
    const z = Math.sin(angleRef.current) * planet.distance;

    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += safeDelta * 0.45 * (simulationSpeed || 1);
      // Smooth scale up on hover or when selected without vector allocations
      const targetScale = isSelected ? 1.25 : isHovered ? 1.15 : 1.0;
      const s = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, safeDelta * 8);
      meshRef.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    playSelectSound();
    onSelect(planet);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setIsHovered(true);
    playHoverSound();
    onHover?.(planet);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    setIsHovered(false);
    onHover?.(null);
  };

  return (
    <>
      {/* Orbit Ring with subtle glowing path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.distance - 0.04, planet.distance + 0.04, 128]} />
        <meshBasicMaterial
          color={isSelected ? planet.color : '#ffffff'}
          opacity={isSelected ? 0.45 : 0.12}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting Planet Group */}
      <group ref={groupRef}>
        {/* Planet Main Sphere with Realistic Procedural Surface & Bump Maps */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[planet.size, 64, 64]} />
          <meshStandardMaterial
            map={textures.map}
            bumpMap={textures.bumpMap}
            bumpScale={0.035}
            roughness={0.65}
            metalness={0.1}
            emissive={textures.color}
            emissiveIntensity={isSelected ? 0.35 : isHovered ? 0.2 : 0.04}
          />
        </mesh>

        {/* Atmosphere Glow Aura Outer Shell */}
        <mesh scale={1.08}>
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshBasicMaterial
            color={textures.atmosphereColor}
            transparent
            opacity={isSelected ? 0.32 : isHovered ? 0.22 : 0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Planetary Ring (e.g. Saturn-like for Lab planet) */}
        {planet.hasRing && (
          <mesh rotation={[Math.PI / 3, Math.PI / 8, 0]}>
            <ringGeometry args={[planet.size * 1.35, planet.size * 2.3, 64]} />
            <meshStandardMaterial
              color={textures.atmosphereColor}
              emissive={textures.atmosphereColor}
              emissiveIntensity={0.25}
              opacity={0.7}
              transparent
              side={THREE.DoubleSide}
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
        )}

        {/* Multi-Moon System (Orbiting strictly outside planet radius and outside ring radius) */}
        {planet.moons && planet.moons.length > 0 && (
          <PlanetMoons moons={planet.moons} simulationSpeed={simulationSpeed} />
        )}

        {/* Sci-Fi Target Identification HUD (Visible when clicked OR hovered) */}
        {(isSelected || isHovered) && (
          <Html
            position={[0, planet.size + 0.35, 0]}
            center
            className="pointer-events-none select-none z-30"
          >
            {/* Identification Telemetry HUD Card (On top when hovering; top-left when clicked) */}
            <div
              className="w-[220px] p-3 rounded-2xl border text-left transform-gpu pointer-events-none hud-layer transition-transform duration-300 ease-out"
              style={{
                backgroundColor: 'rgba(5, 8, 22, 0.95)',
                borderColor: `${planet.color}99`,
                boxShadow: `0 4px 20px ${planet.color}30`,
                transform: isSelected ? 'translate(-75%, -70%)' : 'translate(0, -60%)',
              }}
            >
              {/* Sector Callout & Target Lock Status */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                <span
                  className="text-[9px] font-mono tracking-widest uppercase font-bold flex items-center gap-1.5"
                  style={{ color: planet.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: planet.color }} />
                  {isSelected ? 'TARGET LOCKED' : 'TARGET ACQUIRED'}
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">
                  {isSelected ? 'LOCKED' : 'TRACKING'}
                </span>
              </div>

              {/* Planet Name in Bold Orbitron */}
              <h3 className="text-sm font-bold uppercase tracking-wider font-scifi text-white leading-tight">
                {planet.name}
              </h3>

              {/* Sector Subtitle */}
              <p className="text-[10px] text-slate-300 font-mono line-clamp-1 mt-0.5">
                {planet.subtitle}
              </p>

              {/* Telemetry Metrics Grid */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>ORBIT: <span className="text-cyan-400 font-semibold">{planet.distance.toFixed(1)} AU</span></span>
                <span>VEL: <span className="text-amber-400 font-semibold">{planet.speed.toFixed(2)} AU/s</span></span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </>
  );
});

// Pre-computed static asteroid belt data generated once at module load
const ASTEROID_COUNT = 400;
const ASTEROID_POSITIONS = new Float32Array(ASTEROID_COUNT * 3);
const ASTEROID_COLORS = new Float32Array(ASTEROID_COUNT * 3);

for (let i = 0; i < ASTEROID_COUNT; i++) {
  const radius = 21.0 + (Math.sin(i * 12.9898) * 0.9);
  const angle = (i / ASTEROID_COUNT) * Math.PI * 2 + Math.cos(i * 4.1415) * 0.1;
  const y = Math.sin(i * 78.233) * 0.3;

  ASTEROID_POSITIONS[i * 3] = Math.cos(angle) * radius;
  ASTEROID_POSITIONS[i * 3 + 1] = y;
  ASTEROID_POSITIONS[i * 3 + 2] = Math.sin(angle) * radius;

  ASTEROID_COLORS[i * 3] = 0.65;
  ASTEROID_COLORS[i * 3 + 1] = 0.7;
  ASTEROID_COLORS[i * 3 + 2] = 0.8;
}

// Asteroid Belt between inner and outer solar system
const AsteroidBelt = memo(function AsteroidBelt() {
  const pointsRef = useRef<THREE.Points>(null!);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[ASTEROID_POSITIONS, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[ASTEROID_COLORS, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
});

// Soft circular glow sprite for rendering ethereal stars and nebula clouds without harsh square pixels
let cachedParticleTexture: THREE.CanvasTexture | null = null;
function getParticleTexture(): THREE.CanvasTexture {
  if (cachedParticleTexture) return cachedParticleTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  cachedParticleTexture = new THREE.CanvasTexture(canvas);
  return cachedParticleTexture;
}

// Pre-computed static Milky Way Galaxy Spiral & Deep Space Stardust (1400 particles)
const GALAXY_COUNT = 1400;
const GALAXY_POSITIONS = new Float32Array(GALAXY_COUNT * 3);
const GALAXY_COLORS = new Float32Array(GALAXY_COUNT * 3);

// Deterministic seed formula to ensure identical, stutter-free space architecture
for (let i = 0; i < GALAXY_COUNT; i++) {
  const seed = i * 13.371;
  const rand1 = Math.abs(Math.sin(seed * 1.1)) % 1;
  const rand2 = Math.abs(Math.sin(seed * 2.3)) % 1;
  const rand3 = Math.abs(Math.sin(seed * 3.7)) % 1;

  // Swirling spiral arms starting safely outside planetary zone (28 AU to 120 AU)
  const r = 28 + Math.pow(rand1, 1.5) * 90;
  const arm = i % 2;
  const spin = r * 0.085;
  const angle = arm * Math.PI + spin + (rand2 - 0.5) * 0.85;
  const spreadY = (rand3 - 0.5) * (6 + r * 0.12);
  const spreadR = (rand2 - 0.5) * 8;

  const x = Math.cos(angle) * (r + spreadR);
  const z = Math.sin(angle) * (r + spreadR);

  GALAXY_POSITIONS[i * 3] = x;
  GALAXY_POSITIONS[i * 3 + 1] = spreadY;
  GALAXY_POSITIONS[i * 3 + 2] = z;

  // Cosmic color spectrum: Cyan, Violet, Rose, Amber, Deep Azure, Silver
  const colorType = i % 6;
  if (colorType === 0) {
    // Electric Cyan
    GALAXY_COLORS[i * 3] = 0.22;
    GALAXY_COLORS[i * 3 + 1] = 0.82;
    GALAXY_COLORS[i * 3 + 2] = 1.0;
  } else if (colorType === 1) {
    // Galactic Violet
    GALAXY_COLORS[i * 3] = 0.65;
    GALAXY_COLORS[i * 3 + 1] = 0.35;
    GALAXY_COLORS[i * 3 + 2] = 0.98;
  } else if (colorType === 2) {
    // Deep Space Rose
    GALAXY_COLORS[i * 3] = 0.95;
    GALAXY_COLORS[i * 3 + 1] = 0.25;
    GALAXY_COLORS[i * 3 + 2] = 0.65;
  } else if (colorType === 3) {
    // Stellar Amber
    GALAXY_COLORS[i * 3] = 0.98;
    GALAXY_COLORS[i * 3 + 1] = 0.72;
    GALAXY_COLORS[i * 3 + 2] = 0.25;
  } else if (colorType === 4) {
    // Ultramarine Blue
    GALAXY_COLORS[i * 3] = 0.25;
    GALAXY_COLORS[i * 3 + 1] = 0.45;
    GALAXY_COLORS[i * 3 + 2] = 0.95;
  } else {
    // Radiant Silver White
    GALAXY_COLORS[i * 3] = 0.92;
    GALAXY_COLORS[i * 3 + 1] = 0.95;
    GALAXY_COLORS[i * 3 + 2] = 1.0;
  }
}

// Lightweight Cosmic Galaxy Environment (Renders featherweight 60 FPS deep space spiral in 1 draw call)
const CosmicGalaxy = memo(function CosmicGalaxy() {
  const galaxyRef = useRef<THREE.Group>(null!);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  useFrame((_, delta) => {
    if (galaxyRef.current) {
      // Majestic imperceptible drift across the cosmos
      galaxyRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <group ref={galaxyRef} rotation={[0.42, 0.25, 0.15]}>
      {/* Spiral Galaxy Arms & Dense Star Clusters (Zero fillrate overdraw) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[GALAXY_POSITIONS, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[GALAXY_COLORS, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.22}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

// Pre-computed static Distant Deep Space Galaxies (Distinct celestial clusters far outside the solar system)
const DISTANT_GALAXY_COUNT = 750;

interface GalaxySpec {
  name: string;
  posOffset: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  axis: 'x' | 'y' | 'z';
  seedOffset: number;
  radius: number;
  colorScheme: 'warm-violet-cyan' | 'electric-azure-emerald' | 'solar-amber-rose' | 'lavender-violet-sky';
}

const GALAXY_SPECS: GalaxySpec[] = [
  // 1. Andromeda Spiral (North-West Deep Space)
  {
    name: 'Andromeda',
    posOffset: [-170, 80, -180],
    rotation: [0.65, -0.45, 0.3],
    scale: 1.1,
    speed: 0.0028,
    axis: 'z',
    seedOffset: 7.713,
    radius: 36,
    colorScheme: 'warm-violet-cyan',
  },
  // 2. Whirlpool Spiral (North-East Deep Space)
  {
    name: 'Whirlpool',
    posOffset: [185, 90, -170],
    rotation: [-0.55, 0.65, -0.4],
    scale: 1.0,
    speed: -0.0032,
    axis: 'z',
    seedOffset: 19.341,
    radius: 32,
    colorScheme: 'electric-azure-emerald',
  },
  // 3. Sombrero Barred Galaxy (South-West Deep Space)
  {
    name: 'Sombrero',
    posOffset: [-190, -75, 160],
    rotation: [0.85, 0.35, -0.6],
    scale: 1.2,
    speed: 0.0025,
    axis: 'y',
    seedOffset: 31.879,
    radius: 38,
    colorScheme: 'solar-amber-rose',
  },
  // 4. Triangulum Pinwheel (South-East Deep Space)
  {
    name: 'Triangulum',
    posOffset: [175, -85, 185],
    rotation: [-0.75, -0.45, 0.5],
    scale: 0.95,
    speed: -0.003,
    axis: 'x',
    seedOffset: 43.215,
    radius: 30,
    colorScheme: 'lavender-violet-sky',
  },
];

interface PrecomputedGalaxy {
  positions: Float32Array;
  colors: Float32Array;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  axis: 'x' | 'y' | 'z';
}

const PRECOMPUTED_GALAXIES: PrecomputedGalaxy[] = GALAXY_SPECS.map((spec) => {
  const positions = new Float32Array(DISTANT_GALAXY_COUNT * 3);
  const colors = new Float32Array(DISTANT_GALAXY_COUNT * 3);

  for (let i = 0; i < DISTANT_GALAXY_COUNT; i++) {
    const seed = i * spec.seedOffset;
    const rand1 = Math.abs(Math.sin(seed * 1.3)) % 1;
    const rand2 = Math.abs(Math.sin(seed * 2.7)) % 1;
    const rand3 = Math.abs(Math.sin(seed * 4.1)) % 1;

    // Concentrated towards luminous core, spreading outward
    const r = Math.pow(rand1, 1.8) * spec.radius;
    const arm = i % 2;
    const spin = r * 0.18;
    const angle = arm * Math.PI + spin + (rand2 - 0.5) * 0.65;
    const spreadY = (rand3 - 0.5) * (1.5 + r * 0.08);
    const spreadR = (rand2 - 0.5) * (1.5 + r * 0.1);

    positions[i * 3] = Math.cos(angle) * (r + spreadR);
    positions[i * 3 + 1] = spreadY;
    positions[i * 3 + 2] = Math.sin(angle) * (r + spreadR);

    // Color gradient based on galaxy aesthetic
    if (spec.colorScheme === 'warm-violet-cyan') {
      if (r < 6.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.65;
      } else if (r < 18.0) {
        colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.45; colors[i * 3 + 2] = 0.95;
      } else {
        colors[i * 3] = 0.35; colors[i * 3 + 1] = 0.75; colors[i * 3 + 2] = 1.0;
      }
    } else if (spec.colorScheme === 'electric-azure-emerald') {
      if (r < 5.0) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.95;
      } else if (r < 16.0) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.7;
      } else {
        colors[i * 3] = 0.25; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 1.0;
      }
    } else if (spec.colorScheme === 'solar-amber-rose') {
      if (r < 6.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.3;
      } else if (r < 18.0) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 0.5;
      } else {
        colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.85;
      }
    } else {
      // lavender-violet-sky
      if (r < 5.0) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
      } else if (r < 15.0) {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.95;
      } else {
        colors[i * 3] = 0.38; colors[i * 3 + 1] = 0.65; colors[i * 3 + 2] = 0.98;
      }
    }
  }

  return {
    positions,
    colors,
    position: spec.posOffset,
    rotation: spec.rotation,
    scale: spec.scale,
    speed: spec.speed,
    axis: spec.axis,
  };
});

// Distant Deep Space Galaxies component
const DistantGalaxies = memo(function DistantGalaxies() {
  const groupRefs = useRef<THREE.Group[]>([]);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  useFrame((_, delta) => {
    PRECOMPUTED_GALAXIES.forEach((g, idx) => {
      const grp = groupRefs.current[idx];
      if (grp) {
        if (g.axis === 'z') grp.rotation.z += delta * g.speed;
        else if (g.axis === 'y') grp.rotation.y += delta * g.speed;
        else grp.rotation.x += delta * g.speed;
      }
    });
  });

  return (
    <>
      {PRECOMPUTED_GALAXIES.map((g, idx) => (
        <group key={idx} position={g.position} rotation={g.rotation} scale={g.scale}>
          <group ref={(el) => { if (el) groupRefs.current[idx] = el; }}>
            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[g.positions, 3]}
                />
                <bufferAttribute
                  attach="attributes-color"
                  args={[g.colors, 3]}
                />
              </bufferGeometry>
              <pointsMaterial
                size={0.36}
                map={particleTexture}
                vertexColors
                transparent
                opacity={0.88}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </points>
          </group>
        </group>
      ))}
    </>
  );
});

// Reusable static vectors to prevent runtime GC memory allocations during useFrame
const _worldPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _deltaMove = new THREE.Vector3();
const _vOrigin = new THREE.Vector3(0, 0, 0);
const _vSunCam = new THREE.Vector3(0, 9.5, 20.0);
const _vIntroCam = new THREE.Vector3(0, 40, 66);

// Smooth Camera Controller that tracks and follows moving planets with dynamic zoom restrictions
interface CameraControllerProps {
  selectedPlanet: PlanetData | null;
  isSunSelected: boolean;
  viewMode: '3d' | 'top';
  isIntro: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  planetGroupsRef: React.RefObject<Map<string, THREE.Group>>;
}

const CameraController = memo(function CameraController({
  selectedPlanet,
  isSunSelected,
  viewMode,
  isIntro,
  controlsRef,
  planetGroupsRef,
}: CameraControllerProps) {
  const prevPlanetPosRef = useRef<THREE.Vector3 | null>(null);
  const currentTargetKeyRef = useRef<string>('');
  const isTransitioningRef = useRef<boolean>(true);

  // Persistent 3D overview camera position (defaults to wide [0, 35, 58])
  const last3DCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 35, 58));
  // Persistent horizontal azimuth angle
  const currentAzimuthRef = useRef<number>(0);

  // Set up event listener on OrbitControls so user manual drag/scroll instantly stops automated transition
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      // User is actively interacting with camera (dragging or scrolling)
      isTransitioningRef.current = false;
    };

    controls.addEventListener('start', handleStart);
    return () => {
      controls.removeEventListener('start', handleStart);
    };
  }, [controlsRef]);

  // Priority 1 ensures CameraController runs AFTER Planet positions update, eliminating 1-frame lag
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const safeDelta = Math.min(delta, 0.05);

    // Track user's manual camera position and angle when not transitioning and not focused on a target
    if (!isTransitioningRef.current && !selectedPlanet && !isSunSelected && !isIntro) {
      if (viewMode === '3d') {
        last3DCameraPosRef.current.copy(state.camera.position);
        currentAzimuthRef.current = Math.atan2(state.camera.position.x, state.camera.position.z);
      } else if (viewMode === 'top') {
        const topAzimuth = Math.atan2(state.camera.position.x, state.camera.position.z);
        if (Math.hypot(state.camera.position.x, state.camera.position.z) > 0.05) {
          currentAzimuthRef.current = topAzimuth;
          // Synchronize 3D camera azimuth so returning to 3D preserves the rotation made in top view
          const horizR = Math.hypot(last3DCameraPosRef.current.x, last3DCameraPosRef.current.z) || 58.0;
          last3DCameraPosRef.current.x = Math.sin(topAzimuth) * horizR;
          last3DCameraPosRef.current.z = Math.cos(topAzimuth) * horizR;
        }
      }
    }

    // Build unique key for current mode
    const targetKey = isIntro
      ? 'intro'
      : viewMode === 'top'
      ? 'top'
      : selectedPlanet
      ? `planet_${selectedPlanet.id}`
      : isSunSelected
      ? 'sun'
      : 'overview';

    // When the mode changes, start transition and update zoom limits
    if (targetKey !== currentTargetKeyRef.current) {
      currentTargetKeyRef.current = targetKey;
      isTransitioningRef.current = true;
      prevPlanetPosRef.current = null;

      // Anti-clipping zoom boundaries: wider distance for all scenarios
      if (selectedPlanet) {
        controls.minDistance = Math.max(7.0, selectedPlanet.size * 4.8);
        controls.maxDistance = Math.max(38.0, selectedPlanet.size * 25.0);
        controls.maxPolarAngle = Math.PI; // Full freedom around planet
      } else if (isSunSelected) {
        controls.minDistance = 9.5; // Sun is 3.2 + corona 3.68 -> safe margin 9.5
        controls.maxDistance = 45.0;
        controls.maxPolarAngle = Math.PI / 2 + 0.15;
      } else if (viewMode === 'top') {
        controls.minDistance = 20.0;
        controls.maxDistance = 140.0;
        controls.maxPolarAngle = 0.05; // Lock to top-down view, but zoom freely along Y!
      } else {
        // Overview (3D) or Intro
        controls.minDistance = 12.0;
        controls.maxDistance = 125.0;
        controls.maxPolarAngle = Math.PI / 2 + 0.15;
      }
    }

    // 1. INTRO MODE: Elevated wide deep space shot
    if (isIntro) {
      if (isTransitioningRef.current) {
        controls.target.lerp(_vOrigin, safeDelta * 3);
        state.camera.position.lerp(_vIntroCam, safeDelta * 2.5);
        if (state.camera.position.distanceTo(_vIntroCam) < 0.3) {
          isTransitioningRef.current = false;
        }
      }
      controls.update();
      return;
    }

    // 2. RADAR / TOP-DOWN MODE (Preserves azimuth rotation angle so planets do not spin)
    if (viewMode === 'top') {
      controls.target.set(0, 0, 0);
      if (isTransitioningRef.current) {
        const a = currentAzimuthRef.current;
        const topRadius = 72.0;
        const phi = 0.02; // Small angle to avoid gimbal singularity in OrbitControls
        _camTarget.set(
          topRadius * Math.sin(phi) * Math.sin(a),
          topRadius * Math.cos(phi),
          topRadius * Math.sin(phi) * Math.cos(a)
        );
        state.camera.position.lerp(_camTarget, safeDelta * 4);
        if (state.camera.position.distanceTo(_camTarget) < 0.25) {
          isTransitioningRef.current = false;
        }
      }
      controls.update();
      return;
    }

    // 3. PLANET SELECTION / FOLLOW MODE
    if (selectedPlanet && planetGroupsRef.current) {
      const group = planetGroupsRef.current.get(selectedPlanet.id);
      if (group) {
        group.getWorldPosition(_worldPos);

        // Frame target slightly above planet center so label has plenty of top margin and never clips
        _camTarget.copy(_worldPos);
        _camTarget.y += selectedPlanet.size * 0.35;

        if (isTransitioningRef.current) {
          // Smooth glide toward the moving planet
          controls.target.lerp(_camTarget, safeDelta * 5);

          // Fly camera to a comfortable, wider viewing angle outside the planet (further distance)
          const offsetDist = Math.max(12.0, selectedPlanet.size * 8.5);
          _deltaMove.set(_worldPos.x + offsetDist * 0.52, _worldPos.y + offsetDist * 0.5, _worldPos.z + offsetDist * 0.85);
          state.camera.position.lerp(_deltaMove, safeDelta * 3.5);

          // Once close enough, lock on
          if (controls.target.distanceTo(_camTarget) < 0.25) {
            isTransitioningRef.current = false;
            prevPlanetPosRef.current = _camTarget.clone();
          }
        } else {
          // Locked on: follow the moving planet continuously without allocations
          if (prevPlanetPosRef.current) {
            _deltaMove.copy(_camTarget).sub(prevPlanetPosRef.current);
            controls.target.add(_deltaMove);
            state.camera.position.add(_deltaMove);
            prevPlanetPosRef.current.copy(_camTarget);
          } else {
            prevPlanetPosRef.current = _camTarget.clone();
          }
        }

        controls.update();
        return;
      }
    }

    // 4. SUN SELECTION MODE
    if (isSunSelected) {
      if (isTransitioningRef.current) {
        controls.target.lerp(_vOrigin, safeDelta * 4);
        state.camera.position.lerp(_vSunCam, safeDelta * 3);
        if (state.camera.position.distanceTo(_vSunCam) < 0.25) {
          isTransitioningRef.current = false;
        }
      }
      controls.update();
      return;
    }

    // 5. DEFAULT 3D OVERVIEW MODE (Returns to exact persisted 3D camera position and rotation)
    if (isTransitioningRef.current) {
      controls.target.lerp(_vOrigin, safeDelta * 4);
      _camTarget.copy(last3DCameraPosRef.current);
      state.camera.position.lerp(_camTarget, safeDelta * 3.5);
      if (
        controls.target.distanceTo(_vOrigin) < 0.2 &&
        state.camera.position.distanceTo(_camTarget) < 0.4
      ) {
        isTransitioningRef.current = false;
      }
    }
    controls.update();
  });

  return null;
});

interface SunProps {
  isSunSelected: boolean;
  onSelectSun: () => void;
}

const Sun = memo(function Sun({ isSunSelected, onSelectSun }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null!);
  const [sunHovered, setSunHovered] = useState(false);
  const sunTexture = useMemo(() => getSunTexture(), []);

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
    }
  });

  const handleSunClick = (e?: React.MouseEvent | ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    playSunSound();
    onSelectSun();
  };

  return (
    <group>
      <mesh
        ref={sunRef}
        onClick={handleSunClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
          setSunHovered(true);
          playHoverSound();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          setSunHovered(false);
        }}
      >
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshStandardMaterial
          map={sunTexture}
          emissive="#f59e0b"
          emissiveIntensity={isSunSelected ? 2.4 : sunHovered ? 2.0 : 1.6}
          color="#fef08a"
          roughness={0.9}
        />
      </mesh>

      {/* Corona Glow Shell with Additive Blending */}
      <mesh scale={1.15}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={isSunSelected ? 0.38 : sunHovered ? 0.28 : 0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sci-Fi Target Identification HUD for Sun Core (Visible when clicked OR hovered) */}
      {(isSunSelected || sunHovered) && (
        <Html
          position={[0, 3.4, 0]}
          center
          className="pointer-events-none select-none z-30"
        >
          {/* Core Identification Telemetry HUD Card (On top when hovering; top-left when clicked) */}
          <div
            className="w-[220px] p-3 rounded-2xl border text-left transform-gpu pointer-events-none hud-layer transition-transform duration-300 ease-out"
            style={{
              backgroundColor: 'rgba(5, 8, 22, 0.95)',
              borderColor: 'rgba(245, 158, 11, 0.7)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
              transform: isSunSelected ? 'translate(-75%, -70%)' : 'translate(0, -60%)',
            }}
          >
            {/* Core Status */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
              <span className="text-[9px] font-mono tracking-widest text-amber-400 uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                SYSTEM CORE
              </span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase">
                {isSunSelected ? 'LOCKED' : 'ONLINE'}
              </span>
            </div>

            {/* Core Name */}
            <h3 className="text-sm font-bold uppercase tracking-wider font-scifi text-white leading-tight">
              Raihan Fazzaufa
            </h3>

            {/* Core Subtitle */}
            <p className="text-[10px] text-slate-300 font-mono line-clamp-1 mt-0.5">
              Full-Stack & Systems Engineer
            </p>

            {/* Energy Specs */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>ENERGY: <span className="text-amber-400 font-semibold">100% MAX</span></span>
              <span>STATUS: <span className="text-emerald-400 font-semibold">OPTIMAL</span></span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});

export interface SolarSystemProps {
  selectedPlanet: PlanetData | null;
  isSunSelected: boolean;
  onSelectPlanet: (planet: PlanetData | null) => void;
  onSelectSun: () => void;
  simulationSpeed: number;
  viewMode: '3d' | 'top';
  isIntro?: boolean;
  onHoverPlanet?: (planet: PlanetData | null) => void;
}

const SolarSystem = memo(function SolarSystem({
  selectedPlanet,
  isSunSelected,
  onSelectPlanet,
  onSelectSun,
  simulationSpeed,
  viewMode,
  isIntro = false,
  onHoverPlanet,
}: SolarSystemProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleRegisterGroup = useCallback((id: string, group: THREE.Group | null) => {
    if (group) {
      planetGroupsRef.current.set(id, group);
    } else {
      planetGroupsRef.current.delete(id);
    }
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 35, 58], fov: 45, near: 0.1, far: 1200 }}
      gl={{ powerPreference: 'high-performance', antialias: true }}
      onPointerDown={(e) => {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMissed={(e: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
        dragStartRef.current = null;
        // If the pointer moved more than 6px, it was a camera drag to orbit/rotate, not a click!
        if (dist > 6) return;

        // Stationary click outside of any planet/sun: deselect and return to orbit roam
        if (selectedPlanet || isSunSelected) {
          onSelectPlanet(null);
          playCloseSound();
        }
      }}
    >
      <color attach="background" args={['#040614']} />
      <ambientLight intensity={0.52} />
      <pointLight position={[0, 0, 0]} intensity={4.8} color="#fde047" distance={140} decay={1.5} />

      {/* Deep Space Background Starfield */}
      <Stars radius={280} depth={120} count={2400} factor={4} fade speed={0.15} />

      {/* Lightweight Cosmic Galaxy Spiral Arms (Single draw call, zero overdraw) */}
      <CosmicGalaxy />

      {/* Distinct Distant Galaxies far outside the Solar System */}
      <DistantGalaxies />

      {/* The Sun / Portfolio Core */}
      <Sun isSunSelected={isSunSelected} onSelectSun={onSelectSun} />

      {/* Asteroid Belt */}
      <AsteroidBelt />

      {/* Orbiting Planets with Realistic Textures */}
      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          planet={planet}
          isSelected={selectedPlanet?.id === planet.id}
          simulationSpeed={simulationSpeed}
          onSelect={onSelectPlanet}
          onHover={onHoverPlanet}
          onRegisterGroup={handleRegisterGroup}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.06}
        minDistance={12.0}
        maxDistance={125.0}
        maxPolarAngle={Math.PI / 2 + 0.15}
      />

      {/* Camera Animation Controller placed after Planets to execute after mesh transforms */}
      <CameraController
        selectedPlanet={selectedPlanet}
        isSunSelected={isSunSelected}
        viewMode={viewMode}
        isIntro={isIntro}
        controlsRef={controlsRef}
        planetGroupsRef={planetGroupsRef}
      />
    </Canvas>
  );
});

export default SolarSystem;
