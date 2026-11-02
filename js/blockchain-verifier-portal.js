/**
 * SOS Việt Nam 2026 — Cổng Đối Chứng Xác Thực & Phần Mềm Giải Mã Hồ Sơ Chuỗi Khối
 *
 * Capabilities:
 * 1. Live Ledger Cross-Check (/api/blockchain/lookup) by TxHash, Block #, or Case ID.
 * 2. Client-side WebCrypto SHA-256 Deterministic Block Re-Hashing:
 *      payloadDigest = "0x" + SHA256(JSON.stringify(payload.data || {}))
 *      txHash        = "0x" + SHA256(JSON.stringify(payload) + "|" + blockNumber + "|" + prevHash)
 *    + Online Server Cross-Verification (/api/blockchain/verify-dossier).
 * 3. Human-readable Vietnamese Case Process Decoder (Ai báo, Ai nhận, Thời gian tiếp nhận,
 *    Thời gian di chuyển, Thời gian xử lý tại hiện trường, Tổng thời gian toàn trình).
 * 4. Live Recent Ledger Explorer (/api/blockchain/recent) with 1-click inspect & tamper test.
 */
(function () {
  'use strict';

  const ACTION_LABELS_VI = {
    '1_SOS_TRIGGER': '1. Khởi tạo & Báo tin cứu hộ khẩn cấp',
    '2_EVIDENCE_SEAL': '2. Niêm phong chứng cứ số SHA-256 hiện trường',
    '2B_CASE_ESCALATED': '2B. Chuyển vượt cấp Chỉ huy Tỉnh / Thành phố',
    '3_OFFICER_DISPATCH': '3. Trực ban tiếp nhận & Xuất quân cứu hộ',
    '3A_OFFICER_APPROACHING': '3A. Đội cứu hộ tiếp cận gần hiện trường (< 300m)',
    '3B_OFFICER_ARRIVED': '3B. Lực lượng cứu hộ đã có mặt tại hiện trường',
    '4_CASE_RESOLVED': '4. Hoàn tất ứng cứu & Đóng hồ sơ bất biến',
    '4B_FAKE_ALARM': '4B. Lập biên bản báo tin giả (Nghị định 144/2021/NĐ-CP)',
    '0_CARD_PROVISION_SEAL': '0. Cấp phát / Nối khối Thẻ SOS vật lý (DePIN)'
  };

  let activeMode = 'lookup';
  let currentExportableJson = null;
  let currentVerifyUrl = window.location.href;

  function escapeHtml(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatViTime(iso) {
    if (!iso) return 'Chưa ghi nhận';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('vi-VN', { hour12: false });
  }

  function formatDurationVi(seconds) {
    if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) {
      return 'Chưa ghi nhận';
    }
    const sec = Math.max(0, Math.round(Number(seconds)));
    if (sec === 0) return '0 giây (< 1s)';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const rem = sec % 60;
    const parts = [];
    if (hrs > 0) parts.push(`${hrs} giờ`);
    if (mins > 0) parts.push(`${mins} phút`);
    if (rem > 0 || parts.length === 0) parts.push(`${rem} giây`);
    return sec >= 60 ? `${parts.join(' ')} (${sec}s)` : parts.join(' ');
  }

  function getStoredOfficerToken() {
    try {
      return (
        sessionStorage.getItem('sos_dispatcher_token') ||
        localStorage.getItem('sos_dispatcher_token') ||
        sessionStorage.getItem('dispatcherToken') ||
        localStorage.getItem('dispatcherToken') ||
        ''
      ).trim();
    } catch (_) {
      return '';
    }
  }

  function buildAuthHeaders(extra = {}) {
    const headers = { Accept: 'application/json', ...extra };
    const token = getStoredOfficerToken();
    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async function sha256HexBrowser(utf8Text) {
    if (window.crypto && window.crypto.subtle) {
      const bytes = new TextEncoder().encode(utf8Text);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return '0x' + hex;
    }
    return '';
  }

  /**
   * Offline browser-side cryptographic verification of every block in a dossier JSON.
   * Matches services/blockchain-ledger-service.js sealBlockSync 100% byte-for-byte.
   */
  async function verifyDossierOfflineWebCrypto(dossierObj) {
    const t0 = performance.now();
    let rawBlocks = [];
    if (Array.isArray(dossierObj)) {
      rawBlocks = dossierObj;
    } else if (dossierObj && typeof dossierObj === 'object') {
      if (Array.isArray(dossierObj.lifecycleBlocks)) rawBlocks = dossierObj.lifecycleBlocks;
      else if (Array.isArray(dossierObj.blocks)) rawBlocks = dossierObj.blocks;
      else if (dossierObj.blockNumber !== undefined && (dossierObj.txHash || dossierObj.payload)) rawBlocks = [dossierObj];
    }

    const perBlock = new Map();
    let allValid = rawBlocks.length > 0;
    let corruptedCount = 0;
    let missingPayloadCount = 0;

    const sorted = [...rawBlocks]
      .filter((b) => b && typeof b === 'object')
      .sort((a, b) => (Number(a.blockNumber) || 0) - (Number(b.blockNumber) || 0));

    for (let i = 0; i < sorted.length; i++) {
      const blk = sorted[i];
      const blockNumber = Number(blk.blockNumber) || 0;
      const providedTx = String(blk.txHash || blk.hash || '').trim().toLowerCase();
      const providedDigest = String(blk.payloadDigest || '').trim().toLowerCase();
      const prevHash = String(blk.prevHash || '');

      if (!blk.payload || typeof blk.payload !== 'object') {
        missingPayloadCount += 1;
        allValid = false;
        perBlock.set(blockNumber, {
          hasPayload: false,
          hashMatched: false,
          digestMatched: false,
          prevMatched: true,
          recomputedTxHash: '',
          recomputedPayloadDigest: ''
        });
        continue;
      }

      const recomputedPayloadDigest = await sha256HexBrowser(JSON.stringify(blk.payload.data || {}));
      const recomputedTxHash = await sha256HexBrowser(`${JSON.stringify(blk.payload)}|${blockNumber}|${prevHash}`);

      const hashMatched = Boolean(providedTx && recomputedTxHash && providedTx === recomputedTxHash.toLowerCase());
      const digestMatched = !providedDigest || (recomputedPayloadDigest && providedDigest === recomputedPayloadDigest.toLowerCase());
      let prevMatched = true;
      if (i > 0 && (Number(sorted[i - 1].blockNumber) || 0) + 1 === blockNumber) {
        const prevTx = String(sorted[i - 1].txHash || sorted[i - 1].hash || '').trim().toLowerCase();
        if (prevTx) prevMatched = prevHash.toLowerCase() === prevTx;
      }

      if (!hashMatched || !digestMatched || !prevMatched) {
        allValid = false;
        corruptedCount += 1;
      }

      perBlock.set(blockNumber, {
        hasPayload: true,
        hashMatched,
        digestMatched,
        prevMatched,
        recomputedTxHash,
        recomputedPayloadDigest
      });
    }

    const elapsedMs = Number((performance.now() - t0).toFixed(2));
    return {
      supported: Boolean(window.crypto && window.crypto.subtle),
      checkedCount: sorted.length,
      allValid,
      corruptedCount,
      missingPayloadCount,
      elapsedMs,
      perBlock
    };
  }

  function switchTab(mode) {
    activeMode = mode === 'decoder' ? 'decoder' : 'lookup';
    const tabLookup = document.getElementById('tabBtnLookup');
    const tabDecoder = document.getElementById('tabBtnDecoder');
    const cardLookup = document.getElementById('bcvLookupInputCard');
    const cardDecoder = document.getElementById('bcvDecoderInputCard');

    if (tabLookup) {
      tabLookup.classList.toggle('is-active', activeMode === 'lookup');
      tabLookup.setAttribute('aria-selected', String(activeMode === 'lookup'));
    }
    if (tabDecoder) {
      tabDecoder.classList.toggle('is-active', activeMode === 'decoder');
      tabDecoder.setAttribute('aria-selected', String(activeMode === 'decoder'));
    }
    if (cardLookup) cardLookup.hidden = activeMode !== 'lookup';
    if (cardDecoder) cardDecoder.hidden = activeMode !== 'decoder';
  }

  function updateViewerRoleBadge(role, piiMasked) {
    const el = document.getElementById('bcvViewerRoleBadge');
    if (!el) return;
    if (role === 'officer' || piiMasked === false) {
      el.className = 'bcv-role-tag is-officer';
      el.textContent = '👮 Chế độ Cán bộ Trực ban (Hiển thị đầy đủ dữ liệu nghiệp vụ)';
    } else {
      el.className = 'bcv-role-tag';
      el.textContent = '🌐 Chế độ Tra cứu Công khai (Đã che bảo mật SĐT/CCCD công dân)';
    }
  }

  function renderProcessSummaryCards(ps) {
    const grid = document.getElementById('bcvProcessSummaryGrid');
    if (!grid) return;
    if (!ps) {
      grid.innerHTML = '<div class="bcv-metric-card"><div class="bcv-metric-sub">Không có dữ liệu tóm tắt quy trình.</div></div>';
      return;
    }

    const rep = ps.reporter || {};
    const off = ps.officer || {};
    const ts = ps.timestamps || {};
    const dur = ps.durations || {};
    const rout = ps.routing || {};
    const res = ps.resolution || {};

    const hasCoords = rep.lat !== null && rep.lat !== undefined && rep.lng !== null && rep.lng !== undefined;
    const coordStr = hasCoords
      ? `${Number(rep.lat).toFixed(5)}, ${Number(rep.lng).toFixed(5)}${rep.accuracy ? ` (±${Math.round(Number(rep.accuracy))}m)` : ''}`
      : 'Chưa ghi nhận';
    const mapsLink = hasCoords
      ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(`${rep.lat},${rep.lng}`)}" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Mở bản đồ GPS ↗</a>`
      : '';

    grid.innerHTML = `
      <div class="bcv-metric-card">
        <div class="bcv-metric-label">1. Ai Báo Tin &amp; Kênh Phát</div>
        <div class="bcv-metric-primary">${escapeHtml(rep.name || 'Người dân khẩn cấp')}</div>
        <div class="bcv-metric-sub">
          • SĐT: <strong>${escapeHtml(rep.phone || 'Chưa cung cấp')}</strong><br>
          ${rep.cardID ? `• Mã thẻ DePIN: <strong>${escapeHtml(rep.cardID)}</strong><br>` : ''}
          ${rep.userCCCD ? `• CCCD: <strong>${escapeHtml(rep.userCCCD)}</strong><br>` : ''}
          • Kênh: ${escapeHtml(rep.channelLabelVi || rep.channel || 'WEB_SOS')}<br>
          • Lực lượng gọi: <strong>${escapeHtml(rep.agencyName || rep.agency || 'Cứu hộ')}</strong>
        </div>
      </div>

      <div class="bcv-metric-card">
        <div class="bcv-metric-label">2. Vị Trí &amp; Nội Dung Sự Cố</div>
        <div class="bcv-metric-primary">${escapeHtml(rep.address || coordStr)}</div>
        <div class="bcv-metric-sub">
          • GPS: <code>${escapeHtml(coordStr)}</code> ${mapsLink}<br>
          • Trạm định tuyến đầu: <strong>${escapeHtml(rout.initialUnitName || '--')}</strong><br>
          ${rout.escalatedCount > 0 ? `• Chuyển vượt cấp (${rout.escalatedCount} lần): <strong>${escapeHtml(rout.escalatedToUnitName || 'Chỉ huy Tỉnh/TP')}</strong><br>` : ''}
          ${rep.incidentTags && rep.incidentTags.length ? `• Phân loại: ${escapeHtml(rep.incidentTags.join(', '))}<br>` : ''}
          ${rep.customNotes ? `• Ghi chú: ${escapeHtml(rep.customNotes)}` : ''}
        </div>
      </div>

      <div class="bcv-metric-card">
        <div class="bcv-metric-label">3. Ai Nhận Ca &amp; Đơn Vị Xuất Quân</div>
        <div class="bcv-metric-primary is-cyan">${escapeHtml(off.fullTitle || 'Chưa có cán bộ nhận ca')}</div>
        <div class="bcv-metric-sub">
          • Đơn vị: <strong>${escapeHtml(off.unitName || 'Đang điều phối')}</strong><br>
          ${off.account ? `• Tài khoản trực ban: <code>${escapeHtml(off.account)}</code><br>` : ''}
          ${off.phone ? `• SĐT trực chiến: <strong>${escapeHtml(off.phone)}</strong><br>` : ''}
          • Kênh nhận lệnh: ${escapeHtml(off.dispatchChannelLabelVi || 'Chưa tiếp nhận')}<br>
          ${off.etaMinutes ? `• Dự kiến tới nơi (ETA): <strong>${escapeHtml(off.etaMinutes)} phút</strong>` : ''}
        </div>
      </div>

      <div class="bcv-metric-card">
        <div class="bcv-metric-label">4. Thời Gian Tiếp Nhận (Phản Ứng)</div>
        <div class="bcv-metric-primary is-green">${escapeHtml(dur.responseTimeTextVi || formatDurationVi(dur.responseTimeSeconds))}</div>
        <div class="bcv-metric-sub">
          • Giờ báo SOS: <strong>${escapeHtml(formatViTime(ts.triggeredAt))}</strong><br>
          • Giờ nhận ca: <strong>${escapeHtml(formatViTime(ts.dispatchedAt))}</strong><br>
          ${ts.escalatedAt ? `• Giờ chuyển cấp: ${escapeHtml(formatViTime(ts.escalatedAt))}` : '• Tiếp nhận trực tiếp đúng quy trình'}
        </div>
      </div>

      <div class="bcv-metric-card">
        <div class="bcv-metric-label">5. Thời Gian Di Chuyển Tới Hiện Trường</div>
        <div class="bcv-metric-primary is-cyan">${escapeHtml(dur.travelTimeTextVi || formatDurationVi(dur.travelTimeSeconds))}</div>
        <div class="bcv-metric-sub">
          ${ts.approachingAt ? `• Giờ áp sát (&lt;300m): ${escapeHtml(formatViTime(ts.approachingAt))}<br>` : ''}
          • Giờ tới hiện trường: <strong>${escapeHtml(formatViTime(ts.arrivedAt))}</strong><br>
          • Tổng từ lúc báo → tới nơi: <strong>${escapeHtml(dur.totalToSceneTextVi || formatDurationVi(dur.totalToSceneSeconds))}</strong>
        </div>
      </div>

      <div class="bcv-metric-card">
        <div class="bcv-metric-label">6. Xử Lý Hiện Trường &amp; Tổng Quy Trình</div>
        <div class="bcv-metric-primary" style="color:${ps.isFakeAlarm ? '#f87171' : '#fbbf24'};">
          ${escapeHtml(dur.totalCaseDurationTextVi || formatDurationVi(dur.totalCaseDurationSeconds))}
        </div>
        <div class="bcv-metric-sub">
          • Xử lý tại chỗ: <strong>${escapeHtml(dur.onSceneHandlingTextVi || formatDurationVi(dur.onSceneHandlingSeconds))}</strong><br>
          • Giờ đóng hồ sơ: <strong>${escapeHtml(formatViTime(ts.resolvedAt))}</strong><br>
          • Trạng thái: <strong>${escapeHtml(ps.currentStageLabelVi || '--')}</strong><br>
          ${res.note ? `• Kết luận: ${escapeHtml(res.note)}` : ''}
        </div>
      </div>
    `;
  }

  function renderDecodedSteps(steps = [], rawBlocks = [], verificationByBlock = new Map(), offlineByBlock = new Map()) {
    const listEl = document.getElementById('bcvDecodedStepsList');
    if (!listEl) return;

    if (!steps || steps.length === 0) {
      listEl.innerHTML = '<div class="bcv-step-card"><div class="bcv-step-summary">Chưa có Block nào để giải mã.</div></div>';
      return;
    }

    const rawByNum = new Map();
    (rawBlocks || []).forEach((b) => {
      if (b && b.blockNumber !== undefined) rawByNum.set(Number(b.blockNumber), b);
    });

    listEl.innerHTML = steps.map((step, idx) => {
      const blkNum = Number(step.blockNumber) || 0;
      const srvAudit = verificationByBlock.get(blkNum) || null;
      const offAudit = offlineByBlock.get(blkNum) || null;
      const rawBlock = rawByNum.get(blkNum) || step;

      const isTampered = Boolean(
        (srvAudit && srvAudit.status === 'TAMPERED') ||
        (offAudit && offAudit.hasPayload && (!offAudit.hashMatched || !offAudit.digestMatched || !offAudit.prevMatched)) ||
        step.hashVerified === false
      );

      let cryptoBadgeHtml = '<span class="bcv-badge ok">✔ SHA-256 Nguyên Vẹn</span>';
      if (isTampered) {
        cryptoBadgeHtml = '<span class="bcv-badge bad">❌ ĐÃ BỊ CHỈNH SỬA / SAI MÃ BĂM</span>';
      } else if (srvAudit && srvAudit.status === 'VERIFIED_ON_LEDGER') {
        cryptoBadgeHtml = '<span class="bcv-badge ok">✔ Khớp SHA-256 &amp; Sổ Cái Máy Chủ</span>';
      } else if (srvAudit && srvAudit.status === 'HASH_VALID_OFF_LEDGER') {
        cryptoBadgeHtml = '<span class="bcv-badge duration">ℹ SHA-256 Hợp Lệ (Khác Phiên Sổ Cái)</span>';
      }

      const kvItems = Array.isArray(step.detailsVi) && step.detailsVi.length > 0
        ? step.detailsVi.map((kv) => `<div class="bcv-kv-item"><span>${escapeHtml(kv.label)}:</span> <strong>${escapeHtml(kv.value)}</strong></div>`).join('')
        : `<div class="bcv-kv-item"><span>Người thực hiện:</span> <strong>${escapeHtml(step.actorLabelVi || '--')}</strong></div>`;

      const tamperReasonsHtml = (srvAudit && Array.isArray(srvAudit.reasonsVi) && srvAudit.reasonsVi.length > 0 && isTampered)
        ? `<div style="margin:8px 0;padding:8px 10px;border-radius:8px;background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#fecaca;font-size:12px;">
             <strong>⚠ Chi tiết phát hiện can thiệp tại Block #${escapeHtml(blkNum)}:</strong><br>
             ${srvAudit.reasonsVi.map((r) => `• ${escapeHtml(r)}`).join('<br>')}
           </div>`
        : '';

      const cryptoProofDump = {
        blockNumber: blkNum,
        action: step.action,
        timestamp: step.timestamp,
        txHashInFileOrLedger: step.txHash || srvAudit?.providedTxHash || '',
        recomputedWebCryptoSha256: offAudit?.recomputedTxHash || srvAudit?.recomputedTxHash || step.recomputedTxHash || '',
        serverAuthoritativeTxHash: srvAudit?.serverTxHash || step.txHash || '',
        prevHash: step.prevHash,
        payloadDigest: step.payloadDigest || srvAudit?.providedPayloadDigest || '',
        payload: rawBlock?.payload || { data: step.data || {} }
      };

      return `
        <article class="bcv-step-card ${isTampered ? 'is-tampered' : ''}" data-block-number="${escapeHtml(blkNum)}">
          <div class="bcv-step-head">
            <div class="bcv-step-title">
              Bước ${idx + 1} · ${escapeHtml(step.actionLabelVi || ACTION_LABELS_VI[step.action] || step.action)}
            </div>
            <div class="bcv-step-badges">
              <span class="bcv-badge block">Block #${escapeHtml(blkNum)}</span>
              <span class="bcv-badge">${escapeHtml(formatViTime(step.timestamp))}</span>
              ${step.durationBadgeVi ? `<span class="bcv-badge duration">⏱ ${escapeHtml(step.durationBadgeVi)}</span>` : ''}
              ${cryptoBadgeHtml}
            </div>
          </div>
          <div class="bcv-step-summary">${escapeHtml(step.summaryVi || '')}</div>
          ${tamperReasonsHtml}
          <div class="bcv-kv-grid">${kvItems}</div>
          <details class="bcv-crypto-details">
            <summary>🔐 Xem mã băm mật mã (TxHash / PrevHash) &amp; Bản ghi JSON gốc của Block #${escapeHtml(blkNum)}</summary>
            <pre class="bcv-crypto-pre">${escapeHtml(JSON.stringify(cryptoProofDump, null, 2))}</pre>
          </details>
        </article>
      `;
    }).join('');
  }

  function renderQrAndLinks({ qrSvg, verificationPortalUrl, explorerCertificateUrl, caseId }) {
    const qrPanel = document.getElementById('bcvQrPanel');
    const qrBox = document.getElementById('bcvQrSvgBox');
    const caseBadge = document.getElementById('bcvCaseBadge');
    const rawCertBtn = document.getElementById('btnOpenRawCertificate');

    currentVerifyUrl = verificationPortalUrl || window.location.href;

    if (qrBox && qrPanel) {
      if (typeof qrSvg === 'string' && qrSvg.trim().startsWith('<svg') && !/<script/i.test(qrSvg)) {
        qrPanel.style.display = 'flex';
        qrBox.innerHTML = qrSvg;
      } else {
        qrPanel.style.display = 'none';
        qrBox.innerHTML = '';
      }
    }
    if (caseBadge) {
      caseBadge.textContent = caseId ? `Mã hồ sơ: ${caseId}` : '';
    }
    if (rawCertBtn) {
      if (explorerCertificateUrl) {
        rawCertBtn.hidden = false;
        rawCertBtn.href = explorerCertificateUrl;
      } else {
        rawCertBtn.hidden = true;
      }
    }
  }

  async function executeLiveLookup(queryText, { pushHistory = true } = {}) {
    const q = String(queryText || '').trim();
    if (!q) return;

    const btn = document.getElementById('btnLookupSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang đối chứng Sổ cái...';
    }

    try {
      const res = await fetch(`/api/blockchain/lookup?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildAuthHeaders()
      });
      const data = await res.json();
      const reportCard = document.getElementById('bcvReportCard');
      const banner = document.getElementById('bcvVerdictBanner');
      const titleEl = document.getElementById('bcvVerdictTitle');
      const detailEl = document.getElementById('bcvVerdictDetail');
      const badgesEl = document.getElementById('bcvVerdictBadges');

      if (reportCard) reportCard.hidden = false;
      updateViewerRoleBadge(data.viewerRole, data.piiMasked);

      if (!res.ok || !data.found) {
        if (banner) banner.className = 'bcv-verdict-banner is-tampered';
        if (titleEl) titleEl.textContent = '❌ KHÔNG TÌM THẤY MÃ NÀY TRÊN SỔ CÁI HỆ THỐNG';
        if (detailEl) {
          detailEl.textContent = `Mã tra cứu "${q}" không tồn tại trên Sổ cái đang vận hành (${data.sysConfig?.envName || 'SOS Chain'}). Vui lòng kiểm tra lại TxHash, Số Block hoặc dùng tab Giải Mã File .JSON nếu hồ sơ thuộc phiên lưu trữ khác.`;
        }
        if (badgesEl) badgesEl.innerHTML = '';
        renderProcessSummaryCards(null);
        renderDecodedSteps([]);
        renderQrAndLinks({});
        return;
      }

      if (pushHistory && window.history && window.history.replaceState) {
        const nextUrl = `/tra-cuu-blockchain.html?tx=${encodeURIComponent(data.matchedTxHash)}&case=${encodeURIComponent(data.caseId || '')}`;
        window.history.replaceState(null, '', nextUrl);
      }

      const allIntact = Boolean(data.chainIntegrity?.allBlocksIntact);
      if (banner) banner.className = `bcv-verdict-banner ${allIntact ? '' : 'is-tampered'}`;
      if (titleEl) {
        titleEl.textContent = allIntact
          ? `✔ DỮ LIỆU THẬT ĐANG LƯU TRÊN SỔ CÁI HỆ THỐNG — CHUỖI KHỐI NGUYÊN VẸN 100%`
          : `❌ CẢNH BÁO: PHÁT HIỆN SAI LỆCH LIÊN KẾT CHUỖI KHỐI TRÊN SỔ CÁI`;
      }
      if (detailEl) {
        detailEl.textContent = `Đã đối chứng trực tiếp trên máy chủ (${data.sysConfig?.envName || ''} · Chain ID: ${data.sysConfig?.chainId || ''}): Hồ sơ ${data.caseId} gồm ${data.processSummary?.totalBlocksInCase || data.blocks?.length || 0} Block liên kết mật mã SHA-256 liên tục, khớp tại Block #${data.matchedBlockNumber}.`;
      }
      if (badgesEl) {
        badgesEl.innerHTML = `
          <span class="bcv-check-pill ${allIntact ? 'ok' : 'fail'}">${allIntact ? '✔ Liên kết PrevHash & TxHash khớp 100%' : '❌ Lỗi liên kết Hash'}</span>
          <span class="bcv-check-pill ok">✔ Đang lưu trên Sổ cái gốc (${escapeHtml(data.sysConfig?.totalBlocks || 0)} Block toàn hệ thống)</span>
          <span class="bcv-check-pill">${data.piiMasked ? '🔒 SĐT/CCCD đã che bảo mật công khai' : '👮 Hiển thị đầy đủ cho Cán bộ Trực ban'}</span>
        `;
      }

      currentExportableJson = {
        schemaVersion: data.piiMasked ? '2.1-PUBLIC-REDACTED-VIEW' : '2.1-PROCESS-DOSSIER',
        piiMasked: Boolean(data.piiMasked),
        exportedFrom: 'SOS_VIETNAM_VERIFIER_PORTAL',
        exportedAt: new Date().toISOString(),
        incidentId: data.caseId,
        matchedBlockNumber: data.matchedBlockNumber,
        matchedTxHash: data.matchedTxHash,
        verificationPortalUrl: data.verificationPortalUrl,
        processSummary: data.processSummary,
        lifecycleBlocks: data.blocks
      };
      const dlBtn = document.getElementById('btnDownloadCurrentJson');
      if (dlBtn) {
        dlBtn.textContent = data.piiMasked
          ? '💾 Tải Bản Tra Cứu Công Khai (.JSON - Đã Che SĐT)'
          : '💾 Tải Tệp Hồ Sơ Pháp Lý Chuẩn (.JSON)';
      }

      const srvAuditMap = new Map();
      (data.chainIntegrity?.blocks || []).forEach((b) => {
        srvAuditMap.set(Number(b.blockNumber), {
          status: b.hashMatched && b.prevMatched ? 'VERIFIED_ON_LEDGER' : 'TAMPERED',
          recomputedTxHash: b.recomputedTxHash,
          serverTxHash: b.txHash,
          reasonsVi: (!b.hashMatched || !b.prevMatched) ? ['Sai lệch mã băm hoặc liên kết prevHash'] : []
        });
      });

      renderProcessSummaryCards(data.processSummary);
      renderDecodedSteps(data.processSummary?.steps || [], data.blocks || [], srvAuditMap, new Map());
      renderQrAndLinks({
        qrSvg: data.qrSvg,
        verificationPortalUrl: data.verificationPortalUrl,
        explorerCertificateUrl: data.explorerCertificateUrl,
        caseId: data.caseId
      });
    } catch (err) {
      alert('Không thể kết nối máy chủ đối chứng: ' + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔍 Đối Chứng & Giải Mã';
      }
    }
  }

  async function executeDossierDecodeAndAudit(rawText) {
    const trimmed = String(rawText || '').trim();
    if (!trimmed) {
      alert('Vui lòng tải lên tệp .JSON hoặc dán nội dung JSON của hồ sơ chuỗi khối trước khi giải mã.');
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      const reportCard = document.getElementById('bcvReportCard');
      const banner = document.getElementById('bcvReportCard') && document.getElementById('bcvVerdictBanner');
      if (reportCard) reportCard.hidden = false;
      if (banner) banner.className = 'bcv-verdict-banner is-tampered';
      document.getElementById('bcvVerdictTitle').textContent = '❌ TỆP HOẶC NỘI DUNG KHÔNG ĐÚNG ĐỊNH DẠNG JSON';
      document.getElementById('bcvVerdictDetail').textContent = 'Không thể phân tích cú pháp JSON: ' + err.message;
      document.getElementById('bcvVerdictBadges').innerHTML = '';
      renderProcessSummaryCards(null);
      renderDecodedSteps([]);
      renderQrAndLinks({});
      return;
    }

    const btn = document.getElementById('btnDecodeJson');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang giải mã & băm lại SHA-256...';
    }

    try {
      // 1. Offline WebCrypto SHA-256 re-hash directly in browser
      const offlineAudit = await verifyDossierOfflineWebCrypto(parsed);

      // 2. Online Server Ledger cross-verification
      const res = await fetch('/api/blockchain/verify-dossier', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ dossier: parsed })
      });
      const data = await res.json();

      const reportCard = document.getElementById('bcvReportCard');
      const banner = document.getElementById('bcvVerdictBanner');
      const titleEl = document.getElementById('bcvVerdictTitle');
      const detailEl = document.getElementById('bcvVerdictDetail');
      const badgesEl = document.getElementById('bcvVerdictBadges');
      if (reportCard) reportCard.hidden = false;

      const isTampered = Boolean(data.tamperDetected || (offlineAudit.checkedCount > 0 && offlineAudit.corruptedCount > 0));
      const isFullyVerified = Boolean(data.verified && offlineAudit.allValid && !isTampered);

      if (banner) {
        banner.className = isTampered
          ? 'bcv-verdict-banner is-tampered'
          : (isFullyVerified ? 'bcv-verdict-banner' : 'bcv-verdict-banner is-warning');
      }
      if (titleEl) {
        titleEl.textContent = isTampered
          ? `❌ ${data.verdictTitleVi || 'PHÁT HIỆN CHỈNH SỬA TRÁI PHÉP TRONG FILE HỒ SƠ'}`
          : (isFullyVerified ? `✔ ${data.verdictTitleVi}` : `ℹ ${data.verdictTitleVi || 'ĐÃ GIẢI MÃ HỒ SƠ'}`);
      }
      if (detailEl) {
        detailEl.textContent = data.verdictDetailVi || '';
      }

      if (badgesEl) {
        const offlineOk = offlineAudit.allValid && offlineAudit.corruptedCount === 0;
        const serverOk = Boolean(data.serverLedgerAllMatched && !data.tamperDetected);
        badgesEl.innerHTML = `
          <span class="bcv-check-pill ${offlineOk ? 'ok' : 'fail'}" id="bcvOfflineBadge">
            ${offlineOk
              ? `✔ Băm lại SHA-256 Trình duyệt (WebCrypto): Khớp ${offlineAudit.checkedCount}/${offlineAudit.checkedCount} Block (${offlineAudit.elapsedMs} ms)`
              : `❌ Băm lại SHA-256 Trình duyệt: Sai lệch ${offlineAudit.corruptedCount} Block (${offlineAudit.elapsedMs} ms)`}
          </span>
          <span class="bcv-check-pill ${serverOk ? 'ok' : (isTampered ? 'fail' : '')}" id="bcvOnlineBadge">
            ${serverOk
              ? '✔ Đối chứng Sổ cái Máy chủ: Tồn tại & Trùng khớp 100%'
              : (isTampered ? '❌ Đối chứng Sổ cái Máy chủ: KHÔNG KHỚP BẢN GỐC' : 'ℹ Chưa có trên Sổ cái phiên hiện tại')}
          </span>
        `;
      }

      currentExportableJson = parsed;

      const srvMap = new Map();
      (data.blockVerifications || []).forEach((bv) => {
        srvMap.set(Number(bv.blockNumber), bv);
      });

      const rawBlocksList = Array.isArray(parsed)
        ? parsed
        : (parsed.lifecycleBlocks || parsed.blocks || [parsed]);

      renderProcessSummaryCards(data.processSummary);
      renderDecodedSteps(data.processSummary?.steps || [], rawBlocksList, srvMap, offlineAudit.perBlock);
      renderQrAndLinks({
        qrSvg: data.qrSvg,
        verificationPortalUrl: data.verificationPortalUrl,
        explorerCertificateUrl: data.processSummary?.latestTxHash
          ? `/api/blockchain/explorer/${encodeURIComponent(data.processSummary.latestTxHash)}`
          : '',
        caseId: data.processSummary?.caseId || parsed.incidentId || ''
      });
    } catch (err) {
      alert('Lỗi khi giải mã và giám định tệp hồ sơ: ' + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔐 Giải Mã Hồ Sơ & Giám Định SHA-256 Kép';
      }
    }
  }

  async function loadLedgerStatusAndRecent() {
    const statusTextEl = document.getElementById('bcvLedgerStatusText');
    const tbody = document.getElementById('bcvRecentTableBody');

    try {
      const [statusRes, recentRes] = await Promise.all([
        fetch('/api/blockchain/status', { credentials: 'same-origin', headers: buildAuthHeaders() }),
        fetch('/api/blockchain/recent?limit=20', { credentials: 'same-origin', headers: buildAuthHeaders() })
      ]);
      const statusData = await statusRes.json();
      const recentData = await recentRes.json();

      if (statusTextEl && statusData.ok) {
        statusTextEl.textContent = `${statusData.envName} · Chain ID: ${statusData.chainId} (Canonical: 842026) · Đã niêm phong: ${statusData.totalBlocks} Block · Kho: ${statusData.storageFolder}`;
      }
      updateViewerRoleBadge(recentData.viewerRole, recentData.piiMasked);

      if (tbody) {
        const blocks = Array.isArray(recentData.blocks) ? recentData.blocks : [];
        if (blocks.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#91accd;">Chưa có giao dịch nào trên sổ cái. Hãy tạo thử 1 tín hiệu SOS để kiểm chứng.</td></tr>';
        } else {
          tbody.innerHTML = blocks.map((b) => {
            const shortTx = b.txHash ? `${b.txHash.slice(0, 10)}...${b.txHash.slice(-6)}` : '--';
            return `
              <tr>
                <td style="font-family:monospace;color:#00ecf3;font-weight:800;">#${escapeHtml(b.blockNumber)}</td>
                <td style="font-family:monospace;font-weight:700;">${escapeHtml(b.caseId || '--')}</td>
                <td>${escapeHtml(b.actionLabelVi || ACTION_LABELS_VI[b.action] || b.action)}</td>
                <td>${escapeHtml(b.actorLabelVi || '--')}${b.unitLabelVi ? `<br><small style="color:#91accd;">${escapeHtml(b.unitLabelVi)}</small>` : ''}</td>
                <td>${b.durationBadgeVi ? `<span class="bcv-badge duration">${escapeHtml(b.durationBadgeVi)}</span>` : '<span style="color:#64748b;">--</span>'}</td>
                <td style="font-size:11.5px;color:#cbd5e1;">${escapeHtml(formatViTime(b.timestamp))}</td>
                <td style="font-family:monospace;font-size:11.5px;color:#91accd;">${escapeHtml(shortTx)}</td>
                <td>
                  <button type="button" class="bcv-btn is-cyan" style="padding:6px 11px;font-size:11.5px;" data-inspect-tx="${escapeHtml(b.txHash)}">
                    Giải mã
                  </button>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
      return recentData;
    } catch (err) {
      if (statusTextEl) {
        statusTextEl.textContent = 'Không thể tải trạng thái sổ cái: ' + (err.message || err);
      }
      return null;
    }
  }

  function bindEvents() {
    document.getElementById('tabBtnLookup')?.addEventListener('click', () => switchTab('lookup'));
    document.getElementById('tabBtnDecoder')?.addEventListener('click', () => switchTab('decoder'));

    document.getElementById('bcvLookupForm')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = document.getElementById('bcvQueryInput')?.value || '';
      executeLiveLookup(q, { pushHistory: true });
    });

    document.getElementById('btnLoadLatestBlock')?.addEventListener('click', async () => {
      const recent = await loadLedgerStatusAndRecent();
      const first = recent?.blocks?.[0];
      if (!first) {
        alert('Hiện chưa có Block nào trên Sổ cái để xem mẫu.');
        return;
      }
      const input = document.getElementById('bcvQueryInput');
      if (input) input.value = first.txHash;
      switchTab('lookup');
      await executeLiveLookup(first.txHash, { pushHistory: true });
    });

    document.getElementById('btnRefreshRecent')?.addEventListener('click', () => {
      loadLedgerStatusAndRecent();
    });

    document.getElementById('bcvRecentTableBody')?.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-inspect-tx]');
      if (!btn) return;
      const tx = btn.getAttribute('data-inspect-tx');
      if (!tx) return;
      const input = document.getElementById('bcvQueryInput');
      if (input) input.value = tx;
      switchTab('lookup');
      executeLiveLookup(tx, { pushHistory: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // File upload & Drag-Drop Decoder
    const dropZone = document.getElementById('bcvDropZone');
    const fileInput = document.getElementById('bcvFileInput');
    const rawArea = document.getElementById('bcvRawJsonInput');
    const fileLabel = document.getElementById('bcvSelectedFileLabel');

    const handleSelectedFile = (file) => {
      if (!file) return;
      if (fileLabel) fileLabel.textContent = `Đã nạp tệp: ${file.name} (${file.size.toLocaleString('vi-VN')} bytes)`;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        if (rawArea) rawArea.value = text;
        executeDossierDecodeAndAudit(text);
      };
      reader.readAsText(file, 'utf-8');
    };

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        fileInput?.click();
      }
    });
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      handleSelectedFile(file);
    });
    dropZone?.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      dropZone.classList.add('is-dragover');
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('is-dragover');
    });
    dropZone?.addEventListener('drop', (ev) => {
      ev.preventDefault();
      dropZone.classList.remove('is-dragover');
      const file = ev.dataTransfer?.files?.[0];
      handleSelectedFile(file);
    });

    document.getElementById('btnDecodeJson')?.addEventListener('click', () => {
      executeDossierDecodeAndAudit(rawArea?.value || '');
    });

    document.getElementById('btnClearDecoder')?.addEventListener('click', () => {
      if (rawArea) rawArea.value = '';
      if (fileInput) fileInput.value = '';
      if (fileLabel) {
        fileLabel.textContent = 'Hỗ trợ tệp Biên bản Pháp lý (.JSON) hoặc mảng JSON các Block — xử lý trực tiếp bằng WebCrypto SHA-256';
      }
    });

    document.getElementById('btnSimulateTamper')?.addEventListener('click', async () => {
      let baseText = rawArea?.value?.trim() || '';
      if (!baseText && currentExportableJson) {
        baseText = JSON.stringify(currentExportableJson, null, 2);
      }
      if (!baseText) {
        alert('Hãy tải một tệp .JSON hoặc tra cứu 1 ca bất kỳ trước, sau đó bấm nút này để thử sửa 1 ký tự.');
        return;
      }
      try {
        const obj = JSON.parse(baseText);
        const list = Array.isArray(obj) ? obj : (obj.lifecycleBlocks || obj.blocks || []);
        const target = list[list.length - 1] || obj;
        if (target?.payload?.data && typeof target.payload.data === 'object') {
          if (target.payload.data.responseTimeSeconds !== undefined) {
            target.payload.data.responseTimeSeconds = Number(target.payload.data.responseTimeSeconds) + 999;
          } else {
            target.payload.data._tamperedNote = 'Sửa trái phép 1 trường dữ liệu';
          }
        } else if (target && typeof target === 'object') {
          target.txHash = '0x' + 'f'.repeat(64);
        }
        const mutatedText = JSON.stringify(obj, null, 2);
        if (rawArea) rawArea.value = mutatedText;
        switchTab('decoder');
        await executeDossierDecodeAndAudit(mutatedText);
      } catch (err) {
        alert('Nội dung JSON hiện tại không hợp lệ: ' + err.message);
      }
    });

    document.getElementById('btnPrintDossier')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnDownloadCurrentJson')?.addEventListener('click', () => {
      if (!currentExportableJson) return;
      const caseId = currentExportableJson.incidentId || currentExportableJson.processSummary?.caseId || 'BLOCK';
      const blob = new Blob([JSON.stringify(currentExportableJson, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HoSo_PhapLy_ChuoiKhoi_${caseId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });

    document.getElementById('btnCopyVerifyLink')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnCopyVerifyLink');
      try {
        await navigator.clipboard.writeText(currentVerifyUrl);
        if (btn) {
          const prev = btn.textContent;
          btn.textContent = '✔ Đã sao chép Link!';
          setTimeout(() => { btn.textContent = prev; }, 1800);
        }
      } catch (_) {
        prompt('Sao chép đường dẫn đối chứng:', currentVerifyUrl);
      }
    });
  }

  async function initPortal() {
    bindEvents();
    await loadLedgerStatusAndRecent();

    const params = new URLSearchParams(window.location.search);
    const initialMode = params.get('mode');
    const initialQuery = (
      params.get('tx') ||
      params.get('q') ||
      params.get('block') ||
      params.get('case') ||
      ''
    ).trim();

    if (initialMode === 'decoder') {
      switchTab('decoder');
    }
    if (initialQuery) {
      const input = document.getElementById('bcvQueryInput');
      if (input) input.value = initialQuery;
      switchTab('lookup');
      await executeLiveLookup(initialQuery, { pushHistory: false });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal);
  } else {
    initPortal();
  }
})();
