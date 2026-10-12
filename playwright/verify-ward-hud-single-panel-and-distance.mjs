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

    // Populate the exact National HQ header strings & 3-digit top bar counts from user's screenshots
    const brandTitle = document.getElementById('headerBrandTitle');
    const brandSub = document.getElementById('headerBrandSub');
    const weatherTemp = document.getElementById('weatherTempVal');
    const weatherDesc = document.getElementById('weatherDescVal');
    const locPrim = document.getElementById('locationPrimaryVal');
    const locSec = document.getElementById('locationSecondaryVal');
    const offName = document.getElementById('headerOfficerName');
    const dutyBadge = document.getElementById('headerDutyBadge');
    const shiftTime = document.getElementById('headerDutyShiftTime');

    if (brandTitle) brandTitle.textContent = 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia';
    if (brandSub) brandSub.textContent = 'BỘ CÔNG AN · 34 TỈNH THÀNH · 3.321 XÃ PHƯỜNG';
    if (weatherTemp) weatherTemp.textContent = '31°C';
    if (weatherDesc) weatherDesc.textContent = 'Mưa phùn nhẹ';
    if (locPrim) locPrim.textContent = 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia';
    if (locSec) locSec.textContent = 'Bộ Công An · Cấp Quốc Gia';
    if (offName) offName.textContent = 'TRỰC BAN: Trung sĩ Điền Trần Vĩnh An';
    if (dutyBadge) {
      dutyBadge.textContent = 'ĐỔI CA';
      dutyBadge.style.background = '#f59e0b';
    }
    if (shiftTime) shiftTime.textContent = 'Ca: 07:00 - 15:00';

    // Top bar 3-digit counts
    const natSub = document.querySelector('#statNationalMapPill .national-badge-sub');
    const sumRate = document.getElementById('statSummaryRate');
    const statTotal = document.getElementById('statTotalCases');
    const statPolice = document.getElementById('statPoliceCases');
    const statCsgt = document.getElementById('statCsgtCases');
    const statFire = document.getElementById('statFireCases');
    const statHosp = document.getElementById('statHospitalCases');
    const statResc = document.getElementById('statRescueCases');
    const statFake = document.getElementById('statFakeAlarmCount');
    if (natSub) natSub.textContent = '3.321 ĐƠN VỊ (2.628 PHƯỜNG/XÃ)';
    if (sumRate) sumRate.textContent = '9% (10/107)';
    if (statTotal) statTotal.textContent = '107';
    if (statPolice) statPolice.textContent = '92';
    if (statCsgt) statCsgt.textContent = '4';
    if (statFire) statFire.textContent = '3';
    if (statHosp) statHosp.textContent = '2';
    if (statResc) statResc.textContent = '6';
    if (statFake) statFake.textContent = '0';

    // Ensure sidebar incident queue has scrollable items to verify inset scrollbar
    const queueList = document.getElementById('incidentQueueList');
    if (queueList && queueList.children.length < 6) {
      let cardsHtml = '';
      for (let i = 1; i <= 8; i++) {
        cardsHtml += `
          <div class="queue-item" style="margin-bottom:8px; padding:12px; border-radius:14px; background:rgba(4,35,72,0.75); border:1px solid rgba(0,236,243,0.28);">
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:12px; color:#F1ECCB;">
              <span>#SOS-92990${i} · CỨU HỘ KHẨN CẤP</span>
              <span style="color:#00ECF3;">ĐANG XỬ LÝ</span>
            </div>
            <div style="font-size:11px; color:#DFB077; margin-top:4px;">Công An Phường Bình Dương — Cách thiết bị ${coords.latitude.toFixed(2)}</div>
          </div>`;
      }
      queueList.insertAdjacentHTML('beforeend', cardsHtml);
    }

    await new Promise(r => setTimeout(r, 250));

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

    // Check all 5 header pills for single-line text (no orphan wrapping) and fit within pill borders
    const headerPillIds = [
      { pillSel: '.header-nav-left-pill', primarySel: '#headerBrandTitle', secondarySel: '#headerBrandSub' },
      { pillSel: '#vnLiveClock', primarySel: '#clockTimeVal', secondarySel: '#clockDateVal' },
      { pillSel: '#weatherWidget', primarySel: '#weatherTempVal', secondarySel: '#weatherDescVal' },
      { pillSel: '#locationWidget', primarySel: '#locationPrimaryVal', secondarySel: '#locationSecondaryVal' },
      { pillSel: '#headerDutyShiftPill', primarySel: '#headerOfficerName', secondarySel: '#headerDutyShiftTime' }
    ];
    const headerPillsReport = headerPillIds.map(({ pillSel, primarySel, secondarySel }) => {
      const pill = document.querySelector(pillSel);
      const prim = document.querySelector(primarySel);
      const sec = document.querySelector(secondarySel);
      const pillRect = pill?.getBoundingClientRect();
      const primRect = prim?.getBoundingClientRect();
      const secRect = sec?.getBoundingClientRect();
      const primLineCount = prim ? prim.getClientRects().length : 0;
      const secLineCount = sec ? sec.getClientRects().length : 0;
      const rightPaddingPx = (pillRect && primRect && secRect)
        ? +(pillRect.right - Math.max(primRect.right, secRect.right)).toFixed(1)
        : 0;
      return {
        pillSel,
        primLineCount,
        secLineCount,
        noOrphanWrap: primLineCount <= 1 && secLineCount <= 1,
        rightPaddingPx,
        fitsInsidePill: Boolean(pillRect && primRect && secRect && primRect.right <= pillRect.right - 6 && secRect.right <= pillRect.right - 6)
      };
    });

    const queueComputed = queueList ? getComputedStyle(queueList) : null;
    const scrollbarCheck = {
      scrollable: Boolean(queueList && queueList.scrollHeight > queueList.clientHeight),
      scrollbarWidthStyle: queueComputed ? queueComputed.scrollbarWidth : 'unknown',
      marginRight: queueComputed ? queueComputed.marginRight : '0px',
      marginBottom: queueComputed ? queueComputed.marginBottom : '0px',
      usesInsetWebkitScrollbar: Boolean(queueComputed && queueComputed.scrollbarWidth !== 'thin')
    };

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
      topBarRight: topBarRect ? +topBarRect.right.toFixed(1) : 0,
      fakePillRight: fakePillRect ? +fakePillRect.right.toFixed(1) : 0,
      fakePillFitsInTopBar: Boolean(topBarRect && fakePillRect && fakePillRect.right <= topBarRect.right + 1 && fakePillRect.left >= topBarRect.left),
      headerPillsReport,
      allHeaderPillsClean: headerPillsReport.every(p => p.noOrphanWrap && p.fitsInsidePill),
      scrollbarCheck
    };
  }, deviceCoords);

  await page.waitForTimeout(600);
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
  const passedResponsiveFit = Boolean(
    evalResult.titleVisibleAtTop &&
    evalResult.hudFitsInViewport &&
    evalResult.fakePillFitsInTopBar &&
    evalResult.allHeaderPillsClean &&
    evalResult.scrollbarCheck?.usesInsetWebkitScrollbar
  );

  const report = {
    timestamp: new Date().toISOString(),
    feature: 'Device GPS Facility Distance, Header/TopBar Pill Alignment & Inset Scrollbar Polish',
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
    '# QA Report — Header Pills, Top Bar Last Button, Inset Scrollbar & Device GPS Distance',
    '',
    `- **Timestamp**: ${report.timestamp}`,
    `- **Overall Status**: **${report.overallStatus}**`,
    `- **Gatekeeper Warning Icon Aligned**: \`${passedGatekeeperIcon}\` (verticalDiff=${gatekeeperCheck.verticalCenterDiff}px, gap=${gatekeeperCheck.horizontalGap}px)`,
    `- **All 5 Header Pills Clean (No Orphan Wrap & Fits Pill)**: \`${evalResult.allHeaderPillsClean}\``,
    `- **Last Top Bar Button (#btnOpenFakeArchivePill) Fits Without Clipping**: \`${evalResult.fakePillFitsInTopBar}\` (fakePillRight=${evalResult.fakePillRight}px <= topBarRight=${evalResult.topBarRight}px)`,
    `- **Sidebar Queue Uses Inset WebKit Scrollbar Track**: \`${evalResult.scrollbarCheck?.usesInsetWebkitScrollbar}\` (marginRight=${evalResult.scrollbarCheck?.marginRight}, marginBottom=${evalResult.scrollbarCheck?.marginBottom})`,
    `- **Left HUD Visible & Title Visible at Top**: \`${evalResult.leftHudVisible}\` / \`${evalResult.titleVisibleAtTop}\``,
    `- **HUD Fits Inside Viewport**: \`${evalResult.hudFitsInViewport}\``,
    `- **Redundant Right Map Popup Count**: \`${evalResult.rightPopupCount}\` (Expected: \`0\`)`,
    `- **Expected Device-to-Station Distance**: \`${expectedDistKm} km\` (Actual: \`${evalResult.nearestBadgeText}\`)`,
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

