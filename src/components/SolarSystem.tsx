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

// Organic Gaussian cloud puff texture for volumetric deep-space nebula rendering
let cachedNebulaTexture: THREE.CanvasTexture | null = null;
function getNebulaCloudTexture(): THREE.CanvasTexture {
  if (cachedNebulaTexture) return cachedNebulaTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  cachedNebulaTexture = new THREE.CanvasTexture(canvas);
  return cachedNebulaTexture;
}

// Pre-computed static Milky Way Galaxy Spiral & Deep Space Stardust (2000 particles)
const GALAXY_COUNT = 2000;
const GALAXY_POSITIONS = new Float32Array(GALAXY_COUNT * 3);
const GALAXY_COLORS = new Float32Array(GALAXY_COUNT * 3);

for (let i = 0; i < GALAXY_COUNT; i++) {
  const seed = i * 13.371;
  const rand1 = Math.abs(Math.sin(seed * 1.1)) % 1;
  const rand2 = Math.abs(Math.sin(seed * 2.3)) % 1;
  const rand3 = Math.abs(Math.sin(seed * 3.7)) % 1;

  // Swirling spiral arms starting safely outside planetary zone (28 AU to 125 AU)
  const r = 28 + Math.pow(rand1, 1.45) * 95;
  const arm = i % 2;
  const spin = r * 0.088;
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
      galaxyRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <group ref={galaxyRef} rotation={[0.42, 0.25, 0.15]}>
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
          size={0.24}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.82}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

// Deep Space Colorful Cosmic Nebulae (Volumetric cloud clusters in deep space)
interface NebulaSpec {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  speed: number;
  colors: [number, number, number][];
  seedOffset: number;
}

const NEBULA_COUNT_PER_CLUSTER = 260;

const NEBULA_SPECS: NebulaSpec[] = [
  // 1. Carina Nebula (Cosmic Cliffs) - Rich Magenta, Rose & Deep Violet
  {
    name: 'Carina',
    position: [-165, 95, -140],
    rotation: [0.35, -0.2, 0.45],
    radius: 38,
    speed: 0.0016,
    colors: [
      [0.95, 0.15, 0.45], // Crimson Rose
      [0.85, 0.22, 0.85], // Vibrant Magenta
      [0.55, 0.25, 0.95], // Electric Violet
      [0.98, 0.45, 0.72], // Pastel Pink
    ],
    seedOffset: 12.345,
  },
  // 2. Orion Nebula (Stellar Nursery) - Electric Cyan, Azure & Deep Turquoise
  {
    name: 'Orion',
    position: [175, 110, -125],
    rotation: [-0.4, 0.5, -0.3],
    radius: 36,
    speed: -0.0014,
    colors: [
      [0.12, 0.85, 0.95], // Electric Cyan
      [0.08, 0.55, 0.95], // Sky Azure
      [0.15, 0.92, 0.75], // Neon Turquoise
      [0.45, 0.35, 0.98], // Deep Indigo
    ],
    seedOffset: 27.891,
  },
  // 3. Eagle Nebula (Pillars of Creation) - Warm Amber, Bronze Gold & Emerald Gas
  {
    name: 'Eagle',
    position: [155, -90, 160],
    rotation: [0.6, -0.35, 0.2],
    radius: 40,
    speed: 0.0018,
    colors: [
      [0.98, 0.65, 0.18], // Solar Amber
      [0.95, 0.82, 0.22], // Brilliant Gold
      [0.12, 0.85, 0.52], // Emerald Green
      [0.85, 0.42, 0.15], // Fiery Bronze
    ],
    seedOffset: 41.567,
  },
  // 4. Veil Nebula (Supernova Remnant) - Electric Coral Red, Velvet Violet & Ice Blue
  {
    name: 'Veil',
    position: [-170, -100, 150],
    rotation: [-0.5, -0.45, 0.6],
    radius: 37,
    speed: -0.0015,
    colors: [
      [0.95, 0.25, 0.35], // Coral Red
      [0.65, 0.22, 0.92], // Velvet Violet
      [0.25, 0.75, 0.98], // Ice Blue
      [0.92, 0.18, 0.65], // Neon Pink
    ],
    seedOffset: 59.231,
  },
];

interface PrecomputedNebula {
  positions: Float32Array;
  colors: Float32Array;
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
}

