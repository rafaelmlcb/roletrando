package com.rafael.resource;

import com.rafael.model.*;
import io.quarkus.websockets.next.OnClose;
import io.quarkus.websockets.next.OnError;
import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.OnTextMessage;
import io.quarkus.websockets.next.WebSocket;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafael.service.StatsService;
import io.vertx.core.Vertx;

import java.util.Map;
import java.util.UUID;

@WebSocket(path = "/api/ws/game/{roomId}/{playerName}/{theme}")
public class GameWebSocket {

    private static final Logger LOG = Logger.getLogger(GameWebSocket.class);

    @Inject
    RoomManager roomManager;

    @Inject
    GameEngine gameEngine;

    @Inject
    WebSocketConnection connection;

    @Inject
    StatsService statsService;

    @Inject
    ObjectMapper mapper;

    @Inject
    Vertx vertx;

    @OnOpen
    public void onOpen() {
        String roomId = connection.pathParam("roomId");
        String playerName = connection.pathParam("playerName");
        String theme = connection.pathParam("theme");
        if (theme == null || theme.isBlank())
            theme = "default";
        String connId = connection.id();

        LOG.infof("User %s joining room %s (theme: %s) mapped to connection %s", playerName, roomId, theme, connId);

        // Input Validation
        if (roomId == null || roomId.length() < 3 || roomId.length() > 20 || !roomId.matches("^[a-zA-Z0-9_-]+$")) {
            sendError("ID da sala inválido (3-20 caracteres, alfanumérico).");
            return;
        }
        if (playerName == null || playerName.length() < 3 || playerName.length() > 15) {
            sendError("Nome inválido (3-15 caracteres).");
            return;
        }

        Room room = roomManager.getRoom(roomId);
        if (room == null) {
            room = roomManager.createRoom(roomId);
            room.gameSession = gameEngine.startNewGame(theme);
            room.hostConnectionId = connId;
            statsService.incrementGamesCreated();
        }

        if (room.status.equals("PLAYING") || room.players.size() >= 3) {
            try {
                connection.sendText(
                        mapper.writeValueAsString(new GameMessage("ERROR", "Sala cheia ou jogo já em andamento.")))
                        .subscribe().with(v -> {
                        }, err -> LOG.error("Send error", err));
            } catch (Exception e) {
            }
            return;
        }

        Player player = new Player(UUID.randomUUID().toString(), playerName,
                "https://api.dicebear.com/7.x/avataaars/svg?seed=" + playerName, connId, false);
        room.players.add(player);

        if (room.players.size() == 3) {
            startGame(room);
        } else {
            broadcastGameState(room);
        }
    }

    @OnTextMessage
    public void onMessage(String message) {
        try {
            GameMessage msg = mapper.readValue(message, GameMessage.class);
            String connId = connection.id();
            Room room = roomManager.getRoomByConnection(connId);

            if (room == null)
                return;

            Player sender = room.players.stream()
                    .filter(p -> p.connectionId.equals(connId))
                    .findFirst().orElse(null);

            if (sender == null)
                return;

            // Simple Turn Validation
            boolean isMyTurn = room.players.indexOf(sender) == room.currentTurnIndex;

            switch (msg.type) {
                case "START_GAME":
                    if (connId.equals(room.hostConnectionId) && room.status.equals("WAITING")) {
                        startGame(room);
                    }
                    break;
                case "SPIN_START":
                    if (isMyTurn) {
                        int[] values = { 100, 500, 200, 1000, 0, 300, 600, 150, 800, 400 };
                        int val = values[(int) (Math.random() * values.length)];
                        room.gameSession.pendingSpinValue = val;
                        // Broadcast the spin start with the target value to EVERYONE
                        broadcastExcept(room, "", new GameMessage("SPIN_START", val));
                    }
                    break;
                case "SPIN_END":
                    if (isMyTurn) {
                        // Use the server-generated pending value
                        int val = room.gameSession.pendingSpinValue;
                        handleSpinEnd(room, sender, val);
                    }
                    break;
                case "GUESS":
                    if (isMyTurn) {
                        String letterStr = String.valueOf(msg.payload);
                        char letter = letterStr.charAt(0);
                        handleGuess(room, sender, letter);
                    }
                    break;
                case "SOLVE":
                    if (isMyTurn) {
                        String phrase = String.valueOf(msg.payload);
                        handleSolve(room, sender, phrase);
                    }
                    break;
            }

        } catch (Exception e) {
            LOG.error("Failed to parse websocket message", e);
        }
    }

    @OnClose
    public void onClose() {
        String connId = connection.id();
        Room room = roomManager.getRoomByConnection(connId);
        if (room != null) {
            room.players.removeIf(p -> p.connectionId.equals(connId));
            if (room.players.isEmpty()) {
                roomManager.removeRoom(room.id);
            } else {
                if (room.currentTurnIndex >= room.players.size()) {
                    room.currentTurnIndex = 0;
                }
                broadcastGameState(room);
            }
        }
        LOG.infof("Connection %s closed", connId);
    }

    @OnError
    public void onError(Throwable t) {
        LOG.error("WebSocket error on connection " + connection.id(), t);
    }

    private void handleSpinEnd(Room room, Player sender, int val) {
        if (val == 0) {
            sender.score = 0;
            room.gameSession.currentSpinValue = 0;
            room.gameSession.message = "Que azar! Perdeu tudo!";
            nextTurn(room);
        } else {
            room.gameSession.currentSpinValue = val;
            room.gameSession.message = "A roleta parou em " + val + " pontos! Escolha uma letra.";
        }
        broadcastGameState(room);
    }

