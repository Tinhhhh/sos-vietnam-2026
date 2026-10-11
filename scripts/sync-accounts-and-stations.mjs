import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readRuntimeData, writeRuntimeData } from '../services/runtime-data-store.js';
import { securityCryptoService } from '../services/security-crypto-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function cleanWardKey(str) {
  if (!str) return '';
  return removeVietnameseTones(String(str).toLowerCase())
    .replace(/^(cong an\s+)?(phuong|xa|thi tran|dac khu|p\.|x\.|tt\.)\s*/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function cleanProvKey(str) {
  if (!str) return '';
  return removeVietnameseTones(String(str).toLowerCase())
    .replace(/^(tinh|thanh pho|tp\.?)\s*/i, '')
    .replace(/[^a-z0-9]/g, '');
}

const VALID_RANKS = [
  'Đại tướng', 'Thượng tướng', 'Trung tướng', 'Thiếu tướng',
  'Đại tá', 'Thượng tá', 'Trung tá', 'Thiếu tá',
  'Đại úy', 'Thượng úy', 'Trung úy', 'Thiếu úy',
  'Thượng sĩ', 'Trung sĩ', 'Hạ sĩ', 'Chiến sĩ',
  'BS.CKII', 'BS.CKI', 'ThS.BS', 'Bác sĩ', 'Kíp Trưởng', 'Đội Trưởng', 'Chuyên viên'
];

function parseOfficerRankAndName(rawRank, rawName, fullString = '') {
  let combined = String(fullString || '').trim();
  if (!combined) {
    const r = String(rawRank || '').trim();
    const n = String(rawName || '').trim();
    if (r && n) {
      // Check if r is a broken half-rank like "Thượng" and n starts with "tá " or "úy "
      if (/^(Đại|Thượng|Trung|Thiếu)$/i.test(r) && /^(tá|úy|tướng|sĩ)\b/i.test(n)) {
        combined = `${r} ${n}`;
      } else if (n.toLowerCase().startsWith(r.toLowerCase())) {
        combined = n;
      } else {
        combined = `${r} ${n}`;
      }
    } else {
      combined = r || n;
    }
  }

  // Strip parenthetical suffix like "(Trưởng CAP)" or "(Trực ban ...)"
  combined = combined.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  // Strip leading broken rank fragments like "tá " if rawRank was already "Thượng tá"
  combined = combined.replace(/^(Đại|Thượng|Trung|Thiếu)\s+\1\s+/i, '$1 ');

  for (const rank of VALID_RANKS) {
    const startRegex = new RegExp(`^${rank}[,\\s]+(.+)$`, 'i');
    const mStart = combined.match(startRegex);
    if (mStart) {
      let cleanName = mStart[1].trim();
      const repeatStart = new RegExp(`^${rank}[,\\s]+`, 'i');
      const repeatEnd = new RegExp(`[,\\s\\-]+${rank}$`, 'i');
      cleanName = cleanName.replace(repeatStart, '').replace(repeatEnd, '').trim();
      cleanName = cleanName.replace(/^(tá|úy|tướng|sĩ)\s+/i, '').trim();
      return { officerRank: rank, officerName: cleanName };
    }

    const endRegex = new RegExp(`^(.+?)[,\\s\\-]+${rank}$`, 'i');
    const mEnd = combined.match(endRegex);
    if (mEnd) {
      let cleanName = mEnd[1].trim();
      const repeatStart = new RegExp(`^${rank}[,\\s]+`, 'i');
      const repeatEnd = new RegExp(`[,\\s\\-]+${rank}$`, 'i');
      cleanName = cleanName.replace(repeatStart, '').replace(repeatEnd, '').trim();
      cleanName = cleanName.replace(/^(tá|úy|tướng|sĩ)\s+/i, '').trim();
      return { officerRank: rank, officerName: cleanName };
    }
  }

  // Fallback if rawRank is already valid
  const matchedValidRank = VALID_RANKS.find(r => r.toLowerCase() === String(rawRank || '').trim().toLowerCase());
  let fallbackName = String(rawName || '').replace(/^(tá|úy|tướng|sĩ)\s+/i, '').trim();
  if (matchedValidRank) {
    const repeatStart = new RegExp(`^${matchedValidRank}[,\\s]+`, 'i');
    const repeatEnd = new RegExp(`[,\\s\\-]+${matchedValidRank}$`, 'i');
    fallbackName = fallbackName.replace(repeatStart, '').replace(repeatEnd, '').trim();
    return { officerRank: matchedValidRank, officerName: fallbackName || 'Trực ban tác chiến' };
  }

  return {
    officerRank: 'Trung tá',
    officerName: fallbackName || combined || 'Trực ban tác chiến'
  };
}

function isPlaceholderText(str) {
  if (!str) return true;
  const s = String(str).trim().toLowerCase();
  if (!s) return true;
  return (
    s.includes('chưa công bố') ||
    s.includes('đang cập nhật') ||
    s === 'toàn thành phố' ||
    s === 'toàn tỉnh' ||
    s === 'vị trí đã định vị trên bản đồ'
  );
}

// 1. Load datasets
const canTho105Path = path.join(ROOT, 'assets', 'cantho-official-105-stations.json');
const stationsDirPath = path.join(ROOT, 'assets', 'vn-stations-directory.json');
const seedAccountsPath = path.join(ROOT, 'assets', 'agency-accounts.seed.json');
const assetsAccountsPath = path.join(ROOT, 'assets', 'agency-accounts.json');

const canTho105 = JSON.parse(fs.readFileSync(canTho105Path, 'utf8'));
const stationsDir = JSON.parse(fs.readFileSync(stationsDirPath, 'utf8'));
const seedAccounts = JSON.parse(fs.readFileSync(seedAccountsPath, 'utf8'));
const runtimeAccounts = readRuntimeData('agency-accounts.json', {});

// Merge seed and runtime accounts
const accounts = { ...seedAccounts, ...runtimeAccounts };

// 2. Clean and repair stationsDirectory first
const duplicateIdsToRemove = new Set([
  'st-capcaikhect',
  'st-capanbinhct',
  'st-capbinhthuyct',
  'st-caphungphuct',
  'st-captananca'
]);

stationsDir.stations = (stationsDir.stations || []).filter(s => !duplicateIdsToRemove.has(s.id));

// Ensure all 105 Can Tho official stations in stationsDir have clean officer fields and exact metadata
const canThoByWardKey = new Map();
for (const item of canTho105) {
  const wardTitle = String(item.title || '').trim();
  const wKey = cleanWardKey(wardTitle);
  const { officerRank, officerName } = parseOfficerRankAndName('', '', item.truongca || '');
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lng);
  const info = {
    raw_id: String(item.id),
    ward: wardTitle,
    province: 'Cần Thơ',
    name: `Công An ${wardTitle}`,
    unit_title: wardTitle,
    address: String(item.street || '').trim(),
    lat,
    lng,
    phone: String(item.phone || '').trim(),
    sms: String(item.sdttruongca || item.phone || '0988 113 113').trim(),
    email: String(item.email || '').trim(),
    services: String(item.description_2 || 'Đăng ký cư trú, đăng ký phương tiện giao thông, tiếp nhận tin báo').trim(),
    officerRank,
    officerName,
    officerFull: `${officerRank} ${officerName}`.trim(),
    officerPhone: String(item.sdttruongca || '').trim(),
    postal_code: String(item.postal_code || '').trim()
  };
  canThoByWardKey.set(wKey, info);

  // Sync into stationsDir.stations
  const stIdx = stationsDir.stations.findIndex(
    s => s.raw_id === info.raw_id || (cleanProvKey(s.province) === 'cantho' && cleanWardKey(s.ward || s.unit_title || s.name) === wKey && (s.agency || 'police') === 'police')
  );
  if (stIdx !== -1) {
    const existing = stationsDir.stations[stIdx];
    stationsDir.stations[stIdx] = {
      ...existing,
      name: info.name,
      unit_title: info.unit_title,
      province: 'Cần Thơ',
      ward: info.ward,
      address: info.address,
      phone: info.phone,
      sms: info.sms,
      officer: `${info.officerFull}${info.officerPhone ? ` (SĐT: ${info.officerPhone})` : ''}`,
      officer_name: info.officerFull,
      officer_rank: info.officerRank,
      officer_clean_name: info.officerName,
      officer_phone: info.officerPhone,
      email: info.email,
      services: info.services,
      lat: info.lat,
      lng: info.lng,
      isGpsVerified: true
    };
  }
}

