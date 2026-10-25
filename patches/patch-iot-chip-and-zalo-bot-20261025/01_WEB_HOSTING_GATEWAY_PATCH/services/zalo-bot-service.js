/**
 * 📲 Hierarchical Zalo Bot Dispatch & Two-Way Field Acceptance Service
 * SOS Vietnam 2026 — National 2-Tier Command Architecture (34 Provinces / 3,321 Wards)
 *
 * Official Zalo Bot Platform API:
 *   Base URL: https://bot-api.zaloplatforms.com/bot<BOT_TOKEN>/<method>
 *   Supported methods: getMe, sendMessage, setWebhook, deleteWebhook, getUpdates
 *
 * Key Capabilities:
 * 1. 1 Central Zalo Bot (plus optional per-province token override) routing alerts
 *    strictly to bound Zalo Group / Officer `chat_id`s matching { province, ward, agency, level }.
 * 2. Zero-Phone-Number Self-Onboarding via `/ketnoi <MA_DON_VI>` OR natural Vietnamese
 *    `/ketnoi Công an Phường Tân An, Cần Thơ` in 1-1 or Group chat, plus 1-click Web UI
 *    re-assignment (`updateBinding`) when Zalo Group privacy hides group titles.
 * 3. Two-Way Field Acceptance directly on smartphone:
 *    - 1-Tap HMAC-SHA256 signed URL (`GET /api/zalo/quick-accept?id=...&chat=...&sig=...`)
 *    - Direct chat reply `/tn`, `TN`, `TN <MA_SOS>`, or `@Bot Vĩnh Nam TN` (full multi-word
 *      Vietnamese `@BotName` mention support in Zalo Groups) with automatic `from.display_name`
 *      officer name extraction!
 * 4. 3-Minute Unaccepted Nag Reminder & 15-Minute Provincial HQ Escalation
 *    (with configurable Fast Demo Mode: 20s reminder / 45s escalation for live testing).
 */

import crypto from 'crypto';
import { readRuntimeData, writeRuntimeData } from './runtime-data-store.js';

const CONFIG_FILENAME = 'zalo-bot-config.json';
const DEFAULT_ZALO_API_BASE = 'https://bot-api.zaloplatforms.com';

