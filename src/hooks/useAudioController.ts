import { useState, useCallback } from 'react';
import {
  setSoundEnabled,
  playHoverSound,
  playSelectSound,
  playCloseSound,
  playSunSound,
} from '../utils/audio';

export interface AudioController {
  soundOn: boolean;
  toggleSound: () => void;
  playHover: () => void;
  playSelect: () => void;
  playClose: () => void;
  playSun: () => void;
}

export function useAudioController(): AudioController {
  const [soundOn, setSoundOn] = useState<boolean>(false);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) playSelectSound();
      return next;
    });
  }, []);

  const playHover = useCallback(() => {
    playHoverSound();
  }, []);

  const playSelect = useCallback(() => {
    playSelectSound();
  }, []);

  const playClose = useCallback(() => {
    playCloseSound();
  }, []);

  const playSun = useCallback(() => {
    playSunSound();
  }, []);

  return {
    soundOn,
    toggleSound,
    playHover,
    playSelect,
    playClose,
    playSun,
  };
}
