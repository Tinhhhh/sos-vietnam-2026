const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(urlPath, options = {}) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    headers: { 'User-Agent': UA, ...(options.headers || {}) },
    ...options
  });
  return await res.json();
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalStations: 0,
    hanoiTotalStations: 0,
    hanoiPoliceStations: 0,
    apiChecks: {},
    uiChecks: {},
    screenshots: [],
    allPassed: false
  };

  const assertions = [];

  console.log('--- 1. API DIRECTORY CHECKS ---');
  // Load stations directory
  const rawStations = await fetchJson('/assets/vn-stations-directory.json');
  const stations = Array.isArray(rawStations) ? rawStations : (rawStations.stations || []);
  report.totalStations = stations.length;

  const hanoiStations = stations.filter(s => s.province === 'Hà Nội');
  report.hanoiTotalStations = hanoiStations.length;

  const hanoiPolice = hanoiStations.filter(s => s.agency === 'police' && s.level === 'ward');
  report.hanoiPoliceStations = hanoiPolice.length;

  assertions.push({
    name: 'Directory total stations >= 900',
    pass: report.totalStations >= 900,
    actual: report.totalStations
  });

  assertions.push({
    name: 'Hanoi total facilities >= 430',
    pass: report.hanoiTotalStations >= 430,
    actual: report.hanoiTotalStations
  });

  assertions.push({
    name: 'Hanoi ward police facilities >= 417',
    pass: report.hanoiPoliceStations >= 417,
    actual: report.hanoiPoliceStations
  });

  // Check Ba Đình facilities
  const baDinhStations = hanoiStations.filter(s => s.ward === 'Phường Ba Đình');
  const hasBaDinhTruSoChinh = baDinhStations.some(s => s.facility_type === 'Trụ sở chính' && s.address.includes('Điện Biên Phủ'));
  const hasBaDinhCoSo4 = baDinhStations.some(s => s.facility_type === 'Cơ sở 4' && s.address.includes('Quán Thánh'));
  assertions.push({
    name: 'Phường Ba Đình has exactly 2 facilities (Trụ sở chính & Cơ sở 4)',
    pass: baDinhStations.length === 2 && hasBaDinhTruSoChinh && hasBaDinhCoSo4,
    actual: { count: baDinhStations.length, names: baDinhStations.map(s => s.name) }
  });

  // Check Bạch Mai facilities
  const bachMaiStations = hanoiStations.filter(s => s.ward === 'Phường Bạch Mai');
  assertions.push({
    name: 'Phường Bạch Mai has exactly 5 distinct facilities',
    pass: bachMaiStations.length === 5,
    actual: { count: bachMaiStations.length, facilities: bachMaiStations.map(s => s.facility_type) }
  });

  // Check Google Maps URLs validity
  const stationsWithMaps = hanoiStations.filter(s => s.maps_url && (s.maps_url.startsWith('https://maps.app.goo.gl/') || s.maps_url.startsWith('https://www.google.com/maps/')));
  assertions.push({
    name: 'All Hanoi 417 stations have valid Google Maps URLs',
    pass: stationsWithMaps.length >= 417,
    actual: stationsWithMaps.length
  });

  console.log('--- 2. NEAREST FACILITY DISPATCH API CHECKS ---');
  // Dispatch Case A: Citizen near 116 Quán Thánh (lat: 21.042397, lng: 105.843138)
  const sosQuanThanh = await fetchJson('/api/sos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emergencyType: 'police',
      name: 'Người dân gần Quán Thánh',
      phone: '0987654321',
      lat: 21.042397,
      lng: 105.843138,
      address: 'Gần 116 phố Quán Thánh, Ba Đình, Hà Nội'
    })
  });

  const unitA = sosQuanThanh?.incident?.assignedUnit;
  const unitAPass = unitA &&
    unitA.id === 'st-hn-ca-005-ba-dinh' &&
    unitA.facility_type === 'Cơ sở 4' &&
    unitA.isNearestFacilityInWard === true &&
    Array.isArray(unitA.wardFacilities) &&
    unitA.wardFacilities.length === 2 &&
    unitA.wardFacilities[0].id === 'st-hn-ca-005-ba-dinh';

  assertions.push({
    name: 'Dispatch near Quán Thánh selects Cơ sở 4 as nearest facility',
    pass: Boolean(unitAPass),
    actual: {
      selectedId: unitA?.id,
      selectedFacility: unitA?.facility_type,
      selectedAddress: unitA?.address,
      wardFacilitiesCount: unitA?.wardFacilities?.length,
      firstInList: unitA?.wardFacilities?.[0]?.name
    }
  });

  // Dispatch Case B: Citizen near 37 Điện Biên Phủ (lat: 21.0331, lng: 105.8384)
  const sosDienBienPhu = await fetchJson('/api/sos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emergencyType: 'police',
      name: 'Người dân gần Điện Biên Phủ',
      phone: '0912345678',
      lat: 21.0331,
      lng: 105.8384,
      address: 'Gần 37 Điện Biên Phủ, Ba Đình, Hà Nội'
    })
  });

  const unitB = sosDienBienPhu?.incident?.assignedUnit;
  const unitBPass = unitB &&
    unitB.id === 'st-hn-ca-004-ba-dinh' &&
    unitB.facility_type === 'Trụ sở chính' &&
    unitB.isNearestFacilityInWard === true &&
    Array.isArray(unitB.wardFacilities) &&
    unitB.wardFacilities.length === 2 &&
    unitB.wardFacilities[0].id === 'st-hn-ca-004-ba-dinh';

  assertions.push({
    name: 'Dispatch near Điện Biên Phủ selects Trụ sở chính as nearest facility',
    pass: Boolean(unitBPass),
    actual: {
      selectedId: unitB?.id,
      selectedFacility: unitB?.facility_type,
      selectedAddress: unitB?.address,
      wardFacilitiesCount: unitB?.wardFacilities?.length,
      firstInList: unitB?.wardFacilities?.[0]?.name
    }
  });

  report.apiChecks = {
    sosQuanThanh: unitA,
    sosDienBienPhu: unitB
  };

  console.log('--- 3. BROWSER UI MULTI-FACILITY MAP RENDERING ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: UA
  });

  const page = await context.newPage();
  page.on('pageerror', (err) => console.error('PAGE_ERROR:', err.message));

  await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.dispatcher || window.dispatcherApp), { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Authenticate dispatcher session if needed
  await page.evaluate(() => {
    const app = window.dispatcher || window.dispatcherApp;
    if (app && !app.currentOfficer) {
      app.currentOfficer = {
        username: 'admin',
        agency: 'all',
        level: 'national',
        agencyName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
        unitName: 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
        province: 'Hà Nội',
        ward: 'Toàn Quốc',
        officerRank: 'Đại tướng',
        officerName: 'Chỉ Huy Tác Chiến Quốc Gia'
      };
      document.body.classList.add('officer-authenticated');
    }
  });

  // UI Check 1: Render Phường Ba Đình (2 facilities)
  const baDinhUiResult = await page.evaluate(async () => {
    const app = window.dispatcher || window.dispatcherApp;
    const mc = app?.mapController;
    if (!mc) return { error: 'No mapController' };

    // Find ward feature for Phường Ba Đình
    const wardFeature = {
      properties: {
        ward: 'Phường Ba Đình',
        province: 'Hà Nội',
        ten_xa: 'Phường Ba Đình',
        ten_tinh: 'Hà Nội',
        trungTamHanhChinh: '37 Điện Biên Phủ, Ba Đình, Hà Nội'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[105.83, 21.03], [105.85, 21.03], [105.85, 21.05], [105.83, 21.05], [105.83, 21.03]]]
      }
    };

    mc.showWardStationPin(wardFeature);

    // Wait a brief moment for DOM elements to mount
    await new Promise(r => setTimeout(r, 600));

    const primaryPin = document.querySelector('.active-ward-reveal-pin');
    const auxPins = document.querySelectorAll('.auxiliary-ward-pin');
    const popup = document.querySelector('.cantho-official-station-popup');
    const popupHtml = popup ? popup.innerHTML : '';

    return {
      primaryPinFound: Boolean(primaryPin),
      primaryPinText: primaryPin ? primaryPin.textContent.trim().replace(/\s+/g, ' ') : null,
      auxPinsCount: auxPins.length,
      auxPinsText: Array.from(auxPins).map(p => p.textContent.trim().replace(/\s+/g, ' ')),
      popupFound: Boolean(popup),
      popupHasFacilityBadge: popupHtml.includes('Trụ sở chính') || popupHtml.includes('Cơ sở'),
      popupHasGmapsLink: popupHtml.includes('maps.app.goo.gl') || popupHtml.includes('Bản đồ Google Maps'),
      popupHasOtherFacilitiesList: popupHtml.includes('Toàn bộ cơ sở thuộc địa bàn') || popupHtml.includes('Danh sách')
    };
  });

  const ssBaDinhPath = path.join(SCREENSHOT_DIR, 'hanoi-ba-dinh-multi-facility.png');
  await page.screenshot({ path: ssBaDinhPath });
  report.screenshots.push(ssBaDinhPath);

  assertions.push({
    name: 'UI renders both primary pin and auxiliary pin for Phường Ba Đình',
    pass: baDinhUiResult.primaryPinFound && baDinhUiResult.auxPinsCount === 1,
    actual: baDinhUiResult
  });

  assertions.push({
    name: 'UI popup for Phường Ba Đình contains Google Maps link and multi-facility directory',
    pass: baDinhUiResult.popupFound && baDinhUiResult.popupHasGmapsLink && baDinhUiResult.popupHasOtherFacilitiesList,
    actual: {
      popupHasGmapsLink: baDinhUiResult.popupHasGmapsLink,
      popupHasOtherFacilitiesList: baDinhUiResult.popupHasOtherFacilitiesList
    }
  });

  // UI Check 2: Render Phường Bạch Mai (5 facilities)
  const bachMaiUiResult = await page.evaluate(async () => {
    const app = window.dispatcher || window.dispatcherApp;
    const mc = app?.mapController;
    if (!mc) return { error: 'No mapController' };

    const wardFeature = {
      properties: {
        ward: 'Phường Bạch Mai',
        province: 'Hà Nội',
        ten_xa: 'Phường Bạch Mai',
        ten_tinh: 'Hà Nội',
        trungTamHanhChinh: '201 Minh Khai, Bạch Mai, Hà Nội'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[105.84, 20.99], [105.86, 20.99], [105.86, 21.01], [105.84, 21.01], [105.84, 20.99]]]
      }
    };

    mc.showWardStationPin(wardFeature);
    await new Promise(r => setTimeout(r, 600));

    const primaryPin = document.querySelector('.active-ward-reveal-pin');
    const auxPins = document.querySelectorAll('.auxiliary-ward-pin');
    const popup = document.querySelector('.cantho-official-station-popup');
    const popupHtml = popup ? popup.innerHTML : '';

    return {
      primaryPinFound: Boolean(primaryPin),
      primaryPinText: primaryPin ? primaryPin.textContent.trim().replace(/\s+/g, ' ') : null,
      auxPinsCount: auxPins.length,
      auxPinsText: Array.from(auxPins).map(p => p.textContent.trim().replace(/\s+/g, ' ')),
      popupFound: Boolean(popup),
      popupHasFacilityBadge: popupHtml.includes('Trụ sở chính') || popupHtml.includes('Cơ sở'),
      popupHasOtherFacilitiesList: popupHtml.includes('Toàn bộ cơ sở thuộc địa bàn') || popupHtml.includes('Danh sách')
    };
  });

  const ssBachMaiPath = path.join(SCREENSHOT_DIR, 'hanoi-bach-mai-5-facilities.png');
  await page.screenshot({ path: ssBachMaiPath });
  report.screenshots.push(ssBachMaiPath);

  assertions.push({
    name: 'UI renders 1 primary pin + 4 auxiliary pins (5 total) for Phường Bạch Mai',
    pass: bachMaiUiResult.primaryPinFound && bachMaiUiResult.auxPinsCount === 4,
    actual: bachMaiUiResult
  });

  // UI Check 3: Clear ward pins cleanly
  const clearPinsResult = await page.evaluate(() => {
    const app = window.dispatcher || window.dispatcherApp;
    const mc = app?.mapController;
    if (!mc) return { error: 'No mapController' };

    mc.clearActiveWardPin();

    const remainingPrimary = document.querySelectorAll('.active-ward-reveal-pin');
    const remainingAux = document.querySelectorAll('.auxiliary-ward-pin');
    return {
      primaryRemaining: remainingPrimary.length,
      auxRemaining: remainingAux.length
    };
  });

  assertions.push({
    name: 'clearActiveWardPin cleans up both primary and auxiliary pins without ghost markers',
    pass: clearPinsResult.primaryRemaining === 0 && clearPinsResult.auxRemaining === 0,
    actual: clearPinsResult
  });

  report.uiChecks = {
    baDinhUiResult,
    bachMaiUiResult,
    clearPinsResult
  };

  await browser.close();

  // Final evaluation
  report.allPassed = assertions.every(a => a.pass);

  // Write JSON report
  const jsonReportPath = path.join(REPORT_DIR, 'verify-hanoi-417-multi-facility-nearest.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');

  // Write Markdown report
  const mdReportPath = path.join(REPORT_DIR, 'verify-hanoi-417-multi-facility-nearest.md');
  const mdContent = [
    '# Hanoi 417 Police Stations & Multi-Facility Nearest Dispatch Verification Report',
    '',
    `- **Timestamp**: \`${report.timestamp}\``,
    `- **Overall Status**: **${report.allPassed ? 'PASS' : 'FAIL'}**`,
    `- **Total Nationwide Stations**: \`${report.totalStations}\``,
    `- **Total Hanoi Facilities**: \`${report.hanoiTotalStations}\` (${report.hanoiPoliceStations} ward police stations + specialized units)`,
    '',
    '## Verification Summary',
    'This test verifies the integration of all 417 official headquarters and citizen reception facilities of Công an TP Hà Nội, ensuring multi-facility ward rendering and automated nearest-facility dispatch.',
    '',
    '## Assertions',
    ...assertions.map(a => `- [${a.pass ? 'x' : ' '}] **${a.pass ? 'PASS' : 'FAIL'}**: ${a.name}`),
    '',
    '## Nearest Facility Dispatch Verification (API)',
    '### Case A: Citizen Near 116 Quán Thánh (Ba Đình)',
    '```json',
    JSON.stringify(report.apiChecks.sosQuanThanh, null, 2),
    '```',
    '',
    '### Case B: Citizen Near 37 Điện Biên Phủ (Ba Đình)',
    '```json',
    JSON.stringify(report.apiChecks.sosDienBienPhu, null, 2),
    '```',
    '',
    '## Multi-Facility Map UI Verification',
    '### Phường Ba Đình (2 Facilities: Trụ sở chính + Cơ sở 4)',
    '```json',
    JSON.stringify(report.uiChecks.baDinhUiResult, null, 2),
    '```',
    '',
    '### Phường Bạch Mai (5 Facilities: Trụ sở chính + Cơ sở 2, 3, 4, 5)',
    '```json',
    JSON.stringify(report.uiChecks.bachMaiUiResult, null, 2),
    '```',
    '',
    '## Artifact Screenshots',
    `- [Ba Đình Multi-Facility View](file:///${ssBaDinhPath.replace(/\\/g, '/')})`,
    `- [Bạch Mai 5 Facilities View](file:///${ssBachMaiPath.replace(/\\/g, '/')})`
  ].join('\n');

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');

  console.log('--- TEST RUN RESULTS ---');
  console.log(JSON.stringify({ allPassed: report.allPassed, assertions }, null, 2));

  if (!report.allPassed) {
    process.exit(1);
  }
})();
