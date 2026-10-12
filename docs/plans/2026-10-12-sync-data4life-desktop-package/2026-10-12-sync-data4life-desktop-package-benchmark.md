# Synchronize Data4Life Desktop Package Benchmark Ledger

## Metadata

- Date: `2026-10-12`
- Plan: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-plan.md`
- Evidence: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-evidence.md`
- Benchmark: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-benchmark.md`
- Actual status: `docs/plans/2026-10-12-sync-data4life-desktop-package/2026-10-12-sync-data4life-desktop-package-actual-status.md`

## Benchmark Metrics

| Metric Name | Baseline (Pre-sync) | Target Value | Achieved Value (Post-sync) | Status | Verification Method |
| --- | --- | --- | --- | --- | --- |
| Verified Emergency Stations Count | 453 (outdated) | 874 verified facilities | 874 verified facilities (417 Hanoi, 105 Can Tho) | PASSED | Full-text inspection in DOCX/PPTX/BE JSON |
| Covered Merged Administrative Units | 34 provinces, 3,321 wards | 34 provinces, 3,321 wards | 34 provinces, 3,321 wards | PASSED | Full-text inspection |
| Regional Voice Prompts Diversity | 1 voice / unstated | 4 regional female voices (1.2x) | 4 female voices (Mỹ Duyên, Thùy Dung, Ngọc Trân, Mai Anh at 1.2x) | PASSED | Audio section in DOCX/Scripts |
| Document Numbering Formulas | Generic / CATB | Decree 30 formulas (8 types, no CATT) | Table 2.8 inserted (/BC-TTCH, /BC-CATP, /BC-CAT, /BC-CSGT, /BC-PCCC, /BC-BYT, /BC-CAP, /BC-CAX) | PASSED | Table 2.8 and text inspection |
| National Command Header | "Bộ công an/ TTCH quốc gia" | "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA" | "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA" | PASSED | Text inspection across all files |
| CATT / Thị trấn Occurrences | > 0 | 0 (strictly eliminated) | 0 active occurrences (strictly eliminated from all formulas and roles) | PASSED | Automated keyword sweep across 100% of files |
| PDF Export Completeness | Missing 5 PDFs | 100% matching PDF twins | 100% matching PDF twins generated for every docx, pptx, svg, md | PASSED | File existence and timestamp check |
