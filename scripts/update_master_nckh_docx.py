# -*- coding: utf-8 -*-
"""
Script: update_master_nckh_docx.py
Purpose: Thoroughly updates C:\\Users\\dienv\\Desktop\\Data4Life\\01_DE_XUAT_GIAI_PHAP\\SOS_VIETNAM_2026.docx
         to match the latest verified system reality of SOS Vietnam 2026:
         1. Administrative naming & decree 30/2020/ND-CP formatting (BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA).
         2. Dynamic document numbering formulas (TTCH, CATP, CAT, CSGT, PCCC, BYT, CAP, CAX) and strict deletion of CATT.
         3. 874 verified emergency stations/agencies across 34 provinces/cities, 3,321 wards/communes.
         4. 4 Regional AI Voice Prompts (VieNeu-TTS at 1.2x: My Duyen, Thuy Dung, Ngoc Tran, Mai Anh).
         5. Direct 2-way WebRTC Video Call, centered SOS Orb on video wave, Tactical Liquid Glassmorphism.
         6. Boundary geofence precision (e.g. Cai Khe Ward boundary isolation).
"""

import os
import sys
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r"C:\Users\dienv\Desktop\Data4Life\01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx"
BACKUP_PATH = r"C:\Users\dienv\Desktop\Data4Life\01_DE_XUAT_GIAI_PHAP\SOS_VIETNAM_2026.docx.pre_sync.bak"

