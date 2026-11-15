import React, { useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData } from '../../../data/portfolioData';

type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;

const _worldPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _deltaMove = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _vOrigin = new THREE.Vector3(0, 0, 0);
const _vSunCam = new THREE.Vector3(1.8, 9.5, 22.0);
const _vSunTarget = new THREE.Vector3(3.2, 0, 0);
const _vIntroCam = new THREE.Vector3(0, 40, 66);

export interface CameraControllerProps {
  selectedPlanet: PlanetData | null;
  isSunSelected: boolean;
  viewMode: '3d' | 'top';
  isIntro: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  planetGroupsRef: React.RefObject<Map<string, THREE.Group>>;
}

export const CameraController = memo(function CameraController({
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

      if (selectedPlanet) {
        controls.minDistance = Math.max(7.0, selectedPlanet.size * 4.8);
        controls.maxDistance = Math.max(38.0, selectedPlanet.size * 25.0);
        controls.maxPolarAngle = Math.PI;
      } else if (isSunSelected) {
        controls.minDistance = 9.5;
        controls.maxDistance = 45.0;
        controls.maxPolarAngle = Math.PI / 2 + 0.15;
      } else if (viewMode === 'top') {
        controls.minDistance = 20.0;
        controls.maxDistance = 140.0;
        controls.maxPolarAngle = 0.05;
      } else {
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

    // 2. RADAR / TOP-DOWN MODE
    if (viewMode === 'top') {
      controls.target.set(0, 0, 0);
      if (isTransitioningRef.current) {
        const a = currentAzimuthRef.current;
        const topRadius = 72.0;
        const phi = 0.02;
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

        const offsetDist = Math.max(12.0, selectedPlanet.size * 8.5);

        // Capture from slightly left side (-X) and elevated (+Y)
        const leftAngle = -0.36; // ~20 degrees to the left of the frontal Z-axis
        const distH = offsetDist * 0.94;
        const unshiftedCamX = _worldPos.x + Math.sin(leftAngle) * distH;
        const unshiftedCamY = _worldPos.y + offsetDist * 0.44;
        const unshiftedCamZ = _worldPos.z + Math.cos(leftAngle) * distH;

        // Camera horizontal right vector (perpendicular to line of sight from camera to planet)
        const toPlanetX = _worldPos.x - unshiftedCamX;
        const toPlanetZ = _worldPos.z - unshiftedCamZ;
        const toPlanetDist = Math.hypot(toPlanetX, toPlanetZ) || 1;
        const rightX = -(toPlanetZ / toPlanetDist);
        const rightZ = toPlanetX / toPlanetDist;

        // Shift target and camera laterally to the right by ~28% of viewing distance
        // This frames the planet inside the left 60% viewport, leaving generous room for the 40% info card on the right
        const roomShift = offsetDist * 0.28;

        _camTarget.set(
          _worldPos.x + rightX * roomShift,
          _worldPos.y + selectedPlanet.size * 0.35,
          _worldPos.z + rightZ * roomShift
        );

        _desiredCamPos.set(
          unshiftedCamX + rightX * roomShift,
          unshiftedCamY,
          unshiftedCamZ + rightZ * roomShift
        );

        if (isTransitioningRef.current) {
          controls.target.lerp(_camTarget, safeDelta * 5);
          state.camera.position.lerp(_desiredCamPos, safeDelta * 3.5);

          if (controls.target.distanceTo(_camTarget) < 0.25) {
            isTransitioningRef.current = false;
            prevPlanetPosRef.current = _camTarget.clone();
          }
        } else {
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
        controls.target.lerp(_vSunTarget, safeDelta * 4);
        state.camera.position.lerp(_vSunCam, safeDelta * 3);
        if (state.camera.position.distanceTo(_vSunCam) < 0.25) {
          isTransitioningRef.current = false;
        }
      }
      controls.update();
      return;
    }

    // 5. DEFAULT 3D OVERVIEW MODE
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