// Also clean broken officer_name ("tá ...") across all other stations in stationsDir.stations
for (const st of stationsDir.stations) {
  if (st.officer || st.officer_name) {
    const parsed = parseOfficerRankAndName(st.officer_rank || '', st.officer_name || '', st.officer || '');
    st.officer_rank = parsed.officerRank;
    st.officer_clean_name = parsed.officerName;
    if (st.officer_name && /^(tá|úy|tướng|sĩ)\s+/i.test(st.officer_name)) {
      st.officer_name = `${parsed.officerRank} ${parsed.officerName}`.trim();
    }
    if (!st.officer || /^(tá|úy|tướng|sĩ)\s+/i.test(st.officer)) {
      st.officer = `${parsed.officerRank} ${parsed.officerName}`.trim();
    }
  }
}

// Build lookup of verified stations by (provKey, wardKey, agency)
const stationLookup = new Map();
for (const st of stationsDir.stations) {
  const pKey = cleanProvKey(st.province);
  const wKey = cleanWardKey(st.ward || st.unit_title || st.name);
  const ag = st.agency || 'police';
  if (pKey && wKey) {
    stationLookup.set(`${pKey}|${wKey}|${ag}`, st);
  }
}

// 3. Repair and synchronize all accounts in `accounts`
let fixedRanksCount = 0;
let fixedCanThoCount = 0;
let fixedStationsSyncCount = 0;

