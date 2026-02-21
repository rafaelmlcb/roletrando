import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { dataApi } from '../utils/api';

interface ThemeContextType {
    availableThemes: string[];
    selectedTheme: string;
    defaultTheme: string;
    setSelectedTheme: (theme: string) => void;
    themesLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);
    const [defaultTheme, setDefaultTheme] = useState('default');
    const [selectedTheme, setSelectedThemeState] = useState(
        () => localStorage.getItem('game_theme') ?? 'default'
    );
    const [themesLoading, setThemesLoading] = useState(true);

    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const res = await dataApi.get('/themes');
                setAvailableThemes(res.data.themes ?? []);
                const serverDefault = res.data.defaultTheme ?? 'default';
                setDefaultTheme(serverDefault);
                // If localStorage has no selection, use server default
                if (!localStorage.getItem('game_theme')) {
                    setSelectedThemeState(serverDefault);
                }
            } catch (e) {
                console.error('Failed to load themes', e);
                setAvailableThemes(['default']);
            } finally {
                setThemesLoading(false);
            }
        };
        fetchThemes();
    }, []);

    const setSelectedTheme = (theme: string) => {
        localStorage.setItem('game_theme', theme);
        setSelectedThemeState(theme);
    };

    return (
        <ThemeContext.Provider value={{ availableThemes, selectedTheme, defaultTheme, setSelectedTheme, themesLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
