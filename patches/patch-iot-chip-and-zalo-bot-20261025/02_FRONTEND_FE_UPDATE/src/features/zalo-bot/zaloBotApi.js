/**
 * Zalo Bot Unified Live Chat, Sticky Lifecycle & 34-Province Directory API Client
 * for sos-vietnam-2026-FE (React 19 + Vite)
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

export const deleteZaloBotExplicitly = () =>
  requestJson('/api/dispatcher/zalo/config', {
    method: 'POST',
    body: JSON.stringify({ clearToken: true, explicitUserDelete: true })
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

export const fetchZaloLiveMessages = ({ chatId = '', limit = 150, folder = 'all' } = {}) =>
  requestJson(
    `/api/dispatcher/zalo/messages?chatId=${encodeURIComponent(chatId)}&limit=${encodeURIComponent(limit)}&folder=${encodeURIComponent(folder)}`,
    { method: 'GET' }
  );

export const sendZaloLiveMessage = ({ chatId, text }) =>
  requestJson('/api/dispatcher/zalo/send-message', {
    method: 'POST',
    body: JSON.stringify({ chatId, text })
  });

export const markZaloConversationRead = (chatId = '__all__') =>
  requestJson('/api/dispatcher/zalo/mark-read', {
    method: 'POST',
    body: JSON.stringify({ chatId })
  });

export const fetchZaloProvinceDirectory = (query = '') =>
  requestJson(`/api/dispatcher/zalo/directory?q=${encodeURIComponent(query)}`, { method: 'GET' });

export const uploadIncidentSceneMedia = (payload, citizenAccessToken = '') =>
  requestJson('/api/sos/media', {
    method: 'POST',
    headers: citizenAccessToken ? { 'x-citizen-access-token': citizenAccessToken } : {},
    body: JSON.stringify(payload)
  });

export const zaloBotApi = {
  getStatus: fetchZaloBotStatus,
  saveConfig: saveZaloBotConfig,
  deleteBotExplicitly: deleteZaloBotExplicitly,
  restoreBackup: restoreZaloBotBackup,
  registerCustomUnit: registerCustomZaloUnit,
  simulatePair: simulateZaloUnitPair,
  sendTestAlert: sendZaloTestAlert,
  updateBinding: updateZaloBinding,
  unlinkUnit: unlinkZaloUnit,
  broadcastAnnouncement: broadcastZaloAnnouncement,
  getLiveMessages: fetchZaloLiveMessages,
  sendLiveMessage: sendZaloLiveMessage,
  markConversationRead: markZaloConversationRead,
  getProvinceDirectory: fetchZaloProvinceDirectory,
  uploadSceneMedia: uploadIncidentSceneMedia
};
