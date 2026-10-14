# -*- coding: utf-8 -*-
"""
Script: update_qa_docx.py
Purpose: Updates BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx in Data4Life:
         1. 874 stations across 34 provinces, 3,321 wards/communes.
         2. Strict removal of CATT / Thị trấn.
         3. Dynamic Decree 30 document numbering formulas.
         4. 4 Regional AI Voice Prompts (VieNeu-TTS at 1.2x) and WebRTC Video Call.
         5. Exports updated PDF via Word COM.
"""

import os
import sys
import shutil
import docx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r"C:\Users\dienv\Desktop\Data4Life\03_PHAN_BIEN_5_PHUT_BGK\BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.docx"
PDF_PATH = r"C:\Users\dienv\Desktop\Data4Life\03_PHAN_BIEN_5_PHUT_BGK\BO_CAU_HOI_TRA_LOI_5_PHUT_BAN_GIAM_KHAO.pdf"

def update_qa_document():
    if not os.path.exists(DOCX_PATH):
        print(f"[SKIP] Not found: {DOCX_PATH}")
        return

    doc = docx.Document(DOCX_PATH)
    print(f"Loaded QA docx: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    def process_text(txt):
        new_txt = txt
        if "874 trạm tác chiến" in new_txt or "874 trạm" in new_txt or "874" in new_txt:
            new_txt = new_txt.replace("874 trạm tác chiến (846 tài khoản)", "3.717 đồn công an cơ sở trên 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)")
            new_txt = new_txt.replace("874 trạm tác chiến", "3.717 đồn công an cơ sở")
            new_txt = new_txt.replace("874", "3.717")
        if "453 đơn vị" in new_txt:
            new_txt = new_txt.replace("453 đơn vị", "3.717 đồn công an cơ sở trên 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)")
        if "453 đồn trạm" in new_txt:
            new_txt = new_txt.replace("453 đồn trạm", "3.717 đồn công an cơ sở")
        if "453" in new_txt and "34 tỉnh" in new_txt:
            new_txt = new_txt.replace("453", "3.717")
        if "3.717 đồn công an cơ sở toàn quốc (phủ kín 100% xã/phường)" in new_txt:
            new_txt = new_txt.replace("3.717 đồn công an cơ sở toàn quốc (phủ kín 100% xã/phường)", "3.717 đồn công an cơ sở trên 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)")
        if "3.717 đồn công an cơ sở toàn quốc" in new_txt:
            new_txt = new_txt.replace("3.717 đồn công an cơ sở toàn quốc", "3.717 đồn công an cơ sở trên 34 tỉnh/thành phố (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)")
        if "toàn quốc" in new_txt and ("3.717" in new_txt or "đồn" in new_txt):
            new_txt = new_txt.replace("toàn quốc", "trên 34 tỉnh/thành phố")
        if "xã/phường/thị trấn" in new_txt:
            new_txt = new_txt.replace("xã/phường/thị trấn", "xã/phường (xóa bỏ hoàn toàn cấp thị trấn)")
        if "Thị trấn" in new_txt:
            new_txt = new_txt.replace("Thị trấn", "Xã/Phường")
        if "Phiếu tiếp nhận Word A4 Nghị định 30" in new_txt:
            new_txt = new_txt.replace(
                "Phiếu tiếp nhận Word A4 Nghị định 30",
                "Phiếu tiếp nhận Word A4 chuẩn Nghị định 30 (100% Times New Roman, ký hiệu chuẩn động /BC-TTCH, /BC-CATP, /BC-CSGT... không dùng CATT)"
            )
        if "Bấm nút Master SOS 1-chạm" in new_txt:
            new_txt = new_txt.replace(
                "Bấm nút Master SOS 1-chạm",
                "Bấm nút Master SOS Orb căn giữa tâm sóng video; Trợ lý giọng nói AI 4 vùng miền (VieNeu-TTS) với 4 giọng nữ 4 miền tốc độ 1.2x;"
            )
        if "Đàm thoại Video Call / Voice Call" in new_txt:
            new_txt = new_txt.replace(
                "Đàm thoại Video Call / Voice Call",
                "Đàm thoại Video Call WebRTC 2 chiều qua TURN Relay dự phòng; theo dõi vị trí xe cứu hộ GPS thực tế kèm vệt bánh xe cyan nét đứt #38bdf8"
            )
        if "không cần qua tổng đài trung gian điều hướng thủ công." in new_txt and "Mô hình điều phối chỉ huy 2 cấp địa phương:" not in new_txt:
            new_txt = new_txt.replace(
                "không cần qua tổng đài trung gian điều hướng thủ công.",
                "không cần qua tổng đài trung gian điều hướng thủ công.\n• Mô hình chỉ huy 2 cấp địa phương: Tinh gọn 2 cấp gồm Cấp Xã/Phường (phản ứng cơ sở trong 5 phút vàng) và Cấp Tỉnh/Thành phố (Công an Tỉnh/TP, PCCC, CSGT, 115 điều phối chi viện chiến dịch và xử lý các vụ việc chuyển cấp sau 15 phút), loại bỏ hoàn toàn cấp trung gian quận/huyện để tối ưu thời gian cứu nạn."
            )
        return new_txt

    for p in doc.paragraphs:
        txt = p.text
        new_txt = process_text(txt)
        if new_txt != txt:
            p.text = new_txt
            for r in p.runs:
                r.font.name = "Times New Roman"

    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                txt = cell.text
                new_txt = process_text(txt)
                if new_txt != txt:
                    cell.text = new_txt
                    for p in cell.paragraphs:
                        for r in p.runs:
                            r.font.name = "Times New Roman"

    doc.save(DOCX_PATH)
    print(f"[OK] Saved updated QA docx to: {DOCX_PATH}")

    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc_w = word.Documents.Open(os.path.abspath(DOCX_PATH))
        doc_w.SaveAs(os.path.abspath(PDF_PATH), FileFormat=17)
        doc_w.Close()
        word.Quit()
        print(f"[OK] Exported updated QA PDF: {PDF_PATH}")
    except Exception as e:
        print(f"[WARN] Could not export PDF via Word COM: {e}")

    sync_dir = r"C:\Users\dienv\Desktop\docs\thuyết trình"
    if os.path.isdir(sync_dir):
        for f in [DOCX_PATH, PDF_PATH]:
            if os.path.exists(f):
                dst = os.path.join(sync_dir, os.path.basename(f))
                shutil.copy2(f, dst)
                print(f"[OK] Synced QA file to: {dst}")

if __name__ == "__main__":
    update_qa_document()
