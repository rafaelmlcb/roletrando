import React, { type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

interface DesignSystemProviderProps {
    children: ReactNode;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
