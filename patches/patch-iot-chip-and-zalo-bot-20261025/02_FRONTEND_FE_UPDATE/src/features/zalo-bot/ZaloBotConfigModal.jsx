import React, { useEffect, useState } from 'react';
import {
  fetchZaloBotStatus,
  saveZaloBotConfig,
  registerCustomZaloUnit,
  simulateZaloUnitPair,
  sendZaloTestAlert,
  unlinkZaloUnit,
  broadcastZaloAnnouncement
} from './zaloBotApi';

const BROADCAST_TEMPLATES = {
  maintenance: {
    category: 'maintenance',
    title: 'Bảo trì & Cập nhật nâng cấp Hệ thống SOS Việt Nam 2026',
    message:
      'Trung tâm Chỉ huy thông báo: Hệ thống chuẩn bị bảo trì & cập nhật phiên bản mới trong ít phút tới. Trong thời gian nâng cấp, các đơn vị Công an Xã/Phường & lực lượng trực chiến duy trì giữ liên lạc qua bộ đàm / điện thoại trực ban 113-114-115. Hệ thống sẽ báo ngay khi hoàn tất!'
  },
  emergency: {
    category: 'emergency',
    title: 'Công điện trực chiến khẩn cấp 100% quân số',
    message:
      'Yêu cầu toàn bộ Công an Xã/Phường, CSGT, PCCC & CNCH và Y tế 115 kiểm tra thiết bị đầu cuối, bật chuông thông báo Zalo Trực Ban và sẵn sàng xuất phát ngay khi có tín hiệu SOS hoặc Nút bấm phần cứng 4G GPS trên địa bàn!'
  },
  weather: {
    category: 'weather',
    title: 'Cảnh báo Mưa lớn, Dông lốc & Ngập úng cục bộ trên địa bàn',
    message:
      'Dự báo trong các giờ tới có mưa lớn kèm dông lốc và triều cường gây ngập một số tuyến đường trọng điểm. Đề nghị các đơn vị cơ sở chủ động rà soát điểm xung yếu và ưu tiên tiếp nhận nhanh các ca cứu hộ giao thông, cây đổ, ngập nước!'
  },
  recovery: {
    category: 'recovery',
    title: 'Hoàn tất nâng cấp — Hệ thống SOS Việt Nam hoạt động thông suốt 100%',
    message:
      'Quá trình bảo trì & cập nhật nâng cấp máy chủ Trung tâm Chỉ huy đã hoàn tất tốt đẹp. Toàn bộ đường truyền định tuyến SOS tự động, Nút bấm 4G GPS và Tiếp nhận 2 chiều qua Bot Zalo (/tn & Link 1 chạm) đã hoạt động bình thường trở lại!'
  }
};

/**
 * Component React 19 độc lập cho phép gắn vào bất kỳ trang Quản trị / Trực ban React nào
 * trên repo `sos-vietnam-2026-FE` (song song với bản tích hợp sẵn trong `public/dispatcher.html`).
 */
