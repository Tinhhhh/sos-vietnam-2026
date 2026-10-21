# Kế hoạch tích hợp thiết bị IoT ESP32-C3 SuperMini SOS (`/api/hardware-sos`) & Triển khai Web Hosting

## 1. Mục tiêu
- Tích hợp endpoint chuyên dụng `POST /api/hardware-sos` và `GET /api/hardware-sos` vào [`server.js`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/server.js) tương thích 100% với gói JSON từ vi điều khiển **ESP32-C3 SuperMini** (`device_id`, `citizen_name`, `phone`, `incident_type`, `latitude`, `longitude`, `address`, `source`).
- Tự động phân giải địa bàn hành chính từ tọa độ GPS (`latitude: 10.0452`, `longitude: 105.7469` -> Phường Long Tuyền, TP. Cần Thơ), gán đơn vị trực ban sở tại, phát tín hiệu `sos_new` qua SSE tới mọi màn hình Trực ban đang mở (`dispatcher.html`) để bật còi báo động, đọc Voice AI khẩn cấp và hiển thị huy hiệu **VÒNG ĐEO CỔ IoT ESP32-C3**.
- Đẩy code lên kho lưu trữ chính (`git push origin main`) để cập nhật trực tiếp lên web hosting `https://sos-vietnam-2026.onrender.com` và kiểm tra kết nối thực tế.

## 2. Danh sách công việc (Checklist)
- [x] **Task 1**: Phân tích mã nguồn Arduino ESP32-C3 SuperMini và đối chiếu hợp đồng API trong `server.js` + `js/dispatcher.js`.
- [x] **Task 2**: Bổ sung endpoint `GET /api/hardware-sos` (kiểm tra trạng thái kết nối) và `POST /api/hardware-sos` trong `server.js`, ánh xạ đầy đủ các trường `device_id`, `citizen_name`, `phone`, `incident_type`, `latitude`, `longitude`, `address`, `source`, và mở rộng phạm vi phát SSE `broadcastToDispatchers` cho tín hiệu phần cứng IoT (`isHardwareSos: true`).
- [x] **Task 3**: Cập nhật `js/dispatcher.js` và `dispatcher.html` để hiển thị huy hiệu phần cứng IoT (`📡 VÒNG ĐEO CỔ IoT ESP32-C3: WEARABLE-SOS-MINI-01`), kích hoạt còi báo động & Voice AI ngay khi nhận tín hiệu từ mạch ESP32-C3 SuperMini.
- [x] **Task 4**: Kiểm thử cục bộ endpoint `POST /api/hardware-sos` với đúng payload từ code ESP32-C3 SuperMini; chạy `anvien detect-changes`, commit và `git push` lên `https://sos-vietnam-2026.onrender.com`, sau đó bắn thử tín hiệu thực tế lên server Render để xác nhận hoạt động 100%.
