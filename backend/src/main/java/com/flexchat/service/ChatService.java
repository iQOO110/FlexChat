package com.flexchat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexchat.dto.ChatRequest;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ChatService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ======================== 获取模型列表 ========================
    @SuppressWarnings("unchecked")
    public List<String> fetchModels(String baseUrl, String apiKey) throws IOException {
        String url = normalizeUrl(baseUrl) + "/models";
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        try {
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setConnectTimeout(15_000);
            conn.setReadTimeout(30_000);

            int code = conn.getResponseCode();
            InputStream is = code < 400 ? conn.getInputStream() : conn.getErrorStream();
            if (is == null) {
                throw new IOException("上游返回 " + code + " 无响应体");
            }

            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            if (code >= 400) {
                throw new IOException("上游错误 " + code + ": " + extractErrorMessage(body));
            }

            Map<String, Object> json = objectMapper.readValue(body, Map.class);
            Object data = json.get("data");
            if (!(data instanceof List<?> list)) {
                return Collections.emptyList();
            }

            List<String> models = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m && m.get("id") != null) {
                    models.add(m.get("id").toString());
                }
            }
            return models;
        } finally {
            conn.disconnect();
        }
    }

    // ======================== 流式对话 ========================
    public void streamChat(ChatRequest request, OutputStream out) throws IOException {
        String url = normalizeUrl(request.baseUrl()) + "/chat/completions";

        // 组装上游请求体
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", request.model());
        body.put("messages", request.messages());
        body.put("stream", true);
        String jsonBody = objectMapper.writeValueAsString(body);

        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + request.apiKey());
            conn.setRequestProperty("Accept", "text/event-stream");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15_000);
            conn.setReadTimeout(0); // 流式不设读超时

            // 发送请求体
            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            InputStream is = code < 400 ? conn.getInputStream() : conn.getErrorStream();

            if (is == null) {
                writeError(out, "上游返回 " + code + " 无响应体");
                return;
            }

            // 上游返回错误 — 以 SSE error 事件下发
            if (code >= 400) {
                String errorBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                writeError(out, extractErrorMessage(errorBody));
                return;
            }

            // 逐行读取上游 SSE 并原样转发
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(is, StandardCharsets.UTF_8));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data:")) {
                    out.write((line + "\n\n").getBytes(StandardCharsets.UTF_8));
                    out.flush();
                }
            }
        } finally {
            conn.disconnect();
        }
    }

    // ======================== 工具方法 ========================

    private void writeError(OutputStream out, String message) throws IOException {
        String json = objectMapper.writeValueAsString(
                Map.of("error", Map.of("message", message)));
        out.write(("data: " + json + "\n\n").getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    private String normalizeUrl(String url) {
        return url != null ? url.replaceAll("/+$", "") : "";
    }

    @SuppressWarnings("unchecked")
    private String extractErrorMessage(String body) {
        try {
            Map<String, Object> json = objectMapper.readValue(body, Map.class);
            Object error = json.get("error");
            if (error instanceof Map<?, ?> m && m.get("message") != null) {
                return m.get("message").toString();
            }
            return body;
        } catch (Exception e) {
            return body;
        }
    }
}
