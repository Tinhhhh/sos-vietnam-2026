# Multi-Network Zero-PII Blockchain Plan

## Metadata

- Date: `2026-11-02`
- Status: `in_progress`
- Plan: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-plan.md`
- Evidence: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-evidence.md`
- Benchmark: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-benchmark.md`
- Actual status: `docs/plans/2026-11-02-multi-network-zero-pii-blockchain/2026-11-02-multi-network-zero-pii-blockchain-actual-status.md`

## Goal

Triển khai kiến trúc **Đa mạng Chuỗi khối phân tầng bảo mật Zero-PII (`Multi-Network Tiered Visibility + Global Zero-PII Anchoring`)** cho hệ thống SOS Việt Nam 2026 trên môi trường thử nghiệm **`https://sos-vietnam-2026.onrender.com/`**, đảm bảo:
1. **Không lộ lọt thông tin (`Zero Data Leakage`)**: Tuyệt đối không đưa bất kỳ thông tin định danh cá nhân hoặc nghiệp vụ nhạy cảm nào (Họ tên, SĐT, CCCD, tọa độ GPS, địa chỉ hẻm/phường, tên/tài khoản/SĐT cán bộ, trụ sở, IP, ghi chú hiện trường) lên mạng quốc tế/ngoài nội bộ. Dữ liệu neo quốc tế chỉ chứa cam kết mật mã một chiều (`caseCommitmentHash`, `txHash`, `prevHash`, `payloadDigest`, `blockNumber`, mã bước quy trình tổng quát, nhãn thời gian UTC).
2. **Neo & Đối chứng Quốc tế thật (`Global Blockchain Timestamp Proof`)**: Tự động neo bất đồng bộ (`0ms` ảnh hưởng luồng cứu hộ) cam kết Zero-PII của từng Block lên mạng **Bitcoin Toàn Cầu qua giao thức chuẩn `OpenTimestamps` (`OTS`)**, lưu chứng chỉ nhị phân `.ots` thật và cho phép tải cặp tệp `SOSVN_Block_<N>_PublicAnchor.json` + `.ots` để kiểm chứng độc lập trên **`https://opentimestamps.org`**, đồng thời hỗ trợ chuẩn khung dữ liệu `NDAChain Quốc Gia` (`NDA`) và `Polygon / Ethereum EVM` (`POLYGON`).
3. **Thanh chuyển đổi mạng trực quan ở cả 3 giao diện (`Prominent Multi-Network Switcher`)**: Hiển thị rõ ràng bộ chuyển đổi qua lại giữa 4 mạng (`842026` Nội bộ SOS · `NDA` Chuỗi khối Quốc gia · `OTS` Quốc tế Bitcoin OpenTimestamps · `POLYGON` Quốc tế EVM) ngay trên:
   - Cổng Đối Chứng & Giải Mã (`/tra-cuu-blockchain.html`),
   - Vi Bằng Chứng Thực Block (`/api/blockchain/explorer/:ref`),
   - Bảng Bảo Chứng Chuỗi Khối của Trực Ban (`dispatcher.html` `#bcSecurityPanel`).
4. **Phân tầng hiển thị rõ ràng (`Internal Full vs International Zero-PII`)**:
   - **Mạng Nội Bộ (`842026`)**: Trực ban đăng nhập xem **Full 100% chi tiết nghiệp vụ** (ai báo, SĐT, CCCD, tọa độ GPS, địa chỉ, cán bộ & đơn vị nhận ca, thời lượng từng khâu); người xem công khai trên cổng nội bộ thấy quy trình tiếng Việt đã che một phần SĐT/CCCD.
   - **Mạng Quốc Gia (`NDA`) & Quốc Tế (`OTS` / `POLYGON`)**: Xem được và xác thực được tính tồn tại, thứ tự quy trình, thời gian từng khâu (`Δt`), mã băm toàn vẹn SHA-256 và bằng chứng neo toàn cầu `.ots`, nhưng **ẩn bảo mật tuyệt đối (`Zero-PII`)** mọi thông tin con người, vị trí và lực lượng trực chiến.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- After completing a phase or implementation slice and refreshing `actual-status.md`, update the next affected phase's work steps as needed to match the latest repo reality, while preserving that phase's original goal, scope, acceptance criteria, and major phase order.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- For app/runtime validation, full build must include Docker image/container build. If Docker is missing or not run, full build is incomplete.
- Any Playwright validation must target the real built Docker/container runtime (and Render Staging runtime for `P3-B`). Running Playwright against a host dev server, framework dev mode, mocked server, or source-run shortcut is not valid runtime evidence.
- If the Docker runtime cannot be built or started, the slice/plan is blocked; do not replace it with dev-server Playwright evidence.
- Playwright evidence must record the Docker build/run or compose command, container/service name, exposed URL, Playwright command, and screenshot/trace/result.
- Keep the standard planner structure. These detail rules only make phase checklist items concrete enough to implement safely.
- Every implementation phase must be decomposed into multiple implementation slices that are as small as practical. A phase is a grouping and ordering container; a slice is the executable implementation unit.
- Do not implement a phase directly. Work starts from a slice ID such as `P1-A`, `P1-B`, or `P2-A`.
- Hidden fallback is forbidden. Prefer a visible truthful status (`COMMITMENT_READY_NO_RPC_KEY` or `PENDING_CALENDAR_STAMP`) over fake explorer links that 404.
- Temporary files/directories MUST stay strictly inside repo-local `.tmp\` (`AGENTS.md` Master Iron Rule).
- Deploy and test ONLY on `https://sos-vietnam-2026.onrender.com/`; NEVER touch production `https://sosvie.site`.

## Problem

1. Trên trang Vi bằng `/api/blockchain/explorer/:ref` và Cổng Đối Chứng `/tra-cuu-blockchain.html` hiện **chưa có thanh chuyển đổi qua lại giữa các mạng chuỗi khối** (`Nội bộ 842026`, `Quốc gia NDA`, `Quốc tế Bitcoin OTS`, `Quốc tế Polygon EVM`), khiến người kiểm tra chỉ thấy sổ cái nội bộ cục bộ.
2. Trên `dispatcher.html` (`#bcSecurityPanel`), thẻ `<select id="bcNetworkSwitch">` nằm nhỏ ở góc tiêu đề và khi đổi mạng **chỉ đổi mỗi dòng chữ `#uiBcEnvBanner`**, hoàn toàn không chuyển đổi chế độ hiển thị dữ liệu giữa **Mạng Nội Bộ (Full nghiệp vụ)** và **Mạng Quốc Tế (Ẩn bảo mật Zero-PII)**.
3. Hệ thống chưa có lớp chiếu dữ liệu **Zero-PII Cryptographic Commitment** tách biệt cho mạng quốc tế và chưa neo tự động mã băm lên lịch chuỗi khối quốc tế công khai (`OpenTimestamps` Bitcoin Calendar) để người kiểm tra tải tệp `.ots` đối chứng trên `https://opentimestamps.org` mà không lộ lọt dữ liệu công dân/cán bộ.

## Scope

- `services/blockchain-ledger-service.js`: Định nghĩa danh mục 4 mạng (`842026`, `NDA`, `OTS`, `POLYGON`), hàm chiếu bảo mật `buildZeroPiiPublicAnchorDocument` + `projectBlockForNetworkView` + `projectCaseSummaryForNetworkView`, bộ đóng dấu & giải mã nhị phân `OpenTimestamps` (`anchorBlockToOpenTimestamps`, `inspectOtsProofBuffer`), và tham số `networkView` cho `lookupLedger` / `getRecentBlocks`.
- `server.js`: Kích hoạt neo `OTS` bất đồng bộ sau `sealBlockSync` trong `recordIncidentBlockchainEvent`, bổ sung route `GET /api/blockchain/ots/:ref`, `GET /api/blockchain/anchor-doc/:ref`, `POST /api/blockchain/anchor/:ref`, truyền tham số `network` vào `/api/blockchain/lookup`, `/api/blockchain/recent`, `/api/blockchain/explorer/:ref`, `/api/dispatcher/blockchain/verify`, và nâng cấp giao diện `/api/blockchain/explorer/:ref` có thanh chuyển đổi 4 mạng.
- `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`: Bổ sung thanh chuyển đổi 4 mạng nổi bật (`#bcvNetworkSwitchBar`), hiển thị phân tầng `Nội bộ (Full/Che nhẹ)` vs `Quốc gia / Quốc tế (Zero-PII + tải .anchor.json & .ots + hướng dẫn kiểm chứng opentimestamps.org)`.
- `dispatcher.html`, `js/dispatcher.js`, `sw.js`: Bổ sung thanh pill chuyển mạng trực quan `#bcNetPillBar` đồng bộ với `#bcNetworkSwitch` ngay đầu `#bcSecurityPanel`, cập nhật trực tiếp `#uiProcessSummaryBox`, `#uiAuditTimeline`, và `#verifyResult` theo mạng đang chọn; nâng phiên bản cache `sw.js`.
- `playwright/verify-multi-network-zero-pii-blockchain.mjs` & `Reports/qa/playwright/`: Kiểm thử E2E trên Docker local và Render Staging (`https://sos-vietnam-2026.onrender.com/`), bao gồm kiểm toán chống lộ lọt Zero-PII (`0` chuỗi PII xuất hiện ở chế độ quốc tế), tải và xác thực nhị phân `.ots`, và quét mã QR bằng OpenCV.

