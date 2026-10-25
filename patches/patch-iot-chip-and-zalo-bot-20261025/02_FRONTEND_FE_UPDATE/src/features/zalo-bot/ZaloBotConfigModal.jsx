import React, { useEffect, useState } from 'react';
import {
  fetchZaloBotStatus,
  saveZaloBotConfig,
  registerCustomZaloUnit,
  simulateZaloUnitPair,
  sendZaloTestAlert,
  unlinkZaloUnit
} from './zaloBotApi';

/**
 * Component React 19 độc lập cho phép gắn vào bất kỳ trang Quản trị / Trực ban React nào
 * trên repo `sos-vietnam-2026-FE` (song song với bản tích hợp sẵn trong `public/dispatcher.html`).
 */
export function ZaloBotConfigModal({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [botToken, setBotToken] = useState('');
  const [demoFastMode, setDemoFastMode] = useState(false);
  const [province, setProvince] = useState('Cần Thơ');
  const [ward, setWard] = useState('Phường Tân An');
  const [agency, setAgency] = useState('police');
  const [generatedCmd, setGeneratedCmd] = useState('/ketnoi cap_tanan');
  const [feedback, setFeedback] = useState('');

  const reloadStatus = async () => {
    try {
      const data = await fetchZaloBotStatus();
      setStatus(data);
      setDemoFastMode(Boolean(data?.demoFastMode));
    } catch (err) {
      setFeedback(`Lỗi tải trạng thái: ${err.message}`);
    }
  };

  useEffect(() => {
    if (open) reloadStatus();
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    const payload = { enabled: true, demoFastMode };
    if (botToken.trim()) payload.botToken = botToken.trim();
    const updated = await saveZaloBotConfig(payload);
    setStatus(updated);
    setBotToken('');
    setFeedback('✅ Đã lưu cấu hình Bot Zalo & kích hoạt chế độ trực ban!');
  };

  const handleGenerateCmd = async () => {
    const level = agency === 'police' ? 'ward' : 'province';
    const res = await registerCustomZaloUnit({
      province,
      ward: level === 'ward' ? ward : '',
      agency,
      level
    });
    if (res?.command) {
      setGeneratedCmd(res.command);
      await navigator.clipboard?.writeText(res.command).catch(() => {});
      setFeedback(`📋 Đã tạo & sao chép lệnh: ${res.command}`);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(4,9,20,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto', background: '#0b1324', color: '#f8fafc', borderRadius: 20, border: '1px solid rgba(56,189,248,0.35)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>💬 TRUNG TÂM ĐIỀU PHỐI BOT ZALO TRỰC BAN 2 CHIỀU</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Đóng ✕</button>
        </div>

        {feedback && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', marginBottom: 14, fontSize: 13 }}>
            {feedback}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 18 }}>
          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <h4 style={{ marginTop: 0, color: '#38bdf8' }}>1. Cấu hình BOT_TOKEN (bot.zaloplatforms.com)</h4>
            <input
              type="password"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder={status?.hasToken ? `Đang lưu: ${status.maskedToken}` : 'Dán BOT_TOKEN từ Zalo Bot Platform...'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#090f1d', color: '#fff', marginBottom: 10 }}
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={demoFastMode} onChange={e => setDemoFastMode(e.target.checked)} />
              <span>Chế độ Demo nhanh: Nhắc khẩn <b>20 giây</b> / Leo thang Tỉnh <b>45 giây</b></span>
            </label>
            <button onClick={handleSave} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Lưu Cấu Hình & Kích Hoạt
            </button>
          </div>

          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <h4 style={{ marginTop: 0, color: '#34d399' }}>2. Tạo mã /ketnoi cho Xã/Phường (Không cần SĐT)</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={province} onChange={e => setProvince(e.target.value)} placeholder="Tỉnh/TP" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff' }} />
              <input value={ward} onChange={e => setWard(e.target.value)} placeholder="Xã/Phường" style={{ flex: 1, padding: 8, borderRadius: 8, background: '#090f1d', border: '1px solid #334155', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select value={agency} onChange={e => setAgency(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff' }}>
                <option value="police">Công An Xã/Phường</option>
                <option value="csgt">Đội CSGT</option>
                <option value="fire">Đội PCCC & CNCH</option>
                <option value="all">Chỉ Huy Cấp Tỉnh/TP</option>
              </select>
              <button onClick={handleGenerateCmd} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Tạo & Copy</button>
            </div>
            <code style={{ display: 'block', padding: 10, borderRadius: 8, background: '#050a14', color: '#6ee7b7', fontWeight: 700 }}>{generatedCmd}</code>
          </div>
        </div>

        <h4 style={{ marginBottom: 8 }}>3. Bộ Mã Đơn Vị Mẫu Sẵn Sàng Test</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginBottom: 18 }}>
          {(status?.presets || []).map(p => (
            <div key={p.unitCode} style={{ padding: 12, borderRadius: 12, background: '#111c33', border: '1px solid #1e293b' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{p.unitName}</div>
              <div style={{ fontSize: 12, color: '#38bdf8', margin: '4px 0 8px' }}>/ketnoi {p.unitCode}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`/ketnoi ${p.unitCode}`); setFeedback(`Đã sao chép /ketnoi ${p.unitCode}`); }}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid #38bdf8', background: 'transparent', color: '#7dd3fc', cursor: 'pointer', fontSize: 12 }}
                >
                  Copy Lệnh
                </button>
                <button
                  onClick={async () => { await simulateZaloUnitPair({ unitCode: p.unitCode }); await reloadStatus(); setFeedback(`Đã gắn giả lập ${p.unitName}`); }}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid #10b981', background: 'transparent', color: '#6ee7b7', cursor: 'pointer', fontSize: 12 }}
                >
                  Gắn Giả Lập
                </button>
              </div>
            </div>
          ))}
        </div>

        <h4 style={{ marginBottom: 8 }}>4. Nhóm Zalo Đang Liên Kết ({status?.bindings?.length || 0})</h4>
        {(status?.bindings || []).map(b => (
          <div key={`${b.chatId}_${b.unitCode}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, background: '#0f172a', border: '1px solid #1e293b', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{b.chatTitle} — <span style={{ color: '#34d399' }}>{b.unitName}</span></div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Chat ID: {b.chatId} | Mã: {b.unitCode}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={async () => { await sendZaloTestAlert(b.chatId); await reloadStatus(); setFeedback(`Đã gửi tin test tới ${b.chatTitle}`); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #38bdf8', background: 'transparent', color: '#7dd3fc', cursor: 'pointer', fontSize: 12 }}>Bắn Test</button>
              <button onClick={async () => { await unlinkZaloUnit(b.chatId, b.unitCode); await reloadStatus(); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>Ngắt</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
