import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.resolve('Reports/qa/playwright');
fs.mkdirSync(REPORT_DIR, { recursive: true });

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

async function run() {
  // Citizen location in TP.HCM (e.g., 10.7680, 106.6620)
  // Công An Phường Minh Phụng is at (10.75774, 106.65059) -> expected distance ~ 1.69 km (NOT 0.26 km from ward centroid)
  const citizenCoords = { latitude: 10.7680, longitude: 106.6620 };
  const minhPhungStationCoords = { latitude: 10.75774, longitude: 106.65059 };
  const expectedDistKm = haversineKm(
    citizenCoords.latitude,
    citizenCoords.longitude,
    minhPhungStationCoords.latitude,
    minhPhungStationCoords.longitude
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    geolocation: citizenCoords,
    permissions: ['geolocation']
  });
  const page = await context.newPage();

  // Seed citizen GPS in localStorage as well
  await page.addInitScript((coords) => {
    localStorage.setItem(
      'sos_citizen_last_gps',
      JSON.stringify({ lat: coords.latitude, lng: coords.longitude, updatedAt: Date.now() })
    );
  }, citizenCoords);

  await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);

  // Trigger selectAndHighlightWard or showWardHud for Phường Minh Phụng, TP. Hồ Chí Minh
  const evalResult = await page.evaluate(async (coords) => {
    // Hide gatekeeper / login overlays so map and HUD are visible in screenshot
    document.body.classList.add('officer-authenticated');
    document.querySelectorAll('.auth-gate-backdrop, #cyberGatekeeperModal, #securityGatekeeperOverlay, #dispatcherLoginModal, #officerDutyDeclarationModal, #substituteOfficerModal').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    const disp = window.dispatcherApp || window.dispatcher;
    if (!disp) {
      return { ok: false, error: 'Missing window.dispatcherApp' };
    }

    // Ensure stations list is loaded
    if ((!disp.stationsList || !disp.stationsList.length) && typeof disp.loadStationsDirectory === 'function') {
      await disp.loadStationsDirectory();
    }

    // Ensure citizen marker / reference coords are set to the citizen's coordinates
    if (disp.mapController && typeof disp.mapController.setCitizenMarker === 'function') {
      disp.mapController.setCitizenMarker(coords.latitude, coords.longitude, 'Vị trí Người dân', false);
    } else if (disp.mapController) {
      disp.mapController.citizenCoords = { lat: coords.latitude, lng: coords.longitude };
    }

    if (typeof disp.selectAndHighlightWard === 'function') {
      await disp.selectAndHighlightWard('Phường Minh Phụng');
    } else {
      const q = new URLSearchParams({
        ward: 'Phường Minh Phụng',
        province: 'TP. Hồ Chí Minh'
      });
      const res = await fetch(`/api/geo/locate-ward?${q.toString()}`);
      const data = await res.json();
      if (data?.boundary) {
        disp.showWardHud(data.boundary);
      }
    }
    await new Promise(r => setTimeout(r, 800));

    const hud = document.getElementById('tacticalWardGeofenceHud');
    const rightPopups = document.querySelectorAll('.cantho-official-station-popup, .maplibregl-popup');
    const nearestBadge = document.querySelector('#hudWardMultiFacilityContainer .nearest-facility-badge');
    const multiText = document.getElementById('hudWardMultiFacilityContainer')?.innerText || '';
    const unitTitle = document.getElementById('hudWardUnitTitle')?.innerText || '';
    const gmapsHref = document.getElementById('hudGmapsBtn')?.getAttribute('href') || '';

    return {
      ok: true,
      leftHudVisible: Boolean(hud && getComputedStyle(hud).display !== 'none'),
      rightPopupCount: rightPopups.length,
      unitTitle,
      nearestBadgeText: nearestBadge ? nearestBadge.innerText.trim() : '',
      multiText,
      gmapsHref,
      wardCenter: disp._lastWardHudFeature?.properties?.center || null
    };
  }, citizenCoords);

  await page.waitForTimeout(1200);
  const screenshotPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await browser.close();

  const expectedBadgeSubstring = `${expectedDistKm} km`;
  const passedSinglePanel = evalResult.ok && evalResult.leftHudVisible && evalResult.rightPopupCount === 0;
  const passedCitizenDistance =
    evalResult.ok &&
    evalResult.nearestBadgeText.includes(expectedBadgeSubstring) &&
    !evalResult.nearestBadgeText.includes('0.26 km');

  const report = {
    timestamp: new Date().toISOString(),
    feature: 'Single Left Ward HUD Panel & Citizen-to-Station Distance Calculation',
    citizenCoords,
    minhPhungStationCoords,
    expectedDistKm,
    passedSinglePanel,
    passedCitizenDistance,
    overallStatus: passedSinglePanel && passedCitizenDistance ? 'PASS' : 'FAIL',
    evalResult,
    screenshotPath
  };

  const jsonPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.json');
  const mdPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  const md = [
    '# QA Report — Single Left Ward HUD & Citizen-to-Station Distance',
    '',
    `- **Timestamp**: ${report.timestamp}`,
    `- **Overall Status**: **${report.overallStatus}**`,
    `- **Left HUD Visible**: \`${evalResult.leftHudVisible}\``,
    `- **Redundant Right Map Popup Count**: \`${evalResult.rightPopupCount}\` (Expected: \`0\`)`,
    `- **Citizen Coordinates**: \`${citizenCoords.latitude}, ${citizenCoords.longitude}\``,
    `- **Station Coordinates (Công An Phường Minh Phụng)**: \`${minhPhungStationCoords.latitude}, ${minhPhungStationCoords.longitude}\``,
    `- **Expected Citizen-to-Station Distance**: \`${expectedDistKm} km\` (Previously \`0.26 km\` from ward center)`,
    `- **Actual Nearest Facility Badge**: \`${evalResult.nearestBadgeText}\``,
    `- **Google Maps Directions URL**: \`${evalResult.gmapsHref}\``,
    `- **Screenshot**: \`${screenshotPath}\``
  ].join('\n');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(JSON.stringify(report, null, 2));
  if (report.overallStatus !== 'PASS') {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
