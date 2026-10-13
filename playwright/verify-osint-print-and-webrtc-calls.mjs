import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.SOS_BASE_URL || 'http://localhost:3000';
const DISPATCHER_USER = process.env.SOS_DISPATCHER_USER || 'admin';
const DISPATCHER_PASS = process.env.SOS_DISPATCHER_PASS || '2002';
const OUT_DIR = path.resolve('Reports/qa/playwright');
const SHOT_DIR = path.resolve('Reports/qa/playwright/2026-10-13-osint-print-webrtc-screenshots');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const startTime = Date.now();
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const results = {
    timestamp: new Date().toISOString(),
    suite: 'verify-osint-print-and-webrtc-calls',
    baseUrl: BASE_URL,
    tests: [],
    metrics: {},
    passed: 0,
    failed: 0
  };

  function assert(condition, name, details = {}) {
    const entry = { name, status: condition ? 'PASS' : 'FAIL', details };
    results.tests.push(entry);
    if (condition) results.passed++;
    else results.failed++;
    console.log(`[${entry.status}] ${name}`, JSON.stringify(details));
  }

  const citizenCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: UA,
    permissions: ['microphone', 'camera', 'geolocation'],
    geolocation: { latitude: 10.0364, longitude: 105.7876 }
  });
  const citizenPage = await citizenCtx.newPage();

  const dispatcherCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: UA,
    permissions: ['microphone', 'camera'],
    acceptDownloads: true
  });
  const dispatcherPage = await dispatcherCtx.newPage();

  citizenPage.on('dialog', d => d.accept().catch(() => {}));
  dispatcherPage.on('dialog', d => d.accept().catch(() => {}));
  citizenPage.on('pageerror', e => console.log('[citizen pageerror]', e.message));
  dispatcherPage.on('pageerror', e => console.log('[dispatcher pageerror]', e.message));

  try {
    // =========================================================================
    // SETUP: Citizen submits a real SOS & Dispatcher logs in
    // =========================================================================
    await dispatcherPage.addInitScript(() => {
      sessionStorage.setItem('sos_gatekeeper_pass', 'true');
    });
    await dispatcherPage.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded' });
    await dispatcherPage.getByText('CÔNG AN', { exact: true }).click({ force: true }).catch(() => {});
    await dispatcherPage.waitForSelector('#loginUsername', { state: 'visible', timeout: 10000 });
    await dispatcherPage.fill('#loginUsername', DISPATCHER_USER);
    await dispatcherPage.fill('#loginPassword', DISPATCHER_PASS);
    const loginBtn = dispatcherPage.locator('button:has-text("ĐĂNG NHẬP")').first();
    if (await loginBtn.count() > 0) await loginBtn.click({ force: true });
    await dispatcherPage.waitForFunction(() => {
      const d = window.dispatcherApp || window.app;
      return !!(d && d.currentOfficer);
    }, { timeout: 10000 });

    await citizenPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await citizenPage.locator('#btnMasterSOS').click({ force: true });
    await citizenPage.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });
    await citizenPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
      if (btn) btn.click();
    });
    await citizenPage.waitForFunction(() => {
      const inc = window.app && window.app.activeIncident;
      return !!(inc && inc.id);
    }, { timeout: 15000 });

    const incidentId = await citizenPage.evaluate(() => window.app.activeIncident.id);
    console.log('Created real SOS incidentId:', incidentId);

    // Ensure dispatcher receives/selects the incident
    await dispatcherPage.waitForFunction((incId) => {
      const d = window.dispatcherApp || window.app;
      return !!(d && Array.from(d.incidents?.values?.() || d.incidents || []).some(i => (i.id || i[0]) === incId));
    }, incidentId, { timeout: 10000 }).catch(async () => {
      await dispatcherPage.evaluate(async () => {
        const d = window.dispatcherApp || window.app;
        if (d && typeof d.fetchIncidents === 'function') await d.fetchIncidents();
      });
    });

    await dispatcherPage.evaluate((incId) => {
      const d = window.dispatcherApp || window.app;
      if (d && typeof d.selectIncident === 'function') d.selectIncident(incId);
      else if (d) d.selectedIncidentId = incId;
    }, incidentId);

    // =========================================================================
    // TEST 1A: Two-Way Voice Call (Dispatcher -> Citizen)
    // =========================================================================
    {
      const t0 = Date.now();
      await dispatcherPage.evaluate((incId) => {
        const d = window.dispatcherApp || window.app;
        d.openDispatcherVoiceCall(incId, false);
      }, incidentId);

      await citizenPage.waitForFunction(() => {
        const modal = document.getElementById('videoCallCitizenRequestModal');
        return modal && modal.classList.contains('is-open');
      }, { timeout: 10000 });

      await citizenPage.evaluate(() => {
        document.getElementById('btnAcceptCitizenCall')?.click();
      });

      await citizenPage.waitForFunction(() => {
        const pc = window.app?.citizenVoicePeerConnection;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState);
      }, { timeout: 10000 });

      await dispatcherPage.waitForFunction(() => {
        const d = window.dispatcherApp || window.app;
        const pc = d?.dispatcherVoicePeerConnection;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState);
      }, { timeout: 10000 });

      const voiceD2CMetrics = await Promise.all([
        citizenPage.evaluate(() => ({
          iceState: window.app?.citizenVoicePeerConnection?.iceConnectionState || 'none',
          hasRemoteStream: !!(document.getElementById('citizenRemoteVoiceAudio')?.srcObject),
          statusText: document.getElementById('citizenVoiceCallStatus')?.textContent?.trim() || ''
        })),
        dispatcherPage.evaluate(() => {
          const d = window.dispatcherApp || window.app;
          return {
            iceState: d?.dispatcherVoicePeerConnection?.iceConnectionState || 'none',
            hasRemoteStream: !!(document.getElementById('dispatcherRemoteVoiceAudio')?.srcObject),
            statusText: document.getElementById('dispatcherVoiceCallStatus')?.textContent?.trim() || ''
          };
        })
      ]);

      const setupMs = Date.now() - t0;
      results.metrics.voiceDispatcherToCitizenMs = setupMs;

      assert(
        ['connected', 'completed'].includes(voiceD2CMetrics[0].iceState) &&
        ['connected', 'completed'].includes(voiceD2CMetrics[1].iceState) &&
        voiceD2CMetrics[0].hasRemoteStream &&
        voiceD2CMetrics[1].hasRemoteStream,
        '[Gọi Thường: Trực ban -> Công dân] Kết nối WebRTC 2 chiều thành công và gắn luồng âm thanh hai bên',
        { citizen: voiceD2CMetrics[0], dispatcher: voiceD2CMetrics[1], setupMs }
      );

      await dispatcherPage.evaluate(() => {
        const d = window.dispatcherApp || window.app;
        d.endDispatcherVoiceCall(true);
      });
      await citizenPage.waitForTimeout(600);
    }

    // =========================================================================
    // TEST 1B: Two-Way Voice Call (Citizen -> Dispatcher)
    // =========================================================================
    {
      const t0 = Date.now();
      await citizenPage.evaluate(() => {
        window.app.startCitizenVoiceCall(true);
      });

      await dispatcherPage.waitForFunction(() => {
        const modal = document.getElementById('dispatcherIncomingCallModal');
        return modal && window.getComputedStyle(modal).display !== 'none';
      }, { timeout: 10000 });

      await dispatcherPage.evaluate(() => {
        document.getElementById('btnAcceptIncomingCallFromCitizen')?.click();
      });

      await citizenPage.waitForFunction(() => {
        const pc = window.app?.citizenVoicePeerConnection;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState);
      }, { timeout: 10000 });

      await dispatcherPage.waitForFunction(() => {
        const d = window.dispatcherApp || window.app;
        const pc = d?.dispatcherVoicePeerConnection;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState);
      }, { timeout: 10000 });

      const voiceC2DMetrics = await Promise.all([
        citizenPage.evaluate(() => ({
          iceState: window.app?.citizenVoicePeerConnection?.iceConnectionState || 'none',
          hasRemoteStream: !!(document.getElementById('citizenRemoteVoiceAudio')?.srcObject)
        })),
        dispatcherPage.evaluate(() => {
          const d = window.dispatcherApp || window.app;
          return {
            iceState: d?.dispatcherVoicePeerConnection?.iceConnectionState || 'none',
            hasRemoteStream: !!(document.getElementById('dispatcherRemoteVoiceAudio')?.srcObject)
          };
        })
      ]);

      const setupMs = Date.now() - t0;
      results.metrics.voiceCitizenToDispatcherMs = setupMs;

      assert(
        ['connected', 'completed'].includes(voiceC2DMetrics[0].iceState) &&
        ['connected', 'completed'].includes(voiceC2DMetrics[1].iceState) &&
        voiceC2DMetrics[0].hasRemoteStream &&
        voiceC2DMetrics[1].hasRemoteStream,
        '[Gọi Thường: Công dân -> Trực ban] Công dân gọi đến Trực ban đổ chuông, bắt máy và kết nối WebRTC 2 chiều thành công',
        { citizen: voiceC2DMetrics[0], dispatcher: voiceC2DMetrics[1], setupMs }
      );

      await citizenPage.evaluate(() => {
        window.app.endCitizenVoiceCall(true);
      });
      await dispatcherPage.waitForTimeout(600);
    }

    // =========================================================================
    // TEST 1C: Two-Way Video Call (Dispatcher -> Citizen)
    // =========================================================================
    {
      const t0 = Date.now();
      await dispatcherPage.evaluate((incId) => {
        const d = window.dispatcherApp || window.app;
        d.startDispatcherVideoCall(incId);
      }, incidentId);

      await citizenPage.waitForFunction(() => {
        const modal = document.getElementById('videoCallCitizenRequestModal');
        return modal && modal.classList.contains('is-open');
      }, { timeout: 10000 });

      await citizenPage.evaluate(() => {
        document.getElementById('btnAcceptCitizenCall')?.click();
      });

      await citizenPage.waitForFunction(() => {
        const pc = window.app?.citizenVideoPeerConnection;
        const rs = window.app?.citizenVideoRemoteStream;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState) && rs && rs.getTracks().length > 0;
      }, { timeout: 12000 });

      await dispatcherPage.waitForFunction(() => {
        const d = window.dispatcherApp || window.app;
        const pc = d?.dispatcherVideoPeerConnection;
        const rv = document.getElementById('dispatcherRemoteVideoElement');
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState) && rv && rv.srcObject;
      }, { timeout: 12000 });

      const videoD2CMetrics = await Promise.all([
        citizenPage.evaluate(() => {
          const rs = window.app?.citizenVideoRemoteStream;
          const lv = document.getElementById('citizenLiveVideoElement');
          return {
            iceState: window.app?.citizenVideoPeerConnection?.iceConnectionState || 'none',
            remoteTracks: rs ? rs.getTracks().length : 0,
            localVideoTracks: lv?.srcObject ? lv.srcObject.getVideoTracks().length : 0
          };
        }),
        dispatcherPage.evaluate(() => {
          const d = window.dispatcherApp || window.app;
          const rv = document.getElementById('dispatcherRemoteVideoElement');
          return {
            iceState: d?.dispatcherVideoPeerConnection?.iceConnectionState || 'none',
            remoteVideoTracks: rv?.srcObject ? rv.srcObject.getVideoTracks().length : 0
          };
        })
      ]);

      const setupMs = Date.now() - t0;
      results.metrics.videoDispatcherToCitizenMs = setupMs;

      await dispatcherPage.screenshot({ path: path.join(SHOT_DIR, 'video-call-dispatcher-connected.png') });
      await citizenPage.screenshot({ path: path.join(SHOT_DIR, 'video-call-citizen-connected.png') });

      assert(
        ['connected', 'completed'].includes(videoD2CMetrics[0].iceState) &&
        ['connected', 'completed'].includes(videoD2CMetrics[1].iceState) &&
        videoD2CMetrics[0].remoteTracks > 0 &&
        videoD2CMetrics[1].remoteVideoTracks > 0,
        '[Gọi Video: Trực ban -> Công dân] Kết nối WebRTC Video 2 chiều thành công, truyền hình ảnh camera hai bên',
        { citizen: videoD2CMetrics[0], dispatcher: videoD2CMetrics[1], setupMs }
      );

      await dispatcherPage.evaluate(() => {
        const d = window.dispatcherApp || window.app;
        d.endDispatcherVideoCall(true);
      });
      await citizenPage.waitForTimeout(600);
    }

    // =========================================================================
    // TEST 1D: Two-Way Video Call (Citizen -> Dispatcher)
    // =========================================================================
    {
      const t0 = Date.now();
      await citizenPage.evaluate(() => {
        window.app.initiateCitizenVideoCallToDispatcher();
      });

      await dispatcherPage.waitForFunction(() => {
        const modal = document.getElementById('dispatcherIncomingCallModal');
        return modal && window.getComputedStyle(modal).display !== 'none';
      }, { timeout: 10000 });

      await dispatcherPage.evaluate(() => {
        document.getElementById('btnAcceptIncomingCallFromCitizen')?.click();
      });

      await citizenPage.waitForFunction(() => {
        const pc = window.app?.citizenVideoPeerConnection;
        const rs = window.app?.citizenVideoRemoteStream;
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState) && rs && rs.getTracks().length > 0;
      }, { timeout: 12000 });

      await dispatcherPage.waitForFunction(() => {
        const d = window.dispatcherApp || window.app;
        const pc = d?.dispatcherVideoPeerConnection;
        const rv = document.getElementById('dispatcherRemoteVideoElement');
        return pc && ['connected', 'completed'].includes(pc.iceConnectionState) && rv && rv.srcObject;
      }, { timeout: 12000 });

      const videoC2DMetrics = await Promise.all([
        citizenPage.evaluate(() => {
          const rs = window.app?.citizenVideoRemoteStream;
          return {
            iceState: window.app?.citizenVideoPeerConnection?.iceConnectionState || 'none',
            remoteTracks: rs ? rs.getTracks().length : 0
          };
        }),
        dispatcherPage.evaluate(() => {
          const d = window.dispatcherApp || window.app;
          const rv = document.getElementById('dispatcherRemoteVideoElement');
          return {
            iceState: d?.dispatcherVideoPeerConnection?.iceConnectionState || 'none',
            remoteVideoTracks: rv?.srcObject ? rv.srcObject.getVideoTracks().length : 0
          };
        })
      ]);

      const setupMs = Date.now() - t0;
      results.metrics.videoCitizenToDispatcherMs = setupMs;

      assert(
        ['connected', 'completed'].includes(videoC2DMetrics[0].iceState) &&
        ['connected', 'completed'].includes(videoC2DMetrics[1].iceState) &&
        videoC2DMetrics[0].remoteTracks > 0 &&
        videoC2DMetrics[1].remoteVideoTracks > 0,
        '[Gọi Video: Công dân -> Trực ban] Công dân gọi Video đến Trực ban, bắt máy và truyền luồng hình ảnh 2 chiều thành công',
        { citizen: videoC2DMetrics[0], dispatcher: videoC2DMetrics[1], setupMs }
      );

      await citizenPage.evaluate(() => {
        window.app.endCitizenLiveStream(true);
      });
      await dispatcherPage.waitForTimeout(600);
    }

    // =========================================================================
    // TEST 2: Intake Sheet Print / PDF (@media print) & Word Export
    // =========================================================================
    {
      await dispatcherPage.evaluate((incId) => {
        const d = window.dispatcherApp || window.app;
        const inc = d.incidents.get(incId) || { id: incId, reporterName: 'Người dân', reporterPhone: '0912345678' };
        d.openReportModal(inc);
      }, incidentId);

      await dispatcherPage.waitForFunction(() => {
        const m = document.getElementById('incidentReportDocxModal');
        return m && window.getComputedStyle(m).display !== 'none';
      }, { timeout: 10000 });

      // Emulate @media print with printing-incident-report class
      await dispatcherPage.evaluate(() => {
        document.body.classList.add('printing-incident-report');
      });
      await dispatcherPage.emulateMedia({ media: 'print' });

      const printMetrics = await dispatcherPage.evaluate(() => {
        const modal = document.getElementById('incidentReportDocxModal');
        const sheet = document.getElementById('reportSheetContainer');
        const statsModal = document.getElementById('territoryStatsModal');
        const sheetRect = sheet ? sheet.getBoundingClientRect() : { width: 0, height: 0 };
        const modalStyle = modal ? window.getComputedStyle(modal) : null;
        const sheetStyle = sheet ? window.getComputedStyle(sheet) : null;
        const statsStyle = statsModal ? window.getComputedStyle(statsModal) : null;

        return {
          modalDisplay: modalStyle?.display,
          modalVisibility: modalStyle?.visibility,
          sheetVisibility: sheetStyle?.visibility,
          sheetWidth: Math.round(sheetRect.width),
          sheetHeight: Math.round(sheetRect.height),
          territoryStatsDisplay: statsStyle?.display
        };
      });

      await dispatcherPage.screenshot({ path: path.join(SHOT_DIR, 'intake-report-print-preview.png') });

      await dispatcherPage.emulateMedia({ media: 'screen' });
      await dispatcherPage.evaluate(() => {
        document.body.classList.remove('printing-incident-report');
      });

      assert(
        printMetrics.modalDisplay !== 'none' &&
        printMetrics.sheetVisibility === 'visible' &&
        printMetrics.sheetWidth > 400 &&
        printMetrics.sheetHeight > 400 &&
        printMetrics.territoryStatsDisplay === 'none',
        '[Phiếu Tiếp Nhận Tin: In / Xuất PDF] Chế độ @media print hiển thị đầy đủ #reportSheetContainer trên khổ A4 và ẩn hoàn toàn #territoryStatsModal (không bị 3 trang trắng)',
        printMetrics
      );

      // Test Word (.docx) download from Intake Sheet
      const t0Docx = Date.now();
      const [intakeDownload] = await Promise.all([
        dispatcherPage.waitForEvent('download', { timeout: 15000 }),
        dispatcherPage.evaluate(() => {
          const d = window.dispatcherApp || window.app;
          d.downloadReportDocx();
        })
      ]);
      const intakeSavePath = path.join(SHOT_DIR, intakeDownload.suggestedFilename());
      await intakeDownload.saveAs(intakeSavePath);
      const intakeFileSize = fs.existsSync(intakeSavePath) ? fs.statSync(intakeSavePath).size : 0;
      results.metrics.intakeDocxExportMs = Date.now() - t0Docx;
      results.metrics.intakeDocxSizeBytes = intakeFileSize;

      assert(
        intakeFileSize > 10000,
        '[Phiếu Tiếp Nhận Tin: Xuất Word (.docx)] Tải xuống thành công file Word NĐ30/2020/NĐ-CP từ /api/export/docx',
        { filename: intakeDownload.suggestedFilename(), sizeBytes: intakeFileSize, exportMs: results.metrics.intakeDocxExportMs }
      );

      // Close intake modal
      await dispatcherPage.evaluate(() => {
        const m = document.getElementById('incidentReportDocxModal');
        if (m) {
          m.classList.remove('is-open');
          m.style.display = 'none';
        }
      });
    }

    // =========================================================================
    // TEST 3: Báo khống -> #osintForensicModal -> Lập biên bản Word
    // =========================================================================
    {
      const t0Flag = Date.now();
      await dispatcherPage.evaluate(async (incId) => {
        const d = window.dispatcherApp || window.app;
        const inc = d.incidents.get(incId) || { id: incId, reporterName: 'Người dân', reporterPhone: '0912345678' };
        d.openFakeAlarmConfirmModal(inc);
        const form = document.getElementById('formConfirmFakeAlarm');
        if (form) form.requestSubmit();
      }, incidentId);

      await dispatcherPage.waitForFunction(() => {
        const m = document.getElementById('osintForensicModal');
        return m && window.getComputedStyle(m).display === 'flex';
      }, { timeout: 10000 });
      results.metrics.flagFakeMs = Date.now() - t0Flag;

      const osintMetrics = await dispatcherPage.evaluate(() => {
        const modal = document.getElementById('osintForensicModal');
        const box = modal?.querySelector('.osint-forensic-box');
        const dossierEl = document.getElementById('osintDossierId');
        const boxRect = box ? box.getBoundingClientRect() : { top: -999, bottom: 0, width: 0, height: 0 };
        return {
          dossierIdText: dossierEl ? dossierEl.textContent.trim() : '',
          boxTop: Math.round(boxRect.top),
          boxBottom: Math.round(boxRect.bottom),
          boxHeight: Math.round(boxRect.height),
          viewportHeight: window.innerHeight
        };
      });

      await dispatcherPage.screenshot({ path: path.join(SHOT_DIR, 'osint-forensic-modal-fixed.png') });

      assert(
        osintMetrics.dossierIdText.includes(incidentId) &&
        !osintMetrics.dossierIdText.includes('DOS-FAKE-01') &&
        osintMetrics.boxTop >= 0 &&
        osintMetrics.boxBottom <= osintMetrics.viewportHeight,
        '[Báo khống & OSINT Forensic Modal] Hộp thoại #osintForensicModal không bị cắt tiêu đề trên đỉnh và hiển thị đúng mã hồ sơ thực',
        osintMetrics
      );

      // Click "LẬP BIÊN BẢN (WORD)" (#btnDraftAdministrativeRecord)
      const t0AdminDocx = Date.now();
      const [adminDownload] = await Promise.all([
        dispatcherPage.waitForEvent('download', { timeout: 15000 }),
        dispatcherPage.evaluate(() => {
          document.getElementById('btnDraftAdministrativeRecord')?.click();
        })
      ]);
      const adminSavePath = path.join(SHOT_DIR, adminDownload.suggestedFilename());
      await adminDownload.saveAs(adminSavePath);
      const adminFileSize = fs.existsSync(adminSavePath) ? fs.statSync(adminSavePath).size : 0;
      results.metrics.adminRecordDocxExportMs = Date.now() - t0AdminDocx;
      results.metrics.adminRecordDocxSizeBytes = adminFileSize;

      assert(
        adminFileSize > 10000 && adminDownload.suggestedFilename().includes(incidentId),
        '[Lập biên bản vi phạm hành chính (Word)] Nút #btnDraftAdministrativeRecord xuất thành công file .docx chuẩn Mẫu 08/BB-XM (NĐ30/2020/NĐ-CP)',
        { filename: adminDownload.suggestedFilename(), sizeBytes: adminFileSize, exportMs: results.metrics.adminRecordDocxExportMs }
      );
    }

  } finally {
    results.metrics.totalDurationMs = Date.now() - startTime;
    await browser.close();
  }

  // Write official QA evidence to Reports/qa/playwright/ as both .json and .md
  const jsonReportPath = path.join(OUT_DIR, '2026-10-13-osint-print-webrtc.json');
  const mdReportPath = path.join(OUT_DIR, '2026-10-13-osint-print-webrtc.md');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  const mdLines = [
    `# QA Report: OSINT Administrative Record, Intake Print/PDF & 2-Way WebRTC Voice/Video Calls`,
    ``,
    `- **Timestamp**: \`${results.timestamp}\``,
    `- **Suite**: \`${results.suite}\``,
    `- **Passed**: \`${results.passed}\` / \`${results.tests.length}\``,
    `- **Failed**: \`${results.failed}\``,
    `- **Total Duration**: \`${results.metrics.totalDurationMs} ms\``,
    ``,
    `## Test Results`,
    ``,
    `| # | Test Case | Status | Details |`,
    `|---|-----------|--------|---------|`,
    ...results.tests.map((t, i) => `| ${i + 1} | ${t.name} | **${t.status}** | \`${JSON.stringify(t.details)}\` |`),
    ``,
    `## Empirical Benchmarks`,
    ``,
    `- **Voice Call (Dispatcher -> Citizen) Setup**: \`${results.metrics.voiceDispatcherToCitizenMs || 0} ms\``,
    `- **Voice Call (Citizen -> Dispatcher) Setup**: \`${results.metrics.voiceCitizenToDispatcherMs || 0} ms\``,
    `- **Video Call (Dispatcher -> Citizen) Setup**: \`${results.metrics.videoDispatcherToCitizenMs || 0} ms\``,
    `- **Video Call (Citizen -> Dispatcher) Setup**: \`${results.metrics.videoCitizenToDispatcherMs || 0} ms\``,
    `- **Intake Report Word (.docx) Export**: \`${results.metrics.intakeDocxExportMs || 0} ms\` (\`${results.metrics.intakeDocxSizeBytes || 0} bytes\`)`,
    `- **OSINT Administrative Record (.docx) Export**: \`${results.metrics.adminRecordDocxExportMs || 0} ms\` (\`${results.metrics.adminRecordDocxSizeBytes || 0} bytes\`)`
  ];
  fs.writeFileSync(mdReportPath, mdLines.join('\n'), 'utf8');

  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error in verify-osint-print-and-webrtc-calls:', err);
  process.exit(1);
});