## Non-Goals

- Không triển khai hay tác động tới tên miền chính thức `https://sosvie.site`.
- Không lưu hay đẩy tệp âm thanh/video nặng lên bất kỳ chuỗi khối nào.
- Không nhúng khóa riêng ví tiền mã hóa thật vào mã nguồn; mạng EVM (`POLYGON` / `NDA`) hiển thị trung thực gói cam kết Calldata Hex Zero-PII và chỉ phát giao dịch RPC khi biến môi trường `POLYGON_AMOY_RPC_URL` / `NDA_CHAIN_RPC_URL` được cấu hình.

## Requirements

1. **Zero-PII Invariant trên mạng ngoài nội bộ (`NDA`, `OTS`, `POLYGON`)**:
   - Không trường nào trong JSON API hoặc HTML/DOM khi `network !== '842026'` được phép chứa: `reporterName`, `userName`, `reporterPhone`, `userPhone`, `phone`, `userCCCD`, `cccd`, `lat`, `lng`, `address`, `customNotes`, `resolutionNote`, `officerName`, `officerFullTitle`, `officerAccount`, `officerPhone`, `stationAddress`, `unitName` cụ thể cấp phường, hoặc `clientIp`.
   - Thay thế bằng: `caseCommitmentHash = 0x + SHA256("SOSVN_CASE|" + caseId + "|842026")`, `actorCommitmentHash`, mã bước quy trình chuẩn hóa (`1_SOS_TRIGGER`, `3_OFFICER_DISPATCH`, `3A_OFFICER_APPROACHING`, `3B_OFFICER_ARRIVED`, `4_CASE_RESOLVED`, `4B_FAKE_ALARM_FLAGGED`), mốc giờ UTC niêm phong, khoảng thời gian `Δt` từng khâu (giây), `txHash`, `prevHash`, `payloadDigest`, và `anchorDigest`.
2. **Chứng chỉ Quốc tế Bitcoin OpenTimestamps (`.ots`) chuẩn nhị phân v1**:
   - Tệp cam kết công khai `SOSVN_Block_<N>_PublicAnchor.json` (100% Zero-PII) có `anchorDigest = SHA256(fileBytes)`.
   - Gửi `POST /digest` (32 bytes `anchorDigest`) tới cụm lịch công khai OpenTimestamps (`https://a.pool.opentimestamps.org/digest`, dự phòng `b.pool`, `alice.btc.calendar`, `bob.btc.calendar`), đóng gói header chuẩn 31 bytes `\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94` + `\x01` (v1) + `\x08` (`OpSHA256`) + `anchorDigest` (32B) + `calendarBytes`.
   - Với các Block cũ chưa có `.ots`, khi gọi `GET /api/blockchain/ots/:ref` hoặc tra cứu mạng `OTS`, hệ thống tự động đóng dấu bổ sung theo yêu cầu (`on-demand stamp`) và lưu bền vững vào `ledger_chain.json`.
3. **Chuyển đổi mạng mượt mà & đồng nhất trên cả 3 bề mặt UI**:
   - Người dùng bấm chuyển qua lại giữa `Nội Bộ 842026`, `Quốc Gia NDAChain`, `Quốc Tế Bitcoin OTS`, `Quốc Tế Polygon EVM` thấy ngay sự khác biệt trực quan: Nội bộ hiện chi tiết ca trực tiếng Việt đầy đủ; Quốc tế hiện bảng Cam kết Mật mã Zero-PII kèm nhãn `🔒 ĐÃ ẨN BẢO MẬT ZERO-PII` và nút tải chứng chỉ đối chứng quốc tế.

## Acceptance Criteria

1. Kiểm toán tự động Zero-PII trên ca cứu hộ mẫu có đầy đủ PII (Họ tên, SĐT, CCCD, tọa độ GPS, địa chỉ phường/hẻm, tên/SĐT cán bộ, ghi chú) chứng minh **0 lần xuất hiện** bất kỳ chuỗi PII nào trong phản hồi API và DOM của các chế độ mạng `OTS`, `POLYGON`, `NDA`.
2. Ở chế độ mạng `842026` (Nội bộ), Trực ban đã đăng nhập xem được **100% thông tin đầy đủ** (không bị che SĐT/CCCD, đầy đủ tên người báo, tọa độ GPS, cán bộ nhận ca, thời lượng từng khâu).
3. Cả 3 giao diện (`dispatcher.html` `#bcSecurityPanel`, `/tra-cuu-blockchain.html`, `/api/blockchain/explorer/:ref`) đều có thanh chuyển đổi 4 mạng rõ ràng, bấm chuyển mạng đổi ngay nội dung hiển thị tương ứng.
4. Tải tệp `SOSVN_Block_<N>_PublicAnchor.json` và `SOSVN_Block_<N>_PublicAnchor.json.ots` từ giao diện mạng `OTS` trả về tệp nhị phân `.ots` hợp lệ (khớp magic bytes `OpenTimestamps Proof`, khớp `SHA256(PublicAnchor.json)`, giải mã được cây phép toán Merkle tới Calendar URI thực tế).
5. Toàn bộ mã QR trên cả 3 bề mặt quét thành công `100%` qua OpenCV `QRCodeDetector` trên cả Docker container local và môi trường Staging `https://sos-vietnam-2026.onrender.com/`.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: khảo sát đầy đủ mã nguồn thực tế, chạy phân tích đồ thị Anvien (`analyze --force`, `file-detail`, `impact`), kiểm chứng giao thức nhị phân OpenTimestamps trực tiếp, và lập bảng trạng thái thực tế trong `actual-status.md`.
  - Work Steps: đọc các tệp nguồn mục tiêu, lưu kết quả `anvien file-detail` và `anvien impact` vào `.tmp/p0-multi-net/`, chạy thử đóng dấu `POST https://a.pool.opentimestamps.org/digest`, điền đầy đủ `actual-status.md`, `evidence.md` (`E0`), `benchmark.md` (`B0`).
  - Implementation Gate: không chỉnh sửa mã nguồn sản phẩm cho tới khi `2026-11-02-multi-network-zero-pii-blockchain-actual-status.md` chốt quyết định P0.
  - Acceptance: `actual-status.md` phân loại đầy đủ các bề mặt `correct`, `partial`, `missing`, `unbound` kèm mã bằng chứng `E0-P0A-*`.

### P1: Backend Multi-Network Zero-PII Engine, OpenTimestamps Bitcoin Stamping & Explorer Switcher

- Phase Goal: Xây dựng lõi chiếu dữ liệu bảo mật Zero-PII, bộ đóng dấu & kiểm chứng nhị phân OpenTimestamps `.ots`, mở rộng API sổ cái hỗ trợ tham số `network`, và nâng cấp trang Vi bằng `/api/blockchain/explorer/:ref` có bộ chuyển mạng 4 chế độ.
- Phase Boundary:
  - In scope: `services/blockchain-ledger-service.js`, `server.js`.
  - Out of scope: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `dispatcher.html`, `js/dispatcher.js`, `css/style.css`, `sw.js`.
  - Dependencies: `P0-A`.
- Phase Implementation Rule: do not implement `P1` directly. Implement `P1-A`, verify it, record evidence, refresh actual-status, commit when required, then continue to `P1-B`.
- Ordered Slice List:
  - P1-A: Multi-network registry, Zero-PII projection, and OpenTimestamps `.ots` stamper/verifier in `services/blockchain-ledger-service.js`
  - P1-B: Non-blocking global anchoring hooks, `.ots`/`.anchor.json` download APIs, network-aware ledger routes, and 4-network switcher on `/api/blockchain/explorer/:ref` in `server.js`

