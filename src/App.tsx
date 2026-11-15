import { useState, useCallback } from 'react';
import SolarSystem from './components/SolarSystem';
import { PLANETS, type PlanetData } from './data/portfolioData';
import { useAudioController } from './hooks/useAudioController';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { TopNav } from './components/hud/TopNav';
import { TelemetryCard } from './components/hud/TelemetryCard';
import { ObservatoryRadar } from './components/hud/ObservatoryRadar';
import { BottomHintBar } from './components/hud/BottomHintBar';
import { IntroMissionModal } from './components/modals/IntroMissionModal';
import { CommanderBioModal } from './components/modals/CommanderBioModal';
import { ProjectDetailModal } from './components/modals/ProjectDetailModal';

export default function App() {
  const [isIntro, setIsIntro] = useState<boolean>(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isSunSelected, setIsSunSelected] = useState<boolean>(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null);

  // Simulation controls
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'3d' | 'top'>('3d');
  const [isCinematic, setIsCinematic] = useState<boolean>(false);

  // Copy notification state
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Audio controller abstraction
  const { soundOn, toggleSound, playHover, playSelect, playClose, playSun } = useAudioController();

  // Celestial selection handlers
  const handleSelectSun = useCallback(() => {
    setIsSunSelected(true);
    setSelectedPlanet(null);
    setIsIntro(false);
    playSun();
  }, [playSun]);

  const handleSelectPlanet = useCallback((planet: PlanetData | null) => {
    setSelectedPlanet(planet);
    if (planet) {
      setIsSunSelected(false);
      setIsIntro(false);
    } else {
      setIsSunSelected(false);
    }
  }, []);

  const handleResetTarget = useCallback(() => {
    playClose();
    setSelectedPlanet(null);
    setIsSunSelected(false);
  }, [playClose]);

  // Planet cycle handlers
  const handleNextPlanet = useCallback(() => {
    setSelectedPlanet((curr) => {
      if (!curr) {
        setIsSunSelected(false);
        playSelect();
        return PLANETS[0];
      }
      const idx = PLANETS.findIndex((p) => p.id === curr.id);
      const nextIdx = (idx + 1) % PLANETS.length;
      setIsSunSelected(false);
      playSelect();
      return PLANETS[nextIdx];
    });
  }, [playSelect]);

  const handlePrevPlanet = useCallback(() => {
    setSelectedPlanet((curr) => {
      if (!curr) {
        setIsSunSelected(false);
        playSelect();
        return PLANETS[PLANETS.length - 1];
      }
      const idx = PLANETS.findIndex((p) => p.id === curr.id);
      const prevIdx = (idx - 1 + PLANETS.length) % PLANETS.length;
      setIsSunSelected(false);
      playSelect();
      return PLANETS[prevIdx];
    });
  }, [playSelect]);

  const handleHoverPlanet = useCallback((planet: PlanetData | null) => {
    setHoveredPlanet((prev) => (prev?.id === planet?.id ? prev : planet));
  }, []);

  // Text copy handler
  const handleCopyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    playSelect();
    setTimeout(() => setCopyStatus(null), 2500);
  }, [playSelect]);

  // Keyboard controls abstraction
  useKeyboardShortcuts({
    isIntro,
    onEscape: () => {
      if (isIntro) {
        setIsIntro(false);
        playClose();
      } else {
        handleResetTarget();
      }
    },
    onToggleCinematic: () => setIsCinematic((prev) => !prev),
    onToggleIntro: () => setIsIntro((prev) => !prev),
    onConfirmIntro: () => {
      setIsIntro(false);
      playSun();
    },
  });

  const activeTelemetry = selectedPlanet || hoveredPlanet;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050816] text-white font-sans select-none">
      {/* 3D Solar Canvas */}
      <div className="absolute inset-0 z-0">
        <SolarSystem
          selectedPlanet={selectedPlanet}
          isSunSelected={isSunSelected}
          onSelectPlanet={handleSelectPlanet}
          onSelectSun={handleSelectSun}
          simulationSpeed={simulationSpeed}
          viewMode={viewMode}
          isIntro={isIntro}
          onHoverPlanet={handleHoverPlanet}
        />
      </div>

      {/* Introduction Modal Landing Terminal */}
      <IntroMissionModal
        isOpen={isIntro}
        onClose={() => {
          playClose();
          setIsIntro(false);
        }}
        onEnterSolarSystem={() => {
          playSun();
          setIsIntro(false);
        }}
        onDirectToTechStack={() => {
          playSelect();
          setIsIntro(false);
          handleSelectPlanet(PLANETS[0]);
        }}
      />

      {/* Cinematic toggle indicator when hidden */}
      {isCinematic && (
        <button
          type="button"
          onClick={() => setIsCinematic(false)}
          className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-300 rounded-full border border-slate-700 transition cursor-pointer flex items-center gap-2 shadow-xl"
        >
          <span>[C] Exit Cinematic Mode</span>
        </button>
      )}

      {/* Main HUD Overlays (hidden in cinematic mode) */}
      {!isCinematic && (
        <div className="hud-layer absolute inset-0 z-10 pointer-events-none">
          {/* Top Bar: Telemetry, Branding & Planet Quick Nav */}
          <TopNav
            selectedPlanet={selectedPlanet}
            isSunSelected={isSunSelected}
            viewMode={viewMode}
            simulationSpeed={simulationSpeed}
            soundOn={soundOn}
            onSelectSun={handleSelectSun}
            onSelectPlanet={(planet) => {
              playSelect();
              handleSelectPlanet(planet);
            }}
            onToggleSound={toggleSound}
            onToggleViewMode={() => {
              playSelect();
              setViewMode((prev) => (prev === '3d' ? 'top' : '3d'));
            }}
            onCycleSpeed={() => {
              playSelect();
              setSimulationSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0 : 1));
            }}
            onOpenIntro={() => {
              playSelect();
              setIsIntro(true);
            }}
            onEnterCinema={() => setIsCinematic(true)}
            onHover={playHover}
          />

          {/* Left Telemetry HUD Card */}
          <TelemetryCard
            activeTelemetry={activeTelemetry}
            isSunSelected={isSunSelected}
            selectedPlanetId={selectedPlanet?.id}
          />

          {/* Interactive Observatory Radar (Bottom Left Mini-map) */}
          <ObservatoryRadar
            selectedPlanetId={selectedPlanet?.id}
            onSelectSun={handleSelectSun}
            onSelectPlanet={(planet) => {
              playSelect();
              handleSelectPlanet(planet);
            }}
          />

          {/* Commander Bio Modal (Sun) */}
          <CommanderBioModal
            isOpen={isSunSelected}
            onClose={() => {
              playClose();
              setIsSunSelected(false);
            }}
            onSelectPlanet={(planet) => {
              playSelect();
              handleSelectPlanet(planet);
            }}
          />

          {/* Selected Planet Interactive Detail Drawer */}
          <ProjectDetailModal
            planet={selectedPlanet}
            onClose={() => {
              playClose();
              setSelectedPlanet(null);
            }}
            onPrevPlanet={handlePrevPlanet}
            onNextPlanet={handleNextPlanet}
            onCopyText={handleCopyText}
            copyStatus={copyStatus}
            onPlaySelect={playSelect}
            onPlayHover={playHover}
          />

          {/* Bottom HUD Hint Bar */}
          <BottomHintBar
            isTargetActive={Boolean(selectedPlanet || isSunSelected)}
            onResetTarget={handleResetTarget}
          />
        </div>
      )}

      {/* Global Copy Toast */}
      {copyStatus && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 font-mono">
          <span>{copyStatus} copied to clipboard</span>
        </div>
      )}
    </main>
  );
}
