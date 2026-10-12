import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.SOS_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve('Reports/qa/playwright/2026-10-12-speed-up-sos-voice-prompt');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    suite: 'verify-sos-audio-speed-1-2x',
    tests: [],
    passed: 0,
    failed: 0
  };

  function assert(condition, name, details = {}) {
    const entry = { name, status: condition ? 'PASS' : 'FAIL', details };
    results.tests.push(entry);
    if (condition) results.passed++;
    else results.failed++;
    console.log(`[${entry.status}] ${name}`);
  }

  try {
    // =========================================================================
    // TEST 1: Xác thực thời lượng rút ngắn ở tốc độ 1.2x (+0.2x speed)
    // =========================================================================
    {
      const soundDir = path.resolve('assets/sounds');
      const voiceThresholds = {
        thuy_dung: { maxDur: 9.6, minDur: 8.5 },
        mai_anh: { maxDur: 11.2, minDur: 9.8 },
        truc_ly: { maxDur: 9.5, minDur: 8.4 },
        ngoc_huyen: { maxDur: 10.2, minDur: 9.0 }
      };

      const fileStats = {};
      let allVoicesSpeedUp = true;

      for (const [v, limits] of Object.entries(voiceThresholds)) {
        const mp3 = path.join(soundDir, `sos_prompt_${v}.mp3`);
        const wav = path.join(soundDir, `sos_prompt_${v}.wav`);
        const mp3Exists = fs.existsSync(mp3);
        const wavExists = fs.existsSync(wav);

        // Approximate duration from WAV PCM: size / (48000 * 2 channels * 2 bytes/sample) or wav size / (48000*2)
        // 16-bit mono 48000Hz = 96,000 bytes/sec
        const wavSize = wavExists ? fs.statSync(wav).size : 0;
        const durSec = (wavSize - 44) / (48000 * 2); // 16-bit mono PCM

        const durOk = durSec >= limits.minDur && durSec <= limits.maxDur;
        if (!durOk || !mp3Exists || !wavExists) allVoicesSpeedUp = false;

        fileStats[v] = {
          mp3Exists,
          wavExists,
          wavSize,
          calculatedDuration: Number(durSec.toFixed(2)),
          targetRange: `${limits.minDur}s - ${limits.maxDur}s`,
          durOk
        };
      }

      assert(
        allVoicesSpeedUp,
        `[VieNeu-TTS 1.2x Speed Audio] Cả 4 giọng đọc nữ (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) được rút ngắn thời lượng chính xác ở tốc độ 1.2x`,
        fileStats
      );
    }

    // =========================================================================
    // TEST 2: Citizen Portal - Trình duyệt nạp chính xác cache-buster 20261012_speed_1_2x
    // =========================================================================
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: UA
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/index.html?v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const interaction = await page.evaluate(async () => {
        const btn = document.getElementById('btnMasterSOS');
        if (!btn) return { hasBtn: false };

        btn.click();
        await new Promise(r => setTimeout(r, 600));

        const audio = window.sosApp ? window.sosApp.sosPromptAudio : null;
        const audioSrc = audio ? audio.src : null;

        return {
          hasBtn: true,
          audioCreated: !!audio,
          audioSrc,
          hasSpeed12xParam: audioSrc ? audioSrc.includes('20261012_speed_1_2x') : false
        };
      });

      const shotModal = path.join(OUT_DIR, 'citizen-sos-press-speed-1-2x.png');
      await page.screenshot({ path: shotModal });

      assert(
        interaction.hasSpeed12xParam && interaction.audioCreated,
        `[Audio Source 1.2x] Trình duyệt nạp chính xác audio khẩu lệnh 1.2x với cache-buster mới 20261012_speed_1_2x`,
        { audioSrc: interaction.audioSrc }
      );

      await context.close();
    }

  } finally {
    await browser.close();
  }

  // Write reports
  const jsonReportPath = path.join(OUT_DIR, 'report.json');
  const mdReportPath = path.join(OUT_DIR, 'report.md');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  const mdContent = `# SOS Audio 1.2x Speed Boost QA Verification Report

- **Timestamp**: \`${results.timestamp}\`
- **Total Tests**: \`${results.tests.length}\`
- **Passed**: **${results.passed} / ${results.tests.length}**
- **Failed**: **${results.failed}**

## Test Details

| Test Case | Status | Details |
|---|---|---|
${results.tests.map(t => `| ${t.name} | **${t.status}** | \`${JSON.stringify(t.details)}\` |`).join('\n')}

## Artifacts Generated
- \`citizen-sos-press-speed-1-2x.png\`
`;
  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`\nReport saved to:\n- ${jsonReportPath}\n- ${mdReportPath}`);
}

run().catch(console.error);