    private void handleGuess(Room room, Player sender, char letter) {
        int prevScore = room.gameSession.score;
        gameEngine.processGuess(room.gameSession.id, letter);
        int newScore = room.gameSession.score;

        if (newScore > prevScore) {
            sender.score += (newScore - prevScore);
            room.gameSession.currentSpinValue = 0;
            broadcastGameState(room);
            checkBotTurn(room); // bot might get to play again right away
        } else {
            nextTurn(room);
            broadcastGameState(room);
        }
    }

    private void handleSolve(Room room, Player sender, String phrase) {
        int scoreBefore = room.gameSession.score;
        gameEngine.solve(room.gameSession.id, phrase);

        if (Boolean.TRUE.equals(room.gameSession.solveCorrect)) {
            // Bônus já somado em session.score pelo GameEngine → transferir diferença ao
            // player
            int bonus = room.gameSession.score - scoreBefore;
            sender.score += bonus;
        } else {
            // Errou: zerar pontuação do jogador e perder a vez
            sender.score = 0;
            nextTurn(room);
        }
        broadcastGameState(room);
    }

    private void startGame(Room room) {
        room.status = "PLAYING";
        int botCount = 1;
        while (room.players.size() < 3) {
            room.players.add(new Player(UUID.randomUUID().toString(), "Robô " + botCount,
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=bot" + botCount, "BOT_" + botCount, true));
            botCount++;
        }
        broadcastGameState(room);
        checkBotTurn(room);
    }

    private void nextTurn(Room room) {
        if (!room.players.isEmpty() && !room.gameSession.gameOver) {
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.size();
            room.gameSession.currentSpinValue = 0;
            checkBotTurn(room);
        }
    }

    private void checkBotTurn(Room room) {
        if (room.status.equals("PLAYING") && !room.gameSession.gameOver) {
            Player current = room.players.get(room.currentTurnIndex);
            if (current.isBot) {
                vertx.setTimer(1500, id -> playBotTurn(room, current));
            }
        }
    }

    private void playBotTurn(Room room, Player bot) {
        if (!room.status.equals("PLAYING") || room.gameSession.gameOver)
            return;
        Player current = room.players.get(room.currentTurnIndex);
        if (!current.id.equals(bot.id))
            return; // turn changed

        if (room.gameSession.currentSpinValue == 0) {
            broadcastGameState(room); // send state to ensure UI is updated

            // Random spin value simulation
            int[] values = { 100, 500, 200, 1000, 0, 300, 600, 150, 800, 400 };
            int val = values[(int) (Math.random() * values.length)];
            room.gameSession.pendingSpinValue = val;

            broadcastExcept(room, "", new GameMessage("SPIN_START", val));

            // Wait 4.5 seconds for wheel animation before finishing spin
            vertx.setTimer(4500, id -> {
                if (room.gameSession.gameOver)
                    return;
                handleSpinEnd(room, bot, val);

                if (val > 0) {
                    vertx.setTimer(1500, id2 -> playBotGuess(room, bot));
                }
            });
        }
    }

    private void playBotGuess(Room room, Player bot) {
        if (!room.status.equals("PLAYING") || room.gameSession.gameOver)
            return;
        Player current = room.players.get(room.currentTurnIndex);
        if (!current.id.equals(bot.id))
            return;

        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        java.util.List<Character> unrevealed = new java.util.ArrayList<>();
        for (char c : alphabet.toCharArray()) {
            if (!room.gameSession.guessedLetters.contains(c)) {
                unrevealed.add(c);
            }
        }

        if (!unrevealed.isEmpty()) {
            char guess = unrevealed.get((int) (Math.random() * unrevealed.size()));
            handleGuess(room, bot, guess);
        } else {
            nextTurn(room);
            broadcastGameState(room);
        }
    }

    private void broadcastGameState(Room room) {
        try {
            Map<String, Object> state = Map.of(
                    "room", room,
                    "currentPlayerTurnId", room.players.isEmpty() ? "" : room.players.get(room.currentTurnIndex).id);
            GameMessage msg = new GameMessage("STATE_UPDATE", state);
            String json = mapper.writeValueAsString(msg);

            connection.getOpenConnections().forEach(conn -> {
                boolean inRoom = room.players.stream().anyMatch(p -> p.connectionId.equals(conn.id()));
                if (inRoom) {
                    conn.sendText(json).subscribe().with(v -> {
                    }, err -> LOG.error("Send error", err));
                }
            });
        } catch (Exception e) {
            LOG.error("Failed to broadcast state", e);
        }
    }

    private void broadcastExcept(Room room, String excludeConnId, GameMessage msg) {
        try {
            String json = mapper.writeValueAsString(msg);
            connection.getOpenConnections().forEach(conn -> {
                boolean inRoom = room.players.stream().anyMatch(p -> p.connectionId.equals(conn.id()));
                if (inRoom && !conn.id().equals(excludeConnId)) {
                    conn.sendText(json).subscribe().with(v -> {
                    }, err -> LOG.error("Send error", err));
                }
            });
        } catch (Exception e) {
            LOG.error("Failed to broadcastExcept", e);
        }
    }

    private void sendError(String message) {
        try {
            connection.sendText(mapper.writeValueAsString(new GameMessage("ERROR", message)))
                    .subscribe().with(v -> connection.close(), err -> connection.close());
        } catch (Exception e) {
            connection.close();
        }
    }
}
