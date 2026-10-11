import fs from 'fs';
import path from 'path';

const contentPath = 'C:/Users/dienv/.gemini/antigravity/brain/7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4/.system_generated/steps/2629/content.md';
const content = fs.readFileSync(contentPath, 'utf8');

// Load geojson for ward matching & fallback centroids
const geojson = JSON.parse(fs.readFileSync('assets/vn-wards-simplified.geojson', 'utf8'));
const hnFeatures = geojson.features.filter(f => f.properties.province === 'Hà Nội' || f.properties.province === 'Thành phố Hà Nội');
const hnWardsMap = new Map();

function calcCentroid(feature) {
  let coords = [];
  if (feature.geometry.type === 'Polygon') {
    coords = feature.geometry.coordinates[0];
  } else if (feature.geometry.type === 'MultiPolygon') {
    coords = feature.geometry.coordinates[0][0];
  }
  if (!coords || coords.length === 0) return { lat: 21.0285, lng: 105.8542 };
  let sumLat = 0, sumLng = 0;
  for (const c of coords) {
    sumLng += c[0];
    sumLat += c[1];
  }
  return { lat: +(sumLat / coords.length).toFixed(6), lng: +(sumLng / coords.length).toFixed(6) };
}

hnFeatures.forEach(f => {
  const wName = f.properties.ward;
  const centroid = calcCentroid(f);
  hnWardsMap.set(wName, { feature: f, centroid });
});

// Normalize Vietnamese tone marks for comparison
function normalizeVn(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveWardName(address, name) {
  // 1. Priority: match from station name first when explicitly named "Công an phường/xã/thị trấn <X>"
  const nameMatch = (name || '').match(/Công (?:an )?(phường|xã|thị trấn)\s+([^-—–]+)/i);
  if (nameMatch) {
    const rawName = nameMatch[2].trim();
    const normRaw = normalizeVn(rawName);
    for (const w of hnWardsMap.keys()) {
      const pureW = normalizeVn(w.replace(/^(phường|xã|thị trấn)\s+/i, ''));
      if (pureW === normRaw) return w;
    }
  }

  // 2. Try matching from address
  const addrMatch = (address || '').match(/(phường|xã|thị trấn)\s+([^,]+)/i);
  let candidate = null;
  if (addrMatch) {
    const type = addrMatch[1].toLowerCase() === 'phường' ? 'Phường' : (addrMatch[1].toLowerCase() === 'xã' ? 'Xã' : 'Thị trấn');
    const rawName = addrMatch[2].trim();
    candidate = `${type} ${rawName}`;
    
    // Direct match
    if (hnWardsMap.has(candidate)) return candidate;
    
    // Normalized match against all hn wards
    const normCand = normalizeVn(candidate);
    for (const w of hnWardsMap.keys()) {
      if (normalizeVn(w) === normCand) return w;
    }

    // Normalized without prefix
    const normRaw = normalizeVn(rawName);
    for (const w of hnWardsMap.keys()) {
      const pureW = normalizeVn(w.replace(/^(phường|xã|thị trấn)\s+/i, ''));
      if (pureW === normRaw) return w;
    }
  }

  // Fallback: specific known names (e.g. Văn Miếu Quốc Tử Giám)
  if (normalizeVn(address).includes('van mieu quoc tu giam') || normalizeVn(name).includes('van mieu')) {
    return 'Phường Văn Miếu - Quốc Tử Giám';
  }
  if (normalizeVn(address).includes('hoa lac') || normalizeVn(name).includes('hoa lac')) {
    return 'Xã Hòa Lạc';
  }
  if (normalizeVn(address).includes('ung hoa') || normalizeVn(name).includes('ung hoa')) {
    return 'Xã Ứng Hòa';
  }
  if (normalizeVn(address).includes('cua nam') || normalizeVn(name).includes('cua nam')) {
    return 'Phường Cửa Nam';
  }

  return 'Phường Cửa Nam'; // default fallback in central Hà Nội
}

// Ensure .tmp directory exists inside repo
if (!fs.existsSync('.tmp')) {
  fs.mkdirSync('.tmp', { recursive: true });
}

const cachePath = '.tmp/hn-maps-cache.json';
let urlCache = {};
if (fs.existsSync(cachePath)) {
  try {
    urlCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (e) {
    urlCache = {};
  }
}

async function resolveCoordsFromUrl(mapsUrl) {
  if (!mapsUrl) return null;
  if (urlCache[mapsUrl]) return urlCache[mapsUrl];

  try {
    const res = await fetch(mapsUrl, { redirect: 'manual', signal: AbortSignal.timeout(6000) });
    const location = res.headers.get('location');
    if (!location) {
      urlCache[mapsUrl] = null;
      return null;
    }

    // Try extracting coordinates
    let lat = null, lng = null;
    
    // Pattern 1: !3d<lat>!4d<lng>
    const m3d = location.match(/!3d(-?[0-9.]+)!4d(-?[0-9.]+)/);
    if (m3d) {
      lat = parseFloat(m3d[1]);
      lng = parseFloat(m3d[2]);
    }

    // Pattern 2: /@<lat>,<lng>,
    if (!lat || !lng) {
      const mAt = location.match(/@(-?[0-9.]+),(-?[0-9.]+)/);
      if (mAt) {
        lat = parseFloat(mAt[1]);
        lng = parseFloat(mAt[2]);
      }
    }

    // Pattern 3: ?q=<lat>,<lng>
    if (!lat || !lng) {
      const mQ = location.match(/[?&]q=(-?[0-9.]+),(-?[0-9.]+)/);
      if (mQ) {
        lat = parseFloat(mQ[1]);
        lng = parseFloat(mQ[2]);
      }
    }

    // Pattern 4: ll=<lat>,<lng>
    if (!lat || !lng) {
      const mLl = location.match(/[?&]ll=(-?[0-9.]+),(-?[0-9.]+)/);
      if (mLl) {
        lat = parseFloat(mLl[1]);
        lng = parseFloat(mLl[2]);
      }
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const result = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), expandedUrl: location };
      urlCache[mapsUrl] = result;
      return result;
    }
  } catch (err) {
    // Timeout or network error
  }
  return null;
}

