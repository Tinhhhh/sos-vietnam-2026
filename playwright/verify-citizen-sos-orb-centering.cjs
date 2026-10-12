'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.SOS_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright', '2026-10-12-citizen-sos-orb-centering');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = {
    suite: 'verify-citizen-sos-orb-centering',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    viewports: [],
    assertions: [],
    passed: 0,
    failed: 0
  };

  function assert(condition, name, details = {}) {
    const entry = { name, status: condition ? 'PASS' : 'FAIL', details };
    results.assertions.push(entry);
    if (condition) results.passed++;
    else results.failed++;
  }

  const testConfigs = [
    { label: 'desktop-1920x912', width: 1920, height: 912, minOrbSize: 185, minCenterRatio: 0.43, maxCenterRatio: 0.54 },
    { label: 'laptop-1440x900', width: 1440, height: 900, minOrbSize: 180, minCenterRatio: 0.43, maxCenterRatio: 0.54 },
    { label: 'mobile-390x844', width: 390, height: 844, minOrbSize: 150, minCenterRatio: 0.40, maxCenterRatio: 0.56 }
  ];

  try {
    for (const cfg of testConfigs) {
      const context = await browser.newContext({
        viewport: { width: cfg.width, height: cfg.height },
        userAgent: UA
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/?v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#btnMasterSOS', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(800);

      const metrics = await page.evaluate(() => {
        const orb = document.getElementById('btnMasterSOS');
        const wrapper = document.getElementById('crystalOrbWrapper');
        const legal = document.getElementById('legalWarningHero');
        const nav = document.getElementById('mainHeaderNav');

        const orbRect = orb ? orb.getBoundingClientRect() : null;
        const wrapRect = wrapper ? wrapper.getBoundingClientRect() : null;
        const legalRect = legal ? legal.getBoundingClientRect() : null;
        const navRect = nav ? nav.getBoundingClientRect() : null;

        const orbCenterX = orbRect ? orbRect.left + orbRect.width / 2 : 0;
        const orbCenterY = orbRect ? orbRect.top + orbRect.height / 2 : 0;

        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          orb: orbRect ? {
            width: Math.round(orbRect.width * 10) / 10,
            height: Math.round(orbRect.height * 10) / 10,
            top: Math.round(orbRect.top * 10) / 10,
            bottom: Math.round(orbRect.bottom * 10) / 10,
            centerX: Math.round(orbCenterX * 10) / 10,
            centerY: Math.round(orbCenterY * 10) / 10,
            centerXRatio: Number((orbCenterX / window.innerWidth).toFixed(4)),
            centerYRatio: Number((orbCenterY / window.innerHeight).toFixed(4))
          } : null,
          wrapper: wrapRect ? {
            width: Math.round(wrapRect.width * 10) / 10,
            height: Math.round(wrapRect.height * 10) / 10,
            top: Math.round(wrapRect.top * 10) / 10,
            bottom: Math.round(wrapRect.bottom * 10) / 10
          } : null,
          legalTop: legalRect ? Math.round(legalRect.top * 10) / 10 : null,
          navTop: navRect ? Math.round(navRect.top * 10) / 10 : null
        };
      });

      const screenshotPath = path.join(OUT_DIR, `sos-orb-${cfg.label}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      metrics.screenshot = screenshotPath;
      metrics.label = cfg.label;
      results.viewports.push(metrics);

      assert(
        metrics.orb && metrics.orb.width >= cfg.minOrbSize && metrics.orb.height >= cfg.minOrbSize,
        `[${cfg.label}] Red SOS sphere diameter >= ${cfg.minOrbSize}px`,
        { actualWidth: metrics.orb?.width, actualHeight: metrics.orb?.height, minExpected: cfg.minOrbSize }
      );

      assert(
        metrics.orb && Math.abs(metrics.orb.centerXRatio - 0.5) <= 0.02,
        `[${cfg.label}] Red SOS sphere horizontally centered in viewport`,
        { centerXRatio: metrics.orb?.centerXRatio }
      );

      assert(
        metrics.orb && metrics.orb.centerYRatio >= cfg.minCenterRatio && metrics.orb.centerYRatio <= cfg.maxCenterRatio,
        `[${cfg.label}] Red SOS sphere vertically centered inside radiating hand circles (${cfg.minCenterRatio}-${cfg.maxCenterRatio})`,
        { centerYRatio: metrics.orb?.centerYRatio, centerY: metrics.orb?.centerY, viewportHeight: metrics.viewportHeight }
      );

      assert(
        metrics.orb && metrics.legalTop && metrics.orb.bottom < metrics.legalTop - 16,
        `[${cfg.label}] Red SOS sphere does not overlap bottom legal warning bar`,
        { orbBottom: metrics.orb?.bottom, legalTop: metrics.legalTop }
      );

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const jsonPath = path.join(OUT_DIR, 'report.json');
  const mdPath = path.join(OUT_DIR, 'report.md');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  const mdLines = [
    '# Citizen SOS Sphere Centering & Size Verification Report',
    '',
    `- **Timestamp**: \`${results.timestamp}\``,
    `- **Base URL**: \`${results.baseUrl}\``,
    `- **Passed**: **${results.passed} / ${results.assertions.length}**`,
    `- **Failed**: **${results.failed}**`,
    '',
    '## Viewport Measurements',
    '',
    '| Viewport | Orb Size (px) | Wrapper Size (px) | Orb Center Y (px / ratio) | Legal Banner Top (px) | Screenshot |',
    '|---|---|---|---|---|---|',
    ...results.viewports.map(v =>
      `| \`${v.label}\` (${v.viewportWidth}x${v.viewportHeight}) | \`${v.orb?.width}x${v.orb?.height}\` | \`${v.wrapper?.width}x${v.wrapper?.height}\` | \`${v.orb?.centerY}px\` (\`${(v.orb?.centerYRatio * 100).toFixed(1)}%\`) | \`${v.legalTop}px\` | \`${path.basename(v.screenshot)}\` |`
    ),
    '',
    '## Assertions',
    '',
    ...results.assertions.map(a => `- **[${a.status}]** ${a.name} — \`${JSON.stringify(a.details)}\``)
  ];
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log(JSON.stringify({ passed: results.passed, failed: results.failed, viewports: results.viewports }, null, 2));
  if (results.failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
