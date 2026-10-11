# Account Registration & Map Location Picker Synchronization QA Report

- **Timestamp**: `2026-10-11T06:27:55.802Z`
- **Overall Status**: **PASS**

## Assertions
- [x] **PASS**: API /api/geocode/search resolves Phường Cái Khế exact headquarters (10.043366, 105.773396)
- [x] **PASS**: API /api/geocode/search strips placeholder "Chưa công bố..." and extracts ward from agencyName
- [x] **PASS**: Edit Account Modal for CAPCAIKHECT matches Images 1 & 4 100%
- [x] **PASS**: Map Location Picker opens at exact headquarters (10.043366, 105.773396) without placeholder text
- [x] **PASS**: Map Location Picker live autocomplete & search resolves Phường Tân An accurately
- [x] **PASS**: Create Account Modal auto-fills station address, GPS, officer, phone, and email across Cần Thơ & Hà Nội

## CAPCAIKHECT Edit Modal Values
```json
{
  "title": "✏️ CHỈNH SỬA TÀI KHOẢN [CAPCAIKHECT]",
  "username": "capcaikhect",
  "agencyName": "Công An Phường Cái Khế",
  "province": "Cần Thơ",
  "ward": "Phường Cái Khế",
  "address": "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
  "lat": "10.043366",
  "lng": "105.773396",
  "rank": "Trung tá",
  "officerName": "Trần Sơn Lam",
  "phone": "02923890379",
  "sms": "0903101070",
  "email": "phuongcaikhe@cantho.gov.vn",
  "provincesDatalistCount": 34,
  "wardsDatalistCount": 116
}
```

## Map Location Picker Initial & Search Values
```json
{
  "pickerInitial": {
    "searchInputValue": "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
    "addressDisplay": "🏢 234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
    "coordsDisplay": "[10.043366, 105.773396]",
    "pickedLocation": {
      "lat": 10.043366,
      "lng": 105.773396,
      "address": "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
      "ward": "Phường Cái Khế",
      "province": "Cần Thơ",
      "meta": {
        "id": "st-ct-28-ph-ng-c-i-kh",
        "raw_id": "28",
        "province": "Cần Thơ",
        "ward": "Phường Cái Khế",
        "postal_code": "31120",
        "agency": "police",
        "agency_name": "Công An",
        "level": "ward",
        "name": "Công An Phường Cái Khế",
        "address": "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
        "phone": "02923890379",
        "sms": "0903101070",
        "officer": "Trung tá Trần Sơn Lam (SĐT: 0903101070)",
        "officer_name": "Trung tá Trần Sơn Lam",
        "officer_phone": "0903101070",
        "email": "phuongcaikhe@cantho.gov.vn",
        "lat": 10.043366,
        "lng": 105.773396,
        "services": "Đăng kí cư trú, đăng kí phương tiện giao thông, tiếp nhận tin báo",
        "unit_title": "Phường Cái Khế",
        "isGpsVerified": true,
        "officer_rank": "Trung tá",
        "officer_clean_name": "Trần Sơn Lam"
      }
    }
  },
  "pickerSuggestDropdown": {
    "display": "block",
    "itemCount": 12,
    "firstItemText": "Công An Phường Tân An 🏛️ TRỤ SỞ CHÍNH THỨC 📍 02 Nguyễn Tri Phương, Kv.10, phường Tân An, thành phố Cần Thơ [10.03982, 105.75825]"
  },
  "pickerAfterTanAnSearch": {
    "searchInputValue": "02 Nguyễn Tri Phương, Kv.10, phường Tân An, thành phố Cần Thơ",
    "addressDisplay": "🏢 02 Nguyễn Tri Phương, Kv.10, phường Tân An, thành phố Cần Thơ",
    "coordsDisplay": "[10.039822, 105.758250]",
    "pickedLocation": {
      "lat": 10.039822,
      "lng": 105.75825,
      "address": "02 Nguyễn Tri Phương, Kv.10, phường Tân An, thành phố Cần Thơ",
      "ward": "Phường Tân An",
      "province": "Cần Thơ",
      "meta": {
        "ok": true,
        "lat": 10.039822,
        "lng": 105.75825,
        "address": "02 Nguyễn Tri Phương, Kv.10, phường Tân An, thành phố Cần Thơ",
        "ward": "Phường Tân An",
        "province": "Cần Thơ",
        "unitName": "Công An Phường Tân An",
        "phone": "02923894939",
        "sms": "0919123419",
        "email": "phuongtanan@cantho.gov.vn",
        "officerRank": "Trung tá",
        "officerName": "Trung tá Nguyễn Minh Hoàng",
        "officerPhone": "0919123419",
        "services": "Đăng ký cư trú, đăng ký phương tiện giao thông, phản ánh về ANTT",
        "source": "stations-directory"
      }
    }
  }
}
```

## Create New Account Auto-Fill Verification (Cần Thơ & Hà Nội)
```json
{
  "createAutoFillCaiKhe": {
    "agencyName": "Công An Phường Cái Khế",
    "province": "Cần Thơ",
    "ward": "Phường Cái Khế",
    "address": "234 Phạm Ngũ Lão, phường Cái Khế, thành phố Cần Thơ",
    "lat": "10.043366",
    "lng": "105.773396",
    "rank": "Trung tá",
    "officerName": "Trần Sơn Lam",
    "phone": "02923890379",
    "sms": "0903101070",
    "email": "phuongcaikhe@cantho.gov.vn"
  },
  "createAutoFillHoanKiem": {
    "agencyName": "Công An Phường Hoàn Kiếm — TP. Hà Nội",
    "province": "Hà Nội",
    "ward": "Phường Hoàn Kiếm",
    "address": "Số 2 Tràng Tiền, Phường Hoàn Kiếm, TP. Hà Nội",
    "lat": "21.030530",
    "lng": "105.852600",
    "rank": "Trung tá",
    "officerName": "Nguyễn Quốc Huy",
    "phone": "024 3825 3113",
    "wardsDatalistCount": 230
  }
}
```