import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getParticleTexture } from '../../../utils/particleTextures';

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
    GALAXY_COLORS[i * 3] = 0.22;
    GALAXY_COLORS[i * 3 + 1] = 0.82;
    GALAXY_COLORS[i * 3 + 2] = 1.0;
  } else if (colorType === 1) {
    GALAXY_COLORS[i * 3] = 0.65;
    GALAXY_COLORS[i * 3 + 1] = 0.35;
    GALAXY_COLORS[i * 3 + 2] = 0.98;
  } else if (colorType === 2) {
    GALAXY_COLORS[i * 3] = 0.95;
    GALAXY_COLORS[i * 3 + 1] = 0.25;
    GALAXY_COLORS[i * 3 + 2] = 0.65;
  } else if (colorType === 3) {
    GALAXY_COLORS[i * 3] = 0.98;
    GALAXY_COLORS[i * 3 + 1] = 0.72;
    GALAXY_COLORS[i * 3 + 2] = 0.25;
  } else if (colorType === 4) {
    GALAXY_COLORS[i * 3] = 0.25;
    GALAXY_COLORS[i * 3 + 1] = 0.45;
    GALAXY_COLORS[i * 3 + 2] = 0.95;
  } else {
    GALAXY_COLORS[i * 3] = 0.92;
    GALAXY_COLORS[i * 3 + 1] = 0.95;
    GALAXY_COLORS[i * 3 + 2] = 1.0;
  }
}

export const CosmicGalaxy = memo(function CosmicGalaxy() {
  const galaxyRef = useRef<THREE.Group>(null!);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  useFrame((_, delta) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <group ref={galaxyRef} rotation={[0.42, 0.25, 0.15]}>
      <points raycast={() => null}>
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