const PRECOMPUTED_NEBULAE: PrecomputedNebula[] = NEBULA_SPECS.map((spec) => {
  const positions = new Float32Array(NEBULA_COUNT_PER_CLUSTER * 3);
  const colors = new Float32Array(NEBULA_COUNT_PER_CLUSTER * 3);

  for (let i = 0; i < NEBULA_COUNT_PER_CLUSTER; i++) {
    const seed = i * spec.seedOffset;
    const rand1 = Math.abs(Math.sin(seed * 1.41)) % 1;
    const rand2 = Math.abs(Math.sin(seed * 2.83)) % 1;
    const rand3 = Math.abs(Math.sin(seed * 4.77)) % 1;

    // Multi-lobed organic gas distribution
    const lobe = (i % 3) * (Math.PI * 2 / 3);
    const r = Math.pow(rand1, 1.25) * spec.radius;
    const theta = rand2 * Math.PI * 2;
    const phi = (rand3 - 0.5) * Math.PI * 0.85;

    // Displace outward along lobes to form dramatic clouds
    const lx = Math.cos(theta + lobe) * Math.cos(phi) * r;
    const ly = Math.sin(phi) * (r * 0.65);
    const lz = Math.sin(theta + lobe) * Math.cos(phi) * (r * 1.15);

    positions[i * 3] = lx;
    positions[i * 3 + 1] = ly;
    positions[i * 3 + 2] = lz;

    // Color gradient across the cloud
    const colorIdx = i % spec.colors.length;
    const nextColorIdx = (colorIdx + 1) % spec.colors.length;
    const blend = rand2;
    const c1 = spec.colors[colorIdx];
    const c2 = spec.colors[nextColorIdx];

    colors[i * 3] = c1[0] * (1 - blend) + c2[0] * blend;
    colors[i * 3 + 1] = c1[1] * (1 - blend) + c2[1] * blend;
    colors[i * 3 + 2] = c1[2] * (1 - blend) + c2[2] * blend;
  }

  return {
    positions,
    colors,
    position: spec.position,
    rotation: spec.rotation,
    speed: spec.speed,
  };
});

