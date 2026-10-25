/**
 * Zalo Bot Hierarchical Dispatch API Client for sos-vietnam-2026-FE (React 19 + Vite)
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

export const zaloBotApi = {
  getStatus: () => requestJson('/api/dispatcher/zalo/status', { method: 'GET' }),
  saveConfig: (payload) =>
    requestJson('/api/dispatcher/zalo/config', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  registerCustomUnit: (payload) =>
    requestJson('/api/dispatcher/zalo/register-unit', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  simulatePair: (payload) =>
    requestJson('/api/dispatcher/zalo/simulate-pair', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  sendTestAlert: (payload = {}) =>
    requestJson('/api/dispatcher/zalo/test-send', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateBinding: (payload) =>
    requestJson('/api/dispatcher/zalo/update-binding', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  unlinkUnit: (payload) =>
    requestJson('/api/dispatcher/zalo/unlink', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
