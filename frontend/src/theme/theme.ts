import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#10b981', // emerald-500
            light: '#34d399',
            dark: '#059669',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa',
            dark: '#2563eb',
        },
        background: {
            default: '#0a0f1e',
            paper: '#0f172a',
        },
        text: {
            primary: '#ffffff',
            secondary: '#94a3b8',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 900,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 800,
        },
        h3: {
            fontWeight: 800,
        },
        button: {
            fontWeight: 700,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 800,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#10b981',
                    '&:hover': {
                        backgroundColor: '#059669',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: alpha('#0f172a', 0.8),
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 24,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                },
            },
        },
    },
});
