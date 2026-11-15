import React from 'react';
import { PLANETS, type PlanetData } from '../../data/portfolioData';

export interface ObservatoryRadarProps {
  selectedPlanetId?: string;
  onSelectSun: () => void;
  onSelectPlanet: (planet: PlanetData) => void;
}

export const ObservatoryRadar: React.FC<ObservatoryRadarProps> = ({
  selectedPlanetId,
  onSelectSun,
  onSelectPlanet,
}) => {
  return (
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
            onClick={onSelectSun}
          />
          {/* Orbit dots mapped proportionally to planet distances */}
          {PLANETS.map((p) => {
            const rad = 8.0 + ((p.distance - 7.0) / (40.0 - 7.0)) * 18.0;
            const isCur = selectedPlanetId === p.id;
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
                  onClick={() => onSelectPlanet(p)}
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
  );
};
