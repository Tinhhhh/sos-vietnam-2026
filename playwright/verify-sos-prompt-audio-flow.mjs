import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.SOS_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve('Reports/qa/playwright/2026-10-12-fix-sos-prompt-audio');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    suite: 'verify-sos-prompt-audio-flow',
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
    // TEST 1: Kiểm tra bộ file âm thanh VieNeu-TTS Studio 48kHz
    // =========================================================================
    {
      const soundDir = path.resolve('assets/sounds');
      const expectedVoices = ['thuy_dung', 'mai_anh', 'truc_ly', 'ngoc_huyen'];
      let allFilesOk = true;
      const fileStats = {};

      for (const v of expectedVoices) {
        const mp3 = path.join(soundDir, `sos_prompt_${v}.mp3`);
        const wav = path.join(soundDir, `sos_prompt_${v}.wav`);
        const mp3Exists = fs.existsSync(mp3) && fs.statSync(mp3).size > 80000;
        const wavExists = fs.existsSync(wav) && fs.statSync(wav).size > 900000;
        fileStats[v] = {
          mp3Exists,
          wavExists,
          mp3Size: fs.existsSync(mp3) ? fs.statSync(mp3).size : 0,
          wavSize: fs.existsSync(wav) ? fs.statSync(wav).size : 0
        };
        if (!mp3Exists || !wavExists) allFilesOk = false;
      }

      assert(
        allFilesOk,
        `[VieNeu-TTS 48kHz Audio Files] 4 giọng đọc nữ (Thùy Dung, Mai Anh, Trúc Ly, Ngọc Huyền) đạt kích thước studio và tồn tại đầy đủ MP3/WAV`,
        fileStats
      );
    }

    // =========================================================================
    // TEST 2: Citizen Portal - Nhấn nút SOS kích hoạt giọng đọc chuẩn và mở modal chọn đơn vị
    // =========================================================================
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: UA
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/index.html?v=${Date.now()}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Verify and trigger SOS button
      const interaction = await page.evaluate(async () => {
        const btn = document.getElementById('btnMasterSOS');
        if (!btn) return { hasBtn: false };

        // Click master SOS
        btn.click();
        await new Promise(r => setTimeout(r, 600));

        const modal = document.getElementById('sosDetailModal');
        const modalOpen = modal && modal.classList.contains('is-open');

        const audio = window.sosApp ? window.sosApp.sosPromptAudio : null;
        const audioSrc = audio ? audio.src : null;

        // Verify agency selector elements
        const agencyCards = document.querySelectorAll('.agency-card');
        const agencies = Array.from(agencyCards).map(c => ({
          agency: c.dataset.agency,
          title: c.querySelector('.agency-title')?.textContent.trim()
        }));

        const confirmBtn = document.getElementById('btnConfirmSOS');

        return {
          hasBtn: true,
          modalOpen,
          audioCreated: !!audio,
          audioSrc,
          hasDispatchFlowParam: audioSrc ? audioSrc.includes('20261012_agency_dispatch_flow') : false,
          agencyCount: agencies.length,
          agencies,
          hasConfirmBtn: !!confirmBtn,
          confirmBtnText: confirmBtn ? confirmBtn.textContent.replace(/\s+/g, ' ').trim() : null
        };
      });

      const shotModal = path.join(OUT_DIR, 'citizen-sos-press-modal-selection.png');
      await page.screenshot({ path: shotModal });

      assert(
        interaction.modalOpen,
        `[Citizen SOS Click] Nhấn nút SOS mở modal hiển thị các đơn vị lực lượng cứu nạn`,
        { modalOpen: interaction.modalOpen }
      );

      assert(
        interaction.hasDispatchFlowParam && interaction.audioCreated,
        `[Audio Source] Trình duyệt nạp chính xác audio khẩu lệnh với cache-buster mới 20261012_agency_dispatch_flow`,
        { audioSrc: interaction.audioSrc }
      );

      assert(
        interaction.agencyCount === 5,
        `[Agency Selection] Hiển thị đầy đủ 5 lực lượng cứu nạn (Công an, CSGT, PCCC & CNCH, Dịch vụ Cứu hộ, Cấp cứu) để người dân chọn trước khi chuyển tiếp trực ban`,
        interaction.agencies
      );

      assert(
        interaction.hasConfirmBtn && interaction.confirmBtnText.includes('XÁC NHẬN PHÁT TÍN HIỆU CỨU HỘ'),
        `[Confirm Dispatch] Nút xác nhận phát tín hiệu điều phối cứu hộ hiện diện sẵn sàng`,
        { confirmBtnText: interaction.confirmBtnText }
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

  const mdContent = `# SOS Prompt Voice Flow QA Verification Report

- **Timestamp**: \`${results.timestamp}\`
- **Total Tests**: \`${results.tests.length}\`
- **Passed**: **${results.passed} / ${results.tests.length}**
- **Failed**: **${results.failed}**

## Test Details

| Test Case | Status | Details |
|---|---|---|
${results.tests.map(t => `| ${t.name} | **${t.status}** | \`${JSON.stringify(t.details)}\` |`).join('\n')}

## Artifacts Generated
- \`citizen-sos-press-modal-selection.png\`
`;
  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`\nReport saved to:\n- ${jsonReportPath}\n- ${mdReportPath}`);
}

run().catch(console.error);