// Explicit mapping for known Can Tho accounts
const explicitCanThoWardMap = {
  capcaikhect: 'Phường Cái Khế',
  capanbinhct: 'Phường An Bình',
  capbinhthuyct: 'Phường Bình Thủy',
  caphungphuct: 'Phường Hưng Phú',
  captananca: 'Phường Tân An'
};

for (const [username, acc] of Object.entries(accounts)) {
  if (!acc || typeof acc !== 'object') continue;

  // Fix CSGT Can Tho headquarters address & coords if placeholder
  if (username === 'csgt' && cleanProvKey(acc.province) === 'cantho') {
    acc.ward = 'Phường Cái Khế';
    acc.address = 'Số 9A Trần Phú, phường Cái Khế, thành phố Cần Thơ';
    acc.lat = 10.045120;
    acc.lng = 105.780450;
    acc.officerRank = 'Thượng tá';
    acc.officerName = 'Trực ban Phòng CSGT (PC08)';
    acc.officerTitle = 'Thượng tá Trực ban Phòng CSGT (PC08) (Công an TP Cần Thơ)';
    acc.officerPhone = '0292 373 7455';
    acc.officerSms = '0988 113 113';
    acc.officerEmail = 'pc08@cantho.gov.vn';
    acc.contactVerification = 'official';
    fixedCanThoCount++;
    continue;
  }

  // Fix broken officerRank / officerName across all accounts
  const beforeRank = acc.officerRank;
  const beforeName = acc.officerName;
  const parsedOfficer = parseOfficerRankAndName(acc.officerRank, acc.officerName);
  if (parsedOfficer.officerRank !== beforeRank || parsedOfficer.officerName !== beforeName) {
    acc.officerRank = parsedOfficer.officerRank;
    acc.officerName = parsedOfficer.officerName;
    acc.officerTitle = `${acc.officerRank} ${acc.officerName} (Trực ban ${acc.agencyName || acc.unitName || ''})`.trim();
    fixedRanksCount++;
  }

  // Determine ward key from explicit map, acc.ward, or acc.agencyName
  let targetWardName = explicitCanThoWardMap[username] || acc.ward || '';
  if (isPlaceholderText(targetWardName) && acc.agencyName) {
    const m = String(acc.agencyName).match(/(Phường|Xã|Thị trấn|Đặc khu)\s+([^—\-()]+)/i);
    if (m) {
      targetWardName = `${m[1]} ${m[2].trim()}`;
    }
  }

  const pKey = cleanProvKey(acc.province);
  const wKey = cleanWardKey(targetWardName);

  // If in Can Tho and matches one of the 105 official wards
  if (pKey === 'cantho' && (acc.agency === 'police' || !acc.agency) && acc.level !== 'national' && acc.level !== 'province') {
    const ctInfo = canThoByWardKey.get(wKey);
    if (ctInfo) {
      acc.level = 'ward';
      acc.province = 'Cần Thơ';
      acc.ward = ctInfo.ward;
      acc.agencyName = ctInfo.name;
      acc.unitName = ctInfo.name;
      acc.address = ctInfo.address;
      acc.lat = ctInfo.lat;
      acc.lng = ctInfo.lng;
      acc.officerRank = ctInfo.officerRank;
      acc.officerName = ctInfo.officerName;
      acc.officerTitle = `${ctInfo.officerRank} ${ctInfo.officerName} (Trưởng ${ctInfo.name})`;
      acc.officerPhone = ctInfo.phone;
      acc.officerSms = ctInfo.officerPhone || ctInfo.sms || ctInfo.phone;
      acc.officerEmail = ctInfo.email;
      acc.services = ctInfo.services;
      acc.contactVerification = 'official';
      fixedCanThoCount++;
      continue;
    }
  }

  // For any other province/ward account, sync with stationLookup if available
  const stMatch = stationLookup.get(`${pKey}|${wKey}|${acc.agency || 'police'}`);
  if (stMatch) {
    if (!isPlaceholderText(targetWardName) && isPlaceholderText(acc.ward)) {
      acc.ward = stMatch.ward || targetWardName;
    }
    if (isPlaceholderText(acc.address) && !isPlaceholderText(stMatch.address)) {
      acc.address = stMatch.address;
    }
    if (stMatch.lat && stMatch.lng && (!acc.lat || !acc.lng || (acc.lat === 10.033333 && acc.lng === 105.783333))) {
      acc.lat = Number(stMatch.lat);
      acc.lng = Number(stMatch.lng);
    }
    if (stMatch.phone && !isPlaceholderText(stMatch.phone) && isPlaceholderText(acc.officerPhone)) {
      acc.officerPhone = stMatch.phone;
    }
    if (stMatch.email && !isPlaceholderText(stMatch.email) && (!acc.officerEmail || acc.officerEmail.endsWith('@sos.gov.vn') || isPlaceholderText(acc.officerEmail))) {
      acc.officerEmail = stMatch.email;
    }
    if (stMatch.officer_rank && stMatch.officer_clean_name && (acc.officerName.startsWith('Trực ban') || isPlaceholderText(acc.officerName))) {
      acc.officerRank = stMatch.officer_rank;
      acc.officerName = stMatch.officer_clean_name;
      acc.officerTitle = `${acc.officerRank} ${acc.officerName} (Trực ban ${acc.agencyName || acc.unitName || ''})`.trim();
    }
    fixedStationsSyncCount++;
  }
}