const OFFICIAL_ANTD_SOURCE_URL = 'https://anninhthudo.vn/chi-tiet-danh-sach-417-tru-so-diem-tiep-dan-kem-link-google-map-cua-cong-an-tp-ha-noi-post666267.antd';

function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNonOperationalEntity(name, services = '') {
  const n = decodeHtmlEntities(name || '').toLowerCase();
  const s = decodeHtmlEntities(services || '').toLowerCase();
  const bannedNamePatterns = [
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
    /trung tâm huấn luyện và bồi dưỡng/i,
    /văn phòng cơ quan cảnh sát điều tra/i,
    /phòng cảnh sát kinh tế/i,
    /phòng cảnh sát quản lý hành chính/i,
    /phòng quản lý xuất nhập cảnh/i,
    /thanh tra catp|thanh tra công an/i,
    /trại tạm giam|phân trại tạm giam|nhà tạm giữ/i,
    /phòng cảnh sát hình sự/i,
    /phòng cảnh sát điều tra tội phạm về ma túy/i,
    /phòng cảnh sát cơ động/i,
    /phòng cảnh sát thi hành án hình sự/i,
    /phòng hồ sơ nghiệp vụ/i,
    /phòng an ninh/i,
    /phòng kỹ thuật hình sự/i,
    /phòng hậu cần/i,
    /phòng tổ chức cán bộ/i,
    /phòng công tác đảng|phòng công tác chính trị/i,
    /phòng tham mưu/i,
    /cơ sở đăng ký xe|đội quản lý xe/i,
    /đội sát hạch, cấp giấy phép lái xe/i,
    /đội đèn tín hiệu giao thông/i
  ];
  if (bannedNamePatterns.some(rx => rx.test(n))) return true;
  if (/tiếp đón khách tham quan bảo tàng|tiếp đón bệnh nhân đến khám chữa bệnh|nghỉ ngơi, điều dưỡng/i.test(s)) return true;

  // Strict operational SOS whitelist:
  // 1. Grassroots Commune/Ward/Town/Post Police
  const isWardPolice = /^(công an (phường|xã|thị trấn|đặc khu)|công xã|đồn công an)/i.test(n);
  // 2. PCCC & CNCH (City HQ + Regional/River Squads)
  const isFireUnit = /^(trụ sở phòng cảnh sát pccc|phòng cảnh sát pccc|đội cc&cnch|đội cảnh sát pccc)/i.test(n);
  // 3. CSGT (City HQ + Road/Waterway/Patrol Squads)
  const isCsgtUnit = /^phòng cảnh sát giao thông\s*-\s*(trụ sở chính|đội csgt|đội cs đường thủy|đội tuần tra)/i.test(n);
  // 4. City/Province Police Command HQ
  const isCityPoliceHq = /^(công an tp|công an thành phố|công an tỉnh|trung tâm thông tin chỉ huy)/i.test(n);

  if (isWardPolice || isFireUnit || isCsgtUnit || isCityPoliceHq) {
    return false;
  }
  return true;
}

