package com.rafael.model.dto;

import java.util.List;

public class SecureQuizQuestion {
    public int id;
    public String question;
    public List<String> options;

    public SecureQuizQuestion(int id, String question, List<String> options) {
        this.id = id;
        this.question = question;
        this.options = options;
    }
}
