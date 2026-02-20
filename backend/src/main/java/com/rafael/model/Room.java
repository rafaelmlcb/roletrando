package com.rafael.model;

import java.util.ArrayList;
import java.util.List;

public class Room {
    public String id;
    public List<Player> players = new ArrayList<>();
    public GameSession gameSession;
    public int currentTurnIndex = 0;

    public Room() {
    }

    public Room(String id) {
        this.id = id;
    }
}
