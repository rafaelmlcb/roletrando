package com.rafael.model;

import java.util.Set;

public class GameSession {
    public String id;
    public String category;
    public String obscuredPhrase;
    public int score;
    public int currentSpinValue;
    public Set<Character> guessedLetters;
    public boolean gameOver;
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
