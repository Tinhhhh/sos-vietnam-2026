import React, { useEffect, useState } from 'react';
import {
  fetchZaloBotStatus,
  saveZaloBotConfig,
  deleteZaloBotExplicitly,
  restoreZaloBotBackup,
  registerCustomZaloUnit,
  simulateZaloUnitPair,
  sendZaloTestAlert,
  unlinkZaloUnit,
  broadcastZaloAnnouncement,
  fetchZaloLiveMessages,
  sendZaloLiveMessage,
  markZaloConversationRead,
  fetchZaloProvinceDirectory
} from './zaloBotApi';

const VAULT_KEY = 'sos_zalo_bot_vault_v1';
const readVault = () => {
  try {
    return JSON.parse(localStorage.getItem(VAULT_KEY) || '{}');
  } catch {
    return {};
  }
};
const writeVault = (patch = {}) => {
  try {
    const next = { ...readVault(), ...patch, updatedAt: new Date().toISOString() };
    localStorage.setItem(VAULT_KEY, JSON.stringify(next));
  } catch {}
};

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
 * Component React 19 tích hợp Bảng Chat Zalo Trực Tiếp 2 Chiều + Thanh Bot Duy Trì Liên Tục + Sổ 34 Tỉnh/TP (`/kn`)
 */
