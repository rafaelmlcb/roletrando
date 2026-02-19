import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wheel } from './components/Wheel';
import { Board } from './components/Board';
import { Coins, Trophy, RefreshCcw, AlertCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

/**
 * Main application component.
 * Manages game state synchronization with Quarkus backend and coordinate UI events.
 */
const App: React.FC = () => {
  const [game, setGame] = useState<GameState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinValue, setCurrentSpinValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solveInput, setSolveInput] = useState("");
  const [isSolving, setIsSolving] = useState(false);

  // Use environment variable for API URL (required for production)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/game';

  /**
   * Starts a new game by calling the backend API.
   * Resets scores and wheel state.
   */
  const startNewGame = async () => {
    console.group("Lifecycle: Start New Game");
    try {
      setError(null);
      const resp = await axios.get(`${API_URL}/new`);
      console.log("Session created:", resp.data);
      setGame(resp.data);
      setCurrentSpinValue(null);
      setIsSpinning(false);
      setIsSolving(false);
      setSolveInput("");
    } catch (err: any) {
      console.error("Critical error starting game", err);
      setError(`Erro de conexão (${API_URL}): ${err.message}. Verifique se a URL da API está correta no Vercel.`);
    } finally {
      console.groupEnd();
    }
  };

  useEffect(() => {
    startNewGame();
  }, []);

  /**
   * Disables inputs and starts frontend spin animation.
   */
  const handleSpinStart = () => {
    console.log("Event: Wheel spin started");
    setIsSpinning(true);
    setCurrentSpinValue(null);
    setIsSolving(false);
  };

  /**
   * Callback for when the wheel stops.
   * Synchronizes the landed value with the backend.
   * @param value Point value from wheel segment.
   */
  const handleSpinEnd = async (value: number) => {
    console.group(`Event: Wheel spin ended at ${value}`);
    setIsSpinning(false);
    if (!game) return;

    try {
      const resp = await axios.post(`${API_URL}/${game.id}/spin?value=${value}`);
      console.log("Server synced spin state:", resp.data);
      setGame(resp.data);
      if (value > 0) {
        setCurrentSpinValue(value);
      } else {
        console.warn("Player Bankrupt (0 points)");
        setCurrentSpinValue(null);
      }
    } catch (err: any) {
      console.error("Communication error during spin sync", err);
      if (err.response?.status === 404) {
        setError("Sessão expirada ou servidor reiniciado. Iniciando novo jogo...");
        setTimeout(startNewGame, 2000);
      }
    } finally {
      console.groupEnd();
    }
  };

  /**
   * Sends a letter guess to the server.
   * Multiplies score if correct.
   * @param letter Char A-Z.
   */
  const handleGuess = async (letter: string) => {
    if (!game || currentSpinValue === null || isSpinning) return;

    console.group(`Action: User guessed '${letter}' (for ${currentSpinValue} pts/letter)`);
    try {
      const resp = await axios.post(`${API_URL}/${game.id}/guess?letter=${letter}`);
      console.log("Updated state from guess:", resp.data);
      setGame(resp.data);
      setCurrentSpinValue(null);
    } catch (err: any) {
      console.error("Guess request failed", err);
      if (err.response?.status === 404) {
        setError("Sessão expirada. Reiniciando...");
        setTimeout(startNewGame, 2000);
      }
    } finally {
      console.groupEnd();
    }
  };

  /**
   * Attempts to solve the entire phrase at once.
   */
  const handleSolve = async () => {
    if (!game || isSpinning || !solveInput.trim()) return;

    console.group(`Action: User attempted to solve with '${solveInput}'`);
    try {
      const resp = await axios.post(`${API_URL}/${game.id}/solve?phrase=${encodeURIComponent(solveInput)}`);
      console.log("Updated state from solve attempt:", resp.data);
      setGame(resp.data);
      if (resp.data.gameOver) {
        setCurrentSpinValue(null);
        setIsSolving(false);
      }
    } catch (err: any) {
      console.error("Solve request failed", err);
      if (err.response?.status === 404) {
        setError("Sessão expirada. Reiniciando...");
        setTimeout(startNewGame, 2000);
      }
    } finally {
      console.groupEnd();
    }
  };

  if (error) return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
      <AlertCircle className="w-16 h-16 text-yellow-500 mb-6" />
      <p className="text-xl text-yellow-200 mb-6 max-w-md">{error}</p>
      <button onClick={startNewGame} className="px-8 py-3 bg-primary rounded-2xl font-bold hover:bg-indigo-600 transition-all">
        Reiniciar Manualmente
      </button>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1e] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-2xl font-black uppercase tracking-widest animate-pulse">Carregando...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center p-4 overflow-x-hidden relative">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 z-20">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white">ROLETRANDO</h1>
          <div className="h-1 w-full bg-accent mt-1" />
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
            <Coins className="text-accent w-5 h-5" />
            <span className="text-2xl font-black">{game.score.toLocaleString()}</span>
          </div>
          <button onClick={startNewGame} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="w-full max-w-6xl flex flex-col items-center gap-12 z-10">

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
                  <p className="text-3xl font-black italic text-accent animate-pulse uppercase">Girando a Roleta...</p>
                </motion.div>
              ) : game.gameOver ? (
                <motion.div key="win" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-3xl font-black mb-2 uppercase">VITÓRIA!</h2>
                  <p className="text-xl text-slate-300 mb-6 font-bold">{game.message}</p>
                  <button onClick={startNewGame} className="px-10 py-4 bg-accent text-slate-950 font-black rounded-xl uppercase hover:scale-105 active:scale-95 transition-all">Próxima Rodada</button>
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
                    className="w-full bg-slate-800 border-2 border-accent/50 p-4 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-accent"
                  />
                  <div className="flex gap-4">
                    <button onClick={handleSolve} className="px-8 py-3 bg-accent text-slate-950 font-black rounded-lg uppercase">CONFIRMAR</button>
                    <button onClick={() => setIsSolving(false)} className="px-8 py-3 bg-slate-700 text-white font-black rounded-lg uppercase">VOLTAR</button>
                  </div>
                </motion.div>
              ) : currentSpinValue !== null ? (
                <motion.div key="guess" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full">
                  <div className="text-center mb-6">
                    <p className="text-2xl font-black text-accent italic">VALENDO {currentSpinValue} PONTOS!</p>
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
                      <Lightbulb className="w-4 h-4 text-accent" />
                      Arriscar Frase
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-slate-400 mb-1 uppercase tracking-widest">Aguardando giro...</p>
                    {game.message && <p className="text-accent font-black italic text-lg">{game.message}</p>}
                  </div>
                  <button
                    onClick={() => setIsSolving(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-800/50 hover:bg-slate-700 border border-white/10 rounded-full text-slate-300 font-black text-sm uppercase transition-all"
                  >
                    <Lightbulb className="w-4 h-4 text-accent" />
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

export default App;
