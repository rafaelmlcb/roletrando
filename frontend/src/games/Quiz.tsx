import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, CheckCircle, XCircle,
    Triangle, Square, Circle, Star, RotateCcw, Users
} from 'lucide-react';
import { Container, Typography, Box, Grid, alpha, Paper, Stack, IconButton, ButtonBase, Avatar, TextField, Alert } from '@mui/material';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';
import { ActionButton } from '../components/shared/ActionButton';
import { useWebSocket } from '../hooks/useWebSocket';

const QUIZ_DURATION = 20; // seconds

const Quiz: React.FC = () => {
    const navigate = useNavigate();
    const { playSound, stopSound } = useSound();
    const { userName } = useUser();

    const [currentStep, setCurrentStep] = useState(0);
    const [localPhase, setLocalPhase] = useState<'question' | 'feedback' | 'question_ranking' | 'accumulated_ranking' | 'ended'>('question');
    const [timer, setTimer] = useState(QUIZ_DURATION);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Multiplayer State
    const [roomIdInput, setRoomIdInput] = useState('');
    const [activeRoomId, setActiveRoomId] = useState<string>('');
    const { status, gameState, lastEvent, sendMessage, setLastEvent } = useWebSocket(activeRoomId, userName || 'Player', 'quiz');

    const timerRef = useRef<number | null>(null);

    // Handle Server Events
    useEffect(() => {
        if (lastEvent) {
            if (lastEvent.type === 'GAME_START') {
                playSound('click');
                setLocalPhase('question');
                startTimer();
            }
            setLastEvent(null);
        }
    }, [lastEvent, setLastEvent, playSound]);

    const joinRoom = () => {
        if (!roomIdInput.trim()) {
            setError("Digite um código de sala válido.");
            return;
        }
        setError(null);
        setActiveRoomId(roomIdInput.trim().toUpperCase());
    };

    const createRoom = () => {
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        setActiveRoomId(randomId);
    };

    const startGameViaHost = () => {
        sendMessage('START_GAME');
    };

    const startTimer = useCallback(() => {
        setTimer(QUIZ_DURATION);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = window.setInterval(() => {
            setTimer((prev) => {
                if (prev <= 0.1) {
                    handleTimeUp();
                    return 0;
                }
                if (Math.ceil(prev) !== Math.ceil(prev - 0.1)) {
                    playSound('ticker');
                }
                return prev - 0.1;
            });
        }, 100);
    }, [playSound]);

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        stopSound('ticker');
        if (selectedAnswer === null) {
            playSound('wrong');
            setSelectedAnswer(-1);
            setLocalPhase('feedback');
        }
    };

    const handleAnswer = (index: number) => {
        if (localPhase !== 'question' || selectedAnswer !== null) return;

        if (timerRef.current) clearInterval(timerRef.current);
        stopSound('ticker');
        setSelectedAnswer(index);

        const question = QUIZ_QUESTIONS[currentStep];
        let youScore = 0;
        if (index === question.answer) {
            playSound('correct');
            youScore = Math.floor(1000 * (timer / QUIZ_DURATION));
            sendMessage('SUBMIT_SCORE', youScore);
        } else {
            playSound('wrong');
        }
        setLocalPhase('feedback');
    };

    const toQuestionRanking = () => {
        playSound('click');
        setLocalPhase('question_ranking');
    };

    const toAccumulatedRanking = () => {
        playSound('click');
        setLocalPhase('accumulated_ranking');
    };

    const nextStep = () => {
        playSound('click');
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedAnswer(null);
            setLocalPhase('question');
            startTimer();
            sendMessage('NEXT_QUESTION');
        } else {
            playSound('win');
            setLocalPhase('ended');
        }
    };

    const resetQuiz = () => {
        playSound('click');
        setCurrentStep(0);
        setSelectedAnswer(null);
        setActiveRoomId('');
        setRoomIdInput('');
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const currentQuestion = QUIZ_QUESTIONS[currentStep];
    const optionStyles = [
        { color: '#e21b3c', icon: <Triangle size={24} fill="white" /> }, // Red
        { color: '#1368ce', icon: <Square size={24} fill="white" /> }, // Blue
        { color: '#d89e00', icon: <Circle size={24} fill="white" /> }, // Yellow
        { color: '#26890c', icon: <Star size={24} fill="white" /> }    // Green
    ];

    if (!activeRoomId) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#46178f', color: 'white', pb: 4 }}>
                <Container maxWidth="sm">
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 10 }}>
                        <Trophy size={64} color="#46178f" style={{ marginBottom: 24 }} />
                        <Typography variant="h3" sx={{ mb: 4, fontStyle: 'italic', fontWeight: 900, color: '#46178f' }}>
                            Quiz Multiplayer
                        </Typography>
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <Stack spacing={3}>
                            <ActionButton fullWidth onClick={createRoom} size="large" sx={{ bgcolor: '#46178f', '&:hover': { bgcolor: '#361170' } }}>
                                CRIAR NOVA SALA
                            </ActionButton>

                            <Typography variant="overline" sx={{ color: 'text.secondary' }}>OU</Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="CÓDIGO DA SALA"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                    sx={{ input: { color: 'black', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 } }}
                                />
                                <ActionButton onClick={joinRoom} sx={{ bgcolor: '#46178f', '&:hover': { bgcolor: '#361170' } }}>
                                    ENTRAR
                                </ActionButton>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => navigate('/')} sx={{ mt: 4 }}>
                            <ArrowLeft /> Voltar
                        </IconButton>
                    </Paper>
                </Container>
            </Box>
        );
    }

    if (status === 'DISCONNECTED') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#46178f', gap: 2, px: 3 }}>
                <Typography variant="h5" sx={{ color: '#f87171' }}>Erro de conexão com o Servidor!</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 400 }}>
                    O WebSocket não conseguiu conectar. Se você estiver na Vercel, certifique-se de ter configurado a variável VITE_API_URL.
                </Typography>
                <ActionButton onClick={() => { setActiveRoomId(''); setRoomIdInput(''); }}>
                    Voltar
                </ActionButton>
            </Box>
        );
    }

    if (status !== 'CONNECTED' || !gameState) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#46178f' }}>
                <Typography variant="h5" sx={{ color: 'white' }}>Conectando à sala {activeRoomId}...</Typography>
            </Box>
        );
    }

    const room = gameState;
    const players = room.players || [];
    const me = players.find((p: any) => p.name === userName);
    const isHost = players.length > 0 && players[0].id === me?.id;
    const roundScores = room.quizSession?.roundScores || {};

    const topByQuestion = [...players].sort((a: any, b: any) => (roundScores[b.id] || 0) - (roundScores[a.id] || 0)).slice(0, 10);
    const topAccumulated = [...players].sort((a: any, b: any) => b.score - a.score).slice(0, 10);
    const you = players.find((p: any) => p.id === me?.id);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#46178f', color: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Container maxWidth="xl" sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <IconButton
                    onClick={() => navigate('/')}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <ArrowLeft />
                </IconButton>
                <Box sx={{ px: 3, py: 1, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Users size={18} color="#34d399" />
                    <Typography variant="button" sx={{ fontWeight: 900, letterSpacing: 1 }}>{players.length} JOGADORES</Typography>
                </Box>
            </Container>

            <Box component="main" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <AnimatePresence mode="wait">
                    {room.status === 'WAITING' ? (
                        <Container maxWidth="sm" component={motion.div} key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <Paper sx={{ p: { xs: 4, sm: 6 }, borderRadius: 12, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#46178f' }} />
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 4 }}>
                                    SALA QUIZ
                                </Typography>
                                <Typography variant="h3" sx={{ mb: 4, fontStyle: 'italic', fontWeight: 900, color: '#46178f' }}>
                                    {activeRoomId}
                                </Typography>

                                <Stack spacing={2} sx={{ mb: 6, textAlign: 'left' }}>
                                    {players.map((p: any) => (
                                        <Paper key={p.id} sx={{ p: 2.5, bgcolor: alpha('#46178f', 0.05), display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, color: 'text.primary' }}>
                                            <Avatar src={p.avatar} sx={{ border: '2px solid', borderColor: '#46178f' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                {p.name} {p.id === me?.id && "(Você)"} {p.id === players[0].id && "👑"}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>

                                {isHost ? (
                                    <ActionButton fullWidth onClick={startGameViaHost} size="large" sx={{ py: 3, fontSize: '1.25rem', bgcolor: '#46178f', '&:hover': { bgcolor: '#361170' } }}>
                                        INICIAR JOGO AGORA
                                    </ActionButton>
                                ) : (
                                    <Typography variant="button" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Aguardando o host iniciar a partida...</Typography>
                                )}
                            </Paper>
                        </Container>
                    ) : localPhase === 'question' ? (
                        <Container maxWidth="md" component={motion.div} key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Paper sx={{ p: 6, mb: 4, textAlign: 'center', borderRadius: 10, borderBottom: '8px solid rgba(0,0,0,0.1)' }}>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, mb: 2, display: 'block' }}>
                                    Questão {currentStep + 1} de {QUIZ_QUESTIONS.length}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: 'text.primary' }}>{currentQuestion.question}</Typography>

                                <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto' }}>
                                    <svg width="80" height="80">
                                        <circle cx="40" cy="40" r="36" stroke="rgba(70, 23, 143, 0.1)" strokeWidth="8" fill="none" />
                                        <circle
                                            cx="40" cy="40" r="36" stroke="#46178f" strokeWidth="8" fill="none"
                                            strokeDasharray="226" strokeDashoffset={226 - (226 * timer / QUIZ_DURATION)}
                                            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                                        />
                                    </svg>
                                    <Typography sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: '#46178f' }}>
                                        {Math.ceil(timer)}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Grid container spacing={2}>
                                {currentQuestion.options.map((option, index) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                        <ButtonBase
                                            onClick={() => handleAnswer(index)}
                                            sx={{
                                                width: '100%', p: 4, borderRadius: 4, bgcolor: optionStyles[index].color,
                                                color: 'white', display: 'flex', alignItems: 'center', gap: 3, textAlign: 'left',
                                                borderBottom: '6px solid rgba(0,0,0,0.2)', transition: 'all 0.2s',
                                                '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)' },
                                                '&:active': { transform: 'translateY(2px)', borderBottomWidth: 0 }
                                            }}
                                        >
                                            <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', p: 1, borderRadius: 2 }}>{optionStyles[index].icon}</Box>
                                            <Typography variant="h5" sx={{ fontWeight: 900 }}>{option}</Typography>
                                        </ButtonBase>
                                    </Grid>
                                ))}
                            </Grid>
                        </Container>
                    ) : localPhase === 'feedback' ? (
                        <Box component={motion.div} key="feedback" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center' }}>
                            <Box sx={{
                                width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: selectedAnswer === currentQuestion.answer ? '#10b981' : '#f43f5e',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                            }}>
                                {selectedAnswer === currentQuestion.answer ? <CheckCircle size={64} /> : <XCircle size={64} />}
                            </Box>
                            <Typography variant="h2" sx={{ fontWeight: 900, fontStyle: 'italic', mb: 2 }}>
                                {selectedAnswer === currentQuestion.answer ? 'CORRETO!' : 'ERRADO!'}
                            </Typography>
                            {selectedAnswer === currentQuestion.answer && (
                                <Typography variant="h4" sx={{ fontWeight: 900, color: '#34d399', mb: 6 }}>+{(roundScores && you) ? roundScores[you.id] || 0 : 0} PTS</Typography>
                            )}
                            <ActionButton onClick={toQuestionRanking} sx={{ px: 8, py: 3, fontSize: '1.25rem', bgcolor: 'white', color: '#46178f', '&:hover': { bgcolor: '#eee' } }}>
                                VER DESEMPENHO
                            </ActionButton>
                        </Box>
                    ) : localPhase === 'question_ranking' ? (
                        <Container maxWidth="sm" component={motion.div} key="q_ranking" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                            <Paper sx={{ p: 6, borderRadius: 10, textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#46178f', fontStyle: 'italic' }}>TOP DA RODADA</Typography>
                                <Typography variant="overline" sx={{ display: 'block', mb: 4, color: 'text.secondary' }}>Os mais rápidos nesta questão</Typography>

                                <Stack spacing={1} sx={{ mb: 6 }}>
                                    {topByQuestion.map((p: any, i) => (
                                        <Box key={p.id} sx={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 3,
                                            bgcolor: p.id === me?.id ? '#46178f' : alpha('#000', 0.03),
                                            color: p.id === me?.id ? 'white' : 'text.primary'
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, width: 40 }}>{i + 1}</Typography>
                                            <Typography sx={{ fontWeight: 900, flexGrow: 1, textAlign: 'left', textTransform: 'uppercase' }}>{p.name}</Typography>
                                            <Typography sx={{ fontWeight: 900, fontStyle: 'italic' }}>+{roundScores[p.id] || 0}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                                <ActionButton fullWidth onClick={toAccumulatedRanking}>PLACAR GERAL</ActionButton>
                            </Paper>
                        </Container>
                    ) : localPhase === 'accumulated_ranking' ? (
                        <Container maxWidth="sm" component={motion.div} key="acc_ranking" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                            <Paper sx={{ p: 6, borderRadius: 10, textAlign: 'center', bgcolor: '#1e0a4a', color: 'white', borderTop: '8px solid #f59e0b' }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, fontStyle: 'italic' }}>LÍDERES GLOBAIS</Typography>
                                <Typography variant="overline" sx={{ display: 'block', mb: 4, color: 'rgba(255,255,255,0.6)' }}>Classificação Geral</Typography>

                                <Stack spacing={1} sx={{ mb: 6 }}>
                                    {topAccumulated.map((p: any, i) => (
                                        <Box key={p.id} sx={{
                                            display: 'flex', alignItems: 'center', p: 2, borderRadius: 4,
                                            bgcolor: p.id === me?.id ? 'white' : 'rgba(255,255,255,0.05)',
                                            color: p.id === me?.id ? '#46178f' : 'white',
                                            transform: p.id === me?.id ? 'scale(1.05)' : 'none',
                                            boxShadow: p.id === me?.id ? '0 10px 30px rgba(0,0,0,0.3)' : 'none'
                                        }}>
                                            <Typography variant="h5" sx={{ fontWeight: 900, width: 60, color: i === 0 ? '#f59e0b' : 'inherit' }}>{i + 1}º</Typography>
                                            <Typography sx={{ fontWeight: 900, flexGrow: 1, textAlign: 'left', textTransform: 'uppercase' }}>{p.name}</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: p.id === me?.id ? 'inherit' : '#10b981' }}>{p.score?.toLocaleString() || 0}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                                <ActionButton fullWidth onClick={nextStep} sx={{ bgcolor: 'white', color: '#46178f', '&:hover': { bgcolor: '#eee' } }}>
                                    {currentStep < QUIZ_QUESTIONS.length - 1 ? 'PRÓXIMA PERGUNTA' : 'RESULTADO FINAL'}
                                </ActionButton>
                            </Paper>
                        </Container>
                    ) : (
                        <Container maxWidth="sm" component={motion.div} key="ended" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 12 }}>
                                <Trophy size={96} color="#46178f" style={{ marginBottom: 32 }} />
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#46178f', mb: 1 }}>FIM DE JOGO!</Typography>
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6 }}>Você terminou na {topAccumulated.findIndex((p: any) => p.id === me?.id) + 1}ª posição</Typography>

                                <Paper elevation={0} sx={{ p: 6, mb: 6, bgcolor: alpha('#46178f', 0.05), borderRadius: 8 }}>
                                    <Typography variant="h1" sx={{ fontWeight: 900, color: '#46178f', lineHeight: 1, mb: 2 }}>{you?.score?.toLocaleString() || 0}</Typography>
                                    <Typography variant="button" sx={{ fontWeight: 900, color: 'text.secondary' }}>{you?.name}</Typography>
                                </Paper>

                                <Stack direction="row" spacing={2}>
                                    <ActionButton fullWidth onClick={resetQuiz} startIcon={<RotateCcw />}>NOVO JOGO</ActionButton>
                                    <ActionButton fullWidth variant="outlined" color="secondary" onClick={() => navigate('/')}>SAIR</ActionButton>
                                </Stack>
                            </Paper>
                        </Container>
                    )}
                </AnimatePresence>
            </Box>
        </Box>
    );
};

export default Quiz;
