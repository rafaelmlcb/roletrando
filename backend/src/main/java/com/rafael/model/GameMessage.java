package com.rafael.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GameMessage {
    public String type;
    public Object payload;

    public GameMessage() {
    }

    public GameMessage(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }
}
