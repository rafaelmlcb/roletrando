import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, CheckCircle, XCircle, ChevronRight,
    RotateCcw, Triangle, Square, Circle, Star
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { useSound } from '../hooks/useSound';

const QUIZ_DURATION = 20; // seconds

const Quiz: React.FC = () => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const [currentStep, setCurrentStep] = useState(0);
    const [gameState, setGameState] = useState<'lobby' | 'question' | 'feedback' | 'ended'>('lobby');
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(QUIZ_DURATION);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [lastPoints, setLastPoints] = useState(0);

    const timerRef = useRef<number | null>(null);

    const startQuiz = () => {
        playSound('click');
        setGameState('question');
        startTimer();
    };

    const startTimer = () => {
        setTimer(QUIZ_DURATION);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = window.setInterval(() => {
            setTimer((prev) => {
                if (prev <= 0.1) {
                    handleTimeUp();
                    return 0;
                }
                // Play ticker sound every second
                if (Math.ceil(prev) !== Math.ceil(prev - 0.1)) {
                    playSound('ticker');
                }
                return prev - 0.1;
            });
        }, 100);
    };

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (selectedAnswer === null) {
            playSound('wrong');
            setSelectedAnswer(-1); // Mark as timed out
            setLastPoints(0);
            setGameState('feedback');
        }
    };

    const handleAnswer = (index: number) => {
        if (gameState !== 'question' || selectedAnswer !== null) return;

        if (timerRef.current) clearInterval(timerRef.current);
        setSelectedAnswer(index);

        const question = QUIZ_QUESTIONS[currentStep];
        if (index === question.answer) {
            playSound('correct');
            // Speed scoring: max 1000 points
            const points = Math.floor(1000 * (timer / QUIZ_DURATION));
            setLastPoints(points);
            setScore(prev => prev + points);
        } else {
            playSound('wrong');
            setLastPoints(0);
        }

        setGameState('feedback');
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
        setScore(0);
        setSelectedAnswer(null);
        setGameState('lobby');
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const currentQuestion = QUIZ_QUESTIONS[currentStep];

    // Refined Kahoot-style colors (Red, Blue, Yellow, Green)
    const optionStyles = [
        {
            color: 'from-red-500 to-red-600',
            hover: 'hover:shadow-red-500/40',
            border: 'border-red-400/30',
            icon: <Triangle className="w-10 h-10 fill-white/20" />
        },
        {
            color: 'from-sky-500 to-sky-600',
            hover: 'hover:shadow-sky-500/40',
            border: 'border-sky-400/30',
            icon: <Square className="w-10 h-10 fill-white/20" />
        },
        {
            color: 'from-amber-400 to-amber-500',
            hover: 'hover:shadow-amber-400/40',
            border: 'border-amber-300/30',
            icon: <Circle className="w-10 h-10 fill-white/20" />
        },
        {
            color: 'from-green-500 to-green-600',
            hover: 'hover:shadow-green-500/40',
            border: 'border-green-400/30',
            icon: <Star className="w-10 h-10 fill-white/20" />
        }
    ];

    return (
        <div className="min-h-screen w-full bg-[#1e0a3d] text-white flex flex-col items-center overflow-hidden font-sans selection:bg-white/20">
            {/* Header */}
            <header className="w-full max-w-7xl p-6 flex justify-between items-center z-20">
                <motion.button
                    whileHover={{ x: -5 }}
                    onClick={() => navigate('/')}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-3 font-bold backdrop-blur-xl border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">Voltar</span>
                </motion.button>
                <div className="bg-white group px-8 py-3 rounded-2xl font-black text-2xl text-[#1e0a3d] shadow-xl shadow-black/20 flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-amber-500 group-hover:scale-125 transition-transform" />
                    <span>{score.toLocaleString()}</span>
                </div>
            </header>

            <main className="flex-grow w-full max-w-6xl flex flex-col items-center justify-center p-4 relative">
                <AnimatePresence mode="wait">
                    {gameState === 'lobby' ? (
                        <motion.div
                            key="lobby"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="bg-white/10 backdrop-blur-3xl p-10 sm:p-16 rounded-[48px] border border-white/10 shadow-3xl flex flex-col items-center text-center max-w-xl w-full"
                        >
                            <div className="w-28 h-28 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/30 -rotate-6">
                                <Trophy className="w-14 h-14 text-white" />
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black mb-6 uppercase tracking-tighter leading-none">
                                Desafio de <br /><span className="text-amber-400">Velocidade</span>
                            </h1>
                            <p className="text-slate-300 font-semibold mb-12 leading-relaxed max-w-xs">
                                Responda o mais rápido possível para multiplicar seus pontos!
                            </p>
                            <button
                                onClick={startQuiz}
                                className="w-full py-6 bg-white text-[#1e0a3d] font-black text-2xl rounded-3xl hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/10 group flex items-center justify-center gap-3"
                            >
                                COMEÇAR
                                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ) : gameState === 'question' ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Question Card */}
                            <div className="w-full bg-white/5 backdrop-blur-2xl border-2 border-white/10 p-8 sm:p-12 rounded-[40px] shadow-2xl flex flex-col items-center text-center mb-8 relative group">
                                <div className="absolute top-0 left-0 w-full h-2 bg-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: QUIZ_DURATION, ease: "linear" }}
                                    />
                                </div>
                                <span className="text-white/30 font-black uppercase tracking-widest text-xs mb-4">Questão {currentStep + 1} de {QUIZ_QUESTIONS.length}</span>
                                <h2 className="text-2xl sm:text-4xl font-black leading-tight max-w-4xl">{currentQuestion.question}</h2>

                                <div className="mt-8 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-2xl border-2 border-white/10 flex items-center justify-center relative bg-white/5 overflow-hidden group-hover:scale-110 transition-transform">
                                        <div className="absolute inset-0 bg-white/5 animate-pulse" />
                                        <span className="text-3xl font-black text-amber-400 z-10">{Math.ceil(timer)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2x2 Grid Layout */}
                            <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl h-[400px] sm:h-[500px]">
                                {currentQuestion.options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(index)}
                                        className={`bg-gradient-to-br ${optionStyles[index].color} ${optionStyles[index].border} ${optionStyles[index].hover} border-2 shadow-xl rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden group`}
                                    >
                                        <div className="mb-4 sm:mb-6 transition-transform group-hover:scale-110 group-hover:rotate-[10deg]">
                                            {optionStyles[index].icon}
                                        </div>
                                        <span className="text-xl sm:text-3xl font-black text-white drop-shadow-md leading-tight">{option}</span>

                                        {/* Background Decoration */}
                                        <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            {React.cloneElement(optionStyles[index].icon as React.ReactElement<any>, { size: 120 })}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : gameState === 'feedback' ? (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center text-center w-full max-w-2xl px-4"
                        >
                            {selectedAnswer === currentQuestion.answer ? (
                                <div className="w-full">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                                        className="bg-emerald-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-emerald-500/50"
                                    >
                                        <CheckCircle className="w-20 h-20 text-white" />
                                    </motion.div>
                                    <h1 className="text-6xl font-black mb-6 uppercase tracking-tighter text-emerald-400">Boa!</h1>
                                    <div className="bg-white/10 backdrop-blur-xl px-10 py-8 rounded-[40px] border border-white/10 mb-12 shadow-2xl">
                                        <p className="text-white/40 font-black uppercase tracking-widest text-xs mb-2">Ponto de Velocidade</p>
                                        <h2 className="text-6xl font-black text-white tracking-tight">+{lastPoints}</h2>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-rose-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-rose-500/50"
                                    >
                                        <XCircle className="w-20 h-20 text-white" />
                                    </motion.div>
                                    <h1 className="text-6xl font-black mb-6 uppercase tracking-tighter text-rose-400">
                                        {selectedAnswer === -1 ? 'Tempo Esgotado' : 'Errado!'}
                                    </h1>
                                    <div className="bg-white/10 backdrop-blur-xl px-10 py-8 rounded-[40px] border border-white/10 mb-12 shadow-2xl">
                                        <p className="text-white/40 font-black uppercase tracking-widest text-xs mb-4">A Resposta era:</p>
                                        <h2 className="text-3xl font-black text-white">{currentQuestion.options[currentQuestion.answer]}</h2>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={nextStep}
                                className="w-full py-6 bg-white text-[#1e0a3d] font-black text-2xl rounded-3xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20"
                            >
                                {currentStep < QUIZ_QUESTIONS.length - 1 ? 'PRÓXIMA' : 'VER PLACAR'}
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 backdrop-blur-3xl p-12 sm:p-20 rounded-[64px] border border-white/10 shadow-3xl flex flex-col items-center text-center max-w-3xl w-full"
                        >
                            <Trophy className="w-32 h-32 text-amber-400 mb-8 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-bounce" />
                            <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter leading-none">Fim de Jogo!</h1>
                            <p className="text-slate-400 font-bold mb-12 text-2xl">Você alcançou:</p>

                            <div className="bg-white/5 border border-white/10 w-full p-12 rounded-[48px] mb-12 relative overflow-hidden group shadow-inner">
                                <h2 className="text-8xl font-black text-white tracking-tighter">{score.toLocaleString()}</h2>
                                <p className="text-amber-400 font-black uppercase tracking-[0.3em] mt-4 text-sm">Pontuação Total</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 w-full">
                                <button
                                    onClick={resetQuiz}
                                    className="flex-grow py-6 bg-white text-[#1e0a3d] font-black text-xl rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                    JOGAR DE NOVO
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-grow py-6 bg-white/10 text-white font-black text-xl rounded-2xl border border-white/10 transition-all hover:bg-white/20"
                                >
                                    SAIR
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Global Progress */}
            {gameState !== 'lobby' && gameState !== 'ended' && (
                <footer className="w-full max-w-7xl px-8 pb-10 flex items-center gap-8 z-20">
                    <div className="flex-grow h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-400 to-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + (gameState === 'feedback' ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                    <span className="font-black text-xl text-white/40">{currentStep + 1}/{QUIZ_QUESTIONS.length}</span>
                </footer>
            )}
        </div>
    );
};

export default Quiz;
