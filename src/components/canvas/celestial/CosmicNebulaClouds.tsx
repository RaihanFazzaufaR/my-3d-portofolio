import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getNebulaCloudTexture } from '../../../utils/particleTextures';

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

export const CosmicNebulae = memo(function CosmicNebulae() {
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
            <points raycast={() => null}>
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