export function stripVietnameseTones(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeGeoSlug(str = '') {
  return stripVietnameseTones(str)
    .toLowerCase()
    .replace(/\b(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran|dac khu|p\.?|x\.?)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeUnitCode(str = '') {
  return stripVietnameseTones(str)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '')
    .trim();
}

/**
 * Strip multi-word Vietnamese `@BotName` mentions in Zalo Group messages
 * (e.g. `@Bot Vĩnh Nam TN`, `@Bot Vĩnh Nam /ketnoi cap_tanan`, `TN @Bot Vĩnh Nam`).
 */
export function stripBotMentions(rawText = '', botDisplayName = '') {
  let text = String(rawText || '').trim();
  if (!text) return '';

  const knownName = String(botDisplayName || '').trim();
  if (knownName) {
    const escapedKnown = knownName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`@${escapedKnown}(?:[,:\\s-]+|$)`, 'gi'), ' ').trim();

    // Tone-insensitive fallback for NFC/NFD differences in Vietnamese Zalo names
    const asciiKnown = stripVietnameseTones(knownName).toLowerCase().trim();
    if (asciiKnown) {
      let asciiCur = stripVietnameseTones(text).toLowerCase();
      let atIdx = asciiCur.indexOf('@' + asciiKnown);
      while (atIdx !== -1) {
        text = (text.slice(0, atIdx) + ' ' + text.slice(atIdx + 1 + asciiKnown.length))
          .replace(/^[,:\s-]+/, '')
          .trim();
        asciiCur = stripVietnameseTones(text).toLowerCase();
        atIdx = asciiCur.indexOf('@' + asciiKnown);
      }
    }
  }

  // Fallback for multi-word @BotName even before `botProfile.name` is fetched:
  // If message starts with `@`, extract trailing command (`/ketnoi ...`, `/tn`, `TN`, `tiếp nhận`, etc.)
  if (text.startsWith('@')) {
    const asciiFull = stripVietnameseTones(text);
    const tailCmdMatch = asciiFull.match(
      /^@[^\n]{1,65}?\s+(\/(?:ketnoi|ket_noi|lienket|pair|huyketnoi|unlink|ngatketnoi|danhsach|trangthai|status|start|help|huongdan|batdau|tn|tiepnhan|nhanca)\b[\s\S]*|(?:ketnoi|ket_noi|lienket|pair)\s+[\s\S]+|(?:huyketnoi|unlink|ngatketnoi|danhsach|trangthai|status|start|help|huongdan|batdau)\b|(?:tn|tiep\s*nhan|nhan\s*ca)(?:\s+#?[a-zA-Z0-9-]+)?)\s*$/i
    );
    if (tailCmdMatch) {
      const suffixLen = tailCmdMatch[1].length;
      text = text.slice(text.length - suffixLen).trim();
    } else {
      // Single-token @mention fallback (e.g. `@BotSOS TN`)
      text = text.replace(/^(?:@\S+[,:\s]+)+/g, '').trim();
    }
  }

  // Strip trailing single-word `@Bot...` if officer typed `TN @BotSOS`
  text = text.replace(/\s+@bot\S*$/i, '').trim();
  return text;
}

function isGenericPlaceholderName(name = '') {
  const s = stripVietnameseTones(String(name || '')).toLowerCase().trim();
  if (!s) return true;
  return (
    s === 'dang cap nhat' ||
    s === 'can bo' ||
    s === 'can bo zalo' ||
    s === 'can bo truc ban' ||
    s === 'can bo truc zalo' ||
    s === 'can bo truc ban zalo' ||
    s.startsWith('truc ban ') ||
    s.startsWith('si quan truc ban') ||
    s.startsWith('bac si truc')
  );
}

function extractIncidentIdFromText(text = '') {
  const m = String(text || '').match(/#?((?:SOS|IOT)-[A-Z0-9]{4,}-[A-Z0-9]+)/i);
  return m ? m[1].toUpperCase() : '';
}

/**
 * Built-in ready-to-test unit presets so any station or test Zalo group can pair
 * immediately without needing officer phone numbers.
 */
export const PRESET_ZALO_UNITS = [
  {
    unitCode: 'cap_tanan',
    unitName: 'Công An Phường Tân An, TP. Cần Thơ',
    agency: 'police',
    agencyLabel: 'Công An Cấp Xã/Phường',
    level: 'ward',
    province: 'Cần Thơ',
    ward: 'Phường Tân An',
    defaultOfficerName: 'Cán bộ trực ban CA Phường Tân An',
    defaultOfficerRank: 'Cán bộ',
    defaultPhone: '02923820113'
  },
  {
    unitCode: 'cap_ninhkieu',
    unitName: 'Công An Phường Ninh Kiều, TP. Cần Thơ',
    agency: 'police',
    agencyLabel: 'Công An Cấp Xã/Phường',
    level: 'ward',
    province: 'Cần Thơ',
    ward: 'Phường Ninh Kiều',
    defaultOfficerName: 'Cán bộ trực ban CA Phường Ninh Kiều',
    defaultOfficerRank: 'Đại úy',
    defaultPhone: '02923820113'
  },
  {
    unitCode: 'cap_longtuyen',
    unitName: 'Công An Phường Long Tuyền, TP. Cần Thơ',
    agency: 'police',
    agencyLabel: 'Công An Cấp Xã/Phường',
    level: 'ward',
    province: 'Cần Thơ',
    ward: 'Phường Long Tuyền',
    defaultOfficerName: 'Cán bộ trực ban CA Phường Long Tuyền',
    defaultOfficerRank: 'Thiếu tá',
    defaultPhone: '02923882113'
  },
  {
    unitCode: 'cap_cairang',
    unitName: 'Công An Phường Cái Răng, TP. Cần Thơ',
    agency: 'police',
    agencyLabel: 'Công An Cấp Xã/Phường',
    level: 'ward',
    province: 'Cần Thơ',
    ward: 'Phường Cái Răng',
    defaultOfficerName: 'Cán bộ trực ban CA Phường Cái Răng',
    defaultOfficerRank: 'Thiếu tá',
    defaultPhone: '02923916113'
  },
  {
    unitCode: 'csgt_cantho',
    unitName: 'Phòng Cảnh Sát Giao Thông (PC08) - Công An TP. Cần Thơ',
    agency: 'csgt',
    agencyLabel: 'Cảnh Sát Giao Thông (CSGT)',
    level: 'province',
    province: 'Cần Thơ',
    ward: '',
    defaultOfficerName: 'Trực ban Đội CSGT Cần Thơ',
    defaultOfficerRank: 'Thiếu tá',
    defaultPhone: '02923822247'
  },
  {
    unitCode: 'pccc_cantho',
    unitName: 'Phòng Cảnh Sát PCCC & CNCH (PC07) - Công An TP. Cần Thơ',
    agency: 'fire',
    agencyLabel: 'Cảnh Sát PCCC & CNCH',
    level: 'province',
    province: 'Cần Thơ',
    ward: '',
    defaultOfficerName: 'Trực ban PCCC & CNCH Cần Thơ',
    defaultOfficerRank: 'Đại úy',
    defaultPhone: '114'
  },
  {
    unitCode: 'capcuu_cantho',
    unitName: 'Trung Tâm Cấp Cứu Y Tế 115 TP. Cần Thơ',
    agency: 'hospital',
    agencyLabel: 'Cấp Cứu Y Tế 115',
    level: 'province',
    province: 'Cần Thơ',
    ward: '',
    defaultOfficerName: 'Bác sĩ trực 115 Cần Thơ',
    defaultOfficerRank: 'Bác sĩ',
    defaultPhone: '115'
  },
  {
    unitCode: 'chihuy_cantho',
    unitName: 'Trung Tâm Chỉ Huy Công An TP. Cần Thơ (Tuyến Tỉnh/TP)',
    agency: 'all',
    agencyLabel: 'Chỉ Huy Cấp Tỉnh/Thành Phố (Nhận Leo Thang)',
    level: 'province',
    province: 'Cần Thơ',
    ward: '',
    defaultOfficerName: 'Trực ban Chỉ huy Công an TP. Cần Thơ',
    defaultOfficerRank: 'Thượng tá',
    defaultPhone: '0693672212'
  },
  {
    unitCode: 'tongtrucban',
    unitName: 'Tổng Trực Ban Trung Tâm Chỉ Huy Quốc Gia (Giám Sát Toàn Quốc)',
    agency: 'all',
    agencyLabel: 'Chỉ Huy Toàn Quốc',
    level: 'national',
    province: 'Toàn Quốc',
    ward: '',
    defaultOfficerName: 'Sĩ quan Trực ban Tổng hợp',
    defaultOfficerRank: 'Thượng tá',
    defaultPhone: '113'
  }
];

function escapeHtml(raw = '') {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createZaloBotService({
  getAgencyAccounts = () => ({}),
  getStationsList = () => [],
  getIncidentById = () => null,
  getActiveIncidents = () => [],
  acceptIncidentFromZalo = () => ({ ok: false, error: 'Not wired' }),
  escalateIncidentFromTimer = null
} = {}) {
  const secretSeed = String(
    process.env.SOS_TOKEN_SECRET ||
    process.env.SOS_MASTER_SECRET ||
    process.env.ZALO_BOT_TOKEN ||
    'sos-vietnam-2026-zalo-bot-hmac-seed'
  );
  const deterministicWebhookSecret = crypto
    .createHmac('sha256', secretSeed)
    .update('zalo-webhook-secret-v1')
    .digest('hex')
    .slice(0, 40);
  const deterministicHmacSecret = crypto
    .createHmac('sha256', secretSeed)
    .update('zalo-quick-accept-hmac-v1')
    .digest('hex');

  const defaultConfig = {
    enabled: true,
    botToken: process.env.ZALO_BOT_TOKEN || '',
    apiBaseUrl: process.env.ZALO_BOT_API_BASE || DEFAULT_ZALO_API_BASE,
    publicBaseUrl: process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '',
    webhookSecret: deterministicWebhookSecret,
    hmacSecret: deterministicHmacSecret,
    webhookActive: false,
    webhookUrl: '',
    botProfile: null,
    demoFastMode: false,
    reminderSeconds: 180,     // Standard: 3 minutes (180s)
    escalationSeconds: 900,   // Standard: 15 minutes (900s)
    demoReminderSeconds: 20,  // Fast Demo Mode: 20 seconds
    demoEscalationSeconds: 45,// Fast Demo Mode: 45 seconds
    provinceBotTokens: {},    // Optional override: { "can tho": "<TOKEN>" }
    customUnits: {},          // Dynamically generated unit codes from UI
    bindings: [],             // [{ chatId, chatTitle, chatType, senderName, officerName, unitCode, unitName, agency, level, province, ward, linkedAt, enabled }]
    outboxLog: []             // Last 60 outbound / simulated messages for audit & live UI preview
  };

  const loaded = readRuntimeData(CONFIG_FILENAME, defaultConfig);
  const state = {
    ...defaultConfig,
    ...(loaded && typeof loaded === 'object' ? loaded : {}),
    provinceBotTokens: (loaded && typeof loaded.provinceBotTokens === 'object' && loaded.provinceBotTokens) ? loaded.provinceBotTokens : {},
    customUnits: (loaded && typeof loaded.customUnits === 'object' && loaded.customUnits) ? loaded.customUnits : {},
    bindings: Array.isArray(loaded?.bindings) ? loaded.bindings : [],
    outboxLog: Array.isArray(loaded?.outboxLog) ? loaded.outboxLog.slice(-60) : []
  };

  if (process.env.ZALO_BOT_TOKEN && !state.botToken) {
    state.botToken = process.env.ZALO_BOT_TOKEN.trim();
  }
  if (!state.webhookSecret || state.webhookSecret.length < 16) {
    state.webhookSecret = deterministicWebhookSecret;
  }
  if (!state.hmacSecret || state.hmacSecret.length < 24) {
    state.hmacSecret = deterministicHmacSecret;
  }

  // Runtime ephemeral maps
  const reminderTimers = new Map();        // incidentId -> Timeout
  const chatLatestIncident = new Map();    // chatId -> incidentId
  const incidentNotifiedChats = new Map(); // incidentId -> Set<chatId>
  const processedMessageIds = new Set();   // Deduplicate webhook/polling replays
  let pollingActive = false;
  let pollingAbortController = null;
  let pollingTimer = null;

  function persistState() {
    try {
      state.outboxLog = state.outboxLog.slice(-60);
      writeRuntimeData(CONFIG_FILENAME, state);
    } catch (err) {
      console.warn('[ZALO-BOT] Không thể lưu cấu hình:', err.message);
    }
  }

  function recordOutboxEntry(entry) {
    state.outboxLog.push({
      id: 'zmsg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      ...entry
    });
    if (state.outboxLog.length > 60) {
      state.outboxLog = state.outboxLog.slice(-60);
    }
    persistState();
  }

  function getEffectiveReminderMs() {
    const sec = state.demoFastMode
      ? Math.max(5, Number(state.demoReminderSeconds) || 20)
      : Math.max(15, Number(state.reminderSeconds) || 180);
    return sec * 1000;
  }

  function getEffectiveEscalationMs() {
    const sec = state.demoFastMode
      ? Math.max(15, Number(state.demoEscalationSeconds) || 45)
      : Math.max(60, Number(state.escalationSeconds) || 900);
    return sec * 1000;
  }

  function maskToken(token) {
    const clean = String(token || '').trim();
    if (!clean) return '';
    if (clean.length <= 10) return '••••••••';
    return `${clean.slice(0, 6)}••••••••${clean.slice(-4)}`;
  }

  function resolveTokenForProvince(province = '') {
    const slug = normalizeGeoSlug(province);
    if (slug && state.provinceBotTokens && state.provinceBotTokens[slug]) {
      return String(state.provinceBotTokens[slug]).trim();
    }
    return String(state.botToken || '').trim();
  }

  function signQuickAcceptWithSecret(incidentId, chatId = '', secret = state.hmacSecret) {
    return crypto
      .createHmac('sha256', secret)
      .update(`${incidentId}|${chatId}`)
      .digest('hex')
      .slice(0, 32);
  }

  function signQuickAccept(incidentId, chatId = '') {
    return signQuickAcceptWithSecret(incidentId, chatId, state.hmacSecret);
  }

  function verifyQuickAccept(incidentId, chatId = '', signature = '') {
    if (!incidentId || !signature) return false;
    const candidates = [state.hmacSecret, deterministicHmacSecret].filter(Boolean);
    for (const sec of candidates) {
      const expected = signQuickAcceptWithSecret(incidentId, chatId, sec);
      const a = Buffer.from(String(signature));
      const b = Buffer.from(String(expected));
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    }
    return false;
  }

  function resolvePublicOrigin(fallbackOrigin = '') {
    const configured = String(state.publicBaseUrl || process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || fallbackOrigin || '').trim();
    if (configured) return configured.replace(/\/+$/, '');
    return 'https://sos-vietnam-2026.onrender.com';
  }

  function buildQuickAcceptUrl(incidentId, chatId = '', fallbackOrigin = '') {
    const base = resolvePublicOrigin(fallbackOrigin);
    const sig = signQuickAccept(incidentId, chatId);
    const params = new URLSearchParams({
      id: incidentId,
      chat: String(chatId || ''),
      sig
    });
    return `${base}/api/zalo/quick-accept?${params.toString()}`;
  }

  function getBotMentionHint(chatType = 'GROUP') {
    const botName = String(state.botProfile?.name || '').trim();
    if (chatType === 'PRIVATE') {
      return 'Gõ TN (hoặc /tn)';
    }
    if (botName) {
      return `Gõ /tn  (hoặc @${botName} TN)`;
    }
    return 'Gõ /tn  (hoặc @TênBot TN)';
  }

  /**
   * Look up a unit definition from:
   * 1. Built-in presets (`cap_tanan`, `csgt_cantho`, `pccc_cantho`, `chihuy_cantho`, ...)
   * 2. Custom units created via UI (`state.customUnits`)
   * 3. Dispatcher accounts (`AGENCY_ACCOUNTS`)
   * 4. Nationwide 3,717 stations directory (`STATIONS_DB`)
   */
  function resolveUnitByCode(rawCode = '') {
    const code = normalizeUnitCode(rawCode);
    if (!code) return null;

    const preset = PRESET_ZALO_UNITS.find(u => normalizeUnitCode(u.unitCode) === code);
    if (preset) return { ...preset };

    if (state.customUnits && state.customUnits[code]) {
      return { ...state.customUnits[code], unitCode: code };
    }

    const accounts = getAgencyAccounts() || {};
    for (const acc of Object.values(accounts)) {
      if (!acc || !acc.username) continue;
      if (normalizeUnitCode(acc.username) === code) {
        const effectiveLevel = acc.level || ((acc.agency === 'csgt' || acc.agency === 'fire' || acc.agency === 'hospital') ? 'province' : (acc.ward ? 'ward' : 'province'));
        return {
          unitCode: code,
          unitName: acc.unitName || acc.agencyName || `Đơn vị ${acc.username}`,
          agency: acc.agency || 'police',
          agencyLabel: acc.agencyName || 'Đơn vị Trực ban',
          level: acc.username === 'admin' ? 'national' : effectiveLevel,
          province: acc.province || 'Cần Thơ',
          ward: acc.ward || '',
          defaultOfficerName: (acc.officerName && !isGenericPlaceholderName(acc.officerName)) ? acc.officerName : '',
          defaultOfficerRank: (acc.officerRank && acc.officerRank !== 'Đang cập nhật') ? acc.officerRank : 'Cán bộ',
          defaultPhone: (acc.officerPhone && acc.officerPhone !== 'Đang cập nhật') ? acc.officerPhone : '113'
        };
      }
    }

    const stations = getStationsList() || [];
    for (const st of stations) {
      if (!st) continue;
      const stCode = normalizeUnitCode(st.id || '');
      if (stCode && stCode === code) {
        return {
          unitCode: code,
          unitName: st.name || 'Đơn vị Trực ban',
          agency: st.type || st.agency || 'police',
          agencyLabel: st.name || 'Đơn vị Trực ban',
          level: st.ward ? 'ward' : 'province',
          province: st.province || st.region || 'Cần Thơ',
          ward: st.ward || '',
          defaultOfficerName: (st.officerName && !isGenericPlaceholderName(st.officerName)) ? st.officerName : '',
          defaultOfficerRank: st.officerRank || 'Cán bộ',
          defaultPhone: st.phone || '113'
        };
      }
    }

    return null;
  }

  /**
   * Smart natural-language Vietnamese Ward/Commune & Station resolver!
   * Allows officers to type `/ketnoi Công an Phường Tân An, Cần Thơ`,
   * `/ketnoi Phường Tân An`, `/ketnoi Xã Phong Điền Cần Thơ`, `/ketnoi CSGT Cần Thơ`, etc.
   */
  function resolveUnitByCodeOrQuery(rawQuery = '') {
    const cleaned = String(rawQuery || '').trim();
    if (!cleaned) return null;

    // 1. Direct code match (`cap_tanan`, `captananca`, etc.) when single token
    if (!/\s/.test(cleaned)) {
      const exact = resolveUnitByCode(cleaned);
      if (exact) return exact;
    }

    const ascii = stripVietnameseTones(cleaned).toLowerCase().trim();
    if (ascii === 'admin' || ascii === 'tongtrucban' || ascii.includes('trung tam chi huy quoc gia') || ascii.includes('toan quoc')) {
      return { ...PRESET_ZALO_UNITS[PRESET_ZALO_UNITS.length - 1] };
    }

    // Detect target agency from natural Vietnamese keywords
    let desiredAgency = 'police';
    let desiredLevel = '';
    if (/\b(csgt|canh sat giao thong|pc08|giao thong)\b/.test(ascii)) {
      desiredAgency = 'csgt';
      desiredLevel = 'province';
    } else if (/\b(pccc|cnch|chua chay|cuu hoa|pc07)\b/.test(ascii)) {
      desiredAgency = 'fire';
      desiredLevel = 'province';
    } else if (/\b(115|cap cuu|benh vien|y te)\b/.test(ascii)) {
      desiredAgency = 'hospital';
      desiredLevel = 'province';
    } else if (/\b(chi huy tinh|chi huy tp|chi huy thanh pho|cong an tinh|cong an thanh pho|cong an tp)\b/.test(ascii) && !/\b(phuong|xa|thi tran|dac khu)\b/.test(ascii)) {
      desiredAgency = 'all';
      desiredLevel = 'province';
    }

    // Score presets, agency accounts, and 3,717 stations
    const candidates = [];
    for (const p of PRESET_ZALO_UNITS) {
      candidates.push({
        unitCode: p.unitCode,
        unitName: p.unitName,
        agency: p.agency,
        agencyLabel: p.agencyLabel,
        level: p.level,
        province: p.province,
        ward: p.ward,
        defaultOfficerName: p.defaultOfficerName,
        defaultOfficerRank: p.defaultOfficerRank,
        defaultPhone: p.defaultPhone
      });
    }

    const accounts = getAgencyAccounts() || {};
    for (const acc of Object.values(accounts)) {
      if (!acc || !acc.username || acc.username === 'admin') continue;
      const effectiveLevel = acc.level || ((acc.agency === 'csgt' || acc.agency === 'fire' || acc.agency === 'hospital') ? 'province' : (acc.ward ? 'ward' : 'province'));
      candidates.push({
        unitCode: normalizeUnitCode(acc.username),
        unitName: acc.unitName || acc.agencyName || `Đơn vị ${acc.username}`,
        agency: acc.agency || 'police',
        agencyLabel: acc.agencyName || 'Đơn vị Trực ban',
        level: effectiveLevel,
        province: acc.province || '',
        ward: acc.ward || '',
        defaultOfficerName: (acc.officerName && !isGenericPlaceholderName(acc.officerName)) ? acc.officerName : '',
        defaultOfficerRank: (acc.officerRank && acc.officerRank !== 'Đang cập nhật') ? acc.officerRank : 'Cán bộ',
        defaultPhone: (acc.officerPhone && acc.officerPhone !== 'Đang cập nhật') ? acc.officerPhone : '113'
      });
    }

    const stations = getStationsList() || [];
    for (const st of stations) {
      if (!st || !st.name) continue;
      const stAgency = st.type || st.agency || 'police';
      candidates.push({
        unitCode: normalizeUnitCode(st.id || `${stAgency}_${st.ward || ''}_${st.province || ''}`),
        unitName: st.name,
        agency: stAgency,
        agencyLabel: st.name,
        level: st.ward ? 'ward' : 'province',
        province: st.province || st.region || '',
        ward: st.ward || '',
        defaultOfficerName: (st.officerName && !isGenericPlaceholderName(st.officerName)) ? st.officerName : '',
        defaultOfficerRank: st.officerRank || 'Cán bộ',
        defaultPhone: st.phone || '113'
      });
    }

    let best = null;
    let bestScore = 0;
    for (const c of candidates) {
      let score = 0;
      const wardSlug = normalizeGeoSlug(c.ward || '');
      const provSlug = normalizeGeoSlug(c.province || '');
      const nameAscii = stripVietnameseTones(c.unitName || '').toLowerCase();

      if (wardSlug && wardSlug.length >= 3 && new RegExp(`\\b${wardSlug.replace(/\s+/g, '\\s+')}\\b`).test(ascii)) {
        score += 65;
      }
      if (provSlug && provSlug.length >= 3 && new RegExp(`\\b${provSlug.replace(/\s+/g, '\\s+')}\\b`).test(ascii)) {
        score += 30;
      }
      if (c.agency === desiredAgency) {
        score += 20;
      } else if (desiredAgency !== 'police') {
        score -= 25;
      }
      if (desiredLevel && c.level === desiredLevel) {
        score += 15;
      }
      if (nameAscii && ascii.length >= 6 && nameAscii.includes(ascii)) {
        score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    if (best && bestScore >= 65) {
      return best;
    }

    // Fallback: If user typed explicit "Phường <X>, <Tỉnh Y>" or "Xã <X>, <Tỉnh Y>", auto-register custom unit!
    const wardProvMatch = cleaned.match(/(?:công\s*an\s+|trực\s*ban\s+|ca\s+)?((?:phường|xã|thị\s*trấn|đặc\s*khu)\s+[^,|-]+)(?:[,|-]\s*(.+))?$/i);
    if (wardProvMatch) {
      const wardName = wardProvMatch[1].trim();
      const provName = (wardProvMatch[2] || 'Cần Thơ').replace(/^(?:tỉnh|thành\s*phố|tp\.?)\s+/i, '').trim() || 'Cần Thơ';
      return registerCustomUnit({
        agency: desiredAgency === 'all' ? 'police' : desiredAgency,
        level: 'ward',
        province: provName,
        ward: wardName,
        unitName: `Công An ${wardName}, ${provName}`
      });
    }

    return null;
  }

  /**
   * Register or get a deterministic unit code for any { province, ward, agency, level, unitName }
   */
  function registerCustomUnit({ unitCode, unitName, agency = 'police', level = 'ward', province = 'Cần Thơ', ward = '', officerName = '', officerRank = '', phone = '' }) {
    const provSlug = normalizeGeoSlug(province).replace(/\s+/g, '') || 'vn';
    const wardSlug = normalizeGeoSlug(ward).replace(/\s+/g, '');
    const prefix = agency === 'csgt' ? 'csgt' : (agency === 'fire' ? 'pccc' : (agency === 'hospital' ? 'capcuu' : (agency === 'all' && level === 'national' ? 'tongtrucban' : (level === 'province' ? 'chihuy' : 'cap'))));
    const finalCode = normalizeUnitCode(unitCode || (level === 'national' ? 'tongtrucban' : (wardSlug ? `${prefix}_${wardSlug}_${provSlug.slice(0, 4)}` : `${prefix}_${provSlug}`)));

    const resolvedName = unitName || (
      level === 'national'
        ? 'Tổng Trực Ban Trung Tâm Chỉ Huy Quốc Gia'
        : (ward ? `Công An ${ward}, ${province}` : `Trực Ban ${prefix.toUpperCase()} ${province}`)
    );

    const unitDef = {
      unitCode: finalCode,
      unitName: resolvedName,
      agency,
      agencyLabel: agency === 'police' ? 'Công An Địa Phương' : (agency === 'csgt' ? 'Cảnh Sát Giao Thông' : (agency === 'fire' ? 'Cảnh Sát PCCC & CNCH' : (agency === 'hospital' ? 'Cấp Cứu 115' : 'Chỉ Huy Tổng Hợp'))),
      level: level || (ward ? 'ward' : 'province'),
      province: level === 'national' ? 'Toàn Quốc' : (province || 'Cần Thơ'),
      ward: level === 'ward' ? (ward || '') : '',
      defaultOfficerName: officerName || '',
      defaultOfficerRank: officerRank || 'Cán bộ',
      defaultPhone: phone || '113'
    };

    state.customUnits[finalCode] = unitDef;
    persistState();
    return unitDef;
  }

  /**
   * Low-level Zalo Bot Platform HTTP caller (`https://bot-api.zaloplatforms.com/bot<TOKEN>/<method>`)
   */
  async function callZaloApi(method, payload = {}, tokenOverride = '', customTimeoutMs = 0) {
    const token = String(tokenOverride || state.botToken || '').trim();
    if (!token) {
      return { ok: false, simulated: true, error: 'Chưa cấu hình BOT_TOKEN Zalo' };
    }

    const baseUrl = String(state.apiBaseUrl || DEFAULT_ZALO_API_BASE).replace(/\/+$/, '');
    const endpoint = `${baseUrl}/bot${token}/${method}`;
    try {
      const controller = new AbortController();
      const timeoutMs = customTimeoutMs > 0 ? customTimeoutMs : (method === 'getUpdates' ? 15000 : 8000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload || {}),
        signal: controller.signal
      });
      clearTimeout(timer);

      const rawText = await res.text();
      let parsed = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : {};
      } catch {
        parsed = { ok: false, raw: rawText };
      }

      if (!res.ok || parsed?.ok === false) {
        return {
          ok: false,
          status: res.status,
          error: parsed?.description || parsed?.message || parsed?.error || `HTTP ${res.status}`,
          data: parsed
        };
      }
      return { ok: true, result: parsed?.result ?? parsed, data: parsed };
    } catch (err) {
      return { ok: false, error: err?.name === 'AbortError' ? 'Timeout kết nối Zalo Bot API' : (err?.message || 'Lỗi mạng Zalo API') };
    }
  }

  async function ensureBotProfile() {
    if (!state.botToken) return null;
    if (state.botProfile && state.botProfile.name) return state.botProfile;
    const check = await callZaloApi('getMe', {}, '', 4000);
    if (check.ok) {
      const r = check.result || {};
      state.botProfile = {
        id: r.id || r.bot_id || '',
        name: r.account_name || r.display_name || r.first_name || r.username || 'Zalo Trực Ban Bot',
        verifiedAt: new Date().toISOString()
      };
      persistState();
    }
    return state.botProfile;
  }

  async function tryFetchZaloChatTitle(chatId) {
    if (!state.botToken || !chatId || String(chatId).startsWith('zalo_sim_') || String(chatId).startsWith('zalo_grp_')) {
      return '';
    }
    try {
      const res = await callZaloApi('getChat', { chat_id: String(chatId) }, '', 2000);
      if (res.ok && res.result) {
        const r = res.result;
        return String(r.title || r.name || r.group_name || r.display_name || '').trim();
      }
    } catch {}
    return '';
  }

  async function sendZaloMessage(chatId, text, { province = '', meta = {} } = {}) {
    const safeText = String(text || '').trim().slice(0, 1950);
    const token = resolveTokenForProvince(province);

    if (!token) {
      recordOutboxEntry({
        chatId: String(chatId),
        text: safeText,
        delivered: false,
        simulated: true,
        note: 'Chế độ Mô phỏng (Chưa điền BOT_TOKEN từ bot.zaloplatforms.com)',
        ...meta
      });
      return { ok: true, simulated: true, note: 'Đã ghi nhận tin nhắn mô phỏng (chưa điền BOT_TOKEN thực)' };
    }

    const apiRes = await callZaloApi('sendMessage', {
      chat_id: String(chatId),
      text: safeText
    }, token);

    recordOutboxEntry({
      chatId: String(chatId),
      text: safeText,
      delivered: Boolean(apiRes.ok),
      simulated: false,
      error: apiRes.ok ? null : apiRes.error,
      ...meta
    });

    return apiRes;
  }

  /**
   * Match bound Zalo chats for an incident according to Vietnam 2-tier hierarchy:
   * - stage === 'initial' | 'reminder':
   *     * National supervisory chats (`level === 'national'`)
   *     * Local Ward Police (`agency === 'police'`, same province & same ward)
   *     * Specialized Squads (`csgt`, `fire`, `hospital`, `traffic-rescue` in same province, matching ward or province-wide)
   * - stage === 'escalated':
   *     * National supervisory chats (`level === 'national'`)
   *     * Provincial / City HQ (`level === 'province'` in same province, `agency === 'all'` or matching `agency`)
   */
  function resolveTargetBindings(incident, stage = 'initial') {
    if (!incident || !state.enabled) return [];

    const incAgency = String(incident.agency || 'police').toLowerCase();
    const incProvinceSlug = normalizeGeoSlug(
      incident.jurisdiction?.province ||
      incident.provinceUnit?.province ||
      incident.address ||
      ''
    );
    const incWardSlug = normalizeGeoSlug(incident.jurisdiction?.ward || '');
    const incLevel = incident.currentLevel || 'ward';

    return state.bindings.filter(b => {
      if (!b || b.enabled === false || !b.chatId) return false;
      if (b.level === 'national') return true;

      const bindProvSlug = normalizeGeoSlug(b.province || '');
      const bindWardSlug = normalizeGeoSlug(b.ward || '');
      const bindAgency = String(b.agency || 'police').toLowerCase();

      if (incProvinceSlug && bindProvSlug && incProvinceSlug !== bindProvSlug) {
        return false;
      }

      if (stage === 'escalated') {
        return b.level === 'province' && (bindAgency === 'all' || bindAgency === incAgency);
      }

      // Initial or 3-minute reminder stage:
      if (incAgency === 'police' && incLevel === 'ward') {
        if (bindWardSlug && incWardSlug) {
          return bindWardSlug === incWardSlug && (bindAgency === 'police' || bindAgency === 'all');
        }
        return false;
      }

      // Specialized forces (CSGT / PCCC / 115 / Traffic Rescue) or province-direct incidents:
      const agencyMatches =
        bindAgency === incAgency ||
        (incAgency === 'ambulance' && bindAgency === 'hospital') ||
        (incAgency === 'hospital' && bindAgency === 'ambulance') ||
        (incLevel === 'province' && bindAgency === 'all');

      if (!agencyMatches) return false;
      if (bindWardSlug && incWardSlug && bindWardSlug !== incWardSlug) return false;
      return true;
    });
  }

  /**
   * Find the most recent waiting (`pending` or `escalated`) SOS incident for a given Zalo chat!
   * Survives server restarts and re-bindings by checking memory, persisted outboxLog, and active incidents!
   */
  function findActiveIncidentForChat(chatId, binding = null) {
    const cleanId = String(chatId || '').trim();
    const isWaiting = (inc) => inc && (inc.status === 'pending' || inc.status === 'escalated');

    // 1. Check in-memory latest incident notified to this exact chat
    const memId = chatLatestIncident.get(cleanId);
    if (memId) {
      const memInc = getIncidentById(memId);
      if (isWaiting(memInc)) return memInc.id;
    }

    // 2. Check persisted outboxLog (newest first) for this chatId
    for (let i = state.outboxLog.length - 1; i >= 0; i--) {
      const entry = state.outboxLog[i];
      if (entry && String(entry.chatId) === cleanId && entry.incidentId) {
        const inc = getIncidentById(entry.incidentId);
        if (isWaiting(inc)) return inc.id;
      }
    }

    // 3. Scan live active waiting incidents matching this binding's territory
    const allActive = (typeof getActiveIncidents === 'function' ? getActiveIncidents() : []) || [];
    const waitingList = allActive
      .filter(isWaiting)
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));

    if (!binding || binding.level === 'national') {
      return waitingList[0]?.id || '';
    }

    const bindProvSlug = normalizeGeoSlug(binding.province || '');
    const bindWardSlug = normalizeGeoSlug(binding.ward || '');
    const bindAgency = String(binding.agency || 'police').toLowerCase();

    for (const inc of waitingList) {
      const incProvSlug = normalizeGeoSlug(inc.jurisdiction?.province || inc.provinceUnit?.province || inc.address || '');
      const incWardSlug = normalizeGeoSlug(inc.jurisdiction?.ward || '');
      const incAgency = String(inc.agency || 'police').toLowerCase();

      if (bindProvSlug && incProvSlug && bindProvSlug !== incProvSlug) continue;
      if (binding.level === 'ward' && bindWardSlug && incWardSlug && bindWardSlug !== incWardSlug) continue;
      if (bindAgency !== 'all' && bindAgency !== incAgency) continue;
      return inc.id;
    }

    return '';
  }

  function formatIncidentZaloAlert(incident, binding, stage = 'initial', fallbackOrigin = '') {
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`;
    const quickAcceptUrl = buildQuickAcceptUrl(incident.id, binding.chatId, fallbackOrigin);
    const tagsText = Array.isArray(incident.incidentTags) && incident.incidentTags.length > 0
      ? incident.incidentTags.join(' | ')
      : (incident.agencyName || 'Cần hỗ trợ khẩn cấp');
    const sourceLine = incident.isHardwareSos
      ? `📡 Thiết bị phát: ${incident.hardwareModel || 'Kit 4G GPS ESP32-C3 TDM2421'} (${incident.hardwareTargetLabel || 'Nút bấm khẩn cấp IoT'})`
      : `📱 Nguồn báo: Cổng Cứu Hộ Quốc Gia SOS Việt Nam`;

    // Always display exact GPS Polygon Ward & Primary Assigned Unit (never overwrite with supervisory binding!)
    const exactJurisdiction = [incident.jurisdiction?.ward, incident.jurisdiction?.province]
      .filter(Boolean)
      .join(', ') || binding?.province || 'Đang xác định địa bàn';
    const primaryStationName = incident.assignedUnit?.name || binding?.unitName || 'Đơn vị Trực ban cơ sở';
    const supervisoryLine = (binding?.level === 'national' && binding?.unitName && binding.unitName !== primaryStationName)
      ? `👁️ Kênh giám sát nhận tin: ${binding.unitName}`
      : '';
    const replyHint = getBotMentionHint(binding?.chatType || 'GROUP');

    const reminderSec = Math.round(getEffectiveReminderMs() / 1000);
    const escalationSec = Math.round(getEffectiveEscalationMs() / 1000);
    const remainingMin = Math.max(1, Math.round((escalationSec - reminderSec) / 60));

    if (stage === 'reminder') {
      const elapsedLabel = reminderSec >= 60 ? `${Math.round(reminderSec / 60)} phút` : `${reminderSec} giây`;
      return [
        `⚠️ [NHẮC KHẨN LẦN 2 - CHƯA AI TIẾP NHẬN!]`,
        `🆔 Mã hồ sơ: #${incident.id}`,
        `🗺️ Địa bàn xảy ra (GPS): ${exactJurisdiction}`,
        `🏢 Đơn vị phụ trách chính: ${primaryStationName}`,
        ...(supervisoryLine ? [supervisoryLine] : []),
        `⏱️ Cảnh báo: Đã qua ${elapsedLabel} nhưng ca SOS vẫn đang CHỜ TIẾP NHẬN!`,
        `👤 Người dân: ${incident.reporterName || 'Người dân'} — SĐT: ${incident.reporterPhone || 'Đang cập nhật'}`,
        `📍 Vị trí: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
        `⏳ Lưu ý: Sẽ tự động LEO THANG lên Chỉ Huy Cấp Tỉnh/TP nếu không tiếp nhận kịp thời (${state.demoFastMode ? `sau ${escalationSec - reminderSec} giây` : `còn ~${remainingMin} phút`})!`,
        ``,
        `🧭 Mở bản đồ dẫn đường:`,
        gmapsUrl,
        ``,
        `✅ CÁCH 1 — BẤM 1 CHẠM ĐỂ TIẾP NHẬN NGAY:`,
        quickAcceptUrl,
        ``,
        `💬 CÁCH 2 — NHẮN TIN NHẬN CA: ${replyHint}`
      ].join('\n');
    }

    if (stage === 'escalated') {
      return [
        `🚨⚡ [BÁO ĐỘNG LEO THANG CẤP TỈNH/TP]`,
        `🆔 Mã hồ sơ: #${incident.id}`,
        `🗺️ Địa bàn xảy ra (GPS): ${exactJurisdiction}`,
        `🏛️ Chuyển quyền chỉ huy lên: ${incident.provinceUnit?.name || binding.unitName || 'Trung Tâm Chỉ Huy Tỉnh/TP'}`,
        `⚠️ Lý do: Đơn vị cơ sở (${incident.previousAssignedUnit?.name || primaryStationName}) quá thời gian quy định chưa tiếp nhận xử lý!`,
        `📋 Nội dung: ${tagsText}`,
        `👤 Người báo: ${incident.reporterName || 'Người dân'} — SĐT: ${incident.reporterPhone || 'Đang cập nhật'}`,
        `📍 Hiện trường: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
        ``,
        `🧭 Dẫn đường Google Maps tới nạn nhân:`,
        gmapsUrl,
        ``,
        `✅ CÁCH 1 — BẤM LINK TIẾP NHẬN ĐIỀU ĐỘNG NGAY:`,
        quickAcceptUrl,
        ``,
        `💬 CÁCH 2 — NHẮN TIN NHẬN CA: ${replyHint}`
      ].join('\n');
    }

    return [
      `🚨 [BÁO ĐỘNG KHẨN CẤP SOS #${incident.id}]`,
      `🗺️ Địa bàn xảy ra (GPS): ${exactJurisdiction}`,
      `🏢 Đơn vị phụ trách chính: ${primaryStationName}`,
      ...(supervisoryLine ? [supervisoryLine] : []),
      sourceLine,
      `📋 Phân loại: ${tagsText}`,
      `👤 Người dân: ${incident.reporterName || 'Người dân cần cứu hộ'}`,
      `📞 SĐT liên hệ: ${incident.reporterPhone || 'Đang cập nhật'}`,
      `📍 Địa điểm: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
      `🎯 Tọa độ GPS: ${Number(incident.lat).toFixed(5)}, ${Number(incident.lng).toFixed(5)}`,
      ``,
      `🧭 Dẫn đường Google Maps (1 chạm):`,
      gmapsUrl,
      ``,
      `✅ CÁCH 1 — BẤM LINK TIẾP NHẬN NGAY TRÊN ĐIỆN THOẠI:`,
      quickAcceptUrl,
      ``,
      `💬 CÁCH 2 — NHẮN TIN NHẬN CA: ${replyHint}`
    ].join('\n');
  }

  function clearIncidentZaloTimer(incidentId) {
    if (reminderTimers.has(incidentId)) {
      clearTimeout(reminderTimers.get(incidentId));
      reminderTimers.delete(incidentId);
    }
  }

  /**
   * Triggered immediately when a new SOS incident (Web PWA or 4G GPS Hardware Chip) is created.
   */
  async function onIncidentCreated(incident, { origin = '' } = {}) {
    if (!incident || !state.enabled) return { dispatched: 0, targets: [] };

    await ensureBotProfile();
    const targets = resolveTargetBindings(incident, 'initial');
    const notifiedSet = incidentNotifiedChats.get(incident.id) || new Set();
    incidentNotifiedChats.set(incident.id, notifiedSet);

    const results = [];
    for (const binding of targets) {
      chatLatestIncident.set(String(binding.chatId), incident.id);
      notifiedSet.add(String(binding.chatId));
      const msgText = formatIncidentZaloAlert(incident, binding, 'initial', origin);
      const sendRes = await sendZaloMessage(binding.chatId, msgText, {
        province: binding.province,
        meta: {
          incidentId: incident.id,
          stage: 'initial',
          unitCode: binding.unitCode,
          unitName: binding.unitName
        }
      });
      results.push({ chatId: binding.chatId, unitName: binding.unitName, ...sendRes });
    }

    // Schedule 3-minute (or Demo 20s) Nag Reminder if still pending
    clearIncidentZaloTimer(incident.id);
    const reminderDelayMs = getEffectiveReminderMs();
    const nagTimer = setTimeout(async () => {
      reminderTimers.delete(incident.id);
      const latestInc = getIncidentById(incident.id);
      if (!latestInc || latestInc.status !== 'pending') return;

      const nagTargets = resolveTargetBindings(latestInc, 'reminder');
      for (const binding of nagTargets) {
        chatLatestIncident.set(String(binding.chatId), latestInc.id);
        notifiedSet.add(String(binding.chatId));
        const nagText = formatIncidentZaloAlert(latestInc, binding, 'reminder', origin);
        await sendZaloMessage(binding.chatId, nagText, {
          province: binding.province,
          meta: {
            incidentId: latestInc.id,
            stage: 'reminder_3min',
            unitCode: binding.unitCode,
            unitName: binding.unitName
          }
        });
      }
    }, reminderDelayMs);

    reminderTimers.set(incident.id, nagTimer);

    if (typeof escalateIncidentFromTimer === 'function' && state.demoFastMode) {
      // Server uses `getEffectiveEscalationMs()` directly when scheduling escalationTimers
    }

    return {
      dispatched: results.length,
      reminderScheduledSec: Math.round(reminderDelayMs / 1000),
      targets: results
    };
  }

  /**
   * Triggered when an incident escalates to Provincial/City HQ (auto 15m or manual escalate).
   */
  async function onIncidentEscalated(incident, { origin = '' } = {}) {
    if (!incident || !state.enabled) return { dispatched: 0 };
    clearIncidentZaloTimer(incident.id);
    await ensureBotProfile();

    const notifiedSet = incidentNotifiedChats.get(incident.id) || new Set();
    incidentNotifiedChats.set(incident.id, notifiedSet);

    const prevTargets = state.bindings.filter(b => notifiedSet.has(String(b.chatId)) && b.level === 'ward');
    for (const prev of prevTargets) {
      await sendZaloMessage(
        prev.chatId,
        `⚡ [ĐÃ BÁO LÊN CHỈ HUY CẤP TỈNH/TP]\nCa sự cố #${incident.id} quá thời gian chờ nên đã báo động song song lên ${incident.provinceUnit?.name || 'Chỉ Huy Cấp Tỉnh/TP'}.\n👉 Nếu đơn vị cơ sở đã có mặt hoặc sẵn sàng xuất phát, đồng chí vẫn có thể gõ /tn để nhận ca ngay!`,
        {
          province: prev.province,
          meta: { incidentId: incident.id, stage: 'escalated_notice_local', unitCode: prev.unitCode }
        }
      );
    }

    const hqTargets = resolveTargetBindings(incident, 'escalated');
    const results = [];
    for (const binding of hqTargets) {
      chatLatestIncident.set(String(binding.chatId), incident.id);
      notifiedSet.add(String(binding.chatId));
      const hqText = formatIncidentZaloAlert(incident, binding, 'escalated', origin);
      const sendRes = await sendZaloMessage(binding.chatId, hqText, {
        province: binding.province,
        meta: {
          incidentId: incident.id,
          stage: 'escalated_province_hq',
          unitCode: binding.unitCode,
          unitName: binding.unitName
        }
      });
      results.push({ chatId: binding.chatId, unitName: binding.unitName, ...sendRes });
    }
    return { dispatched: results.length, targets: results };
  }

  /**
   * Triggered whenever an incident is accepted (via Web PC or Zalo) or resolved/closed.
   */
  async function onIncidentAcceptedOrClosed(incident, { via = 'web', acceptedChatId = '', officerDisplay = '' } = {}) {
    if (!incident) return;
    clearIncidentZaloTimer(incident.id);

    const notifiedSet = incidentNotifiedChats.get(incident.id);
    if (!notifiedSet || notifiedSet.size === 0) return;

    if (incident.status === 'dispatching') {
      const unitLabel = incident.dispatchUnit?.unitName || incident.assignedUnit?.name || 'Đơn vị Trực ban';
      const officerLabel = officerDisplay || incident.dispatchUnit?.officerFullTitle || 'Cán bộ trực ban';
      const sourceChannel = via === 'zalo' || via === 'zalo_chat' ? 'Zalo Trực Ban Di Động' : 'Bàn Chỉ Huy Web';
      const confirmMsg = [
        `✅ [ĐÃ TIẾP NHẬN & ĐIỀU ĐỘNG LỰC LƯỢNG]`,
        `🆔 Mã sự cố: #${incident.id}`,
        `👮 Cán bộ tiếp nhận: ${officerLabel} (${unitLabel})`,
        `📲 Kênh xác nhận: ${sourceChannel}`,
        `🛑 Hệ thống đã tắt nhắc khẩn & hủy đếm ngược leo thang cho ca này.`
      ].join('\n');

      for (const chatId of notifiedSet) {
        if (acceptedChatId && String(chatId) === String(acceptedChatId) && via === 'zalo_chat') {
          continue;
        }
        const b = state.bindings.find(item => String(item.chatId) === String(chatId));
        await sendZaloMessage(chatId, confirmMsg, {
          province: b?.province || incident.jurisdiction?.province || '',
          meta: { incidentId: incident.id, stage: 'accepted_sync', unitCode: b?.unitCode || '' }
        });
      }
    }
  }

  function clearAllIncidentTimers() {
    for (const timer of reminderTimers.values()) {
      clearTimeout(timer);
    }
    reminderTimers.clear();
  }

  /**
   * Normalize all possible Zalo Bot Platform webhook & `getUpdates` JSON envelopes
   * into a uniform array of `{ messageId, chatId, chatType, rawChatTitle, senderId, senderName, text, quotedText }`.
   */
  function extractIncomingZaloMessages(payload) {
    if (!payload || typeof payload !== 'object') return [];

    const rawItems = [];
    if (Array.isArray(payload.result)) {
      rawItems.push(...payload.result);
    } else if (payload.result && typeof payload.result === 'object') {
      rawItems.push(payload.result);
    } else {
      rawItems.push(payload);
    }

    const normalized = [];
    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue;
      const msg = item.message || item.data?.message || (item.chat && (item.text || item.command) ? item : null);
      if (!msg || typeof msg !== 'object') continue;

      const chat = msg.chat || {};
      const from = msg.from || msg.sender || {};
      const chatId = String(chat.id || msg.chat_id || from.id || '').trim();
      const text = String(msg.text || msg.content || msg.command || '').trim();
      if (!chatId || !text) continue;

      const messageId = String(msg.message_id || item.update_id || `${chatId}_${msg.date || Date.now()}_${text.slice(0, 24)}`);
      const chatType = String(chat.chat_type || chat.type || 'PRIVATE').toUpperCase();
      const senderName = String(from.display_name || from.first_name || from.name || '').trim();
      const rawChatTitle = String(chat.title || chat.name || chat.group_name || chat.display_name || '').trim();
      const quotedText = String(msg.reply_to_message?.text || msg.quote?.text || msg.quoted_message?.text || '').trim();

      normalized.push({
        messageId,
        chatId,
        chatType,
        rawChatTitle,
        chatTitle: rawChatTitle,
        senderId: String(from.id || ''),
        senderName: senderName || 'Cán bộ Zalo',
        hasRealSenderName: Boolean(senderName && !isGenericPlaceholderName(senderName)),
        text,
        quotedText
      });
    }
    return normalized;
  }

  function bindChatToUnit({ chatId, chatTitle = '', chatType = 'GROUP', senderName = '', hasRealSenderName = false, unitDef }) {
    const cleanChatId = String(chatId).trim();
    // 1 Zalo Group/Chat = 1 active Unit assignment (prevents duplicate national + ward stacking on same chatId)
    const existingIdx = state.bindings.findIndex(b => String(b.chatId) === cleanChatId);
    const existing = existingIdx >= 0 ? state.bindings[existingIdx] : null;

    const realOfficer = (hasRealSenderName || (senderName && !isGenericPlaceholderName(senderName)))
      ? senderName.trim()
      : (existing?.officerName || '');

    const resolvedDisplayTitle = chatTitle
      ? chatTitle.trim()
      : (existing?.customTitle ? existing.chatTitle : (chatType === 'GROUP' ? `Nhóm Zalo — ${unitDef.unitName}` : `${realOfficer || 'Cán bộ'} — ${unitDef.unitName}`));

    const record = {
      chatId: cleanChatId,
      chatTitle: resolvedDisplayTitle,
      customTitle: Boolean(chatTitle),
      chatType: chatType || existing?.chatType || 'GROUP',
      senderName: realOfficer || senderName || existing?.senderName || 'Cán bộ trực ban',
      officerName: realOfficer || unitDef.defaultOfficerName || 'Cán bộ trực ban',
      unitCode: unitDef.unitCode,
      unitName: unitDef.unitName,
      agency: unitDef.agency || 'police',
      agencyLabel: unitDef.agencyLabel || 'Đơn vị Trực ban',
      level: unitDef.level || 'ward',
      province: unitDef.province || 'Cần Thơ',
      ward: unitDef.ward || '',
      defaultOfficerName: realOfficer || unitDef.defaultOfficerName || 'Cán bộ trực ban',
      defaultOfficerRank: unitDef.defaultOfficerRank || existing?.defaultOfficerRank || 'Cán bộ',
      defaultPhone: unitDef.defaultPhone || existing?.defaultPhone || '113',
      enabled: true,
      linkedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      state.bindings[existingIdx] = record;
    } else {
      state.bindings.push(record);
    }
    persistState();
    return record;
  }

  /**
   * Directly edit/reassign an already-connected Zalo Group/Chat right from the Web UI!
   * Solves Zalo Group Privacy (where Zalo hides group titles) and lets dispatchers
   * assign exact Ward/Commune, Agency, Custom Group Name, and Default Officer Name in 1 click.
   */
  async function updateBinding({
    chatId,
    unitCode = '',
    unitQuery = '',
    province = '',
    ward = '',
    agency = '',
    level = '',
    chatTitle = '',
    officerName = '',
    officerRank = '',
    defaultPhone = '',
    notifyChat = true
  } = {}) {
    const cleanChatId = String(chatId || '').trim();
    const idx = state.bindings.findIndex(b => String(b.chatId) === cleanChatId);
    if (idx < 0) {
      throw new Error('Không tìm thấy nhóm Zalo đã liên kết này.');
    }

    const current = state.bindings[idx];
    let targetUnit = null;

    if (unitCode) {
      targetUnit = resolveUnitByCode(unitCode);
    }
    if (!targetUnit && unitQuery) {
      targetUnit = resolveUnitByCodeOrQuery(unitQuery);
    }
    if (!targetUnit && (province || ward || agency || level)) {
      const nextAgency = agency || current.agency || 'police';
      const nextWard = ward !== undefined ? String(ward).trim() : current.ward;
      const nextLevel = level || (nextAgency === 'police' && nextWard ? 'ward' : (current.level || 'province'));
      const nextProv = nextLevel === 'national' ? 'Toàn Quốc' : (province || current.province || 'Cần Thơ');
      // Try matching real station in directory first before registering custom unit
      if (nextWard && nextAgency === 'police') {
        targetUnit = resolveUnitByCodeOrQuery(`Công an ${nextWard}, ${nextProv}`);
      }
      if (!targetUnit) {
        targetUnit = registerCustomUnit({
          agency: nextAgency,
          level: nextLevel,
          province: nextProv,
          ward: nextLevel === 'ward' ? nextWard : '',
          officerName: officerName || current.officerName || '',
          officerRank: officerRank || current.defaultOfficerRank || 'Cán bộ',
          phone: defaultPhone || current.defaultPhone || '113'
        });
      }
    }
    if (!targetUnit) {
      targetUnit = {
        unitCode: current.unitCode,
        unitName: current.unitName,
        agency: current.agency,
        agencyLabel: current.agencyLabel,
        level: current.level,
        province: current.province,
        ward: current.ward,
        defaultOfficerName: current.defaultOfficerName,
        defaultOfficerRank: current.defaultOfficerRank,
        defaultPhone: current.defaultPhone
      };
    }

    const updatedOfficer = officerName !== undefined && String(officerName).trim()
      ? String(officerName).trim()
      : (current.officerName || current.senderName || targetUnit.defaultOfficerName || 'Cán bộ trực ban');

    const updatedTitle = chatTitle !== undefined && String(chatTitle).trim()
      ? String(chatTitle).trim()
      : `Nhóm Zalo — ${targetUnit.unitName}`;

    const updated = {
      ...current,
      chatTitle: updatedTitle,
      customTitle: Boolean(chatTitle && String(chatTitle).trim()),
      unitCode: targetUnit.unitCode,
      unitName: targetUnit.unitName,
      agency: targetUnit.agency || 'police',
      agencyLabel: targetUnit.agencyLabel || 'Đơn vị Trực ban',
      level: targetUnit.level || 'ward',
      province: targetUnit.province || 'Cần Thơ',
      ward: targetUnit.ward || '',
      officerName: updatedOfficer,
      defaultOfficerName: updatedOfficer,
      defaultOfficerRank: String(officerRank || current.defaultOfficerRank || targetUnit.defaultOfficerRank || 'Cán bộ').trim(),
      defaultPhone: String(defaultPhone || current.defaultPhone || targetUnit.defaultPhone || '113').trim(),
      updatedAt: new Date().toISOString()
    };

    state.bindings[idx] = updated;
    persistState();

    if (notifyChat) {
      await ensureBotProfile();
      const scopeDesc = updated.level === 'national'
        ? 'Toàn Quốc (Tất cả sự cố)'
        : (updated.ward ? `${updated.ward}, ${updated.province}` : `Toàn địa bàn ${updated.province}`);
      const confirmMsg = [
        `🔄 [CẬP NHẬT ĐỊA BÀN TRỰC BAN THÀNH CÔNG]`,
        `🏷️ Tên nhóm: ${updated.chatTitle}`,
        `🏢 Đơn vị phụ trách: ${updated.unitName}`,
        `📍 Địa bàn nhận báo động: ${scopeDesc}`,
        `👮 Cán bộ trực mặc định: ${updated.officerName}`,
        `💬 Khi có báo động SOS, đồng chí chỉ cần ${getBotMentionHint(updated.chatType).toLowerCase()} để nhận ca!`
      ].join('\n');
      await sendZaloMessage(updated.chatId, confirmMsg, {
        province: updated.province,
        meta: { stage: 'binding_updated_web', unitCode: updated.unitCode, unitName: updated.unitName }
      });
    }

    return updated;
  }

  /**
   * Process an incoming Zalo message (`/start`, `/ketnoi <code|tên phường>`, `/huyketnoi`, `/danhsach`, `/tn`, `@Bot Vĩnh Nam TN`)
   */
  async function handleIncomingMessage(msg, { origin = '' } = {}) {
    if (!msg || !msg.chatId || !msg.text) return { handled: false };

    if (msg.messageId && processedMessageIds.has(msg.messageId)) {
      return { handled: true, duplicate: true };
    }
    if (msg.messageId) {
      processedMessageIds.add(msg.messageId);
      if (processedMessageIds.size > 500) {
        const first = processedMessageIds.values().next().value;
        processedMessageIds.delete(first);
      }
    }

    await ensureBotProfile();

    // Remember real officer senderName from Zalo `from.display_name` on existing binding!
    const existingBinding = state.bindings.find(b => String(b.chatId) === String(msg.chatId));
    if (existingBinding && msg.hasRealSenderName) {
      existingBinding.senderName = msg.senderName;
      if (!existingBinding.officerName || isGenericPlaceholderName(existingBinding.officerName)) {
        existingBinding.officerName = msg.senderName;
        existingBinding.defaultOfficerName = msg.senderName;
      }
      persistState();
    }

    const cleanedText = stripBotMentions(msg.text, state.botProfile?.name || '');
    const lowerAscii = stripVietnameseTones(cleanedText).toLowerCase().trim();

    // 1. Check `/ketnoi <mã hoặc tên Công an Phường/Xã | Tên nhóm tùy chọn>`
    const ketnoiMatch = cleanedText.match(/^\/?(?:ketnoi|ket_noi|lienket|pair)\s+([\s\S]+)$/i) ||
                        cleanedText.match(/\/(?:ketnoi|ket_noi|lienket|pair)\s+([\s\S]+)$/i);
    if (ketnoiMatch) {
      const fullArg = ketnoiMatch[1].trim();
      const [unitArgRaw, customGroupTitleRaw] = fullArg.split('|').map(s => s.trim());
      const unitDef = resolveUnitByCodeOrQuery(unitArgRaw);

      if (!unitDef) {
        const reply = [
          `❌ Không nhận diện được đơn vị "${unitArgRaw}".`,
          `👉 Đồng chí có thể gõ MÃ ĐƠN VỊ hoặc TÊN PHƯỜNG/XÃ trực tiếp:`,
          `• /ketnoi cap_tanan`,
          `• /ketnoi Phường Tân An, Cần Thơ`,
          `• /ketnoi Phường Ninh Kiều, Cần Thơ`,
          `• /ketnoi csgt_cantho (Đội CSGT Cần Thơ)`,
          `• /ketnoi pccc_cantho (Đội PCCC & CNCH Cần Thơ)`,
          `• /ketnoi chihuy_cantho (Chỉ Huy CA TP. Cần Thơ)`,
          `(Hoặc mở Bàn Chỉ Huy Web -> bấm "Bot Zalo" -> bấm nút "Sửa Đơn Vị" ngay trên nhóm đã kết nối!)`
        ].join('\n');
        await sendZaloMessage(msg.chatId, reply, { meta: { stage: 'cmd_ketnoi_invalid' } });
        return { handled: true, action: 'ketnoi_invalid', code: unitArgRaw };
      }

      const apiGroupTitle = msg.rawChatTitle || (msg.chatType === 'GROUP' ? await tryFetchZaloChatTitle(msg.chatId) : '');
      const finalChatTitle = customGroupTitleRaw || apiGroupTitle || '';

      const binding = bindChatToUnit({
        chatId: msg.chatId,
        chatTitle: finalChatTitle,
        chatType: msg.chatType,
        senderName: msg.senderName,
        hasRealSenderName: msg.hasRealSenderName,
        unitDef
      });

      const scopeDesc = binding.level === 'national'
        ? 'Toàn Quốc (Giám sát tất cả sự cố)'
        : (binding.ward ? `${binding.ward}, ${binding.province}` : `Toàn địa bàn ${binding.province}`);

      const confirmText = [
        `✅ LIÊN KẾT BOT TRỰC BAN THÀNH CÔNG!`,
        `🏢 Đơn vị: ${binding.unitName}`,
        `🛡️ Lực lượng: ${binding.agencyLabel}`,
        `📍 Địa bàn nhận báo động: ${scopeDesc}`,
        `👮 Cán bộ kích hoạt (tự nhận diện Zalo): ${msg.senderName}`,
        ``,
        `🔔 Mọi tín hiệu SOS thuộc đúng địa bàn trên sẽ báo tức thì vào khung chat này.`,
        `💡 KHI CÓ BÁO ĐỘNG SOS: Đồng chí bấm Link Tiếp Nhận 1 Chạm, HOẶC ${getBotMentionHint(msg.chatType).toLowerCase()} để nhận ca ngay!`
      ].join('\n');

      await sendZaloMessage(msg.chatId, confirmText, {
        province: binding.province,
        meta: { stage: 'cmd_ketnoi_ok', unitCode: binding.unitCode, unitName: binding.unitName }
      });
      return { handled: true, action: 'ketnoi_ok', binding };
    }

    // 2. Check `/huyketnoi`
    if (/^\/?(?:huyketnoi|unlink|ngatketnoi)\b/i.test(lowerAscii)) {
      const before = state.bindings.length;
      state.bindings = state.bindings.filter(b => String(b.chatId) !== String(msg.chatId));
      persistState();
      const removed = before - state.bindings.length;
      await sendZaloMessage(
        msg.chatId,
        removed > 0
          ? `🛑 Đã hủy liên kết đơn vị trực ban khỏi khung chat Zalo này.`
          : `ℹ️ Khung chat này hiện chưa liên kết với đơn vị nào.`,
        { meta: { stage: 'cmd_unlink' } }
      );
      return { handled: true, action: 'unlink', removed };
    }

    // 3. Check `/danhsach` or `/trangthai`
    if (/^\/?(?:danhsach|trangthai|status)\b/i.test(lowerAscii)) {
      const myBindings = state.bindings.filter(b => String(b.chatId) === String(msg.chatId));
      const reply = myBindings.length === 0
        ? `ℹ️ Khung chat này chưa gắn với đơn vị nào.\nHãy gõ: /ketnoi cap_tanan (hoặc /ketnoi Phường Tân An, Cần Thơ) để nhận báo động SOS!`
        : [
            `📋 ĐƠN VỊ ĐANG TRỰC TRÊN KHUNG CHAT NÀY:`,
            ...myBindings.map((b, i) => `${i + 1}. ${b.unitName}\n   📍 Địa bàn: ${b.ward ? `${b.ward}, ${b.province}` : b.province}\n   👮 Cán bộ trực Zalo: ${b.officerName || b.senderName}`),
            `\n💬 Đổi địa bàn: gõ /ketnoi <Tên Phường, Tỉnh>\n💬 Nhận ca khi có SOS: ${getBotMentionHint(msg.chatType)}`
          ].join('\n');
      await sendZaloMessage(msg.chatId, reply, { meta: { stage: 'cmd_status' } });
      return { handled: true, action: 'status', bindings: myBindings };
    }

    // 4. Two-way Field Acceptance command: `/tn`, `TN`, `TN <SOS_ID>`, `TIEP NHAN`, `NHAN CA`, `@Bot Vĩnh Nam TN`
    const tnMatch = lowerAscii.match(/^(?:\/?tn|\/?tiep\s*nhan|\/?nhan\s*ca)(?:\s+#?([a-z0-9-]+))?$/i);
    if (tnMatch) {
      const myBinding = state.bindings.find(b => String(b.chatId) === String(msg.chatId)) || null;
      const explicitId = tnMatch[1] ? tnMatch[1].toUpperCase() : extractIncidentIdFromText(msg.quotedText);
      const targetIncidentId = explicitId || findActiveIncidentForChat(msg.chatId, myBinding);

      if (!targetIncidentId) {
        const unitInfo = myBinding ? `${myBinding.unitName}` : 'Khung chat hiện tại';
        await sendZaloMessage(
          msg.chatId,
          [
            `✅ Đường truyền phản hồi 2 chiều HOẠT ĐỘNG TỐT!`,
            `👮 Đã tự động nhận diện cán bộ nhắn lệnh: ${msg.senderName}`,
            `🏢 Đơn vị: ${unitInfo}`,
            `ℹ️ Hiện tại chưa có ca SOS khẩn cấp nào đang chờ tiếp nhận thuộc địa bàn này. Khi có báo động SOS thật, đồng chí gõ /tn (hoặc @${state.botProfile?.name || 'Bot'} TN) là nhận ca ngay!`
          ].join('\n'),
          { meta: { stage: 'cmd_tn_empty' } }
        );
        return { handled: true, action: 'tn_no_incident', officerName: msg.senderName };
      }

      const realAcceptingOfficer = msg.hasRealSenderName
        ? msg.senderName
        : (myBinding?.officerName || myBinding?.senderName || msg.senderName || 'Cán bộ trực Zalo');

      const acceptResult = acceptIncidentFromZalo({
        incidentId: targetIncidentId,
        chatId: msg.chatId,
        binding: myBinding,
        officerName: realAcceptingOfficer,
        officerRank: myBinding?.defaultOfficerRank || 'Cán bộ',
        unitName: (myBinding && myBinding.level !== 'national') ? myBinding.unitName : '',
        officerPhone: myBinding?.defaultPhone || '',
        via: 'zalo_chat'
      });

      if (!acceptResult || !acceptResult.ok) {
        await sendZaloMessage(
          msg.chatId,
          `⚠️ Không thể tiếp nhận ca #${targetIncidentId}: ${acceptResult?.error || 'Ca đã kết thúc hoặc không tồn tại.'}`,
          { meta: { stage: 'cmd_tn_fail', incidentId: targetIncidentId } }
        );
        return { handled: true, action: 'tn_failed', error: acceptResult?.error };
      }

      const inc = acceptResult.incident;
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${inc.lat},${inc.lng}`;
      const reply = [
        acceptResult.alreadyHandled
          ? `ℹ️ CA #${inc.id} ĐÃ ĐƯỢC TIẾP NHẬN TRƯỚC ĐÓ!`
          : `✅ ĐÃ XÁC NHẬN TIẾP NHẬN CA #${inc.id} THÀNH CÔNG!`,
        `👮 Cán bộ nhận lệnh (tự trích xuất Zalo): ${inc.dispatchUnit?.officerFullTitle || realAcceptingOfficer}`,
        `🏢 Đơn vị điều động: ${inc.dispatchUnit?.unitName || inc.assignedUnit?.name || ''}`,
        `👤 Người dân: ${inc.reporterName} — SĐT: ${inc.reporterPhone}`,
        `📍 Hiện trường: ${inc.address}`,
        `🧭 Mở Google Maps dẫn đường ngay:`,
        gmapsUrl
      ].join('\n');

      await sendZaloMessage(msg.chatId, reply, {
        province: myBinding?.province || '',
        meta: { stage: 'cmd_tn_ok', incidentId: inc.id, officerName: realAcceptingOfficer }
      });
      return { handled: true, action: 'tn_accepted', incidentId: inc.id, officerName: realAcceptingOfficer };
    }

    // 5. `/start` or `/help`
    if (/^\/?(?:start|help|huongdan|batdau)\b/i.test(lowerAscii)) {
      const botTag = state.botProfile?.name ? `@${state.botProfile.name}` : '@TênBot';
      const helpText = [
        `🛡️ HỆ THỐNG BOT TRỰC BAN KHẨN CẤP — SOS VIỆT NAM 2026`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `1️⃣ Liên kết Nhóm Zalo với đúng Công an Phường/Xã:`,
        `• /ketnoi cap_tanan  (hoặc: /ketnoi Phường Tân An, Cần Thơ)`,
        `• /ketnoi csgt_cantho (Đội CSGT Cần Thơ)`,
        `• /ketnoi pccc_cantho (Đội PCCC & CNCH Cần Thơ)`,
        `• /ketnoi chihuy_cantho (Chỉ Huy Công An TP. Cần Thơ)`,
        ``,
        `2️⃣ Tiếp nhận sự cố 2 chiều ngay khi đi ăn cơm / tuần tra:`,
        `• Cách 1: Bấm vào Link Tiếp Nhận 1 Chạm trong tin báo động`,
        `• Cách 2: Gõ lệnh ngắn /tn  (hoặc ${botTag} TN) — Tự động ghi nhận tên Zalo của đồng chí!`,
        ``,
        `3️⃣ Lệnh tra cứu khác:`,
        `• /danhsach — Xem đơn vị & cán bộ đang gắn với nhóm này`,
        `• /huyketnoi — Ngắt nhận thông báo tại nhóm này`
      ].join('\n');
      await sendZaloMessage(msg.chatId, helpText, { meta: { stage: 'cmd_help' } });
      return { handled: true, action: 'help' };
    }

    return { handled: false };
  }

  async function handleWebhookPayload(payload, { secretHeader = '', origin = '', skipSecretCheck = false } = {}) {
    if (!skipSecretCheck && state.webhookActive && secretHeader) {
      const validSecrets = [state.webhookSecret, deterministicWebhookSecret].filter(Boolean);
      if (!validSecrets.includes(secretHeader)) {
        return { ok: false, status: 401, error: 'Sai X-Bot-Api-Secret-Token' };
      }
    }

    const messages = extractIncomingZaloMessages(payload);
    const outcomes = [];
    for (const m of messages) {
      const res = await handleIncomingMessage(m, { origin });
      outcomes.push(res);
    }
    return { ok: true, count: messages.length, outcomes };
  }

  function stopPolling() {
    pollingActive = false;
    if (pollingTimer) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
    if (pollingAbortController) {
      try { pollingAbortController.abort(); } catch {}
      pollingAbortController = null;
    }
  }

  async function pollOnce() {
    if (!pollingActive || !state.botToken || state.webhookActive) return;
    try {
      const apiRes = await callZaloApi('getUpdates', { timeout: 8 });
      if (apiRes.ok && apiRes.data) {
        await handleWebhookPayload(apiRes.data, { skipSecretCheck: true });
      }
    } catch {
      // Ignore transient network hiccups
    } finally {
      if (pollingActive && state.botToken && !state.webhookActive) {
        pollingTimer = setTimeout(pollOnce, 2500);
      }
    }
  }

  function startPollingIfNeeded() {
    stopPolling();
    if (!state.botToken || state.webhookActive) return;
    pollingActive = true;
    pollingTimer = setTimeout(pollOnce, 800);
  }

  async function updateConfig({
    botToken,
    enabled,
    demoFastMode,
    reminderSeconds,
    escalationSeconds,
    publicBaseUrl,
    preferPolling = false,
    detectedOrigin = ''
  } = {}) {
    if (typeof enabled === 'boolean') state.enabled = enabled;
    if (typeof demoFastMode === 'boolean') state.demoFastMode = demoFastMode;
    if (Number.isFinite(Number(reminderSeconds)) && Number(reminderSeconds) >= 10) {
      state.reminderSeconds = Number(reminderSeconds);
    }
    if (Number.isFinite(Number(escalationSeconds)) && Number(escalationSeconds)) {
      if (Number(escalationSeconds) >= 30) state.escalationSeconds = Number(escalationSeconds);
    }
    if (typeof publicBaseUrl === 'string' && publicBaseUrl.trim()) {
      state.publicBaseUrl = publicBaseUrl.trim().replace(/\/+$/, '');
    }

    if (typeof botToken === 'string') {
      const trimmed = botToken.trim();
      if (!trimmed.includes('••••')) {
        state.botToken = trimmed;
      }
    }

    let botCheck = null;
    let webhookSetup = null;

    if (state.botToken) {
      botCheck = await callZaloApi('getMe', {});
      if (botCheck.ok) {
        const r = botCheck.result || {};
        state.botProfile = {
          id: r.id || r.bot_id || '',
          name: r.account_name || r.display_name || r.first_name || r.username || 'Zalo Trực Ban Bot',
          verifiedAt: new Date().toISOString()
        };
      }

      const candidateOrigin = resolvePublicOrigin(detectedOrigin);
      const isPublicHttps = /^https:\/\/(?!localhost|127\.0\.0\.1)/i.test(candidateOrigin);

      if (isPublicHttps && !preferPolling) {
        const targetWebhookUrl = `${candidateOrigin}/api/zalo/webhook`;
        webhookSetup = await callZaloApi('setWebhook', {
          url: targetWebhookUrl,
          secret_token: state.webhookSecret
        });
        if (webhookSetup.ok) {
          state.webhookActive = true;
          state.webhookUrl = targetWebhookUrl;
          stopPolling();
        } else {
          state.webhookActive = false;
          state.webhookUrl = '';
          startPollingIfNeeded();
        }
      } else {
        await callZaloApi('deleteWebhook', {});
        state.webhookActive = false;
        state.webhookUrl = '';
        startPollingIfNeeded();
      }
    } else {
      state.botProfile = null;
      state.webhookActive = false;
      state.webhookUrl = '';
      stopPolling();
    }

    persistState();
    return {
      ok: true,
      botCheck,
      webhookSetup,
      status: getPublicStatus()
    };
  }

  function unlinkBinding({ chatId, unitCode } = {}) {
    const before = state.bindings.length;
    state.bindings = state.bindings.filter(b => {
      if (chatId && unitCode) {
        return !(String(b.chatId) === String(chatId) && normalizeUnitCode(b.unitCode) === normalizeUnitCode(unitCode));
      }
      if (chatId) return String(b.chatId) !== String(chatId);
      if (unitCode) return normalizeUnitCode(b.unitCode) !== normalizeUnitCode(unitCode);
      return true;
    });
    persistState();
    return { ok: true, removed: before - state.bindings.length, bindings: state.bindings };
  }

  function getPublicStatus() {
    return {
      ok: true,
      enabled: state.enabled,
      hasToken: Boolean(state.botToken),
      maskedToken: maskToken(state.botToken),
      botProfile: state.botProfile,
      mode: state.botToken ? (state.webhookActive ? 'WEBHOOK_REALTIME' : 'LONG_POLLING') : 'SIMULATION_READY',
      webhookActive: state.webhookActive,
      webhookUrl: state.webhookUrl,
      publicBaseUrl: resolvePublicOrigin(),
      demoFastMode: Boolean(state.demoFastMode),
      reminderSeconds: state.reminderSeconds,
      escalationSeconds: state.escalationSeconds,
      effectiveReminderSeconds: Math.round(getEffectiveReminderMs() / 1000),
      effectiveEscalationSeconds: Math.round(getEffectiveEscalationMs() / 1000),
      presets: PRESET_ZALO_UNITS,
      bindings: state.bindings,
      recentOutbox: state.outboxLog.slice(-15).reverse()
    };
  }

  /**
   * Render a crisp mobile-first confirmation screen when an officer taps the
   * 1-Tap Quick-Accept link inside Zalo on their phone, including an instant
   * officer-name update box if a different officer in the group tapped the link!
   */
  function renderQuickAcceptHtml({ ok, incident, error = '', alreadyHandled = false, chatId = '', sig = '' }) {
    const title = ok
      ? `Đã Tiếp Nhận Ca #${escapeHtml(incident?.id || '')}`
      : `Thông Báo Tiếp Nhận SOS`;
    const gmapsUrl = incident
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.lat)},${encodeURIComponent(incident.lng)}`
      : 'https://www.google.com/maps';
    const telHref = incident?.reporterPhone ? `tel:${escapeHtml(incident.reporterPhone)}` : '';
    const currentOfficerName = incident?.dispatchUnit?.officerName || '';
    const currentOfficerTitle = incident?.dispatchUnit?.officerFullTitle || currentOfficerName || 'Cán bộ trực ban';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta property="og:title" content="Bấm Tiếp Nhận Ca SOS Khẩn Cấp — SOS Việt Nam 2026" />
  <title>${title} — SOS Việt Nam 2026</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 18px; }
    .card { width: 100%; max-width: 450px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${ok ? '#10b981' : '#f59e0b'}; border-radius: 18px; padding: 22px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.65); }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.4px; background: ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${ok ? '#34d399' : '#fbbf24'}; border: 1px solid ${ok ? 'rgba(16,185,129,0.45)' : 'rgba(245,158,11,0.45)'}; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 8px 0; line-height: 1.3; color: #ffffff; }
    .meta { background: rgba(2, 6, 23, 0.65); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 12px 14px; margin: 14px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .meta b { color: #f8fafc; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 14px 16px; border-radius: 12px; font-weight: 800; font-size: 15px; margin-top: 10px; border: none; cursor: pointer; }
    .btn-map { background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35); }
    .btn-call { background: linear-gradient(135deg, #0284c7, #38bdf8); color: #ffffff; }
    .btn-web { background: rgba(255,255,255,0.08); color: #94a3b8; font-size: 13px; border: 1px solid rgba(255,255,255,0.14); }
    .officer-box { background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; }
    .officer-box label { display: block; font-size: 11.5px; color: #7dd3fc; font-weight: 700; margin-bottom: 5px; }
    .officer-row { display: flex; gap: 6px; }
    .officer-row input { flex: 1; background: rgba(2, 6, 23, 0.8); border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 8px; padding: 8px 10px; color: #fff; font-size: 13.5px; }
    .officer-row button { background: #0284c7; color: #fff; border: none; border-radius: 8px; padding: 8px 12px; font-weight: 700; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
    .foot { margin-top: 14px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${ok ? (alreadyHandled ? 'ĐÃ ĐƯỢC TIẾP NHẬN TRƯỚC ĐÓ' : 'TIẾP NHẬN THÀNH CÔNG QUA ZALO') : 'KHÔNG THỂ TIẾP NHẬN'}</div>
    <h1>${ok ? `Hồ sơ khẩn cấp #${escapeHtml(incident.id)}` : 'Không thể xác nhận hồ sơ'}</h1>
    ${ok ? `
      <div style="font-size: 13.5px; color: #86efac; font-weight: 600; margin-bottom: 10px;">
        ${alreadyHandled
          ? `Ca này đang được lực lượng điều động xử lý (${escapeHtml(incident.dispatchUnit?.unitName || incident.assignedUnit?.name || '')}).`
          : `Hệ thống Trung tâm Chỉ huy đã ghi nhận xuất phát, tắt còi báo động & hủy đếm ngược leo thang!`}
      </div>
      <div class="meta">
        <div><b>Đơn vị điều động:</b> ${escapeHtml(incident.dispatchUnit?.unitName || incident.assignedUnit?.name || '')}</div>
        <div><b>Cán bộ tiếp nhận:</b> <span id="lblOfficerTitle">${escapeHtml(currentOfficerTitle)}</span></div>
        <div><b>Người dân cần cứu hộ:</b> ${escapeHtml(incident.reporterName || '')}</div>
        <div><b>Số điện thoại:</b> ${escapeHtml(incident.reporterPhone || '')}</div>
        <div><b>Địa điểm hiện trường:</b> ${escapeHtml(incident.address || '')}</div>
        <div><b>Tọa độ GPS:</b> ${Number(incident.lat).toFixed(5)}, ${Number(incident.lng).toFixed(5)}</div>
      </div>
      ${chatId && sig ? `
      <form class="officer-box" method="GET" action="/api/zalo/quick-accept">
        <input type="hidden" name="id" value="${escapeHtml(incident.id)}" />
        <input type="hidden" name="chat" value="${escapeHtml(chatId)}" />
        <input type="hidden" name="sig" value="${escapeHtml(sig)}" />
        <label>👮 Đổi họ tên / cấp bậc cán bộ trực tiếp nhận ca (nếu cần):</label>
        <div class="officer-row">
          <input type="text" name="officer" value="${escapeHtml(currentOfficerName)}" placeholder="VD: Đại úy Vĩnh An" required />
          <button type="submit">Cập nhật tên</button>
        </div>
      </form>
      ` : ''}
      <a class="btn btn-map" href="${gmapsUrl}" target="_blank" rel="noopener">MỞ GOOGLE MAPS DẪN ĐƯỜNG TỚI NẠN NHÂN</a>
      ${telHref ? `<a class="btn btn-call" href="${telHref}">GỌI ĐIỆN NGAY CHO NGƯỜI DÂN (${escapeHtml(incident.reporterPhone)})</a>` : ''}
    ` : `
      <div class="meta">${escapeHtml(error || 'Liên kết không hợp lệ hoặc ca sự cố đã kết thúc.')}</div>
    `}
    <a class="btn btn-web" href="/dispatcher.html">Mở Bàn Chỉ Huy Trực Ban Web</a>
    <div class="foot">Hệ Thống Điều Phối Cứu Hộ Quốc Gia — SOS Việt Nam 2026</div>
  </div>
</body>
</html>`;
  }

  // Auto-populate bot profile & start background polling if needed on boot
  if (state.botToken) {
    ensureBotProfile().catch(() => {});
    if (!state.webhookActive) {
      startPollingIfNeeded();
    }
  }

  return {
    getPublicStatus,
    updateConfig,
    resolveUnitByCode,
    resolveUnitByCodeOrQuery,
    registerCustomUnit,
    bindChatToUnit,
    updateBinding,
    unlinkBinding,
    sendZaloMessage,
    onIncidentCreated,
    onIncidentEscalated,
    onIncidentAcceptedOrClosed,
    clearIncidentZaloTimer,
    clearAllIncidentTimers,
    handleWebhookPayload,
    verifyQuickAccept,
    renderQuickAcceptHtml,
    getEffectiveEscalationMs,
    getEffectiveReminderMs,
    stopPolling
  };
}
