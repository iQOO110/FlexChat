package com.flexchat.controller;

import com.flexchat.dto.ApiResponse;
import com.flexchat.dto.ChatRequest;
import com.flexchat.dto.ModelRequest;
import com.flexchat.service.ChatService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ======================== 获取模型列表 ========================
    @PostMapping("/models")
    public ApiResponse<List<String>> getModels(@RequestBody ModelRequest request) {
        try {
            List<String> models = chatService.fetchModels(request.baseUrl(), request.apiKey());
            return ApiResponse.ok(models);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    // ======================== 流式对话 ========================
    @PostMapping(value = "/chat/completions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody chatCompletions(
            @RequestBody ChatRequest request,
            HttpServletResponse response) {

        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // 禁用 Nginx 缓冲

        return outputStream -> {
            try {
                chatService.streamChat(request, outputStream);
            } catch (IOException e) {
                String error = "{\"error\":{\"message\":\"" + e.getMessage() + "\"}}";
                outputStream.write(("data: " + error + "\n\n").getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }
        };
    }
}

