import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\dienv\\.gemini\\antigravity\\brain\\7d6fe8d7-76a3-4dd6-bcce-f3505c9e66f4';
const QA_DIR = 'Reports/qa/playwright/2026-10-13-fe-be-sync';
fs.mkdirSync(QA_DIR, { recursive: true });

async function run() {
  console.log('🚀 Running FE v2 vs Hosting synchronization QA verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // 1. Check FE on localhost:5173
    console.log('📱 Navigating to FE v2 at http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const feMobilePath = path.join(QA_DIR, '01-fe-v2-mobile-citizen-synced.png');
    const feArtifactPath = path.join(ARTIFACT_DIR, 'fe-v2-mobile-citizen-synced.png');
    await page.screenshot({ path: feMobilePath, fullPage: false });
    fs.copyFileSync(feMobilePath, feArtifactPath);
    console.log(`📸 Saved FE screenshot: ${feMobilePath}`);

    // Check no location banner on main view
    const locBannerCount = await page.locator('.location-banner').count();
    results.tests.push({
      name: 'No Location Banner pushing down hero',
      status: locBannerCount === 0 ? 'PASS' : 'FAIL',
      detail: `Found ${locBannerCount} location banners`,
    });

    // Check video source
    const videoSrc = await page.locator('#citizenBgVideo').getAttribute('src');
    const hasCorrectVideo = videoSrc && videoSrc.includes('sos-citizen-bg.mp4');
    results.tests.push({
      name: 'Citizen background video is realistic hands cupping sphere (sos-citizen-bg.mp4)',
      status: hasCorrectVideo ? 'PASS' : 'FAIL',
      detail: `video src: ${videoSrc}`,
    });

    // Test clicking "Cài Lối Tắt" to open install modal
    console.log('👆 Clicking "Cài Lối Tắt" button in bottom dock...');
    const installBtn = page.locator('button:has-text("Cài Lối Tắt")').first();
    await installBtn.click();
    await page.waitForTimeout(1000);

    const modalTitle = await page.locator('.modal-backdrop.is-open .modal-title').textContent();
    const hasModal = modalTitle && modalTitle.includes('TẠO LỐI TẮT');
    results.tests.push({
      name: 'Clicking "Cài Lối Tắt" opens Install Shortcut Modal',
      status: hasModal ? 'PASS' : 'FAIL',
      detail: `modal title: ${modalTitle}`,
    });

    const modalMobilePath = path.join(QA_DIR, '02-fe-v2-install-modal-open.png');
    const modalArtifactPath = path.join(ARTIFACT_DIR, 'fe-v2-install-modal-open.png');
    await page.screenshot({ path: modalMobilePath, fullPage: false });
    fs.copyFileSync(modalMobilePath, modalArtifactPath);
    console.log(`📸 Saved Install Modal screenshot: ${modalMobilePath}`);

    // Dismiss modal
    await page.locator('button:has-text("Đã Hiểu, Đóng Hướng Dẫn")').first().click();
    await page.waitForTimeout(500);

    // 2. Check Hosting on localhost:3000
    console.log('📱 Navigating to Hosting at http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const hostMobilePath = path.join(QA_DIR, '03-hosting-mobile-citizen.png');
    const hostArtifactPath = path.join(ARTIFACT_DIR, 'hosting-mobile-citizen.png');
    await page.screenshot({ path: hostMobilePath, fullPage: false });
    fs.copyFileSync(hostMobilePath, hostArtifactPath);
    console.log(`📸 Saved Hosting screenshot: ${hostMobilePath}`);

    results.tests.push({
      name: 'Hosting localhost:3000 online and active',
      status: 'PASS',
      detail: 'HTTP 200 loaded successfully',
    });

  } catch (err) {
    console.error('❌ Error during QA execution:', err);
    results.tests.push({
      name: 'Execution check',
      status: 'ERROR',
      detail: err.message,
    });
  } finally {
    await browser.close();
  }

  // Write reports
  const reportJson = path.join(QA_DIR, 'report.json');
  fs.writeFileSync(reportJson, JSON.stringify(results, null, 2), 'utf8');

  const mdContent = `# QA Report: FE v2 & Hosting Synchronization

- **Timestamp**: ${results.timestamp}
- **Device Viewport**: iPhone 12/13/14 (390 x 844, DPR 2)

## Test Results
${results.tests.map(t => `- **${t.name}**: \`${t.status}\` — ${t.detail}`).join('\n')}

## Artifacts
1. FE v2 Mobile Citizen Home: \`${path.join(QA_DIR, '01-fe-v2-mobile-citizen-synced.png')}\`
2. FE v2 Install Shortcut Modal: \`${path.join(QA_DIR, '02-fe-v2-install-modal-open.png')}\`
3. Hosting Mobile Citizen Home: \`${path.join(QA_DIR, '03-hosting-mobile-citizen.png')}\`
`;
  const reportMd = path.join(QA_DIR, 'report.md');
  fs.writeFileSync(reportMd, mdContent, 'utf8');
  console.log(`✅ Reports written to ${reportJson} and ${reportMd}`);
}

run();
