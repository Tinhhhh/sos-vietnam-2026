/**
 * Multi-Tier Field Evidence Storage & RAM SHA-256 Sealing Service (ES Module)
 *
 * Implements Spec Section 2 (Hang muc 2) & Section 4 (Hang muc 4):
 *  1. Computes exact SHA-256 ("0x...") on raw binary Buffer IN RAM BEFORE storage.
 *  2. Binary-safe multipart/form-data parser (preserves 0x00..0xFF without UTF-8 corruption).
 *  3. Domain-partitioned storage folder:
 *       - sosvie.site -> SOS_VIETNAM_OFFICIAL
 *       - sos-vietnam-2026.onrender.com / localhost -> SOS_RENDER_SANDBOX
 *  4. Multi-tier storage providers:
 *       - Tier 1: Cloudinary (when CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME+API_KEY+API_SECRET set)
 *       - Tier 2: Supabase Storage (when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set)
 *       - Tier 3: Local AES-256-GCM Encrypted Vault (.runtime-data/evidence-media/...)
 *  5. Live byte-exact retrieval (readEvidenceRawBuffer) for server-side SHA-256 re-hash audit.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { RUNTIME_DATA_DIR } from './runtime-data-store.js';
import { securityCryptoService } from './security-crypto-service.js';
import { resolveSystemBlockchainConfig } from './blockchain-ledger-service.js';

const VAULT_MAGIC = Buffer.from('SOSV1ENC', 'ascii'); // 8-byte header
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const EVIDENCE_VAULT_ROOT = path.join(RUNTIME_DATA_DIR, 'evidence-media');

export function computeSha256Hex(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  return '0x' + crypto.createHash('sha256').update(buf).digest('hex');
}

export function normalizeSha256Hex(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  const clean = trimmed.replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) return '';
  return '0x' + clean;
}

export function sanitizePathToken(value, fallback = 'unknown') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 96);
  return cleaned || fallback;
}

export function inferExtensionFromMime(mimeType = '', fileName = '') {
  const extFromName = path.extname(String(fileName || '')).toLowerCase();
  if (/^\.[a-z0-9]{2,5}$/.test(extFromName)) return extFromName;
  const lower = String(mimeType || '').toLowerCase();
  if (lower.includes('webm') && lower.startsWith('video/')) return '.webm';
  if (lower.includes('webm')) return '.webm';
  if (lower.includes('ogg')) return '.ogg';
  if (lower.includes('mp4') || lower.includes('m4a') || lower.includes('aac')) return '.m4a';
  if (lower.includes('mpeg') || lower.includes('mp3')) return '.mp3';
  if (lower.includes('wav')) return '.wav';
  if (lower.includes('png')) return '.png';
  if (lower.includes('jpeg') || lower.includes('jpg')) return '.jpg';
  return '.bin';
}

/**
 * Binary-safe multipart/form-data parser using Buffer.indexOf only.
 * Never decodes file payload bytes as UTF-8, guaranteeing 100% SHA-256 fidelity.
 */
