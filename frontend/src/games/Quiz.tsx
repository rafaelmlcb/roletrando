import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, CheckCircle, XCircle, ChevronRight,
    Triangle, Square, Circle, Star, RotateCcw, Play, Users
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';

const QUIZ_DURATION = 20; // seconds

interface Player {
    id: string;
    name: string;
    totalScore: number;
    lastQuestionScore: number;
}

const GENERATED_NAMES = [
    "Lucas", "Maria", "Enzo", "Valentina", "Gabriel", "Sophia", "Joaquim", "Alice", "Matheus", "Laura",
    "Heitor", "Cecília", "Murilo", "Helena", "Bernardo", "Manuela", "Arthur", "Isabella", "Davi", "Beatriz",
    "Gus", "Rafa", "Leo", "Bia", "Cris", "Duda", "Gui", "Lais", "Tico", "Zeca"
];

const Quiz: React.FC = () => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const { userName } = useUser();

    const [currentStep, setCurrentStep] = useState(0);
    const [gameState, setGameState] = useState<'lobby' | 'question' | 'feedback' | 'question_ranking' | 'accumulated_ranking' | 'ended'>('lobby');
    const [timer, setTimer] = useState(QUIZ_DURATION);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isLobbyLocked, setIsLobbyLocked] = useState(false);

    // Multiplayer State
    const [players, setPlayers] = useState<Player[]>([]);
    const timerRef = useRef<number | null>(null);

    // Initialize Local Player
    useEffect(() => {
        setPlayers([{
            id: 'you',
            name: userName || 'Você',
            totalScore: 0,
            lastQuestionScore: 0
        }]);
    }, [userName]);

    // Simulated Joining Logic
    useEffect(() => {
        if (gameState === 'lobby' && !isLobbyLocked) {
            const interval = setInterval(() => {
                if (players.length < 50) { // Limit for UI performance
                    const name = GENERATED_NAMES[Math.floor(Math.random() * GENERATED_NAMES.length)];
                    const newPlayer: Player = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: `${name}_${Math.floor(Math.random() * 99)}`,
                        totalScore: 0,
                        lastQuestionScore: 0
                    };
                    setPlayers(prev => [...prev, newPlayer]);
                }
            }, 1000 + Math.random() * 2000);
            return () => clearInterval(interval);
        }
    }, [gameState, isLobbyLocked, players.length]);

    const startQuiz = () => {
        playSound('click');
        setIsLobbyLocked(true);
        setGameState('question');
        startTimer();
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

    const simulateOthersResults = useCallback(() => {
        setPlayers(prev => prev.map(p => {
            if (p.id === 'you') return p;

            // Randomly decide if correct (70% chance)
            const isCorrect = Math.random() > 0.3;
            if (isCorrect) {
                const speed = Math.random() * (QUIZ_DURATION - 5) + 5; // Responded in 5-20s
                const qScore = Math.floor(1000 * (speed / QUIZ_DURATION));
                return {
                    ...p,
                    lastQuestionScore: qScore,
                    totalScore: p.totalScore + qScore
                };
            }
            return { ...p, lastQuestionScore: 0 };
        }));
    }, [currentStep]);

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (selectedAnswer === null) {
            playSound('wrong');
            setSelectedAnswer(-1);
            simulateOthersResults();
            setGameState('feedback');
        }
    };

    const handleAnswer = (index: number) => {
        if (gameState !== 'question' || selectedAnswer !== null) return;

        if (timerRef.current) clearInterval(timerRef.current);
        setSelectedAnswer(index);

        const question = QUIZ_QUESTIONS[currentStep];
        let youScore = 0;
        if (index === question.answer) {
            playSound('correct');
            youScore = Math.floor(1000 * (timer / QUIZ_DURATION));
            setPlayers(prev => prev.map(p => p.id === 'you' ? { ...p, lastQuestionScore: youScore, totalScore: p.totalScore + youScore } : p));
        } else {
            playSound('wrong');
            setPlayers(prev => prev.map(p => p.id === 'you' ? { ...p, lastQuestionScore: 0 } : p));
        }

        simulateOthersResults();
        setGameState('feedback');
    };

    const toQuestionRanking = () => {
        playSound('click');
        setGameState('question_ranking');
    };

    const toAccumulatedRanking = () => {
        playSound('click');
        setGameState('accumulated_ranking');
    };

    const nextStep = () => {
        playSound('click');
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedAnswer(null);
            setGameState('question');
            startTimer();
        } else {
            playSound('win');
            setGameState('ended');
        }
    };

    const resetQuiz = () => {
        playSound('click');
        setCurrentStep(0);
        setIsLobbyLocked(false);
        setPlayers(prev => prev.map(p => ({ ...p, totalScore: 0, lastQuestionScore: 0 })));
        setSelectedAnswer(null);
        setGameState('lobby');
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const currentQuestion = QUIZ_QUESTIONS[currentStep];
    const optionStyles = [
        { color: 'bg-[#e21b3c]', icon: <Triangle className="w-5 h-5 fill-white" /> }, // Red
        { color: 'bg-[#1368ce]', icon: <Square className="w-5 h-5 fill-white" /> }, // Blue
        { color: 'bg-[#d89e00]', icon: <Circle className="w-5 h-5 fill-white" /> }, // Yellow
        { color: 'bg-[#26890c]', icon: <Star className="w-5 h-5 fill-white" /> }    // Green
    ];

    // Sorted Lists
    const topByQuestion = [...players].sort((a, b) => b.lastQuestionScore - a.lastQuestionScore).slice(0, 10);
    const topAccumulated = [...players].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
    const you = players.find(p => p.id === 'you');

    return (
        <div className="min-h-screen w-full bg-[#46178f] text-white flex flex-col items-center font-sans overflow-x-hidden">
            {/* Header */}
            <header className="w-full max-w-7xl p-4 flex justify-between items-center z-20">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 font-bold backdrop-blur-md border border-white/10">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Início</span>
                </button>
                <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-sm uppercase tracking-widest">{players.length} JOGADORES</span>
                </div>
            </header>

            <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-center p-4 relative">
                <AnimatePresence mode="wait">
                    {gameState === 'lobby' ? (
                        <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full flex flex-col items-center text-center">
                            <div className="bg-white p-10 sm:p-14 rounded-[50px] shadow-3xl max-w-2xl w-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600" />
                                <Trophy className="w-20 h-20 text-[#46178f] mx-auto mb-6" />
                                <h1 className="text-5xl font-black mb-2 uppercase text-[#46178f] italic tracking-tighter">MULTIPLAYER</h1>
                                <p className="text-slate-400 font-bold mb-10 text-sm uppercase tracking-widest">Aguardando desafiantes...</p>

                                {/* Name Cloud */}
                                <div className="relative h-48 mb-8 overflow-hidden bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="absolute inset-0 p-4">
                                        <AnimatePresence>
                                            {players.slice(-20).map((p, i) => (
                                                <motion.div
                                                    key={p.id}
                                                    initial={{ scale: 0, opacity: 0, x: Math.random() * 200 - 100, y: Math.random() * 100 - 50 }}
                                                    animate={{ scale: 1, opacity: 1, x: (i % 5) * 80 - 160, y: Math.floor(i / 5) * 35 - 70 }}
                                                    className="absolute font-black text-[#46178f]/40 uppercase text-xs tracking-tighter"
                                                    style={{ transform: `rotate(${Math.random() * 20 - 10}deg)` }}
                                                >
                                                    {p.name}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                                        ONLINE
                                    </div>
                                </div>

                                <button onClick={startQuiz} className="group relative w-full py-6 bg-[#46178f] text-white font-black text-3xl rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <Play className="w-8 h-8 fill-current" />
                                    JOGAR AGORA
                                </button>
                            </div>
                        </motion.div>
                    ) : gameState === 'question' ? (
                        <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                            <div className="w-full bg-white text-slate-900 p-8 sm:p-12 rounded-[32px] shadow-2xl flex flex-col items-center text-center mb-8 relative border-b-8 border-slate-200">
                                <span className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4">Questão {currentStep + 1} de {QUIZ_QUESTIONS.length}</span>
                                <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-8">{currentQuestion.question}</h2>
                                <div className="relative">
                                    <svg className="w-20 h-20 -rotate-90">
                                        <circle cx="40" cy="40" r="36" stroke="rgba(70, 23, 143, 0.1)" strokeWidth="8" fill="none" />
                                        <circle cx="40" cy="40" r="36" stroke="#46178f" strokeWidth="8" fill="none" strokeDasharray="226" strokeDashoffset={226 - (226 * timer / QUIZ_DURATION)} className="transition-all duration-100 ease-linear" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-[#46178f]">
                                        {Math.ceil(timer)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-[320px] sm:h-[400px]">
                                {currentQuestion.options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ filter: "brightness(1.1)", scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(index)}
                                        className={`${optionStyles[index].color} shadow-xl rounded-2xl p-4 sm:p-6 flex items-center gap-4 text-left transition-all relative border-b-8 border-black/20`}
                                    >
                                        <div className="flex-shrink-0 bg-black/20 p-2 rounded-lg">
                                            {optionStyles[index].icon}
                                        </div>
                                        <span className="text-xl sm:text-2xl font-black text-white">{option}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : gameState === 'feedback' ? (
                        <motion.div key="feedback" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">
                            <div className={`p-8 rounded-full mb-8 shadow-2xl border-t-8 border-white/20 ${selectedAnswer === currentQuestion.answer ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {selectedAnswer === currentQuestion.answer ? <CheckCircle className="w-24 h-24 text-white" /> : <XCircle className="w-24 h-24 text-white" />}
                            </div>
                            <h1 className="text-7xl font-black mb-4 uppercase italic tracking-tighter">
                                {selectedAnswer === currentQuestion.answer ? 'CORRETO!' : 'ERRADO!'}
                            </h1>
                            {selectedAnswer === currentQuestion.answer && (
                                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black text-emerald-300 mb-8">+{you?.lastQuestionScore} PTS</motion.h2>
                            )}
                            <button onClick={toQuestionRanking} className="px-16 py-6 bg-white text-[#46178f] font-black text-3xl rounded-[32px] flex items-center gap-3 hover:scale-105 transition-all shadow-2xl">
                                VER DESEMPENHO <ChevronRight className="w-8 h-8" />
                            </button>
                        </motion.div>
                    ) : gameState === 'question_ranking' ? (
                        <motion.div key="q_ranking" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white p-8 sm:p-12 rounded-[50px] shadow-3xl flex flex-col items-center max-w-2xl w-full border-b-8 border-slate-200">
                            <div className="flex items-center gap-4 mb-2">
                                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                                <h2 className="text-[#46178f] text-3xl font-black uppercase italic">Top da Rodada</h2>
                            </div>
                            <p className="text-slate-400 font-bold mb-10 text-sm uppercase tracking-widest">Os 10 mais rápidos desta questão</p>

                            <div className="w-full space-y-2 mb-10">
                                {topByQuestion.map((p, i) => (
                                    <div key={p.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${p.id === 'you' ? 'bg-[#46178f] text-white shadow-lg scale-105' : 'bg-slate-50'}`}>
                                        <span className={`w-8 font-black text-lg ${p.id === 'you' ? 'text-white' : 'text-slate-300'}`}>{i + 1}</span>
                                        <span className="font-black uppercase flex-grow truncate">{p.name}</span>
                                        <span className="font-black text-xl italic">+{p.lastQuestionScore}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={toAccumulatedRanking} className="w-full py-5 bg-[#46178f] text-white font-black text-2xl rounded-2xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3">
                                PLACAR GERAL <ChevronRight className="w-8 h-8" />
                            </button>
                        </motion.div>
                    ) : gameState === 'accumulated_ranking' ? (
                        <motion.div key="acc_ranking" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-slate-900 border border-white/10 p-8 sm:p-12 rounded-[50px] shadow-3xl flex flex-col items-center max-w-2xl w-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500" />
                            <div className="flex items-center gap-4 mb-2">
                                <Trophy className="w-10 h-10 text-yellow-500" />
                                <h2 className="text-white text-4xl font-black uppercase italic tracking-tighter underline decoration-yellow-500 decoration-8 underline-offset-8">Líderes</h2>
                            </div>
                            <p className="text-slate-500 font-bold mb-10 text-sm uppercase tracking-[0.2em] mt-2">Classificação Global</p>

                            <div className="w-full space-y-2 mb-10">
                                {topAccumulated.map((p, i) => (
                                    <div key={p.id} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${p.id === 'you' ? 'bg-white text-[#46178f] border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/5'}`}>
                                        <span className={`w-10 font-black text-2xl ${i === 0 ? 'text-yellow-500' : 'text-slate-500'}`}>{i + 1}º</span>
                                        <span className="font-black uppercase flex-grow truncate text-lg">{p.name}</span>
                                        <span className="font-black text-2xl text-emerald-400">{p.totalScore.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={nextStep} className="w-full py-6 bg-white text-[#46178f] font-black text-2xl rounded-3xl hover:bg-slate-200 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3">
                                {currentStep < QUIZ_QUESTIONS.length - 1 ? 'PRÓXIMA PERGUNTA' : 'RESULTADO FINAL'}
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="ended" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white text-slate-900 p-12 rounded-[60px] shadow-3xl flex flex-col items-center text-center max-w-2xl w-full border-b-[12px] border-slate-200">
                            <Trophy className="w-32 h-32 text-[#46178f] mb-8 drop-shadow-2xl" />
                            <h1 className="text-5xl font-black mb-2 uppercase text-[#46178f] italic tracking-tighter">Torneio Finalizado!</h1>
                            <p className="text-slate-400 font-bold mb-12 uppercase tracking-widest">Você terminou na {topAccumulated.findIndex(p => p.id === 'you') + 1}ª posição</p>

                            <div className="bg-slate-100 w-full p-12 rounded-[48px] mb-12 border-2 border-[#46178f]/5">
                                <h2 className="text-[100px] font-black text-[#46178f] leading-none mb-4">{you?.totalScore.toLocaleString()}</h2>
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em]">{userName}</p>
                            </div>

                            <div className="flex gap-4 w-full">
                                <button onClick={resetQuiz} className="flex-grow py-6 bg-[#46178f] text-white font-black text-2xl rounded-[32px] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                                    <RotateCcw className="w-7 h-7" />
                                    NOVO JOGO
                                </button>
                                <button onClick={() => navigate('/')} className="flex-grow py-6 bg-slate-200 text-slate-700 font-black text-2xl rounded-[32px] hover:bg-slate-300 transition-all">SAIR</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Quiz;
