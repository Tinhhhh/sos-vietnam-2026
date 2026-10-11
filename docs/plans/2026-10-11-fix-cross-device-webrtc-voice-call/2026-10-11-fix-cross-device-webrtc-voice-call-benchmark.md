# Sửa Lỗi Đàm Thoại 2 Chiều & Bắt Giọng Nói Giữa Các Thiết Bị Khác Nhau Benchmark Ledger

## Metadata

- Date: `2026-10-11`
- Plan: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-plan.md`
- Evidence: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-evidence.md`
- Benchmark: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-benchmark.md`
- Actual status: `docs/plans/2026-10-11-fix-cross-device-webrtc-voice-call/2026-10-11-fix-cross-device-webrtc-voice-call-actual-status.md`

## Benchmark Rules

- Ghi lại các số liệu đo lường cụ thể, không đưa nhật ký lệnh hoặc kết luận phỏng đoán.
- Cập nhật số liệu sau từng phase/slice hoàn thành.

## B0 - P0 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P0 | STUN servers count | server | 1 | 4 | 4 | >= 3 | +3 | `E1-P1B-STUN1` |
| P0 | Recorded audio channels captured in MP3 | channel | 1 (hoặc 0 do null) | 2 | 2 | 2 | +1 | `E2-P2B-REC1` |
| P0 | Inter-unit call delivery success | % | 0% | 100% | 100% | 100% | +100% | `E1-P1A-SRV1` |
| P0 | Visual audio level indicators | indicators | 0 (chỉ 1 sóng chung) | 2 | 2 | 2 (Local + Remote) | +2 | `E3-P3A-VU1` |

## B1 - P1 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P1 | Inter-unit call delivery success | % | 0% | 100% | 100% | 100% | +100% | `E1-P1A-SRV1` |
| P1 | STUN servers count | server | 1 | 4 | 4 | 4 | +3 | `E1-P1B-STUN1` |

## B2 - P2 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P2 | Recorded audio channels captured in MP3 | channel | 0-1 | 2 | 2 | 2 (cả local và remote) | +1 | `E2-P2B-REC1` |
| P2 | Microphone toggle responsiveness | state | Bị đơ khi chưa ghi âm | Bật/Tắt tức thời | Đạt | Bật/tắt tức thời | Đạt | `E2-P2B-MIC1` |

## B3 - P3 Benchmarks

| Phase | Metric | Unit | Baseline | Latest | Final | Target | Delta | Evidence |
|-------|--------|------|----------|--------|-------|--------|-------|----------|
| P3 | Citizen Audio RMS Level | level | 0 (câm tiếng) | 49.22 | 49.22 | > 0 | +49.22 | `E3-P3B-PW1` |
| P3 | Dispatcher Audio RMS Level | level | 0 (câm tiếng) | 44.95 | 44.95 | > 0 | +44.95 | `E3-P3B-PW1` |
| P3 | WebRTC ICE Handshake Success | % | Hay timeout/failed | 100% | 100% | 100% | +100% | `E3-P3B-PW1` |
| P3 | 2-Way MP3 Recording Output Size | bytes | 0 (hỏng) | 48,065 | 48,065 | > 10,000 | +48,065 | `E3-P3B-PW1` |

## Non-Benchmarkable Notes

Các chỉ số trải nghiệm người dùng như độ rõ của giọng nói và cảm giác không bị dội âm (feedback loop) được triệt tiêu hoàn toàn nhờ tầng cách ly `muteGain` (gain = 0.0) và thẩm định qua kiểm thử Playwright tự động.
