# Plan: Synchronize Data4Life Dossier Documents with Latest System Upgrades

Title: Synchronize Data4Life Dossier Documents with Latest System Upgrades
Date: 2026-10-13
Status: Completed
Companion actual-status: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-actual-status.md`
Companion evidence: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-evidence.md`
Companion benchmark: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-benchmark.md`

---

## 1. Goal

Update and synchronize all documents (Word `.docx`, PDF `.pdf`, PowerPoint `.pptx`, HTML slides, and Markdown `.md`) in `C:\Users\dienv\Desktop\Data4Life` to reflect the latest engineering upgrades:
1. **Nationwide Police Stations Directory Upgrade**: From 874 stations to **3,717 grassroots police stations and emergency units**, achieving 100% commune/ward coverage across all 3,321 communes/wards of Vietnam post-merger.
2. **Network Transmission Optimization & Gzip Compression**: HTTP Gzip compression enabled for stations directory API, reducing payload by 94.4% (from 2.95 MB down to 166 KB) with <50ms load times on low-bandwidth mobile networks.
3. **Hardware GPS Vehicle Tracking & Real-Time Breadcrumb Trail**: Replaced mock simulation with real hardware GPS (`navigator.geolocation.watchPosition` high accuracy, throttled 5s / >10m, 20s auto-fallback to simulation). Dynamic cyan dashed line `#38bdf8` movement trail streamed via SSE `vehicle_pos` to citizen map.
4. **WebRTC Video SOS Resilience (TURN Relay & SSE Keep-Alive)**: Dual TURN relay integration bypassing symmetric NAT/firewalls for reliable P2P video calls on mobile 4G/5G, plus 25s SSE ping keep-alive preventing reverse proxy disconnects.
5. **Zero-Trust Security & Clean Architecture**: Elimination of duplicate backend routes, enforced signed session tokens (HMAC-SHA256), and mobile responsive tap targets (>=36px).

---

## 2. Rules & Constraints

1. Keep temporary files strictly inside `.tmp/` within the working repository. Never create temp files directly on `C:\`.
2. Maintain documentation integrity and decree standards (Nghị định 30/2020/NĐ-CP for administrative doc format, 100% Times New Roman).
3. Update generation scripts in `scripts/`, then execute them to re-generate DOCX, PDF, PPTX, HTML, and MD files so all formats remain in 100% lockstep.
4. Verify all exported files exist, have non-zero size, and match new statistics.

---

## 3. Scope & Target Folders

`C:\Users\dienv\Desktop\Data4Life`:
- **Root**: `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.docx`, `.pdf`, `.md`
- **`01_DE_XUAT_GIAI_PHAP`**:
  - `DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx`, `.pdf`
  - `SOS_VIETNAM_2026.docx`, `.pdf`
- **`02_THUYET_TRINH_10_PHUT`**:
  - `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx`, `.pdf`
  - `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx`, `.pdf`
  - `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx`, `.pdf`
  - `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html`, `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx`, `.pdf`
- **`03_PHAN_BIEN_5_PHUT_BGK`**:
  - `BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx`, `.pdf`
- **`05_TAI_LIEU_VAN_HANH_HUONG_DAN`**:
  - `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx`, `.pdf`
  - `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx`, `.pdf`
  - `Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx`, `.pdf`

---

## 4. Phase Checklist

### P0: Baseline Audit & Script Mapping
- [x] **P0-A**: Inspect all existing scripts in `scripts/` and map them to the corresponding target documents in `C:\Users\dienv\Desktop\Data4Life`. Record baseline stats in `actual-status.md`.
  - *Goal*: Establish complete mapping of generator scripts to output artifacts.
  - *Work Steps*: Audit each script and record matrix.
  - *Implementation Gate*: All 9 target document groups identified.
  - *Acceptance*: Baseline recorded in `actual-status.md`.

### P1: Update Document Generator Scripts
- [x] **P1-A**: Update Proposal scripts (`build_proposal_under10p.py`, `update_master_nckh_docx.py`) with 3,717 stations, gzip compression (94.4%), real GPS tracking & trail, TURN relay, and SSE keep-alive.
- [x] **P1-B**: Update Presentation & Slide scripts (`generate_presentation_8_criteria.py`, `update_video_script.py`, `update_10min_pptx.py`, `update_html_slides.py`).
- [x] **P1-C**: Update Q&A and Manual scripts (`update_qa_docx.py`, `update_manuals_docx.py`).
- [x] **P1-D**: Update Master Readme script (`update_readme_package.py`).
  - *Goal*: Align all text, metrics, and architecture descriptions across all generator scripts.
  - *Implementation Gate*: Python syntax checks pass on all updated scripts.
  - *Acceptance*: All scripts ready for execution.

### P2: Execute Document Generation & Export PDFs
- [x] **P2-A**: Run each generator script to update DOCX, PPTX, HTML, MD, and export to PDF via Word/PowerPoint COM.
  - *Goal*: Re-generate all documents with latest synchronized text and export fresh PDFs.
  - *Work Steps*: Execute scripts sequentially and verify output files.
  - *Implementation Gate*: All DOCX, PDF, PPTX files created successfully with recent timestamp.
  - *Acceptance*: All files verified non-empty (24/24 files).

### P3: Verification, Ledgers Update, & Git Commit
- [x] **P3-A**: Verify all files in `C:\Users\dienv\Desktop\Data4Life` have been updated and synchronized.
- [x] **P3-B**: Update plan ledgers (`actual-status.md`, `evidence.md`, `benchmark.md`, `plan.md`).
- [x] **P3-C**: Commit updated scripts in `sos_vietnam_2026_web_hosting` and push to remote.
  - *Goal*: Ensure clean repo and completed task delivery.
