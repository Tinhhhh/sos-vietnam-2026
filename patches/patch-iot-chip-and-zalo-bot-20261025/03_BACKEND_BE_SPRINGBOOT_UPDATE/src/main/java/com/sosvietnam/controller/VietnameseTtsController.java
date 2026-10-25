package com.sosvietnam.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Proxy phát âm thanh giọng đọc Tiếng Việt (vi-VN) cho Bàn Chỉ Huy Trực Ban,
 * khắc phục triệt để lỗi trình duyệt đọc giọng Tiếng Anh khi Windows thiếu gói giọng Việt.
 */
@RestController
@RequestMapping("/api/tts")
public class VietnameseTtsController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    @GetMapping("/vi")
    public ResponseEntity<byte[]> speakVietnamese(@RequestParam("q") String rawText) {
        String text = rawText == null ? "" : rawText.trim();
        if (text.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (text.length() > 190) {
            text = text.substring(0, 190);
        }

        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String url = "https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=" + encoded;
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<byte[]> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300 && resp.body() != null) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                        .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                        .body(resp.body());
            }
            return ResponseEntity.status(502).build();
        } catch (Exception e) {
            return ResponseEntity.status(502).build();
        }
    }
}
