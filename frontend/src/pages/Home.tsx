import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Zap, User, ChevronRight, CheckCircle2, Palette } from 'lucide-react';
import {
    Container, Typography, Box, Grid, alpha, TextField,
    InputAdornment, Select, MenuItem, FormControl, Chip, Skeleton
} from '@mui/material';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { GameCard } from '../components/shared/GameCard';
import { ActionButton } from '../components/shared/ActionButton';

const games = [
    {
        id: 'roletrando',
        title: 'Roletrando',
        description: 'Gire a roleta e adivinhe a frase secreta para ganhar pontos!',
        icon: <Gamepad2 size={48} />,
        color: '#10b981',
        path: '/roletrando'
    },
    {
        id: 'millionaire',
        title: 'Show do Milhão',
        description: 'Responda perguntas cada vez mais difíceis e chegue ao milhão!',
        icon: <Trophy size={48} />,
        color: '#f59e0b',
        path: '/millionaire'
    },
    {
        id: 'quiz',
        title: 'Quiz de Velocidade',
        description: 'Seja rápido! Quanto mais veloz a resposta, mais pontos você ganha.',
        icon: <Zap size={48} />,
        color: '#3b82f6',
        path: '/quiz'
    }
];

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { userName, setUserName, isNameDefined } = useUser();
    const { availableThemes, selectedTheme, defaultTheme, setSelectedTheme, themesLoading } = useTheme();
    const [tempName, setTempName] = useState("");
    const [showModal, setShowModal] = useState(!isNameDefined);
    const [error, setError] = useState("");

    const handleSaveName = () => {
        const trimmedName = tempName.trim();
        if (trimmedName.length < 3) {
            setError("O nome deve ter pelo menos 3 caracteres.");
            return;
        }
        setUserName(trimmedName);
        setShowModal(false);
    };

    const handlePlay = (path: string) => {
        if (!isNameDefined) {
            setShowModal(true);
        } else {
            navigate(path);
        }
    };

    const formatThemeName = (t: string) =>
        t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ');

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>

            {/* Name Prompt Modal */}
            <AnimatePresence>
                {showModal && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        sx={{
                            position: 'fixed', inset: 0, zIndex: 1300,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
                            bgcolor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Box
                            component={motion.div}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            sx={{
                                bgcolor: 'background.paper', p: { xs: 4, sm: 6 },
                                borderRadius: 8, maxWidth: 450, w: '100%',
                                border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
                            }}
                        >
                            <Box sx={{ w: 64, h: 64, mx: 'auto', mb: 3, bgcolor: alpha('#3b82f6', 0.1), borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
                                <User size={32} color="#3b82f6" />
                            </Box>
                            <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, textTransform: 'uppercase' }}>Bem-vindo!</Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>Como gostaria de aparecer nos rankings?</Typography>
                            <TextField
                                fullWidth autoFocus variant="outlined"
                                placeholder="Digite seu nome..."
                                value={tempName}
                                onChange={(e) => { setTempName(e.target.value); setError(""); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                error={!!error} helperText={error}
                                InputProps={{
                                    sx: { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', fontSize: '1.25rem', fontWeight: 700 },
                                    endAdornment: tempName.length >= 3 && !error && (
                                        <InputAdornment position="end"><CheckCircle2 color="#10b981" /></InputAdornment>
                                    )
                                }}
                                sx={{ mb: 4 }}
                            />
                            <ActionButton fullWidth onClick={handleSaveName} endIcon={<ChevronRight />} size="large">SALVAR E JOGAR</ActionButton>
                        </Box>
                    </Box>
                )}
            </AnimatePresence>

            {/* Profile Info */}
            {isNameDefined && (
                <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.05)', px: 3, py: 1, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>PLAYER:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.light', textTransform: 'uppercase' }}>{userName}</Typography>
                    <Box component="button" onClick={() => setShowModal(true)} sx={{ display: 'flex', bgcolor: 'transparent', border: 'none', cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <User size={16} />
                    </Box>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ pt: 12 }}>
                <Box sx={{ mb: 12, textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ fontSize: { xs: '3.5rem', sm: '5.5rem' }, fontStyle: 'italic', mb: 2 }}>
                        GAME<Box component="span" sx={{ color: 'primary.main', fontStyle: 'normal' }}>CENTER</Box>
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, maxWidth: 600, mx: 'auto' }}>
                        Transforme seu conhecimento em vitórias nos nossos games show favoritos.
                    </Typography>
                </Box>

                {/* Theme Selector */}
                <Box sx={{
                    mb: 6, mx: 'auto', maxWidth: 480,
                    p: 3, borderRadius: 5,
                    bgcolor: alpha('#0f172a', 0.6),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', gap: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Palette size={18} color="#a78bfa" />
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 2 }}>TEMA DO JOGO</Typography>
                        {selectedTheme === defaultTheme && (
                            <Chip label="padrão" size="small" sx={{ ml: 'auto', fontSize: '0.65rem', height: 20, bgcolor: alpha('#a78bfa', 0.15), color: '#a78bfa', border: '1px solid', borderColor: alpha('#a78bfa', 0.3) }} />
                        )}
                    </Box>
                    {themesLoading ? (
                        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 3 }} />
                    ) : (
                        <FormControl fullWidth size="small">
                            <Select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: '#a78bfa',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha('#a78bfa', 0.3)
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#a78bfa'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#a78bfa'
                                    }
                                }}
                            >
                                {availableThemes.map(t => (
                                    <MenuItem key={t} value={t} sx={{ fontWeight: 700 }}>
                                        {formatThemeName(t)}
                                        {t === defaultTheme && (
                                            <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(padrão)</Typography>
                                        )}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>

                {/* Game Cards */}
                <Grid container spacing={4}>
                    {games.map((game, index) => (
                        <Grid key={game.id} size={{ xs: 12, md: 4 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <GameCard
                                    title={game.title}
                                    description={game.description}
                                    icon={game.icon}
                                    color={game.color}
                                    onClick={() => handlePlay(game.path)}
                                />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Home;
