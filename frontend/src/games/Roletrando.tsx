import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Wheel } from '../components/Wheel';
import type { WheelHandle } from '../components/Wheel';
import { Board } from '../components/Board';
import { Trophy, ArrowLeft, Play, Lightbulb, RefreshCcw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, alpha, Avatar, Paper, Stack, IconButton, Alert } from '@mui/material';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';
import { ActionButton } from '../components/shared/ActionButton';

interface Player {
  id: string;
  name: string;
  score: number;
  isBot: boolean;
  avatar: string;
}

interface GameState {
  id: string;
  obscuredPhrase: string;
  category: string;
  gameOver: boolean;
}

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aria",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo"
];

const Roletrando: React.FC = () => {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { userName } = useUser();

  const [game, setGame] = useState<GameState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinValue, setCurrentSpinValue] = useState<number | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'winner'>('lobby');

  // Multiplayer state
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const botTurnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelRef = useRef<WheelHandle>(null);

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api/game`;

  const initLobby = useCallback(() => {
    const initialPlayers: Player[] = [
      { id: '1', name: userName || 'Jogador 1', score: 0, isBot: false, avatar: AVATARS[0] }
    ];
    setPlayers(initialPlayers);
    setGamePhase('lobby');
  }, [userName]);

  useEffect(() => {
    initLobby();
  }, [initLobby]);

  const startGame = async () => {
    try {
      playSound('click');
      setError(null);

      const finalPlayers = [...players];
      while (finalPlayers.length < 3) {
        finalPlayers.push({
          id: `bot-${finalPlayers.length}`,
          name: `Robô ${finalPlayers.length}`,
          isBot: true,
          score: 0,
          avatar: AVATARS[finalPlayers.length]
        });
      }
      setPlayers(finalPlayers);

      const resp = await axios.get(`${API_URL}/new`);
      setGame(resp.data);
      setGuessedLetters([]);
      setTurnIndex(0);
      setGamePhase('playing');
    } catch (err) {
      setError('Erro ao iniciar o jogo. Verifique se o backend está rodando.');
      console.error(err);
    }
  };

  const nextTurn = () => {
    setTurnIndex(prev => (prev + 1) % players.length);
    setCurrentSpinValue(null);
  };

  const updatePlayerScore = (value: number, loseAll: boolean = false) => {
    setPlayers(prev => prev.map((p, i) => {
      if (i === turnIndex) {
        return { ...p, score: loseAll ? 0 : p.score + value };
      }
      return p;
    }));
  };

  const handleGuess = async (letter: string) => {
    if (!game || isSpinning || currentSpinValue === null) return;
    if (guessedLetters.includes(letter)) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/guess?letter=${letter}`);
      const updatedGame = resp.data;
      setGame(updatedGame);
      setGuessedLetters(prev => [...prev, letter]);

      const count = updatedGame.obscuredPhrase.split(letter).length - 1;

      if (count > 0) {
        playSound('correct');
        updatePlayerScore(currentSpinValue * count);
        if (updatedGame.gameOver) {
          setGamePhase('winner');
          playSound('win');
        } else {
          setCurrentSpinValue(null);
        }
      } else {
        playSound('wrong');
        nextTurn();
      }
    } catch (err) {
      setError('Erro ao enviar palpite.');
    }
  };

  const handleSolve = async () => {
    if (!game || isSpinning) return;
    const phrase = prompt('Qual é a frase?');
    if (!phrase) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/solve?phrase=${phrase}`);
      const updatedGame = resp.data;
      setGame(updatedGame);
      if (updatedGame.gameOver && !game.gameOver) {
        updatePlayerScore(5000);
        playSound('win');
        setGamePhase('winner');
      } else {
        playSound('wrong');
        nextTurn();
      }
    } catch (err) {
      setError('Erro ao resolver.');
    }
  };

  const handleSpinEnd = (value: number) => {
    setIsSpinning(false);
    if (value === 0) {
      playSound('wrong');
      updatePlayerScore(0, true);
      setCurrentSpinValue(null);
      nextTurn();
    } else {
      setCurrentSpinValue(value);
    }
  };

  // AI Logic
  useEffect(() => {
    if (gamePhase === 'playing' && players[turnIndex]?.isBot && !isSpinning) {
      if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current);

      botTurnTimeoutRef.current = setTimeout(async () => {
        if (!game || game.gameOver) return;

        if (currentSpinValue === null) {
          wheelRef.current?.spin();
        } else {
          const unrevealed = ALPHABET.filter(l => !guessedLetters.includes(l));
          if (unrevealed.length > 0) {
            const randomLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            await handleGuess(randomLetter);
          }
        }
      }, 2000);
    }
    return () => {
      if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current);
    };
  }, [turnIndex, currentSpinValue, isSpinning, gamePhase, guessedLetters, game]);

  const currentPlayer = players[turnIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', pb: 4 }}>

      {/* Header */}
      <Container maxWidth="xl" sx={{ pt: 4, mb: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            onClick={() => navigate('/')}
            sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 1.5 }}
          >
            <ArrowLeft />
          </IconButton>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 4 }}>
              MEGA SHOW
            </Typography>
            <Typography variant="h3" sx={{ fontStyle: 'italic', fontWeight: 900 }}>
              ROLETRANDO
            </Typography>
          </Box>
          <Box sx={{ width: 48 }} />
        </Stack>
      </Container>

      {error && (
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}>
            {error}
          </Alert>
        </Container>
      )}

      {gamePhase === 'lobby' && (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 10 }}>
            <Typography variant="h4" sx={{ mb: 4, fontStyle: 'italic', fontWeight: 900 }}>
              Lobby de Espera
            </Typography>
            <Stack spacing={2} sx={{ mb: 6, textAlign: 'left' }}>
              {players.map((p) => (
                <Paper key={p.id} sx={{ p: 2.5, bgcolor: alpha('#fff', 0.05), display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4 }}>
                  <Avatar src={p.avatar} sx={{ border: '2px solid', borderColor: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {p.name} {p.id === '1' && "(Você)"}
                  </Typography>
                </Paper>
              ))}
            </Stack>
            <ActionButton fullWidth onClick={startGame} size="large">
              INICIAR JOGO
            </ActionButton>
          </Paper>
        </Container>
      )}

      {game && gamePhase === 'playing' && (
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">

            {/* Board Area */}
            <Grid size={12}>
              <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 12 }}>
                <Board phrase={game.obscuredPhrase} category={game.category} />
              </Paper>
            </Grid>

            {/* Players Sidebar */}
            <Grid size={{ xs: 12, lg: 2 }}>
              <Paper sx={{ p: 3, borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="button" sx={{ textAlign: 'center', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, letterSpacing: 2 }}>
                  Placar
                </Typography>
                <Stack spacing={2}>
                  {players.map((p, i) => (
                    <Box key={p.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 4,
                      transition: 'all 0.3s',
                      bgcolor: i === turnIndex ? alpha('#10b981', 0.1) : 'transparent',
                      border: '1px solid',
                      borderColor: i === turnIndex ? alpha('#10b981', 0.3) : 'transparent',
                      transform: i === turnIndex ? 'scale(1.05)' : 'none',
                    }}>
                      <Avatar src={p.avatar} sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', textTransform: 'uppercase', lineHeight: 1 }}>
                          {p.name}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900, fontStyle: 'italic', lineHeight: 1, mt: 0.5 }}>
                          R$ {p.score}
                        </Typography>
                      </Box>
                      {i === turnIndex && <Play size={12} color="#10b981" fill="#10b981" />}
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ mt: 'auto', p: 2, bgcolor: alpha('#10b981', 0.05), borderRadius: 4, border: '1px solid rgba(16,185,129,0.1)' }}>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Info size={12} /> DICA
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2, display: 'block' }}>
                    Gire a roleta e ganhe pontos por cada letra correta!
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Wheel Center */}
            <Grid size={{ xs: 12, lg: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Wheel
                  ref={wheelRef}
                  onSpinStart={() => {
                    setIsSpinning(true);
                    setCurrentSpinValue(null);
                  }}
                  onTick={() => playSound('wheelTick')}
                  onSpinEnd={handleSpinEnd}
                  isSpinning={isSpinning}
                />
                <AnimatePresence>
                  {currentSpinValue !== null && (
                    <Box
                      component={motion.div}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0 }}
                      sx={{
                        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: 'primary.main', color: 'white', px: 4, py: 2, borderRadius: 10,
                        fontWeight: 900, fontSize: '2rem', boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                        border: '4px solid white', zIndex: 100
                      }}
                    >
                      R$ {currentSpinValue}
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            </Grid>

            {/* Controls Right */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                <Paper sx={{ p: 4, borderRadius: 6 }}>
                  <Typography variant="button" sx={{ display: 'block', mb: 3, color: 'text.secondary', fontWeight: 900 }}>
                    Selecione uma Letra
                  </Typography>
                  <Grid container spacing={1}>
                    {ALPHABET.map(l => {
                      const guessed = guessedLetters.includes(l);
                      const canPick = currentSpinValue !== null && !isSpinning && !currentPlayer?.isBot;
                      return (
                        <Grid size={1.7} key={l}>
                          <Box
                            component="button"
                            disabled={!canPick || guessed}
                            onClick={() => handleGuess(l)}
                            sx={{
                              width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 2, fontWeight: 900, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                              bgcolor: guessed ? 'rgba(255,255,255,0.03)' : canPick ? alpha('#10b981', 0.1) : 'rgba(255,255,255,0.05)',
                              color: guessed ? 'text.disabled' : canPick ? 'primary.light' : 'text.secondary',
                              '&:hover': canPick && !guessed ? { bgcolor: 'primary.main', color: 'white' } : {},
                              fontSize: '0.875rem'
                            }}
                          >
                            {l}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>

                <Stack spacing={2}>
                  <ActionButton
                    fullWidth
                    onClick={handleSolve}
                    disabled={isSpinning || !!currentPlayer?.isBot}
                    startIcon={<Lightbulb />}
                  >
                    RESPONDER
                  </ActionButton>
                  <ActionButton
                    fullWidth
                    sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                    onClick={() => navigate('/')}
                    startIcon={<RefreshCcw />}
                  >
                    NOVO JOGO
                  </ActionButton>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      )}

      {gamePhase === 'winner' && (
        <Box sx={{
          position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <Paper sx={{ p: 8, maxWidth: 450, w: '100%', textAlign: 'center', borderRadius: 12, border: '2px solid', borderColor: 'primary.main' }}>
            <Trophy size={80} color="#10b981" style={{ marginBottom: 24 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, fontStyle: 'italic', mb: 6 }}>
              Fim de Jogo!
            </Typography>
            <Stack spacing={2} sx={{ mb: 6 }}>
              {players.sort((a, b) => b.score - a.score).map((p, i) => (
                <Paper key={p.id} sx={{ p: 2, bgcolor: i === 0 ? 'primary.main' : alpha('#fff', 0.05), display: 'flex', justifyContent: 'space-between', borderRadius: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{i + 1}º {p.name}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, fontStyle: 'italic' }}>R$ {p.score}</Typography>
                </Paper>
              ))}
            </Stack>
            <ActionButton fullWidth onClick={() => navigate('/')} size="large">
              JOGAR DE NOVO
            </ActionButton>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Roletrando;
