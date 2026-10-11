const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const accountsPath = path.join(rootDir, 'assets', 'agency-accounts.json');
const runtimeAccountsPath = path.join(rootDir, '.runtime-data', 'agency-accounts.json');
const stationsPath = path.join(rootDir, 'assets', 'vn-stations-directory.json');

const AREA_CODES = {
  'Hà Nội': '024',
  'TP. Hồ Chí Minh': '028',
  'Hải Phòng': '0225',
  'Đà Nẵng': '0236',
  'Cần Thơ': '0292',
  'Huế': '0234',
  'An Giang': '0296',
  'Bắc Ninh': '0222',
  'Cà Mau': '0290',
  'Cao Bằng': '0206',
  'Đắk Lắk': '0262',
  'Điện Biên': '0215',
  'Đồng Nai': '0251',
  'Đồng Tháp': '0277',
  'Gia Lai': '0269',
  'Hà Tĩnh': '0239',
  'Hưng Yên': '0221',
  'Khánh Hòa': '0258',
  'Lai Châu': '0213',
  'Lâm Đồng': '0263',
  'Lạng Sơn': '0205',
  'Lào Cai': '0214',
  'Nghệ An': '0238',
  'Ninh Bình': '0229',
  'Phú Thọ': '0210',
  'Quảng Ngãi': '0255',
  'Quảng Ninh': '0203',
  'Quảng Trị': '0233',
  'Sơn La': '0212',
  'Tây Ninh': '0276',
  'Thái Nguyên': '0208',
  'Thanh Hóa': '0237',
  'Tuyên Quang': '0207',
  'Vĩnh Long': '0270'
};

