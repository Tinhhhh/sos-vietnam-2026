import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'iPhone 13 (390x844)', width: 390, height: 844 },
    { name: 'Galaxy S20 (412x915)', width: 412, height: 915 },
    { name: 'iPhone SE (375x667)', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, userAgent: UA });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => {
      const video = document.getElementById('citizenBgVideo');
      const orb = document.getElementById('crystalOrbWrapper');
      const btn = document.getElementById('btnMasterSOS');
      const hero = document.querySelector('.sos-hero');
      const vr = video ? video.getBoundingClientRect() : null;
      const or = orb ? orb.getBoundingClientRect() : null;
      const hr = hero ? hero.getBoundingClientRect() : null;

      const videoRect = vr ? { left: vr.left, top: vr.top, width: vr.width, height: vr.height } : null;
      const orbRect = or ? { left: or.left, top: or.top, width: or.width, height: or.height } : null;
      const heroRect = hr ? { left: hr.left, top: hr.top, width: hr.width, height: hr.height } : null;

      return {
        video: video ? {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          rect: videoRect,
          computedTransform: window.getComputedStyle(video).transform,
          computedObjPos: window.getComputedStyle(video).objectPosition,
          center: videoRect ? { x: videoRect.left + videoRect.width / 2, y: videoRect.top + videoRect.height / 2 } : null
        } : null,
        orb: orb ? {
          rect: orbRect,
          computedMargin: window.getComputedStyle(orb).margin,
          center: orbRect ? { x: orbRect.left + orbRect.width / 2, y: orbRect.top + orbRect.height / 2 } : null
        } : null,
        heroRect,
        window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight }
      };
    });

    console.log(`\n=== Viewport: ${vp.name} ===`);
    console.log('Window:', metrics.window);
    console.log('Video dimensions:', metrics.video?.videoWidth, 'x', metrics.video?.videoHeight);
    console.log('Video Center:', metrics.video?.center);
    console.log('Orb Center:', metrics.orb?.center);
    console.log('Orb Margin:', metrics.orb?.computedMargin);
    if (metrics.video && metrics.orb) {
      const deltaX = metrics.orb.center.x - metrics.video.center.x;
      const deltaY = metrics.orb.center.y - metrics.video.center.y;
      console.log(`Delta (Orb - Video Center): X=${deltaX.toFixed(1)}px, Y=${deltaY.toFixed(1)}px`);
    }

    // Take screenshot of baseline before fix
    await page.screenshot({ path: `Reports/qa/playwright/baseline-${vp.width}x${vp.height}.png` });
    await page.close();
  }

  await browser.close();
}

inspect().catch(console.error);
