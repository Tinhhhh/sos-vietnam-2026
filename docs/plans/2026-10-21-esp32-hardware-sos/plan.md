# Kế hoạch tích hợp thiết bị IoT ESP32-C3 SuperMini SOS (`/api/hardware-sos`) & Phân luồng 3 lực lượng theo lần nhấn

## 1. Mục tiêu
- Tích hợp endpoint chuyên dụng `POST /api/hardware-sos` và `GET /api/hardware-sos` vào [`server.js`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/server.js) tương thích 100% với gói JSON từ vi điều khiển **ESP32-C3 SuperMini**.
- Bổ sung cơ chế phân luồng lực lượng theo số lần nhấn nút trên mạch ESP32-C3 SuperMini (và đồng bộ trên cả Backend `server.js`):
  - **Nhấn lần 1**: Báo về **Công an đơn vị** (`agency: "police"`, `incident_type: "BAO_CONG_AN_DON_VI"`, Còi bíp 1 tiếng).
  - **Nhấn lần 2**: Báo về **Cảnh sát giao thông (CSGT)** (`agency: "csgt"`, `incident_type: "BAO_CANH_SAT_GIAO_THONG"`, Còi bíp 2 tiếng).
  - **Nhấn lần 3**: Báo về **Cảnh sát PCCC và CNCH** (`agency: "fire"`, `incident_type: "BAO_PCCC_VA_CNCH"`, Còi bíp 3 tiếng).
  - Sau lần 3 tự động quay vòng về lần 1.
- Đẩy code lên kho lưu trữ chính (`git push origin main`) để cập nhật trực tiếp lên web hosting `https://sos-vietnam-2026.onrender.com`.

## 2. Danh sách công việc (Checklist)
- [x] **Task 1**: Phân tích mã nguồn Arduino ESP32-C3 SuperMini và đối chiếu hợp đồng API trong `server.js` + `js/dispatcher.js`.
- [x] **Task 2**: Bổ sung endpoint `GET /api/hardware-sos` và `POST /api/hardware-sos` trong `server.js`, xóa toàn bộ icon và tối ưu kết nối Wi-Fi/HTTPS.
- [x] **Task 3**: Nâng cấp code Arduino ESP32-C3 SuperMini (`hardware/esp32_c3_supermini_sos/esp32_c3_supermini_sos.ino`) và `server.js` + `js/dispatcher.js` để hỗ trợ 3 mức nhấn nút (Lần 1: Công an đơn vị, Lần 2: Cảnh sát giao thông, Lần 3: PCCC và CNCH) và đẩy lên Web Hosting.