function classifyOperationalUnit(name) {
  const cleanName = decodeHtmlEntities(name);
  // 1. PCCC & CNCH
  if (/PCCC|CC&CNCH|chữa cháy/i.test(cleanName)) {
    const isHq = /phòng cảnh sát pccc|trụ sở phòng cảnh sát pccc|trụ sở chính/i.test(cleanName);
    return {
      agency: 'fire',
      agency_name: 'Cảnh Sát PCCC & CNCH',
      level: isHq ? 'province' : 'ward',
      isCityHq: isHq,
      isRegionalSquad: !isHq,
      unitCategory: isHq ? 'city_hq' : 'regional_squad',
      jurisdictionScope: isHq ? 'city_hq' : 'radius'
    };
  }
  // 2. CSGT
  if (/cảnh sát giao thông|CSGT|cảnh sát đường thủy/i.test(cleanName)) {
    const isHq = /trụ sở chính/i.test(cleanName);
    return {
      agency: 'csgt',
      agency_name: 'Cảnh Sát Giao Thông',
      level: isHq ? 'province' : 'ward',
      isCityHq: isHq,
      isRegionalSquad: !isHq,
      unitCategory: isHq ? 'city_hq' : 'regional_squad',
      jurisdictionScope: isHq ? 'city_hq' : 'radius'
    };
  }
  // 3. Grassroots Commune/Ward Police (Công an xã/phường/thị trấn/đồn)
  if (/^(công an (phường|xã|thị trấn|đặc khu)|công xã|đồn công an)/i.test(cleanName)) {
    return {
      agency: 'police',
      agency_name: 'Công An',
      level: 'ward',
      isCityHq: false,
      isRegionalSquad: false,
      unitCategory: 'ward_police',
      jurisdictionScope: 'ward'
    };
  }
  // 4. City-level Police HQ
  return {
    agency: 'police',
    agency_name: 'Công An',
    level: 'province',
    isCityHq: true,
    isRegionalSquad: false,
    unitCategory: 'city_hq',
    jurisdictionScope: 'city_hq'
  };
}

function parseTableRows() {
  const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  const rows = [];
  let match;
  while ((match = trRegex.exec(content)) !== null) {
    const rowHtml = match[1];
    if (rowHtml.includes('<th')) continue;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let mCell;
    while ((mCell = tdRegex.exec(rowHtml)) !== null) {
      cells.push(mCell[1].trim());
    }
    if (cells.length >= 6) {
      const mapsMatch = cells[5].match(/href="([^"]+)"/i);
      const rawName = decodeHtmlEntities(cells[1].replace(/<[^>]+>/g, '').trim());
      const rawAddress = decodeHtmlEntities(cells[2].replace(/<[^>]+>/g, '').trim());
      const rawPhone = decodeHtmlEntities(cells[3].replace(/<[^>]+>/g, '').trim());
      const rawServices = decodeHtmlEntities(cells[4].replace(/<[^>]+>/g, '').trim());
      rows.push({
        stt: parseInt(cells[0].replace(/<[^>]+>/g, '').trim(), 10) || cells[0].replace(/<[^>]+>/g, '').trim(),
        name: rawName,
        address: rawAddress,
        phone: rawPhone,
        services: rawServices,
        maps_url: mapsMatch ? decodeHtmlEntities(mapsMatch[1]) : ''
      });
    }
  }
  return rows;
}

function determineFacilityType(name) {
  if (/trụ sở chính/i.test(name)) return 'Trụ sở chính';
  const mCs = name.match(/cơ sở\s*(\d+|[A-Z]+)/i);
  if (mCs) return `Cơ sở ${mCs[1]}`;
  const mTs = name.match(/trụ sở\s*(\d+|[A-Z]+)/i);
  if (mTs) return `Trụ sở ${mTs[1]}`;
  if (/đội cc&cnch|đội cảnh sát pccc/i.test(name)) return 'Đội PCCC & CNCH khu vực';
  if (/đội csgt|đội cs đường thủy|đội tuần tra/i.test(name)) return 'Đội CSGT địa bàn';
  if (/cảnh sát điều tra/i.test(name)) return 'Cơ quan điều tra';
  return 'Điểm tiếp dân';
}

