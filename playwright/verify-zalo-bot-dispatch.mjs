import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.QA_PORT || 3099);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const RUNTIME_TMP_DIR = path.resolve('.tmp/zalo-qa-runtime');
const REPORTS_DIR = path.resolve('Reports/qa/playwright');
const SCREENSHOT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-bot-modal-verified.png');
const PORTAL_1024_SCREENSHOT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-portal-1024x555.png');
const HEADER_1024_SCREENSHOT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-header-1024x555.png');
const MOBILE_ACCEPT_SCREENSHOT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-quick-accept-mobile.png');
const JSON_REPORT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-bot-dispatch-qa.json');
const MD_REPORT_PATH = path.join(REPORTS_DIR, '2026-10-25-zalo-bot-dispatch-qa.md');

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${url}/healthz`);
      if (r.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} did not become healthy within ${timeoutMs}ms`);
}

async function run() {
  ensureDir(REPORTS_DIR);
  if (fs.existsSync(RUNTIME_TMP_DIR)) {
    fs.rmSync(RUNTIME_TMP_DIR, { recursive: true, force: true });
  }
  ensureDir(RUNTIME_TMP_DIR);

  const report = {
    suite: 'Hierarchical Zalo Bot Dispatch & Two-Way Field Acceptance E2E QA',
    timestamp: new Date().toISOString(),
    targetUrl: BASE_URL,
    summary: { total: 0, passed: 0, failed: 0 },
    assertions: []
  };

  function assertCheck(name, condition, details = {}) {
    report.summary.total++;
    const passed = Boolean(condition);
    if (passed) report.summary.passed++;
    else report.summary.failed++;
    report.assertions.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
  }

  const serverProc = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      SOS_RUNTIME_DATA_DIR: RUNTIME_TMP_DIR
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let browser = null;
  try {
    await waitForServer(BASE_URL);

    // 1a. Security Gate: Reject unauthorized `/ketnoi` without password, with wrong unit password, or with `2002`
    const unauthorizedAttempts = [
      { chatId: 'zalo_grp_rogue_01', text: '@Bot Vĩnh Nam /ketnoi tongtrucban', expectedAction: 'ketnoi_missing_password' },
      { chatId: 'zalo_grp_rogue_01', text: '@Bot Vĩnh Nam /ketnoi tongtrucban Congan@113', expectedAction: 'ketnoi_wrong_password' },
      { chatId: 'zalo_grp_rogue_01', text: '@Bot Vĩnh Nam /ketnoi tongtrucban 2002', expectedAction: 'ketnoi_wrong_password' },
      { chatId: 'zalo_grp_rogue_02', text: '@BotSOS /ketnoi cap_tanan SaiMatKhau999', expectedAction: 'ketnoi_wrong_password' }
    ];
    const secResults = [];
    for (const [idx, att] of unauthorizedAttempts.entries()) {
      const r = await fetch(`${BASE_URL}/api/zalo/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Go-http-client/1.1' },
        body: JSON.stringify({
          result: {
            event_name: 'message.text.received',
            message: {
              message_id: `msg_sec_deny_${idx}_${Date.now()}`,
              chat: { id: att.chatId, chat_type: 'GROUP', title: 'Nhóm Thử Thách Bảo Mật' },
              from: { id: 'rogue_user', display_name: 'Người Lạ' },
              text: att.text
            }
          }
        })
      });
      const j = await r.json();
      secResults.push({
        text: att.text,
        expected: att.expectedAction,
        actual: j?.outcomes?.[0]?.action
      });
    }
    assertCheck(
      '1a. Dispatcher Password Gate blocks passwordless "/ketnoi tongtrucban", cross-unit "Congan@113" on National Command, "2002", and wrong ward password',
      secResults.every(x => x.actual === x.expected),
      { secResults }
    );

    // 1. Test Webhook Pairing via Go-http-client User-Agent with valid Web Dispatcher Passwords
    const pairUnits = [
      { chatId: 'zalo_grp_tanan_01', title: 'Trực Ban CA Phường Tân An', cmd: '@BotSOS /ketnoi cap_tanan Congan@113' },
      { chatId: 'zalo_grp_longtuyen_01', title: 'Trực Ban CA Phường Long Tuyền', cmd: '@BotSOS /ketnoi cap_longtuyen Congan@113' },
      { chatId: 'zalo_grp_csgt_ct', title: 'Đội Tuần Tra CSGT Cần Thơ', cmd: '@BotSOS /ketnoi csgt_cantho Csgt@113' },
      { chatId: 'zalo_grp_chihuy_ct', title: 'Chỉ Huy Công An TP. Cần Thơ', cmd: '@BotSOS /ketnoi chihuy_cantho Congan@113' }
    ];

    for (const u of pairUnits) {
      const whRes = await fetch(`${BASE_URL}/api/zalo/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Go-http-client/1.1'
        },
        body: JSON.stringify({
          result: {
            event_name: 'message.text.received',
            message: {
              message_id: `msg_pair_${u.chatId}_${Date.now()}`,
              chat: { id: u.chatId, chat_type: 'GROUP', title: u.title },
              from: { id: 'officer_01', display_name: 'Trung tá Nguyễn Minh Hoàng' },
              text: u.cmd
            }
          }
        })
      });
      const whJson = await whRes.json();
      if (!whRes.ok || !whJson.ok || whJson?.outcomes?.[0]?.action !== 'ketnoi_ok') {
        throw new Error(`Webhook pairing failed for ${u.chatId}: HTTP ${whRes.status} (${JSON.stringify(whJson)})`);
      }
    }

    assertCheck(
      '1. Webhook /ketnoi with Go-http-client/1.1 User-Agent succeeds without AI-Bot 403 block',
      true,
      { pairedGroups: pairUnits.length }
    );

    // 2. Launch Playwright Browser, verify 1024x555 Cosmic Portal Zalo Pill, authenticate, and verify 1024x555 Header Pill
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
      viewport: { width: 1024, height: 555 },
      userAgent: CHROME_UA
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/dispatcher.html`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(async () => {
      await fetch('/api/security/gatekeeper/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '2002' })
      });
      sessionStorage.setItem('sos_gatekeeper_pass', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const intro = document.getElementById('cyberIntroVideoOverlay');
      if (intro) intro.style.display = 'none';
      const gate = document.getElementById('cyberGatekeeperModal');
      if (gate) gate.style.display = 'none';
    });

    const portalBtnState = await page.evaluate(() => {
      const btn = document.getElementById('btnPortalZaloBot');
      if (!btn) return { exists: false };
      const r = btn.getBoundingClientRect();
      return {
        exists: true,
        visible: getComputedStyle(btn).display !== 'none' && r.width > 80 && r.bottom <= window.innerHeight,
        rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width) }
      };
    });
    await page.screenshot({ path: PORTAL_1024_SCREENSHOT_PATH });

    assertCheck(
      '1b. Outer Cosmic Portal (1024x555) displays #btnPortalZaloBot clearly before login',
      portalBtnState.exists && portalBtnState.visible,
      portalBtnState
    );

    // Perform real session login via browser fetch so HttpOnly cookie is set
    const authRes = await page.evaluate(async () => {
      let loginResp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '2002' })
      });
      let loginJson = await loginResp.json();
      if (!loginJson.ok) {
        loginResp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'Admin' })
        });
        loginJson = await loginResp.json();
      }
      const officerProfile = loginJson.profile || loginJson.account;
      if (loginJson.ok && officerProfile) {
        sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(officerProfile));
      }
      return loginJson;
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // Hide any intro overlay so header & modal are cleanly visible
    await page.evaluate(() => {
      const intro = document.getElementById('cyberIntroVideoOverlay');
      if (intro) intro.style.display = 'none';
      const portal = document.getElementById('cosmicPortalView');
      if (portal) portal.style.display = 'none';
      const authModal = document.getElementById('authGateModal');
      if (authModal) authModal.style.display = 'none';
    });

    const header1024State = await page.evaluate(() => {
      const btn = document.getElementById('btnHeaderZaloBot');
      if (!btn) return { exists: false };
      const r = btn.getBoundingClientRect();
      return {
        exists: true,
        unclipped: r.width > 60 && r.right <= window.innerWidth && r.left >= 0,
        rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), width: Math.round(r.width) }
      };
    });
    await page.screenshot({ path: HEADER_1024_SCREENSHOT_PATH });

    assertCheck(
      '1c. Logged-in Top Header at 1024x555 displays #btnHeaderZaloBot unclipped inside viewport',
      header1024State.exists && header1024State.unclipped,
      header1024State
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(250);

    await page.click('#btnHeaderZaloBot');
    await page.waitForTimeout(600);

    const modalState = await page.evaluate(() => {
      const modal = document.getElementById('zaloBotConfigModal');
      const boundCount = document.getElementById('zaloBoundCount')?.textContent?.trim();
      const presetCards = document.querySelectorAll('#zaloPresetCardsGrid > div').length;
      const reqPassChecked = Boolean(document.getElementById('chkZaloRequirePairingPassword')?.checked);
      const currentCmd = document.getElementById('zaloCurrentOfficerCommand')?.textContent?.trim() || '';
      const firstPresetCmd = document.querySelector('#zaloPresetCardsGrid .btn-zalo-copy-preset')?.getAttribute('data-cmd') || '';
      return {
        visible: modal && getComputedStyle(modal).display !== 'none',
        boundCount: Number(boundCount || 0),
        presetCards,
        reqPassChecked,
        currentCmd,
        firstPresetCmd
      };
    });

    assertCheck(
      '2. Dispatcher UI #btnHeaderZaloBot opens #zaloBotConfigModal showing 4 authorized Zalo groups, password lock ON, & password-ready copy commands',
      modalState.visible &&
        modalState.boundCount === 4 &&
        modalState.presetCards >= 5 &&
        modalState.reqPassChecked === true &&
        modalState.currentCmd === '/ketnoi cap_tanan Congan@113' &&
        modalState.firstPresetCmd === '/ketnoi cap_tanan Congan@113',
      modalState
    );

    // 3. Trigger Hardware SOS Step 1 (Local Police) in Phường Tân An, TP. Cần Thơ (10.0364, 105.7875)
    const sosTanAnRes = await fetch(`${BASE_URL}/api/hardware-sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TDM2421-EG800K-SOS/2.0'
      },
      body: JSON.stringify({
        device_id: 'TDM2421-4G-GPS-01',
        hardware_model: 'Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)',
        network_mode: '4G_LTE_SIM',
        signal_csq: 28,
        gps_fix: true,
        press_step: 1,
        latitude: 10.02728,
        longitude: 105.76097,
        citizen_name: 'Cụ Nguyễn Văn A (78 tuổi)',
        phone: '0988113114'
      })
    });
    const sosTanAnJson = await sosTanAnRes.json();
    const tanAnId = sosTanAnJson?.incident?.id;
    await page.waitForTimeout(200);

    const statusAfterTanAn = await page.evaluate(async () => {
      const r = await fetch('/api/dispatcher/zalo/status');
      return r.json();
    });
    const tanAnMsgs = (statusAfterTanAn.recentOutbox || []).filter(m => m.incidentId === tanAnId && m.stage === 'initial');
    const notifiedChatsForTanAn = tanAnMsgs.map(m => m.chatId);

    assertCheck(
      '3. Territorial Ward Isolation: SOS in Phường Tân An routes ONLY to zalo_grp_tanan_01 (not Long Tuyền or CSGT)',
      Boolean(tanAnId) &&
        notifiedChatsForTanAn.includes('zalo_grp_tanan_01') &&
        !notifiedChatsForTanAn.includes('zalo_grp_longtuyen_01') &&
        !notifiedChatsForTanAn.includes('zalo_grp_csgt_ct'),
      { incidentId: tanAnId, notifiedChatsForTanAn }
    );

    // 4. Test 1-Tap Signed Mobile Quick-Accept Link from Zalo Alert Message
    const tanAnAlertText = tanAnMsgs[0]?.text || '';
    const linkMatch = tanAnAlertText.match(/(https?:\/\/[^\s]+\/api\/zalo\/quick-accept\?[^\s]+)/);
    // Replace public fallback domain with local QA BASE_URL so we hit our local test server
    const quickAcceptUrl = linkMatch
      ? linkMatch[1].replace(/^https?:\/\/[^/]+/, BASE_URL)
      : '';

    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    const qaResp = await mobilePage.goto(quickAcceptUrl, { waitUntil: 'domcontentloaded' });
    const mobileText = await mobilePage.textContent('body');
    await mobilePage.screenshot({ path: MOBILE_ACCEPT_SCREENSHOT_PATH, fullPage: true });
    await mobilePage.close();

    const incAfterQuickAccept = await page.evaluate(async (id) => {
      const r = await fetch(`/api/dispatcher/incidents`);
      const d = await r.json();
      return (d.incidents || []).find(x => x.id === id);
    }, tanAnId);

    assertCheck(
      '4. 1-Tap Mobile Quick-Accept Link verifies HMAC, renders confirmation HTML, and transitions SOS to dispatching',
      qaResp?.status() === 200 &&
        mobileText.includes('TIẾP NHẬN THÀNH CÔNG QUA ZALO') &&
        incAfterQuickAccept?.status === 'dispatching' &&
        incAfterQuickAccept?.acceptedVia === 'zalo_link',
      { status: incAfterQuickAccept?.status, acceptedVia: incAfterQuickAccept?.acceptedVia }
    );

    // 5. Reject forged Quick-Accept HMAC signature with HTTP 403
    const forgedRes = await fetch(`${BASE_URL}/api/zalo/quick-accept?id=${tanAnId}&chat=zalo_grp_tanan_01&sig=deadbeef0000`, {
      headers: { 'User-Agent': CHROME_UA }
    });
    assertCheck(
      '5. Forged Quick-Accept link signature is rejected with HTTP 403',
      forgedRes.status === 403,
      { httpStatus: forgedRes.status }
    );

    // 6. Trigger Hardware SOS Step 2 (CSGT) and accept via Two-Way Zalo Group Reply "@BotSOS TN"
    const sosCsgtRes = await fetch(`${BASE_URL}/api/hardware-sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TDM2421-EG800K-SOS/2.0' },
      body: JSON.stringify({
        device_id: 'TDM2421-4G-GPS-01',
        press_step: 2,
        latitude: 10.03642,
        longitude: 105.78754,
        citizen_name: 'Anh Trần Văn B',
        phone: '0912345678'
      })
    });
    const sosCsgtJson = await sosCsgtRes.json();
    const csgtId = sosCsgtJson?.incident?.id;
    await page.waitForTimeout(200);

    const tnReplyRes = await fetch(`${BASE_URL}/api/zalo/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Go-http-client/1.1' },
      body: JSON.stringify({
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: `msg_tn_${Date.now()}`,
            chat: { id: 'zalo_grp_csgt_ct', chat_type: 'GROUP', title: 'Đội Tuần Tra CSGT Cần Thơ' },
            from: { id: 'csgt_officer_02', display_name: 'Đại úy Lê Quốc Bảo' },
            text: '@BotSOS TN'
          }
        }
      })
    });
    const tnReplyJson = await tnReplyRes.json();

    const csgtAfterTn = await page.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/incidents');
      const d = await r.json();
      return (d.incidents || []).find(x => x.id === id);
    }, csgtId);

    assertCheck(
      '6. Two-Way Zalo Chat Reply "@BotSOS TN" routes Step-2 SOS to CSGT and transitions status to dispatching',
      tnReplyJson.ok &&
        csgtAfterTn?.agency === 'csgt' &&
        csgtAfterTn?.status === 'dispatching' &&
        csgtAfterTn?.acceptedVia === 'zalo_chat',
      { csgtId, status: csgtAfterTn?.status, acceptedVia: csgtAfterTn?.acceptedVia, officer: csgtAfterTn?.dispatchUnit?.officerFullTitle }
    );

    // 7. Test Provincial/City HQ Escalation routing to zalo_grp_chihuy_ct
    const sosEscRes = await fetch(`${BASE_URL}/api/hardware-sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TDM2421-EG800K-SOS/2.0' },
      body: JSON.stringify({
        device_id: 'TDM2421-4G-GPS-01',
        press_step: 1,
        latitude: 10.02728,
        longitude: 105.76097,
        citizen_name: 'Chị Lê Thị C',
        phone: '0909113114'
      })
    });
    const escId = (await sosEscRes.json())?.incident?.id;
    await page.waitForTimeout(200);

    await page.evaluate(async (id) => {
      await fetch('/api/dispatcher/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason: 'Quá 15 phút cấp phường chưa tiếp nhận' })
      });
    }, escId);
    await page.waitForTimeout(200);

    const statusAfterEsc = await page.evaluate(async () => {
      const r = await fetch('/api/dispatcher/zalo/status');
      return r.json();
    });
    const hqEscMsgs = (statusAfterEsc.recentOutbox || []).filter(
      m => m.incidentId === escId && m.stage === 'escalated_province_hq'
    );

    assertCheck(
      '7. Provincial Escalation dispatches urgent alert to Chỉ Huy Công An TP. Cần Thơ (zalo_grp_chihuy_ct)',
      hqEscMsgs.some(m => m.chatId === 'zalo_grp_chihuy_ct'),
      { escId, hqChats: hqEscMsgs.map(m => m.chatId) }
    );

    // 8. Real Zalo Group Scenario A: Group without `chat.title` pairs `/ketnoi tongtrucban Admin`,
    //    then Dispatcher clicks `✏️ Sửa Đơn Vị` on Web UI to reassign to `Phường Tân An` + `Trực Ban CA Phường Tân An`!
    await fetch(`${BASE_URL}/api/zalo/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Go-http-client/1.1' },
      body: JSON.stringify({
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: `msg_real_grp_init_${Date.now()}`,
            chat: { id: 'zgr-bf54e33e72519b0fc240', chat_type: 'GROUP' }, // Zalo Group Privacy: no title!
            from: { id: 'zalo_uid_vinhan', display_name: 'Vĩnh An' },
            text: '@Bot Vĩnh Nam /ketnoi tongtrucban Admin'
          }
        }
      })
    });
    await page.click('#btnRefreshZaloStatus');
    await page.waitForTimeout(350);

    // Click `✏️ Sửa Đơn Vị` on `zgr-bf54e33e72519b0fc240` card in `#zaloBindingsListContainer`
    const cardSelector = '.zalo-bound-item-card[data-chat="zgr-bf54e33e72519b0fc240"]';
    await page.click(`${cardSelector} .btn-zalo-edit-one`);
    await page.fill(`${cardSelector} .inp-zalo-edit-title`, 'Trực Ban CA Phường Tân An');
    await page.fill(`${cardSelector} .inp-zalo-edit-prov`, 'Cần Thơ');
    await page.fill(`${cardSelector} .inp-zalo-edit-ward`, 'Phường Tân An');
    await page.selectOption(`${cardSelector} .inp-zalo-edit-role`, 'police_ward');
    await page.click(`${cardSelector} .btn-zalo-save-edit`);
    await page.waitForTimeout(450);

    const statusAfterWebEdit = await page.evaluate(async () => {
      const r = await fetch('/api/dispatcher/zalo/status');
      return r.json();
    });
    const editedBinding = (statusAfterWebEdit.bindings || []).find(b => b.chatId === 'zgr-bf54e33e72519b0fc240');

    assertCheck(
      '8. Web UI Inline Editor (✏️ Sửa Đơn Vị) reassigns zgr-bf54e33e72519b0fc240 to Phường Tân An & preserves officer Vĩnh An',
      Boolean(editedBinding) &&
        editedBinding.chatTitle === 'Trực Ban CA Phường Tân An' &&
        editedBinding.ward === 'Phường Tân An' &&
        editedBinding.level === 'ward' &&
        editedBinding.officerName === 'Vĩnh An',
      editedBinding || {}
    );

    // 9. Real Zalo Group Scenario B: Natural Vietnamese `/ketnoi Phường Tân An, Cần Thơ Congan@113` directly in Zalo chat
    const natRes = await fetch(`${BASE_URL}/api/zalo/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Go-http-client/1.1' },
      body: JSON.stringify({
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: `msg_nat_ketnoi_${Date.now()}`,
            chat: { id: 'zgr-natural-tanan', chat_type: 'GROUP' },
            from: { id: 'zalo_uid_vinhan', display_name: 'Vĩnh An' },
            text: '@Bot Vĩnh Nam /ketnoi Phường Tân An, Cần Thơ Congan@113 | Tổ Cảnh Sát Khu Vực Tân An'
          }
        }
      })
    });
    const natJson = await natRes.json();
    const natBinding = natJson?.outcomes?.[0]?.binding;

    assertCheck(
      '9. Natural Vietnamese "/ketnoi Phường Tân An, Cần Thơ | <Tên nhóm>" auto-matches exact Ward & extracts officer Vĩnh An',
      natJson.ok &&
        natBinding?.ward === 'Phường Tân An' &&
        natBinding?.chatTitle === 'Tổ Cảnh Sát Khu Vực Tân An' &&
        natBinding?.officerName === 'Vĩnh An',
      natBinding || {}
    );

    // 10. Link-Preview Crawler Safety + Multi-Word "@Bot Vĩnh Nam TN" on Escalated Ward Incident (`escId`)
    const escOutboxMsg = (statusAfterEsc.recentOutbox || []).find(m => m.incidentId === escId);
    const escLinkMatch = (escOutboxMsg?.text || '').match(/(https?:\/\/[^\s]+\/api\/zalo\/quick-accept\?[^\s]+)/);
    const escPreviewUrl = escLinkMatch ? escLinkMatch[1].replace(/^https?:\/\/[^/]+/, BASE_URL) : '';
    if (escPreviewUrl) {
      await fetch(escPreviewUrl, { headers: { 'User-Agent': 'ZaloPreview/1.0 facebookexternalhit/1.1' } });
    }
    const escBeforeHumanAccept = await page.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/incidents');
      const d = await r.json();
      return (d.incidents || []).find(x => x.id === id);
    }, escId);

    // Now Officer Vĩnh An sends `@Bot Vĩnh Nam TN` inside `zgr-bf54e33e72519b0fc240`!
    const multiWordTnRes = await fetch(`${BASE_URL}/api/zalo/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Go-http-client/1.1' },
      body: JSON.stringify({
        result: {
          event_name: 'message.text.received',
          message: {
            message_id: `msg_multiword_tn_${Date.now()}`,
            chat: { id: 'zgr-bf54e33e72519b0fc240', chat_type: 'GROUP' },
            from: { id: 'zalo_uid_vinhan', display_name: 'Vĩnh An' },
            text: '@Bot Vĩnh Nam TN'
          }
        }
      })
    });
    const multiWordTnJson = await multiWordTnRes.json();

    const escAfterMultiWordTn = await page.evaluate(async (id) => {
      const r = await fetch('/api/dispatcher/incidents');
      const d = await r.json();
      return (d.incidents || []).find(x => x.id === id);
    }, escId);

    assertCheck(
      '10. Multi-Word "@Bot Vĩnh Nam TN" accepts escalated Ward SOS, ignores Link-Preview bot, and auto-extracts officer "Vĩnh An"',
      escBeforeHumanAccept?.status === 'escalated' &&
        multiWordTnJson?.outcomes?.[0]?.action === 'tn_accepted' &&
        escAfterMultiWordTn?.status === 'dispatching' &&
        escAfterMultiWordTn?.dispatchUnit?.officerName === 'Vĩnh An' &&
        String(escAfterMultiWordTn?.dispatchUnit?.officerFullTitle || '').includes('Vĩnh An'),
      {
        beforeHumanStatus: escBeforeHumanAccept?.status,
        outcomeAction: multiWordTnJson?.outcomes?.[0]?.action,
        afterStatus: escAfterMultiWordTn?.status,
        officerName: escAfterMultiWordTn?.dispatchUnit?.officerName,
        officerFullTitle: escAfterMultiWordTn?.dispatchUnit?.officerFullTitle,
        unitName: escAfterMultiWordTn?.dispatchUnit?.unitName
      }
    );

    // 11. Tactical Broadcast & Maintenance Notice Composer: 1-Click Template + Blast to ALL Connected Zalo Groups + Live Web SSE Banner
    await page.click('#btnRefreshZaloStatus');
    await page.waitForTimeout(350);
    await page.locator('#zaloBroadcastComposerCard').scrollIntoViewIfNeeded();
    await page.click('.btn-zalo-bcast-tpl[data-tpl="maintenance"]');
    await page.waitForTimeout(150);

    const populatedTitle = await page.inputValue('#inputZaloBroadcastTitle');
    const populatedMsg = await page.inputValue('#textareaZaloBroadcastMessage');
    const targetBadgeCount = Number(await page.textContent('#zaloBroadcastTargetCount'));

    const [bcastResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/dispatcher/zalo/broadcast') && r.request().method() === 'POST'),
      page.click('#btnSendZaloBroadcastAll')
    ]);
    const bcastJson = await bcastResp.json();
    await page.waitForTimeout(450);

    const sseBannerVisible = await page.locator('#liveSystemAnnouncementBanner').isVisible().catch(() => false);
    const bcastOutboxHits = (bcastJson?.status?.recentOutbox || []).filter(
      m => m.stage === 'system_broadcast' && String(m.text || '').includes('[THÔNG BÁO BẢO TRÌ & CẬP NHẬT HỆ THỐNG]')
    );

    assertCheck(
      '11. Emergency/Maintenance Broadcast Composer auto-fills template, blasts to ALL connected Zalo groups, and triggers live Web SSE banner',
      Boolean(populatedTitle) &&
        populatedMsg.includes('bảo trì') &&
        targetBadgeCount >= 5 &&
        bcastJson?.ok === true &&
        bcastJson?.totalMatched === targetBadgeCount &&
        bcastJson?.sentCount === bcastJson?.totalMatched &&
        bcastOutboxHits.length === bcastJson?.totalMatched &&
        sseBannerVisible,
      {
        targetBadgeCount,
        totalMatched: bcastJson?.totalMatched,
        sentCount: bcastJson?.sentCount,
        outboxBroadcastEntries: bcastOutboxHits.length,
        sseBannerVisible
      }
    );

    // Dismiss floating banner so modal header isn't covered, scroll Step 1 + Step 2 + Preset Cards into view, & capture desktop verification screenshot
    await page.click('#btnCloseLiveSysBanner').catch(() => {});
    await page.locator('#chkZaloRequirePairingPassword').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: SCREENSHOT_PATH });

    assertCheck(
      '12. Desktop & Mobile screenshots captured cleanly',
      fs.existsSync(SCREENSHOT_PATH) && fs.existsSync(MOBILE_ACCEPT_SCREENSHOT_PATH),
      { desktopScreenshot: SCREENSHOT_PATH, mobileScreenshot: MOBILE_ACCEPT_SCREENSHOT_PATH }
    );

    // Write official JSON & Markdown QA Reports
    fs.writeFileSync(JSON_REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    const mdLines = [
      `# QA Report: Hierarchical Zalo Bot Dispatch & Two-Way Field Acceptance`,
      ``,
      `- **Timestamp:** \`${report.timestamp}\``,
      `- **Target Runtime:** \`${BASE_URL}\` (Isolated \`SOS_RUNTIME_DATA_DIR\`)`,
      `- **Result:** **${report.summary.passed}/${report.summary.total} PASSED** (${report.summary.failed} failed)`,
      `- **Desktop Modal Screenshot:** \`Reports/qa/playwright/2026-10-25-zalo-bot-modal-verified.png\``,
      `- **Mobile 1-Tap Accept Screenshot:** \`Reports/qa/playwright/2026-10-25-zalo-quick-accept-mobile.png\``,
      ``,
      `## Assertions`,
      ``,
      ...report.assertions.map(a => `- [${a.passed ? 'x' : ' '}] **${a.name}** — \`${JSON.stringify(a.details)}\``)
    ];
    fs.writeFileSync(MD_REPORT_PATH, mdLines.join('\n') + '\n', 'utf-8');

    if (report.summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    serverProc.kill();
    try {
      fs.rmSync(RUNTIME_TMP_DIR, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
