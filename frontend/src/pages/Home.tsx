import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, HelpCircle, User, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

const games = [
    {
        id: 'roletrando',
        title: 'Roletrando',
        description: 'Gire a roleta e adivinhe a frase secreta para ganhar pontos!',
        icon: <Gamepad2 className="w-12 h-12 text-emerald-400" />,
        color: 'from-emerald-500/20 to-emerald-900/40',
        borderColor: 'border-emerald-500/50',
        path: '/roletrando'
    },
    {
        id: 'millionaire',
        title: 'Quem Quer Ser Um Milionário',
        description: 'Responda perguntas cada vez mais difíceis e chegue ao milhão!',
        icon: <Trophy className="w-12 h-12 text-yellow-500" />,
        color: 'from-yellow-500/20 to-yellow-900/40',
        borderColor: 'border-yellow-500/50',
        path: '/millionaire'
    },
    {
        id: 'quiz',
        title: 'Quiz de Velocidade',
        description: 'Seja rápido! Quanto mais veloz a resposta, mais pontos você ganha.',
        icon: <Zap className="w-12 h-12 text-blue-500" />,
        color: 'from-blue-500/20 to-blue-900/40',
        borderColor: 'border-blue-500/50',
        path: '/quiz'
    }
];

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { userName, setUserName, isNameDefined } = useUser();
    const [tempName, setTempName] = useState("");
    const [showModal, setShowModal] = useState(!isNameDefined);
    const [error, setError] = useState("");

    const handleSaveName = () => {
        const trimmedName = tempName.trim();
        if (trimmedName.length < 3) {
            setError("O nome deve ter pelo menos 3 caracteres.");
            return;
        }
        // Simulation of "repeated name" check - just for UI logic
        if (trimmedName.toLowerCase() === "admin" || trimmedName.toLowerCase() === "user") {
            setError("Este nome já está em uso. Escolha outro.");
            return;
        }

        setUserName(trimmedName);
        setShowModal(false);
    };

    const handlePlay = (path: string) => {
        if (!isNameDefined) {
            setShowModal(true);
        } else {
            navigate(path);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center p-4 sm:p-8 overflow-x-hidden">
            {/* Name Prompt Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 border border-white/10 p-8 rounded-[32px] max-w-md w-full shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                                <User className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-black mb-2 uppercase">Bem-vindo(a)!</h2>
                            <p className="text-slate-400 mb-8 font-medium">Como gostaria de ser chamado(a) nos rankings?</p>

                            <div className="relative mb-6">
                                <input
                                    autoFocus
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => {
                                        setTempName(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    placeholder="Digite seu nome..."
                                    className="w-full bg-slate-800 border-2 border-white/5 p-4 rounded-xl text-xl font-bold outline-none focus:border-blue-500 transition-colors"
                                />
                                {tempName.length >= 3 && !error && (
                                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
                                )}
                            </div>

                            {error && (
                                <p className="text-rose-400 font-bold mb-6 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                    {error}
                                </p>
                            )}

                            <button
                                onClick={handleSaveName}
                                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xl rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
                            >
                                SALVAR E JOGAR
                                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Info (Top Right) */}
            {isNameDefined && (
                <div className="absolute top-6 right-6 flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md">
                    <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Jogador:</span>
                    <span className="font-black text-blue-400 uppercase">{userName}</span>
                    <button onClick={() => setShowModal(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <User className="w-4 h-4 text-white/50" />
                    </button>
                </div>
            )}

            <header className="w-full max-w-6xl flex flex-col items-center mt-12 mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter mb-4">
                        GAME<span className="text-emerald-400 tracking-normal">CENTER</span>
                    </h1>
                    <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl">
                        Escolha seu desafio favorito e comece a jogar agora mesmo!
                    </p>
                </motion.div>
            </header>

            <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, translateY: -10 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlay(game.path)}
                        className={`cursor-pointer relative overflow-hidden bg-gradient-to-br ${game.color} rounded-[32px] p-8 border-2 ${game.borderColor} backdrop-blur-xl flex flex-col items-center text-center group transition-all`}
                    >
                        <div className="mb-6 transform group-hover:rotate-12 transition-transform duration-300">
                            {game.icon}
                        </div>
                        <h2 className="text-2xl font-black mb-3 uppercase tracking-tight">{game.title}</h2>
                        <p className="text-slate-300 font-medium leading-relaxed">
                            {game.description}
                        </p>
                        <div className="mt-8 px-6 py-2 bg-white/10 rounded-full font-bold group-hover:bg-white/20 transition-colors">
                            Jogar Agora
                        </div>

                        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    </motion.div>
                ))}
            </main>

            <footer className="mt-auto py-12 text-slate-500 font-medium text-center">
                <div className="flex items-center justify-center gap-6 mb-4">
                    <User className="w-5 h-5 opacity-50" />
                    <HelpCircle className="w-5 h-5 opacity-50" />
                    <Trophy className="w-5 h-5 opacity-50" />
                </div>
                <p>&copy; 2024 GameCenter. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default Home;
