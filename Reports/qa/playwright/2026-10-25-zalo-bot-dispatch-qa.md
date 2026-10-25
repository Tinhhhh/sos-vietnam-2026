# QA Report: Hierarchical Zalo Bot Dispatch & Two-Way Field Acceptance

- **Timestamp:** `2026-10-25T08:26:06.224Z`
- **Target Runtime:** `http://127.0.0.1:3099` (Isolated `SOS_RUNTIME_DATA_DIR`)
- **Result:** **10/10 PASSED** (0 failed)
- **Desktop Modal Screenshot:** `Reports/qa/playwright/2026-10-25-zalo-bot-modal-verified.png`
- **Mobile 1-Tap Accept Screenshot:** `Reports/qa/playwright/2026-10-25-zalo-quick-accept-mobile.png`

## Assertions

- [x] **1. Webhook /ketnoi with Go-http-client/1.1 User-Agent succeeds without AI-Bot 403 block** — `{"pairedGroups":4}`
- [x] **1b. Outer Cosmic Portal (1024x555) displays #btnPortalZaloBot clearly before login** — `{"exists":true,"visible":true,"rect":{"left":520,"top":429,"right":720,"bottom":460,"width":200}}`
- [x] **1c. Logged-in Top Header at 1024x555 displays #btnHeaderZaloBot unclipped inside viewport** — `{"exists":true,"unclipped":true,"rect":{"left":826,"top":9,"right":972,"width":146}}`
- [x] **2. Dispatcher UI #btnHeaderZaloBot opens #zaloBotConfigModal showing 4 paired Zalo groups & 9 presets** — `{"visible":true,"boundCount":4,"presetCards":9}`
- [x] **3. Territorial Ward Isolation: SOS in Phường Tân An routes ONLY to zalo_grp_tanan_01 (not Long Tuyền or CSGT)** — `{"incidentId":"IOT-MVNKCRET-151","notifiedChatsForTanAn":["zalo_grp_tanan_01"]}`
- [x] **4. 1-Tap Mobile Quick-Accept Link verifies HMAC, renders confirmation HTML, and transitions SOS to dispatching** — `{"status":"dispatching","acceptedVia":"zalo_link"}`
- [x] **5. Forged Quick-Accept link signature is rejected with HTTP 403** — `{"httpStatus":403}`
- [x] **6. Two-Way Zalo Chat Reply "@BotSOS TN" routes Step-2 SOS to CSGT and transitions status to dispatching** — `{"csgtId":"IOT-MVNKCRXW-631","status":"dispatching","acceptedVia":"zalo_chat","officer":"Đại úy Lê Quốc Bảo"}`
- [x] **7. Provincial Escalation dispatches urgent alert to Chỉ Huy Công An TP. Cần Thơ (zalo_grp_chihuy_ct)** — `{"escId":"IOT-MVNKCS5C-551","hqChats":["zalo_grp_chihuy_ct"]}`
- [x] **8. Desktop & Mobile screenshots captured cleanly** — `{"desktopScreenshot":"C:\\Users\\dienv\\Desktop\\sos_vietnam_2026_web_hosting\\Reports\\qa\\playwright\\2026-10-25-zalo-bot-modal-verified.png","mobileScreenshot":"C:\\Users\\dienv\\Desktop\\sos_vietnam_2026_web_hosting\\Reports\\qa\\playwright\\2026-10-25-zalo-quick-accept-mobile.png"}`
