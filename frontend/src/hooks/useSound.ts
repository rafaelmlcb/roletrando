import { useCallback, useRef, useEffect } from 'react';
import Logger from '../utils/logger';

/**
 * Preloaded sounds used across the application.
 */
const SOUNDS = {
    spin: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Long spinning 
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    ticker: 'https://assets.mixkit.co/active_storage/sfx/1045/1045-preview.mp3', // Clock ticking 
    wheelTick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Crisp tick for wheel
    win: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

/**
 * Custom hook for managing and triggering audio playback.
 * Automatically pre-caches audio elements on mount to avoid buffering latency.
 * Contains optimizations like node cloning for rapid overlapping sounds (e.g., ticking wheels).
 * @returns { playSound, stopSound } Context methods to control audio.
 */
export const useSound = () => {
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        Logger.debug('useSound', 'Initializing audio pre-caching');
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioRefs.current[key] = audio;
        });
    }, []);

    const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
        const audio = audioRefs.current[soundName];
        if (audio) {
            // Overlapping sounds for rapid events
            if (soundName === 'wheelTick' || soundName === 'click') {
                const clone = audio.cloneNode() as HTMLAudioElement;
                clone.volume = soundName === 'wheelTick' ? 0.4 : 1.0;
                clone.play().catch(() => { });
            } else {
                audio.currentTime = 0;
                audio.play().catch(err => Logger.warn('useSound', `Audio playback error for ${soundName}`, err));
            }
        } else {
            new Audio(SOUNDS[soundName]).play().catch(() => { });
        }
    }, []);

    const stopSound = useCallback((soundName: keyof typeof SOUNDS) => {
        const audio = audioRefs.current[soundName];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, []);

    return { playSound, stopSound };
};
