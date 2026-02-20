import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, CheckCircle, XCircle, ChevronRight,
    Triangle, Square, Circle, Star, User, RotateCcw
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { useSound } from '../hooks/useSound';
import { useUser } from '../context/UserContext';

const QUIZ_DURATION = 20; // seconds

const Quiz: React.FC = () => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const { userName } = useUser();

    const [currentStep, setCurrentStep] = useState(0);
    const [gameState, setGameState] = useState<'lobby' | 'question' | 'feedback' | 'ranking' | 'ended'>('lobby');
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
            setSelectedAnswer(-1);
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
            const points = Math.floor(1000 * (timer / QUIZ_DURATION));
            setLastPoints(points);
            setScore(prev => prev + points);
        } else {
            playSound('wrong');
            setLastPoints(0);
        }

        setGameState('feedback');
    };

    const toRanking = () => {
        playSound('click');
        setGameState('ranking');
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

    const optionStyles = [
        { color: 'bg-[#e21b3c]', icon: <Triangle className="w-5 h-5 fill-white" /> }, // Red
        { color: 'bg-[#1368ce]', icon: <Square className="w-5 h-5 fill-white" /> }, // Blue
        { color: 'bg-[#d89e00]', icon: <Circle className="w-5 h-5 fill-white" /> }, // Yellow
        { color: 'bg-[#26890c]', icon: <Star className="w-5 h-5 fill-white" /> }    // Green
    ];

    return (
        <div className="min-h-screen w-full bg-[#46178f] text-white flex flex-col items-center font-sans">
            {/* Header */}
            <header className="w-full max-w-7xl p-4 flex justify-between items-center z-20">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 font-bold backdrop-blur-md border border-white/10">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Início</span>
                </button>
                <div className="bg-white px-5 py-2 rounded-xl font-black text-lg text-[#46178f] shadow-lg flex items-center gap-3">
                    <User className="w-4 h-4" />
                    {userName}: {score.toLocaleString()}
                </div>
            </header>

            <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-center p-4 relative">
                <AnimatePresence mode="wait">
                    {gameState === 'lobby' ? (
                        <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-12 rounded-[40px] shadow-3xl flex flex-col items-center text-center max-w-md w-full">
                            <Trophy className="w-20 h-20 text-[#46178f] mb-6" />
                            <h1 className="text-4xl font-black mb-4 uppercase text-[#46178f]">Velocidade</h1>
                            <p className="text-slate-400 font-bold mb-10 text-sm italic">Responda rápido para pontuar!</p>
                            <button onClick={startQuiz} className="w-full py-5 bg-[#46178f] text-white font-black text-2xl rounded-2xl hover:scale-105 transition-all shadow-xl">JOGAR</button>
                        </motion.div>
                    ) : gameState === 'question' ? (
                        <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                            <div className="w-full bg-white text-slate-900 p-8 sm:p-12 rounded-[32px] shadow-2xl flex flex-col items-center text-center mb-8 relative">
                                <span className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4">Questão {currentStep + 1} de {QUIZ_QUESTIONS.length}</span>
                                <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-8">{currentQuestion.question}</h2>
                                <div className="w-16 h-16 rounded-full bg-[#46178f] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                    {Math.ceil(timer)}
                                </div>
                            </div>

                            {/* Strict 2x2 Grid Layout */}
                            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-[320px] sm:h-[400px]">
                                {currentQuestion.options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ filter: "brightness(1.1)", scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(index)}
                                        className={`${optionStyles[index].color} shadow-xl rounded-2xl p-4 sm:p-6 flex items-center gap-4 text-left transition-all relative group`}
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
                            <div className={`p-8 rounded-full mb-8 shadow-2xl ${selectedAnswer === currentQuestion.answer ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {selectedAnswer === currentQuestion.answer ? <CheckCircle className="w-24 h-24 text-white" /> : <XCircle className="w-24 h-24 text-white" />}
                            </div>
                            <h1 className="text-6xl font-black mb-4 uppercase italic">
                                {selectedAnswer === currentQuestion.answer ? 'CORRETO!' : 'ERRADO!'}
                            </h1>
                            {selectedAnswer === currentQuestion.answer && (
                                <h2 className="text-3xl font-black text-emerald-300 mb-8">+{lastPoints} PTS</h2>
                            )}
                            <button onClick={toRanking} className="px-12 py-5 bg-white text-[#46178f] font-black text-2xl rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
                                CONTINUAR <ChevronRight className="w-6 h-6" />
                            </button>
                        </motion.div>
                    ) : gameState === 'ranking' ? (
                        <motion.div key="ranking" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white p-12 rounded-[40px] shadow-3xl flex flex-col items-center text-center max-w-lg w-full">
                            <h2 className="text-[#46178f] text-2xl font-black mb-10 uppercase tracking-widest italic border-b-4 border-[#46178f] pb-2">Placar Atual</h2>

                            <div className="w-full flex items-center justify-between bg-slate-100 p-6 rounded-2xl mb-12 border-l-8 border-[#46178f]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#46178f] rounded-full flex items-center justify-center text-white font-black">1</div>
                                    <span className="text-2xl font-black text-slate-800 uppercase">{userName}</span>
                                </div>
                                <span className="text-3xl font-black text-[#46178f]">{score.toLocaleString()}</span>
                            </div>

                            <button onClick={nextStep} className="w-full py-5 bg-[#46178f] text-white font-black text-2xl rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3">
                                {currentStep < QUIZ_QUESTIONS.length - 1 ? 'PRÓXIMA PERGUNTA' : 'RESULTADO FINAL'}
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="ended" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white text-slate-900 p-12 rounded-[40px] shadow-3xl flex flex-col items-center text-center max-w-2xl w-full">
                            <Trophy className="w-24 h-24 text-[#46178f] mb-6" />
                            <h1 className="text-4xl font-black mb-8 uppercase text-[#46178f]">Fim de Jogo!</h1>
                            <div className="bg-slate-100 w-full p-10 rounded-[32px] mb-12">
                                <h2 className="text-7xl font-black text-[#46178f]">{score.toLocaleString()}</h2>
                                <p className="text-slate-500 font-black uppercase tracking-widest mt-2">{userName}</p>
                            </div>
                            <div className="flex gap-4 w-full">
                                <button onClick={resetQuiz} className="flex-grow py-5 bg-[#46178f] text-white font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                    <RotateCcw className="w-6 h-6" />
                                    REPETIR
                                </button>
                                <button onClick={() => navigate('/')} className="flex-grow py-5 bg-slate-200 text-slate-700 font-black text-xl rounded-2xl uppercase">SAIR</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Quiz;
