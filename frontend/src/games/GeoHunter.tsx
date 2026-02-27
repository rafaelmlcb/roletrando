import React, { useState, useEffect, useCallback, useRef } from 'react';
import DeckGL, { FlyToInterpolator } from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Timer, Trophy, ArrowLeft, Info, Search } from 'lucide-react';
import { Box, Typography, Container, alpha, Button, IconButton, CircularProgress } from '@mui/material';
import { dataApi } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// --- Types ---
interface Target {
    id: string;
    name: string;
    location: {
        longitude: number;
        latitude: number;
    };
    clues: string[];
}

const INITIAL_VIEW_STATE = {
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
    transitionDuration: 0,
    transitionInterpolator: null
};

const GeoHunter: React.FC = () => {
    const navigate = useNavigate();
    const { selectedTheme } = useTheme();
    const [target, setTarget] = useState<Target | null>(null);
    const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);
    const [gameStatus, setGameStatus] = useState<'loading' | 'idle' | 'playing' | 'revealing' | 'won' | 'lost'>('loading');
    const [timeLeft, setTimeLeft] = useState(100);
    const [currentClue, setCurrentClue] = useState(0);
    const [pulseRadius, setPulseRadius] = useState(10);
    const [isPinVisible, setIsPinVisible] = useState(false);

    // Timer interval ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize random target from Backend
    useEffect(() => {
        const fetchTargets = async () => {
            try {
                setGameStatus('loading');
                const response = await dataApi.get('/geohunter/targets', {
                    params: { theme: selectedTheme }
                });
                const targets: Target[] = response.data;

                if (targets && targets.length > 0) {
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    setTarget(randomTarget);
                    // Start view global enough to see the whole world but centered somewhat near the target
                    setViewState({
                        ...INITIAL_VIEW_STATE,
                        longitude: randomTarget.location.longitude + (Math.random() * 40 - 20),
                        latitude: randomTarget.location.latitude + (Math.random() * 40 - 20),
                        zoom: 2
                    });
                    setGameStatus('idle');
                } else {
                    console.error('No targets found for GeoHunter');
                    setGameStatus('lost'); // Or some error state
                }
            } catch (error) {
                console.error('Failed to fetch GeoHunter targets', error);
                setGameStatus('lost');
            }
        };

        fetchTargets();
    }, [selectedTheme]);

    // Initial movement detection
    const onViewStateChange = useCallback(({ viewState: nextViewState }: any) => {
        if (gameStatus === 'revealing') return; // Protect reveal transition

        setViewState(nextViewState);
        if (gameStatus === 'idle') {
            setGameStatus('playing');
        }

        // Pin visibility logic
        if (gameStatus === 'playing' || gameStatus === 'idle') {
            setIsPinVisible(nextViewState.zoom > 16.5);
        }
    }, [gameStatus]);

    // Timer Logic
    useEffect(() => {
        if (gameStatus === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameStatus('revealing');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameStatus]);

    // Reveal Logic: when time's up, pan to target and wait 10s
    useEffect(() => {
        if (gameStatus === 'revealing' && target) {
            setViewState({
                ...viewState,
                longitude: target.location.longitude,
                latitude: target.location.latitude,
                zoom: 18,
                transitionDuration: 3000,
                transitionInterpolator: new FlyToInterpolator()
            });
            setIsPinVisible(true);

            const timer = setTimeout(() => {
                setGameStatus('lost');
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [gameStatus, target]);

    // Clue Logic
    useEffect(() => {
        if (gameStatus === 'playing') {
            const index = Math.min(9, Math.floor((100 - timeLeft) / 10));
            setCurrentClue(index);
        }
    }, [timeLeft, gameStatus]);

    // Pulse animation logic
    useEffect(() => {
        const pulseInterval = setInterval(() => {
            setPulseRadius(prev => (prev >= 60 ? 10 : prev + 2));
        }, 50);
        return () => clearInterval(pulseInterval);
    }, []);

    const handleWin = () => {
        if (gameStatus === 'playing' && isPinVisible) {
            setGameStatus('won');
        }
    };

    const layers: any[] = [
        new ScatterplotLayer({
            id: 'pulse-layer',
            data: target ? [target.location] : [],
            getPosition: (d: any) => [d.longitude, d.latitude],
            getFillColor: [16, 185, 129, isPinVisible ? 100 : 0],
            getRadius: pulseRadius * 2,
            pickable: false,
            visible: isPinVisible,
            updateTriggers: {
                getRadius: [pulseRadius],
                getFillColor: [isPinVisible],
                data: [target]
            }
        }),
        new ScatterplotLayer({
            id: 'treasure-pin',
            data: target ? [target.location] : [],
            getPosition: (d: any) => [d.longitude, d.latitude],
            getFillColor: [16, 185, 129, isPinVisible ? 255 : 0],
            getRadius: 15,
            pickable: true,
            onClick: handleWin,
            visible: isPinVisible,
            updateTriggers: {
                getFillColor: [isPinVisible],
                data: [target]
            }
        })
    ];

    if (gameStatus === 'loading') {
        return (
            <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
                <CircularProgress color="primary" />
                <Typography sx={{ ml: 2, color: 'white' }}>Carregando Missão...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100vw', height: '100vh', position: 'relative', bgcolor: '#0f172a', overflow: 'hidden' }}>

            {/* Map Layer */}
            <DeckGL
                viewState={viewState}
                onViewStateChange={onViewStateChange}
                controller={true}
                layers={layers}
                getCursor={() => isPinVisible ? 'pointer' : 'grab'}
            >
                <Map
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                />
            </DeckGL>

            {/* UI Overlay */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 3, pointerEvents: 'none', zIndex: 10 }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                    {/* Header Info */}
                    <Box component={motion.div} initial={{ y: -50 }} animate={{ y: 0 }} sx={{ pointerEvents: 'auto' }}>
                        <IconButton
                            onClick={() => navigate('/')}
                            sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', mb: 2, '&:hover': { bgcolor: alpha('#10b981', 0.2) } }}
                        >
                            <ArrowLeft size={24} />
                        </IconButton>
                        <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', p: 2, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', minWidth: 200 }}>
                            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>GeoHunter</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>O TESOURO OCULTO NOS DADOS</Typography>
                        </Box>
                    </Box>

                    {/* Stats & Timer */}
                    <Box sx={{ display: 'flex', gap: 2, pointerEvents: 'auto' }}>
                        <Box component={motion.div} initial={{ y: -50 }} animate={{ y: 0 }} transition={{ delay: 0.1 }} sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', px: 3, py: 2, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 0.5 }}>
                                <Timer size={18} color="#f59e0b" />
                                <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary' }}>TEMPO</Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: timeLeft < 20 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                                {timeLeft}s
                            </Typography>
                        </Box>

                        <Box component={motion.div} initial={{ y: -50 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', px: 3, py: 2, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', textAlign: 'center', minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 0.5 }}>
                                <Trophy size={18} color="#3b82f6" />
                                <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary' }}>SCORE</Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', fontFamily: 'monospace' }}>
                                {timeLeft * 10}
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Clue Area */}
            <Box sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, px: 3, zIndex: 10, pointerEvents: 'none' }}>
                <AnimatePresence mode="wait">
                    <Box
                        key={currentClue}
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        sx={{
                            bgcolor: 'rgba(15, 23, 42, 0.9)', p: 3, borderRadius: 5, border: '2px solid', borderColor: alpha('#10b981', 0.5), backdropFilter: 'blur(15px)', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', pointerEvents: 'auto'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 1 }}>
                            <Search size={16} color="#10b981" />
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#10b981', letterSpacing: 2 }}>PISTA ATUAL</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                            {gameStatus === 'idle' ? "Interaja com o mapa para iniciar a caçada!" :
                                gameStatus === 'revealing' ? "TEMPO ESGOTADO! Localizando o segredo..." :
                                    (target ? target.clues[currentClue] : "Carregando pistas...")}
                        </Typography>
                        {gameStatus === 'playing' && !isPinVisible && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                                O tesouro está invisível nesta distância. Aproxime-se!
                            </Typography>
                        )}
                    </Box>
                </AnimatePresence>
            </Box>

            {/* Win/Loss Screens */}
            <AnimatePresence>
                {(gameStatus === 'won' || gameStatus === 'lost') && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                            position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', p: 3
                        }}
                    >
                        <Box
                            component={motion.div}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            sx={{
                                textAlign: 'center', maxWidth: 450, w: '100%', p: 6, borderRadius: 10, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', boxShadow: `0 0 100px ${alpha(gameStatus === 'won' ? '#10b981' : '#ef4444', 0.2)}`
                            }}
                        >
                            <Box sx={{
                                w: 100, h: 100, mx: 'auto', mb: 4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: alpha(gameStatus === 'won' ? '#10b981' : '#ef4444', 0.1), border: `2px solid ${gameStatus === 'won' ? '#10b981' : '#ef4444'}`
                            }}>
                                {gameStatus === 'won' ? <Trophy size={48} color="#10b981" /> : <Info size={48} color="#ef4444" />}
                            </Box>

                            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase' }}>
                                {gameStatus === 'won' ? 'Sensacional!' : 'Fim de Jogo'}
                            </Typography>

                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                                {gameStatus === 'won'
                                    ? `Você encontrou o tesouro oculto com recorde de tempo!`
                                    : `Infelizmente seu tempo acabou antes de localizar o segredo.`}
                            </Typography>

                            {gameStatus === 'won' && (
                                <Box sx={{ mb: 6, p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 900 }}>PONTUAÇÃO FINAL</Typography>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: '#10b981' }}>{timeLeft * 10}</Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    fullWidth variant="contained" size="large"
                                    onClick={() => window.location.reload()}
                                    sx={{ py: 2, borderRadius: 4, fontWeight: 900, bgcolor: gameStatus === 'won' ? '#10b981' : '#3b82f6', '&:hover': { bgcolor: gameStatus === 'won' ? '#059669' : '#2563eb' } }}
                                >
                                    JOGAR NOVAMENTE
                                </Button>
                                <Button
                                    fullWidth variant="text" size="large"
                                    onClick={() => navigate('/')}
                                    sx={{ py: 2, borderRadius: 4, fontWeight: 900, color: 'text.secondary' }}
                                >
                                    VOLTAR AO MENU
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </AnimatePresence>

        </Box>
    );
};

export default GeoHunter;
