import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.resolve('Reports/qa/playwright');
fs.mkdirSync(REPORT_DIR, { recursive: true });

const EXPECTED_PALETTE = {
  '--brand-mahogany-red': '#ac0015',
  '--brand-prussian-blue': '#042348',
  '--brand-baltic-blue': '#00669a',
  '--brand-neon-ice': '#00ecf3',
  '--brand-cornsilk': '#f1eccb',
  '--brand-sandy-clay': '#dfb077',
};

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
    expectedPalette: EXPECTED_PALETTE,
    checks: [],
    screenshots: [],
  };

  try {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1800);

    const indexStyles = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const orbEl = document.querySelector('.btn-crystal-orb');
      const orbStyle = orbEl ? getComputedStyle(orbEl) : null;
      const headerTitleEl = document.querySelector('.header-main-title');
      const headerTitleStyle = headerTitleEl ? getComputedStyle(headerTitleEl) : null;
      const themeMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

      const tokens = {};
      [
        '--brand-mahogany-red',
        '--brand-prussian-blue',
        '--brand-baltic-blue',
        '--brand-neon-ice',
        '--brand-cornsilk',
        '--brand-sandy-clay',
        '--bg-main',
        '--text-main',
        '--sos-red',
        '--police-blue',
      ].forEach((k) => {
        tokens[k] = rootStyle.getPropertyValue(k).trim().toLowerCase();
      });

      return {
        themeMeta: (themeMeta || '').toLowerCase(),
        tokens,
        bodyBgColor: bodyStyle.backgroundColor,
        bodyTextColor: bodyStyle.color,
        orbBorder: orbStyle ? orbStyle.borderColor : null,
        headerTitleBgImage: headerTitleStyle ? headerTitleStyle.backgroundImage : null,
      };
    });

    const allTokensMatch = Object.entries(EXPECTED_PALETTE).every(
      ([k, v]) => indexStyles.tokens[k] === v
    );

    results.checks.push({
      id: 'index-root-brand-tokens',
      description: 'Verify all 6 official brand color tokens (--brand-*) in :root on index.html',
      passed: allTokensMatch,
      details: indexStyles.tokens,
    });

    results.checks.push({
      id: 'index-body-and-meta-colors',
      description: 'Verify index.html meta theme-color (#042348), body background rgb(4, 35, 72) and text rgb(241, 236, 203)',
      passed:
        indexStyles.themeMeta === '#042348' &&
        indexStyles.bodyBgColor === 'rgb(4, 35, 72)' &&
        indexStyles.bodyTextColor === 'rgb(241, 236, 203)',
      details: {
        themeMeta: indexStyles.themeMeta,
        bodyBgColor: indexStyles.bodyBgColor,
        bodyTextColor: indexStyles.bodyTextColor,
        orbBorder: indexStyles.orbBorder,
      },
    });

    const indexScreenshot = path.join(REPORT_DIR, 'official-palette-index-2026-10-12.png');
    await page.screenshot({ path: indexScreenshot, fullPage: false });
    results.screenshots.push(indexScreenshot);

    // Check manifest.json
    const manifestResp = await page.request.get(`${BASE_URL}/manifest.json`);
    const manifestJson = await manifestResp.json();
    results.checks.push({
      id: 'manifest-palette-sync',
      description: 'Verify manifest.json background_color (#042348) and theme_color (#AC0015)',
      passed:
        manifestJson.background_color?.toLowerCase() === '#042348' &&
        manifestJson.theme_color?.toLowerCase() === '#ac0015',
      details: {
        background_color: manifestJson.background_color,
        theme_color: manifestJson.theme_color,
      },
    });

    // Check dispatcher.html
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const gatekeeperScreenshot = path.join(REPORT_DIR, 'official-palette-dispatcher-gatekeeper-2026-10-12.png');
    await page.screenshot({ path: gatekeeperScreenshot, fullPage: false });
    results.screenshots.push(gatekeeperScreenshot);

    const dispatcherStyles = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const gateBtn = document.getElementById('btnSubmitGatekeeper');
      const gateBtnStyle = gateBtn ? getComputedStyle(gateBtn) : null;
      const portalView = document.getElementById('cosmicPortalView');
      const portalStyle = portalView ? getComputedStyle(portalView) : null;

      return {
        tacBgMain: rootStyle.getPropertyValue('--tac-bg-main').trim().toLowerCase(),
        bodyBgColor: bodyStyle.backgroundColor,
        bodyTextColor: bodyStyle.color,
        gateBtnBgImage: gateBtnStyle ? gateBtnStyle.backgroundImage : null,
        gateBtnColor: gateBtnStyle ? gateBtnStyle.color : null,
        portalBgColor: portalStyle ? portalStyle.backgroundColor : null,
      };
    });

    results.checks.push({
      id: 'dispatcher-palette-sync',
      description: 'Verify dispatcher.html tactical variables, Gatekeeper button Mahogany Red (#AC0015) + Cornsilk (#F1ECCB), and Cosmic Portal Prussian Blue (#042348)',
      passed:
        dispatcherStyles.tacBgMain === '#042348' &&
        dispatcherStyles.bodyBgColor === 'rgb(4, 35, 72)' &&
        dispatcherStyles.bodyTextColor === 'rgb(241, 236, 203)' &&
        dispatcherStyles.gateBtnColor === 'rgb(241, 236, 203)' &&
        dispatcherStyles.portalBgColor === 'rgb(4, 35, 72)',
      details: dispatcherStyles,
    });

    // Show Cosmic Portal view directly to capture screenshot of the 4 bubbles in the new palette
    await page.evaluate(() => {
      const gk = document.getElementById('cyberGatekeeperModal');
      const cp = document.getElementById('cosmicPortalView');
      if (gk) gk.style.display = 'none';
      if (cp) cp.style.display = 'block';
    });
    await page.waitForTimeout(1000);

    const portalScreenshot = path.join(REPORT_DIR, 'official-palette-dispatcher-portal-2026-10-12.png');
    await page.screenshot({ path: portalScreenshot, fullPage: false });
    results.screenshots.push(portalScreenshot);
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

  const jsonPath = path.join(REPORT_DIR, 'official-palette-2026-10-12.json');
  const mdPath = path.join(REPORT_DIR, 'official-palette-2026-10-12.md');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  const mdLines = [
    '# Official 6-Color Brand Palette Synchronization QA Report',
    '',
    `- **Timestamp**: ${results.timestamp}`,
    `- **Base URL**: ${results.baseUrl}`,
    `- **Overall Status**: **${results.summary.status}** (${results.summary.passed}/${results.summary.total} checks passed)`,
    '',
    '## Official Brand Palette',
    '- **Mahogany Red**: `#AC0015` (`rgb(172, 0, 21)`)',
    '- **Prussian Blue**: `#042348` (`rgb(4, 35, 72)`)',
    '- **Baltic Blue**: `#00669A` (`rgb(0, 102, 154)`)',
    '- **Neon Ice**: `#00ECF3` (`rgb(0, 236, 243)`)',
    '- **Cornsilk**: `#F1ECCB` (`rgb(241, 236, 203)`)',
    '- **Sandy Clay**: `#DFB077` (`rgb(223, 176, 119)`)',
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
