package com.rafael.model;

import java.util.Set;

/**
 * Represents the public state of a single game instance.
 * Passed back and forth between the backend API and frontend clients.
 */
public class GameSession {
    public String id;
    public String category;

    /** Phrase but with unguessed letters converted to underscores */
    public String obscuredPhrase;

    public int score;
    public int currentSpinValue;
    public Set<Character> guessedLetters;
    public boolean gameOver;

    /**
     * Current feedback message for the player (e.g. correct, wrong, generic hint)
     */
    public String message;

    public GameSession() {
    }

    public GameSession(String id, String category, String obscuredPhrase, int score, Set<Character> guessedLetters,
            boolean gameOver) {
        this.id = id;
        this.category = category;
        this.obscuredPhrase = obscuredPhrase;
        this.score = score;
        this.guessedLetters = guessedLetters;
        this.gameOver = gameOver;
    }
}
