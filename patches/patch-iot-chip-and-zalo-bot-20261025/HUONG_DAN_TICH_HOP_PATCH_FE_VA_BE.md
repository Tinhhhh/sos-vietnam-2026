# 📦 GÓI PATCH CẬP NHẬT ĐỘC LẬP (FE + BE + FIRMWARE)
## Tích Hợp Mạch Phát Tín Hiệu 4G GPS (`ESP32-C3 TDM2421`) + Giọng Đọc Tiếng Việt + Hệ Thống Bot Zalo Trực Ban Phân Tầng 2 Chiều

- **Phiên bản Patch:** `2026.10.26-iot-zalo-v5`
- **Tương thích với cả 2 kiến trúc:**
  1. **Web Chính tách rời FE & BE:**
     - **Frontend (`sos-vietnam-2026-FE`)**: React 19 + Vite + `public/dispatcher.html` & `public/js/dispatcher.js`
     - **Backend (`sos-vietnam-2026-BE`)**: Java 21 + Spring Boot 3.4.2 (`com.sosvietnam.*`)
  2. **Web Hosting / C4ISR Node.js Gateway (`sos_vietnam_2026_web_hosting`)**: Node.js 20+ (`server.js` + `services/zalo-bot-service.js`)

---

## 📂 CẤU TRÚC THƯ MỤC GÓI PATCH

```text
patch-iot-chip-and-zalo-bot-20261025/
├── HUONG_DAN_TICH_HOP_PATCH_FE_VA_BE.md          <-- Tài liệu hướng dẫn tích hợp từng bước (file này)
│
├── 01_WEB_HOSTING_GATEWAY_PATCH/                 <-- Dành cho repo Node.js Gateway / Web Hosting
│   ├── sos-vietnam-2026-iot-chip-and-zalo-bot-20261025.patch   (File git apply chuẩn)
│   ├── services/zalo-bot-service.js              (Module điều phối Bot Zalo phân tầng 2 chiều)
│   └── server.js                                 (Bản đầy đủ đã gắn API Mạch 4G GPS + TTS + Zalo Bot)
│
├── 02_FRONTEND_FE_UPDATE/                        <-- Gửi cho đội Frontend (sos-vietnam-2026-FE)
│   ├── public/
│   │   ├── dispatcher.html                       (Đã thêm nút "Bot Zalo", Modal kết nối, Báo cáo đẹp)
│   │   └── js/dispatcher.js                      (Đã sửa giọng đọc Tiếng Việt chuẩn + UI Zalo Bot + IoT Badge)
│   └── src/features/
│       ├── zalo-bot/
│       │   ├── zaloBotApi.js                     (API client cho React 19 + Vite)
│       │   └── ZaloBotConfigModal.jsx            (Component React 19 độc lập nếu gắn vào trang Admin React)
│       └── hardware-iot/
│           └── hardwareSosApi.js                 (API client mô phỏng & theo dõi Mạch 4G GPS ESP32-C3)
│
├── 03_BACKEND_BE_SPRINGBOOT_UPDATE/              <-- Gửi cho đội Backend (sos-vietnam-2026-BE - Java 21)
│   ├── SecurityConfig_va_IncidentController.patch.md  (Hướng dẫn thêm 5 dòng permitAll & hook tạo sự cố)
│   └── src/main/java/com/sosvietnam/
│       ├── controller/
│       │   ├── HardwareSosController.java        (POST/GET /api/hardware-sos nhận tín hiệu 1-2-3 lần bấm)
│       │   ├── VietnameseTtsController.java      (GET /api/tts phát giọng đọc Tiếng Việt chuẩn cho trực ban)
│       │   └── ZaloBotController.java            (Webhook /ketnoi, TN, Link Tiếp Nhận 1 Chạm HMAC-SHA256)
│       └── service/
│           └── ZaloBotDispatchService.java       (Định tuyến đúng Xã/Phường, Nhắc 3 phút, Leo thang 15 phút)
│
└── 04_FIRMWARE_CHIP_4G_GPS_ESP32C3/              <-- Mã nguồn nạp vào mạch phần cứng thực tế
    ├── esp32_c3_tdm2421_4g_gps_sos/              (Bản chính: Kit 4G LTE SIM + GPS Quectel EG800K TDM2421, không cần Wi-Fi)
    └── esp32_c3_sos_wearable/                    (Bản dự phòng: ESP32-C3 SuperMini dùng Wi-Fi/Hotspot)
```

