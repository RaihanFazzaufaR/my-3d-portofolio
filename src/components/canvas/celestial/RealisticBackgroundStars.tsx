import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getParticleTexture, createPrng } from '../../../utils/particleTextures';

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

export const RealisticBackgroundStars = memo(function RealisticBackgroundStars() {
  const groupRef = useRef<THREE.Group>(null!);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.0012;
      groupRef.current.rotation.x += delta * 0.0006;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Tier 1: Prominent Bright Stars */}
      <points raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STAR_TIER1.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[STAR_TIER1.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
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
      <points raycast={() => null}>
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
      <points raycast={() => null}>
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
