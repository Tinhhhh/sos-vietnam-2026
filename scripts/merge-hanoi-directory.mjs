import fs from 'fs';
import path from 'path';

const directoryPath = 'assets/vn-stations-directory.json';
const officialHNPath = 'assets/hanoi-official-417-stations.json';
const seedAccountsPath = 'assets/agency-accounts.seed.json';
const fallbackAccountsPath = 'assets/agency-accounts.json';
const runtimeAccountsPath = '.runtime-data/agency-accounts.json';

function isNonOperationalEntity(name = '', services = '') {
  const n = (name || '').toLowerCase();
  const s = (services || '').toLowerCase();
  const banned = [
    /bảo tàng công an/i,
    /bảo tàng nghiệp vụ/i,
    /báo an ninh thủ đô/i,
    /bệnh viện catp/i,
    /bệnh viện công an/i,
    /nhà nghỉ dưỡng/i,
    /nhà khách/i,
    /trung tâm điều dưỡng/i,
    /công ty tnhh/i,
    /công ty tháng 8/i,
    /uỷ ban kiểm tra đảng/i,
    /ủy ban kiểm tra đảng/i,
    /trung tâm huấn luyện và bồi dưỡng/i
  ];
  if (banned.some(rx => rx.test(n))) return true;
  if (/tiếp đón khách tham quan bảo tàng|tiếp đón bệnh nhân đến khám chữa bệnh|nghỉ ngơi, điều dưỡng/i.test(s)) return true;
  return false;
}

const dir = JSON.parse(fs.readFileSync(directoryPath, 'utf8'));
const rawOfficialHN = JSON.parse(fs.readFileSync(officialHNPath, 'utf8'));
const officialHN = rawOfficialHN.filter(s => !isNonOperationalEntity(s.name, s.services));

const officialIds = new Set(officialHN.map(s => s.id));

// 1. Separate existing stations (excluding non-operational entities & old duplicates)
const nonHnStations = dir.stations.filter(s =>
  s.province !== 'Hà Nội' &&
  s.province !== 'Thành phố Hà Nội' &&
  !isNonOperationalEntity(s.name, s.services)
);
const hnHQ = dir.stations.find(s => s.id === 'st-cahanioi');
const hnNonPolice = dir.stations.filter(s =>
  (s.province === 'Hà Nội' || s.province === 'Thành phố Hà Nội') &&
  s.agency !== 'police' &&
  !officialIds.has(s.id) &&
  !s.id?.startsWith('st-hn-ca-') &&
  !isNonOperationalEntity(s.name, s.services)
);

console.log(`Non-Hà Nội stations kept: ${nonHnStations.length}`);
console.log(`Hà Nội legacy non-police kept: ${hnNonPolice.length}`);
console.log(`Hà Nội provincial HQ kept: ${hnHQ ? hnHQ.name : 'none'}`);
console.log(`Hà Nội official operational facilities adding: ${officialHN.length}`);

// Combine
const mergedStations = [
  ...nonHnStations,
  ...hnNonPolice,
  ...(hnHQ ? [{ ...hnHQ, isCityHq: true, level: 'province', unitCategory: 'city_hq', jurisdictionScope: 'city_hq' }] : []),
  ...officialHN
];

console.log(`Total stations after merge: ${mergedStations.length}`);

// Write back to assets/vn-stations-directory.json
fs.writeFileSync(directoryPath, JSON.stringify({ stations: mergedStations }, null, 2).replace(/&amp;/gi, '&'), 'utf8');
console.log(`Updated ${directoryPath}`);

// 2. Update agency accounts in seed, fallback, and runtime
function updateAccounts(filePath) {
  if (!fs.existsSync(filePath)) return;
  const accounts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const updatedAccounts = {};
  for (const [key, acc] of Object.entries(accounts)) {
    const uName = acc.unitName || acc.agencyName || '';
    if (isNonOperationalEntity(uName, acc.services || '')) {
      continue;
    }
    if (key.startsWith('hn_ca_')) {
      // Will be regenerated from sanitized officialHN below
      continue;
    }
    const isHn = acc.province === 'Hà Nội' || acc.province === 'Thành phố Hà Nội';
    const isPolice = acc.agency === 'police';
    if (isHn && isPolice && key !== 'catphanoi' && key !== 'cahanioi') {
      continue;
    }
    updatedAccounts[key] = acc;
  }

  // Add primary accounts for official Hà Nội operational stations
  officialHN.forEach(st => {
    const accKey = st.id.replace(/^st-/, '').replace(/[^a-z0-9_]/g, '_');
    const agency = st.agency || 'police';
    const badgeIcon = agency === 'fire' ? '🚒' : (agency === 'csgt' ? '🚓' : '👮‍♂️');
    const theme = agency === 'fire' ? 'theme-fire' : (agency === 'csgt' ? 'theme-csgt' : 'theme-police');
    updatedAccounts[accKey] = {
      username: accKey,
      initialPassword: '2002',
      agency,
      level: st.level || 'ward',
      isCityHq: Boolean(st.isCityHq),
      isRegionalSquad: Boolean(st.isRegionalSquad),
      unitCategory: st.unitCategory || 'ward_police',
      jurisdictionScope: st.jurisdictionScope || 'ward',
      agencyName: st.name,
      unitName: st.name,
      facilityType: st.facility_type,
      province: 'Hà Nội',
      ward: st.ward,
      address: st.address,
      lat: st.lat,
      lng: st.lng,
      officerRank: st.officer_rank || 'Đại úy',
      officerName: st.officer_clean_name || `Trực ban ${st.name}`,
      officerTitle: `${st.officer_rank || 'Đại úy'} Trực ban (${st.name})`,
      officerPhone: st.phone,
      officerSms: st.sms,
      officerEmail: st.email,
      services: st.services,
      maps_url: st.maps_url,
      source_url: st.source_url,
      badgeIcon,
      theme,
      stationLat: st.lat,
      stationLng: st.lng
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedAccounts, null, 2).replace(/&amp;/gi, '&'), 'utf8');
  console.log(`Updated accounts in ${filePath} (total accounts: ${Object.keys(updatedAccounts).length})`);
}

updateAccounts(seedAccountsPath);
updateAccounts(fallbackAccountsPath);
updateAccounts(runtimeAccountsPath);
console.log('--- MERGE COMPLETED SUCCESSFULLY ---');
