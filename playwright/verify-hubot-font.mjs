import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.resolve('Reports/qa/playwright');
fs.mkdirSync(REPORT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    fontFamily: 'Hubot Sans',
    checks: [],
    screenshots: [],
  };

  try {
    const page = await context.newPage();

    // 1. Verify HTTP 200 for self-hosted Hubot Sans font assets
    const fontFiles = [
      '/assets/fonts/hubot-sans/HubotSans-Regular.ttf',
      '/assets/fonts/hubot-sans/HubotSans-Medium.ttf',
      '/assets/fonts/hubot-sans/HubotSans-SemiBold.ttf',
      '/assets/fonts/hubot-sans/HubotSans-Bold.ttf',
      '/assets/fonts/hubot-sans/HubotSans-ExtraBold.ttf',
      '/assets/fonts/hubot-sans/HubotSans-Black.ttf',
    ];
    const assetChecks = [];
    for (const f of fontFiles) {
      const resp = await page.request.get(`${BASE_URL}${f}`);
      const buf = await resp.body();
      assetChecks.push({
        file: f,
        status: resp.status(),
        bytes: buf.length,
        ok: resp.status() === 200 && buf.length > 50000,
      });
    }
    results.checks.push({
      id: 'hubot-sans-font-assets-http200',
      description: 'Verify self-hosted Hubot Sans TTF files are served with HTTP 200 and full payload (>50KB)',
      passed: assetChecks.every((a) => a.ok),
      details: assetChecks,
    });

    // 2. Verify index.html computed font-family and FontFace loading
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);

    const indexFontData = await page.evaluate(async () => {
      await document.fonts.load('400 16px "Hubot Sans"');
      await document.fonts.load('700 16px "Hubot Sans"');
      await document.fonts.load('800 16px "Hubot Sans"');
      const rootFontToken = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-family')
        .trim();
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const heroTitle = document.querySelector('.sos-hero h1');
      const heroFont = heroTitle ? getComputedStyle(heroTitle).fontFamily : '';
      const loadedFaces = Array.from(document.fonts)
        .filter((f) => f.family.replace(/["']/g, '') === 'Hubot Sans')
        .map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status }));

      return {
        rootFontToken,
        bodyFont,
        heroFont,
        fontCheckRegular: document.fonts.check('400 16px "Hubot Sans"'),
        fontCheckBold: document.fonts.check('700 16px "Hubot Sans"'),
        loadedHubotCount: loadedFaces.filter((f) => f.status === 'loaded').length,
        totalHubotFaces: loadedFaces.length,
      };
    });

    results.checks.push({
      id: 'index-hubot-sans-computed-and-loaded',
      description: 'Verify index.html uses Hubot Sans in :root, body, and hero heading, and FontFace API reports loaded status',
      passed:
        indexFontData.rootFontToken.includes('Hubot Sans') &&
        indexFontData.bodyFont.includes('Hubot Sans') &&
        indexFontData.heroFont.includes('Hubot Sans') &&
        indexFontData.fontCheckRegular &&
        indexFontData.fontCheckBold &&
        indexFontData.loadedHubotCount >= 2,
      details: indexFontData,
    });

    const indexShot = path.join(REPORT_DIR, 'hubot-font-index-2026-10-12.png');
    await page.screenshot({ path: indexShot, fullPage: false });
    results.screenshots.push(indexShot);

    // 3. Verify dispatcher.html computed font-family & Cosmic Portal
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);

    const dispatcherFontData = await page.evaluate(async () => {
      await document.fonts.load('700 18px "Hubot Sans"');
      await document.fonts.load('900 21px "Hubot Sans"');
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const gateTitle = document.querySelector('#cyberGatekeeperModal h2');
      const gateTitleFont = gateTitle ? getComputedStyle(gateTitle).fontFamily : '';
      const portalTitle = document.querySelector('.cosmic-portal-title');
      const portalTitleFont = portalTitle ? getComputedStyle(portalTitle).fontFamily : '';
      const bubbleTag = document.querySelector('.bubble-label-tag');
      const bubbleTagFont = bubbleTag ? getComputedStyle(bubbleTag).fontFamily : '';
      const wardHud = document.getElementById('tacticalWardGeofenceHud');
      const wardHudFont = wardHud ? getComputedStyle(wardHud).fontFamily : '';

      return {
        bodyFont,
        gateTitleFont,
        portalTitleFont,
        bubbleTagFont,
        wardHudFont,
        fontCheckBlack: document.fonts.check('900 21px "Hubot Sans"'),
      };
    });

    results.checks.push({
      id: 'dispatcher-hubot-sans-computed-and-loaded',
      description: 'Verify dispatcher.html Gatekeeper, Cosmic Portal title, bubble tags, and Ward HUD use Hubot Sans',
      passed:
        dispatcherFontData.bodyFont.includes('Hubot Sans') &&
        dispatcherFontData.gateTitleFont.includes('Hubot Sans') &&
        dispatcherFontData.portalTitleFont.includes('Hubot Sans') &&
        dispatcherFontData.bubbleTagFont.includes('Hubot Sans') &&
        dispatcherFontData.wardHudFont.includes('Hubot Sans') &&
        dispatcherFontData.fontCheckBlack,
      details: dispatcherFontData,
    });

    const dispatcherGateShot = path.join(REPORT_DIR, 'hubot-font-dispatcher-gatekeeper-2026-10-12.png');
    await page.screenshot({ path: dispatcherGateShot, fullPage: false });
    results.screenshots.push(dispatcherGateShot);

    await page.evaluate(() => {
      const gk = document.getElementById('cyberGatekeeperModal');
      const cp = document.getElementById('cosmicPortalView');
      if (gk) gk.style.display = 'none';
      if (cp) cp.style.display = 'block';
    });
    await page.waitForTimeout(800);

    const dispatcherPortalShot = path.join(REPORT_DIR, 'hubot-font-dispatcher-portal-2026-10-12.png');
    await page.screenshot({ path: dispatcherPortalShot, fullPage: false });
    results.screenshots.push(dispatcherPortalShot);
  } finally {
    await browser.close();
  }

  const allPassed = results.checks.every((c) => c.passed);
  results.summary = {
    total: results.checks.length,
    passed: results.checks.filter((c) => c.passed).length,
    failed: results.checks.filter((c) => !c.passed).length,
    status: allPassed ? 'PASS' : 'FAIL',
  };

  const jsonPath = path.join(REPORT_DIR, 'hubot-font-2026-10-12.json');
  const mdPath = path.join(REPORT_DIR, 'hubot-font-2026-10-12.md');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  const mdLines = [
    '# Hubot Sans Official Font Synchronization QA Report',
    '',
    `- **Timestamp**: ${results.timestamp}`,
    `- **Base URL**: ${results.baseUrl}`,
    `- **Font Family**: \`${results.fontFamily}\` (\`/assets/fonts/hubot-sans/*.ttf\`)`,
    `- **Overall Status**: **${results.summary.status}** (${results.summary.passed}/${results.summary.total} checks passed)`,
    '',
    '## Checks',
    ...results.checks.map(
      (c) =>
        `### ${c.passed ? '✅ PASS' : '❌ FAIL'} — \`${c.id}\`\n- **Description**: ${c.description}\n- **Details**: \`${JSON.stringify(c.details)}\`\n`
    ),
    '## Screenshots',
    ...results.screenshots.map((s) => `- \`${s}\``),
  ];
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log(JSON.stringify(results.summary));
  if (!allPassed) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
