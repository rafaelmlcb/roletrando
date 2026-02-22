package com.rafael.model;

import java.util.ArrayList;
import java.util.List;

public class Room {
    public String id;
    public List<Player> players = new ArrayList<>();
    public GameSession gameSession; // For Roletrando
    public QuizSession quizSession; // For Quiz
    public int currentTurnIndex = 0;
    public String status = "WAITING"; // WAITING, PLAYING, FINISHED
    public String hostConnectionId;
    public boolean historyRecorded = false; // Prevents double-recording on game over

    public Room() {
    }

    public Room(String id) {
        this.id = id;
    }
}