---

## 🚀 HƯỚNG DẪN ÁP DỤNG CHO ĐỘI WEB CHÍNH (FE + BE)

### Bước 1 — Cập nhật Backend (`sos-vietnam-2026-BE` - Spring Boot 3.4.2)

1. Copy nguyên thư mục `03_BACKEND_BE_SPRINGBOOT_UPDATE/src/main/java/com/sosvietnam/` đè/gộp vào `src/main/java/com/sosvietnam/` của repo `sos-vietnam-2026-BE` (gồm 4 class mới, không làm gãy bất kỳ class cũ nào):
   - `controller/HardwareSosController.java`
   - `controller/VietnameseTtsController.java`
   - `controller/ZaloBotController.java`
   - `service/ZaloBotDispatchService.java`
2. Mở `SecurityConfig.java` và `IncidentController.java`, thêm đúng 2 đoạn cấu hình ngắn theo file `03_BACKEND_BE_SPRINGBOOT_UPDATE/SecurityConfig_va_IncidentController.patch.md`:
   - Cho phép `.permitAll()` với `/api/hardware-sos/**`, `/api/sos/hardware/**`, `/api/tts`, `/api/zalo/webhook`, `/api/zalo/quick-accept`.
   - Gọi `zaloBotDispatchService.onIncidentCreated(...)` khi có SOS mới và `zaloBotDispatchService.cancelTimers(id)` khi điều động.
3. Build kiểm tra:
   ```bash
   ./mvnw clean package -DskipTests
   ```

> **Lưu ý nếu hệ thống dùng Node.js Gateway (`server.js`):** Chỉ cần copy `01_WEB_HOSTING_GATEWAY_PATCH/services/zalo-bot-service.js` và chạy `git apply 01_WEB_HOSTING_GATEWAY_PATCH/sos-vietnam-2026-iot-chip-and-zalo-bot-20261025.patch` (hoặc chép đè `server.js`).

---

### Bước 2 — Cập nhật Frontend (`sos-vietnam-2026-FE` - React 19 + Vite)

1. Copy 2 file giao diện Bàn Chỉ Huy Trực Ban từ `02_FRONTEND_FE_UPDATE/public/` vào `public/` của repo `sos-vietnam-2026-FE`:
   - `public/dispatcher.html`
   - `public/js/dispatcher.js`
2. *(Tùy chọn mở rộng cho trang React)* Copy `02_FRONTEND_FE_UPDATE/src/features/` vào `src/features/` để sử dụng `zaloBotApi.js`, `hardwareSosApi.js` và `<ZaloBotConfigModal />` ngay trong các màn hình React Admin.
3. Trong `vite.config.js` (môi trường dev local), đảm bảo proxy `/api` trỏ về cổng Backend (`http://localhost:8080` hoặc `http://localhost:3000`).
4. Build kiểm tra:
   ```bash
   npm run build
   ```

---

## 📱 TÓM TẮT LUỒNG NGHIỆP VỤ MỚI ĐÃ ĐƯỢC KIỂM THỬ E2E

1. **Mạch phát tín hiệu độc lập 4G GPS (`ESP32-C3 TDM2421` — Quectel EG800K):**
   - Dùng trực tiếp SIM 4G LTE + vệ tinh GNSS, **không cần Wi-Fi**.
   - Đếm số lần bấm trong cửa sổ 5 giây:
     - **Nhấn 1 lần:** Báo động **Công An Xã/Phường** sở tại theo tọa độ GPS.
     - **Nhấn 2 lần:** Báo động **Đội Cảnh Sát Giao Thông (CSGT)**.
     - **Nhấn 3 lần:** Báo động **Cảnh Sát PCCC & CNCH (114)**.
2. **Giọng đọc Tiếng Việt chuẩn & Báo cáo hiện trường chuyên nghiệp:**
   - Sửa triệt để lỗi trình duyệt đọc giọng Tiếng Anh sau khi bấm *Tiếp nhận*; tự động ưu tiên `/api/tts` giọng Tiếng Việt rõ ràng.
   - Định dạng lại Biên bản Báo cáo Sự cố hiện trường sắc nét, có đầy đủ huy hiệu thiết bị 4G GPS / cường độ sóng CSQ / tọa độ vệ tinh.
