/**
 * Hybrid Web3 Blockchain Ledger & Hardware DePIN Anti-Spoofing Service (ESM)
 *
 * Implements:
 * 1. Staging (84202600 / SOS_RENDER_SANDBOX) vs Production (842026 / SOS_VIETNAM_OFFICIAL) auto-detection
 * 2. Hardware SOS DePIN verification (CapPhatTheSOS.exe C++ seal + ESP32-C3 self-seal + live_evidence_hash)
 * 3. Cryptographically hash-chained persistent ledger (Block #101+) via runtime-data-store.js
 * 4. Multi-Chain EVM metadata & optional JSON-RPC relay (SOS Chain 842026, NDA Chain, Polygon Amoy)
 * 5. Self-contained ISO/IEC 18004 Reed-Solomon SVG QR Code generator for Block Verification URLs
 */

import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { readRuntimeData, writeRuntimeData, RUNTIME_STORAGE_MODE } from './runtime-data-store.js';

export const COMMAND_SECRET_KEY = process.env.COMMAND_SECRET_KEY || 'BTL_CSCD_E10_D1_SOS_VIETNAM_2026';
export const DAC_TA_SECRET_KEY = process.env.DAC_TA_SECRET_KEY || 'SOS_VIETNAM_TACTICAL_ESC_2026_DEPIN_SECURE_KEY';
export const ZERO_PREV_SEAL = '0x0000000000000000000000000000000000000000000000000000000000000000';

const LEDGER_STORE_NAME = 'blockchain-ledger.json';
const CARD_REGISTRY_STORE_NAME = 'depin-cards-registry.json';
const GENESIS_SEED = 'SOS_VIETNAM_2026_GENESIS_BLOCK_CHAIN_842026_DEPIN_V2';
const GENESIS_HASH = '0x' + crypto.createHash('sha256').update(GENESIS_SEED).digest('hex');
const MAX_PERSISTED_BLOCKS = 5000;

export const LIFECYCLE_ACTIONS = Object.freeze({
  SOS_TRIGGER: '1_SOS_TRIGGER',
  EVIDENCE_SEAL: '2_EVIDENCE_SEAL',
  CASE_ESCALATED: '2B_CASE_ESCALATED',
  OFFICER_DISPATCH: '3_OFFICER_DISPATCH',
  OFFICER_APPROACHING: '3A_OFFICER_APPROACHING',
  OFFICER_ARRIVED: '3B_OFFICER_ARRIVED',
  CASE_RESOLVED: '4_CASE_RESOLVED',
  FAKE_ALARM_FLAGGED: '4B_FAKE_ALARM',
  CARD_PROVISION_SEAL: '0_CARD_PROVISION_SEAL'
});

export function describeBlockchainActionVi(actionType) {
  switch (actionType) {
    case LIFECYCLE_ACTIONS.SOS_TRIGGER:
      return '1. Khởi tạo & Báo tin cứu hộ khẩn cấp';
    case LIFECYCLE_ACTIONS.EVIDENCE_SEAL:
      return '2. Niêm phong chứng cứ số SHA-256 hiện trường';
    case LIFECYCLE_ACTIONS.CASE_ESCALATED:
      return '2B. Chuyển vượt cấp Chỉ huy Tỉnh / Thành phố';
    case LIFECYCLE_ACTIONS.OFFICER_DISPATCH:
      return '3. Trực ban tiếp nhận & Xuất quân cứu hộ';
    case LIFECYCLE_ACTIONS.OFFICER_APPROACHING:
      return '3A. Đội cứu hộ tiếp cận gần hiện trường (< 300m)';
    case LIFECYCLE_ACTIONS.OFFICER_ARRIVED:
      return '3B. Lực lượng cứu hộ đã có mặt tại hiện trường';
    case LIFECYCLE_ACTIONS.CASE_RESOLVED:
      return '4. Hoàn tất ứng cứu & Đóng hồ sơ bất biến';
    case LIFECYCLE_ACTIONS.FAKE_ALARM_FLAGGED:
      return '4B. Lập biên bản báo tin giả (Nghị định 144/2021/NĐ-CP)';
    case LIFECYCLE_ACTIONS.CARD_PROVISION_SEAL:
      return '0. Cấp phát / Nối khối Thẻ SOS vật lý (DePIN)';
    default:
      return String(actionType || 'Giao dịch sổ cái');
  }
}

export function formatDurationSecondsVi(seconds) {
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

export function maskLedgerPii(value, head = 3, tail = 3) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (s.length <= head + tail) return s.slice(0, 1) + '***';
  return `${s.slice(0, head)}***${s.slice(-tail)}`;
}

function sha256HexRaw(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function sha256Prefixed(input) {
  return '0x' + sha256HexRaw(input);
}

function normalizeHexDigest(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/^0x/i, '').toLowerCase();
  return /^[0-9a-f]{64}$/.test(trimmed) ? trimmed : '';
}

function timingSafeHexEqual(hexA, hexB) {
  const cleanA = normalizeHexDigest(hexA);
  const cleanB = normalizeHexDigest(hexB);
  if (!cleanA || !cleanB || cleanA.length !== cleanB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleanA, 'hex'), Buffer.from(cleanB, 'hex'));
}

export function extractHostname(hostOrOrigin = '') {
  const raw = String(hostOrOrigin || '').trim();
  if (!raw) return '';
  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).hostname.toLowerCase();
    }
  } catch (_) {}
  return raw.split('/')[0].split(':')[0].trim().toLowerCase();
}

export const OTS_HEADER_MAGIC = Buffer.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d,
  0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00,
  0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf,
  0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94
]);

export const OTS_CALENDAR_ENDPOINTS = Object.freeze([
  'https://a.pool.opentimestamps.org/digest',
  'https://b.pool.opentimestamps.org/digest',
  'https://alice.btc.calendar.opentimestamps.org/digest',
  'https://bob.btc.calendar.opentimestamps.org/digest'
]);

const OTS_PENDING_ATTESTATION_TAG = '83dfe30d2ef90c8e';
const OTS_BITCOIN_ATTESTATION_TAG = '0588960d73d71901';

export function normalizeNetworkView(networkInput = '') {
  const raw = String(networkInput || '').trim().toUpperCase();
  if (!raw || raw === '842026' || raw === '84202600' || raw === 'INTERNAL' || raw === 'SOS' || raw === 'SOS_INTERNAL') {
    return '842026';
  }
  if (raw === 'NDA' || raw === 'NDACHAIN' || raw === 'NDA_NATIONAL' || raw === 'NATIONAL') {
    return 'NDA';
  }
  if (raw === 'OTS' || raw === 'BITCOIN' || raw === 'BITCOIN_OTS' || raw === 'OPENTIMESTAMPS' || raw === 'GLOBAL_BITCOIN_OTS') {
    return 'OTS';
  }
  if (raw === 'POLYGON' || raw === 'EVM' || raw === 'POLYGON_AMOY' || raw === 'GLOBAL_POLYGON_EVM') {
    return 'POLYGON';
  }
  return '842026';
}

export function isZeroPiiNetworkView(networkInput = '') {
  return normalizeNetworkView(networkInput) !== '842026';
}

export function computeCaseCommitmentHash(caseId = '') {
  const clean = String(caseId || '').trim().toUpperCase();
  return '0x' + sha256HexRaw(Buffer.from(`SOSVN_CASE|${clean}|842026`, 'utf8'));
}

export function describeZeroPiiStageVi(actionType) {
  switch (actionType) {
    case LIFECYCLE_ACTIONS.SOS_TRIGGER:
      return 'Bước 1. Khởi tạo tín hiệu cứu hộ khẩn cấp (Zero-PII Commitment)';
    case LIFECYCLE_ACTIONS.EVIDENCE_SEAL:
      return 'Bước 2. Niêm phong mã băm chứng cứ số SHA-256 (Zero-PII)';
    case LIFECYCLE_ACTIONS.CASE_ESCALATED:
      return 'Bước 2B. Điều chuyển cấp chỉ huy theo SLA (Zero-PII)';
    case LIFECYCLE_ACTIONS.OFFICER_DISPATCH:
      return 'Bước 3. Tiếp nhận & điều động lực lượng trực chiến (Zero-PII)';
    case LIFECYCLE_ACTIONS.OFFICER_APPROACHING:
      return 'Bước 3A. Lực lượng áp sát bán kính hiện trường (Zero-PII)';
    case LIFECYCLE_ACTIONS.OFFICER_ARRIVED:
      return 'Bước 3B. Lực lượng có mặt tại hiện trường (Zero-PII)';
    case LIFECYCLE_ACTIONS.CASE_RESOLVED:
      return 'Bước 4. Hoàn tất ứng cứu & đóng hồ sơ bất biến (Zero-PII)';
    case LIFECYCLE_ACTIONS.FAKE_ALARM_FLAGGED:
      return 'Bước 4B. Khóa hồ sơ vi phạm cảnh báo giả NĐ 144 (Zero-PII)';
    case LIFECYCLE_ACTIONS.CARD_PROVISION_SEAL:
      return 'Bước 0. Niêm phong định danh phần cứng DePIN (Zero-PII)';
    default:
      return 'Giao dịch cam kết mật mã Zero-PII';
  }
}

export function buildZeroPiiPublicAnchorDocument(block) {
  if (!block || typeof block !== 'object') return null;
  const actionCode = String(block.action || block.payload?.action || 'UNKNOWN_STAGE');
  const caseCommitmentHash = computeCaseCommitmentHash(block.caseId || block.payload?.caseId || '');
  const doc = {
    protocol: 'SOSVN-ANCHOR-V1',
    canonicalChainId: 842026,
    blockNumber: Number(block.blockNumber) || 0,
    actionCode,
    sealedAt: String(block.timestamp || block.payload?.timestamp || ''),
    caseCommitmentHash,
    prevHash: String(block.prevHash || ''),
    txHash: String(block.txHash || ''),
    payloadDigest: String(block.payloadDigest || block.evidenceHash || '')
  };
  const canonicalJson = JSON.stringify(doc, null, 2) + '\n';
  const jsonBytes = Buffer.from(canonicalJson, 'utf8');
  const anchorDigestBuf = crypto.createHash('sha256').update(jsonBytes).digest();
  const anchorDigestHex = '0x' + anchorDigestBuf.toString('hex');
  const compactCalldataUtf8 = `SOSVN-ANCHOR-V1|${doc.blockNumber}|${doc.actionCode}|${doc.caseCommitmentHash}|${doc.txHash}|${anchorDigestHex}`;
  const compactCalldataHex = '0x' + Buffer.from(compactCalldataUtf8, 'utf8').toString('hex');
  return {
    document: doc,
    canonicalJson,
    jsonBytes,
    anchorDigestBuf,
    anchorDigestHex,
    evmCalldataUtf8: compactCalldataUtf8,
    evmCalldataHex: compactCalldataHex,
    fileName: `SOSVN_Block_${doc.blockNumber}_PublicAnchor.json`,
    otsFileName: `SOSVN_Block_${doc.blockNumber}_PublicAnchor.json.ots`
  };
}

function readOtsVaruint(buf, offset) {
  let value = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    value += (b & 0x7f) * Math.pow(2, shift);
    if ((b & 0x80) === 0) {
      return { value, nextOffset: pos };
    }
    shift += 7;
    if (shift > 35) throw new Error('OTS_VARUINT_OVERFLOW');
  }
  throw new Error('OTS_UNEXPECTED_EOF');
}

function readOtsVarbytes(buf, offset, maxLen = 8192) {
  const { value: len, nextOffset } = readOtsVaruint(buf, offset);
  if (len < 0 || len > maxLen || nextOffset + len > buf.length) {
    throw new Error('OTS_VARBYTES_OUT_OF_RANGE');
  }
  return {
    bytes: buf.subarray(nextOffset, nextOffset + len),
    nextOffset: nextOffset + len
  };
}

function parseOtsTimestampTree(buf, offset, currentMsg, attestations, depth = 0) {
  if (depth > 64) throw new Error('OTS_MAX_DEPTH_EXCEEDED');
  let pos = offset;
  while (pos < buf.length && buf[pos] === 0xff) {
    pos += 1;
    pos = parseOtsTimestampTree(buf, pos, currentMsg, attestations, depth + 1);
  }
  if (pos >= buf.length) throw new Error('OTS_TREE_EOF');
  const tag = buf[pos++];
  if (tag === 0x00) {
    if (pos + 8 > buf.length) throw new Error('OTS_ATTESTATION_TAG_EOF');
    const attTagHex = buf.subarray(pos, pos + 8).toString('hex');
    pos += 8;
    const { bytes: payload, nextOffset } = readOtsVarbytes(buf, pos, 4096);
    pos = nextOffset;
    if (attTagHex === OTS_PENDING_ATTESTATION_TAG) {
      const { bytes: uriBytes } = readOtsVarbytes(payload, 0, 2048);
      attestations.push({
        type: 'PendingAttestation',
        calendarUri: uriBytes.toString('utf8'),
        commitmentTipHex: '0x' + currentMsg.toString('hex')
      });
    } else if (attTagHex === OTS_BITCOIN_ATTESTATION_TAG) {
      const { value: bitcoinBlockHeight } = readOtsVaruint(payload, 0);
      attestations.push({
        type: 'BitcoinBlockHeaderAttestation',
        bitcoinBlockHeight,
        merkleRootHex: '0x' + Buffer.from(currentMsg).reverse().toString('hex')
      });
    } else {
      attestations.push({
        type: 'UnknownAttestation',
        tagHex: attTagHex,
        commitmentTipHex: '0x' + currentMsg.toString('hex')
      });
    }
    return pos;
  }

  let nextMsg = currentMsg;
  if (tag === 0x08) {
    nextMsg = crypto.createHash('sha256').update(currentMsg).digest();
  } else if (tag === 0x02) {
    nextMsg = crypto.createHash('sha1').update(currentMsg).digest();
  } else if (tag === 0x03) {
    nextMsg = crypto.createHash('ripemd160').update(currentMsg).digest();
  } else if (tag === 0xf0) {
    const { bytes: arg, nextOffset } = readOtsVarbytes(buf, pos, 4096);
    pos = nextOffset;
    nextMsg = Buffer.concat([currentMsg, arg]);
  } else if (tag === 0xf1) {
    const { bytes: arg, nextOffset } = readOtsVarbytes(buf, pos, 4096);
    pos = nextOffset;
    nextMsg = Buffer.concat([arg, currentMsg]);
  } else if (tag === 0xf2) {
    nextMsg = Buffer.from(currentMsg).reverse();
  } else if (tag === 0xf3) {
    nextMsg = Buffer.from(currentMsg.toString('hex'), 'ascii');
  } else {
    throw new Error(`OTS_UNSUPPORTED_OP_0x${tag.toString(16)}`);
  }

  return parseOtsTimestampTree(buf, pos, nextMsg, attestations, depth + 1);
}