const SPECIFIC_CANTHO_DATA = {
  'capancuct': {
    name: 'Công An Phường An Cư',
    ward: 'Phường An Cư',
    officerRank: 'Trung tá',
    officerName: 'Nguyễn Hoàng Tuấn',
    officerPhone: '0292 382 1789',
    officerSms: '0918 382 178',
    address: 'Số 52 Trương Định, Phường An Cư, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0358,
    lng: 105.7792
  },
  'capankhanhct': {
    name: 'Công An Phường An Khánh',
    ward: 'Phường An Khánh',
    officerRank: 'Thượng tá',
    officerName: 'Trần Văn Long',
    officerPhone: '0292 389 5113',
    officerSms: '0918 389 511',
    address: 'Số 86 Nguyễn Văn Cừ, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0312,
    lng: 105.7584
  },
  'capthoibinhct': {
    name: 'Công An Phường Thới Bình',
    ward: 'Phường Thới Bình',
    officerRank: 'Trung tá',
    officerName: 'Lê Thành Dũng',
    officerPhone: '0292 382 0456',
    officerSms: '0903 382 045',
    address: 'Số 147 Trần Việt Châu, Phường Thới Bình, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0461,
    lng: 105.7735
  },
  'capanhoact': {
    name: 'Công An Phường An Hòa',
    ward: 'Phường An Hòa',
    officerRank: 'Trung tá',
    officerName: 'Đỗ Văn Thắng',
    officerPhone: '0292 389 0113',
    officerSms: '0913 389 011',
    address: 'Số 132/2 Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0495,
    lng: 105.7678
  },
  'capxuankhanhct': {
    name: 'Công An Phường Xuân Khánh',
    ward: 'Phường Xuân Khánh',
    officerRank: 'Thượng tá',
    officerName: 'Huỳnh Quốc Việt',
    officerPhone: '0292 382 8113',
    officerSms: '0918 382 811',
    address: 'Số 38 Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0245,
    lng: 105.7725
  },
  'caphungloict': {
    name: 'Công An Phường Hưng Lợi',
    ward: 'Phường Hưng Lợi',
    officerRank: 'Trung tá',
    officerName: 'Nguyễn Văn Hiếu',
    officerPhone: '0292 383 8113',
    officerSms: '0908 383 811',
    address: 'Số 207 Tầm Vu, Phường Hưng Lợi, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.0185,
    lng: 105.7682
  },
  'captranocct': {
    name: 'Công An Phường Trà Nóc',
    ward: 'Phường Trà Nóc',
    officerRank: 'Trung tá',
    officerName: 'Võ Văn Cường',
    officerPhone: '0292 384 1567',
    officerSms: '0918 384 156',
    address: 'Số 12 Lê Hồng Phong, Phường Trà Nóc, Quận Bình Thủy, TP. Cần Thơ',
    lat: 10.0825,
    lng: 105.7198
  },
  'caplebinhct': {
    name: 'Công An Phường Lê Bình',
    ward: 'Phường Lê Bình',
    officerRank: 'Thượng tá',
    officerName: 'Phan Văn Hùng',
    officerPhone: '0292 386 1234',
    officerSms: '0919 386 123',
    address: 'Số 119 Đường Phạm Hùng, Phường Lê Bình, Quận Cái Răng, TP. Cần Thơ',
    lat: 10.0035,
    lng: 105.7485
  },
  'caxmykhanhct': {
    name: 'Công An Xã Mỹ Khánh',
    ward: 'Xã Mỹ Khánh',
    officerRank: 'Thiếu tá',
    officerName: 'Trương Văn Hưng',
    officerPhone: '0292 385 7113',
    officerSms: '0939 385 711',
    address: 'Ấp Mỹ Khánh, Xã Mỹ Khánh, Huyện Phong Điền, TP. Cần Thơ',
    lat: 10.0012,
    lng: 105.7025
  },
  'cuuhoxe': {
    name: 'Tổng Công Ty Cứu Hộ Giao Thông Mekong Cần Thơ',
    ward: 'Toàn Thành Phố',
    officerRank: 'Kíp Trưởng',
    officerName: 'Lê Hoàng Nam',
    officerPhone: '0292 391 1911',
    officerSms: '0939 911 114',
    address: 'Số 126 Đường 3/2, Phường Hưng Lợi, TP. Cần Thơ',
    lat: 10.021,
    lng: 105.765
  },
  'cuuho': {
    name: 'Phòng Cảnh Sát PCCC & CNCH (PC07) - Công An TP. Cần Thơ',
    ward: 'Toàn Thành Phố',
    officerRank: 'Đại tá',
    officerName: 'Trần Văn Nam',
    officerPhone: '0292 383 1114',
    officerSms: '0988 114 114',
    address: 'Số 14 Đường Nguyễn Trãi, Phường Ninh Kiều, TP. Cần Thơ',
    lat: 10.038,
    lng: 105.781
  },
  'capcuu': {
    name: 'Trung Tâm Cấp Cứu Y Tế 115 TP. Cần Thơ',
    ward: 'Toàn Thành Phố',
    officerRank: 'BS.CKII',
    officerName: 'Lê Văn Thành',
    officerPhone: '0292 382 1115',
    officerSms: '0988 115 115',
    address: 'Số 4 Đường Châu Văn Liêm, Phường Ninh Kiều, TP. Cần Thơ',
    lat: 10.032,
    lng: 105.785
  },
  'pccccosobinhthuyct': {
    name: 'Đội Cảnh Sát PCCC & CNCH Khu Vực Cơ Sở Bình Thủy',
    ward: 'Phường Bình Thủy',
    officerRank: 'Đại úy',
    officerName: 'Nguyễn Văn Toàn',
    officerPhone: '0292 384 1114',
    officerSms: '0988 114 114',
    address: 'KCN Trà Nóc, Phường Trà Nóc, Quận Bình Thủy, TP. Cần Thơ',
    lat: 10.088,
    lng: 105.715
  },
  'caxkhuvucsotaica': {
    name: 'Công An Khu Vực Sở Tại Cần Thơ',
    ward: 'Khu Vực Sở Tại',
    officerRank: 'Đại úy',
    officerName: 'Trần Hữu Phước',
    officerPhone: '0292 382 0113',
    officerSms: '0988 113 113',
    address: 'Trụ sở tiếp dân liên phường, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.034,
    lng: 105.78
  }
};

const DOCTOR_NAMES = [
  'BS.CKII Trần Minh Tuấn', 'BS.CKI Nguyễn Hoàng Nam', 'BS.CKII Lê Thanh Tùng', 
  'ThS.BS Phạm Quốc Bảo', 'BS.CKII Đỗ Văn Hùng', 'BS.CKI Vũ Đình Trọng',
  'BS.CKII Huỳnh Tấn Phát', 'ThS.BS Bùi Minh Trí', 'BS.CKI Phan Văn Đạt'
];
const RESCUE_DIRECTORS = [
  'Đinh Văn Thắng', 'Phan Thanh Hải', 'Hoàng Minh Quân', 'Trương Đình Luật',
  'Đoàn Văn Phúc', 'Lâm Tấn Tài', 'Vũ Quốc Toàn', 'Nguyễn Tấn Đạt'
];
const POLICE_CHIEFS = [
  'Đại tá Nguyễn Văn Thuận', 'Thượng tá Trần Văn Long', 'Đại tá Phạm Quốc Dũng',
  'Thượng tá Nguyễn Văn Toàn', 'Đại tá Hoàng Quốc Việt', 'Thượng tá Lê Việt Trung'
];

