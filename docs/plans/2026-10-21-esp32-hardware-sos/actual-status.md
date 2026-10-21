# Trạng thái thực tế (Actual Status) — ESP32-C3 SuperMini Hardware SOS

- **Trạng thái hiện tại**: Đã hoàn thành tích hợp Backend (`server.js`) & Frontend Trực ban (`js/dispatcher.js`, `dispatcher.html`), kiểm thử thành công 100% ở môi trường cục bộ và đang đẩy lên Render Web Hosting.
- **Chi tiết tiến độ**:
  - Đã kiểm tra mã nguồn C++/Arduino cho mạch **ESP32-C3 SuperMini** của người dùng.
  - Phát hiện 3 điểm cần đồng bộ để mạch gửi dữ liệu lên Trực ban hiển thị ngay lập tức:
    1. Bổ sung route `POST /api/hardware-sos` và `GET /api/hardware-sos` trong `server.js` (trước đây server chỉ nhận `/api/sos/create` và `/api/incidents`).
    2. Ánh xạ chuẩn xác các trường JSON của mạch ESP32-C3 (`latitude`, `longitude`, `citizen_name`, `phone`, `device_id`, `incident_type: "CAP_CUU_NGUOI_CAO_TUOI"`, `source: "WEARABLE_IOT_BUTTON"`) sang cấu trúc `incident` của hệ thống.
    3. Đảm bảo ca SOS phát từ phần cứng IoT (`isHardwareSos: true`) được phát SSE (`sos_new`) và hiển thị trên mọi tài khoản Trực ban đang mở (`dispatcher.html`) kèm còi hú, đọc thoại AI và nhãn thiết bị `📡 VÒNG ĐEO CỔ IoT ESP32-C3: WEARABLE-SOS-MINI-01`.
    4. Lưu ý kỹ thuật quan trọng cho mạch ESP32-C3 khi gọi `https://sos-vietnam-2026.onrender.com`: thư viện `HTTPClient` trên ESP32 gọi URL `https://` cần truyền `WiFiClientSecure` với `client.setInsecure()` để không bị từ chối chứng chỉ SSL (`httpCode = -1`).
