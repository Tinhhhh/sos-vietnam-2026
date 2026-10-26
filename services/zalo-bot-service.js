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
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { readRuntimeData, writeRuntimeData } from './runtime-data-store.js';
import { defaultPasswordForAccount } from './agency-password-policy.js';
import { securityCryptoService } from './security-crypto-service.js';

const __zaloServiceDir = path.dirname(fileURLToPath(import.meta.url));
const ZALO_PROJECT_ROOT = path.join(__zaloServiceDir, '..');

let _crcTable = null;
function crc32Buffer(buf) {
  if (!_crcTable) {
    _crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      _crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = _crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32Buffer(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

/**
 * Pure-Node zero-dependency RGB PNG Tactical Video Card generator (480x270)
 * Used as guaranteed visual fallback when client posterDataUrl is absent and ffmpeg cannot decode synthetic bytes.
 */
function buildSyntheticVideoPosterPngBuffer(width = 480, height = 270) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const circleR = 42;
  const circleR2 = circleR * circleR;

  for (let y = 0; y < height; y++) {
    const rowOff = y * stride;
    raw[rowOff] = 0; // filter type 0
    const isTopOrBottomAccent = y < 6 || y >= height - 6;
    const isBanner = (y >= 16 && y < 44);
    for (let x = 0; x < width; x++) {
      const px = rowOff + 1 + x * 3;
      let r = 11;
      let g = 20 + Math.floor((y / height) * 18);
      let b = 42 + Math.floor((x / width) * 24);

      if (isTopOrBottomAccent) {
        r = 56; g = 189; b = 248; // #38bdf8 tactical cyan border
      } else if (isBanner && x >= 16 && x < 190) {
        r = 220; g = 38; b = 38; // #dc2626 SOS LIVE VIDEO badge bar
      }

      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= circleR2) {
        if (dist2 >= (circleR - 3) * (circleR - 3)) {
          r = 255; g = 255; b = 255;
        } else {
          // White Play Triangle inside red circle: dx in [-11..18], |dy| <= (18 - dx) * 0.58
          const inTri = dx >= -11 && dx <= 18 && Math.abs(dy) <= (18 - dx) * 0.58;
          if (inTri) {
            r = 255; g = 255; b = 255;
          } else {
            r = 220; g = 38; b = 38;
          }
        }
      }
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idatData = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idatData),
    makePngChunk('IEND', Buffer.alloc(0))
  ]);
}

function resolveFfmpegBinary() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (process.platform === 'win32') {
    const winGetPath = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');
    if (winGetPath && fs.existsSync(winGetPath)) return winGetPath;
  }
  return 'ffmpeg';
}

function runFfmpegOnce(ffmpegBin, args, timeoutMs = 6500) {
  return new Promise((resolve) => {
    execFile(ffmpegBin, args, { timeout: timeoutMs, windowsHide: true }, (err) => {
      resolve(!err);
    });
  });
}