3. **1 Bot Zalo Tổng định tuyến thông minh, Khóa Mật Khẩu Trực Ban & Tiếp nhận 2 chiều:**
   - **Không cần thu thập SĐT cá nhân từng cán bộ & Chống kết nối trái phép:** tạo Nhóm Zalo đơn vị (VD: *Trực Ban CA Phường Tân An*), thêm Bot và gõ `@TênBot /ketnoi cap_tanan Congan@113` (Mật khẩu mặc định theo đúng lực lượng trực ban: Công an `Congan@113`, CSGT `Csgt@113`, PCCC `Pccc@114`, Y tế 115 `Capcuu@115`, Cứu hộ xe `Cuuhoxe@113`, Tổng Trực Ban Quốc Gia `Admin` — kèm khóa chống dò mật khẩu 5 lần/10 phút).
   - **Cách ly địa bàn tuyệt đối:** Sự cố tại *Phường Tân An* chỉ đổ chuông Zalo của *CA Phường Tân An*, không làm phiền *Phường Long Tuyền* hay đơn vị khác.
   - **Tiếp nhận ngay khi đi ăn cơm / tuần tra:** bấm **Link Tiếp Nhận 1 Chạm** (ký số HMAC-SHA256 chống giả mạo) để mở ngay nút **Dẫn đường Google Maps + Gọi nạn nhân**, hoặc trả lời chữ **`TN`** ngay trên Zalo.
   - **Nhắc khẩn 3 phút & Leo thang Tỉnh 15 phút** (kèm công tắc **Demo Nhanh 20 giây / 45 giây** ngay trên giao diện Web để trình diễn hội đồng).
4. **Phát Thông Báo Khẩn Cấp / Bảo Trì & Cập Nhật Hệ Thống (Bắn Thẳng Toàn Bộ Zalo — `/api/dispatcher/zalo/broadcast`):**
   - Cho phép Trung tâm Chỉ huy / Quản trị viên chọn nhanh 4 mẫu (🔧 *Sắp bảo trì & cập nhật*, 🚨 *Công điện trực chiến khẩn*, ⛈️ *Cảnh báo mưa bão / ngập lụt*, ✅ *Hoàn tất nâng cấp*) hoặc tự nhập tiêu đề + nội dung và **bắn thẳng đồng loạt** về toàn bộ nhóm & cán bộ Zalo đã liên kết (hoặc lọc riêng theo Công an Xã/Phường, CSGT, PCCC, 115, Tỉnh/TP), đồng thời hiện băng rôn thông báo nổi realtime qua SSE trên tất cả màn hình Web Bàn Trực Ban.
5. **Lưu Cố Định `BOT_TOKEN` & Tự Động Khôi Phục Qua Browser Vault (`/api/dispatcher/zalo/restore-backup`):**
   - Nhập `BOT_TOKEN` **1 lần duy nhất**: hệ thống khóa chống ghi đè rỗng khi bấm *Lưu cấu hình* ở các lần sau, hiển thị huy hiệu `✅ Đã lưu cố định BOT_TOKEN` kèm nút `Xóa Token` riêng biệt, đồng thời đồng bộ dự phòng Browser Vault để tự động khôi phục cả `BOT_TOKEN`, Webhook HTTPS và danh sách nhóm Zalo ngay cả khi container đám mây (Render) khởi động lại.
6. **Truyền Trực Tiếp Ảnh & Video Hiện Trường Từ Người Dân Về Zalo (`sendPhoto` + `/api/zalo/media` HTTP 206 + `/api/zalo/media-view`):**
   - Người dân đính kèm Ảnh/Video lúc phát SOS **hoặc** bấm nút **`📷`** ngay trong khung chat cứu hộ trực tiếp (`POST /api/sos/media`): hệ thống lập tức bắn ảnh (`sendPhoto`) và thẻ phát Video HTML5 di động 1 chạm (`/api/zalo/media-view` hỗ trợ tua byte-range HTTP `206` & miễn trừ Anti-Bot WAF cho `Go-http-client` bằng chữ ký số HMAC-SHA256) thẳng về nhóm Zalo của đơn vị đang phụ trách ca!
