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
  // Device GPS location (e.g., Thủ Dầu Một / Bình Dương area: 11.0350, 106.6750)
  // Công An Phường Bình Dương is at (11.0503399, 106.6836829) -> expected distance ~ 1.95 km from device GPS
  const deviceCoords = { latitude: 11.0350, longitude: 106.6750 };
  const binhDuongStationCoords = { latitude: 11.0503399, longitude: 106.6836829 };
  const expectedDistKm = haversineKm(
    deviceCoords.latitude,
    deviceCoords.longitude,
    binhDuongStationCoords.latitude,
    binhDuongStationCoords.longitude
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    geolocation: deviceCoords,
    permissions: ['geolocation']
  });
  const page = await context.newPage();

  // Seed device GPS in localStorage
  await page.addInitScript((coords) => {
    localStorage.setItem(
      'sos_dispatcher_current_gps',
      JSON.stringify({ lat: coords.latitude, lng: coords.longitude, timestamp: Date.now() })
    );
    localStorage.setItem(
      'sos_citizen_last_gps',
      JSON.stringify({ lat: coords.latitude, lng: coords.longitude, updatedAt: Date.now() })
    );
  }, deviceCoords);

  await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Check Gatekeeper Warning Icon Alignment & capture Gatekeeper screenshot
  const gatekeeperCheck = await page.evaluate(() => {
    const modal = document.getElementById('cyberGatekeeperModal');
    if (!modal) return { found: false };
    modal.style.setProperty('display', 'flex', 'important');
    const svg = modal.querySelector('svg.ico-red');
    const textSpan = svg?.nextElementSibling;
    if (!svg || !textSpan) return { found: false };
    const svgRect = svg.getBoundingClientRect();
    const clientRects = textSpan.getClientRects();
    const firstLineRect = clientRects.length > 0 ? clientRects[0] : textSpan.getBoundingClientRect();
    const verticalCenterDiff = Math.abs(
      (svgRect.top + svgRect.height / 2) - (firstLineRect.top + firstLineRect.height / 2)
    );
    const horizontalGap = firstLineRect.left - svgRect.right;
    return {
      found: true,
      svgRect: { top: +svgRect.top.toFixed(1), left: +svgRect.left.toFixed(1), right: +svgRect.right.toFixed(1), height: +svgRect.height.toFixed(1) },
      firstLineRect: { top: +firstLineRect.top.toFixed(1), left: +firstLineRect.left.toFixed(1), height: +firstLineRect.height.toFixed(1) },
      verticalCenterDiff: +verticalCenterDiff.toFixed(2),
      horizontalGap: +horizontalGap.toFixed(2),
      alignedHorizontallyWithFirstLine: verticalCenterDiff <= 5 && horizontalGap >= 0 && horizontalGap <= 12
    };
  });

  const gatekeeperScreenshotPath = path.join(REPORT_DIR, 'gatekeeper-warning-icon-aligned-2026-10-12.png');
  await page.screenshot({ path: gatekeeperScreenshotPath, fullPage: false });

  // 2. Unlock view, inject an unrelated Hanoi incident to prove it is ignored, and open Phường Bình Dương HUD
  const evalResult = await page.evaluate(async (coords) => {
    document.body.classList.add('officer-authenticated');
    document.querySelectorAll('.auth-gate-backdrop, #cyberGatekeeperModal, #securityGatekeeperOverlay, #dispatcherLoginModal, #officerDutyDeclarationModal, #substituteOfficerModal').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    const disp = window.dispatcherApp || window.dispatcher;
    if (!disp) {
      return { ok: false, error: 'Missing window.dispatcherApp' };
    }

    if ((!disp.stationsList || !disp.stationsList.length) && typeof disp.loadStationsDirectory === 'function') {
      await disp.loadStationsDirectory();
    }

    // Set device live GPS on dispatcher
    disp.currentGps = { lat: coords.latitude, lng: coords.longitude, timestamp: Date.now() };

    // Inject an unrelated active incident in Hanoi (21.0285, 105.8542) to ensure resolveCitizenReferenceCoords NEVER uses it
    if (disp.incidents instanceof Map) {
      disp.incidents.set('test-hanoi-inc', {
        id: 'test-hanoi-inc',
        status: 'ACTIVE',
        lat: 21.0285,
        lng: 105.8542,
        ward: 'Phường Hoàn Kiếm',
        province: 'Thành phố Hà Nội'
      });
      disp.selectedIncidentId = 'test-hanoi-inc';
    }

    const q = new URLSearchParams({
      ward: 'Phường Bình Dương',
      province: 'TP. Hồ Chí Minh'
    });
    const res = await fetch(`/api/geo/locate-ward?${q.toString()}`);
    const data = await res.json();
    if (data?.boundary) {
      if (disp.mapController && typeof disp.mapController.drawAdminBoundary === 'function') {
        disp.mapController.drawAdminBoundary(data.boundary, { fitBounds: true });
      }
      disp.showWardHud(data.boundary);
    }
    await new Promise(r => setTimeout(r, 900));

    const hud = document.getElementById('tacticalWardGeofenceHud');
    const titleEl = document.getElementById('hudWardUnitTitle');
    const gmapsBtn = document.getElementById('hudGmapsBtn');
    const rightPopups = document.querySelectorAll('.cantho-official-station-popup, .maplibregl-popup');
    const nearestBadge = document.querySelector('#hudWardMultiFacilityContainer .nearest-facility-badge');
    const multiText = document.getElementById('hudWardMultiFacilityContainer')?.innerText || '';
    const unitTitle = titleEl?.innerText || '';
    const gmapsHref = gmapsBtn?.getAttribute('href') || '';

    const hudRect = hud?.getBoundingClientRect();
    const titleRect = titleEl?.getBoundingClientRect();
    const topBar = document.getElementById('tacticalMapTopBar');
    const fakePill = document.getElementById('btnOpenFakeArchivePill');
    const topBarRect = topBar?.getBoundingClientRect();
    const fakePillRect = fakePill?.getBoundingClientRect();

    return {
      ok: true,
      leftHudVisible: Boolean(hud && getComputedStyle(hud).display !== 'none'),
      rightPopupCount: rightPopups.length,
      unitTitle,
      nearestBadgeText: nearestBadge ? nearestBadge.innerText.trim() : '',
      multiText,
      gmapsHref,
      hudScrollTop: hud ? hud.scrollTop : -1,
      titleVisibleAtTop: Boolean(hudRect && titleRect && titleRect.top >= hudRect.top && titleRect.bottom <= hudRect.bottom),
      hudFitsInViewport: Boolean(hudRect && hudRect.top >= 0 && hudRect.bottom <= window.innerHeight),
      fakePillFitsInTopBar: Boolean(topBarRect && fakePillRect && fakePillRect.right <= topBarRect.right + 2)
    };
  }, deviceCoords);

  await page.waitForTimeout(1000);
  const screenshotPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await browser.close();

  const expectedBadgeSubstring = `${expectedDistKm} km`;
  const passedSinglePanel = evalResult.ok && evalResult.leftHudVisible && evalResult.rightPopupCount === 0;
  const passedDeviceDistance =
    evalResult.ok &&
    evalResult.nearestBadgeText.includes(expectedBadgeSubstring) &&
    !evalResult.nearestBadgeText.includes('1113');
  const passedGatekeeperIcon = Boolean(gatekeeperCheck.found && gatekeeperCheck.alignedHorizontallyWithFirstLine);
  const passedResponsiveFit = Boolean(evalResult.titleVisibleAtTop && evalResult.hudFitsInViewport);

  const report = {
    timestamp: new Date().toISOString(),
    feature: 'Device GPS Facility Distance, Responsive Ward HUD & Gatekeeper Warning Icon Alignment',
    deviceCoords,
    binhDuongStationCoords,
    expectedDistKm,
    passedSinglePanel,
    passedDeviceDistance,
    passedGatekeeperIcon,
    passedResponsiveFit,
    overallStatus: (passedSinglePanel && passedDeviceDistance && passedGatekeeperIcon && passedResponsiveFit) ? 'PASS' : 'FAIL',
    gatekeeperCheck,
    evalResult,
    gatekeeperScreenshotPath,
    screenshotPath
  };

  const jsonPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.json');
  const mdPath = path.join(REPORT_DIR, 'ward-hud-single-panel-distance-2026-10-12.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  const md = [
    '# QA Report — Device GPS Facility Distance, Responsive Layout & Gatekeeper Warning Alignment',
    '',
    `- **Timestamp**: ${report.timestamp}`,
    `- **Overall Status**: **${report.overallStatus}**`,
    `- **Gatekeeper Warning Icon Aligned**: \`${passedGatekeeperIcon}\` (verticalDiff=${gatekeeperCheck.verticalCenterDiff}px, gap=${gatekeeperCheck.horizontalGap}px)`,
    `- **Left HUD Visible & Title Visible at Top**: \`${evalResult.leftHudVisible}\` / \`${evalResult.titleVisibleAtTop}\``,
    `- **HUD Fits Inside Viewport**: \`${evalResult.hudFitsInViewport}\``,
    `- **Redundant Right Map Popup Count**: \`${evalResult.rightPopupCount}\` (Expected: \`0\`)`,
    `- **Device GPS Coordinates**: \`${deviceCoords.latitude}, ${deviceCoords.longitude}\``,
    `- **Station Coordinates (Công An Phường Bình Dương)**: \`${binhDuongStationCoords.latitude}, ${binhDuongStationCoords.longitude}\``,
    `- **Expected Device-to-Station Distance**: \`${expectedDistKm} km\` (Ignored unrelated Hanoi incident)`,
    `- **Actual Nearest Facility Badge**: \`${evalResult.nearestBadgeText}\``,
    `- **Gatekeeper Screenshot**: \`${gatekeeperScreenshotPath}\``,
    `- **Dispatcher HUD Screenshot**: \`${screenshotPath}\``
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

