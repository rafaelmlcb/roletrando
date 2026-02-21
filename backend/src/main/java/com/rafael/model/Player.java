package com.rafael.model;

public class Player {
    public String id;
    public String name;
    public int score;
    public String avatar;
    public String connectionId; // WebSocket Connection ID
    public boolean isBot;

    public Player() {
    }

    public Player(String id, String name, String avatar, String connectionId, boolean isBot) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.connectionId = connectionId;
        this.score = 0;
        this.isBot = isBot;
    }
}
