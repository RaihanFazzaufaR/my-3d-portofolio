import { useState, useEffect, useCallback, useRef } from 'react';
import SolarSystem from './components/SolarSystem';
import {
  PLANETS,
  SUN_DATA,
  type PlanetData,
} from './data/portfolioData';
import {
  setSoundEnabled,
  playHoverSound,
  playSelectSound,
  playCloseSound,
  playSunSound,
} from './utils/audio';

export default function App() {
  const [isIntro, setIsIntro] = useState<boolean>(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [isSunSelected, setIsSunSelected] = useState<boolean>(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null);

  // Simulation controls
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'3d' | 'top'>('3d');
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [isCinematic, setIsCinematic] = useState<boolean>(false);

  // Skill filter state & custom dropdown menu state
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Copy notification state
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Toggle sound
  const handleToggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) playSelectSound();
      return next;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isIntro) {
          setIsIntro(false);
        } else {
          setSelectedPlanet(null);
          setIsSunSelected(false);
          playCloseSound();
        }
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsCinematic((prev) => !prev);
      }
      if (e.key === 'i' || e.key === 'I') {
        setIsIntro((prev) => !prev);
      }
      if (isIntro && (e.key === 'Enter' || e.key === ' ')) {
        setIsIntro(false);
        playSunSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isIntro]);

  // Cycle planets
  const handleNextPlanet = useCallback(() => {
    setSelectedPlanet((curr) => {
      if (!curr) {
        setIsSunSelected(false);
        playSelectSound();
        return PLANETS[0];
      }
      const idx = PLANETS.findIndex((p) => p.id === curr.id);
      const nextIdx = (idx + 1) % PLANETS.length;
      setIsSunSelected(false);
      playSelectSound();
      return PLANETS[nextIdx];
    });
  }, []);

  const handlePrevPlanet = useCallback(() => {
    setSelectedPlanet((curr) => {
      if (!curr) {
        setIsSunSelected(false);
        playSelectSound();
        return PLANETS[PLANETS.length - 1];
      }
      const idx = PLANETS.findIndex((p) => p.id === curr.id);
      const prevIdx = (idx - 1 + PLANETS.length) % PLANETS.length;
      setIsSunSelected(false);
      playSelectSound();
      return PLANETS[prevIdx];
    });
  }, []);

  const handleSelectPlanet = useCallback((planet: PlanetData | null) => {
    setSelectedPlanet(planet);
    setIsFilterDropdownOpen(false);
    if (planet) {
      setIsSunSelected(false);
      setIsIntro(false);
    } else {
      setIsSunSelected(false);
    }
  }, []);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  const handleSelectSun = useCallback(() => {
    setIsSunSelected(true);
    setSelectedPlanet(null);
    setIsIntro(false);
    playSunSound();
  }, []);

  const handleCopyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    playSelectSound();
    setTimeout(() => setCopyStatus(null), 2500);
  }, []);

  const handleHoverPlanet = useCallback((planet: PlanetData | null) => {
    setHoveredPlanet((prev) => (prev?.id === planet?.id ? prev : planet));
  }, []);

  // Target telemetry (active planet or hovered)
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
      {isIntro && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            playCloseSound();
            setIsIntro(false);
          }}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full p-6 sm:p-8 bg-slate-950/90 border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] text-center space-y-5 cursor-default backdrop-blur-xl"
          >
            {/* Close Button [X] */}
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                setIsIntro(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-mono transition cursor-pointer"
              title="Close briefing (ESC)"
            >
              [X]
            </button>

            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              MISSION BRIEFING // FLIGHT CLEARANCE
            </div>

            {/* Main Title & Subtitle */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-scifi">
                Raihan Fazzaufa Rasendriya
              </h1>
              <p className="text-xs sm:text-sm font-mono text-amber-400">
                Informatics Engineering Scholar & Full-Stack Developer
              </p>
            </div>

            {/* Mission Text */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto text-justify font-sans">
              Welcome aboard. This portfolio is engineered as an interactive Keplerian planetary system.
              Explore my technical instruments, timeline chronicles, active prototypes, and communication relays mapped across orbit.
            </p>

            {/* Three Pillar Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                Full-Stack Architecture
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                3D WebGL & Creative
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                Computer Vision & Systems
              </div>
            </div>

            {/* Flight Controls Tip */}
            <div className="py-2 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[10px] font-mono text-slate-400 flex flex-wrap justify-center gap-2 sm:gap-4">
              <span>Drag to Orbit</span>
              <span>•</span>
              <span>Scroll to Zoom</span>
              <span>•</span>
              <span>Click Planets to Follow</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playSunSound();
                  setIsIntro(false);
                }}
                className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer"
              >
                [ ENTER SOLAR SYSTEM ]
              </button>
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setIsIntro(false);
                  handleSelectPlanet(PLANETS[0]);
                }}
                className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs rounded-xl border border-slate-800 transition cursor-pointer"
              >
                Direct to Tech Stack
              </button>
            </div>

            {/* Quick Dismiss Tip */}
            <p className="text-[10px] font-mono text-slate-500">
              Click anywhere outside or press ESC to dismiss immediately
            </p>
          </div>
        </div>
      )}

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
          <header className="absolute top-0 left-0 right-0 p-3 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none">
            {/* Branding & Telemetry Header */}
            <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/92 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md">
              <button
                type="button"
                onClick={handleSelectSun}
                onMouseEnter={playHoverSound}
                className="relative group cursor-pointer"
                title="Inspect Creator Core"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 group-hover:scale-125 transition shadow-[0_0_12px_#f59e0b]" />
                <span className="absolute -inset-1 rounded-full bg-amber-400/20 group-hover:scale-125 transition" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs md:text-sm font-bold tracking-wider uppercase text-slate-100 font-scifi">
                    Raihan Fazzaufa
                  </h1>
                  <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[9px] font-mono">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] md:text-[11px] font-mono text-slate-400">
                  Solar Exploration Interface // {viewMode === 'top' ? 'ORBITAL RADAR' : '3D DEEP SPACE'}
                </p>
              </div>
            </div>

            {/* Quick Planet Selector Tabs */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-950/92 rounded-2xl border border-slate-800 shadow-md overflow-x-auto max-w-full">
              {/* Sun / Core Tab */}
              <button
                type="button"
                onClick={handleSelectSun}
                onMouseEnter={playHoverSound}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  isSunSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Core Bio</span>
              </button>

              {/* Planets */}
              {PLANETS.map((planet) => {
                const isSelected = selectedPlanet?.id === planet.id;
                return (
                  <button
                    key={planet.id}
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      handleSelectPlanet(planet);
                    }}
                    onMouseEnter={playHoverSound}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full transition-transform"
                      style={{
                        backgroundColor: planet.color,
                        boxShadow: isSelected ? `0 0 10px ${planet.color}` : 'none',
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                    <span>{planet.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulation Controls (Speed, Sound, View Mode) */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-950/92 rounded-2xl border border-slate-800 shadow-md text-xs">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                onMouseEnter={playHoverSound}
                className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] transition cursor-pointer ${
                  soundOn
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title={soundOn ? 'Mute Audio' : 'Enable Audio'}
                aria-label="Toggle Sound"
              >
                {soundOn ? 'AUDIO: ON' : 'AUDIO: OFF'}
              </button>

              {/* View Mode (3D vs Top) */}
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setViewMode(viewMode === '3d' ? 'top' : '3d');
                }}
                onMouseEnter={playHoverSound}
                className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] transition cursor-pointer ${
                  viewMode === 'top'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Toggle Radar Map View"
              >
                {viewMode === 'top' ? 'Radar Map' : '3D Orbit'}
              </button>

              {/* Orbit Speed Multiplier */}
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setSimulationSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0 : 1));
                }}
                onMouseEnter={playHoverSound}
                className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                title="Cycle Orbit Speed (1x / 2x / Pause)"
              >
                {simulationSpeed === 0 ? 'Paused' : simulationSpeed === 1 ? 'Speed 1x' : 'Speed 2x'}
              </button>

              {/* Intro Briefing Modal Toggle */}
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setIsIntro(true);
                }}
                onMouseEnter={playHoverSound}
                className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                title="Mission Briefing [I]"
              >
                Intro [I]
              </button>

              {/* Cinematic Mode */}
              <button
                type="button"
                onClick={() => setIsCinematic(true)}
                onMouseEnter={playHoverSound}
                className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
                title="Cinematic Mode (Hide UI) [C]"
              >
                Cinema [C]
              </button>
            </div>
          </header>

          {/* Left Telemetry HUD Card (Displays details on hover or lock) */}
          <aside className="absolute left-4 md:left-8 bottom-24 pointer-events-none hidden sm:block">
            <div className="pointer-events-auto bg-slate-950/92 p-4 rounded-2xl border border-slate-800 shadow-md w-64 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  TELEMETRY SENSOR
                </span>
                <span className="text-[10px] text-slate-500">REAL-TIME</span>
              </div>

              {activeTelemetry ? (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">TARGET:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: activeTelemetry.color }}
                      />
                      {activeTelemetry.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SECTOR:</span>
                    <span className="text-slate-400">{activeTelemetry.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ORBIT RADIUS:</span>
                    <span className="text-cyan-400">{activeTelemetry.distance.toFixed(1)} AU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VELOCITY:</span>
                    <span className="text-amber-400">{activeTelemetry.speed.toFixed(2)} AU/s</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>STATUS: {selectedPlanet?.id === activeTelemetry.id ? 'LOCKED' : 'TRACKING'}</span>
                    <span style={{ color: activeTelemetry.color }}>{activeTelemetry.color}</span>
                  </div>
                </div>
              ) : isSunSelected ? (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">TARGET:</span>
                    <span className="font-bold text-amber-300">CREATOR CORE (SUN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ENERGY OUTPUT:</span>
                    <span className="text-amber-400">100% MAXIMUM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">STATUS:</span>
                    <span className="text-emerald-400">OPERATIONAL</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-slate-500 italic text-[11px]">
                  Click or hover any celestial body to lock telemetry...
                </div>
              )}
            </div>
          </aside>

          {/* Interactive Observatory Radar (Bottom Left Mini-map) */}
          <div className="absolute left-4 bottom-4 pointer-events-none hidden lg:block">
            <div className="pointer-events-auto bg-slate-950/92 p-3 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3">
              <svg width="68" height="68" viewBox="-30 -30 60 60" className="overflow-visible">
                {/* Radar Grid Circles */}
                <circle cx="0" cy="0" r="28" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="0" cy="0" r="20" fill="none" stroke="#334155" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="12" fill="none" stroke="#334155" strokeWidth="0.8" />
                {/* Axis lines */}
                <line x1="-30" y1="0" x2="30" y2="0" stroke="#1e293b" strokeWidth="0.8" />
                <line x1="0" y1="-30" x2="0" y2="30" stroke="#1e293b" strokeWidth="0.8" />
                {/* Sun Center */}
                <circle
                  cx="0"
                  cy="0"
                  r="3.5"
                  fill="#f59e0b"
                  className="cursor-pointer hover:scale-150 transition"
                  onClick={handleSelectSun}
                />
                {/* Orbit dots mapped proportionally to planet distances */}
                {PLANETS.map((p) => {
                  const rad = 8.0 + ((p.distance - 7.0) / (40.0 - 7.0)) * 18.0;
                  const isCur = selectedPlanet?.id === p.id;
                  const angle = (p.distance * 2.5) % (Math.PI * 2);
                  const px = Math.cos(angle) * rad;
                  const py = Math.sin(angle) * rad;
                  return (
                    <g key={p.id}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isCur ? 3.5 : 2.2}
                        fill={p.color}
                        className="cursor-pointer hover:scale-150 transition"
                        onClick={() => {
                          playSelectSound();
                          handleSelectPlanet(p);
                        }}
                      />
                      {isCur && (
                        <circle
                          cx={px}
                          cy={py}
                          r="5.5"
                          fill="none"
                          stroke={p.color}
                          strokeWidth="1.2"
                          opacity="0.8"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                <div className="text-slate-200 font-bold">ORBITAL RADAR</div>
                <div>CLICK BLIP TO NAV</div>
                <div className="text-[9px] text-slate-500">4 BODIES TRACKED</div>
              </div>
            </div>
          </div>

          {/* Core / Sun Bio Drawer */}
          {isSunSelected && (
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Commander Bio"
              className="absolute top-20 right-4 md:right-8 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden bg-slate-950/95 border border-amber-500/40 rounded-3xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-6 pointer-events-auto"
            >
              <div className="p-6 pb-4 border-b border-slate-800 shrink-0 bg-slate-950/95 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    CORE
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                      {SUN_DATA.callsign}
                    </span>
                    <h2 className="text-xl font-bold text-white font-scifi">{SUN_DATA.name}</h2>
                    <p className="text-xs text-slate-400">{SUN_DATA.title}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playCloseSound();
                    setIsSunSelected(false);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
                {/* Bio summary */}
                <div className="py-4 border-b border-slate-800/80">
                  <p className="text-sm leading-relaxed text-slate-300 text-justify font-sans">{SUN_DATA.bio}</p>
                </div>

                {/* Quick Stat Grid */}
                <div className="py-4 grid grid-cols-2 gap-2.5 border-b border-slate-800/80">
                  {SUN_DATA.stats.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">{s.label}</div>
                      <div className="text-xs font-semibold text-slate-100 mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Philosophy list */}
                <div className="py-4 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-amber-400 tracking-wider">
                    Guiding Principles
                  </div>
                  {SUN_DATA.philosophies.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Action Buttons (Sticky Footer) */}
              <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/95 shrink-0 flex items-center justify-between z-10">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPlanet(PLANETS[0]);
                    playSelectSound();
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>Begin Orbit Tour</span>
                  <span>[View]</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPlanet(PLANETS.find((p) => p.id === 'contact') || null);
                    playSelectSound();
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-800 transition cursor-pointer"
                >
                  Transmit Message
                </button>
              </div>
            </aside>
          )}

          {/* Selected Planet Interactive Detail Drawer */}
          {selectedPlanet && (
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={selectedPlanet.name}
              className="absolute top-20 right-4 md:right-8 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-6 pointer-events-auto"
            >
              {/* Header (Sticky / Fixed at top) */}
              <div className="p-6 pb-4 border-b border-slate-800 shrink-0 bg-slate-950/95 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: selectedPlanet.color,
                        boxShadow: `0 0 10px ${selectedPlanet.color}`,
                      }}
                    />
                    <span
                      className="text-[10px] font-mono tracking-widest uppercase font-semibold"
                      style={{ color: selectedPlanet.color }}
                    >
                      {selectedPlanet.sector}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight font-scifi">{selectedPlanet.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedPlanet.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playCloseSound();
                    setSelectedPlanet(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close details"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body Container */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">

              {/* DYNAMIC PLANET CONTENT ACCORDING TO PLANET TYPE */}

              {/* 1. TECH STACK PLANET */}
              {selectedPlanet.id === 'skills' && selectedPlanet.skillsData && (
                <div className="py-4 space-y-4">
                  {/* Custom Option-Value Selector for Tech Stack */}
                  <div ref={filterDropdownRef} className="relative z-20">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        CATEGORY FILTER:
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {skillFilter === 'all'
                          ? `All (${selectedPlanet.skillsData.reduce((acc, c) => acc + c.skills.length, 0)} items)`
                          : `${selectedPlanet.skillsData.find((c) => c.title === skillFilter)?.skills.length || 0} items`}
                      </span>
                    </div>

                    {/* Custom Select Trigger Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        setIsFilterDropdownOpen((prev) => !prev);
                      }}
                      onMouseEnter={playHoverSound}
                      aria-haspopup="listbox"
                      aria-expanded={isFilterDropdownOpen}
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl flex items-center justify-between text-xs font-mono transition shadow-inner cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_#38bdf8]" />
                        <span className="text-white font-medium truncate">
                          {skillFilter === 'all' ? 'All Categories (Full Stack)' : skillFilter}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-sky-400 transition shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500 group-hover:text-sky-400">SELECT</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180 text-sky-400' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Custom Option Values Popup Menu */}
                    {isFilterDropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-slate-950/98 border border-sky-500/40 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-30 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
                      >
                        {/* Option: All Categories */}
                        <button
                          type="button"
                          role="option"
                          aria-selected={skillFilter === 'all'}
                          onClick={() => {
                            setSkillFilter('all');
                            setIsFilterDropdownOpen(false);
                            playSelectSound();
                          }}
                          onMouseEnter={playHoverSound}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                            skillFilter === 'all'
                              ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${skillFilter === 'all' ? 'bg-slate-950' : 'bg-slate-600'}`}
                            />
                            <span>All Categories</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              skillFilter === 'all'
                                ? 'bg-slate-950/20 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {selectedPlanet.skillsData.reduce((acc, c) => acc + c.skills.length, 0)} items
                          </span>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-slate-800/80 my-1" />

                        {/* Individual Category Options */}
                        {selectedPlanet.skillsData.map((cat, idx) => {
                          const isSelected = skillFilter === cat.title;
                          return (
                            <button
                              key={idx}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setSkillFilter(cat.title);
                                setIsFilterDropdownOpen(false);
                                playSelectSound();
                              }}
                              onMouseEnter={playHoverSound}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-sky-400/60'}`}
                                />
                                <span>{cat.title}</span>
                              </div>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  isSelected
                                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                {cat.skills.length} items
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Skills Grid */}
                  <div className="space-y-3">
                    {selectedPlanet.skillsData
                      .filter((cat) => skillFilter === 'all' || skillFilter === cat.title)
                      .map((cat, cIdx) => (
                        <div key={cIdx} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                          <div className="text-[11px] font-mono font-semibold text-sky-400 uppercase tracking-wider mb-2">
                            {cat.title}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.skills.map((skill, sIdx) => (
                              <div
                                key={sIdx}
                                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition hover:border-sky-400/50"
                              >
                                {skill.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. JOURNEY / TIMELINE PLANET */}
              {selectedPlanet.id === 'experience' && selectedPlanet.timelineData && (
                <div className="py-4 space-y-4">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-amber-400 before:to-amber-500/10">
                    {selectedPlanet.timelineData.map((item, idx) => (
                      <div key={idx} className="relative group">
                        {/* Milestone dot */}
                        <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400 group-hover:scale-125 transition" />
                        <div className="text-[10px] font-mono text-amber-400 font-semibold">{item.year}</div>
                        <h3 className="text-sm font-bold text-white mt-0.5">{item.role}</h3>
                        <div className="text-xs text-slate-400">{item.institution}</div>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 text-justify font-sans">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.badges.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. LAB & R&D (PROJECTS) PLANET */}
              {selectedPlanet.id === 'building' && selectedPlanet.projectsData && (
                <div className="py-4 space-y-3">
                  {selectedPlanet.projectsData.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                            {proj.type}
                          </span>
                          <h3 className="text-sm font-bold text-white">{proj.title}</h3>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-mono whitespace-nowrap ${
                            proj.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed text-justify font-sans">{proj.description}</p>

                      {proj.features && (
                        <div className="space-y-1 bg-slate-950/40 p-2.5 rounded-xl text-[11px] text-slate-300 font-sans">
                          {proj.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 text-justify">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.tech.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. COMMS / CONTACT PLANET */}
              {selectedPlanet.id === 'contact' && selectedPlanet.socialsData && (
                <div className="py-4 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed text-justify font-sans">
                    Ready to initiate contact? Transmit via sub-space channels or connect on developer platforms:
                  </p>

                  <div className="space-y-2">
                    {selectedPlanet.socialsData.map((social, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition"
                      >
                        <div>
                          <div className="text-[10px] font-mono text-rose-400 uppercase">{social.platform}</div>
                          <div className="text-xs font-semibold text-white">{social.handle}</div>
                        </div>

                        {social.type === 'copy' ? (
                          <button
                            type="button"
                            onClick={() => handleCopyText(social.handle, social.platform)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-xs font-semibold rounded-xl border border-rose-500/30 transition cursor-pointer"
                          >
                            {copyStatus === social.platform ? 'Copied' : 'Copy'}
                          </button>
                        ) : (
                          <a
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-xl transition flex items-center gap-1"
                          >
                            <span>Open</span>
                            <span className="font-mono text-[10px]">[Link]</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Direct Contact Action Box */}
                  <div className="p-4 bg-gradient-to-br from-rose-950/30 to-slate-900/60 rounded-2xl border border-rose-500/30 text-center space-y-2">
                    <div className="text-xs font-bold text-white">Direct Channel Open</div>
                    <p className="text-[11px] text-slate-400">Available for freelance, projects & full-time roles</p>
                    <button
                      type="button"
                      onClick={() => handleCopyText('fazzaufa94raihan@gmail.com', 'Quick Email')}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{copyStatus === 'Quick Email' ? 'Email Copied' : 'Copy fazzaufa94raihan@gmail.com'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Fallback Content (if any other planet) */}
              {!['skills', 'experience', 'building', 'contact'].includes(selectedPlanet.id) && selectedPlanet.content && (
                <div className="py-4 space-y-2.5">
                  {selectedPlanet.content.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: selectedPlanet.color }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>

              {/* Navigation Footer (Sticky / Fixed at bottom) */}
              <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/95 shrink-0 flex items-center justify-between text-xs z-10">
                <button
                  type="button"
                  onClick={handlePrevPlanet}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                >
                  ← Prev Planet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playCloseSound();
                    setSelectedPlanet(null);
                  }}
                  className="text-slate-400 hover:text-white transition cursor-pointer text-[11px]"
                >
                  Orbit Free Roam (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleNextPlanet}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                >
                  Next Planet →
                </button>
              </div>
            </aside>
          )}

          {/* Bottom HUD Hint Bar */}
          <footer className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none px-4">
            <div className="pointer-events-auto flex items-center gap-2 md:gap-3 px-4 py-2 bg-slate-950/92 rounded-full border border-slate-800 text-[11px] md:text-xs text-slate-400 shadow-md font-mono">
              <span>Drag to rotate</span>
              <span className="text-slate-700">•</span>
              <span>Scroll to zoom</span>
              <span className="text-slate-700">•</span>
              <span>Click planets or Sun</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500">Press [C] for Cinema</span>
              {(selectedPlanet || isSunSelected) && (
                <>
                  <span className="text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      playCloseSound();
                      setSelectedPlanet(null);
                      setIsSunSelected(false);
                    }}
                    className="text-amber-400 hover:underline cursor-pointer font-semibold"
                  >
                    Reset Target (Esc)
                  </button>
                </>
              )}
            </div>
          </footer>
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
