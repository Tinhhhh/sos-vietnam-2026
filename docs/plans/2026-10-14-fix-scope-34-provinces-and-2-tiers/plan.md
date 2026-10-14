# Plan: Fix Operational Scope to 34 Provinces and 2-Tier Command Hierarchy (Ward & Province)

Title: Fix Operational Scope to 34 Provinces and 2-Tier Command Hierarchy (Ward & Province)
Date: 2026-10-14
Status: Completed
Companion actual-status: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/actual-status.md`
Companion evidence: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/evidence.md`
Companion benchmark: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/benchmark.md`

---

## 1. Goal & User Directives

Address the user's specific feedback across `C:\Users\dienv\Desktop\Data4Life\01_DE_XUAT_GIAI_PHAP` and `C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT`:
1. **Phạm vi Địa giới Chính xác**: Khẳng định chuẩn xác phạm vi dữ liệu hiện tại của hệ thống là **34 tỉnh/thành phố** (các tỉnh thành trọng điểm thực hiện sắp xếp, sáp nhập đơn vị hành chính theo Nghị quyết của UBTV Quốc hội & CSDL bando.com.vn), bao gồm **3.321 xã/phường** sau sáp nhập và mạng lưới **3.717 đồn công an cơ sở / trạm tác chiến**. Tuyệt đối loại bỏ cách diễn đạt nhầm lẫn "toàn quốc" khiến người nghe lầm tưởng hệ thống hiện đã bao phủ trọn vẹn 63 tỉnh thành (63 tỉnh thành là định hướng mở rộng toàn quốc trong giai đoạn R&D tương lai).
2. **Mô hình Phân cấp Chỉ huy Tinh gọn 2 Cấp**: Chuẩn hóa mô hình điều phối chỉ huy tác chiến gồm **2 cấp địa phương: Cấp Xã/Phường và Cấp Tỉnh/Thành phố**:
   - **Cấp Xã/Phường (Cấp cơ sở)**: Đồn Công an xã/phường, trạm y tế cơ sở tiếp nhận và phản ứng trực tiếp tại hiện trường trong "5 phút vàng".
   - **Cấp Tỉnh/Thành phố (Cấp điều phối chiến dịch & chi viện)**: Trung tâm Chỉ huy Công an Tỉnh/TP, Phòng CSGT, Phòng Cảnh sát PCCC & CNCH, Trung tâm Cấp cứu 115 tiếp nhận sự vụ chuyển cấp tự động sau 15 phút (Timeout Escalation) hoặc điều phối lực lượng chuyên dụng chi viện liên xã/phường.
   - Loại bỏ các cấp trung gian (không qua quận/huyện) để rút ngắn tối đa thời gian cứu nạn.

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the working repository. Never create temp files directly on `C:\`.
2. Maintain documentation integrity and administrative decree standards (Nghị định 30/2020/NĐ-CP, 100% Times New Roman, dynamic document numbering, no `CATT`).
3. Update generation scripts in `scripts/`, then re-generate all documents (`.docx`, `.pdf`, `.pptx`, `.html`, `.md`) to maintain 100% lockstep consistency across `C:\Users\dienv\Desktop\Data4Life` and mirror directory `C:\Users\dienv\Desktop\docs\thuyết trình`.
4. Verify all exported files exist, have non-zero size, and match the new accurate wording.

---

## 3. Scope & Target Files

### Group 1: `01_DE_XUAT_GIAI_PHAP`
- `scripts/build_proposal_under10p.py` -> `DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx` & `.pdf`
- `scripts/update_master_nckh_docx.py` -> `SOS_VIETNAM_2026.docx` & `.pdf`

### Group 2: `02_THUYET_TRINH_10_PHUT`
- `scripts/generate_presentation_8_criteria.py` -> `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx` & `.pdf`, `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx` & `.pdf`
- `scripts/update_video_script.py` -> `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx` & `.pdf`
- `scripts/update_10min_pptx.py` -> `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx` & `.pdf`
- `scripts/update_html_slides.py` -> `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html`

### Group 3: `03_PHAN_BIEN_5_PHUT_BGK`, `05_TAI_LIEU_VAN_HANH_HUONG_DAN`, & Root Readme
- `scripts/update_qa_docx.py` -> `03_PHAN_BIEN_5_PHUT_BGK/BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx` & `.pdf`
- `scripts/update_manuals_docx.py` -> `05_TAI_LIEU_VAN_HANH_HUONG_DAN/` (3 manuals & PDFs)
- `scripts/update_readme_package.py` -> Root `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.docx`, `.pdf`, `.md`

---

## 4. Phase Checklist

### P0: Audit & Exact Keyword Inventory
- [x] **P0-A**: Audit all generator scripts for occurrences of "toàn quốc", "6 cấp", "6 tầng", "quận/huyện" to identify exact lines needing correction to "34 tỉnh thành" and "2 cấp: Xã/Phường và Tỉnh/Thành phố".
  - *Goal*: Map every occurrence of imprecise wording.
  - *Acceptance*: Complete matrix recorded in `actual-status.md`.

### P1: Correct Generator Scripts
- [x] **P1-A**: Update `scripts/build_proposal_under10p.py` and `scripts/update_master_nckh_docx.py` with 34 provinces scope and 2-tier command hierarchy (Cấp Xã/Phường & Cấp Tỉnh/TP).
- [x] **P1-B**: Update `scripts/update_video_script.py`, `scripts/generate_presentation_8_criteria.py`, `scripts/update_10min_pptx.py`, and `scripts/update_html_slides.py` with accurate 34 provinces & 2-tier command narrative.
- [x] **P1-C**: Update `scripts/update_qa_docx.py`, `scripts/update_manuals_docx.py`, and `scripts/update_readme_package.py`.
  - *Goal*: All scripts reflect 34 provinces and 2-tier local command hierarchy.
  - *Implementation Gate*: Syntax validation passes on all scripts.

### P2: Execute Document Generation & COM PDF Export
- [x] **P2-A**: Execute all updated generator scripts to produce synchronized DOCX, PDF, PPTX, HTML, and MD files.
  - *Goal*: Regenerate all documents and export fresh PDFs via Word / PowerPoint COM.
  - *Acceptance*: All 24 files exist with fresh timestamps and non-zero sizes.

### P3: Verification, Ledgers Update, & Git Commit
- [x] **P3-A**: Verify target files in `C:\Users\dienv\Desktop\Data4Life` contain the corrected 34 provinces & 2-tier command text.
- [x] **P3-B**: Update plan ledgers (`actual-status.md`, `evidence.md`, `benchmark.md`, `plan.md`).
- [x] **P3-C**: Commit changes to Git and push to remote.
