export interface Player {
    id: string;
    name: string;
    avatar: string;
    connectionId: string;
    isBot: boolean;
    score: number;
}

export interface GameSession {
    id: string;
    phrase: string;
    obscuredPhrase: string;
    category: string;
    message: string;
    guessedLetters: string[];
    currentSpinValue: number;
    pendingSpinValue: number;
    gameOver: boolean;
}

export interface Room {
    id: string;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    players: Player[];
    currentTurnIndex: number;
    hostConnectionId: string;
    gameSession: GameSession;
    quizSession?: any; // To be refined if needed
}

export interface GameMessage {
    type: string;
    payload?: any;
}
