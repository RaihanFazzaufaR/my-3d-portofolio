import React from 'react';
import { PLANETS, type PlanetData } from '../../data/portfolioData';

export interface TopNavProps {
  selectedPlanet: PlanetData | null;
  isSunSelected: boolean;
  viewMode: '3d' | 'top';
  simulationSpeed: number;
  soundOn: boolean;
  onSelectSun: () => void;
  onSelectPlanet: (planet: PlanetData) => void;
  onToggleSound: () => void;
  onToggleViewMode: () => void;
  onCycleSpeed: () => void;
  onOpenIntro: () => void;
  onEnterCinema: () => void;
  onHover: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  selectedPlanet,
  isSunSelected,
  viewMode,
  simulationSpeed,
  soundOn,
  onSelectSun,
  onSelectPlanet,
  onToggleSound,
  onToggleViewMode,
  onCycleSpeed,
  onOpenIntro,
  onEnterCinema,
  onHover,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 p-3 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none">
      {/* Branding & Telemetry Header */}
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/92 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={onSelectSun}
          onMouseEnter={onHover}
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
          onClick={onSelectSun}
          onMouseEnter={onHover}
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
              onClick={() => onSelectPlanet(planet)}
              onMouseEnter={onHover}
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
          onClick={onToggleSound}
          onMouseEnter={onHover}
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
          onClick={onToggleViewMode}
          onMouseEnter={onHover}
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
          onClick={onCycleSpeed}
          onMouseEnter={onHover}
          className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Cycle Orbit Speed (1x / 2x / Pause)"
        >
          {simulationSpeed === 0 ? 'Paused' : simulationSpeed === 1 ? 'Speed 1x' : 'Speed 2x'}
        </button>

        {/* Intro Briefing Modal Toggle */}
        <button
          type="button"
          onClick={onOpenIntro}
          onMouseEnter={onHover}
          className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Mission Briefing [I]"
        >
          Intro [I]
        </button>

        {/* Cinematic Mode */}
        <button
          type="button"
          onClick={onEnterCinema}
          onMouseEnter={onHover}
          className="px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
          title="Cinematic Mode (Hide UI) [C]"
        >
          Cinema [C]
        </button>
      </div>
    </header>
  );
};
