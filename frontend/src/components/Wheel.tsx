import { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface WheelProps {
    onSpinEnd: (value: number) => void;
    onSpinStart: () => void;
    onTick: () => void;
    isSpinning: boolean;
}

export interface WheelHandle {
    spin: () => void;
}

const SEGMENTS = [
    { value: 100, color: '#FF3B30', label: '100' },
    { value: 500, color: '#FFCC00', label: '500' },
    { value: 200, color: '#4CD964', label: '200' },
    { value: 1000, color: '#007AFF', label: '1000' },
    { value: 0, color: '#1C1C1E', label: 'PERDEU' },
    { value: 300, color: '#5856D6', label: '300' },
    { value: 600, color: '#FF2D55', label: '600' },
    { value: 150, color: '#FF9500', label: '150' },
    { value: 800, color: '#AF52DE', label: '800' },
    { value: 400, color: '#5AC8FA', label: '400' },
];

export const Wheel = forwardRef<WheelHandle, WheelProps>(({ onSpinEnd, onSpinStart, onTick, isSpinning }, ref) => {
    const controls = useAnimation();
    const [rotation, setRotation] = useState(0);
    const lastTickRef = useRef(0);

    const spin = async () => {
        if (isSpinning) return;

        onSpinStart();

        const extraDegrees = Math.floor(Math.random() * 360);
        const totalRotation = rotation + 1800 + extraDegrees; // 5 full turns

        setRotation(totalRotation);

        await controls.start({
            rotate: totalRotation,
            transition: { duration: 4, ease: [0.15, 0, 0.15, 1] }
        });

        const finalAngle = totalRotation % 360;
        const segmentAngle = 360 / SEGMENTS.length;
        const offsetRotation = (270 - finalAngle + 360) % 360;
        const index = Math.floor(offsetRotation / segmentAngle);

        onSpinEnd(SEGMENTS[index % SEGMENTS.length].value);
    };

    useImperativeHandle(ref, () => ({
        spin
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px', height: '300px' }}>

                {/* Pointer Fixed at Top */}
                <div style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    pointerEvents: 'none'
                }}>
                    <svg width="40" height="50" viewBox="0 0 40 50">
                        <path d="M20 50 L40 0 L0 0 Z" fill="#F59E0B" stroke="#000" strokeWidth="1" />
                    </svg>
                </div>

                {/* Wheel Body */}
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #334155', overflow: 'hidden', backgroundColor: '#000' }}>
                    <motion.div
                        animate={controls}
                        initial={{ rotate: 0 }}
                        style={{ width: '100%', height: '100%' }}
                        onUpdate={(latest) => {
                            if (latest.rotate !== undefined) {
                                const angle = typeof latest.rotate === 'number' ? latest.rotate : parseFloat(latest.rotate as string);
                                const currentTick = Math.floor(angle / (360 / SEGMENTS.length));
                                if (currentTick !== lastTickRef.current) {
                                    lastTickRef.current = currentTick;
                                    onTick();
                                }
                            }
                        }}
                    >
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            {SEGMENTS.map((seg, i) => {
                                const angle = 360 / SEGMENTS.length;
                                const startAngle = i * angle;
                                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 50 + 50 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                const y2 = 50 + 50 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                return (
                                    <g key={i}>
                                        <path d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`} fill={seg.color} stroke="#1e293b" />
                                        <text x="75" y="50" fill="white" fontSize="4.5" fontWeight="bold" transform={`rotate(${startAngle + angle / 2}, 50, 50)`} textAnchor="middle" dominantBaseline="middle">{seg.label}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </motion.div>
                </div>
            </div>

            <button
                onClick={spin}
                disabled={isSpinning}
                style={{
                    marginTop: '30px',
                    padding: '15px 40px',
                    backgroundColor: '#db2777',
                    color: 'white',
                    borderRadius: '50px',
                    fontWeight: '900',
                    fontSize: '24px',
                    border: 'none',
                    boxShadow: '0 10px 0 #831843',
                    cursor: isSpinning ? 'default' : 'pointer'
                }}
            >
                {isSpinning ? 'SORTEANDO...' : 'GIRAR'}
            </button>
        </div>
    );
});
