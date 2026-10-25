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
 * 2. Zero-Phone-Number Self-Onboarding via `/ketnoi <MA_DON_VI>` in 1-1 or Group chat.
 * 3. Two-Way Field Acceptance directly on smartphone:
 *    - 1-Tap HMAC-SHA256 signed URL (`GET /api/zalo/quick-accept?id=...&chat=...&sig=...`)
 *    - Direct chat reply `TN` or `TN <MA_SOS>` (supports `@BotName TN` in Zalo Groups)
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
    .replace(/\b(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran|p\.?|x\.?)\b/g, ' ')
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
    defaultOfficerName: 'Nguyễn Minh Hoàng',
    defaultOfficerRank: 'Trung tá',
    defaultPhone: '02923894939'
  },
  {
    unitCode: 'cap_ninhkieu',
    unitName: 'Công An Phường Ninh Kiều, TP. Cần Thơ',
    agency: 'police',
    agencyLabel: 'Công An Cấp Xã/Phường',
    level: 'ward',
    province: 'Cần Thơ',
    ward: 'Phường Ninh Kiều',
    defaultOfficerName: 'Trực ban CA Phường Ninh Kiều',
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
    defaultOfficerName: 'Trực ban CA Phường Long Tuyền',
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
    defaultOfficerName: 'Trực ban CA Phường Cái Răng',
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
  acceptIncidentFromZalo = () => ({ ok: false, error: 'Not wired' }),
  escalateIncidentFromTimer = null
} = {}) {
  const defaultConfig = {
    enabled: true,
    botToken: process.env.ZALO_BOT_TOKEN || '',
    apiBaseUrl: process.env.ZALO_BOT_API_BASE || DEFAULT_ZALO_API_BASE,
    publicBaseUrl: process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '',
    webhookSecret: crypto.randomBytes(20).toString('hex'),
    hmacSecret: crypto.randomBytes(32).toString('hex'),
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
    bindings: [],             // [{ chatId, chatTitle, chatType, senderName, unitCode, unitName, agency, level, province, ward, linkedAt, enabled }]
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
    state.webhookSecret = crypto.randomBytes(20).toString('hex');
  }
  if (!state.hmacSecret || state.hmacSecret.length < 24) {
    state.hmacSecret = crypto.randomBytes(32).toString('hex');
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

  function signQuickAccept(incidentId, chatId = '') {
    return crypto
      .createHmac('sha256', state.hmacSecret)
      .update(`${incidentId}|${chatId}`)
      .digest('hex')
      .slice(0, 32);
  }

  function verifyQuickAccept(incidentId, chatId = '', signature = '') {
    if (!incidentId || !signature) return false;
    const expected = signQuickAccept(incidentId, chatId);
    const a = Buffer.from(String(signature));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
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
          defaultOfficerName: (acc.officerName && acc.officerName !== 'Đang cập nhật') ? acc.officerName : 'Cán bộ trực ban',
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
          defaultOfficerName: st.officerName || 'Cán bộ trực ban',
          defaultOfficerRank: st.officerRank || 'Cán bộ',
          defaultPhone: st.phone || '113'
        };
      }
    }

    return null;
  }

  /**
   * Register or get a deterministic unit code for any { province, ward, agency, level, unitName }
   */
  function registerCustomUnit({ unitCode, unitName, agency = 'police', level = 'ward', province = 'Cần Thơ', ward = '', officerName = '', officerRank = '', phone = '' }) {
    const provSlug = normalizeGeoSlug(province).replace(/\s+/g, '') || 'vn';
    const wardSlug = normalizeGeoSlug(ward).replace(/\s+/g, '');
    const prefix = agency === 'csgt' ? 'csgt' : (agency === 'fire' ? 'pccc' : (agency === 'hospital' ? 'capcuu' : (level === 'province' ? 'chihuy' : 'cap')));
    const finalCode = normalizeUnitCode(unitCode || (wardSlug ? `${prefix}_${wardSlug}_${provSlug.slice(0, 4)}` : `${prefix}_${provSlug}`));

    const unitDef = {
      unitCode: finalCode,
      unitName: unitName || (ward ? `Công An ${ward}, ${province}` : `Trực Ban ${prefix.toUpperCase()} ${province}`),
      agency,
      agencyLabel: agency === 'police' ? 'Công An Địa Phương' : (agency === 'csgt' ? 'Cảnh Sát Giao Thông' : (agency === 'fire' ? 'Cảnh Sát PCCC & CNCH' : (agency === 'hospital' ? 'Cấp Cứu 115' : 'Chỉ Huy Tổng Hợp'))),
      level: level || (ward ? 'ward' : 'province'),
      province: province || 'Cần Thơ',
      ward: ward || '',
      defaultOfficerName: officerName || 'Cán bộ trực ban Zalo',
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
  async function callZaloApi(method, payload = {}, tokenOverride = '') {
    const token = String(tokenOverride || state.botToken || '').trim();
    if (!token) {
      return { ok: false, simulated: true, error: 'Chưa cấu hình BOT_TOKEN Zalo' };
    }

    const baseUrl = String(state.apiBaseUrl || DEFAULT_ZALO_API_BASE).replace(/\/+$/, '');
    const endpoint = `${baseUrl}/bot${token}/${method}`;
    try {
      const controller = new AbortController();
      const timeoutMs = method === 'getUpdates' ? 15000 : 8000;
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

  function formatIncidentZaloAlert(incident, binding, stage = 'initial', fallbackOrigin = '') {
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`;
    const quickAcceptUrl = buildQuickAcceptUrl(incident.id, binding.chatId, fallbackOrigin);
    const tagsText = Array.isArray(incident.incidentTags) && incident.incidentTags.length > 0
      ? incident.incidentTags.join(' | ')
      : (incident.agencyName || 'Cần hỗ trợ khẩn cấp');
    const sourceLine = incident.isHardwareSos
      ? `📡 Thiết bị phát: ${incident.hardwareModel || 'Kit 4G GPS ESP32-C3 TDM2421'} (${incident.hardwareTargetLabel || 'Nút bấm khẩn cấp IoT'})`
      : `📱 Nguồn báo: Cổng Cứu Hộ Quốc Gia SOS Việt Nam`;

    const reminderSec = Math.round(getEffectiveReminderMs() / 1000);
    const escalationSec = Math.round(getEffectiveEscalationMs() / 1000);
    const remainingMin = Math.max(1, Math.round((escalationSec - reminderSec) / 60));

    if (stage === 'reminder') {
      const elapsedLabel = reminderSec >= 60 ? `${Math.round(reminderSec / 60)} phút` : `${reminderSec} giây`;
      return [
        `⚠️ [NHẮC KHẨN LẦN 2 - CHƯA AI TIẾP NHẬN!]`,
        `🆔 Mã hồ sơ: #${incident.id}`,
        `🏢 Đơn vị trực: ${binding.unitName || incident.assignedUnit?.name || 'Đơn vị cơ sở'}`,
        `⏱️ Cảnh báo: Đã qua ${elapsedLabel} nhưng ca SOS vẫn đang CHỜ TIẾP NHẬN!`,
        `👤 Người dân: ${incident.reporterName || 'Người dân'} — SĐT: ${incident.reporterPhone || 'Đang cập nhật'}`,
        `📍 Vị trí: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
        `⏳ Lưu ý: Sẽ tự động LEO THANG lên Chỉ Huy Cấp Tỉnh/TP nếu không tiếp nhận kịp thời (${state.demoFastMode ? `sau ${escalationSec - reminderSec} giây` : `còn ~${remainingMin} phút`})!`,
        ``,
        `🧭 Mở bản đồ dẫn đường:`,
        gmapsUrl,
        ``,
        `✅ BẤM 1 CHẠM ĐỂ TIẾP NHẬN NGAY:`,
        quickAcceptUrl,
        ``,
        `💬 Hoặc trả lời tin nhắn này: TN`
      ].join('\n');
    }

    if (stage === 'escalated') {
      return [
        `🚨⚡ [BÁO ĐỘNG LEO THANG CẤP TỈNH/TP]`,
        `🆔 Mã hồ sơ: #${incident.id}`,
        `🏛️ Chuyển quyền chỉ huy lên: ${incident.provinceUnit?.name || binding.unitName || 'Trung Tâm Chỉ Huy Tỉnh/TP'}`,
        `⚠️ Lý do: Đơn vị cơ sở (${incident.previousAssignedUnit?.name || incident.assignedUnit?.name || 'Cấp Xã/Phường'}) quá thời gian quy định chưa tiếp nhận xử lý!`,
        `📋 Nội dung: ${tagsText}`,
        `👤 Người báo: ${incident.reporterName || 'Người dân'} — SĐT: ${incident.reporterPhone || 'Đang cập nhật'}`,
        `📍 Hiện trường: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
        ``,
        `🧭 Dẫn đường Google Maps tới nạn nhân:`,
        gmapsUrl,
        ``,
        `✅ CHỈ HUY BẤM TIẾP NHẬN ĐIỀU ĐỘNG NGAY:`,
        quickAcceptUrl,
        ``,
        `💬 Hoặc trả lời tin nhắn này: TN ${incident.id}`
      ].join('\n');
    }

    return [
      `🚨 [BÁO ĐỘNG KHẨN CẤP SOS #${incident.id}]`,
      `🏢 Đơn vị phụ trách: ${binding.unitName || incident.assignedUnit?.name || 'Đơn vị Trực ban'}`,
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
      `✅ BẤM LINK TIẾP NHẬN NGAY TRÊN ĐIỆN THOẠI:`,
      quickAcceptUrl,
      ``,
      `💬 Hoặc trả lời tin nhắn này chữ: TN (trong nhóm gõ @TênBot TN)`
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

    // Optional: if demoFastMode is enabled and server wants fast escalation callback
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

    const notifiedSet = incidentNotifiedChats.get(incident.id) || new Set();
    incidentNotifiedChats.set(incident.id, notifiedSet);

    // Notify local chats that authority has escalated to Provincial HQ
    const prevTargets = state.bindings.filter(b => notifiedSet.has(String(b.chatId)) && b.level === 'ward');
    for (const prev of prevTargets) {
      await sendZaloMessage(
        prev.chatId,
        `⚡ [ĐÃ CHUYỂN CẤP CHỈ HUY TỈNH/TP]\nCa sự cố #${incident.id} đã quá thời gian chờ tại cơ sở và được chuyển quyền điều phối lên: ${incident.provinceUnit?.name || 'Chỉ Huy Cấp Tỉnh/TP'}.`,
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
      const sourceChannel = via === 'zalo' ? 'Zalo Trực Ban Di Động' : 'Bàn Chỉ Huy Web';
      const confirmMsg = [
        `✅ [ĐÃ TIẾP NHẬN & ĐIỀU ĐỘNG LỰC LƯỢNG]`,
        `🆔 Mã sự cố: #${incident.id}`,
        `👮 Cán bộ tiếp nhận: ${officerLabel} (${unitLabel})`,
        `📲 Kênh xác nhận: ${sourceChannel}`,
        `🛑 Hệ thống đã tắt nhắc khẩn & hủy đếm ngược leo thang cho ca này.`
      ].join('\n');

      for (const chatId of notifiedSet) {
        if (acceptedChatId && String(chatId) === String(acceptedChatId) && via === 'zalo_chat') {
          // The replying chat already gets a direct reply in handleIncomingCommand
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
   * into a uniform array of `{ messageId, chatId, chatType, chatTitle, senderId, senderName, text }`.
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
      const msg = item.message || item.data?.message || (item.chat && item.text ? item : null);
      if (!msg || typeof msg !== 'object') continue;

      const chat = msg.chat || {};
      const from = msg.from || msg.sender || {};
      const chatId = String(chat.id || msg.chat_id || from.id || '').trim();
      const text = String(msg.text || msg.content || '').trim();
      if (!chatId || !text) continue;

      const messageId = String(msg.message_id || item.update_id || `${chatId}_${msg.date || Date.now()}_${text.slice(0, 24)}`);
      const chatType = String(chat.chat_type || chat.type || 'PRIVATE').toUpperCase();
      const senderName = String(from.display_name || from.first_name || from.name || 'Cán bộ Zalo').trim();
      const chatTitle = String(chat.title || chat.display_name || (chatType === 'GROUP' ? `Nhóm Zalo (${senderName})` : senderName)).trim();

      normalized.push({
        messageId,
        chatId,
        chatType,
        chatTitle,
        senderId: String(from.id || ''),
        senderName,
        text
      });
    }
    return normalized;
  }

  function bindChatToUnit({ chatId, chatTitle, chatType = 'GROUP', senderName = '', unitDef }) {
    const cleanChatId = String(chatId).trim();
    const existingIdx = state.bindings.findIndex(
      b => String(b.chatId) === cleanChatId && normalizeUnitCode(b.unitCode) === normalizeUnitCode(unitDef.unitCode)
    );

    const record = {
      chatId: cleanChatId,
      chatTitle: chatTitle || unitDef.unitName,
      chatType: chatType || 'GROUP',
      senderName: senderName || unitDef.defaultOfficerName || 'Cán bộ trực ban',
      unitCode: unitDef.unitCode,
      unitName: unitDef.unitName,
      agency: unitDef.agency || 'police',
      agencyLabel: unitDef.agencyLabel || 'Đơn vị Trực ban',
      level: unitDef.level || 'ward',
      province: unitDef.province || 'Cần Thơ',
      ward: unitDef.ward || '',
      defaultOfficerName: unitDef.defaultOfficerName || senderName || 'Cán bộ trực ban',
      defaultOfficerRank: unitDef.defaultOfficerRank || 'Cán bộ',
      defaultPhone: unitDef.defaultPhone || '113',
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
   * Process an incoming Zalo message (`/start`, `/ketnoi <code>`, `/huyketnoi`, `/danhsach`, `TN`, `TN <id>`)
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

    // Strip leading @BotMention in Zalo Group messages, e.g. "@BotSOS /ketnoi cap_tanan" or "@BotSOS TN"
    const cleanedText = msg.text.replace(/^(?:@\S+\s+)+/g, '').trim();
    const lowerAscii = stripVietnameseTones(cleanedText).toLowerCase().trim();

    // 1. Check `/ketnoi <code>` anywhere in message
    const ketnoiMatch = cleanedText.match(/\/?(?:ketnoi|ket_noi|lienket|pair)\s+([a-zA-Z0-9_-]+)/i);
    if (ketnoiMatch) {
      const requestedCode = normalizeUnitCode(ketnoiMatch[1]);
      const unitDef = resolveUnitByCode(requestedCode);
      if (!unitDef) {
        const reply = [
          `❌ Không tìm thấy mã đơn vị "${requestedCode}".`,
          `👉 Các mã mẫu sẵn sàng kết nối ngay:`,
          `• /ketnoi cap_tanan (CA Phường Tân An - Cần Thơ)`,
          `• /ketnoi cap_longtuyen (CA Phường Long Tuyền)`,
          `• /ketnoi csgt_cantho (Đội CSGT TP. Cần Thơ)`,
          `• /ketnoi pccc_cantho (Đội PCCC & CNCH Cần Thơ)`,
          `• /ketnoi chihuy_cantho (Chỉ Huy Công An TP. Cần Thơ)`,
          `Hoặc mở Bàn Chỉ Huy Web -> bấm "Bot Zalo" để lấy mã của bất kỳ Xã/Phường nào trên toàn quốc!`
        ].join('\n');
        await sendZaloMessage(msg.chatId, reply, { meta: { stage: 'cmd_ketnoi_invalid' } });
        return { handled: true, action: 'ketnoi_invalid', code: requestedCode };
      }

      const binding = bindChatToUnit({
        chatId: msg.chatId,
        chatTitle: msg.chatTitle,
        chatType: msg.chatType,
        senderName: msg.senderName,
        unitDef
      });

      const scopeDesc = binding.level === 'national'
        ? 'Toàn Quốc (Tất cả sự cố)'
        : (binding.ward ? `${binding.ward}, ${binding.province}` : `Toàn địa bàn ${binding.province}`);

      const confirmText = [
        `✅ LIÊN KẾT BOT TRỰC BAN THÀNH CÔNG!`,
        `🏢 Đơn vị: ${binding.unitName}`,
        `🛡️ Lực lượng: ${binding.agencyLabel}`,
        `📍 Phạm vi nhận báo động: ${scopeDesc}`,
        `👤 Người kích hoạt: ${msg.senderName}`,
        ``,
        `🔔 Từ bây giờ, mọi tín hiệu SOS thuộc địa bàn trên sẽ báo tức thì vào khung chat này.`,
        `💡 Khi có báo động, đồng chí chỉ cần bấm Link Tiếp Nhận hoặc nhắn lại chữ "TN" để nhận ca!`
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
          ? `🛑 Đã hủy liên kết ${removed} đơn vị trực ban khỏi khung chat Zalo này.`
          : `ℹ️ Khung chat này hiện chưa liên kết với đơn vị nào.`,
        { meta: { stage: 'cmd_unlink' } }
      );
      return { handled: true, action: 'unlink', removed };
    }

    // 3. Check `/danhsach` or `/trangthai`
    if (/^\/?(?:danhsach|trangthai|status)\b/i.test(lowerAscii)) {
      const myBindings = state.bindings.filter(b => String(b.chatId) === String(msg.chatId));
      const reply = myBindings.length === 0
        ? `ℹ️ Khung chat này chưa gắn với đơn vị nào.\nHãy gõ: /ketnoi cap_tanan (hoặc mã đơn vị trên Bàn Chỉ Huy Web) để nhận báo động SOS!`
        : [
            `📋 ĐƠN VỊ ĐANG TRỰC TRÊN KHUNG CHAT NÀY (${myBindings.length}):`,
            ...myBindings.map((b, i) => `${i + 1}. ${b.unitName} [Mã: ${b.unitCode}]`),
            `\n💬 Gõ /huyketnoi nếu muốn ngắt nhận thông báo.`
          ].join('\n');
      await sendZaloMessage(msg.chatId, reply, { meta: { stage: 'cmd_status' } });
      return { handled: true, action: 'status', bindings: myBindings };
    }

    // 4. Two-way Field Acceptance command: `TN` or `TN <SOS_ID>` or `TIEP NHAN`
    const tnMatch = lowerAscii.match(/^(?:\/?tn|tiep\s*nhan|nhan\s*ca)(?:\s+#?([a-z0-9-]+))?$/i);
    if (tnMatch) {
      const explicitId = tnMatch[1] ? tnMatch[1].toUpperCase() : '';
      const targetIncidentId = explicitId || chatLatestIncident.get(String(msg.chatId)) || '';

      if (!targetIncidentId) {
        await sendZaloMessage(
          msg.chatId,
          `ℹ️ Hiện không có ca sự cố khẩn cấp nào đang chờ tiếp nhận tại khung chat này (hoặc gõ: TN <Mã-SOS>).`,
          { meta: { stage: 'cmd_tn_empty' } }
        );
        return { handled: true, action: 'tn_no_incident' };
      }

      const myBinding = state.bindings.find(b => String(b.chatId) === String(msg.chatId));
      const acceptResult = acceptIncidentFromZalo({
        incidentId: targetIncidentId,
        chatId: msg.chatId,
        binding: myBinding || null,
        officerName: msg.senderName || myBinding?.defaultOfficerName || 'Cán bộ trực Zalo',
        officerRank: myBinding?.defaultOfficerRank || 'Cán bộ',
        unitName: myBinding?.unitName || '',
        officerPhone: myBinding?.defaultPhone || '',
        via: 'zalo_chat'
      });

      if (!acceptResult || !acceptResult.ok) {
        await sendZaloMessage(
          msg.chatId,
          `⚠️ Không thể tiếp nhận ca #${targetIncidentId}: ${acceptResult?.error || 'Ca đã được xử lý hoặc không tồn tại.'}`,
          { meta: { stage: 'cmd_tn_fail', incidentId: targetIncidentId } }
        );
        return { handled: true, action: 'tn_failed', error: acceptResult?.error };
      }

      const inc = acceptResult.incident;
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${inc.lat},${inc.lng}`;
      const reply = [
        `✅ ĐÃ XÁC NHẬN TIẾP NHẬN CA #${inc.id}!`,
        `👮 Cán bộ nhận lệnh: ${inc.dispatchUnit?.officerFullTitle || msg.senderName}`,
        `🏢 Đơn vị: ${inc.dispatchUnit?.unitName || myBinding?.unitName || ''}`,
        `👤 Nạn nhân: ${inc.reporterName} — SĐT: ${inc.reporterPhone}`,
        `📍 Vị trí: ${inc.address}`,
        `🧭 Mở Google Maps dẫn đường ngay:`,
        gmapsUrl
      ].join('\n');

      await sendZaloMessage(msg.chatId, reply, {
        province: myBinding?.province || '',
        meta: { stage: 'cmd_tn_ok', incidentId: inc.id }
      });
      return { handled: true, action: 'tn_accepted', incidentId: inc.id };
    }

    // 5. `/start` or `/help`
    if (/^\/?(?:start|help|huongdan|batdau)\b/i.test(lowerAscii)) {
      const helpText = [
        `🛡️ HỆ THỐNG BOT TRỰC BAN KHẨN CẤP — SOS VIỆT NAM 2026`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `1️⃣ Liên kết Nhóm Zalo hoặc Cá nhân với Đơn vị:`,
        `• /ketnoi cap_tanan  (Công an Phường Tân An)`,
        `• /ketnoi csgt_cantho (Đội CSGT Cần Thơ)`,
        `• /ketnoi pccc_cantho (Đội PCCC & CNCH Cần Thơ)`,
        `• /ketnoi chihuy_cantho (Chỉ Huy Công An TP. Cần Thơ)`,
        `(Trong Nhóm Zalo, hãy tag @TênBot trước câu lệnh)`,
        ``,
        `2️⃣ Tiếp nhận sự cố 2 chiều ngay khi đi ăn cơm / tuần tra:`,
        `• Bấm vào Link Tiếp Nhận 1 Chạm trong tin báo động`,
        `• Hoặc nhắn lại: TN (hoặc @TênBot TN)`,
        ``,
        `3️⃣ Lệnh tra cứu khác:`,
        `• /danhsach — Xem đơn vị đang gắn với nhóm này`,
        `• /huyketnoi — Ngắt nhận thông báo tại nhóm này`
      ].join('\n');
      await sendZaloMessage(msg.chatId, helpText, { meta: { stage: 'cmd_help' } });
      return { handled: true, action: 'help' };
    }

    return { handled: false };
  }

  async function handleWebhookPayload(payload, { secretHeader = '', origin = '', skipSecretCheck = false } = {}) {
    if (!skipSecretCheck && state.webhookActive && state.webhookSecret) {
      if (secretHeader && secretHeader !== state.webhookSecret) {
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

  /**
   * Background `getUpdates` long-polling loop when running without HTTPS webhook (e.g., localhost)
   * or when user chooses polling mode.
   */
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

  /**
   * Configure token, timers, and auto-connect webhook (if public HTTPS) or fallback polling.
   */
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
    if (Number.isFinite(Number(escalationSeconds)) && Number(escalationSeconds) >= 30) {
      state.escalationSeconds = Number(escalationSeconds);
    }
    if (typeof publicBaseUrl === 'string' && publicBaseUrl.trim()) {
      state.publicBaseUrl = publicBaseUrl.trim().replace(/\/+$/, '');
    }

    if (typeof botToken === 'string') {
      const trimmed = botToken.trim();
      // Ignore masked placeholder if UI re-submits without changing token
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
   * 1-Tap Quick-Accept link inside Zalo on their phone!
   */
  function renderQuickAcceptHtml({ ok, incident, error = '', alreadyHandled = false }) {
    const title = ok
      ? `Đã Tiếp Nhận Ca #${escapeHtml(incident?.id || '')}`
      : `Thông Báo Tiếp Nhận SOS`;
    const gmapsUrl = incident
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.lat)},${encodeURIComponent(incident.lng)}`
      : 'https://www.google.com/maps';
    const telHref = incident?.reporterPhone ? `tel:${escapeHtml(incident.reporterPhone)}` : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>${title} — SOS Việt Nam 2026</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 18px; }
    .card { width: 100%; max-width: 440px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${ok ? '#10b981' : '#f59e0b'}; border-radius: 18px; padding: 22px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.65); }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.4px; background: ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${ok ? '#34d399' : '#fbbf24'}; border: 1px solid ${ok ? 'rgba(16,185,129,0.45)' : 'rgba(245,158,11,0.45)'}; margin-bottom: 12px; }
    h1 { font-size: 20px; margin: 0 0 8px 0; line-height: 1.3; color: #ffffff; }
    .meta { background: rgba(2, 6, 23, 0.65); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 12px 14px; margin: 14px 0; font-size: 14px; line-height: 1.55; color: #cbd5e1; }
    .meta b { color: #f8fafc; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 14px 16px; border-radius: 12px; font-weight: 800; font-size: 15px; margin-top: 10px; border: none; cursor: pointer; }
    .btn-map { background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35); }
    .btn-call { background: linear-gradient(135deg, #0284c7, #38bdf8); color: #ffffff; }
    .btn-web { background: rgba(255,255,255,0.08); color: #94a3b8; font-size: 13px; border: 1px solid rgba(255,255,255,0.14); }
    .foot { margin-top: 14px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${ok ? (alreadyHandled ? 'ĐÃ ĐƯỢC TIẾP NHẬN TRƯỚC ĐÓ' : 'TIẾP NHẬN THÀNH CÔNG QUA ZALO') : 'KHÔNG THỂ TIẾP NHẬN'}</div>
    <h1>${ok ? `Hồ sơ khẩn cấp #${escapeHtml(incident.id)}` : 'Không thể xác nhận hồ sơ'}</h1>
    ${ok ? `
      <div style="font-size: 13.5px; color: #86efac; font-weight: 600;">
        ${alreadyHandled
          ? `Ca này đã được điều động xử lý (${escapeHtml(incident.dispatchUnit?.unitName || incident.assignedUnit?.name || '')}).`
          : `Hệ thống Trung tâm Chỉ huy đã ghi nhận đơn vị xuất phát, đồng thời tắt còi báo động & hủy đếm ngược leo thang!`}
      </div>
      <div class="meta">
        <div><b>Đơn vị điều động:</b> ${escapeHtml(incident.dispatchUnit?.unitName || incident.assignedUnit?.name || '')}</div>
        <div><b>Người dân cần cứu hộ:</b> ${escapeHtml(incident.reporterName || '')}</div>
        <div><b>Số điện thoại:</b> ${escapeHtml(incident.reporterPhone || '')}</div>
        <div><b>Địa điểm hiện trường:</b> ${escapeHtml(incident.address || '')}</div>
        <div><b>Tọa độ GPS:</b> ${Number(incident.lat).toFixed(5)}, ${Number(incident.lng).toFixed(5)}</div>
      </div>
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

  // Start background polling if a token was persisted without active webhook
  if (state.botToken && !state.webhookActive) {
    startPollingIfNeeded();
  }

  return {
    getPublicStatus,
    updateConfig,
    resolveUnitByCode,
    registerCustomUnit,
    bindChatToUnit,
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
