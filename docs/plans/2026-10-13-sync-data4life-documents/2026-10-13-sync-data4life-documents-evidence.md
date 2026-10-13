# Synchronize Data4Life Dossier Documents Evidence Ledger

Title: Synchronize Data4Life Dossier Documents with Latest System Upgrades
Date: 2026-10-13
Companion plan: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-plan.md`
Companion actual-status: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-actual-status.md`
Companion benchmark: `docs/plans/2026-10-13-sync-data4life-documents/2026-10-13-sync-data4life-documents-benchmark.md`

---

## E0: Baseline Facts & Script Mapping

- **E0-P0A-AUDIT**: Mapped 9 generator scripts in `scripts/` to their target documents in `C:\Users\dienv\Desktop\Data4Life`:
  1. `scripts/build_proposal_under10p.py` -> `01_DE_XUAT_GIAI_PHAP/DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx` & `.pdf`
  2. `scripts/update_master_nckh_docx.py` -> `01_DE_XUAT_GIAI_PHAP/SOS_VIETNAM_2026.docx` & `.pdf`
  3. `scripts/generate_presentation_8_criteria.py` -> `02_THUYET_TRINH_10_PHUT/BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx` & `.pdf`, `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx` & `.pdf`
  4. `scripts/update_video_script.py` -> `02_THUYET_TRINH_10_PHUT/KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx` & `.pdf`
  5. `scripts/update_10min_pptx.py` -> `02_THUYET_TRINH_10_PHUT/SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx` & `.pdf`
  6. `scripts/update_html_slides.py` -> `02_THUYET_TRINH_10_PHUT/SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html`
  7. `scripts/update_qa_docx.py` -> `03_PHAN_BIEN_5_PHUT_BGK/BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx` & `.pdf`
  8. `scripts/update_manuals_docx.py` -> `05_TAI_LIEU_VAN_HANH_HUONG_DAN/` (3 manuals DOCX & PDFs)
  9. `scripts/update_readme_package.py` -> Root `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.docx` & `.pdf` & `.md`

---

## E1: Script Updates Evidence

- **E1-P1A-PROPOSAL**: Updated `scripts/build_proposal_under10p.py` and `scripts/update_master_nckh_docx.py` with 3,717 police stations / emergency units, 100% commune/ward coverage (3,321 / 3,321 wards), Gzip compression (166 KB vs 2.95 MB, 94.4% reduction), real hardware GPS tracking (`navigator.geolocation.watchPosition`, 5s throttle / >10m), cyan dashed breadcrumb trail `#38bdf8`, and dual WebRTC TURN relay.
- **E1-P1B-PRESENTATION**: Updated `scripts/generate_presentation_8_criteria.py`, `scripts/update_video_script.py`, `scripts/update_10min_pptx.py`, and `scripts/update_html_slides.py` with synchronized metrics, spoken scripts, slide content, and automated Word / PowerPoint COM PDF export.
- **E1-P1C-QA-MANUALS**: Updated `scripts/update_qa_docx.py` and `scripts/update_manuals_docx.py` for citizen manual (GPS tracking of rescue vehicle with cyan breadcrumb trail), officer manual (real GPS tracking & TURN relay), and overview manual.
- **E1-P1D-README**: Updated `scripts/update_readme_package.py` with full package directory map, 3,717 stations, Gzip, GPS tracking, generating DOCX, PDF, and Markdown.

---

## E2: Generation & PDF Export Output Verification

All files verified on disk in `C:\Users\dienv\Desktop\Data4Life\`:

| Directory | File Name | Size (Bytes) | Generated / Synced |
|---|---|---|---|
| `01_DE_XUAT_GIAI_PHAP` | `DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx` | 50,481 | PASS (11:23 PM) |
| `01_DE_XUAT_GIAI_PHAP` | `DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.pdf` | 528,005 | PASS (11:23 PM) |
| `01_DE_XUAT_GIAI_PHAP` | `SOS_VIETNAM_2026.docx` | 21,527,831 | PASS (11:24 PM) |
| `01_DE_XUAT_GIAI_PHAP` | `SOS_VIETNAM_2026.pdf` | 10,327,783 | PASS (11:24 PM) |
| `02_THUYET_TRINH_10_PHUT` | `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx` | 42,479 | PASS (11:26 PM) |
| `02_THUYET_TRINH_10_PHUT` | `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.pdf` | 4,331,248 | PASS (11:26 PM) |
| `02_THUYET_TRINH_10_PHUT` | `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx` | 50,337 | PASS (11:33 PM) |
| `02_THUYET_TRINH_10_PHUT` | `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pdf` | 397,486 | PASS (11:27 PM) |
| `02_THUYET_TRINH_10_PHUT` | `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html` | 69,785 | PASS (11:27 PM) |
| `02_THUYET_TRINH_10_PHUT` | `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx` | 73,205 | PASS (11:33 PM) |
| `02_THUYET_TRINH_10_PHUT` | `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pdf` | 271,043 | PASS (11:33 PM) |
| `02_THUYET_TRINH_10_PHUT` | `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx` | 42,346 | PASS (11:33 PM) |
| `02_THUYET_TRINH_10_PHUT` | `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pdf` | 270,741 | PASS (11:33 PM) |
| `03_PHAN_BIEN_5_PHUT_BGK` | `BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx` | 42,029 | PASS (11:28 PM) |
| `03_PHAN_BIEN_5_PHUT_BGK` | `BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.pdf` | 4,435,446 | PASS (11:28 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx` | 6,176,731 | PASS (11:29 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.pdf` | 2,538,782 | PASS (11:29 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx` | 2,555,911 | PASS (11:29 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.pdf` | 1,429,557 | PASS (11:29 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx` | 419,937 | PASS (11:29 PM) |
| `05_TAI_LIEU_VAN_HANH_HUONG_DAN` | `Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.pdf` | 4,508,070 | PASS (11:29 PM) |
| Root | `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.docx` | 40,706 | PASS (11:34 PM) |
| Root | `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.pdf` | 4,203,312 | PASS (11:34 PM) |
| Root | `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.md` | 8,491 | PASS (11:34 PM) |

Total documents synchronized: **24/24** files across all target directories.
Also synced to mirror directory: `C:\Users\dienv\Desktop\docs\thuyết trình\`.