export function inspectOtsProofBuffer(otsInput, expectedDigestInput = null) {
  try {
    const buf = Buffer.isBuffer(otsInput) ? otsInput : Buffer.from(String(otsInput || ''), 'base64');
    if (buf.length < OTS_HEADER_MAGIC.length + 2 + 32) {
      return { valid: false, error: 'OTS_TOO_SHORT' };
    }
    const headerSlice = buf.subarray(0, OTS_HEADER_MAGIC.length);
    if (!headerSlice.equals(OTS_HEADER_MAGIC)) {
      return { valid: false, error: 'OTS_MAGIC_MISMATCH' };
    }
    let pos = OTS_HEADER_MAGIC.length;
    const { value: version, nextOffset } = readOtsVaruint(buf, pos);
    pos = nextOffset;
    if (version !== 1) {
      return { valid: false, error: `OTS_UNSUPPORTED_VERSION_${version}` };
    }
    const hashOp = buf[pos++];
    const digestLen = hashOp === 0x08 ? 32 : (hashOp === 0x02 || hashOp === 0x03 ? 20 : 0);
    if (!digestLen || pos + digestLen > buf.length) {
      return { valid: false, error: `OTS_UNSUPPORTED_HASH_OP_0x${hashOp.toString(16)}` };
    }
    const fileDigest = buf.subarray(pos, pos + digestLen);
    pos += digestLen;

    let digestMatchesExpected = true;
    if (expectedDigestInput) {
      const expBuf = Buffer.isBuffer(expectedDigestInput)
        ? expectedDigestInput
        : Buffer.from(normalizeHexDigest(String(expectedDigestInput)), 'hex');
      digestMatchesExpected = expBuf.length === fileDigest.length && crypto.timingSafeEqual(fileDigest, expBuf);
    }

    const attestations = [];
    const endPos = parseOtsTimestampTree(buf, pos, fileDigest, attestations, 0);
    return {
      valid: Boolean(digestMatchesExpected && attestations.length > 0 && endPos === buf.length),
      version,
      hashOp: 'SHA256',
      byteLength: buf.length,
      fileDigestHex: '0x' + fileDigest.toString('hex'),
      digestMatchesExpected,
      attestations
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function resolveSystemBlockchainConfig(hostOrOrigin = '') {
  const hostname = extractHostname(hostOrOrigin || process.env.PUBLIC_HOSTNAME || '');
  const isProduction = Boolean(
    hostname === 'sosvie.site' ||
    hostname === 'www.sosvie.site' ||
    process.env.SOS_FORCE_PRODUCTION_CHAIN === 'true'
  );
  const activeChainId = isProduction ? 842026 : 84202600;
  const envName = isProduction
    ? 'HỆ THỐNG CHÍNH THỨC (PRODUCTION)'
    : 'MÔI TRƯỜNG THỬ NGHIỆM (TEST SANDBOX)';
  const storageFolder = isProduction ? 'SOS_VIETNAM_OFFICIAL' : 'SOS_RENDER_SANDBOX';

  const networks = {
    '842026': {
      code: '842026',
      shortLabelVi: 'Nội Bộ SOS (842026)',
      label: isProduction
        ? 'SOS VIETNAM CHAIN (ID: 842026)'
        : 'SOS VIETNAM CHAIN (ID: 842026 · SANDBOX 84202600)',
      scopeTier: 'INTERNAL',
      zeroPiiEnforced: false,
      visibilityBadgeVi: 'MẠNG NỘI BỘ · HIỂN THỊ ĐẦY ĐỦ NGHIỆP VỤ',
      visibilityDescVi: 'Trực ban đã xác thực xem được Full 100% chi tiết ca trực (Người báo, SĐT, CCCD, GPS, Cán bộ nhận ca, Thời lượng từng khâu).',
      chainId: activeChainId,
      rpcUrl: process.env.SOS_CHAIN_RPC_URL || '',
      rpcConfigured: true,
      explorerBase: '/api/blockchain/explorer/'
    },
    NDA: {
      code: 'NDA',
      shortLabelVi: 'Quốc Gia NDAChain',
      label: 'NDA CHAIN QUỐC GIA (ĐỐI CHỨNG LIÊN NGÀNH)',
      scopeTier: 'NATIONAL_INTERAGENCY',
      zeroPiiEnforced: true,
      visibilityBadgeVi: 'MẠNG QUỐC GIA · BẢO MẬT ZERO-PII',
      visibilityDescVi: 'Đối chứng liên ngành cấp Quốc gia: Đã ẩn tuyệt đối Họ tên, SĐT, CCCD, Tọa độ GPS và Cán bộ — chỉ công bố Cam kết SHA-256 & SLA thời gian xử lý.',
      chainId: Number(process.env.NDA_CHAIN_ID || 842025),
      rpcUrl: process.env.NDA_CHAIN_RPC_URL || '',
      rpcConfigured: Boolean(process.env.NDA_CHAIN_RPC_URL),
      explorerBase: process.env.NDA_CHAIN_EXPLORER_URL || '/api/blockchain/explorer/'
    },
    OTS: {
      code: 'OTS',
      shortLabelVi: 'Quốc Tế Bitcoin (OTS)',
      label: 'BITCOIN GLOBAL · OPENTIMESTAMPS CALENDAR',
      scopeTier: 'GLOBAL_PUBLIC',
      zeroPiiEnforced: true,
      visibilityBadgeVi: 'MẠNG QUỐC TẾ BITCOIN · 100% ZERO-PII',
      visibilityDescVi: 'Đối chứng toàn cầu trên hạ tầng Bitcoin OpenTimestamps: 0% lộ lọt thông tin nhạy cảm — tải tệp .json + .ots để kiểm chứng độc lập tại opentimestamps.org.',
      chainId: 0,
      rpcUrl: OTS_CALENDAR_ENDPOINTS[0],
      rpcConfigured: true,
      verificationSiteUrl: 'https://opentimestamps.org',
      explorerBase: 'https://opentimestamps.org'
    },
    POLYGON: {
      code: 'POLYGON',
      shortLabelVi: 'Quốc Tế Polygon EVM',
      label: 'POLYGON / ETHEREUM EVM GLOBAL EXPLORER',
      scopeTier: 'GLOBAL_PUBLIC',
      zeroPiiEnforced: true,
      visibilityBadgeVi: 'MẠNG QUỐC TẾ EVM · 100% ZERO-PII',
      visibilityDescVi: 'Khung dữ liệu neo EVM Quốc tế (Polygon Amoy / Ethereum): Chỉ xuất bản gói Calldata Cam kết SHA-256 (SOSVN-ANCHOR-V1), tuyệt đối không chứa PII.',
      chainId: 80002,
      rpcUrl: process.env.POLYGON_AMOY_RPC_URL || '',
      rpcConfigured: Boolean(process.env.POLYGON_AMOY_RPC_URL),
      explorerBase: process.env.POLYGON_AMOY_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'
    }
  };

  return {
    hostname: hostname || 'localhost',
    isProduction,
    envName,
    chainId: activeChainId,
    canonicalChainId: 842026,
    storageFolder,
    networks,
    supportedNetworks: ['842026', 'NDA', 'OTS', 'POLYGON'].map((k) => networks[k])
  };
}

export const BLOCKCHAIN_NETWORK_PROFILES = Object.freeze(resolveSystemBlockchainConfig('').networks);

function getAcceptedSecretKeys() {
  return Array.from(new Set([
    DAC_TA_SECRET_KEY,
    COMMAND_SECRET_KEY,
    'SOS_VIETNAM_TACTICAL_ESC_2026_DEPIN_SECURE_KEY',
    'BTL_CSCD_E10_D1_SOS_VIETNAM_2026'
  ].filter(Boolean)));
}

/**
 * Computes Chained Identity Block SHA-256 seal per DAC_TA_DONG_BO_WEB_VA_AI.md Section 4 & CapPhatTheSOS.cpp:
 * payload = PrevSeal + "|" + BlockIndex + "|" + Mode + "|" + ID + "|" + Name + "|" + Phone + "|" + CCCD + "|" + Officer + "|" + Timestamp + "|" + SecretKey
 */
export function sanitizeCardField(val) {
  return String(val ?? '').replace(/[\r\n]/g, '').replace(/\|/g, '-').trim();
}

export function computeChainedCardSeal(
  {
    prevSeal = ZERO_PREV_SEAL,
    blockIndex = 1,
    mode = 'REAL',
    id = '',
    name = '',
    phone = '',
    cccd = '',
    officer = '',
    timestamp = ''
  } = {},
  secretKey = COMMAND_SECRET_KEY,
  { uppercaseNoPrefix = false } = {}
) {
  const cleanPrev = String(prevSeal || '').trim() || ZERO_PREV_SEAL;
  const idx = Math.max(1, parseInt(blockIndex, 10) || 1);
  const normMode = String(mode || 'REAL').trim().toUpperCase();
  const payload = `${cleanPrev}|${idx}|${normMode}|${sanitizeCardField(id)}|${sanitizeCardField(name)}|${sanitizeCardField(phone)}|${sanitizeCardField(cccd)}|${sanitizeCardField(officer)}|${sanitizeCardField(timestamp)}|${secretKey}`;
  const hex = sha256HexRaw(Buffer.from(payload, 'utf8'));
  return uppercaseNoPrefix ? hex.toUpperCase() : ('0x' + hex.toLowerCase());
}

export function verifyChainedCardSeal(cardData = {}) {
  const suppliedSeal = String(cardData.seal || cardData.bc_seal || cardData.bcSeal || '').trim();
  const normSupplied = normalizeHexDigest(suppliedSeal);
  if (!normSupplied) {
    return { verified: false, reason: 'MISSING_OR_MALFORMED_SEAL', matchedScheme: null };
  }
  const id = sanitizeCardField(cardData.id || cardData.cardID || cardData.card_id || cardData.device_id || '');
  const name = sanitizeCardField(cardData.name || cardData.user_name || cardData.fullName || cardData.victim_name || '');
  const phone = sanitizeCardField(cardData.phone || cardData.user_phone || '');
  const cccd = sanitizeCardField(cardData.cccd || cardData.user_cccd || '');
  const rawOfficer = sanitizeCardField(cardData.officer || cardData.card_officer || '');
  const timestamp = sanitizeCardField(cardData.timestamp || cardData.time || cardData.card_time || cardData.created_at || '');
  const blockIndex = Math.max(1, parseInt(cardData.blockIndex ?? cardData.block ?? cardData.card_block ?? 1, 10) || 1);
  const rawMode = String(cardData.mode || cardData.card_mode || '').trim().toUpperCase();
  const rawPrev = String(cardData.prevSeal || cardData.prev_seal || '').trim();
  const normPrevHex = normalizeHexDigest(rawPrev);

  const prevCandidates = Array.from(new Set([
    rawPrev,
    ZERO_PREV_SEAL,
    '0'.repeat(64),
    normPrevHex ? ('0x' + normPrevHex.toLowerCase()) : '',
    normPrevHex ? normPrevHex.toUpperCase() : '',
    normPrevHex ? normPrevHex.toLowerCase() : '',
    normPrevHex ? ('0x' + normPrevHex.toUpperCase()) : ''
  ].filter(Boolean)));
  const officerCandidates = Array.from(new Set([rawOfficer, rawOfficer || 'BTL CSCD - E10 D1']));
  const modeCandidates = Array.from(new Set([rawMode, 'REAL', 'TEST', 'LEGACY'].filter(Boolean)));
  const keys = getAcceptedSecretKeys();

  for (const key of keys) {
    for (const m of modeCandidates) {
      for (const off of officerCandidates) {
        for (const prev of prevCandidates) {
          const candidateHex = computeChainedCardSeal(
            { prevSeal: prev, blockIndex, mode: m, id, name, phone, cccd, officer: off, timestamp },
            key,
            { uppercaseNoPrefix: true }
          );
          if (timingSafeHexEqual(suppliedSeal, candidateHex)) {
            const keyLabel = key === DAC_TA_SECRET_KEY ? 'DAC_TA_E10' : 'CPP_CMD_E10';
            return {
              verified: true,
              matchedScheme: `CHAINED_BLOCK_V2_${m}_${keyLabel}`,
              mode: m,
              blockIndex,
              prevSeal: prev,
              canonicalSealUpper: candidateHex,
              canonicalSealPrefixed: '0x' + candidateHex.toLowerCase()
            };
          }
        }
      }
    }
  }
  return { verified: false, reason: 'SIGNATURE_MISMATCH', matchedScheme: null };
}

/**
 * Computes C++ CapPhatTheSOS.exe and ESP32-C3 hardware seals for testing & verification
 */
export function computeCppHardwareSeal({ cardID, userName, userPhone, userCCCD }, secretKey = COMMAND_SECRET_KEY) {
  const preimage = `${String(cardID ?? '').trim()}|${String(userName ?? '').trim()}|${String(userPhone ?? '').trim()}|${String(userCCCD ?? '').trim()}|${secretKey}`;
  return sha256Prefixed(Buffer.from(preimage, 'utf8'));
}

export function computeEsp32HardwareSeal({ cardID, userName, userPhone, userCCCD, hwMacID }, secretKey = COMMAND_SECRET_KEY) {
  const preimage = `${String(cardID ?? '').trim()}|${String(userName ?? '').trim()}|${String(userPhone ?? '').trim()}|${String(userCCCD ?? '').trim()}|${String(hwMacID ?? '').trim()}|${secretKey}`;
  return sha256Prefixed(Buffer.from(preimage, 'utf8'));
}

export function computeHardwareLiveEvidenceHash({ cardID, hwMacID, unitCode, currentLat, currentLon, bcSeal }) {
  const preimage = `${String(cardID ?? '').trim()}|${String(hwMacID ?? '').trim()}|${String(unitCode ?? '').trim()}|${currentLat},${currentLon}|${String(bcSeal ?? '').trim()}`;
  return sha256Prefixed(Buffer.from(preimage, 'utf8'));
}

function buildCoordVariants(rawVal, rawJsonCoordText = '') {
  const set = new Set();
  for (const candidate of [rawJsonCoordText, rawVal]) {
    if (candidate === undefined || candidate === null || String(candidate).trim() === '') continue;
    const text = String(candidate).trim();
    set.add(text);
    const num = Number(candidate);
    if (Number.isFinite(num)) {
      set.add(String(num));
      for (const digits of [6, 5, 7, 4, 2]) {
        set.add(num.toFixed(digits));
      }
    }
  }
  return Array.from(set);
}

function extractRawJsonCoordTokens(rawBody = '') {
  if (typeof rawBody !== 'string' || !rawBody) return { rawLat: '', rawLng: '' };
  const latMatch = rawBody.match(/"(?:lat|latitude)"\s*:\s*([-+]?\d+(?:\.\d+)?)/i);
  const lngMatch = rawBody.match(/"(?:lng|lon|longitude)"\s*:\s*([-+]?\d+(?:\.\d+)?)/i);
  return {
    rawLat: latMatch ? latMatch[1] : '',
    rawLng: lngMatch ? lngMatch[1] : ''
  };
}

/**
 * Verifies hardware payload against BOTH Spec documents:
 * - DAC_TA_DONG_BO_WEB_VA_AI.md Chained v2: SHA256(prevSeal|blockIndex|mode|id|name|phone|cccd|officer|timestamp|SecretKey)
 * - Registered Card Registry sync (cards provisioned via CapPhatTheSOS.exe or Web Serial Portal)
 * - C++ App v1 bc_seal: SHA256(cardID|userName|userPhone|userCCCD|SECRET_KEY)
 * - ESP32-C3 v1 bc_seal: SHA256(cardID|userName|userPhone|userCCCD|hwMacID|SECRET_KEY)
 * - live_evidence_hash: SHA256(cardID|hwMacID|unitCode|currentLat,currentLon|bc_seal)
 */
export function verifyHardwareDePINPayload(data = {}, rawJsonBody = '') {
  const cardID = sanitizeCardField(data.cardID || data.card_id || data.id || data.device_id || data.deviceId || '');
  const userName = sanitizeCardField(data.user_name || data.name || data.fullName || data.victim_name || data.citizen_name || data.reporterName || '');
  const userPhone = sanitizeCardField(data.user_phone || data.phone || data.reporterPhone || '');
  const userCCCD = sanitizeCardField(data.user_cccd || data.cccd || '');
  const cardOfficer = sanitizeCardField(data.officer || data.card_officer || '');
  const cardTimestamp = sanitizeCardField(data.card_time || data.timestamp || data.time || data.created_at || '');
  const cardMode = String(data.card_mode || data.mode || '').trim().toUpperCase() || null;
  const cardBlockIndex = parseInt(data.card_block ?? data.blockIndex ?? data.block ?? 0, 10) || null;
  const cardPrevSeal = String(data.prev_seal || data.prevSeal || '').trim() || null;

  const rawHwMac = String(data.hw_mac || data.hwMac || data.mac || '').trim();
  const cleanHwMacUpper = rawHwMac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  const cleanHwMacLower = cleanHwMacUpper.toLowerCase();
  const displayHwMac = cleanHwMacUpper || rawHwMac || 'UNSPECIFIED-MCU';

  const suppliedBcSeal = String(data.bc_seal || data.bcSeal || data.seal || '').trim();
  const suppliedLiveHash = String(data.live_evidence_hash || data.liveEvidenceHash || '').trim();
  const reportedChainId = Number(data.chain_id || data.chainId || 0) || null;

  // Legacy IoT button compatibility (no bc_seal field sent yet)
  if (!suppliedBcSeal) {
    const syntheticHash = sha256Prefixed(
      Buffer.from(`${cardID || 'LEGACY_IOT'}|${displayHwMac}|${data.lat ?? data.latitude ?? ''},${data.lng ?? data.lon ?? data.longitude ?? ''}`, 'utf8')
    );
    return {
      hasSeal: false,
      verified: false,
      status: 'UNSEALED_LEGACY_IOT',
      sealScheme: 'NONE',
      badgeText: 'ℹ THIẾT BỊ IOT ĐỜI CŨ (CHƯA CẤP CHỮ KÝ DePIN)',
      cardID: cardID || null,
      hwMac: displayHwMac,
      userCCCD: userCCCD || null,
      cardMode,
      cardBlockIndex,
      cardOfficer: cardOfficer || null,
      bcSeal: null,
      liveEvidenceHash: suppliedLiveHash || syntheticHash,
      liveHashVerified: null,
      reportedChainId
    };
  }

  const normalizedSeal = normalizeHexDigest(suppliedBcSeal);
  if (!normalizedSeal) {
    return {
      hasSeal: true,
      verified: false,
      status: 'SPOOF_SUSPECTED',
      sealScheme: 'MALFORMED_HEX',
      badgeText: '⚠ CẢNH BÁO GIẢ MẠO CHỮ KÝ PHẦN CỨNG (INVALID SEAL)',
      cardID: cardID || null,
      hwMac: displayHwMac,
      userCCCD: userCCCD || null,
      cardMode,
      cardBlockIndex,
      cardOfficer: cardOfficer || null,
      bcSeal: suppliedBcSeal,
      liveEvidenceHash: suppliedLiveHash || null,
      liveHashVerified: false,
      reportedChainId
    };
  }

  let matchedScheme = null;
  let resolvedMode = cardMode;
  let resolvedBlockIdx = cardBlockIndex;
  let resolvedOfficer = cardOfficer || null;

  // 1. Check Chained Identity Block v2 (DAC_TA_DONG_BO_WEB_VA_AI.md & CapPhatTheSOS.cpp)
  if (cardOfficer || cardTimestamp || cardPrevSeal || cardMode || cardBlockIndex) {
    const chainedRes = verifyChainedCardSeal({
      prevSeal: cardPrevSeal || ZERO_PREV_SEAL,
      blockIndex: cardBlockIndex || 1,
      mode: cardMode || 'REAL',
      id: cardID,
      name: userName,
      phone: userPhone,
      cccd: userCCCD,
      officer: cardOfficer,
      timestamp: cardTimestamp,
      seal: suppliedBcSeal
    });
    if (chainedRes.verified) {
      matchedScheme = chainedRes.matchedScheme;
      resolvedMode = chainedRes.mode;
      resolvedBlockIdx = chainedRes.blockIndex;
    }
  }

  // 2. Check C++ Legacy 4-arg overload in CapPhatTheSOS.cpp line 278:
  // GenerateBlockchainSeal("0x000...00", 1, "LEGACY", id, name, phone, cccd, "OFFICER", "2026-01-01 00:00:00")
  if (!matchedScheme) {
    for (const secretKey of getAcceptedSecretKeys()) {
      const cppLegacyChained = computeChainedCardSeal(
        {
          prevSeal: ZERO_PREV_SEAL,
          blockIndex: 1,
          mode: 'LEGACY',
          id: cardID,
          name: userName,
          phone: userPhone,
          cccd: userCCCD,
          officer: 'OFFICER',
          timestamp: '2026-01-01 00:00:00'
        },
        secretKey,
        { uppercaseNoPrefix: false }
      );
      if (timingSafeHexEqual(suppliedBcSeal, cppLegacyChained)) {
        matchedScheme = 'CPP_LEGACY_CHAINED';
        resolvedMode = 'LEGACY';
        resolvedBlockIdx = 1;
        break;
      }
    }
  }

  // 3. Check C++ v1 & ESP32-C3 v1 formulas across all accepted secret keys
  if (!matchedScheme) {
    const macVariants = Array.from(new Set([rawHwMac, cleanHwMacUpper, cleanHwMacLower].filter(Boolean)));
    outerKey:
    for (const secretKey of getAcceptedSecretKeys()) {
      const cppSeal = computeCppHardwareSeal({ cardID, userName, userPhone, userCCCD }, secretKey);
      if (timingSafeHexEqual(suppliedBcSeal, cppSeal)) {
        matchedScheme = 'CPP_CAP_PHAT_THE';
        break outerKey;
      }
      for (const macVar of macVariants) {
        const espSeal = computeEsp32HardwareSeal({ cardID, userName, userPhone, userCCCD, hwMacID: macVar }, secretKey);
        if (timingSafeHexEqual(suppliedBcSeal, espSeal)) {
          matchedScheme = 'ESP32_C3_CHIP';
          break outerKey;
        }
      }
    }
  }

  // 4. Check Registered DePIN Card Registry (cards provisioned via Web Serial Portal or synced from CapPhatTheSOS.exe)
  if (!matchedScheme && typeof blockchainLedgerService !== 'undefined' && blockchainLedgerService) {
    const regMatch = blockchainLedgerService.findRegisteredCardBySeal(cardID, suppliedBcSeal);
    if (regMatch) {
      matchedScheme = `DEPIN_CARD_REGISTRY_${regMatch.matchedBlock.mode || 'REAL'}`;
      resolvedMode = regMatch.matchedBlock.mode || resolvedMode;
      resolvedBlockIdx = regMatch.matchedBlock.blockIndex || resolvedBlockIdx;
      resolvedOfficer = regMatch.matchedBlock.officer || resolvedOfficer;
    }
  }

  if (!matchedScheme) {
    return {
      hasSeal: true,
      verified: false,
      status: 'SPOOF_SUSPECTED',
      sealScheme: 'SIGNATURE_MISMATCH',
      badgeText: '⚠ CẢNH BÁO GIẢ MẠO CHỮ KÝ PHẦN CỨNG (SPOOF SUSPECTED)',
      cardID: cardID || null,
      hwMac: displayHwMac,
      userCCCD: userCCCD || null,
      cardMode: resolvedMode,
      cardBlockIndex: resolvedBlockIdx,
      cardOfficer: resolvedOfficer,
      bcSeal: '0x' + normalizedSeal,
      liveEvidenceHash: suppliedLiveHash ? ('0x' + (normalizeHexDigest(suppliedLiveHash) || suppliedLiveHash.replace(/^0x/i, ''))) : null,
      liveHashVerified: false,
      reportedChainId
    };
  }

  // 5. Verify live_evidence_hash if provided by ESP32-C3 firmware
  let liveHashVerified = null;
  let canonicalLiveHash = suppliedLiveHash;
  if (suppliedLiveHash) {
    liveHashVerified = false;
    const { rawLat, rawLng } = extractRawJsonCoordTokens(rawJsonBody);
    const latVariants = buildCoordVariants(data.lat ?? data.latitude, rawLat);
    const lngVariants = buildCoordVariants(data.lng ?? data.lon ?? data.longitude, rawLng);
    const unitVariants = Array.from(new Set([
      data.target_unit,
      data.type,
      data.incident_type,
      data.unit_title,
      'CONG_AN_DIA_PHUONG'
    ].map(v => String(v || '').trim()).filter(Boolean)));
    const macVariants = Array.from(new Set([rawHwMac, cleanHwMacUpper, cleanHwMacLower].filter(Boolean)));
    const sealVariants = Array.from(new Set([
      suppliedBcSeal,
      '0x' + normalizedSeal,
      normalizedSeal,
      normalizedSeal.toUpperCase(),
      '0x' + normalizedSeal.toUpperCase()
    ]));

    outer:
    for (const macVar of macVariants) {
      for (const unitCode of unitVariants) {
        for (const latStr of latVariants) {
          for (const lngStr of lngVariants) {
            for (const sealStr of sealVariants) {
              const candidate = computeHardwareLiveEvidenceHash({
                cardID,
                hwMacID: macVar,
                unitCode,
                currentLat: latStr,
                currentLon: lngStr,
                bcSeal: sealStr
              });
              if (timingSafeHexEqual(suppliedLiveHash, candidate)) {
                liveHashVerified = true;
                canonicalLiveHash = '0x' + normalizeHexDigest(suppliedLiveHash);
                break outer;
              }
            }
          }
        }
      }
    }
  } else {
    canonicalLiveHash = computeHardwareLiveEvidenceHash({
      cardID,
      hwMacID: displayHwMac,
      unitCode: String(data.target_unit || data.type || 'CONG_AN_DIA_PHUONG'),
      currentLat: Number(data.lat ?? data.latitude ?? 10.0452).toFixed(6),
      currentLon: Number(data.lng ?? data.lon ?? data.longitude ?? 105.7469).toFixed(6),
      bcSeal: '0x' + normalizedSeal
    });
  }

  const modeBadgeSuffix = resolvedMode === 'TEST'
    ? ` [THẺ TEST · BLOCK #${resolvedBlockIdx || 1}]`
    : (resolvedMode === 'REAL' ? ` [THẺ THẬT · BLOCK #${resolvedBlockIdx || 1}]` : '');

  return {
    hasSeal: true,
    verified: true,
    status: 'DEPIN_VERIFIED',
    sealScheme: matchedScheme,
    badgeText: `✔ ĐÃ XÁC THỰC TRÊN SỔ CÁI (DePIN VERIFIED)${modeBadgeSuffix}`,
    cardID: cardID || null,
    hwMac: displayHwMac,
    userCCCD: userCCCD || null,
    cardMode: resolvedMode,
    cardBlockIndex: resolvedBlockIdx,
    cardOfficer: resolvedOfficer,
    bcSeal: '0x' + normalizedSeal,
    sealUppercase: normalizedSeal.toUpperCase(),
    liveEvidenceHash: canonicalLiveHash,
    liveHashVerified,
    reportedChainId
  };
}

export class BlockchainLedgerService {
  constructor() {
    this.state = null;
    this.cardRegistry = null;
    this.loadLedger();
    this.loadCardRegistry();
  }

  loadCardRegistry() {
    const fallback = { schemaVersion: '2.0', cards: {} };
    const loaded = readRuntimeData(CARD_REGISTRY_STORE_NAME, fallback);
    if (!loaded || typeof loaded !== 'object' || typeof loaded.cards !== 'object' || Array.isArray(loaded.cards)) {
      this.cardRegistry = { ...fallback, cards: {} };
      return;
    }
    this.cardRegistry = {
      schemaVersion: '2.0',
      cards: loaded.cards
    };
  }

  persistCardRegistry() {
    if (!this.cardRegistry) this.loadCardRegistry();
    writeRuntimeData(CARD_REGISTRY_STORE_NAME, this.cardRegistry);
  }

  loadLedger() {
    const fallback = {
      schemaVersion: '2.0',
      genesisHash: GENESIS_HASH,
      nextBlockNumber: 101,
      lastBlockHash: GENESIS_HASH,
      blocks: []
    };
    const loaded = readRuntimeData(LEDGER_STORE_NAME, fallback);
    if (!loaded || typeof loaded !== 'object' || !Array.isArray(loaded.blocks)) {
      this.state = { ...fallback };
      return;
    }
    const maxBlock = loaded.blocks.reduce((acc, b) => Math.max(acc, Number(b?.blockNumber) || 100), 100);
    this.state = {
      schemaVersion: '2.0',
      genesisHash: loaded.genesisHash || GENESIS_HASH,
      nextBlockNumber: Math.max(Number(loaded.nextBlockNumber) || 101, maxBlock + 1),
      lastBlockHash: loaded.lastBlockHash || (loaded.blocks.length ? loaded.blocks[loaded.blocks.length - 1].txHash : GENESIS_HASH),
      blocks: loaded.blocks
    };
  }

  persistLedger() {
    if (!this.state) this.loadLedger();
    if (this.state.blocks.length > MAX_PERSISTED_BLOCKS) {
      this.state.blocks = this.state.blocks.slice(-MAX_PERSISTED_BLOCKS);
    }
    writeRuntimeData(LEDGER_STORE_NAME, this.state);
  }

  computeDeterministicTxHash(record, blockNumber, prevHash) {
    const recordString = JSON.stringify(record);
    return sha256Prefixed(Buffer.from(`${recordString}|${blockNumber}|${prevHash}`, 'utf8'));
  }

  async relayJsonRpcCall(rpcUrl, method, params = [], timeoutMs = 3500) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(rpcUrl);
        const transport = parsed.protocol === 'https:' ? https : http;
        const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
        const req = transport.request(
          {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            },
            timeout: timeoutMs
          },
          (res) => {
            let raw = '';
            res.on('data', (chunk) => {
              if (raw.length < 32768) raw += chunk;
            });
            res.on('end', () => {
              try {
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, body: JSON.parse(raw || '{}') });
              } catch (_) {
                resolve({ ok: false, error: 'INVALID_RPC_JSON' });
              }
            });
          }
        );
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false, error: 'RPC_TIMEOUT' });
        });
        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.write(body);
        req.end();
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    });
  }

  postOpenTimestampsDigest(calendarEndpoint, digestBuf, timeoutMs = 6000) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(calendarEndpoint);
        const transport = parsed.protocol === 'https:' ? https : http;
        const req = transport.request(
          {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: {
              Accept: 'application/vnd.opentimestamps.v1',
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': digestBuf.length,
              'User-Agent': 'SOSVietnam-ZeroPII-Anchor/2.0'
            },
            timeout: timeoutMs
          },
          (res) => {
            const chunks = [];
            let total = 0;
            res.on('data', (chunk) => {
              if (total < 16384) {
                chunks.push(chunk);
                total += chunk.length;
              }
            });
            res.on('end', () => {
              const body = Buffer.concat(chunks);
              if (res.statusCode >= 200 && res.statusCode < 300 && body.length > 0) {
                resolve({ ok: true, statusCode: res.statusCode, body, calendarEndpoint });
              } else {
                resolve({
                  ok: false,
                  statusCode: res.statusCode || 0,
                  error: `CALENDAR_HTTP_${res.statusCode || 0}`
                });
              }
            });
          }
        );
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false, error: 'CALENDAR_TIMEOUT' });
        });
        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.end(digestBuf);
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    });
  }

  async anchorBlockToOpenTimestamps(blockOrRef, { forceRestamp = false, timeoutMs = 6000 } = {}) {
    if (!this.state) this.loadLedger();
    const block = (blockOrRef && typeof blockOrRef === 'object' && blockOrRef.blockNumber !== undefined)
      ? this.findBlockByTxOrNumber(blockOrRef.blockNumber) || blockOrRef
      : this.findBlockByTxOrNumber(blockOrRef);
    if (!block) {
      return { ok: false, error: 'BLOCK_NOT_FOUND' };
    }
    if (!block.externalAnchors || typeof block.externalAnchors !== 'object') {
      block.externalAnchors = {};
    }

    const anchorPkg = buildZeroPiiPublicAnchorDocument(block);
    const existing = block.externalAnchors.OTS;
    if (
      !forceRestamp
      && existing
      && existing.otsBase64
      && existing.anchorDigestHex === anchorPkg.anchorDigestHex
    ) {
      const otsBuffer = Buffer.from(existing.otsBase64, 'base64');
      const parsed = inspectOtsProofBuffer(otsBuffer, anchorPkg.anchorDigestBuf);
      if (parsed.valid) {
        return {
          ok: true,
          cached: true,
          blockNumber: block.blockNumber,
          anchorPkg,
          otsBuffer,
          otsInspection: parsed,
          otsRecord: existing
        };
      }
    }

    let lastError = 'ALL_CALENDARS_UNREACHABLE';
    for (const calendarUrl of OTS_CALENDAR_ENDPOINTS) {
      const resp = await this.postOpenTimestampsDigest(calendarUrl, anchorPkg.anchorDigestBuf, timeoutMs);
      if (!resp.ok || !resp.body) {
        lastError = resp.error || 'CALENDAR_FAILED';
        continue;
      }
      const otsBuffer = Buffer.concat([
        OTS_HEADER_MAGIC,
        Buffer.from([0x01, 0x08]),
        anchorPkg.anchorDigestBuf,
        resp.body
      ]);
      const inspection = inspectOtsProofBuffer(otsBuffer, anchorPkg.anchorDigestBuf);
      if (!inspection.valid) {
        lastError = inspection.error || 'INVALID_CALENDAR_OTS';
        continue;
      }
      const primaryAtt = inspection.attestations[0] || {};
      const otsRecord = {
        protocol: 'OpenTimestamps-v1',
        status: primaryAtt.type === 'BitcoinBlockHeaderAttestation' ? 'CONFIRMED_BTC_BLOCK' : 'STAMPED_PENDING_BTC',
        stampedAt: new Date().toISOString(),
        calendarEndpoint: calendarUrl,
        calendarServerUri: primaryAtt.calendarUri || calendarUrl,
        commitmentTipHex: primaryAtt.commitmentTipHex || null,
        bitcoinBlockHeight: primaryAtt.bitcoinBlockHeight || null,
        anchorDigestHex: anchorPkg.anchorDigestHex,
        otsFileName: anchorPkg.otsFileName,
        anchorFileName: anchorPkg.fileName,
        otsByteLength: otsBuffer.length,
        otsBase64: otsBuffer.toString('base64')
      };
      block.externalAnchors.OTS = otsRecord;
      this.persistLedger();
      return {
        ok: true,
        cached: false,
        blockNumber: block.blockNumber,
        anchorPkg,
        otsBuffer,
        otsInspection: inspection,
        otsRecord
      };
    }

    return {
      ok: false,
      blockNumber: block.blockNumber,
      anchorPkg,
      error: lastError
    };
  }

  buildExternalAnchorSummary(block) {
    if (!block || typeof block !== 'object') return null;
    const anchorPkg = buildZeroPiiPublicAnchorDocument(block);
    const ots = block.externalAnchors?.OTS || null;
    const nda = block.externalAnchors?.NDA || null;
    const polygon = block.externalAnchors?.POLYGON || null;
    return {
      protocol: anchorPkg.document.protocol,
      blockNumber: anchorPkg.document.blockNumber,
      actionCode: anchorPkg.document.actionCode,
      sealedAt: anchorPkg.document.sealedAt,
      caseCommitmentHash: anchorPkg.document.caseCommitmentHash,
      txHash: anchorPkg.document.txHash,
      prevHash: anchorPkg.document.prevHash,
      payloadDigest: anchorPkg.document.payloadDigest,
      anchorDigestHex: anchorPkg.anchorDigestHex,
      anchorFileName: anchorPkg.fileName,
      otsFileName: anchorPkg.otsFileName,
      publicAnchorDocument: anchorPkg.document,
      evmCalldataUtf8: anchorPkg.evmCalldataUtf8,
      evmCalldataHex: anchorPkg.evmCalldataHex,
      ots: ots
        ? {
            stamped: true,
            status: ots.status,
            stampedAt: ots.stampedAt,
            calendarServerUri: ots.calendarServerUri,
            commitmentTipHex: ots.commitmentTipHex,
            bitcoinBlockHeight: ots.bitcoinBlockHeight || null,
            otsByteLength: ots.otsByteLength,
            verificationSiteUrl: 'https://opentimestamps.org'
          }
        : {
            stamped: false,
            status: 'READY_FOR_INSTANT_STAMP',
            verificationSiteUrl: 'https://opentimestamps.org'
          },
      nda: nda
        ? { anchored: true, ...nda }
        : {
            anchored: false,
            status: process.env.NDA_CHAIN_RPC_URL ? 'RPC_READY' : 'ZERO_PII_COMMITMENT_READY'
          },
      polygon: polygon
        ? { anchored: true, ...polygon }
        : {
            anchored: false,
            status: process.env.POLYGON_AMOY_RPC_URL ? 'RPC_READY' : 'ZERO_PII_CALLDATA_READY',
            explorerSiteUrl: 'https://amoy.polygonscan.com'
          }
    };
  }

  sealBlockSync(actionType, caseId, payloadData = {}, options = {}) {
    if (!this.state) this.loadLedger();
    const sysCfg = resolveSystemBlockchainConfig(options.host || options.origin || '');
    const timestamp = options.timestamp || new Date().toISOString();
    const blockNumber = this.state.nextBlockNumber++;
    const prevHash = this.state.lastBlockHash || this.state.genesisHash;

    const record = {
      version: '2.0',
      chainId: sysCfg.chainId,
      canonicalChainId: 842026,
      envName: sysCfg.envName,
      action: actionType,
      caseId: String(caseId || ''),
      timestamp,
      data: payloadData
    };

    const payloadDigest = sha256Prefixed(Buffer.from(JSON.stringify(payloadData || {}), 'utf8'));
    const txHash = this.computeDeterministicTxHash(record, blockNumber, prevHash);

    const blockEntry = {
      blockNumber,
      txHash,
      prevHash,
      payloadDigest,
      chainId: sysCfg.chainId,
      canonicalChainId: 842026,
      envName: sysCfg.envName,
      action: actionType,
      caseId: String(caseId || ''),
      timestamp,
      evidenceHash: payloadData?.sha256Hash || payloadData?.liveEvidenceHash || payloadData?.bcSeal || payloadDigest,
      payload: record,
      externalAnchors: {}
    };

    this.state.lastBlockHash = txHash;
    this.state.blocks.push(blockEntry);
    this.persistLedger();

    return {
      blockEntry,
      receipt: {
        blockNumber,
        txHash,
        prevHash,
        payloadDigest,
        evidenceHash: blockEntry.evidenceHash,
        chainId: sysCfg.chainId,
        envName: sysCfg.envName,
        timestamp,
        payload: record
      }
    };
  }

  /**
   * Standard Dynamic JSON Envelope sealing function (Spec Section 3.1.2)
   * Supports all 4 Case Lifecycle actions:
   * - 1_SOS_TRIGGER
   * - 2_EVIDENCE_SEAL
   * - 3_OFFICER_DISPATCH
   * - 4_CASE_RESOLVED
   */
  async writeToSOSBlockchain(actionType, caseId, payloadData = {}, options = {}) {
    const { blockEntry, receipt } = this.sealBlockSync(actionType, caseId, payloadData, options);

    // Non-blocking external RPC probe if NDA_CHAIN_RPC_URL or POLYGON_AMOY_RPC_URL is configured
    const rpcTargets = [
      { key: 'NDA', url: process.env.NDA_CHAIN_RPC_URL },
      { key: 'POLYGON', url: process.env.POLYGON_AMOY_RPC_URL }
    ].filter((t) => Boolean(t.url));

    if (rpcTargets.length > 0 && options.awaitExternalRelay === true) {
      for (const target of rpcTargets) {
        const probe = await this.relayJsonRpcCall(target.url, 'eth_blockNumber', []);
        if (probe.ok && probe.body?.result) {
          blockEntry.externalAnchors[target.key] = {
            anchoredAt: new Date().toISOString(),
            remoteHeadBlockHex: probe.body.result
          };
        }
      }
      this.persistLedger();
    }

    return receipt;
  }

  getCaseBlocks(caseId) {
    if (!this.state) this.loadLedger();
    const target = String(caseId || '').trim();
    if (!target) return [];
    return this.state.blocks.filter((b) => b.caseId === target);
  }

  findBlockByTxOrNumber(ref) {
    if (!this.state) this.loadLedger();
    const raw = String(ref || '').trim();
    if (!raw) return null;
    if (/^#?\d+$/.test(raw)) {
      const num = Number(raw.replace(/^#/, ''));
      return this.state.blocks.find((b) => b.blockNumber === num) || null;
    }
    const clean = ('0x' + raw.replace(/^0x/i, '')).toLowerCase();
    return this.state.blocks.find((b) => {
      if (String(b.txHash || '').toLowerCase() === clean) return true;
      if (String(b.payloadDigest || '').toLowerCase() === clean) return true;
      if (String(b.externalAnchors?.OTS?.anchorDigestHex || '').toLowerCase() === clean) return true;
      if (computeCaseCommitmentHash(b.caseId).toLowerCase() === clean) return true;
      return false;
    }) || null;
  }

  /**
   * Recomputes every block's txHash and prevHash link to prove zero ledger tampering
   */
  verifyCaseChainIntegrity(caseId) {
    if (!this.state) this.loadLedger();
    const caseBlocks = this.getCaseBlocks(caseId);
    if (caseBlocks.length === 0) {
      return {
        ok: false,
        blockCount: 0,
        allBlocksIntact: false,
        reason: 'NO_BLOCKS_FOR_CASE'
      };
    }

    const details = [];
    let allIntact = true;
    for (const block of caseBlocks) {
      const idx = this.state.blocks.findIndex((b) => b.blockNumber === block.blockNumber);
      const expectedPrev = idx > 0
        ? this.state.blocks[idx - 1].txHash
        : (idx === 0 && block.blockNumber === 101 ? this.state.genesisHash : block.prevHash);
      const recomputedTxHash = this.computeDeterministicTxHash(block.payload, block.blockNumber, block.prevHash);
      const prevMatched = block.prevHash === expectedPrev;
      const hashMatched = timingSafeHexEqual(block.txHash, recomputedTxHash);
      if (!prevMatched || !hashMatched) allIntact = false;
      details.push({
        blockNumber: block.blockNumber,
        action: block.action,
        timestamp: block.timestamp,
        txHash: block.txHash,
        recomputedTxHash,
        prevHash: block.prevHash,
        prevMatched,
        hashMatched
      });
    }

    return {
      ok: allIntact,
      blockCount: caseBlocks.length,
      allBlocksIntact: allIntact,
      firstBlock: caseBlocks[0],
      latestBlock: caseBlocks[caseBlocks.length - 1],
      blocks: details
    };
  }

  getLedgerStats(host = '') {
    if (!this.state) this.loadLedger();
    if (!this.cardRegistry) this.loadCardRegistry();
    const sysCfg = resolveSystemBlockchainConfig(host);
    const cardsList = Object.values(this.cardRegistry.cards || {});
    const otsStampedBlocksCount = this.state.blocks.filter((b) => Boolean(b?.externalAnchors?.OTS?.otsBase64)).length;
    return {
      ok: true,
      schemaVersion: this.state.schemaVersion,
      envName: sysCfg.envName,
      chainId: sysCfg.chainId,
      canonicalChainId: 842026,
      storageFolder: sysCfg.storageFolder,
      ledgerStorageMode: RUNTIME_STORAGE_MODE,
      genesisHash: this.state.genesisHash,
      nextBlockNumber: this.state.nextBlockNumber,
      lastBlockHash: this.state.lastBlockHash,
      totalBlocks: this.state.blocks.length,
      otsStampedBlocksCount,
      registeredCardsCount: cardsList.length,
      realCardsCount: cardsList.filter((c) => c.isImmutableReal).length,
      testCardsCount: cardsList.filter((c) => !c.isImmutableReal).length,
      networks: sysCfg.networks,
      supportedNetworks: sysCfg.supportedNetworks
    };
  }

  getRegisteredCard(cardID) {
    if (!this.cardRegistry) this.loadCardRegistry();
    const key = String(cardID || '').trim();
    if (!key) return null;
    return this.cardRegistry.cards[key] || null;
  }

  listRegisteredCards() {
    if (!this.cardRegistry) this.loadCardRegistry();
    return Object.values(this.cardRegistry.cards || {}).sort((a, b) =>
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
    );
  }

  findRegisteredCardBySeal(cardID, suppliedSeal) {
    if (!this.cardRegistry) this.loadCardRegistry();
    const normTarget = normalizeHexDigest(suppliedSeal);
    if (!normTarget) return null;
    const candidates = cardID && this.cardRegistry.cards[cardID]
      ? [this.cardRegistry.cards[cardID]]
      : Object.values(this.cardRegistry.cards || {});
    for (const card of candidates) {
      for (const blk of card.blocks || []) {
        if (timingSafeHexEqual(blk.seal, suppliedSeal)) {
          return { card, matchedBlock: blk };
        }
      }
    }
    return null;
  }

  /**
   * Provisions Genesis Block #1 or appends Chained Update Block #N per DAC_TA_DONG_BO_WEB_VA_AI.md
   */
  registerOrUpdateCardBlock(input = {}, options = {}) {
    if (!this.cardRegistry) this.loadCardRegistry();
    const id = sanitizeCardField(input.id || input.cardID || '');
    const name = sanitizeCardField(input.name || input.user_name || '');
    const phone = sanitizeCardField(input.phone || input.user_phone || '');
    const cccd = sanitizeCardField(input.cccd || input.user_cccd || '');
    const officer = sanitizeCardField(input.officer || input.card_officer || '') || 'BTL CSCD - E10 D1';
    const requestedMode = String(input.mode || input.card_mode || 'TEST').trim().toUpperCase() === 'REAL' ? 'REAL' : 'TEST';
    const timestamp = sanitizeCardField(input.timestamp || input.time || input.created_at || '') ||
      new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (!id || !name) {
      return { ok: false, statusCode: 400, error: 'Mã Thẻ SOS (ID) và Họ Tên không được để trống!' };
    }

    const existing = this.cardRegistry.cards[id] || null;
    let targetBlockIndex = 1;
    let targetPrevSeal = ZERO_PREV_SEAL;
    let effectiveMode = requestedMode;

    if (existing && Array.isArray(existing.blocks) && existing.blocks.length > 0) {
      const lastBlk = existing.blocks[existing.blocks.length - 1];
      const inheritedPrev = lastBlk.sealPrefixed || ('0x' + String(lastBlk.seal || '').replace(/^0x/i, '').toLowerCase());
      if (existing.isImmutableReal) {
        // Real card: CANNOT reset to Genesis Block #1; MUST chain Block #N+1
        effectiveMode = 'REAL';
        targetBlockIndex = lastBlk.blockIndex + 1;
        targetPrevSeal = inheritedPrev;
      } else if (input.appendChain !== false && requestedMode === existing.mode) {
        targetBlockIndex = lastBlk.blockIndex + 1;
        targetPrevSeal = inheritedPrev;
      } else if (requestedMode === 'REAL') {
        effectiveMode = 'REAL';
        targetBlockIndex = 1;
        targetPrevSeal = ZERO_PREV_SEAL;
      }
    }

    // If caller supplied an explicit seal from CapPhatTheSOS.exe / ESP32 READ_DATA, verify it; otherwise generate per DAC_TA v2.1 Section 5.2
    let finalSealUpper = '';
    let sealScheme = `CHAINED_BLOCK_V2_${effectiveMode}_CPP_CMD_E10`;
    if (input.seal || input.bc_seal) {
      const check = verifyChainedCardSeal({
        prevSeal: input.prevSeal || input.prev_seal || targetPrevSeal,
        blockIndex: input.blockIndex || input.block || targetBlockIndex,
        mode: effectiveMode,
        id,
        name,
        phone,
        cccd,
        officer,
        timestamp,
        seal: input.seal || input.bc_seal
      });
      if (!check.verified) {
        return {
          ok: false,
          statusCode: 400,
          error: 'Chữ ký niêm phong SHA-256 (SEAL) không khớp chuẩn DAC_TA_DONG_BO_WEB_VA_AI!',
          verification: check
        };
      }
      targetBlockIndex = check.blockIndex;
      targetPrevSeal = check.prevSeal;
      effectiveMode = check.mode === 'REAL' ? 'REAL' : 'TEST';
      finalSealUpper = check.canonicalSealUpper;
      sealScheme = check.matchedScheme;
    } else {
      finalSealUpper = computeChainedCardSeal(
        {
          prevSeal: targetPrevSeal,
          blockIndex: targetBlockIndex,
          mode: effectiveMode,
          id,
          name,
          phone,
          cccd,
          officer,
          timestamp
        },
        COMMAND_SECRET_KEY,
        { uppercaseNoPrefix: true }
      );
    }

    const blockRecord = {
      blockIndex: targetBlockIndex,
      mode: effectiveMode,
      id,
      name,
      phone,
      cccd,
      officer,
      timestamp,
      prevSeal: targetPrevSeal,
      seal: finalSealUpper,
      sealPrefixed: '0x' + finalSealUpper.toLowerCase(),
      scheme: sealScheme,
      syncedAt: new Date().toISOString()
    };

    const ledgerReceipt = this.sealBlockSync(
      LIFECYCLE_ACTIONS.CARD_PROVISION_SEAL,
      id,
      {
        cardID: id,
        cardMode: effectiveMode,
        cardBlockIndex: targetBlockIndex,
        prevSeal: targetPrevSeal,
        sha256Hash: '0x' + finalSealUpper.toLowerCase(),
        sealUppercase: finalSealUpper,
        officer,
        timestamp
      },
      options
    ).receipt;

    blockRecord.ledgerBlockNumber = ledgerReceipt.blockNumber;
    blockRecord.ledgerTxHash = ledgerReceipt.txHash;

    const nextBlocks = (existing && (existing.isImmutableReal || targetBlockIndex > 1))
      ? [...existing.blocks, blockRecord]
      : [blockRecord];

    const updatedCard = {
      id,
      mode: effectiveMode,
      isImmutableReal: Boolean(existing?.isImmutableReal || effectiveMode === 'REAL'),
      wipeProtected: Boolean(existing?.isImmutableReal || effectiveMode === 'REAL'),
      currentBlockIndex: targetBlockIndex,
      currentSeal: finalSealUpper,
      prevSeal: targetPrevSeal,
      name,
      phone,
      cccd,
      officer,
      timestamp,
      latestLedgerBlock: ledgerReceipt.blockNumber,
      latestLedgerTxHash: ledgerReceipt.txHash,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: nextBlocks
    };

    this.cardRegistry.cards[id] = updatedCard;
    this.persistCardRegistry();

    return {
      ok: true,
      card: updatedCard,
      block: blockRecord,
      ledgerReceipt,
      uartCommands: [
        `SET_ID:${id}`,
        `SET_NAME:${name}`,
        `SET_PHONE:${phone}`,
        `SET_CCCD:${cccd}`,
        `SET_OFFICER:${officer}`,
        `SET_TIME:${timestamp}`,
        `SET_MODE:${effectiveMode}`,
        `SET_BLOCK:${targetBlockIndex}`,
        `SET_PREV_SEAL:${targetPrevSeal}`,
        `SET_SEAL:${finalSealUpper}`,
        'SAVE_FLASH'
      ]
    };
  }

  wipeTestCard(cardID) {
    if (!this.cardRegistry) this.loadCardRegistry();
    const id = String(cardID || '').trim();
    const existing = this.cardRegistry.cards[id];
    if (!existing) {
      return { ok: true, wiped: true, id, note: 'Card not in registry (ready for fresh test)' };
    }
    if (existing.isImmutableReal || existing.mode === 'REAL') {
      return {
        ok: false,
        statusCode: 403,
        wipeProtected: true,
        error: '🔒 BẢO VỆ DỮ LIỆU THẬT: CHỈ CẤP 1 LẦN (KHÔNG ĐƯỢC XÓA TRẮNG). Nghiêm cấm xóa trắng thẻ chính thức! Vui lòng dùng tính năng Cập nhật thông tin & nối chuỗi Blockchain (Update Block #N).'
      };
    }
    delete this.cardRegistry.cards[id];
    this.persistCardRegistry();
    return {
      ok: true,
      wiped: true,
      id,
      uartCommands: ['WIPE_CARD', 'WIPE_FLASH']
    };
  }

  sanitizeBlockForView(block, { includeRawPii = false, networkView = '842026' } = {}) {
    if (!block || typeof block !== 'object') return null;
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);
    const action = block.action || block.payload?.action || '';
    const recomputedTxHash = block.payload
      ? this.computeDeterministicTxHash(block.payload, block.blockNumber, block.prevHash)
      : '';
    const hashVerified = Boolean(recomputedTxHash && timingSafeHexEqual(block.txHash, recomputedTxHash));
    const externalAnchor = this.buildExternalAnchorSummary(block);

    if (zeroPii) {
      return {
        blockNumber: block.blockNumber,
        txHash: block.txHash,
        prevHash: block.prevHash,
        payloadDigest: block.payloadDigest,
        evidenceHash: block.payloadDigest,
        chainId: block.chainId,
        canonicalChainId: 842026,
        action,
        actionLabelVi: describeZeroPiiStageVi(action),
        timestamp: block.timestamp,
        recomputedTxHash,
        hashVerified,
        piiMasked: true,
        zeroPiiEnforced: true,
        networkView: normNet,
        caseCommitmentHash: externalAnchor.caseCommitmentHash,
        anchorDigestHex: externalAnchor.anchorDigestHex,
        publicAnchor: externalAnchor
      };
    }

    const cloned = JSON.parse(JSON.stringify(block));
    if (cloned.externalAnchors?.OTS?.otsBase64) {
      delete cloned.externalAnchors.OTS.otsBase64;
    }
    cloned.actionLabelVi = describeBlockchainActionVi(action);
    cloned.recomputedTxHash = recomputedTxHash;
    cloned.hashVerified = hashVerified;
    cloned.piiMasked = !includeRawPii;
    cloned.zeroPiiEnforced = false;
    cloned.networkView = '842026';
    cloned.caseCommitmentHash = externalAnchor.caseCommitmentHash;
    cloned.anchorDigestHex = externalAnchor.anchorDigestHex;
    cloned.publicAnchor = externalAnchor;

    if (!includeRawPii && cloned.payload && cloned.payload.data && typeof cloned.payload.data === 'object') {
      const d = cloned.payload.data;
      for (const phoneKey of ['reporterPhone', 'userPhone', 'phone']) {
        if (d[phoneKey]) d[phoneKey] = maskLedgerPii(d[phoneKey], 3, 3);
      }
      for (const idKey of ['userCCCD', 'cccd']) {
        if (d[idKey]) d[idKey] = maskLedgerPii(d[idKey], 3, 3);
      }
      if (d.clientIp) {
        d.clientIp = maskLedgerPii(d.clientIp, 3, 2);
      }
    }

    return cloned;
  }

  describeBlockStepVi(block, { includeRawPii = false, networkView = '842026' } = {}) {
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);
    const view = this.sanitizeBlockForView(block, { includeRawPii, networkView: normNet });
    if (!view) return null;
    const action = view.action || '';
    const rawInternalData = block.payload?.data || {};
    const detailsVi = [];

    const pushDetail = (label, value) => {
      if (value === null || value === undefined || value === '') return;
      detailsVi.push({ label, value: String(value) });
    };

    if (zeroPii) {
      let durationBadgeVi = '';
      if (action === LIFECYCLE_ACTIONS.CASE_ESCALATED && rawInternalData.waitBeforeEscalationSeconds !== undefined && rawInternalData.waitBeforeEscalationSeconds !== null) {
        durationBadgeVi = `Δt chuyển cấp: ${formatDurationSecondsVi(rawInternalData.waitBeforeEscalationSeconds)}`;
      } else if (action === LIFECYCLE_ACTIONS.OFFICER_DISPATCH && rawInternalData.responseTimeSeconds !== undefined && rawInternalData.responseTimeSeconds !== null) {
        durationBadgeVi = `Δt phản ứng: ${formatDurationSecondsVi(rawInternalData.responseTimeSeconds)}`;
      } else if (action === LIFECYCLE_ACTIONS.OFFICER_APPROACHING && rawInternalData.approachingTimeSeconds !== undefined && rawInternalData.approachingTimeSeconds !== null) {
        durationBadgeVi = `Δt áp sát: ${formatDurationSecondsVi(rawInternalData.approachingTimeSeconds)}`;
      } else if (action === LIFECYCLE_ACTIONS.OFFICER_ARRIVED && rawInternalData.travelTimeSeconds !== undefined && rawInternalData.travelTimeSeconds !== null) {
        durationBadgeVi = `Δt di chuyển: ${formatDurationSecondsVi(rawInternalData.travelTimeSeconds)}`;
      } else if (action === LIFECYCLE_ACTIONS.CASE_RESOLVED && rawInternalData.totalCaseDurationSeconds !== undefined && rawInternalData.totalCaseDurationSeconds !== null) {
        durationBadgeVi = `Δt toàn ca: ${formatDurationSecondsVi(rawInternalData.totalCaseDurationSeconds)}`;
      } else if (action === LIFECYCLE_ACTIONS.FAKE_ALARM_FLAGGED) {
        durationBadgeVi = 'Khóa vi phạm NĐ 144 (Zero-PII)';
      }

      const pubAnchor = view.publicAnchor;
      pushDetail('Chế độ công bố mạng ngoài', '🔒 ZERO-PII (Đã ẩn tuyệt đối Họ tên, SĐT, CCCD, GPS, Địa chỉ & Cán bộ)');
      pushDetail('Giao thức cam kết', pubAnchor.protocol);
      pushDetail('Cam kết Hồ sơ (Case Commitment)', pubAnchor.caseCommitmentHash);
      pushDetail('Mã băm Neo Quốc tế (Anchor SHA-256)', pubAnchor.anchorDigestHex);
      if (durationBadgeVi) pushDetail('Khoảng thời gian quy trình (SLA Δt)', durationBadgeVi);
      if (normNet === 'OTS') {
        pushDetail(
          'Trạng thái Lịch Bitcoin (OpenTimestamps)',
          pubAnchor.ots?.stamped
            ? `✔ Đã đóng dấu (${pubAnchor.ots.calendarServerUri || 'OpenTimestamps Pool'})`
            : '⚡ Sẵn sàng tải & đóng dấu tức thời (.OTS)'
        );
      } else if (normNet === 'POLYGON') {
        pushDetail('Gói Calldata EVM (Zero-PII Hex)', `${pubAnchor.evmCalldataHex.slice(0, 42)}... (${(pubAnchor.evmCalldataHex.length - 2) / 2} bytes)`);
      } else if (normNet === 'NDA') {
        pushDetail('Chuẩn đối chứng Quốc gia NDAChain', `Cam kết liên ngành Zero-PII (${pubAnchor.nda?.status || 'ZERO_PII_COMMITMENT_READY'})`);
      }

      return {
        blockNumber: view.blockNumber,
        txHash: view.txHash,
        prevHash: view.prevHash,
        payloadDigest: view.payloadDigest,
        evidenceHash: view.payloadDigest,
        chainId: view.chainId,
        action,
        actionLabelVi: view.actionLabelVi,
        timestamp: view.timestamp,
        hashVerified: view.hashVerified,
        recomputedTxHash: view.recomputedTxHash,
        zeroPiiEnforced: true,
        networkView: normNet,
        caseCommitmentHash: pubAnchor.caseCommitmentHash,
        anchorDigestHex: pubAnchor.anchorDigestHex,
        publicAnchor: pubAnchor,
        actorLabelVi: '🔒 Thực thể ẩn danh (Zero-PII)',
        unitLabelVi: '🔒 Đơn vị bảo mật nội bộ',
        summaryVi: `${view.actionLabelVi} — Cam kết mật mã một chiều SHA-256 không chứa dữ liệu định danh cá nhân.`,
        durationBadgeVi,
        detailsVi,
        data: pubAnchor.publicAnchorDocument
      };
    }

    const d = view.payload?.data || {};
    let actorLabelVi = 'Hệ thống Sổ cái SOS';
    let unitLabelVi = d.unitName || d.targetUnitName || d.routedUnitName || '';
    let summaryVi = view.actionLabelVi;
    let durationBadgeVi = '';

    if (action === LIFECYCLE_ACTIONS.SOS_TRIGGER) {
      const reporter = d.reporterName || d.userName || 'Người dân khẩn cấp';
      const phone = d.reporterPhone || d.userPhone || d.phone || '';
      actorLabelVi = phone ? `${reporter} (${phone})` : reporter;
      unitLabelVi = d.routedUnitName || d.unitName || 'Trạm trực gần nhất';
      const coords = (Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)))
        ? `${Number(d.lat).toFixed(5)}, ${Number(d.lng).toFixed(5)}${d.accuracy ? ` (±${Math.round(Number(d.accuracy))}m)` : ''}`
        : '';
      summaryVi = `${actorLabelVi} phát tín hiệu cứu hộ qua kênh ${d.channelLabelVi || d.channel || 'WEB_SOS'}${d.address ? ` tại ${d.address}` : ''}.`;
      pushDetail('Người báo tin', actorLabelVi);
      if (d.cardID) pushDetail('Mã thẻ DePIN', d.cardID);
      if (d.userCCCD) pushDetail('CCCD định danh', d.userCCCD);
      pushDetail('Kênh phát tín hiệu', d.channelLabelVi || d.channel || 'WEB_SOS');
      pushDetail('Lực lượng yêu cầu', d.agencyName || d.agency || 'Cứu hộ liên ngành');
      if (coords) pushDetail('Tọa độ GPS khóa cứng', coords);
      if (d.address) pushDetail('Địa chỉ hiện trường', d.address);
      if (Array.isArray(d.incidentTags) && d.incidentTags.length > 0) {
        pushDetail('Phân loại sự cố', d.incidentTags.join(', '));
      }
      if (d.customNotes) pushDetail('Ghi chú hiện trường', d.customNotes);
      if (unitLabelVi) pushDetail('Đơn vị định tuyến đầu tiên', unitLabelVi);
    } else if (action === LIFECYCLE_ACTIONS.CASE_ESCALATED) {
      actorLabelVi = d.escalatedByOfficer || d.officerFullTitle || 'Hệ thống Điều phối Tự động';
      unitLabelVi = d.targetUnitName || d.unitName || 'Chỉ huy Cấp Tỉnh/Thành phố';
      if (d.waitBeforeEscalationSeconds !== undefined && d.waitBeforeEscalationSeconds !== null) {
        durationBadgeVi = `Chờ trước chuyển cấp: ${formatDurationSecondsVi(d.waitBeforeEscalationSeconds)}`;
      }
      summaryVi = `Chuyển vượt cấp từ ${d.previousUnitName || 'Trạm cơ sở'} lên ${unitLabelVi}${d.reason ? ` (${d.reason})` : ''}.`;
      pushDetail('Đơn vị trước đó', d.previousUnitName || 'Trạm cơ sở');
      pushDetail('Đơn vị tiếp nhận vượt cấp', unitLabelVi);
      pushDetail('Người/Cơ chế kích hoạt', actorLabelVi);
      if (d.reason) pushDetail('Lý do chuyển cấp', d.reason);
      if (durationBadgeVi) pushDetail('Thời gian chờ trước chuyển cấp', formatDurationSecondsVi(d.waitBeforeEscalationSeconds));
    } else if (action === LIFECYCLE_ACTIONS.OFFICER_DISPATCH) {
      const fullOfficer = d.officerFullTitle
        || [d.officerRank, d.officerName].filter(Boolean).join(' ').trim()
        || d.officerId
        || 'Cán bộ trực ban';
      actorLabelVi = fullOfficer;
      unitLabelVi = d.unitName || 'Đơn vị trực chiến';
      if (d.responseTimeSeconds !== undefined && d.responseTimeSeconds !== null) {
        durationBadgeVi = `Phản ứng: ${formatDurationSecondsVi(d.responseTimeSeconds)}`;
      }
      summaryVi = `${fullOfficer} (${unitLabelVi}) đã nhận lệnh và xuất quân cứu hộ${d.etaMinutes ? ` — dự kiến ${d.etaMinutes} phút tới nơi` : ''}.`;
      pushDetail('Cán bộ nhận ca', fullOfficer);
      if (d.officerAccount) pushDetail('Tài khoản trực ban', d.officerAccount);
      if (d.officerPhone) pushDetail('SĐT trực chiến', d.officerPhone);
      pushDetail('Đơn vị xuất quân', unitLabelVi);
      if (d.stationAddress) pushDetail('Trụ sở xuất phát', d.stationAddress);
      pushDetail('Kênh nhận lệnh', d.channel === 'zalo_bot' ? 'Zalo Tác Chiến' : 'Bàn Điều Phối Web');
      if (d.responseTimeSeconds !== undefined && d.responseTimeSeconds !== null) {
        pushDetail('Thời gian tiếp nhận (Phản ứng)', formatDurationSecondsVi(d.responseTimeSeconds));
      }
      if (d.etaMinutes) pushDetail('Thời gian di chuyển dự kiến (ETA)', `${d.etaMinutes} phút`);
    } else if (action === LIFECYCLE_ACTIONS.OFFICER_APPROACHING) {
      actorLabelVi = d.officerFullTitle || d.officerName || 'Tổ công tác hiện trường';
      unitLabelVi = d.unitName || 'Đội cứu hộ';
      if (d.approachingTimeSeconds !== undefined && d.approachingTimeSeconds !== null) {
        durationBadgeVi = `Tiếp cận sau: ${formatDurationSecondsVi(d.approachingTimeSeconds)}`;
      }
      summaryVi = `${actorLabelVi} (${unitLabelVi}) đã áp sát phạm vi < 300m quanh hiện trường.`;
      pushDetail('Tổ công tác', actorLabelVi);
      pushDetail('Đơn vị', unitLabelVi);
      if (d.approachingTimeSeconds !== undefined && d.approachingTimeSeconds !== null) {
        pushDetail('Thời gian từ lúc xuất quân', formatDurationSecondsVi(d.approachingTimeSeconds));
      }
    } else if (action === LIFECYCLE_ACTIONS.OFFICER_ARRIVED) {
      actorLabelVi = d.officerFullTitle || d.officerName || 'Tổ công tác hiện trường';
      unitLabelVi = d.unitName || 'Đội cứu hộ';
      if (d.travelTimeSeconds !== undefined && d.travelTimeSeconds !== null) {
        durationBadgeVi = `Di chuyển: ${formatDurationSecondsVi(d.travelTimeSeconds)}`;
      }
      summaryVi = `${actorLabelVi} (${unitLabelVi}) đã có mặt tại hiện trường${d.travelTimeSeconds !== undefined && d.travelTimeSeconds !== null ? ` sau ${formatDurationSecondsVi(d.travelTimeSeconds)} di chuyển` : ''}.`;
      pushDetail('Cán bộ có mặt', actorLabelVi);
      pushDetail('Đơn vị tác chiến', unitLabelVi);
      if (d.travelTimeSeconds !== undefined && d.travelTimeSeconds !== null) {
        pushDetail('Thời gian di chuyển thực tế', formatDurationSecondsVi(d.travelTimeSeconds));
      }
      if (d.totalToSceneSeconds !== undefined && d.totalToSceneSeconds !== null) {
        pushDetail('Tổng thời gian từ lúc báo SOS tới hiện trường', formatDurationSecondsVi(d.totalToSceneSeconds));
      }
      if (d.etaMinutes) {
        pushDetail('Đối chiếu ETA ban đầu', `Dự kiến ${d.etaMinutes} phút`);
      }
    } else if (action === LIFECYCLE_ACTIONS.CASE_RESOLVED) {
      const closedByCitizen = d.closedBy === 'citizen';
      actorLabelVi = closedByCitizen
        ? (d.reporterName || 'Người dân báo an toàn')
        : (d.officerFullTitle || d.officerName || d.closedBy || 'Cán bộ trực ban');
      unitLabelVi = d.unitName || 'Đơn vị xử lý';
      if (d.totalCaseDurationSeconds !== undefined && d.totalCaseDurationSeconds !== null) {
        durationBadgeVi = `Tổng ca: ${formatDurationSecondsVi(d.totalCaseDurationSeconds)}`;
      }
      summaryVi = `${actorLabelVi} xác nhận hoàn tất ứng cứu & đóng hồ sơ ca trực${d.resolutionNote ? `: "${d.resolutionNote}"` : ''}.`;
      pushDetail('Người xác nhận kết thúc', closedByCitizen ? `${actorLabelVi} (Người dân tự xác nhận an toàn)` : `${actorLabelVi} (Lực lượng chức năng)`);
      if (unitLabelVi) pushDetail('Đơn vị phụ trách', unitLabelVi);
      if (d.onSceneHandlingSeconds !== undefined && d.onSceneHandlingSeconds !== null) {
        pushDetail('Thời gian xử lý tại hiện trường', formatDurationSecondsVi(d.onSceneHandlingSeconds));
      }
      if (d.totalCaseDurationSeconds !== undefined && d.totalCaseDurationSeconds !== null) {
        pushDetail('Tổng thời gian toàn trình ca cứu hộ', formatDurationSecondsVi(d.totalCaseDurationSeconds));
      }
      if (d.resolutionNote) pushDetail('Biên bản / Kết quả xử lý', d.resolutionNote);
    } else if (action === LIFECYCLE_ACTIONS.FAKE_ALARM_FLAGGED) {
      actorLabelVi = d.officerFullTitle || d.officerName || 'Cán bộ trực ban';
      unitLabelVi = d.unitName || 'Cơ quan chức năng';
      durationBadgeVi = 'Vi phạm NĐ 144/2021/NĐ-CP';
      summaryVi = `${actorLabelVi} lập biên bản cảnh báo/xử lý báo tin giả theo Nghị định 144/2021/NĐ-CP${d.reason ? `: "${d.reason}"` : ''}.`;
      pushDetail('Cán bộ lập biên bản', actorLabelVi);
      pushDetail('Đơn vị xác minh', unitLabelVi);
      pushDetail('Lý do / Hành vi ghi nhận', d.reason || 'Báo tin giả / Quấy rối đường dây khẩn cấp');
      if (d.clientIp) pushDetail('Địa chỉ mạng (IP) lưu vết', d.clientIp);
      if (d.totalCaseDurationSeconds !== undefined && d.totalCaseDurationSeconds !== null) {
        pushDetail('Thời gian xác minh cho tới lúc khóa ca', formatDurationSecondsVi(d.totalCaseDurationSeconds));
      }
    } else if (action === LIFECYCLE_ACTIONS.EVIDENCE_SEAL) {
      actorLabelVi = d.uploadedBy || 'Thiết bị hiện trường';
      summaryVi = `Niêm phong tệp chứng cứ số ${d.evidenceId || ''} (${d.mimeType || 'dữ liệu hiện trường'}) bằng mã băm SHA-256.`;
      if (d.evidenceId) pushDetail('Mã tệp chứng cứ', d.evidenceId);
      if (d.mimeType) pushDetail('Định dạng', d.mimeType);
      if (d.sizeBytes) pushDetail('Dung lượng', `${Number(d.sizeBytes).toLocaleString('vi-VN')} bytes`);
      if (d.sha256Hash) pushDetail('SHA-256 tệp gốc', d.sha256Hash);
    } else if (action === LIFECYCLE_ACTIONS.CARD_PROVISION_SEAL) {
      actorLabelVi = d.issuerUnit || 'Trung tâm Cấp phát Thẻ DePIN';
      unitLabelVi = d.issuerUnit || 'BTL CSCĐ / Công an cơ sở';
      summaryVi = `Cấp phát / cập nhật thẻ cứng SOS vật lý ${d.cardID || ''} cho công dân ${d.userName || ''}.`;
      if (d.cardID) pushDetail('Mã thẻ vật lý (UID)', d.cardID);
      if (d.userName) pushDetail('Chủ thẻ', d.userName);
      if (d.mode) pushDetail('Chế độ thẻ', d.mode);
    }

    return {
      blockNumber: view.blockNumber,
      txHash: view.txHash,
      prevHash: view.prevHash,
      payloadDigest: view.payloadDigest,
      evidenceHash: view.evidenceHash,
      chainId: view.chainId,
      envName: view.envName,
      action,
      actionLabelVi: view.actionLabelVi,
      timestamp: view.timestamp,
      hashVerified: view.hashVerified,
      recomputedTxHash: view.recomputedTxHash,
      zeroPiiEnforced: false,
      networkView: '842026',
      caseCommitmentHash: view.caseCommitmentHash,
      anchorDigestHex: view.anchorDigestHex,
      publicAnchor: view.publicAnchor,
      actorLabelVi,
      unitLabelVi,
      summaryVi,
      durationBadgeVi,
      detailsVi,
      data: d
    };
  }

  buildCaseProcessSummary(caseBlocks = [], incidentMeta = null, { includeRawPii = false, networkView = '842026' } = {}) {
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);
    const ordered = [...(Array.isArray(caseBlocks) ? caseBlocks : [])]
      .filter((b) => b && typeof b === 'object')
      .sort((a, b) => (Number(a.blockNumber) || 0) - (Number(b.blockNumber) || 0));

    const findFirst = (act) => ordered.find((b) => (b.action || b.payload?.action) === act) || null;
    const findLast = (act) => {
      for (let i = ordered.length - 1; i >= 0; i--) {
        if ((ordered[i].action || ordered[i].payload?.action) === act) return ordered[i];
      }
      return null;
    };

    const triggerBlock = findFirst(LIFECYCLE_ACTIONS.SOS_TRIGGER) || ordered[0] || null;
    const escalationBlocks = ordered.filter((b) => (b.action || b.payload?.action) === LIFECYCLE_ACTIONS.CASE_ESCALATED);
    const latestEscalationBlock = escalationBlocks.length > 0 ? escalationBlocks[escalationBlocks.length - 1] : null;
    const dispatchBlock = findLast(LIFECYCLE_ACTIONS.OFFICER_DISPATCH);
    const approachingBlock = findLast(LIFECYCLE_ACTIONS.OFFICER_APPROACHING);
    const arrivedBlock = findLast(LIFECYCLE_ACTIONS.OFFICER_ARRIVED);
    const resolvedBlock = findLast(LIFECYCLE_ACTIONS.CASE_RESOLVED);
    const fakeBlock = findLast(LIFECYCLE_ACTIONS.FAKE_ALARM_FLAGGED);
    const closingBlock = fakeBlock || resolvedBlock;
    const evidenceBlocks = ordered.filter((b) => (b.action || b.payload?.action) === LIFECYCLE_ACTIONS.EVIDENCE_SEAL);

    const trigData = triggerBlock?.payload?.data || {};
    const escData = latestEscalationBlock?.payload?.data || {};
    const dispData = dispatchBlock?.payload?.data || {};
    const apprData = approachingBlock?.payload?.data || {};
    const arrData = arrivedBlock?.payload?.data || {};
    const closeData = closingBlock?.payload?.data || {};

    const toMs = (iso) => {
      if (!iso) return null;
      const ms = new Date(iso).getTime();
      return Number.isFinite(ms) ? ms : null;
    };
    const diffSec = (startIso, endIso, fallbackVal = null) => {
      if (fallbackVal !== null && fallbackVal !== undefined && Number.isFinite(Number(fallbackVal))) {
        return Math.max(0, Math.round(Number(fallbackVal)));
      }
      const s = toMs(startIso);
      const e = toMs(endIso);
      if (s === null || e === null) return null;
      return Math.max(0, Math.round((e - s) / 1000));
    };

    const triggeredAt = trigData.triggeredAt || triggerBlock?.timestamp || incidentMeta?.createdAt || null;
    const escalatedAt = escData.escalatedAt || latestEscalationBlock?.timestamp || incidentMeta?.escalatedAt || null;
    const dispatchedAt = dispData.dispatchedAt || dispatchBlock?.timestamp || incidentMeta?.dispatchedAt || null;
    const approachingAt = apprData.approachingAt || approachingBlock?.timestamp || incidentMeta?.approachingAt || null;
    const arrivedAt = arrData.arrivedAt || arrivedBlock?.timestamp || incidentMeta?.arrivedAt || null;
    const resolvedAt = closeData.resolvedAt || closeData.flaggedAt || closingBlock?.timestamp || incidentMeta?.resolvedAt || null;

    const responseTimeSeconds = diffSec(triggeredAt, dispatchedAt, dispData.responseTimeSeconds ?? closeData.responseTimeSeconds ?? null);
    const approachingTimeSeconds = diffSec(dispatchedAt, approachingAt, apprData.approachingTimeSeconds ?? null);
    const travelTimeSeconds = diffSec(dispatchedAt, arrivedAt, arrData.travelTimeSeconds ?? closeData.travelTimeSeconds ?? null);
    const totalToSceneSeconds = diffSec(triggeredAt, arrivedAt, arrData.totalToSceneSeconds ?? closeData.totalToSceneSeconds ?? null);
    const onSceneHandlingSeconds = arrivedAt
      ? diffSec(arrivedAt, resolvedAt, closeData.onSceneHandlingSeconds ?? null)
      : (closeData.onSceneHandlingSeconds !== undefined ? closeData.onSceneHandlingSeconds : null);
    const totalCaseDurationSeconds = diffSec(triggeredAt, resolvedAt, closeData.totalCaseDurationSeconds ?? null);

    let currentStageCode = 'PENDING_DISPATCH';
    let currentStageLabelVi = 'Đang chờ Trực ban tiếp nhận';
    if (fakeBlock) {
      currentStageCode = 'FAKE_ALARM_FLAGGED';
      currentStageLabelVi = 'Đã khóa ca & lập biên bản báo giả (NĐ 144)';
    } else if (resolvedBlock) {
      currentStageCode = 'RESOLVED';
      currentStageLabelVi = 'Đã hoàn tất ứng cứu & đóng hồ sơ';
    } else if (arrivedBlock) {
      currentStageCode = 'ARRIVED_ON_SCENE';
      currentStageLabelVi = 'Lực lượng cứu hộ đã có mặt tại hiện trường';
    } else if (approachingBlock) {
      currentStageCode = 'APPROACHING_SCENE';
      currentStageLabelVi = 'Đội cứu hộ đang tiếp cận (< 300m)';
    } else if (dispatchBlock) {
      currentStageCode = 'DISPATCHED_EN_ROUTE';
      currentStageLabelVi = 'Trực ban đã nhận ca & đang di chuyển';
    } else if (latestEscalationBlock) {
      currentStageCode = 'ESCALATED_WAITING';
      currentStageLabelVi = 'Đã chuyển vượt cấp Chỉ huy Tỉnh/TP';
    }

    const rawInternalCaseId = triggerBlock?.caseId || ordered[0]?.caseId || incidentMeta?.id || '';
    const caseCommitmentHash = computeCaseCommitmentHash(rawInternalCaseId);
    const steps = ordered
      .map((blk, idx) => {
        const step = this.describeBlockStepVi(blk, { includeRawPii, networkView: normNet });
        return step ? { stepIndex: idx + 1, ...step } : null;
      })
      .filter(Boolean);

    const durations = {
      responseTimeSeconds,
      responseTimeTextVi: formatDurationSecondsVi(responseTimeSeconds),
      approachingTimeSeconds,
      approachingTimeTextVi: formatDurationSecondsVi(approachingTimeSeconds),
      travelTimeSeconds,
      travelTimeTextVi: formatDurationSecondsVi(travelTimeSeconds),
      totalToSceneSeconds,
      totalToSceneTextVi: formatDurationSecondsVi(totalToSceneSeconds),
      onSceneHandlingSeconds,
      onSceneHandlingTextVi: formatDurationSecondsVi(onSceneHandlingSeconds),
      totalCaseDurationSeconds,
      totalCaseDurationTextVi: formatDurationSecondsVi(totalCaseDurationSeconds)
    };

    const timestamps = {
      triggeredAt,
      escalatedAt,
      dispatchedAt,
      approachingAt,
      arrivedAt,
      resolvedAt
    };

    if (zeroPii) {
      const latestBlockObj = ordered[ordered.length - 1] || null;
      return {
        caseId: null,
        caseCommitmentHash,
        networkView: normNet,
        zeroPiiEnforced: true,
        totalBlocksInCase: ordered.length,
        evidenceFilesCount: evidenceBlocks.length,
        transactionMode: evidenceBlocks.length > 0 ? 'PROCESS_AND_MEDIA_HASH' : 'LIGHTWEIGHT_PROCESS_TRANSACTION',
        currentStageCode,
        currentStageLabelVi,
        isResolved: Boolean(resolvedBlock || fakeBlock),
        isFakeAlarm: Boolean(fakeBlock),
        reporter: {
          name: '🔒 Đã ẩn bảo mật Zero-PII (Công dân ẩn danh)',
          phone: '🔒 Không công bố trên mạng quốc tế',
          cardID: null,
          userCCCD: null,
          channel: 'ENCRYPTED_COMMITMENT',
          channelLabelVi: 'Giao thức Cam kết Một chiều (Zero-PII)',
          agency: '',
          agencyName: 'Lực lượng Cứu hộ Khẩn cấp (Ẩn chi tiết đơn vị)',
          lat: null,
          lng: null,
          accuracy: null,
          address: '🔒 Đã khóa tọa độ GPS & địa chỉ nội bộ (Zero-GPS)',
          incidentTags: [],
          customNotes: ''
        },
        routing: {
          initialUnitName: '🔒 Đơn vị trực chiến nội bộ (Zero-PII)',
          initialUnitAddress: '',
          initialUnitPhone: '',
          escalatedCount: escalationBlocks.length,
          escalatedToUnitName: escalationBlocks.length > 0 ? '🔒 Cấp chỉ huy trực thuộc (Zero-PII)' : null,
          escalationReason: null
        },
        officer: {
          accepted: Boolean(dispatchBlock),
          rank: null,
          name: null,
          fullTitle: dispatchBlock ? '🔒 Lực lượng trực chiến đã tiếp nhận (Zero-PII)' : 'Đang chờ tiếp nhận (Zero-PII)',
          account: null,
          phone: null,
          unitName: '🔒 Đơn vị cứu hộ nội bộ (Zero-PII)',
          stationAddress: '',
          dispatchChannel: null,
          dispatchChannelLabelVi: dispatchBlock ? 'Đã xác thực chữ ký nội bộ' : 'Chưa tiếp nhận',
          etaMinutes: dispData.etaMinutes ?? arrData.etaMinutes ?? null
        },
        timestamps,
        durations,
        resolution: {
          closed: Boolean(closingBlock),
          isFakeAlarm: Boolean(fakeBlock),
          closedBy: closingBlock ? 'verified_actor_commitment' : null,
          officerFullTitle: null,
          note: ''
        },
        firstBlockNumber: ordered[0]?.blockNumber || null,
        firstTxHash: ordered[0]?.txHash || null,
        latestBlockNumber: latestBlockObj?.blockNumber || null,
        latestTxHash: latestBlockObj?.txHash || null,
        latestPublicAnchor: latestBlockObj ? this.buildExternalAnchorSummary(latestBlockObj) : null,
        steps
      };
    }

    const rawPhone = trigData.reporterPhone || trigData.userPhone || trigData.phone || incidentMeta?.reporterPhone || incidentMeta?.phone || '';
    const rawCccd = trigData.userCCCD || trigData.cccd || incidentMeta?.userCCCD || '';
    const reporterPhone = includeRawPii ? rawPhone : maskLedgerPii(rawPhone, 3, 3);
    const userCCCD = includeRawPii ? rawCccd : maskLedgerPii(rawCccd, 3, 3);

    const officerRank = dispData.officerRank || arrData.officerRank || closeData.officerRank || incidentMeta?.acceptedByOfficer?.rank || '';
    const officerName = dispData.officerName || arrData.officerName || closeData.officerName || dispData.officerId || incidentMeta?.acceptedByOfficer?.name || '';
    const officerFullTitle = dispData.officerFullTitle
      || arrData.officerFullTitle
      || closeData.officerFullTitle
      || [officerRank, officerName].filter(Boolean).join(' ').trim()
      || '';

    return {
      caseId: rawInternalCaseId,
      caseCommitmentHash,
      networkView: '842026',
      zeroPiiEnforced: false,
      totalBlocksInCase: ordered.length,
      evidenceFilesCount: evidenceBlocks.length,
      transactionMode: evidenceBlocks.length > 0 ? 'PROCESS_AND_MEDIA_HASH' : 'LIGHTWEIGHT_PROCESS_TRANSACTION',
      currentStageCode,
      currentStageLabelVi,
      isResolved: Boolean(resolvedBlock || fakeBlock),
      isFakeAlarm: Boolean(fakeBlock),
      reporter: {
        name: trigData.reporterName || trigData.userName || incidentMeta?.reporterName || 'Người dân khẩn cấp',
        phone: reporterPhone || 'Chưa cung cấp',
        cardID: trigData.cardID || incidentMeta?.cardID || null,
        userCCCD: userCCCD || null,
        channel: trigData.channel || incidentMeta?.sourceChannel || 'WEB_SOS',
        channelLabelVi: trigData.channelLabelVi || (trigData.isStealth ? 'SOS Ngụy Trang Khẩn Cấp (Stealth)' : 'Cổng Web Khẩn Cấp SOSVie'),
        agency: trigData.agency || incidentMeta?.agency || '',
        agencyName: trigData.agencyName || incidentMeta?.agencyName || 'Cứu hộ liên ngành',
        lat: trigData.lat ?? incidentMeta?.lat ?? null,
        lng: trigData.lng ?? incidentMeta?.lng ?? null,
        accuracy: trigData.accuracy ?? incidentMeta?.accuracy ?? null,
        address: trigData.address || incidentMeta?.address || '',
        incidentTags: Array.isArray(trigData.incidentTags) ? trigData.incidentTags : (incidentMeta?.incidentTags || []),
        customNotes: trigData.customNotes || incidentMeta?.notes || ''
      },
      routing: {
        initialUnitName: trigData.routedUnitName || trigData.unitName || incidentMeta?.assignedUnit?.name || 'Trạm trực cơ sở',
        initialUnitAddress: trigData.routedUnitAddress || incidentMeta?.assignedUnit?.address || '',
        initialUnitPhone: trigData.routedUnitPhone || incidentMeta?.assignedUnit?.phone || '',
        escalatedCount: escalationBlocks.length,
        escalatedToUnitName: escData.targetUnitName || null,
        escalationReason: escData.reason || null
      },
      officer: {
        accepted: Boolean(dispatchBlock || officerFullTitle),
        rank: officerRank || null,
        name: officerName || null,
        fullTitle: officerFullTitle || 'Chưa có cán bộ nhận ca',
        account: dispData.officerAccount || closeData.officerAccount || null,
        phone: dispData.officerPhone || incidentMeta?.acceptedByOfficer?.phone || null,
        unitName: dispData.unitName || arrData.unitName || closeData.unitName || incidentMeta?.assignedUnit?.name || 'Đang điều phối',
        stationAddress: dispData.stationAddress || incidentMeta?.assignedUnit?.address || '',
        dispatchChannel: dispData.channel || null,
        dispatchChannelLabelVi: dispData.channel === 'zalo_bot' ? 'Zalo Tác Chiến' : (dispatchBlock ? 'Bàn Điều Phối Web' : 'Chưa tiếp nhận'),
        etaMinutes: dispData.etaMinutes ?? arrData.etaMinutes ?? null
      },
      timestamps,
      durations,
      resolution: {
        closed: Boolean(closingBlock),
        isFakeAlarm: Boolean(fakeBlock),
        closedBy: closeData.closedBy || (fakeBlock ? 'dispatcher' : null),
        officerFullTitle: closeData.officerFullTitle || officerFullTitle || null,
        note: closeData.resolutionNote || closeData.reason || incidentMeta?.resolutionNote || ''
      },
      firstBlockNumber: ordered[0]?.blockNumber || null,
      firstTxHash: ordered[0]?.txHash || null,
      latestBlockNumber: ordered[ordered.length - 1]?.blockNumber || null,
      latestTxHash: ordered[ordered.length - 1]?.txHash || null,
      latestPublicAnchor: ordered[ordered.length - 1] ? this.buildExternalAnchorSummary(ordered[ordered.length - 1]) : null,
      steps
    };
  }

  lookupLedger(query, { includeRawPii = false, incidentMeta = null, host = '', networkView = '842026' } = {}) {
    if (!this.state) this.loadLedger();
    const sysCfg = resolveSystemBlockchainConfig(host);
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);
    const activeNetworkProfile = sysCfg.networks[normNet] || sysCfg.networks['842026'];
    const raw = String(query || '').trim();
    if (!raw) {
      return {
        ok: false,
        found: false,
        error: 'EMPTY_QUERY',
        networkView: normNet,
        zeroPiiEnforced: zeroPii,
        activeNetworkProfile,
        supportedNetworks: sysCfg.supportedNetworks,
        sysConfig: sysCfg
      };
    }

    let queryType = 'caseId';
    let matchedBlock = null;
    let caseId = '';

    if (/^#?\d+$/.test(raw)) {
      queryType = 'blockNumber';
      const num = Number(raw.replace(/^#/, ''));
      matchedBlock = this.state.blocks.find((b) => b.blockNumber === num) || null;
      if (matchedBlock) caseId = matchedBlock.caseId;
    } else if (/^(0x)?[0-9a-fA-F]{64}$/.test(raw)) {
      queryType = 'hash';
      const hex = ('0x' + raw.replace(/^0x/i, '')).toLowerCase();
      matchedBlock = this.state.blocks.find(
        (b) => String(b.txHash || '').toLowerCase() === hex
          || String(b.payloadDigest || '').toLowerCase() === hex
          || String(b.evidenceHash || '').toLowerCase() === hex
          || String(b.externalAnchors?.OTS?.anchorDigestHex || '').toLowerCase() === hex
          || computeCaseCommitmentHash(b.caseId).toLowerCase() === hex
      ) || null;
      if (matchedBlock) caseId = matchedBlock.caseId;
    }

    let caseBlocks = [];
    if (matchedBlock) {
      caseBlocks = caseId ? this.getCaseBlocks(caseId) : [matchedBlock];
    } else {
      const upper = raw.toUpperCase();
      caseBlocks = this.state.blocks.filter(
        (b) => String(b.caseId || '').toUpperCase() === upper
          || String(b.payload?.data?.cardID || '').toUpperCase() === upper
      );
      if (caseBlocks.length > 0) {
        queryType = 'caseId';
        matchedBlock = caseBlocks[caseBlocks.length - 1];
        caseId = matchedBlock.caseId;
      }
    }

    if (!matchedBlock || caseBlocks.length === 0) {
      return {
        ok: true,
        found: false,
        query: zeroPii ? '[ZERO_PII_QUERY]' : raw,
        networkView: normNet,
        zeroPiiEnforced: zeroPii,
        activeNetworkProfile,
        supportedNetworks: sysCfg.supportedNetworks,
        sysConfig: {
          envName: sysCfg.envName,
          chainId: sysCfg.chainId,
          canonicalChainId: 842026,
          totalBlocks: this.state.blocks.length
        }
      };
    }

    const chainIntegrity = caseId
      ? this.verifyCaseChainIntegrity(caseId)
      : {
          ok: true,
          blockCount: 1,
          allBlocksIntact: timingSafeHexEqual(
            matchedBlock.txHash,
            this.computeDeterministicTxHash(matchedBlock.payload, matchedBlock.blockNumber, matchedBlock.prevHash)
          )
        };

    const caseCommitmentHash = computeCaseCommitmentHash(caseId);
    const processSummary = this.buildCaseProcessSummary(caseBlocks, incidentMeta, {
      includeRawPii,
      networkView: normNet
    });
    const sanitizedBlocks = caseBlocks.map((b) => this.sanitizeBlockForView(b, {
      includeRawPii,
      networkView: normNet
    }));
    const publicAnchor = this.buildExternalAnchorSummary(matchedBlock);

    return {
      ok: true,
      found: true,
      query: zeroPii && queryType === 'caseId' ? caseCommitmentHash : raw,
      queryType,
      networkView: normNet,
      zeroPiiEnforced: zeroPii,
      activeNetworkProfile,
      supportedNetworks: sysCfg.supportedNetworks,
      piiMasked: zeroPii ? true : !includeRawPii,
      caseId: zeroPii ? null : caseId,
      caseCommitmentHash,
      matchedBlockNumber: matchedBlock.blockNumber,
      matchedTxHash: matchedBlock.txHash,
      publicAnchor,
      sysConfig: {
        envName: sysCfg.envName,
        chainId: sysCfg.chainId,
        canonicalChainId: 842026,
        genesisHash: this.state.genesisHash,
        totalBlocks: this.state.blocks.length
      },
      chainIntegrity: {
        ok: chainIntegrity.ok,
        blockCount: chainIntegrity.blockCount,
        allBlocksIntact: chainIntegrity.allBlocksIntact,
        blocks: chainIntegrity.blocks || []
      },
      processSummary,
      blocks: sanitizedBlocks
    };
  }

  getRecentBlocks(limit = 20, { includeRawPii = false, host = '', networkView = '842026' } = {}) {
    if (!this.state) this.loadLedger();
    const sysCfg = resolveSystemBlockchainConfig(host);
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);
    const activeNetworkProfile = sysCfg.networks[normNet] || sysCfg.networks['842026'];
    const maxItems = Math.min(Math.max(1, Number(limit) || 20), 100);
    const slice = this.state.blocks.slice(-maxItems).reverse();
    const items = slice.map((b) => {
      const step = this.describeBlockStepVi(b, { includeRawPii, networkView: normNet });
      const caseCommitmentHash = computeCaseCommitmentHash(b.caseId);
      const pubAnchor = step?.publicAnchor || this.buildExternalAnchorSummary(b);
      return {
        blockNumber: b.blockNumber,
        txHash: b.txHash,
        prevHash: b.prevHash,
        payloadDigest: b.payloadDigest,
        caseId: zeroPii ? null : b.caseId,
        caseCommitmentHash,
        anchorDigestHex: pubAnchor?.anchorDigestHex || null,
        otsStamped: Boolean(pubAnchor?.ots?.stamped),
        action: b.action,
        actionLabelVi: step?.actionLabelVi || (zeroPii ? describeZeroPiiStageVi(b.action) : describeBlockchainActionVi(b.action)),
        actorLabelVi: step?.actorLabelVi || '',
        unitLabelVi: step?.unitLabelVi || '',
        summaryVi: step?.summaryVi || '',
        durationBadgeVi: step?.durationBadgeVi || '',
        timestamp: b.timestamp,
        chainId: b.chainId,
        envName: zeroPii ? activeNetworkProfile.label : b.envName,
        networkView: normNet,
        zeroPiiEnforced: zeroPii,
        hashVerified: Boolean(step?.hashVerified)
      };
    });

    return {
      ok: true,
      networkView: normNet,
      zeroPiiEnforced: zeroPii,
      activeNetworkProfile,
      supportedNetworks: sysCfg.supportedNetworks,
      piiMasked: zeroPii ? true : !includeRawPii,
      totalBlocks: this.state.blocks.length,
      lastBlockHash: this.state.lastBlockHash,
      genesisHash: this.state.genesisHash,
      envName: sysCfg.envName,
      chainId: sysCfg.chainId,
      blocks: items
    };
  }

  verifyExportedDossier(dossierInput, { host = '', networkView = '842026', includeRawPii = true } = {}) {
    if (!this.state) this.loadLedger();
    const sysCfg = resolveSystemBlockchainConfig(host);
    const normNet = normalizeNetworkView(networkView);
    const zeroPii = isZeroPiiNetworkView(normNet);

    // Support verifying SOSVN-ANCHOR-V1 PublicAnchor.json Zero-PII files directly
    if (dossierInput && typeof dossierInput === 'object' && dossierInput.protocol === 'SOSVN-ANCHOR-V1') {
      const blkNum = Number(dossierInput.blockNumber) || 0;
      const serverBlock = this.state.blocks.find((sb) => sb.blockNumber === blkNum) || null;
      const canonicalServerAnchor = serverBlock ? buildZeroPiiPublicAnchorDocument(serverBlock) : null;
      const txMatched = Boolean(serverBlock && timingSafeHexEqual(serverBlock.txHash, String(dossierInput.txHash || '')));
      const prevMatched = Boolean(serverBlock && timingSafeHexEqual(serverBlock.prevHash, String(dossierInput.prevHash || '')));
      const payloadMatched = Boolean(serverBlock && timingSafeHexEqual(serverBlock.payloadDigest, String(dossierInput.payloadDigest || '')));
      const commitmentMatched = Boolean(
        canonicalServerAnchor && timingSafeHexEqual(canonicalServerAnchor.document.caseCommitmentHash, String(dossierInput.caseCommitmentHash || ''))
      );
      const exactMatched = Boolean(serverBlock && txMatched && prevMatched && payloadMatched && commitmentMatched);
      const caseBlocks = serverBlock && serverBlock.caseId ? this.getCaseBlocks(serverBlock.caseId) : (serverBlock ? [serverBlock] : []);
      const effectiveNet = normNet === '842026' ? 'OTS' : normNet;
      return {
        ok: true,
        verified: exactMatched,
        cryptographicIntact: exactMatched,
        serverLedgerAllMatched: exactMatched,
        tamperDetected: Boolean(serverBlock && !exactMatched),
        verdictCode: exactMatched ? 'PUBLIC_ANCHOR_VERIFIED' : (serverBlock ? 'TAMPERED_DATA_DETECTED' : 'PUBLIC_ANCHOR_SERVER_BLOCK_NOT_FOUND'),
        verdictTitleVi: exactMatched
          ? `XÁC THỰC CAM KẾT ZERO-PII THÀNH CÔNG 100% (BLOCK #${blkNum})`
          : (serverBlock ? `CẢNH BÁO SAI LỆCH TỆP CAM KẾT CÔNG KHAI TẠI BLOCK #${blkNum}` : `TỆP CAM KẾT ZERO-PII HỢP LỆ CẤU TRÚC — CHƯA CÓ BLOCK #${blkNum} TRÊN MÁY CHỦ NÀY`),
        verdictDetailVi: exactMatched
          ? `Tệp SOSVN_Block_${blkNum}_PublicAnchor.json khớp 100% TxHash, PrevHash, PayloadDigest và CaseCommitmentHash với Sổ cái gốc mà không lộ bất kỳ dữ liệu cá nhân (Zero-PII) nào.`
          : 'Một hoặc nhiều mã băm cam kết trong tệp PublicAnchor.json không khớp với Block trên Sổ cái.',
        checkedBlocksCount: 1,
        networkView: effectiveNet,
        zeroPiiEnforced: true,
        corruptedBlocks: serverBlock && !exactMatched
          ? [{
              blockNumber: blkNum,
              action: String(dossierInput.actionCode || ''),
              actionLabelVi: describeZeroPiiStageVi(dossierInput.actionCode),
              providedTxHash: String(dossierInput.txHash || ''),
              expectedTxHash: serverBlock.txHash,
              serverTxHash: serverBlock.txHash,
              reasonsVi: ['Mã băm cam kết trong PublicAnchor.json đã bị thay đổi so với Sổ cái gốc']
            }]
          : [],
        blockVerifications: [{
          blockNumber: blkNum,
          action: String(dossierInput.actionCode || ''),
          actionLabelVi: describeZeroPiiStageVi(dossierInput.actionCode),
          timestamp: dossierInput.sealedAt || null,
          providedTxHash: String(dossierInput.txHash || ''),
          recomputedTxHash: serverBlock?.txHash || String(dossierInput.txHash || ''),
          providedPayloadDigest: String(dossierInput.payloadDigest || ''),
          recomputedPayloadDigest: serverBlock?.payloadDigest || String(dossierInput.payloadDigest || ''),
          prevHash: String(dossierInput.prevHash || ''),
          selfHashMatched: exactMatched,
          payloadDigestMatched: payloadMatched,
          prevChainConsistent: prevMatched,
          existsOnServerLedger: Boolean(serverBlock),
          txHashMatchesServer: txMatched,
          serverTxHash: serverBlock?.txHash || null,
          status: exactMatched ? 'VERIFIED_ON_LEDGER' : (serverBlock ? 'TAMPERED' : 'HASH_VALID_OFF_LEDGER'),
          reasonsVi: []
        }],
        processSummary: caseBlocks.length > 0
          ? this.buildCaseProcessSummary(caseBlocks, null, { includeRawPii: false, networkView: effectiveNet })
          : null,
        publicAnchor: serverBlock ? this.buildExternalAnchorSummary(serverBlock) : null,
        sysConfig: {
          envName: sysCfg.envName,
          chainId: sysCfg.chainId,
          totalBlocksOnServer: this.state.blocks.length
        }
      };
    }

    let rawBlocks = [];
    let dossierMeta = null;
    if (Array.isArray(dossierInput)) {
      rawBlocks = dossierInput;
    } else if (dossierInput && typeof dossierInput === 'object') {
      if (Array.isArray(dossierInput.lifecycleBlocks)) {
        rawBlocks = dossierInput.lifecycleBlocks;
        dossierMeta = dossierInput;
      } else if (Array.isArray(dossierInput.blocks)) {
        rawBlocks = dossierInput.blocks;
        dossierMeta = dossierInput;
      } else if (dossierInput.blockNumber !== undefined && (dossierInput.txHash || dossierInput.payload)) {
        rawBlocks = [dossierInput];
      }
    }

    if (!rawBlocks || rawBlocks.length === 0) {
      return {
        ok: false,
        verified: false,
        verdictCode: 'INVALID_DOSSIER_FORMAT',
        verdictTitleVi: 'Không tìm thấy dữ liệu Block hợp lệ trong tệp tải lên',
        verdictDetailVi: 'Vui lòng tải lên tệp Biên bản Pháp lý (.JSON) trích xuất từ hệ thống SOS Vietnam hoặc dán đối tượng JSON chứa danh sách lifecycleBlocks / Block.',
        corruptedBlocks: []
      };
    }

    const normalizedBlocks = [...rawBlocks]
      .filter((b) => b && typeof b === 'object')
      .map((b) => ({
        blockNumber: Number(b.blockNumber) || 0,
        action: b.action || b.actionType || b.payload?.action || '',
        caseId: b.caseId || b.payload?.caseId || dossierMeta?.incidentId || '',
        timestamp: b.timestamp || b.isoTime || b.payload?.timestamp || null,
        prevHash: b.prevHash || '',
        txHash: b.txHash || b.hash || '',
        payloadDigest: b.payloadDigest || '',
        evidenceHash: b.evidenceHash || '',
        payload: b.payload && typeof b.payload === 'object' ? b.payload : null
      }))
      .sort((a, b) => a.blockNumber - b.blockNumber);

    const blockVerifications = [];
    const corruptedBlocks = [];
    let allCryptographicIntact = true;
    let allServerMatched = true;
    let hasFullPayloads = true;

    for (let i = 0; i < normalizedBlocks.length; i++) {
      const blk = normalizedBlocks[i];
      const serverBlock = this.state.blocks.find((sb) => sb.blockNumber === blk.blockNumber) || null;
      const serverByHash = blk.txHash
        ? (this.state.blocks.find((sb) => timingSafeHexEqual(sb.txHash, blk.txHash)) || null)
        : null;

      let recomputedTxHash = '';
      let recomputedPayloadDigest = '';
      let selfHashMatched = false;
      let payloadDigestMatched = true;

      if (blk.payload && typeof blk.payload === 'object') {
        recomputedPayloadDigest = sha256Prefixed(Buffer.from(JSON.stringify(blk.payload.data || {}), 'utf8'));
        recomputedTxHash = this.computeDeterministicTxHash(blk.payload, blk.blockNumber, blk.prevHash);
        selfHashMatched = Boolean(blk.txHash && timingSafeHexEqual(blk.txHash, recomputedTxHash));
        if (blk.payloadDigest) {
          payloadDigestMatched = timingSafeHexEqual(blk.payloadDigest, recomputedPayloadDigest);
        }
      } else {
        hasFullPayloads = false;
        allCryptographicIntact = false;
      }

      let prevChainConsistent = true;
      if (i > 0 && normalizedBlocks[i - 1].blockNumber + 1 === blk.blockNumber && normalizedBlocks[i - 1].txHash) {
        prevChainConsistent = timingSafeHexEqual(blk.prevHash, normalizedBlocks[i - 1].txHash);
      }

      const existsOnServerAtBlockNumber = Boolean(serverBlock);
      const txHashMatchesServer = Boolean(
        serverBlock && blk.txHash && timingSafeHexEqual(serverBlock.txHash, blk.txHash)
      );
      const payloadDigestMatchesServer = Boolean(
        serverBlock && (!recomputedPayloadDigest || timingSafeHexEqual(serverBlock.payloadDigest, recomputedPayloadDigest))
      );

      if (!selfHashMatched || !payloadDigestMatched || !prevChainConsistent) {
        allCryptographicIntact = false;
      }
      if (!existsOnServerAtBlockNumber || !txHashMatchesServer || !payloadDigestMatchesServer) {
        allServerMatched = false;
      }

      const reasonsVi = [];
      if (!blk.payload) {
        reasonsVi.push('Thiếu trường payload gốc để tự băm lại SHA-256');
      } else {
        if (!selfHashMatched) {
          reasonsVi.push('Mã băm txHash không khớp với nội dung payload (Dữ liệu trong tệp đã bị chỉnh sửa sau khi niêm phong)');
        }
        if (!payloadDigestMatched) {
          reasonsVi.push('Mã payloadDigest không khớp với dữ liệu chi tiết ca trực');
        }
      }
      if (!prevChainConsistent) {
        reasonsVi.push('Đứt gãy liên kết prevHash với Block liền trước');
      }
      if (existsOnServerAtBlockNumber && !txHashMatchesServer) {
        reasonsVi.push(`Không khớp với Block #${blk.blockNumber} đang lưu trên Sổ cái máy chủ (TxHash gốc: ${serverBlock.txHash.slice(0, 18)}...)`);
      }

      const blockCorrupted = (!selfHashMatched && Boolean(blk.payload))
        || !payloadDigestMatched
        || !prevChainConsistent
        || (existsOnServerAtBlockNumber && !txHashMatchesServer);

      if (blockCorrupted) {
        corruptedBlocks.push({
          blockNumber: blk.blockNumber,
          action: blk.action,
          actionLabelVi: describeBlockchainActionVi(blk.action),
          providedTxHash: blk.txHash || '',
          expectedTxHash: recomputedTxHash || '',
          serverTxHash: serverBlock?.txHash || '',
          reasonsVi
        });
      }

      blockVerifications.push({
        blockNumber: blk.blockNumber,
        action: blk.action,
        actionLabelVi: describeBlockchainActionVi(blk.action),
        timestamp: blk.timestamp,
        providedTxHash: blk.txHash,
        recomputedTxHash,
        providedPayloadDigest: blk.payloadDigest,
        recomputedPayloadDigest,
        prevHash: blk.prevHash,
        selfHashMatched,
        payloadDigestMatched,
        prevChainConsistent,
        existsOnServerLedger: existsOnServerAtBlockNumber || Boolean(serverByHash),
        txHashMatchesServer,
        serverTxHash: serverBlock?.txHash || null,
        status: blockCorrupted
          ? 'TAMPERED'
          : (selfHashMatched && txHashMatchesServer ? 'VERIFIED_ON_LEDGER' : (selfHashMatched ? 'HASH_VALID_OFF_LEDGER' : 'INCOMPLETE_LEGACY')),
        reasonsVi
      });
    }

    const tamperDetected = corruptedBlocks.length > 0;
    let verdictCode = 'AUTHENTIC_AND_ON_LEDGER';
    let verdictTitleVi = 'XÁC THỰC THÀNH CÔNG 100% — DỮ LIỆU NGUYÊN VẸN & KHỚP SỔ CÁI GỐC';
    let verdictDetailVi = `Toàn bộ ${normalizedBlocks.length} Block trong tệp hồ sơ đều khớp tuyệt đối thuật toán băm SHA-256 và trùng khớp với Sổ cái đang vận hành trên hệ thống (${sysCfg.envName}).`;

    if (tamperDetected) {
      verdictCode = 'TAMPERED_DATA_DETECTED';
      const badNums = corruptedBlocks.map((c) => `#${c.blockNumber}`).join(', ');
      verdictTitleVi = `CẢNH BÁO GIẢ MẠO / CHỈNH SỬA TRÁI PHÉP TẠI BLOCK ${badNums}`;
      verdictDetailVi = 'Nội dung tệp JSON hoặc mã băm đã bị thay đổi dù chỉ 1 ký tự so với bản ghi đã niêm phong trên chuỗi khối. Hồ sơ này KHÔNG còn giá trị chứng cứ nguyên bản.';
    } else if (!hasFullPayloads) {
      verdictCode = 'LEGACY_SUMMARY_ONLY_DOSSIER';
      verdictTitleVi = 'TỆP BIÊN BẢN PHIÊN BẢN CŨ (THIẾU PAYLOAD GỐC)';
      verdictDetailVi = 'Tệp này được xuất ở định dạng rút gọn cũ nên không đủ trường payload để băm lại ngoại tuyến; vui lòng tra cứu trực tiếp bằng Mã ca (Case ID) hoặc Block # trên cổng đối chứng.';
    } else if (!allServerMatched) {
      verdictCode = 'HASH_VALID_NOT_FOUND_ON_THIS_SERVER';
      verdictTitleVi = 'CHỮ KÝ SHA-256 NỘI TẠI HỢP LỆ — CHƯA TÌM THẤY TRÊN MÁY CHỦ HIỆN TẠI';
      verdictDetailVi = 'Cấu trúc mật mã SHA-256 của từng Block trong tệp hoàn toàn nguyên vẹn (không bị sửa đổi), nhưng Block này thuộc phiên/môi trường máy chủ khác với sổ cái hiện tại.';
    }

    // Use server blocks as fallback only when legacy dossier lacks payload AND matches server hash
    const blocksForSummary = normalizedBlocks.map((blk) => {
      if (blk.payload) return blk;
      const sb = this.state.blocks.find((s) => s.blockNumber === blk.blockNumber && (!blk.txHash || timingSafeHexEqual(s.txHash, blk.txHash)));
      return sb || blk;
    });
    const processSummary = this.buildCaseProcessSummary(blocksForSummary, null, {
      includeRawPii: zeroPii ? false : includeRawPii,
      networkView: normNet
    });
    const latestServerOrFileBlock = blocksForSummary[blocksForSummary.length - 1] || null;

    return {
      ok: true,
      verified: allCryptographicIntact && allServerMatched && !tamperDetected,
      cryptographicIntact: allCryptographicIntact && !tamperDetected,
      serverLedgerAllMatched: allServerMatched && !tamperDetected,
      tamperDetected,
      networkView: normNet,
      zeroPiiEnforced: zeroPii,
      verdictCode,
      verdictTitleVi,
      verdictDetailVi,
      checkedBlocksCount: normalizedBlocks.length,
      corruptedBlocks,
      blockVerifications,
      processSummary,
      publicAnchor: latestServerOrFileBlock ? this.buildExternalAnchorSummary(latestServerOrFileBlock) : null,
      sysConfig: {
        envName: sysCfg.envName,
        chainId: sysCfg.chainId,
        totalBlocksOnServer: this.state.blocks.length
      }
    };
  }
}

