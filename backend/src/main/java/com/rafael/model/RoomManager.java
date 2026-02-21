package com.rafael.model;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class RoomManager {
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    public Room createRoom(String roomId) {
        Room r = new Room(roomId);
        rooms.put(roomId, r);
        return r;
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public void removeRoom(String roomId) {
        rooms.remove(roomId);
    }

    public void addPlayerToRoom(String roomId, Player player) {
        Room r = rooms.get(roomId);
        if (r != null) {
            r.players.add(player);
        }
    }

    public void removePlayerByConnection(String connectionId) {
        rooms.values().forEach(room -> {
            room.players.removeIf(p -> p.connectionId.equals(connectionId));
        });
    }

    public Room getRoomByConnection(String connectionId) {
        for (Room r : rooms.values()) {
            boolean hasPlayer = r.players.stream().anyMatch(p -> p.connectionId.equals(connectionId));
            if (hasPlayer)
                return r;
        }
        return null;
    }

    public long getOnlinePlayersCount() {
        return rooms.values().stream().mapToLong(r -> r.players.size()).sum();
    }

    public long getActiveRoomsCount() {
        return rooms.size();
    }
}
