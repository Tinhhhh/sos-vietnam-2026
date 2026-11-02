/**
 * SOS Việt Nam 2026 — Cổng Đối Chứng Xác Thực & Phần Mềm Giải Mã Hồ Sơ Chuỗi Khối (Multi-Network + Zero-PII)
 *
 * Capabilities:
 * 1. 4-Network Tiered Visibility Switcher:
 *      - '842026': Sổ Cái Nội Bộ SOS Việt Nam (Full 100% cho Trực ban; che nhẹ SĐT/CCCD cho tra cứu công khai)
 *      - 'NDA'   : Chuỗi Khối Quốc Gia NDAChain (Đối chứng liên ngành · 100% Zero-PII)
 *      - 'OTS'   : Quốc Tế Bitcoin OpenTimestamps (Chứng chỉ nhị phân .ots + PublicAnchor.json · 100% Zero-PII)
 *      - 'POLYGON': Quốc Tế Polygon / Ethereum EVM (Gói Calldata Hex Zero-PII · 100% Zero-PII)
 * 2. Live Ledger Cross-Check (/api/blockchain/lookup) by TxHash, Block #, Commitment Hash, or Case ID.
 * 3. Client-side WebCrypto SHA-256 Deterministic Block Re-Hashing + Server Cross-Verification (/api/blockchain/verify-dossier),
 *    including detached SOSVN-ANCHOR-V1 PublicAnchor.json verification.
 * 4. Live Recent Ledger Explorer (/api/blockchain/recent) synchronized with active network view.
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

  const NETWORK_META = {
    '842026': {
      key: '842026',
      badgeText: '🇻🇳 MẠNG NỘI BỘ (842026) · HIỂN THỊ CHI TIẾT NGHIỆP VỤ',
      noticeHtml:
        '🛡️ <strong>Đang xem Mạng Nội Bộ SOS (Chain 842026):</strong> Cán bộ trực ban đã đăng nhập xem <strong>Full 100% thông tin nghiệp vụ</strong> (Họ tên, SĐT, CCCD, tọa độ GPS, địa chỉ, cán bộ &amp; đơn vị nhận ca); người xem công khai trên cổng nội bộ được xem quy trình tiếng Việt đã che một phần SĐT/CCCD. Bấm sang <strong>NDAChain / Bitcoin OTS / Polygon EVM</strong> ở trên để xem chế độ đối chứng ngoài nội bộ (0% lộ thông tin nhạy cảm).'
    },
    NDA: {
      key: 'NDA',
      badgeText: '🏛️ CHUỖI KHỐI QUỐC GIA NDACHAIN · BẢO MẬT ZERO-PII',
      noticeHtml:
        '🔒 <strong>Đang xem Chuỗi Khối Quốc Gia (NDAChain — Zero-PII):</strong> Mọi thông tin định danh con người, SĐT, CCCD, tọa độ GPS, địa chỉ hẻm và danh tính cán bộ đều được <strong>ẩn bảo mật tuyệt đối (0% rò rỉ)</strong>. Các cơ quan liên ngành vẫn đối chứng độc lập được tính toàn vẹn SHA-256, mã cam kết hồ sơ <code>Case Commitment Hash</code> và thời gian phản ứng / di chuyển từng khâu.'
    },
    OTS: {
      key: 'OTS',
      badgeText: '🌍 QUỐC TẾ BITCOIN OPENTIMESTAMPS (.OTS) · 100% ZERO-PII',
      noticeHtml:
        '🌍 <strong>Đang xem Mạng Quốc Tế Bitcoin (OpenTimestamps — Zero-PII):</strong> Không lộ bất kỳ thông tin cá nhân hay vị trí nào ra quốc tế. Hệ thống đóng dấu mã băm SHA-256 của tệp cam kết <code>PublicAnchor.json</code> lên cụm Lịch Bitcoin toàn cầu — cho phép tải cặp tệp <code>.anchor.json</code> + <code>.ots</code> để kiểm chứng độc lập trên <strong>opentimestamps.org</strong>.'
    },
    POLYGON: {
      key: 'POLYGON',
      badgeText: '🌍 QUỐC TẾ POLYGON / ETHEREUM EVM · CALLDATA ZERO-PII',
      noticeHtml:
        '🌍 <strong>Đang xem Mạng Quốc Tế Polygon / Ethereum EVM (Zero-PII):</strong> Hiển thị gói dữ liệu <code>EVM Calldata Hex</code> chỉ chứa các mã băm cam kết một chiều (<code>caseCommitmentHash</code>, <code>txHash</code>, <code>prevHash</code>, <code>payloadDigest</code>) và thời lượng xử lý quy trình, đảm bảo tuân thủ bảo vệ dữ liệu cá nhân tuyệt đối trên chuỗi công khai.'
    }
  };

  function normalizeNetwork(raw) {
    const up = String(raw || '').trim().toUpperCase();
    if (up === 'NDA' || up === 'NDACHAIN') return 'NDA';
    if (up === 'OTS' || up === 'BITCOIN' || up === 'OPENTIMESTAMPS') return 'OTS';
    if (up === 'POLYGON' || up === 'EVM' || up === 'ETH' || up === 'AMOY') return 'POLYGON';
    return '842026';
  }

  function isZeroPiiNetwork(net) {
    const n = normalizeNetwork(net);
    return n === 'NDA' || n === 'OTS' || n === 'POLYGON';
  }

  let activeMode = 'lookup';
  let activeNetwork = normalizeNetwork(new URLSearchParams(window.location.search).get('network') || '842026');
  let lastLookupQuery = '';
  let lastMatchedTxHash = '';
  let lastMatchedBlockNumber = null;
  let lastCaseCommitmentHash = '';
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

  function shortenHex(hex, head = 10, tail = 6) {
    const s = String(hex || '').trim();
    if (!s) return '--';
    if (s.length <= head + tail + 3) return s;
    return `${s.slice(0, head)}...${s.slice(-tail)}`;
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

  function syncNetworkSwitchUi() {
    const meta = NETWORK_META[activeNetwork] || NETWORK_META['842026'];
    const zeroPii = isZeroPiiNetwork(activeNetwork);

    document.querySelectorAll('[data-bcv-net]').forEach((btn) => {
      const btnNet = normalizeNetwork(btn.getAttribute('data-bcv-net'));
      const isSelected = btnNet === activeNetwork;
      btn.classList.toggle('is-active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    const visBadge = document.getElementById('bcvActiveNetVisibilityBadge');
    if (visBadge) {
      visBadge.className = `bcv-net-visibility-pill ${zeroPii ? 'is-zeropii' : 'is-internal'}`;
      visBadge.textContent = meta.badgeText;
    }

    const notice = document.getElementById('bcvNetworkPrivacyNotice');
    if (notice) {
      notice.className = `bcv-net-privacy-notice ${zeroPii ? 'is-zeropii' : ''}`;
      notice.innerHTML = meta.noticeHtml;
    }

    const caseColHdr = document.getElementById('bcvRecentCaseColHeader');
    if (caseColHdr) {
      caseColHdr.textContent = zeroPii ? 'Cam Kết Hồ Sơ (Zero-PII)' : 'Mã Ca Trực';
    }

    const queryInput = document.getElementById('bcvQueryInput');
    if (queryInput) {
      queryInput.placeholder = zeroPii
        ? 'Nhập TxHash (0x...), Số Block (#102) hoặc Case Commitment Hash (0x...)...'
        : 'Nhập TxHash (0x...), Số Block (#102) hoặc Mã ca (SOS-...)...';
    }
  }

  async function switchNetwork(nextNet) {
    const normalized = normalizeNetwork(nextNet);
    activeNetwork = normalized;
    syncNetworkSwitchUi();

    const zeroPii = isZeroPiiNetwork(activeNetwork);
    const queryInput = document.getElementById('bcvQueryInput');
    if (zeroPii && queryInput && queryInput.value.trim()) {
      const curVal = queryInput.value.trim();
      const isSafeRef = /^#?\d+$/.test(curVal) || /^(0x)?[0-9a-fA-F]{64}$/.test(curVal);
      if (!isSafeRef && (lastMatchedTxHash || lastCaseCommitmentHash)) {
        queryInput.value = lastMatchedTxHash || lastCaseCommitmentHash;
      }
    }

    // Refresh recent blocks table for the newly selected network
    loadLedgerStatusAndRecent();

    // If a report is currently open, re-render it in the newly selected network mode immediately
    const reportCard = document.getElementById('bcvReportCard');
    if (reportCard && !reportCard.hidden) {
      if (activeMode === 'decoder') {
        const rawArea = document.getElementById('bcvRawJsonInput');
        if (rawArea && rawArea.value.trim()) {
          await executeDossierDecodeAndAudit(rawArea.value);
          return;
        }
      }
      const effectiveQuery = zeroPii
        ? (lastMatchedTxHash || (lastMatchedBlockNumber ? `#${lastMatchedBlockNumber}` : lastLookupQuery))
        : (lastLookupQuery || lastMatchedTxHash);
      if (effectiveQuery) {
        await executeLiveLookup(effectiveQuery, { pushHistory: true });
      }
    } else if (window.history && window.history.replaceState) {
      const params = new URLSearchParams(window.location.search);
      params.set('network', activeNetwork);
      if (zeroPii) params.delete('case');
      window.history.replaceState(null, '', `/tra-cuu-blockchain.html?${params.toString()}`);
    }
  }

  /**
   * Offline browser-side cryptographic verification of every block in a dossier JSON.
   * Supports both internal/public dossiers and SOSVN-ANCHOR-V1 PublicAnchor.json Zero-PII files.
   */
  async function verifyDossierOfflineWebCrypto(dossierObj) {
    const t0 = performance.now();

    if (dossierObj && typeof dossierObj === 'object' && dossierObj.protocol === 'SOSVN-ANCHOR-V1') {
      const blkNum = Number(dossierObj.blockNumber) || 0;
      const hasFields = Boolean(
        blkNum > 0 &&
        /^0x[0-9a-fA-F]{64}$/.test(String(dossierObj.txHash || '')) &&
        /^0x[0-9a-fA-F]{64}$/.test(String(dossierObj.caseCommitmentHash || '')) &&
        /^0x[0-9a-fA-F]{64}$/.test(String(dossierObj.payloadDigest || ''))
      );
      const canonicalJson = JSON.stringify(dossierObj, null, 2) + '\n';
      const anchorDigest = await sha256HexBrowser(canonicalJson);
      const perBlock = new Map();
      perBlock.set(blkNum, {
        hasPayload: true,
        isPublicAnchorDoc: true,
        hashMatched: hasFields,
        digestMatched: hasFields,
        prevMatched: true,
        recomputedTxHash: String(dossierObj.txHash || ''),
        recomputedPayloadDigest: anchorDigest
      });
      const elapsedMs = Number((performance.now() - t0).toFixed(2));
      return {
        supported: Boolean(window.crypto && window.crypto.subtle),
        isPublicAnchorDoc: true,
        anchorDigest,
        checkedCount: 1,
        allValid: hasFields,
        corruptedCount: hasFields ? 0 : 1,
        missingPayloadCount: 0,
        elapsedMs,
        perBlock
      };
    }

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

      if (blk.zeroPiiEnforced && !blk.payload) {
        const validCommitment = /^0x[0-9a-fA-F]{64}$/.test(providedTx) && /^0x[0-9a-fA-F]{64}$/.test(String(blk.caseCommitmentHash || ''));
        if (!validCommitment) {
          allValid = false;
          corruptedCount += 1;
        }
        perBlock.set(blockNumber, {
          hasPayload: true,
          isZeroPiiCommitment: true,
          hashMatched: validCommitment,
          digestMatched: true,
          prevMatched: true,
          recomputedTxHash: providedTx,
          recomputedPayloadDigest: providedDigest
        });
        continue;
      }

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

  function updateViewerRoleBadge(role, piiMasked, zeroPiiEnforced) {
    const el = document.getElementById('bcvViewerRoleBadge');
    if (!el) return;
    if (zeroPiiEnforced || isZeroPiiNetwork(activeNetwork)) {
      el.className = 'bcv-role-tag is-zeropii';
      el.textContent = '🔒 Chế độ Mạng Ngoài / Quốc Tế (Bảo mật Zero-PII · 0% lộ dữ liệu cá nhân)';
    } else if (role === 'officer' || piiMasked === false) {
      el.className = 'bcv-role-tag is-officer';
      el.textContent = '👮 Chế độ Cán bộ Trực ban (Hiển thị Full 100% dữ liệu nghiệp vụ nội bộ)';
    } else {
      el.className = 'bcv-role-tag';
      el.textContent = '🌐 Chế độ Tra cứu Công khai Nội bộ (Đã che bảo mật SĐT/CCCD công dân)';
    }
  }

  function renderGlobalAnchorBox({
    publicAnchor,
    anchorDocUrl,
    otsDownloadUrl,
    matchedBlockNumber,
    matchedTxHash,
    networkView
  }) {
    const box = document.getElementById('bcvGlobalAnchorBox');
    if (!box) return;
    if (!publicAnchor) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }

    const net = normalizeNetwork(networkView || activeNetwork);
    const zeroPii = isZeroPiiNetwork(net);
    const blkNum = matchedBlockNumber || publicAnchor.blockNumber || '';
    const effectiveAnchorUrl = anchorDocUrl || (blkNum ? `/api/blockchain/anchor-doc/${encodeURIComponent(blkNum)}?download=1` : '#');
    const effectiveOtsUrl = otsDownloadUrl || (blkNum ? `/api/blockchain/ots/${encodeURIComponent(blkNum)}` : '#');

    box.hidden = false;

    if (!zeroPii) {
      box.className = 'bcv-global-anchor-box is-compact bcv-no-print';
      box.innerHTML = `
        <div class="bcv-ga-compact-row">
          <div>
            <strong style="color:#38bdf8;">🌍 Neo Đối Chứng Quốc Gia &amp; Quốc Tế (Zero-PII Anchor):</strong>
            <span style="color:#cbd5e1;font-size:12px;">
              Block #${escapeHtml(blkNum)} có mã cam kết một chiều <code>${escapeHtml(shortenHex(publicAnchor.caseCommitmentHash, 14, 8))}</code>
              — sẵn sàng đối chứng trên NDAChain, Bitcoin OpenTimestamps (.OTS) và Polygon EVM mà không lộ PII.
            </span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="bcv-btn is-cyan" style="padding:7px 12px;font-size:12px;" data-quick-switch-net="OTS">
              🌍 Chuyển sang Quốc Tế Bitcoin (.OTS)
            </button>
            <button type="button" class="bcv-btn" style="padding:7px 12px;font-size:12px;" data-quick-switch-net="NDA">
              🏛️ Xem Chuỗi Quốc Gia NDA
            </button>
          </div>
        </div>
      `;
      return;
    }

    const otsInfo = publicAnchor.ots || {};
    const otsStatusHtml = otsInfo.stamped
      ? `<span class="bcv-badge ok">✔ Đã đóng dấu Lịch Bitcoin (${escapeHtml(otsInfo.calendarServerUri || 'OpenTimestamps Pool')} · ${escapeHtml(otsInfo.otsByteLength || 0)} bytes)</span>`
      : `<span class="bcv-badge duration">⚡ Tự động đóng dấu tức thời ngay khi bấm tải tệp .OTS</span>`;

    let networkSpecificHtml = '';
    if (net === 'OTS') {
      networkSpecificHtml = `
        <div class="bcv-ga-howto">
          <strong>🔎 Cách kiểm chứng độc lập trên Chuỗi khối Quốc tế (OpenTimestamps Bitcoin):</strong><br>
          1) Bấm tải <strong>Tệp Cam Kết Gốc (.anchor.json)</strong> — tệp này chỉ chứa mã băm SHA-256, hoàn toàn không có tên/SĐT/tọa độ.<br>
          2) Bấm tải <strong>Chứng Chỉ Nhị Phân Bitcoin (.ots)</strong> — chứa cây Merkle nối từ tệp <code>.anchor.json</code> lên máy chủ lịch Bitcoin quốc tế.<br>
          3) Mở <strong>https://opentimestamps.org</strong>, kéo thả cả 2 tệp vào khung Verify để xác nhận dấu thời gian toàn cầu.
        </div>
      `;
    } else if (net === 'POLYGON') {
      networkSpecificHtml = `
        <div class="bcv-ga-calldata">
          <div style="font-size:11.5px;color:#93c5fd;font-weight:700;margin-bottom:4px;">
            📦 Gói Dữ Liệu EVM Calldata Hex (Zero-PII Smart Contract Payload · Trạng thái: ${escapeHtml(publicAnchor.polygon?.status || 'COMMITMENT_READY')}):
          </div>
          <code>${escapeHtml(publicAnchor.evmCalldataHex || '')}</code>
        </div>
      `;
    } else if (net === 'NDA') {
      networkSpecificHtml = `
        <div class="bcv-ga-howto">
          <strong>🏛️ Cơ chế Đối chứng Liên ngành Quốc gia (NDAChain Zero-PII):</strong>
          Cơ quan kiểm tra liên ngành đối chiếu <code>Case Commitment Hash</code> và chuỗi <code>TxHash → PrevHash</code> của các bước quy trình để giám sát thời gian phản ứng / di chuyển SLA mà không làm lộ danh tính người báo tin hay cán bộ tác chiến.
        </div>
      `;
    }

    box.className = 'bcv-global-anchor-box is-expanded';
    box.innerHTML = `
      <div class="bcv-ga-head">
        <div>
          <div class="bcv-ga-title">
            ${net === 'NDA'
              ? '🏛️ BẰNG CHỨNG CAM KẾT LIÊN NGÀNH QUỐC GIA (NDACHAIN ZERO-PII)'
              : (net === 'POLYGON'
                ? '🌍 BẰNG CHỨNG CAM KẾT QUỐC TẾ POLYGON / ETHEREUM EVM (ZERO-PII)'
                : '🌍 BẰNG CHỨNG ĐỐI CHỨNG QUỐC TẾ BITCOIN OPENTIMESTAMPS (.OTS · ZERO-PII)')}
          </div>
          <div class="bcv-ga-sub">
            Giao thức <code>${escapeHtml(publicAnchor.protocol || 'SOSVN-ANCHOR-V1')}</code> · Block <strong>#${escapeHtml(blkNum)}</strong> · Cam kết bảo vệ dữ liệu: <strong>0% PII / 0% GPS</strong>
          </div>
        </div>
        <div>${otsStatusHtml}</div>
      </div>

      <div class="bcv-ga-kv-grid">
        <div class="bcv-ga-kv">
          <span>Cam kết Hồ sơ 1 chiều (Case Commitment Hash)</span>
          <code>${escapeHtml(publicAnchor.caseCommitmentHash || '')}</code>
        </div>
        <div class="bcv-ga-kv">
          <span>Mã băm Tệp Neo Quốc tế SHA-256 (Anchor Digest)</span>
          <code>${escapeHtml(publicAnchor.anchorDigestHex || '')}</code>
        </div>
        <div class="bcv-ga-kv">
          <span>Mã Giao dịch Chuỗi khối (Canonical TxHash)</span>
          <code>${escapeHtml(matchedTxHash || publicAnchor.txHash || '')}</code>
        </div>
        <div class="bcv-ga-kv">
          <span>Mã băm Dữ liệu Nghiệp vụ (Payload Digest)</span>
          <code>${escapeHtml(publicAnchor.payloadDigest || '')}</code>
        </div>
      </div>

      ${networkSpecificHtml}

      <div class="bcv-action-bar bcv-no-print" style="margin-top:12px;">
        <a href="${escapeHtml(effectiveAnchorUrl)}" download class="bcv-btn is-gold" id="btnBcvDownloadAnchorDoc">
          📥 1. Tải Tệp Cam Kết Zero-PII (.anchor.json)
        </a>
        <a href="${escapeHtml(effectiveOtsUrl)}" download class="bcv-btn is-cyan" id="btnBcvDownloadOts">
          ⛓️ 2. Tải Chứng Chỉ Quốc Tế Bitcoin (.ots)
        </a>
        <button type="button" class="bcv-btn" id="btnBcvRestampOts" data-restamp-block="${escapeHtml(blkNum)}">
          ⚡ Đóng Dấu / Làm Mới Lịch Bitcoin (.OTS)
        </button>
        <a href="https://opentimestamps.org" target="_blank" rel="noopener" class="bcv-btn" id="btnBcvOpenOtsOrg">
          🌍 3. Kiểm Chứng Tại OpenTimestamps.org ↗
        </a>
        <button type="button" class="bcv-btn" data-quick-switch-net="842026">
          🇻🇳 Chuyển Về Mạng Nội Bộ (Xem Chi Tiết Nghiệp Vụ)
        </button>
      </div>
    `;
  }

  function renderProcessSummaryCards(ps) {
    const grid = document.getElementById('bcvProcessSummaryGrid');
    if (!grid) return;
    if (!ps) {
      grid.innerHTML = '<div class="bcv-metric-card"><div class="bcv-metric-sub">Không có dữ liệu tóm tắt quy trình.</div></div>';
      return;
    }

    const zeroPii = Boolean(ps.zeroPiiEnforced || isZeroPiiNetwork(activeNetwork));
    const rep = ps.reporter || {};
    const off = ps.officer || {};
    const ts = ps.timestamps || {};
    const dur = ps.durations || {};
    const rout = ps.routing || {};
    const res = ps.resolution || {};

    if (zeroPii) {
      grid.innerHTML = `
        <div class="bcv-metric-card is-zeropii-card">
          <div class="bcv-metric-label">1. Định Danh Hồ Sơ &amp; Người Báo (Zero-PII)</div>
          <div class="bcv-metric-primary">🔒 Đã Ẩn Bảo Mật Trên Mạng Ngoài</div>
          <div class="bcv-metric-sub">
            • Cam kết hồ sơ: <code>${escapeHtml(shortenHex(ps.caseCommitmentHash, 14, 10))}</code><br>
            • Họ tên / SĐT / CCCD: <strong>🔒 Không công bố ra quốc tế</strong><br>
            • Kênh xác thực: ${escapeHtml(rep.channelLabelVi || 'Cam kết mật mã SHA-256')}<br>
            • Bảo vệ dữ liệu: <strong>Nghị định 13/2023/NĐ-CP (0% lộ PII)</strong>
          </div>
        </div>

        <div class="bcv-metric-card is-zeropii-card">
          <div class="bcv-metric-label">2. Tọa Độ GPS &amp; Địa Chỉ Hiện Trường (Zero-GPS)</div>
          <div class="bcv-metric-primary">🔒 Đã Khóa Tọa Độ Nội Bộ</div>
          <div class="bcv-metric-sub">
            • Tọa độ vĩ độ/kinh độ: <strong>🔒 Đã ẩn trên mạng quốc tế</strong><br>
            • Địa chỉ chi tiết: <strong>🔒 Chỉ hiển thị trên Mạng Nội Bộ 842026</strong><br>
            • Số lần chuyển vượt cấp: <strong>${escapeHtml(rout.escalatedCount || 0)} lần</strong><br>
            • Tổng số khối trong hồ sơ: <strong>${escapeHtml(ps.totalBlocksInCase || 0)} Block</strong>
          </div>
        </div>

        <div class="bcv-metric-card is-zeropii-card">
          <div class="bcv-metric-label">3. Lực Lượng &amp; Cán Bộ Xử Lý (Zero-PII)</div>
          <div class="bcv-metric-primary is-cyan">${escapeHtml(off.accepted ? '✔ Đã xác nhận tiếp nhận ca' : '⏳ Đang chờ tiếp nhận')}</div>
          <div class="bcv-metric-sub">
            • Danh tính &amp; cấp bậc cán bộ: <strong>🔒 Bảo mật lực lượng nội bộ</strong><br>
            • SĐT &amp; tài khoản trực chiến: <strong>🔒 Đã ẩn bảo mật</strong><br>
            • Trạng thái điều phối: <strong>${escapeHtml(off.dispatchChannelLabelVi || '--')}</strong><br>
            ${off.etaMinutes ? `• Dự kiến tiếp cận (ETA): <strong>${escapeHtml(off.etaMinutes)} phút</strong>` : '• Đối chứng công khai tiến độ thời gian ở mục 4–6'}
          </div>
        </div>

        <div class="bcv-metric-card">
          <div class="bcv-metric-label">4. Thời Gian Tiếp Nhận (SLA Phản Ứng Công Khai)</div>
          <div class="bcv-metric-primary is-green">${escapeHtml(dur.responseTimeTextVi || formatDurationVi(dur.responseTimeSeconds))}</div>
          <div class="bcv-metric-sub">
            • Giờ niêm phong báo tin: <strong>${escapeHtml(formatViTime(ts.triggeredAt))}</strong><br>
            • Giờ niêm phong nhận ca: <strong>${escapeHtml(formatViTime(ts.dispatchedAt))}</strong><br>
            ${ts.escalatedAt ? `• Giờ chuyển cấp: ${escapeHtml(formatViTime(ts.escalatedAt))}` : '• Minh bạch 100% mốc thời gian xử lý'}
          </div>
        </div>

        <div class="bcv-metric-card">
          <div class="bcv-metric-label">5. Thời Gian Di Chuyển Tới Hiện Trường (SLA)</div>
          <div class="bcv-metric-primary is-cyan">${escapeHtml(dur.travelTimeTextVi || formatDurationVi(dur.travelTimeSeconds))}</div>
          <div class="bcv-metric-sub">
            ${ts.approachingAt ? `• Giờ áp sát (&lt;300m): ${escapeHtml(formatViTime(ts.approachingAt))}<br>` : ''}
            • Giờ có mặt hiện trường: <strong>${escapeHtml(formatViTime(ts.arrivedAt))}</strong><br>
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
            • Trạng thái quy trình: <strong>${escapeHtml(ps.currentStageLabelVi || '--')}</strong>
          </div>
        </div>
      `;
      return;
    }

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
      const zeroPiiStep = Boolean(step.zeroPiiEnforced || isZeroPiiNetwork(activeNetwork));

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

      // Strictly enforce Zero-PII in JSON dump when viewing external networks (never expose rawBlock.payload)
      const cryptoProofDump = zeroPiiStep
        ? {
            protocol: step.publicAnchor?.protocol || 'SOSVN-ANCHOR-V1',
            networkView: step.networkView || activeNetwork,
            zeroPiiEnforced: true,
            blockNumber: blkNum,
            actionCode: step.action,
            sealedAt: step.timestamp,
            caseCommitmentHash: step.caseCommitmentHash || step.publicAnchor?.caseCommitmentHash || '',
            prevHash: step.prevHash,
            txHash: step.txHash || srvAudit?.providedTxHash || '',
            payloadDigest: step.payloadDigest || srvAudit?.providedPayloadDigest || '',
            anchorDigestSha256: step.anchorDigestHex || step.publicAnchor?.anchorDigestHex || '',
            publicAnchorDocument: step.publicAnchor?.publicAnchorDocument || step.data || {}
          }
        : {
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

      const detailsSummaryLabel = zeroPiiStep
        ? `🔐 Xem Gói Cam Kết Quốc Tế Zero-PII (PublicAnchor JSON) của Block #${escapeHtml(blkNum)}`
        : `🔐 Xem mã băm mật mã (TxHash / PrevHash) &amp; Bản ghi JSON gốc của Block #${escapeHtml(blkNum)}`;

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
            <summary>${detailsSummaryLabel}</summary>
            <pre class="bcv-crypto-pre">${escapeHtml(JSON.stringify(cryptoProofDump, null, 2))}</pre>
          </details>
        </article>
      `;
    }).join('');
  }

  function renderQrAndLinks({
    qrSvg,
    verificationPortalUrl,
    explorerCertificateUrl,
    caseId,
    caseCommitmentHash,
    zeroPiiEnforced
  }) {
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
      if (zeroPiiEnforced || isZeroPiiNetwork(activeNetwork)) {
        caseBadge.textContent = caseCommitmentHash
          ? `🔒 Cam kết Zero-PII: ${shortenHex(caseCommitmentHash, 14, 10)}`
          : '🔒 Chế độ Zero-PII';
      } else {
        caseBadge.textContent = caseId ? `Mã hồ sơ: ${caseId}` : '';
      }
    }
    if (rawCertBtn) {
      if (explorerCertificateUrl) {
        rawCertBtn.hidden = false;
        rawCertBtn.href = explorerCertificateUrl;
        rawCertBtn.textContent = (zeroPiiEnforced || isZeroPiiNetwork(activeNetwork))
          ? `📜 Xem Vi Bằng Zero-PII (${activeNetwork}) ↗`
          : '📜 Xem Vi Bằng Raw Block ↗';
      } else {
        rawCertBtn.hidden = true;
      }
    }
  }

  async function executeLiveLookup(queryText, { pushHistory = true } = {}) {
    const q = String(queryText || '').trim();
    if (!q) return;

    if (!isZeroPiiNetwork(activeNetwork)) {
      lastLookupQuery = q;
    } else if (!lastLookupQuery) {
      lastLookupQuery = q;
    }

    const btn = document.getElementById('btnLookupSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang đối chứng Sổ cái...';
    }

    try {
      const res = await fetch(
        `/api/blockchain/lookup?q=${encodeURIComponent(q)}&network=${encodeURIComponent(activeNetwork)}`,
        {
          method: 'GET',
          credentials: 'same-origin',
          headers: buildAuthHeaders()
        }
      );
      const data = await res.json();
      const reportCard = document.getElementById('bcvReportCard');
      const banner = document.getElementById('bcvVerdictBanner');
      const titleEl = document.getElementById('bcvVerdictTitle');
      const detailEl = document.getElementById('bcvVerdictDetail');
      const badgesEl = document.getElementById('bcvVerdictBadges');

      if (reportCard) reportCard.hidden = false;
      const zeroPii = Boolean(data.zeroPiiEnforced || isZeroPiiNetwork(activeNetwork));
      updateViewerRoleBadge(data.viewerRole, data.piiMasked, zeroPii);

      if (!res.ok || !data.found) {
        if (banner) banner.className = 'bcv-verdict-banner is-tampered';
        if (titleEl) titleEl.textContent = '❌ KHÔNG TÌM THẤY MÃ NÀY TRÊN SỔ CÁI HỆ THỐNG';
        if (detailEl) {
          detailEl.textContent = zeroPii
            ? `Mã tra cứu không tồn tại trên Sổ cái (${data.sysConfig?.envName || 'SOS Chain'}). Vui lòng kiểm tra lại TxHash, Số Block hoặc Case Commitment Hash.`
            : `Mã tra cứu "${q}" không tồn tại trên Sổ cái đang vận hành (${data.sysConfig?.envName || 'SOS Chain'}). Vui lòng kiểm tra lại TxHash, Số Block hoặc dùng tab Giải Mã File .JSON nếu hồ sơ thuộc phiên lưu trữ khác.`;
        }
        if (badgesEl) badgesEl.innerHTML = '';
        renderGlobalAnchorBox({ publicAnchor: null });
        renderProcessSummaryCards(null);
        renderDecodedSteps([]);
        renderQrAndLinks({});
        return;
      }

      lastMatchedTxHash = data.matchedTxHash || lastMatchedTxHash;
      lastMatchedBlockNumber = data.matchedBlockNumber || lastMatchedBlockNumber;
      lastCaseCommitmentHash = data.caseCommitmentHash || lastCaseCommitmentHash;

      // Ensure query input never displays a raw internal caseId while in Zero-PII external mode
      const queryInput = document.getElementById('bcvQueryInput');
      if (zeroPii && queryInput) {
        const curVal = queryInput.value.trim();
        const isSafeRef = /^#?\d+$/.test(curVal) || /^(0x)?[0-9a-fA-F]{64}$/.test(curVal);
        if (!isSafeRef && lastMatchedTxHash) {
          queryInput.value = lastMatchedTxHash;
        }
      }

      if (pushHistory && window.history && window.history.replaceState) {
        const params = new URLSearchParams();
        if (data.matchedTxHash) params.set('tx', data.matchedTxHash);
        if (!zeroPii && data.caseId) params.set('case', data.caseId);
        params.set('network', activeNetwork);
        window.history.replaceState(null, '', `/tra-cuu-blockchain.html?${params.toString()}`);
      }

      const allIntact = Boolean(data.chainIntegrity?.allBlocksIntact);
      if (banner) banner.className = `bcv-verdict-banner ${allIntact ? '' : 'is-tampered'}`;
      if (titleEl) {
        if (!allIntact) {
          titleEl.textContent = '❌ CẢNH BÁO: PHÁT HIỆN SAI LỆCH LIÊN KẾT CHUỖI KHỐI TRÊN SỔ CÁI';
        } else if (zeroPii) {
          titleEl.textContent = `✔ ĐỐI CHỨNG CAM KẾT MẬT MÃ THÀNH CÔNG (${activeNetwork}) — CHUỖI KHỐI NGUYÊN VẸN 100% · ZERO-PII`;
        } else {
          titleEl.textContent = '✔ DỮ LIỆU THẬT ĐANG LƯU TRÊN SỔ CÁI HỆ THỐNG — CHUỖI KHỐI NGUYÊN VẸN 100%';
        }
      }
      if (detailEl) {
        const totalInCase = data.processSummary?.totalBlocksInCase || data.blocks?.length || 0;
        if (zeroPii) {
          detailEl.textContent = `Chế độ đối chứng ngoài nội bộ (${data.activeNetworkProfile?.label || activeNetwork}): Đã xác thực hồ sơ cam kết ${shortenHex(data.caseCommitmentHash, 14, 10)} gồm ${totalInCase} Block liên kết SHA-256 liên tục tại Block #${data.matchedBlockNumber} — đảm bảo 0% rò rỉ dữ liệu cá nhân & tọa độ.`;
        } else {
          detailEl.textContent = `Đã đối chứng trực tiếp trên máy chủ (${data.sysConfig?.envName || ''} · Chain ID: ${data.sysConfig?.chainId || ''}): Hồ sơ ${data.caseId} gồm ${totalInCase} Block liên kết mật mã SHA-256 liên tục, khớp tại Block #${data.matchedBlockNumber}.`;
        }
      }
      if (badgesEl) {
        const privacyBadge = zeroPii
          ? '🔒 Chế độ Zero-PII Quốc tế (0% lộ Họ tên / SĐT / GPS / Cán bộ)'
          : (data.piiMasked ? '🔒 SĐT/CCCD đã che bảo mật công khai' : '👮 Hiển thị Full 100% cho Cán bộ Trực ban');
        badgesEl.innerHTML = `
          <span class="bcv-check-pill ${allIntact ? 'ok' : 'fail'}">${allIntact ? '✔ Liên kết PrevHash & TxHash khớp 100%' : '❌ Lỗi liên kết Hash'}</span>
          <span class="bcv-check-pill ok">✔ Đang lưu trên Sổ cái gốc (${escapeHtml(data.sysConfig?.totalBlocks || 0)} Block toàn hệ thống)</span>
          <span class="bcv-check-pill ${zeroPii ? 'ok' : ''}">${escapeHtml(privacyBadge)}</span>
        `;
      }

      currentExportableJson = zeroPii
        ? {
            schemaVersion: '2.2-ZERO-PII-EXTERNAL-DOSSIER',
            networkView: activeNetwork,
            zeroPiiEnforced: true,
            piiMasked: true,
            exportedFrom: 'SOS_VIETNAM_VERIFIER_PORTAL',
            exportedAt: new Date().toISOString(),
            caseCommitmentHash: data.caseCommitmentHash,
            matchedBlockNumber: data.matchedBlockNumber,
            matchedTxHash: data.matchedTxHash,
            verificationPortalUrl: data.verificationPortalUrl,
            publicAnchor: data.publicAnchor,
            processSummary: data.processSummary,
            lifecycleBlocks: data.blocks
          }
        : {
            schemaVersion: data.piiMasked ? '2.1-PUBLIC-REDACTED-VIEW' : '2.1-PROCESS-DOSSIER',
            networkView: '842026',
            zeroPiiEnforced: false,
            piiMasked: Boolean(data.piiMasked),
            exportedFrom: 'SOS_VIETNAM_VERIFIER_PORTAL',
            exportedAt: new Date().toISOString(),
            incidentId: data.caseId,
            caseCommitmentHash: data.caseCommitmentHash,
            matchedBlockNumber: data.matchedBlockNumber,
            matchedTxHash: data.matchedTxHash,
            verificationPortalUrl: data.verificationPortalUrl,
            processSummary: data.processSummary,
            lifecycleBlocks: data.blocks
          };

      const dlBtn = document.getElementById('btnDownloadCurrentJson');
      if (dlBtn) {
        dlBtn.textContent = zeroPii
          ? '💾 Tải Hồ Sơ Cam Kết Zero-PII (.JSON)'
          : (data.piiMasked
            ? '💾 Tải Bản Tra Cứu Công Khai (.JSON - Đã Che SĐT)'
            : '💾 Tải Tệp Hồ Sơ Pháp Lý Chuẩn (.JSON)');
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

      renderGlobalAnchorBox({
        publicAnchor: data.publicAnchor || data.processSummary?.latestPublicAnchor || null,
        anchorDocUrl: data.anchorDocUrl,
        otsDownloadUrl: data.otsDownloadUrl,
        matchedBlockNumber: data.matchedBlockNumber,
        matchedTxHash: data.matchedTxHash,
        networkView: activeNetwork
      });
      renderProcessSummaryCards(data.processSummary);
      renderDecodedSteps(data.processSummary?.steps || [], data.blocks || [], srvAuditMap, new Map());
      renderQrAndLinks({
        qrSvg: data.qrSvg,
        verificationPortalUrl: data.verificationPortalUrl,
        explorerCertificateUrl: data.explorerCertificateUrl,
        caseId: data.caseId,
        caseCommitmentHash: data.caseCommitmentHash,
        zeroPiiEnforced: zeroPii
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
      const banner = document.getElementById('bcvVerdictBanner');
      if (reportCard) reportCard.hidden = false;
      if (banner) banner.className = 'bcv-verdict-banner is-tampered';
      document.getElementById('bcvVerdictTitle').textContent = '❌ TỆP HOẶC NỘI DUNG KHÔNG ĐÚNG ĐỊNH DẠNG JSON';
      document.getElementById('bcvVerdictDetail').textContent = 'Không thể phân tích cú pháp JSON: ' + err.message;
      document.getElementById('bcvVerdictBadges').innerHTML = '';
      renderGlobalAnchorBox({ publicAnchor: null });
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

      // 2. Online Server Ledger cross-verification (aware of activeNetwork)
      const res = await fetch('/api/blockchain/verify-dossier', {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ dossier: parsed, network: activeNetwork })
      });
      const data = await res.json();

      const reportCard = document.getElementById('bcvReportCard');
      const banner = document.getElementById('bcvVerdictBanner');
      const titleEl = document.getElementById('bcvVerdictTitle');
      const detailEl = document.getElementById('bcvVerdictDetail');
      const badgesEl = document.getElementById('bcvVerdictBadges');
      if (reportCard) reportCard.hidden = false;

      const effectiveZeroPii = Boolean(data.zeroPiiEnforced || isZeroPiiNetwork(activeNetwork));
      updateViewerRoleBadge(null, effectiveZeroPii, effectiveZeroPii);

      const isTampered = Boolean(data.tamperDetected || (offlineAudit.checkedCount > 0 && offlineAudit.corruptedCount > 0));
      const isFullyVerified = Boolean(data.verified && offlineAudit.allValid && !isTampered);

      if (banner) {
        banner.className = isTampered
          ? 'bcv-verdict-banner is-tampered'
          : (isFullyVerified ? 'bcv-verdict-banner' : 'bcv-verdict-banner is-warning');
      }
      if (titleEl) {
        titleEl.textContent = isTampered
          ? `❌ ${data.verdictTitleVi || 'PHÁT HIỆN CHỈNH SỬA TRÁP PHÉP TRONG FILE HỒ SƠ'}`
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
              ? (offlineAudit.isPublicAnchorDoc
                ? `✔ Kiểm tra Cam kết Zero-PII & SHA-256 (WebCrypto): Hợp lệ (${offlineAudit.elapsedMs} ms)`
                : `✔ Băm lại SHA-256 Trình duyệt (WebCrypto): Khớp ${offlineAudit.checkedCount}/${offlineAudit.checkedCount} Block (${offlineAudit.elapsedMs} ms)`)
              : `❌ Băm lại SHA-256 Trình duyệt: Sai lệch ${offlineAudit.corruptedCount} Block (${offlineAudit.elapsedMs} ms)`}
          </span>
          <span class="bcv-check-pill ${serverOk ? 'ok' : (isTampered ? 'fail' : '')}" id="bcvOnlineBadge">
            ${serverOk
              ? '✔ Đối chứng Sổ cái Máy chủ: Tồn tại & Trùng khớp 100%'
              : (isTampered ? '❌ Đối chứng Sổ cái Máy chủ: KHÔNG KHỚP BẢN GỐC' : 'ℹ Chưa có trên Sổ cái phiên hiện tại')}
          </span>
          ${effectiveZeroPii ? '<span class="bcv-check-pill ok">🔒 Đang chiếu ở Chế độ Bảo mật Zero-PII</span>' : ''}
        `;
      }

      currentExportableJson = effectiveZeroPii
        ? {
            schemaVersion: '2.2-ZERO-PII-EXTERNAL-DOSSIER',
            networkView: data.networkView || activeNetwork,
            zeroPiiEnforced: true,
            exportedAt: new Date().toISOString(),
            caseCommitmentHash: data.processSummary?.caseCommitmentHash || data.publicAnchor?.caseCommitmentHash || '',
            publicAnchor: data.publicAnchor || data.processSummary?.latestPublicAnchor || null,
            processSummary: data.processSummary
          }
        : parsed;

      const srvMap = new Map();
      (data.blockVerifications || []).forEach((bv) => {
        srvMap.set(Number(bv.blockNumber), bv);
      });

      const rawBlocksList = effectiveZeroPii
        ? []
        : (Array.isArray(parsed) ? parsed : (parsed.lifecycleBlocks || parsed.blocks || [parsed]));

      const latestBlockNum = data.processSummary?.latestBlockNumber || data.publicAnchor?.blockNumber || null;
      const latestTx = data.processSummary?.latestTxHash || data.publicAnchor?.txHash || '';
      if (latestTx) lastMatchedTxHash = latestTx;
      if (latestBlockNum) lastMatchedBlockNumber = latestBlockNum;

      renderGlobalAnchorBox({
        publicAnchor: data.publicAnchor || data.processSummary?.latestPublicAnchor || null,
        anchorDocUrl: data.anchorDocUrl,
        otsDownloadUrl: data.otsDownloadUrl,
        matchedBlockNumber: latestBlockNum,
        matchedTxHash: latestTx,
        networkView: data.networkView || activeNetwork
      });
      renderProcessSummaryCards(data.processSummary);
      renderDecodedSteps(data.processSummary?.steps || [], rawBlocksList, srvMap, offlineAudit.perBlock);
      renderQrAndLinks({
        qrSvg: data.qrSvg,
        verificationPortalUrl: data.verificationPortalUrl,
        explorerCertificateUrl: data.explorerCertificateUrl || (latestTx
          ? `/api/blockchain/explorer/${encodeURIComponent(latestTx)}?network=${encodeURIComponent(data.networkView || activeNetwork)}`
          : ''),
        caseId: effectiveZeroPii ? '' : (data.processSummary?.caseId || parsed.incidentId || ''),
        caseCommitmentHash: data.processSummary?.caseCommitmentHash || data.publicAnchor?.caseCommitmentHash || '',
        zeroPiiEnforced: effectiveZeroPii
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
    const zeroPii = isZeroPiiNetwork(activeNetwork);

    try {
      const [statusRes, recentRes] = await Promise.all([
        fetch('/api/blockchain/status', { credentials: 'same-origin', headers: buildAuthHeaders() }),
        fetch(`/api/blockchain/recent?limit=20&network=${encodeURIComponent(activeNetwork)}`, {
          credentials: 'same-origin',
          headers: buildAuthHeaders()
        })
      ]);
      const statusData = await statusRes.json();
      const recentData = await recentRes.json();

      if (statusTextEl && statusData.ok) {
        statusTextEl.textContent = `${statusData.envName} · Chain ID: ${statusData.chainId} (Canonical: 842026) · Đang xem mạng: ${activeNetwork} · Đã niêm phong: ${statusData.totalBlocks} Block`;
      }
      updateViewerRoleBadge(recentData.viewerRole, recentData.piiMasked, recentData.zeroPiiEnforced);

      if (tbody) {
        const blocks = Array.isArray(recentData.blocks) ? recentData.blocks : [];
        if (blocks.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#91accd;">Chưa có giao dịch nào trên sổ cái. Hãy tạo thử 1 tín hiệu SOS để kiểm chứng.</td></tr>';
        } else {
          tbody.innerHTML = blocks.map((b) => {
            const shortTx = shortenHex(b.txHash, 10, 6);
            const caseOrCommitmentCell = (zeroPii || b.zeroPiiEnforced)
              ? `<span title="${escapeHtml(b.caseCommitmentHash || '')}" style="color:#38bdf8;">🔒 ${escapeHtml(shortenHex(b.caseCommitmentHash, 10, 6))}</span>`
              : escapeHtml(b.caseId || '--');
            const actorCell = (zeroPii || b.zeroPiiEnforced)
              ? `<span style="color:#93c5fd;">🔒 Thực thể ẩn danh (Zero-PII)</span>`
              : `${escapeHtml(b.actorLabelVi || '--')}${b.unitLabelVi ? `<br><small style="color:#91accd;">${escapeHtml(b.unitLabelVi)}</small>` : ''}`;

            return `
              <tr>
                <td style="font-family:monospace;color:#00ecf3;font-weight:800;">#${escapeHtml(b.blockNumber)}</td>
                <td style="font-family:monospace;font-weight:700;">${caseOrCommitmentCell}</td>
                <td>${escapeHtml(b.actionLabelVi || ACTION_LABELS_VI[b.action] || b.action)}</td>
                <td>${actorCell}</td>
                <td>${b.durationBadgeVi ? `<span class="bcv-badge duration">${escapeHtml(b.durationBadgeVi)}</span>` : '<span style="color:#64748b;">--</span>'}</td>
                <td style="font-size:11.5px;color:#cbd5e1;">${escapeHtml(formatViTime(b.timestamp))}</td>
                <td style="font-family:monospace;font-size:11.5px;color:#91accd;">${escapeHtml(shortTx)}</td>
                <td>
                  <button type="button" class="bcv-btn is-cyan" style="padding:6px 11px;font-size:11.5px;" data-inspect-tx="${escapeHtml(b.txHash)}">
                    ${(zeroPii || b.zeroPiiEnforced) ? 'Đối chứng' : 'Giải mã'}
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

    document.getElementById('bcvNetworkSwitchBar')?.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-bcv-net]');
      if (!btn) return;
      const targetNet = btn.getAttribute('data-bcv-net');
      if (targetNet) switchNetwork(targetNet);
    });

    document.getElementById('bcvGlobalAnchorBox')?.addEventListener('click', async (ev) => {
      const quickNetBtn = ev.target.closest('[data-quick-switch-net]');
      if (quickNetBtn) {
        const net = quickNetBtn.getAttribute('data-quick-switch-net');
        if (net) await switchNetwork(net);
        return;
      }

      const restampBtn = ev.target.closest('[data-restamp-block]');
      if (restampBtn) {
        const blkRef = restampBtn.getAttribute('data-restamp-block');
        if (!blkRef) return;
        const origLabel = restampBtn.textContent;
        restampBtn.disabled = true;
        restampBtn.textContent = '⏳ Đang đóng dấu Lịch Bitcoin...';
        try {
          const resp = await fetch(`/api/blockchain/anchor/${encodeURIComponent(blkRef)}?refresh=1`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: buildAuthHeaders()
          });
          const rData = await resp.json();
          if (resp.ok && rData.ok) {
            if (lastMatchedTxHash) {
              await executeLiveLookup(lastMatchedTxHash, { pushHistory: false });
            }
          } else {
            alert('Không thể đóng dấu mới từ máy chủ OpenTimestamps: ' + (rData.error || 'UNKNOWN'));
          }
        } catch (e) {
          alert('Lỗi kết nối khi đóng dấu OpenTimestamps: ' + (e.message || e));
        } finally {
          restampBtn.disabled = false;
          restampBtn.textContent = origLabel;
        }
      }
    });

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
      const isZero = Boolean(currentExportableJson.zeroPiiEnforced || isZeroPiiNetwork(activeNetwork));
      const blkNum = currentExportableJson.matchedBlockNumber || currentExportableJson.publicAnchor?.blockNumber || 'BLOCK';
      const caseId = currentExportableJson.incidentId || currentExportableJson.processSummary?.caseId || 'BLOCK';
      const fileName = isZero
        ? `CamKet_QuocTe_ZeroPII_Block_${blkNum}_${activeNetwork}.json`
        : `HoSo_PhapLy_ChuoiKhoi_${caseId}.json`;
      const blob = new Blob([JSON.stringify(currentExportableJson, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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
    syncNetworkSwitchUi();
    bindEvents();
    await loadLedgerStatusAndRecent();

    const params = new URLSearchParams(window.location.search);
    const initialMode = params.get('mode');
    const initialQuery = (
      params.get('tx') ||
      params.get('q') ||
      params.get('block') ||
      params.get('commitment') ||
      params.get('case') ||
      ''
    ).trim();

    if (initialMode === 'decoder') {
      switchTab('decoder');
    }
    if (initialQuery) {
      const input = document.getElementById('bcvQueryInput');
      if (input) {
        const isSafeRef = /^#?\d+$/.test(initialQuery) || /^(0x)?[0-9a-fA-F]{64}$/.test(initialQuery);
        input.value = (!isZeroPiiNetwork(activeNetwork) || isSafeRef) ? initialQuery : '';
      }
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
