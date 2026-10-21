# Bằng chứng thực thi (Evidence) — ESP32-C3 SuperMini Hardware SOS

## 1. Phân tích Anvien & Blast Radius
- Đã chạy `anvien analyze --force` trên toàn bộ kho mã nguồn (`375 files`, `43,365 nodes`, `45,768 relationships`).
- Đã chạy `anvien file-detail server.js --repo sos-vietnam-2026 --json` và `anvien impact file server.js --repo sos-vietnam-2026 --direction upstream` (`risk: high`, `symbolCount: 1303`).

## 2. Kiểm thử Endpoint `/api/hardware-sos`
- `GET /api/hardware-sos` trả về `200 OK` (`12.94ms`, `status: "ONLINE"`).
- `POST /api/hardware-sos` với đúng JSON payload từ code Arduino ESP32-C3 SuperMini trả về `200 OK` (`70.89ms`), tạo mã sự cố `IOT-...`, phân giải chính xác địa bàn `Phường Long Tuyền, TP. Cần Thơ` (`assignedUnit: "Công An Phường Long Tuyền"`), gắn nhãn `["🚨 Cấp cứu người cao tuổi (Vòng đeo cổ IoT)", "📡 Thiết bị: WEARABLE-SOS-MINI-01"]`.
- Kiểm thử `GET /api/dispatcher/incidents` xác nhận hiển thị `true`, `canOperate: true`, `readOnlySameTerritory: false`.
