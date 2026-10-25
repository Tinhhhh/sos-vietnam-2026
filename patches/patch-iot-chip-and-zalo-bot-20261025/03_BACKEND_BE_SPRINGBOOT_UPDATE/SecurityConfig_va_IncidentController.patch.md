# Cập nhật `SecurityConfig.java` & `IncidentController.java` trên `sos-vietnam-2026-BE` (Spring Boot 3.4.2)

## 1. Mở quyền truy cập Public cho Mạch 4G GPS, Giọng đọc Tiếng Việt & Webhook Zalo trong `SecurityConfig.java`

Mở file `src/main/java/com/sosvietnam/config/SecurityConfig.java` và bổ sung các đường dẫn sau vào `.requestMatchers(...).permitAll()`:

```java
.requestMatchers(
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/api/v1/auth/**",
        "/api/geo/**",
        "/api/stations/**",
        "/api/incidents/**",
        "/api/hardware-sos/**",      // <--- MỚI: Cho phép Mạch 4G GPS ESP32-C3 TDM2421 đẩy tọa độ SOS
        "/api/sos/hardware/**",      // <--- MỚI: Alias dự phòng cho mạch IoT
        "/api/tts",                  // <--- MỚI: Proxy giọng đọc Tiếng Việt chuẩn cho Bàn Trực Ban
        "/api/zalo/webhook",         // <--- MỚI: Webhook nhận tin nhắn /ketnoi và TN từ Zalo Bot Platform
        "/api/zalo/quick-accept",    // <--- MỚI: Link Tiếp nhận 1 chạm ký số HMAC-SHA256 trên điện thoại
        "/ws/**",
        "/ws-raw/**",
        "/error"
).permitAll()
.requestMatchers("/api/dispatcher/zalo/**", "/api/zalo/**").hasAnyAuthority("ADMIN", "DISPATCHER", "OFFICER")
```

---

## 2. Gắn Hook thông báo Zalo tự động khi người dân bấm SOS trên Web PWA (`IncidentController.java`)

Ngoài tín hiệu từ mạch phần cứng 4G GPS (`HardwareSosController` đã tự động gọi `zaloBotDispatchService.onIncidentCreated(...)`), để mọi ca SOS bấm từ Web/PWA người dân (`POST /api/incidents`) cũng đồng thời bắn tin nhắn Zalo về đúng Xã/Phường:

Mở `src/main/java/com/sosvietnam/controller/IncidentController.java`:

1. Inject `private final ZaloBotDispatchService zaloBotDispatchService;` (nhờ `@RequiredArgsConstructor`).
2. Ngay sau dòng `CreateIncidentResponse response = incidentService.createIncident(request);` trong hàm `create(...)` (và `dispatch(...)`), thêm:

```java
// Gửi báo động tức thì về đúng Nhóm Zalo Công an Xã/Phường hoặc Đội CSGT/PCCC:
zaloBotDispatchService.onIncidentCreated(response.getIncident(), null, null);
```

3. Trong hàm `dispatch(...)` (`POST /api/incidents/{id}/dispatch`), ngay sau khi gọi `incidentService.dispatchIncident(id, request)`, thêm dòng hủy hẹn giờ nhắc 3 phút / leo thang 15 phút:

```java
zaloBotDispatchService.cancelTimers(id);
```

---

## 3. Biến môi trường tùy chọn trong `application.yml` (hoặc cấu hình trực tiếp trên giao diện Web)

```yaml
sos:
  zalo:
    config-file: ./data/zalo-bot-config.json
    bot-token: ${ZALO_BOT_TOKEN:}
    public-base-url: ${PUBLIC_BASE_URL:https://sos-vietnam-2026.onrender.com}
```