const CosmicNebulae = memo(function CosmicNebulae() {
  const groupRefs = useRef<THREE.Group[]>([]);
  const nebulaTexture = useMemo(() => getNebulaCloudTexture(), []);

  useFrame((_, delta) => {
    PRECOMPUTED_NEBULAE.forEach((neb, idx) => {
      const grp = groupRefs.current[idx];
      if (grp) {
        grp.rotation.y += delta * neb.speed;
        grp.rotation.z += delta * (neb.speed * 0.5);
      }
    });
  });

  return (
    <>
      {PRECOMPUTED_NEBULAE.map((neb, idx) => (
        <group key={idx} position={neb.position} rotation={neb.rotation}>
          <group ref={(el) => { if (el) groupRefs.current[idx] = el; }}>
            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[neb.positions, 3]}
                />
                <bufferAttribute
                  attach="attributes-color"
                  args={[neb.colors, 3]}
                />
              </bufferGeometry>
              <pointsMaterial
                size={18.0}
                map={nebulaTexture}
                vertexColors
                transparent
                opacity={0.28}
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

// Pre-computed static Distant Deep Space Galaxies (7 distinct celestial galaxies far outside the solar system)
const DISTANT_GALAXY_COUNT = 1100;

interface GalaxySpec {
  name: string;
  type: 'spiral' | 'ring' | 'barred' | 'active';
  posOffset: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  axis: 'x' | 'y' | 'z';
  seedOffset: number;
  radius: number;
  coreColor: string;
  coreGlowColor: string;
  colorScheme:
    | 'andromeda-violet-cyan'
    | 'whirlpool-azure-emerald'
    | 'sombrero-amber-rose'
    | 'triangulum-lavender-sky'
    | 'cartwheel-sapphire-ruby'
    | 'centaurus-fire-indigo'
    | 'helix-neon-cyber';
}

const GALAXY_SPECS: GalaxySpec[] = [
  // 1. Andromeda Spiral (North-West Deep Space) - Violet, Magenta, Cyan
  {
    name: 'Andromeda',
    type: 'spiral',
    posOffset: [-185, 90, -195],
    rotation: [0.65, -0.45, 0.3],
    scale: 1.25,
    speed: 0.0028,
    axis: 'z',
    seedOffset: 7.713,
    radius: 44,
    coreColor: '#fef08a',
    coreGlowColor: '#eab308',
    colorScheme: 'andromeda-violet-cyan',
  },
  // 2. Whirlpool Spiral (North-East Deep Space) - Electric Azure & Neon Emerald Knots
  {
    name: 'Whirlpool',
    type: 'spiral',
    posOffset: [205, 100, -185],
    rotation: [-0.55, 0.65, -0.4],
    scale: 1.2,
    speed: -0.0032,
    axis: 'z',
    seedOffset: 19.341,
    radius: 40,
    coreColor: '#f8fafc',
    coreGlowColor: '#38bdf8',
    colorScheme: 'whirlpool-azure-emerald',
  },
  // 3. Sombrero Barred Galaxy (South-West Deep Space) - Solar Amber & Fiery Rose Dust Disk
  {
    name: 'Sombrero',
    type: 'barred',
    posOffset: [-210, -85, 180],
    rotation: [0.85, 0.35, -0.6],
    scale: 1.35,
    speed: 0.0025,
    axis: 'y',
    seedOffset: 31.879,
    radius: 46,
    coreColor: '#fde047',
    coreGlowColor: '#f59e0b',
    colorScheme: 'sombrero-amber-rose',
  },
  // 4. Triangulum Pinwheel (South-East Deep Space) - Lavender, Violet & Sky Blue
  {
    name: 'Triangulum',
    type: 'spiral',
    posOffset: [195, -95, 205],
    rotation: [-0.75, -0.45, 0.5],
    scale: 1.15,
    speed: -0.003,
    axis: 'x',
    seedOffset: 43.215,
    radius: 38,
    coreColor: '#f1f5f9',
    coreGlowColor: '#c084fc',
    colorScheme: 'triangulum-lavender-sky',
  },
  // 5. Cartwheel Ring Galaxy (Deep Outer Ring) - Sapphire Hub with Ruby/Rose Outer Ring
  {
    name: 'Cartwheel',
    type: 'ring',
    posOffset: [-145, -120, -195],
    rotation: [0.45, 0.7, -0.35],
    scale: 1.15,
    speed: 0.0035,
    axis: 'z',
    seedOffset: 57.123,
    radius: 36,
    coreColor: '#fed7aa',
    coreGlowColor: '#f43f5e',
    colorScheme: 'cartwheel-sapphire-ruby',
  },
  // 6. Centaurus Active Lenticular - Fiery Plasma Jet & Cosmic Indigo Bulge
  {
    name: 'Centaurus',
    type: 'active',
    posOffset: [215, 55, 140],
    rotation: [-0.65, 0.3, 0.55],
    scale: 1.25,
    speed: -0.0024,
    axis: 'y',
    seedOffset: 68.914,
    radius: 42,
    coreColor: '#ffffff',
    coreGlowColor: '#f97316',
    colorScheme: 'centaurus-fire-indigo',
  },
  // 7. Helix Cyber Spiral (Zenith Deep Space) - Neon Cyan & Vivid Neon Magenta
  {
    name: 'Helix',
    type: 'spiral',
    posOffset: [40, 185, 175],
    rotation: [0.95, -0.3, 0.6],
    scale: 1.2,
    speed: 0.0032,
    axis: 'z',
    seedOffset: 82.441,
    radius: 40,
    coreColor: '#67e8f9',
    coreGlowColor: '#ec4899',
    colorScheme: 'helix-neon-cyber',
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
  coreColor: string;
  coreGlowColor: string;
  coreRadius: number;
}

const PRECOMPUTED_GALAXIES: PrecomputedGalaxy[] = GALAXY_SPECS.map((spec) => {
  const positions = new Float32Array(DISTANT_GALAXY_COUNT * 3);
  const colors = new Float32Array(DISTANT_GALAXY_COUNT * 3);

  for (let i = 0; i < DISTANT_GALAXY_COUNT; i++) {
    const seed = i * spec.seedOffset;
    const rand1 = Math.abs(Math.sin(seed * 1.3)) % 1;
    const rand2 = Math.abs(Math.sin(seed * 2.7)) % 1;
    const rand3 = Math.abs(Math.sin(seed * 4.1)) % 1;

    let x = 0;
    let y = 0;
    let z = 0;

    if (spec.type === 'ring') {
      // Cartwheel: dense hub + radiating spokes + intense starburst ring
      if (i < 250) {
        // Central hub
        const r = Math.pow(rand1, 1.5) * (spec.radius * 0.22);
        const theta = rand2 * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = (rand3 - 0.5) * 1.8;
        z = Math.sin(theta) * r;
      } else if (i < 500) {
        // Radiating spokes
        const spoke = (i % 6) * (Math.PI / 3);
        const spokeR = (spec.radius * 0.22) + rand1 * (spec.radius * 0.65);
        const spokeJitter = (rand2 - 0.5) * 1.6;
        x = Math.cos(spoke) * spokeR + Math.sin(spoke) * spokeJitter;
        y = (rand3 - 0.5) * 1.4;
        z = Math.sin(spoke) * spokeR - Math.cos(spoke) * spokeJitter;
      } else {
        // Outer intense starburst ring
        const ringR = spec.radius * 0.88 + (rand1 - 0.5) * (spec.radius * 0.22);
        const theta = rand2 * Math.PI * 2;
        x = Math.cos(theta) * ringR;
        y = (rand3 - 0.5) * 2.2;
        z = Math.sin(theta) * ringR;
      }
    } else if (spec.type === 'barred') {
      // Sombrero: dense spheroid core + sharp planar disc with prominent edge
      if (i < 450) {
        // Bulge
        const r = Math.pow(rand1, 1.6) * (spec.radius * 0.38);
        const theta = rand2 * Math.PI * 2;
        const phi = (rand3 - 0.5) * Math.PI;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.65);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else {
        // Flat outer disc
        const r = (spec.radius * 0.32) + Math.pow(rand1, 1.2) * (spec.radius * 0.68);
        const theta = rand2 * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = (rand3 - 0.5) * (0.8 + r * 0.04);
        z = Math.sin(theta) * r;
      }
    } else if (spec.type === 'active') {
      // Centaurus: central bulge + prominent perpendicular relativistic plasma jets
      if (i < 300) {
        // Relativistic bipolar jets along Y axis
        const jetSign = (i % 2 === 0) ? 1 : -1;
        const jetHeight = (spec.radius * 0.2) + Math.pow(rand1, 1.2) * (spec.radius * 0.95);
        const jetSpread = (jetHeight / spec.radius) * 3.5 * rand2;
        const jetAngle = rand3 * Math.PI * 2;
        x = Math.cos(jetAngle) * jetSpread;
        y = jetSign * jetHeight;
        z = Math.sin(jetAngle) * jetSpread;
      } else {
        // Lenticular disk
        const r = Math.pow(rand1, 1.5) * spec.radius;
        const theta = rand2 * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = (rand3 - 0.5) * (1.8 + r * 0.08);
        z = Math.sin(theta) * r;
      }
    } else {
      // Logarithmic Spiral Arms
      const r = Math.pow(rand1, 1.7) * spec.radius;
      const arm = i % 2;
      const spin = r * 0.17;
      const angle = arm * Math.PI + spin + (rand2 - 0.5) * 0.65;
      const spreadY = (rand3 - 0.5) * (1.6 + r * 0.08);
      const spreadR = (rand2 - 0.5) * (1.6 + r * 0.09);

      x = Math.cos(angle) * (r + spreadR);
      y = spreadY;
      z = Math.sin(angle) * (r + spreadR);
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Radius distance for color mapping
    const distR = Math.hypot(x, z);

    // Color gradient based on galaxy aesthetic
    if (spec.colorScheme === 'andromeda-violet-cyan') {
      if (distR < 7.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 0.72;
      } else if (distR < 20.0) {
        colors[i * 3] = 0.92; colors[i * 3 + 1] = 0.28; colors[i * 3 + 2] = 0.88;
      } else if (distR < 32.0) {
        colors[i * 3] = 0.68; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.98;
      } else {
        colors[i * 3] = 0.22; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
      }
    } else if (spec.colorScheme === 'whirlpool-azure-emerald') {
      if (distR < 6.0) {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
      } else if (distR < 18.0) {
        colors[i * 3] = 0.12; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.82;
      } else if (distR < 28.0) {
        colors[i * 3] = 0.08; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 0.52;
      } else {
        colors[i * 3] = 0.18; colors[i * 3 + 1] = 0.52; colors[i * 3 + 2] = 0.98;
      }
    } else if (spec.colorScheme === 'sombrero-amber-rose') {
      if (distR < 7.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.32;
      } else if (distR < 22.0) {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.58; colors[i * 3 + 2] = 0.18;
      } else if (distR < 35.0) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.22; colors[i * 3 + 2] = 0.42;
      } else {
        colors[i * 3] = 0.55; colors[i * 3 + 1] = 0.18; colors[i * 3 + 2] = 0.75;
      }
    } else if (spec.colorScheme === 'triangulum-lavender-sky') {
      if (distR < 6.0) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.98; colors[i * 3 + 2] = 1.0;
      } else if (distR < 18.0) {
        colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.65; colors[i * 3 + 2] = 0.98;
      } else if (distR < 28.0) {
        colors[i * 3] = 0.62; colors[i * 3 + 1] = 0.32; colors[i * 3 + 2] = 0.95;
      } else {
        colors[i * 3] = 0.35; colors[i * 3 + 1] = 0.82; colors[i * 3 + 2] = 0.98;
      }
    } else if (spec.colorScheme === 'cartwheel-sapphire-ruby') {
      if (distR < 8.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.6;
      } else if (distR < 25.0) {
        colors[i * 3] = 0.25; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 0.98;
      } else {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.18; colors[i * 3 + 2] = 0.58;
      }
    } else if (spec.colorScheme === 'centaurus-fire-indigo') {
      if (Math.abs(y) > 12.0) {
        // High energy polar plasma jets
        colors[i * 3] = 0.15; colors[i * 3 + 1] = 0.75; colors[i * 3 + 2] = 1.0;
      } else if (distR < 8.0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.98; colors[i * 3 + 2] = 0.85;
      } else if (distR < 22.0) {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.48; colors[i * 3 + 2] = 0.15;
      } else {
        colors[i * 3] = 0.52; colors[i * 3 + 1] = 0.25; colors[i * 3 + 2] = 0.92;
      }
    } else {
      // helix-neon-cyber
      if (distR < 6.0) {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
      } else if (i % 2 === 0) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.05; colors[i * 3 + 2] = 0.55;
      } else {
        colors[i * 3] = 0.05; colors[i * 3 + 1] = 0.98; colors[i * 3 + 2] = 0.82;
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
    coreColor: spec.coreColor,
    coreGlowColor: spec.coreGlowColor,
    coreRadius: spec.radius * 0.065,
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
            {/* Galactic Starfield & Gas Spirals */}
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
                size={0.42}
                map={particleTexture}
                vertexColors
                transparent
                opacity={0.92}
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

// Occasional Streaking Cosmic Comet
const COMET_TAIL_COUNT = 65;

const CosmicComet = memo(function CosmicComet() {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const tailGeoRef = useRef<THREE.BufferGeometry>(null!);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  // Pre-allocated buffers for tail particles to eliminate GC during animation
  const { tailPositions, tailColors } = useMemo(() => {
    const pos = new Float32Array(COMET_TAIL_COUNT * 3);
    const col = new Float32Array(COMET_TAIL_COUNT * 3);
    for (let i = 0; i < COMET_TAIL_COUNT; i++) {
      const t = i / (COMET_TAIL_COUNT - 1);
      // Front of tail: bright white-cyan, transitioning to deep cosmic sapphire and violet
      if (t < 0.2) {
        col[i * 3] = 0.95;
        col[i * 3 + 1] = 0.98;
        col[i * 3 + 2] = 1.0;
      } else if (t < 0.55) {
        col[i * 3] = 0.22;
        col[i * 3 + 1] = 0.82;
        col[i * 3 + 2] = 1.0;
      } else {
        const fade = 1 - (t - 0.55) / 0.45;
        col[i * 3] = 0.55 * fade;
        col[i * 3 + 1] = 0.25 * fade;
        col[i * 3 + 2] = 0.95 * fade;
      }
    }
    return { tailPositions: pos, tailColors: col };
  }, []);

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    timeRef.current += safeDelta;
    const CYCLE_DURATION = 26.0; // 26 seconds total cycle
    const STREAK_DURATION = 9.0;  // 9 seconds active swooping flyby

    const cycleTime = timeRef.current % CYCLE_DURATION;
    const passIndex = Math.floor(timeRef.current / CYCLE_DURATION);
    const passAngle = passIndex * 1.57; // Varies trajectory angle each cycle

    if (cycleTime < STREAK_DURATION) {
      const p = cycleTime / STREAK_DURATION; // 0 to 1
      const u = (p - 0.5) * 2; // -1 to 1

      // Hyperbolic swoop across the solar system outer edge
      const rawX = u * 115;
      const rawY = 32 - (1 - u * u) * 44; // Dips down gracefully then arcs back up
      const rawZ = u * 90 + (1 - u * u) * 28;

      // Rotate trajectory according to this pass angle
      const cosA = Math.cos(passAngle);
      const sinA = Math.sin(passAngle);
      const posX = rawX * cosA - rawZ * sinA;
      const posZ = rawX * sinA + rawZ * cosA;
      const posY = rawY;

      if (groupRef.current) {
        groupRef.current.position.set(posX, posY, posZ);
      }

      if (lightRef.current) {
        lightRef.current.intensity = (1 - Math.abs(u)) * 3.5 + 0.8;
      }

      // Compute velocity vector tangent for tail alignment
      const du = 0.01;
      const nextU = u + du;
      const nextRawX = nextU * 115;
      const nextRawY = 32 - (1 - nextU * nextU) * 44;
      const nextRawZ = nextU * 90 + (1 - nextU * nextU) * 28;
      const nextPosX = nextRawX * cosA - nextRawZ * sinA;
      const nextPosZ = nextRawX * sinA + nextRawZ * cosA;
      const nextPosY = nextRawY;

      let vx = nextPosX - posX;
      let vy = nextPosY - posY;
      let vz = nextPosZ - posZ;
      const vLen = Math.hypot(vx, vy, vz) || 1;
      vx /= vLen; vy /= vLen; vz /= vLen;

      // Update tail positions trailing backward from the comet nucleus
      for (let i = 0; i < COMET_TAIL_COUNT; i++) {
        const trailDist = i * 0.48;
        const spread = (i / COMET_TAIL_COUNT) * 1.2;
        const jx = Math.sin(i * 9.1 + timeRef.current * 12) * spread;
        const jy = Math.cos(i * 7.3 + timeRef.current * 12) * spread;
        const jz = Math.sin(i * 5.7 + timeRef.current * 12) * spread;

        tailPositions[i * 3] = posX - vx * trailDist + jx;
        tailPositions[i * 3 + 1] = posY - vy * trailDist + jy;
        tailPositions[i * 3 + 2] = posZ - vz * trailDist + jz;
      }

      if (tailGeoRef.current) {
        tailGeoRef.current.attributes.position.needsUpdate = true;
      }
    } else {
      // Inactive window: hide comet in outer space
      if (groupRef.current) {
        groupRef.current.position.set(0, -9999, 0);
      }
      if (lightRef.current) {
        lightRef.current.intensity = 0;
      }
      for (let i = 0; i < COMET_TAIL_COUNT; i++) {
        tailPositions[i * 3 + 1] = -9999;
      }
      if (tailGeoRef.current) {
        tailGeoRef.current.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Comet Nucleus & Coma Glow */}
      <group ref={groupRef} position={[0, -9999, 0]}>
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.85, 16, 16]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight ref={lightRef} color="#38bdf8" intensity={0} distance={30} decay={2} />
      </group>

      {/* Comet Tail Particles */}
      <points>
        <bufferGeometry ref={tailGeoRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[tailPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[tailColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.65}
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
  );
});


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

      {/* Vast Colorful Cosmic Nebulae (Volumetric cloud clusters in deep space) */}
      <CosmicNebulae />

      {/* Lightweight Cosmic Galaxy Spiral Arms (Single draw call, zero overdraw) */}
      <CosmicGalaxy />

      {/* Distinct Distant Galaxies far outside the Solar System (7 colorful galaxies with core glow) */}
      <DistantGalaxies />

      {/* Occasional Streaking Cosmic Comet */}
      <CosmicComet />

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
