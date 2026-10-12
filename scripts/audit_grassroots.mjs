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
stations.forEach(st => {
  const w = normWard(st.ward);
  if (!w || w.includes('toan thanh pho') || w.includes('toan tinh') || w.includes('toan quoc') || st.level === 'province' || st.level === 'national') return;
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
      const targetFeature = wardGeo.features.find(f => {
        const fw = normWard(f.properties?.ward || '');
        const fp = normProv(f.properties?.province || '');
        return (fp === stCleanP || fp.includes(stCleanP) || stCleanP.includes(fp)) && (fw === stCleanW || fw.includes(stCleanW) || stCleanW.includes(fw));
      });
      mismatches.push({
        id: st.id,
        name: st.name,
        province: st.province,
        declaredWard: st.ward,
        gpsHitWard: matchedGpsWard.properties?.ward,
        hasTargetPolygon: !!targetFeature,
        targetPolygonWard: targetFeature?.properties?.ward,
        lat: st.lat,
        lng: st.lng
      });
    }
  }
});

console.log('Total grass-roots ward mismatches:', mismatches.length);
mismatches.forEach((m, idx) => {
  console.log(`${idx + 1}. [${m.province}] ${m.name}`);
  console.log(`   Declared Ward: "${m.declaredWard}" -> GPS Hit: "${m.gpsHitWard}" | Target Polygon: "${m.targetPolygonWard || 'NOT FOUND'}"`);
});
