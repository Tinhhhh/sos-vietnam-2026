/**
 * SOS Vietnam 2026 — End-to-End Playwright Verification Suite
 * Scope:
 *   - Hang muc 1: Internal Blockchain Ledger (842026 / 84202600), Multi-Chain EVM Readiness,
 *                 Hardware ESP32-C3 + CapPhatTheSOS.exe DePIN Seal & Live Evidence Hash Anti-Spoofing,
 *                 and 4-Step Case Lifecycle Sealing (1_SOS_TRIGGER, 2_EVIDENCE_SEAL, 3_OFFICER_DISPATCH, 4_CASE_RESOLVED)
 *   - Hang muc 2: Multi-Tier Field Evidence Storage & Pre-Upload RAM SHA-256 Sealing
 *   - Hang muc 3: Dispatcher Command Center ".bc-security-panel" (Web3 / Blockchain Ledger)
 *   - Hang muc 4: Live Byte-Level SHA-256 Integrity Audit, Original Evidence Download, Legal Dossier & SVG QR
 *   - Hang muc 5: Citizen Emergency Camouflage (5.1 iOS Fake Incoming/Active Call + 3-Tap Hangup Guard,
 *                 5.2 Blackout Stealth Mode #000000 + 4-Tap Unlock Guard, Covert 5s MediaRecorder SHA-256 Upload)
 *   - DAC_TA_DONG_BO_WEB_VA_AI.md v2.1: 3-Tier DePIN Card Portal (/cap-phat-the.html), Rules 1-5 & Test Vector 5.5
 *
 * Usage:
 *   node playwright/verify-web3-depin-and-stealth-sos.mjs            # Targets built Docker container http://127.0.0.1:3106
 *   node playwright/verify-web3-depin-and-stealth-sos.mjs --staging  # Targets live Render Staging https://sos-vietnam-2026.onrender.com
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const IS_STAGING = args.includes('--staging');
const urlArg = args.find((a) => a.startsWith('--url='));
const BASE_URL = (
  urlArg
    ? urlArg.slice('--url='.length)
    : IS_STAGING
      ? 'https://sos-vietnam-2026.onrender.com'
      : (process.env.QA_BASE_URL || 'http://127.0.0.1:3106')
).replace(/\/+$/, '');

const DOCKER_CONTAINER = process.env.QA_DOCKER_CONTAINER || 'sos-vietnam-web3-qa';
const SKIP_DOCKER_RESTART = IS_STAGING || args.includes('--no-restart');

const OUT_DIR = path.resolve('Reports/qa/playwright/2026-11-02-web3-depin-stealth-sos');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FILE_PREFIX = IS_STAGING ? 'staging-' : '';
const JSON_REPORT_PATH = path.join(OUT_DIR, `${FILE_PREFIX}qa-report.json`);
const MD_REPORT_PATH = path.join(OUT_DIR, `${FILE_PREFIX}qa-report.md`);

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const COMMAND_SECRET_KEY = 'BTL_CSCD_E10_D1_SOS_VIETNAM_2026';

function sha256Prefixed(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return '0x' + crypto.createHash('sha256').update(buf).digest('hex');
}

async function waitForHealth(baseUrl, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/healthz`, {
        headers: { 'User-Agent': CHROME_UA }
      });
      if (res.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Target ${baseUrl}/healthz did not become healthy within ${timeoutMs}ms`);
}

async function apiJson(urlPath, { method = 'GET', body = null, headers = {} } = {}) {
  const reqHeaders = {
    'User-Agent': CHROME_UA,
    ...headers
  };
  let payload = undefined;
  if (body !== null && body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const resp = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: reqHeaders,
    body: payload
  });
  const text = await resp.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { rawText: text.slice(0, 400) };
  }
  return { status: resp.status, ok: resp.ok, json, headers: resp.headers };
}

async function main() {
  const runSuffix = Date.now().toString(36).toUpperCase().slice(-6);
  const report = {
    suite: 'SOS Vietnam 2026 — Web3 DePIN Blockchain, Hardware Anti-Spoofing, DePIN Portal v2.1 & Stealth SOS E2E',
    mode: IS_STAGING ? 'render-staging' : 'docker-local',
    targetUrl: BASE_URL,
    dockerContainer: IS_STAGING ? null : DOCKER_CONTAINER,
    verifiedAt: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    metrics: {},
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

  async function saveShot(page, baseName) {
    const fileName = `${FILE_PREFIX}${baseName}`;
    const fullPath = path.join(OUT_DIR, fileName);
    await page.screenshot({ path: fullPath, fullPage: false });
    report.screenshots.push(fileName);
    return fullPath;
  }

  const createdIncidentIds = [];
  let browser = null;

  try {
    await waitForHealth(BASE_URL);

    // =========================================================================
    // GROUP A: Blockchain Status & Hardware SOS DePIN Anti-Spoofing (DAC_TA v2.1)
    // =========================================================================
    const bcStatusRes = await apiJson('/api/blockchain/status');
    assertCheck(
      'A1. /api/blockchain/status returns Sandbox Chain ID 84202600, SOS_RENDER_SANDBOX & Multi-Chain networks (842026, NDA, POLYGON)',
      bcStatusRes.ok &&
        bcStatusRes.json.ok === true &&
        bcStatusRes.json.chainId === 84202600 &&
        bcStatusRes.json.storageFolder === 'SOS_RENDER_SANDBOX' &&
        Boolean(bcStatusRes.json.networks?.['842026']) &&
        Boolean(bcStatusRes.json.networks?.NDA) &&
        Boolean(bcStatusRes.json.networks?.POLYGON),
      {
        status: bcStatusRes.status,
        chainId: bcStatusRes.json.chainId,
        storageFolder: bcStatusRes.json.storageFolder,
        networks: Object.keys(bcStatusRes.json.networks || {})
      }
    );

    // A2. Official DAC_TA v2.1 Section 5.5 + Section 7 Parallel 4G Hardware SOS Vector
    const hwStartMs = performance.now();
    const specVectorRes = await apiJson('/api/hardware-sos', {
      method: 'POST',
      body: {
        cardID: 'SOS_CSCD10_09',
        button: 1,
        type: 'CONG_AN_DIA_PHUONG',
        target_unit: 'CONG_AN_DIA_PHUONG',
        unit_title: 'CÔNG AN XÃ/PHƯỜNG (AN NINH TRẬT TỰ)',
        user_name: 'Nguyễn Văn An',
        user_phone: '0918889999',
        user_cccd: '079200012345',
        officer: 'Đại úy Trần Văn Nam - E10 Đ1',
        time: '2026-11-02 14:40:00',
        timestamp: '2026-11-02 14:40:00',
        created_at: '2026-11-02 14:40:00',
        mode: 'REAL',
        block_index: 1,
        prev_seal: '0x0000000000000000000000000000000000000000000000000000000000000000',
        bc_seal: '0x3c729fdfa29010da748df56a951a60896155a5fd749497928427bd308684c032',
        seal: '0x3c729fdfa29010da748df56a951a60896155a5fd749497928427bd308684c032',
        hw_mac: 'A4CF128E3B09',
        lat: 10.0452,
        lon: 105.7469,
        live_evidence_hash: '0x11c59e69ae2e1865d21f82bb59c8785a1f07299be5be8d82e08d3e9d4bfa8585',
        chain_id: 842026
      }
    });
    report.metrics.hardwareSosDePinLatencyMs = Number((performance.now() - hwStartMs).toFixed(2));
    const hwIncidentId = specVectorRes.json?.incident?.id || specVectorRes.json?.id;
    if (hwIncidentId) createdIncidentIds.push(hwIncidentId);

    assertCheck(
      'A2. POST /api/hardware-sos verifies DAC_TA v2.1 Section 5.5 vector (SOS_CSCD10_09, bc_seal & live_evidence_hash) and seals 1_SOS_TRIGGER block',
      specVectorRes.ok &&
        specVectorRes.json.ok === true &&
        specVectorRes.json.hardwareAuth?.verified === true &&
        specVectorRes.json.hardwareAuth?.status === 'DEPIN_VERIFIED' &&
        specVectorRes.json.hardwareAuth?.liveHashVerified === true &&
        Number(specVectorRes.json.blockNumber) >= 101 &&
        /^0x[0-9a-f]{64}$/i.test(String(specVectorRes.json.txHash || '')),
      {
        incidentId: hwIncidentId,
        blockNumber: specVectorRes.json.blockNumber,
        txHash: specVectorRes.json.txHash,
        hardwareAuth: specVectorRes.json.hardwareAuth
      }
    );

    // A3. ESP32-C3 Self-Seal + Button 3 CUU_NAN_CUU_HO routing to Fire/Rescue
    const espCardId = `SOS_ESP32_${runSuffix}`;
    const espMac = 'B8F009AC4412';
    const espSeal = sha256Prefixed(
      `${espCardId}|Trần Hoàng Minh|0905112233|092099004455|${espMac}|${COMMAND_SECRET_KEY}`
    );
    const espLiveHash = sha256Prefixed(
      `${espCardId}|${espMac}|CUU_NAN_CUU_HO|10.036500,105.781200|${espSeal}`
    );
    const espRes = await apiJson('/api/hardware-sos', {
      method: 'POST',
      body: {
        cardID: espCardId,
        button: 3,
        type: 'CUU_NAN_CUU_HO',
        target_unit: 'CUU_NAN_CUU_HO',
        unit_title: 'CỨU NẠN CỨU HỘ / PCCC (114)',
        user_name: 'Trần Hoàng Minh',
        user_phone: '0905112233',
        user_cccd: '092099004455',
        hw_mac: espMac,
        bc_seal: espSeal,
        live_evidence_hash: espLiveHash,
        lat: 10.0365,
        lon: 105.7812,
        chain_id: 842026
      }
    });
    if (espRes.json?.incident?.id) createdIncidentIds.push(espRes.json.incident.id);
    assertCheck(
      'A3. POST /api/hardware-sos verifies ESP32-C3 chip formula & routes CUU_NAN_CUU_HO (Button 3) to Fire/Rescue',
      espRes.ok &&
        espRes.json.hardwareAuth?.verified === true &&
        espRes.json.hardwareAuth?.status === 'DEPIN_VERIFIED' &&
        espRes.json.hardwareAuth?.sealScheme === 'ESP32_C3_CHIP' &&
        espRes.json.incident?.agency === 'fire',
      {
        hardwareAuth: espRes.json.hardwareAuth,
        agency: espRes.json.incident?.agency
      }
    );

    // A4. Tampered bc_seal -> SPOOF_SUSPECTED
    const spoofRes = await apiJson('/api/hardware-sos', {
      method: 'POST',
      body: {
        cardID: 'SOS_SPOOF_99',
        button: 1,
        type: 'CONG_AN_DIA_PHUONG',
        user_name: 'Kẻ Giả Mạo',
        user_phone: '0999000111',
        user_cccd: '001099000111',
        hw_mac: 'DEADBEEF0001',
        bc_seal: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        lat: 10.0311,
        lon: 105.7711
      }
    });
    if (spoofRes.json?.incident?.id) createdIncidentIds.push(spoofRes.json.incident.id);
    assertCheck(
      'A4. POST /api/hardware-sos flags tampered bc_seal as SPOOF_SUSPECTED (verified: false)',
      spoofRes.ok &&
        spoofRes.json.hardwareAuth?.verified === false &&
        spoofRes.json.hardwareAuth?.status === 'SPOOF_SUSPECTED',
      { hardwareAuth: spoofRes.json.hardwareAuth }
    );

    // A5. Blank Unprovisioned Card (THE_CHUA_CAP_PHAT, Rule 3 & Rule 5)
    const blankRes = await apiJson('/api/hardware-sos', {
      method: 'POST',
      body: {
        cardID: 'THE_CHUA_CAP_PHAT',
        button: 1,
        type: 'CONG_AN_DIA_PHUONG',
        user_name: '',
        user_phone: '',
        user_cccd: '',
        bc_seal: '',
        seal: '',
        hw_mac: 'A4CF12000001',
        lat: 10.0322,
        lon: 105.7722
      }
    });
    if (blankRes.json?.incident?.id) createdIncidentIds.push(blankRes.json.incident.id);
    const blankReporter = String(blankRes.json.incident?.reporterName || '');
    assertCheck(
      'A5. Blank unprovisioned card (THE_CHUA_CAP_PHAT) stays backward-compatible (UNSEALED_LEGACY_IOT) with zero hardcoded sample names (Rule 3)',
      blankRes.ok &&
        blankRes.json.hardwareAuth?.status === 'UNSEALED_LEGACY_IOT' &&
        blankReporter.includes('THE_CHUA_CAP_PHAT') &&
        !blankReporter.includes('Cụ Nguyễn Văn A') &&
        !blankReporter.includes('Thạch Minh Nhật'),
      {
        reporterName: blankReporter,
        hardwareAuth: blankRes.json.hardwareAuth
      }
    );

    // =========================================================================
    // Launch Chromium with Fake WebRTC Microphone Stream & Geolocation Permission
    // =========================================================================
    browser = await chromium.launch({
      headless: true,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      locale: 'vi-VN',
      userAgent: CHROME_UA,
      permissions: ['geolocation', 'microphone'],
      geolocation: { latitude: 10.0349, longitude: 105.75, accuracy: 12 }
    });

    // =========================================================================
    // GROUP B: DePIN Card Provisioning & Verification Portal (/cap-phat-the.html)
    // =========================================================================
    const portalPage = await context.newPage();
    portalPage.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await portalPage.goto(`${BASE_URL}/cap-phat-the.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await portalPage.waitForTimeout(800);

    const rule3State = await portalPage.evaluate(() => {
      const ids = [
        'cardIdInput',
        'cardNameInput',
        'cardPhoneInput',
        'cardCccdInput',
        'cardOfficerInput',
        'cardSealOutput'
      ];
      const values = Object.fromEntries(
        ids.map((id) => [id, document.getElementById(id)?.value ?? 'MISSING'])
      );
      const bodyText = document.body.innerText || '';
      return {
        values,
        allEmpty: Object.values(values).every((v) => v === ''),
        hasSampleNhat: bodyText.includes('Thạch Minh Nhật'),
        hasSampleCuA: bodyText.includes('Cụ Nguyễn Văn A')
      };
    });
    assertCheck(
      'B1. /cap-phat-the.html obeys DAC_TA v2.1 Rule 3 (empty initial inputs, cue placeholders only, zero hardcoded personal names)',
      rule3State.allEmpty && !rule3State.hasSampleNhat && !rule3State.hasSampleCuA,
      rule3State
    );

    await portalPage.click('#btnLoadSpecVector');
    await portalPage.waitForTimeout(250);
    const vectorSeal = await portalPage.inputValue('#cardSealOutput');
    assertCheck(
      'B2. /cap-phat-the.html computes exact DAC_TA v2.1 Section 5.5 Genesis SEAL (0x3c729fdfa29010da...)',
      vectorSeal === '0x3c729fdfa29010da748df56a951a60896155a5fd749497928427bd308684c032',
      { vectorSeal }
    );

    // B3. TEST mode provision + wipe lifecycle
    const testCardId = `SOS_QA_TEST_${runSuffix}`;
    await portalPage.click('#btnModeTest');
    await portalPage.fill('#cardIdInput', testCardId);
    await portalPage.fill('#cardNameInput', 'Cán Bộ Kiểm Thử Mạch');
    await portalPage.fill('#cardPhoneInput', '0901234567');
    await portalPage.fill('#cardCccdInput', '092099112233');
    await portalPage.fill('#cardOfficerInput', 'BTL CSCD - E10 D1');
    await portalPage.fill('#cardTimeInput', '2026-11-02 15:00:00');
    await portalPage.fill('#cardHwMacInput', 'A4CF128E9900');
    await portalPage.click('#btnProvisionCard');
    await portalPage.waitForTimeout(700);

    const checkTestProvisioned = await apiJson(`/api/depin/cards/${encodeURIComponent(testCardId)}`);
    await portalPage.click('#btnWipeCard');
    await portalPage.waitForTimeout(700);
    const checkTestWiped = await apiJson(`/api/depin/cards/${encodeURIComponent(testCardId)}`);

    assertCheck(
      'B3. /cap-phat-the.html TEST Mode allows provisioning and clean WIPE_CARD reset',
      checkTestProvisioned.ok &&
        checkTestProvisioned.json.card?.mode === 'TEST' &&
        checkTestWiped.status === 404,
      {
        provisionedMode: checkTestProvisioned.json.card?.mode,
        afterWipeStatus: checkTestWiped.status
      }
    );

    // B4 & B5. REAL mode Genesis #1 -> 1-time lock (403 wipe forbidden) -> Block #2 hash chaining -> SHA-256 READ_DATA verify
    const realCardId = `SOS_QA_REAL_${runSuffix}`;
    await portalPage.click('#btnModeReal');
    await portalPage.fill('#cardIdInput', realCardId);
    await portalPage.fill('#cardNameInput', 'Lê Quốc Bảo');
    await portalPage.fill('#cardPhoneInput', '0919888777');
    await portalPage.fill('#cardCccdInput', '079095888777');
    await portalPage.fill('#cardOfficerInput', 'Đại úy Trần Văn Nam - E10 Đ1');
    await portalPage.fill('#cardTimeInput', '2026-11-02 15:05:00');
    await portalPage.fill('#cardHwMacInput', 'A4CF128E3B09');
    await portalPage.click('#btnProvisionCard');
    await portalPage.waitForTimeout(800);

    const genesisCardRes = await apiJson(`/api/depin/cards/${encodeURIComponent(realCardId)}`);
    const genesisSeal = genesisCardRes.json?.card?.currentSeal || '';

    const wipeBtnLockUi = await portalPage.evaluate(() => {
      const btn = document.getElementById('btnWipeCard');
      return {
        text: btn?.textContent?.trim() || '',
        hasLockedClass: Boolean(btn?.classList.contains('is-locked-real')),
        ariaDisabled: btn?.getAttribute('aria-disabled') || ''
      };
    });
    await portalPage.click('#btnWipeCard', { force: true });
    await portalPage.waitForTimeout(300);
    const directWipeAttempt = await apiJson('/api/depin/cards/wipe', {
      method: 'POST',
      body: { id: realCardId }
    });

    assertCheck(
      'B4. /cap-phat-the.html REAL Mode seals Genesis Block #1 and strictly blocks wiping (UI lock + HTTP 403 REAL_MODE_WIPE_FORBIDDEN)',
      genesisCardRes.ok &&
        genesisCardRes.json.card?.mode === 'REAL' &&
        genesisCardRes.json.card?.currentBlockIndex === 1 &&
        wipeBtnLockUi.hasLockedClass &&
        wipeBtnLockUi.ariaDisabled === 'true' &&
        wipeBtnLockUi.text.includes('BẢO VỆ DỮ LIỆU THẬT') &&
        directWipeAttempt.status === 403 &&
        directWipeAttempt.json.ok === false,
      {
        realCardId,
        genesisSeal,
        wipeBtnLockUi,
        directWipeStatus: directWipeAttempt.status,
        directWipeError: directWipeAttempt.json.error || directWipeAttempt.json.code
      }
    );

    // Lookup existing REAL card -> auto-prepare Block #2 with PrevSeal = genesisSeal
    await portalPage.click('#btnLookupCard');
    await portalPage.waitForTimeout(600);
    const preparedBlock2 = await portalPage.evaluate(() => ({
      blockIndex: document.getElementById('cardBlockInput')?.value,
      prevSeal: document.getElementById('cardPrevSealInput')?.value
    }));
    await portalPage.fill('#cardPhoneInput', '0919999666');
    await portalPage.fill('#cardTimeInput', '2026-11-02 15:10:00');
    await portalPage.click('#btnProvisionCard');
    await portalPage.waitForTimeout(800);

    await portalPage.click('#btnFillReadDataFromForm');
    await portalPage.click('#btnVerifySealNow');
    await portalPage.waitForTimeout(700);

    const block2VerifyState = await portalPage.evaluate(() => {
      const box = document.getElementById('verifySealResultBox');
      return {
        hidden: Boolean(box?.hidden),
        text: box?.innerText || ''
      };
    });
    const afterBlock2Res = await apiJson(`/api/depin/cards/${encodeURIComponent(realCardId)}`);
    await saveShot(portalPage, '01-cap-phat-the-e10-v21.png');

    assertCheck(
      'B5. /cap-phat-the.html chains REAL Block #2 (PrevSeal === Block #1 SEAL) and passes READ_DATA SHA-256 verification',
      preparedBlock2.blockIndex === '2' &&
        preparedBlock2.prevSeal === genesisSeal &&
        afterBlock2Res.json.card?.currentBlockIndex === 2 &&
        afterBlock2Res.json.card?.blocks?.length === 2 &&
        !block2VerifyState.hidden &&
        block2VerifyState.text.includes('HỢP LỆ'),
      {
        preparedBlock2,
        currentBlockIndex: afterBlock2Res.json.card?.currentBlockIndex,
        verifyTextSample: block2VerifyState.text.slice(0, 220)
      }
    );

    // =========================================================================
    // GROUP C: Citizen Emergency Camouflage (index.html + js/stealth-sos.js)
    // =========================================================================
    const citizenPage = await context.newPage();
    await citizenPage.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await citizenPage.waitForTimeout(1200);
    await saveShot(citizenPage, '02-citizen-stealth-bar.png');

    // C1. Click Fake Incoming Call (iOS UI) -> 3s countdown -> Incoming Call "Ba"
    await citizenPage.click('#btnFakeIncomingCall');
    await citizenPage.waitForTimeout(300);
    const countdownPhase = await citizenPage.evaluate(() => window.__sosStealthStats?.callPhase);
    await citizenPage.waitForTimeout(3300);

    const incomingUi = await citizenPage.evaluate(() => {
      const overlay = document.getElementById('iosFakeCallOverlay');
      const incoming = document.getElementById('iosIncomingCallScreen');
      const caller = incoming?.querySelector('.js-ios-caller-name')?.textContent?.trim() || '';
      return {
        overlayVisible: Boolean(overlay && !overlay.hidden),
        incomingVisible: Boolean(incoming && !incoming.hidden),
        caller,
        stats: window.__sosStealthStats
      };
    });
    await saveShot(citizenPage, '03-ios-fake-incoming-call.png');

    assertCheck(
      'C1. Citizen Fake Incoming Call triggers 3s countdown -> fullscreen iOS Incoming Call UI ("Ba")',
      countdownPhase === 'countdown' &&
        incomingUi.overlayVisible &&
        incomingUi.incomingVisible &&
        incomingUi.caller === 'Ba',
      { countdownPhase, incomingUi: { ...incomingUi, stats: undefined }, mode: incomingUi.stats?.mode }
    );

    // C2. Click Green "Trả lời" -> Active Call 6-keypad + 00:01+ timer + silent SOS creation
    await citizenPage.click('#btnIosAnswerCall');
    await citizenPage.waitForTimeout(1600);
    const activeCallUi = await citizenPage.evaluate(() => {
      const activeScreen = document.getElementById('iosActiveCallScreen');
      const timerText = document.getElementById('iosCallTimer')?.textContent?.trim() || '';
      const keypadButtons = document.querySelectorAll('#iosActiveCallScreen .ios-pad-btn').length;
      const modalOpen = Boolean(document.getElementById('sosDetailModal')?.classList.contains('active'));
      return {
        activeVisible: Boolean(activeScreen && !activeScreen.hidden),
        timerText,
        keypadButtons,
        modalOpen,
        stats: window.__sosStealthStats
      };
    });
    await saveShot(citizenPage, '04-ios-fake-active-call.png');

    assertCheck(
      'C2. Answering Fake Call displays 6-button iOS keypad + live 00:01+ timer and silently creates covert SOS with zero visible SOS modal',
      activeCallUi.activeVisible &&
        activeCallUi.keypadButtons === 6 &&
        /^00:0[1-9]/.test(activeCallUi.timerText) &&
        !activeCallUi.modalOpen,
      {
        activeVisible: activeCallUi.activeVisible,
        keypadButtons: activeCallUi.keypadButtons,
        timerText: activeCallUi.timerText,
        incidentId: activeCallUi.stats?.incidentId
      }
    );

    // C3. "Danh ba" Proximity Sensor Blackout (#000000) & Double-Tap Wake
    await citizenPage.click('#btnIosContactsProximity');
    await citizenPage.waitForTimeout(250);
    const proxOn = await citizenPage.evaluate(() => {
      const el = document.getElementById('iosProximityBlackout');
      const cs = el ? getComputedStyle(el) : null;
      return {
        visible: Boolean(el && !el.hidden),
        bg: cs ? cs.backgroundColor : ''
      };
    });
    await citizenPage.click('#iosProximityBlackout');
    await citizenPage.waitForTimeout(120);
    await citizenPage.click('#iosProximityBlackout');
    await citizenPage.waitForTimeout(250);
    const proxOff = await citizenPage.evaluate(
      () => Boolean(document.getElementById('iosProximityBlackout')?.hidden)
    );

    assertCheck(
      'C3. Tapping "Danh bạ" activates #000000 proximity blackout and double-tapping wakes active iOS call UI',
      proxOn.visible && proxOn.bg === 'rgb(0, 0, 0)' && proxOff === true,
      { proxOn, proxOff }
    );

    // C4. Wait for real 5000ms MediaRecorder chunk -> WebCrypto SHA-256 -> POST /api/sos/upload-evidence
    const uploadWaitStart = Date.now();
    let stealthStatsAfterChunk = null;
    while (Date.now() - uploadWaitStart < 12000) {
      stealthStatsAfterChunk = await citizenPage.evaluate(() => window.__sosStealthStats);
      if (stealthStatsAfterChunk && stealthStatsAfterChunk.chunksUploaded >= 1) {
        break;
      }
      await citizenPage.waitForTimeout(400);
    }
    const stealthIncidentId = stealthStatsAfterChunk?.incidentId || null;
    if (stealthIncidentId) createdIncidentIds.push(stealthIncidentId);
    const receipt = stealthStatsAfterChunk?.lastEvidenceReceipt || null;

    assertCheck(
      'C4. Covert 5000ms MediaRecorder hashes audio in browser (WebCrypto SHA-256) and seals 2_EVIDENCE_SEAL block with clientHashMatched === true',
      Boolean(stealthIncidentId) &&
        Number(stealthStatsAfterChunk?.chunksUploaded) >= 1 &&
        Boolean(receipt?.evidenceId) &&
        receipt?.clientHashMatched === true &&
        /^0x[0-9a-f]{64}$/i.test(String(receipt?.sha256Hash || '')) &&
        Number(receipt?.blockNumber) >= 101,
      {
        stealthIncidentId,
        chunksUploaded: stealthStatsAfterChunk?.chunksUploaded,
        receipt
      }
    );

    // C5. 3-Tap Red Hangup Anti-Attacker Guard
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(150);
    const afterTap1 = await citizenPage.evaluate(() => window.__sosStealthStats?.active);
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(150);
    const afterTap2 = await citizenPage.evaluate(() => window.__sosStealthStats?.active);
    await citizenPage.click('#btnIosHangupCall');
    await citizenPage.waitForTimeout(300);
    const afterTap3 = await citizenPage.evaluate(() => ({
      active: window.__sosStealthStats?.active,
      overlayHidden: Boolean(document.getElementById('iosFakeCallOverlay')?.hidden)
    }));

    assertCheck(
      'C5. Red Hangup button strictly enforces 3-consecutive-tap anti-attacker exit guard (1x & 2x stay locked; 3x exits cleanly)',
      afterTap1 === true &&
        afterTap2 === true &&
        afterTap3.active === false &&
        afterTap3.overlayHidden === true,
      { afterTap1, afterTap2, afterTap3 }
    );

    // C6. Blackout Stealth Mode (#000000, z-index: 999999, 4-tap unlock guard)
    const blackoutBtnSelector = await citizenPage.evaluate(() => {
      const trackingBtn = document.getElementById('btnTrackingBlackout');
      if (trackingBtn && trackingBtn.offsetParent !== null) return '#btnTrackingBlackout';
      return '#btnBlackoutStealth';
    });
    await citizenPage.click(blackoutBtnSelector);
    await citizenPage.waitForTimeout(300);

    const blackoutStyle = await citizenPage.evaluate(() => {
      const el = document.getElementById('blackoutStealthOverlay');
      const cs = el ? getComputedStyle(el) : null;
      const rect = el ? el.getBoundingClientRect() : null;
      return {
        visible: Boolean(el && !el.hidden),
        bg: cs ? cs.backgroundColor : '',
        zIndex: cs ? cs.zIndex : '',
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
        vw: window.innerWidth,
        vh: window.innerHeight
      };
    });

    await citizenPage.click('#blackoutStealthOverlay');
    await citizenPage.waitForTimeout(120);
    const boTap1 = await citizenPage.evaluate(() => window.__sosStealthStats?.active);
    await citizenPage.click('#blackoutStealthOverlay');
    await citizenPage.waitForTimeout(120);
    const boTap2 = await citizenPage.evaluate(() => window.__sosStealthStats?.active);
    await citizenPage.click('#blackoutStealthOverlay');
    await citizenPage.waitForTimeout(120);
    const boTap3 = await citizenPage.evaluate(() => window.__sosStealthStats?.active);
    await citizenPage.click('#blackoutStealthOverlay');
    await citizenPage.waitForTimeout(300);
    const boTap4 = await citizenPage.evaluate(() => ({
      active: window.__sosStealthStats?.active,
      hidden: Boolean(document.getElementById('blackoutStealthOverlay')?.hidden)
    }));

    assertCheck(
      'C6. Blackout Stealth Mode renders pitch-black #000000 (100vw x 100vh, z-index 999999) and enforces 4-consecutive-tap unlock guard',
      blackoutStyle.visible &&
        blackoutStyle.bg === 'rgb(0, 0, 0)' &&
        blackoutStyle.zIndex === '999999' &&
        blackoutStyle.width === blackoutStyle.vw &&
        blackoutStyle.height === blackoutStyle.vh &&
        boTap1 === true &&
        boTap2 === true &&
        boTap3 === true &&
        boTap4.active === false &&
        boTap4.hidden === true,
      { blackoutStyle, boTap1, boTap2, boTap3, boTap4 }
    );

    // =========================================================================
    // GROUP D: Dispatcher Command Center (.bc-security-panel) & Live SHA-256 Audit
    // =========================================================================
    const dispPage = await context.newPage();
    await dispPage.goto(`${BASE_URL}/dispatcher.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 35000
    });

    const loginResult = await dispPage.evaluate(async () => {
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
      return { ok: data.ok, token: profile?.token || '' };
    });

    await dispPage.reload({ waitUntil: 'domcontentloaded', timeout: 35000 });
    await dispPage.waitForTimeout(1800);
    await dispPage.evaluate(() => {
      for (const id of ['cyberIntroVideoOverlay', 'cyberGatekeeperModal', 'cosmicPortalView', 'authGateModal']) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
    });

    // Wait until incidents are loaded into window.dispatcherApp
    await dispPage.waitForFunction(
      (targetHwId) =>
        Boolean(window.dispatcherApp && window.dispatcherApp.incidents && window.dispatcherApp.incidents.has(targetHwId)),
      hwIncidentId,
      { timeout: 15000 }
    );

    // D1. Select Hardware SOS & verify DePIN MAC, Verified Badge & Multi-Chain Switcher
    await dispPage.evaluate((id) => {
      window.dispatcherApp.selectIncident(id);
    }, hwIncidentId);
    await dispPage.waitForTimeout(500);

    await dispPage.selectOption('#bcNetworkSwitch', 'NDA');
    const ndaBadgeText = await dispPage.textContent('#bcSecurityPanel .bc-header');
    await dispPage.selectOption('#bcNetworkSwitch', 'POLYGON');
    const polyHref = await dispPage.getAttribute('#uiTxLink', 'href');
    await dispPage.selectOption('#bcNetworkSwitch', '842026');
    await dispPage.waitForTimeout(250);

    const hwPanelState = await dispPage.evaluate(() => {
      const panel = document.getElementById('bcSecurityPanel');
      panel?.scrollIntoView({ block: 'center' });
      return {
        hwMac: document.getElementById('uiHwMac')?.textContent?.trim() || '',
        authBadge: document.getElementById('uiAuthBadge')?.textContent?.trim() || '',
        blockNum: document.getElementById('uiBlockNum')?.textContent?.trim() || '',
        txHref: document.getElementById('uiTxLink')?.getAttribute('href') || ''
      };
    });
    await saveShot(dispPage, '05-dispatcher-hardware-depin-verified.png');

    assertCheck(
      'D1. Dispatcher .bc-security-panel displays ESP32-C3 eFuse MAC (A4CF128E3B09), DePIN VERIFIED badge, and switches Multi-Chain networks (842026 / NDA / POLYGON)',
      loginResult.ok &&
        hwPanelState.hwMac.includes('A4CF128E3B09') &&
        hwPanelState.authBadge.includes('DePIN VERIFIED') &&
        String(ndaBadgeText || '').length > 0 &&
        (String(polyHref || '').includes('network=POLYGON') || String(polyHref || '').includes('polygonscan.com')),
      { hwPanelState, polyHref }
    );

    // D2. Dispatch (3_OFFICER_DISPATCH + responseTimeSeconds) & Resolve (4_CASE_RESOLVED) on Hardware SOS
    const acceptHwRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          unitName: 'Đội Cảnh Sát Cơ Động E10 - Đ1',
          officerName: 'Đại úy Trần Văn Nam',
          officerRank: 'Đại úy',
          etaMinutes: 4
        })
      });
      const j = await r.json();
      if (j.ok && j.incident && window.dispatcherApp) {
        window.dispatcherApp.incidents.set(id, j.incident);
        window.dispatcherApp.updateDrawer(j.incident);
      }
      return j;
    }, hwIncidentId);

    const resolveHwRes = await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'resolved',
          note: 'Đã tiếp cận hiện trường và hoàn tất ứng cứu an toàn.'
        })
      });
      const j = await r.json();
      if (j.ok && j.incident && window.dispatcherApp) {
        window.dispatcherApp.incidents.set(id, j.incident);
        window.dispatcherApp.updateDrawer(j.incident);
      }
      return j;
    }, hwIncidentId);

    const hwTimelineText = await dispPage.textContent('#uiAuditTimeline');
    assertCheck(
      'D2. Officer Dispatch & Case Resolution seal 3_OFFICER_DISPATCH (with responseTimeSeconds) and 4_CASE_RESOLVED in #uiAuditTimeline',
      acceptHwRes.ok === true &&
        resolveHwRes.ok === true &&
        typeof acceptHwRes.incident?.blockchain?.responseTimeSeconds === 'number' &&
        String(hwTimelineText || '').includes('Phản ứng:') &&
        String(hwTimelineText || '').includes('Hoàn tất'),
      {
        responseTimeSeconds: acceptHwRes.incident?.blockchain?.responseTimeSeconds,
        hwTimelineText: String(hwTimelineText || '').trim()
      }
    );

    // D3. Select Citizen Stealth SOS -> verify playable 5s <audio class="bc-stealth-audio" controls>
    await dispPage.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/incidents');
      const d = await r.json();
      if (Array.isArray(d.incidents)) {
        for (const item of d.incidents) {
          window.dispatcherApp.incidents.set(item.id, item);
        }
      }
      window.dispatcherApp.selectIncident(id);
    }, stealthIncidentId);
    await dispPage.waitForTimeout(800);

    const audioPlayability = await dispPage.evaluate(async () => {
      const audio = document.querySelector('#uiStealthEvidenceList audio.bc-stealth-audio');
      if (!audio) return { exists: false };
      if (audio.readyState < 1) {
        await new Promise((resolve) => {
          const done = () => resolve();
          audio.addEventListener('loadedmetadata', done, { once: true });
          audio.addEventListener('canplay', done, { once: true });
          audio.addEventListener('error', done, { once: true });
          audio.load();
          setTimeout(done, 4000);
        });
      }
      return {
        exists: true,
        src: audio.currentSrc || audio.src,
        readyState: audio.readyState,
        hasError: Boolean(audio.error)
      };
    });

    assertCheck(
      'D3. Dispatcher drawer renders 5-second Citizen Stealth audio evidence with valid playable WebM stream (readyState >= 1, hasError === false)',
      audioPlayability.exists && audioPlayability.readyState >= 1 && !audioPlayability.hasError,
      audioPlayability
    );

    // D4. Click "KIEM TRA TINH TOAN VEN CHUNG CU (LIVE AUDIT)" -> verify legal conclusion, byte-exact download & SVG QR
    const auditStartMs = performance.now();
    await dispPage.click('#btnRunIntegrityCheck');
    await dispPage.waitForFunction(
      () => {
        const el = document.getElementById('verifyResult');
        return Boolean(el && getComputedStyle(el).display !== 'none' && el.innerText.includes('XÁC THỰC THÀNH CÔNG'));
      },
      null,
      { timeout: 15000 }
    );
    report.metrics.liveIntegrityAuditUiMs = Number((performance.now() - auditStartMs).toFixed(2));

    const auditUiState = await dispPage.evaluate(async (targetId) => {
      const el = document.getElementById('verifyResult');
      el?.scrollIntoView({ block: 'center' });
      const dlLink = el?.querySelector('a[href*="download=1"]')?.getAttribute('href') || '';
      const explorerHref = document.getElementById('uiTxLink')?.getAttribute('href') || '';
      const inc = window.dispatcherApp?.incidents?.get(targetId);
      const allSealedHashes = Array.isArray(inc?.evidenceRecords)
        ? inc.evidenceRecords.map((r) => String(r.sha256Hash || '').toLowerCase())
        : [];
      let downloadedSha256 = '';
      let downloadStatus = 0;
      if (dlLink) {
        const resp = await fetch(dlLink);
        downloadStatus = resp.status;
        const buf = await resp.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', buf);
        downloadedSha256 =
          '0x' +
          Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
      }
      return {
        text: el?.innerText || '',
        hasSvgQr: Boolean(el?.querySelector('svg')),
        hasExportJsonBtn: Boolean(el?.querySelector('#btnExportLegalDossierJson')),
        downloadStatus,
        downloadedSha256,
        allSealedHashes,
        explorerHref
      };
    }, stealthIncidentId);
    await saveShot(dispPage, '06-dispatcher-stealth-live-audit-qr.png');

    assertCheck(
      'D4. runIntegrityCheck() re-hashes raw server evidence bytes, renders exact legal conclusion, renders SVG QR, and downloads byte-exact original audio matching SHA-256',
      auditUiState.text.includes(
        '✔ XÁC THỰC THÀNH CÔNG (100% NGUYÊN VẸN) - ĐỦ TIÊU CHUẨN TRÍCH XUẤT LÀM CHỨNG CỨ PHÁP LÝ'
      ) &&
        auditUiState.hasSvgQr &&
        auditUiState.hasExportJsonBtn &&
        auditUiState.downloadStatus === 200 &&
        /^0x[0-9a-f]{64}$/i.test(auditUiState.downloadedSha256) &&
        auditUiState.text.toLowerCase().includes(auditUiState.downloadedSha256.toLowerCase()) &&
        auditUiState.allSealedHashes.includes(String(receipt?.sha256Hash || '').toLowerCase()),
      {
        downloadStatus: auditUiState.downloadStatus,
        downloadedSha256: auditUiState.downloadedSha256,
        firstChunkSha256: receipt?.sha256Hash,
        allSealedHashesCount: auditUiState.allSealedHashes.length,
        hasSvgQr: auditUiState.hasSvgQr
      }
    );

    // D5. Verify Block Explorer Certificate Page (/api/blockchain/explorer/:txHash)
    const explorerPage = await context.newPage();
    const explorerTarget = auditUiState.explorerHref.startsWith('http')
      ? auditUiState.explorerHref
      : `${BASE_URL}${auditUiState.explorerHref}`;
    const explorerResp = await explorerPage.goto(explorerTarget, {
      waitUntil: 'domcontentloaded',
      timeout: 25000
    });
    await explorerPage.waitForTimeout(400);
    const explorerBody = await explorerPage.evaluate(() => document.body.innerText || '');
    await saveShot(explorerPage, '07-blockchain-explorer-certificate.png');

    assertCheck(
      'D5. Block Explorer Certificate (/api/blockchain/explorer/:txHash) renders HTTP 200 immutable block proof',
      explorerResp?.status() === 200 &&
        (explorerBody.includes('CHỨNG THỰC CHUỖI KHỐI') || explorerBody.includes('BLOCK')),
      {
        status: explorerResp?.status(),
        explorerTarget
      }
    );

    // Cleanly mark all QA-created incidents as resolved so live queue stays tidy while preserving full ledger blocks
    await dispPage.evaluate(async (ids) => {
      for (const id of ids) {
        if (!id) continue;
        await fetch('/api/dispatcher/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: 'resolved',
            note: 'Hoàn tất kiểm thử tự động E2E Web3 DePIN & Stealth SOS.'
          })
        }).catch(() => {});
      }
    }, createdIncidentIds);

    // =========================================================================
    // GROUP E: Docker Container Restart Persistence (Local Docker Runtime Only)
    // =========================================================================
    if (!SKIP_DOCKER_RESTART) {
      execSync(`docker restart ${DOCKER_CONTAINER}`, { stdio: 'pipe' });
      await waitForHealth(BASE_URL, 45000);

      const postRestartVerify = await dispPage.evaluate(async (incId) => {
        await fetch('/api/security/gatekeeper/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: '2002' })
        });
        let resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: '2002' })
        });
        let login = await resp.json();
        if (!login.ok) {
          resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'Admin' })
          });
          login = await resp.json();
        }
        const verifyResp = await fetch('/api/dispatcher/blockchain/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId: incId, network: '842026' })
        });
        return verifyResp.json();
      }, stealthIncidentId);

      const postRestartCard = await apiJson(`/api/depin/cards/${encodeURIComponent(realCardId)}`);

      assertCheck(
        'E1. Encrypted Blockchain Ledger, REAL DePIN Card Chain (Block #1->#2) & Encrypted Audio Vault survive docker restart with 100% SHA-256 match',
        postRestartVerify.ok === true &&
          postRestartVerify.verified === true &&
          postRestartCard.ok &&
          postRestartCard.json.card?.currentBlockIndex === 2,
        {
          postRestartVerified: postRestartVerify.verified,
          auditedEvidenceCount: postRestartVerify.auditedEvidenceCount,
          persistedCardBlockIndex: postRestartCard.json.card?.currentBlockIndex
        }
      );
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  fs.writeFileSync(JSON_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  const mdLines = [
    `# Báo Cáo Kiểm Thử Tự Động E2E Playwright — Web3 DePIN, Chống Giả Mạo Thẻ SOS v2.1 & Ngụy Trang Khẩn Cấp`,
    ``,
    `- **Chế độ chạy:** \`${report.mode}\``,
    `- **Mục tiêu kiểm thử:** \`${report.targetUrl}\``,
    `- **Container Docker:** \`${report.dockerContainer || 'N/A (Render Cloud Staging)'}\``,
    `- **Thời điểm xác thực:** \`${report.verifiedAt}\``,
    `- **Tổng số kiểm định:** **${report.summary.passed} / ${report.summary.total} PASS** (\`failed: ${report.summary.failed}\`)`,
    `- **Độ trễ xác thực phần cứng DePIN (\`/api/hardware-sos\`):** \`${report.metrics.hardwareSosDePinLatencyMs ?? '-'} ms\``,
    `- **Độ trễ Live Audit SHA-256 toàn diện trên UI:** \`${report.metrics.liveIntegrityAuditUiMs ?? '-'} ms\``,
    ``,
    `## Danh sách Kiểm định Chi tiết`,
    ``,
    `| # | Hạng mục kiểm định | Kết quả |`,
    `|---|---|---|`,
    ...report.assertions.map(
      (a, idx) => `| ${idx + 1} | ${a.name.replace(/\|/g, '\\|')} | ${a.passed ? '✅ PASS' : '❌ FAIL'} |`
    ),
    ``,
    `## Ảnh chụp Bằng chứng Trực quan`,
    ``,
    ...report.screenshots.map((s) => `- \`${s}\``),
    ``
  ];
  fs.writeFileSync(MD_REPORT_PATH, mdLines.join('\n'), 'utf8');

  console.log(
    `\nSUMMARY: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed.`
  );
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL E2E ERROR:', err);
  process.exit(1);
});