- [x] P1-A: Multi-network registry, Zero-PII projection, and OpenTimestamps `.ots` stamper/verifier in `services/blockchain-ledger-service.js`
  - Goal: Bổ sung danh mục 4 mạng (`842026`, `NDA`, `OTS`, `POLYGON`), các hàm chiếu Zero-PII tuyệt đối không chứa PII cho mạng ngoài nội bộ, bộ đóng dấu lịch Bitcoin `OpenTimestamps` kèm trình đọc cây Merkle `.ots` thuần Node.js, và hỗ trợ `networkView` trong `lookupLedger` / `getRecentBlocks`.
  - Scope Boundary:
    - Editable: `services/blockchain-ledger-service.js`
    - Inspect-only: `server.js`
    - Preserve-only: `services/evidence-storage-service.js`, toàn bộ hàm băm nội bộ `computeDeterministicTxHash`, `sealBlockSync`, DePIN card seal (`DAC_TA_DONG_BO_WEB_VA_AI.md`)
    - Out of scope: UI HTML/CSS/JS client files
  - Non-Goals: Không thay đổi công thức `txHash` nội bộ của các Block đã niêm phong trên `ledger_chain.json`.
  - Pre-flight Questions:
    - Data source: `this.state.blocks` trong `ledger_chain.json` + cấu hình môi trường `resolveSystemBlockchainConfig(host)`.
    - Display permission: `networkView === '842026'` dùng `includeRawPii` (`true` cho trực ban, `false` che SĐT/CCCD cho công dân); `networkView` thuộc `['NDA', 'OTS', 'POLYGON']` bắt buộc áp dụng Zero-PII bất kể quyền đăng nhập để phản ánh đúng dữ liệu thực tế xuất hiện trên mạng ngoài nội bộ.
    - DB read flow: `loadLedger()` đọc `blocks[]` và trường `block.externalAnchors` (nếu đã đóng dấu `.ots`).
    - DB write flow: `anchorBlockToOpenTimestamps(ref)` cập nhật `block.externalAnchors.OTS` (gồm `status`, `stampedAt`, `calendarUrl`, `anchorDigest`, `otsBase64`, `otsByteLength`) rồi gọi `persistLedger()`.
    - Render location: N/A ở slice backend lõi (dữ liệu JSON trả về cho API ở `P1-B`).
    - UI behavior flow: N/A ở slice backend lõi; xác minh bằng kịch bản kiểm thử Node trực tiếp trên service.
    - Docker runtime: Kiểm tra cú pháp và kiểm thử hành vi module trước commit `P1-A`; kiểm thử full Docker E2E ở `P3-A`.
    - Playwright target: Sẽ kiểm thử toàn trình ở `P3-A` sau khi gắn API/UI.
    - Behavior test: Chạy kiểm thử tự động xác nhận (1) `projectCaseSummaryForNetworkView` & `projectBlockForNetworkView` với `OTS`/`POLYGON`/`NDA` có `0` chuỗi PII bị rò rỉ, (2) đóng dấu `.ots` thật lên OpenTimestamps pool tạo ra tệp `.ots` hợp lệ giải mã đúng `PendingAttestation` URI.
    - Cleanup/quarantine: Kiểm thử đơn vị chạy trên thư mục tạm `.tmp/p1a-ledger-test/` rồi dọn sạch, không ghi rác vào `evidence_storage/` của repo.
    - External side effects: Gửi `POST /digest` (32 bytes SHA-256 Zero-PII) tới `https://a.pool.opentimestamps.org/digest` (timeout 6s, không chặn luồng chính nếu offline).
    - N/A notes: UI render chưa đổi trong `P1-A` vì tách riêng sang `P1-B` và `P2`.
  - Work Steps:
    1. Thêm hằng số `BLOCKCHAIN_NETWORK_PROFILES` (`842026`, `NDA`, `OTS`, `POLYGON`), `normalizeNetworkView(net)`, hàm `computeCaseCommitmentHash(caseId)` và `buildZeroPiiPublicAnchorDocument(block)` trong `services/blockchain-ledger-service.js`.
       - UI flow check: N/A (backend pure projection function).
       - DB/data flow check: Kiểm tra đầu ra `buildZeroPiiPublicAnchorDocument` chỉ gồm các khóa cố định Zero-PII (`protocol`, `canonicalChainId`, `blockNumber`, `actionCode`, `sealedAt`, `caseCommitmentHash`, `prevHash`, `txHash`, `payloadDigest`).
       - Render location check: N/A (consumed by `server.js` in `P1-B`).
       - Mini QA for each completed implementation slice (MUST): Chạy script Node kiểm toán chuỗi PII trên đối tượng Block mẫu chứa đầy đủ tên/SĐT/CCCD/GPS/cán bộ.
       - Evidence target: `E1-P1A-SRC1`, `E1-P1A-TEST1`.
    2. Cài đặt `anchorBlockToOpenTimestamps(blockOrRef, options)` + `inspectOtsProofBuffer(otsBuf, expectedDigestBuf)` và mở rộng `lookupLedger` / `getRecentBlocks` nhận `networkView` để trả về `networkView`, `availableNetworks`, `publicAnchor`, và dữ liệu đã lọc Zero-PII khi xem mạng quốc gia/quốc tế.
       - UI flow check: N/A (API consumer wired in `P1-B`).
       - DB/data flow check: Xác nhận `anchorBlockToOpenTimestamps` lưu `externalAnchors.OTS` vào kho sổ cái tạm trong `.tmp/p1a-ledger-test/` và đọc lại thành công sau khi khởi tạo lại `BlockchainLedgerService`.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): Chạy test thực tế đóng dấu OpenTimestamps, giải mã lại `.ots` bằng `inspectOtsProofBuffer`, đối chiếu `anchorDigest` và Calendar URI.
       - Evidence target: `E1-P1A-TEST2`, `E1-P1A-DETECT1`, `E1-P1A-COMMIT1`.
  - Implementation Gate:
    - Đã chạy `anvien file-detail` và `anvien impact` cho `services/blockchain-ledger-service.js` (`E0-P0A-FD1`, `E0-P0A-IMP1`).
    - Bảo toàn 100% chữ ký hàm hiện có để không ảnh hưởng `services/evidence-storage-service.js` và `server.js`.
  - Acceptance:
    - Source: `services/blockchain-ledger-service.js` xuất đầy đủ `BLOCKCHAIN_NETWORK_PROFILES`, `normalizeNetworkView`, `buildZeroPiiPublicAnchorDocument`, `inspectOtsProofBuffer`, và các phương thức đa mạng trên `BlockchainLedgerService`.
    - Runtime/UI: `node --check services/blockchain-ledger-service.js` đạt `0` lỗi.
    - DB/data: Lưu và đọc lại `externalAnchors.OTS` thành công trên sổ cái thử nghiệm cô lập.
    - Behavior test: `0` rò rỉ PII trên cả 3 mạng ngoài nội bộ (`NDA`, `OTS`, `POLYGON`); chứng chỉ `.ots` đóng dấu thật đạt chuẩn magic header + SHA-256 Merkle trace.
    - Cleanup/quarantine: Xóa sạch `.tmp/p1a-ledger-test/` sau khi thu thập bằng chứng.
    - Evidence IDs: `E1-P1A-SRC1`, `E1-P1A-TEST1`, `E1-P1A-TEST2`, `E1-P1A-DETECT1`, `E1-P1A-COMMIT1`.
    - Actual-status rows refreshed: `services/blockchain-ledger-service.js` (`partial -> correct`).
  - Evidence Targets: `E1-P1A-SRC1`, `E1-P1A-TEST1`, `E1-P1A-TEST2`, `E1-P1A-DETECT1`, `E1-P1A-COMMIT1`.
  - Actual-status Update: Cập nhật dòng `services/blockchain-ledger-service.js` và thêm dòng `R1` vào `Status Refresh Log`.
  - Commit Boundary: commit sau khi `P1-A` vượt qua kiểm thử và `anvien detect-changes`.

