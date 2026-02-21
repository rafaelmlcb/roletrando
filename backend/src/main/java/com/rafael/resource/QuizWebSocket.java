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
import io.vertx.core.Vertx;

import java.util.Map;
import java.util.UUID;

@WebSocket(path = "/api/ws/quiz/{roomId}/{playerName}")
public class QuizWebSocket {

    private static final Logger LOG = Logger.getLogger(QuizWebSocket.class);

    @Inject
    RoomManager roomManager;

    @Inject
    WebSocketConnection connection;

    @Inject
    ObjectMapper mapper;

    @Inject
    Vertx vertx;

    @OnOpen
    public void onOpen() {
        String roomId = connection.pathParam("roomId");
        String playerName = connection.pathParam("playerName");
        String connId = connection.id();

        LOG.infof("Quiz User %s joining room %s mapped to connection %s", playerName, roomId, connId);

        Room room = roomManager.getRoom(roomId);
        if (room == null) {
            room = roomManager.createRoom(roomId);
            room.quizSession = new QuizSession();
            room.hostConnectionId = connId;
        }

        if (room.status.equals("PLAYING")) {
            try {
                connection.sendText(mapper.writeValueAsString(new GameMessage("ERROR", "Jogo já em andamento.")))
                        .subscribe().with(v -> {
                        }, err -> LOG.error("Send error", err));
            } catch (Exception e) {
            }
            return;
        }

        Player player = new Player(UUID.randomUUID().toString(), playerName,
                "https://api.dicebear.com/7.x/avataaars/svg?seed=" + playerName, connId, false);
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

            switch (msg.type) {
                case "START_GAME":
                    if (connId.equals(room.hostConnectionId) && room.status.equals("WAITING")) {
                        startGame(room);
                    }
                    break;
                case "SUBMIT_SCORE":
                    if (room.status.equals("PLAYING")) {
                        int scoreGained = Integer.parseInt(msg.payload.toString());
                        sender.score += scoreGained;
                        // Map connectionId to score strictly for visual updates if needed
                        room.quizSession.roundScores.put(sender.id, scoreGained);
                        broadcastGameState(room);
                    }
                    break;
                case "NEXT_QUESTION":
                    if (connId.equals(room.hostConnectionId) && room.status.equals("PLAYING")) {
                        room.quizSession.currentStep++;
                        room.quizSession.roundScores.clear();
                        broadcastGameState(room);
                    }
                    break;
            }

        } catch (Exception e) {
            LOG.error("Failed to parse websocket message in Quiz", e);
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
                broadcastGameState(room);
            }
        }
        LOG.infof("Quiz Connection %s closed", connId);
    }

    @OnError
    public void onError(Throwable t) {
        LOG.error("Quiz WebSocket error on connection " + connection.id(), t);
    }

    private void startGame(Room room) {
        room.status = "PLAYING";
        broadcastGameState(room);

        // Let clients know game started
        broadcastExcept(room, "", new GameMessage("GAME_START", null));
    }

    private void broadcastGameState(Room room) {
        try {
            Map<String, Object> state = Map.of("room", room);
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
            LOG.error("Failed to broadcast Quiz state", e);
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
            LOG.error("Failed to broadcastExcept Quiz", e);
        }
    }
}
