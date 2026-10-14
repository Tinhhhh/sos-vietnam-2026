# Actual Status: Fix Scope to 34 Provinces and 2-Tier Command Hierarchy

Title: Fix Operational Scope to 34 Provinces and 2-Tier Command Hierarchy (Ward & Province)
Date: 2026-10-14
Status: Completed
Companion plan: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/plan.md`
Companion evidence: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/evidence.md`
Companion benchmark: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/benchmark.md`

## Audit Matrix

| ID | Document Group | Current Imprecise Text | Corrected Target Reality | Affected Scripts |
|---|---|---|---|---|
| M1 | `01_DE_XUAT_GIAI_PHAP` | "3.717 đồn công an cơ sở toàn quốc (phủ kín 100% xã/phường trên toàn quốc)", "6 vai trò tác chiến" | 3.717 đồn công an cơ sở trong phạm vi 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập); Mô hình chỉ huy tinh gọn 2 cấp địa phương: Cấp Xã/Phường & Cấp Tỉnh/TP | `scripts/build_proposal_under10p.py`, `scripts/update_master_nckh_docx.py` |
| M2 | `02_THUYET_TRINH_10_PHUT` | "bao phủ 34 tỉnh thành... phủ kín 100% xã/phường trên toàn quốc", phân cấp mập mờ | Dữ liệu thực tế 34 tỉnh/thành phố sáp nhập, 3.321 xã/phường, 3.717 đồn CA cơ sở; Điều phối tinh gọn 2 cấp: Cấp Xã/Phường (5 phút vàng) và Cấp Tỉnh/TP (chuyển cấp 15 phút, chi viện đa lực lượng) | `scripts/generate_presentation_8_criteria.py`, `scripts/update_video_script.py`, `scripts/update_10min_pptx.py`, `scripts/update_html_slides.py` |
| M3 | `03_PHAN_BIEN_5_PHUT_BGK` | "toàn quốc" chưa phân định rõ với phạm vi 34 tỉnh sáp nhập | Khẳng định rõ ràng: Hệ thống hiện hữu (TRL 7 - 80%) vận hành trên 34 tỉnh/thành phố sáp nhập với 2 cấp chỉ huy; mở rộng 63 tỉnh/thành thuộc lộ trình tương lai | `scripts/update_qa_docx.py` |
| M4 | `05_TAI_LIEU_VAN_HANH` | Hướng dẫn vận hành cần nêu rõ 2 cấp chỉ huy (Cấp Xã/Phường & Cấp Tỉnh/TP) | Chuẩn hóa quy trình vận hành trực ban 2 cấp: Trực ban Xã/Phường và Trực ban Tỉnh/TP | `scripts/update_manuals_docx.py` |
| M5 | Root Readme | Tổng quan hồ sơ ghi "toàn quốc" gây hiểu nhầm 63 tỉnh thành | Chuẩn hóa phạm vi 34 tỉnh thành và mô hình điều phối 2 cấp | `scripts/update_readme_package.py` |

## Status Refresh Log

| Timestamp | Phase | Trigger | Changed Rows | Summary of Repo Reality | Next Action |
|---|---|---|---|---|---|
| 2026-10-14 07:15 | P0 | User feedback | All M1..M5 | Identified scope confusion between 34 provinces vs national and clarified 2-tier command hierarchy | Update generator scripts in P1 |
| 2026-10-14 07:26 | P1 | Script updates | All M1..M5 | Successfully updated all 9 generator scripts in `scripts/` with 34 provinces scope and 2-tier local command hierarchy (Cấp Xã/Phường & Cấp Tỉnh/TP) | Execute document regeneration in P2 |
| 2026-10-14 07:29 | P2 | Doc generation | All 24 files | Regenerated all DOCX, PDF, PPTX, HTML, and MD documents across Data4Life and synced to mirror directory `docs/thuyết trình` | Verify document text and audit file inventory |
| 2026-10-14 07:31 | P3 | Verification | All 24 files | Verified 100% text correctness: 34 provinces scope, 3.321 wards, 3.717 stations, 2-tier local hierarchy (Xã/Phường & Tỉnh/TP), no district middleware, all files > 0 bytes with fresh timestamps | Update ledgers & commit to Git |