export function parseMultipartFormData(rawBuffer, contentTypeHeader = '') {
  if (!Buffer.isBuffer(rawBuffer)) {
    throw new Error('Expected raw Buffer for multipart/form-data parsing');
  }
  const match = String(contentTypeHeader || '').match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  const boundaryToken = match ? (match[1] || match[2] || '').trim() : '';
  if (!boundaryToken) {
    throw new Error('Missing multipart/form-data boundary');
  }

  const dashBoundary = Buffer.from(`--${boundaryToken}`, 'utf8');
  const crlfCrlf = Buffer.from('\r\n\r\n', 'utf8');
  const lfLf = Buffer.from('\n\n', 'utf8');
  const fields = {};
  const files = [];

  let cursor = rawBuffer.indexOf(dashBoundary, 0);
  if (cursor === -1) {
    throw new Error('Multipart boundary not found in request body');
  }

  while (cursor !== -1) {
    const partStart = cursor + dashBoundary.length;
    if (rawBuffer[partStart] === 0x2d && rawBuffer[partStart + 1] === 0x2d) {
      // Closing "--boundary--"
      break;
    }

    let headerStart = partStart;
    if (rawBuffer[headerStart] === 0x0d && rawBuffer[headerStart + 1] === 0x0a) {
      headerStart += 2;
    } else if (rawBuffer[headerStart] === 0x0a) {
      headerStart += 1;
    }

    const nextBoundaryIdx = rawBuffer.indexOf(dashBoundary, headerStart);
    if (nextBoundaryIdx === -1) break;

    let headerEnd = rawBuffer.indexOf(crlfCrlf, headerStart);
    let bodyStart = -1;
    if (headerEnd !== -1 && headerEnd < nextBoundaryIdx) {
      bodyStart = headerEnd + 4;
    } else {
      headerEnd = rawBuffer.indexOf(lfLf, headerStart);
      if (headerEnd !== -1 && headerEnd < nextBoundaryIdx) {
        bodyStart = headerEnd + 2;
      }
    }

    if (bodyStart !== -1) {
      let bodyEnd = nextBoundaryIdx;
      if (bodyEnd >= 2 && rawBuffer[bodyEnd - 2] === 0x0d && rawBuffer[bodyEnd - 1] === 0x0a) {
        bodyEnd -= 2;
      } else if (bodyEnd >= 1 && rawBuffer[bodyEnd - 1] === 0x0a) {
        bodyEnd -= 1;
      }

      const rawHeaders = rawBuffer.subarray(headerStart, headerEnd).toString('utf8');
      const partBody = Buffer.from(rawBuffer.subarray(bodyStart, bodyEnd));

      const dispMatch = rawHeaders.match(/content-disposition:\s*form-data;([^\r\n]+)/i);
      if (dispMatch) {
        const dispParams = dispMatch[1];
        const nameMatch = dispParams.match(/\bname="([^"]+)"/i);
        const fileNameMatch = dispParams.match(/\bfilename="([^"]*)"/i);
        const typeMatch = rawHeaders.match(/content-type:\s*([^\r\n;]+(?:;[^\r\n]+)?)/i);
        const fieldName = nameMatch ? nameMatch[1] : '';

        if (fileNameMatch) {
          files.push({
            fieldName: fieldName || 'file',
            fileName: fileNameMatch[1] || 'evidence.webm',
            mimeType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
            buffer: partBody
          });
        } else if (fieldName) {
          fields[fieldName] = partBody.toString('utf8');
        }
      }
    }

    cursor = nextBoundaryIdx;
  }

  return { fields, files };
}

function getCloudinaryCredentials() {
  const urlEnv = String(process.env.CLOUDINARY_URL || '').trim();
  if (urlEnv.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(urlEnv);
      const cloudName = parsed.hostname;
      const apiKey = decodeURIComponent(parsed.username || '');
      const apiSecret = decodeURIComponent(parsed.password || '');
      if (cloudName && apiKey && apiSecret) {
        return { cloudName, apiKey, apiSecret };
      }
    } catch (_) {
      // Ignore malformed CLOUDINARY_URL
    }
  }
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}

function getSupabaseCredentials() {
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();
  const bucket = String(process.env.SUPABASE_EVIDENCE_BUCKET || 'sos-evidence').trim();
  if (url && serviceKey) {
    return { url, serviceKey, bucket };
  }
  return null;
}

