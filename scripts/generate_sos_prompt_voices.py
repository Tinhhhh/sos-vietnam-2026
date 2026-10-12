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
import subprocess
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

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(REPO_ROOT, "assets", "sounds")
TEMP_DIR = os.path.join(REPO_ROOT, ".tmp")

# Tốc độ đọc: nhanh thêm 0.2x (tức 1.2x speed)
TEMPO_FACTOR = 1.20

VOICE_CONFIGS = [
    {
        "key": "tay_nam_bo",
        "aliases": ["my_duyen"],
        "voice_name": "Mỹ Duyên",
        "region_title": "Tây Nam Bộ (Cần Thơ & ĐBSCL)",
        "desc": "⭐ Mỹ Duyên — Nữ · Tây Nam Bộ (Đồng bằng sông Cửu Long / Cần Thơ) · Ngọt ngào, chất phác, gần gũi"
    },
    {
        "key": "mien_nam",
        "aliases": ["thuy_dung"],
        "voice_name": "Thùy Dung",
        "region_title": "Miền Nam (Sài Gòn & Đông Nam Bộ)",
        "desc": "⭐ Thùy Dung — Nữ · Miền Nam (Đông Nam Bộ / Sài Gòn) · Tin tức hiện đại, dứt khoát, thanh thoát"
    },
    {
        "key": "mien_trung",
        "aliases": ["ngoc_tran"],
        "voice_name": "Ngọc Trân",
        "region_title": "Miền Trung (Đà Nẵng, Huế & Miền Trung)",
        "desc": "⭐ Ngọc Trân — Nữ · Miền Trung (Đà Nẵng / Huế) · Nồng ấm, chân phương, chuẩn ngữ điệu Trung Bộ"
    },
    {
        "key": "mien_bac",
        "aliases": ["mai_anh"],
        "voice_name": "Mai Anh",
        "region_title": "Miền Bắc (Hà Nội & Bắc Bộ)",
        "desc": "⭐ Mai Anh — Nữ · Miền Bắc (Hà Nội) · Chuẩn phát thanh viên truyền hình, rõ ràng, dõng dạc"
    }
]

def main():
    print("=" * 60)
    print("🎙️ KHỞI TẠO BỘ 4 GIỌNG NỮ 4 MIỀN VIENEU-TTS CHO NÚT BẤM SOS KHẨN CẤP")
    print(f"Nội dung đọc: \"{PROMPT_TEXT}\"")
    print(f"Tốc độ đọc: {TEMPO_FACTOR}x (+0.2x nhanh hơn)")
    print(f"Thư mục xuất: {OUTPUT_DIR}")
    print("=" * 60)

    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

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

        # 1. Ghi âm thanh gốc vào thư mục tạm trong repo
        temp_raw_path = os.path.join(TEMP_DIR, f"temp_raw_{key}.wav")
        temp_stretched_path = os.path.join(TEMP_DIR, f"temp_stretched_{key}.wav")
        sf.write(temp_raw_path, raw_audio, sr)

        # 2. Áp dụng time-stretching 1.2x bảo toàn cao độ (pitch-preserved) bằng ffmpeg atempo
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", temp_raw_path,
            "-filter:a", f"atempo={TEMPO_FACTOR}",
            "-ar", str(sr),
            temp_stretched_path
        ]
        res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"    [!] Lỗi ffmpeg atempo: {res.stderr}")
            stretched_audio = raw_audio
        else:
            stretched_audio, read_sr = sf.read(temp_stretched_path, dtype='float32')

        # 3. Nối padding 420ms chống cắt đầu/đuôi
        padded = np.concatenate([lead, stretched_audio, tail])

        wav_path = os.path.join(OUTPUT_DIR, f"sos_prompt_{key}.wav")
        mp3_path = os.path.join(OUTPUT_DIR, f"sos_prompt_{key}.mp3")

        sf.write(wav_path, padded, sr)
        # Xuất MP3 chuẩn 192kbps 48kHz
        ffmpeg_mp3 = [
            "ffmpeg", "-y",
            "-i", wav_path,
            "-b:a", "192k",
            "-ar", str(sr),
            mp3_path
        ]
        subprocess.run(ffmpeg_mp3, capture_output=True, text=True)

        dur = len(padded) / sr
        raw_dur = len(raw_audio) / sr
        print(f"    ✓ Vùng miền: {cfg.get('region_title')}")
        print(f"    ✓ Thời lượng gốc (1.0x): {raw_dur:.2f}s -> Tốc độ mới (1.2x): {dur:.2f}s (kèm 420ms padding)")
        print(f"    ✓ Đã xuất WAV: {wav_path} ({os.path.getsize(wav_path):,} bytes)")
        print(f"    ✓ Đã xuất MP3: {mp3_path} ({os.path.getsize(mp3_path):,} bytes)")

        # Đồng bộ sang các tên alias
        for alias in cfg.get("aliases", []):
            alias_wav = os.path.join(OUTPUT_DIR, f"sos_prompt_{alias}.wav")
            alias_mp3 = os.path.join(OUTPUT_DIR, f"sos_prompt_{alias}.mp3")
            sf.write(alias_wav, padded, sr)
            subprocess.run(["ffmpeg", "-y", "-i", alias_wav, "-b:a", "192k", "-ar", str(sr), alias_mp3], capture_output=True)
            print(f"    ✓ Đã tạo alias tương thích: {alias} (WAV & MP3)")

        # Xóa file tạm
        try:
            if os.path.exists(temp_raw_path): os.remove(temp_raw_path)
            if os.path.exists(temp_stretched_path): os.remove(temp_stretched_path)
        except Exception:
            pass

    print(f"\n✅ TẤT CẢ GIỌNG ĐỌC NỮ ĐÃ ĐƯỢC XUẤT THÀNH CÔNG VỚI TỐC ĐỘ {TEMPO_FACTOR}X (48KHZ)!")

if __name__ == "__main__":
    main()
