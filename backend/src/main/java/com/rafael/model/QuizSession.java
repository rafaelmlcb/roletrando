package com.rafael.model;

import java.util.HashMap;
import java.util.Map;

public class QuizSession {
    public int currentStep = 0;
    public int totalQuestions = 0; // Set when game starts; used to detect end of quiz
    public String phase = "question"; // question, feedback, question_ranking, accumulated_ranking, ended
    public Map<String, Integer> roundScores = new HashMap<>(); // connectionId -> score
    public int answeredCount = 0;

    public QuizSession() {
    }
}
