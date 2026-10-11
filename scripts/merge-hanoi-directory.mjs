import fs from 'fs';
import path from 'path';

const directoryPath = 'assets/vn-stations-directory.json';
const officialHNPath = 'assets/hanoi-official-417-stations.json';
const seedAccountsPath = 'assets/agency-accounts.seed.json';
const runtimeAccountsPath = '.runtime-data/agency-accounts.json';

const dir = JSON.parse(fs.readFileSync(directoryPath, 'utf8'));
const officialHN = JSON.parse(fs.readFileSync(officialHNPath, 'utf8'));

// 1. Separate existing stations
const nonHnStations = dir.stations.filter(s => s.province !== 'Hà Nội' && s.province !== 'Thành phố Hà Nội');
const hnHQ = dir.stations.find(s => s.id === 'st-cahanioi');
const hnNonPolice = dir.stations.filter(s => (s.province === 'Hà Nội' || s.province === 'Thành phố Hà Nội') && s.agency !== 'police');

console.log(`Non-Hà Nội stations kept: ${nonHnStations.length}`);
console.log(`Hà Nội non-police kept: ${hnNonPolice.length}`);
console.log(`Hà Nội provincial HQ kept: ${hnHQ ? hnHQ.name : 'none'}`);
console.log(`Hà Nội official facilities adding: ${officialHN.length}`);

// Combine
const mergedStations = [
  ...nonHnStations,
  ...hnNonPolice,
  ...(hnHQ ? [hnHQ] : []),
  ...officialHN
];

console.log(`Total stations after merge: ${mergedStations.length}`);

// Write back to assets/vn-stations-directory.json
fs.writeFileSync(directoryPath, JSON.stringify({ stations: mergedStations }, null, 2), 'utf8');
console.log(`Updated ${directoryPath}`);

// 2. Update agency accounts in seed and runtime
function updateAccounts(filePath) {
  if (!fs.existsSync(filePath)) return;
  const accounts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Remove outdated hn police accounts except catphanoi (provincial)
  const updatedAccounts = {};
  for (const [key, acc] of Object.entries(accounts)) {
    const isHn = acc.province === 'Hà Nội' || acc.province === 'Thành phố Hà Nội';
    const isPolice = acc.agency === 'police';
    if (isHn && isPolice && key !== 'catphanoi' && key !== 'cahanioi') {
      // Outdated generic ward account, skip
      continue;
    }
    updatedAccounts[key] = acc;
  }

  // Add primary accounts for official Hà Nội stations
  officialHN.forEach(st => {
    // Account key based on station id (without st- prefix)
    const accKey = st.id.replace(/^st-/, '').replace(/[^a-z0-9_]/g, '_');
    updatedAccounts[accKey] = {
      username: accKey,
      initialPassword: '2002',
      agency: 'police',
      level: 'ward',
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
      badgeIcon: '👮‍♂️',
      theme: 'theme-police',
      stationLat: st.lat,
      stationLng: st.lng
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedAccounts, null, 2), 'utf8');
  console.log(`Updated accounts in ${filePath} (total accounts: ${Object.keys(updatedAccounts).length})`);
}

updateAccounts(seedAccountsPath);
updateAccounts(runtimeAccountsPath);
console.log('--- MERGE COMPLETED SUCCESSFULLY ---');
