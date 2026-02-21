package com.rafael.model;

import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Core game logic engine.
 * Responsibe for phrase selection, letter obscuring, and guess scoring.
 */
@ApplicationScoped
public class GameEngine {

    private static final Logger LOG = Logger.getLogger(GameEngine.class);

    @Inject
    com.rafael.service.DataLoaderService dataLoader;

    private final Random random = new Random();
    private int lastIndex = -1;

    /**
     * Initializes a new GameSession with a random phrase from the given theme.
     */
    public GameSession startNewGame(String theme) {
        java.util.List<WheelPhrase> phrases = dataLoader.getWheelPhrases(theme);

        if (phrases == null || phrases.isEmpty()) {
            throw new IllegalStateException("Nenhuma frase da Roleta encontrada para o tema: " + theme);
        }

        int index;
        do {
            index = random.nextInt(phrases.size());
        } while (index == lastIndex && phrases.size() > 1);
        lastIndex = index;

        WheelPhrase selected = phrases.get(index);
        String category = selected.category;
        String phrase = selected.phrase;

        GameSession session = new GameSession();
        session.id = UUID.randomUUID().toString();
        session.category = category;
        session.guessedLetters = new HashSet<>();
        session.score = 0;
        session.gameOver = false;
        session.obscuredPhrase = obscure(phrase, session.guessedLetters);

        GameStore.phrases.put(session.id, phrase);
        GameStore.sessions.put(session.id, session);

        return session;
    }

    /** Backward-compatible: uses the configured default theme. */
    public GameSession startNewGame() {
        return startNewGame(dataLoader.getDefaultTheme());
    }

    /**
     * Evaluates a guess against the current phrase.
     * 
     * @param sessionId Session ID.
     * @param letter    Letter to check.
     * @return Updated GameSession.
     */
    public GameSession processGuess(String sessionId, char letter) {
        String phrase = GameStore.phrases.get(sessionId);
        GameSession session = GameStore.sessions.get(sessionId);

        if (session == null || phrase == null || session.gameOver) {
            LOG.warnf("Ignoring guess for session %s - Session invalid or game over", sessionId);
            return session;
        }

        letter = Character.toUpperCase(letter);
        if (session.guessedLetters.contains(letter)) {
            session.message = "Você já disse essa letra!";
            LOG.debugf("Player repeated letter '%s' for session %s", letter, sessionId);
            return session;
        }

        session.guessedLetters.add(letter);

        int count = 0;
        for (char c : phrase.toCharArray()) {
            if (Character.toUpperCase(c) == letter)
                count++;
        }

        if (count > 0) {
            session.score += count * session.currentSpinValue;
            session.message = "Acertou! A letra " + letter + " aparece " + count + " vezes.";
            LOG.debugf("Correct guess '%s' in %s. Found %d times. New score: %d", letter, sessionId, count,
                    session.score);
        } else {
            session.message = "Errou! Não tem a letra " + letter + ".";
            LOG.debugf("Incorrect guess '%s' in %s.", letter, sessionId);
        }

        session.obscuredPhrase = obscure(phrase, session.guessedLetters);

        if (!session.obscuredPhrase.contains("_")) {
            session.gameOver = true;
            session.message = "Parabéns! Você descobriu a frase!";
            LOG.infof("Session %s completed successfully by guessing all letters!", sessionId);
        }

        return session;
    }

    /**
     * Validates a complete phrase guess.
     * 
     * @param sessionId     Session ID.
     * @param guessedPhrase The full phrase typed by the user.
     * @return Updated GameSession.
     */
    public GameSession solve(String sessionId, String guessedPhrase) {
        String phrase = GameStore.phrases.get(sessionId);
        GameSession session = GameStore.sessions.get(sessionId);

        if (session == null || phrase == null || session.gameOver)
            return session;

        if (phrase.equalsIgnoreCase(guessedPhrase.trim())) {
            // Contar letras ainda fechadas (não reveladas) antes do acerto
            long letrasOcultas = phrase.chars()
                    .filter(c -> !Character.isWhitespace(c))
                    .mapToObj(c -> (char) c)
                    .filter(c -> !session.guessedLetters.contains(Character.toUpperCase(c)))
                    .count();

            int bonus = (int) (letrasOcultas * 1000);
            session.score += bonus;
            session.gameOver = true;
            session.obscuredPhrase = phrase; // Revelar tudo
            session.solveCorrect = true;
            session.message = "SENSACIONAL! Você acertou a frase! +" + bonus + " pontos (" + letrasOcultas
                    + " letras ocultas × 1000)!";
            LOG.infof("Session %s solved correctly. Hidden letters: %d. Bonus: %d", sessionId, letrasOcultas, bonus);
        } else {
            session.solveCorrect = false;
            session.message = "Oops! '" + guessedPhrase + "' está errado. Você perde tudo e a vez!";
            LOG.infof("Session %s: wrong solve attempt '%s'", sessionId, guessedPhrase);
        }

        return session;
    }

    /**
     * Replaces unguessed letters with underscores.
     * 
     * @param phrase  Original phrase.
     * @param guessed Set of guessed letters.
     * @return Obscured string.
     */
    private String obscure(String phrase, Set<Character> guessed) {
        StringBuilder sb = new StringBuilder();
        for (char c : phrase.toCharArray()) {
            if (Character.isWhitespace(c)) {
                sb.append(" ");
            } else if (guessed.contains(Character.toUpperCase(c))) {
                sb.append(c);
            } else {
                sb.append("_");
            }
        }
        return sb.toString();
    }
}
