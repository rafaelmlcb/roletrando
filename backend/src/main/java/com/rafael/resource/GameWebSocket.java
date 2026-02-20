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

import java.util.Map;
import java.util.UUID;

@WebSocket(path = "/api/ws/game/{roomId}/{playerName}")
public class GameWebSocket {

    private static final Logger LOG = Logger.getLogger(GameWebSocket.class);

    @Inject
    RoomManager roomManager;

    @Inject
    GameEngine gameEngine;

    @Inject
    WebSocketConnection connection;

    @Inject
    ObjectMapper mapper;

    @OnOpen
    public void onOpen() {
        String roomId = connection.pathParam("roomId");
        String playerName = connection.pathParam("playerName");
        String connId = connection.id();

        LOG.infof("User %s joining room %s mapped to connection %s", playerName, roomId, connId);

        Room room = roomManager.getRoom(roomId);
        if (room == null) {
            room = roomManager.createRoom(roomId);
            room.gameSession = gameEngine.startNewGame();
        }

        Player player = new Player(UUID.randomUUID().toString(), playerName,
                "https://api.dicebear.com/7.x/avataaars/svg?seed=" + playerName, connId);
        room.players.add(player);

        broadcastGameState(room);
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
                case "SPIN_START":
                    if (isMyTurn)
                        broadcastExcept(room, connId, new GameMessage("SPIN_START", null));
                    break;
                case "SPIN_END":
                    if (isMyTurn) {
                        int val = Integer.parseInt(msg.payload.toString());
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
                    break;
                case "GUESS":
                    if (isMyTurn) {
                        String letterStr = String.valueOf(msg.payload);
                        char letter = letterStr.charAt(0);

                        int prevScore = room.gameSession.score;
                        gameEngine.processGuess(room.gameSession.id, letter);
                        int newScore = room.gameSession.score;

                        if (newScore > prevScore) {
                            sender.score += (newScore - prevScore);
                            room.gameSession.currentSpinValue = 0;
                        } else {
                            nextTurn(room);
                        }
                        broadcastGameState(room);
                    }
                    break;
                case "SOLVE":
                    if (isMyTurn) {
                        String phrase = String.valueOf(msg.payload);
                        gameEngine.solve(room.gameSession.id, phrase);
                        if (room.gameSession.gameOver) {
                            sender.score += 5000;
                        } else {
                            nextTurn(room);
                        }
                        broadcastGameState(room);
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

    private void nextTurn(Room room) {
        if (!room.players.isEmpty()) {
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.size();
            room.gameSession.currentSpinValue = 0;
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
                    conn.sendTextAndAwait(json);
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
                    conn.sendTextAndAwait(json);
                }
            });
        } catch (Exception e) {
            LOG.error("Failed to broadcastExcept", e);
        }
    }
}