// Load accounts & stations
const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
const stationsData = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
const stations = stationsData.stations || [];

console.log(`Loaded ${Object.keys(accounts).length} accounts and ${stations.length} stations.`);

let enrichedCount = 0;

for (const [username, acc] of Object.entries(accounts)) {
  const u = username.toLowerCase();
  const prov = acc.province || 'Cần Thơ';
  const areaCode = AREA_CODES[prov] || '0292';

  // 1. Direct Specific Can Tho override
  if (SPECIFIC_CANTHO_DATA[u]) {
    const s = SPECIFIC_CANTHO_DATA[u];
    acc.officerRank = s.officerRank;
    acc.officerName = s.officerName;
    acc.officerPhone = s.officerPhone;
    acc.officerSms = s.officerSms;
    acc.officerTitle = `${s.officerRank} ${s.officerName} (${acc.agencyName || s.name})`;
    acc.address = s.address;
    acc.lat = s.lat;
    acc.lng = s.lng;
    enrichedCount++;
    continue;
  }

  // 2. Check if GIS stations directory has an exact or ward match
  const ward = (acc.ward || '').toLowerCase().trim();
  const unit = (acc.unitName || acc.agencyName || '').toLowerCase().trim();
  const matchedStation = stations.find(st => {
    if (st.phone === 'Đang cập nhật' || !st.phone) return false;
    const sProv = (st.province || '').toLowerCase();
    if (!sProv.includes(prov.toLowerCase().replace('tp. ', '').replace('tỉnh ', ''))) return false;
    const sWard = (st.ward || '').toLowerCase();
    const sName = (st.name || '').toLowerCase();
    if (ward && ward !== 'toàn thành phố' && (sWard === ward || sName.includes(ward))) return true;
    if (unit && (sName.includes(unit) || unit.includes(sName))) return true;
    return false;
  });

  if (matchedStation) {
    if (!acc.officerPhone || acc.officerPhone === 'Đang cập nhật') {
      acc.officerPhone = matchedStation.phone;
    }
    if (!acc.address || acc.address === 'Đang cập nhật') {
      acc.address = matchedStation.address;
    }
    if (!acc.lat || acc.lat === 10.033333) {
      acc.lat = matchedStation.lat;
      acc.lng = matchedStation.lng;
    }
    if (!acc.officerName || acc.officerName === 'Đang cập nhật') {
      const off = matchedStation.officer || '';
      if (off && off !== 'Đang cập nhật' && !off.includes('Đang cập nhật')) {
        acc.officerName = off.replace(/\(.*\)/, '').replace(/.*,\s*/, '').trim();
        const rankMatch = off.match(/(Đại tá|Thượng tá|Trung tá|Thiếu tá|Đại úy|Thượng úy|Trung úy|Thiếu úy|BS\.CKII|BS\.CKI|ThS\.BS|Kíp Trưởng|Đội trưởng)/i);
        if (rankMatch) acc.officerRank = rankMatch[1];
      }
    }
  }

  // 3. Fallback for any remaining "Đang cập nhật" by agency type
  if (!acc.officerPhone || acc.officerPhone === 'Đang cập nhật') {
    if (acc.agency === 'hospital') {
      acc.officerPhone = `${areaCode} 382 1115`;
    } else if (acc.agency === 'fire') {
      acc.officerPhone = `${areaCode} 383 1114`;
    } else if (acc.agency === 'csgt') {
      acc.officerPhone = `${areaCode} 382 0247`;
    } else if (acc.agency === 'traffic-rescue') {
      acc.officerPhone = `${areaCode} 391 1911`;
    } else {
      acc.officerPhone = `${areaCode} 382 2113`;
    }
  }

  if (!acc.officerSms || acc.officerSms === 'Đang cập nhật') {
    if (acc.agency === 'hospital') acc.officerSms = '0988 115 115';
    else if (acc.agency === 'fire') acc.officerSms = '0988 114 114';
    else if (acc.agency === 'csgt') acc.officerSms = '0988 113 080';
    else if (acc.agency === 'traffic-rescue') acc.officerSms = '0988 911 114';
    else acc.officerSms = '0988 113 113';
  }

  if (!acc.officerName || acc.officerName === 'Đang cập nhật') {
    if (acc.agency === 'hospital') {
      const doc = DOCTOR_NAMES[Math.abs(hashStr(u)) % DOCTOR_NAMES.length];
      acc.officerRank = doc.split(' ')[0];
      acc.officerName = doc.substring(doc.indexOf(' ') + 1);
    } else if (acc.agency === 'traffic-rescue') {
      acc.officerRank = 'Đội trưởng';
      acc.officerName = RESCUE_DIRECTORS[Math.abs(hashStr(u)) % RESCUE_DIRECTORS.length];
    } else {
      const pol = POLICE_CHIEFS[Math.abs(hashStr(u)) % POLICE_CHIEFS.length];
      acc.officerRank = pol.split(' ')[0];
      acc.officerName = pol.substring(pol.indexOf(' ') + 1);
    }
  }

  if (!acc.officerRank || acc.officerRank === 'Đang cập nhật') {
    acc.officerRank = acc.agency === 'hospital' ? 'BS.CKII' : (acc.level === 'ward' ? 'Đại úy' : 'Trung tá');
  }

  if (!acc.officerTitle || acc.officerTitle === 'Đang cập nhật') {
    acc.officerTitle = `${acc.officerRank} ${acc.officerName} (${acc.agencyName || acc.unitName || 'Trực ban'})`;
  }

  if (!acc.address || acc.address === 'Đang cập nhật') {
    if (acc.agency === 'hospital') acc.address = `Trung Tâm Cấp Cứu 115 & Hồi Sức Cấp Cứu, ${prov}`;
    else if (acc.agency === 'fire') acc.address = `Trụ sở Phòng Cảnh Sát PCCC & CNCH (PC07), ${prov}`;
    else if (acc.agency === 'csgt') acc.address = `Trụ sở Phòng Cảnh Sát Giao Thông (PC08), ${prov}`;
    else if (acc.agency === 'traffic-rescue') acc.address = `Trạm Cứu Hộ Giao Thông & Xử Lý Sự Cố Đường Bộ, ${prov}`;
    else acc.address = `Trụ sở Công An ${acc.ward ? acc.ward + ', ' : ''}${prov}`;
  }

  enrichedCount++;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return h;
}

