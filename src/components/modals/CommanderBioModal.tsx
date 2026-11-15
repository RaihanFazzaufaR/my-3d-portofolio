import React from 'react';
import { SUN_DATA, PLANETS, type PlanetData } from '../../data/portfolioData';

export interface CommanderBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlanet: (planet: PlanetData) => void;
}

export const CommanderBioModal = React.memo(function CommanderBioModal({
  isOpen,
  onClose,
  onSelectPlanet,
}: CommanderBioModalProps) {
  if (!isOpen) return null;

  const contactPlanet = PLANETS.find((p) => p.id === 'contact') || null;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Commander Bio"
      style={{
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
        contain: 'paint layout',
      }}
      className="absolute top-20 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-[40%] min-w-[340px] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden bg-slate-950/95 border border-amber-500/40 rounded-3xl shadow-2xl pointer-events-auto"
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
          onClick={onClose}
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
          onClick={() => onSelectPlanet(PLANETS[0])}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <span>Begin Orbit Tour</span>
          <span>[View]</span>
        </button>
        {contactPlanet && (
          <button
            type="button"
            onClick={() => onSelectPlanet(contactPlanet)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-800 transition cursor-pointer"
          >
            Transmit Message
          </button>
        )}
      </div>
    </aside>
  );
});
