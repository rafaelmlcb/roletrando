import { useState, useEffect, useRef } from 'react';
import { Wheel } from '../components/Wheel';
import type { WheelHandle } from '../components/Wheel';
import { Board } from '../components/Board';
import { Trophy, ArrowLeft, Play, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, alpha, Avatar, Paper, Stack, IconButton, Alert, TextField } from '@mui/material';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';
import { ActionButton } from '../components/shared/ActionButton';
import { useWebSocket } from '../hooks/useWebSocket';

const Roletrando: React.FC = () => {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { userName } = useUser();

  const [roomIdInput, setRoomIdInput] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string>('');

  const { status, gameState, currentPlayerTurnId, lastEvent, sendMessage, setLastEvent } = useWebSocket(activeRoomId, userName || 'Player');

  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wheelRef = useRef<WheelHandle>(null);
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Handle incoming websocket events that require local animation
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === 'SPIN_START') {
        setIsSpinning(true);
        wheelRef.current?.spin();
      }
      setLastEvent(null);
    }
  }, [lastEvent, setLastEvent]);

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

  const handleGuess = (letter: string) => {
    if (!gameState || isSpinning || gameState.gameSession.currentSpinValue === 0) return;
    sendMessage('GUESS', letter);
  };

  const handleSolve = () => {
    if (!gameState || isSpinning) return;
    const phrase = prompt('Qual é a frase?');
    if (!phrase) return;
    sendMessage('SOLVE', phrase.toUpperCase());
  };

  const handleSpinEnd = (value: number) => {
    setIsSpinning(false);
    // Send spin result to server. Only the person who spun sends this to authoritative server.
    if (currentPlayerTurnId === gameState?.players.find((p: any) => p.name === userName)?.id) {
      sendMessage('SPIN_END', value);
    }
  };

  const startSpin = () => {
    if (isSpinning || currentPlayerTurnId !== gameState?.players.find((p: any) => p.name === userName)?.id) return;
    sendMessage('SPIN_START');
    setIsSpinning(true);
    wheelRef.current?.spin();
  };

  // UI rendering
  if (!activeRoomId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', color: 'text.primary', pb: 4 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 10 }}>
            <Typography variant="h3" sx={{ mb: 4, fontStyle: 'italic', fontWeight: 900 }}>
              Roletrando Multiplayer
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Stack spacing={3}>
              <ActionButton fullWidth onClick={createRoom} size="large">
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
                  sx={{ input: { color: 'white', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 } }}
                />
                <ActionButton onClick={joinRoom}>
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

  if (status !== 'CONNECTED' || !gameState) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" sx={{ color: 'white' }}>Conectando à sala {activeRoomId}...</Typography>
      </Box>
    );
  }

  const session = gameState.gameSession;
  const players = gameState.players;
  const me = players.find((p: any) => p.name === userName);
  const isHost = players.length > 0 && players[0].id === me?.id;
  const myTurn = currentPlayerTurnId === me?.id;

  if (gameState.status === 'WAITING') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', color: 'text.primary', pb: 4 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 10 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 4 }}>
              SALA
            </Typography>
            <Typography variant="h3" sx={{ mb: 4, fontStyle: 'italic', fontWeight: 900 }}>
              {activeRoomId}
            </Typography>
            <Stack spacing={2} sx={{ mb: 6, textAlign: 'left' }}>
              {players.map((p: any) => (
                <Paper key={p.id} sx={{ p: 2.5, bgcolor: alpha('#fff', 0.05), display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4 }}>
                  <Avatar src={p.avatar} sx={{ border: '2px solid', borderColor: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {p.name} {p.id === me?.id && "(Você)"} {p.id === players[0].id && "👑"}
                  </Typography>
                </Paper>
              ))}
              {Array.from({ length: 3 - players.length }).map((_, i) => (
                <Paper key={`empty-${i}`} sx={{ p: 2.5, bgcolor: alpha('#fff', 0.02), border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                  <Typography variant="button" sx={{ color: 'text.secondary' }}>Aguardando jogador...</Typography>
                </Paper>
              ))}
            </Stack>
            {isHost ? (
              <ActionButton fullWidth onClick={() => sendMessage('START_GAME')} size="large">
                INICIAR JOGO AGORA
              </ActionButton>
            ) : (
              <Typography variant="button" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Aguardando o host iniciar a partida...</Typography>
            )}
            <IconButton onClick={() => { setActiveRoomId(''); setRoomIdInput(''); window.location.reload(); }} sx={{ mt: 4 }}>
              <ArrowLeft /> Sair da Sala
            </IconButton>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (session?.gameOver) {
    return (
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        <Paper sx={{ p: 8, maxWidth: 450, width: '100%', textAlign: 'center', borderRadius: 12, border: '2px solid', borderColor: 'primary.main' }}>
          <Trophy size={80} color="#10b981" style={{ marginBottom: 24 }} />
          <Typography variant="h3" sx={{ fontWeight: 900, fontStyle: 'italic', mb: 6 }}>
            Fim de Jogo!
          </Typography>
          <Stack spacing={2} sx={{ mb: 6 }}>
            {[...players].sort((a: any, b: any) => b.score - a.score).map((p: any, i: number) => (
              <Paper key={p.id} sx={{ p: 2, bgcolor: i === 0 ? 'primary.main' : alpha('#fff', 0.05), display: 'flex', justifyContent: 'space-between', borderRadius: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{i + 1}º {p.name}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, fontStyle: 'italic' }}>R$ {p.score}</Typography>
              </Paper>
            ))}
          </Stack>
          <ActionButton fullWidth onClick={() => { setActiveRoomId(''); setRoomIdInput(''); }} size="large">
            SAIR DA SALA
          </ActionButton>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', pb: 4 }}>
      {/* Header */}
      <Container maxWidth="xl" sx={{ pt: 4, mb: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 1.5 }}>
            <ArrowLeft />
          </IconButton>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 4 }}>
              SALA: {activeRoomId}
            </Typography>
            <Typography variant="h3" sx={{ fontStyle: 'italic', fontWeight: 900 }}>
              ROLETRANDO
            </Typography>
          </Box>
          <Box sx={{ width: 48 }} />
        </Stack>
      </Container>


      <Container maxWidth="xl">
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">

          {/* Board Area */}
          <Grid size={12}>
            <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 12, border: myTurn ? '2px solid #10b981' : 'none' }}>
              <Board phrase={session.obscuredPhrase} category={session.category} />
              {session.message && (
                <Typography variant="h6" sx={{ textAlign: 'center', mt: 4, color: 'secondary.main' }}>
                  {session.message}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Players Sidebar */}
          <Grid size={{ xs: 12, lg: 2 }}>
            <Paper sx={{ p: 3, borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="button" sx={{ textAlign: 'center', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, letterSpacing: 2 }}>
                Jogadores
              </Typography>
              <Stack spacing={2}>
                {players.map((p: any) => {
                  const isPlayingNode = currentPlayerTurnId === p.id;
                  return (
                    <Box key={p.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 4,
                      transition: 'all 0.3s',
                      bgcolor: isPlayingNode ? alpha('#10b981', 0.1) : 'transparent',
                      border: '1px solid',
                      borderColor: isPlayingNode ? alpha('#10b981', 0.3) : 'transparent',
                      transform: isPlayingNode ? 'scale(1.05)' : 'none',
                    }}>
                      <Avatar src={p.avatar} sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', textTransform: 'uppercase', lineHeight: 1 }}>
                          {p.name} {me?.id === p.id && "(Você)"}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 900, fontStyle: 'italic', lineHeight: 1, mt: 0.5 }}>
                          R$ {p.score}
                        </Typography>
                      </Box>
                      {isPlayingNode && <Play size={12} color="#10b981" fill="#10b981" />}
                    </Box>
                  )
                })}
              </Stack>
            </Paper>
          </Grid>

          {/* Wheel Center */}
          <Grid size={{ xs: 12, lg: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Wheel
                ref={wheelRef}
                onSpinStart={startSpin}
                onTick={() => playSound('wheelTick')}
                onSpinEnd={handleSpinEnd}
                isSpinning={isSpinning}
              />
              <AnimatePresence>
                {!isSpinning && session.currentSpinValue > 0 && (
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
                    R$ {session.currentSpinValue}
                  </Box>
                )}
              </AnimatePresence>
            </Box>
          </Grid>

          {/* Controls Right */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 4, borderRadius: 6, opacity: myTurn ? 1 : 0.5, pointerEvents: myTurn ? 'auto' : 'none' }}>
                <Typography variant="button" sx={{ display: 'block', mb: 3, color: 'text.secondary', fontWeight: 900 }}>
                  {myTurn ? "SUA VEZ: Selecione uma Letra" : "Aguarde sua vez..."}
                </Typography>
                <Grid container spacing={1}>
                  {ALPHABET.map(l => {
                    const guessed = session.guessedLetters.includes(l);
                    const canPick = session.currentSpinValue > 0 && !isSpinning && myTurn;
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
                  disabled={isSpinning || !myTurn}
                  startIcon={<Lightbulb />}
                >
                  RESPONDER FRASE MESTRA
                </ActionButton>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Roletrando;
