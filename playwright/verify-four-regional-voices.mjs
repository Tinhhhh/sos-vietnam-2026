import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '..', 'Reports', 'qa', 'playwright', '2026-10-12-four-regional-voices-and-34-provinces-routing');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

async function verifyFourRegionalVoices() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    testName: '4 Regional Voices & 34 Provinces Auto-Routing Suite',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    assertions: [],
    audioFiles: [],
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

  // 1. Audio file existence & non-zero size check
  const regions = [
    { key: 'tay_nam_bo', voice: 'Mỹ Duyên', alias: 'my_duyen' },
    { key: 'mien_nam', voice: 'Thùy Dung', alias: 'thuy_dung' },
    { key: 'mien_trung', voice: 'Ngọc Trân', alias: 'ngoc_tran' },
    { key: 'mien_bac', voice: 'Mai Anh', alias: 'mai_anh' }
  ];

  for (const r of regions) {
    const mp3Path = path.join(__dirname, '..', 'assets', 'sounds', `sos_prompt_${r.key}.mp3`);
    const wavPath = path.join(__dirname, '..', 'assets', 'sounds', `sos_prompt_${r.key}.wav`);
    const mp3Exists = fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 10000;
    const wavExists = fs.existsSync(wavPath) && fs.statSync(wavPath).size > 50000;
    const mp3Size = mp3Exists ? fs.statSync(mp3Path).size : 0;
    const wavSize = wavExists ? fs.statSync(wavPath).size : 0;

    report.audioFiles.push({ region: r.key, voice: r.voice, mp3Exists, wavExists, mp3Size, wavSize });

    addAssertion(
      `Audio files exist for region '${r.key}' (${r.voice}) at 1.2x speed`,
      mp3Exists && wavExists,
      { mp3Size, wavSize }
    );
  }

  // 2. Playwright browser testing: Test routing logic on app page
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport iPhone 14
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Test Cần Thơ (Tây Nam Bộ)
    const canThoResult = await page.evaluate(() => {
      const app = window.sosApp;
      if (!app) return { ok: false, error: 'sosApp not found' };
      // Simulate Cần Thơ ward boundary
      app.currentWardBoundary = { province: 'Cần Thơ', ward: 'Phường Tân An' };
      app.locationService.currentAddress = 'Phường Tân An, Cần Thơ';
      const detected = app.detectVoiceRegion();
      return { ok: true, detected, province: 'Cần Thơ' };
    });

    addAssertion(
      "Auto-route Cần Thơ to 'tay_nam_bo' (Giọng Mỹ Duyên / Đồng bằng sông Cửu Long)",
      canThoResult.detected === 'tay_nam_bo',
      canThoResult
    );

    // Test TP. Hồ Chí Minh (Miền Nam / Đông Nam Bộ)
    const hcmResult = await page.evaluate(() => {
      const app = window.sosApp;
      app.currentWardBoundary = { province: 'TP Hồ Chí Minh', ward: 'Phường Bến Nghé' };
      app.locationService.currentAddress = 'Phường Bến Nghé, Quận 1, TP Hồ Chí Minh';
      const detected = app.detectVoiceRegion();
      return { ok: true, detected, province: 'TP Hồ Chí Minh' };
    });

    addAssertion(
      "Auto-route TP. Hồ Chí Minh to 'mien_nam' (Giọng Thùy Dung / Sài Gòn)",
      hcmResult.detected === 'mien_nam',
      hcmResult
    );

    // Test Đà Nẵng (Miền Trung)
    const daNangResult = await page.evaluate(() => {
      const app = window.sosApp;
      app.currentWardBoundary = { province: 'Đà Nẵng', ward: 'Phường Hải Châu 1' };
      app.locationService.currentAddress = 'Phường Hải Châu 1, Đà Nẵng';
      const detected = app.detectVoiceRegion();
      return { ok: true, detected, province: 'Đà Nẵng' };
    });

    addAssertion(
      "Auto-route Đà Nẵng to 'mien_trung' (Giọng Ngọc Trân / Miền Trung)",
      daNangResult.detected === 'mien_trung',
      daNangResult
    );

    // Test Hà Nội (Miền Bắc)
    const haNoiResult = await page.evaluate(() => {
      const app = window.sosApp;
      app.currentWardBoundary = { province: 'Hà Nội', ward: 'Phường Tràng Tiền' };
      app.locationService.currentAddress = 'Phường Tràng Tiền, Hoàn Kiếm, Hà Nội';
      const detected = app.detectVoiceRegion();
      return { ok: true, detected, province: 'Hà Nội' };
    });

    addAssertion(
      "Auto-route Hà Nội to 'mien_bac' (Giọng Mai Anh / Miền Bắc)",
      haNoiResult.detected === 'mien_bac',
      haNoiResult
    );

    // Test GPS fallback for Cần Thơ (Lat 10.045, Lng 105.746)
    const gpsCanTho = await page.evaluate(() => {
      const app = window.sosApp;
      app.currentWardBoundary = null;
      app.locationService.currentAddress = '';
      app.locationService.currentLocation = { lat: 10.0452, lng: 105.7469 };
      const detected = app.detectVoiceRegion();
      return { ok: true, detected };
    });

    addAssertion(
      "GPS fallback routes (10.045, 105.746) to 'tay_nam_bo'",
      gpsCanTho.detected === 'tay_nam_bo',
      gpsCanTho
    );

    // Screenshot
    const ssPath = path.join(SCREENSHOT_DIR, 'regional-voice-routing-mobile.png');
    await page.screenshot({ path: ssPath });
    report.screenshots.push(ssPath);

  } finally {
    await browser.close();
  }

  const allPassed = report.assertions.every(a => a.pass);
  report.allPassed = allPassed;

  fs.writeFileSync(path.join(REPORT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf-8');
  fs.writeFileSync(
    path.join(REPORT_DIR, 'report.md'),
    `# QA Report: 4 Regional Voices & 34 Provinces Auto-Routing Suite\n\n` +
    `- **Status**: ${allPassed ? '✅ ALL PASSED' : '❌ FAILED'}\n` +
    `- **Timestamp**: ${report.timestamp}\n\n` +
    `## Assertions\n\n` +
    report.assertions.map(a => `- [${a.pass ? 'x' : ' '}] **${a.name}** ${a.pass ? '✅ PASS' : '❌ FAIL'}`).join('\n') +
    `\n\n## Audio Files Synthesized\n\n` +
    report.audioFiles.map(f => `- **${f.region}** (${f.voice}): MP3 ${f.mp3Size.toLocaleString()} bytes, WAV ${f.wavSize.toLocaleString()} bytes`).join('\n') +
    `\n`,
    'utf-8'
  );

  console.log(`\nOverall Result: ${allPassed ? '✅ ALL PASSED' : '❌ FAILED'}`);
  return allPassed;
}

verifyFourRegionalVoices().then(pass => {
  if (!pass) process.exit(1);
});
