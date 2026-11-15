import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getParticleTexture } from '../../../utils/particleTextures';

const TRAIL_POOL_SIZE = 900;

export const CosmicComet = memo(function CosmicComet() {
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

          // Spawn 2 particles per sub-step: Ion Streamer + Dust Puff
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