- [ ] P1-B: Non-blocking global anchoring hooks, `.ots`/`.anchor.json` download APIs, network-aware ledger routes, and 4-network switcher on `/api/blockchain/explorer/:ref` in `server.js`
  - Goal: Tự động neo bất đồng bộ Block mới lên `OpenTimestamps` trong `recordIncidentBlockchainEvent`, mở các API tải tệp đối chứng quốc tế (`GET /api/blockchain/ots/:ref`, `GET /api/blockchain/anchor-doc/:ref`, `POST /api/blockchain/anchor/:ref`), truyền tham số `network` cho các API sổ cái, và bổ sung thanh chuyển đổi 4 mạng tương tác trực tiếp trên trang Vi bằng `/api/blockchain/explorer/:ref`.
  - Scope Boundary:
    - Editable: `server.js`
    - Inspect-only: `services/blockchain-ledger-service.js`
    - Preserve-only: Tất cả các route cứu hộ SOS, WebRTC, Zalo Bot, DePIN UART trong `server.js`
    - Out of scope: `tra-cuu-blockchain.html`, `dispatcher.html`, `js/*`, `css/*`
  - Non-Goals: Không chặn (`await`) kết quả mạng OpenTimestamps bên trong luồng tạo ca khẩn cấp `/api/sos`.
  - Pre-flight Questions:
    - Data source: `blockchainLedgerService` từ `P1-A` + `incidents` Map trong `server.js`.
    - Display permission: `/api/blockchain/explorer/:ref?network=842026` hiển thị đầy đủ cho cán bộ (hoặc che một phần SĐT/CCCD cho khách); `?network=NDA|OTS|POLYGON` hiển thị Vi bằng Cam kết Mật mã Zero-PII tuyệt đối không chứa PII.
    - DB read flow: `lookupLedger`, `getRecentBlocks`, `findBlockByTxOrNumber` đọc sổ cái và thông tin `externalAnchors`.
    - DB write flow: Khi `GET /api/blockchain/ots/:ref` hoặc `?network=OTS` gặp Block cũ chưa có `externalAnchors.OTS`, tự động đóng dấu bổ sung (`ensureBlockOpenTimestampsAnchor`) và lưu vào sổ cái.
    - Render location: HTML trả về từ `renderBlockchainExplorerCertificateHtml` tại `/api/blockchain/explorer/:ref`.
    - UI behavior flow: Trên `/api/blockchain/explorer/:ref`, thanh 4 tab mạng ở đầu trang cho phép bấm chuyển qua lại giữa `?network=842026`, `?network=NDA`, `?network=OTS`, `?network=POLYGON` và tải `.anchor.json` + `.ots`.
    - Docker runtime: Sẽ build Docker image kiểm chứng toàn trình ở `P3-A` và kiểm tra HTTP trực tiếp trên tiến trình tạm cô lập ở `P1-B`.
    - Playwright target: Kiểm tra trang `/api/blockchain/explorer/:ref` ở cả `P1-B` mini-QA và `P3-A` Docker E2E.
    - Behavior test: Kiểm tra các endpoint `/api/blockchain/lookup?q=...&network=OTS`, `/api/blockchain/anchor-doc/:ref`, `/api/blockchain/ots/:ref`, và HTML `/api/blockchain/explorer/:ref?network=OTS` trả mã `200`, đúng nhị phân `.ots`, `0` rò rỉ PII.
    - Cleanup/quarantine: Chạy tiến trình server kiểm thử với biến `DATA_DIR` hoặc thư mục tạm trong `.tmp/p1b-server-test/` để không làm bẩn sổ cái repo.
    - External side effects: Gọi lịch công khai OpenTimestamps khi đóng dấu Block.
    - N/A notes: Không áp dụng thay đổi CSS toàn cục ở slice này vì `/api/blockchain/explorer/:ref` là trang HTML độc lập tự chứa `<style>`.
  - Work Steps:
    1. Trong `recordIncidentBlockchainEvent` (`server.js`), kích hoạt `setImmediate(() => blockchainLedgerService.anchorBlockToOpenTimestamps(receipt.blockNumber).catch(...))` để mọi Block mới đều tự động có chứng chỉ `.ots` quốc tế mà độ trễ phản hồi SOS giữ nguyên `0ms`.
       - UI flow check: N/A (background async hook on SOS lifecycle events).
       - DB/data flow check: Sau khi tạo ca SOS thử nghiệm, `block.externalAnchors.OTS.status === 'STAMPED_PENDING_BTC'` được ghi xuống sổ cái.
       - Render location check: Phản ánh trong `/api/blockchain/lookup` và `/api/blockchain/explorer/:ref`.
       - Mini QA for each completed implementation slice (MUST): Gửi request tạo Block thử nghiệm trên server cô lập, kiểm tra thời gian phản hồi API và trạng thái `.ots` sau 2 giây.
       - Evidence target: `E1-P1B-ROUTE1`.
    2. Thêm các endpoint `GET /api/blockchain/anchor-doc/:ref`, `GET /api/blockchain/ots/:ref`, `POST /api/blockchain/anchor/:ref`; cập nhật `/api/blockchain/status`, `/api/blockchain/recent`, `/api/blockchain/lookup`, `/api/dispatcher/blockchain/verify`, và nâng cấp `renderBlockchainExplorerCertificateHtml` (`/api/blockchain/explorer/:ref`) với Thanh Chuyển Đổi 4 Mạng (`842026` · `NDA` · `OTS` · `POLYGON`) kèm bảng đối chứng Zero-PII & nút tải `.anchor.json` + `.ots`.
       - UI flow check: Mở `/api/blockchain/explorer/:ref?network=842026` -> bấm sang `?network=OTS` -> giao diện đổi sang Vi Bằng Cam Kết Quốc Tế Zero-PII và hiện nút tải `.ots` + link `https://opentimestamps.org`.
       - DB/data flow check: Tải `/api/blockchain/ots/:ref` trả về đúng `application/octet-stream` có SHA-256 khớp với tệp `/api/blockchain/anchor-doc/:ref`.
       - Render location check: Thanh `.net-switch-bar` nằm ngay dưới `.hdr` của `/api/blockchain/explorer/:ref`.
       - Mini QA for each completed implementation slice (MUST): Kiểm tra bằng Playwright/HTTP trên runtime cô lập cả 4 tab mạng của `/api/blockchain/explorer/:ref`.
       - Evidence target: `E1-P1B-ROUTE2`, `E1-P1B-DETECT1`, `E1-P1B-COMMIT1`.
  - Implementation Gate:
    - `P1-A` đã hoàn tất và commit; đã kiểm tra `anvien file-detail` & `anvien impact` cho `server.js` và `renderBlockchainExplorerCertificateHtml` (`E0-P0A-FD2`, `E0-P0A-IMP2`).
  - Acceptance:
    - Source: `node --check server.js` đạt `0` lỗi; đầy đủ các route đa mạng và `.ots`.
    - Runtime/UI: `/api/blockchain/explorer/:ref` hiển thị thanh chuyển đổi 4 mạng và render đúng chế độ Nội bộ vs Quốc tế Zero-PII.
    - DB/data: Block mới tự động được đóng dấu `.ots`; Block cũ tự động được đóng dấu bổ sung khi tải `.ots`.
    - Behavior test: `0` chuỗi PII xuất hiện trong JSON/HTML của `?network=OTS|POLYGON|NDA`; tệp `.ots` và `.anchor.json` khớp SHA-256 100%.
    - Cleanup/quarantine: Dừng server tạm và xóa dữ liệu thử nghiệm trong `.tmp/p1b-server-test/`.
    - Evidence IDs: `E1-P1B-ROUTE1`, `E1-P1B-ROUTE2`, `E1-P1B-DETECT1`, `E1-P1B-COMMIT1`.
    - Actual-status rows refreshed: `server.js` (`partial -> correct`), `/api/blockchain/explorer/:ref` (`partial -> correct`).
  - Evidence Targets: `E1-P1B-ROUTE1`, `E1-P1B-ROUTE2`, `E1-P1B-DETECT1`, `E1-P1B-COMMIT1`.
  - Actual-status Update: Cập nhật `server.js` và `/api/blockchain/explorer/:ref` trong `actual-status.md`, ghi `R2`.
  - Commit Boundary: commit sau khi `P1-B` vượt qua kiểm thử và `anvien detect-changes`.

### P2: Prominent Multi-Network Switcher & Tiered Visibility UI Across Verification Portal & Dispatcher Panel

- Phase Goal: Đưa bộ chuyển đổi 4 mạng nổi bật lên cả Cổng Đối Chứng `/tra-cuu-blockchain.html` và Bảng Chuỗi Khối Trực Ban `dispatcher.html` (`#bcSecurityPanel`), thể hiện rõ ràng cơ chế **Mạng nội bộ coi được full — Mạng quốc tế coi được xác thực nhưng ẩn bảo mật Zero-PII**.
- Phase Boundary:
  - In scope: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`, `dispatcher.html`, `js/dispatcher.js`, `sw.js`.
  - Out of scope: Backend `services/blockchain-ledger-service.js` và `server.js` (đã hoàn tất ở `P1`).
  - Dependencies: `P1-B`.
- Phase Implementation Rule: do not implement `P2` directly. Implement `P2-A`, verify it, record evidence, refresh actual-status, commit when required, then continue to `P2-B`.
- Ordered Slice List:
  - P2-A: 4-Network Switcher Bar & Zero-PII International Verification View on `/tra-cuu-blockchain.html` (`tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`)
  - P2-B: Segmented 4-Network Switcher Pill Bar & Live Full-vs-Zero-PII Preview inside `dispatcher.html` `#bcSecurityPanel` (`dispatcher.html`, `js/dispatcher.js`, `sw.js`)

