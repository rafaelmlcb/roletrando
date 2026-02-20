import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wheel } from '../components/Wheel';
import { Board } from '../components/Board';
import { Coins, Trophy, RefreshCcw, AlertCircle, Lightbulb, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GameState {
  id: string;
  category: string;
  obscuredPhrase: string;
  score: number;
  guessedLetters: string[];
  gameOver: boolean;
  message: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Roletrando: React.FC = () => {
  const [game, setGame] = useState<GameState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinValue, setCurrentSpinValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solveInput, setSolveInput] = useState("");
  const [isSolving, setIsSolving] = useState(false);
  const navigate = useNavigate();

  // Use environment variable for API URL (required for production)
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/game';
  const API_URL = rawApiUrl.endsWith('/api/game') ? rawApiUrl : `${rawApiUrl}/api/game`;

  const startNewGame = async () => {
    try {
      setError(null);
      const resp = await axios.get(`${API_URL}/new`);
      setGame(resp.data);
      setCurrentSpinValue(null);
      setIsSpinning(false);
      setIsSolving(false);
      setSolveInput("");
    } catch (err: any) {
      setError(`Erro de conexão: ${err.message}.`);
    }
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleSpinStart = () => {
    setIsSpinning(true);
    setCurrentSpinValue(null);
    setIsSolving(false);
  };

  const handleSpinEnd = async (value: number) => {
    setIsSpinning(false);
    if (!game) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/spin?value=${value}`);
      setGame(resp.data);
      if (value > 0) {
        setCurrentSpinValue(value);
      } else {
        setCurrentSpinValue(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Sessão expirada. Iniciando novo jogo...");
        setTimeout(startNewGame, 2000);
      }
    }
  };

  const handleGuess = async (letter: string) => {
    if (!game || currentSpinValue === null || isSpinning) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/guess?letter=${letter}`);
      setGame(resp.data);
      setCurrentSpinValue(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Sessão expirada. Reiniciando...");
        setTimeout(startNewGame, 2000);
      }
    }
  };

  const handleSolve = async () => {
    if (!game || isSpinning || !solveInput.trim()) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/solve?phrase=${encodeURIComponent(solveInput)}`);
      setGame(resp.data);
      if (resp.data.gameOver) {
        setCurrentSpinValue(null);
        setIsSolving(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Sessão expirada. Reiniciando...");
        setTimeout(startNewGame, 2000);
      }
    }
  };

  if (error) return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
      <AlertCircle className="w-16 h-16 text-yellow-500 mb-6" />
      <p className="text-xl text-yellow-200 mb-6 max-w-md">{error}</p>
      <button onClick={startNewGame} className="px-8 py-3 bg-indigo-500 rounded-2xl font-bold hover:bg-indigo-600 transition-all">
        Reiniciar Manualmente
      </button>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1e] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-2xl font-black uppercase tracking-widest animate-pulse">Carregando...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center p-4 overflow-x-hidden relative">
      {/* Header */}
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
          <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
            <Coins className="text-emerald-400 w-5 h-5" />
            <span className="text-xl sm:text-2xl font-black">{game.score.toLocaleString()}</span>
          </div>
          <button onClick={startNewGame} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="w-full max-w-6xl flex flex-col items-center gap-8 sm:gap-12 z-10">
        {/* Interaction Area */}
        <div className="w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Wheel Section */}
          <div className="flex-shrink-0">
            <Wheel onSpinEnd={handleSpinEnd} isSpinning={isSpinning} onSpinStart={handleSpinStart} />
          </div>

          {/* User Input Section */}
          <div className="flex-grow max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isSpinning ? (
                <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <p className="text-3xl font-black italic text-emerald-400 animate-pulse uppercase">Girando a Roleta...</p>
                </motion.div>
              ) : game.gameOver ? (
                <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-black mb-2 uppercase">VITÓRIA!</h2>
                  <p className="text-xl text-slate-300 mb-6 font-bold">{game.message}</p>
                  <button onClick={startNewGame} className="px-10 py-4 bg-emerald-400 text-slate-950 font-black rounded-xl uppercase hover:scale-105 active:scale-95 transition-all">Próxima Rodada</button>
                </motion.div>
              ) : isSolving ? (
                <motion.div key="solving" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="w-full flex flex-col items-center gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white italic">QUAL É A FRASE?</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase">Cuidado: Errar não tira pontos, mas você perde a chance.</p>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={solveInput}
                    onChange={(e) => setSolveInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
                    placeholder="DIGITE A FRASE COMPLETA..."
                    className="w-full bg-slate-800 border-2 border-emerald-400/50 p-4 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-emerald-400"
                  />
                  <div className="flex gap-4">
                    <button onClick={handleSolve} className="px-8 py-3 bg-emerald-400 text-slate-950 font-black rounded-lg uppercase">CONFIRMAR</button>
                    <button onClick={() => setIsSolving(false)} className="px-8 py-3 bg-slate-700 text-white font-black rounded-lg uppercase">VOLTAR</button>
                  </div>
                </motion.div>
              ) : currentSpinValue !== null ? (
                <motion.div key="guess" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full">
                  <div className="text-center mb-6">
                    <p className="text-2xl font-black text-emerald-400 italic">VALENDO {currentSpinValue} PONTOS!</p>
                    <p className="text-slate-400 font-bold text-sm uppercase">Cada letra correta multiplica este valor</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {ALPHABET.map(letter => (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={game.guessedLetters.includes(letter)}
                        className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-800 hover:bg-white hover:text-slate-900 disabled:opacity-20 rounded-lg font-black text-xl transition-all shadow-md active:translate-y-1"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                  <div className="w-full flex justify-center">
                    <button
                      onClick={() => setIsSolving(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-slate-800/50 hover:bg-slate-700 border border-white/10 rounded-full text-slate-300 font-black text-sm uppercase transition-all"
                    >
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      Arriscar Frase
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-slate-400 mb-1 uppercase tracking-widest">Aguardando giro...</p>
                    {game.message && <p className="text-emerald-400 font-black italic text-lg">{game.message}</p>}
                  </div>
                  <button
                    onClick={() => setIsSolving(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-800/50 hover:bg-slate-700 border border-white/10 rounded-full text-slate-300 font-black text-sm uppercase transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-emerald-400" />
                    Arriscar Frase
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The Board */}
        <div className="w-full pb-12">
          <Board phrase={game.obscuredPhrase} category={game.category} />
        </div>
      </main>
    </div>
  );
};

export default Roletrando;
