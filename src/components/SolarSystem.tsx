import { useRef, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS, type PlanetData } from '../data/portfolioData';
import { playCloseSound } from '../utils/audio';

// Modular Celestial & Environment Components
import { Sun } from './canvas/celestial/Sun';
import { Planet } from './canvas/celestial/Planet';
import { AsteroidBelt } from './canvas/celestial/AsteroidBelt';
import { RealisticBackgroundStars } from './canvas/celestial/RealisticBackgroundStars';
import { CosmicNebulae } from './canvas/celestial/CosmicNebulaClouds';
import { CosmicGalaxy } from './canvas/celestial/CosmicGalaxy';
import { DistantGalaxies } from './canvas/celestial/DistantGalaxies';
import { CosmicComet } from './canvas/celestial/CosmicComet';
import { CameraController } from './canvas/controllers/CameraController';

type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;

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

export const SolarSystem = memo(function SolarSystem({
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
