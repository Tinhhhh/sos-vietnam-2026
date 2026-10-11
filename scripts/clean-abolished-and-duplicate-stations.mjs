import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const removeVietnameseTones = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const normKey = (str) => {
  return removeVietnameseTones(str || '')
    .toLowerCase()
    .replace(/^(cong an|phuong|xa|thi tran|dac khu|tp\.?|tinh|thanh pho|quan|huyen|thi xa)\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
};

const abolishedCanThoUsernames = new Set([
  'caxkhuvucsotaica', // Fake test account
  'capancuct',         // Abolished (merged into Ninh Kiều)
  'capthoibinhct',     // Abolished (merged into Ninh Kiều)
  'capxuankhanhct',    // Abolished (merged into Ninh Kiều)
  'capankhanhct',      // Abolished (merged into Tân An)
  'caphungloict',      // Abolished (merged into Tân An)
  'capanhoact',        // Abolished (merged into Cái Khế)
  'caxmykhanhct',      // Abolished (merged into An Bình)
  'captranocct',       // Abolished (merged into Thới An Đông)
  'caplebinhct'        // Abolished (merged into Cái Răng)
]);

const abolishedStationIds = new Set([
  'st-caxkhuvucsotaica',
  'st-capancuct',
  'st-capthoibinhct',
  'st-capxuankhanhct',
  'st-capankhanhct',
  'st-caphungloict',
  'st-capanhoact',
  'st-caxmykhanhct',
  'st-captranocct',
  'st-caplebinhct',
  // duplicate provincial stations to remove in favor of official ones:
  'st-csgt',   // merged into st-ct-csgt-pc08
  'st-cuuho'   // merged into st-ct-pccc-pc07
]);

console.log('=== STEP 1: CLEAN AGENCY ACCOUNTS ===');
const seedPath = path.join(rootDir, 'assets', 'agency-accounts.seed.json');
const assetsAccPath = path.join(rootDir, 'assets', 'agency-accounts.json');
const runtimeAccPath = path.join(rootDir, '.runtime-data', 'agency-accounts.json');

[seedPath, assetsAccPath, runtimeAccPath].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let removedCount = 0;
      for (const u of abolishedCanThoUsernames) {
        if (data[u]) {
          delete data[u];
          removedCount++;
        }
      }
      // Also update provincial accounts (congan, csgt, cuuho) in Cần Thơ to accurate info
      if (data.congan) {
        data.congan.level = 'province';
        data.congan.province = 'Cần Thơ';
        data.congan.ward = 'Phường Cái Khế';
        data.congan.address = 'Số 9A Trần Phú, Phường Cái Khế, Thành phố Cần Thơ';
        data.congan.lat = 10.045250;
        data.congan.lng = 105.781820;
        data.congan.officerPhone = '0292 382 0830';
      }
      if (data.csgt) {
        data.csgt.level = 'province';
        data.csgt.province = 'Cần Thơ';
        data.csgt.ward = 'Phường Cái Khế';
        data.csgt.address = 'Số 71 Đường Trần Phú, Phường Cái Khế, Thành phố Cần Thơ';
        data.csgt.lat = 10.0475;
        data.csgt.lng = 105.7835;
      }
      if (data.cuuho) {
        data.cuuho.level = 'province';
        data.cuuho.province = 'Cần Thơ';
        data.cuuho.ward = 'Phường An Khánh';
        data.cuuho.address = 'Đường Nguyễn Văn Cừ, Phường An Khánh, Ninh Kiều, Cần Thơ';
        data.cuuho.lat = 10.038;
        data.cuuho.lng = 105.781;
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${path.relative(rootDir, filePath)}: removed ${removedCount} abolished accounts, total accounts remaining: ${Object.keys(data).length}`);
    } catch (e) {
      console.warn(`Error updating ${filePath}:`, e.message);
    }
  }
});

console.log('\n=== STEP 2: CLEAN & DEDUPLICATE VN STATIONS DIRECTORY ===');
const stationsPath = path.join(rootDir, 'assets', 'vn-stations-directory.json');
const stationsData = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
const rawStations = stationsData.stations || [];
console.log(`Initial stations count: ${rawStations.length}`);

// Step 2a: Normalize Quang Tri ward names
const normalizeQuangTriWard = (ward) => {
  if (!ward) return ward;
  let w = ward.trim();
  w = w.replace(/^CAX\s+/i, 'Xã ');
  w = w.replace(/^CAP\s+/i, 'Phường ');
  w = w.replace(/^CADK\s+/i, 'Đặc khu ');
  w = w.replace(/\s*-\s*Cơ sở\s*\d+/i, '');
  return w;
};

// Filter out abolished stations and fix Cần Thơ provincial headquarters
let filtered = [];
let removedAbolishedCount = 0;

for (const s of rawStations) {
  if (abolishedStationIds.has(s.id)) {
    removedAbolishedCount++;
    continue;
  }
  // Check if Cần Thơ station belongs to abolished ward names
  const pNorm = normKey(s.province);
  const wNorm = normKey(s.ward);
  if (pNorm === 'cantho') {
    if (['khuvucsotai', 'ancu', 'thoibinh', 'xuankhanh', 'ankhanh', 'hungloi', 'anhoa', 'mykhanh', 'tranoc', 'lebinh'].includes(wNorm) && s.level === 'ward' && !s.id.startsWith('st-ct-')) {
      // Check if it's one of the official 105 stations
      // In the official 105 stations, Ninh Kiều is the post-merger ward, not An Cư, Thới Bình, Xuân Khánh!
      console.log(`Filtering out abolished Can Tho ward station: ${s.id} - ${s.name} (${s.ward})`);
      removedAbolishedCount++;
      continue;
    }
    // Fix st-congan
    if (s.id === 'st-congan') {
      s.level = 'province';
      s.ward = 'Phường Cái Khế';
      s.address = 'Số 9A Trần Phú, Phường Cái Khế, Thành phố Cần Thơ';
      s.lat = 10.045250;
      s.lng = 105.781820;
      s.phone = '0292 382 0830';
    }
  }

  // Normalize Quang Tri
  if (pNorm === 'quangtri') {
    s.ward = normalizeQuangTriWard(s.ward);
  }

  filtered.push(s);
}
console.log(`Removed ${removedAbolishedCount} abolished / duplicate stations.`);

// Step 2b: Deduplicate nationwide ward-level stations (1 ward = 1 police station)
// Group by (provinceKey, wardKey, agency)
const wardGroups = new Map();
const nonWardStations = [];

for (const s of filtered) {
  if (s.level === 'province' || s.level === 'city' || s.level === 'national' || !s.ward || s.ward === 'Toàn Thành Phố' || s.ward === 'Toàn tỉnh') {
    nonWardStations.push(s);
    continue;
  }
  const key = `${normKey(s.province)}|${normKey(s.ward)}|${s.agency || 'police'}`;
  if (!wardGroups.has(key)) {
    wardGroups.set(key, []);
  }
  wardGroups.get(key).push(s);
}

console.log(`Total unique ward groups: ${wardGroups.size}`);
let deduplicatedCount = 0;
const finalWardStations = [];

for (const [key, group] of wardGroups.entries()) {
  if (group.length === 1) {
    finalWardStations.push(group[0]);
  } else {
    deduplicatedCount += (group.length - 1);
    // Merge group into the best station:
    // Prioritize one with active accountId, then non-hyphen/standard ID, then more complete details
    group.sort((a, b) => {
      const aHasAcc = (a.accountId || a.officer_name) ? 1 : 0;
      const bHasAcc = (b.accountId || b.officer_name) ? 1 : 0;
      if (aHasAcc !== bHasAcc) return bHasAcc - aHasAcc;
      const aGps = (a.lat && a.lat !== 0 && a.isGpsVerified) ? 1 : 0;
      const bGps = (b.lat && b.lat !== 0 && b.isGpsVerified) ? 1 : 0;
      if (aGps !== bGps) return bGps - aGps;
      return (b.address?.length || 0) - (a.address?.length || 0);
    });

    const primary = group[0];
    // Merge any missing details from other items
    for (let i = 1; i < group.length; i++) {
      const alt = group[i];
      if (!primary.phone && alt.phone) primary.phone = alt.phone;
      if (!primary.officer && alt.officer) primary.officer = alt.officer;
      if (!primary.officer_name && alt.officer_name) primary.officer_name = alt.officer_name;
      if (!primary.officer_rank && alt.officer_rank) primary.officer_rank = alt.officer_rank;
      if (!primary.address && alt.address) primary.address = alt.address;
      if ((!primary.lat || primary.lat === 0) && alt.lat) {
        primary.lat = alt.lat;
        primary.lng = alt.lng;
      }
    }
    finalWardStations.push(primary);
  }
}

console.log(`Deduplicated ${deduplicatedCount} duplicate ward stations.`);
const finalStationsList = [...nonWardStations, ...finalWardStations];
console.log(`Final total stations in vn-stations-directory.json: ${finalStationsList.length}`);

stationsData.stations = finalStationsList;
fs.writeFileSync(stationsPath, JSON.stringify(stationsData, null, 2), 'utf8');
console.log(`Saved clean ${stationsPath}`);
