# -*- coding: utf-8 -*-
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

paths = [
    r"C:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\Reports\SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html",
    r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.html"
]

for p in paths:
    if not os.path.exists(p):
        print(f"[SKIP] Not found: {p}")
        continue
    with open(p, "r", encoding="utf-8") as f:
        html = f.read()

    html = html.replace("548 đơn vị toàn quốc", "874 trạm tác chiến trên 34 tỉnh/thành (846 tài khoản)")
    html = html.replace("548 Đơn Vị", "874 Trạm Cơ Sở")
    html = html.replace("548 đơn vị trực ban", "874 trạm tác chiến (846 tài khoản trực ban)")
    html = html.replace("đúng chuẩn thể thức Nghị định 30/2020/NĐ-CP", "100% font Times New Roman, ký hiệu chuẩn động (/BC-TTCH, /BC-CATP, /BC-CSGT, /BC-PCCC, /BC-BYT, /BC-CAP, /BC-CAX; loại bỏ CATT) đúng chuẩn Nghị định 30/2020/NĐ-CP")
    html = html.replace("Trợ lý ảo & Cẩm nang", "Master SOS Orb tâm sóng & Trợ lý giọng nói AI 4 vùng miền (1.2x) & Cẩm nang")

    with open(p, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[OK] Successfully updated {p}")