export const blockchainLedgerService = new BlockchainLedgerService();

/**
 * Self-contained ISO/IEC 18004 QR Code Generator (Byte mode, ECC Level L, Versions 1..10)
 * Produces a crisp, offline-capable <svg> with zero external tracking/API calls.
 */
const QR_CAPACITIES_L = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
const QR_EC_CODEWORDS_Per_BLOCK_L = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18];
const QR_NUM_BLOCKS_G1_L = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
const QR_DATA_CW_G1_L = [0, 19, 34, 55, 80, 108, 68, 78, 97, 116, 68];
const QR_NUM_BLOCKS_G2_L = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2];
const QR_DATA_CW_G2_L = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69];
const QR_ALIGN_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50]
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data, degree) {
  const gen = rsGeneratorPoly(degree);
  const rem = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let i = 0; i < degree; i++) {
      rem[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return rem;
}

function getBchDigit(v) {
  let d = 0;
  while (v !== 0) {
    d++;
    v >>>= 1;
  }
  return d;
}

function bchFormatInfo(maskPattern) {
  // ECC Level L = 01
  const data = (0b01 << 3) | maskPattern;
  let d = data << 10;
  while (getBchDigit(d) - getBchDigit(0x537) >= 0) {
    d ^= 0x537 << (getBchDigit(d) - getBchDigit(0x537));
  }
  return ((data << 10) | d) ^ 0x5412;
}

function bchVersionInfo(version) {
  let d = version << 12;
  while (getBchDigit(d) - getBchDigit(0x1f25) >= 0) {
    d ^= 0x1f25 << (getBchDigit(d) - getBchDigit(0x1f25));
  }
  return (version << 12) | d;
}

export function generateQrCodeMatrix(text) {
  const utf8 = Array.from(Buffer.from(String(text || ''), 'utf8'));
  let version = 1;
  while (version <= 10 && utf8.length > QR_CAPACITIES_L[version]) {
    version++;
  }
  if (version > 10) {
    throw new Error(`QR payload exceeds Version 10 capacity (${utf8.length} bytes)`);
  }

  const g1Blocks = QR_NUM_BLOCKS_G1_L[version];
  const g1DataCw = QR_DATA_CW_G1_L[version];
  const g2Blocks = QR_NUM_BLOCKS_G2_L[version];
  const g2DataCw = QR_DATA_CW_G2_L[version];
  const ecCw = QR_EC_CODEWORDS_Per_BLOCK_L[version];
  const totalDataCw = g1Blocks * g1DataCw + g2Blocks * g2DataCw;

  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  // Mode 0100 (Byte), length (8 bits for v1..9, 16 bits for v10+)
  pushBits(0b0100, 4);
  pushBits(utf8.length, version <= 9 ? 8 : 16);
  for (const b of utf8) pushBits(b, 8);

  const maxBits = totalDataCw * 8;
  pushBits(0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < totalDataCw) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Split into blocks & compute Reed-Solomon EC
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < g1Blocks; i++) {
    const block = dataBytes.slice(offset, offset + g1DataCw);
    offset += g1DataCw;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, ecCw));
  }
  for (let i = 0; i < g2Blocks; i++) {
    const block = dataBytes.slice(offset, offset + g2DataCw);
    offset += g2DataCw;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, ecCw));
  }

  const finalCodewords = [];
  const maxBlockLen = Math.max(g1DataCw, g2DataCw);
  for (let col = 0; col < maxBlockLen; col++) {
    for (const blk of dataBlocks) {
      if (col < blk.length) finalCodewords.push(blk[col]);
    }
  }
  for (let col = 0; col < ecCw; col++) {
    for (const blk of ecBlocks) {
      finalCodewords.push(blk[col]);
    }
  }

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunc = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFunc = (r, c, dark) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = Boolean(dark);
    isFunc[r][c] = true;
  };

  const drawFinder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r0 + dr;
        const cc = c0 + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(rr, cc, inOuter && (onBorder || inCenter));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = QR_ALIGN_POS[version];
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) {
        continue;
      }
      const cr = align[i];
      const cc = align[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          setFunc(cr + dr, cc + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // Dark module & reserve format info areas
  setFunc(size - 8, 8, true);
  for (let i = 0; i <= 8; i++) {
    if (!isFunc[8][i]) setFunc(8, i, false);
    if (!isFunc[i][8]) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunc[8][size - 1 - i]) setFunc(8, size - 1 - i, false);
    if (!isFunc[size - 1 - i][8]) setFunc(size - 1 - i, 8, false);
  }
  if (version >= 7) {
    const vInfo = bchVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vInfo >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunc(a, b, bit);
      setFunc(b, a, bit);
    }
  }

  // Place data bits in zigzag
  const allBits = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) allBits.push((cw >>> b) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          const dark = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
          modules[r][c] = dark;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  // Apply Mask 0 ((r + c) % 2 === 0) and write format info
  const maskPattern = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunc[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  const fmt = bchFormatInfo(maskPattern);
  for (let i = 0; i <= 5; i++) modules[i][8] = ((fmt >>> i) & 1) === 1;
  modules[7][8] = ((fmt >>> 6) & 1) === 1;
  modules[8][8] = ((fmt >>> 7) & 1) === 1;
  modules[8][7] = ((fmt >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[8][14 - i] = ((fmt >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = ((fmt >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = ((fmt >>> i) & 1) === 1;

  return modules;
}

export function generateQrCodeSvg(text, { pixelSize = 148, margin = 4, darkColor = '#0f172a', lightColor = '#ffffff' } = {}) {
  const matrix = generateQrCodeMatrix(text);
  const count = matrix.length;
  const viewSize = count + margin * 2;
  const paths = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        paths.push(`M${c + margin},${r + margin}h1v1h-1z`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges" role="img" aria-label="Mã QR xác thực Block"><rect width="100%" height="100%" fill="${lightColor}" rx="2"/><path d="${paths.join('')}" fill="${darkColor}"/></svg>`;
}
