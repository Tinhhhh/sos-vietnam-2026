import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\dienv\\.gemini\\antigravity\\brain\\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4';
const REPORTS_DIR = path.resolve('Reports/qa/playwright');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function runVerification() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  const addTest = (name, passed, details = {}) => {
    results.summary.total++;
    if (passed) results.summary.passed++;
    else results.summary.failed++;
    results.tests.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  try {
    // Test 1: Stations API with 3,717 stations and gzip
    console.log('\n--- 1. Testing GET /api/stations/all ---');
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    });
    const apiRes = await context.request.get('http://localhost:3000/api/stations/all', {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    const apiJson = await apiRes.json();
    const stationsCount = apiJson.stations ? apiJson.stations.length : 0;
    addTest('Stations API returns exactly 3,717 stations', apiRes.status() === 200 && stationsCount === 3717, {
      status: apiRes.status(),
      stationsCount
    });

    // Test 2: Mobile Viewport 375px Tap Targets on Port 3000
    console.log('\n--- 2. Testing 375px Mobile Viewport Tap Targets ---');
    const mobilePage = await browser.newPage({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    const navPillHeight = await mobilePage.evaluate(() => {
      const el = document.querySelector('.nav-pill-item');
      return el ? parseFloat(window.getComputedStyle(el).height) : 0;
    });
    addTest('Nav pill item tap target >= 36px on 375px screens', navPillHeight >= 36, { navPillHeight });

    const legalToggleHeight = await mobilePage.evaluate(() => {
      const el = document.querySelector('.legal-toggle-btn');
      return el ? parseFloat(window.getComputedStyle(el).height) : 0;
    });
    addTest('Legal toggle tap target >= 32px on 375px screens', legalToggleHeight >= 32, { legalToggleHeight });

    const mobileScreenshot = path.join(ARTIFACT_DIR, 'verify_3000_mobile_375px_round3.png');
    await mobilePage.screenshot({ path: mobileScreenshot });

    // Test 3: Agency Cards Grid 2-columns on <=480px screens
    console.log('\n--- 3. Testing Agency Cards Grid on <=480px ---');
    const agencyGridCols = await mobilePage.evaluate(() => {
      const grid = document.querySelector('.agency-cards-grid');
      if (!grid) return null;
      return window.getComputedStyle(grid).gridTemplateColumns;
    });
    // Check if grid has 2 columns (e.g. "171px 171px" or similar 2-track values)
    const colCount = agencyGridCols ? agencyGridCols.trim().split(/\s+/).length : 0;
    addTest('Agency cards grid has 2 columns on small screens', colCount === 2, { agencyGridCols, colCount });

    // Test 4: React FE on Port 5173
    console.log('\n--- 4. Testing React FE on Port 5173 at 375px ---');
    const fePage = await browser.newPage({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    await fePage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await fePage.waitForTimeout(1000);
    const hasFeRoot = await fePage.locator('#root').count();
    addTest('React FE loads cleanly at 375px mobile viewport', hasFeRoot === 1, { hasFeRoot });

    const feMobileScreenshot = path.join(ARTIFACT_DIR, 'verify_5173_mobile_375px_round3.png');
    await fePage.screenshot({ path: feMobileScreenshot });

  } catch (err) {
    console.error('Test error:', err);
    addTest('Execution failure', false, { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  // Save QA Reports
  const jsonReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-round3.json');
  const mdReportPath = path.join(REPORTS_DIR, '2026-10-13-muse-ai-round3.md');

  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  const mdContent = `# QA Report: Muse AI Round 3 Routes Dedup, Stations 3,717, and Responsive Fixes

**Timestamp:** ${results.timestamp}
**Total Tests:** ${results.summary.total}
**Passed:** ${results.summary.passed}
**Failed:** ${results.summary.failed}
**Success Rate:** ${Math.round((results.summary.passed / results.summary.total) * 100)}%

## Test Details

| Test Name | Status | Details |
|---|---|---|
${results.tests.map(t => `| ${t.name} | ${t.passed ? '✅ PASSED' : '❌ FAILED'} | \`${JSON.stringify(t.details)}\` |`).join('\n')}

## Visual Evidence Artifacts
- Web Hosting 375px Mobile View (Port 3000): \`verify_3000_mobile_375px_round3.png\`
- React FE 375px Mobile View (Port 5173): \`verify_5173_mobile_375px_round3.png\`
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`\nReports generated:\n- ${jsonReportPath}\n- ${mdReportPath}`);
  return results;
}

runVerification().then(res => {
  if (res.summary.failed > 0) process.exit(1);
  else process.exit(0);
});
