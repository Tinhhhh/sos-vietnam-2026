/**
 * Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K) Hardware SOS API Client for sos-vietnam-2026-FE
 */
const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

export const hardwareSosApi = {
  async getGatewayStatus() {
    const res = await fetch(`${API_BASE}/api/hardware-sos`, { credentials: 'include' });
    return res.json();
  },
  async triggerSimulatedHardwareSos({
    deviceId = 'TDM2421-4G-GPS-01',
    pressStep = 1,
    latitude = 10.03642,
    longitude = 105.78754,
    citizenName = 'Cụ Nguyễn Văn A (78 tuổi)',
    phone = '0988113114',
    signalCsq = 27
  } = {}) {
    const res = await fetch(`${API_BASE}/api/hardware-sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        hardware_model: 'Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)',
        network_mode: '4G_LTE_SIM',
        signal_csq: signalCsq,
        gps_fix: true,
        press_step: pressStep,
        latitude,
        longitude,
        citizen_name: citizenName,
        phone
      })
    });
    return res.json();
  }
};
