/**
 * SOS Vietnam 2026 — Reusable End-to-End Playwright + OpenCV QR & .JSON Block Decoder Suite
 *
 * Verifies:
 *   1. Citizen Portal links & Lightweight Stealth SOS default (0 heavy 5s audio uploads; covert SOS + GPS block sealed)
 *   2. Full 5-stage Transaction-Grade SOS Case Lifecycle (1_SOS_TRIGGER -> 3_OFFICER_DISPATCH ->
 *      3A_OFFICER_APPROACHING -> 3B_OFFICER_ARRIVED -> 4_CASE_RESOLVED) + Escalation/Resolution cleanup
 *   3. Dispatcher #bcSecurityPanel Process Summary (Ai báo, Ai nhận, Phản ứng, Di chuyển, Xử lý, Tổng ca),
 *      0-media Live SHA-256 Integrity Check, OpenCV QRCodeDetector scan on actual #verifyQrCodeBox screenshot,
 *      and browser download of HoSo_PhapLy_ChuoiKhoi_<caseId>.json
 *   4. Public Citizen Cross-Verification on /tra-cuu-blockchain.html?tx=... (opened from decoded QR URL):
 *      authenticity verdict, PII-masked phone, 6-card Vietnamese Process Summary, 5 decoded step cards,
 *      OpenCV QR scan on #bcvQrSvgBox, plus Authenticated Officer unmasked lookup check
 *   5. Tab 2 .JSON File Decoder Software (intact HoSo_PhapLy_ChuoiKhoi_*.json upload -> Dual WebCrypto SHA-256 + Server match)
 *   6. Tab 2 Tamper Detection (1-field edited .json upload -> Red tamper alert naming exact corrupted Block #)
 *   7. Cross-portal links (/cap-phat-the.html #btnDePinOpenVerifier) & /api/blockchain/explorer/:txHash certificate
 *
 * Usage:
 *   node playwright/verify-blockchain-process-qr-decoder.mjs --base-url http://127.0.0.1:3410 --report-prefix local
 *   node playwright/verify-blockchain-process-qr-decoder.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function readFlag(flagName, fallback = '') {
  const idx = args.indexOf(flagName);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const eq = args.find((a) => a.startsWith(`${flagName}=`));
  if (eq) return eq.slice(flagName.length + 1);
  return fallback;
}

const IS_STAGING_FLAG = args.includes('--staging');
const RAW_BASE_URL = readFlag(
  '--base-url',
  readFlag('--url', IS_STAGING_FLAG ? 'https://sos-vietnam-2026.onrender.com' : 'http://127.0.0.1:3410')
);
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const REPORT_PREFIX = readFlag(
  '--report-prefix',
  BASE_URL.includes('onrender.com') || IS_STAGING_FLAG ? 'staging' : 'local'
);

const REPORT_DIR = path.resolve('Reports/qa/playwright');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');
const TMP_QA_DIR = path.resolve(`.tmp/bc-qa-${REPORT_PREFIX}`);
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(TMP_QA_DIR, { recursive: true });

const JSON_REPORT_PATH = path.join(REPORT_DIR, `blockchain-process-qr-decoder-${REPORT_PREFIX}.json`);
const MD_REPORT_PATH = path.join(REPORT_DIR, `blockchain-process-qr-decoder-${REPORT_PREFIX}.md`);

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function waitForHealth(baseUrl, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/healthz`, {
        headers: { 'User-Agent': CHROME_UA }
      });
      if (res.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Target ${baseUrl}/healthz did not become healthy within ${timeoutMs}ms`);
}

function decodeQrImageWithOpenCv(imagePath) {
  const pyCode = [
    'import cv2, json, sys',
    'img = cv2.imread(sys.argv[1])',
    'if img is None:',
    '    print(json.dumps({"ok": False, "error": "imread_failed"}))',
    '    sys.exit(0)',
    'det = cv2.QRCodeDetector()',
    'val, pts, _ = det.detectAndDecode(img)',
    'if not val:',
    '    up = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_NEAREST)',
    '    val, pts, _ = det.detectAndDecode(up)',
    'print(json.dumps({"ok": bool(val), "decoded": val or "", "hasPoints": pts is not None}))'
  ].join('\n');

  const stdout = execFileSync('python', ['-c', pyCode, imagePath], {
    encoding: 'utf8',
    timeout: 15000
  }).trim();
  return JSON.parse(stdout);
}

async function main() {
  const runTag = Date.now().toString(36).toUpperCase().slice(-5);
  const report = {
    suite: 'SOS Vietnam 2026 — Blockchain Process Ledger, Scannable QR & .JSON Dossier Decoder E2E',
    reportPrefix: REPORT_PREFIX,
    targetUrl: BASE_URL,
    verifiedAt: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    metrics: {},
    qrDecodes: {},
    screenshots: [],
    assertions: []
  };

  function assertCheck(name, condition, details = {}) {
    report.summary.total += 1;
    const passed = Boolean(condition);
    if (passed) report.summary.passed += 1;
    else report.summary.failed += 1;
    report.assertions.push({ name, passed, details });
    console.log(`${passed ? 'PASS' : 'FAIL'} | ${name}`);
    if (!passed) {
      console.error('   Details:', JSON.stringify(details));
    }
  }

  async function saveShot(target, slug) {
    const fileName = `bc-decoder-${REPORT_PREFIX}-${slug}.png`;
    const fullPath = path.join(SCREENSHOT_DIR, fileName);
    await target.screenshot({ path: fullPath });
    report.screenshots.push(`Reports/qa/playwright/screenshots/${fileName}`);
    return fullPath;
  }

  const createdIncidentIds = [];
  let browser = null;

  try {
    await waitForHealth(BASE_URL);

    browser = await chromium.launch({
      headless: true,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    // =========================================================================
    // STEP 1: Citizen Portal Links & Lightweight Stealth SOS Default (0 Audio Blobs)
    // =========================================================================
    const citizenContext = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      locale: 'vi-VN',
      userAgent: CHROME_UA,
      permissions: ['geolocation', 'microphone'],
      geolocation: { latitude: 10.0349, longitude: 105.7812, accuracy: 10 }
    });
    const citizenPage = await citizenContext.newPage();
    await citizenPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await citizenPage.waitForTimeout(1200);

    const citizenNavCheck = await citizenPage.evaluate(() => {
      const navLink = document.getElementById('btnNavBlockchainVerifier')?.getAttribute('href') || '';
      const stealthLink = document.getElementById('btnStealthBlockchainVerifier')?.getAttribute('href') || '';
      const stealthDesc = document.querySelector('#stealthEmergencyBar .stealth-bar-desc')?.textContent || '';
      return { navLink, stealthLink, stealthDesc: stealthDesc.trim() };
    });

    assertCheck(
      '1A. Citizen Portal (/) exposes Blockchain Verifier links (#btnNavBlockchainVerifier & #btnStealthBlockchainVerifier) and lightweight Stealth copy',
      citizenNavCheck.navLink === '/tra-cuu-blockchain.html' &&
        citizenNavCheck.stealthLink === '/tra-cuu-blockchain.html' &&
        citizenNavCheck.stealthDesc.includes('giao dịch quy trình cứu hộ siêu nhẹ'),
      citizenNavCheck
    );

    await citizenPage.click('#btnFakeIncomingCall');
    await citizenPage.waitForTimeout(3500);
    await citizenPage.click('#btnIosAnswerCall');
    // Wait > 5000ms (former MediaRecorder segment interval) to prove 0 audio blobs are recorded/uploaded by default
    await citizenPage.waitForTimeout(6200);

    const stealthStats = await citizenPage.evaluate(() => window.__sosStealthStats);
    const stealthIncidentId = stealthStats?.incidentId || null;
    if (stealthIncidentId) createdIncidentIds.push(stealthIncidentId);

    assertCheck(
      '1B. Stealth Fake Incoming Call creates covert SOS transaction silently while keeping audioRecordingEnabled === false and chunksUploaded === 0',
      Boolean(stealthIncidentId) &&
        stealthStats?.active === true &&
        stealthStats?.audioRecordingEnabled === false &&
        Number(stealthStats?.chunksUploaded || 0) === 0,
      {
        stealthIncidentId,
        audioRecordingEnabled: stealthStats?.audioRecordingEnabled,
        chunksUploaded: stealthStats?.chunksUploaded
      }
    );

    // 3-tap exit on #btnIosHangupCall
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(140);
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(140);
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(300);

    // =========================================================================
    // STEP 2: Full 5-Stage SOS Case Lifecycle (Trigger -> Dispatch -> Approaching -> Arrived -> Resolved)
    // =========================================================================
    const citizenPhoneRaw = '0918246810';
    const createCaseRes = await citizenPage.evaluate(async ({ phone, tag }) => {
      const resp = await fetch('/api/sos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 10.034215,
          lng: 105.783412,
          accuracy: 8,
          phone,
          reporterName: `Nguyễn Minh Khôi (${tag})`,
          address: 'Hẻm 51 Đường 3/2, Phường Xuân Khánh, Ninh Kiều, Cần Thơ',
          agency: 'police',
          incidentTypes: ['AN_NINH_TRAT_TU'],
          note: 'Cần hỗ trợ khẩn cấp kiểm thử quy trình Blockchain giao dịch siêu nhẹ.'
        })
      });
      return resp.json();
    }, { phone: citizenPhoneRaw, tag: runTag });

    const mainCaseId = createCaseRes?.incident?.id || createCaseRes?.id || '';
    if (mainCaseId) createdIncidentIds.push(mainCaseId);

    assertCheck(
      '2A. Citizen SOS creation seals Block #1 (1_SOS_TRIGGER) with valid 66-char TxHash and 0 media files',
      Boolean(mainCaseId) &&
        /^0x[0-9a-f]{64}$/i.test(String(createCaseRes?.incident?.blockchain?.triggerTxHash || '')),
      {
        mainCaseId,
        triggerBlockNumber: createCaseRes?.incident?.blockchain?.triggerBlockNumber,
        triggerTxHash: createCaseRes?.incident?.blockchain?.triggerTxHash
      }
    );

    const dispContext = await browser.newContext({
      viewport: { width: 1480, height: 940 },
      locale: 'vi-VN',
      userAgent: CHROME_UA,
      acceptDownloads: true
    });
    const dispPage = await dispContext.newPage();
    await dispPage.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 40000 });

    const dispLogin = await dispPage.evaluate(async () => {
      await fetch('/api/security/gatekeeper/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '2002' })
      });
      sessionStorage.setItem('sos_gatekeeper_pass', 'true');

      let resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '2002' })
      });
      let data = await resp.json();
      if (!data.ok) {
        resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'Admin' })
        });
        data = await resp.json();
      }
      const profile = data.profile || data.account;
      if (data.ok && profile) {
        sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(profile));
      }
      return { ok: Boolean(data.ok), username: profile?.username || 'admin' };
    });

    await dispPage.reload({ waitUntil: 'domcontentloaded', timeout: 40000 });
    await dispPage.waitForTimeout(1600);
    await dispPage.evaluate(() => {
      for (const id of ['cyberIntroVideoOverlay', 'cyberGatekeeperModal', 'cosmicPortalView', 'authGateModal']) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
    });

    // Wait >= 1.1s between lifecycle transitions so elapsed durations are strictly positive (>= 1s)
    await dispPage.waitForTimeout(1150);
    const acceptRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          officerRank: 'Đại úy',
          officerName: 'Lê Minh Tuấn',
          officerPhone: '02923888113',
          unitName: 'Công an Phường Tân An',
          etaMinutes: 5
        })
      });
      return r.json();
    }, mainCaseId);

    await dispPage.waitForTimeout(1150);
    const approachingRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'approaching',
          message: 'Tổ tuần tra cách hiện trường 200m.'
        })
      });
      return r.json();
    }, mainCaseId);

    await dispPage.waitForTimeout(1150);
    const arrivedRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'arrived',
          message: 'Tổ công tác đã có mặt tại hiện trường hẻm 51.'
        })
      });
      return r.json();
    }, mainCaseId);

    await dispPage.waitForTimeout(1150);
    const resolvedRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'resolved',
          note: 'Đã bảo vệ an toàn người báo tin và lập biên bản bàn giao hiện trường.'
        })
      });
      if (r.ok) {
        const j = await r.json();
        if (j.ok && j.incident && window.dispatcherApp) {
          window.dispatcherApp.incidents.set(id, j.incident);
          window.dispatcherApp.selectIncident(id);
        }
        return j;
      }
      return { ok: false, status: r.status };
    }, mainCaseId);

    const psAfterResolve = resolvedRes?.incident?.blockchain?.processSummary || {};
    const durAfterResolve = psAfterResolve?.durations || {};

    assertCheck(
      '2B. Full 5-stage SOS lifecycle seals 5 sequential blocks with positive responseTimeSeconds, travelTimeSeconds, onSceneHandlingSeconds & totalCaseDurationSeconds',
      dispLogin.ok &&
        acceptRes.ok === true &&
        approachingRes.ok === true &&
        arrivedRes.ok === true &&
        resolvedRes.ok === true &&
        Number(psAfterResolve.totalBlocksInCase) === 5 &&
        Number(durAfterResolve.responseTimeSeconds) >= 1 &&
        Number(durAfterResolve.travelTimeSeconds) >= 2 &&
        Number(durAfterResolve.onSceneHandlingSeconds) >= 1 &&
        Number(durAfterResolve.totalCaseDurationSeconds) >= 4,
      {
        totalBlocksInCase: psAfterResolve.totalBlocksInCase,
        durations: durAfterResolve
      }
    );

    // =========================================================================
    // STEP 3: Dispatcher #bcSecurityPanel UI, Live Audit, OpenCV QR Scan & .JSON Download
    // =========================================================================
    await dispPage.waitForTimeout(450);
    const panelUi = await dispPage.evaluate(() => {
      const panel = document.getElementById('bcSecurityPanel');
      panel?.scrollIntoView({ block: 'center' });
      return {
        reporter: document.getElementById('uiProcReporter')?.textContent?.trim() || '',
        officer: document.getElementById('uiProcOfficer')?.textContent?.trim() || '',
        timestamps: document.getElementById('uiProcTimestamps')?.textContent?.trim() || '',
        durResponse: document.getElementById('uiProcDurResponse')?.textContent?.trim() || '',
        durTravel: document.getElementById('uiProcDurTravel')?.textContent?.trim() || '',
        durScene: document.getElementById('uiProcDurScene')?.textContent?.trim() || '',
        durTotal: document.getElementById('uiProcDurTotal')?.textContent?.trim() || '',
        evidenceType: document.getElementById('uiEvidenceType')?.textContent?.trim() || '',
        headerPortalHref: document.getElementById('btnOpenBcVerifierPortal')?.getAttribute('href') || '',
        timelineCount: document.querySelectorAll('#uiAuditTimeline li').length,
        timelineText: document.getElementById('uiAuditTimeline')?.innerText || ''
      };
    });

    const hasDurationFmt = (s) => /\d+\s*(s|p|giây|phút)/i.test(String(s || ''));
    assertCheck(
      '3A. Dispatcher #bcSecurityPanel displays complete Transaction Process Summary (Reporter, Officer, Timestamps, 4 Duration Metrics & 5 Timeline Steps)',
      panelUi.reporter.includes('Nguyễn Minh Khôi') &&
        panelUi.reporter.includes(citizenPhoneRaw) &&
        panelUi.officer.includes('Đại úy Lê Minh Tuấn') &&
        panelUi.officer.includes('Công an Phường Tân An') &&
        hasDurationFmt(panelUi.durResponse) &&
        hasDurationFmt(panelUi.durTravel) &&
        hasDurationFmt(panelUi.durScene) &&
        hasDurationFmt(panelUi.durTotal) &&
        panelUi.headerPortalHref.startsWith('/tra-cuu-blockchain.html?tx=0x') &&
        panelUi.timelineCount === 5,
      {
        ...panelUi,
        timelineText: undefined
      }
    );

    const auditStart = performance.now();
    await dispPage.click('#btnRunIntegrityCheck');
    await dispPage.waitForFunction(
      () => {
        const el = document.getElementById('verifyResult');
        const qr = document.getElementById('verifyQrCodeBox');
        return Boolean(el && qr && el.innerText.includes('XÁC THỰC THÀNH CÔNG'));
      },
      null,
      { timeout: 20000 }
    );
    report.metrics.dispatcherLiveAuditMs = Number((performance.now() - auditStart).toFixed(2));

    const liveAuditDom = await dispPage.evaluate(() => {
      const qrBox = document.getElementById('verifyQrCodeBox');
      qrBox?.scrollIntoView({ block: 'center' });
      return {
        origHash: document.getElementById('verifyOrigHashText')?.textContent?.trim() || '',
        recomputedHash: document.getElementById('verifyRecomputedHashText')?.textContent?.trim() || '',
        verifierHref: document.getElementById('btnOpenVerifierPortal')?.getAttribute('href') || '',
        resultText: document.getElementById('verifyResult')?.innerText || ''
      };
    });
    await dispPage.waitForTimeout(200);

    const dispQrElement = dispPage.locator('#verifyQrCodeBox');
    const dispQrShotPath = await saveShot(dispQrElement, '01-dispatcher-qr-box');
    await saveShot(dispPage, '02-dispatcher-bc-security-panel');

    const dispQrScan = decodeQrImageWithOpenCv(dispQrShotPath);
    report.qrDecodes.dispatcherVerifyQr = dispQrScan;

    assertCheck(
      '3B. 0-media Live Audit populates matching 66-char 0x... TxHashes and renders 100% OpenCV-scannable QR resolving to /tra-cuu-blockchain.html',
      /^0x[0-9a-f]{64}$/i.test(liveAuditDom.origHash) &&
        liveAuditDom.origHash === liveAuditDom.recomputedHash &&
        dispQrScan.ok === true &&
        dispQrScan.decoded.includes('/tra-cuu-blockchain.html?tx=0x') &&
        dispQrScan.decoded.includes(`case=${encodeURIComponent(mainCaseId)}`),
      {
        origHash: liveAuditDom.origHash,
        qrDecoded: dispQrScan.decoded
      }
    );

    // Download exported .JSON Legal Dossier via real browser download event
    const [download] = await Promise.all([
      dispPage.waitForEvent('download', { timeout: 15000 }),
      dispPage.click('#btnExportLegalDossierJson')
    ]);
    const downloadedFileName = download.suggestedFilename();
    const downloadedJsonPath = path.join(TMP_QA_DIR, downloadedFileName);
    await download.saveAs(downloadedJsonPath);
    const downloadedRawText = fs.readFileSync(downloadedJsonPath, 'utf8');
    const downloadedDossier = JSON.parse(downloadedRawText);
    report.metrics.exportedDossierBytes = Buffer.byteLength(downloadedRawText, 'utf8');

    assertCheck(
      '3C. Clicking #btnExportLegalDossierJson downloads complete HoSo_PhapLy_ChuoiKhoi_<id>.json (schemaVersion 2.1-PROCESS-DOSSIER, 5 lifecycleBlocks with payload)',
      downloadedFileName === `HoSo_PhapLy_ChuoiKhoi_${mainCaseId}.json` &&
        downloadedDossier.schemaVersion === '2.1-PROCESS-DOSSIER' &&
        Array.isArray(downloadedDossier.lifecycleBlocks) &&
        downloadedDossier.lifecycleBlocks.length === 5 &&
        downloadedDossier.lifecycleBlocks.every((b) => b.payload && b.txHash && b.payloadDigest),
      {
        downloadedFileName,
        bytes: report.metrics.exportedDossierBytes,
        blockCount: downloadedDossier.lifecycleBlocks?.length
      }
    );

    // =========================================================================
    // STEP 4: Public Citizen Cross-Verification via Scanned QR URL (/tra-cuu-blockchain.html)
    // =========================================================================
    const publicContext = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      locale: 'vi-VN',
      userAgent: CHROME_UA
    });
    const publicPortalPage = await publicContext.newPage();
    const qrTargetUrl = dispQrScan.decoded.startsWith('http')
      ? dispQrScan.decoded
      : `${BASE_URL}${dispQrScan.decoded}`;

    await publicPortalPage.goto(qrTargetUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await publicPortalPage.waitForFunction(
      () => {
        const card = document.getElementById('bcvReportCard');
        const title = document.getElementById('bcvVerdictTitle')?.textContent || '';
        return Boolean(card && !card.hidden && title.includes('DỮ LIỆU THẬT'));
      },
      null,
      { timeout: 20000 }
    );
    await publicPortalPage.waitForTimeout(300);

    const publicLookupState = await publicPortalPage.evaluate(() => ({
      roleBadge: document.getElementById('bcvViewerRoleBadge')?.textContent?.trim() || '',
      verdictTitle: document.getElementById('bcvVerdictTitle')?.textContent?.trim() || '',
      verdictDetail: document.getElementById('bcvVerdictDetail')?.textContent?.trim() || '',
      summaryCardsCount: document.querySelectorAll('#bcvProcessSummaryGrid .bcv-metric-card').length,
      summaryText: document.getElementById('bcvProcessSummaryGrid')?.innerText || '',
      stepCardsCount: document.querySelectorAll('#bcvDecodedStepsList .bcv-step-card').length,
      recentRowsCount: document.querySelectorAll('#bcvRecentTableBody tr').length
    }));

    const portalQrLocator = publicPortalPage.locator('#bcvQrSvgBox');
    await portalQrLocator.scrollIntoViewIfNeeded();
    const portalQrShotPath = await saveShot(portalQrLocator, '03-verifier-portal-qr-box');
    await saveShot(publicPortalPage, '04-verifier-portal-public-lookup');

    const portalQrScan = decodeQrImageWithOpenCv(portalQrShotPath);
    report.qrDecodes.portalLookupQr = portalQrScan;

    assertCheck(
      '4A. Opening scanned QR URL on /tra-cuu-blockchain.html (public context) confirms 100% genuine ledger chain, masks citizen phone (***), displays 6 process cards + 5 decoded blocks, and renders scannable QR',
      publicLookupState.verdictTitle.includes('DỮ LIỆU THẬT ĐANG LƯU TRÊN SỔ CÁI HỆ THỐNG') &&
        publicLookupState.summaryCardsCount === 6 &&
        publicLookupState.stepCardsCount === 5 &&
        publicLookupState.summaryText.includes('091***810') &&
        !publicLookupState.summaryText.includes(citizenPhoneRaw) &&
        publicLookupState.summaryText.includes('Đại úy Lê Minh Tuấn') &&
        portalQrScan.ok === true &&
        portalQrScan.decoded.includes(`case=${encodeURIComponent(mainCaseId)}`),
      {
        verdictTitle: publicLookupState.verdictTitle,
        summaryCardsCount: publicLookupState.summaryCardsCount,
        stepCardsCount: publicLookupState.stepCardsCount,
        portalQrDecoded: portalQrScan.decoded
      }
    );

    // Verify Officer Authenticated View on /tra-cuu-blockchain.html reveals full unmasked phone via HttpOnly cookie
    const officerPortalPage = await dispContext.newPage();
    await officerPortalPage.goto(`${BASE_URL}/tra-cuu-blockchain.html?case=${encodeURIComponent(mainCaseId)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 40000
    });
    await officerPortalPage.waitForFunction(
      () => {
        const card = document.getElementById('bcvReportCard');
        const title = document.getElementById('bcvVerdictTitle')?.textContent || '';
        return Boolean(card && !card.hidden && title.includes('DỮ LIỆU THẬT'));
      },
      null,
      { timeout: 20000 }
    );
    const officerPortalView = await officerPortalPage.evaluate(() => ({
      roleBadge: document.getElementById('bcvViewerRoleBadge')?.textContent?.trim() || '',
      summaryText: document.getElementById('bcvProcessSummaryGrid')?.innerText || ''
    }));
    await officerPortalPage.close();

    assertCheck(
      '4B. Authenticated Officer session opening /tra-cuu-blockchain.html automatically sees unmasked citizen phone (👮 Chế độ Cán bộ Trực ban)',
      officerPortalView.roleBadge.includes('Cán bộ Trực ban') &&
        officerPortalView.summaryText.includes(citizenPhoneRaw),
      {
        roleBadge: officerPortalView.roleBadge,
        hasFullPhone: officerPortalView.summaryText.includes(citizenPhoneRaw)
      }
    );

    // =========================================================================
    // STEP 5: Tab 2 .JSON File Decoder Software — Intact File Upload
    // =========================================================================
    await publicPortalPage.click('#tabBtnDecoder');
    await publicPortalPage.setInputFiles('#bcvFileInput', downloadedJsonPath);
    await publicPortalPage.waitForFunction(
      () => {
        const offline = document.getElementById('bcvOfflineBadge')?.textContent || '';
        const online = document.getElementById('bcvOnlineBadge')?.textContent || '';
        return offline.includes('Khớp 5/5 Block') && online.includes('Tồn tại & Trùng khớp 100%');
      },
      null,
      { timeout: 20000 }
    );
    await publicPortalPage.waitForTimeout(250);
    await saveShot(publicPortalPage, '05-decoder-intact-json-verified');

    const intactDecodeUi = await publicPortalPage.evaluate(() => ({
      bannerClass: document.getElementById('bcvVerdictBanner')?.className || '',
      verdictTitle: document.getElementById('bcvVerdictTitle')?.textContent?.trim() || '',
      offlineBadge: document.getElementById('bcvOfflineBadge')?.textContent?.trim() || '',
      offlineOk: Boolean(document.getElementById('bcvOfflineBadge')?.classList.contains('ok')),
      onlineBadge: document.getElementById('bcvOnlineBadge')?.textContent?.trim() || '',
      onlineOk: Boolean(document.getElementById('bcvOnlineBadge')?.classList.contains('ok')),
      decodedStepCount: document.querySelectorAll('#bcvDecodedStepsList .bcv-step-card').length
    }));

    assertCheck(
      '5. Uploading intact HoSo_PhapLy_ChuoiKhoi_<id>.json in Tab 2 decodes all 5 Vietnamese blocks and passes BOTH Offline WebCrypto SHA-256 & Online Server Ledger checks',
      !intactDecodeUi.bannerClass.includes('is-tampered') &&
        intactDecodeUi.verdictTitle.includes('XÁC THỰC THÀNH CÔNG 100%') &&
        intactDecodeUi.offlineOk === true &&
        intactDecodeUi.onlineOk === true &&
        intactDecodeUi.decodedStepCount === 5,
      intactDecodeUi
    );

    // =========================================================================
    // STEP 6: Tab 2 .JSON File Decoder Software — 1-Field Tampered File Upload
    // =========================================================================
    const tamperedObj = JSON.parse(downloadedRawText);
    const arrivedBlk = tamperedObj.lifecycleBlocks.find((b) => b.action === '3B_OFFICER_ARRIVED') || tamperedObj.lifecycleBlocks[3];
    const tamperedBlockNum = arrivedBlk.blockNumber;
    arrivedBlk.payload.data.travelTimeSeconds = Number(arrivedBlk.payload.data.travelTimeSeconds || 0) + 600;
    const tamperedJsonPath = path.join(TMP_QA_DIR, `TAMPERED_${downloadedFileName}`);
    fs.writeFileSync(tamperedJsonPath, JSON.stringify(tamperedObj, null, 2), 'utf8');

    await publicPortalPage.setInputFiles('#bcvFileInput', tamperedJsonPath);
    await publicPortalPage.waitForFunction(
      () => {
        const banner = document.getElementById('bcvVerdictBanner');
        return Boolean(banner && banner.classList.contains('is-tampered'));
      },
      null,
      { timeout: 20000 }
    );
    await publicPortalPage.waitForTimeout(250);
    await saveShot(publicPortalPage, '06-decoder-tampered-json-caught');

    const tamperedDecodeUi = await publicPortalPage.evaluate(() => ({
      bannerClass: document.getElementById('bcvVerdictBanner')?.className || '',
      verdictTitle: document.getElementById('bcvVerdictTitle')?.textContent?.trim() || '',
      verdictDetail: document.getElementById('bcvVerdictDetail')?.textContent?.trim() || '',
      offlineFail: Boolean(document.getElementById('bcvOfflineBadge')?.classList.contains('fail')),
      onlineFail: Boolean(document.getElementById('bcvOnlineBadge')?.classList.contains('fail')),
      offlineBadge: document.getElementById('bcvOfflineBadge')?.textContent?.trim() || '',
      onlineBadge: document.getElementById('bcvOnlineBadge')?.textContent?.trim() || ''
    }));

    assertCheck(
      '6. Uploading 1-field edited .JSON dossier triggers red tamper alert (is-tampered), fails both Offline WebCrypto & Online Server badges, and names exact tampered Block #',
      tamperedDecodeUi.bannerClass.includes('is-tampered') &&
        (tamperedDecodeUi.verdictTitle.includes('CẢNH BÁO GIẢ MẠO') ||
          tamperedDecodeUi.verdictTitle.includes('CHỈNH SỬA TRÁI PHÉP')) &&
        `${tamperedDecodeUi.verdictTitle} ${tamperedDecodeUi.verdictDetail}`.includes(`#${tamperedBlockNum}`) &&
        tamperedDecodeUi.offlineFail === true &&
        tamperedDecodeUi.onlineFail === true,
      {
        tamperedBlockNum,
        ...tamperedDecodeUi
      }
    );

    // =========================================================================
    // STEP 7: Cross-Portal Link (/cap-phat-the.html) & Explorer Certificate + Queue Cleanup
    // =========================================================================
    const depinPage = await publicContext.newPage();
    await depinPage.goto(`${BASE_URL}/cap-phat-the.html`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    const depinVerifierHref = await depinPage.getAttribute('#btnDePinOpenVerifier', 'href');

    const latestTxHash = downloadedDossier.lifecycleBlocks[downloadedDossier.lifecycleBlocks.length - 1]?.txHash || '';
    const explorerResp = await depinPage.goto(
      `${BASE_URL}/api/blockchain/explorer/${encodeURIComponent(latestTxHash)}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    const explorerText = await depinPage.evaluate(() => document.body?.innerText || '');
    await depinPage.close();

    assertCheck(
      '7. /cap-phat-the.html links to /tra-cuu-blockchain.html (#btnDePinOpenVerifier) and /api/blockchain/explorer/:txHash renders HTTP 200 certificate',
      depinVerifierHref === '/tra-cuu-blockchain.html' &&
        explorerResp?.status() === 200 &&
        explorerText.includes(mainCaseId),
      {
        depinVerifierHref,
        explorerStatus: explorerResp?.status()
      }
    );

    // Cleanly close the covert Stealth SOS incident so staging Dispatcher queue has 0 leftover active test incidents
    if (stealthIncidentId) {
      await dispPage.evaluate(async (id) => {
        await fetch('/api/dispatcher/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            officerRank: 'Đại úy',
            officerName: 'Lê Minh Tuấn',
            officerPhone: '02923888113',
            unitName: 'Công an Phường Tân An',
            etaMinutes: 4
          })
        }).catch(() => {});
        await fetch('/api/dispatcher/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: 'resolved',
            note: 'Đóng ca kiểm thử tự động Stealth SOS siêu nhẹ.'
          })
        }).catch(() => {});
      }, stealthIncidentId);
    }

    await publicContext.close();
    await dispContext.close();
    await citizenContext.close();
  } finally {
    if (browser) {
      await browser.close();
    }
    try {
      fs.rmSync(TMP_QA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  fs.writeFileSync(JSON_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    `# Báo Cáo QA Tự Động Playwright + OpenCV — Chuỗi Khối Quy Trình Giao Dịch, Quét QR & Phần Mềm Giải Mã (.JSON)`,
    ``,
    `- **Môi trường kiểm thử:** \`${report.reportPrefix}\``,
    `- **URL mục tiêu:** \`${report.targetUrl}\``,
    `- **Thời điểm xác thực:** \`${report.verifiedAt}\``,
    `- **Kết quả tổng thể:** **${report.summary.passed} / ${report.summary.total} PASS** (\`failed: ${report.summary.failed}\`)`,
    `- **Độ trễ Live Audit SHA-256 trên Bàn Điều Phối:** \`${report.metrics.dispatcherLiveAuditMs ?? '-'} ms\``,
    `- **Dung lượng tệp Hồ sơ Pháp lý 5 Block (0 media nặng):** \`${report.metrics.exportedDossierBytes ?? '-'} bytes\``,
    `- **Kết quả OpenCV \`QRCodeDetector\` trên Bàn Điều Phối:** \`${report.qrDecodes.dispatcherVerifyQr?.decoded || 'N/A'}\``,
    `- **Kết quả OpenCV \`QRCodeDetector\` trên Cổng Đối Chứng:** \`${report.qrDecodes.portalLookupQr?.decoded || 'N/A'}\``,
    ``,
    `## Bảng Kết Quả Kiểm Định Chi Tiết`,
    ``,
    `| # | Hạng mục kiểm định | Trạng thái |`,
    `|---|---|---|`,
    ...report.assertions.map(
      (a, idx) => `| ${idx + 1} | ${a.name.replace(/\|/g, '\\|')} | ${a.passed ? '✅ PASS' : '❌ FAIL'} |`
    ),
    ``,
    `## Ảnh Chụp Bằng Chứng Trực Quan`,
    ``,
    ...report.screenshots.map((s) => `- \`${s}\``),
    ``
  ].join('\n');
  fs.writeFileSync(MD_REPORT_PATH, md, 'utf8');

  console.log(`\nSUMMARY [${REPORT_PREFIX}]: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed.`);
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL QA SUITE ERROR:', err);
  process.exit(1);
});
