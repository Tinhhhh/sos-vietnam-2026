# Synchronize Data4Life Desktop Package Plan

## Metadata

- Date: `2026-10-12`
- Status: `completed`
- Plan: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-plan.md`
- Evidence: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-evidence.md`
- Benchmark: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-benchmark.md`
- Actual status: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-actual-status.md`

## Goal

To comprehensively synchronize and update all documents and presentation assets in `C:\Users\dienv\Desktop\Data4Life` to fully match the latest verified system reality of SOS Vietnam 2026:
1. **Administrative Standards & Decree 30/2020/NĐ-CP**: 100% Times New Roman, dynamic document numbering (`.../BC-TTCH` for National Command Center under BỘ CÔNG AN, `.../BC-CATP [TÊN ĐỊA PHƯƠNG]`, `.../BC-CAT [TÊN TỈNH]`, `.../BC-CSGT [TÊN ĐỊA PHƯƠNG]`, `.../BC-PCCC [TÊN ĐỊA PHƯƠNG]`, `.../BC-BYT` for Health/115, `.../BC-CAP [TÊN PHƯỜNG]`, `.../BC-CAX [TÊN XÃ]`), and **strict complete removal of obsolete CATT (Công an Thị trấn)**.
2. **Administrative Geography & Station Scale**: 34 merged provinces/cities, 3,321 wards/communes, and **874 verified emergency stations/agencies** across Vietnam (including 417 official stations in Hanoi and 105 stations in Can Tho).
3. **Four Regional AI Voice Prompts (VieNeu-TTS)**: 4 distinct female regional voices (Mỹ Duyên - Tây Nam Bộ, Thùy Dung - Miền Nam, Ngọc Trân - Miền Trung, Mai Anh - Miền Bắc) accelerated at 1.2x natural cadence, dynamically dispatched by province.
4. **Tactical Command Center & Real-time WebRTC**: Direct 2-way WebRTC Video Call between citizens and dispatchers with centered SOS Orb on video ripple waves, 5 force tactical glassmorphism themes, and immutable electronic incident logs.
5. **Data for Life 2026 Dossier Alignment**:
   - `01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx`: Master scientific thesis updated with exact text, metrics, legal formulas, and verified terminology.
   - `01_DE_XUAT_GIAI_PHAP\DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx`: Formal 7-page proposal aligned with 8 criteria.
   - `02_THUYET_TRINH_10_PHUT\`: 10-minute presentation speech script (`KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx`), 8-criteria defense document (`BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx`), and presentation decks (`.pptx`, `.html`).
   - `03_PHAN_BIEN_5_PHUT_BGK\BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx`: Updated Q&A responses for jury.
   - `05_TAI_LIEU_VAN_HANH_HUONG_DAN\`: Officer and citizen operation manuals updated.
   - `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.md` / `.docx`: Inventory summary updated.

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- Preserve document formatting and existing research depth in DOCX files; do not truncate or corrupt embedded images or tables.
- All administrative terms must conform to official Vietnamese state formats and user instructions.

## Scope

Target files in `C:\Users\dienv\Desktop\Data4Life`:
- `01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx`
- `01_DE_XUAT_GIAI_PHAP\DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx`
- `02_THUYET_TRINH_10_PHUT\KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx`
- `02_THUYET_TRINH_10_PHUT\BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx`
- `02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx`
- `02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx`
- `02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html`
- `03_PHAN_BIEN_5_PHUT_BGK\BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx`
- `05_TAI_LIEU_VAN_HANH_HUONG_DAN\HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx`
- `05_TAI_LIEU_VAN_HANH_HUONG_DAN\HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx`
- `05_TAI_LIEU_VAN_HANH_HUONG_DAN\Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx`
- `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.md` and `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.docx`

## Non-Goals

- Refactoring the core server code in `c:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting` (already completed and verified in previous commits).
- Changing competition rules or evaluation criteria of Data for Life 2026.

## Requirements

1. **R1**: `SOS_VIETNAM_2026.docx` must contain all recent improvements:
   - Administrative naming: National level is "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA".
   - Official document numbering formulas: `/BC-TTCH`, `/BC-CATP [TÊN ĐỊA PHƯƠNG]`, `/BC-CAT [TÊN TỈNH]`, `/BC-CSGT [TÊN ĐỊA PHƯƠNG]`, `/BC-PCCC [TÊN ĐỊA PHƯƠNG]`, `/BC-BYT`, `/BC-CAP [TÊN PHƯỜNG]`, `/BC-CAX [TÊN XÃ]`.
   - Complete removal of CATT / Thị trấn.
   - 874 verified stations across 34 provinces/cities, 3,321 wards/communes.
   - 4 regional voices (Mỹ Duyên, Thùy Dung, Ngọc Trân, Mai Anh) with 1.2x speed.
   - Tactical Liquid Glassmorphism, WebRTC 2-way video call, centered SOS Orb.
   - Decree 30/2020/NĐ-CP Times New Roman format compliance.
2. **R2**: `DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx` regenerated and synchronized with latest metrics and standards.
3. **R3**: `02_THUYET_TRINH_10_PHUT` presentation scripts and slides updated with latest 874 stations count, 4 regional voices, WebRTC video call, and Decree 30 document formulas.
4. **R4**: `03_PHAN_BIEN_5_PHUT_BGK`, `05_TAI_LIEU_VAN_HANH_HUONG_DAN`, and README synchronized.

## Checklist

- [x] P0-A: Complete actual status baseline before implementation work.
  - Goal: inspect and catalog all files in `Data4Life`, classify current alignment state.
  - Work Steps: check paragraphs, terms, metrics in all target docx and pptx files.
  - Implementation Gate: all targets classified with evidence IDs in `actual-status.md`.
  - Acceptance: actual status matrix is 100% complete.

- [x] P1-A: Update Master Research Thesis `01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx`.
  - Goal: thoroughly update `SOS_VIETNAM_2026.docx` to adhere strictly to latest reality.
  - Work Steps:
    1. Parse and update sections mentioning document numbering formulas, replacing any outdated CATB/CATT with standardized Decree 30 formulas (`/BC-TTCH`, `/BC-CATP`, `/BC-CAT`, `/BC-CSGT`, `/BC-PCCC`, `/BC-BYT`, `/BC-CAP`, `/BC-CAX`).
    2. Remove all references to "Thị trấn" / `/BC-CATT`.
    3. Update agency header to "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA".
    4. Update directory counts: 874 verified stations, 34 provinces, 3,321 wards/communes.
    5. Update audio prompt section: 4 regional AI voices (Mỹ Duyên, Thùy Dung, Ngọc Trân, Mai Anh) with 1.2x speed.
    6. Update UI architecture: Tactical Liquid Glassmorphism, 2-way WebRTC Video Call, centered SOS Orb.
    7. Save document cleanly without corrupting media or tables.
  - Implementation Gate: Python script modifies and verifies the document successfully.
  - Acceptance: Document opens cleanly, contains updated sections, 0 outdated CATT references.

- [x] P1-B: Update Formal Proposal `01_DE_XUAT_GIAI_PHAP\DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx`.
  - Goal: regenerate and update the 7-page proposal document using `build_proposal_under10p.py`.
  - Work Steps:
    1. Update `build_proposal_under10p.py` with 874 verified stations, 4 regional voices, Decree 30 dynamic document numbering formulas, WebRTC video call.
    2. Run generator script to produce updated docx.
    3. Validate output page count and formatting.
  - Implementation Gate: generator script runs with code 0.
  - Acceptance: Document is updated in `C:\Users\dienv\Desktop\Data4Life\01_DE_XUAT_GIAI_PHAP\DE_XUAT_GIAI_PHAP_SOS_VIET_NAM_2026_DATA_FOR_LIFE.docx`.

- [x] P2-A: Update 10-Minute Presentation Script & 8-Criteria Defense in `02_THUYET_TRINH_10_PHUT`.
  - Goal: synchronize `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx` and `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx`.
  - Work Steps:
    1. Update `scripts/update_video_script.py` with 874 stations, 4 regional voices, WebRTC video call, Decree 30 formulas. Run it to update `KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx`.
    2. Update `scripts/generate_presentation_8_criteria.py` with latest metrics and standards. Run it to update `BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx` and `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx`.
  - Implementation Gate: generator scripts execute without errors.
  - Acceptance: Both docx files and pptx in `02_THUYET_TRINH_10_PHUT` reflect 874 stations, 4 regional voices, and Decree 30 standards.

- [x] P2-B: Update Presentation Slides in `02_THUYET_TRINH_10_PHUT`.
  - Goal: synchronize `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx` and `SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html`.
  - Work Steps:
    1. Update slide content in `SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx` to match 874 stations, 4 regional voices, and WebRTC video.
    2. Re-render HTML slide deck if applicable.
  - Implementation Gate: slide decks saved and validated.
  - Acceptance: Slides are fully aligned with 10-minute speech script.

- [x] P3-A: Update Q&A 5-Minute Defense in `03_PHAN_BIEN_5_PHUT_BGK`.
  - Goal: update `BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx`.
  - Work Steps:
    1. Check and update answers on station directory (874 stations), geofencing, regional voices, Decree 30 document numbering.
    2. Save updated DOCX file.
  - Implementation Gate: file updated and validated.
  - Acceptance: Q&A answers accurately defend all new architecture features.

- [x] P3-B: Update User Manuals in `05_TAI_LIEU_VAN_HANH_HUONG_DAN`.
  - Goal: synchronize officer and citizen guides.
  - Work Steps:
    1. Update `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx` with latest UI features (WebRTC video call, Decree 30 print/PDF export, dynamic document numbering, no CATT).
    2. Update `HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx` with latest SOS Orb center, 4 regional voice prompts, WebRTC video.
  - Implementation Gate: files updated and verified.
  - Acceptance: Both manuals reflect current UI screenshots and features.

- [x] P3-C: Update Overview README and Synchronize Package Ledger.
  - Goal: update `README_TONG_QUAN_BO_HO_SO_DATA4LIFE_2026.md` and `.docx`.
  - Work Steps:
    1. Update metrics (874 stations, 34 provinces, 3,321 wards/communes, 4 regional voices, Decree 30 standards).
    2. Save MD and generate DOCX.
  - Implementation Gate: README files updated.
  - Acceptance: Package overview matches the complete updated file tree.
