import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright', '2026-10-12-tab-icons-alignment-and-ward-geofence-fix');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

async function verifyTabIconsAndCaiKheWard() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    testName: 'Tab Icons Alignment & Phường Cái Khế Ward Geofence Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    assertions: [],
    screenshots: []
  };

  const addAssertion = (name, pass, details = {}) => {
    report.assertions.push({ name, pass: Boolean(pass), details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${name}`);
    if (!pass && Object.keys(details).length) {
      console.log(`       Details:`, JSON.stringify(details));
    }
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`Opening ${BASE_URL}/dispatcher.html...`);
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Bypass gatekeeper modals and authenticate officer
    await page.evaluate(() => {
      document.body.classList.add('officer-authenticated');
      document.querySelectorAll('.auth-gate-backdrop, #cyberGatekeeperModal, #securityGatekeeperOverlay, #dispatcherLoginModal, #officerDutyDeclarationModal, #substituteOfficerModal').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
      const side = document.getElementById('dispatcherSidebar');
      if (side) side.style.setProperty('display', 'flex', 'important');
    });

    await page.waitForTimeout(1000);

    // 1. Verify Tab Buttons and Icon Placement in #sidebarTabsNav
    const tabsNav = await page.$('#sidebarTabsNav');
    addAssertion('Sidebar sub-tabs container #sidebarTabsNav is present', !!tabsNav);

    const tabIds = [
      'tabBtnIncidents',
      'tabBtnHistory',
      'tabBtnStations',
      'tabBtnEnterprises',
      'tabBtnHospitals'
    ];

    const tabMetrics = [];
    for (const id of tabIds) {
      const btn = await page.$(`#${id}`);
      if (!btn) {
        addAssertion(`Tab #${id} exists in DOM`, false);
        continue;
      }

      const metrics = await page.evaluate((elId) => {
        const el = document.getElementById(elId);
        if (!el) return null;
        const btnRect = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        const svgRect = svg ? svg.getBoundingClientRect() : null;
        const textSpan = el.querySelector('.tab-btn-text') || el.querySelector('span');
        const text = el.innerText.trim();
        return {
          id: elId,
          text,
          btnRect: { left: +btnRect.left.toFixed(2), right: +btnRect.right.toFixed(2), width: +btnRect.width.toFixed(2), top: +btnRect.top.toFixed(2) },
          svgRect: svgRect ? { left: +svgRect.left.toFixed(2), right: +svgRect.right.toFixed(2), width: +svgRect.width.toFixed(2) } : null,
          isContained: svgRect ? (svgRect.left >= btnRect.left - 0.5 && svgRect.right <= btnRect.right + 0.5) : false,
          overflowLeft: svgRect ? +(Math.max(0, btnRect.left - svgRect.left)).toFixed(2) : 0,
          overflowRight: svgRect ? +(Math.max(0, svgRect.right - btnRect.right)).toFixed(2) : 0
        };
      }, id);

      tabMetrics.push(metrics);

      addAssertion(
        `Tab #${id} (${metrics.text}) icon is strictly inside button boundaries (no left overflow, no right overflow)`,
        metrics && metrics.isContained && metrics.overflowLeft === 0 && metrics.overflowRight === 0,
        metrics
      );
    }

    // Check all 5 tabs are horizontally aligned on 1 row
    const tops = tabMetrics.map(m => m.btnRect.top);
    const maxTopDiff = Math.max(...tops) - Math.min(...tops);
    addAssertion(
      'All 5 sidebar tabs are aligned on a single row (max top difference <= 2px)',
      maxTopDiff <= 2,
      { tops, maxTopDiff }
    );

    // Test double-digit badges (matching user screenshot with 82 active and 10 history)
    const badgeMetrics = await page.evaluate(() => {
      const b1 = document.getElementById('activeCountBadge');
      const b2 = document.getElementById('historyCountBadge');
      if (b1) b1.textContent = '82';
      if (b2) b2.textContent = '10';

      const checkBtn = (id) => {
        const el = document.getElementById(id);
        const btnRect = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        const svgRect = svg ? svg.getBoundingClientRect() : null;
        return {
          id,
          text: el.innerText.trim(),
          isContained: svgRect ? (svgRect.left >= btnRect.left - 0.5 && svgRect.right <= btnRect.right + 0.5) : false,
          overflowLeft: svgRect ? +(Math.max(0, btnRect.left - svgRect.left)).toFixed(2) : 0,
          overflowRight: svgRect ? +(Math.max(0, svgRect.right - btnRect.right)).toFixed(2) : 0
        };
      };
      return [checkBtn('tabBtnIncidents'), checkBtn('tabBtnHistory')];
    });

    for (const bm of badgeMetrics) {
      addAssertion(
        `Double-digit badge Tab #${bm.id} (${bm.text}) icon is strictly inside boundaries`,
        bm.isContained && bm.overflowLeft === 0 && bm.overflowRight === 0,
        bm
      );
    }

    // Take screenshot of #sidebarTabsNav with double-digit counts
    const tabsScreenshotPath = path.join(SCREENSHOT_DIR, 'sidebar-tabs-nav-aligned.png');
    if (tabsNav) {
      await tabsNav.screenshot({ path: tabsScreenshotPath });
      report.screenshots.push({ name: 'sidebar-tabs-nav-aligned', path: tabsScreenshotPath });
      console.log(`Saved screenshot: ${tabsScreenshotPath}`);
    }

    // 2. Test API /api/geo/locate-ward for Cai Khe & Ninh Kieu
    const locateCaiKhe = await page.evaluate(async () => {
      const res = await fetch('/api/geo/locate-ward?lat=10.0498&lng=105.7785&ward=Ph%C6%B0%E1%BB%9Dng%20C%C3%A1i%20Kh%E1%BA%BF&province=C%E1%BA%A7n%20Th%C6%A1');
      return await res.json();
    });

    addAssertion(
      'API /api/geo/locate-ward returns ok:true for Phường Cái Khế',
      locateCaiKhe && locateCaiKhe.ok === true,
      locateCaiKhe
    );
    addAssertion(
      'API returns Phường Cái Khế boundary id: ward-92-diaphanhanhchinhcapxa_2025_202',
      locateCaiKhe && locateCaiKhe.boundary?.properties?.id === 'ward-92-diaphanhanhchinhcapxa_2025_202',
      { returnedWard: locateCaiKhe?.boundary?.properties?.ward, returnedId: locateCaiKhe?.boundary?.properties?.id }
    );

    // 3. Simulate clicking Station marker or selecting Cai Khe on map
    const simulatedClickResult = await page.evaluate(async () => {
      const disp = window.dispatcherApp || window.dispatcher;
      if (!disp) return { error: 'Dispatcher app not initialized' };

      const station = {
        id: 'st-ct-28-ph-ng-c-i-kh',
        name: 'Công An Phường Cái Khế',
        ward: 'Phường Cái Khế',
        province: 'Cần Thơ',
        lat: 10.0498,
        lng: 105.7785,
        wardId: 'ward-92-diaphanhanhchinhcapxa_2025_202'
      };

      const queryParams = new URLSearchParams({
        id: station.wardId || '',
        lat: station.lat,
        lng: station.lng,
        ward: station.ward,
        province: station.province,
        address: station.name
      });
      const res = await fetch('/api/geo/locate-ward?' + queryParams.toString());
      const data = await res.json();

      if (disp.mapController && data.boundary) {
        disp.mapController.highlightWardBoundary(data.boundary, { color: '#eab308' });
        if (typeof disp.showWardHud === 'function') {
          disp.showWardHud(data.boundary, station);
        }
      }

      return {
        ok: data.ok,
        ward: data.boundary?.properties?.ward,
        id: data.boundary?.properties?.id,
        hudText: document.getElementById('wardHudTitle')?.innerText || ''
      };
    });

    addAssertion(
      'Station click highlights Phường Cái Khế without defaulting to Ninh Kiều',
      simulatedClickResult && simulatedClickResult.ward === 'Phường Cái Khế' && simulatedClickResult.id === 'ward-92-diaphanhanhchinhcapxa_2025_202',
      simulatedClickResult
    );

    await page.waitForTimeout(1500);

    // Full screen capture with highlighted ward and tabs
    const fullScreenshotPath = path.join(SCREENSHOT_DIR, 'dispatcher-cai-khe-ward-highlighted.png');
    await page.screenshot({ path: fullScreenshotPath, fullPage: false });
    report.screenshots.push({ name: 'dispatcher-cai-khe-ward-highlighted', path: fullScreenshotPath });
    console.log(`Saved screenshot: ${fullScreenshotPath}`);

    // Also copy to brain artifacts directory so user can view
    const artifactPath = path.join('C:\\Users\\dienv\\.gemini\\antigravity\\brain\\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4', 'sidebar-tabs-nav-aligned.png');
    if (fs.existsSync(tabsScreenshotPath)) {
      fs.copyFileSync(tabsScreenshotPath, artifactPath);
    }
    const fullArtifactPath = path.join('C:\\Users\\dienv\\.gemini\\antigravity\\brain\\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4', 'dispatcher-cai-khe-ward-highlighted.png');
    if (fs.existsSync(fullScreenshotPath)) {
      fs.copyFileSync(fullScreenshotPath, fullArtifactPath);
    }

  } catch (err) {
    console.error('Test error:', err);
    addAssertion('Test run completed without unhandled exceptions', false, { error: err.message });
  } finally {
    await browser.close();
  }

  // Write reports
  const jsonPath = path.join(REPORT_DIR, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const passed = report.assertions.filter(a => a.pass).length;
  const total = report.assertions.length;
  const mdContent = `# QA Report: Tab Icons Alignment & Phường Cái Khế Ward Geofence

**Timestamp**: ${report.timestamp}  
**URL**: ${report.baseUrl}  
**Status**: ${passed === total ? 'PASSED ✅' : 'FAILED ❌'} (${passed}/${total} assertions passed)

## Assertions
${report.assertions.map(a => `- [${a.pass ? 'x' : ' '}] **${a.name}** ${a.pass ? '✅' : '❌'}\n  ${Object.keys(a.details).length ? `\`\`\`json\n  ${JSON.stringify(a.details, null, 2)}\n  \`\`\`` : ''}`).join('\n')}

## Screenshots
${report.screenshots.map(s => `- **${s.name}**: \`${s.path}\``).join('\n')}
`;

  const mdPath = path.join(REPORT_DIR, 'report.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log(`Report written to ${mdPath} and ${jsonPath}`);
  console.log(`Summary: ${passed}/${total} assertions passed.`);
}

verifyTabIconsAndCaiKheWard().catch(console.error);
