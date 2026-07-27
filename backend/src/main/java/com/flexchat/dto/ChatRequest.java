package com.flexchat.dto;

import java.util.List;

public record ChatRequest(
        String baseUrl,
        String apiKey,
        String model,
        List<Message> messages,
        boolean stream
) {
    public record Message(String role, String content) {}
}