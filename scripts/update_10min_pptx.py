# -*- coding: utf-8 -*-
"""
Script: update_10min_pptx.py
Purpose: Updates SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx:
         1. Updates 453 to 874 across Slide 6 and Slide 9.
         2. Adds 4 Regional AI Voice Prompts (VieNeu-TTS at 1.2x) and centered SOS Orb.
         3. Adds Decree 30 dynamic document numbering (/BC-TTCH, /BC-CATP, /BC-CSGT...).
         4. Strict removal of CATT / Thị trấn.
"""

import os
import sys
import shutil
from pptx import Presentation

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PATHS = [
    r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx",
    r"C:\Users\dienv\Desktop\docs\thuyết trình\SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx"
]

def update_pptx_deck(p):
    if not os.path.exists(p):
        print(f"[SKIP] Not found: {p}")
        return
    prs = Presentation(p)
    modified = 0

    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    txt = para.text
                    new_txt = txt
                    if "453" in new_txt:
                        new_txt = new_txt.replace("453 đơn vị", "874 trạm tác chiến (846 tài khoản)")
                        new_txt = new_txt.replace("453", "874")
                    if "Công an Xã/Thị trấn" in new_txt:
                        new_txt = new_txt.replace("Công an Xã/Thị trấn", "Công an Xã/Phường")
                    if "Thị trấn" in new_txt:
                        new_txt = new_txt.replace("Thị trấn", "Xã/Phường")
                    if "Nút Master SOS 1-Chạm: Chống bấm nhầm" in new_txt:
                        new_txt = "✓ Nút Master SOS 1-Chạm: Quả cầu SOS Orb căn giữa tâm sóng video; Trợ lý AI giọng nói 4 vùng miền (VieNeu-TTS) tốc độ 1.2x."
                    if "Xuất phiếu Word & Ký số: Tự động sinh phiếu Word" in new_txt:
                        new_txt = "✓ Xuất phiếu Word & Ký số: 100% Times New Roman, ký hiệu chuẩn động (/BC-TTCH, /BC-CATP, /BC-CSGT... không dùng CATT) chuẩn NĐ 30."

                    if new_txt != txt:
                        para.text = new_txt
                        modified += 1

    prs.save(p)
    print(f"[OK] Updated {modified} paragraphs in: {p}")

if __name__ == "__main__":
    for p in PATHS:
        update_pptx_deck(p)
