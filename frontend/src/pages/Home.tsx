import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, HelpCircle, User, Zap } from 'lucide-react';

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

    return (
        <div className="min-h-screen w-full bg-[#0a0f1e] text-white flex flex-col items-center p-4 sm:p-8 overflow-x-hidden">
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

            <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, translateY: -10 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(game.path)}
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

                        {/* Decorative background circle */}
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
