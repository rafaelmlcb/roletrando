import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, Users, Zap, CheckCircle2, XCircle, User
} from 'lucide-react';
import {
    Container, Typography, Box, Grid, alpha, Paper, Stack,
    IconButton, ButtonBase, Avatar, Chip
} from '@mui/material';
import { MILLIONAIRE_QUESTIONS, PRIZE_LADDER } from '../data/millionaireData';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';
import { ActionButton } from '../components/shared/ActionButton';

const Millionaire: React.FC = () => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const { userName } = useUser();
    const [currentLevel, setCurrentLevel] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'winning' | 'lost' | 'finished'>('playing');
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [lifelines, setLifelines] = useState({
        fiftyFifty: true,
        audience: true,
        skip: true
    });
    const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
    const [audienceData, setAudienceData] = useState<number[]>([]);

    const currentQuestion = MILLIONAIRE_QUESTIONS[currentLevel];

    const handleAnswerClick = (index: number) => {
        if (isConfirmed || gameState !== 'playing') return;
        setSelectedAnswer(index);
    };

    const confirmAnswer = () => {
        if (selectedAnswer === null || isConfirmed) return;
        setIsConfirmed(true);
        playSound('click');

        setTimeout(() => {
            if (selectedAnswer === currentQuestion.answer) {
                if (currentLevel === MILLIONAIRE_QUESTIONS.length - 1) {
                    playSound('win');
                    setGameState('finished');
                } else {
                    playSound('correct');
                    setGameState('winning');
                }
            } else {
                playSound('wrong');
                setGameState('lost');
            }
        }, 1500);
    };

    const nextQuestion = () => {
        playSound('click');
        setCurrentLevel(prev => prev + 1);
        setSelectedAnswer(null);
        setIsConfirmed(false);
        setGameState('playing');
        setHiddenOptions([]);
        setAudienceData([]);
    };

    const resetGame = () => {
        playSound('click');
        setCurrentLevel(0);
        setGameState('playing');
        setSelectedAnswer(null);
        setIsConfirmed(false);
        setLifelines({ fiftyFifty: true, audience: true, skip: true });
        setHiddenOptions([]);
        setAudienceData([]);
    };

    const useFiftyFifty = () => {
        if (!lifelines.fiftyFifty || isConfirmed || gameState !== 'playing') return;
        const correctAnswer = currentQuestion.answer;
        const wrongAnswers = currentQuestion.options
            .map((_, i) => i)
            .filter(i => i !== correctAnswer);
        const toHide: number[] = [];
        const available = [...wrongAnswers];
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            toHide.push(available.splice(randomIndex, 1)[0]);
        }
        setHiddenOptions(toHide);
        setLifelines(prev => ({ ...prev, fiftyFifty: false }));
        playSound('click');
    };

    const useAudience = () => {
        if (!lifelines.audience || isConfirmed || gameState !== 'playing') return;
        const correctAnswer = currentQuestion.answer;
        const data = [0, 0, 0, 0];
        let remaining = 100;
        const correctWeight = 50 + Math.floor(Math.random() * 30);
        data[correctAnswer] = correctWeight;
        remaining -= correctWeight;
        const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctAnswer);
        wrongIndices.forEach((idx, i) => {
            if (i === 2) {
                data[idx] = remaining;
            } else {
                const val = Math.floor(Math.random() * remaining);
                data[idx] = val;
                remaining -= val;
            }
        });
        setAudienceData(data);
        setLifelines(prev => ({ ...prev, audience: false }));
        playSound('click');
    };

    const useSkip = () => {
        if (!lifelines.skip || isConfirmed || gameState !== 'playing') return;
        setLifelines(prev => ({ ...prev, skip: false }));
        playSound('click');
        nextQuestion();
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
            <Container maxWidth="xl" sx={{ pt: 4 }}>
                <Paper sx={{
                    p: 2, mb: 6, borderRadius: 4, bgcolor: alpha('#0f172a', 0.4),
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                            <ArrowLeft />
                        </IconButton>
                        <Chip icon={<User size={16} color="#f59e0b" />} label={userName} sx={{ fontWeight: 900, textTransform: 'uppercase', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.2)' }} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <IconButton onClick={useFiftyFifty} disabled={!lifelines.fiftyFifty || isConfirmed || gameState !== 'playing'} sx={{ border: '2px solid', borderColor: lifelines.fiftyFifty ? alpha('#f59e0b', 0.5) : alpha('#fff', 0.1), color: lifelines.fiftyFifty ? '#f59e0b' : 'text.disabled', '&:hover': { bgcolor: alpha('#f59e0b', 0.1) } }}>
                            <Box component="span" sx={{ fontSize: '10px', fontWeight: 900 }}>50:50</Box>
                        </IconButton>
                        <IconButton onClick={useAudience} disabled={!lifelines.audience || isConfirmed || gameState !== 'playing'} sx={{ border: '2px solid', borderColor: lifelines.audience ? alpha('#f59e0b', 0.5) : alpha('#fff', 0.1), color: lifelines.audience ? '#f59e0b' : 'text.disabled', '&:hover': { bgcolor: alpha('#f59e0b', 0.1) } }}>
                            <Users size={18} />
                        </IconButton>
                        <IconButton onClick={useSkip} disabled={!lifelines.skip || isConfirmed || gameState !== 'playing'} sx={{ border: '2px solid', borderColor: lifelines.skip ? alpha('#f59e0b', 0.5) : alpha('#fff', 0.1), color: lifelines.skip ? '#f59e0b' : 'text.disabled', '&:hover': { bgcolor: alpha('#f59e0b', 0.1) } }}>
                            <Zap size={18} />
                        </IconButton>
                    </Stack>
                </Paper>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <AnimatePresence mode="wait">
                            {gameState === 'playing' ? (
                                <Box component={motion.div} key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <Paper sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 10, border: '2px solid', borderColor: alpha('#f59e0b', 0.2), position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#f59e0b' }} />
                                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 2 }}>PERGUNTA {currentLevel + 1}</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, mt: 2, mb: 1 }}>{currentQuestion.question}</Typography>
                                    </Paper>
                                    {audienceData.length > 0 && (
                                        <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', borderRadius: 4, bgcolor: alpha('#000', 0.2), border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ height: 100 }}>
                                                {audienceData.map((val, i) => (
                                                    <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: '100%', bgcolor: alpha('#f59e0b', 0.5), borderRadius: '4px 4px 0 0', height: `${val}%`, transition: 'height 1s ease-out', borderTop: '2px solid #f59e0b' }} />
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>{String.fromCharCode(65 + i)}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    )}
                                    <Grid container spacing={2}>
                                        {currentQuestion.options.map((option, index) => {
                                            const isSelected = selectedAnswer === index;
                                            const isCorrect = index === currentQuestion.answer;
                                            const isHidden = hiddenOptions.includes(index);
                                            let stateColor = 'rgba(255,255,255,0.03)';
                                            let borderColor = 'rgba(255,255,255,0.1)';
                                            let textColor = 'text.primary';
                                            if (isSelected) {
                                                if (isConfirmed) {
                                                    stateColor = isCorrect ? alpha('#10b981', 0.2) : alpha('#f43f5e', 0.2);
                                                    borderColor = isCorrect ? '#10b981' : '#f43f5e';
                                                    textColor = isCorrect ? '#10b981' : '#f43f5e';
                                                } else {
                                                    stateColor = alpha('#f59e0b', 0.2);
                                                    borderColor = '#f59e0b';
                                                    textColor = '#f59e0b';
                                                }
                                            }
                                            return (
                                                <Grid size={{ xs: 12, md: 6 }} key={index}>
                                                    <ButtonBase onClick={() => handleAnswerClick(index)} disabled={isHidden || isConfirmed} sx={{ width: '100%', p: 3, borderRadius: 4, textAlign: 'left', bgcolor: stateColor, border: '2px solid', borderColor: borderColor, opacity: isHidden ? 0 : 1, pointerEvents: isHidden ? 'none' : 'auto', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 3, '&:hover': !isConfirmed && !isHidden ? { borderColor: '#f59e0b', bgcolor: alpha('#f59e0b', 0.05) } : {} }}>
                                                        <Avatar sx={{ bgcolor: isSelected ? 'inherit' : 'rgba(255,255,255,0.05)', color: isSelected ? 'inherit' : 'text.secondary', fontWeight: 900, border: '1px solid currentColor', width: 40, height: 40 }}>{String.fromCharCode(65 + index)}</Avatar>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: textColor }}>{option}</Typography>
                                                    </ButtonBase>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                    <ActionButton fullWidth onClick={confirmAnswer} disabled={selectedAnswer === null || isConfirmed} sx={{ py: 3, fontSize: '1.25rem', bgcolor: '#f59e0b', color: '#000', '&:hover': { bgcolor: '#d97706' } }}>CONFIRMAR RESPOSTA</ActionButton>
                                </Box>
                            ) : gameState === 'winning' ? (
                                <Box component={motion.div} key="winning" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 8 }}>
                                    <Box sx={{ width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha('#10b981', 0.1), border: '4px solid #10b981' }}><CheckCircle2 size={64} color="#10b981" /></Box>
                                    <Typography variant="h2" sx={{ fontWeight: 900, fontStyle: 'italic', mb: 1, color: '#10b981' }}>CORRETO!</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 6 }}>Você faturou {PRIZE_LADDER[currentLevel]}</Typography>
                                    <ActionButton onClick={nextQuestion} sx={{ px: 8, py: 2 }}>PRÓXIMA PERGUNTA</ActionButton>
                                </Box>
                            ) : gameState === 'lost' ? (
                                <Box component={motion.div} key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 8 }}>
                                    <Box sx={{ width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha('#f43f5e', 0.1), border: '4px solid #f43f5e' }}><XCircle size={64} color="#f43f5e" /></Box>
                                    <Typography variant="h2" sx={{ fontWeight: 900, fontStyle: 'italic', mb: 1, color: '#f43f5e' }}>FIM DE JOGO!</Typography>
                                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>A resposta correta era: <Typography component="span" sx={{ color: '#f59e0b', fontWeight: 900, display: 'block' }}>{currentQuestion.options[currentQuestion.answer]}</Typography></Typography>
                                    <Stack direction="row" spacing={2} justifyContent="center"><ActionButton onClick={resetGame}>TENTAR NOVAMENTE</ActionButton><ActionButton variant="outlined" color="secondary" onClick={() => navigate('/')}>SAIR</ActionButton></Stack>
                                </Box>
                            ) : (
                                <Box component={motion.div} key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 8 }}>
                                    <Trophy size={120} color="#f59e0b" style={{ marginBottom: 32 }} className="animate-bounce" />
                                    <Typography variant="h1" sx={{ fontWeight: 900, fontStyle: 'italic', color: '#f59e0b', mb: 1 }}>PARABÉNS!</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 4 }}>VOCÊ É MILIONÁRIO!</Typography>
                                    <Typography variant="h5" sx={{ color: 'text.secondary', mb: 8 }}>Você completou o desafio e ganhou R$ 1.000.000!</Typography>
                                    <ActionButton onClick={resetGame} size="large" sx={{ px: 10, py: 3, fontSize: '1.5rem', bgcolor: '#f59e0b', color: '#000' }}>JOGAR NOVAMENTE</ActionButton>
                                </Box>
                            )}
                        </AnimatePresence>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper sx={{ p: 4, borderRadius: 8, bgcolor: alpha('#000', 0.2), border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}><Trophy size={20} color="#f59e0b" /><Typography variant="button" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 2 }}>PRÊMIOS</Typography></Stack>
                            <Stack spacing={1}>
                                {[...PRIZE_LADDER].reverse().map((prize, idx) => {
                                    const levelIndex = PRIZE_LADDER.length - 1 - idx;
                                    const isCurrent = levelIndex === currentLevel;
                                    const isPast = levelIndex < currentLevel;
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 3, bgcolor: isCurrent ? '#f59e0b' : 'transparent', color: isCurrent ? '#000' : (isPast ? '#10b981' : 'text.secondary'), transform: isCurrent ? 'scale(1.05)' : 'none', transition: 'all 0.3s', border: isCurrent ? 'none' : '1px solid transparent', borderColor: isPast ? alpha('#10b981', 0.2) : 'transparent' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, width: 30, opacity: 0.5 }}>{levelIndex + 1}</Typography>
                                            <Typography sx={{ fontWeight: isCurrent || isPast ? 900 : 500, flex: 1 }}>{prize}</Typography>
                                            {isPast && <CheckCircle2 size={14} />}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Millionaire;
