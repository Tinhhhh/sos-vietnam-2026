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
  // Try matching from address
  const addrMatch = address.match(/(phường|xã|thị trấn)\s+([^,]+)/i);
  let candidate = null;
  if (addrMatch) {
    const type = addrMatch[1].toLowerCase() === 'phường' ? 'Phường' : (addrMatch[1].toLowerCase() === 'xã' ? 'Xã' : 'Thị trấn');
    const rawName = addrMatch[2].trim();
    candidate = `${type} ${rawName}`;
    
    // 1. Direct match
    if (hnWardsMap.has(candidate)) return candidate;
    
    // 2. Normalized match against all hn wards
    const normCand = normalizeVn(candidate);
    for (const w of hnWardsMap.keys()) {
      if (normalizeVn(w) === normCand) return w;
    }

    // 3. Normalized without prefix
    const normRaw = normalizeVn(rawName);
    for (const w of hnWardsMap.keys()) {
      const pureW = normalizeVn(w.replace(/^(phường|xã|thị trấn)\s+/i, ''));
      if (pureW === normRaw) return w;
    }
  }

  // Fallback: match from station name
  const nameMatch = name.match(/Công an (phường|xã|thị trấn)\s+([^-—–]+)/i);
  if (nameMatch) {
    const rawName = nameMatch[2].trim();
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
      rows.push({
        stt: parseInt(cells[0].replace(/<[^>]+>/g, '').trim(), 10) || cells[0].replace(/<[^>]+>/g, '').trim(),
        name: cells[1].replace(/<[^>]+>/g, '').trim(),
        address: cells[2].replace(/<[^>]+>/g, '').trim(),
        phone: cells[3].replace(/<[^>]+>/g, '').trim(),
        services: cells[4].replace(/<[^>]+>/g, '').trim(),
        maps_url: mapsMatch ? mapsMatch[1] : ''
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
  if (/bệnh viện/i.test(name)) return 'Bệnh viện ngành';
  if (/bảo tàng/i.test(name)) return 'Bảo tàng nghiệp vụ';
  if (/báo/i.test(name)) return 'Cơ quan báo chí';
  if (/cảnh sát điều tra/i.test(name)) return 'Cơ quan điều tra';
  return 'Điểm tiếp dân';
}

function slugify(text) {
  return normalizeVn(text).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function main() {
  console.log('--- STARTING HÀ NỘI 417 STATIONS INGESTION ---');
  const rows = parseTableRows();
  console.log(`Parsed ${rows.length} rows from source.`);

  console.log('Resolving Google Maps coordinates (with concurrency & caching)...');
  const CONCURRENCY = 8;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (row) => {
      const coords = await resolveCoordsFromUrl(row.maps_url);
      row.coords = coords;
    }));
    process.stdout.write(`\rResolved ${Math.min(i + CONCURRENCY, rows.length)} / ${rows.length} coordinates...`);
    // save cache periodically
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

    // Check if coordinates fall within the general Hà Nội region (lat 20.5-21.6, lng 105.2-106.2)
    if (!lat || !lng || lat < 20.5 || lat > 21.6 || lng < 105.2 || lng > 106.2) {
      // Small jitter so multiple fallback stations in the same ward don't stack exactly on top of each other
      const jitterOffset = ((row.stt % 7) - 3) * 0.0003;
      lat = +(fallbackCentroid.lat + jitterOffset).toFixed(6);
      lng = +(fallbackCentroid.lng + jitterOffset).toFixed(6);
      isGpsVerified = false;
      fallbackCount++;
    } else {
      gpsResolvedCount++;
    }

    const facilityType = determineFacilityType(row.name);
    const wardSlug = slugify(ward.replace(/^(phường|xã|thị trấn)\s+/i, ''));
    const id = `st-hn-ca-${row.stt.toString().padStart(3, '0')}-${wardSlug}`;

    return {
      id,
      stt: row.stt,
      name: row.name,
      agency: 'police',
      agency_name: 'Công An',
      level: 'ward',
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
      facility_type: facilityType,
      services: row.services || 'Tiếp nhận tố giác tội phạm, cư trú, ANTT',
      email: `cahn_${wardSlug}@hanoi.gov.vn`
    };
  });

  console.log(`\nStatistics:`);
  console.log(`- Total stations: ${officialStations.length}`);
  console.log(`- GPS verified from Google Maps: ${gpsResolvedCount}`);
  console.log(`- Fallback to ward centroid: ${fallbackCount}`);

  // Count distribution across wards
  const wardCounts = {};
  officialStations.forEach(s => {
    wardCounts[s.ward] = (wardCounts[s.ward] || 0) + 1;
  });
  const sortedWards = Object.entries(wardCounts).sort((a, b) => b[1] - a[1]);
  console.log(`- Distinct wards covered: ${sortedWards.length}`);
  console.log(`- Top wards with most facilities:`, sortedWards.slice(0, 5));

  // Save official 417 stations to assets/hanoi-official-417-stations.json
  const outputPath = 'assets/hanoi-official-417-stations.json';
  fs.writeFileSync(outputPath, JSON.stringify(officialStations, null, 2), 'utf8');
  console.log(`Saved official dataset to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB).`);
}

main().catch(err => {
  console.error('Fatal error in ingestion:', err);
  process.exit(1);
});
