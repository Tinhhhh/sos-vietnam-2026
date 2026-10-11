# -*- coding: utf-8 -*-
"""
Script update kịch bản video giới thiệu ứng dụng SOS Việt Nam 2026.
Yêu cầu:
1. Video giới thiệu app: Không cần lời chào khách sáo, vào thẳng vấn đề ngay ở đầu video (Bài toán 5 phút vàng).
2. Thân video: Giữ trọn vẹn sức mạnh hệ thống (PWA 1-chạm 0.79s, bản đồ 3D 5 lực lượng, CSDL T10/2026 453 đơn vị 34 tỉnh 3.321 xã sáp nhập, 4 tình huống thực tế).
3. Kết video: Đã giới thiệu xong tất tần tật hệ thống app, không cần giới thiệu tiếp theo chiếu gì; chốt lại bằng 1 câu hỏi đắt giá, sâu sắc về vấn đề cứu nạn và dữ liệu số.
"""

import os
import sys
import shutil
import docx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_video_script_doc():
    doc = docx.Document()

    # Căn lề trang chuẩn A4
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    def set_cell_background(cell, fill_hex):
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shd)

    def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def prevent_row_split(row):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    def set_table_borders(table, color="B0C4DE", sz="4"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    # TIÊU ĐỀ CHÍNH
    p0 = doc.add_paragraph()
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(2)

    r0 = p0.add_run("KỊCH BẢN VIDEO GIỚI THIỆU HỆ THỐNG APP & THUYẾT MINH (CHUẨN 10 PHÚT)\n")
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(16)
    r0.font.bold = True
    r0.font.color.rgb = RGBColor(180, 0, 0)

    r1 = p0.add_run("HỆ THỐNG CỨU NẠN KHẨN CẤP QUỐC GIA SOS VIỆT NAM 2026\n")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(14)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0, 70, 140)

    r2 = p0.add_run("(Số liệu xã/phường & địa giới hành chính cập nhật mới nhất tháng 10/2026 từ bando.com.vn)")
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(11)
    r2.font.bold = True
    r2.font.italic = True
    r2.font.color.rgb = RGBColor(0, 120, 60)

    # BẢNG GHI NHỚ SIÊU TỐC (CHEAT SHEET)
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_before = Pt(6)
    p1.paragraph_format.space_after = Pt(4)
    r_cs = p1.add_run("⚡ BẢNG GHI NHỚ SIÊU TỐC 30 GIÂY (CHEAT SHEET CHO VIDEO & BÁO CÁO)")
    r_cs.font.name = "Times New Roman"
    r_cs.font.size = Pt(12)
    r_cs.font.bold = True
    r_cs.font.color.rgb = RGBColor(180, 50, 0)

    t_cs = doc.add_table(rows=5, cols=3)
    t_cs.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_cs.autofit = False
    set_table_borders(t_cs, color="B0C4DE", sz="4")

    col_widths = [Inches(1.8), Inches(3.3), Inches(1.8)]

    headers = ["PHẦN & THỜI LƯỢNG", "NỘI DUNG CỐT LÕI CỦA VIDEO", "TỪ KHÓA ĐINH (GHI NHỚ)"]
    for i, h in enumerate(headers):
        cell = t_cs.rows[0].cells[i]
        cell.width = col_widths[i]
        set_cell_background(cell, "003366")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    table_data = [
        ("Phần 1: Mở đầu\n(1.5 phút)",
         "Vào thẳng hiện trường nguy cấp: Tai nạn đêm khuya, hỏa hoạn, đột quỵ, thiên tai. Nỗi đau: Người dân hoảng loạn không biết gọi 113, 114 hay 115, không rõ vị trí sau sáp nhập xã phường. Tổng đài rời rạc, lãng phí thời gian vàng. Ra mắt giải pháp SOS Việt Nam 2026.",
         "Vào thẳng vấn đề • 5 phút vàng • Bối rối gọi ai • Đứt gãy thông tin • SOS 2026"),
        ("Phần 2: Giới thiệu hệ thống app\n(2.5 phút)",
         "• Dân: Không tải app, không đăng ký, mở trong 0.79s, 1 chạm gửi GPS + tự báo người thân.\n• Cán bộ: 1 bản đồ 3D cho 5 lực lượng (Cảnh sát, CSGT, PCCC, Y tế, Cứu hộ), 453 đơn vị, 34 tỉnh, 3.321 xã sáp nhập (T10/2026), 2 tuyến đường.",
         "1 chạm 0.79s • 1 Bản đồ chung • 5 Lực lượng • 453 Đơn vị • 3.321 xã (T10/2026) • 2 làn đường"),
        ("Phần 3: 4 Tình huống thực tế\n(2.5 phút)",
         "1. Yếu thế / không nói được (chạm nút gửi tọa độ bay về đơn vị gần nhất).\n2. Tai nạn liên hoàn / cháy lớn (video call + hiệp đồng 5 lực lượng).\n3. Thiên tai bão lũ (quá 15p tự leo thang cấp Tỉnh/TW).\n4. Chống báo giả (NĐ 144 phạt 4-6tr) & Ký số (NĐ 30 1 trang).",
         "1. Chạm không cần nói • 2. Video + Hiệp đồng • 3. Lưới 15 phút không bỏ sót • 4. Phạt NĐ 144 & Ký số NĐ 30"),
        ("Phần 4: Tổng kết & Câu hỏi đọng lại\n(1 phút)",
         "Đã giới thiệu trọn vẹn toàn bộ hệ sinh thái app & bàn chỉ huy 453 đơn vị (T10/2026). Một chạm cho dân — Bàn chỉ huy cho chiến sĩ. Câu hỏi đắt giá: Liệu có thể để người dân đơn độc trong 5 phút sinh tử vì rào cản kết nối?",
         "453 đơn vị • T10/2026 • Dữ liệu cho cuộc sống • Câu hỏi đọng lại")
    ]

    for r_idx, r_data in enumerate(table_data):
        row = t_cs.rows[r_idx + 1]
        prevent_row_split(row)
        bg = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_before = Pt(6)

    def add_section_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(180, 0, 0)
        return p

    def add_tip(tip_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(tip_text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(180, 80, 0)
        return p

    def add_speech(bold_part, regular_part):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_part:
            r_b = p.add_run(bold_part)
            r_b.font.name = "Times New Roman"
            r_b.font.size = Pt(13.5)
            r_b.font.bold = True
            r_b.font.color.rgb = RGBColor(0, 50, 120)
        if regular_part:
            r_reg = p.add_run(regular_part)
            r_reg.font.name = "Times New Roman"
            r_reg.font.size = Pt(13.5)
        return p

    # =========================================================================
    # PHẦN 1: MỞ ĐẦU – VÀO THẲNG BÀI TOÁN '5 PHÚT VÀNG' (KHÔNG CẦN CHÀO HỎI)
    # =========================================================================
    add_section_header("PHẦN 1: MỞ ĐẦU – VÀO THẲNG BÀI TOÁN '5 PHÚT VÀNG' TRONG CỨU NẠN (1.5 phút)")
    add_tip("👉 GỢI Ý VIDEO & GIỌNG ĐỌC: Âm thanh hiệu ứng còi hú và tiếng mưa bão mờ dần; hình ảnh hiện trường tai nạn đêm khuya; giọng đọc trầm ấm, dứt khoát, đi thẳng vào bài toán sinh tử.")

    add_speech("Trong các tình huống khẩn cấp, ", "tai nạn giao thông trong đêm khuya, hỏa hoạn bất ngờ, thiên tai bão lũ, hay một cơn đột quỵ của người già khi ở nhà một mình... tất cả đều có thể ập đến bất cứ lúc nào.")
    add_speech("Trong y khoa và cứu hộ cứu nạn, ", "5 phút đầu tiên chính là '5 PHÚT VÀNG' quyết định sự sống còn của nạn nhân.")
    add_speech("Thế nhưng hiện nay, ", "khi gặp nguy kịch, người dân trong cơn hoảng loạn thường bối rối không biết phải gọi 113, 114 hay 115; rất khó mô tả chính xác vị trí của mình giữa đường đèo, ngõ hẹp sâu, đặc biệt là tại các địa bàn vừa thực hiện sắp xếp, sáp nhập xã phường.")
    add_speech("Về phía lực lượng chức năng, ", "các tổng đài vẫn đang hoạt động tách biệt, phải hỏi đi hỏi lại thông tin qua bộ đàm, vừa mất thời gian vàng, vừa dễ trùng lặp hoặc bỏ sót ca cứu nạn.")
    add_speech("Từ thực tế cấp bách đó, ", "SOS VIỆT NAM 2026 ra đời — nền tảng cứu nạn khẩn cấp hợp nhất đa lực lượng, biến chiếc điện thoại của mỗi người dân thành 'PHAO CỨU SINH MỘT CHẠM', và kết nối toàn bộ lực lượng phản ứng nhanh trên một 'BẢN ĐỒ CHỈ HUY SỐ DUY NHẤT'.")

    # =========================================================================
    # PHẦN 2: HỆ THỐNG LÀM ĐƯỢC GÌ? – TỐI GIẢN CHO DÂN, THÔNG MINH CHO CÁN BỘ
    # =========================================================================
    add_section_header("PHẦN 2: HỆ THỐNG LÀM ĐƯỢC GÌ? – TỐI GIẢN CHO DÂN, THÔNG MINH CHO CÁN BỘ (2.5 phút)")
    add_tip("👉 GỢI Ý VIDEO & GIỌNG ĐỌC: Màn hình chia đôi: Bên trái quay cận cảnh giao diện điện thoại người dân 1-chạm, bên phải hiển thị Bản đồ tác chiến 3D của cán bộ trực ban; giọng hào hứng, tự tin, nhấn mạnh số liệu cập nhật tháng 10/2026.")

    add_speech("Để cả người dân lẫn cán bộ chiến sĩ đều sử dụng được ngay mà không cần qua đào tạo phức tạp, ", "SOS Việt Nam 2026 được thiết kế với hai phân hệ tác chiến rõ ràng:")
    add_speech("1. VỚI NGƯỜI DÂN — Mở chưa tới 1 giây, báo nạn trong 5 giây:\n", 
               "• KHÔNG CẦN TẢI APP, KHÔNG CẦN ĐĂNG KÝ:\n  Chỉ cần chạm biểu tượng SOS trên màn hình hoặc quét mã QR, ứng dụng mở ngay trong 0.79 GIÂY (kể cả mất sóng 4G vẫn mở được nhờ bộ nhớ ngoại tuyến kèm Cẩm nang sinh tồn).\n• CHẠM NÚT LÀ GỬI VỊ TRÍ:\n  Bà con chỉ cần chạm nút SOS to tròn và bấm hình ảnh tình huống: Cấp cứu, Cháy nổ, Tai nạn hay Mưa lũ. Hệ thống tự động gửi tọa độ GPS chính xác về Trung tâm gần nhất, đồng thời tự động nhắn tin vị trí cho người thân gia đình.")
    add_speech("2. VỚI CÁN BỘ & LỰC LƯỢNG — 1 Bản đồ chung kết nối 5 Lực lượng:\n",
               "• Lần đầu tiên, cả 5 LỰC LƯỢNG gồm: CẢNH SÁT, CSGT, PCCC & CNCH, CẤP CỨU Y TẾ VÀ CỨU HỘ DỊCH VỤ cùng hiệp đồng tác chiến trên một BẢN ĐỒ 3D DUY NHẤT.\n• ĐẶC BIỆT: Hệ thống đã đồng bộ trực tiếp với Cơ sở dữ liệu Quốc gia bando.com.vn, CẬP NHẬT MỚI NHẤT TÍNH ĐẾN THÁNG 10 NĂM 2026, bao phủ toàn bộ 34 TỈNH THÀNH và 3.321 XÃ PHƯỜNG sáp nhập, với 453 TÀI KHOẢN ĐIỀU PHỐI TRỰC BAN THỰC TẾ từ cấp Trung ương, Tỉnh đến tận Xã/Phường.\n• TỰ ĐỘNG CHỈ ĐƯỜNG:\n  Hệ thống tự động lọc nhiễu định vị trong ngõ hẹp và vẽ sẵn 2 đường đi: ĐƯỜNG CHO CÁC PHƯƠNG TIỆN XE NHỎ NHƯ XE 2 BÁNH VÀ ĐƯỜNG LỚN CHO Ô TÔ ĐI.")

    # =========================================================================
    # PHẦN 3: 4 TÌNH HUỐNG ỨNG DỤNG THỰC TẾ TRONG ĐỜI SỐNG
    # =========================================================================
    add_section_header("PHẦN 3: 4 TÌNH HUỐNG ỨNG DỤNG THỰC TẾ TRONG ĐỜI SỐNG (2.5 phút)")
    add_tip("👉 GỢI Ý VIDEO & GIỌNG ĐỌC: Chuyển cảnh minh họa lần lượt 4 tình huống với đồ họa icon sinh động, nhịp điệu dồn dập, rành mạch.")

    add_speech("Trong thực tế vận hành, ", "hệ thống giải quyết trọn vẹn 4 nhóm tình huống khẩn cấp điển hình:")
    add_speech("• TÌNH HUỐNG 1 — Nhóm yếu thế hoặc không thể nói chuyện:\n",
               "Như người già đột quỵ, người khuyết tật câm điếc, hay nạn nhân ngạt khói không thể nói qua điện thoại. Thay vì phải giải thích, họ chỉ cần chạm nhẹ vào thẻ tình huống trên màn hình là tín hiệu cầu cứu cùng vị trí chính xác đã bay thẳng tới đơn vị gần nhất.")
    add_speech("• TÌNH HUỐNG 2 — Sự cố nghiêm trọng cần nhiều lực lượng cùng lúc:\n",
               "Như tai nạn giao thông liên hoàn hay cháy lớn. Người dân có thể bật VIDEO TRỰC TIẾP ngay trên màn hình. Chỉ với 1 cú nhấp chuột, Trung tâm điều động đồng thời cả CSGT phân luồng, PCCC dập lửa, Cấp cứu Y tế và Cứu hộ dịch vụ mà không cần gọi bộ đàm vòng vo.")
    add_speech("• TÌNH HUỐNG 3 — Thiên tai bão lũ, khi cấp cơ sở bị quá tải (Không bỏ sót ca nào):\n",
               "Nếu lực lượng xã/phường bận ứng cứu nơi khác, hệ thống tự chuyển ca sang đơn vị lân cận. Đặc biệt, QUÁ 15 PHÚT mà chưa có người nhận, hệ thống TỰ ĐỘNG BÁO ĐỘNG ĐỎ VÀ PHÁT LOA CẢNH BÁO LÊN CẤP TỈNH VÀ TRUNG ƯƠNG. Không một lời cầu cứu nào của nhân dân bị bỏ quên!")
    add_speech("• TÌNH HUỐNG 4 — Ngăn chặn báo tin giả & Tự động hóa giấy tờ:\n",
               "Kẻ xấu bấm trêu đùa? Cán bộ chỉ cần bấm 'Báo khống NĐ 144' — máy tự ghi nhận thiết bị, khóa vĩnh viễn và xuất Biên bản xử phạt 4 đến 6 triệu đồng theo Nghị định 144. Còn ca thật xong việc, dân và chiến sĩ KÝ TÊN BẰNG NGÓN TAY TRÊN MÀN HÌNH để xuất biên bản chuẩn Nghị định 30 trong 1 giây, kèm quản lý danh bạ bằng file Excel quen thuộc.")

    # =========================================================================
    # PHẦN 4: TỔNG KẾT HỆ THỐNG VÀ THÔNG ĐIỆP ĐỌNG LẠI (ĐẶT CÂU HỎI ĐẮT GIÁ)
    # =========================================================================
    add_section_header("PHẦN 4: TỔNG KẾT HỆ THỐNG VÀ THÔNG ĐIỆP ĐỌNG LẠI (1 phút)")
    add_tip("👉 GỢI Ý VIDEO & GIỌNG ĐỌC: Nhạc nền chuyển sang sâu lắng rồi cao trào; màn hình hiển thị toàn cảnh bản đồ số kết nối 34 tỉnh thành và logo SOS Việt Nam 2026; giọng đọc truyền cảm, sâu sắc, giàu nội lực.")

    add_speech("Như vậy, toàn bộ hệ sinh thái SOS Việt Nam 2026 — ", 
               "từ ứng dụng báo nạn siêu nhẹ của người dân đến hệ thống điều phối tác chiến 453 đơn vị trên 34 tỉnh thành và 3.321 xã phường sau sáp nhập, cập nhật mới nhất tính đến tháng 10 năm 2026 — đã được xây dựng hoàn chỉnh, sẵn sàng bảo vệ an toàn cho nhân dân trong mọi tình huống khẩn cấp.")
    add_speech("MỘT CHẠM GIẢN DỊ CHO DÂN LÚC NGUY NAN — ", "MỘT BÀN CHỈ HUY THÔNG MINH GIÚP CÁN BỘ CHIẾN SĨ TIẾP CẬN HIỆN TRƯỜNG NHANH HƠN VÀ BỚT VẤT VẢ HƠN.")
    add_speech("Bởi với chúng tôi, ", "mỗi giây dữ liệu được rút ngắn hôm nay chính là một sinh mạng con người được giữ lại ngày mai!")
    add_speech("Và câu hỏi lớn đặt ra cho tất cả chúng ta hôm nay là: \n", 
               "“Trong kỷ nguyên chuyển đổi số quốc gia, khi dữ liệu số đã có thể đi nhanh hơn cả tiếng còi xe cứu thương — liệu chúng ta có thể cho phép bất kỳ người dân nào phải đơn độc trong 5 phút sinh tử của cuộc đời mình chỉ vì một rào cản kết nối?”")

    return doc

if __name__ == "__main__":
    out_dir1 = r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT"
    out_dir2 = r"C:\Users\dienv\Desktop\docs\thuyết trình"
    os.makedirs(out_dir1, exist_ok=True)
    os.makedirs(out_dir2, exist_ok=True)

    file_name = "KICH_BAN_THUYET_TRINH_10_PHUT_DE_HOC_THUOC.docx"
    p1 = os.path.join(out_dir1, file_name)
    p2 = os.path.join(out_dir2, file_name)

    doc = create_video_script_doc()
    doc.save(p1)
    shutil.copy2(p1, p2)
    print(f"[OK] Generated and saved script docx to:\n - {p1}\n - {p2}")