function sendHttpBufferRequest(targetUrl, { method = 'GET', headers = {}, body = null, timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      {
        method,
        headers,
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers || {},
            body: Buffer.concat(chunks)
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error(`HTTP request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function uploadToCloudinary({ buffer, mimeType, fileName, folder, publicId, creds }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${creds.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signString, 'utf8').digest('hex');
  const resourceType = String(mimeType || '').toLowerCase().startsWith('image/') ? 'image' : 'video';

  const boundary = `----SOSCloudinaryBoundary${crypto.randomBytes(12).toString('hex')}`;
  const parts = [];
  const pushField = (name, val) => {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`,
        'utf8'
      )
    );
  };
  pushField('api_key', creds.apiKey);
  pushField('timestamp', String(timestamp));
  pushField('folder', folder);
  pushField('public_id', publicId);
  pushField('signature', signature);

  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${sanitizePathToken(fileName, 'evidence.webm')}"\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
      'utf8'
    )
  );
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));

  const payload = Buffer.concat(parts);
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(creds.cloudName)}/${resourceType}/upload`;
  const resp = await sendHttpBufferRequest(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(payload.length)
    },
    body: payload
  });

  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    throw new Error(`Cloudinary upload HTTP ${resp.statusCode}: ${resp.body.toString('utf8').slice(0, 240)}`);
  }
  const parsed = JSON.parse(resp.body.toString('utf8'));
  if (!parsed || !parsed.secure_url) {
    throw new Error('Cloudinary response missing secure_url');
  }
  return {
    storageProvider: 'cloudinary',
    remoteUrl: parsed.secure_url,
    cloudinaryPublicId: parsed.public_id || `${folder}/${publicId}`
  };
}

async function uploadToSupabase({ buffer, mimeType, objectPath, creds }) {
  const encodedObjectPath = objectPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const uploadUrl = `${creds.url}/storage/v1/object/${encodeURIComponent(creds.bucket)}/${encodedObjectPath}`;
  const resp = await sendHttpBufferRequest(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.serviceKey}`,
      apikey: creds.serviceKey,
      'x-upsert': 'true',
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Length': String(buffer.length)
    },
    body: buffer
  });

  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    throw new Error(`Supabase Storage upload HTTP ${resp.statusCode}: ${resp.body.toString('utf8').slice(0, 240)}`);
  }
  const publicOrObjectUrl = `${creds.url}/storage/v1/object/public/${encodeURIComponent(creds.bucket)}/${encodedObjectPath}`;
  const authReadUrl = `${creds.url}/storage/v1/object/authenticated/${encodeURIComponent(creds.bucket)}/${encodedObjectPath}`;
  return {
    storageProvider: 'supabase-storage',
    remoteUrl: publicOrObjectUrl,
    supabaseObjectPath: objectPath,
    supabaseBucket: creds.bucket,
    supabaseAuthReadUrl: authReadUrl
  };
}

export function encryptBinaryAes256Gcm(plainBuffer) {
  const buf = Buffer.isBuffer(plainBuffer) ? plainBuffer : Buffer.from(plainBuffer || []);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', securityCryptoService.aesKey, iv);
  const encryptedPart1 = cipher.update(buf);
  const encryptedPart2 = cipher.final();
  const authTag = cipher.getAuthTag();
  return Buffer.concat([VAULT_MAGIC, iv, authTag, encryptedPart1, encryptedPart2]);
}

export function decryptBinaryAes256Gcm(envelopeBuffer) {
  if (!Buffer.isBuffer(envelopeBuffer) || envelopeBuffer.length < VAULT_MAGIC.length + IV_LENGTH + AUTH_TAG_LENGTH) {
    return {
      ok: false,
      tampered: true,
      reason: 'INVALID_VAULT_ENVELOPE_HEADER',
      buffer: null
    };
  }
  const magic = envelopeBuffer.subarray(0, VAULT_MAGIC.length);
  if (!magic.equals(VAULT_MAGIC)) {
    return {
      ok: false,
      tampered: true,
      reason: 'VAULT_MAGIC_MISMATCH',
      buffer: null
    };
  }
  const iv = envelopeBuffer.subarray(VAULT_MAGIC.length, VAULT_MAGIC.length + IV_LENGTH);
  const authTag = envelopeBuffer.subarray(
    VAULT_MAGIC.length + IV_LENGTH,
    VAULT_MAGIC.length + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = envelopeBuffer.subarray(VAULT_MAGIC.length + IV_LENGTH + AUTH_TAG_LENGTH);

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', securityCryptoService.aesKey, iv);
    decipher.setAuthTag(authTag);
    const plain1 = decipher.update(ciphertext);
    const plain2 = decipher.final();
    return {
      ok: true,
      tampered: false,
      reason: 'OK',
      buffer: Buffer.concat([plain1, plain2])
    };
  } catch (err) {
    return {
      ok: false,
      tampered: true,
      reason: 'AES_GCM_AUTH_TAG_MISMATCH',
      error: err.message,
      buffer: null
    };
  }
}

function writeEncryptedVaultFile({ buffer, storageFolder, incidentId, evidenceId }) {
  const safeFolder = sanitizePathToken(storageFolder, 'SOS_RENDER_SANDBOX');
  const safeIncident = sanitizePathToken(incidentId, 'INC_UNKNOWN');
  const safeEvidence = sanitizePathToken(evidenceId, 'EV_UNKNOWN');
  const relativePath = path.posix.join(safeFolder, safeIncident, `${safeEvidence}.bin.enc`);
  const absolutePath = path.join(EVIDENCE_VAULT_ROOT, safeFolder, safeIncident, `${safeEvidence}.bin.enc`);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true, mode: 0o700 });
  const encryptedEnvelope = encryptBinaryAes256Gcm(buffer);
  const tmpPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpPath, encryptedEnvelope, { mode: 0o600 });
    fs.renameSync(tmpPath, absolutePath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.rmSync(tmpPath, { force: true });
    }
  }
  return {
    vaultRelativePath: relativePath,
    vaultAbsolutePath: absolutePath,
    encryptedBytes: encryptedEnvelope.length
  };
}

