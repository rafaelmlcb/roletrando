package com.rafael.model.dto;

import java.util.List;

public class SecureMillionaireQuestion {
    public String question;
    public List<String> options;

    public SecureMillionaireQuestion(String question, List<String> options) {
        this.question = question;
        this.options = options;
    }
}
