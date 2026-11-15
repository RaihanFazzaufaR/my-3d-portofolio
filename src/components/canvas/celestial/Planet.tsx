import { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData, MoonData } from '../../../data/portfolioData';
import { playHoverSound, playSelectSound } from '../../../utils/audio';
import { getPlanetTextures } from '../../../utils/planetTextures';

export interface PlanetMoonsProps {
  moons: MoonData[];
  simulationSpeed: number;
}

export const PlanetMoons = memo(function PlanetMoons({ moons, simulationSpeed }: PlanetMoonsProps) {
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
          {/* Faint Orbit Ring for Moon */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[moon.distance - 0.02, moon.distance + 0.02, 64]} />
            <meshBasicMaterial
              color={moon.color || '#94a3b8'}
              opacity={0.16}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Moon Celestial Body */}
          <mesh
            raycast={() => null}
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

export interface PlanetProps {
  planet: PlanetData;
  isSelected: boolean;
  simulationSpeed: number;
  onSelect: (planet: PlanetData) => void;
  onHover?: (planet: PlanetData | null) => void;
  onRegisterGroup?: (id: string, group: THREE.Group | null) => void;
}

export const Planet = memo(function Planet({
  planet,
  isSelected,
  simulationSpeed,
  onSelect,
  onHover,
  onRegisterGroup,
}: PlanetProps) {
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
      const targetScale = isSelected ? 1.25 : isHovered ? 1.15 : 1.0;
      if (Math.abs(meshRef.current.scale.x - targetScale) > 0.002) {
        const s = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, safeDelta * 8);
        meshRef.current.scale.set(s, s, s);
      }
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
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
        <mesh scale={1.08} raycast={() => null}>
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
          <mesh rotation={[Math.PI / 3, Math.PI / 8, 0]} raycast={() => null}>
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

        {/* Multi-Moon System */}
        {planet.moons && planet.moons.length > 0 && (
          <PlanetMoons moons={planet.moons} simulationSpeed={simulationSpeed} />
        )}

        {/* Sci-Fi Target Identification HUD (Visible when hovered or clicked) */}
        {(isSelected || isHovered) && (
          <Html
            position={[0, planet.size + 0.35, 0]}
            center
            className="pointer-events-none select-none z-30"
          >
            <div
              className="w-[220px] p-3 rounded-2xl border text-left pointer-events-none transition-transform duration-300 ease-out shadow-lg"
              style={{
                backgroundColor: 'rgba(5, 8, 22, 0.95)',
                borderColor: `${planet.color}99`,
                boxShadow: `0 4px 20px ${planet.color}30`,
                transform: isSelected ? 'translate(0, -68%) scale(1.02)' : 'translate(0, -60%)',
              }}
            >
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

              <h3 className="text-sm font-bold uppercase tracking-wider font-scifi text-white leading-tight">
                {planet.name}
              </h3>

              <p className="text-[10px] text-slate-300 font-mono line-clamp-1 mt-0.5">
                {planet.subtitle}
              </p>

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