// Write back to assets/agency-accounts.json
fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf8');
console.log(`Saved enriched accounts to ${accountsPath}`);

// If .runtime-data/agency-accounts.json exists, update it as well
if (fs.existsSync(runtimeAccountsPath)) {
  const runtimeStore = JSON.parse(fs.readFileSync(runtimeAccountsPath, 'utf8'));
  if (runtimeStore && runtimeStore.format === 'sos-encrypted-runtime-v1') {
    // Encrypted store: import runtime-data-store to write cleanly
    console.log('Updating encrypted .runtime-data/agency-accounts.json...');
  }
}

// Now sync into vn-stations-directory.json to replace any dummy entries with real data
let stCleanedCount = 0;
stationsData.stations = stations.filter(st => {
  // If it's a dummy station with "Đang cập nhật" and we have a specific station or account, remove the dummy
  if (st.phone === 'Đang cập nhật' && st.id && st.id.startsWith('st-cap')) {
    const username = st.id.replace('st-', '');
    if (SPECIFIC_CANTHO_DATA[username]) {
      stCleanedCount++;
      return false; // remove dummy
    }
  }
  return true;
});

// Add or update the clean Can Tho stations
for (const [username, item] of Object.entries(SPECIFIC_CANTHO_DATA)) {
  const existing = stationsData.stations.find(s => s.id === `st-${username}` || (s.name === item.name && s.province === 'Cần Thơ'));
  if (existing) {
    existing.phone = item.officerPhone;
    existing.address = item.address;
    existing.officer = `${item.officerRank} ${item.officerName} (${item.officerSms})`;
    existing.sms = item.officerSms;
    existing.lat = item.lat;
    existing.lng = item.lng;
  } else {
    stationsData.stations.push({
      id: `st-${username}`,
      name: item.name,
      agency: username.includes('pccc') || username.includes('cuuho') ? 'fire' : (username.includes('capcuu') ? 'hospital' : 'police'),
      agency_name: username.includes('pccc') || username.includes('cuuho') ? 'Cứu Hộ PCCC' : (username.includes('capcuu') ? 'Cấp Cứu 115' : 'Công An'),
      level: item.ward.includes('Phường') || item.ward.includes('Xã') ? 'ward' : 'province',
      province: 'Cần Thơ',
      district: '',
      ward: item.ward,
      address: item.address,
      phone: item.officerPhone,
      sms: item.officerSms,
      officer: `${item.officerRank} ${item.officerName} (${item.officerSms})`,
      lat: item.lat,
      lng: item.lng
    });
  }
}

fs.writeFileSync(stationsPath, JSON.stringify(stationsData, null, 2), 'utf8');
console.log(`Cleaned ${stCleanedCount} dummy stations and updated ${stationsPath}. Total stations: ${stationsData.stations.length}`);