- [ ] P2-A: 4-Network Switcher Bar & Zero-PII International Verification View on `/tra-cuu-blockchain.html`
  - Goal: Bổ sung Thanh Chuyển Đổi 4 Mạng Chuỗi Khối (`#bcvNetworkSwitchBar`) nổi bật trên `/tra-cuu-blockchain.html` để khi người dùng chuyển giữa `Nội bộ 842026`, `Quốc gia NDAChain`, `Quốc tế Bitcoin OTS`, và `Quốc tế Polygon EVM`, cả Báo cáo đối chứng hồ sơ lẫn Bảng danh sách Block mới nhất đều chuyển đổi tức thời giữa chế độ Nghiệp vụ Nội bộ và chế độ Cam kết Mật mã Quốc tế Zero-PII (kèm nút tải `.anchor.json` + `.ots` và liên kết `https://opentimestamps.org`).
  - Scope Boundary:
    - Editable: `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css`
    - Inspect-only: `server.js`
    - Preserve-only: Tính năng Tab 2 Giải mã tệp `.JSON` ngoại tuyến bằng WebCrypto SHA-256 và phát hiện giả mạo 1 ký tự
    - Out of scope: `dispatcher.html`, `js/dispatcher.js`, `sw.js`
  - Non-Goals: Không làm mất khả năng giải mã tệp `.json` cục bộ ở Tab 2 (khi người dùng tải tệp `.json` nội bộ ở Tab 2 vẫn cho phép bấm chuyển mạng để xem bản chiếu Zero-PII của chính tệp `.json` đó!).
  - Pre-flight Questions:
    - Data source: `/api/blockchain/lookup?q=...&network=<net>` và `/api/blockchain/recent?limit=15&network=<net>`, cộng với phép chiếu Zero-PII phía client khi đang xem tệp `.json` đã tải lên ở Tab 2.
    - Display permission: Ở `842026`, cán bộ có token (`sos_auth_token`) xem full PII, công dân xem bản che một phần SĐT/CCCD; ở `NDA`, `OTS`, `POLYGON`, hiển thị chuẩn Zero-PII kèm băng rôn đối chiếu bảo mật rõ ràng.
    - DB read flow: Gọi lại `/api/blockchain/lookup` và `/api/blockchain/recent` với tham số `network` mỗi khi đổi mạng (hoặc khởi tạo từ `?network=` trên URL).
    - DB write flow: Nút `⚡ Đóng dấu / Làm mới chứng chỉ Bitcoin .OTS` gọi `POST /api/blockchain/anchor/:ref` nếu người dùng muốn đóng dấu tức thời.
    - Render location: `#bcvNetworkSwitchCard` đặt ngay dưới `#bcvStatusStrip` trên `tra-cuu-blockchain.html`, điều khiển `#bcvReportSection` và `#bcvRecentSection`.
    - UI behavior flow: Mở `/tra-cuu-blockchain.html?tx=...` -> mặc định `842026` hiển thị chi tiết nghiệp vụ -> bấm `🌍 Quốc Tế Bitcoin (OpenTimestamps)` -> thẻ tóm tắt chuyển sang hiển thị `🔒 ĐÃ ẨN BẢO MẬT TRÊN MẠNG QUỐC TẾ (ZERO-PII)` cho Người báo/Cán bộ/Tọa độ, giữ nguyên Thời lượng phản ứng/di chuyển/tổng ca & Mã băm SHA-256, đồng thời xuất hiện hộp **Đối Chứng Toàn Cầu Trên OpenTimestamps.org** với 2 nút tải `.anchor.json` & `.ots`.
    - Docker runtime: Sẽ kiểm chứng đầy đủ trên Docker container ở `P3-A`.
    - Playwright target: Mở `/tra-cuu-blockchain.html` bằng Playwright để xác minh chuyển đổi qua lại cả 4 nút mạng.
    - Behavior test: Kiểm tra DOM khi chọn `OTS` không chứa tên/SĐT/tọa độ, có nút tải `.ots` hoạt động, và khi quay về `842026` hiển thị lại đầy đủ thông tin nghiệp vụ.
    - Cleanup/quarantine: Dọn dẹp instance kiểm thử tạm trong `.tmp/`.
    - External side effects: Liên kết ngoài mở tab mới tới `https://opentimestamps.org` khi người dùng chủ động bấm.
    - N/A notes: Không chạm Service Worker cho tới `P2-B`.
  - Work Steps:
    1. Thêm khối `#bcvNetworkSwitchCard` (4 nút mạng có icon, tên mạng, phạm vi hiển thị `Full Nghiệp Vụ` vs `Zero-PII Quốc Gia / Quốc Tế`, và thanh giải thích cơ chế bảo mật) vào `tra-cuu-blockchain.html` cùng CSS `.bcv-net-*` trong `css/style.css`.
       - UI flow check: Cả 4 nút mạng hiển thị rõ ràng trên desktop và mobile (`@media (max-width: 768px)`), có trạng thái `.is-active` nổi bật.
       - DB/data flow check: Đọc tham số `?network=` từ URL và đồng bộ `history.replaceState` khi người dùng chuyển mạng.
       - Render location check: Ngay phía trên thanh công cụ tra cứu của `tra-cuu-blockchain.html`.
       - Mini QA for each completed implementation slice (MUST): Kiểm tra bố cục bằng trình duyệt headless Playwright không tràn khung ở 1440px và 390px.
       - Evidence target: `E2-P2A-UI1`.
    2. Cập nhật `js/blockchain-verifier-portal.js` để nạp dữ liệu theo `activeNetwork`, render bảng **Đối Chứng Quốc Tế Zero-PII** (hiện `caseCommitmentHash`, `anchorDigest`, trạng thái lịch Bitcoin `OpenTimestamps`, nút tải `.anchor.json` + `.ots`, nút mở `https://opentimestamps.org`, khung dữ liệu Calldata EVM Zero-PII cho `POLYGON`/`NDA`) và cập nhật bảng Block gần nhất theo mạng đang chọn.
       - UI flow check: Bấm qua lại `842026` <-> `NDA` <-> `OTS` <-> `POLYGON` cập nhật tức thời cả báo cáo chi tiết và bảng Block mới nhất mà không lỗi console.
       - DB/data flow check: Xác nhận payload hiển thị trong thẻ `<pre>` ở chế độ `OTS`/`POLYGON`/`NDA` là gói `SOSVN-ANCHOR-V1` Zero-PII.
       - Render location check: `#bcvSummaryGrid`, `#bcvStepsList`, `#bcvGlobalAnchorBox`, `#bcvRecentTbody`.
       - Mini QA for each completed implementation slice (MUST): Dùng Playwright bấm cả 4 mạng trên `/tra-cuu-blockchain.html` và kiểm tra nội dung DOM + console errors = `0`.
       - Evidence target: `E2-P2A-UI2`, `E2-P2A-DETECT1`, `E2-P2A-COMMIT1`.
  - Implementation Gate:
    - `P1-B` đã hoàn tất; đã chạy `anvien file-detail` và `anvien impact` cho `tra-cuu-blockchain.html`, `js/blockchain-verifier-portal.js`, `css/style.css` (`E0-P0A-FD3`, `E0-P0A-FD4`, `E0-P0A-FD7`, `E0-P0A-IMP3`).
  - Acceptance:
    - Source: `node --check js/blockchain-verifier-portal.js` đạt `0` lỗi.
    - Runtime/UI: Thanh 4 mạng hiển thị nổi bật trên `/tra-cuu-blockchain.html`; chuyển mạng thay đổi rõ rệt giữa Full Nội bộ và Zero-PII Quốc tế.
    - DB/data: Tải `.anchor.json` và `.ots` trực tiếp từ giao diện thành công.
    - Behavior test: `0` PII trên DOM khi ở mạng `NDA`/`OTS`/`POLYGON`; khôi phục đầy đủ chi tiết khi chuyển về `842026`.
    - Cleanup/quarantine: Dọn sạch dữ liệu kiểm thử tạm trong `.tmp/`.
    - Evidence IDs: `E2-P2A-UI1`, `E2-P2A-UI2`, `E2-P2A-DETECT1`, `E2-P2A-COMMIT1`.
    - Actual-status rows refreshed: `tra-cuu-blockchain.html` (`missing -> correct`), `js/blockchain-verifier-portal.js` (`partial -> correct`), `css/style.css` (`partial -> correct`).
  - Evidence Targets: `E2-P2A-UI1`, `E2-P2A-UI2`, `E2-P2A-DETECT1`, `E2-P2A-COMMIT1`.
  - Actual-status Update: Cập nhật 3 dòng tương ứng trong `actual-status.md` và ghi `R3`.
  - Commit Boundary: commit sau khi `P2-A` vượt qua kiểm thử và `anvien detect-changes`.

