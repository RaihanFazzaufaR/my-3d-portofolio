import React from 'react';

export interface IntroMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterSolarSystem: () => void;
  onDirectToTechStack: () => void;
}

export const IntroMissionModal: React.FC<IntroMissionModalProps> = ({
  isOpen,
  onClose,
  onEnterSolarSystem,
  onDirectToTechStack,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full p-6 sm:p-8 bg-slate-950/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] text-center space-y-5 cursor-default"
      >
        {/* Close Button [X] */}
        <button
          type="button"
          onClick={onClose}
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
            onClick={onEnterSolarSystem}
            className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer"
          >
            [ ENTER SOLAR SYSTEM ]
          </button>
          <button
            type="button"
            onClick={onDirectToTechStack}
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
  );
};
