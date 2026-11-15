import React, { useRef, useState, useMemo, memo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { playHoverSound, playSunSound } from '../../../utils/audio';
import { getSunTexture } from '../../../utils/planetTextures';

export interface SunProps {
  isSunSelected: boolean;
  onSelectSun: () => void;
}

export const Sun = memo(function Sun({ isSunSelected, onSelectSun }: SunProps) {
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
      <mesh scale={1.15} raycast={() => null}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={isSunSelected ? 0.38 : sunHovered ? 0.28 : 0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sci-Fi Target Identification HUD for Sun Core (Visible only on hover when not selected) */}
      {!isSunSelected && sunHovered && (
        <Html
          position={[0, 3.4, 0]}
          center
          className="pointer-events-none select-none z-30"
        >
          <div
            className="w-[220px] p-3 rounded-2xl border text-left pointer-events-none transition-transform duration-300 ease-out shadow-lg"
            style={{
              backgroundColor: 'rgba(5, 8, 22, 0.95)',
              borderColor: 'rgba(245, 158, 11, 0.7)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
              transform: 'translate(0, -60%)',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
              <span className="text-[9px] font-mono tracking-widest text-amber-400 uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                SYSTEM CORE
              </span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase">
                {isSunSelected ? 'LOCKED' : 'ONLINE'}
              </span>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wider font-scifi text-white leading-tight">
              Raihan Fazzaufa
            </h3>

            <p className="text-[10px] text-slate-300 font-mono line-clamp-1 mt-0.5">
              Full-Stack & Systems Engineer
            </p>

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
