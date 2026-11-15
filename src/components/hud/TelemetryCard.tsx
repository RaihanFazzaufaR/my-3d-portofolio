import React from 'react';
import type { PlanetData } from '../../data/portfolioData';

export interface TelemetryCardProps {
  activeTelemetry: PlanetData | null;
  isSunSelected: boolean;
  selectedPlanetId?: string;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  activeTelemetry,
  isSunSelected,
  selectedPlanetId,
}) => {
  return (
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
              <span>STATUS: {selectedPlanetId === activeTelemetry.id ? 'LOCKED' : 'TRACKING'}</span>
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
  );
};