- [ ] P2-B: Segmented 4-Network Switcher Pill Bar & Live Full-vs-Zero-PII Preview inside `dispatcher.html` `#bcSecurityPanel`
  - Goal: Biến phần chọn mạng trong `#bcSecurityPanel` của Bàn Điều Phối Trực Ban (`dispatcher.html` + `js/dispatcher.js`) thành **Thanh Chuyển Đổi 4 Mạng Nổi Bật (`#bcNetPillBar`)** đồng bộ hai chiều với `#bcNetworkSwitch`, giúp cán bộ trực ban bấm chuyển qua lại ngay trên màn hình tác chiến để xem:
    - **Mạng Nội Bộ `842026`**: Full 100% thông tin ca trực (Họ tên, SĐT đầy đủ, CCCD, tọa độ GPS, Cán bộ nhận ca, thời lượng từng khâu, tệp âm thanh hiện trường nếu có),
    - **Mạng Quốc Gia `NDA` / Quốc Tế `OTS` · `POLYGON`**: Chế độ đối chứng ngoài nội bộ đã khóa Zero-PII (`🔒 Đã ẩn bảo mật Họ tên/SĐT/GPS/Cán bộ trên mạng quốc tế`), hiện `Case Commitment Hash`, trạng thái neo toàn cầu `.ots`, và nút tải chứng chỉ `.ots` / mở Cổng Đối Chứng ở đúng mạng đang chọn; đồng thời cập nhật `CACHE_NAME` trong `sw.js`.
  - Scope Boundary:
    - Editable: `dispatcher.html`, `js/dispatcher.js`, `css/style.css` (nếu cần bổ sung style `.bc-net-pills`), `sw.js`
    - Inspect-only: `server.js`, `tra-cuu-blockchain.html`
    - Preserve-only: Mọi chức năng bản đồ GIS, nhận ca, điều phối xe, gọi WebRTC, Zalo Bot trong `dispatcher.html` và `js/dispatcher.js`
    - Out of scope: `index.html`, `cap-phat-the.html`
  - Non-Goals: Không thay đổi luồng nghiệp vụ nhận ca/đóng ca của trực ban; việc chọn mạng quốc tế trong `#bcSecurityPanel` chỉ chuyển chế độ xem & kiểm tra đối chứng chuỗi khối.
  - Pre-flight Questions:
    - Data source: Đối tượng `incident` đang chọn trong `js/dispatcher.js` + kết quả `POST /api/dispatcher/blockchain/verify` (truyền thêm `network: activeNetwork`).
    - Display permission: Trực ban đã xác thực phiên làm việc (`sos_auth_token`), nên ở mạng `842026` thấy 100% PII gốc; khi trực ban chủ động chuyển sang tab `NDA` / `OTS` / `POLYGON`, giao diện cho thấy chính xác góc nhìn Zero-PII mà bên đối chứng quốc gia/quốc tế nhìn thấy (không lộ PII).
    - DB read flow: Đọc `incident.blockchain` và gọi `/api/dispatcher/blockchain/verify` kèm `network`.
    - DB write flow: N/A (chỉ đọc/kiểm chứng và tải tệp `.ots` / `.json`).
    - Render location: Ngay đầu `#bcSecurityPanel` (`dispatcher.html`), điều khiển `#uiBcEnvBanner`, `#uiProcessSummaryBox`, `#uiEvidenceHash`, `#uiTxLink`, `#uiAuditTimeline`, `#btnOpenBcVerifierPortal`, và `#verifyResult`.
    - UI behavior flow: Chọn 1 ca SOS trên `dispatcher.html` -> cuộn tới `#bcSecurityPanel` -> thấy ngay 4 nút mạng (`🇻🇳 Nội Bộ 842026 (Full)` | `🏛️ Quốc Gia NDA` | `🌍 Quốc Tế Bitcoin OTS` | `🌍 Quốc Tế Polygon EVM`) -> bấm `🌍 Quốc Tế Bitcoin OTS` -> `#uiProcReporter` và `#uiProcOfficer` chuyển sang `🔒 Đã ẩn bảo mật Zero-PII (Cam kết SHA-256)`, thời lượng phản ứng/di chuyển vẫn hiển thị minh bạch, `#uiTxLink` và nút `Đối Chứng & Giải Mã ↗` trỏ thẳng tới `?network=OTS`, bấm `LIVE AUDIT` hiện cả nút `📥 Tải Chứng Chỉ Quốc Tế (.OTS)`.
    - Docker runtime: Build Docker image đầy đủ ngay sau `P2-B` để bước sang `P3-A`.
    - Playwright target: Kiểm tra trực tiếp trên `dispatcher.html` bằng tài khoản trực ban thật.
    - Behavior test: Đổi qua lại 4 nút mạng trong `#bcSecurityPanel` cập nhật đồng bộ cả `#bcNetworkSwitch` lẫn nội dung `#uiProcessSummaryBox`, `#uiAuditTimeline`, `#verifyResult`.
    - Cleanup/quarantine: Dọn ca thử nghiệm sau khi kiểm tra.
    - External side effects: Không có.
    - N/A notes: Không thay đổi cấu trúc lưu trữ ca trực của trực ban.
  - Work Steps:
    1. Bổ sung tùy chọn `<option value="OTS">BITCOIN OPENTIMESTAMPS (QUỐC TẾ)</option>` vào `#bcNetworkSwitch` và thêm thanh 4 nút `#bcNetPillBar` nổi bật ngay dưới `.bc-header` trong `dispatcher.html` (kèm CSS `.bc-net-pill-bar` trong `css/style.css`).
       - UI flow check: Thanh 4 nút hiển thị rõ ràng, dễ bấm ngay trong ngăn chi tiết sự cố (`#bcSecurityPanel`).
       - DB/data flow check: Lưu lựa chọn mạng hiện tại vào biến trạng thái bảng chuỗi khối và đồng bộ hai chiều với `<select id="bcNetworkSwitch">`.
       - Render location check: Bên trong `#bcSecurityPanel` giữa `.bc-header` và `#uiBcEnvBanner`.
       - Mini QA for each completed implementation slice (MUST): Mở `dispatcher.html` trên trình duyệt Playwright kiểm tra hiển thị của `#bcNetPillBar`.
       - Evidence target: `E2-P2B-UI1`.
    2. Nâng cấp `initBlockchainSecurityPanel`, `renderBlockchainPanel`, và `runIntegrityCheckForSelectedIncident` trong `js/dispatcher.js` để render phân tầng `842026` (Full 100% chi tiết nội bộ) vs `NDA`/`OTS`/`POLYGON` (Zero-PII Commitment + nút tải `.ots` + link đối chứng đúng mạng), và nâng `CACHE_NAME` trong `sw.js`.
       - UI flow check: Bấm `Nội Bộ 842026` thấy đủ Họ tên, SĐT, Cán bộ nhận ca; bấm `Quốc Tế Bitcoin OTS` thấy ngay chế độ bảo mật Zero-PII + liên kết tải `.ots` khi bấm `LIVE AUDIT`.
       - DB/data flow check: `POST /api/dispatcher/blockchain/verify` nhận `network` và trả kèm `otsDownloadUrl` + `anchorDocUrl`.
       - Render location check: `#uiProcessSummaryBox`, `#uiAuditTimeline`, `#verifyResult`.
       - Mini QA for each completed implementation slice (MUST): Chạy Playwright đăng nhập trực ban, bấm chuyển qua lại cả 4 mạng trên ca sự cố thật và bấm `LIVE AUDIT`.
       - Evidence target: `E2-P2B-UI2`, `E2-P2B-DETECT1`, `E2-P2B-COMMIT1`.
  - Implementation Gate:
    - `P2-A` đã hoàn tất và commit; đã kiểm tra `dispatcher.html`, `js/dispatcher.js`, `sw.js` (`E0-P0A-FD5`, `E0-P0A-FD6`, `E0-P0A-FD8`).
  - Acceptance:
    - Source: `node --check js/dispatcher.js` và `node --check sw.js` đạt `0` lỗi.
    - Runtime/UI: `#bcNetPillBar` nổi bật, bấm chuyển đổi mượt giữa Full Nội bộ và Zero-PII Quốc tế ngay trên `dispatcher.html`.
    - DB/data: `sw.js` mang tên cache mới để trình duyệt cập nhật ngay tài nguyên mới.
    - Behavior test: `0` lỗi console; dữ liệu nội bộ hiển thị đủ 100% ở `842026` và ẩn sạch PII ở `OTS`/`POLYGON`/`NDA`.
    - Cleanup/quarantine: Đóng/dọn ca test sau mini-QA.
    - Evidence IDs: `E2-P2B-UI1`, `E2-P2B-UI2`, `E2-P2B-DETECT1`, `E2-P2B-COMMIT1`.
    - Actual-status rows refreshed: `dispatcher.html` (`partial -> correct`), `js/dispatcher.js` (`partial -> correct`), `sw.js` (`correct -> correct`).
  - Evidence Targets: `E2-P2B-UI1`, `E2-P2B-UI2`, `E2-P2B-DETECT1`, `E2-P2B-COMMIT1`.
  - Actual-status Update: Cập nhật `dispatcher.html`, `js/dispatcher.js`, `sw.js` trong `actual-status.md`, ghi `R4`.
  - Commit Boundary: commit sau khi `P2-B` vượt qua kiểm thử và `anvien detect-changes`.

### P3: Real Docker Runtime E2E Validation & Live Render Staging Deployment (`sos-vietnam-2026.onrender.com`)

- Phase Goal: Kiểm chứng tự động toàn diện bằng Playwright + OpenCV + Kiểm toán Zero-PII trên Docker container thật ở máy local, sau đó đẩy lên nhánh Staging và kiểm chứng trực tiếp trên **`https://sos-vietnam-2026.onrender.com/`**.
- Phase Boundary:
  - In scope: `playwright/verify-multi-network-zero-pii-blockchain.mjs`, `Reports/qa/playwright/multi-network-zero-pii-blockchain-{local,staging}.{json,md}`, `Reports/qa/playwright/screenshots/`.
  - Out of scope: Môi trường chính thức `https://sosvie.site`.
  - Dependencies: `P1-A`, `P1-B`, `P2-A`, `P2-B`.
