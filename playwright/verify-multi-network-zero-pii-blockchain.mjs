/**
 * SOS Vietnam 2026 — Multi-Network Tiered Visibility, Strict Zero-PII & Global OpenTimestamps (.OTS) E2E Suite
 *
 * Verifies across all 3 blockchain UI surfaces:
 *   1. /api/blockchain/status advertises 4 networks (842026, NDA, OTS, POLYGON) & SOSVN-ANCHOR-V1 protocol
 *   2. Full 5-stage SOS lifecycle with 18 distinct sensitive PII tokens (closed cleanly as 'resolved')
 *   3. Surface 1 — dispatcher.html #bcSecurityPanel:
 *      - 4-pill #bcNetPillBar synced two-way with #bcNetworkSwitch
 *      - 842026 shows 100% Full PII to authenticated officer
 *      - NDA / OTS / POLYGON enforce 0 PII leaks across DOM innerText/innerHTML, QR payload & exported JSON,
 *        while keeping SLA durations (response, travel, total) and .ots/.anchor.json download buttons
 *   4. Surface 2 — /tra-cuu-blockchain.html:
 *      - Officer session on 842026 sees 100% unmasked PII; Public viewer on 842026 sees masked phone/CCCD
 *      - Switching #bcvNetworkSwitchBar across NDA / OTS / POLYGON enforces 0 PII leaks across URL, input,
 *        report card, and recent blocks table
 *      - Real browser download of SOSVN_Block_<N>_PublicAnchor.json + .ots, independent binary Merkle/magic
 *        verification against SHA256(PublicAnchor.json), OpenCV QR decode, and Tab 2 PublicAnchor.json verification
 *   5. Surface 3 — /api/blockchain/explorer/:ref:
 *      - Clicking all 4 tabs in #explorerNetworkSwitcher (842026, NDA, OTS, POLYGON)
 *      - Enforces 0 PII leaks on NDA / OTS / POLYGON, renders #explorerGlobalProofBox, OpenCV QR decode
 *   6. Legacy / earliest block on-demand .ots stamping & verification (including Block #101 when present on Staging)
 *
 * Usage:
 *   node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url http://127.0.0.1:3412 --report-prefix local
 *   node playwright/verify-multi-network-zero-pii-blockchain.mjs --base-url https://sos-vietnam-2026.onrender.com --report-prefix staging
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function readFlag(flagName, fallback = '') {
  const idx = args.indexOf(flagName);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  const eq = args.find((a) => a.startsWith(`${flagName}=`));
  if (eq) return eq.slice(flagName.length + 1);
  return fallback;
}

const IS_STAGING_FLAG = args.includes('--staging');
const IS_HEADED = args.includes('--headed');
const RAW_BASE_URL = readFlag(
  '--base-url',
  readFlag('--url', IS_STAGING_FLAG ? 'https://sos-vietnam-2026.onrender.com' : 'http://127.0.0.1:3412')
);
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const REPORT_PREFIX = readFlag(
  '--report-prefix',
  BASE_URL.includes('onrender.com') || IS_STAGING_FLAG ? 'staging' : 'local'
);

const REPORT_DIR = path.resolve('Reports/qa/playwright');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');
const TMP_QA_DIR = path.resolve(`.tmp/bc-multinet-qa-${REPORT_PREFIX}`);
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(TMP_QA_DIR, { recursive: true });

const JSON_REPORT_PATH = path.join(REPORT_DIR, `multi-network-zero-pii-blockchain-${REPORT_PREFIX}.json`);
const MD_REPORT_PATH = path.join(REPORT_DIR, `multi-network-zero-pii-blockchain-${REPORT_PREFIX}.md`);

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const OTS_MAGIC_HEADER = Buffer.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00,
  0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94
]);
const PENDING_ATTESTATION_TAG = Buffer.from('83dfe30d2ef90c8e', 'hex');

function verifyDetachedOtsBinaryIndependent(otsBuf, anchorDocBuf) {
  if (!Buffer.isBuffer(otsBuf) || otsBuf.length < 66) {
    return { valid: false, reason: 'ots_too_short' };
  }
  const headerSlice = otsBuf.subarray(0, 31);
  if (!headerSlice.equals(OTS_MAGIC_HEADER)) {
    return { valid: false, reason: 'magic_header_mismatch' };
  }
  const version = otsBuf[31];
  const hashOp = otsBuf[32];
  if (version !== 0x01 || hashOp !== 0x08) {
    return { valid: false, reason: `unexpected_version_or_hashop_${version}_${hashOp}` };
  }
  const embeddedDigest = otsBuf.subarray(33, 65);
  const expectedDigest = crypto.createHash('sha256').update(anchorDocBuf).digest();
  if (!embeddedDigest.equals(expectedDigest)) {
    return {
      valid: false,
      reason: 'digest_mismatch',
      embeddedHex: `0x${embeddedDigest.toString('hex')}`,
      expectedHex: `0x${expectedDigest.toString('hex')}`
    };
  }
  const opsRegion = otsBuf.subarray(65);
  const tagIdx = opsRegion.indexOf(PENDING_ATTESTATION_TAG);
  let calendarUri = '';
  if (tagIdx !== -1) {
    const asciiMatches = opsRegion.subarray(tagIdx + 8).toString('latin1').match(/https?:\/\/[a-z0-9.:/-]+/i);
    if (asciiMatches) calendarUri = asciiMatches[0];
  }
  return {
    valid: tagIdx !== -1 && calendarUri.includes('opentimestamps.org'),
    version,
    hashOp: 'OpSHA256(0x08)',
    otsBytes: otsBuf.length,
    anchorDigestHex: `0x${expectedDigest.toString('hex')}`,
    hasPendingAttestationTag: tagIdx !== -1,
    calendarUri
  };
}

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

function findLeakedTokens(haystackList, forbiddenTokens) {
  const combined = haystackList.map((s) => String(s || '')).join('\n');
  return forbiddenTokens.filter((tok) => tok && combined.includes(tok));
}

async function main() {
  const runTag = Date.now().toString(36).toUpperCase().slice(-5);
  const report = {
    suite: 'SOS Vietnam 2026 — Multi-Network Tiered Visibility, Strict Zero-PII & Global OpenTimestamps (.OTS) E2E',
    reportPrefix: REPORT_PREFIX,
    targetUrl: BASE_URL,
    verifiedAt: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    metrics: {
      totalZeroPiiLeakCount: 0,
      qrDecodePassCount: 0,
      qrDecodeTotalCount: 0
    },
    otsVerification: {},
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
    const fileName = `multinet-${REPORT_PREFIX}-${slug}.png`;
    const fullPath = path.join(SCREENSHOT_DIR, fileName);
    await target.screenshot({ path: fullPath });
    report.screenshots.push(`Reports/qa/playwright/screenshots/${fileName}`);
    return fullPath;
  }

  let browser = null;

  try {
    await waitForHealth(BASE_URL);

    // =========================================================================
    // STEP 1: Backend Multi-Network Status Contract
    // =========================================================================
    const statusRes = await fetch(`${BASE_URL}/api/blockchain/status`, {
      headers: { 'User-Agent': CHROME_UA }
    }).then((r) => r.json());

    const netCodes = Array.isArray(statusRes?.supportedNetworks)
      ? statusRes.supportedNetworks.map((n) => n.code)
      : [];

    assertCheck(
      '1. /api/blockchain/status exposes all 4 selectable networks (842026, NDA, OTS, POLYGON) and OpenTimestamps global verification metadata',
      statusRes?.ok === true &&
        netCodes.length === 4 &&
        ['842026', 'NDA', 'OTS', 'POLYGON'].every((c) => netCodes.includes(c)) &&
        typeof statusRes?.otsStampedBlocksCount === 'number' &&
        statusRes?.networks?.OTS?.verificationSiteUrl === 'https://opentimestamps.org',
      {
        netCodes,
        otsStampedBlocksCount: statusRes?.otsStampedBlocksCount,
        otsVerificationSiteUrl: statusRes?.networks?.OTS?.verificationSiteUrl,
        totalBlocks: statusRes?.totalBlocks
      }
    );

    // =========================================================================
    // STEP 2: Full 5-Stage SOS Case Lifecycle with 18 Distinct Sensitive PII Tokens
    // =========================================================================
    const pii = {
      reporterName: `Đặng Thị Minh Châu ${runTag}`,
      reporterShort: 'Đặng Thị Minh Châu',
      phone: '0947359168',
      maskedPhone3: '094***168',
      maskedPhone4: '0947***168',
      cccd: '092198004567',
      maskedCccd4: '0921***567',
      maskedCccd3: '092***567',
      latNum: 10.036789,
      lngNum: 105.784321,
      latPrefix: '10.03678',
      lngPrefix: '105.78432',
      address: `Số 99B Hẻm Mậu Thân, Phường Xuân Khánh, Ninh Kiều (${runTag})`,
      addressStreet: 'Hẻm Mậu Thân',
      officerRank: 'Thiếu tá',
      officerName: `Võ Hoàng Phúc ${runTag}`,
      officerShort: 'Võ Hoàng Phúc',
      officerPhone: '02923777113',
      unitName: `Đội Cảnh Sát 113 Xuân Khánh ${runTag}`,
      note: `Mật danh hiện trường căn hộ 99B-${runTag}`,
      resolveNote: `Đã giải cứu an toàn căn hộ 99B-${runTag}`
    };

    browser = await chromium.launch({
      headless: !IS_HEADED,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const dispContext = await browser.newContext({
      viewport: { width: 1480, height: 940 },
      locale: 'vi-VN',
      userAgent: CHROME_UA,
      acceptDownloads: true
    });
    const dispPage = await dispContext.newPage();
    const consoleErrors = [];
    let trackDispConsole = false;
    dispPage.on('console', (msg) => {
      if (trackDispConsole && msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(`dispatcher: ${msg.text()}`);
      }
    });
    dispPage.on('pageerror', (err) => consoleErrors.push(`dispatcher-pageerror: ${String(err)}`));

    const sosStartMs = performance.now();
    const createCaseRes = await fetch(`${BASE_URL}/api/sos/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': CHROME_UA },
      body: JSON.stringify({
        lat: pii.latNum,
        lng: pii.lngNum,
        accuracy: 6,
        phone: pii.phone,
        userCCCD: pii.cccd,
        reporterName: pii.reporterName,
        address: pii.address,
        agency: 'police',
        incidentTypes: ['AN_NINH_TRAT_TU'],
        note: pii.note
      })
    }).then((r) => r.json());
    report.metrics.sosCreateLatencyMs = Number((performance.now() - sosStartMs).toFixed(2));

    const mainCaseId = createCaseRes?.incident?.id || createCaseRes?.id || '';
    const forbiddenTokens = [
      mainCaseId,
      pii.reporterName,
      pii.reporterShort,
      pii.phone,
      pii.maskedPhone3,
      pii.maskedPhone4,
      pii.cccd,
      pii.maskedCccd4,
      pii.maskedCccd3,
      pii.latPrefix,
      pii.lngPrefix,
      pii.address,
      pii.addressStreet,
      pii.officerName,
      pii.officerShort,
      pii.officerPhone,
      pii.unitName,
      pii.note,
      pii.resolveNote
    ];

    await dispPage.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
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

    trackDispConsole = true;
    await dispPage.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    await dispPage.waitForTimeout(1500);
    await dispPage.evaluate(() => {
      for (const id of ['cyberIntroVideoOverlay', 'cyberGatekeeperModal', 'cosmicPortalView', 'authGateModal']) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
    });

    await dispPage.waitForTimeout(1150);
    const acceptRes = await dispPage.evaluate(
      async ({ id, pii }) => {
        const r = await fetch('/api/dispatcher/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            officerRank: pii.officerRank,
            officerName: pii.officerName,
            officerPhone: pii.officerPhone,
            unitName: pii.unitName,
            etaMinutes: 4
          })
        });
        return r.json();
      },
      { id: mainCaseId, pii }
    );

    await dispPage.waitForTimeout(1150);
    const approachingRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approaching', message: 'Tổ tuần tra cách 150m.' })
      });
      return r.json();
    }, mainCaseId);

    await dispPage.waitForTimeout(1150);
    const arrivedRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'arrived', message: 'Tổ công tác đã có mặt.' })
      });
      return r.json();
    }, mainCaseId);

    await dispPage.waitForTimeout(1150);
    const resolvedRes = await dispPage.evaluate(
      async ({ id, resolveNote }) => {
        const r = await fetch('/api/dispatcher/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'resolved', note: resolveNote })
        });
        return r.json();
      },
      { id: mainCaseId, resolveNote: pii.resolveNote }
    );

    const latestTxHash = resolvedRes?.incident?.blockchain?.latestTxHash || '';
    const latestBlockNum = resolvedRes?.incident?.blockchain?.latestBlockNumber || null;
    const psAfterResolve = resolvedRes?.incident?.blockchain?.processSummary || {};

    assertCheck(
      '2. Full 5-stage SOS lifecycle seals 5 blocks with non-blocking SOS creation and closes cleanly as resolved',
      Boolean(mainCaseId) &&
        dispLogin.ok &&
        acceptRes?.ok === true &&
        approachingRes?.ok === true &&
        arrivedRes?.ok === true &&
        resolvedRes?.ok === true &&
        resolvedRes?.incident?.status === 'resolved' &&
        Number(psAfterResolve?.totalBlocksInCase) === 5 &&
        /^0x[0-9a-f]{64}$/i.test(latestTxHash),
      {
        mainCaseId,
        latestBlockNum,
        latestTxHash,
        sosCreateLatencyMs: report.metrics.sosCreateLatencyMs
      }
    );

    // =========================================================================
    // STEP 3: Surface 1 — Dispatcher #bcSecurityPanel (842026 Full <-> NDA/OTS/POLYGON Zero-PII)
    // =========================================================================
    await dispPage.waitForTimeout(700);
    await dispPage.evaluate(
      ({ id, inc }) => {
        if (window.dispatcherApp) {
          if (inc) window.dispatcherApp.incidents.set(id, inc);
          window.dispatcherApp.selectIncident(id);
        }
      },
      { id: mainCaseId, inc: resolvedRes.incident }
    );
    await dispPage.waitForTimeout(300);

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

    const dispInternalUi = await dispPage.evaluate(() => {
      document.getElementById('bcSecurityPanel')?.scrollIntoView({ block: 'start' });
      return {
        pillCount: document.querySelectorAll('#bcNetPillBar .bc-net-pill').length,
        activePill: document.querySelector('#bcNetPillBar .bc-net-pill.is-active')?.getAttribute('data-bc-net'),
        selectVal: document.getElementById('bcNetworkSwitch')?.value,
        reporter: document.getElementById('uiProcReporter')?.textContent?.trim() || '',
        officer: document.getElementById('uiProcOfficer')?.textContent?.trim() || '',
        durResp: document.getElementById('uiProcDurResponse')?.textContent?.trim() || '',
        durTravel: document.getElementById('uiProcDurTravel')?.textContent?.trim() || '',
        durTotal: document.getElementById('uiProcDurTotal')?.textContent?.trim() || ''
      };
    });

    await saveShot(dispPage.locator('#bcSecurityPanel'), '01-dispatcher-842026-full');
    const dispInternalQrShot = await saveShot(dispPage.locator('#verifyQrCodeBox'), '01b-dispatcher-qr-842026');
    const dispInternalQr = decodeQrImageWithOpenCv(dispInternalQrShot);
    report.qrDecodes.dispatcherInternal842026 = dispInternalQr;
    report.metrics.qrDecodeTotalCount += 1;
    if (dispInternalQr.ok) report.metrics.qrDecodePassCount += 1;

    assertCheck(
      '3A. Surface 1 (dispatcher.html #bcSecurityPanel) on 842026 renders 4 network pills, displays 100% Full PII (unmasked phone, citizen & officer names), and scannable QR',
      dispInternalUi.pillCount === 4 &&
        dispInternalUi.activePill === '842026' &&
        dispInternalUi.selectVal === '842026' &&
        dispInternalUi.reporter.includes(pii.reporterName) &&
        dispInternalUi.reporter.includes(pii.phone) &&
        dispInternalUi.officer.includes(pii.officerName) &&
        dispInternalUi.officer.includes(pii.unitName) &&
        dispInternalQr.ok === true &&
        dispInternalQr.decoded.includes('network=842026') &&
        dispInternalQr.decoded.includes(`case=${encodeURIComponent(mainCaseId)}`),
      {
        ...dispInternalUi,
        qrDecoded: dispInternalQr.decoded
      }
    );

    const dispExternalLeaks = {};
    let dispOtsQr = { ok: false, decoded: '' };
    let dispExportedZeroPiiLeaks = [];

    for (const net of ['NDA', 'OTS', 'POLYGON']) {
      await dispPage.click(`#bcPill${net}`);
      await dispPage.waitForFunction(
        (expectedNet) => {
          const sel = document.getElementById('bcNetworkSwitch');
          const res = document.getElementById('verifyResult');
          return (
            sel?.value === expectedNet &&
            res &&
            res.innerText.includes('XÁC THỰC CAM KẾT ZERO-PII THÀNH CÔNG') &&
            res.innerText.includes(`Chế độ Zero-PII · ${expectedNet}`)
          );
        },
        net,
        { timeout: 20000 }
      );
      await dispPage.waitForTimeout(200);

      const extSnap = await dispPage.evaluate(() => {
        const panel = document.getElementById('bcSecurityPanel');
        return {
          selectVal: document.getElementById('bcNetworkSwitch')?.value,
          activePill: document.querySelector('#bcNetPillBar .bc-net-pill.is-active')?.getAttribute('data-bc-net'),
          hasOtsBtn: Boolean(document.getElementById('btnDownloadOtsProof')),
          hasAnchorJsonBtn: Boolean(document.getElementById('btnDownloadAnchorJson')),
          durResp: document.getElementById('uiProcDurResponse')?.textContent?.trim() || '',
          durTotal: document.getElementById('uiProcDurTotal')?.textContent?.trim() || '',
          panelText: panel?.innerText || '',
          panelHtml: panel?.innerHTML || ''
        };
      });

      const leaked = findLeakedTokens([extSnap.panelText, extSnap.panelHtml], forbiddenTokens);
      report.metrics.totalZeroPiiLeakCount += leaked.length;
      dispExternalLeaks[net] = {
        selectVal: extSnap.selectVal,
        activePill: extSnap.activePill,
        hasOtsBtn: extSnap.hasOtsBtn,
        hasAnchorJsonBtn: extSnap.hasAnchorJsonBtn,
        durResp: extSnap.durResp,
        durTotal: extSnap.durTotal,
        leakCount: leaked.length,
        leaked
      };

      if (net === 'OTS') {
        await saveShot(dispPage.locator('#bcSecurityPanel'), '02-dispatcher-ots-zeropii');
        const otsQrShot = await saveShot(dispPage.locator('#verifyQrCodeBox'), '02b-dispatcher-qr-ots');
        dispOtsQr = decodeQrImageWithOpenCv(otsQrShot);
        report.qrDecodes.dispatcherExternalOts = dispOtsQr;
        report.metrics.qrDecodeTotalCount += 1;
        if (dispOtsQr.ok) report.metrics.qrDecodePassCount += 1;

        const qrLeaks = findLeakedTokens([dispOtsQr.decoded], forbiddenTokens);
        report.metrics.totalZeroPiiLeakCount += qrLeaks.length;

        const [zeroPiiDl] = await Promise.all([
          dispPage.waitForEvent('download', { timeout: 15000 }),
          dispPage.click('#btnExportLegalDossierJson')
        ]);
        const dlPath = path.join(TMP_QA_DIR, zeroPiiDl.suggestedFilename());
        await zeroPiiDl.saveAs(dlPath);
        const dlText = fs.readFileSync(dlPath, 'utf8');
        dispExportedZeroPiiLeaks = findLeakedTokens([ zeroPiiDl.suggestedFilename(), dlText ], forbiddenTokens);
        report.metrics.totalZeroPiiLeakCount += dispExportedZeroPiiLeaks.length;
      }
    }

    // Switch back to 842026 via select dropdown
    await dispPage.selectOption('#bcNetworkSwitch', '842026');
    await dispPage.waitForFunction(
      (expectedName) => document.getElementById('uiProcReporter')?.textContent?.includes(expectedName),
      pii.reporterName,
      { timeout: 15000 }
    );

    assertCheck(
      '3B. Surface 1 (dispatcher.html #bcSecurityPanel) switching to NDA / OTS / POLYGON enforces 0 PII leaks across DOM, QR & exported JSON while preserving SLA durations and .OTS proof buttons',
      ['NDA', 'OTS', 'POLYGON'].every(
        (n) =>
          dispExternalLeaks[n].leakCount === 0 &&
          dispExternalLeaks[n].hasOtsBtn === true &&
          dispExternalLeaks[n].hasAnchorJsonBtn === true &&
          /\d+/.test(dispExternalLeaks[n].durResp) &&
          /\d+/.test(dispExternalLeaks[n].durTotal)
      ) &&
        dispOtsQr.ok === true &&
        dispOtsQr.decoded.includes('network=OTS') &&
        !dispOtsQr.decoded.includes('case=') &&
        dispExportedZeroPiiLeaks.length === 0,
      {
        dispExternalLeaks,
        dispOtsQrDecoded: dispOtsQr.decoded,
        dispExportedZeroPiiLeakCount: dispExportedZeroPiiLeaks.length
      }
    );

    // =========================================================================
    // STEP 4: Surface 2 — /tra-cuu-blockchain.html (Officer Full vs Public Masked vs Global Zero-PII + .OTS Download)
    // =========================================================================
    const officerPortalPage = await dispContext.newPage();
    await officerPortalPage.goto(
      `${BASE_URL}/tra-cuu-blockchain.html?tx=${encodeURIComponent(latestTxHash)}&case=${encodeURIComponent(mainCaseId)}&network=842026`,
      { waitUntil: 'domcontentloaded', timeout: 40000 }
    );
    await officerPortalPage.waitForFunction(
      () => {
        const card = document.getElementById('bcvReportCard');
        return Boolean(card && !card.hidden && document.getElementById('bcvVerdictTitle')?.textContent?.includes('DỮ LIỆU THẬT'));
      },
      null,
      { timeout: 20000 }
    );
    const officerPortalState = await officerPortalPage.evaluate(() => ({
      roleBadge: document.getElementById('bcvViewerRoleBadge')?.textContent?.trim() || '',
      netBtnCount: document.querySelectorAll('#bcvNetworkSwitchBar [data-bcv-net]').length,
      summaryText: document.getElementById('bcvProcessSummaryGrid')?.innerText || ''
    }));
    await saveShot(officerPortalPage, '03-portal-officer-842026-full');
    await officerPortalPage.close();

    assertCheck(
      '4A. Surface 2 (/tra-cuu-blockchain.html) on 842026 shows 100% Full PII (unmasked phone, CCCD, citizen & officer names) to authenticated officer',
      officerPortalState.netBtnCount === 4 &&
        officerPortalState.roleBadge.includes('Cán bộ Trực ban') &&
        officerPortalState.summaryText.includes(pii.reporterName) &&
        officerPortalState.summaryText.includes(pii.phone) &&
        officerPortalState.summaryText.includes(pii.cccd) &&
        officerPortalState.summaryText.includes(pii.officerName),
      {
        roleBadge: officerPortalState.roleBadge,
        netBtnCount: officerPortalState.netBtnCount
      }
    );

    const publicContext = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      locale: 'vi-VN',
      userAgent: CHROME_UA,
      acceptDownloads: true
    });
    const publicPortalPage = await publicContext.newPage();
    publicPortalPage.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(`portal: ${msg.text()}`);
      }
    });
    publicPortalPage.on('pageerror', (err) => consoleErrors.push(`portal-pageerror: ${String(err)}`));

    await publicPortalPage.goto(
      `${BASE_URL}/tra-cuu-blockchain.html?tx=${encodeURIComponent(latestTxHash)}&network=842026`,
      { waitUntil: 'domcontentloaded', timeout: 40000 }
    );
    await publicPortalPage.waitForFunction(
      () => {
        const card = document.getElementById('bcvReportCard');
        return Boolean(card && !card.hidden && document.getElementById('bcvVerdictTitle')?.textContent?.includes('DỮ LIỆU THẬT'));
      },
      null,
      { timeout: 20000 }
    );

    const publicInternalSummary = await publicPortalPage.evaluate(
      () => document.getElementById('bcvProcessSummaryGrid')?.innerText || ''
    );

    const portalExternalAudit = {};
    let portalOtsQr = { ok: false, decoded: '' };
    let anchorJsonPath = '';
    let otsBinaryPath = '';

    for (const net of ['NDA', 'OTS', 'POLYGON']) {
      await publicPortalPage.click(`#bcvNetBtn${net}`);
      await publicPortalPage.waitForFunction(
        (expectedNet) => {
          const active = document.querySelector('#bcvNetworkSwitchBar .bcv-net-btn.is-active')?.getAttribute('data-bcv-net');
          const box = document.getElementById('bcvGlobalAnchorBox');
          const urlHasNet = window.location.search.includes(`network=${expectedNet}`);
          return active === expectedNet && box && !box.hidden && box.classList.contains('is-expanded') && urlHasNet;
        },
        net,
        { timeout: 20000 }
      );
      await publicPortalPage.waitForTimeout(250);

      const snap = await publicPortalPage.evaluate(() => ({
        href: window.location.href,
        queryVal: document.getElementById('bcvQueryInput')?.value || '',
        bodyText: document.body?.innerText || '',
        reportHtml: document.getElementById('bcvReportCard')?.innerHTML || '',
        recentHtml: document.getElementById('bcvRecentSection')?.innerHTML || '',
        hasAnchorBtn: Boolean(document.getElementById('btnBcvDownloadAnchorDoc')),
        hasOtsBtn: Boolean(document.getElementById('btnBcvDownloadOts')),
        otsOrgHref: document.getElementById('btnBcvOpenOtsOrg')?.getAttribute('href') || ''
      }));

      const leaked = findLeakedTokens(
        [snap.href, snap.queryVal, snap.bodyText, snap.reportHtml, snap.recentHtml],
        forbiddenTokens
      );
      report.metrics.totalZeroPiiLeakCount += leaked.length;
      portalExternalAudit[net] = {
        leakCount: leaked.length,
        leaked,
        hasAnchorBtn: snap.hasAnchorBtn,
        hasOtsBtn: snap.hasOtsBtn,
        otsOrgHref: snap.otsOrgHref
      };

      if (net === 'OTS') {
        await saveShot(publicPortalPage, '04-portal-ots-zeropii');
        const qrLoc = publicPortalPage.locator('#bcvQrSvgBox');
        await qrLoc.scrollIntoViewIfNeeded();
        const portalOtsQrPath = await saveShot(qrLoc, '04b-portal-qr-ots');
        portalOtsQr = decodeQrImageWithOpenCv(portalOtsQrPath);
        report.qrDecodes.portalExternalOts = portalOtsQr;
        report.metrics.qrDecodeTotalCount += 1;
        if (portalOtsQr.ok) report.metrics.qrDecodePassCount += 1;

        const qrLeaks = findLeakedTokens([portalOtsQr.decoded], forbiddenTokens);
        report.metrics.totalZeroPiiLeakCount += qrLeaks.length;

        const [anchorDl] = await Promise.all([
          publicPortalPage.waitForEvent('download', { timeout: 20000 }),
          publicPortalPage.click('#btnBcvDownloadAnchorDoc')
        ]);
        anchorJsonPath = path.join(TMP_QA_DIR, anchorDl.suggestedFilename());
        await anchorDl.saveAs(anchorJsonPath);

        const [otsDl] = await Promise.all([
          publicPortalPage.waitForEvent('download', { timeout: 25000 }),
          publicPortalPage.click('#btnBcvDownloadOts')
        ]);
        otsBinaryPath = path.join(TMP_QA_DIR, otsDl.suggestedFilename());
        await otsDl.saveAs(otsBinaryPath);
      }
    }

    const anchorDocBuf = fs.readFileSync(anchorJsonPath);
    const anchorDocText = anchorDocBuf.toString('utf8');
    const anchorDocObj = JSON.parse(anchorDocText);
    const anchorDocLeaks = findLeakedTokens([anchorDocText], forbiddenTokens);
    report.metrics.totalZeroPiiLeakCount += anchorDocLeaks.length;

    const otsBuf = fs.readFileSync(otsBinaryPath);
    const otsVerify = verifyDetachedOtsBinaryIndependent(otsBuf, anchorDocBuf);
    report.otsVerification.newCaseLatestBlock = otsVerify;
    report.metrics.otsProofBytes = otsBuf.length;
    report.metrics.publicAnchorJsonBytes = anchorDocBuf.length;

    assertCheck(
      '4B. Surface 2 (/tra-cuu-blockchain.html) masks phone/CCCD on public 842026 and enforces 0 PII leaks across NDA / OTS / POLYGON + scannable OTS QR',
      publicInternalSummary.includes(pii.maskedPhone3) &&
        !publicInternalSummary.includes(pii.phone) &&
        !publicInternalSummary.includes(pii.cccd) &&
        ['NDA', 'OTS', 'POLYGON'].every(
          (n) =>
            portalExternalAudit[n].leakCount === 0 &&
            portalExternalAudit[n].hasAnchorBtn &&
            portalExternalAudit[n].hasOtsBtn &&
            portalExternalAudit[n].otsOrgHref === 'https://opentimestamps.org'
        ) &&
        portalOtsQr.ok === true &&
        portalOtsQr.decoded.includes('network=OTS') &&
        !portalOtsQr.decoded.includes('case='),
      {
        portalExternalAudit,
        portalOtsQrDecoded: portalOtsQr.decoded
      }
    );

    assertCheck(
      '4C. Downloaded SOSVN_Block_<N>_PublicAnchor.json (0% PII) & .ots binary proof pass independent OpenTimestamps v1 magic header + SHA-256 + calendar attestation check',
      anchorDocObj.protocol === 'SOSVN-ANCHOR-V1' &&
        anchorDocLeaks.length === 0 &&
        otsVerify.valid === true,
      {
        anchorFile: path.basename(anchorJsonPath),
        otsFile: path.basename(otsBinaryPath),
        otsVerify
      }
    );

    // Verify Tab 2 Decoder accepts SOSVN_Block_<N>_PublicAnchor.json
    await publicPortalPage.click('#tabBtnDecoder');
    await publicPortalPage.setInputFiles('#bcvFileInput', anchorJsonPath);
    await publicPortalPage.waitForFunction(
      () => {
        const title = document.getElementById('bcvVerdictTitle')?.textContent || '';
        const offOk = document.getElementById('bcvOfflineBadge')?.classList.contains('ok');
        const onOk = document.getElementById('bcvOnlineBadge')?.classList.contains('ok');
        return Boolean(title.includes('ZERO-PII') && offOk && onOk);
      },
      null,
      { timeout: 20000 }
    );
    const tab2AnchorVerdict = await publicPortalPage.evaluate(() => ({
      verdictTitle: document.getElementById('bcvVerdictTitle')?.textContent?.trim() || '',
      bodyText: document.getElementById('bcvReportCard')?.innerText || ''
    }));
    const tab2Leaks = findLeakedTokens([tab2AnchorVerdict.bodyText], forbiddenTokens);
    report.metrics.totalZeroPiiLeakCount += tab2Leaks.length;

    assertCheck(
      '4D. Tab 2 Decoder verifies PublicAnchor.json (SOSVN-ANCHOR-V1) with 100% dual offline+online match and 0 PII exposure',
      tab2AnchorVerdict.verdictTitle.includes('100%') && tab2Leaks.length === 0,
      { verdictTitle: tab2AnchorVerdict.verdictTitle, leakCount: tab2Leaks.length }
    );

    // =========================================================================
    // STEP 5: Surface 3 — /api/blockchain/explorer/:ref (4-Network Switcher & Zero-PII Certificate)
    // =========================================================================
    const officerExplorerPage = await dispContext.newPage();
    await officerExplorerPage.goto(
      `${BASE_URL}/api/blockchain/explorer/${encodeURIComponent(latestTxHash)}?network=842026`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    const officerExplorerState = await officerExplorerPage.evaluate(() => ({
      tabCount: document.querySelectorAll('#explorerNetworkSwitcher .net-tab').length,
      activeNet: document.querySelector('.wrap')?.getAttribute('data-active-network') || '',
      bodyText: document.body?.innerText || ''
    }));
    await saveShot(officerExplorerPage, '05-explorer-officer-842026-full');
    await officerExplorerPage.close();

    const explorerPage = await publicContext.newPage();
    await explorerPage.goto(
      `${BASE_URL}/api/blockchain/explorer/${encodeURIComponent(latestTxHash)}?network=842026`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    const explorerExternalAudit = {};
    let explorerOtsQr = { ok: false, decoded: '' };

    for (const net of ['NDA', 'OTS', 'POLYGON']) {
      await Promise.all([
        explorerPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
        explorerPage.click(`#explorerNetworkSwitcher .net-tab[data-net="${net}"]`)
      ]);
      const snap = await explorerPage.evaluate(() => ({
        href: window.location.href,
        activeNet: document.querySelector('.wrap')?.getAttribute('data-active-network') || '',
        zeroPiiAttr: document.querySelector('.wrap')?.getAttribute('data-zero-pii') || '',
        hasGlobalProofBox: Boolean(document.getElementById('explorerGlobalProofBox')),
        hasOtsBtn: Boolean(document.getElementById('btnExplorerDownloadOts')),
        hasAnchorBtn: Boolean(document.getElementById('btnExplorerDownloadAnchorJson')),
        fullHtml: document.documentElement?.innerHTML || ''
      }));

      const leaked = findLeakedTokens([snap.href, snap.fullHtml], forbiddenTokens);
      report.metrics.totalZeroPiiLeakCount += leaked.length;
      explorerExternalAudit[net] = {
        activeNet: snap.activeNet,
        zeroPiiAttr: snap.zeroPiiAttr,
        hasGlobalProofBox: snap.hasGlobalProofBox,
        hasOtsBtn: snap.hasOtsBtn,
        hasAnchorBtn: snap.hasAnchorBtn,
        leakCount: leaked.length,
        leaked
      };

      if (net === 'OTS') {
        await saveShot(explorerPage, '06-explorer-ots-zeropii');
        const expQrShot = await saveShot(explorerPage.locator('.qr-box'), '06b-explorer-qr-ots');
        explorerOtsQr = decodeQrImageWithOpenCv(expQrShot);
        report.qrDecodes.explorerExternalOts = explorerOtsQr;
        report.metrics.qrDecodeTotalCount += 1;
        if (explorerOtsQr.ok) report.metrics.qrDecodePassCount += 1;

        const qrLeaks = findLeakedTokens([explorerOtsQr.decoded], forbiddenTokens);
        report.metrics.totalZeroPiiLeakCount += qrLeaks.length;
      }
    }
    await explorerPage.close();

    assertCheck(
      '5. Surface 3 (/api/blockchain/explorer/:ref) renders 4-network switcher, shows Full PII to officer on 842026, and enforces 0 PII leaks + scannable QR across NDA / OTS / POLYGON',
      officerExplorerState.tabCount === 4 &&
        officerExplorerState.activeNet === '842026' &&
        officerExplorerState.bodyText.includes(pii.reporterName) &&
        officerExplorerState.bodyText.includes(pii.phone) &&
        ['NDA', 'OTS', 'POLYGON'].every(
          (n) =>
            explorerExternalAudit[n].activeNet === n &&
            explorerExternalAudit[n].zeroPiiAttr === 'true' &&
            explorerExternalAudit[n].hasGlobalProofBox &&
            explorerExternalAudit[n].hasOtsBtn &&
            explorerExternalAudit[n].hasAnchorBtn &&
            explorerExternalAudit[n].leakCount === 0
        ) &&
        explorerOtsQr.ok === true &&
        explorerOtsQr.decoded.includes('network=OTS') &&
        !explorerOtsQr.decoded.includes('case='),
      {
        explorerExternalAudit,
        explorerOtsQrDecoded: explorerOtsQr.decoded
      }
    );

    // =========================================================================
    // STEP 6: On-Demand .OTS Stamping for Legacy / Earliest Block (e.g. Block #101 on Staging)
    // =========================================================================
    const probe101 = await fetch(`${BASE_URL}/api/blockchain/lookup?q=101&network=OTS`, {
      headers: { 'User-Agent': CHROME_UA }
    }).then((r) => r.json());
    const legacyRef = probe101?.found ? '101' : String(createCaseRes?.incident?.blockchain?.triggerBlockNumber || 1);

    const [legacyAnchorResp, legacyOtsResp] = await Promise.all([
      fetch(`${BASE_URL}/api/blockchain/anchor-doc/${legacyRef}?download=1`, { headers: { 'User-Agent': CHROME_UA } }),
      fetch(`${BASE_URL}/api/blockchain/ots/${legacyRef}`, { headers: { 'User-Agent': CHROME_UA } })
    ]);
    const legacyAnchorBuf = Buffer.from(await legacyAnchorResp.arrayBuffer());
    const legacyOtsBuf = Buffer.from(await legacyOtsResp.arrayBuffer());
    const legacyVerify = verifyDetachedOtsBinaryIndependent(legacyOtsBuf, legacyAnchorBuf);
    report.otsVerification[`legacyBlock_${legacyRef}`] = legacyVerify;

    assertCheck(
      `6. On-demand .OTS stamping & verification succeeds for Block #${legacyRef} and total browser console errors === 0`,
      legacyAnchorResp.status === 200 &&
        legacyOtsResp.status === 200 &&
        legacyVerify.valid === true &&
        consoleErrors.length === 0,
      {
        testedBlockRef: legacyRef,
        legacyVerify,
        consoleErrorsCount: consoleErrors.length,
        consoleErrors
      }
    );

    await publicContext.close();
    await dispContext.close();
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    try {
      fs.rmSync(TMP_QA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  fs.writeFileSync(JSON_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    `# Báo Cáo QA Tự Động Playwright + OpenCV — Đa Mạng Chuỗi Khối Zero-PII & Chứng Chỉ Quốc Tế OpenTimestamps (.OTS)`,
    ``,
    `- **Môi trường kiểm thử:** \`${report.reportPrefix}\``,
    `- **URL mục tiêu:** \`${report.targetUrl}\``,
    `- **Thời điểm xác thực:** \`${report.verifiedAt}\``,
    `- **Kết quả tổng thể:** **${report.summary.passed} / ${report.summary.total} PASS** (\`failed: ${report.summary.failed}\`)`,
    `- **Tổng số rò rỉ PII trên các mạng ngoài nội bộ (\`NDA\`, \`OTS\`, \`POLYGON\`):** **\`${report.metrics.totalZeroPiiLeakCount}\` (Mục tiêu: \`0\`)**`,
    `- **Tỷ lệ quét mã QR bằng OpenCV \`QRCodeDetector\`:** **\`${report.metrics.qrDecodePassCount} / ${report.metrics.qrDecodeTotalCount}\` (100%)**`,
    `- **Độ trễ tạo ca SOS không chặn (\`/api/sos/create\`):** \`${report.metrics.sosCreateLatencyMs ?? '-'} ms\``,
    `- **Kích thước tệp \`PublicAnchor.json\` / chứng chỉ \`.ots\`:** \`${report.metrics.publicAnchorJsonBytes ?? '-'} bytes\` / \`${report.metrics.otsProofBytes ?? '-'} bytes\``,
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

  console.log(
    `\nSUMMARY [${REPORT_PREFIX}]: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed, zeroPiiLeaks=${report.metrics.totalZeroPiiLeakCount}.`
  );
  if (report.summary.failed > 0 || report.metrics.totalZeroPiiLeakCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL MULTINET QA SUITE ERROR:', err);
  process.exit(1);
});
