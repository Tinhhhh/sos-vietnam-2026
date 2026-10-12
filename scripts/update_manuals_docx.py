# -*- coding: utf-8 -*-
"""
Script: update_manuals_docx.py
Purpose: Updates user manuals in C:\\Users\\dienv\\Desktop\\Data4Life\\05_TAI_LIEU_VAN_HANH_HUONG_DAN\\:
         1. HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx (Decree 30 doc numbering formulas, no CATT, WebRTC video).
         2. HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx (Centered SOS Orb on video ripple, VieNeu-TTS 4 regional voices at 1.2x).
         3. Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx (remove 'thị trấn').
         4. Exports updated PDFs via Word COM.
"""

import os
import sys
import docx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\dienv\Desktop\Data4Life\05_TAI_LIEU_VAN_HANH_HUONG_DAN"

def update_manuals():
    # 1. Officer Guide
    p_canbo = os.path.join(BASE_DIR, "HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx")
    if os.path.exists(p_canbo):
        doc = docx.Document(p_canbo)
        for p in doc.paragraphs:
            if "Nghị định số 30/2020/NĐ-CP" in p.text and "chữ ký số thứ hai" in p.text:
                p.text = (
                    "Hoàn tất hồ sơ có giá trị pháp lý: Khi sự vụ kết thúc, người dân đã ký xác nhận trên cổng công dân, "
                    "cán bộ trực ban nhấp vào khung ký số của cán bộ trên Drawer sự vụ để hoàn tất chữ ký số thứ hai. "
                    "Hệ thống tự động biên dịch toàn bộ dữ liệu thành Biên bản Tiếp nhận Thông tin Cứu hộ chuẩn thể thức hành chính theo Nghị định số 30/2020/NĐ-CP "
                    "(100% phông chữ Times New Roman, ký hiệu văn bản phân cấp động: /BC-TTCH cho Trung tâm chỉ huy quốc gia, /BC-CATP hoặc /BC-CAT cho cấp Tỉnh/TP, "
                    "/BC-CSGT, /BC-PCCC, /BC-BYT, /BC-CAP cho cấp Phường, /BC-CAX cho cấp Xã; xóa bỏ hoàn toàn cấp CATT), "
                    "sẵn sàng in trực tiếp hoặc trích xuất định dạng Word/PDF đúng 01 trang A4 để lưu trữ vào hồ sơ lưu trữ điện tử."
                )
                for r in p.runs:
                    r.font.name = "Times New Roman"
                break
        doc.save(p_canbo)
        print(f"[OK] Updated officer manual: {p_canbo}")

    # 2. Citizen Guide
    p_nguoidan = os.path.join(BASE_DIR, "HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx")
    if os.path.exists(p_nguoidan):
        doc = docx.Document(p_nguoidan)
        for p in doc.paragraphs:
            if "phím Master SOS Orb hình cầu phát sáng ở chính giữa màn hình" in p.text:
                p.text = (
                    "Thao tác kích hoạt: Khi xảy ra sự cố nguy cấp, người dân mở Cổng SOS trên điện thoại hoặc máy tính. "
                    "Tại màn hình chính, nhấp một chạm hoặc nhấn giữ vào phím Master SOS Orb hình cầu phát sáng căn ngay giữa tâm sóng video trực tiếp. "
                    "Hệ thống tự động kích hoạt Trợ lý giọng nói AI đa vùng miền (VieNeu-TTS) với 4 giọng nữ thân thuộc theo 4 miền "
                    "(Mỹ Duyên - Miền Tây, Thùy Dung - Miền Nam, Ngọc Trân - Miền Trung, Mai Anh - Miền Bắc) với tốc độ tăng tốc 1.2x "
                    "để trấn an và hướng dẫn người dân thao tác nhanh chóng."
                )
                for r in p.runs:
                    r.font.name = "Times New Roman"
                break
        doc.save(p_nguoidan)
        print(f"[OK] Updated citizen manual: {p_nguoidan}")

    # 3. Overview Document
    p_tongquan = os.path.join(BASE_DIR, "Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx")
    if os.path.exists(p_tongquan):
        doc = docx.Document(p_tongquan)
        for p in doc.paragraphs:
            if "phường, xã, thị trấn mới thành lập" in p.text:
                p.text = p.text.replace(
                    "phường, xã, thị trấn mới thành lập",
                    "phường, xã mới thành lập (đã xóa bỏ hoàn toàn cấp thị trấn để tinh gọn theo mô hình hành chính 2 cấp)"
                )
                for r in p.runs:
                    r.font.name = "Times New Roman"
        doc.save(p_tongquan)
        print(f"[OK] Updated overview manual: {p_tongquan}")

    # 4. Word COM PDF export
    try:
        import win32com.client
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        for f_name in ["HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_CAN_BO.docx", "HUONG_DAN_SU_DUNG_SOS_VIET_NAM_2026_NGUOI_DAN.docx"]:
            docx_f = os.path.join(BASE_DIR, f_name)
            pdf_f = docx_f.replace(".docx", ".pdf")
            doc_w = word.Documents.Open(os.path.abspath(docx_f))
            doc_w.SaveAs(os.path.abspath(pdf_f), FileFormat=17)
            doc_w.Close()
            print(f"[OK] Exported PDF: {pdf_f}")
        word.Quit()
    except Exception as e:
        print(f"[WARN] Could not export PDF via Word COM: {e}")

if __name__ == "__main__":
    update_manuals()