- Phase Implementation Rule: do not implement `P3` directly. Implement `P3-A` on real local Docker container first, commit, push to `origin/main`, then execute `P3-B` on live Render Staging.
- Ordered Slice List:
  - P3-A: Reusable Playwright + OpenCV + Zero-PII Audit E2E verification against real built Docker container (`sos-vietnam:local`)
  - P3-B: Push to Staging (`https://sos-vietnam-2026.onrender.com/`) and execute live Staging Playwright + OpenTimestamps E2E verification

- [ ] P3-A: Reusable Playwright + OpenCV + Zero-PII Audit E2E verification against real built Docker container (`sos-vietnam:local`)
  - Goal: Viết bộ kiểm thử tái sử dụng `playwright/verify-multi-network-zero-pii-blockchain.mjs`, build image Docker thật `docker build -t sos-vietnam:local .`, khởi chạy container, và chứng minh toàn bộ 5 tiêu chí nghiệm thu (Full Nội bộ `842026`, Zero-PII tuyệt đối trên `NDA`/`OTS`/`POLYGON`, bộ chuyển đổi 4 mạng trên cả 3 bề mặt UI, tải & giải mã chứng chỉ `.ots` thật, và quét QR OpenCV 100%) cùng với việc chạy lại `playwright/verify-blockchain-process-qr-decoder.mjs` đảm bảo không hồi quy.
  - Scope Boundary:
    - Editable: `playwright/verify-multi-network-zero-pii-blockchain.mjs`, `Reports/qa/playwright/multi-network-zero-pii-blockchain-local.{json,md}`, `Reports/qa/playwright/screenshots/*`
    - Inspect-only: `playwright/verify-blockchain-process-qr-decoder.mjs`
    - Preserve-only: Tất cả mã nguồn ứng dụng (trừ khi phát hiện lỗi thực tế cần quay lại sửa đúng slice)
    - Out of scope: `https://sosvie.site`
  - Non-Goals: Không dùng host dev server thay thế cho Docker container.
  - Pre-flight Questions:
    - Data source: Container Docker thật chạy từ `Dockerfile` của repo.
    - Display permission: Kiểm tra cả 3 vai trò/chế độ: (1) Trực ban đăng nhập xem `842026` (100% Full PII), (2) Công dân chưa đăng nhập xem `842026` (che một phần SĐT/CCCD), (3) Mọi người xem `NDA` / `OTS` / `POLYGON` (100% Zero-PII).
    - DB read flow: API `/api/blockchain/*` bên trong container.
    - DB write flow: Tạo ca SOS đầy đủ quy trình 5 bước, kiểm tra `.ots` được đóng dấu và lưu trong container.
    - Render location: `dispatcher.html`, `/tra-cuu-blockchain.html`, `/api/blockchain/explorer/:ref`.
    - UI behavior flow: Thao tác click thật trên trình duyệt Chromium Playwright qua cả 4 nút mạng ở cả 3 trang.
    - Docker runtime: `docker build -t sos-vietnam:local .` và `docker run -d --name sos-vietnam-multinet-qa -p 3412:3000 sos-vietnam:local`.
    - Playwright target: `http://127.0.0.1:3412`.
    - Behavior test: `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url http://127.0.0.1:3412 --report-prefix local` + `node playwright/verify-blockchain-process-qr-decoder.mjs --base-url http://127.0.0.1:3412 --report-prefix local`.
    - Cleanup/quarantine: Đóng ca SOS test trong kịch bản và `docker rm -f sos-vietnam-multinet-qa` sau khi hoàn tất.
    - External side effects: Đóng dấu digest Zero-PII 32-byte lên lịch công khai OpenTimestamps.
    - N/A notes: Không có.
  - Work Steps:
    1. Tạo `playwright/verify-multi-network-zero-pii-blockchain.mjs` kiểm tra toàn trình: khởi tạo ca SOS chứa dữ liệu nhạy cảm đặc trưng (Họ tên, SĐT, CCCD, GPS, địa chỉ hẻm, cán bộ nhận ca, ghi chú), đi hết 5 bước quy trình, kiểm tra `dispatcher.html` chuyển đổi 4 mạng, kiểm tra `/tra-cuu-blockchain.html` chuyển đổi 4 mạng, kiểm tra `/api/blockchain/explorer/:ref` chuyển đổi 4 mạng, kiểm toán `0` rò rỉ chuỗi nhạy cảm ở cả 3 mạng ngoài nội bộ, tải cặp `.anchor.json` + `.ots` xác minh chữ ký nhị phân OpenTimestamps, và quét QR bằng OpenCV.
       - UI flow check: Chụp ảnh màn hình đối chứng `Nội Bộ Full` vs `Quốc Tế Zero-PII` trên cả 3 trang lưu vào `Reports/qa/playwright/screenshots/`.
       - DB/data flow check: Xác minh tệp `.ots` tải về khớp `SHA256(.anchor.json)` và giải mã ra Calendar URI hợp lệ.
       - Render location check: Kiểm tra đủ 3 bề mặt UI.
       - Mini QA for each completed implementation slice (MUST): Chạy trên Docker container thật `sos-vietnam-multinet-qa` và chạy kèm bộ hồi quy `verify-blockchain-process-qr-decoder.mjs`.
       - Evidence target: `E3-P3A-DOCKER1`, `E3-P3A-PW1`, `E3-P3A-REGR1`.
    2. Dừng/xóa container QA `sos-vietnam-multinet-qa`, chạy `anvien analyze --force` + `anvien detect-changes`, cập nhật báo cáo và commit slice `P3-A`.
       - UI flow check: Tất cả ảnh chụp màn hình và báo cáo `.json`/`.md` đã ghi đầy đủ vào `Reports/qa/playwright/`.
       - DB/data flow check: Không còn dữ liệu tạm bẩn trên host.
       - Render location check: Báo cáo QA chính thức tại `Reports/qa/playwright/multi-network-zero-pii-blockchain-local.{json,md}`.
       - Mini QA for each completed implementation slice (MUST): Kiểm tra `docker ps -a` xác nhận container tạm đã dọn sạch.
       - Evidence target: `E3-P3A-DETECT1`, `E3-P3A-COMMIT1`.
  - Implementation Gate:
    - Không còn tiến trình giữ khóa Docker build; `P2-B` đã commit sạch.
  - Acceptance:
    - Source: `playwright/verify-multi-network-zero-pii-blockchain.mjs` chạy độc lập, tái sử dụng cho cả `--report-prefix local` và `--staging`.
    - Runtime/UI: `100%` bước kiểm thử đạt `PASS` trên container Docker thật.
    - DB/data: `0` chuỗi PII rò rỉ trên các chế độ mạng `NDA`, `OTS`, `POLYGON`; `.ots` nhị phân hợp lệ 100%.
    - Behavior test: Cả suite mới lẫn suite hồi quy `verify-blockchain-process-qr-decoder.mjs` đều đạt `100% PASS`.
    - Cleanup/quarantine: Container `sos-vietnam-multinet-qa` đã xóa sạch.
    - Evidence IDs: `E3-P3A-DOCKER1`, `E3-P3A-PW1`, `E3-P3A-REGR1`, `E3-P3A-DETECT1`, `E3-P3A-COMMIT1`.
    - Actual-status rows refreshed: `playwright/verify-multi-network-zero-pii-blockchain.mjs` (`missing -> correct`).
  - Evidence Targets: `E3-P3A-DOCKER1`, `E3-P3A-PW1`, `E3-P3A-REGR1`, `E3-P3A-DETECT1`, `E3-P3A-COMMIT1`.
  - Actual-status Update: Cập nhật dòng Playwright E2E suite trong `actual-status.md`, ghi `R5`.
  - Commit Boundary: commit sau khi `P3-A` đạt `100% PASS`.