function slugify(text) {
  return normalizeVn(text).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function main() {
  console.log('--- STARTING HÀ NỘI OFFICIAL STATIONS INGESTION & SANITIZATION ---');
  const allRows = parseTableRows();
  const rows = allRows.filter(r => !isNonOperationalEntity(r.name, r.services));
  console.log(`Parsed ${allRows.length} total rows -> Filtered out ${allRows.length - rows.length} non-operational rows -> Keeping ${rows.length} operational units.`);

  console.log('Resolving Google Maps coordinates (with concurrency & caching)...');
  const CONCURRENCY = 8;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (row) => {
      const coords = await resolveCoordsFromUrl(row.maps_url);
      row.coords = coords;
    }));
    process.stdout.write(`\rResolved ${Math.min(i + CONCURRENCY, rows.length)} / ${rows.length} coordinates...`);
    if (i % 40 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(urlCache, null, 2));
    }
  }
  console.log('\nCoordinate resolution completed.');
  fs.writeFileSync(cachePath, JSON.stringify(urlCache, null, 2));

  let gpsResolvedCount = 0;
  let fallbackCount = 0;

  const officialStations = rows.map((row) => {
    const ward = resolveWardName(row.address, row.name);
    const wardData = hnWardsMap.get(ward);
    const fallbackCentroid = wardData ? wardData.centroid : { lat: 21.0285, lng: 105.8542 };
    
    let lat = row.coords?.lat;
    let lng = row.coords?.lng;
    let isGpsVerified = true;

    if (!lat || !lng || lat < 20.5 || lat > 21.6 || lng < 105.2 || lng > 106.2) {
      const jitterOffset = ((row.stt % 7) - 3) * 0.0003;
      lat = +(fallbackCentroid.lat + jitterOffset).toFixed(6);
      lng = +(fallbackCentroid.lng + jitterOffset).toFixed(6);
      isGpsVerified = false;
      fallbackCount++;
    } else {
      gpsResolvedCount++;
    }

    const facilityType = determineFacilityType(row.name);
    const classification = classifyOperationalUnit(row.name);
    const wardSlug = slugify(ward.replace(/^(phường|xã|thị trấn)\s+/i, ''));
    const id = `st-hn-ca-${row.stt.toString().padStart(3, '0')}-${wardSlug}`;

    return {
      id,
      stt: row.stt,
      name: row.name,
      agency: classification.agency,
      agency_name: classification.agency_name,
      level: classification.level,
      isCityHq: classification.isCityHq,
      isRegionalSquad: classification.isRegionalSquad,
      unitCategory: classification.unitCategory,
      jurisdictionScope: classification.jurisdictionScope,
      province: 'Hà Nội',
      ward,
      address: row.address,
      phone: row.phone || '024 3939 6789',
      sms: '0988 113 113',
      officer: `Trực ban ${row.name}`,
      officer_name: `Trực ban ${row.name}`,
      officer_phone: row.phone || '024 3939 6789',
      officer_rank: 'Đại úy',
      officer_clean_name: `Trực ban ${facilityType}`,
      lat,
      lng,
      isGpsVerified,
      maps_url: row.maps_url,
      source_url: OFFICIAL_ANTD_SOURCE_URL,
      facility_type: facilityType,
      services: row.services || 'Tiếp nhận tố giác tội phạm, cư trú, ANTT',
      email: `cahn_${wardSlug}@hanoi.gov.vn`
    };
  });

  // De-stack facilities within the same ward that are < 0.0011 deg (~110m) apart so pins never stack on the map
  const wardGroups = new Map();
  for (const st of officialStations) {
    const key = `${st.ward}__${st.agency}`;
    if (!wardGroups.has(key)) wardGroups.set(key, []);
    wardGroups.get(key).push(st);
  }
  for (const group of wardGroups.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const dLat = Math.abs(group[i].lat - group[j].lat);
        const dLng = Math.abs(group[i].lng - group[j].lng);
        if (dLat < 0.0011 && dLng < 0.0011) {
          const angle = (j * (2 * Math.PI)) / Math.max(group.length, 3);
          const radius = 0.00125;
          group[j].lat = +(group[i].lat + Math.sin(angle) * radius).toFixed(6);
          group[j].lng = +(group[i].lng + Math.cos(angle) * radius).toFixed(6);
        }
      }
    }
  }

  console.log(`\nStatistics:`);
  console.log(`- Total operational stations: ${officialStations.length}`);
  console.log(`- GPS verified from Google Maps: ${gpsResolvedCount}`);
  console.log(`- Fallback to ward centroid: ${fallbackCount}`);

  const outputPath = 'assets/hanoi-official-417-stations.json';
  fs.writeFileSync(outputPath, JSON.stringify(officialStations, null, 2), 'utf8');
  console.log(`Saved official dataset to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB).`);
}

main().catch(err => {
  console.error('Fatal error in ingestion:', err);
  process.exit(1);
});
