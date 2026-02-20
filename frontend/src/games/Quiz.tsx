import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';

const QUIZ_DURATION = 20; // seconds

const Quiz: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [gameState, setGameState] = useState<'lobby' | 'question' | 'feedback' | 'ended'>('lobby');
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(QUIZ_DURATION);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [lastPoints, setLastPoints] = useState(0);

    const timerRef = useRef<number | null>(null);

    const startQuiz = () => {
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
                return prev - 0.1;
            });
        }, 100);
    };

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (selectedAnswer === null) {
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
            // Speed scoring: max 1000 points
            const points = Math.floor(1000 * (timer / QUIZ_DURATION));
            setLastPoints(points);
            setScore(prev => prev + points);
        } else {
            setLastPoints(0);
        }

        setGameState('feedback');
    };

    const nextStep = () => {
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedAnswer(null);
            setGameState('question');
            startTimer();
        } else {
            setGameState('ended');
        }
    };

    const resetQuiz = () => {
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

    // Kahoot-style option colors and shapes
    const optionStyles = [
        { color: 'bg-rose-500', hover: 'hover:bg-rose-600', shadow: 'shadow-rose-900/40', icon: '▲' },
        { color: 'bg-blue-500', hover: 'hover:bg-blue-600', shadow: 'shadow-blue-900/40', icon: '◆' },
        { color: 'bg-amber-500', hover: 'hover:bg-amber-600', shadow: 'shadow-amber-900/40', icon: '●' },
        { color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', shadow: 'shadow-emerald-900/40', icon: '■' }
    ];

    return (
        <div className="min-h-screen w-full bg-[#46178f] text-white flex flex-col items-center overflow-hidden font-sans">
            {/* Header */}
            <header className="w-full max-w-6xl p-4 flex justify-between items-center z-20">
                <button onClick={() => navigate('/')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 font-bold backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Sair</span>
                </button>
                <div className="bg-white/10 px-6 py-2 rounded-full font-black text-xl backdrop-blur-md">
                    {score.toLocaleString()} pts
                </div>
            </header>

            <main className="flex-grow w-full max-w-6xl flex flex-col items-center justify-center p-4 relative">
                <AnimatePresence mode="wait">
                    {gameState === 'lobby' ? (
                        <motion.div
                            key="lobby"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="bg-white text-slate-900 p-8 sm:p-12 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-lg w-full"
                        >
                            <div className="w-24 h-24 bg-[#46178f] text-white rounded-3xl flex items-center justify-center mb-6 rotate-12">
                                <Trophy className="w-12 h-12" />
                            </div>
                            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter text-[#46178f]">Pronto para o Quiz?</h1>
                            <p className="text-slate-500 font-bold mb-10 leading-relaxed uppercase tracking-wider text-sm">
                                Responda o mais rápido possível para ganhar mais pontos!
                            </p>
                            <button
                                onClick={startQuiz}
                                className="w-full py-5 bg-[#46178f] text-white font-black text-2xl rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/30"
                            >
                                ESTOU PRONTO!
                            </button>
                        </motion.div>
                    ) : gameState === 'question' ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex flex-col items-center h-full"
                        >
                            <div className="w-full bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col items-center text-center mb-12 relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-2 bg-[#46178f] transition-all duration-100" style={{ width: `${(timer / QUIZ_DURATION) * 100}%` }} />
                                <span className="text-slate-400 font-black uppercase tracking-widest text-sm mb-4">Questão {currentStep + 1} de {QUIZ_QUESTIONS.length}</span>
                                <h2 className="text-2xl sm:text-4xl font-black leading-tight">{currentQuestion.question}</h2>

                                <div className="mt-8 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border-8 border-[#46178f] border-t-transparent animate-spin-slow opacity-20" />
                                        <span className="text-2xl font-black">{Math.ceil(timer)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-[300px] mb-8">
                                {currentQuestion.options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(index)}
                                        className={`${optionStyles[index].color} ${optionStyles[index].hover} ${optionStyles[index].shadow} shadow-lg rounded-xl p-6 flex items-center gap-6 text-left transition-all relative overflow-hidden group`}
                                    >
                                        <span className="text-4xl opacity-50 font-black group-hover:scale-125 transition-transform">{optionStyles[index].icon}</span>
                                        <span className="text-xl sm:text-2xl font-black">{option}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : gameState === 'feedback' ? (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="flex flex-col items-center text-center w-full"
                        >
                            {selectedAnswer === currentQuestion.answer ? (
                                <>
                                    <div className="bg-emerald-400 p-8 rounded-full mb-8 shadow-2xl shadow-emerald-500/50">
                                        <CheckCircle className="w-24 h-24 text-white" />
                                    </div>
                                    <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">Resposta Correta!</h1>
                                    <div className="bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-md mb-12">
                                        <p className="text-slate-100 font-bold uppercase tracking-widest text-sm mb-1">Você ganhou</p>
                                        <h2 className="text-4xl font-black text-emerald-300">+{lastPoints} Pontos</h2>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-rose-500 p-8 rounded-full mb-8 shadow-2xl shadow-rose-900/50">
                                        <XCircle className="w-24 h-24 text-white" />
                                    </div>
                                    <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">
                                        {selectedAnswer === -1 ? 'Acabou o Tempo!' : 'Resposta Errada!'}
                                    </h1>
                                    <div className="bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-md mb-12">
                                        <p className="text-slate-100 font-bold uppercase tracking-widest text-sm mb-1">A resposta correta era</p>
                                        <h2 className="text-2xl font-black text-white">{currentQuestion.options[currentQuestion.answer]}</h2>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={nextStep}
                                className="px-12 py-5 bg-white text-[#46178f] font-black text-xl rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                            >
                                {currentStep < QUIZ_QUESTIONS.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ended"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white text-slate-900 p-12 rounded-[40px] shadow-2xl flex flex-col items-center text-center max-w-2xl w-full"
                        >
                            <Trophy className="w-24 h-24 text-amber-400 mb-6 drop-shadow-lg" />
                            <h1 className="text-5xl font-black mb-2 uppercase tracking-tighter text-[#46178f]">Quiz Finalizado!</h1>
                            <p className="text-slate-400 font-bold mb-10 text-xl">Sua pontuação final foi:</p>

                            <div className="bg-slate-100 w-full p-8 rounded-3xl mb-12">
                                <h2 className="text-7xl font-black text-[#46178f]">{score.toLocaleString()}</h2>
                                <p className="text-slate-500 font-black uppercase tracking-widest mt-2">Pontos Totais</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <button
                                    onClick={resetQuiz}
                                    className="flex-grow py-5 bg-[#46178f] text-white font-black text-xl rounded-2xl flex items-center justify-center gap-2 hover:bg-[#35116d] transition-all"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                    Jogar Novamente
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-grow py-5 bg-slate-200 text-slate-700 font-black text-xl rounded-2xl transition-all hover:bg-slate-300"
                                >
                                    Voltar ao Início
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Progress Bar */}
            {gameState !== 'lobby' && gameState !== 'ended' && (
                <footer className="w-full max-w-6xl p-6 flex items-center gap-4 z-20">
                    <div className="flex-grow h-4 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + (gameState === 'feedback' ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                    <span className="font-black opacity-60">{currentStep + 1}/{QUIZ_QUESTIONS.length}</span>
                </footer>
            )}
        </div>
    );
};

export default Quiz;
