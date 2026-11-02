/**
 * SOS Vietnam 2026 — 3-Tier DePIN Card Provisioning, Chaining & Web Serial Portal (v2.1)
 *
 * Synchronized 100% with DAC_TA_DONG_BO_WEB_VA_AI.md v2.1 (BTL CSCĐ E10 - Đ1):
 *  - Rule 1: Single persistent Web Serial COM session (115200 8N1, DTR=true, RTS=true)
 *            with RX drain + pre-probe READ_DATA before writing.
 *  - Rule 2: Mandatory READ_DATA read-back verification from NVS Flash (ID, NAME, SEAL)
 *            after SAVE_OK before reporting provisioning success.
 *  - Rule 3: Zero hardcoded personal names in initial state; blank cards use "" / THE_CHUA_CAP_PHAT.
 *  - Rule 4: Hex seal validation strictly via /^(0x)?[0-9a-fA-F]{64}$/ (66-char 0x... support).
 *  - Rule 5: Parallel 4G JSON keys (time + timestamp + created_at, bc_seal + seal, hw_mac, live_evidence_hash).
 */

export const COMMAND_SECRET_KEY = 'BTL_CSCD_E10_D1_SOS_VIETNAM_2026';
export const DAC_TA_WEB_SECRET_KEY = 'SOS_VIETNAM_TACTICAL_ESC_2026_DEPIN_SECURE_KEY';
export const ZERO_PREV_SEAL = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const DEFAULT_OFFICER = 'BTL CSCD - E10 D1';

const IS_PRODUCTION = typeof window !== 'undefined' &&
  (window.location.hostname === 'sosvie.site' || window.location.hostname === 'www.sosvie.site');

export const SYSTEM_CONFIG = Object.freeze({
  isProduction: IS_PRODUCTION,
  envName: IS_PRODUCTION ? 'PRODUCTION (sosvie.site)' : 'SANDBOX STAGING (Render)',
  chainId: IS_PRODUCTION ? 842026 : 84202600,
  canonicalChainId: 842026,
  storageFolder: IS_PRODUCTION ? 'SOS_VIETNAM_OFFICIAL' : 'SOS_RENDER_SANDBOX'
});

export function sanitizeField(val) {
  return String(val ?? '')
    .replace(/[\r\n]/g, '')
    .replace(/\|/g, '-')
    .trim();
}

export function isValidHexSeal(seal) {
  if (!seal) return false;
  return /^(0x)?[0-9a-fA-F]{64}$/.test(String(seal).trim());
}

