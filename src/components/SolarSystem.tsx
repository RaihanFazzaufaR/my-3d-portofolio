import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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
  // 1. Carina Nebula (Cosmic Cliffs) - Positioned in the North celestial sky (Dist: 145 AU)
  {
    name: 'Carina',
    position: [0, 61, 131],
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
  // 2. Orion Nebula (Stellar Nursery) - Positioned in the East celestial sky (Dist: 150 AU)
  {
    name: 'Orion',
    position: [139, -56, 0],
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
  // 3. Eagle Nebula (Pillars of Creation) - Positioned in the South celestial sky (Dist: 148 AU)
  {
    name: 'Eagle',
    position: [0, 69, -131],
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
  // 4. Veil Nebula (Supernova Remnant) - Positioned in the West celestial sky (Dist: 145 AU)
  {
    name: 'Veil',
    position: [-131, -61, 0],
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

// ----------------------------------------------------------------------------------
// Realistic Astronomical Background Stars (Replaces Drei Stars with Multi-Tier MK Spectrum)
// ----------------------------------------------------------------------------------
const TIER1_COUNT = 85;   // Bright Alpha Navigational Stars (1st magnitude, size ~3.4)
const TIER2_COUNT = 750;  // Medium Constellation Stars (2nd - 4th magnitude, size ~1.85)
const TIER3_COUNT = 2800; // Deep Background Stardust Pinpricks (5th - 7th magnitude, size ~0.9)

// Morgan-Keenan Astronomical Stellar Classification Spectrum (Real Star Blackbody Colors)
const STELLAR_SPECTRUM: { color: [number, number, number]; weight: number }[] = [
  { color: [0.72, 0.86, 1.0], weight: 0.08 }, // O/B: Intense Blue-White (e.g. Rigel, Spica)
  { color: [0.96, 0.98, 1.0], weight: 0.24 }, // A: Pure Brilliant White (e.g. Sirius, Vega)
  { color: [1.0,  0.96, 0.88], weight: 0.20 }, // F: Soft Creamy White (e.g. Procyon, Canopus)
  { color: [1.0,  0.92, 0.65], weight: 0.20 }, // G: Solar Yellow Dwarf (e.g. Sun, Alpha Centauri)
  { color: [1.0,  0.72, 0.40], weight: 0.16 }, // K: Warm Amber Orange (e.g. Arcturus, Aldebaran)
  { color: [1.0,  0.42, 0.35], weight: 0.12 }, // M: Deep Coral Red Giant (e.g. Betelgeuse, Antares)
];

function sampleStarColor(rng: () => number): [number, number, number] {
  const r = rng();
  let acc = 0;
  for (const s of STELLAR_SPECTRUM) {
    acc += s.weight;
    if (r <= acc) return s.color;
  }
  return STELLAR_SPECTRUM[1].color;
}

// Mulberry32 deterministic PRNG
function createPrng(seed: number) {
  let s = Math.floor(seed * 100000) + 12345;
  return function() {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pre-compute spherical starfield coordinates with Archimedes area-preserving projection
function generateStarTier(count: number, minDist: number, maxDist: number, seed: number) {
  const rng = createPrng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1) - Math.PI / 2;
    const dist = minDist + rng() * (maxDist - minDist);

    positions[i * 3] = dist * Math.cos(phi) * Math.sin(theta);
    positions[i * 3 + 1] = dist * Math.sin(phi);
    positions[i * 3 + 2] = dist * Math.cos(phi) * Math.cos(theta);

    const c = sampleStarColor(rng);
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  return { positions, colors };
}

const STAR_TIER1 = generateStarTier(TIER1_COUNT, 320, 380, 101);
const STAR_TIER2 = generateStarTier(TIER2_COUNT, 300, 400, 202);
const STAR_TIER3 = generateStarTier(TIER3_COUNT, 280, 420, 303);

const RealisticBackgroundStars = memo(function RealisticBackgroundStars() {
  const groupRef = useRef<THREE.Group>(null!);
  const tier1MatRef = useRef<THREE.PointsMaterial>(null!);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Extremely subtle, majestic celestial rotation across deep time
      groupRef.current.rotation.y += delta * 0.0012;
      groupRef.current.rotation.x += delta * 0.0006;
    }
    // Subtle twinkling scintillation on the brightest stars
    if (tier1MatRef.current) {
      tier1MatRef.current.opacity = 0.92 + Math.sin(Date.now() * 0.003) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Tier 1: Prominent Bright Stars (Sirius/Rigel/Betelgeuse calibre) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STAR_TIER1.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[STAR_TIER1.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={tier1MatRef}
          size={3.4}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.98}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Tier 2: Medium Constellation Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STAR_TIER2.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[STAR_TIER2.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.85}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.92}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Tier 3: Deep Space Cosmic Stardust Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STAR_TIER3.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[STAR_TIER3.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.92}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.78}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

// ----------------------------------------------------------------------------------
// Natural Density-Wave Distant Galaxies (Astrophysically Simulated Spiral Structure)
// ----------------------------------------------------------------------------------
const DISTANT_GALAXY_COUNT = 2600;
const GALAXY_GAS_COUNT = 140;

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
  // 1. Andromeda Spiral (North-East Deep Space - Dist: 250 AU)
  {
    name: 'Andromeda',
    type: 'spiral',
    posOffset: [145, 143, 145],
    rotation: [0.65, -0.45, 0.3],
    scale: 1.55,
    speed: 0.003,
    axis: 'z',
    seedOffset: 7.713,
    radius: 48,
    colorScheme: 'andromeda-violet-cyan',
  },
  // 2. Whirlpool Grand Spiral (South-East Deep Space - Dist: 260 AU)
  {
    name: 'Whirlpool',
    type: 'spiral',
    posOffset: [159, 130, -159],
    rotation: [-0.55, 0.65, -0.4],
    scale: 1.5,
    speed: -0.0032,
    axis: 'z',
    seedOffset: 19.341,
    radius: 46,
    colorScheme: 'whirlpool-azure-emerald',
  },
  // 3. Sombrero Barred Galaxy (South-West Deep Space - Dist: 255 AU)
  {
    name: 'Sombrero',
    type: 'barred',
    posOffset: [-156, -127, -156],
    rotation: [0.85, 0.35, -0.6],
    scale: 1.55,
    speed: 0.0026,
    axis: 'y',
    seedOffset: 31.879,
    radius: 50,
    colorScheme: 'sombrero-amber-rose',
  },
  // 4. Triangulum Pinwheel (North-West Deep Space - Dist: 245 AU)
  {
    name: 'Triangulum',
    type: 'spiral',
    posOffset: [-153, -115, 153],
    rotation: [-0.75, -0.45, 0.5],
    scale: 1.45,
    speed: -0.003,
    axis: 'x',
    seedOffset: 43.215,
    radius: 42,
    colorScheme: 'triangulum-lavender-sky',
  },
  // 5. Cartwheel Ring Galaxy (Deep Southern Sky - Dist: 270 AU)
  {
    name: 'Cartwheel',
    type: 'ring',
    posOffset: [71, -174, -194],
    rotation: [0.45, 0.7, -0.35],
    scale: 1.45,
    speed: 0.0035,
    axis: 'z',
    seedOffset: 57.123,
    radius: 40,
    colorScheme: 'cartwheel-sapphire-ruby',
  },
  // 6. Centaurus Active Lenticular (North-West High - Dist: 265 AU)
  {
    name: 'Centaurus',
    type: 'active',
    posOffset: [-191, 170, 69],
    rotation: [-0.65, 0.3, 0.55],
    scale: 1.5,
    speed: -0.0026,
    axis: 'y',
    seedOffset: 68.914,
    radius: 46,
    colorScheme: 'centaurus-fire-indigo',
  },
  // 7. Helix Cyber Spiral (High Overhead Zenith - Dist: 255 AU)
  {
    name: 'Helix',
    type: 'spiral',
    posOffset: [101, 231, 37],
    rotation: [0.95, -0.3, 0.6],
    scale: 1.5,
    speed: 0.0032,
    axis: 'z',
    seedOffset: 82.441,
    radius: 44,
    colorScheme: 'helix-neon-cyber',
  },
];

interface PrecomputedGalaxy {
  starPositions: Float32Array;
  starColors: Float32Array;
  gasPositions: Float32Array;
  gasColors: Float32Array;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  axis: 'x' | 'y' | 'z';
}

const PRECOMPUTED_GALAXIES: PrecomputedGalaxy[] = GALAXY_SPECS.map((spec) => {
  const rng = createPrng(spec.seedOffset);

  const starPositions = new Float32Array(DISTANT_GALAXY_COUNT * 3);
  const starColors = new Float32Array(DISTANT_GALAXY_COUNT * 3);

  const gasPositions = new Float32Array(GALAXY_GAS_COUNT * 3);
  const gasColors = new Float32Array(GALAXY_GAS_COUNT * 3);

  // Density Wave Star Generation (Zero artificial harmonic striping)
  for (let i = 0; i < DISTANT_GALAXY_COUNT; i++) {
    let x: number, y: number, z: number;
    let isCore = false;

    if (spec.type === 'ring') {
      // Cartwheel: Sersic Hub + Stochastic Radial Spokes + Clumpy Outer Starburst Ring
      if (i < 500) {
        // Central Sersic Hub
        isCore = true;
        const rNorm = Math.pow(rng(), 1.5);
        const r = rNorm * (spec.radius * 0.22);
        const theta = rng() * Math.PI * 2;
        const phi = (rng() - 0.5) * Math.PI * 0.7;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.6);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else if (i < 1050) {
        // Natural spokes (irregular density paths connecting to ring)
        const spokeIndex = Math.floor(rng() * 8);
        const spokeAngle = spokeIndex * (Math.PI / 4) + (rng() - 0.5) * 0.25;
        const r = (spec.radius * 0.22) + rng() * (spec.radius * 0.64);
        const jitter = (rng() - 0.5) * (1.2 + (r / spec.radius) * 1.5);
        x = Math.cos(spokeAngle) * r + Math.sin(spokeAngle) * jitter;
        y = (rng() - 0.5) * 1.6;
        z = Math.sin(spokeAngle) * r - Math.cos(spokeAngle) * jitter;
      } else {
        // Dense outer ring with clumpy starburst clusters
        const ringR = spec.radius * 0.86 + (rng() - 0.5) * (spec.radius * 0.22);
        const theta = rng() * Math.PI * 2;
        x = Math.cos(theta) * ringR + (rng() - 0.5) * 1.4;
        y = (rng() - 0.5) * 2.2;
        z = Math.sin(theta) * ringR + (rng() - 0.5) * 1.4;
      }
    } else if (spec.type === 'barred') {
      // Sombrero: Massive Sersic Core Bulge + Sharp Planar Dust Disk
      if (i < 700) {
        isCore = true;
        const rNorm = Math.pow(rng(), 1.5);
        const r = rNorm * (spec.radius * 0.38);
        const theta = rng() * Math.PI * 2;
        const phi = (rng() - 0.5) * Math.PI;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.75); // Oblate spheroid
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else {
        // Continuous exponential disc with prominent edge
        const rNorm = Math.sqrt(rng());
        const r = (spec.radius * 0.28) + rNorm * (spec.radius * 0.72);
        const theta = rng() * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = (rng() - 0.5) * (0.8 + (r / spec.radius) * 1.2);
        z = Math.sin(theta) * r;
      }
    } else if (spec.type === 'active') {
      // Centaurus: Sersic Elliptical Galaxy + Bipolar Relativistic Jet Streams
      if (i < 600) {
        const jetSign = (i % 2 === 0) ? 1 : -1;
        const jetHeight = (spec.radius * 0.15) + Math.pow(rng(), 1.15) * (spec.radius * 1.05);
        const jetSpread = (jetHeight / spec.radius) * 3.8 * rng();
        const jetAngle = rng() * Math.PI * 2;
        x = Math.cos(jetAngle) * jetSpread;
        y = jetSign * jetHeight;
        z = Math.sin(jetAngle) * jetSpread;
      } else {
        isCore = (i < 1100);
        const r = Math.pow(rng(), 1.4) * spec.radius;
        const theta = rng() * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = (rng() - 0.5) * (2.0 + (r / spec.radius) * 2.5);
        z = Math.sin(theta) * r;
      }
    } else {
      // Grand Design Spiral (Density Wave Theory Simulation)
      const uCore = rng();
      if (uCore < 0.24) {
        // Dense Central Sersic Bulge (Population II Stars)
        isCore = true;
        const rNorm = Math.pow(rng(), 1.6);
        const r = rNorm * (spec.radius * 0.22);
        const theta = rng() * Math.PI * 2;
        const phi = (rng() - 0.5) * Math.PI * 0.7;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.65);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else {
        // Continuous Exponential Disc modulated by Density Waves
        const rNorm = Math.sqrt(rng());
        const r = (spec.radius * 0.14) + rNorm * (spec.radius * 0.86);

        // Density wave spiral logarithmic pitch
        const pitch = 0.28;
        const spiralPhase = Math.log(Math.max(1, r / (spec.radius * 0.14))) / Math.tan(pitch);

        let theta = rng() * Math.PI * 2;
        // 68% of disc stars condense naturally into 2 grand-design arms
        if (rng() < 0.68) {
          const arm = rng() < 0.5 ? 0 : 1;
          const armCenter = arm * Math.PI + spiralPhase;
          // Box-Muller Gaussian dispersion across arm crest
          const uA = Math.max(1e-6, rng());
          const uB = rng();
          const gauss = Math.sqrt(-2 * Math.log(uA)) * Math.cos(2 * Math.PI * uB);
          const armWidth = 0.22 + (r / spec.radius) * 0.32;
          theta = armCenter + gauss * armWidth;
        }

        // Disc thickness with natural flaring
        const uZ1 = Math.max(1e-6, rng());
        const uZ2 = rng();
        const zGauss = Math.sqrt(-2 * Math.log(uZ1)) * Math.cos(2 * Math.PI * uZ2);
        const thickness = 0.65 + (r / spec.radius) * 1.6;

        x = Math.cos(theta) * r;
        y = zGauss * thickness;
        z = Math.sin(theta) * r;
      }
    }

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    const distR = Math.hypot(x, z);

    // Realistic Stellar Population Color Grading
    if (isCore || distR < 6.5) {
      // Bulge Population II: Warm white-gold & solar amber
      const blend = rng();
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.94 + blend * 0.05;
      starColors[i * 3 + 2] = 0.72 + blend * 0.25;
    } else {
      // Disc Population I: Saturated starburst blues, with 14% magenta/pink H-II emission knots
      const isHII = rng() < 0.14;
      if (isHII) {
        starColors[i * 3] = 0.98;
        starColors[i * 3 + 1] = 0.28;
        starColors[i * 3 + 2] = 0.88;
      } else {
        if (spec.colorScheme === 'whirlpool-azure-emerald') {
          const b = rng();
          starColors[i * 3] = 0.12 + b * 0.1;
          starColors[i * 3 + 1] = 0.88 + b * 0.1;
          starColors[i * 3 + 2] = 0.65 + b * 0.35;
        } else if (spec.colorScheme === 'sombrero-amber-rose') {
          const b = rng();
          starColors[i * 3] = 0.98;
          starColors[i * 3 + 1] = 0.35 + b * 0.35;
          starColors[i * 3 + 2] = 0.25 + b * 0.25;
        } else if (spec.colorScheme === 'helix-neon-cyber') {
          if (rng() < 0.5) {
            starColors[i * 3] = 0.05; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0;
          } else {
            starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.08; starColors[i * 3 + 2] = 0.65;
          }
        } else {
          // Default Violet-Cyan Spiral (e.g. Andromeda/Triangulum)
          const b = rng();
          starColors[i * 3] = 0.35 + b * 0.45;
          starColors[i * 3 + 1] = 0.65 + b * 0.32;
          starColors[i * 3 + 2] = 1.0;
        }
      }
    }
  }

  // 140 Soft Interstellar Gaseous Arm Puffs
  for (let g = 0; g < GALAXY_GAS_COUNT; g++) {
    const isCoreGas = g < 28;
    let gx: number, gy: number, gz: number;

    if (isCoreGas) {
      const r = Math.pow(rng(), 1.3) * (spec.radius * 0.26);
      const theta = rng() * Math.PI * 2;
      gx = Math.cos(theta) * r;
      gy = (rng() - 0.5) * 1.6;
      gz = Math.sin(theta) * r;
    } else {
      const arm = g % 2;
      const r = (spec.radius * 0.2) + Math.pow(rng(), 1.25) * (spec.radius * 0.78);
      const pitch = 0.28;
      const spiralPhase = Math.log(Math.max(1, r / (spec.radius * 0.14))) / Math.tan(pitch);
      const angle = arm * Math.PI + spiralPhase + (rng() - 0.5) * 0.3;
      gx = Math.cos(angle) * r;
      gy = (rng() - 0.5) * 2.0;
      gz = Math.sin(angle) * r;
    }

    gasPositions[g * 3] = gx;
    gasPositions[g * 3 + 1] = gy;
    gasPositions[g * 3 + 2] = gz;

    if (spec.colorScheme === 'whirlpool-azure-emerald') {
      gasColors[g * 3] = 0.08; gasColors[g * 3 + 1] = 0.85; gasColors[g * 3 + 2] = 0.75;
    } else if (spec.colorScheme === 'sombrero-amber-rose') {
      gasColors[g * 3] = 0.95; gasColors[g * 3 + 1] = 0.48; gasColors[g * 3 + 2] = 0.22;
    } else {
      gasColors[g * 3] = 0.65; gasColors[g * 3 + 1] = 0.32; gasColors[g * 3 + 2] = 0.98;
    }
  }

  return {
    starPositions,
    starColors,
    gasPositions,
    gasColors,
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
  const nebulaTexture = useMemo(() => getNebulaCloudTexture(), []);

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
            {/* Soft Gaseous Arm Glow */}
            <points>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[g.gasPositions, 3]} />
                <bufferAttribute attach="attributes-color" args={[g.gasColors, 3]} />
              </bufferGeometry>
              <pointsMaterial
                size={9.8}
                map={nebulaTexture}
                vertexColors
                transparent
                opacity={0.38}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </points>

            {/* Gleaming Star Clusters & Density Wave Arms (2600 natural stars) */}
            <points>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[g.starPositions, 3]} />
                <bufferAttribute attach="attributes-color" args={[g.starColors, 3]} />
              </bufferGeometry>
              <pointsMaterial
                size={1.55}
                map={particleTexture}
                vertexColors
                transparent
                opacity={0.98}
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

// ----------------------------------------------------------------------------------
// Realistic Astronomical Comet with Sub-Stepped Continuous Luminous Trail
// ----------------------------------------------------------------------------------
const TRAIL_POOL_SIZE = 900;

const CosmicComet = memo(function CosmicComet() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const headGeoRef = useRef<THREE.BufferGeometry>(null!);
  const tailGeoRef = useRef<THREE.BufferGeometry>(null!);

  const particleTexture = useMemo(() => getParticleTexture(), []);

  // Pre-allocated head buffer (2 points: brilliant core point + soft luminous coma)
  const headPositions = useMemo(() => new Float32Array([0, -9999, 0, 0, -9999, 0]), []);
  const headColors = useMemo(() => new Float32Array([1.0, 1.0, 1.0, 0.4, 0.9, 1.0]), []);

  // Pre-allocated circular pool for trail particles (zero GC)
  const { trailPositions, trailColors, trailAges, trailLifetimes, trailDrift, trailScales } = useMemo(() => {
    const pos = new Float32Array(TRAIL_POOL_SIZE * 3);
    const col = new Float32Array(TRAIL_POOL_SIZE * 3);
    const ages = new Float32Array(TRAIL_POOL_SIZE);
    const lifes = new Float32Array(TRAIL_POOL_SIZE);
    const drift = new Float32Array(TRAIL_POOL_SIZE * 3);
    const scales = new Float32Array(TRAIL_POOL_SIZE);

    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      pos[i * 3 + 1] = -9999;
      ages[i] = 9999;
      lifes[i] = 2.6;
      scales[i] = 1;
    }

    return {
      trailPositions: pos,
      trailColors: col,
      trailAges: ages,
      trailLifetimes: lifes,
      trailDrift: drift,
      trailScales: scales,
    };
  }, []);

  const spawnIndexRef = useRef(0);
  const timeRef = useRef(0);
  const prevPosRef = useRef<{ x: number; y: number; z: number } | null>(null);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    timeRef.current += safeDelta;

    // Fast, frequent flyby cycle: 10s total (7s active flyby, 3s pause)
    const CYCLE_DURATION = 10.0;
    const STREAK_DURATION = 7.0;

    const cycleTime = timeRef.current % CYCLE_DURATION;
    const passIndex = Math.floor(timeRef.current / CYCLE_DURATION);
    const passAngle = passIndex * 1.618;

    const isActive = cycleTime < STREAK_DURATION;

    if (isActive) {
      const p = cycleTime / STREAK_DURATION; // 0 to 1
      const u = (p - 0.5) * 2; // -1 to 1

      // Smooth Hermite envelope for seamless Fade-In on entry and Fade-Out on exit
      const fadeIn = Math.min(1, p / 0.16);
      const fadeOut = Math.min(1, (1 - p) / 0.16);
      const sIn = fadeIn * fadeIn * (3 - 2 * fadeIn);
      const sOut = fadeOut * fadeOut * (3 - 2 * fadeOut);
      const envelope = Math.max(0, sIn * sOut);

      // Hyperbolic swoop through solar system space
      // Closest approach u=0 dips to (0, -12, 28) right in front of camera
      const rawX = u * 115;
      const rawY = 30 - (1 - u * u) * 44;
      const rawZ = u * 88 + (1 - u * u) * 26;

      const cosA = Math.cos(passAngle);
      const sinA = Math.sin(passAngle);
      const currX = rawX * cosA - rawZ * sinA;
      const currZ = rawX * sinA + rawZ * cosA;
      const currY = rawY;

      // Update head points (both core and coma) with fade envelope
      headPositions[0] = currX;
      headPositions[1] = currY;
      headPositions[2] = currZ;
      headPositions[3] = currX;
      headPositions[4] = currY;
      headPositions[5] = currZ;

      headColors[0] = 1.0 * envelope;
      headColors[1] = 1.0 * envelope;
      headColors[2] = 1.0 * envelope;
      headColors[3] = 0.4 * envelope;
      headColors[4] = 0.9 * envelope;
      headColors[5] = 1.0 * envelope;

      if (headGeoRef.current) {
        headGeoRef.current.attributes.position.needsUpdate = true;
        headGeoRef.current.attributes.color.needsUpdate = true;
      }

      if (lightRef.current) {
        lightRef.current.position.set(currX, currY, currZ);
        lightRef.current.intensity = envelope * (1 - Math.abs(u) * 0.7) * 4.8;
      }

      // SUB-STEP INTERPOLATION: Eliminates discrete dot spawning gaps!
      if (prevPosRef.current) {
        const pX = prevPosRef.current.x;
        const pY = prevPosRef.current.y;
        const pZ = prevPosRef.current.z;

        const moveDist = Math.hypot(currX - pX, currY - pY, currZ - pZ);
        // Step every 0.18 units to form a continuous luminous streamer
        const numSteps = Math.max(2, Math.min(8, Math.ceil(moveDist / 0.18)));

        // Solar wind direction: pushes ion tail away from the Sun (0, 0, 0)
        const sunDist = Math.hypot(currX, currY, currZ) || 1;
        const sunDirX = currX / sunDist;
        const sunDirY = currY / sunDist;
        const sunDirZ = currZ / sunDist;

        for (let s = 0; s < numSteps; s++) {
          const frac = s / numSteps;
          const interpX = pX + (currX - pX) * frac;
          const interpY = pY + (currY - pY) * frac;
          const interpZ = pZ + (currZ - pZ) * frac;

          // Spawn 2 particles per sub-step: 1 Ion tail + 1 Dust tail
          for (let type = 0; type < 2; type++) {
            const idx = spawnIndexRef.current;
            spawnIndexRef.current = (spawnIndexRef.current + 1) % TRAIL_POOL_SIZE;

            const isIon = type === 0;
            const spread = isIon ? 0.12 : (0.28 + Math.random() * 0.35);
            const ang = Math.random() * Math.PI * 2;

            trailPositions[idx * 3] = interpX + Math.cos(ang) * spread;
            trailPositions[idx * 3 + 1] = interpY + (Math.random() - 0.5) * spread;
            trailPositions[idx * 3 + 2] = interpZ + Math.sin(ang) * spread;

            trailAges[idx] = 0;
            trailLifetimes[idx] = isIon ? (1.6 + Math.random() * 0.6) : (2.4 + Math.random() * 0.8);
            trailScales[idx] = envelope;

            if (isIon) {
              trailDrift[idx * 3] = sunDirX * 1.5 + (Math.random() - 0.5) * 0.3;
              trailDrift[idx * 3 + 1] = sunDirY * 1.5 + (Math.random() - 0.5) * 0.3;
              trailDrift[idx * 3 + 2] = sunDirZ * 1.5 + (Math.random() - 0.5) * 0.3;
              trailColors[idx * 3] = 0.85;
              trailColors[idx * 3 + 1] = 0.98;
              trailColors[idx * 3 + 2] = 1.0;
            } else {
              trailDrift[idx * 3] = (Math.random() - 0.5) * 0.5;
              trailDrift[idx * 3 + 1] = (Math.random() - 0.5) * 0.4;
              trailDrift[idx * 3 + 2] = (Math.random() - 0.5) * 0.5;
              trailColors[idx * 3] = 0.98;
              trailColors[idx * 3 + 1] = 0.92;
              trailColors[idx * 3 + 2] = 0.75;
            }
          }
        }
      }

      prevPosRef.current = { x: currX, y: currY, z: currZ };
    } else {
      // Inactive window: head disappears
      headPositions[1] = -9999;
      headPositions[4] = -9999;
      if (headGeoRef.current) {
        headGeoRef.current.attributes.position.needsUpdate = true;
      }
      if (lightRef.current) {
        lightRef.current.intensity = 0;
      }
      prevPosRef.current = null;
    }

    // Always update all active lingering trail particles
    let hasActiveParticles = false;
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      if (trailAges[i] < trailLifetimes[i]) {
        hasActiveParticles = true;
        trailAges[i] += safeDelta;

        // Apply physical drift
        trailPositions[i * 3] += trailDrift[i * 3] * safeDelta;
        trailPositions[i * 3 + 1] += trailDrift[i * 3 + 1] * safeDelta;
        trailPositions[i * 3 + 2] += trailDrift[i * 3 + 2] * safeDelta;

        const lifeRatio = trailAges[i] / trailLifetimes[i];

        if (lifeRatio >= 1.0) {
          trailPositions[i * 3 + 1] = -9999;
          trailColors[i * 3] = 0;
          trailColors[i * 3 + 1] = 0;
          trailColors[i * 3 + 2] = 0;
        } else {
          // Smooth optical decay: White-Cyan -> Electric Sky Blue -> Royal Violet -> Invisible
          const fade = (1 - lifeRatio) * trailScales[i];
          if (lifeRatio < 0.22) {
            trailColors[i * 3] = 0.95 * fade;
            trailColors[i * 3 + 1] = 0.98 * fade;
            trailColors[i * 3 + 2] = 1.0 * fade;
          } else if (lifeRatio < 0.62) {
            trailColors[i * 3] = 0.22 * fade;
            trailColors[i * 3 + 1] = 0.85 * fade;
            trailColors[i * 3 + 2] = 1.0 * fade;
          } else {
            trailColors[i * 3] = 0.65 * fade;
            trailColors[i * 3 + 1] = 0.25 * fade;
            trailColors[i * 3 + 2] = 0.95 * fade;
          }
        }
      }
    }

    if (tailGeoRef.current && (isActive || hasActiveParticles)) {
      tailGeoRef.current.attributes.position.needsUpdate = true;
      tailGeoRef.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Blazing Comet Nucleus (Point Sprite with frustumCulled={false}) */}
      <points frustumCulled={false}>
        <bufferGeometry ref={headGeoRef}>
          <bufferAttribute attach="attributes-position" args={[headPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[headColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3.8}
          map={particleTexture}
          vertexColors
          transparent
          opacity={1.0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Point light tracking the comet head */}
      <pointLight ref={lightRef} color="#67e8f9" intensity={0} distance={45} decay={1.8} />

      {/* Continuous Sub-Stepped Lingering Trail (frustumCulled={false}) */}
      <points frustumCulled={false}>
        <bufferGeometry ref={tailGeoRef}>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.65}
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

      {/* Realistic Astronomical Background Stars (Multi-tier Morgan-Keenan stellar spectrum) */}
      <RealisticBackgroundStars />

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
