package com.rafael.model;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class GameEngineTest {

    @Inject
    GameEngine gameEngine;

    @Test
    public void testStartNewGame() {
        GameSession session = gameEngine.startNewGame();
        assertNotNull(session);
        assertNotNull(session.id);
        assertNotNull(session.category);
        assertNotNull(session.obscuredPhrase);
        assertEquals(0, session.score);
        assertFalse(session.gameOver);
        assertTrue(session.obscuredPhrase.contains("_"));

        GameSession storedSession = GameStore.sessions.get(session.id);
        assertNotNull(storedSession, "Session must be stored in GameStore");
        assertEquals(session.id, storedSession.id);
    }

    @Test
    public void testProcessCorrectGuess() {
        GameSession session = gameEngine.startNewGame();
        String originalPhrase = GameStore.phrases.get(session.id);

        // Find a valid letter to guess
        char validLetter = ' ';
        for (char c : originalPhrase.toCharArray()) {
            if (Character.isLetter(c)) {
                validLetter = c;
                break;
            }
        }

        assumeTrue(validLetter != ' '); // sanity check

        session.currentSpinValue = 500;
        GameSession updatedSession = gameEngine.processGuess(session.id, validLetter);

        assertTrue(updatedSession.score > 0, "Score should increase on correct guess");
        assertTrue(updatedSession.guessedLetters.contains(validLetter));
        assertFalse(updatedSession.obscuredPhrase.equals(originalPhrase), "Should partially reveal");
    }

    @Test
    public void testProcessIncorrectGuess() {
        GameSession session = gameEngine.startNewGame();

        char invalidLetter = '1'; // Pharses don't have numbers

        session.currentSpinValue = 500;
        GameSession updatedSession = gameEngine.processGuess(session.id, invalidLetter);

        assertEquals(0, updatedSession.score, "Score should not increase on incorrect guess");
        assertTrue(updatedSession.guessedLetters.contains(invalidLetter));
    }

    @Test
    public void testSolveCorrectly() {
        GameSession session = gameEngine.startNewGame();
        String originalPhrase = GameStore.phrases.get(session.id);

        GameSession solvedSession = gameEngine.solve(session.id, originalPhrase);
        assertTrue(solvedSession.gameOver);
        assertEquals(5000, solvedSession.score, "Should give 5000 bonus");
        assertEquals(originalPhrase, solvedSession.obscuredPhrase);
    }

    private void assumeTrue(boolean condition) {
        if (!condition)
            throw new RuntimeException("Assumption failed");
    }
}
