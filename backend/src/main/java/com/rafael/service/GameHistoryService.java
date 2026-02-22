package com.rafael.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

/**
 * Persists game result records to a JSON-Lines file (one JSON object per line).
 * Also provides aggregated ranking data.
 */
@ApplicationScoped
public class GameHistoryService {

    private static final Logger LOG = Logger.getLogger(GameHistoryService.class);

    /**
     * Location of the history file. Use /tmp for Render (ephemeral but functional).
     */
    private static final Path HISTORY_FILE = Path.of(
            System.getProperty("user.home"), ".roletrando", "history.jsonl");

    @Inject
    ObjectMapper mapper;

    public record GameRecord(
            String timestamp,
            String playerName,
            String game,
            int score,
            boolean winner) {
    }

    /**
     * Records a single player's result for a finished game.
     */
    public synchronized void record(String playerName, String game, int score, boolean winner) {
        try {
            Files.createDirectories(HISTORY_FILE.getParent());
            GameRecord entry = new GameRecord(
                    Instant.now().toString(), playerName, game, score, winner);
            String line = mapper.writeValueAsString(entry);
            Files.writeString(HISTORY_FILE, line + "\n",
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            LOG.infof("[History] Recorded: %s | %s | score=%d | winner=%b", playerName, game, score, winner);
        } catch (Exception e) {
            LOG.errorf("Failed to write history entry: %s", e.getMessage());
        }
    }

    /**
     * Reads all records and aggregates by player name.
     * Returns a sorted list (highest total score first).
     */
    public List<Map<String, Object>> getRanking() {
        Map<String, Map<String, Object>> aggregated = new LinkedHashMap<>();

        if (!Files.exists(HISTORY_FILE)) {
            LOG.info("[History] No history file found yet.");
            return List.of();
        }

        try (BufferedReader reader = Files.newBufferedReader(HISTORY_FILE, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank())
                    continue;
                try {
                    GameRecord r = mapper.readValue(line, GameRecord.class);
                    aggregated.compute(r.playerName(), (name, existing) -> {
                        if (existing == null) {
                            Map<String, Object> entry = new LinkedHashMap<>();
                            entry.put("playerName", name);
                            entry.put("totalScore", 0);
                            entry.put("gamesPlayed", 0);
                            entry.put("wins", 0);
                            return entry;
                        }
                        return existing;
                    });
                    Map<String, Object> entry = aggregated.get(r.playerName());
                    entry.put("totalScore", (int) entry.get("totalScore") + r.score());
                    entry.put("gamesPlayed", (int) entry.get("gamesPlayed") + 1);
                    if (r.winner())
                        entry.put("wins", (int) entry.get("wins") + 1);
                } catch (Exception ex) {
                    LOG.warnf("Skipping malformed history line: %s", line);
                }
            }
        } catch (Exception e) {
            LOG.errorf("Failed to read history file: %s", e.getMessage());
        }

        List<Map<String, Object>> result = new ArrayList<>(aggregated.values());
        result.sort((a, b) -> Integer.compare((int) b.get("totalScore"), (int) a.get("totalScore")));
        return result;
    }
}
