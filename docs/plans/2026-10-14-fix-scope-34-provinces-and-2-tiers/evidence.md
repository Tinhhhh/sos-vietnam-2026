# Evidence: Fix Scope to 34 Provinces and 2-Tier Command Hierarchy

Title: Fix Operational Scope to 34 Provinces and 2-Tier Command Hierarchy (Ward & Province)
Date: 2026-10-14
Companion plan: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/plan.md`
Companion actual-status: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/actual-status.md`
Companion benchmark: `docs/plans/2026-10-14-fix-scope-34-provinces-and-2-tiers/benchmark.md`

## E0: Baseline Audit

- **E0-P0A-USER-CORRECTION**: The user identified that:
  1. The current system scope is **34 tỉnh thành** (not the whole country of 63 provinces, which is the future roadmap). The database contains 34 provinces/cities, 3,321 merged communes/wards, and 3,717 local police stations.
  2. The local command and dispatch hierarchy has **2 cấp: Cấp Xã/Phường và Cấp Tỉnh/Thành phố**. There is no intermediate district level, ensuring direct communication within the 5 golden minutes and timeout escalation after 15 minutes from Ward to Province.

## E1: Script Corrections
- **E1-SCRIPTS-UPDATED**: Updated all 9 generator scripts:
  1. `scripts/build_proposal_under10p.py`: Section III.2 updated with explicit 2-tier local hierarchy (Cấp Xã/Phường & Cấp Tỉnh/TP) and 34 provinces scope.
  2. `scripts/update_master_nckh_docx.py`: Standardized terminology map replaced "toàn quốc" with "trên phạm vi 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)".
  3. `scripts/update_video_script.py`: Spoken script updated with 34 provinces and 2-tier local command hierarchy.
  4. `scripts/generate_presentation_8_criteria.py`: Slide 3, Slide 4, Slide 7, Slide 9, Slide 10 and DOCX text updated with 34 provinces, 2-tier hierarchy, and 63 provinces explicitly labeled as future R&D roadmap.
  5. `scripts/update_10min_pptx.py`: Slide 6 and Slide 9 updated to 34 provinces, 2-tier local hierarchy, and fixed broken "80% (TRL 7 - LIVE PROTOTYPE) Times New Roman" -> "100% Times New Roman".
  6. `scripts/update_html_slides.py`: HTML presentation updated with 34 provinces and 2-tier local hierarchy.
  7. `scripts/update_qa_docx.py`: Q&A table 3 and table 9 updated with 34 provinces, 3.321 wards, 3.717 stations, and 2-tier local command hierarchy.
  8. `scripts/update_manuals_docx.py`: Officer guide, citizen guide, and overview doc updated with 34 provinces and 2-tier local hierarchy.
  9. `scripts/update_readme_package.py`: Root package README (DOCX, PDF, MD) updated with 34 provinces and 2-tier local command hierarchy.

## E2: Generation & Export Evidence
- **E2-EXECUTION-LOG**: All 9 scripts ran cleanly to completion with exit code 0.
- **E2-COM-PDF-EXPORT**: Fresh PDFs exported via Word and PowerPoint COM automation for all updated documents.
- **E2-MIRROR-SYNC**: All generated documents synced to mirror folder `C:\Users\dienv\Desktop\docs\thuyết trình\`.

## E3: Text & File Verification Evidence
- **E3-FILE-INVENTORY**: All 24 target files verified with non-zero sizes (> 40 KB for docx/pptx, > 250 KB for pdf) and fresh timestamp `2026-10-14 07:26..07:31`.
- **E3-KEYWORD-AUDIT**: Programmatic text checks across DOCX, PPTX, and HTML confirmed:
  - Scope: "34 tỉnh/thành phố" (3.321 xã/phường sau sáp nhập, 3.717 đồn công an cơ sở).
  - Hierarchy: "2 cấp chính quyền địa phương: Cấp Xã/Phường và Cấp Tỉnh/Thành phố", không qua quận/huyện.
  - Future Roadmap: 63 tỉnh/thành strictly described as R&D expansion direction.
