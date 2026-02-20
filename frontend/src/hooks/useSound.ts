import { useCallback } from 'react';

// Using more reliable URLs from assets.mixkit.co which worked before
const SOUNDS = {
    spin: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Spinning wheel
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Correct answer
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Wrong answer
    ticker: 'https://assets.mixkit.co/active_storage/sfx/1344/1344-preview.mp3', // Ticking sound
    win: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3', // Triumphant win
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Button click
};

export const useSound = () => {
    const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
        const audio = new Audio(SOUNDS[soundName]);
        audio.play().catch(err => console.log('Audio playback error:', err));
    }, []);

    return { playSound };
};
