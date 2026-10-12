import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000/presentation.html';
const FALLBACK_URL = 'file:///' + path.resolve('presentation.html').replace(/\\/g, '/');
const OUT_DIR = path.resolve('Reports/qa/playwright');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });

  try {
    const res = await page.goto(URL, { waitUntil: 'networkidle', timeout: 8000 }).catch(() => null);
    if (!res || !res.ok()) {
      await page.goto(FALLBACK_URL, { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(500);

    const totalSlides = await page.locator('.slide').count();
    const slideMetrics = [];

    for (let i = 0; i < totalSlides; i++) {
      await page.evaluate((idx) => window.goToSlide(idx), i);
      await page.waitForTimeout(250);

      const m = await page.evaluate(() => {
        const active = document.querySelector('.slide.active');
        const inner = active.querySelector('.slide-inner') || active.querySelector('.hero-slide-box');
        return {
          title: (active.querySelector('h1, h2')?.textContent || '').trim(),
          scrollHeight: inner.scrollHeight,
          clientHeight: inner.clientHeight,
          fitsViewport: inner.scrollHeight <= inner.clientHeight + 4,
          notesPresent: (active.getAttribute('data-notes') || '').length > 20
        };
      });
      slideMetrics.push({ slideNumber: i + 1, ...m });

      if (i === 5) {
        await page.screenshot({ path: path.join(OUT_DIR, 'presentation-slide6-80percent-2026-10-12.png') });
      }
    }

    const allFit = slideMetrics.every((s) => s.fitsViewport);
    const report = {
      timestamp: new Date().toISOString(),
      totalSlides,
      allFitViewport: allFit,
      completionSlideVerified: slideMetrics[5]?.title.includes('80%') || false,
      slides: slideMetrics,
      overallStatus: totalSlides === 10 && allFit ? 'PASS' : 'FAIL'
    };

    fs.writeFileSync(
      path.join(OUT_DIR, 'presentation-slides-verify-2026-10-12.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(OUT_DIR, 'presentation-slides-verify-2026-10-12.md'),
      `# Presentation 8 Criteria Verification Report\n\n- **Status**: ${report.overallStatus}\n- **Total Slides**: ${totalSlides}\n- **All Fit Viewport (Zero Scroll)**: ${allFit}\n- **80% Completion Slide Verified**: ${report.completionSlideVerified}\n`,
      'utf8'
    );

    console.log(JSON.stringify(report, null, 2));
    if (report.overallStatus !== 'PASS') process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
