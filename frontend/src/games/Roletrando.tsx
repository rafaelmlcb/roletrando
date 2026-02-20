import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Wheel } from '../components/Wheel';
import { Board } from '../components/Board';
import { Trophy, RefreshCcw, AlertCircle, Lightbulb, ArrowLeft, User, Users, Bot, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';

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
  score: number; // This is now legacy for single player, will use players[i].score
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
  const botTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

      // Fill remaining slots with bots up to 3
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

      const resp = await axios.post(`${API_URL}/api/game/start`);
      setGame(resp.data);
      setGuessedLetters([]);
      setTurnIndex(0);
      setGamePhase('playing');
    } catch (err) {
      setError('Erro ao iniciar o jogo. Verifique se o backend está rodando.');
      console.error(err);
    }
  };

  const nextTurn = (reason: 'wrong' | 'lose-all' | 'solve-fail' | 'correct') => {
    if (reason === 'correct') return; // Keep same player

    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  const updatePlayerScore = (points: number, reset: boolean = false) => {
    setPlayers(prev => prev.map((p, i) => {
      if (i === turnIndex) {
        return { ...p, score: reset ? 0 : p.score + points };
      }
      return p;
    }));
  };

  const handleGuess = async (letter: string) => {
    if (!game || isSpinning || currentSpinValue === null || guessedLetters.includes(letter)) return;

    try {
      const oldPhrase = game.obscuredPhrase;
      const resp = await axios.post(`${API_URL}/api/game/${game.id}/guess?letter=${letter}`);
      setGame(resp.data);
      setGuessedLetters(prev => [...prev, letter]);

      if (resp.data.obscuredPhrase !== oldPhrase) {
        playSound('correct');
        const count = (resp.data.obscuredPhrase.match(new RegExp(letter, 'gi')) || []).length;
        updatePlayerScore(currentSpinValue * count);
        setCurrentSpinValue(null);
        // Correct guess, same player continues
      } else {
        playSound('wrong');
        setCurrentSpinValue(null);
        nextTurn('wrong');
      }
    } catch (err) {
      setError('Erro ao processar palpite.');
    }
  };

  const handleSolve = async () => {
    if (!game || isSpinning) return;
    const solution = prompt('Qual é a frase?')?.toUpperCase();
    if (!solution) return;

    try {
      const resp = await axios.post(`${API_URL}/api/game/${game.id}/solve?solution=${solution}`);
      setGame(resp.data);
      if (resp.data.gameOver) {
        playSound('win');
        setGamePhase('winner');
      } else {
        playSound('wrong');
        nextTurn('solve-fail');
      }
    } catch (err) {
      setError('Erro ao tentar resolver.');
    }
  };

  const handleSpinEnd = (value: number) => {
    setIsSpinning(false);
    if (value === 0) {
      playSound('wrong'); // Use wrong or specific lose sound
      updatePlayerScore(0, true);
      setCurrentSpinValue(null);
      nextTurn('lose-all');
    } else {
      setCurrentSpinValue(value);
    }
  };

  // AI Logic
  useEffect(() => {
    if (gamePhase === 'playing' && players[turnIndex]?.isBot && !isSpinning) {
      if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current);

      botTurnTimeoutRef.current = setTimeout(async () => {
        if (currentSpinValue === null) {
          // Trigger spin start (simulated)
          setIsSpinning(true);
          playSound('spin');
        } else {
          // AI makes a guess
          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          const unrevealed = alphabet.split('').filter(l => !guessedLetters.includes(l));
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
  }, [turnIndex, currentSpinValue, isSpinning, gamePhase, guessedLetters]);

  if (gamePhase === 'lobby') {
    return (
      <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 p-12 rounded-[40px] shadow-2xl max-w-lg w-full text-center">
          <Users className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
          <h1 className="text-5xl font-black italic tracking-tighter mb-4 text-white">LOBBY</h1>
          <p className="text-slate-400 font-bold mb-10 uppercase tracking-widest text-sm italic">Roletrando Multiplayer</p>

          <div className="space-y-4 mb-10 text-left">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <img src={p.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-emerald-400/50" />
                <span className="font-bold text-lg">{p.name} {i === 0 && "(Você)"}</span>
                <span className="ml-auto flex items-center gap-2 text-emerald-400 animate-pulse">
                  <Play className="w-4 h-4 fill-current" />
                  Pronto
                </span>
              </div>
            ))}
            {players.length < 3 && (
              <div className="bg-white/5 p-4 rounded-2xl border border-dashed border-white/20 flex items-center justify-center gap-4 text-slate-500 font-bold">
                <Users className="w-6 h-6 animate-bounce" />
                Aguardando Jogadores...
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={startGame} className="w-full py-5 bg-emerald-500 text-white font-black text-2xl rounded-2xl hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-3">
              COMEÇAR COM ROBÔS
              <Play className="w-6 h-6 fill-current" />
            </button>
            <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 transition-colors">VOLTAR</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentPlayer = players[turnIndex];

  return (
    <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center p-4 sm:p-8 overflow-x-hidden">
      <div className="fixed inset-0 bg-[#0f172a] -z-10" />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 -z-10" />

      <header className="w-full max-w-6xl flex justify-between items-center mb-8 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
            <ArrowLeft className="w-6 h-6" />
            <span className="hidden sm:inline font-bold">Início</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white">ROLETRANDO</h1>
            <div className="h-1 w-full bg-emerald-400 mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all duration-500 ${currentPlayer?.isBot ? 'bg-blue-500/20 border-blue-400/50' : 'bg-emerald-500/20 border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-105'}`}>
            {currentPlayer?.isBot ? <Bot className="w-6 h-6 text-blue-400" /> : <User className="w-6 h-6 text-emerald-400" />}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Turno de</span>
              <span className="text-xl font-black italic">{currentPlayer?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="w-full max-w-3xl bg-rose-500/20 border border-rose-500/50 p-4 rounded-xl flex items-center gap-3 mb-8 text-rose-200 font-bold">
          <AlertCircle className="w-6 h-6" />
          {error}
        </div>
      )}

      {game && (
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">

          {/* Main Game Area */}
          <div className="flex-grow flex flex-col items-center gap-12">
            <div className="bg-slate-900/60 p-8 sm:p-12 rounded-[48px] border border-white/5 backdrop-blur-3xl shadow-2xl w-full">
              <Board obscuredPhrase={game.obscuredPhrase} category={game.category} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-16 w-full justify-center">
              <div className="relative">
                <Wheel
                  onSpinStart={() => {
                    setIsSpinning(true);
                    playSound('spin');
                    setCurrentSpinValue(null);
                  }}
                  onSpinEnd={handleSpinEnd}
                  isSpinning={isSpinning}
                />

                <AnimatePresence>
                  {currentSpinValue !== null && (
                    <motion.div initial={{ scale: 0, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0, y: -50 }} className="absolute -top-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-full font-black text-3xl shadow-[0_10px_40px_rgba(16,185,129,0.4)] border-4 border-white">
                      R$ {currentSpinValue}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-6 w-full max-w-md">
                <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
                  <h3 className="text-slate-400 font-black text-sm uppercase tracking-widest mb-6">Controle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleSolve} disabled={isSpinning || !!currentPlayer?.isBot} className="py-4 bg-emerald-500 text-white font-black text-xl rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                      <Lightbulb className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      RESOLVER
                    </button>
                    <button onClick={() => navigate('/')} className="py-4 bg-slate-800 text-white font-black text-xl rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                      <RefreshCcw className="w-6 h-6" />
                      NOVO
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
                  <h3 className="text-slate-400 font-black text-sm uppercase tracking-widest mb-4">Palpites Atuais</h3>
                  <div className="flex flex-wrap gap-2">
                    {guessedLetters.length === 0 ? (
                      <span className="text-slate-600 font-italic">Nenhuma letra escolhida...</span>
                    ) : (
                      guessedLetters.map(l => (
                        <span key={l} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg font-black text-emerald-400 border border-emerald-400/20">
                          {l}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Avatars Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-slate-900/60 p-6 rounded-[32px] border border-white/10 backdrop-blur-2xl">
              <h3 className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mb-8 text-center border-b border-white/5 pb-4">Placar Geral</h3>

              <div className="space-y-4">
                {players.map((p, i) => (
                  <div key={p.id} className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${i === turnIndex ? 'bg-emerald-500/20 border-2 border-emerald-500/50 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-white/5 border border-white/5 opacity-70'}`}>
                    <div className="relative">
                      <img src={p.avatar} alt="avatar" className={`w-14 h-14 rounded-full border-2 ${i === turnIndex ? 'border-emerald-400' : 'border-slate-600'}`} />
                      {i === turnIndex && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0f1e] flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{p.name}</span>
                        {p.isBot && <Bot className="w-3 h-3 text-blue-400" />}
                      </div>
                      <span className="text-2xl font-black text-emerald-400 italic">R$ {p.score}</span>
                    </div>

                    {/* Turn Progress/Indicator */}
                    {i === turnIndex && (
                      <motion.div layoutId="turn-indicator" className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-emerald-500/10 p-6 rounded-[32px] border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3 text-emerald-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-black text-xs uppercase">Como Jogar</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Gire a roleta e escolha uma letra. Se acertar, você ganha o valor sorteado multiplicado pela quantidade de letras. Se errar, passa a vez!
              </p>
            </div>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {gamePhase === 'winner' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 p-12 rounded-[48px] shadow-3xl flex flex-col items-center text-center max-w-2xl w-full">
              <Trophy className="w-24 h-24 text-emerald-500 mb-6 drop-shadow-xl" />
              <h1 className="text-5xl font-black mb-2 italic uppercase text-[#0a0f1e]">PARABÉNS!</h1>
              <h2 className="text-2xl font-bold mb-10 text-slate-500 italic uppercase italic">O Grande Vencedor é {players[players.reduce((best, p, i) => p.score > players[best].score ? i : best, 0)].name}!</h2>

              <div className="bg-slate-100 w-full p-10 rounded-[40px] mb-12 border-2 border-emerald-500/20">
                <div className="grid grid-cols-1 gap-6">
                  {players.sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl ${i === 0 ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-xl">{i + 1}º</span>
                        <img src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-black/10" />
                        <span className="font-black uppercase">{p.name}</span>
                      </div>
                      <span className="text-2xl font-black italic">R$ {p.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button onClick={() => setGamePhase('lobby')} className="flex-grow py-5 bg-emerald-500 text-white font-black text-xl rounded-[24px] shadow-xl hover:scale-105 transition-all uppercase">Jogar Novamente</button>
                <button onClick={() => navigate('/')} className="flex-grow py-5 bg-slate-200 text-slate-700 font-black text-xl rounded-[24px] hover:bg-slate-300 transition-all uppercase">Sair</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roletrando;
