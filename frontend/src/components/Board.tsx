import React from 'react';
import { motion } from 'framer-motion';

interface BoardProps {
    phrase: string;
    category: string;
}

export const Board: React.FC<BoardProps> = ({ phrase, category }) => {
    const words = phrase.split(' ');

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', width: '100%', padding: '20px' }}>
            {/* Category Banner (Hint) */}
            <div className="mb-12 relative flex flex-col items-center">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                <div className="relative px-12 py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-full border-2 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3">
                    <div className="p-1 px-3 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/50 border border-white/5">DICA</div>
                    <span className="text-white font-black text-2xl uppercase tracking-[0.2em] drop-shadow-lg italic">
                        {category}
                    </span>
                </div>
            </div>
            {words.map((word, wordIndex) => (
                <div key={`word-${wordIndex}`} style={{ display: 'flex', gap: '8px' }}>
                    {word.split('').map((char, charIndex) => (
                        <div
                            key={`char-${wordIndex}-${charIndex}`}
                            style={{
                                width: '45px',
                                height: '65px',
                                perspective: '1000px',
                                position: 'relative'
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotateY: char === '_' ? 0 : 180 }}
                                transition={{ duration: 0.6 }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    transformStyle: 'preserve-3d',
                                    position: 'relative'
                                }}
                            >
                                {/* Front face (Green) */}
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    backgroundColor: '#059669',
                                    borderRadius: '4px',
                                    border: '2px solid #064e3b'
                                }} />

                                {/* Back face (White) */}
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: 'rotateY(180deg)'
                                }}>
                                    <span style={{ color: '#1e293b', fontSize: '30px', fontWeight: '900' }}>
                                        {char !== '_' ? char : ''}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