// 4. Ensure all 105 official Can Tho stations have a corresponding ward account so Admin can search/edit any of the 105 wards in Can Tho
let createdCanThoAccounts = 0;
const defaultHash = accounts.capcaikhect?.passwordHash || securityCryptoService.hashPassword('2002');

for (const [wKey, ctInfo] of canThoByWardKey.entries()) {
  const existingEntry = Object.entries(accounts).find(([, a]) =>
    cleanProvKey(a.province) === 'cantho' &&
    (a.agency === 'police' || !a.agency) &&
    a.level === 'ward' &&
    cleanWardKey(a.ward) === wKey
  );
  if (!existingEntry) {
    const isPhuong = /^phường\b/i.test(ctInfo.ward);
    const prefix = isPhuong ? 'cap' : 'cax';
    let candidateUsername = `${prefix}${wKey}ct`;
    if (accounts[candidateUsername]) {
      candidateUsername = `${prefix}${wKey}cantho`;
    }
    accounts[candidateUsername] = {
      username: candidateUsername,
      initialPassword: '2002',
      passwordHash: defaultHash,
      agency: 'police',
      level: 'ward',
      agencyName: ctInfo.name,
      unitName: ctInfo.name,
      province: 'Cần Thơ',
      ward: ctInfo.ward,
      address: ctInfo.address,
      lat: ctInfo.lat,
      lng: ctInfo.lng,
      officerRank: ctInfo.officerRank,
      officerName: ctInfo.officerName,
      officerTitle: `${ctInfo.officerRank} ${ctInfo.officerName} (Trưởng ${ctInfo.name})`,
      officerPhone: ctInfo.phone,
      officerSms: ctInfo.officerPhone || ctInfo.sms || ctInfo.phone,
      officerEmail: ctInfo.email,
      services: ctInfo.services,
      contactVerification: 'official',
      badgeIcon: '👮‍♂️',
      theme: 'theme-police'
    };
    createdCanThoAccounts++;
  }
}

// 5. Write back all files
fs.writeFileSync(stationsDirPath, JSON.stringify(stationsDir, null, 2), 'utf8');
fs.writeFileSync(seedAccountsPath, JSON.stringify(accounts, null, 2), 'utf8');
fs.writeFileSync(assetsAccountsPath, JSON.stringify(accounts, null, 2), 'utf8');
writeRuntimeData('agency-accounts.json', accounts);

console.log(JSON.stringify({
  ok: true,
  totalAccounts: Object.keys(accounts).length,
  totalStations: stationsDir.stations.length,
  fixedRanksCount,
  fixedCanThoCount,
  fixedStationsSyncCount,
  createdCanThoAccounts,
  sampleCapCaiKheCt: accounts.capcaikhect ? {
    username: accounts.capcaikhect.username,
    ward: accounts.capcaikhect.ward,
    address: accounts.capcaikhect.address,
    lat: accounts.capcaikhect.lat,
    lng: accounts.capcaikhect.lng,
    officerRank: accounts.capcaikhect.officerRank,
    officerName: accounts.capcaikhect.officerName,
    officerPhone: accounts.capcaikhect.officerPhone,
    officerSms: accounts.capcaikhect.officerSms,
    officerEmail: accounts.capcaikhect.officerEmail
  } : null
}, null, 2));
