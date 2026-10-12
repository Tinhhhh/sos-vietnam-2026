# -*- coding: utf-8 -*-
"""
Tạo giọng đọc nữ VieNeu-TTS chuẩn studio 48kHz cho nút SOS khẩn cấp
Tuân thủ đầy đủ quy tắc vàng của vieneu-tts:
- Đệm silence 420ms chống nuốt chữ trên di động / bluetooth
- Phiên âm từ viết tắt: 'ét-ô-ét'
- Giọng nữ truyền cảm, dứt khoát, chuẩn chỉnh câu từ cho người dân và trực ban
"""

import os
import sys
import io
import numpy as np
import soundfile as sf
from vieneu import Vieneu

# Đảm bảo UTF-8 cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Thông điệp chính xác, truyền cảm, rõ ràng, dứt khoát
PROMPT_TEXT = (
    "Hệ thống khẩn cấp ét-ô-ét đã kích hoạt. "
    "Xin giữ bình tĩnh, vui lòng chọn đơn vị bạn muốn báo trên màn hình. "
    "Sau đó, thông tin sẽ được chuyển tiếp ngay đến trực ban của đơn vị để điều phối lực lượng cứu hộ."
)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "sounds")

VOICE_CONFIGS = [
    {
        "key": "thuy_dung",
        "voice_name": "Thùy Dung",
        "desc": "⭐ Thùy Dung — Nữ · Nam Bộ · Phong cách tin tức, truyền cảm, ấm áp, dứt khoát"
    },
    {
        "key": "mai_anh",
        "voice_name": "Mai Anh",
        "desc": "⭐ Mai Anh — Nữ · Bắc Bộ · Phong cách tin tức, dõng dạc, rõ câu từ, chuẩn phát thanh"
    },
    {
        "key": "truc_ly",
        "voice_name": "Trúc Ly",
        "desc": "⭐ Trúc Ly — Nữ · Bắc Bộ · Phong cách tự nhiên, nhẹ nhàng, an ủi tâm lý người dân"
    },
    {
        "key": "ngoc_huyen",
        "voice_name": "Ngọc Huyền",
        "desc": "⭐ Ngọc Huyền — Nữ · Bắc Bộ · Giọng chuẩn phổ thông, trong trẻo"
    }
]

def main():
    print("=" * 60)
    print("🎙️ KHỞI TẠO BỘ GIỌNG NỮ VIENEU-TTS CHO NÚT BẤM SOS KHẨN CẤP")
    print(f"Nội dung đọc: \"{PROMPT_TEXT}\"")
    print(f"Thư mục xuất: {OUTPUT_DIR}")
    print("=" * 60)

    tts = Vieneu(mode='v3turbo')
    sr = tts.sample_rate
    print(f"VieNeu-TTS Sample Rate: {sr} Hz")

    lead_silence = 0.42 # 420ms đệm đầu
    tail_silence = 0.42 # 420ms đệm đuôi
    lead = np.zeros(int(sr * lead_silence), dtype=np.float32)
    tail = np.zeros(int(sr * tail_silence), dtype=np.float32)

    for cfg in VOICE_CONFIGS:
        key = cfg["key"]
        vname = cfg["voice_name"]
        print(f"\n[+] Đang tổng hợp giọng: {cfg['desc']}...")

        raw_audio = tts.infer(PROMPT_TEXT, voice=vname)
        if raw_audio.dtype != np.float32:
            raw_audio = raw_audio.astype(np.float32)

        padded = np.concatenate([lead, raw_audio, tail])

        wav_path = os.path.join(OUTPUT_DIR, f"sos_prompt_{key}.wav")
        mp3_path = os.path.join(OUTPUT_DIR, f"sos_prompt_{key}.mp3")

        sf.write(wav_path, padded, sr)
        sf.write(mp3_path, padded, sr)

        dur = len(padded) / sr
        print(f"    ✓ Đã xuất WAV: {wav_path} ({os.path.getsize(wav_path):,} bytes)")
        print(f"    ✓ Đã xuất MP3: {mp3_path} ({os.path.getsize(mp3_path):,} bytes)")
        print(f"    ✓ Thời lượng: {dur:.2f} giây (kèm 420ms padding)")

    print("\n✅ TẤT CẢ GIỌNG ĐỌC NỮ ĐÃ ĐƯỢC XUẤT THÀNH CÔNG VỚI CHẤT LƯỢNG 48KHZ!")

if __name__ == "__main__":
    main()
