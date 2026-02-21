import { useEffect, useRef, useState, useCallback } from 'react';
import Logger from '../utils/logger';

interface GameMessage {
    type: string;
    payload?: any;
}

export function useWebSocket(roomId: string, playerName: string, theme: string = 'default', endpoint: string = 'game') {
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
    const [gameState, setGameState] = useState<any>(null);
    const [currentPlayerTurnId, setCurrentPlayerTurnId] = useState<string>('');
    const [lastEvent, setLastEvent] = useState<GameMessage | null>(null);

    const ws = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (!roomId || !playerName) return;

        let wsBaseUrl = '';
        if (import.meta.env.VITE_API_URL) {
            try {
                const parsedUrl = new URL(import.meta.env.VITE_API_URL);
                wsBaseUrl = `${parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${parsedUrl.host}`;
            } catch (e) {
                // Fallback for invalid URLs
                wsBaseUrl = import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/api.*$/, '');
            }
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            wsBaseUrl = `${protocol}//${host}:8080`;
        }

        wsBaseUrl = wsBaseUrl.replace(/\/$/, '');
        const wsUrl = `${wsBaseUrl}/api/ws/${endpoint}/${roomId}/${encodeURIComponent(playerName)}/${encodeURIComponent(theme)}`;

        Logger.info('useWebSocket', `Attempting to connect to: ${wsUrl}`);
        Logger.info('useWebSocket', `VITE_API_URL status: ${import.meta.env.VITE_API_URL ? 'set' : 'not set'}`);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            Logger.info('useWebSocket', 'Connected to WebSocket server');
            setStatus('CONNECTED');
        };

        ws.current.onmessage = (event) => {
            try {
                const msg: GameMessage = JSON.parse(event.data);

                if (msg.type === 'STATE_UPDATE') {
                    setGameState(msg.payload.room);
                    setCurrentPlayerTurnId(msg.payload.currentPlayerTurnId);
                } else {
                    setLastEvent(msg);
                }
            } catch (err) {
                Logger.error('useWebSocket', 'Failed to parse message', err);
            }
        };

        ws.current.onclose = () => {
            Logger.warn('useWebSocket', 'WebSocket disconnected');
            setStatus('DISCONNECTED');
        };

        ws.current.onerror = (err) => {
            Logger.error('useWebSocket', 'WebSocket error', err);
            setStatus('DISCONNECTED');
        };
    }, [roomId, playerName, theme, endpoint]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) ws.current.close();
        };
    }, [connect]);

    const sendMessage = useCallback((type: string, payload?: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
        } else {
            Logger.warn('useWebSocket', 'Cannot send message, socket not open');
        }
    }, []);

    return { status, gameState, currentPlayerTurnId, lastEvent, sendMessage, setLastEvent };
}