async function extractVideoPosterViaFfmpeg(videoBuffer, ext = 'mp4') {
  if (!Buffer.isBuffer(videoBuffer) || videoBuffer.length < 128) return '';
  const runtimeBase = process.env.SOS_RUNTIME_DATA_DIR
    ? path.resolve(process.env.SOS_RUNTIME_DATA_DIR)
    : path.join(ZALO_PROJECT_ROOT, '.runtime-data');
  const tmpDir = path.join(runtimeBase, 'tmp-ffmpeg');
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeExt = /^[a-z0-9]{2,5}$/i.test(ext) ? ext : 'mp4';
  const tmpIn = path.join(tmpDir, `vid_${stamp}.${safeExt}`);
  const tmpOut = path.join(tmpDir, `vid_${stamp}.jpg`);
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpIn, videoBuffer);
    const ffmpegBin = resolveFfmpegBinary();
    const vf = "scale='min(840,iw)':-2,drawbox=x=0:y=0:w=iw:h=6:color=0xdc2626@0.95:t=fill,drawbox=x=0:y=ih-6:w=iw:h=6:color=0x38bdf8@0.95:t=fill";
    let ok = await runFfmpegOnce(ffmpegBin, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', '0.35', '-i', tmpIn,
      '-frames:v', '1', '-vf', vf, '-q:v', '4', tmpOut
    ]);
    if (!ok || !fs.existsSync(tmpOut) || fs.statSync(tmpOut).size < 200) {
      ok = await runFfmpegOnce(ffmpegBin, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', tmpIn,
        '-frames:v', '1', '-vf', vf, '-q:v', '4', tmpOut
      ]);
    }
    if (ok && fs.existsSync(tmpOut)) {
      const jpgBuf = fs.readFileSync(tmpOut);
      if (jpgBuf.length >= 200 && jpgBuf.length <= 950000) {
        return `data:image/jpeg;base64,${jpgBuf.toString('base64')}`;
      }
    }
  } catch {} finally {
    try { if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
    try { if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch {}
  }
  return '';
}

const CONFIG_FILENAME = 'zalo-bot-config.json';
const DEFAULT_ZALO_API_BASE = 'https://bot-api.zaloplatforms.com';
const KETNOI_MAX_FAILED_ATTEMPTS = 5;
const KETNOI_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes brute-force cooldown per Zalo chatId

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
    requirePairingPassword: true, // Require unit Dispatcher password on /ketnoi to block unauthorized units
    reminderSeconds: 180,     // Standard: 3 minutes (180s)
    escalationSeconds: 900,   // Standard: 15 minutes (900s)
    demoReminderSeconds: 20,  // Fast Demo Mode: 20 seconds
    demoEscalationSeconds: 45,// Fast Demo Mode: 45 seconds
    provinceBotTokens: {},    // Optional override: { "can tho": "<TOKEN>" }
    unitPasswords: {},        // Optional custom per-unit pairing password override: { "cap_tanan": "..." }
    customUnits: {},          // Dynamically generated unit codes from UI
    bindings: [],             // [{ chatId, chatTitle, chatType, senderName, officerName, unitCode, unitName, agency, level, province, ward, linkedAt, enabled }]
    outboxLog: []             // Last 60 outbound / simulated messages for audit & live UI preview
  };

  const loaded = readRuntimeData(CONFIG_FILENAME, defaultConfig);
  const state = {
    ...defaultConfig,
    ...(loaded && typeof loaded === 'object' ? loaded : {}),
    requirePairingPassword: loaded?.requirePairingPassword !== false,
    provinceBotTokens: (loaded && typeof loaded.provinceBotTokens === 'object' && loaded.provinceBotTokens) ? loaded.provinceBotTokens : {},
    unitPasswords: (loaded && typeof loaded.unitPasswords === 'object' && loaded.unitPasswords) ? loaded.unitPasswords : {},
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
  const failedKetnoiTracker = new Map();   // chatId -> { count, windowStart, lockedUntil }
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

  function parseIncidentMediaItem(rawItem, index = 0) {
    const dataUrl = String(
      rawItem?.dataUrl ||
      rawItem?.url ||
      rawItem?.data ||
      (typeof rawItem === 'string' ? rawItem : '') ||
      ''
    ).trim();
    const explicitType = String(rawItem?.type || '').toLowerCase();
    const explicitMime = String(rawItem?.mimeType || '').toLowerCase();

    let mimeType = explicitMime || 'image/jpeg';
    let base64Payload = '';
    const dataMatch = dataUrl.match(/^data:([^;,]+)?(?:;[\s\S]*?)?;base64,([\s\S]+)$/i);
    if (dataMatch) {
      if (dataMatch[1]) mimeType = dataMatch[1].trim().toLowerCase();
      base64Payload = dataMatch[2].replace(/\s+/g, '');
    } else if (/^https?:\/\//i.test(dataUrl)) {
      if (/\.(mp4|mov)(\?|$)/i.test(dataUrl)) mimeType = 'video/mp4';
      else if (/\.webm(\?|$)/i.test(dataUrl)) mimeType = 'video/webm';
      else if (/\.png(\?|$)/i.test(dataUrl)) mimeType = 'image/png';
      else if (/\.webp(\?|$)/i.test(dataUrl)) mimeType = 'image/webp';
    }

    const kind = (explicitType === 'video' || mimeType.startsWith('video/')) ? 'video' : 'image';
    if (kind === 'video' && (!mimeType.startsWith('video/') || mimeType === 'video/quicktime')) {
      mimeType = 'video/mp4';
    }
    let ext = 'jpg';
    if (kind === 'video') {
      ext = mimeType.includes('webm') ? 'webm' : 'mp4';
    } else if (mimeType.includes('png')) {
      ext = 'png';
    } else if (mimeType.includes('webp')) {
      ext = 'webp';
    } else if (mimeType.includes('gif')) {
      ext = 'gif';
    }

    const resolvedFilename = String(rawItem?.name || `hien-truong-${Number(index) + 1}.${ext}`);
    return {
      index: Number(index) || 0,
      id: String(rawItem?.id || `med_${index}`),
      kind,
      mimeType,
      mime: mimeType,
      ext,
      name: resolvedFilename,
      filename: resolvedFilename,
      dataUrl,
      base64Payload,
      posterDataUrl: typeof rawItem?.posterDataUrl === 'string' ? rawItem.posterDataUrl.trim() : '',
      durationSec: Number.isFinite(Number(rawItem?.durationSec)) ? Number(rawItem.durationSec) : 0,
      isDataUrl: Boolean(dataMatch),
      isExternalHttp: /^https?:\/\//i.test(dataUrl),
      redirectUrl: /^https?:\/\//i.test(dataUrl) ? dataUrl : ''
    };
  }

  function decodeIncidentMediaBuffer(incident, mediaRef = '0') {
    if (!incident || !Array.isArray(incident.media) || incident.media.length === 0) {
      return null;
    }
    const cleanRef = String(mediaRef ?? '0').trim();

    // Support `<idx>_poster` signed visual preview card for Zalo Bot `sendPhoto` & `og:image`
    const posterMatch = cleanRef.match(/^(\d+)_poster$/i);
    if (posterMatch) {
      const pIdx = parseInt(posterMatch[1], 10);
      if (pIdx < 0 || pIdx >= incident.media.length) return null;
      const rawItem = incident.media[pIdx];
      const posterDataUrl = typeof rawItem?.posterDataUrl === 'string' ? rawItem.posterDataUrl.trim() : '';
      const pDataMatch = posterDataUrl.match(/^data:([^;,]+)?(?:;[\s\S]*?)?;base64,([\s\S]+)$/i);
      if (pDataMatch && pDataMatch[2]) {
        const posterMime = (pDataMatch[1] || 'image/jpeg').trim().toLowerCase();
        const posterExt = posterMime.includes('png') ? 'png' : 'jpg';
        try {
          const buffer = Buffer.from(pDataMatch[2].replace(/\s+/g, ''), 'base64');
          if (buffer.length > 0) {
            return {
              index: pIdx,
              mediaIndex: pIdx,
              id: `med_${pIdx}_poster`,
              kind: 'image',
              isPoster: true,
              mimeType: posterMime,
              mime: posterMime,
              ext: posterExt,
              name: `video-hien-truong-${pIdx + 1}-preview.${posterExt}`,
              filename: `video-hien-truong-${pIdx + 1}-preview.${posterExt}`,
              buffer
            };
          }
        } catch {
          // Fall through to synthetic PNG fallback below
        }
      }
      // Resilient fallback: valid pure-Node Tactical Play Card PNG so Zalo CDN `sendPhoto` NEVER gets 404
      const fallbackPng = buildSyntheticVideoPosterPngBuffer();
      return {
        index: pIdx,
        mediaIndex: pIdx,
        id: `med_${pIdx}_poster`,
        kind: 'image',
        isPoster: true,
        mimeType: 'image/png',
        mime: 'image/png',
        ext: 'png',
        name: `video-hien-truong-${pIdx + 1}-preview.png`,
        filename: `video-hien-truong-${pIdx + 1}-preview.png`,
        buffer: fallbackPng
      };
    }

    let idx = /^\d+$/.test(cleanRef) ? parseInt(cleanRef, 10) : -1;
    if (idx < 0 || idx >= incident.media.length) {
      idx = incident.media.findIndex(m => m && String(m.id || '') === cleanRef);
    }
    if (idx < 0 || idx >= incident.media.length) return null;

    const parsed = parseIncidentMediaItem(incident.media[idx], idx);
    if (!parsed.isDataUrl || !parsed.base64Payload) {
      return {
        ...parsed,
        mediaIndex: idx,
        buffer: null
      };
    }
    try {
      const buffer = Buffer.from(parsed.base64Payload, 'base64');
      return {
        ...parsed,
        mediaIndex: idx,
        buffer
      };
    } catch {
      return null;
    }
  }

  /**
   * Ensure a video item in `incident.media[mediaIndex]` has a crisp visual `posterDataUrl`
   * (either uploaded from citizen's device storyboard extractor, extracted server-side via `ffmpeg`,
   * or synthesized via pure-Node valid PNG Tactical Play Card).
   */
  async function ensureVideoPosterForIncidentItem(incident, mediaIndex = 0) {
    if (!incident || !Array.isArray(incident.media)) return '';
    const idx = Number(mediaIndex) || 0;
    if (idx < 0 || idx >= incident.media.length) return '';

    let rawItem = incident.media[idx];
    if (typeof rawItem === 'string') {
      const parsedStr = parseIncidentMediaItem(rawItem, idx);
      if (parsedStr.kind !== 'video') return '';
      rawItem = {
        id: `med_${idx}`,
        type: 'video',
        name: parsedStr.filename,
        dataUrl: rawItem
      };
      incident.media[idx] = rawItem;
    }
    if (!rawItem || typeof rawItem !== 'object') return '';

    const parsed = parseIncidentMediaItem(rawItem, idx);
    if (parsed.kind !== 'video') return '';

    if (typeof rawItem.posterDataUrl === 'string' && /^data:image\/(jpeg|png);base64,/i.test(rawItem.posterDataUrl.trim())) {
      return rawItem.posterDataUrl.trim();
    }

    if (parsed.isDataUrl && parsed.base64Payload) {
      try {
        const videoBuf = Buffer.from(parsed.base64Payload, 'base64');
        const ffmpegJpeg = await extractVideoPosterViaFfmpeg(videoBuf, parsed.ext);
        if (ffmpegJpeg && ffmpegJpeg.length > 400) {
          rawItem.posterDataUrl = `data:image/jpeg;base64,${ffmpegJpeg.toString('base64')}`;
          return rawItem.posterDataUrl;
        }
      } catch {
        // Fallback to pure-Node tactical PNG below
      }
    }

    const fallbackPng = buildSyntheticVideoPosterPngBuffer();
    rawItem.posterDataUrl = `data:image/png;base64,${fallbackPng.toString('base64')}`;
    return rawItem.posterDataUrl;
  }

  function signMediaAccessWithSecret(incidentId, mediaKey = '0', secret = state.hmacSecret) {
    return crypto
      .createHmac('sha256', secret)
      .update(`media|${incidentId}|${mediaKey}`)
      .digest('hex')
      .slice(0, 28);
  }

  function signMediaAccess(incidentId, mediaKey = '0') {
    return signMediaAccessWithSecret(incidentId, String(mediaKey ?? '0'), state.hmacSecret);
  }

  function verifyMediaAccess(incidentId, mediaKey = '0', signature = '') {
    if (!incidentId || !signature) return false;
    const keyStr = String(mediaKey ?? '0');
    const candidates = [state.hmacSecret, deterministicHmacSecret].filter(Boolean);
    for (const sec of candidates) {
      const expected = signMediaAccessWithSecret(incidentId, keyStr, sec);
      const a = Buffer.from(String(signature));
      const b = Buffer.from(String(expected));
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    }
    return false;
  }

  function buildSignedMediaBinaryUrl(incidentId, mediaIndex = 0, rawItem = null, fallbackOrigin = '') {
    const base = resolvePublicOrigin(fallbackOrigin);
    const parsed = parseIncidentMediaItem(rawItem || {}, mediaIndex);
    const key = String(mediaIndex);
    const sig = signMediaAccess(incidentId, key);
    return `${base}/api/zalo/media/${encodeURIComponent(incidentId)}/${encodeURIComponent(key)}/${sig}/hien-truong-${Number(mediaIndex) + 1}.${parsed.ext}`;
  }

  function buildSignedVideoPosterUrl(incidentId, mediaIndex = 0, rawItem = null, fallbackOrigin = '') {
    const base = resolvePublicOrigin(fallbackOrigin);
    const idx = Number(mediaIndex) || 0;
    const posterKey = `${idx}_poster`;
    const sig = signMediaAccess(incidentId, posterKey);
    const posterData = typeof rawItem?.posterDataUrl === 'string' ? rawItem.posterDataUrl.trim() : '';
    const ext = /^data:image\/png/i.test(posterData) ? 'png' : 'jpg';
    return `${base}/api/zalo/media/${encodeURIComponent(incidentId)}/${encodeURIComponent(posterKey)}/${sig}/video-hien-truong-${idx + 1}-preview.${ext}`;
  }

  function buildSignedMediaViewerUrl(incidentId, mediaIndex = 0, chatId = '', fallbackOrigin = '') {
    const base = resolvePublicOrigin(fallbackOrigin);
    const key = String(mediaIndex);
    const sig = signMediaAccess(incidentId, key);
    const params = new URLSearchParams({
      id: incidentId,
      m: key,
      sig
    });
    if (chatId) params.set('chat', String(chatId));
    return `${base}/api/zalo/media-view?${params.toString()}`;
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
   * Allows officers to type `/ketnoi Công an Phường Tân An, Cần Thơ Congan@113`,
   * `/ketnoi Phường Tân An Congan@113`, `/ketnoi Xã Phong Điền Cần Thơ Congan@113`, `/ketnoi CSGT Cần Thơ Csgt@113`, etc.
   */
  function resolveUnitByCodeOrQuery(rawQuery = '', { allowAutoRegister = true } = {}) {
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
      const draftDef = {
        agency: desiredAgency === 'all' ? 'police' : desiredAgency,
        level: 'ward',
        province: provName,
        ward: wardName,
        unitName: `Công An ${wardName}, ${provName}`
      };
      if (!allowAutoRegister) {
        const provSlug = normalizeGeoSlug(provName).replace(/\s+/g, '') || 'vn';
        const wardSlug = normalizeGeoSlug(wardName).replace(/\s+/g, '');
        return {
          ...draftDef,
          unitCode: normalizeUnitCode(`cap_${wardSlug}_${provSlug.slice(0, 4)}`),
          agencyLabel: 'Công An Địa Phương',
          defaultOfficerName: '',
          defaultOfficerRank: 'Cán bộ',
          defaultPhone: '113',
          _ephemeralDraft: true
        };
      }
      return registerCustomUnit(draftDef);
    }

    return null;
  }

  /**
   * Resolve the canonical Dispatcher password required to pair a Zalo chat with `unitDef`.
   * Matches `services/agency-password-policy.js` (`Admin`, `Congan@113`, `Csgt@113`, `Pccc@114`, `Capcuu@115`, `Cuuhoxe@113`)
   * plus optional per-unit custom password override (`state.unitPasswords[unitCode]`).
   */
  function resolveDefaultPasswordForUnit(unitDef = {}) {
    const code = normalizeUnitCode(unitDef.unitCode || unitDef.username || '');
    if (code && state.unitPasswords && String(state.unitPasswords[code] || '').trim()) {
      return String(state.unitPasswords[code]).trim();
    }
    if (unitDef.level === 'national' || code === 'tongtrucban' || code === 'admin') {
      return 'Admin';
    }
    return defaultPasswordForAccount({
      username: code,
      agency: unitDef.agency || 'police'
    });
  }

  /**
   * Verify the Dispatcher password supplied in `/ketnoi <unit> <password>`.
   * Supports:
   *  1. Explicit custom per-unit Zalo password (`state.unitPasswords[unitCode]`), if configured by Admin
   *  2. Matching `AGENCY_ACCOUNTS` `passwordHash` / `password` (when customized on Web Admin)
   *  3. Canonical Web Dispatcher password (`Admin`, `Congan@113`, `Csgt@113`, `Pccc@114`, `Capcuu@115`, `Cuuhoxe@113`)
   */
  function verifyUnitPairingPassword(unitDef, rawPassword) {
    const pwd = String(rawPassword || '').trim();
    if (!pwd) {
      return { ok: false, reason: 'missing' };
    }
    // Never allow internal Web Gatekeeper code `2002` as a Zalo unit pairing bypass
    if (pwd === '2002') {
      return { ok: false, reason: 'wrong' };
    }

    const code = normalizeUnitCode(unitDef?.unitCode || '');
    const customOverride = code && state.unitPasswords ? String(state.unitPasswords[code] || '').trim() : '';
    if (customOverride) {
      const okCustom = pwd === customOverride || pwd.toLowerCase() === customOverride.toLowerCase();
      return okCustom ? { ok: true, matchedVia: 'custom_unit_password' } : { ok: false, reason: 'wrong' };
    }

    const accounts = getAgencyAccounts() || {};

    // National Command (`tongtrucban` / `admin`)
    if (unitDef?.level === 'national' || code === 'tongtrucban' || code === 'admin') {
      const lower = pwd.toLowerCase();
      if (pwd === 'Admin' || lower === 'admin' || lower === 'admin@2026' || lower === 'admin123') {
        return { ok: true, matchedVia: 'national_default' };
      }
      const adminAcc = accounts.admin;
      if (adminAcc?.passwordHash && securityCryptoService.verifyPassword(pwd, adminAcc.passwordHash)) {
        return { ok: true, matchedVia: 'admin_account_hash' };
      }
      if (adminAcc?.password && (adminAcc.password === pwd || adminAcc.password.toLowerCase() === lower)) {
        return { ok: true, matchedVia: 'admin_account_plain' };
      }
      return { ok: false, reason: 'wrong' };
    }

    // Check matching `AGENCY_ACCOUNTS` entries (by exact code OR matching { ward, province, agency })
    const targetWardSlug = normalizeGeoSlug(unitDef?.ward || '');
    const targetProvSlug = normalizeGeoSlug(unitDef?.province || '');
    const targetAgency = String(unitDef?.agency || 'police').toLowerCase();

    for (const acc of Object.values(accounts)) {
      if (!acc || !acc.username || acc.username === 'admin') continue;
      const accCode = normalizeUnitCode(acc.username);
      const sameCode = code && accCode === code;
      const sameTerritory = targetWardSlug &&
        normalizeGeoSlug(acc.ward || '') === targetWardSlug &&
        (!targetProvSlug || normalizeGeoSlug(acc.province || '') === targetProvSlug) &&
        String(acc.agency || 'police').toLowerCase() === targetAgency;

      if (sameCode || sameTerritory) {
        if (acc.passwordHash && securityCryptoService.verifyPassword(pwd, acc.passwordHash)) {
          return { ok: true, matchedVia: 'agency_account_hash' };
        }
        if (acc.password && (acc.password === pwd || acc.password.toLowerCase() === pwd.toLowerCase())) {
          return { ok: true, matchedVia: 'agency_account_plain' };
        }
      }
    }

    // Canonical Web Dispatcher default password (`Congan@113`, `Csgt@113`, `Pccc@114`, `Capcuu@115`, `Cuuhoxe@113`)
    const expectedDefault = resolveDefaultPasswordForUnit(unitDef);
    const lowerPwd = pwd.toLowerCase();
    if (expectedDefault && (pwd === expectedDefault || lowerPwd === expectedDefault.toLowerCase())) {
      return { ok: true, matchedVia: 'default_policy' };
    }
    if (targetAgency === 'fire' && lowerPwd === 'cuuho@114') {
      return { ok: true, matchedVia: 'fire_alias' };
    }
    if (targetAgency === 'traffic-rescue' && (lowerPwd === 'cuuhoxe@114' || lowerPwd === 'cuuho@114')) {
      return { ok: true, matchedVia: 'rescue_alias' };
    }

    return { ok: false, reason: 'wrong' };
  }

  /**
   * Smart parser for `/ketnoi` arguments supporting:
   *  - `/ketnoi cap_tanan Congan@113`
   *  - `/ketnoi cap_tanan Congan@113 | Trực Ban CA Phường Tân An`
   *  - `/ketnoi Phường Tân An, Cần Thơ Congan@113`
   *  - `/ketnoi Phường Tân An, Cần Thơ | Congan@113 | Trực Ban CA Phường Tân An`
   */
  function parseKetnoiCommandArgs(fullArg = '') {
    const pipeParts = String(fullArg || '').split('|').map(s => s.trim()).filter(Boolean);
    const seg0 = pipeParts[0] || '';
    const tokens = seg0.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return { unitArgRaw: '', unitDef: null, password: '', customGroupTitle: '' };
    }

    // 1. First token is a direct unit code (`cap_tanan`, `tongtrucban`, `csgt_cantho`, etc.)
    const directUnit = resolveUnitByCode(tokens[0]);
    if (directUnit) {
      let password = '';
      let customGroupTitle = '';
      if (tokens.length >= 2) {
        password = tokens.slice(1).join(' ').trim();
        customGroupTitle = pipeParts[1] || '';
      } else if (pipeParts.length >= 2 && !/\s/.test(pipeParts[1])) {
        password = pipeParts[1];
        customGroupTitle = pipeParts[2] || '';
      } else {
        customGroupTitle = pipeParts[1] || '';
      }
      return { unitArgRaw: tokens[0], unitDef: directUnit, password, customGroupTitle };
    }

    // 2. Natural Vietnamese query with pipe-separated single-token password (`/ketnoi Phường Tân An, Cần Thơ | Congan@113 | Tên nhóm`)
    if (pipeParts.length >= 2 && !/\s/.test(pipeParts[1])) {
      const unitDef = resolveUnitByCodeOrQuery(seg0, { allowAutoRegister: false });
      return {
        unitArgRaw: seg0,
        unitDef,
        password: pipeParts[1],
        customGroupTitle: pipeParts[2] || ''
      };
    }

    // 3. Natural Vietnamese query with trailing password token (`/ketnoi Phường Tân An, Cần Thơ Congan@113`)
    if (tokens.length >= 2) {
      const lastTok = tokens[tokens.length - 1];
      const lastIdx = seg0.lastIndexOf(lastTok);
      const prefix = seg0.slice(0, lastIdx).replace(/[\s,;-]+$/, '').trim();
      const prefixDraft = prefix ? resolveUnitByCodeOrQuery(prefix, { allowAutoRegister: false }) : null;
      const fullDraft = resolveUnitByCodeOrQuery(seg0, { allowAutoRegister: false });
      const lastSlug = normalizeGeoSlug(lastTok);
      const fullGeoWords = fullDraft && !fullDraft._ephemeralDraft
        ? normalizeGeoSlug(`${fullDraft.unitName} ${fullDraft.ward} ${fullDraft.province}`).split(/\s+/).filter(Boolean)
        : [];

      const looksLikePassToken = lastTok.length >= 4 && /[0-9@#$!%^&*_=+~]/.test(lastTok);
      const isValidPrefixPass = prefixDraft ? verifyUnitPairingPassword(prefixDraft, lastTok).ok : false;
      const notGeoWordInKnownUnit = Boolean(
        prefixDraft &&
        !prefixDraft._ephemeralDraft &&
        (!lastSlug || !fullGeoWords.includes(lastSlug))
      );

      if (prefixDraft && (isValidPrefixPass || looksLikePassToken || notGeoWordInKnownUnit)) {
        return {
          unitArgRaw: prefix,
          unitDef: prefixDraft,
          password: lastTok,
          customGroupTitle: pipeParts[1] || ''
        };
      }
    }

    // 4. Natural Vietnamese query without password
    const fallbackUnit = resolveUnitByCodeOrQuery(seg0, { allowAutoRegister: false });
    return {
      unitArgRaw: seg0,
      unitDef: fallbackUnit,
      password: '',
      customGroupTitle: pipeParts[1] || ''
    };
  }

  /**
   * Register or get a deterministic unit code for any { province, ward, agency, level, unitName }
   */
  function registerCustomUnit({ unitCode, unitName, agency = 'police', level = 'ward', province = 'Cần Thơ', ward = '', officerName = '', officerRank = '', phone = '', customPassword = '' }) {
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

    if (customPassword && String(customPassword).trim()) {
      state.unitPasswords[finalCode] = String(customPassword).trim();
    }
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
   * Push a Citizen Scene Photo directly into a Zalo chat via `sendPhoto` (with automatic
   * fallback to signed viewer link message if running on localhost or if Zalo CDN rejects fetch).
   */
  async function sendZaloPhoto(chatId, photoBinaryUrl, caption, { province = '', viewerUrl = '', meta = {} } = {}) {
    const safeCaption = String(caption || '').trim().slice(0, 1500);
    const token = resolveTokenForProvince(province);

    if (!token) {
      recordOutboxEntry({
        chatId: String(chatId),
        text: `${safeCaption}\n🖼️ ${photoBinaryUrl}`,
        mediaType: 'image',
        mediaUrl: photoBinaryUrl,
        viewerUrl: viewerUrl || photoBinaryUrl,
        delivered: false,
        simulated: true,
        note: 'Chế độ Mô phỏng (Ảnh hiện trường từ người dân)',
        ...meta
      });
      return { ok: true, simulated: true, mediaType: 'image', mediaUrl: photoBinaryUrl, viewerUrl };
    }

    const isPublicHttps = /^https:\/\/(?!localhost|127\.0\.0\.1)/i.test(photoBinaryUrl);
    if (isPublicHttps) {
      const apiRes = await callZaloApi('sendPhoto', {
        chat_id: String(chatId),
        photo: photoBinaryUrl,
        caption: safeCaption
      }, token, 12000);

      if (apiRes.ok) {
        recordOutboxEntry({
          chatId: String(chatId),
          text: safeCaption,
          mediaType: 'image',
          mediaUrl: photoBinaryUrl,
          viewerUrl: viewerUrl || photoBinaryUrl,
          delivered: true,
          simulated: false,
          error: null,
          ...meta
        });
        return { ...apiRes, mediaType: 'image', mediaUrl: photoBinaryUrl, viewerUrl };
      }
    }

    // Automatic resilient fallback: send text card with 1-tap photo viewer link so officers NEVER miss scene evidence
    const fallbackText = [
      safeCaption,
      `🔍 Mở xem ảnh hiện trường gốc (1 chạm):`,
      viewerUrl || photoBinaryUrl
    ].filter(Boolean).join('\n');

    return sendZaloMessage(chatId, fallbackText, {
      province,
      meta: {
        ...meta,
        mediaType: 'image',
        mediaUrl: photoBinaryUrl,
        viewerUrl: viewerUrl || photoBinaryUrl,
        fallbackLinkMode: true
      }
    });
  }

  /**
   * Push a Citizen Scene Video visually into a Zalo chat!
   * Ground-truth `bot.zaloplatforms.com` only implements `sendPhoto` (no `sendVideo` endpoint — calling
   * `/sendVideo` returns HTTP 400). Therefore, on public HTTPS we push the extracted HD Video Storyboard /
   * Scene Frame JPEG (`posterUrl`, <= 400 KB) via `sendPhoto` with a rich caption containing both the
   * 1-tap Full-Audio Mobile HTML5 Player (`viewerUrl`) AND the direct `.mp4` download link (`?dl=1`),
   * with automatic resilient fallback to `sendMessage` on localhost or if Zalo CDN fetch times out.
   */
  async function sendZaloVideo(chatId, videoBinaryUrl, viewerUrl, caption, { posterUrl = '', province = '', meta = {} } = {}) {
    const safeCaption = String(caption || '').trim().slice(0, 900);
    const directMp4DownloadUrl = videoBinaryUrl
      ? `${videoBinaryUrl}${videoBinaryUrl.includes('?') ? '&' : '?'}dl=1`
      : '';
    const fullVideoText = [
      safeCaption,
      `▶️ BẤM XEM & NGHE TIẾNG VIDEO HIỆN TRƯỜNG (1 CHẠM):`,
      viewerUrl || videoBinaryUrl,
      ...(directMp4DownloadUrl ? [`📥 Tải file Video .MP4 gốc:`, directMp4DownloadUrl] : [])
    ].filter(Boolean).join('\n').slice(0, 1850);

    const token = resolveTokenForProvince(province);
    if (!token) {
      recordOutboxEntry({
        chatId: String(chatId),
        text: fullVideoText,
        mediaType: 'video',
        mediaUrl: videoBinaryUrl,
        posterUrl: posterUrl || null,
        viewerUrl: viewerUrl || videoBinaryUrl,
        delivered: false,
        simulated: true,
        note: 'Chế độ Mô phỏng (Thẻ Hình Video Hiện Trường + Trình phát MP4 có tiếng)',
        ...meta
      });
      return {
        ok: true,
        simulated: true,
        mediaType: 'video',
        mediaUrl: videoBinaryUrl,
        posterUrl: posterUrl || '',
        viewerUrl
      };
    }

    const isPublicHttpsPoster = posterUrl && /^https:\/\/(?!localhost|127\.0\.0\.1)/i.test(posterUrl);
    if (isPublicHttpsPoster) {
      const photoCardRes = await callZaloApi('sendPhoto', {
        chat_id: String(chatId),
        photo: posterUrl,
        caption: fullVideoText
      }, token, 12000);

      if (photoCardRes.ok) {
        recordOutboxEntry({
          chatId: String(chatId),
          text: fullVideoText,
          mediaType: 'video',
          deliveryMethod: 'sendPhoto_video_poster',
          mediaUrl: videoBinaryUrl,
          posterUrl,
          viewerUrl: viewerUrl || videoBinaryUrl,
          delivered: true,
          simulated: false,
          error: null,
          ...meta
        });
        return {
          ...photoCardRes,
          mediaType: 'video',
          deliveryMethod: 'sendPhoto_video_poster',
          mediaUrl: videoBinaryUrl,
          posterUrl,
          viewerUrl
        };
      }
    }

    // Automatic resilient fallback (localhost or Zalo CDN timeout): send rich mobile video player link card
    const msgRes = await callZaloApi('sendMessage', {
      chat_id: String(chatId),
      text: fullVideoText
    }, token);

    recordOutboxEntry({
      chatId: String(chatId),
      text: fullVideoText,
      mediaType: 'video',
      deliveryMethod: 'sendMessage_fallback',
      mediaUrl: videoBinaryUrl,
      posterUrl: posterUrl || null,
      viewerUrl: viewerUrl || videoBinaryUrl,
      delivered: Boolean(msgRes.ok),
      simulated: false,
      error: msgRes.ok ? null : msgRes.error,
      ...meta
    });

    return {
      ...msgRes,
      mediaType: 'video',
      deliveryMethod: 'sendMessage_fallback',
      mediaUrl: videoBinaryUrl,
      posterUrl: posterUrl || '',
      viewerUrl
    };
  }

  /**
   * Dispatch a list of indexed citizen media items (`[{ item, mediaIndex }]`) to target Zalo bindings.
   */
  async function dispatchMediaItemsToBindings(incident, indexedItems = [], bindings = [], { origin = '', caption = '', stage = 'citizen_media' } = {}) {
    if (!incident || !Array.isArray(indexedItems) || indexedItems.length === 0 || !Array.isArray(bindings) || bindings.length === 0) {
      return [];
    }

    // Pre-generate posters once per video item across all target bindings
    for (const entry of indexedItems) {
      const mediaIndex = Number(entry.mediaIndex) || 0;
      const parsed = parseIncidentMediaItem(entry.item, mediaIndex);
      if (parsed.kind === 'video') {
        await ensureVideoPosterForIncidentItem(incident, mediaIndex);
        if (Array.isArray(incident.media) && incident.media[mediaIndex]) {
          entry.item = incident.media[mediaIndex];
        }
      }
    }

    const dispatches = [];
    for (const binding of bindings) {
      if (!binding || !binding.chatId) continue;
      for (const entry of indexedItems) {
        const mediaIndex = Number(entry.mediaIndex) || 0;
        const currentItem = (Array.isArray(incident.media) && incident.media[mediaIndex]) || entry.item;
        const parsed = parseIncidentMediaItem(currentItem, mediaIndex);
        if (!parsed.dataUrl) continue;

        const binaryUrl = parsed.isExternalHttp
          ? parsed.dataUrl
          : buildSignedMediaBinaryUrl(incident.id, mediaIndex, currentItem, origin);
        const viewerUrl = buildSignedMediaViewerUrl(incident.id, mediaIndex, binding.chatId, origin);

        if (parsed.kind === 'video') {
          const posterUrl = buildSignedVideoPosterUrl(incident.id, mediaIndex, currentItem, origin);
          const durLabel = parsed.durationSec > 0
            ? ` (${Math.floor(parsed.durationSec / 60)}:${String(Math.max(1, Math.round(parsed.durationSec % 60))).padStart(2, '0')})`
            : '';
          const videoCaption = [
            `🎥 [VIDEO HIỆN TRƯỜNG #${mediaIndex + 1}${durLabel} — CA #${incident.id}]`,
            `👤 Người dân gửi: ${incident.reporterName || 'Người dân'} (${incident.reporterPhone || 'Đang cập nhật'})`,
            `📍 Vị trí: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
            ...(caption ? [`💬 Ghi chú: ${caption}`] : [])
          ].join('\n');

          const res = await sendZaloVideo(binding.chatId, binaryUrl, viewerUrl, videoCaption, {
            posterUrl,
            province: binding.province || '',
            meta: {
              incidentId: incident.id,
              stage: `${stage}_video`,
              mediaIndex,
              unitCode: binding.unitCode,
              unitName: binding.unitName
            }
          });
          dispatches.push({ chatId: binding.chatId, mediaIndex, kind: 'video', ...res });
        } else {
          const photoCaption = [
            `📷 [ẢNH HIỆN TRƯỜNG #${mediaIndex + 1} — CA #${incident.id}]`,
            `👤 Người dân: ${incident.reporterName || 'Người dân'} (${incident.reporterPhone || 'Đang cập nhật'})`,
            `📍 Vị trí: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
            ...(caption ? [`💬 Ghi chú: ${caption}`] : []),
            `🔗 Xem chi tiết / Nhận ca: ${viewerUrl}`
          ].join('\n');

          const res = await sendZaloPhoto(binding.chatId, binaryUrl, photoCaption, {
            province: binding.province || '',
            viewerUrl,
            meta: {
              incidentId: incident.id,
              stage: `${stage}_photo`,
              mediaIndex,
              unitCode: binding.unitCode,
              unitName: binding.unitName
            }
          });
          dispatches.push({ chatId: binding.chatId, mediaIndex, kind: 'image', ...res });
        }
      }
    }
    return dispatches;
  }

  /**
   * Forward newly captured/uploaded Citizen Photos or Videos during an active SOS
   * (e.g., via `POST /api/sos/media` or `POST /api/sos/message` with media) straight to
   * all notified / assigned Zalo chats (works both while pending AND after officer accepted!).
   */
  async function onCitizenMediaReceived(incident, newMediaItems = [], { origin = '', caption = '', startIndex = null, stage = 'chat_media' } = {}) {
    if (!incident || !state.enabled) return { ok: false, dispatched: 0 };
    const items = Array.isArray(newMediaItems) ? newMediaItems : [newMediaItems].filter(Boolean);
    if (items.length === 0) return { ok: true, dispatched: 0 };

    await ensureBotProfile();

    const seenChatIds = new Set();
    const targetBindings = [];

    // 1. Include all chats previously notified about this incident (preserves delivery after status === 'dispatching'!)
    const prevSet = incidentNotifiedChats.get(incident.id);
    if (prevSet) {
      for (const cid of prevSet) {
        const b = state.bindings.find(x => x && x.enabled !== false && String(x.chatId) === String(cid));
        if (b && !seenChatIds.has(String(b.chatId))) {
          seenChatIds.add(String(b.chatId));
          targetBindings.push(b);
        }
      }
    }

    // 2. Include chat that accepted the incident via Zalo (if any)
    if (incident.zaloAcceptedByChatId && !seenChatIds.has(String(incident.zaloAcceptedByChatId))) {
      const acceptedBinding = state.bindings.find(x => x && String(x.chatId) === String(incident.zaloAcceptedByChatId));
      if (acceptedBinding) {
        seenChatIds.add(String(acceptedBinding.chatId));
        targetBindings.push(acceptedBinding);
      }
    }

    // 3. Also include current territorial bindings (in case a group connected right after SOS was created)
    const stageType = incident.currentLevel === 'province' ? 'escalated' : 'initial';
    for (const b of resolveTargetBindings(incident, stageType)) {
      if (b && b.chatId && !seenChatIds.has(String(b.chatId))) {
        seenChatIds.add(String(b.chatId));
        targetBindings.push(b);
      }
    }

    if (targetBindings.length === 0) {
      return { ok: true, dispatched: 0, targets: [] };
    }

    const totalLen = Array.isArray(incident.media) ? incident.media.length : items.length;
    const baseIdx = Number.isInteger(startIndex) && startIndex >= 0
      ? startIndex
      : Math.max(0, totalLen - items.length);

    const indexedItems = items.map((item, offset) => ({
      item,
      mediaIndex: baseIdx + offset
    }));

    const notifiedSet = incidentNotifiedChats.get(incident.id) || new Set();
    incidentNotifiedChats.set(incident.id, notifiedSet);
    for (const b of targetBindings) {
      notifiedSet.add(String(b.chatId));
    }

    const results = await dispatchMediaItemsToBindings(incident, indexedItems, targetBindings, {
      origin,
      caption,
      stage
    });

    return {
      ok: true,
      dispatched: results.length,
      targetsCount: targetBindings.length,
      results
    };
  }

  /**
   * Broadcast an emergency directive, scheduled maintenance notice, system update,
   * or severe weather warning directly to ALL (or filtered) connected Zalo groups & officers.
   */
  async function broadcastAnnouncement({
    category = 'maintenance',
    title = '',
    message = '',
    senderLabel = '',
    targetScope = 'all',
    provinceFilter = ''
  } = {}) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      throw new Error('Vui lòng nhập nội dung thông báo khẩn cấp / bảo trì cần phát đi!');
    }

    const cleanCategory = String(category || 'maintenance').trim().toLowerCase();
    const cleanTitle = String(title || '').trim();
    const cleanScope = String(targetScope || 'all').trim().toLowerCase();
    const provFilterSlug = normalizeGeoSlug(provinceFilter || '');
    const resolvedSender = String(senderLabel || '').trim() || 'Trung Tâm Chỉ Huy SOS Việt Nam 2026';

    const seenChatIds = new Set();
    const targets = [];

    for (const b of state.bindings) {
      if (!b || b.enabled === false || !b.chatId) continue;
      const chatKey = String(b.chatId).trim();
      if (!chatKey || seenChatIds.has(chatKey)) continue;

      const bindAgency = String(b.agency || 'police').toLowerCase();
      const bindLevel = String(b.level || 'ward').toLowerCase();

      if (cleanScope === 'police' && bindAgency !== 'police') continue;
      if (cleanScope === 'csgt' && bindAgency !== 'csgt') continue;
      if (cleanScope === 'fire' && bindAgency !== 'fire') continue;
      if (cleanScope === 'hospital' && bindAgency !== 'hospital' && bindAgency !== 'ambulance') continue;
      if (cleanScope === 'province_hq' && bindLevel !== 'province' && bindLevel !== 'national') continue;

      if (provFilterSlug && bindLevel !== 'national') {
        const bindProvSlug = normalizeGeoSlug(b.province || '');
        if (bindProvSlug !== provFilterSlug) continue;
      }

      seenChatIds.add(chatKey);
      targets.push(b);
    }

    if (targets.length === 0) {
      throw new Error('Hiện chưa có nhóm/cán bộ Zalo nào khớp phạm vi nhận thông báo. Hãy liên kết nhóm Zalo trước!');
    }

    const categoryHeaderMap = {
      emergency: '🚨📢 [CÔNG ĐIỆN KHẨN — TRUNG TÂM CHỈ HUY SOS VIỆT NAM]',
      maintenance: '🔧🛠️ [THÔNG BÁO BẢO TRÌ & CẬP NHẬT HỆ THỐNG]',
      weather: '⛈️🌊 [CẢNH BÁO THIÊN TAI & TRỰC CỨU HỘ KHẨN CẤP]',
      recovery: '✅🟢 [THÔNG BÁO HOÀN TẤT NÂNG CẤP — HỆ THỐNG THÔNG SUỐT]',
      general: '📢 [THÔNG BÁO ĐIỀU HÀNH TRỰC BAN TOÀN HỆ THỐNG]'
    };
    const headerLine = categoryHeaderMap[cleanCategory] || categoryHeaderMap.general;
    const timeVN = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false
    });

    const formattedText = [
      headerLine,
      ...(cleanTitle ? [`📌 Chủ đề: ${cleanTitle}`] : []),
      `🏛️ Phát lệnh từ: ${resolvedSender}`,
      `⏱️ Thời gian phát: ${timeVN}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      cleanMessage,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💬 Hệ thống Điều phối Trực ban 2 chiều — SOS Việt Nam 2026`
    ].join('\n').slice(0, 1900);

    let deliveredCount = 0;
    let simulatedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const t of targets) {
      const sendRes = await sendZaloMessage(t.chatId, formattedText, {
        province: t.province || '',
        meta: {
          stage: 'system_broadcast',
          category: cleanCategory,
          title: cleanTitle,
          senderLabel: resolvedSender,
          targetScope: cleanScope,
          unitCode: t.unitCode,
          unitName: t.unitName || t.chatTitle || t.chatId
        }
      });

      if (sendRes.ok && !sendRes.simulated) deliveredCount += 1;
      else if (sendRes.simulated) simulatedCount += 1;
      else failedCount += 1;

      results.push({
        chatId: t.chatId,
        unitCode: t.unitCode,
        unitName: t.unitName,
        chatTitle: t.chatTitle,
        ...sendRes
      });
    }

    return {
      ok: true,
      category: cleanCategory,
      title: cleanTitle,
      senderLabel: resolvedSender,
      targetScope: cleanScope,
      timeVN,
      totalMatched: targets.length,
      sentCount: deliveredCount + simulatedCount,
      deliveredCount,
      simulatedCount,
      failedCount,
      formattedText,
      results
    };
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

    // Summarize attached citizen scene photos & videos (if any)
    const rawMediaList = Array.isArray(incident.media) ? incident.media.filter(Boolean) : [];
    let photoCount = 0;
    let videoCount = 0;
    rawMediaList.forEach((m, idx) => {
      const p = parseIncidentMediaItem(m, idx);
      if (p.kind === 'video') videoCount += 1;
      else if (p.dataUrl) photoCount += 1;
    });
    const mediaParts = [];
    if (photoCount > 0) mediaParts.push(`${photoCount} ảnh`);
    if (videoCount > 0) mediaParts.push(`${videoCount} video`);
    const firstMediaViewerUrl = rawMediaList.length > 0
      ? buildSignedMediaViewerUrl(incident.id, 0, binding?.chatId || '', fallbackOrigin)
      : '';
    const mediaLines = mediaParts.length > 0
      ? [
          `📷 Bằng chứng hiện trường: ${mediaParts.join(' & ')} từ người dân (Đang gửi kèm ngay bên dưới)`,
          `🎬 Mở xem toàn bộ Ảnh/Video hiện trường: ${firstMediaViewerUrl}`
        ]
      : [];

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
        ...mediaLines,
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
        ...mediaLines,
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
      ...(incident.customNotes ? [`📝 Mô tả: ${String(incident.customNotes).slice(0, 220)}`] : []),
      `👤 Người dân: ${incident.reporterName || 'Người dân cần cứu hộ'}`,
      `📞 SĐT liên hệ: ${incident.reporterPhone || 'Đang cập nhật'}`,
      `📍 Địa điểm: ${incident.address || `${incident.lat}, ${incident.lng}`}`,
      `🎯 Tọa độ GPS: ${Number(incident.lat).toFixed(5)}, ${Number(incident.lng).toFixed(5)}`,
      ...mediaLines,
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

    // Immediately forward all Citizen Scene Photos & Videos attached to the SOS!
    let mediaDispatched = 0;
    if (Array.isArray(incident.media) && incident.media.length > 0 && targets.length > 0) {
      const indexedMedia = incident.media.map((item, mediaIndex) => ({ item, mediaIndex }));
      const mediaRes = await dispatchMediaItemsToBindings(incident, indexedMedia, targets, {
        origin,
        stage: 'initial_media'
      });
      mediaDispatched = mediaRes.length;
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
      mediaDispatched,
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

    // Forward citizen scene photos & videos to Provincial HQ as well on escalation!
    if (Array.isArray(incident.media) && incident.media.length > 0 && hqTargets.length > 0) {
      const indexedMedia = incident.media.map((item, mediaIndex) => ({ item, mediaIndex }));
      await dispatchMediaItemsToBindings(incident, indexedMedia, hqTargets, {
        origin,
        stage: 'escalated_media'
      });
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
    customPassword = undefined,
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

    if (customPassword !== undefined) {
      if (!state.unitPasswords || typeof state.unitPasswords !== 'object') {
        state.unitPasswords = {};
      }
      const normCode = normalizeUnitCode(updated.unitCode);
      const trimmedPass = String(customPassword || '').trim();
      if (trimmedPass === '__CLEAR__') {
        delete state.unitPasswords[normCode];
      } else if (trimmedPass) {
        state.unitPasswords[normCode] = trimmedPass;
      }
    }

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
   * Process an incoming Zalo message (`/start`, `/ketnoi <code|tên phường> <mật_khẩu>`, `/huyketnoi`, `/danhsach`, `/tn`, `@Bot Vĩnh Nam TN`)
   */
  async function handleIncomingMessage(msg, { origin = '', skipPasswordCheck = false } = {}) {
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

    // 1. Check `/ketnoi <mã hoặc tên Công an Phường/Xã> <Mật_khẩu_trực_ban> [| Tên nhóm tùy chọn]`
    const ketnoiMatch = cleanedText.match(/^\/?(?:ketnoi|ket_noi|lienket|pair)\s+([\s\S]+)$/i) ||
                        cleanedText.match(/\/(?:ketnoi|ket_noi|lienket|pair)\s+([\s\S]+)$/i);
    if (ketnoiMatch) {
      const fullArg = ketnoiMatch[1].trim();
      const chatKey = String(msg.chatId);

      // Check per-chat brute-force lockout before processing
      if (state.requirePairingPassword !== false && !skipPasswordCheck) {
        const lockRec = failedKetnoiTracker.get(chatKey);
        if (lockRec && lockRec.lockedUntil && Date.now() < lockRec.lockedUntil) {
          const remainMin = Math.max(1, Math.ceil((lockRec.lockedUntil - Date.now()) / 60000));
          const lockReply = [
            `🚫 TẠM KHÓA LỆNH /KETNOI DO NHẬP SAI MẬT KHẨU QUÁ ${KETNOI_MAX_FAILED_ATTEMPTS} LẦN!`,
            `⏳ Khung chat này đang tạm khóa xác thực trong ${remainMin} phút nữa để chống dò mật khẩu trái phép.`,
            `👉 Vui lòng kiểm tra lại đúng Mật khẩu Trực ban Web của đơn vị trước khi thử lại.`
          ].join('\n');
          await sendZaloMessage(msg.chatId, lockReply, {
            meta: { stage: 'cmd_ketnoi_locked', senderName: msg.senderName }
          });
          return { handled: true, action: 'ketnoi_locked', remainMinutes: remainMin };
        }
      }

      const parsedKetnoi = parseKetnoiCommandArgs(fullArg);
      const { unitArgRaw, password, customGroupTitle: customGroupTitleRaw } = parsedKetnoi;
      let unitDef = parsedKetnoi.unitDef;

      if (!unitDef) {
        const passSyntaxHint = state.requirePairingPassword !== false ? ' <Mật_khẩu_trực_ban>' : '';
        const reply = [
          `❌ Không nhận diện được đơn vị "${unitArgRaw || fullArg}".`,
          `👉 Đồng chí gõ MÃ ĐƠN VỊ hoặc TÊN PHƯỜNG/XÃ kèm MẬT KHẨU TRỰC BAN của đơn vị:`,
          `• /ketnoi cap_tanan${passSyntaxHint}`,
          `• /ketnoi Phường Tân An, Cần Thơ${passSyntaxHint}`,
          `• /ketnoi csgt_cantho${passSyntaxHint} (Đội CSGT Cần Thơ)`,
          `• /ketnoi pccc_cantho${passSyntaxHint} (Đội PCCC & CNCH Cần Thơ)`,
          `• /ketnoi chihuy_cantho${passSyntaxHint} (Chỉ Huy CA TP. Cần Thơ)`
        ].join('\n');
        await sendZaloMessage(msg.chatId, reply, { meta: { stage: 'cmd_ketnoi_invalid' } });
        return { handled: true, action: 'ketnoi_invalid', code: unitArgRaw };
      }

      // Enforce Dispatcher Password Authentication (`requirePairingPassword` default: true)
      if (state.requirePairingPassword !== false && !skipPasswordCheck) {
        const authCheck = verifyUnitPairingPassword(unitDef, password);
        if (!authCheck.ok && authCheck.reason === 'missing') {
          const isNationalTarget = unitDef.level === 'national' || unitDef.unitCode === 'tongtrucban';
          const syntaxSample = unitDef._ephemeralDraft
            ? `/ketnoi ${unitArgRaw} <Mật_khẩu_trực_ban>`
            : `/ketnoi ${unitDef.unitCode} <Mật_khẩu_trực_ban>`;
          const missingReply = [
            `🔒 YÊU CẦU MẬT KHẨU TRỰC BAN ĐỂ KẾT NỐI ĐƠN VỊ!`,
            `🏢 Đơn vị yêu cầu: ${unitDef.unitName}`,
            `🛡️ Để ngăn đơn vị khác hoặc người lạ kết nối trái phép, đồng chí vui lòng nhập kèm Mật khẩu Trực ban Web của đơn vị theo cú pháp:`,
            `👉 ${syntaxSample}`,
            isNationalTarget
              ? `⚠️ Lưu ý: Kênh Giám sát Toàn Quốc (tongtrucban) chỉ dành cho Tổng Trực Ban Quốc Gia — yêu cầu mật khẩu Quản trị Trung ương.`
              : `💡 Mật khẩu mặc định trùng với mật khẩu đăng nhập Bàn Chỉ Huy Trực Ban Web của lực lượng đồng chí.`
          ].join('\n');
          await sendZaloMessage(msg.chatId, missingReply, {
            province: unitDef.province || '',
            meta: {
              stage: 'cmd_ketnoi_missing_pass',
              unitCode: unitDef.unitCode,
              unitName: unitDef.unitName,
              senderName: msg.senderName
            }
          });
          return { handled: true, action: 'ketnoi_missing_password', unitCode: unitDef.unitCode };
        }

        if (!authCheck.ok) {
          const now = Date.now();
          const prev = failedKetnoiTracker.get(chatKey);
          const count = (prev && (now - prev.firstAt < KETNOI_LOCKOUT_MS)) ? (prev.count + 1) : 1;
          const firstAt = (prev && (now - prev.firstAt < KETNOI_LOCKOUT_MS)) ? prev.firstAt : now;
          const lockedUntil = count >= KETNOI_MAX_FAILED_ATTEMPTS ? (now + KETNOI_LOCKOUT_MS) : 0;
          failedKetnoiTracker.set(chatKey, { count, firstAt, lockedUntil });

          const attemptsLeft = Math.max(0, KETNOI_MAX_FAILED_ATTEMPTS - count);
          const wrongReply = [
            `⛔ SAI MẬT KHẨU TRỰC BAN — TỪ CHỐI KẾT NỐI!`,
            `🏢 Đơn vị: ${unitDef.unitName} (${unitDef.unitCode})`,
            `👮 Người gửi lệnh: ${msg.senderName}`,
            lockedUntil
              ? `🚫 Đã nhập sai ${count}/${KETNOI_MAX_FAILED_ATTEMPTS} lần — Khung chat này bị tạm khóa lệnh /ketnoi trong 10 phút!`
              : `⚠️ Mật khẩu không khớp với mật khẩu Trực ban của đơn vị (còn ${attemptsLeft}/${KETNOI_MAX_FAILED_ATTEMPTS} lần thử).`
          ].join('\n');
          await sendZaloMessage(msg.chatId, wrongReply, {
            province: unitDef.province || '',
            meta: {
              stage: 'cmd_ketnoi_denied',
              unitCode: unitDef.unitCode,
              unitName: unitDef.unitName,
              senderName: msg.senderName
            }
          });
          return {
            handled: true,
            action: 'ketnoi_wrong_password',
            unitCode: unitDef.unitCode,
            attemptsLeft
          };
        }

        // Password verified! Clear any prior failed attempts for this chat
        failedKetnoiTracker.delete(chatKey);
      }

      // Materialize ephemeral natural-Vietnamese ward draft only AFTER password check passes
      if (unitDef._ephemeralDraft) {
        unitDef = registerCustomUnit(unitDef);
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
        `🔐 Xác thực mật khẩu trực ban: HỢP LỆ`,
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
      const passHint = state.requirePairingPassword !== false ? ' <Mật_khẩu_trực_ban>' : '';
      const reply = myBindings.length === 0
        ? `ℹ️ Khung chat này chưa gắn với đơn vị nào.\nHãy gõ: /ketnoi cap_tanan${passHint} (hoặc /ketnoi Phường Tân An, Cần Thơ${passHint}) để nhận báo động SOS!`
        : [
            `📋 ĐƠN VỊ ĐANG TRỰC TRÊN KHUNG CHAT NÀY:`,
            ...myBindings.map((b, i) => `${i + 1}. ${b.unitName}\n   📍 Địa bàn: ${b.ward ? `${b.ward}, ${b.province}` : b.province}\n   👮 Cán bộ trực Zalo: ${b.officerName || b.senderName}`),
            `\n💬 Đổi địa bàn: gõ /ketnoi <Mã_đơn_vị>${passHint}\n💬 Nhận ca khi có SOS: ${getBotMentionHint(msg.chatType)}`
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
      const passHint = state.requirePairingPassword !== false ? ' <Mật_khẩu_trực_ban>' : '';
      const helpText = [
        `🛡️ HỆ THỐNG BOT TRỰC BAN KHẨN CẤP — SOS VIỆT NAM 2026`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `1️⃣ Liên kết Nhóm Zalo với đúng Đơn vị (kèm Mật khẩu Trực ban):`,
        `• /ketnoi cap_tanan${passHint}`,
        `• /ketnoi Phường Tân An, Cần Thơ${passHint}`,
        `• /ketnoi csgt_cantho${passHint} (Đội CSGT Cần Thơ)`,
        `• /ketnoi pccc_cantho${passHint} (Đội PCCC & CNCH Cần Thơ)`,
        `• /ketnoi chihuy_cantho${passHint} (Chỉ Huy Công An TP. Cần Thơ)`,
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

  async function handleWebhookPayload(payload, { secretHeader = '', origin = '', skipSecretCheck = false, skipPasswordCheck = false } = {}) {
    if (!skipSecretCheck && state.webhookActive && secretHeader) {
      const validSecrets = [state.webhookSecret, deterministicWebhookSecret].filter(Boolean);
      if (!validSecrets.includes(secretHeader)) {
        return { ok: false, status: 401, error: 'Sai X-Bot-Api-Secret-Token' };
      }
    }

    const messages = extractIncomingZaloMessages(payload);
    const outcomes = [];
    for (const m of messages) {
      const res = await handleIncomingMessage(m, { origin, skipPasswordCheck });
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
    clearToken = false,
    enabled,
    demoFastMode,
    requirePairingPassword,
    reminderSeconds,
    escalationSeconds,
    publicBaseUrl,
    preferPolling = false,
    forceWebhookSync = false,
    detectedOrigin = '',
    viewerCtx = {}
  } = {}) {
    if (typeof enabled === 'boolean') state.enabled = enabled;
    if (typeof demoFastMode === 'boolean') state.demoFastMode = demoFastMode;
    if (typeof requirePairingPassword === 'boolean') state.requirePairingPassword = requirePairingPassword;
    if (Number.isFinite(Number(reminderSeconds)) && Number(reminderSeconds) >= 10) {
      state.reminderSeconds = Number(reminderSeconds);
    }
    if (Number.isFinite(Number(escalationSeconds)) && Number(escalationSeconds)) {
      if (Number(escalationSeconds) >= 30) state.escalationSeconds = Number(escalationSeconds);
    }
    if (typeof publicBaseUrl === 'string' && publicBaseUrl.trim()) {
      state.publicBaseUrl = publicBaseUrl.trim().replace(/\/+$/, '');
    }

    let tokenChanged = false;
    if (clearToken === true) {
      tokenChanged = Boolean(state.botToken);
      state.botToken = '';
    } else if (typeof botToken === 'string') {
      const trimmed = botToken.trim();
      // NEVER wipe saved `state.botToken` on empty input (`""`) or masked placeholder (`••••`)!
      if (trimmed.length > 0 && !trimmed.includes('••••') && trimmed !== maskToken(state.botToken)) {
        tokenChanged = trimmed !== state.botToken;
        state.botToken = trimmed;
      }
    }

    let botCheck = null;
    let webhookSetup = null;

    if (state.botToken) {
      if (tokenChanged || !state.botProfile || forceWebhookSync) {
        botCheck = await callZaloApi('getMe', {});
        if (botCheck.ok) {
          const r = botCheck.result || {};
          state.botProfile = {
            id: r.id || r.bot_id || '',
            name: r.account_name || r.display_name || r.first_name || r.username || 'Zalo Trực Ban Bot',
            verifiedAt: new Date().toISOString()
          };
        }
      }

      const candidateOrigin = resolvePublicOrigin(detectedOrigin);
      const isPublicHttps = /^https:\/\/(?!localhost|127\.0\.0\.1)/i.test(candidateOrigin);

      if (isPublicHttps && !preferPolling) {
        const targetWebhookUrl = `${candidateOrigin}/api/zalo/webhook`;
        if (tokenChanged || !state.webhookActive || state.webhookUrl !== targetWebhookUrl || forceWebhookSync) {
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
        }
      } else {
        if (tokenChanged || state.webhookActive || forceWebhookSync) {
          await callZaloApi('deleteWebhook', {});
        }
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
      status: getPublicStatus(viewerCtx)
    };
  }

  /**
   * Auto-restore `botToken`, `bindings`, `customUnits`, and `unitPasswords` from the Dispatcher's
   * Browser Vault (`localStorage`) whenever an ephemeral cloud container (e.g. Render redeploy) restarts!
   */
  async function restoreBackup({
    botToken = '',
    demoFastMode,
    requirePairingPassword,
    bindings = [],
    customUnits = {},
    unitPasswords = {},
    detectedOrigin = '',
    viewerCtx = {}
  } = {}) {
    const viewerIsAdmin = Boolean(viewerCtx?.viewerIsAdmin);
    let restoredToken = false;
    let restoredBindingsCount = 0;

    if (typeof demoFastMode === 'boolean') {
      state.demoFastMode = demoFastMode;
    }
    if (viewerIsAdmin && typeof requirePairingPassword === 'boolean') {
      state.requirePairingPassword = requirePairingPassword;
    }

    if (customUnits && typeof customUnits === 'object') {
      for (const [rawCode, u] of Object.entries(customUnits)) {
        if (!u || typeof u !== 'object') continue;
        const normCode = normalizeUnitCode(rawCode || u.unitCode);
        if (!normCode) continue;
        if (!viewerIsAdmin && (String(u.level || '').toLowerCase() === 'national' || normCode === 'tongtrucban')) continue;
        if (!state.customUnits[normCode]) {
          state.customUnits[normCode] = { ...u, unitCode: normCode };
        }
      }
    }

    if (viewerIsAdmin && unitPasswords && typeof unitPasswords === 'object') {
      for (const [rawCode, passVal] of Object.entries(unitPasswords)) {
        const normCode = normalizeUnitCode(rawCode);
        const cleanPass = String(passVal || '').trim();
        if (normCode && cleanPass && !state.unitPasswords[normCode]) {
          state.unitPasswords[normCode] = cleanPass;
        }
      }
    }

    if (Array.isArray(bindings)) {
      for (const b of bindings) {
        if (!b || !b.chatId || !b.unitCode) continue;
        const normCode = normalizeUnitCode(b.unitCode);
        if (!viewerIsAdmin && (String(b.level || '').toLowerCase() === 'national' || normCode === 'tongtrucban')) continue;
        const exists = state.bindings.some(x => String(x.chatId) === String(b.chatId));
        if (!exists) {
          state.bindings.push({
            ...b,
            chatId: String(b.chatId),
            enabled: b.enabled !== false,
            restoredAt: new Date().toISOString()
          });
          restoredBindingsCount += 1;
        }
      }
    }

    const candidateToken = typeof botToken === 'string' ? botToken.trim() : '';
    if (!state.botToken && candidateToken.length > 0 && !candidateToken.includes('••••')) {
      restoredToken = true;
      await updateConfig({
        botToken: candidateToken,
        detectedOrigin,
        viewerCtx,
        forceWebhookSync: true
      });
    } else {
      persistState();
    }

    return {
      ok: true,
      restoredToken,
      restoredBindingsCount,
      status: getPublicStatus(viewerCtx)
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

  function getPublicStatus(viewerCtx = {}) {
    const requirePairingPassword = state.requirePairingPassword !== false;
    const viewerIsAdmin = Boolean(viewerCtx?.viewerIsAdmin);
    const viewerUsername = normalizeUnitCode(viewerCtx?.viewerUsername || '');
    const viewerAgency = String(viewerCtx?.viewerAgency || '').trim().toLowerCase();

    let viewerPairingCommand = '';
    if (viewerIsAdmin || !viewerUsername || viewerUsername === 'admin') {
      const samplePass = resolveDefaultPasswordForUnit({ unitCode: 'cap_tanan', agency: 'police', level: 'ward' });
      viewerPairingCommand = requirePairingPassword ? `/ketnoi cap_tanan ${samplePass}` : `/ketnoi cap_tanan`;
    } else {
      const myUnit = resolveUnitByCode(viewerUsername) || {
        unitCode: viewerUsername,
        agency: viewerAgency || 'police',
        level: viewerCtx?.viewerLevel || 'ward'
      };
      const myPass = resolveDefaultPasswordForUnit(myUnit);
      viewerPairingCommand = requirePairingPassword ? `/ketnoi ${myUnit.unitCode} ${myPass}` : `/ketnoi ${myUnit.unitCode}`;
    }

    const nationalPass = resolveDefaultPasswordForUnit({ unitCode: 'tongtrucban', agency: 'all', level: 'national' });
    const nationalPairingCommand = !requirePairingPassword
      ? '/ketnoi tongtrucban'
      : (viewerIsAdmin ? `/ketnoi tongtrucban ${nationalPass}` : '/ketnoi tongtrucban <Mật_khẩu_Tổng_Trực_Ban>');

    const enrichedPresets = PRESET_ZALO_UNITS.map(p => {
      const normCode = normalizeUnitCode(p.unitCode);
      const isNational = p.level === 'national' || normCode === 'tongtrucban';
      const canSeePass = isNational
        ? viewerIsAdmin
        : (viewerIsAdmin || !viewerAgency || viewerAgency === 'all' || p.agency === viewerAgency);
      const unitPass = resolveDefaultPasswordForUnit(p);
      const pairingCommand = !requirePairingPassword
        ? `/ketnoi ${p.unitCode}`
        : (canSeePass ? `/ketnoi ${p.unitCode} ${unitPass}` : `/ketnoi ${p.unitCode} <Mật_khẩu_trực_ban>`);
      return {
        ...p,
        pairingCommand,
        pairingPasswordMasked: requirePairingPassword && !canSeePass,
        requiresAdminAuth: isNational,
        hasCustomPassword: Boolean(state.unitPasswords && state.unitPasswords[normCode])
      };
    });

    const enrichedBindings = state.bindings.map(b => {
      const normCode = normalizeUnitCode(b.unitCode);
      return {
        ...b,
        hasCustomPassword: Boolean(state.unitPasswords && state.unitPasswords[normCode])
      };
    });

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
      requirePairingPassword,
      viewerIsAdmin,
      viewerPairingCommand,
      nationalPairingCommand,
      reminderSeconds: state.reminderSeconds,
      escalationSeconds: state.escalationSeconds,
      effectiveReminderSeconds: Math.round(getEffectiveReminderMs() / 1000),
      effectiveEscalationSeconds: Math.round(getEffectiveEscalationMs() / 1000),
      customUnits: state.customUnits || {},
      presets: enrichedPresets,
      bindings: enrichedBindings,
      recentOutbox: state.outboxLog.slice(-30).reverse()
    };
  }

  function renderIncidentMediaGalleryHtml(incident, fallbackOrigin = '') {
    if (!incident || !Array.isArray(incident.media) || incident.media.length === 0) {
      return '';
    }
    const cards = incident.media.map((rawItem, idx) => {
      const parsed = parseIncidentMediaItem(rawItem, idx);
      if (!parsed.dataUrl) return '';
      const src = parsed.isExternalHttp
        ? parsed.dataUrl
        : buildSignedMediaBinaryUrl(incident.id, idx, rawItem, fallbackOrigin);
      if (parsed.kind === 'video') {
        const posterSrc = buildSignedVideoPosterUrl(incident.id, idx, rawItem, fallbackOrigin);
        return `<div style="margin-bottom:10px;">
          <div style="font-size:11.5px;color:#7dd3fc;font-weight:700;margin-bottom:4px;">🎥 Video hiện trường #${idx + 1}</div>
          <video src="${escapeHtml(src)}" poster="${escapeHtml(posterSrc)}" controls playsinline webkit-playsinline preload="metadata" style="width:100%;max-height:340px;border-radius:10px;border:1px solid rgba(56,189,248,0.45);background:#000;"></video>
        </div>`;
      }
      return `<div style="margin-bottom:10px;">
        <div style="font-size:11.5px;color:#86efac;font-weight:700;margin-bottom:4px;">📷 Ảnh hiện trường #${idx + 1}</div>
        <a href="${escapeHtml(src)}" target="_blank" rel="noopener" style="display:block;">
          <img src="${escapeHtml(src)}" alt="Ảnh hiện trường #${idx + 1}" style="width:100%;max-height:360px;object-fit:contain;border-radius:10px;border:1px solid rgba(16,185,129,0.45);background:#020617;" />
        </a>
      </div>`;
    }).filter(Boolean).join('');

    if (!cards) return '';
    return `<div style="background:rgba(2,6,23,0.75);border:1px solid rgba(56,189,248,0.35);border-radius:12px;padding:12px;margin:12px 0;">
      <div style="font-size:12.5px;font-weight:800;color:#38bdf8;margin-bottom:8px;">📸 HÌNH ẢNH &amp; VIDEO HIỆN TRƯỜNG NGƯỜI DÂN GỬI (${incident.media.length})</div>
      ${cards}
    </div>`;
  }

  /**
   * Render a crisp mobile-first HTML5 Video & Photo Player page (`/api/zalo/media-view`)
   * optimized for iPhone iOS 26 Safari & Android Zalo In-App Browser:
   * - Instant moving video autoplay (`autoplay muted loop playsinline webkit-playsinline`)
   * - 1-tap Full-Audio Unmute button (`#btnUnmuteSceneVideo`) + Direct `.MP4` Download/Share (`?dl=1`)
   * - OpenGraph `og:image` (`<idx>_poster`) + `og:video` tags even on video-only incidents
   * - Generous bottom safe-area clearance so iOS 26 floating address bar never overlaps action buttons
   */
  function renderMediaViewerHtml({ ok, incident, mediaIndex = 0, chatId = '', fallbackOrigin = '', error = '' }) {
    if (!ok || !incident || !Array.isArray(incident.media) || incident.media.length === 0) {
      return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Bằng Chứng Hiện Trường SOS</title></head>
<body style="margin:0;min-height:100vh;background:#020617;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="max-width:440px;background:#0f172a;border:1.5px solid #f59e0b;border-radius:16px;padding:20px;text-align:center;">
    <h2 style="margin:0 0 8px 0;font-size:18px;color:#fbbf24;">Không thể mở Ảnh / Video hiện trường</h2>
    <p style="font-size:13.5px;color:#cbd5e1;line-height:1.5;">${escapeHtml(error || 'Liên kết không hợp lệ hoặc hồ sơ chưa có tệp đính kèm.')}</p>
  </div>
</body></html>`;
    }

    const safeIdx = Math.max(0, Math.min(incident.media.length - 1, Number(mediaIndex) || 0));
    const primaryItem = incident.media[safeIdx];
    const primaryParsed = parseIncidentMediaItem(primaryItem, safeIdx);
    const primarySrc = primaryParsed.isExternalHttp
      ? primaryParsed.dataUrl
      : buildSignedMediaBinaryUrl(incident.id, safeIdx, primaryItem, fallbackOrigin);
    const primaryDownloadSrc = `${primarySrc}${primarySrc.includes('?') ? '&' : '?'}dl=1`;
    const primaryPosterSrc = primaryParsed.kind === 'video'
      ? buildSignedVideoPosterUrl(incident.id, safeIdx, primaryItem, fallbackOrigin)
      : '';

    const firstImgIdx = incident.media.findIndex((m, i) => parseIncidentMediaItem(m, i).kind === 'image');
    const ogImageUrl = primaryParsed.kind === 'video'
      ? primaryPosterSrc
      : (firstImgIdx >= 0
          ? buildSignedMediaBinaryUrl(incident.id, firstImgIdx, incident.media[firstImgIdx], fallbackOrigin)
          : '');

    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.lat)},${encodeURIComponent(incident.lng)}`;
    const telHref = incident.reporterPhone ? `tel:${escapeHtml(incident.reporterPhone)}` : '';
    const isWaiting = incident.status === 'pending' || incident.status === 'escalated';
    const quickAcceptUrl = (chatId && isWaiting) ? buildQuickAcceptUrl(incident.id, chatId, fallbackOrigin) : '';
    const pageTitle = primaryParsed.kind === 'video'
      ? `🎥 Video Hiện Trường #${incident.id} — SOS Việt Nam 2026`
      : `📷 Ảnh Hiện Trường #${incident.id} — SOS Việt Nam 2026`;

    const otherItemsHtml = incident.media.length > 1
      ? incident.media.map((rawItem, idx) => {
          if (idx === safeIdx) return '';
          const p = parseIncidentMediaItem(rawItem, idx);
          const s = p.isExternalHttp ? p.dataUrl : buildSignedMediaBinaryUrl(incident.id, idx, rawItem, fallbackOrigin);
          if (p.kind === 'video') {
            const pPoster = buildSignedVideoPosterUrl(incident.id, idx, rawItem, fallbackOrigin);
            return `<div style="margin-top:10px;"><div style="font-size:11.5px;color:#7dd3fc;font-weight:700;margin-bottom:4px;">🎥 Video đính kèm #${idx + 1}</div><video src="${escapeHtml(s)}" poster="${escapeHtml(pPoster)}" controls playsinline webkit-playsinline preload="metadata" style="width:100%;max-height:320px;border-radius:10px;background:#000;border:1px solid rgba(56,189,248,0.4);"></video></div>`;
          }
          return `<div style="margin-top:10px;"><div style="font-size:11.5px;color:#86efac;font-weight:700;margin-bottom:4px;">📷 Ảnh đính kèm #${idx + 1}</div><img src="${escapeHtml(s)}" alt="Hiện trường #${idx + 1}" style="width:100%;max-height:340px;object-fit:contain;border-radius:10px;background:#020617;border:1px solid rgba(16,185,129,0.4);"/></div>`;
        }).filter(Boolean).join('')
      : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, viewport-fit=cover" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(`${incident.reporterName || 'Người dân'} — ${incident.address || ''}`)}" />
  <meta property="og:type" content="${primaryParsed.kind === 'video' ? 'video.other' : 'website'}" />
  ${ogImageUrl ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />` : ''}
  ${primaryParsed.kind === 'video' ? `<meta property="og:video" content="${escapeHtml(primarySrc)}" /><meta property="og:video:secure_url" content="${escapeHtml(primarySrc)}" /><meta property="og:video:type" content="video/mp4" />` : ''}
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); color: #f8fafc; padding: 14px 14px calc(120px + env(safe-area-inset-bottom, 28px)) 14px; display: flex; justify-content: center; align-items: flex-start; }
    .card { width: 100%; max-width: 520px; background: rgba(15, 23, 42, 0.96); border: 1.5px solid #38bdf8; border-radius: 18px; padding: 18px 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.75); }
    .badge { display: inline-block; padding: 4px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 800; background: rgba(56,189,248,0.18); color: #38bdf8; border: 1px solid rgba(56,189,248,0.45); margin-bottom: 10px; }
    h1 { font-size: 18px; margin: 0 0 10px 0; color: #fff; line-height: 1.35; }
    .player-box { background: #000; border-radius: 12px; overflow: hidden; border: 1px solid rgba(56,189,248,0.45); margin-bottom: 10px; position: relative; }
    .meta { background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 12px; padding: 11px 13px; margin: 12px 0; font-size: 13.5px; line-height: 1.55; color: #cbd5e1; }
    .meta b { color: #f8fafc; }
    .btn { display: block; width: 100%; text-align: center; text-decoration: none; padding: 13px 15px; border-radius: 12px; font-weight: 800; font-size: 14.5px; margin-top: 9px; border: none; cursor: pointer; }
    .btn-sound { background: linear-gradient(135deg, #d97706, #f59e0b); color: #fff; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); }
    .btn-sound.active { background: rgba(16, 185, 129, 0.22); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.5); box-shadow: none; }
    .btn-dl { background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.45); font-size: 13.5px; padding: 11px 14px; }
    .btn-accept { background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; box-shadow: 0 8px 22px rgba(239, 68, 68, 0.4); }
    .btn-map { background: linear-gradient(135deg, #059669, #10b981); color: #fff; }
    .btn-call { background: linear-gradient(135deg, #0284c7, #38bdf8); color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${primaryParsed.kind === 'video' ? '🎥 VIDEO HIỆN TRƯỜNG TRỰC TIẾP TỪ NGƯỜI DÂN' : '📷 HÌNH ẢNH HIỆN TRƯỜNG TRỰC TIẾP TỪ NGƯỜI DÂN'}</div>
    <h1>Hồ sơ khẩn cấp #${escapeHtml(incident.id)}</h1>
    <div class="player-box">
      ${primaryParsed.kind === 'video'
        ? `<video id="sceneVideoPlayer" src="${escapeHtml(primarySrc)}" poster="${escapeHtml(primaryPosterSrc)}" controls autoplay muted loop playsinline webkit-playsinline preload="auto" style="width:100%;max-height:64vh;display:block;background:#000;"></video>`
        : `<img src="${escapeHtml(primarySrc)}" alt="Ảnh hiện trường" style="width:100%;max-height:70vh;object-fit:contain;display:block;background:#000;" />`
      }
    </div>
    ${primaryParsed.kind === 'video' ? `
      <button type="button" id="btnUnmuteSceneVideo" class="btn btn-sound">🔊 BẤM BẬT ÂM THANH HIỆN TRƯỜNG (100%)</button>
      <a class="btn btn-dl" href="${escapeHtml(primaryDownloadSrc)}" download="video-hien-truong-${escapeHtml(incident.id)}.${escapeHtml(primaryParsed.ext)}">⬇️ TẢI VIDEO .MP4 GỐC VỀ MÁY / CHUYỂN TIẾP ZALO</a>
    ` : `
      <a class="btn btn-dl" href="${escapeHtml(primaryDownloadSrc)}" download="anh-hien-truong-${escapeHtml(incident.id)}.${escapeHtml(primaryParsed.ext)}">⬇️ TẢI ẢNH HIỆN TRƯỜNG GỐC VỀ MÁY</a>
    `}
    ${quickAcceptUrl ? `<a class="btn btn-accept" href="${escapeHtml(quickAcceptUrl)}">✅ XÁC NHẬN TIẾP NHẬN CA NÀY NGAY</a>` : ''}
    ${otherItemsHtml}
    <div class="meta">
      <div><b>Người dân gửi:</b> ${escapeHtml(incident.reporterName || 'Người dân')}</div>
      <div><b>Số điện thoại:</b> ${escapeHtml(incident.reporterPhone || 'Đang cập nhật')}</div>
      <div><b>Địa điểm GPS:</b> ${escapeHtml(incident.address || '')} (${Number(incident.lat).toFixed(5)}, ${Number(incident.lng).toFixed(5)})</div>
      ${incident.customNotes ? `<div><b>Mô tả hiện trường:</b> ${escapeHtml(incident.customNotes)}</div>` : ''}
      <div><b>Đơn vị phụ trách:</b> ${escapeHtml(incident.assignedUnit?.name || '')}</div>
    </div>
    <a class="btn btn-map" href="${gmapsUrl}" target="_blank" rel="noopener">🧭 MỞ GOOGLE MAPS DẪN ĐƯỜNG TỚI NẠN NHÂN</a>
    ${telHref ? `<a class="btn btn-call" href="${telHref}">📞 GỌI ĐIỆN NGAY CHO NGƯỜI DÂN (${escapeHtml(incident.reporterPhone)})</a>` : ''}
  </div>
  ${primaryParsed.kind === 'video' ? `<script>
  (function () {
    var vid = document.getElementById('sceneVideoPlayer');
    var btn = document.getElementById('btnUnmuteSceneVideo');
    if (!vid) return;
    var p = vid.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
    function syncSoundBtn() {
      if (!btn) return;
      if (!vid.muted && vid.volume > 0) {
        btn.textContent = '🔊 ĐANG PHÁT ÂM THANH GỐC HIỆN TRƯỜNG';
        btn.classList.add('active');
      } else {
        btn.textContent = '🔊 BẤM BẬT ÂM THANH HIỆN TRƯỜNG (100%)';
        btn.classList.remove('active');
      }
    }
    if (btn) {
      btn.addEventListener('click', function () {
        vid.muted = false;
        vid.volume = 1.0;
        if (vid.paused) {
          var rp = vid.play();
          if (rp && typeof rp.catch === 'function') rp.catch(function () {});
        }
        syncSoundBtn();
      });
    }
    vid.addEventListener('volumechange', syncSoundBtn);
  })();
  </script>` : ''}
</body>
</html>`;
  }

  /**
   * Render a crisp mobile-first confirmation screen when an officer taps the
   * 1-Tap Quick-Accept link inside Zalo on their phone, including an instant
   * officer-name update box AND inline citizen scene photos/videos!
   */
  function renderQuickAcceptHtml({ ok, incident, error = '', alreadyHandled = false, chatId = '', sig = '', origin = '' }) {
    const title = ok
      ? `Đã Tiếp Nhận Ca #${escapeHtml(incident?.id || '')}`
      : `Thông Báo Tiếp Nhận SOS`;
    const gmapsUrl = incident
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.lat)},${encodeURIComponent(incident.lng)}`
      : 'https://www.google.com/maps';
    const telHref = incident?.reporterPhone ? `tel:${escapeHtml(incident.reporterPhone)}` : '';
    const currentOfficerName = incident?.dispatchUnit?.officerName || '';
    const currentOfficerTitle = incident?.dispatchUnit?.officerFullTitle || currentOfficerName || 'Cán bộ trực ban';
    const mediaGalleryHtml = ok && incident ? renderIncidentMediaGalleryHtml(incident, origin) : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <meta property="og:title" content="Bấm Tiếp Nhận Ca SOS Khẩn Cấp — SOS Việt Nam 2026" />
  <title>${title} — SOS Việt Nam 2026</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); color: #f8fafc; display: flex; align-items: flex-start; justify-content: center; padding: 18px 16px calc(120px + env(safe-area-inset-bottom, 28px)) 16px; }
    .card { width: 100%; max-width: 460px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${ok ? '#10b981' : '#f59e0b'}; border-radius: 18px; padding: 22px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.65); }
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
      ${mediaGalleryHtml}
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
    restoreBackup,
    resolveUnitByCode,
    resolveUnitByCodeOrQuery,
    resolveDefaultPasswordForUnit,
    verifyUnitPairingPassword,
    registerCustomUnit,
    bindChatToUnit,
    updateBinding,
    unlinkBinding,
    sendZaloMessage,
    sendZaloPhoto,
    sendZaloVideo,
    broadcastAnnouncement,
    onIncidentCreated,
    onIncidentEscalated,
    onCitizenMediaReceived,
    onIncidentAcceptedOrClosed,
    clearIncidentZaloTimer,
    clearAllIncidentTimers,
    handleWebhookPayload,
    verifyQuickAccept,
    signMediaAccess,
    verifyMediaAccess,
    decodeIncidentMediaBuffer,
    ensureVideoPosterForIncidentItem,
    buildSignedMediaBinaryUrl,
    buildSignedVideoPosterUrl,
    buildSignedMediaViewerUrl,
    renderMediaViewerHtml,
    renderQuickAcceptHtml,
    getEffectiveEscalationMs,
    getEffectiveReminderMs,
    stopPolling
  };
}
