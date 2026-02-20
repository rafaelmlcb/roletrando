import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { MILLIONAIRE_QUESTIONS, PRIZE_LADDER } from '../data/millionaireData';
import { useSound } from '../hooks/useSound';

const Millionaire: React.FC = () => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const [currentLevel, setCurrentLevel] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'winning' | 'lost' | 'finished'>('playing');
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [lifelines, setLifelines] = useState({
        fiftyFifty: true,
        audience: true,
        skip: true
    });
    const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
    const [audienceData, setAudienceData] = useState<number[]>([]);

    const currentQuestion = MILLIONAIRE_QUESTIONS[currentLevel];

    const handleAnswerClick = (index: number) => {
        if (isConfirmed || gameState !== 'playing') return;
        setSelectedAnswer(index);
    };

    const confirmAnswer = () => {
        if (selectedAnswer === null || isConfirmed) return;
        setIsConfirmed(true);
        playSound('click');

        // Delay to show confirmation color before moving on or ending
        setTimeout(() => {
            if (selectedAnswer === currentQuestion.answer) {
                if (currentLevel === MILLIONAIRE_QUESTIONS.length - 1) {
                    playSound('win');
                    setGameState('finished');
                } else {
                    playSound('correct');
                    setGameState('winning');
                }
            } else {
                playSound('wrong');
                setGameState('lost');
            }
        }, 1500);
    };

    const nextQuestion = () => {
        playSound('click');
        setCurrentLevel(prev => prev + 1);
        setSelectedAnswer(null);
        setIsConfirmed(false);
        setGameState('playing');
        setHiddenOptions([]);
        setAudienceData([]);
    };

    const resetGame = () => {
        playSound('click');
        setCurrentLevel(0);
        setGameState('playing');
        setSelectedAnswer(null);
        setIsConfirmed(false);
        setLifelines({ fiftyFifty: true, audience: true, skip: true });
        setHiddenOptions([]);
        setAudienceData([]);
    };

    const useFiftyFifty = () => {
        if (!lifelines.fiftyFifty || isConfirmed || gameState !== 'playing') return;

        const correctAnswer = currentQuestion.answer;
        const wrongAnswers = currentQuestion.options
            .map((_, i) => i)
            .filter(i => i !== correctAnswer);

        // Pick 2 random wrong answers to hide
        const toHide = [];
        const available = [...wrongAnswers];
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            toHide.push(available.splice(randomIndex, 1)[0]);
        }

        setHiddenOptions(toHide);
        setLifelines(prev => ({ ...prev, fiftyFifty: false }));
    };

    const useAudience = () => {
        if (!lifelines.audience || isConfirmed || gameState !== 'playing') return;

        const correctAnswer = currentQuestion.answer;
        const data = [0, 0, 0, 0];

        // Give the correct answer a higher chance
        let remaining = 100;
        const correctWeight = 50 + Math.floor(Math.random() * 30);
        data[correctAnswer] = correctWeight;
        remaining -= correctWeight;

        const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctAnswer);
        wrongIndices.forEach((idx, i) => {
            if (i === 2) {
                data[idx] = remaining;
            } else {
                const val = Math.floor(Math.random() * remaining);
                data[idx] = val;
                remaining -= val;
            }
        });

        setAudienceData(data);
        setLifelines(prev => ({ ...prev, audience: false }));
    };

    const useSkip = () => {
        if (!lifelines.skip || isConfirmed || gameState !== 'playing') return;
        setLifelines(prev => ({ ...prev, skip: false }));
        nextQuestion();
    };

    return (
        <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center overflow-x-hidden">
            {/* Prize Ladder Sidebar (Desktop) / Header (Mobile) */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 p-4 lg:p-8">

                {/* Main Content Area */}
                <main className="flex-grow flex flex-col gap-8 order-2 lg:order-1">
                    <header className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold hidden sm:inline">Início</span>
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={useFiftyFifty}
                                    disabled={!lifelines.fiftyFifty || isConfirmed || gameState !== 'playing'}
                                    className={`p-3 rounded-full border-2 transition-all ${lifelines.fiftyFifty ? 'border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-500' : 'border-slate-700 text-slate-700 opacity-50'}`}
                                >
                                    <span className="font-black text-xs">50:50</span>
                                </button>
                                <button
                                    onClick={useAudience}
                                    disabled={!lifelines.audience || isConfirmed || gameState !== 'playing'}
                                    className={`p-3 rounded-full border-2 transition-all ${lifelines.audience ? 'border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-500' : 'border-slate-700 text-slate-700 opacity-50'}`}
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={useSkip}
                                    disabled={!lifelines.skip || isConfirmed || gameState !== 'playing'}
                                    className={`p-3 rounded-full border-2 transition-all ${lifelines.skip ? 'border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-500' : 'border-slate-700 text-slate-700 opacity-50'}`}
                                >
                                    <Zap className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="flex-grow flex flex-col items-center justify-center min-h-[500px] relative">
                        <AnimatePresence mode="wait">
                            {gameState === 'playing' ? (
                                <motion.div
                                    key="playing"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="w-full flex flex-col items-center gap-12"
                                >
                                    {/* Question Card */}
                                    <div className="w-full bg-slate-900/50 border-2 border-yellow-500/30 p-8 rounded-[40px] text-center shadow-2xl shadow-yellow-500/5">
                                        <h2 className="text-2xl sm:text-3xl font-black mb-2 italic">PERGUNTA {currentLevel + 1}</h2>
                                        <div className="h-1 w-24 bg-yellow-500 mx-auto mb-6" />
                                        <p className="text-xl sm:text-2xl font-bold leading-relaxed">{currentQuestion.question}</p>
                                    </div>

                                    {/* Audience Chart Overlay */}
                                    {audienceData.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="w-full max-w-sm flex justify-around items-end h-32 gap-2 bg-slate-900/80 p-4 rounded-2xl border border-yellow-500/20"
                                        >
                                            {audienceData.map((val, i) => (
                                                <div key={i} className="flex flex-col items-center w-full">
                                                    <div
                                                        className="w-full bg-yellow-500/50 rounded-t-lg transition-all duration-1000"
                                                        style={{ height: `${val}%` }}
                                                    />
                                                    <span className="text-[10px] font-bold mt-1">{String.fromCharCode(65 + i)}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Options Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                        {currentQuestion.options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswerClick(index)}
                                                disabled={hiddenOptions.includes(index) || isConfirmed}
                                                className={`
                                                    group relative p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-4
                                                    ${hiddenOptions.includes(index) ? 'opacity-0 pointer-events-none' : ''}
                                                    ${selectedAnswer === index
                                                        ? (isConfirmed ? (index === currentQuestion.answer ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400') : 'bg-yellow-500/20 border-yellow-500 text-yellow-500')
                                                        : 'bg-slate-900/40 border-white/10 hover:border-yellow-500/50'
                                                    }
                                                `}
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-slate-950 transition-colors">
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className="text-lg">{option}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={confirmAnswer}
                                        disabled={selectedAnswer === null || isConfirmed}
                                        className={`px-12 py-4 rounded-full font-black uppercase tracking-widest transition-all ${selectedAnswer !== null && !isConfirmed ? 'bg-yellow-500 text-slate-950 hover:scale-105 shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-500'}`}
                                    >
                                        Confirmar Resposta
                                    </button>
                                </motion.div>
                            ) : gameState === 'winning' ? (
                                <motion.div
                                    key="winning"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="bg-emerald-500/20 p-8 rounded-full mb-8 inline-block">
                                        <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                                    </div>
                                    <h2 className="text-4xl font-black mb-4 uppercase text-emerald-400">RESPOSTA CORRETA!</h2>
                                    <p className="text-2xl font-bold mb-8 italic">Você faturou {PRIZE_LADDER[currentLevel]}</p>
                                    <button
                                        onClick={nextQuestion}
                                        className="px-10 py-4 bg-emerald-500 text-white font-black rounded-xl uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                                    >
                                        Próxima Pergunta
                                    </button>
                                </motion.div>
                            ) : gameState === 'lost' ? (
                                <motion.div
                                    key="lost"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="bg-rose-500/20 p-8 rounded-full mb-8 inline-block">
                                        <XCircle className="w-20 h-20 text-rose-500" />
                                    </div>
                                    <h2 className="text-4xl font-black mb-4 uppercase text-rose-400">FIM DE JOGO!</h2>
                                    <p className="text-xl font-bold text-slate-300 mb-8">
                                        Infelizmente você errou. A resposta correta era: <br />
                                        <span className="text-yellow-500 uppercase">{currentQuestion.options[currentQuestion.answer]}</span>
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={resetGame}
                                            className="px-8 py-4 bg-rose-500 text-white font-black rounded-xl uppercase hover:scale-105 transition-all"
                                        >
                                            Tentar Novamente
                                        </button>
                                        <button
                                            onClick={() => navigate('/')}
                                            className="px-8 py-4 bg-slate-800 text-white font-black rounded-xl uppercase hover:bg-slate-700 transition-all"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="finished"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="bg-yellow-500/20 p-10 rounded-full mb-8 inline-block">
                                        <Trophy className="w-24 h-24 text-yellow-500 animate-bounce" />
                                    </div>
                                    <h1 className="text-5xl font-black mb-4 italic text-yellow-500 uppercase">PARABÉNS!</h1>
                                    <h2 className="text-3xl font-black mb-8 uppercase text-white">VOCÊ É O NOVO MILIONÁRIO!</h2>
                                    <p className="text-2xl font-bold text-slate-300 mb-12">
                                        Você completou todos os desafios e ganhou o prêmio máximo de R$ 1.000.000!
                                    </p>
                                    <button
                                        onClick={resetGame}
                                        className="px-12 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-950 font-black rounded-2xl uppercase hover:scale-105 shadow-2xl shadow-yellow-500/40 transition-all"
                                    >
                                        Jogar Novamente
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Prize Ladder Sidebar */}
                <aside className="w-full lg:w-80 flex flex-col gap-2 order-1 lg:order-2 bg-slate-950/20 p-4 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-black uppercase text-slate-400 tracking-widest">Prêmios</span>
                    </div>
                    {[...PRIZE_LADDER].reverse().map((prize, idx) => {
                        const levelIndex = PRIZE_LADDER.length - 1 - idx;
                        const isCurrent = levelIndex === currentLevel;
                        const isPast = levelIndex < currentLevel;

                        return (
                            <div
                                key={idx}
                                className={`
                                    flex justify-between items-center px-4 py-2 rounded-xl transition-all
                                    ${isCurrent ? 'bg-yellow-500 text-slate-950 font-black scale-105 shadow-lg shadow-yellow-500/20' : ''}
                                    ${isPast ? 'text-emerald-500 font-bold' : (!isCurrent ? 'text-slate-500 font-medium' : '')}
                                    ${levelIndex % 5 === 4 && !isCurrent ? 'text-slate-100 font-bold' : ''}
                                `}
                            >
                                <span className="text-xs opacity-50">{levelIndex + 1}</span>
                                <span className="text-sm">{prize}</span>
                            </div>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
};

export default Millionaire;