export function ZaloBotConfigModal({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [botToken, setBotToken] = useState('');
  const [demoFastMode, setDemoFastMode] = useState(false);
  const [requirePairingPassword, setRequirePairingPassword] = useState(true);
  const [province, setProvince] = useState('Cần Thơ');
  const [ward, setWard] = useState('Phường Tân An');
  const [agency, setAgency] = useState('police');
  const [generatedShortCmd, setGeneratedShortCmd] = useState('/kn ct.tanan Congan@113');
  const [feedback, setFeedback] = useState('');

  // Live Chat Board state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [replyText, setReplyText] = useState('');

  // 34-Province Directory state
  const [dirSearch, setDirSearch] = useState('');
  const [provincesDir, setProvincesDir] = useState([]);

  // Broadcast state
  const [bcastCategory, setBcastCategory] = useState('maintenance');
  const [bcastScope, setBcastScope] = useState('all');
  const [bcastProvince, setBcastProvince] = useState('');
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastSending, setBcastSending] = useState(false);

  const reloadStatus = async () => {
    try {
      let data = await fetchZaloBotStatus();
      const vault = readVault();
      const explicitlyCleared = Boolean(data?.botExplicitlyCleared || vault.botExplicitlyCleared);
      const needsTokenRestore = !data?.hasToken && !explicitlyCleared && Boolean(vault.botToken);
      const needsBindingsRestore = (data?.bindings || []).length === 0 && (vault.bindings || []).length > 0;

      if (data && (needsTokenRestore || needsBindingsRestore)) {
        const restored = await restoreZaloBotBackup({
          botToken: needsTokenRestore ? vault.botToken : '',
          demoFastMode: vault.demoFastMode,
          requirePairingPassword: vault.requirePairingPassword,
          bindings: needsBindingsRestore ? (vault.bindings || []) : []
        });
        if (restored?.status) data = restored.status;
      }

      setStatus(data);
      setDemoFastMode(Boolean(data?.demoFastMode));
      setRequirePairingPassword(data?.requirePairingPassword !== false);
      const realBindings = (data?.bindings || []).filter((b) => b?.chatId && !String(b.chatId).startsWith('zalo_sim_'));
      writeVault({
        demoFastMode: Boolean(data?.demoFastMode),
        requirePairingPassword: data?.requirePairingPassword !== false,
        ...(data?.hasToken ? { botExplicitlyCleared: false } : {}),
        ...(data?.botExplicitlyCleared ? { botExplicitlyCleared: true } : {}),
        ...(realBindings.length > 0 ? { bindings: realBindings } : {})
      });
      if (data?.viewerShortCommand) {
        setGeneratedShortCmd(data.viewerShortCommand);
      }

      const [chatBoard, dirResp] = await Promise.all([
        fetchZaloLiveMessages({ limit: 150 }),
        fetchZaloProvinceDirectory(dirSearch)
      ]);
      if (chatBoard?.ok) {
        setConversations(chatBoard.conversations || []);
        setMessages(chatBoard.messages || []);
        if (!selectedChatId && (chatBoard.conversations || []).length > 0) {
          setSelectedChatId(chatBoard.conversations[0].chatId);
        }
      }
      if (dirResp?.ok) {
        setProvincesDir(dirResp.provinces || []);
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
    const cleanTok = botToken.trim();
    const enteredRealToken = Boolean(cleanTok && !cleanTok.includes('••••'));
    const payload = { enabled: true, demoFastMode, requirePairingPassword };
    if (enteredRealToken) payload.botToken = cleanTok;
    const updated = await saveZaloBotConfig(payload);
    if (enteredRealToken) writeVault({ botToken: cleanTok, botExplicitlyCleared: false });
    setStatus(updated?.status || updated);
    setBotToken('');
    setFeedback('✅ Đã lưu & khóa duy trì Bot Zalo liên tục 24/7!');
  };

  const handleDeleteBot = async () => {
    const res = await deleteZaloBotExplicitly();
    writeVault({ botToken: '', botExplicitlyCleared: true });
    if (res?.status) setStatus(res.status);
    setBotToken('');
    setFeedback('🗑️ Đã xóa dứt điểm Bot Zalo hiện tại theo yêu cầu.');
  };

  const handleGenerateCmd = async () => {
    const level = agency === 'police' ? 'ward' : 'province';
    const res = await registerCustomZaloUnit({
      province,
      ward: level === 'ward' ? ward : '',
      agency,
      level
    });
    const shortCmd = res?.shortCommand || res?.command;
    if (shortCmd) {
      setGeneratedShortCmd(shortCmd);
      await navigator.clipboard?.writeText(shortCmd).catch(() => {});
      setFeedback(`📋 Đã tạo & sao chép lệnh ngắn: ${shortCmd}`);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    const targetChat = selectedChatId || conversations[0]?.chatId || status?.bindings?.[0]?.chatId;
    if (!targetChat) {
      setFeedback('⚠️ Chưa chọn nhóm Zalo để gửi tin nhắn!');
      return;
    }
    const res = await sendZaloLiveMessage({ chatId: targetChat, text: replyText.trim() });
    if (res?.ok) {
      setReplyText('');
      if (res.chatMessage) setMessages((prev) => [...prev, res.chatMessage]);
      if (res.conversations) setConversations(res.conversations);
    }
  };

  const handleSearchDir = async (q) => {
    setDirSearch(q);
    const resp = await fetchZaloProvinceDirectory(q);
    if (resp?.ok) setProvincesDir(resp.provinces || []);
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
  const visibleMessages = selectedChatId ? messages.filter((m) => m.chatId === selectedChatId) : messages;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(4,9,20,0.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ width: '100%', maxWidth: 1180, maxHeight: '92vh', overflowY: 'auto', background: '#0b1324', color: '#f8fafc', borderRadius: 18, border: '1px solid rgba(56,189,248,0.4)', padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>💬 BẢNG CHAT ZALO TRỰC TIẾP & ĐIỀU PHỐI BOT 2 CHIỀU</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 8, padding: '5px 11px', cursor: 'pointer' }}>Đóng ✕</button>
        </div>

        {feedback && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', marginBottom: 12, fontSize: 12.5 }}>
            {feedback}
          </div>
        )}

        {/* Unified Compact Sticky Bot Bar */}
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(56,189,248,0.35)', marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>🤖 Bot Zalo:</span>
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={status?.hasToken ? `Đang duy trì liên tục: ${status.maskedToken}` : 'Dán BOT_TOKEN để thêm / đặt lại Bot mới...'}
            style={{ flex: 1, minWidth: 220, padding: '7px 10px', borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }}
          />
          {status?.hasToken && (
            <button onClick={handleDeleteBot} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.18)', color: '#fca5a5', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              Xóa Bot
            </button>
          )}
          <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11.5, color: '#86efac', cursor: 'pointer' }}>
            <input type="checkbox" checked={requirePairingPassword} onChange={(e) => setRequirePairingPassword(e.target.checked)} />
            <span>🔒 Khóa MK /kn</span>
          </label>
          <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11.5, color: '#fde047', cursor: 'pointer' }}>
            <input type="checkbox" checked={demoFastMode} onChange={(e) => setDemoFastMode(e.target.checked)} />
            <span>⚡ Demo 20s/45s</span>
          </label>
          <button onClick={handleSave} style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            💾 Lưu / Đặt Lại Bot
          </button>
        </div>

        {/* 2-Column Workspace: [34-Province Directory] + [Live Two-Way Chat Board] */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.28)' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#38bdf8', marginBottom: 6 }}>📂 Sổ Kết Nối Nhóm 34 Tỉnh / Thành Phố ({provincesDir.length} Tỉnh/TP)</div>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#34d399', fontWeight: 700 }}>Lệnh ngắn hiện tại: <code>{generatedShortCmd}</code></div>
            <input
              value={dirSearch}
              onChange={(e) => handleSearchDir(e.target.value)}
              placeholder="🔍 Tìm TP. Cần Thơ, TP.HCM, Thành phố Hà Nội, Tân An, ct.tanan..."
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12, marginBottom: 8 }}
            />
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {provincesDir.map((prov) => (
                <details key={prov.provCode} style={{ background: '#111c33', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12.5 }}>
                    📁 {prov.displayTitle} <span style={{ color: '#7dd3fc', fontSize: 11 }}>(/kn {prov.provCode}.*)</span>
                  </summary>
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
                    {[...(prov.provincialUnits || []), ...(prov.wards || [])].map((u) => (
                      <div key={u.shortCode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '4px 6px', background: '#090f1d', borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700 }}>{u.unitName}</div>
                          <code style={{ fontSize: 11, color: '#34d399' }}>{u.shortCommand}</code>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(u.shortCommand); setFeedback(`Đã sao chép ${u.shortCommand}`); }}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #eab308', background: 'transparent', color: '#fde047', fontSize: 11, cursor: 'pointer' }}
                        >
                          Copy /kn
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#6ee7b7', marginBottom: 8 }}>💬 Bảng Chat Zalo Trực Tiếp 2 Chiều</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
              {conversations.map((c) => (
                <button
                  key={c.chatId}
                  onClick={() => { setSelectedChatId(c.chatId); markZaloConversationRead(c.chatId); }}
                  style={{ padding: '4px 9px', borderRadius: 8, border: selectedChatId === c.chatId ? '1px solid #10b981' : '1px solid #334155', background: selectedChatId === c.chatId ? 'rgba(16,185,129,0.2)' : '#090f1d', color: '#fff', fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {c.shortCode ? `[${c.shortCode}] ` : ''}{c.title || c.unitName || c.chatId}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: 230, maxHeight: 280, overflowY: 'auto', background: '#050a14', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {visibleMessages.map((m) => (
                <div
                  key={m.id}
                  style={{ alignSelf: m.direction === 'out' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '6px 10px', borderRadius: 8, background: m.direction === 'out' ? 'rgba(6,78,59,0.6)' : '#111c33', fontSize: 12 }}
                >
                  <div style={{ fontSize: 10, color: '#94a3b8' }}><b>{m.senderName}</b></div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                placeholder="Nhập tin nhắn trả lời trực tiếp vào nhóm Zalo..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }}
              />
              <button onClick={handleSendReply} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                📨 Gửi Zalo
              </button>
            </div>
          </div>
        </div>

        {/* Custom Unit + Broadcast */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Tỉnh/TP" style={{ padding: 7, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }} />
          <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Xã/Phường" style={{ padding: 7, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }} />
          <select value={agency} onChange={(e) => setAgency(e.target.value)} style={{ padding: 7, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }}>
            <option value="police">Công An Xã/Phường</option>
            <option value="csgt">Đội CSGT</option>
            <option value="fire">Đội PCCC & CNCH</option>
            <option value="all">Chỉ Huy Cấp Tỉnh/TP</option>
          </select>
          <button onClick={handleGenerateCmd} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Tạo & Copy /kn</button>
        </div>

        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(30,41,59,0.85)', border: '1px solid rgba(251,191,36,0.42)', marginBottom: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <button onClick={() => applyBroadcastTemplate('maintenance')} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid rgba(250,204,21,0.5)', background: 'rgba(234,179,8,0.14)', color: '#fde047', fontSize: 11.5, cursor: 'pointer' }}>🔧 Mẫu Bảo Trì</button>
            <button onClick={() => applyBroadcastTemplate('emergency')} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', fontSize: 11.5, cursor: 'pointer' }}>🚨 Công Điện Khẩn</button>
            <button onClick={() => applyBroadcastTemplate('weather')} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid rgba(56,189,248,0.5)', background: 'rgba(14,165,233,0.14)', color: '#7dd3fc', fontSize: 11.5, cursor: 'pointer' }}>⛈️ Cảnh Báo Mưa Bão</button>
            <button onClick={() => applyBroadcastTemplate('recovery')} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.14)', color: '#6ee7b7', fontSize: 11.5, cursor: 'pointer' }}>✅ Hoàn Tất Nâng Cấp</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input value={bcastTitle} onChange={(e) => setBcastTitle(e.target.value)} placeholder="Chủ đề thông báo..." style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }} />
            <input value={bcastProvince} onChange={(e) => setBcastProvince(e.target.value)} placeholder="Lọc Tỉnh/TP" style={{ width: 160, padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12 }} />
          </div>
          <textarea value={bcastMessage} onChange={(e) => setBcastMessage(e.target.value)} rows={2} placeholder="Nội dung công điện bắn thẳng về Zalo..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#090f1d', color: '#fff', fontSize: 12, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => sendZaloTestAlert()} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #38bdf8', background: 'transparent', color: '#7dd3fc', fontSize: 12, cursor: 'pointer' }}>Bắn Test Tất Cả</button>
            <button onClick={handleBroadcastSend} disabled={bcastSending} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ea580c)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              {bcastSending ? '📡 Đang bắn...' : `📢 BẮN TOÀN BỘ (${boundCount} NHÓM)`}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
          {(status?.bindings || []).map((b) => (
            <div key={`${b.chatId}_${b.unitCode}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 9, borderRadius: 8, background: '#0f172a', border: '1px solid #1e293b' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{b.chatTitle} — <span style={{ color: '#34d399' }}>{b.unitName}</span></div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Mã: /kn {b.shortCode || b.unitCode}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => simulateZaloUnitPair({ unitCode: b.unitCode }).then(reloadStatus)} style={{ display: 'none' }} />
                <button onClick={() => unlinkZaloUnit(b.chatId, b.unitCode).then(reloadStatus)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ef4444', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 11 }}>Gỡ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
