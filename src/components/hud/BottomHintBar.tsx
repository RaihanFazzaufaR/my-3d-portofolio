import React from 'react';

export interface BottomHintBarProps {
  isTargetActive: boolean;
  onResetTarget: () => void;
}

export const BottomHintBar: React.FC<BottomHintBarProps> = ({
  isTargetActive,
  onResetTarget,
}) => {
  return (
    <footer className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-3 px-4 py-2 bg-slate-950/92 rounded-full border border-slate-800 text-[11px] md:text-xs text-slate-400 shadow-md font-mono">
        <span>Drag to rotate</span>
        <span className="text-slate-700">•</span>
        <span>Scroll to zoom</span>
        <span className="text-slate-700">•</span>
        <span>Click planets or Sun</span>
        <span className="text-slate-700">•</span>
        <span className="text-slate-500">Press [C] for Cinema</span>
        {isTargetActive && (
          <>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={onResetTarget}
              className="text-amber-400 hover:underline cursor-pointer font-semibold"
            >
              Reset Target (Esc)
            </button>
          </>
        )}
      </div>
    </footer>
  );
};
