import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.resolve('Reports/qa/playwright');
fs.mkdirSync(REPORT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks: [],
    allPassed: true
  };

  function record(name, passed, details) {
    results.checks.push({ name, passed, details });
    if (!passed) results.allPassed = false;
  }

  try {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
    const page = await context.newPage();

    // 1. Verify citizen page (index.html) head icons + install modal logo
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const citizenIcons = await page.evaluate(() => {
      const iconLink = document.querySelector('link[rel="icon"]')?.getAttribute('href') || '';
      const appleLink = document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') || '';
      const shortcutLink = document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || '';
      return { iconLink, appleLink, shortcutLink };
    });

    record(
      'Citizen head icon links use official logo with cache-buster',
      citizenIcons.iconLink.includes('logo-police-round-192.png?v=20261012_official_logo_v1') &&
        citizenIcons.shortcutLink.includes('favicon.png?v=20261012_official_logo_v1'),
      citizenIcons
    );

    // Open Install Shortcut Modal on index.html
    await page.evaluate(() => {
      const modal = document.getElementById('installShortcutModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('is-open');
      }
    });
    await page.waitForTimeout(400);

    const modalLogoInfo = await page.evaluate(() => {
      const img = document.querySelector('#installShortcutModal img[src*="logo-police-round-192.png"]');
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      return {
        src: img.getAttribute('src'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: rect.width,
        height: rect.height
      };
    });

    record(
      'Install Shortcut modal renders 192x192 official logo cleanly',
      Boolean(
        modalLogoInfo &&
          modalLogoInfo.complete &&
          modalLogoInfo.naturalWidth === 192 &&
          modalLogoInfo.naturalHeight === 192 &&
          modalLogoInfo.width >= 50
      ),
      modalLogoInfo
    );

    const citizenModalShot = path.join(REPORT_DIR, 'official-logo-citizen-modal.png');
    await page.screenshot({ path: citizenModalShot });

    // 2. Verify dispatcher page (dispatcher.html) Gatekeeper + Cosmic Portal + Top Header
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const gatekeeperShot = path.join(REPORT_DIR, 'official-logo-dispatcher-gatekeeper.png');
    await page.screenshot({ path: gatekeeperShot });

    const gatekeeperLogo = await page.evaluate(() => {
      const img = document.querySelector('#cyberGatekeeperModal img[src*="khien.png"]');
      if (!img) return null;
      return {
        src: img.getAttribute('src'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      };
    });

    record(
      'Dispatcher Gatekeeper modal displays 512x512 official logo',
      Boolean(
        gatekeeperLogo &&
          gatekeeperLogo.complete &&
          gatekeeperLogo.naturalWidth === 512 &&
          gatekeeperLogo.naturalHeight === 512
      ),
      gatekeeperLogo
    );

    // Reveal Cosmic Portal to verify CHỈ HUY TỔNG HỢP bubble logo
    await page.evaluate(() => {
      const gk = document.getElementById('cyberGatekeeperModal');
      if (gk) gk.style.display = 'none';
      const cp = document.getElementById('cosmicPortalView');
      if (cp) cp.style.display = 'block';
    });
    await page.waitForTimeout(600);

    const cosmicShot = path.join(REPORT_DIR, 'official-logo-dispatcher-cosmic.png');
    await page.screenshot({ path: cosmicShot });

    const cosmicAdminLogo = await page.evaluate(() => {
      const img = document.querySelector('.cosmic-bubble-item.bubble-admin img.bubble-logo-img');
      if (!img) return null;
      return {
        src: img.getAttribute('src'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      };
    });

    record(
      'Cosmic Portal CHỈ HUY TỔNG HỢP orb displays 1024x1024 official logo',
      Boolean(
        cosmicAdminLogo &&
          cosmicAdminLogo.complete &&
          cosmicAdminLogo.naturalWidth === 1024 &&
          cosmicAdminLogo.naturalHeight === 1024
      ),
      cosmicAdminLogo
    );

    // Reveal main Dispatcher Console header to verify #headerBrandBadgeImg
    await page.evaluate(() => {
      const cp = document.getElementById('cosmicPortalView');
      if (cp) cp.style.display = 'none';
      document.body.classList.add('officer-authenticated');
    });
    await page.waitForTimeout(500);

    const headerShot = path.join(REPORT_DIR, 'official-logo-dispatcher-header.png');
    await page.screenshot({ path: headerShot });

    const headerCrestLogo = await page.evaluate(() => {
      const img = document.getElementById('headerBrandBadgeImg');
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      return {
        src: img.getAttribute('src'),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: rect.width,
        renderedHeight: rect.height
      };
    });

    record(
      'Dispatcher top-left header (#headerBrandBadgeImg) renders official logo',
      Boolean(
        headerCrestLogo &&
          headerCrestLogo.complete &&
          headerCrestLogo.naturalWidth === 512 &&
          headerCrestLogo.renderedWidth >= 30
      ),
      headerCrestLogo
    );

    await context.close();
  } finally {
    await browser.close();
  }

  const jsonPath = path.join(REPORT_DIR, 'official-logo-2026-10-12.json');
  const mdPath = path.join(REPORT_DIR, 'official-logo-2026-10-12.md');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  const mdLines = [
    '# QA Evidence — Official Web Logo Replacement (2026-10-12)',
    '',
    `- **Timestamp**: ${results.timestamp}`,
    `- **Base URL**: ${results.baseUrl}`,
    `- **All Checks Passed**: ${results.allPassed ? 'YES' : 'NO'}`,
    '',
    '## Checks',
    ...results.checks.map(
      (c, i) => `${i + 1}. **${c.name}**: ${c.passed ? 'PASS' : 'FAIL'} — \`${JSON.stringify(c.details)}\``
    )
  ];
  fs.writeFileSync(mdPath, mdLines.join('\n') + '\n', 'utf8');

  console.log(JSON.stringify(results, null, 2));
  if (!results.allPassed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
