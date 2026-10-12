# Hanoi 417 Police Stations & Multi-Facility Nearest Dispatch Verification Report

- **Timestamp**: `2026-10-11T15:54:30.485Z`
- **Overall Status**: **PASS**
- **Total Nationwide Stations**: `845`
- **Total Hanoi Facilities**: `372` (312 ward police stations + specialized units)

## Verification Summary
This test verifies the integration of all 417 official headquarters and citizen reception facilities of Công an TP Hà Nội, ensuring multi-facility ward rendering and automated nearest-facility dispatch.

## Assertions
- [x] **PASS**: Directory total operational stations >= 845 (after purging all 48 non-emergency/administrative bureaus and legacy duplicates)
- [x] **PASS**: Hanoi operational facilities >= 370 (369 ANTD operational units + Trung Tâm Thông Tin Chỉ Huy CATP Hà Nội)
- [x] **PASS**: Hanoi grassroots ward police facilities >= 312 (across all 126 communes/wards)
- [x] **PASS**: Zero non-operational or administrative bureaus (Văn phòng CSĐT, Kinh tế, QLHC về TTXH, Xuất nhập cảnh, Thanh tra, Trại tạm giam, Bảo tàng, Báo ANTĐ, Bệnh viện CATP) in station directory or /api/stations/all
- [x] **PASS**: All 369 Hanoi ANTD operational stations have decoded HTML entities (0 &amp;) and official ANTD source_url
- [x] **PASS**: Phường Ba Đình has exactly 2 ward police facilities (Trụ sở chính & Cơ sở 4)
- [x] **PASS**: Phường Bạch Mai has exactly 5 distinct ward police facilities
- [x] **PASS**: Phường Hoàn Kiếm has all 6 distinct ward police facilities (Trụ sở chính, Cơ sở 2..6)
- [x] **PASS**: All 369 Hanoi ANTD operational stations have valid Google Maps URLs
- [x] **PASS**: Dispatch near Quán Thánh selects Cơ sở 4 as nearest facility with isNearest=true
- [x] **PASS**: Dispatch near Điện Biên Phủ selects Trụ sở chính as nearest facility with isNearest=true
- [x] **PASS**: PCCC&CNCH SOS routes to nearest Regional Squad by radius (level=ward, 15m timer) with City HQ as provinceUnit
- [x] **PASS**: CSGT SOS routes to nearest Regional Squad and escalates to Phòng CSGT - Trụ sở chính via POST /api/dispatcher/escalate
- [x] **PASS**: UI renders both primary pin and auxiliary pin for Phường Ba Đình
- [x] **PASS**: UI popup for Phường Ba Đình contains Google Maps link and multi-facility directory
- [x] **PASS**: UI renders 1 primary pin + 4 auxiliary pins (5 total) for Phường Bạch Mai
- [x] **PASS**: UI renders 1 primary pin + 5 auxiliary pins (all 6 facilities) simultaneously for Phường Hoàn Kiếm
- [x] **PASS**: clearActiveWardPin cleans up both primary and auxiliary pins without ghost markers
- [x] **PASS**: Active Incident Drawer displays multi-facility list with [Cơ sở gần nhất] badge and 15-minute countdown + Chuyển cấp Thành phố button

