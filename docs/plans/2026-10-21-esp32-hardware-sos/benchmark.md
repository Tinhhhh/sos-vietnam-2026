# Benchmark — ESP32-C3 SuperMini Hardware SOS Integration

## 1. Mục tiêu hiệu năng
- Thời gian phản hồi API `POST /api/hardware-sos` nội bộ: `< 100 ms` (không gọi reverse geocoding mạng bên ngoài khi thiết bị đã gửi `address` sẵn).
- Thời gian phát SSE `sos_new` tới các màn hình Trực ban đang mở: `< 10 ms`.
- Payload phản hồi gọn nhẹ (`< 2 KB`) để ESP32-C3 SuperMini (RAM giới hạn) đọc `httpCode` nhanh và đóng kết nối tức thì.

## 2. Kết quả đo kiểm
| Hạng mục | Trước khi tích hợp | Sau khi tích hợp | Đánh giá |
|---|---|---|---|
| `GET /api/hardware-sos` | `404 Not Found` | `200 OK` (`12.94 ms`) | Đạt |
| `POST /api/hardware-sos` (ESP32 payload) | `404 Not Found` | `200 OK` (`70.89 ms`) | Đạt |
| Hiển thị trên Trực ban (`dispatcher.html`) | Không hiển thị | Hiển thị tức thì + Còi + Voice AI (`canOperate: true`) | Đạt |
| Anvien Graph Index | 375 files, 43,363 nodes | 375 files, 43,365 nodes | Đạt |
