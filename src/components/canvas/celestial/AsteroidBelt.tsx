import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
export const AsteroidBelt = memo(function AsteroidBelt() {
  const pointsRef = useRef<THREE.Points>(null!);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <points ref={pointsRef} raycast={() => null}>
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
