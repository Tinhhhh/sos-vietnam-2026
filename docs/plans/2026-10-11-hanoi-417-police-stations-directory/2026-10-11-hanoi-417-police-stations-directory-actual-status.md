# Hà Nội 417 Police Stations Directory Actual Status (P0-A)

## Metadata
- Date: `2026-10-11`
- Status: `ready_for_implementation`
- Repository: `sos-vietnam-2026`
- Source Reference: `https://anninhthudo.vn/chi-tiet-danh-sach-417-tru-so-diem-tiep-dan-kem-link-google-map-cua-cong-an-tp-ha-noi-post666267.antd`
- Local Saved Content: `C:\Users\dienv\.gemini\antigravity\brain\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4\.system_generated\steps\2629\content.md`

---

## 1. Current State Assessment

### 1.1 Source Data Verification
- Article published by **Báo Điện tử An ninh Thủ đô** (official press organ of Công an TP Hà Nội).
- Table contains exactly **417 facilities**:
  - `STT`: 1 to 417
  - `Tên trụ sở`: Full official facility names (Trụ sở chính, Cơ sở 2/3/4/5, Bệnh viện CATP Hà Nội, Bảo tàng CATP Hà Nội, Báo An ninh Thủ đô, Cơ quan CSĐT Cụm 1-8).
  - `Địa chỉ`: Specific street addresses, house numbers, wards, districts across Hà Nội.
  - `Số điện thoại`: Landlines and hotlines (+84 24..., 024..., 0692...).
  - `Thủ tục, hành chính giải quyết`: Specific division of duties per facility (e.g. tin báo tố giác, căn cước, trật tự giao thông, CSKV, v.v.).
  - `Bản đồ`: Official Google Maps shortlinks (`https://maps.app.goo.gl/...`), which expand via HTTP 302 to full URLs with exact `!3d<lat>!4d<lng>` GPS coordinates.

### 1.2 Current Hà Nội Station State in Repository
- `assets/vn-stations-directory.json`:
  - Contains only **74 entries** for Hà Nội total (60 police, 3 PC08/PC07, 11 medical/fire).
  - Many ward-level police entries are coarse placeholders or generic duplicates (`st-hn-ca-*` and `st-hn_ca_*`).
  - Lacks multi-facility granularity (e.g. `Phường Ba Đình` only had 1 pin, whereas it has Trụ sở chính + Cơ sở 4; `Phường Bạch Mai` has 5 facilities; `Phường Cửa Nam` has 6 facilities + specialized units).
- `assets/agency-accounts.seed.json`:
  - Contains seed accounts for previous 60 Hà Nội police stations.
  - Needs synchronization to support official stations and multi-facility ward accounts.
- `server.js`:
  - `resolveJurisdiction`: Matches incident to ward police station. Currently assumes 1 station per ward or returns the first match without distance-based facility selection.
  - `findNearestStations`: Uses Haversine distance, but needs explicit multi-facility priority so that in wards with multiple facilities, the nearest facility within the ward jurisdiction is dispatched first.
- `js/map-controller.js` & `js/dispatcher.js`:
  - Needs to render all official facilities for a ward when highlighted or searched, with facility role badges (`Trụ sở chính`, `Cơ sở 2`, etc.) and show the nearest facility to citizen coordinates.

---

## 2. Invariant & Architecture Decisions

1. **Multi-Facility Coexistence**:
   - Hà Nội legitimately operates multiple facilities per commune/ward (unlike rural provinces).
   - All 417 facilities must exist in `assets/hanoi-official-417-stations.json` and merge into `assets/vn-stations-directory.json`.
   - Distinct IDs (e.g. `st-hn-ca-ba-dinh-main`, `st-hn-ca-ba-dinh-cs4`).
2. **True GPS Precision**:
   - Resolve shortlinks `https://maps.app.goo.gl/...` into true latitude and longitude.
   - Fallback to ward polygon centroid or address geocoding if any shortlink cannot be resolved.
3. **Nearest-Facility Citizen Dispatch**:
   - In wards with multiple facilities, citizen SOS coordinates must be matched to the nearest facility in that ward.
   - Dispatcher HUD and map display must highlight the closest station while keeping all ward facilities visible.