- [ ] P3-B: Push to Staging (`https://sos-vietnam-2026.onrender.com/`) and execute live Staging Playwright + OpenTimestamps E2E verification
  - Goal: Đẩy các commit lên `origin/main` để Render tự động triển khai lên môi trường Staging **`https://sos-vietnam-2026.onrender.com/`**, chờ bản mới kích hoạt, và chạy `playwright/verify-multi-network-zero-pii-blockchain.mjs --staging` xác minh trực tiếp trên môi trường thật (bao gồm cả đối chứng Block cũ `#101` và ca mới trên Staging).
  - Scope Boundary:
    - Editable: `Reports/qa/playwright/multi-network-zero-pii-blockchain-staging.{json,md}`, `Reports/qa/playwright/screenshots/*`
    - Inspect-only: `https://sos-vietnam-2026.onrender.com/`
    - Preserve-only: Mọi tệp mã nguồn sản phẩm
    - Out of scope: Tuyệt đối KHÔNG đụng tới `https://sosvie.site`
  - Non-Goals: Không để lại ca cứu hộ thử nghiệm ở trạng thái đang mở trên bảng điều phối Staging (phải đóng ca `RESOLVED` ngay trong kịch bản test).
  - Pre-flight Questions:
    - Data source: Máy chủ Render Staging `https://sos-vietnam-2026.onrender.com`.
    - Display permission: Kiểm tra cả chế độ Trực ban đăng nhập (`842026` Full), Công dân (`842026` che nhẹ), và Quốc tế (`OTS`/`POLYGON`/`NDA` Zero-PII) trực tiếp trên Staging.
    - DB read flow: Gọi `/api/blockchain/status` trên Staging xác nhận trường mới `supportedNetworks` đã có mặt sau khi deploy.
    - DB write flow: Tạo và hoàn tất 1 ca SOS kiểm thử trên Staging + đóng dấu `.ots` thật, sau đó đóng ca sạch sẽ.
    - Render location: Live URLs trên `https://sos-vietnam-2026.onrender.com/`.
    - UI behavior flow: Playwright mở trực tiếp URL Staging kiểm tra thanh chuyển đổi 4 mạng ở cả 3 bề mặt.
    - Docker runtime: Render Staging chạy chính `Dockerfile` vừa kiểm chứng ở `P3-A`.
    - Playwright target: `https://sos-vietnam-2026.onrender.com`.
    - Behavior test: `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging`.
    - Cleanup/quarantine: Ca SOS kiểm thử trên Staging được đóng hoàn tất (`resolved`) để không gây nhiễu bàn trực ban.
    - External side effects: `git push origin main` kích hoạt deploy Staging Render.
    - N/A notes: Không có.
  - Work Steps:
    1. Chạy `git push origin main` và theo dõi `/api/blockchain/status` trên `https://sos-vietnam-2026.onrender.com` cho tới khi phản hồi chứa `supportedNetworks` của phiên bản mới.
       - UI flow check: N/A (rollout readiness check).
       - DB/data flow check: `/api/blockchain/status` trả `200` với cấu trúc 4 mạng mới.
       - Render location check: `https://sos-vietnam-2026.onrender.com/api/blockchain/status`.
       - Mini QA for each completed implementation slice (MUST): Kiểm tra HTTP `/healthz` và `/api/blockchain/status` trên Staging.
       - Evidence target: `E3-P3B-DEPLOY1`.
    2. Chạy `node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging` và xác minh toàn bộ các bài kiểm tra (Zero-PII leak = `0`, 4-network switcher trên cả 3 giao diện, tải `.ots` thật, quét QR OpenCV 100%).
       - UI flow check: Ảnh chụp màn hình thực tế từ `https://sos-vietnam-2026.onrender.com` cho cả 3 trang ở chế độ Nội bộ và Quốc tế.
       - DB/data flow check: Ca test trên Staging đã đóng trạng thái `resolved`, chứng chỉ `.ots` tải từ Staging giải mã thành công.
       - Render location check: `Reports/qa/playwright/multi-network-zero-pii-blockchain-staging.{json,md}`.
       - Mini QA for each completed implementation slice (MUST): Mở và kiểm tra báo cáo JSON/MD xác nhận `failedCount === 0`.
       - Evidence target: `E3-P3B-PW1`, `E3-P3B-DETECT1`, `E3-P3B-COMMIT1`.
  - Implementation Gate:
    - `P3-A` đã đạt `100% PASS` trên Docker local.
  - Acceptance:
    - Source: Báo cáo QA Staging đầy đủ cả `.json` và `.md`.
    - Runtime/UI: `https://sos-vietnam-2026.onrender.com/` hoạt động hoàn hảo cả 4 mạng trên cả 3 giao diện.
    - DB/data: `0` rò rỉ PII trên Staging ở chế độ quốc tế; chứng chỉ `.ots` tải được thực tế.
    - Behavior test: `failedCount === 0` trong `multi-network-zero-pii-blockchain-staging.json`.
    - Cleanup/quarantine: Ca test trên Staging đã đóng hoàn tất.
    - Evidence IDs: `E3-P3B-DEPLOY1`, `E3-P3B-PW1`, `E3-P3B-DETECT1`, `E3-P3B-COMMIT1`.
    - Actual-status rows refreshed: `Render Staging Runtime` (`partial -> correct`).
  - Evidence Targets: `E3-P3B-DEPLOY1`, `E3-P3B-PW1`, `E3-P3B-DETECT1`, `E3-P3B-COMMIT1`.
  - Actual-status Update: Cập nhật dòng `Render Staging Runtime` trong `actual-status.md`, ghi `R6`.
  - Commit Boundary: commit các báo cáo QA Staging sau khi kiểm chứng hoàn tất.

- [ ] Pn-A: Call supervisor for the implemented-plan acceptance loop.
  - Goal: thực hiện rà soát độc lập Zero-Trust theo `.agents/skills/supervisor/SKILL.md` đối với toàn bộ kế hoạch, `actual-status.md`, `evidence.md`, `benchmark.md`, mã nguồn thay đổi, ảnh chụp màn hình và báo cáo QA trên cả Docker local lẫn Render Staging.
  - Work Steps:
    1. Đọc và áp dụng quy trình kiểm toán `.agents/skills/supervisor/SKILL.md` trên toàn bộ các tệp đã sửa và bằng chứng đã ghi.
    2. Nếu phát hiện bất kỳ thiếu sót nào, quay lại đúng slice chịu trách nhiệm để khắc phục triệt để.
    3. Chạy lại rà soát Supervisor cho tới khi đạt `PASS` hoàn toàn.
  - Implementation Gate: tất cả các slice `P1-A`..`P3-B` đã hoàn tất.
  - Acceptance: Supervisor xác nhận `PASS` với đầy đủ bằng chứng thực thi.

- [ ] Pn-B: Remove dead work created during this plan.
  - Goal: đảm bảo worktree và diff cuối cùng không còn tệp tạm hay mã thừa phát sinh từ kế hoạch này.
  - Work Steps:
    1. Kiểm tra `.tmp/` (xóa các thư mục nháp của kế hoạch này như `.tmp/p0-multi-net`, `.tmp/bc-multinet-qa-*`), kiểm tra `git status` đảm bảo không chạm vào các tệp có sẵn ngoài phạm vi của người dùng.
    2. Xác nhận không còn đoạn mã chết, placeholder hay console debug thừa trong các tệp đã chỉnh sửa.
    3. Rà soát lại theo chuẩn Supervisor cho bước dọn dẹp.
  - Implementation Gate: chỉ xóa các tệp tạm do chính kế hoạch này tạo ra.
  - Acceptance: `git diff` sạch tuyệt đối, chỉ chứa đúng các tệp thuộc phạm vi kế hoạch; `.tmp/` của kế hoạch đã được dọn gọn.

- [ ] Pn-C: Close the plan.
  - Goal: hoàn thiện sổ cái bằng chứng, benchmark, trạng thái kế hoạch `completed`, commit đóng kế hoạch và đồng bộ lên `origin/main`.
  - Work Steps:
    1. Kiểm tra lại toàn bộ mã bằng chứng trong `evidence.md`, số liệu đo lường trong `benchmark.md`, và trạng thái cuối trong `actual-status.md`.
    2. Đánh dấu `Status: completed` trong `plan.md` và `actual-status.md`.
    3. Commit hồ sơ kế hoạch/bằng chứng cuối cùng và `git push origin main`.
  - Implementation Gate: `Pn-A` và `Pn-B` đã hoàn tất.
  - Acceptance: mọi mục checklist được tích `[x]`, commit đóng kế hoạch hoàn tất, nhánh `main` đồng bộ sạch với `origin/main`.

## Risk Notes

- **Nguy cơ lộ lọt PII gián tiếp qua tiền ảnh hash (`txHash` preimage)**: `txHash` nội bộ được băm từ `payload` chứa thông tin ca trực nội bộ. Do đó, khi đóng dấu lên lịch công khai `OpenTimestamps` (`OTS`), tuyệt đối **không** cung cấp `payload` nội bộ làm tệp gốc đối chứng công khai; thay vào đó hệ thống tạo tệp `SOSVN_Block_<N>_PublicAnchor.json` (100% Zero-PII, chứa `txHash`, `prevHash`, `payloadDigest`, `caseCommitmentHash`) và đóng dấu `SHA256(PublicAnchor.json)`. Nhờ vậy bất kỳ ai trên thế giới cũng có thể kéo thả cặp `.json` + `.ots` lên `https://opentimestamps.org` để xác thực mà **0% dữ liệu nhạy cảm bị lộ**.
- **Độ trễ mạng tới lịch quốc tế OpenTimestamps**: Được gọi hoàn toàn bất đồng bộ (`setImmediate` + timeout 6s + dự phòng 4 máy chủ calendar), đảm bảo nếu mạng quốc tế chập chờn thì luồng báo cứu hộ khẩn cấp `/api/sos` vẫn phản hồi tức thời `0ms` bị chặn.
- **Tệp có sẵn ngoài phạm vi trong workspace**: Workspace đang có một số tệp chưa commit từ các phiên làm việc khác của người dùng; luôn chỉ định rõ tên tệp khi `git add <file...>` (tuyệt đối không chạy `git add .` hoặc `git add -A`).
