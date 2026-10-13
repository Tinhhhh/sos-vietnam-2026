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

    html = html.replace("874 trạm tác chiến trên 34 tỉnh/thành (846 tài khoản)", "3.717 đồn công an cơ sở toàn quốc (100% xã/phường)")
    html = html.replace("874 Trạm Cơ Sở", "3.717 Đồn/Trạm Cơ Sở (Phủ Kín 100% Xã/Phường)")
    html = html.replace("874 trạm tác chiến", "3.717 đồn công an cơ sở")
    html = html.replace("548 đơn vị toàn quốc", "3.717 đồn công an cơ sở toàn quốc (100% xã/phường)")
    html = html.replace("548 Đơn Vị", "3.717 Đồn/Trạm Cơ Sở")
    html = html.replace("548 đơn vị trực ban", "3.717 đồn công an cơ sở trực ban (100% xã/phường)")
    html = html.replace("đúng chuẩn thể thức Nghị định 30/2020/NĐ-CP", "100% font Times New Roman, ký hiệu chuẩn động (/BC-TTCH, /BC-CATP, /BC-CSGT, /BC-PCCC, /BC-BYT, /BC-CAP, /BC-CAX; loại bỏ CATT) đúng chuẩn Nghị định 30/2020/NĐ-CP")
    html = html.replace("Trợ lý ảo & Cẩm nang", "Master SOS Orb tâm sóng & Trợ lý giọng nói AI 4 vùng miền (1.2x) & Cẩm nang")
    html = html.replace("Định vị Kalman", "Định vị Kalman & Theo dõi xe cứu hộ GPS thực tế (vệt bánh xe cyan)")

    with open(p, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[OK] Successfully updated {p}")
