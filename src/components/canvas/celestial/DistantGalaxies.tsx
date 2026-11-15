import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getParticleTexture, getNebulaCloudTexture, createPrng } from '../../../utils/particleTextures';

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
        isCore = true;
        const rNorm = Math.pow(rng(), 1.5);
        const r = rNorm * (spec.radius * 0.22);
        const theta = rng() * Math.PI * 2;
        const phi = (rng() - 0.5) * Math.PI * 0.7;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.6);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else if (i < 1050) {
        const spokeIndex = Math.floor(rng() * 8);
        const spokeAngle = spokeIndex * (Math.PI / 4) + (rng() - 0.5) * 0.25;
        const r = (spec.radius * 0.22) + rng() * (spec.radius * 0.64);
        const jitter = (rng() - 0.5) * (1.2 + (r / spec.radius) * 1.5);
        x = Math.cos(spokeAngle) * r + Math.sin(spokeAngle) * jitter;
        y = (rng() - 0.5) * 1.6;
        z = Math.sin(spokeAngle) * r - Math.cos(spokeAngle) * jitter;
      } else {
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
        y = Math.sin(phi) * (r * 0.75);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else {
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
        isCore = true;
        const rNorm = Math.pow(rng(), 1.6);
        const r = rNorm * (spec.radius * 0.22);
        const theta = rng() * Math.PI * 2;
        const phi = (rng() - 0.5) * Math.PI * 0.7;
        x = Math.cos(theta) * Math.cos(phi) * r;
        y = Math.sin(phi) * (r * 0.65);
        z = Math.sin(theta) * Math.cos(phi) * r;
      } else {
        const rNorm = Math.sqrt(rng());
        const r = (spec.radius * 0.14) + rNorm * (spec.radius * 0.86);

        const pitch = 0.28;
        const spiralPhase = Math.log(Math.max(1, r / (spec.radius * 0.14))) / Math.tan(pitch);

        let theta = rng() * Math.PI * 2;
        if (rng() < 0.68) {
          const arm = rng() < 0.5 ? 0 : 1;
          const armCenter = arm * Math.PI + spiralPhase;
          const uA = Math.max(1e-6, rng());
          const uB = rng();
          const gauss = Math.sqrt(-2 * Math.log(uA)) * Math.cos(2 * Math.PI * uB);
          const armWidth = 0.22 + (r / spec.radius) * 0.32;
          theta = armCenter + gauss * armWidth;
        }

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
      const blend = rng();
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.94 + blend * 0.05;
      starColors[i * 3 + 2] = 0.72 + blend * 0.25;
    } else {
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

export const DistantGalaxies = memo(function DistantGalaxies() {
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