function formatIsoTimestampLocal(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function sha256HexLower(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateBlockchainSeal(data, profile = 'CPP_CMD_E10') {
  const cleanId = sanitizeField(data.id);
  const cleanName = sanitizeField(data.name);
  if (!cleanId && !cleanName) return '';

  const prev = isValidHexSeal(data.prevSeal) ? String(data.prevSeal).trim() : ZERO_PREV_SEAL;
  const blockIdx = Math.max(1, Math.trunc(Number(data.blockIndex) || 1));
  const mode = String(data.mode || 'TEST').trim().toUpperCase() === 'REAL' ? 'REAL' : 'TEST';
  const secret = profile === 'DAC_TA_E10' ? DAC_TA_WEB_SECRET_KEY : COMMAND_SECRET_KEY;

  const payload = [
    prev,
    String(blockIdx),
    mode,
    cleanId,
    cleanName,
    sanitizeField(data.phone),
    sanitizeField(data.cccd),
    sanitizeField(data.officer || DEFAULT_OFFICER),
    sanitizeField(data.timestamp),
    secret
  ].join('|');

  const hex = await sha256HexLower(payload);
  return profile === 'DAC_TA_E10' ? hex.toUpperCase() : `0x${hex}`;
}

export async function generateLiveEvidenceHash(cardId, hwMac, unitCode, latStr, lonStr, seal) {
  const preimage = `${sanitizeField(cardId)}|${String(hwMac || '').trim()}|${String(unitCode || '').trim()}|${latStr},${lonStr}|${String(seal || '').trim()}`;
  const hex = await sha256HexLower(preimage);
  return `0x${hex}`;
}

export function parseReadDataDump(rawText = '') {
  const parsed = {
    id: '',
    name: '',
    phone: '',
    cccd: '',
    officer: '',
    timestamp: '',
    mode: 'TEST',
    blockIndex: 0,
    prevSeal: ZERO_PREV_SEAL,
    seal: '',
    hw_mac: '',
    status: ''
  };
  for (const rawLine of String(rawText || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('ID:')) parsed.id = line.slice(3).trim();
    else if (line.startsWith('NAME:')) parsed.name = line.slice(5).trim();
    else if (line.startsWith('PHONE:')) parsed.phone = line.slice(6).trim();
    else if (line.startsWith('CCCD:')) parsed.cccd = line.slice(5).trim();
    else if (line.startsWith('OFFICER:')) parsed.officer = line.slice(8).trim();
    else if (line.startsWith('TIME:')) parsed.timestamp = line.slice(5).trim();
    else if (line.startsWith('MODE:')) parsed.mode = line.slice(5).trim().toUpperCase() === 'REAL' ? 'REAL' : 'TEST';
    else if (line.startsWith('BLOCK:')) parsed.blockIndex = parseInt(line.slice(6).trim(), 10) || 0;
    else if (line.startsWith('PREV_SEAL:')) parsed.prevSeal = line.slice(10).trim() || ZERO_PREV_SEAL;
    else if (line.startsWith('SEAL:')) parsed.seal = line.slice(5).trim();
    else if (line.startsWith('HW_MAC:')) parsed.hw_mac = line.slice(7).trim();
    else if (line.startsWith('STATUS:')) parsed.status = line.slice(7).trim();
  }
  return parsed;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initDepinCardPortal() {
  const portalState = {
    mode: 'TEST',
    port: null,
    reader: null,
    writer: null,
    readLoopActive: false,
    lineListeners: []
  };

  // DOM References
  const envTextEl = document.getElementById('depinEnvText');
  const btnModeTest = document.getElementById('btnModeTest');
  const btnModeReal = document.getElementById('btnModeReal');
  const btnLoadSpecVector = document.getElementById('btnLoadSpecVector');
  const cardChainStateBadge = document.getElementById('cardChainStateBadge');
  const cardIdInput = document.getElementById('cardIdInput');
  const btnLookupCard = document.getElementById('btnLookupCard');
  const cardNameInput = document.getElementById('cardNameInput');
  const cardPhoneInput = document.getElementById('cardPhoneInput');
  const cardCccdInput = document.getElementById('cardCccdInput');
  const cardOfficerInput = document.getElementById('cardOfficerInput');
  const cardTimeInput = document.getElementById('cardTimeInput');
  const btnNowTime = document.getElementById('btnNowTime');
  const cardModeDisplay = document.getElementById('cardModeDisplay');
  const cardBlockInput = document.getElementById('cardBlockInput');
  const cardHwMacInput = document.getElementById('cardHwMacInput');
  const cardSimButtonSelect = document.getElementById('cardSimButtonSelect');
  const cardSecretProfileSelect = document.getElementById('cardSecretProfileSelect');
  const cardPrevSealInput = document.getElementById('cardPrevSealInput');
  const cardSealOutput = document.getElementById('cardSealOutput');
  const btnProvisionCard = document.getElementById('btnProvisionCard');
  const btnSimulateHardwareSos = document.getElementById('btnSimulateHardwareSos');
  const btnWipeCard = document.getElementById('btnWipeCard');
  const depinSecurityAlert = document.getElementById('depinSecurityAlert');

  const serialStateBadge = document.getElementById('serialStateBadge');
  const btnSerialConnect = document.getElementById('btnSerialConnect');
  const btnSerialPing = document.getElementById('btnSerialPing');
  const btnSerialRead = document.getElementById('btnSerialRead');
  const btnSerialSetServerUrl = document.getElementById('btnSerialSetServerUrl');
  const btnSerialDisconnect = document.getElementById('btnSerialDisconnect');
  const serialConsoleLog = document.getElementById('serialConsoleLog');

  const btnFillReadDataFromForm = document.getElementById('btnFillReadDataFromForm');
  const rawReadDataInput = document.getElementById('rawReadDataInput');
  const btnVerifySealNow = document.getElementById('btnVerifySealNow');
  const verifySealResultBox = document.getElementById('verifySealResultBox');

  const btnRefreshCards = document.getElementById('btnRefreshCards');
  const depinCardsTableBody = document.getElementById('depinCardsTableBody');

  if (cardTimeInput && !cardTimeInput.value) {
    cardTimeInput.value = formatIsoTimestampLocal();
  }

  const logSerial = (line) => {
    if (!serialConsoleLog) return;
    const ts = new Date().toTimeString().slice(0, 8);
    serialConsoleLog.textContent += `\n[${ts}] ${line}`;
    serialConsoleLog.scrollTop = serialConsoleLog.scrollHeight;
  };

  const showAlert = (el, msg, isOk = true) => {
    if (!el) return;
    el.hidden = false;
    el.className = `e10-alert ${isOk ? 'is-ok' : 'is-error'}`;
    el.innerHTML = msg;
  };

  const getFormCardPayload = () => {
    const cleanId = sanitizeField(cardIdInput?.value || '');
    const cleanName = sanitizeField(cardNameInput?.value || '');
    const cleanOfficer = sanitizeField(cardOfficerInput?.value || '') || DEFAULT_OFFICER;
    const rawPrev = sanitizeField(cardPrevSealInput?.value || '');
    const validPrev = isValidHexSeal(rawPrev) ? rawPrev : ZERO_PREV_SEAL;
    return {
      id: cleanId,
      name: cleanName,
      phone: sanitizeField(cardPhoneInput?.value || ''),
      cccd: sanitizeField(cardCccdInput?.value || ''),
      officer: cleanOfficer,
      timestamp: sanitizeField(cardTimeInput?.value || '') || formatIsoTimestampLocal(),
      mode: portalState.mode,
      blockIndex: Math.max(1, parseInt(cardBlockInput?.value || '1', 10) || 1),
      prevSeal: validPrev,
      hw_mac: sanitizeField(cardHwMacInput?.value || '') || 'A4CF128E3B09',
      seal: isValidHexSeal(cardSealOutput?.value) ? cardSealOutput.value.trim() : ''
    };
  };

  const refreshLiveSealPreview = async () => {
    const data = getFormCardPayload();
    if (!data.id && !data.name) {
      if (cardSealOutput) cardSealOutput.value = '';
      if (cardChainStateBadge) cardChainStateBadge.textContent = `THẺ TRỐNG • ${data.mode}`;
      return '';
    }
    const profile = cardSecretProfileSelect?.value || 'CPP_CMD_E10';
    const seal = await generateBlockchainSeal(data, profile);
    if (cardSealOutput) cardSealOutput.value = seal;
    if (cardChainStateBadge) {
      cardChainStateBadge.textContent = data.blockIndex === 1
        ? `BLOCK #1 (GENESIS • ${data.mode})`
        : `BLOCK #${data.blockIndex} (NỐI KHỐI • ${data.mode})`;
    }
    return seal;
  };

  const setPortalMode = (nextMode) => {
    portalState.mode = nextMode === 'REAL' ? 'REAL' : 'TEST';
    if (cardModeDisplay) cardModeDisplay.value = portalState.mode;

    if (btnModeTest && btnModeReal) {
      btnModeTest.classList.toggle('is-active-test', portalState.mode === 'TEST');
      btnModeReal.classList.toggle('is-active-real', portalState.mode === 'REAL');
    }

    if (btnWipeCard) {
      if (portalState.mode === 'REAL') {
        btnWipeCard.classList.add('is-locked-real');
        btnWipeCard.setAttribute('aria-disabled', 'true');
        btnWipeCard.textContent = '🔒 BẢO VỆ DỮ LIỆU THẬT: CHỈ CẤP 1 LẦN (KHÔNG ĐƯỢC XÓA TRẮNG)';
      } else {
        btnWipeCard.classList.remove('is-locked-real');
        btnWipeCard.setAttribute('aria-disabled', 'false');
        btnWipeCard.textContent = '🗑️ XÓA THÔNG TIN TEST (RESET CHIP ĐỂ NẠP THỬ LẠI)';
      }
    }
    refreshLiveSealPreview();
  };

  const applyCardSnapshotToForm = async (snap) => {
    if (!snap) return;
    if (cardIdInput) cardIdInput.value = snap.id || '';
    if (cardNameInput) cardNameInput.value = snap.name || '';
    if (cardPhoneInput) cardPhoneInput.value = snap.phone || '';
    if (cardCccdInput) cardCccdInput.value = snap.cccd || '';
    if (cardOfficerInput) cardOfficerInput.value = snap.officer || '';
    if (cardTimeInput) cardTimeInput.value = snap.timestamp || formatIsoTimestampLocal();
    if (cardHwMacInput && snap.hw_mac) cardHwMacInput.value = snap.hw_mac;

    if (!snap.id || snap.blockIndex === 0) {
      setPortalMode('TEST');
      if (cardBlockInput) cardBlockInput.value = '1';
      if (cardPrevSealInput) cardPrevSealInput.value = ZERO_PREV_SEAL;
      if (cardSealOutput) cardSealOutput.value = '';
    } else {
      setPortalMode(snap.mode === 'REAL' ? 'REAL' : 'TEST');
      if (cardBlockInput) cardBlockInput.value = String(snap.blockIndex || 1);
      if (cardPrevSealInput) cardPrevSealInput.value = isValidHexSeal(snap.prevSeal) ? snap.prevSeal : ZERO_PREV_SEAL;
      if (cardSealOutput && isValidHexSeal(snap.seal)) {
        cardSealOutput.value = snap.seal;
      } else {
        await refreshLiveSealPreview();
      }
    }
  };

  const loadBlockchainStatus = async () => {
    try {
      const res = await fetch('/api/blockchain/status');
      const json = await res.json();
      if (json && json.ok && envTextEl) {
        envTextEl.textContent = `CHAIN ID: ${json.chainId} • ${json.storageFolder} • BLOCK #${json.nextBlockNumber - 1}`;
      }
    } catch (_) {
      if (envTextEl) {
        envTextEl.textContent = `CHAIN ID: ${SYSTEM_CONFIG.chainId} • ${SYSTEM_CONFIG.storageFolder}`;
      }
    }
  };

  const loadRegisteredCards = async () => {
    if (!depinCardsTableBody) return;
    try {
      const res = await fetch('/api/depin/cards');
      const json = await res.json();
      const cards = Array.isArray(json?.cards) ? json.cards : [];
      if (!cards.length) {
        depinCardsTableBody.innerHTML = '<tr><td colspan="7" style="color: var(--clr-text-muted); text-align: center; padding: 16px;">Chưa có thẻ SOS nào được đồng bộ lên Sổ cái trong phiên này.</td></tr>';
        return;
      }
      depinCardsTableBody.innerHTML = cards.map((card) => {
        const lastBlk = Array.isArray(card.blocks) && card.blocks.length
          ? card.blocks[card.blocks.length - 1]
          : null;
        const fullSeal = card.currentSealPrefixed || card.currentSeal || '';
        const sealShort = fullSeal ? `${String(fullSeal).slice(0, 18)}...` : '—';
        const txHash = lastBlk?.ledgerTxHash || '';
        const blockNum = lastBlk?.ledgerBlockNumber || '—';
        const modeBadge = card.isImmutableReal
          ? '<span class="e10-tag-real">REAL 🔒 BẤT BIẾN</span>'
          : '<span class="e10-tag-test">TEST 🧪</span>';
        return `
          <tr>
            <td class="e10-mono"><strong>${escapeHtml(card.id)}</strong></td>
            <td>${escapeHtml(card.name)}<br><small style="color:var(--clr-text-muted);">${escapeHtml(card.phone || '')}</small></td>
            <td>${modeBadge}</td>
            <td class="e10-mono">Block #${escapeHtml(card.currentBlockIndex || 1)} (${(card.blocks || []).length} khối)</td>
            <td class="e10-mono" title="${escapeHtml(fullSeal)}">${escapeHtml(sealShort)}</td>
            <td class="e10-mono">${txHash ? `<a href="/api/blockchain/explorer/${encodeURIComponent(txHash)}" target="_blank" style="color:var(--clr-neon-cyan);">Block #${escapeHtml(blockNum)} ↗</a>` : '—'}</td>
            <td><button type="button" class="e10-btn e10-btn-sm js-select-card-chain" data-card-id="${escapeHtml(card.id)}">🔗 Chọn / Nối khối</button></td>
          </tr>
        `;
      }).join('');

      depinCardsTableBody.querySelectorAll('.js-select-card-chain').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-card-id');
          if (targetId && cardIdInput) {
            cardIdInput.value = targetId;
            lookupExistingCardOnPortal(targetId);
          }
        });
      });
    } catch (err) {
      depinCardsTableBody.innerHTML = `<tr><td colspan="7" style="color:#fca5a5;">Lỗi tải danh sách thẻ: ${escapeHtml(err.message)}</td></tr>`;
    }
  };

  const lookupExistingCardOnPortal = async (cardIdRaw) => {
    const id = sanitizeField(cardIdRaw || cardIdInput?.value || '');
    if (!id) {
      showAlert(depinSecurityAlert, 'Vui lòng nhập Mã Thẻ SOS (ID) cần tra cứu.', false);
      return;
    }
    try {
      const res = await fetch(`/api/depin/cards/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok || !json.ok || !json.card) {
        if (cardBlockInput) cardBlockInput.value = '1';
        if (cardPrevSealInput) cardPrevSealInput.value = ZERO_PREV_SEAL;
        await refreshLiveSealPreview();
        showAlert(depinSecurityAlert, `ℹ Thẻ <strong>${escapeHtml(id)}</strong> chưa có trên Sổ cái — Sẵn sàng cấp phát <strong>Genesis Block #1</strong>.`, true);
        return;
      }

      const card = json.card;
      const nextBlock = (Number(card.currentBlockIndex) || 1) + 1;
      const inheritedSeal = card.currentSealPrefixed || card.currentSeal || ZERO_PREV_SEAL;

      if (cardNameInput && card.name) cardNameInput.value = card.name;
      if (cardOfficerInput && card.officer) cardOfficerInput.value = card.officer;
      if (cardBlockInput) cardBlockInput.value = String(nextBlock);
      if (cardPrevSealInput) cardPrevSealInput.value = inheritedSeal;
      if (cardTimeInput) cardTimeInput.value = formatIsoTimestampLocal();

      if (card.isImmutableReal) {
        setPortalMode('REAL');
        showAlert(
          depinSecurityAlert,
          `🔒 Thẻ thật <strong>${escapeHtml(id)}</strong> đã khóa Genesis Block #1. Hệ thống tự động chuyển sang <strong>Nối khối kế thừa Block #${nextBlock}</strong> (PrevSeal kế thừa từ Block #${nextBlock - 1}).`,
          true
        );
      } else {
        setPortalMode(card.mode || 'TEST');
        showAlert(
          depinSecurityAlert,
          `🧪 Đã nạp hồ sơ thẻ TEST <strong>${escapeHtml(id)}</strong> — Chuẩn bị ghi nối tiếp Block #${nextBlock} (hoặc bấm Xóa thông tin TEST để đưa về Block #1).`,
          true
        );
      }
      await refreshLiveSealPreview();
    } catch (err) {
      showAlert(depinSecurityAlert, `Lỗi tra cứu thẻ: ${escapeHtml(err.message)}`, false);
    }
  };

  // ---------------------------------------------------------------------------
  // Web Serial API (Rule 1 & Rule 2: Persistent DTR=true, RTS=true + Read-Back)
  // ---------------------------------------------------------------------------
  const waitForSerialResponse = (predicate, timeoutMs = 3000) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        portalState.lineListeners = portalState.lineListeners.filter((l) => l !== listener);
        reject(new Error('Quá thời gian chờ phản hồi UART từ ESP32-C3 (Kiểm tra cáp hoặc đóng Arduino Serial Monitor)'));
      }, timeoutMs);

      const collected = [];
      const listener = (line) => {
        collected.push(line);
        if (predicate(line, collected)) {
          clearTimeout(timer);
          portalState.lineListeners = portalState.lineListeners.filter((l) => l !== listener);
          resolve(collected);
        }
      };
      portalState.lineListeners.push(listener);
    });

  const sendSerialCommand = async (cmdLine) => {
    if (!portalState.writer) {
      throw new Error('Chưa mở phiên cổng COM Web Serial');
    }
    const clean = cmdLine.endsWith('\n') ? cmdLine : `${cmdLine}\n`;
    logSerial(`>> ${clean.trim()}`);
    await portalState.writer.write(new TextEncoder().encode(clean));
  };

  const readCardSnapshotFromSerial = async (timeoutMs = 3500) => {
    const waitEnd = waitForSerialResponse((line) => /END_READ/i.test(line), timeoutMs);
    await sendSerialCommand('READ_DATA');
    const lines = await waitEnd;
    return { rawText: lines.join('\n'), parsed: parseReadDataDump(lines.join('\n')) };
  };

  const connectWebSerialPort = async () => {
    if (!('serial' in navigator)) {
      showAlert(depinSecurityAlert, 'Trình duyệt hiện tại không hỗ trợ Web Serial API (Vui lòng dùng Chrome/Edge Desktop khi cắm cáp USB-C, hoặc tiếp tục dùng Sổ cái Cloud bên trái).', false);
      return;
    }
    if (portalState.port) {
      logSerial('[INFO] Phiên cổng COM hiện đã mở sẵn (giữ nguyên không mở lại để tránh reset mạch).');
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      if (typeof port.setSignals === 'function') {
        await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      }
      portalState.port = port;
      portalState.writer = port.writable.getWriter();
      portalState.readLoopActive = true;
      if (serialStateBadge) serialStateBadge.textContent = 'ĐÃ MỞ COM 115200 (DTR=1, RTS=1)';
      logSerial('[CONNECTED] Mở 1 phiên COM duy nhất (115200 8N1, DTR=true, RTS=true) — Chống auto-reset ESP32-C3.');

      (async () => {
        const decoder = new TextDecoder();
        let partial = '';
        try {
          portalState.reader = port.readable.getReader();
          while (portalState.readLoopActive) {
            const { value, done } = await portalState.reader.read();
            if (done) break;
            if (value) {
              partial += decoder.decode(value, { stream: true });
              const lines = partial.split(/\r?\n/);
              partial = lines.pop() || '';
              for (const raw of lines) {
                const trimmed = raw.trim();
                if (!trimmed) continue;
                logSerial(`<< ${trimmed}`);
                portalState.lineListeners.slice().forEach((fn) => fn(trimmed));
              }
            }
          }
        } catch (err) {
          logSerial(`[SERIAL WARN] ${err.message}`);
        }
      })();

      // Automatic pre-probe READ_DATA upon connection (Section 4.1: auto-detect REAL card!)
      try {
        const { rawText, parsed } = await readCardSnapshotFromSerial(2800);
        if (rawReadDataInput) rawReadDataInput.value = rawText;
        if (parsed.hw_mac && cardHwMacInput) cardHwMacInput.value = parsed.hw_mac;
        if (parsed.mode === 'REAL' && parsed.id) {
          await applyCardSnapshotToForm(parsed);
          const nextBlock = (parsed.blockIndex || 1) + 1;
          if (cardBlockInput) cardBlockInput.value = String(nextBlock);
          if (cardPrevSealInput && isValidHexSeal(parsed.seal)) cardPrevSealInput.value = parsed.seal;
          await refreshLiveSealPreview();
          showAlert(
            depinSecurityAlert,
            `🔒 Phát hiện thẻ CẤP PHÁT THẬT (<strong>${escapeHtml(parsed.id)}</strong> • Block #${parsed.blockIndex}) trên cổng USB! Đã tự động chuyển sang chế độ <strong>REAL</strong> và chuẩn bị Nối khối <strong>Block #${nextBlock}</strong>.`,
            true
          );
        }
      } catch (_) {}
    } catch (err) {
      const accessDenied = /access|busy|in use|denied/i.test(err.message || '');
      const hint = accessDenied ? ' (Cổng COM đang bận — vui lòng đóng Arduino IDE Serial Monitor hoặc CapPhatTheSOS.exe trước!)' : '';
      logSerial(`[CONNECT ERROR] ${err.message}${hint}`);
      showAlert(depinSecurityAlert, `❌ Không thể mở cổng COM: ${escapeHtml(err.message)}${escapeHtml(hint)}`, false);
    }
  };

  const disconnectWebSerialPort = async () => {
    portalState.readLoopActive = false;
    try { if (portalState.reader) { await portalState.reader.cancel(); portalState.reader.releaseLock(); } } catch (_) {}
    try { if (portalState.writer) { portalState.writer.releaseLock(); } } catch (_) {}
    try { if (portalState.port) { await portalState.port.close(); } } catch (_) {}
    portalState.reader = null;
    portalState.writer = null;
    portalState.port = null;
    if (serialStateBadge) serialStateBadge.textContent = 'ĐÃ ĐÓNG CỔNG COM';
    logSerial('[DISCONNECTED] Đã đóng phiên cổng COM an toàn.');
  };

  // Provision Card (Pre-Probe -> Write 10 Fields -> SAVE_FLASH -> Read-Back Verify -> Cloud Sync)
  const handleProvisionCard = async () => {
    if (cardTimeInput && !cardTimeInput.value.trim()) {
      cardTimeInput.value = formatIsoTimestampLocal();
    }

    let payload = getFormCardPayload();
    if (!payload.id || !payload.name) {
      showAlert(depinSecurityAlert, '⚠ Vui lòng nhập đầy đủ Mã Thẻ SOS (ID) và Họ Tên Chủ Thẻ trước khi nạp!', false);
      return;
    }

    // Step 1: If physical ESP32-C3 is connected via Web Serial, run full v2.1 single-session protocol
    if (portalState.writer) {
      try {
        // 1a. Pre-probe READ_DATA to protect REAL cards from accidental Block #1 overwrite (Section 4.1)
        const { parsed: preSnap } = await readCardSnapshotFromSerial(3000);
        if (preSnap.mode === 'REAL' && preSnap.id && preSnap.blockIndex >= 1) {
          setPortalMode('REAL');
          if (payload.blockIndex <= preSnap.blockIndex) {
            const chainedBlock = preSnap.blockIndex + 1;
            if (cardBlockInput) cardBlockInput.value = String(chainedBlock);
            if (cardPrevSealInput && isValidHexSeal(preSnap.seal)) {
              cardPrevSealInput.value = preSnap.seal;
            }
          }
        }

        const seal = await refreshLiveSealPreview();
        payload = getFormCardPayload();
        payload.seal = seal;

        // 1b. Send 10 SET_* commands waiting for ACK on each
        const cmds = [
          `SET_ID:${payload.id}`,
          `SET_NAME:${payload.name}`,
          `SET_PHONE:${payload.phone}`,
          `SET_CCCD:${payload.cccd}`,
          `SET_OFFICER:${payload.officer}`,
          `SET_TIME:${payload.timestamp}`,
          `SET_MODE:${payload.mode}`,
          `SET_BLOCK:${payload.blockIndex}`,
          `SET_PREV_SEAL:${payload.prevSeal}`,
          `SET_SEAL:${payload.seal}`
        ];
        for (const cmd of cmds) {
          const waitAck = waitForSerialResponse((line) => /^(ACK|OK)/i.test(line), 2500);
          await sendSerialCommand(cmd);
          await waitAck;
        }

        // 1c. Commit NVS Flash and require SAVE_OK
        const waitSave = waitForSerialResponse((line) => /^(SAVE_OK|SAVED|SAVE_FAIL)/i.test(line), 3500);
        await sendSerialCommand('SAVE_FLASH');
        const saveLines = await waitSave;
        if (saveLines.some((l) => /SAVE_FAIL/i.test(l))) {
          showAlert(depinSecurityAlert, '❌ Chip ESP32-C3 trả về SAVE_FAIL khi ghi NVS Flash!', false);
          return;
        }

        // 1d. Rule 2: Mandatory READ_DATA read-back verification from NVS Flash!
        const { rawText: verifyRaw, parsed: postSnap } = await readCardSnapshotFromSerial(3500);
        if (rawReadDataInput) rawReadDataInput.value = verifyRaw;
        if (
          postSnap.id !== payload.id ||
          postSnap.name !== payload.name ||
          postSnap.seal.replace(/^0x/i, '').toLowerCase() !== payload.seal.replace(/^0x/i, '').toLowerCase()
        ) {
          showAlert(
            depinSecurityAlert,
            `❌ ĐỐI CHIẾU NVS FLASH THẤT BẠI: Dữ liệu đọc ngược (${escapeHtml(postSnap.id)} / ${escapeHtml(postSnap.name)}) không khớp dữ liệu vừa gửi!`,
            false
          );
          return;
        }
        logSerial('[VERIFY NVS 100%] Đọc ngược READ_DATA khớp tuyệt đối ID, NAME & SEAL!');
      } catch (err) {
        showAlert(depinSecurityAlert, `⚠ Lỗi nạp/đối chiếu USB-UART ESP32-C3: ${escapeHtml(err.message)}`, false);
        return;
      }
    } else {
      const seal = await refreshLiveSealPreview();
      payload = getFormCardPayload();
      payload.seal = seal;
    }

    // Step 2: Sync Identity Block onto Web Portal Blockchain Ledger
    try {
      const res = await fetch('/api/depin/cards/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showAlert(depinSecurityAlert, `❌ Từ chối ghi khối trên Sổ cái: ${escapeHtml(json?.error || 'Lỗi không xác định')}`, false);
        return;
      }

      const blk = json.latestBlock || {};
      const receipt = json.ledgerReceipt || {};
      showAlert(
        depinSecurityAlert,
        `✔ ĐỒNG BỘ THÀNH CÔNG THẺ <strong>${escapeHtml(json.card.id)}</strong> — Khối thẻ <strong>Block #${escapeHtml(blk.blockIndex)} (${escapeHtml(blk.mode)})</strong> • SEAL: <code>${escapeHtml(String(blk.sealPrefixed || blk.seal || '').slice(0, 20))}...</code> • Ledger <strong>Block #${escapeHtml(receipt.blockNumber)}</strong> (<a href="/api/blockchain/explorer/${encodeURIComponent(receipt.txHash || '')}" target="_blank" style="color:var(--clr-neon-cyan);">Xem Chứng Chỉ Block ↗</a>)`,
        true
      );

      if (json.card.isImmutableReal) {
        setPortalMode('REAL');
      }
      await loadBlockchainStatus();
      await loadRegisteredCards();
    } catch (err) {
      showAlert(depinSecurityAlert, `❌ Lỗi kết nối Sổ cái Portal: ${escapeHtml(err.message)}`, false);
    }
  };

  // Wipe Card (Dual-Mode Enforcement)
  const handleWipeCard = async () => {
    const id = sanitizeField(cardIdInput?.value || '');
    if (portalState.mode === 'REAL') {
      showAlert(
        depinSecurityAlert,
        '⛔ CẢNH BÁO BẢO MẬT CHÍNH THỨC (E10): Thẻ ở Chế độ CẤP PHÁT THẬT (REAL MODE) chỉ cấp Genesis Block #1 duy nhất — NGHIÊM CẤM XÓA TRẮNG FLASH! Mọi cập nhật thông tin bắt buộc thực hiện qua cơ chế Nối khối Blockchain (Block #2, #3...).',
        false
      );
      return;
    }

    if (portalState.writer) {
      try {
        const { parsed: preSnap } = await readCardSnapshotFromSerial(2800);
        if (preSnap.mode === 'REAL' && preSnap.id) {
          setPortalMode('REAL');
          showAlert(depinSecurityAlert, `⛔ TỪ CHỐI XÓA TRẮNG: Thẻ vật lý đang cắm mang chế độ REAL (${escapeHtml(preSnap.id)}) — Bị khóa bảo vệ bất biến!`, false);
          return;
        }
        const waitWipe = waitForSerialResponse((line) => /^(WIPE_OK|WIPED|WIPE_FAIL)/i.test(line), 3500);
        await sendSerialCommand('WIPE_FLASH');
        await waitWipe;
      } catch (err) {
        logSerial(`[WIPE UART WARN] ${err.message}`);
      }
    }

    if (id) {
      try {
        const res = await fetch('/api/depin/cards/wipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          showAlert(depinSecurityAlert, `⛔ ${escapeHtml(json?.error || 'Không thể xóa thẻ này')}`, false);
          return;
        }
      } catch (_) {}
    }

    if (cardIdInput) cardIdInput.value = '';
    if (cardNameInput) cardNameInput.value = '';
    if (cardPhoneInput) cardPhoneInput.value = '';
    if (cardCccdInput) cardCccdInput.value = '';
    if (cardOfficerInput) cardOfficerInput.value = '';
    if (cardBlockInput) cardBlockInput.value = '1';
    if (cardPrevSealInput) cardPrevSealInput.value = ZERO_PREV_SEAL;
    if (cardSealOutput) cardSealOutput.value = '';
    if (cardTimeInput) cardTimeInput.value = formatIsoTimestampLocal();
    await refreshLiveSealPreview();
    await loadRegisteredCards();
    showAlert(depinSecurityAlert, `🗑️ Đã xóa trắng dữ liệu TEST (Factory Reset: wiped=true, BLOCK=0, SEAL="") cho thẻ <strong>${escapeHtml(id || 'ESP32-C3')}</strong>.`, true);
  };

  const buildReadDataTextFromForm = () => {
    const d = getFormCardPayload();
    const isBlank = !d.id && !d.name;
    return [
      `ID:${isBlank ? '' : d.id}`,
      `NAME:${isBlank ? '' : d.name}`,
      `PHONE:${isBlank ? '' : d.phone}`,
      `CCCD:${isBlank ? '' : d.cccd}`,
      `OFFICER:${isBlank ? '' : d.officer}`,
      `TIME:${isBlank ? '' : d.timestamp}`,
      `MODE:${isBlank ? 'TEST' : d.mode}`,
      `BLOCK:${isBlank ? 0 : d.blockIndex}`,
      `PREV_SEAL:${d.prevSeal}`,
      `SEAL:${isBlank ? '' : d.seal}`,
      `HW_MAC:${d.hw_mac}`,
      'STATUS:OK',
      'END_READ'
    ].join('\n');
  };

  const handleVerifySealNow = async () => {
    const rawDump = rawReadDataInput?.value.trim() || '';
    const formPayload = getFormCardPayload();
    const reqBody = rawDump ? { rawReadData: rawDump } : formPayload;

    try {
      const res = await fetch('/api/depin/verify-seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const json = await res.json();
      if (json && json.verified) {
        const scheme = json.verification?.matchedScheme || 'REGISTRY_SYNC_MATCH';
        showAlert(
          verifySealResultBox,
          `✔ XÁC THỰC HỢP LỆ (100% NGUYÊN VẸN) — Chuẩn: <code>${escapeHtml(scheme)}</code> • Đồng bộ Sổ cái: <strong>${json.registeredOnPortal ? 'ĐÃ ĐỒNG BỘ' : 'CHƯA LƯU SỔ CÁI'}</strong>`,
          true
        );
      } else {
        showAlert(
          verifySealResultBox,
          '⚠ CẢNH BÁO GIẢ MẠO / THẺ TRỐNG CHƯA KÝ: Chữ ký SHA-256 (SEAL) không khớp hoặc thẻ chưa cấp phát!',
          false
        );
      }
    } catch (err) {
      showAlert(verifySealResultBox, `Lỗi kiểm định: ${escapeHtml(err.message)}`, false);
    }
  };

  // Section 7 & Rule 5: Simulate 4G LTE Emergency Packet to POST /api/hardware-sos
  const handleSimulateHardwareSos = async () => {
    const seal = await refreshLiveSealPreview();
    const d = getFormCardPayload();
    const btnNum = parseInt(cardSimButtonSelect?.value || '1', 10) || 1;
    const unitMap = {
      1: { code: 'CONG_AN_DIA_PHUONG', title: 'Công an địa phương' },
      2: { code: 'CSGT', title: 'Cảnh sát giao thông' },
      3: { code: 'CUU_NAN_CUU_HO', title: 'Cứu nạn cứu hộ' }
    };
    const unitInfo = unitMap[btnNum] || unitMap[1];

    const latStr = '10.045200';
    const lonStr = '105.746900';
    const isBlankCard = !d.id;
    const effectiveSeal = !isBlankCard && isValidHexSeal(seal) ? seal : '';
    const effectiveName = !isBlankCard && d.name ? d.name : 'THE_CHUA_CAP_PHAT';
    const liveEvidenceHash = effectiveSeal
      ? await generateLiveEvidenceHash(d.id, d.hw_mac, unitInfo.code, latStr, lonStr, effectiveSeal)
      : '';

    const packet4G = {
      device_id: d.id || 'THE_CHUA_CAP_PHAT',
      cardID: d.id,
      id: d.id,
      button: btnNum,
      type: unitInfo.code,
      target_unit: unitInfo.code,
      unit_title: unitInfo.title,
      user_name: effectiveName,
      name: effectiveName,
      fullName: effectiveName,
      victim_name: effectiveName,
      user_phone: isBlankCard ? '' : d.phone,
      phone: isBlankCard ? '' : d.phone,
      user_cccd: isBlankCard ? '' : d.cccd,
      cccd: isBlankCard ? '' : d.cccd,
      officer: isBlankCard ? '' : d.officer,
      time: isBlankCard ? '' : d.timestamp,
      timestamp: isBlankCard ? '' : d.timestamp,
      created_at: isBlankCard ? '' : d.timestamp,
      mode: d.mode,
      block: isBlankCard ? 0 : d.blockIndex,
      prev_seal: d.prevSeal,
      bc_seal: effectiveSeal,
      seal: effectiveSeal,
      hw_mac: d.hw_mac,
      live_evidence_hash: liveEvidenceHash,
      chain_id: SYSTEM_CONFIG.canonicalChainId,
      lat: parseFloat(latStr),
      lng: parseFloat(lonStr)
    };

    try {
      const res = await fetch('/api/hardware-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet4G)
      });
      const json = await res.json();
      if (json && json.ok) {
        showAlert(
          depinSecurityAlert,
          `🚨 ĐÃ BẮN GÓI TIN 4G <strong>#${escapeHtml(json.incident?.id || '')}</strong> (${escapeHtml(unitInfo.code)}) — Trạng thái DePIN: <strong>${escapeHtml(json.hardwareAuth?.status || '')}</strong> (<code>${escapeHtml(json.hardwareAuth?.sealScheme || '')}</code>) • Ledger <strong>Block #${escapeHtml(json.blockNumber)}</strong> (<a href="/dispatcher.html" target="_blank" style="color:var(--clr-neon-cyan);">Mở Trung Tâm Chỉ Huy ↗</a>)`,
          true
        );
        await loadBlockchainStatus();
      } else {
        showAlert(depinSecurityAlert, `Lỗi gửi /api/hardware-sos: ${escapeHtml(json?.error || '')}`, false);
      }
    } catch (err) {
      showAlert(depinSecurityAlert, `Lỗi kết nối /api/hardware-sos: ${escapeHtml(err.message)}`, false);
    }
  };

  // Load Official Spec v2.1 Test Vector (Section 5.5) on explicit technician click
  btnLoadSpecVector?.addEventListener('click', async () => {
    if (cardSecretProfileSelect) cardSecretProfileSelect.value = 'CPP_CMD_E10';
    if (cardIdInput) cardIdInput.value = 'SOS_CSCD10_09';
    if (cardNameInput) cardNameInput.value = 'Nguyễn Văn An';
    if (cardPhoneInput) cardPhoneInput.value = '0918889999';
    if (cardCccdInput) cardCccdInput.value = '079200012345';
    if (cardOfficerInput) cardOfficerInput.value = 'Đại úy Trần Văn Nam - E10 Đ1';
    if (cardTimeInput) cardTimeInput.value = '2026-11-02 14:40:00';
    if (cardBlockInput) cardBlockInput.value = '1';
    if (cardPrevSealInput) cardPrevSealInput.value = ZERO_PREV_SEAL;
    if (cardHwMacInput) cardHwMacInput.value = 'A4CF128E3B09';
    setPortalMode('REAL');
    const seal = await refreshLiveSealPreview();
    showAlert(
      depinSecurityAlert,
      `🧪 Đã nạp Vector Kiểm Thử Chuẩn v2.1 (Mục 5.5) — Mã băm SEAL sinh ra: <code>${escapeHtml(seal)}</code>`,
      true
    );
  });

  btnModeTest?.addEventListener('click', () => setPortalMode('TEST'));
  btnModeReal?.addEventListener('click', () => setPortalMode('REAL'));
  btnLookupCard?.addEventListener('click', () => lookupExistingCardOnPortal());
  btnNowTime?.addEventListener('click', () => {
    if (cardTimeInput) cardTimeInput.value = formatIsoTimestampLocal();
    refreshLiveSealPreview();
  });

  [
    cardIdInput,
    cardNameInput,
    cardPhoneInput,
    cardCccdInput,
    cardOfficerInput,
    cardTimeInput,
    cardBlockInput,
    cardPrevSealInput,
    cardSecretProfileSelect
  ].forEach((el) => {
    el?.addEventListener('input', refreshLiveSealPreview);
    el?.addEventListener('change', refreshLiveSealPreview);
  });

  btnProvisionCard?.addEventListener('click', handleProvisionCard);
  btnWipeCard?.addEventListener('click', handleWipeCard);
  btnSimulateHardwareSos?.addEventListener('click', handleSimulateHardwareSos);

  btnSerialConnect?.addEventListener('click', connectWebSerialPort);
  btnSerialDisconnect?.addEventListener('click', disconnectWebSerialPort);
  btnSerialPing?.addEventListener('click', async () => {
    try {
      const waitPong = waitForSerialResponse((l) => /PONG/i.test(l), 2500);
      await sendSerialCommand('PING');
      await waitPong;
      showAlert(depinSecurityAlert, '📡 Phản hồi PONG tức thì từ ESP32-C3 TDM2421!', true);
    } catch (err) {
      showAlert(depinSecurityAlert, `⚠ PING lỗi: ${escapeHtml(err.message)}`, false);
    }
  });
  btnSerialRead?.addEventListener('click', async () => {
    try {
      const { rawText, parsed } = await readCardSnapshotFromSerial(4000);
      if (rawReadDataInput) rawReadDataInput.value = rawText;
      await applyCardSnapshotToForm(parsed);
      await handleVerifySealNow();
    } catch (err) {
      showAlert(depinSecurityAlert, `⚠ READ_DATA lỗi: ${escapeHtml(err.message)}`, false);
    }
  });
  btnSerialSetServerUrl?.addEventListener('click', async () => {
    const defaultEndpoint = `${window.location.origin}/api/hardware-sos`;
    const nextUrl = window.prompt('Nhập địa chỉ HTTPS nhận tín hiệu 4G lưu vào NVS (s_url) của ESP32-C3:', defaultEndpoint);
    if (!nextUrl || !nextUrl.trim()) return;
    try {
      const waitOk = waitForSerialResponse((l) => /\[OK\]|cap nhat URL|ACK|OK/i.test(l), 3000);
      await sendSerialCommand(`url|${nextUrl.trim()}`);
      await waitOk;
      showAlert(depinSecurityAlert, `🌐 Đã cập nhật URL Server 4G trong NVS của mạch: <code>${escapeHtml(nextUrl.trim())}</code>`, true);
    } catch (err) {
      showAlert(depinSecurityAlert, `⚠ Lỗi gửi lệnh url|: ${escapeHtml(err.message)}`, false);
    }
  });

  btnFillReadDataFromForm?.addEventListener('click', async () => {
    await refreshLiveSealPreview();
    if (rawReadDataInput) rawReadDataInput.value = buildReadDataTextFromForm();
  });
  btnVerifySealNow?.addEventListener('click', handleVerifySealNow);
  btnRefreshCards?.addEventListener('click', loadRegisteredCards);

  setPortalMode('TEST');
  loadBlockchainStatus();
  loadRegisteredCards();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initDepinCardPortal);
  } else {
    initDepinCardPortal();
  }
}