export function ZaloBotConfigModal({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [botToken, setBotToken] = useState('');
  const [demoFastMode, setDemoFastMode] = useState(false);
  const [requirePairingPassword, setRequirePairingPassword] = useState(true);
  const [province, setProvince] = useState('Cần Thơ');
  const [ward, setWard] = useState('Phường Tân An');
  const [agency, setAgency] = useState('police');
  const [generatedCmd, setGeneratedCmd] = useState('/ketnoi cap_tanan Congan@113');
  const [feedback, setFeedback] = useState('');

  // Broadcast state
  const [bcastCategory, setBcastCategory] = useState('maintenance');
  const [bcastScope, setBcastScope] = useState('all');
  const [bcastProvince, setBcastProvince] = useState('');
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastSending, setBcastSending] = useState(false);

  const reloadStatus = async () => {
    try {
      const data = await fetchZaloBotStatus();
      setStatus(data);
      setDemoFastMode(Boolean(data?.demoFastMode));
      setRequirePairingPassword(data?.requirePairingPassword !== false);
      if (data?.viewerPairingCommand) {
        setGeneratedCmd(data.viewerPairingCommand);
      }
    } catch (err) {
      setFeedback(`Lỗi tải trạng thái: ${err.message}`);
    }
  };

  useEffect(() => {
    if (open) reloadStatus();
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    const payload = { enabled: true, demoFastMode, requirePairingPassword };
    if (botToken.trim()) payload.botToken = botToken.trim();
    const updated = await saveZaloBotConfig(payload);
    setStatus(updated?.status || updated);
    setBotToken('');
    setFeedback('✅ Đã lưu cấu hình Bot Zalo & kích hoạt bảo mật trực ban!');
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

  const applyBroadcastTemplate = (key) => {
    const tpl = BROADCAST_TEMPLATES[key];
    if (!tpl) return;
    setBcastCategory(tpl.category);
    setBcastTitle(tpl.title);
    setBcastMessage(tpl.message);
  };

  const handleBroadcastSend = async () => {
    if (!bcastMessage.trim()) {
      setFeedback('⚠️ Vui lòng nhập nội dung thông báo hoặc chọn 1 mẫu có sẵn!');
      return;
    }
    setBcastSending(true);
    try {
      const res = await broadcastZaloAnnouncement({
        category: bcastCategory,
        targetScope: bcastScope,
        provinceFilter: bcastProvince.trim(),
        title: bcastTitle.trim(),
        message: bcastMessage.trim(),
        alsoNotifyWebDispatchers: true
      });
      if (res?.ok) {
        if (res.status) setStatus(res.status);
        setFeedback(`📢 Đã bắn thẳng thông báo tới ${res.totalMatched} nhóm/đơn vị Zalo!`);
      } else {
        setFeedback(`⚠️ ${res?.error || 'Không thể phát thông báo Zalo'}`);
      }
    } catch (err) {
      setFeedback(`❌ Lỗi mạng khi phát thông báo: ${err.message}`);
    } finally {
      setBcastSending(false);
    }
  };

  const boundCount = status?.bindings?.length || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(4,9,20,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 920, maxHeight: '90vh', overflowY: 'auto', background: '#0b1324', color: '#f8fafc', borderRadius: 20, border: '1px solid rgba(56,189,248,0.35)', padding: 24 }}>
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
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 8, cursor: 'pointer', color: '#86efac' }}>
              <input type="checkbox" checked={requirePairingPassword} onChange={e => setRequirePairingPassword(e.target.checked)} />
              <span>🔒 <b>Bắt buộc Mật khẩu Trực ban</b> khi gõ <code>/ketnoi</code> trên Zalo</span>
            </label>
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

        {/* Step 3: Mass Broadcast & Maintenance Notice Composer */}
        <div style={{ padding: 16, borderRadius: 14, background: 'rgba(30,41,59,0.85)', border: '1px solid rgba(251,191,36,0.42)', marginBottom: 18 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8, color: '#fbbf24' }}>
            📢 3. Phát Thông Báo Khẩn Cấp / Bảo Trì & Cập Nhật Hệ Thống (Bắn Thẳng Toàn Bộ Zalo)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <button onClick={() => applyBroadcastTemplate('maintenance')} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(250,204,21,0.5)', background: 'rgba(234,179,8,0.14)', color: '#fde047', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔧 Mẫu Sắp Bảo Trì / Cập Nhật</button>
            <button onClick={() => applyBroadcastTemplate('emergency')} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🚨 Mẫu Công Điện Trực Chiến Khẩn</button>
            <button onClick={() => applyBroadcastTemplate('weather')} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.5)', background: 'rgba(14,165,233,0.14)', color: '#7dd3fc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⛈️ Mẫu Cảnh Báo Mưa Bão / Ngập</button>
            <button onClick={() => applyBroadcastTemplate('recovery')} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✅ Mẫu Hoàn Tất Nâng Cấp</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: 8, marginBottom: 8 }}>
            <select value={bcastCategory} onChange={e => setBcastCategory(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff' }}>
              <option value="maintenance">🔧 Bảo trì & Cập nhật hệ thống</option>
              <option value="emergency">🚨 Công điện & Chỉ đạo khẩn cấp</option>
              <option value="weather">⛈️ Cảnh báo Thiên tai / Mưa bão</option>
              <option value="recovery">✅ Thông báo Hoàn tất nâng cấp</option>
              <option value="general">📢 Thông báo Điều hành chung</option>
            </select>
            <select value={bcastScope} onChange={e => setBcastScope(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff' }}>
              <option value="all">🌐 Toàn bộ đơn vị đã liên kết</option>
              <option value="police">👮 Chỉ Công An Xã/Phường</option>
              <option value="csgt">🚓 Chỉ lực lượng CSGT</option>
              <option value="fire">🚒 Chỉ lực lượng PCCC & CNCH</option>
              <option value="hospital">🚑 Chỉ Cấp Cứu Y Tế 115</option>
              <option value="province_hq">🏛️ Chỉ Trung Tâm Chỉ Huy Tỉnh/QG</option>
            </select>
            <input value={bcastProvince} onChange={e => setBcastProvince(e.target.value)} placeholder="Tất cả Tỉnh/TP (Hoặc lọc VD: Cần Thơ)" style={{ padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff' }} />
          </div>
          <input value={bcastTitle} onChange={e => setBcastTitle(e.target.value)} placeholder="Chủ đề thông báo (VD: Tạm bảo trì nâng cấp máy chủ SOS Việt Nam)" style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontWeight: 700, marginBottom: 8 }} />
          <textarea value={bcastMessage} onChange={e => setBcastMessage(e.target.value)} rows={3} placeholder="Nhập nội dung thông báo khẩn cấp, lịch bảo trì cập nhật hệ thống cần bắn thẳng về Zalo tất cả đơn vị..." style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', marginBottom: 10 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleBroadcastSend} disabled={bcastSending} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ea580c)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              {bcastSending ? '📡 Đang bắn thông báo...' : `📢 BẮN THẲNG CHO TOÀN BỘ (${boundCount} NHÓM ZALO)`}
            </button>
          </div>
        </div>

        <h4 style={{ marginBottom: 8 }}>4. Bộ Mã Đơn Vị Mẫu Sẵn Sàng Test (Kèm Mật Khẩu Trực Ban)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginBottom: 18 }}>
          {(status?.presets || []).map(p => {
            const cmd = p.pairingCommand || `/ketnoi ${p.unitCode}`;
            return (
              <div key={p.unitCode} style={{ padding: 12, borderRadius: 12, background: '#111c33', border: '1px solid #1e293b' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.unitName}</div>
                <div style={{ fontSize: 12, color: '#38bdf8', margin: '4px 0 8px' }}>{cmd}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(cmd); setFeedback(`Đã sao chép ${cmd}`); }}
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
            );
          })}
        </div>

        <h4 style={{ marginBottom: 8 }}>5. Nhóm Zalo Đang Liên Kết ({boundCount})</h4>
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
