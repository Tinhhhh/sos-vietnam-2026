/**
 * Zalo Bot Hierarchical Dispatch & Mass Broadcast API Client for sos-vietnam-2026-FE (React 19 + Vite)
 */
const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

async function requestJson(path, options = {}) {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });
  return res.json();
}

export const fetchZaloBotStatus = () =>
  requestJson('/api/dispatcher/zalo/status', { method: 'GET' });

export const saveZaloBotConfig = (payload) =>
  requestJson('/api/dispatcher/zalo/config', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const registerCustomZaloUnit = (payload) =>
  requestJson('/api/dispatcher/zalo/register-unit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const simulateZaloUnitPair = (payload) =>
  requestJson('/api/dispatcher/zalo/simulate-pair', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const sendZaloTestAlert = (chatIdOrPayload = {}) => {
  const payload = typeof chatIdOrPayload === 'string' ? { chatId: chatIdOrPayload } : chatIdOrPayload;
  return requestJson('/api/dispatcher/zalo/test-send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateZaloBinding = (payload) =>
  requestJson('/api/dispatcher/zalo/update-binding', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const unlinkZaloUnit = (chatIdOrPayload, unitCode = '') => {
  const payload = typeof chatIdOrPayload === 'string'
    ? { chatId: chatIdOrPayload, unitCode }
    : (chatIdOrPayload || {});
  return requestJson('/api/dispatcher/zalo/unlink', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const broadcastZaloAnnouncement = (payload) =>
  requestJson('/api/dispatcher/zalo/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const restoreZaloBotBackup = (payload) =>
  requestJson('/api/dispatcher/zalo/restore-backup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const uploadIncidentSceneMedia = (payload, citizenAccessToken = '') =>
  requestJson('/api/sos/media', {
    method: 'POST',
    headers: citizenAccessToken ? { 'x-citizen-access-token': citizenAccessToken } : {},
    body: JSON.stringify(payload)
  });

export const zaloBotApi = {
  getStatus: fetchZaloBotStatus,
  saveConfig: saveZaloBotConfig,
  restoreBackup: restoreZaloBotBackup,
  registerCustomUnit: registerCustomZaloUnit,
  simulatePair: simulateZaloUnitPair,
  sendTestAlert: sendZaloTestAlert,
  updateBinding: updateZaloBinding,
  unlinkUnit: unlinkZaloUnit,
  broadcastAnnouncement: broadcastZaloAnnouncement,
  uploadSceneMedia: uploadIncidentSceneMedia
};