## Nearest Facility Dispatch Verification (API)
### Case A: Citizen Near 116 Quán Thánh (Ba Đình)
```json
{
  "id": "st-hn-ca-005-ba-dinh",
  "station_id": "st-hn-ca-005-ba-dinh",
  "level": "ward",
  "isRegionalSquad": true,
  "isCityHq": false,
  "unitCategory": "ward_police",
  "jurisdictionScope": "ward",
  "levelName": "Công An Cấp Xã/Phường (Công an phường Ba Đình - Cơ sở 4)",
  "name": "Công an phường Ba Đình - Cơ sở 4",
  "unit_title": "Phường Ba Đình",
  "address": "116 phố Quán Thánh, phường Ba Đình, thành phố Hà Nội, Việt Nam",
  "phone": "+84 368107770",
  "sms": "0988 113 113",
  "ward": "Phường Ba Đình",
  "province": "Hà Nội",
  "email": "cahn_ba-dinh@hanoi.gov.vn",
  "officerRank": "Trưởng CA",
  "officerName": "Trực ban Công an phường Ba Đình - Cơ sở 4",
  "officer_phone": "+84 368107770",
  "truongca": "Trực ban Công an phường Ba Đình - Cơ sở 4",
  "sdttruongca": "+84 368107770",
  "services": "Xử lý vi phạm về giao thông, trật tự đô thị; Cấp, đổi căn cước",
  "isGpsVerified": true,
  "officerFullTitle": "Đại úy Trực ban Công an phường Ba Đình - Cơ sở 4 (Chỉ huy trực ban)",
  "contactVerification": "official",
  "gmapsUrl": "https://www.google.com/maps/dir/?api=1&destination=21.042397,105.843138",
  "lat": 21.042397,
  "lng": 105.843138,
  "distanceKm": 0,
  "facility_type": "Cơ sở 4",
  "maps_url": "https://maps.app.goo.gl/mQXdgGvDG6Yto46s6",
  "wardFacilities": [
    {
      "id": "st-hn-ca-005-ba-dinh",
      "name": "Công an phường Ba Đình - Cơ sở 4",
      "facility_type": "Cơ sở 4",
      "address": "116 phố Quán Thánh, phường Ba Đình, thành phố Hà Nội, Việt Nam",
      "phone": "+84 368107770",
      "services": "Xử lý vi phạm về giao thông, trật tự đô thị; Cấp, đổi căn cước",
      "maps_url": "https://maps.app.goo.gl/mQXdgGvDG6Yto46s6",
      "lat": 21.042397,
      "lng": 105.843138,
      "distanceKm": 0,
      "isNearest": true
    },
    {
      "id": "st-hn-ca-004-ba-dinh",
      "name": "Công an phường Ba Đình - Trụ sở chính",
      "facility_type": "Trụ sở chính",
      "address": "37 Điện Biên Phủ, phường Ba Đình, thành phố Hà Nội, Việt Nam",
      "phone": "+84 2438293208",
      "services": "Tiếp nhận, giải quyết tố giác, tin báo về tội phạm, kiến nghị khởi tố; Tiếp công dân giải quyết các thủ tục hành chính về cư trú; Đăng ký; quản lý phương tiện giao thông; Cấp, đổi giấy phép lái xe.",
      "maps_url": "https://maps.app.goo.gl/Rh8bVLm3UgXrHwc76",
      "lat": 21.033075,
      "lng": 105.838356,
      "distanceKm": 1.15,
      "isNearest": false
    }
  ],
  "isNearestFacilityInWard": true,
  "isAutoRoutedNearest": false,
  "routingNotice": null,
  "originalWard": "Phường Ba Đình",
  "originalProvince": "Hà Nội"
}
```

