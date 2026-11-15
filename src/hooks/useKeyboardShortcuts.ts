import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onEscape: () => void;
  onToggleCinematic: () => void;
  onToggleIntro: () => void;
  onConfirmIntro: () => void;
  isIntro: boolean;
}

export function useKeyboardShortcuts({
  onEscape,
  onToggleCinematic,
  onToggleIntro,
  onConfirmIntro,
  isIntro,
}: KeyboardShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      } else if (e.key === 'c' || e.key === 'C') {
        onToggleCinematic();
      } else if (e.key === 'i' || e.key === 'I') {
        onToggleIntro();
      } else if (isIntro && (e.key === 'Enter' || e.key === ' ')) {
        onConfirmIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onToggleCinematic, onToggleIntro, onConfirmIntro, isIntro]);
}