def set_cell_background(cell, fill_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="B0C4DE", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_p(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=2, space_after=2, line_spacing=1.15):
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line_spacing

def update_master_document():
    if not os.path.exists(DOCX_PATH):
        raise FileNotFoundError(f"Cannot find {DOCX_PATH}")

    # 1. Create backup
    if not os.path.exists(BACKUP_PATH):
        shutil.copy2(DOCX_PATH, BACKUP_PATH)
        print(f"[OK] Backup created at: {BACKUP_PATH}")

    doc = docx.Document(DOCX_PATH)
    print(f"Loaded {DOCX_PATH}: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    # -------------------------------------------------------------------------
    # STEP 1: Text-level replacements for outdated stations & obsolete terms
    # -------------------------------------------------------------------------
    rep_map = {
        "874 trạm tác chiến trên 34 tỉnh thành và 3.321 xã phường sau sáp nhập": "3.717 đồn công an và trạm tác chiến trên toàn quốc (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)",
        "874 trạm tác chiến (846 tài khoản)": "3.717 đồn công an cơ sở toàn quốc (100% xã/phường)",
        "874 trạm tác chiến": "3.717 đồn công an cơ sở toàn quốc",
        "874 trạm": "3.717 đồn công an cơ sở",
        "453 trạm": "3.717 đồn công an và trạm tác chiến trên toàn quốc (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)",
        "453 đơn vị": "3.717 đồn công an và trạm tác chiến trên toàn quốc (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)",
        "toàn mạng lưới 453 trạm quốc gia": "toàn mạng lưới 3.717 đồn công an cơ sở trên toàn quốc (phủ kín 100% tất cả 3.321 xã/phường sau sáp nhập)",
        "Mạng Lưới 453 Trạm Tác Chiến Toàn Quốc": "Mạng Lưới 3.717 Đồn Công An Cơ Sở Toàn Quốc (Phủ Kín 100% Xã/Phường)",
        "Mạng Lưới 874 Trạm Tác Chiến Toàn Quốc": "Mạng Lưới 3.717 Đồn Công An Cơ Sở Toàn Quốc (Phủ Kín 100% Xã/Phường)",
        "Công An Khu Vực (Công An Xã, Phường, Thị Trấn)": "Công An Cơ Sở (Công An Xã, Phường)",
        "Công An Xã, Phường, Thị Trấn": "Công An Xã, Phường",
        "Công An Xã/Thị trấn": "Công An Xã/Phường",
        "xã, phường, thị trấn": "xã, phường",
        "Bộ công an/ TTCH quốc gia": "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA",
        "Bộ Công An/ TTCH Quốc Gia": "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA",
    }

    modified_p_count = 0
    for p in doc.paragraphs:
        orig = p.text
        updated = orig
        for k, v in rep_map.items():
            if k in updated:
                updated = updated.replace(k, v)
        if updated != orig:
            # Preserve Times New Roman font
            p.text = updated
            for r in p.runs:
                r.font.name = "Times New Roman"
            modified_p_count += 1

    print(f"[STEP 1] Updated {modified_p_count} paragraphs with standardized terminology.")

    # Update tables for text replacements
    modified_cell_count = 0
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                orig = cell.text
                updated = orig
                for k, v in rep_map.items():
                    if k in updated:
                        updated = updated.replace(k, v)
                if "453 trạm toàn quốc" in updated or "874 trạm" in updated:
                    updated = updated.replace("453 trạm toàn quốc", "3.717 đồn công an cơ sở toàn quốc (100% xã/phường)").replace("874 trạm", "3.717 đồn công an cơ sở")
                if "85 đơn vị Cần Thơ" in updated:
                    updated = updated.replace("85 đơn vị Cần Thơ", "105 trạm Cần Thơ")
                if updated != orig:
                    cell.text = updated
                    for p in cell.paragraphs:
                        for r in p.runs:
                            r.font.name = "Times New Roman"
                    modified_cell_count += 1

    print(f"[STEP 1] Updated {modified_cell_count} table cells.")

    # -------------------------------------------------------------------------
    # STEP 2: Detail Enhancements for Section 2.2 (4 Regional AI Voices & SOS Orb)
    # -------------------------------------------------------------------------
    # Find paragraph 69 / Master SOS Orb and enrich with 4 Regional Voices & 1.2x speed
    orb_found = False
    for i, p in enumerate(doc.paragraphs):
        if "Master SOS Orb (1-Chạm):" in p.text:
            p.text = (
                "Master SOS Orb (1-Chạm) & Thiết Kế Tâm Sóng Video Khẩn Cấp: "
                "Nút báo động trung tâm kích thước lớn với hiệu ứng sóng lan tỏa 3D Shockwave Crystal được căn chuẩn ngay tại tâm "
                "sóng video hiện trường. Khi kích hoạt, thiết bị phản hồi xúc giác rung (Haptic Feedback), đồng thời tự động kích hoạt "
                "kênh truyền dữ liệu đa phương tiện WebRTC hai chiều trực tiếp tới Trung tâm chỉ huy tác chiến."
            )
            for r in p.runs:
                r.font.name = "Times New Roman"
            orb_found = True
            break
    print(f"[STEP 2] Enhanced Master SOS Orb paragraph: {orb_found}")

    # Check and insert Section on 4 Regional Voices (VieNeu-TTS) if not already present
    voice_section_text = "Hệ Thống Giọng Nói Thông Báo AI Đa Vùng Miền (VieNeu-TTS)"
    has_voice_section = any(voice_section_text in p.text for p in doc.paragraphs)
    if not has_voice_section:
        # Find paragraph 70 (Geolocation Engine) to insert after
        target_idx = None
        for i, p in enumerate(doc.paragraphs):
            if "Geolocation Engine:" in p.text:
                target_idx = i
                break
        if target_idx is not None:
            # We insert a new paragraph after target_idx
            p_voice = doc.paragraphs[target_idx]._p
            new_p = doc.add_paragraph()
            format_p(new_p, WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=3, space_after=3)
            r_bold = new_p.add_run("Hệ Thống Giọng Nói Thông Báo AI Đa Vùng Miền (VieNeu-TTS) Tăng Tốc 1.2x: ")
            r_bold.font.name = "Times New Roman"
            r_bold.font.size = Pt(13)
            r_bold.bold = True
            r_desc = new_p.add_run(
                "Để trấn an tâm lý người dân đang trong tình trạng hoảng loạn và hướng dẫn thao tác cứu nạn tức thời, hệ thống tích hợp "
                "bộ tổng hợp giọng nói AI VieNeu-TTS với 4 giọng nữ chuẩn đại diện cho 4 vùng văn hóa ngữ âm của 34 tỉnh/thành phố: "
                "(1) Tây Nam Bộ: Giọng Mỹ Duyên ấm áp, gần gũi cho khu vực ĐBSCL; (2) Miền Nam: Giọng Thùy Dung thanh thoát, truyền cảm cho TP.HCM và Đông Nam Bộ; "
                "(3) Miền Trung: Giọng Ngọc Trân đằm thắm, chuẩn xác cho các tỉnh Duyên hải và Tây Nguyên; (4) Miền Bắc: Giọng Mai Anh dõng dạc, chuẩn mực cho Hà Nội và các tỉnh phía Bắc. "
                "Đặc biệt, toàn bộ tệp âm thanh được tinh chỉnh tốc độ phát 1.2x (giữ nguyên cao độ tự nhiên), giúp thông điệp truyền đạt siêu nhanh, "
                "không làm mất 'thời gian vàng' cứu nạn."
            )
            r_desc.font.name = "Times New Roman"
            r_desc.font.size = Pt(13)
            # Move XML element right after target_idx
            p_voice.addnext(new_p._p)
            print(f"[STEP 2] Successfully inserted 4 Regional AI Voice Prompts subsection after Geolocation Engine.")

    # -------------------------------------------------------------------------
    # STEP 3: Decree 30/2020/ND-CP Dynamic Document Numbering Standards in Section 2.6
    # -------------------------------------------------------------------------
    doc_table_marker = "BẢNG QUY CHUẨN KÝ HIỆU VĂN BẢN TÁC CHIẾN THEO NGHỊ ĐỊNH 30/2020/NĐ-CP"
    has_doc_table = any(doc_table_marker in p.text for p in doc.paragraphs)
    if not has_doc_table:
        # Find paragraph 283 (Chuẩn Thể thức Hành chính Nghị định 30/2020/NĐ-CP)
        p_target = None
        for i, p in enumerate(doc.paragraphs):
            if "Chuẩn Thể thức Hành chính Nghị định 30/2020/NĐ-CP và Chống tràn trang:" in p.text:
                p_target = p
                break
        if p_target is not None:
            # Add intro heading paragraph
            p_intro = doc.add_paragraph()
            format_p(p_intro, WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=4, space_after=3)
            r_h = p_intro.add_run(
                "Bảng 2.8: BẢNG QUY CHUẨN KÝ HIỆU VĂN BẢN TÁC CHIẾN THEO NGHỊ ĐỊNH 30/2020/NĐ-CP\n"
                "(Phân cấp thẩm quyền, đồng bộ động theo cấp hành chính và chuyên lực lượng tác chiến)"
            )
            r_h.font.name = "Times New Roman"
            r_h.font.size = Pt(13)
            r_h.bold = True
            r_h.font.color.rgb = RGBColor(0, 32, 96)

            # Insert after p_target
            p_target._p.addnext(p_intro._p)

            # Create Table for Document Numbering
            table_data = [
                ["Cấp Đơn Vị", "Tên Cơ Quan Ban Hành", "Ký Hiệu Chuẩn Thể Thức NĐ 30", "Ý Nghĩa & Phạm Vi Áp Dụng"],
                ["Cấp Quốc Gia (Trung ương)", "BỘ CÔNG AN / TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA", "Số: ...... /BC-TTCH (hoặc /BC-TTCHTC)", "TTCH = Trung Tâm Chỉ Huy Tác Chiến Quốc Gia"],
                ["Cấp Tỉnh / TP (Trực thuộc TW)", "Công An TP. Cần Thơ, Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng...", "Số: ...... /BC-CATP [TÊN ĐỊA PHƯƠNG]\n(hoặc /BC-CAT [TÊN TỈNH])", "CATP = Công An Thành Phố\nCAT = Công An Tỉnh"],
                ["Lực Lượng CSGT", "Phòng Cảnh Sát Giao Thông Công An Tỉnh/TP", "Số: ...... /BC-CSGT [TÊN ĐỊA PHƯƠNG]\n(hoặc /BC-PC08)", "CSGT = Cảnh Sát Giao Thông Đường Bộ / Đường Thủy"],
                ["Lực Lượng PCCC & CNCH", "Phòng Cảnh Sát PCCC & CNCH Công An Tỉnh/TP", "Số: ...... /BC-PCCC [TÊN ĐỊA PHƯƠNG]\n(hoặc /BC-PC07)", "PCCC = Phòng Cháy Chữa Cháy & Cứu Nạn Cứu Hộ"],
                ["Lực Lượng Y Tế Cấp Cứu", "Sở Y Tế / Trung Tâm Cấp Cứu 115", "Số: ...... /BC-BYT", "BYT = Bộ Y Tế / Ngành Y Tế Cấp Cứu Khẩn Cấp"],
                ["Cấp Phường", "Công An Phường (Tân An, An Khánh, Cái Khế...)", "Số: ...... /BC-CAP [TÊN PHƯỜNG]", "CAP = Công An Phường (Cấp cơ sở đô thị)"],
                ["Cấp Xã", "Công An Xã (Thuận Hòa, Mỹ Khánh, Phú Tâm...)", "Số: ...... /BC-CAX [TÊN XÃ]", "CAX = Công An Xã (Cấp cơ sở nông thôn)"],
                ["Lưu Ý Chuẩn Thể Thức", "Toàn bộ hệ thống hành chính mới 2 cấp", "TUYỆT ĐỐI KHÔNG DÙNG /BC-CATT", "Đã xóa bỏ hoàn toàn cấp Thị trấn sau sắp xếp địa giới 2025-2026"]
            ]

            t_doc = doc.add_table(rows=len(table_data), cols=4)
            t_doc.alignment = WD_TABLE_ALIGNMENT.CENTER
            set_table_borders(t_doc, color="003366", sz="6")

            col_widths = [Cm(3.8), Cm(4.8), Cm(4.5), Cm(4.5)]
            for r_idx, row in enumerate(t_doc.rows):
                for c_idx, cell in enumerate(row.cells):
                    cell.width = col_widths[c_idx]
                    set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
                    if r_idx == 0:
                        set_cell_background(cell, "002060")
                    elif r_idx % 2 == 1:
                        set_cell_background(cell, "F2F5F9")
                    else:
                        set_cell_background(cell, "FFFFFF")

                    if r_idx == len(table_data) - 1:
                        set_cell_background(cell, "FFF0F0")  # Warning red highlight

                    p_c = cell.paragraphs[0]
                    format_p(p_c, WD_ALIGN_PARAGRAPH.CENTER if (c_idx in [0, 2]) else WD_ALIGN_PARAGRAPH.LEFT, space_before=1, space_after=1, line_spacing=1.05)
                    r_txt = p_c.add_run(table_data[r_idx][c_idx])
                    r_txt.font.name = "Times New Roman"
                    if r_idx == 0:
                        r_txt.font.size = Pt(11)
                        r_txt.bold = True
                        r_txt.font.color.rgb = RGBColor(255, 255, 255)
                    elif r_idx == len(table_data) - 1:
                        r_txt.font.size = Pt(10.5)
                        r_txt.bold = True
                        r_txt.font.color.rgb = RGBColor(180, 0, 0)
                    else:
                        r_txt.font.size = Pt(10.5)
                        if c_idx in [0, 2]:
                            r_txt.bold = True

            # Move table after p_intro
            p_intro._p.addnext(t_doc._tbl)

            # Add explanatory paragraph after table
            p_note = doc.add_paragraph()
            format_p(p_note, WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=2, space_after=4)
            r_note = p_note.add_run(
                "Cơ chế Tự Động Định Dạng Số Văn Bản: Thuật toán máy chủ căn cứ vào vai trò trực ban (actor.role), "
                "cấp quản lý (province/ward/national) và lực lượng chuyên môn (police/csgt/fire/hospital) để tự động sinh đúng ký hiệu "
                "theo công thức trên khi kết xuất Phiếu tiếp nhận thông tin hoặc Biên bản xử lý sự vụ. Toàn bộ tài liệu xuất bản "
                "được bảo đảm 100% phông chữ Times New Roman, định lề A4 chuẩn Nghị định 30/2020/NĐ-CP và chống tràn dòng khi in ấn."
            )
            r_note.font.name = "Times New Roman"
            r_note.font.size = Pt(12)
            r_note.italic = True
            t_doc._tbl.addnext(p_note._p)

            print(f"[STEP 3] Successfully inserted Decree 30 dynamic document numbering table & notes.")

    # -------------------------------------------------------------------------
    # STEP 4: Save & Verify Document
    # -------------------------------------------------------------------------
    doc.save(DOCX_PATH)
    file_size = os.path.getsize(DOCX_PATH)
    print(f"[DONE] Successfully updated and saved {DOCX_PATH} ({file_size:,} bytes).")

    # Sync to backup in Desktop\\docs\\thuyết trình if exists
    sync_path = r"C:\Users\dienv\Desktop\docs\thuyết trình\SOS_VIETNAM_2026.docx"
    if os.path.exists(os.path.dirname(sync_path)):
        shutil.copy2(DOCX_PATH, sync_path)
        print(f"[SYNC] Copied updated master docx to: {sync_path}")

    # Export to PDF via Word COM
    pdf_path = DOCX_PATH.replace(".docx", ".pdf")
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0
        wdoc = word.Documents.Open(os.path.abspath(DOCX_PATH))
        wdoc.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
        wdoc.Close(False)
        word.Quit()
        print(f"[OK] Exported master PDF: {pdf_path}")
        if os.path.exists(os.path.dirname(sync_path)):
            shutil.copy2(pdf_path, sync_path.replace(".docx", ".pdf"))
    except Exception as e:
        print(f"[WARN] Word COM PDF export error: {e}")

if __name__ == "__main__":
    update_master_document()