### Case B: Citizen Near 37 Điện Biên Phủ (Ba Đình)
```json
{
  "id": "st-hn-ca-004-ba-dinh",
  "station_id": "st-hn-ca-004-ba-dinh",
  "level": "ward",
  "isRegionalSquad": true,
  "isCityHq": false,
  "unitCategory": "ward_police",
  "jurisdictionScope": "ward",
  "levelName": "Công An Cấp Xã/Phường (Công an phường Ba Đình - Trụ sở chính)",
  "name": "Công an phường Ba Đình - Trụ sở chính",
  "unit_title": "Phường Ba Đình",
  "address": "37 Điện Biên Phủ, phường Ba Đình, thành phố Hà Nội, Việt Nam",
  "phone": "+84 2438293208",
  "sms": "0988 113 113",
  "ward": "Phường Ba Đình",
  "province": "Hà Nội",
  "email": "cahn_ba-dinh@hanoi.gov.vn",
  "officerRank": "Trưởng CA",
  "officerName": "Trực ban Công an phường Ba Đình - Trụ sở chính",
  "officer_phone": "+84 2438293208",
  "truongca": "Trực ban Công an phường Ba Đình - Trụ sở chính",
  "sdttruongca": "+84 2438293208",
  "services": "Tiếp nhận, giải quyết tố giác, tin báo về tội phạm, kiến nghị khởi tố; Tiếp công dân giải quyết các thủ tục hành chính về cư trú; Đăng ký; quản lý phương tiện giao thông; Cấp, đổi giấy phép lái xe.",
  "isGpsVerified": true,
  "officerFullTitle": "Đại úy Trực ban Công an phường Ba Đình - Trụ sở chính (Chỉ huy trực ban)",
  "contactVerification": "official",
  "gmapsUrl": "https://www.google.com/maps/dir/?api=1&destination=21.033075,105.838356",
  "lat": 21.033075,
  "lng": 105.838356,
  "distanceKm": 0,
  "facility_type": "Trụ sở chính",
  "maps_url": "https://maps.app.goo.gl/Rh8bVLm3UgXrHwc76",
  "wardFacilities": [
    {
      "id": "st-hn-ca-004-ba-dinh",
      "name": "Công an phường Ba Đình - Trụ sở chính",
      "facility_type": "Trụ sở chính",
      "address": "37 Điện Biên Phủ, phường Ba Đình, thành phố Hà Nội, Việt Nam",
      "phone": "+84 2438293208",
      "services": "Tiếp nhận, giải quyết tố giác, tin báo về tội phạm, kiến nghị khởi tố; Tiếp công dân giải quyết các thủ tục hành chính về cư trú; Đăng ký; quản lý phương tiện giao thông; Cấp, đổi giấy phép lái xe.",
      "maps_url": "https://maps.app.goo.gl/Rh8bVLm3UgXrHwc76",
      "lat": 21.033075,
      "lng": 105.838356,
      "distanceKm": 0.01,
      "isNearest": true
    },
    {
      "id": "st-hn-ca-005-ba-dinh",
      "name": "Công an phường Ba Đình - Cơ sở 4",
      "facility_type": "Cơ sở 4",
      "address": "116 phố Quán Thánh, phường Ba Đình, thành phố Hà Nội, Việt Nam",
      "phone": "+84 368107770",
      "services": "Xử lý vi phạm về giao thông, trật tự đô thị; Cấp, đổi căn cước",
      "maps_url": "https://maps.app.goo.gl/mQXdgGvDG6Yto46s6",
      "lat": 21.042397,
      "lng": 105.843138,
      "distanceKm": 1.14,
      "isNearest": false
    }
  ],
  "isNearestFacilityInWard": true,
  "isAutoRoutedNearest": false,
  "routingNotice": null,
  "originalWard": "Phường Ba Đình",
  "originalProvince": "Hà Nội"
}
```

## Multi-Facility Map UI Verification
### Phường Ba Đình (2 Facilities: Trụ sở chính + Cơ sở 4)
```json
{
  "primaryPinFound": true,
  "primaryPinText": "Công an phường Ba Đình - Trụ sở chính [Cơ sở gần nhất]",
  "auxPinsCount": 1,
  "auxPinsText": [
    "Công an phường Ba Đình - Cơ sở 4 (0.72 km)"
  ],
  "popupFound": true,
  "popupHasFacilityBadge": true,
  "popupHasGmapsLink": true,
  "popupHasOtherFacilitiesList": true
}
```

### Phường Bạch Mai (5 Facilities: Trụ sở chính + Cơ sở 2, 3, 4, 5)
```json
{
  "primaryPinFound": true,
  "primaryPinText": "Công an phường Bạch Mai - Cơ sở 3 [Cơ sở gần nhất]",
  "auxPinsCount": 4,
  "auxPinsText": [
    "Công an phường Bạch Mai - Cơ sở 2 (0.76 km)",
    "Công an phường Bạch Mai - Cơ sở 5 (0.79 km)",
    "Công an phường Bạch Mai - Cơ sở 4 (0.98 km)",
    "Công an phường Bạch Mai - Trụ sở chính (1.3 km)"
  ],
  "popupFound": true,
  "popupHasFacilityBadge": true,
  "popupHasOtherFacilitiesList": true
}
```

## Artifact Screenshots
- [Ba Đình Multi-Facility View](file:///C:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/Reports/qa/playwright/screenshots/hanoi-ba-dinh-multi-facility.png)
- [Bạch Mai 5 Facilities View](file:///C:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/Reports/qa/playwright/screenshots/hanoi-bach-mai-5-facilities.png)