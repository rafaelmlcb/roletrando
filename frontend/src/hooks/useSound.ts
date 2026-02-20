import { useCallback } from 'react';

const SOUNDS = {
    spin: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    ticker: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
    win: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export const useSound = () => {
    const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
        const audio = new Audio(SOUNDS[soundName]);
        audio.play().catch(err => console.log('Audio playback error:', err));
    }, []);

    return { playSound };
};
