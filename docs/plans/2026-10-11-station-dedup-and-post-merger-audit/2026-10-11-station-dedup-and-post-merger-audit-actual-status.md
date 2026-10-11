# Station Dedup And Post-Merger Audit Actual Status

Title: Station Dedup And Post-Merger Audit
Date: 2026-10-11
Status: All Phases Complete
Companion plan: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-plan.md`
Companion evidence: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-evidence.md`
Companion benchmark: `docs/plans/2026-10-11-station-dedup-and-post-merger-audit/2026-10-11-station-dedup-and-post-merger-audit-benchmark.md`

## Purpose

This file records the real current state before and after implementation.

## Freshness / Refresh Rules

This actual-status file is a living current-state record.

## Scope

Target scope:

- `assets/vn-stations-directory.json`
- `assets/agency-accounts.seed.json` and `.runtime-data/agency-accounts.json`
- `server.js` (`syncAllDirectoriesFromAgencyAccounts`)
- `js/map-controller.js` (`updateVisibleStationPins`, `showWardStationPin`, `highlightWardBoundary`, `clearWardBoundary`)
- `js/dispatcher.js` (`showWardHud`)

Out of scope:

- `assets/vn-wards-simplified.geojson` polygon geometry

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `js/map-controller.js` | `E0-P0A-FD1` | 3 inbound, 102 local | `updateVisibleStationPins`, `showWardStationPin`, `highlightWardBoundary` called during ward selection and map pan/zoom | CRITICAL scope warning |
| `server.js` | `E0-P0A-FD2` | 24 linked flows | `syncAllDirectoriesFromAgencyAccounts` syncs `agencyAccounts` into `vn-stations-directory.json` and `cantho-official-105-stations.json` | CRITICAL scope warning |

## Status Rules

| Status | Meaning | Allowed next action |
|--------|---------|---------------------|
| `correct` | Already behaves as required. | Preserve. Add evidence or tests only if needed. |
| `partial` | Some required behavior exists, but gaps remain. | Change only the missing parts. Preserve correct parts. |
| `wrong` | Current behavior, source, or contract is incorrect. | Replace with required behavior. Record the exact reason. |
| `missing` | Required behavior, source, or contract does not exist. | Implement the missing piece only. |
| `unbound` | Surface exists but is not wired to the real source, flow, or contract. | Bind to the real source only. Preserve approved surface. |
| `fake-or-stub` | Prototype, demo, mock, fallback, or placeholder data is being used as real behavior. | Remove fake behavior or replace it with an approved truthful state. |
| `blocked` | Source, authority, contract, or required evidence is unclear. | Stop. Do not implement until resolved. |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| `assets/vn-stations-directory.json` | 547 clean stations (0 abolished wards, 0 duplicate ward police stations, Cần Thơ has 103 post-merger wards + 2 KCN stations + provincial units, PC08 at Số 71 Trần Phú Cái Khế, CATP at Số 9A Trần Phú Cái Khế) | 0 abolished wards, 0 duplicate ward stations | `correct` | consumed by `server.js` and `js/map-controller.js` | `E1-P1A-CLEAN1`, `E2-P2A-PW1` | preserve |
| `assets/agency-accounts.seed.json` & `.runtime-data/agency-accounts.json` | 0 abolished/fake Cần Thơ ward accounts; `congan`, `csgt`, `cuuho` aligned with official provincial coordinates in Phường Cái Khế | 0 abolished/fake ward accounts | `correct` | consumed by `server.js` | `E1-P1A-CLEAN1` | preserve |
| `server.js` (`syncAllDirectoriesFromAgencyAccounts`) | Skips abolished pre-merger accounts and fake units, maps `csgt` to `st-ct-csgt-pc08`, maps `cuuho` to `st-ct-pccc-pc07`, enforces `level: province` for `congan`, filters duplicate station IDs | Synchronize clean accounts without re-creating duplicates | `correct` | 24 linked flows | `E1-P1A-CLEAN1`, `E2-P2A-PW1` | preserve |
| `js/map-controller.js` & `js/dispatcher.js` | Prioritizes grassroots ward police stations over provincial/fire/medical units; skips duplicate pin mounting when `activeWardStationMarker` is present; clears and remounts pins on boundary clear | Clean map display with 0 overlapping/duplicate markers on ward selection | `correct` | 3 inbound, 102 local | `E2-P2A-PW1` | preserve |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-11 | `2cf7223` | `vn-stations-directory.json`, `agency-accounts`, `server.js`, `js/map-controller.js` | initial classification | `E0-P0A-FD1`, `E0-P0A-FD2`, `E0-P0A-AUDIT1` | proceed to `P1-A` |
| R1 | 2026-10-11 | `P1-A` | `vn-stations-directory.json`, `agency-accounts`, `server.js` | `wrong -> correct`, `fake-or-stub -> removed` | `E1-P1A-CLEAN1` | proceed to `P2-A` |
| R2 | 2026-10-11 | `P2-A` | `js/map-controller.js`, `js/dispatcher.js` | `partial -> correct` | `E2-P2A-PW1` | plan complete |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `assets/vn-stations-directory.json` | `server.js` | source-of-truth | P1-A | edit | `E1-P1A-CLEAN1` | Preserved all post-merger wards + 2 KCN stations |
| `assets/agency-accounts.seed.json` | `server.js` | source-of-truth | P1-A | edit | `E1-P1A-CLEAN1` | Removed 10 abolished/fake accounts |
| `server.js` | `assets/vn-stations-directory.json` | consumer/sync | P1-A | edit | `E1-P1A-CLEAN1` | Scoped edit strictly to `syncAllDirectoriesFromAgencyAccounts` |
| `js/map-controller.js` | `assets/vn-stations-directory.json` | consumer | P2-A | edit | `E2-P2A-PW1` | Scoped edit to `showWardStationPin`, `updateVisibleStationPins`, `clearWardBoundary` |
| `js/dispatcher.js` | `js/map-controller.js` | consumer | P2-A | edit | `E2-P2A-PW1` | Scoped edit to `showWardHud` station prioritization |
