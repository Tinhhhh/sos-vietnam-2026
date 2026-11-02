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
import { readRuntimeData, writeRuntimeData } from './runtime-data-store.js';

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
  OFFICER_DISPATCH: '3_OFFICER_DISPATCH',
  CASE_RESOLVED: '4_CASE_RESOLVED',
  CARD_PROVISION_SEAL: '0_CARD_PROVISION_SEAL'
});

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

  return {
    hostname: hostname || 'localhost',
    isProduction,
    envName,
    chainId: activeChainId,
    canonicalChainId: 842026,
    storageFolder,
    networks: {
      '842026': {
        code: '842026',
        label: isProduction
          ? 'SOS VIETNAM CHAIN (ID: 842026)'
          : 'SOS VIETNAM CHAIN (ID: 842026 · SANDBOX 84202600)',
        chainId: activeChainId,
        rpcUrl: process.env.SOS_CHAIN_RPC_URL || '',
        rpcConfigured: true,
        explorerBase: '/api/blockchain/explorer/'
      },
      NDA: {
        code: 'NDA',
        label: 'NDA CHAIN QUỐC GIA',
        chainId: Number(process.env.NDA_CHAIN_ID || 842025),
        rpcUrl: process.env.NDA_CHAIN_RPC_URL || '',
        rpcConfigured: Boolean(process.env.NDA_CHAIN_RPC_URL),
        explorerBase: process.env.NDA_CHAIN_EXPLORER_URL || '/api/blockchain/explorer/'
      },
      POLYGON: {
        code: 'POLYGON',
        label: 'POLYGON AMOY TESTNET',
        chainId: 80002,
        rpcUrl: process.env.POLYGON_AMOY_RPC_URL || '',
        rpcConfigured: Boolean(process.env.POLYGON_AMOY_RPC_URL),
        explorerBase: process.env.POLYGON_AMOY_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/'
      }
    }
  };
}

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

class BlockchainLedgerService {
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
    const clean = raw.toLowerCase();
    return this.state.blocks.find((b) => String(b.txHash || '').toLowerCase() === clean) || null;
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
    return {
      ok: true,
      schemaVersion: this.state.schemaVersion,
      envName: sysCfg.envName,
      chainId: sysCfg.chainId,
      canonicalChainId: 842026,
      storageFolder: sysCfg.storageFolder,
      genesisHash: this.state.genesisHash,
      nextBlockNumber: this.state.nextBlockNumber,
      lastBlockHash: this.state.lastBlockHash,
      totalBlocks: this.state.blocks.length,
      registeredCardsCount: cardsList.length,
      realCardsCount: cardsList.filter((c) => c.isImmutableReal).length,
      testCardsCount: cardsList.filter((c) => !c.isImmutableReal).length,
      networks: sysCfg.networks
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
  for (let i = 0; i <= 5; i++) modules[8][i] = ((fmt >>> i) & 1) === 1;
  modules[8][7] = ((fmt >>> 6) & 1) === 1;
  modules[8][8] = ((fmt >>> 7) & 1) === 1;
  modules[7][8] = ((fmt >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((fmt >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = ((fmt >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = ((fmt >>> i) & 1) === 1;

  return modules;
}

export function generateQrCodeSvg(text, { pixelSize = 148, margin = 3, darkColor = '#0f172a', lightColor = '#ffffff' } = {}) {
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