export function createEvidenceAccessToken({ incidentId, evidenceId, expiresInMs = 24 * 60 * 60 * 1000 }) {
  return securityCryptoService.signSessionToken(
    {
      purpose: 'sos_evidence_access',
      incidentId: String(incidentId || ''),
      evidenceId: String(evidenceId || '')
    },
    expiresInMs
  );
}

export function verifyEvidenceAccessToken(token, incidentId, evidenceId) {
  const payload = securityCryptoService.verifySessionToken(token);
  if (!payload || payload.purpose !== 'sos_evidence_access') return false;
  if (incidentId && String(payload.incidentId) !== String(incidentId)) return false;
  if (evidenceId && String(payload.evidenceId) !== String(evidenceId)) return false;
  return true;
}

/**
 * Hashes raw field evidence in RAM ("0x" + sha256) FIRST, then persists to
 * Cloudinary / Supabase Storage (partitioned by domain) or AES-256-GCM local vault.
 */
export async function storeFieldEvidence({
  incidentId,
  buffer,
  mimeType = 'audio/webm',
  fileName = '',
  hostname = '',
  clientSha256 = '',
  stealthMode = '',
  chunkIndex = 0,
  durationMs = 5000
} = {}) {
  const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (rawBuffer.length === 0) {
    throw new Error('Field evidence buffer is empty');
  }

  // Step 1: Compute exact SHA-256 in RAM BEFORE any storage mutation
  const sha256Hash = computeSha256Hex(rawBuffer);
  const normalizedClientSha256 = normalizeSha256Hex(clientSha256);
  const clientHashProvided = Boolean(normalizedClientSha256);
  const clientHashMatched = clientHashProvided ? normalizedClientSha256 === sha256Hash : null;

  const sysConfig = resolveSystemBlockchainConfig(hostname);
  const storageFolder = sysConfig.storageFolder; // SOS_VIETNAM_OFFICIAL or SOS_RENDER_SANDBOX
  const ext = inferExtensionFromMime(mimeType, fileName);
  const evidenceId = `EV_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const cleanFileName = sanitizePathToken(fileName || `${evidenceId}${ext}`, `${evidenceId}${ext}`);
  const internalMediaUrl = `/api/sos/evidence-file/${encodeURIComponent(String(incidentId || ''))}/${encodeURIComponent(evidenceId)}`;

  // Always write an AES-256-GCM local vault copy inside SOS_RUNTIME_DATA_DIR/evidence-media
  // so local/container byte-exact verification & offline playback remain fast and deterministic.
  const vaultMeta = writeEncryptedVaultFile({
    buffer: rawBuffer,
    storageFolder,
    incidentId,
    evidenceId
  });

  let storageProvider = 'local-encrypted-vault';
  let mediaUrl = internalMediaUrl;
  let remoteUrl = null;
  let cloudMetadata = null;

  const cloudinaryCreds = getCloudinaryCredentials();
  const supabaseCreds = !cloudinaryCreds ? getSupabaseCredentials() : null;

  if (cloudinaryCreds) {
    const uploaded = await uploadToCloudinary({
      buffer: rawBuffer,
      mimeType,
      fileName: cleanFileName,
      folder: storageFolder,
      publicId: `${sanitizePathToken(incidentId, 'SOS')}_${evidenceId}`,
      creds: cloudinaryCreds
    });
    storageProvider = uploaded.storageProvider;
    remoteUrl = uploaded.remoteUrl;
    mediaUrl = uploaded.remoteUrl;
    cloudMetadata = { cloudinaryPublicId: uploaded.cloudinaryPublicId };
  } else if (supabaseCreds) {
    const objectPath = `${storageFolder}/${sanitizePathToken(incidentId, 'SOS')}/${cleanFileName}`;
    const uploaded = await uploadToSupabase({
      buffer: rawBuffer,
      mimeType,
      objectPath,
      creds: supabaseCreds
    });
    storageProvider = uploaded.storageProvider;
    remoteUrl = uploaded.remoteUrl;
    mediaUrl = internalMediaUrl; // Served cleanly via authenticated route or public bucket
    cloudMetadata = {
      supabaseBucket: uploaded.supabaseBucket,
      supabaseObjectPath: uploaded.supabaseObjectPath
    };
  }

  return {
    evidenceId,
    incidentId: String(incidentId || ''),
    fileName: cleanFileName,
    mimeType: String(mimeType || 'audio/webm'),
    sizeBytes: rawBuffer.length,
    durationMs: Number.isFinite(Number(durationMs)) ? Number(durationMs) : 5000,
    chunkIndex: Number.isFinite(Number(chunkIndex)) ? Number(chunkIndex) : 0,
    stealthMode: String(stealthMode || ''),
    sha256Hash,
    clientSha256: normalizedClientSha256 || null,
    clientHashProvided,
    clientHashMatched,
    storageProvider,
    storageFolder,
    mediaUrl,
    internalMediaUrl,
    remoteUrl,
    vaultRelativePath: vaultMeta.vaultRelativePath,
    cloudMetadata,
    createdAt: Date.now()
  };
}

/**
 * Re-reads the stored raw bytes of an evidence record for playback, legal download,
 * or Live Server-Side SHA-256 Integrity Audit (Hang muc 4).
 */
export async function readEvidenceRawBuffer(record) {
  if (!record || typeof record !== 'object') {
    return {
      ok: false,
      tampered: false,
      reason: 'MISSING_EVIDENCE_RECORD',
      buffer: null
    };
  }

  // Prefer remote cloud source first when storageProvider is cloudinary/supabase so live audit
  // genuinely verifies cloud-stored bytes if cloud storage is active; otherwise verify vault file.
  if (record.storageProvider === 'cloudinary' && record.remoteUrl) {
    try {
      const resp = await sendHttpBufferRequest(record.remoteUrl, { method: 'GET' });
      if (resp.statusCode >= 200 && resp.statusCode < 300 && resp.body.length > 0) {
        return {
          ok: true,
          tampered: false,
          source: 'cloudinary',
          buffer: resp.body
        };
      }
    } catch (_) {
      // Fall through to local encrypted vault mirror if cloud fetch is unreachable
    }
  } else if (record.storageProvider === 'supabase-storage' && record.cloudMetadata?.supabaseObjectPath) {
    const creds = getSupabaseCredentials();
    if (creds) {
      try {
        const encodedPath = record.cloudMetadata.supabaseObjectPath
          .split('/')
          .map((seg) => encodeURIComponent(seg))
          .join('/');
        const readUrl = `${creds.url}/storage/v1/object/${encodeURIComponent(creds.bucket)}/${encodedPath}`;
        const resp = await sendHttpBufferRequest(readUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${creds.serviceKey}`,
            apikey: creds.serviceKey
          }
        });
        if (resp.statusCode >= 200 && resp.statusCode < 300 && resp.body.length > 0) {
          return {
            ok: true,
            tampered: false,
            source: 'supabase-storage',
            buffer: resp.body
          };
        }
      } catch (_) {
        // Fall through to local vault mirror
      }
    }
  }

  if (record.vaultRelativePath) {
    const safeRel = String(record.vaultRelativePath).replace(/\\/g, '/');
    const resolved = path.resolve(EVIDENCE_VAULT_ROOT, safeRel);
    const rootResolved = path.resolve(EVIDENCE_VAULT_ROOT);
    if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
      return {
        ok: false,
        tampered: true,
        reason: 'VAULT_PATH_TRAVERSAL_BLOCKED',
        buffer: null
      };
    }
    if (!fs.existsSync(resolved)) {
      return {
        ok: false,
        tampered: true,
        reason: 'VAULT_FILE_MISSING',
        buffer: null
      };
    }
    const rawEnvelope = fs.readFileSync(resolved);
    const decrypted = decryptBinaryAes256Gcm(rawEnvelope);
    if (!decrypted.ok) {
      return {
        ok: false,
        tampered: true,
        reason: decrypted.reason || 'VAULT_DECRYPT_FAILED',
        corruptedRawSha256: computeSha256Hex(rawEnvelope),
        buffer: null
      };
    }
    return {
      ok: true,
      tampered: false,
      source: 'local-encrypted-vault',
      buffer: decrypted.buffer
    };
  }

  return {
    ok: false,
    tampered: false,
    reason: 'NO_STORAGE_BACKING_AVAILABLE',
    buffer: null
  };
}

export { EVIDENCE_VAULT_ROOT };
