import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Wheel } from '../components/Wheel';
import type { WheelHandle } from '../components/Wheel';
import { Board } from '../components/Board';
import { Trophy, ArrowLeft, Play } from 'lucide-react';
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/game';

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
      setGame(resp.data.game);
      setGuessedLetters(prev => [...prev, letter]);

      if (resp.data.correct) {
        playSound('correct');
        updatePlayerScore(currentSpinValue * resp.data.count);
        if (resp.data.game.gameOver) {
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
      setGame(resp.data.game);
      if (resp.data.correct) {
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
  }, [turnIndex, currentSpinValue, isSpinning, gamePhase, guessedLetters, game, ALPHABET]);

  const currentPlayer = players[turnIndex];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-4 sm:p-8 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="fixed inset-0 bg-[#0f172a] -z-10" />

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">MEGA SHOW</h2>
          <h1 className="text-3xl font-black italic tracking-tighter">ROLETRANDO</h1>
        </div>
        <div className="w-12" />
      </header>

      {error && (
        <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-center">
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {gamePhase === 'lobby' && (
        <div className="max-w-xl mx-auto mt-20 text-center">
          <div className="bg-slate-900 border border-white/10 p-12 rounded-[40px] shadow-2xl">
            <h2 className="text-3xl font-black mb-8 uppercase italic">Lobby de Espera</h2>
            <div className="space-y-4 mb-8 text-left">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <img src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-emerald-400/50" />
                  <span className="font-bold text-lg">{p.name} {p.id === '1' && "(Você)"}</span>
                </div>
              ))}
            </div>
            <button onClick={startGame} className="w-full py-6 bg-emerald-500 text-white font-black text-2xl rounded-3xl hover:bg-emerald-600 transition-all">
              INICIAR JOGO
            </button>
          </div>
        </div>
      )}

      {game && gamePhase === 'playing' && (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6">

          {/* Dashboard Area */}
          <div className="w-full bg-slate-900/60 p-6 sm:p-10 rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl">
            <Board phrase={game.obscuredPhrase} category={game.category} />
          </div>

          <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">

            {/* Left Sidebar: Players (Strict Compact) */}
            <aside className="w-full lg:w-48 xl:w-56 flex flex-col gap-4 flex-shrink-0">
              <div className="bg-slate-900/60 p-4 rounded-[32px] border border-white/10">
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 text-center border-b border-white/5 pb-2">Placar</h3>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${i === turnIndex ? 'bg-emerald-500/20 border border-emerald-500/50 scale-105' : 'bg-white/5 opacity-60'}`}>
                      <img src={p.avatar} alt="av" className="w-8 h-8 rounded-full border border-white/20" />
                      <div className="flex flex-col min-w-0 flex-grow">
                        <span className="font-black text-[9px] uppercase truncate">{p.name}</span>
                        <span className="text-sm font-black text-emerald-400 italic">R$ {p.score}</span>
                      </div>
                      {i === turnIndex && <Play className="w-3 h-3 text-emerald-400 fill-current" />}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Center: Wheel */}
            <div className="flex flex-col items-center gap-6 flex-shrink-0">
              <div className="relative">
                <Wheel
                  ref={wheelRef}
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
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }} className="absolute -top-16 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-black text-2xl shadow-xl z-30">
                      R$ {currentSpinValue}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Keyboard & Controls */}
            <div className="flex flex-col gap-4 w-full lg:w-80 flex-grow max-w-sm">
              <div className="bg-slate-900/40 p-5 rounded-[24px] border border-white/5 backdrop-blur-xl">
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-3">Escolha uma Letra</h3>
                <div className="grid grid-cols-7 gap-1">
                  {ALPHABET.map(l => {
                    const guessed = guessedLetters.includes(l);
                    const canPick = currentSpinValue !== null && !isSpinning && !currentPlayer?.isBot;
                    return (
                      <button
                        key={l}
                        disabled={!canPick || guessed}
                        onClick={() => handleGuess(l)}
                        className={`h-8 w-8 text-xs flex items-center justify-center rounded-lg font-black transition-all ${guessed ? 'bg-slate-800 text-slate-600' : canPick ? 'bg-white/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={handleSolve} disabled={isSpinning || !!currentPlayer?.isBot} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 disabled:opacity-50">
                  RESPONDER
                </button>
                <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700">
                  NOVO JOGO
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {gamePhase === 'winner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 p-10 rounded-[40px] border-2 border-emerald-500 text-center max-w-sm w-full">
            <Trophy className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-6 uppercase italic">Fim de Jogo!</h2>
            <div className="space-y-3 mb-8">
              {players.sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-emerald-500' : 'bg-white/5'}`}>
                  <span className="font-bold">{p.name}</span>
                  <span className="font-black italic">R$ {p.score}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/')} className="w-full py-5 bg-white text-slate-900 font-black text-xl rounded-2xl hover:scale-105 transition-all">
              JOGAR DE NOVO
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Roletrando;
