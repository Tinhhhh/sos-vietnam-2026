import fs from 'fs';

const rawWards = fs.readFileSync('assets/vn-wards-simplified.geojson', 'utf-8');
const wardGeo = JSON.parse(rawWards);
const rawStations = fs.readFileSync('assets/vn-stations-directory.json', 'utf-8');
const stationsData = JSON.parse(rawStations);
const stations = stationsData.stations || stationsData;

function removeVietnameseTones(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
const normWard = (s) => removeVietnameseTones(s || '').toLowerCase().trim().replace(/^(phuong|xa|thi tran|p\.|x\.|tt\.)\s*/i, '').trim();
const normProv = (s) => removeVietnameseTones(s || '').toLowerCase().trim().replace(/^(thanh pho|tinh|tp\.)\s*/i, '').trim();

function isPointInRing(point, ring) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInFeature(point, feature) {
  if (!feature || !feature.geometry) return false;
  const geom = feature.geometry;
  if (geom.type === 'Polygon') {
    if (!isPointInRing(point, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (isPointInRing(point, geom.coordinates[i])) return false;
    }
    return true;
  }
  if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      if (isPointInRing(point, polygon[0])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (isPointInRing(point, polygon[i])) { inHole = true; break; }
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

const mismatches = [];
const noGpsPolygons = [];

stations.forEach(st => {
  if (!st.ward || st.level === 'province' || st.level === 'national') return;
  const pt = [st.lng, st.lat];
  const stCleanW = normWard(st.ward);
  const stCleanP = normProv(st.province);

  let matchedGpsWard = null;
  for (const f of wardGeo.features) {
    if (isPointInFeature(pt, f)) {
      matchedGpsWard = f;
      break;
    }
  }

  if (matchedGpsWard) {
    const matchedCleanW = normWard(matchedGpsWard.properties?.ward || '');
    const matchedCleanP = normProv(matchedGpsWard.properties?.province || '');
    if (matchedCleanW !== stCleanW && (matchedCleanP === stCleanP || !stCleanP)) {
      mismatches.push({
        id: st.id,
        name: st.name,
        province: st.province,
        stationWard: st.ward,
        matchedWard: matchedGpsWard.properties?.ward,
        coords: [st.lat, st.lng],
        address: st.address
      });
    }
  } else {
    noGpsPolygons.push({
      id: st.id,
      name: st.name,
      province: st.province,
      stationWard: st.ward,
      coords: [st.lat, st.lng]
    });
  }
});

console.log('=== AUDIT RESULTS: STATION GPS VS WARD BOUNDARY ===');
console.log('Total grass-roots stations checked:', stations.filter(s => s.ward && s.level !== 'province' && s.level !== 'national').length);
console.log('Total mismatches (Station is in Ward A, but GPS hits Polygon Ward B):', mismatches.length);
console.log('Total stations with GPS outside any polygon in file:', noGpsPolygons.length);

console.log('\n--- DETAILED MISMATCH LIST (First 40) ---');
mismatches.slice(0, 40).forEach((m, idx) => {
  console.log(`${idx + 1}. [${m.province}] ${m.name}`);
  console.log(`   Ward khai báo: "${m.stationWard}" -> Polygon bị nhận nhầm: "${m.matchedWard}"`);
  console.log(`   Tọa độ: ${m.coords} | Địa chỉ: ${m.address}\n`);
});
