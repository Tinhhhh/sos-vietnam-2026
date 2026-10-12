# -*- coding: utf-8 -*-
"""
Script: generate_presentation_8_criteria.py
Purpose: Generates the complete Presentation Deck (.pptx) and Detailed Presentation Script (.docx)
         answering the 8 official evaluation criteria for SOS Vietnam 2026 (Data for Life 2026),
         with current product completion level set accurately to 80% (TRL 7 Live Prototype).
"""

import os
import sys
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

import docx
from docx.shared import Inches as DocxInches, Pt as DocxPt, Cm as DocxCm, RGBColor as DocxRGB
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(REPO_ROOT, "Reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

PPTX_OUT = os.path.join(REPORTS_DIR, "SLIDE_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.pptx")
DOCX_OUT = os.path.join(REPORTS_DIR, "BAI_THUYET_TRINH_8_TIEU_CHI_SOS_VIET_NAM_2026.docx")

SYNC_DIRS = [
    r"C:\Users\dienv\Desktop\docs\thuyết trình",
    r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT",
]

# -------------------------------------------------------------------------
# PPTX COLOR PALETTE (C4ISR Tactical Dark Command Theme)
# -------------------------------------------------------------------------
BG_DARK = RGBColor(8, 14, 30)          # #080E1E Deep Navy
CARD_BG = RGBColor(16, 26, 50)         # #101A32 Tactical Panel
CARD_BG_ALT = RGBColor(22, 35, 66)     # #162342 Highlighted Panel
BORDER_SUBTLE = RGBColor(42, 67, 115)  # #2A4373
CYAN_ACCENT = RGBColor(0, 229, 255)    # #00E5FF Cyber Cyan
RED_ACCENT = RGBColor(255, 59, 92)     # #FF3B5C SOS Crimson
GOLD_ACCENT = RGBColor(255, 184, 0)    # #FFB800 Tactical Gold
GREEN_ACCENT = RGBColor(16, 185, 129)  # #10B981 Emerald 80% Ready
PURPLE_ACCENT = RGBColor(168, 85, 247) # #A855F7 R&D Future
TEXT_WHITE = RGBColor(248, 250, 252)   # #F8FAFC
TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8
TEXT_LIGHT = RGBColor(203, 213, 225)   # #CBD5E1


def set_slide_bg(slide, color=BG_DARK):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_header(slide, badge_text, title_text, subtitle_text=None, badge_color=CYAN_ACCENT):
    # Top badge
    tb_badge = slide.shapes.add_textbox(Inches(0.65), Inches(0.32), Inches(12.0), Inches(0.35))
    tf_b = tb_badge.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.text = badge_text.upper()
    p_b.font.name = "Arial"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = badge_color

    # Main Title
    tb_title = slide.shapes.add_textbox(Inches(0.65), Inches(0.62), Inches(12.0), Inches(0.65))
    tf_t = tb_title.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title_text
    p_t.font.name = "Arial"
    p_t.font.size = Pt(24)
    p_t.font.bold = True
    p_t.font.color.rgb = TEXT_WHITE

    if subtitle_text:
        tb_sub = slide.shapes.add_textbox(Inches(0.65), Inches(1.18), Inches(12.0), Inches(0.4))
        tf_s = tb_sub.text_frame
        tf_s.word_wrap = True
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = "Arial"
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = TEXT_MUTED


def add_card(slide, left, top, width, height, title, bullets, accent_color=CYAN_ACCENT, bg_color=CARD_BG, title_size=15, body_size=12.5):
    # Base rounded rectangle
    rect = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    rect.adjustments[0] = 0.04
    rect.fill.solid()
    rect.fill.fore_color.rgb = bg_color
    rect.line.color.rgb = accent_color
    rect.line.width = Pt(1.5)

    # Top accent bar
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(left + 0.18), Inches(top + 0.02), Inches(width - 0.36), Inches(0.06)
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()

    # Text frame inside
    tb = slide.shapes.add_textbox(
        Inches(left + 0.22), Inches(top + 0.16), Inches(width - 0.44), Inches(height - 0.28)
    )
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = title
    p0.font.name = "Arial"
    p0.font.size = Pt(title_size)
    p0.font.bold = True
    p0.font.color.rgb = accent_color
    p0.space_after = Pt(8)

    for b in bullets:
        p = tf.add_paragraph()
        if isinstance(b, tuple):
            prefix, rest = b
            r1 = p.add_run()
            r1.text = prefix
            r1.font.name = "Arial"
            r1.font.size = Pt(body_size)
            r1.font.bold = True
            r1.font.color.rgb = TEXT_WHITE

            r2 = p.add_run()
            r2.text = rest
            r2.font.name = "Arial"
            r2.font.size = Pt(body_size)
            r2.font.color.rgb = TEXT_LIGHT
        else:
            p.text = b
            p.font.name = "Arial"
            p.font.size = Pt(body_size)
            p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(5)


def add_metric_box(slide, left, top, width, height, number_str, label_str, sub_str, accent_color=CYAN_ACCENT):
    rect = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    rect.adjustments[0] = 0.06
    rect.fill.solid()
    rect.fill.fore_color.rgb = CARD_BG_ALT
    rect.line.color.rgb = accent_color
    rect.line.width = Pt(1.5)

    tb = slide.shapes.add_textbox(
        Inches(left + 0.12), Inches(top + 0.12), Inches(width - 0.24), Inches(height - 0.24)
    )
    tf = tb.text_frame
    tf.word_wrap = True

    p_num = tf.paragraphs[0]
    p_num.alignment = PP_ALIGN.CENTER
    p_num.text = number_str
    p_num.font.name = "Arial"
    p_num.font.size = Pt(28)
    p_num.font.bold = True
    p_num.font.color.rgb = accent_color
    p_num.space_after = Pt(2)

    p_lbl = tf.add_paragraph()
    p_lbl.alignment = PP_ALIGN.CENTER
    p_lbl.text = label_str
    p_lbl.font.name = "Arial"
    p_lbl.font.size = Pt(13)
    p_lbl.font.bold = True
    p_lbl.font.color.rgb = TEXT_WHITE
    p_lbl.space_after = Pt(2)

    p_sub = tf.add_paragraph()
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.text = sub_str
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(10.5)
    p_sub.font.color.rgb = TEXT_MUTED


def add_speaker_notes(slide, notes_text):
    notes_slide = slide.notes_slide
    tf = notes_slide.notes_text_frame
    tf.text = notes_text


def build_pptx_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # =========================================================================
    # SLIDE 1: TRANG BÌA (TITLE SLIDE)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)

    # Hero Card
    hero = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.75), Inches(11.733), Inches(6.0))
    hero.adjustments[0] = 0.03
    hero.fill.solid()
    hero.fill.fore_color.rgb = CARD_BG
    hero.line.color.rgb = CYAN_ACCENT
    hero.line.width = Pt(2.0)

    tb1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.05), Inches(10.9), Inches(5.4))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "CUỘC THI DỮ LIỆU VỚI CUỘC SỐNG — DATA FOR LIFE 2026 | VÒNG CHINH PHỤC (TOP 60)"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT
    p.space_after = Pt(14)

    p2 = tf1.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "HỆ THỐNG DỮ LIỆU & ĐIỀU PHỐI CỨU HỘ KHẨN CẤP\nĐA LỰC LƯỢNG SOS VIỆT NAM 2026"
    p2.font.name = "Arial"
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.space_after = Pt(12)

    p3 = tf1.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "Kênh Kêu Cứu 1-Chạm & Trợ Giúp Nhanh Cho Người Yếu Thế (Mã đề bài: ASXH-07)"
    p3.font.name = "Arial"
    p3.font.size = Pt(18)
    p3.font.bold = True
    p3.font.color.rgb = GOLD_ACCENT
    p3.space_after = Pt(18)

    p4 = tf1.add_paragraph()
    p4.alignment = PP_ALIGN.CENTER
    p4.text = (
        "• Giải đáp toàn diện 8 tiêu chí đánh giá của Hội đồng Giám khảo Data for Life 2026\n"
        "• Mức độ hoàn thiện hiện tại: ĐẠT 80% (TRL 7 — Live Operational Prototype trên Web & Mobile PWA)\n"
        "• Đồng bộ 34 tỉnh/thành, 3.321 xã/phường sau sáp nhập (T10/2026) & 417 điểm Công an TP Hà Nội"
    )
    p4.font.name = "Arial"
    p4.font.size = Pt(13.5)
    p4.font.color.rgb = TEXT_LIGHT
    p4.space_after = Pt(22)

    p5 = tf1.add_paragraph()
    p5.alignment = PP_ALIGN.CENTER
    p5.text = "Đơn vị thực hiện: Trung đoàn CSCĐ số 10 (K02 - Bộ Công an) | Trưởng nhóm: Điền Trần Vĩnh An"
    p5.font.name = "Arial"
    p5.font.size = Pt(12.5)
    p5.font.bold = True
    p5.font.color.rgb = GREEN_ACCENT

    add_speaker_notes(
        s1,
        "Kính chào Hội đồng Ban Giám khảo Cuộc thi Data for Life 2026. Đội thi đến từ Trung đoàn Cảnh sát Cơ động số 10 "
        "xin trình bày giải pháp 'Hệ thống Dữ liệu và Điều phối Cứu hộ Khẩn cấp Đa lực lượng SOS Việt Nam 2026' (Mã đề bài ASXH-07), "
        "bám sát 8 tiêu chí đánh giá của Ban Tổ chức với mức độ hoàn thiện thực tế hiện tại đạt 80% (TRL 7)."
    )

    # =========================================================================
    # SLIDE 2: TIÊU CHÍ 1 - VẤN ĐỀ THỰC TIỄN MÀ ĐỘI THI HƯỚNG TỚI GIẢI QUYẾT
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)
    add_header(
        s2,
        "TIÊU CHÍ 01 // VẤN ĐỀ THỰC TIỄN CẦN GIẢI QUYẾT (MÃ ĐỀ BÀI: ASXH-07)",
        "Bài Toán '5 Phút Vàng' Sinh Tử & 4 Điểm Nghẽn Cứu Nạn Hiện Nay",
        "Trong cấp cứu y khoa và CNCH, 5–10 phút đầu quyết định sự sống còn, nhưng quy trình truyền thống đang tồn tại 4 rào cản lớn:",
        badge_color=RED_ACCENT,
    )

    add_card(
        s2, 0.65, 1.70, 5.85, 2.55,
        "1. Phân Mảnh 3 Đầu Số (113 - 114 - 115)",
        [
            ("• Chia cắt thông tin chỉ huy: ", "3 tổng đài thoại hoạt động độc lập, không có bản đồ tác chiến chung."),
            ("• Lãng phí 3–7 phút vàng: ", "Khi xảy ra tai nạn liên hoàn hoặc cháy nổ có người mắc kẹt, người dân phải gọi nhiều nơi, lặp lại thông tin nhiều lần trong hoảng loạn."),
        ],
        accent_color=RED_ACCENT,
    )

    add_card(
        s2, 6.80, 1.70, 5.85, 2.55,
        "2. Mù Định Vị Ngõ Hẻm, Sông Nước & Sau Sáp Nhập",
        [
            ("• Không có tọa độ GPS tự động: ", "Cuộc gọi thoại truyền thống phụ thuộc mô tả miệng, dễ điều động sai phương tiện."),
            ("• Đặc thù địa giới mới T10/2026: ", "Sau sáp nhập xã/phường hoặc tại ngõ sâu <2m, kênh rạch ĐBSCL, nạn nhân không biết mình thuộc địa bàn công an nào quản lý."),
        ],
        accent_color=GOLD_ACCENT,
    )

    add_card(
        s2, 0.65, 4.45, 5.85, 2.55,
        "3. Vấn Nạn Tin Báo Giả & Nghẽn Mạng Khi Thiên Tai",
        [
            ("• 40% – 60% cuộc gọi đêm là báo khống: ", "Gây nghẽn đường dây nóng và lãng phí ngân sách khi xuất xe công vụ vô ích."),
            ("• Tê liệt khi bão lũ lớn: ", "Khi thiên tai diện rộng, hàng ngàn người gọi cùng lúc làm tổng đài thoại truyền thống quá tải."),
        ],
        accent_color=CYAN_ACCENT,
    )

    add_card(
        s2, 6.80, 4.45, 5.85, 2.55,
        "4. Rào Cản Tuyệt Đối Với Người Yếu Thế",
        [
            ("• Không thể giao tiếp bằng giọng nói: ", "Người câm điếc, người khuyết tật vận động, người già đột quỵ một mình hoặc nạn nhân ngạt khói không thể gọi thoại 113/114/115."),
            ("• Yêu cầu cấp thiết của Đề án 06/CP: ", "Cần một kênh cứu nạn số 1-chạm bình đẳng, nhân văn và tức thời."),
        ],
        accent_color=GREEN_ACCENT,
    )

    add_speaker_notes(
        s2,
        "Tiêu chí 1 - Vấn đề thực tiễn: Trong cứu nạn, 5 phút đầu là 5 phút vàng. Tuy nhiên hiện nay có 4 điểm nghẽn lớn: "
        "(1) Ba đầu số 113, 114, 115 tách rời khiến người dân mất 3-7 phút gọi từng nơi; "
        "(2) Cuộc gọi thoại không gửi được tọa độ GPS chính xác, nhất là sau khi sáp nhập xã/phường và trong ngõ hẹp; "
        "(3) 40-60% cuộc gọi ban đêm là báo giả gây lãng phí lớn; "
        "(4) Người câm điếc, người già đột quỵ hoặc nạn nhân ngạt khói không thể nói qua điện thoại."
    )

    # =========================================================================
    # SLIDE 3: TIÊU CHÍ 2 - GIẢI PHÁP & ĐIỂM KHÁC BIỆT CỦA SẢN PHẨM
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)
    add_header(
        s3,
        "TIÊU CHÍ 02 // GIẢI PHÁP VÀ ĐIỂM KHÁC BIỆT CỦA SẢN PHẨM",
        "Hợp Nhất 5 Lực Lượng Trên 1 Bản Đồ Số — Báo Nạn 1-Chạm Từ Thiết Bị",
        "Kết nối trực tiếp Cổng Người Dân PWA Siêu Nhẹ với Bàn Chỉ Huy Tác Chiến C4ISR Đa Cấp theo thời gian thực:",
        badge_color=CYAN_ACCENT,
    )

    add_card(
        s3, 0.65, 1.70, 5.85, 5.30,
        "📱 PHÂN HỆ NGƯỜI DÂN: 'PHAO CỨU SINH 1-CHẠM' (PWA)",
        [
            ("1. Không cần cài App, không cần tạo tài khoản: ", "Mở tức thì trong 0.79s qua trình duyệt hoặc QR; hoạt động cả khi mất sóng nhờ bộ nhớ đệm Offline."),
            ("2. Nút Master SOS Orb & Thẻ tình huống trực quan: ", "Hỗ trợ người câm điếc, người già đột quỵ bấm gửi tọa độ GPS, ảnh chụp hiện trường chỉ trong 1 chạm."),
            ("3. Tính khoảng cách trực tiếp từ thiết bị người dùng: ", "Tự động đo khoảng cách thực tế từ vị trí thiết bị sử dụng App tới từng cơ sở Công an, Y tế, PCCC gần nhất."),
            ("4. Đàm thoại & Video Call 2 chiều WebRTC: ", "Kết nối trực tiếp với cán bộ trực ban không qua tổng đài trung gian."),
            ("5. Ký số trên màn hình cảm ứng: ", "Xác nhận biên bản hiện trường chuẩn Nghị định 30/2020/NĐ-CP ngay trên điện thoại."),
        ],
        accent_color=CYAN_ACCENT,
    )

    add_card(
        s3, 6.80, 1.70, 5.85, 5.30,
        "🖥️ ĐIỂM KHÁC BIỆT VƯỢT TRỘI SO VỚI TỔNG ĐÀI CŨ",
        [
            ("1. Hợp nhất 5 lực lượng trên 1 Bản đồ GIS 3D: ", "Công an (113), PCCC & CNCH (114), Y tế (115), CSGT và Cứu hộ dịch vụ cùng hiệp đồng tức thì."),
            ("2. Định tuyến tự động về Cơ sở gần nhất (Multi-Facility): ", "Phân biệt rõ Trụ sở chính và các Cơ sở 2, 3, 4 trong cùng 1 phường sau sáp nhập; tự động gán cơ sở gần nạn nhân nhất."),
            ("3. Chuyển cấp leo thang tự động 15 phút (Escalation): ", "Nếu cấp Xã/Phường quá tải sau 15 phút chưa xử lý, hệ thống tự động báo động đỏ lên cấp Thành phố/Tỉnh & Trung ương."),
            ("4. Tách biệt ca trực độc lập theo từng Đơn vị: ", "Mỗi đơn vị (unit username) quản lý kíp trực, bàn giao ca và nhận cảnh báo riêng biệt, không chồng chéo."),
            ("5. Chế tài báo khống tự động (Nghị định 144): ", "Thu thập dấu vết số OSINT, lập hồ sơ xử phạt 4–6 triệu đồng đối với tin giả."),
        ],
        accent_color=GOLD_ACCENT,
    )

    add_speaker_notes(
        s3,
        "Tiêu chí 2 - Giải pháp và điểm khác biệt: SOS Việt Nam 2026 gồm 2 phân hệ: Cổng PWA cho người dân mở dưới 1 giây không cần cài đặt, "
        "và Bàn chỉ huy C4ISR hợp nhất 5 lực lượng. Điểm khác biệt cốt lõi là tính khoảng cách trực tiếp từ vị trí thiết bị người dùng đến các cơ sở xung quanh, "
        "tự động chọn cơ sở gần nhất trong mô hình đa cơ sở sau sáp nhập, và cơ chế tự động chuyển cấp lên Thành phố sau 15 phút."
    )

    # =========================================================================
    # SLIDE 4: TIÊU CHÍ 3 - CÔNG NGHỆ ĐƯỢC SỬ DỤNG
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)
    add_header(
        s4,
        "TIÊU CHÍ 03 // CÔNG NGHỆ ĐƯỢC SỬ DỤNG & KIẾN TRÚC KỸ THUẬT",
        "Kiến Trúc 5 Tầng Tinh Gọn, Thời Gian Thực & Bảo Mật Chuẩn Nghị Định 13",
        "Thiết kế theo triết lý Zero-Framework Overhead để đạt tốc độ phản hồi mili-giây và độ ổn định cao nhất:",
        badge_color=CYAN_ACCENT,
    )

    add_card(
        s4, 0.65, 1.70, 3.80, 5.30,
        "1. Frontend PWA & Bản Đồ GIS",
        [
            ("• HTML5 / CSS3 / ES6+ Native: ", "Loại bỏ hoàn toàn bundle nặng; tối ưu hóa hiển thị đa thiết bị và đồng bộ font Hubot Sans chuẩn giao diện tác chiến."),
            ("• MapLibre GL / Leaflet GIS: ", "Hiển thị ranh giới 3.321 xã/phường (GeoJSON) và hệ thống ghim đa cơ sở (Primary & Auxiliary Pins)."),
            ("• Service Worker Offline-First: ", "Lưu đệm tài nguyên tĩnh và Cẩm nang sinh tồn hoạt động không cần Internet."),
        ],
        accent_color=CYAN_ACCENT,
        body_size=12,
    )

    add_card(
        s4, 4.75, 1.70, 3.80, 5.30,
        "2. Backend Lõi & Viễn Thông",
        [
            ("• Node.js Native HTTP + SSE: ", "Truyền phát sự cố thời gian thực qua Server-Sent Events & WebSocket với độ trễ chỉ 45ms."),
            ("• Đàm thoại WebRTC P2P: ", "Kết nối ngang hàng đa máy chủ STUN kèm Polling Fallback vượt tường lửa."),
            ("• Web Audio Graph + lamejs: ", "Mạch âm thanh chống hú (muteGain=0), đo VU Meter RMS 2 chiều và mã hóa MP3 tại RAM trình duyệt."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=12,
    )

    add_card(
        s4, 8.85, 1.70, 3.80, 5.30,
        "3. Không Gian & An Ninh Mạng",
        [
            ("• Haversine Spatial Engine: ", "Tính khoảng cách cầu chính xác từ thiết bị người dân tới 417 điểm Công an Hà Nội & 548 đơn vị toàn quốc."),
            ("• Tường lửa WAF L7 & RBAC: ", "Chặn 27 chữ ký AI Bot/Scraper, bẫy Honeypot, giới hạn tốc độ Token Bucket."),
            ("• Mật mã PBKDF2-SHA512: ", "100.000 vòng lặp băm mật khẩu + lưu trữ nguyên tử (.tmp -> rename) & Zero-Retention theo NĐ 13/2023/NĐ-CP."),
        ],
        accent_color=GOLD_ACCENT,
        body_size=12,
    )

    add_speaker_notes(
        s4,
        "Tiêu chí 3 - Công nghệ sử dụng: Hệ thống sử dụng kiến trúc 5 tầng tinh gọn: Frontend PWA kết hợp bản đồ số GIS, "
        "Backend Node.js Native kết hợp Server-Sent Events độ trễ 45ms, đàm thoại WebRTC P2P với mạch Web Audio Graph chống hú tuyệt đối, "
        "thuật toán không gian Haversine kết hợp lọc nhiễu Kalman, và bảo mật WAF L7 cùng mã hóa PBKDF2-SHA512 tuân thủ Nghị định 13/2023/NĐ-CP."
    )

    # =========================================================================
    # SLIDE 5: TIÊU CHÍ 4 - TÍNH SÁNG TẠO CỦA GIẢI PHÁP
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_header(
        s5,
        "TIÊU CHÍ 04 // TÍNH SÁNG TẠO VÀ ĐỘT PHÁ CÔNG NGHỆ CỦA GIẢI PHÁP",
        "5 Đột Phá Sáng Tạo Giải Quyết Đặc Thù Đô Thị & Địa Giới Hành Chính Việt Nam",
        "Những cải tiến kỹ thuật độc đáo được thiết kế riêng cho điều kiện hạ tầng và nghiệp vụ cứu nạn tại Việt Nam:",
        badge_color=GOLD_ACCENT,
    )

    add_card(
        s5, 0.65, 1.70, 3.80, 2.55,
        "1. Lọc Nhiễu GPS Kalman Filter",
        [
            ("• Khử 92.25% sai số vệ tinh: ", "Giải quyết triệt để hiện tượng nhảy tọa độ GPS khi nạn nhân ở trong nhà kín hoặc hẻm sâu."),
            ("• Độ chính xác < 5 mét: ", "Hội tụ tâm điểm nạn nhân chỉ sau 3–5 mẫu đo liên tiếp."),
        ],
        accent_color=CYAN_ACCENT,
        body_size=11.5,
    )

    add_card(
        s5, 4.75, 1.70, 3.80, 2.55,
        "2. Định Tuyến OSRM 2 Làn Xe",
        [
            ("• Làn xanh lá (Xe 2 bánh): ", "Dẫn đường cho Công an xã/phường luồn ngõ hẹp <2m tiếp cận trước 2–4 phút."),
            ("• Làn xanh dương (Ô tô lớn): ", "Dẫn đường cho xe PCCC & Cứu thương 115 tránh ngõ cụt, cầu yếu."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=11.5,
    )

    add_card(
        s5, 8.85, 1.70, 3.80, 2.55,
        "3. Phân Luồng Đa Cơ Sở 1-to-N",
        [
            ("• Thích ứng sau sáp nhập: ", "1 phường có nhiều cơ sở (Trụ sở chính, Cơ sở 2, 3, 4); bản đồ tự động gắn nhãn [Cơ sở gần nhất]."),
            ("• Khoảng cách từ thiết bị: ", "Đo trực tiếp từ thiết bị người dùng tới từng điểm tiếp dân."),
        ],
        accent_color=GOLD_ACCENT,
        body_size=11.5,
    )

    add_card(
        s5, 0.65, 4.45, 5.85, 2.55,
        "4. Chuyển Cấp Tự Động 15 Phút & Đa Kênh Dự Phòng",
        [
            ("• Đồng hồ đếm ngược 15 phút (MM:SS): ", "Tự động đổi màu cảnh báo đỏ và kích hoạt chuyển cấp lên Công an/PCCC/CSGT cấp Thành phố khi cơ sở quá tải."),
            ("• 3 kênh bất tử (Online WSS -> SMS <70 ký tự -> Offline IndexedDB): ", "Đảm bảo tín hiệu cầu cứu vẫn đến đích ngay cả khi đứt cáp hoặc mất sóng 4G."),
        ],
        accent_color=RED_ACCENT,
        body_size=11.5,
    )

    add_card(
        s5, 6.80, 4.45, 5.85, 2.55,
        "5. Ký Số Canvas NĐ 30 & Chống Báo Giả NĐ 144",
        [
            ("• Tự động sinh Biên bản Word (.docx) 1 trang A4: ", "Người dân và chiến sĩ ký trực tiếp trên màn hình cảm ứng, đúng chuẩn thể thức Nghị định 30/2020/NĐ-CP."),
            ("• Kho lưu trữ Báo Khống & OSINT: ", "Tự động trích xuất IP, tọa độ, thiết bị để lập biên bản xử phạt 4–6 triệu đồng theo Nghị định 144/2021/NĐ-CP."),
        ],
        accent_color=PURPLE_ACCENT,
        body_size=11.5,
    )

    add_speaker_notes(
        s5,
        "Tiêu chí 4 - Tính sáng tạo: Giải pháp có 5 đột phá lớn: (1) Bộ lọc Kalman khử nhiễu GPS dưới 5m; "
        "(2) Định tuyến OSRM tách 2 làn cho xe máy công an phường luồn ngõ hẹp và ô tô cứu hỏa/cứu thương đi đường lớn; "
        "(3) Mô hình dữ liệu 1-to-N hiển thị đầy đủ các cơ sở trong cùng 1 phường sau sáp nhập và tính khoảng cách từ thiết bị; "
        "(4) Cơ chế đếm ngược 15 phút tự động chuyển cấp lên Thành phố; (5) Ký số Canvas xuất biên bản chuẩn Nghị định 30."
    )

    # =========================================================================
    # SLIDE 6: TIÊU CHÍ 5 - MỨC ĐỘ HOÀN THIỆN HIỆN TẠI CỦA SẢN PHẨM (80%)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)
    add_header(
        s6,
        "TIÊU CHÍ 05 // MỨC ĐỘ HOÀN THIỆN HIỆN TẠI CỦA SẢN PHẨM (ĐẠT 80% — TRL 7)",
        "Mức Độ Hoàn Thiện Đạt 80%: Hệ Sinh Thái Lõi Đã Vận Hành Thực Tế",
        "Đánh giá trung thực, định lượng rõ 80% khối lượng đã hoàn thành chạy thật trên Web/PWA và 20% lộ trình tích hợp mở rộng:",
        badge_color=GREEN_ACCENT,
    )

    # Visual Progress Bar Container (80% Green / 20% Amber)
    prog_bg = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.65), Inches(1.65), Inches(12.0), Inches(0.62))
    prog_bg.adjustments[0] = 0.2
    prog_bg.fill.solid()
    prog_bg.fill.fore_color.rgb = CARD_BG_ALT
    prog_bg.line.color.rgb = BORDER_SUBTLE

    prog_80 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.68), Inches(1.68), Inches(9.55), Inches(0.56))
    prog_80.adjustments[0] = 0.2
    prog_80.fill.solid()
    prog_80.fill.fore_color.rgb = GREEN_ACCENT
    prog_80.line.fill.background()
    tf_p80 = prog_80.text_frame
    p_80 = tf_p80.paragraphs[0]
    p_80.alignment = PP_ALIGN.CENTER
    p_80.text = "✓ 80% ĐÃ HOÀN THIỆN & VẬN HÀNH THỰC TẾ (TRL 7 — LIVE PROTOTYPE)"
    p_80.font.name = "Arial"
    p_80.font.size = Pt(13)
    p_80.font.bold = True
    p_80.font.color.rgb = RGBColor(5, 20, 15)

    tb_p20 = s6.shapes.add_textbox(Inches(10.25), Inches(1.72), Inches(2.35), Inches(0.48))
    tf_p20 = tb_p20.text_frame
    p_20 = tf_p20.paragraphs[0]
    p_20.alignment = PP_ALIGN.CENTER
    p_20.text = "20% Đang phát triển"
    p_20.font.name = "Arial"
    p_20.font.size = Pt(12)
    p_20.font.bold = True
    p_20.font.color.rgb = GOLD_ACCENT

    add_card(
        s6, 0.65, 2.42, 7.65, 4.60,
        "✅ 80% KHỐI LƯỢNG ĐÃ HOÀN THIỆN & SẴN SÀNG LIVE DEMO NGAY",
        [
            ("1. Cổng Người Dân PWA (100% module lõi): ", "Nút SOS Orb 1-chạm, chọn 5 lực lượng, định vị GPS Kalman, tự động đo khoảng cách từ thiết bị tới cơ sở gần nhất, gửi ảnh hiện trường, cẩm nang offline."),
            ("2. Bàn Chỉ Huy C4ISR & Bản Đồ GIS (100% module lõi): ", "Đồng bộ 34 tỉnh, 3.321 xã/phường sáp nhập và 417 điểm Công an TP Hà Nội (hiển thị đa cơ sở & huy hiệu [Cơ sở gần nhất])."),
            ("3. Đàm Thoại WebRTC P2P & Ghi Âm Chống Hú (100%): ", "Gọi thoại/video 2 chiều giữa Dân ↔ Trực ban và Liên đơn vị; ghi âm MP3 tại trình duyệt tuân thủ Nghị định 13."),
            ("4. Quản Lý Kíp Trực & Chuyển Cấp 15 Phút (100%): ", "Tách biệt ca trực theo từng đơn vị, đồng hồ đếm ngược 15 phút và nút 'Chuyển cấp Thành phố' thời gian thực."),
            ("5. Tự Động Hóa Hành Chính & Chống Báo Giả (100%): ", "Ký số Canvas xuất biên bản Word A4 Nghị định 30; kho lưu trữ báo khống Nghị định 144; đồng bộ Excel 4 sheet."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=11.5,
    )

    add_card(
        s6, 8.50, 2.42, 4.15, 4.60,
        "🔧 20% HẠNG MỤC ĐANG HOÀN THIỆN TIẾP",
        [
            ("1. Tích hợp cổng VNeID (5%): ", "Đấu nối API định danh điện tử mức 2 khi có luồng sandbox chính thức từ Cục C06."),
            ("2. Mô hình AI Thị giác & Giọng nói (5%): ", "Huấn luyện thêm tập dữ liệu tiếng Việt địa phương & nhận diện đám cháy qua camera."),
            ("3. Mở rộng 63/63 tỉnh thành (5%): ", "Tiếp tục chuẩn hóa tọa độ chi tiết cho 29 tỉnh/thành còn lại."),
            ("4. Đóng gói Mobile Native & IoT (5%): ", "Đóng gói bản cài đặt iOS/Android độc lập và cổng kết nối cảm biến báo cháy."),
        ],
        accent_color=GOLD_ACCENT,
        body_size=11.5,
    )

    add_speaker_notes(
        s6,
        "Tiêu chí 5 - Mức độ hoàn thiện hiện tại: Đội thi đánh giá mức độ hoàn thiện hiện tại của sản phẩm đạt 80% (cấp độ TRL 7). "
        "Toàn bộ 80% tính năng cốt lõi phục vụ người dân và cán bộ trực ban đã vận hành thực tế trên nền tảng Web và PWA. "
        "20% còn lại là các hạng mục tích hợp sâu ở cấp độ quốc gia như kết nối API VNeID chính thức của C06, huấn luyện sâu AI và mở rộng từ 34 lên 63 tỉnh thành."
    )

    # =========================================================================
    # SLIDE 7: TIÊU CHÍ 6 - KHẢ NĂNG VẬN HÀNH VÀ ỨNG DỤNG TRONG THỰC TẾ
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)
    add_header(
        s7,
        "TIÊU CHÍ 06 // KHẢ NĂNG VẬN HÀNH VÀ ỨNG DỤNG TRONG THỰC TẾ",
        "Sẵn Sàng Vận Hành Thực Địa Với Cơ Sở Dữ Liệu Tháng 10/2026",
        "Hệ thống không dùng dữ liệu giả lập mà vận hành trực tiếp trên danh bạ hành chính và đồn trạm thực tế:",
        badge_color=CYAN_ACCENT,
    )

    # 4 Top Metric Boxes
    add_metric_box(s7, 0.65, 1.70, 2.80, 1.55, "34 Tỉnh/TP", "Địa Giới Hành Chính Mới", "Đồng bộ từ bando.com.vn", CYAN_ACCENT)
    add_metric_box(s7, 3.70, 1.70, 2.80, 1.55, "3.321 Xã", "Xã/Phường Sau Sáp Nhập", "Cập nhật chuẩn T10/2026", GREEN_ACCENT)
    add_metric_box(s7, 6.75, 1.70, 2.80, 1.55, "548 Đơn Vị", "Tài Khoản Trực Ban", "Phân quyền RBAC 6 cấp", GOLD_ACCENT)
    add_metric_box(s7, 9.80, 1.70, 2.85, 1.55, "417 Trụ Sở", "Công An TP Hà Nội", "Đủ tọa độ, SĐT & thủ tục", RED_ACCENT)

    add_card(
        s7, 0.65, 3.45, 5.85, 3.55,
        "4 Kịch Bản Ứng Dụng Thực Tế Điển Hình",
        [
            ("• Kịch bản 1 - Trợ giúp người yếu thế: ", "Người già đột quỵ, người câm điếc bấm 1 chạm gửi vị trí GPS chính xác về Công an/Y tế phường gần nhất."),
            ("• Kịch bản 2 - Hiệp đồng đa lực lượng (Hà Nội & Cần Thơ): ", "Tai nạn liên hoàn hoặc cháy lớn -> điều động đồng thời Công an phường mở đường (xe 2 bánh) và PCCC/115 (ô tô lớn)."),
            ("• Kịch bản 3 - Ứng phó quá tải mùa mưa bão: ", "Tự động chuyển tiếp ca sang đơn vị lân cận hoặc leo thang lên cấp Thành phố sau 15 phút."),
            ("• Kịch bản 4 - Số hóa thủ tục & tra cứu: ", "Người dân tra cứu điểm tiếp dân làm CCCD, đăng ký cư trú gần thiết bị nhất."),
        ],
        accent_color=CYAN_ACCENT,
        body_size=11.5,
    )

    add_card(
        s7, 6.80, 3.45, 5.85, 3.55,
        "Chi Phí Triển Khai Thấp & Quản Trị Dễ Dàng",
        [
            ("• Triển khai tức thì trên hạ tầng sẵn có: ", "Chạy trên máy tính trực ban và điện thoại thông minh sẵn có của CBCS, không đòi hỏi mua sắm phần cứng chuyên dụng đắt đỏ."),
            ("• Quản trị danh bạ bằng Excel 4 Sheet quen thuộc: ", "Cán bộ hành chính dễ dàng cập nhật số điện thoại trực ban, danh sách đồn trạm chỉ trong 12ms."),
            ("• Vận hành bền vững 24/7: ", "Tự động làm sạch dữ liệu rác (đã lọc bỏ 100% đơn vị không phải cấp tác chiến trực tiếp), đảm bảo danh bạ luôn chính xác."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=11.5,
    )

    add_speaker_notes(
        s7,
        "Tiêu chí 6 - Khả năng vận hành thực tế: Hệ thống đã nạp sẵn dữ liệu thực tế của 34 tỉnh thành, 3.321 xã phường sau sáp nhập, "
        "548 tài khoản trực ban và toàn bộ 417 điểm Công an TP Hà Nội kèm số điện thoại, thủ tục hành chính và tọa độ GPS. "
        "Cán bộ trực ban sử dụng ngay trên máy tính sẵn có và quản lý danh bạ qua file Excel quen thuộc."
    )

    # =========================================================================
    # SLIDE 8: TIÊU CHÍ 7 - KẾT QUẢ THỬ NGHIỆM / KIỂM CHỨNG (NẾU CÓ)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8)
    add_header(
        s8,
        "TIÊU CHÍ 07 // KẾT QUẢ THỬ NGHIỆM VÀ KIỂM CHỨNG THỰC NGHIỆM",
        "Được Kiểm Chứng Bằng Bộ Test Tự Động Playwright E2E & Đo Kiểm Độc Lập",
        "Toàn bộ chỉ số kỹ thuật đều có báo cáo kiểm thử tự động (.json / .md) và ảnh chụp màn hình nghiệm thu:",
        badge_color=GREEN_ACCENT,
    )

    add_metric_box(s8, 0.65, 1.70, 2.80, 1.50, "98 / 100", "Google Lighthouse", "Nạp đầu 0.79s | Cache 0.135s", GREEN_ACCENT)
    add_metric_box(s8, 3.70, 1.70, 2.80, 1.50, "45 ms", "Độ Trễ SSE Thực Tế", "Truyền tín hiệu SOS tức thì", CYAN_ACCENT)
    add_metric_box(s8, 6.75, 1.70, 2.80, 1.50, "10.000 req/s", "Chịu Tải Máy Chủ", "0.00% lỗi (Autocannon Test)", GOLD_ACCENT)
    add_metric_box(s8, 9.80, 1.70, 2.85, 1.50, "100% PASS", "Playwright E2E Suite", "Kiểm thử đa luồng tự động", RED_ACCENT)

    add_card(
        s8, 0.65, 3.40, 12.00, 3.60,
        "Bảng Tổng Hợp Kết Quả Kiểm Chứng Kỹ Thuật & Nghiệm Thu Tính Năng",
        [
            ("1. Kiểm chứng Định vị & Khoảng cách từ thiết bị (Playwright QA): ", "100% PASS — Xác nhận tính khoảng cách Haversine trực tiếp từ thiết bị sử dụng App tới từng trụ sở (VD: Cơ sở 4 Công an phường Ba Đình cách 0.50km gắn nhãn [Cơ sở gần nhất], Trụ sở chính cách 1.07km)."),
            ("2. Kiểm chứng Đàm thoại WebRTC 2 chiều & Chống hú (Multi-Context E2E): ", "10/10 PASS — Giọng nói truyền qua 2 thiết bị có chỉ số RMS VU Meter > 0 đồng thời trên cả Local và Remote; không phát sinh tiếng hú (muteGain = 0)."),
            ("3. Kiểm chứng Cô lập Ca trực & Chuyển cấp 15 phút: ", "100% PASS — Không hiện cảnh báo hết ca khi chưa đăng nhập; ca trực của đơn vị nào chỉ hiển thị cho đơn vị đó; nút 'Chuyển cấp Thành phố' cập nhật tức thì."),
            ("4. Kiểm chứng An toàn dữ liệu & Giao diện chuẩn hóa: ", "Loại bỏ 100% thực thể phi tác chiến và lỗi mã hóa ký tự (&amp;); giao diện đồng bộ font Hubot Sans, thanh trượt và các nút điều khiển hiển thị gọn 100% trong khung."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=12,
    )

    add_speaker_notes(
        s8,
        "Tiêu chí 7 - Kết quả thử nghiệm và kiểm chứng: Hệ thống đạt 98/100 điểm Google Lighthouse, mở trang trong 0.79 giây, "
        "độ trễ truyền tin SSE 45ms, chịu tải 10.000 request/giây với 0% lỗi. Đặc biệt, đội thi đã xây dựng bộ kịch bản kiểm thử tự động "
        "Playwright E2E vượt qua 100% bài test về đàm thoại WebRTC 2 chiều, tính khoảng cách từ thiết bị và chuyển cấp 15 phút."
    )

    # =========================================================================
    # SLIDE 9: TIÊU CHÍ 8 - TIỀM NĂNG PHÁT TRIỂN VÀ KHẢ NĂNG MỞ RỘNG
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9)
    add_header(
        s9,
        "TIÊU CHÍ 08 // TIỀM NĂNG PHÁT TRIỂN VÀ KHẢ NĂNG MỞ RỘNG CỦA SẢN PHẨM",
        "Lộ Trình Hoàn Thiện 20% Còn Lại Để Đạt 100% Quy Mô Quốc Gia",
        "Kiến trúc mở sẵn sàng tích hợp vào hạ tầng số của Bộ Công an và mở rộng toàn diện trên 63/63 tỉnh/thành phố:",
        badge_color=PURPLE_ACCENT,
    )

    add_card(
        s9, 0.65, 1.70, 5.85, 2.55,
        "1. Tích Hợp Sâu Định Danh Điện Tử VNeID (Đề Án 06)",
        [
            ("• Nhúng Mini-App / OAuth2 VNeID mức 2: ", "Khi Cục C06 cấp quyền kết nối API Gateway, người dân bấm SOS sẽ tự động đính kèm định danh đã xác thực."),
            ("• Triệt tiêu 100% cuộc gọi nặc danh báo giả: ", "Rút ngắn thời gian xác minh nhân thân nạn nhân xuống 0 giây."),
        ],
        accent_color=CYAN_ACCENT,
        body_size=12,
    )

    add_card(
        s9, 6.80, 1.70, 5.85, 2.55,
        "2. Trí Tuệ Nhân Tạo Đa Phương Thức (Vision & Speech AI)",
        [
            ("• Computer Vision AI tại hiện trường: ", "Tự động phân tích ảnh/video người dân gửi về để nhận diện quy mô đám cháy, khói độc, ngập lụt hoặc tai nạn."),
            ("• Speech-to-Text khẩn cấp: ", "Tự động bóc tách từ khóa cầu cứu và địa danh từ giọng nói hoảng loạn của nạn nhân."),
        ],
        accent_color=GOLD_ACCENT,
        body_size=12,
    )

    add_card(
        s9, 0.65, 4.45, 5.85, 2.55,
        "3. Mở Rộng Toàn Quốc 63/63 Tỉnh Thành & Liên Ngành",
        [
            ("• Từ 34 tỉnh/thành lên 63/63 tỉnh/thành: ", "Nhân rộng mô hình dữ liệu đa cơ sở 1-to-N của Hà Nội và Cần Thơ ra toàn bộ hơn 10.000 xã/phường toàn quốc."),
            ("• Kiến trúc Cloud-Native / Kubernetes: ", "Dễ dàng nâng tải lên hàng trăm nghìn kết nối đồng thời trên hạ tầng Trung tâm Dữ liệu Quốc gia."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=12,
    )

    add_card(
        s9, 6.80, 4.45, 5.85, 2.55,
        "4. Hệ Sinh Thái IoT Đô Thị Thông Minh & Drone Cứu Nạn",
        [
            ("• Kết nối cảm biến IoT PCCC & Cảnh báo lũ: ", "Tự động phát tín hiệu SOS về Bàn trực ban khi cảm biến khói chung cư hoặc mực nước vượt ngưỡng nguy hiểm."),
            ("• Điều phối Drone / UAV trinh sát: ", "Bay trước tới vùng ngập lụt, sạt lở để truyền hình ảnh trực tiếp và thả phao cứu sinh."),
        ],
        accent_color=PURPLE_ACCENT,
        body_size=12,
    )

    add_speaker_notes(
        s9,
        "Tiêu chí 8 - Tiềm năng phát triển và khả năng mở rộng: Để đi từ 80% hiện tại lên 100% quy mô quốc gia, hệ thống định hướng 4 trụ cột: "
        "(1) Tích hợp sâu VNeID của Bộ Công an theo Đề án 06; (2) Ứng dụng Computer Vision AI và Speech AI phân tích hiện trường; "
        "(3) Phủ kín 63/63 tỉnh thành trên hạ tầng Trung tâm Dữ liệu Quốc gia; (4) Kết nối cảm biến IoT báo cháy và Drone cứu nạn."
    )

    # =========================================================================
    # SLIDE 10: TỔNG KẾT & THÔNG TIN TRUY CẬP LIVE DEMO CHO BAN GIÁM KHẢO
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10)
    add_header(
        s10,
        "TỔNG KẾT & TRẢI NGHIỆM TRỰC TIẾP SẢN PHẨM (LIVE DEMO)",
        "Mỗi Giây Dữ Liệu Được Rút Ngắn Hôm Nay Là Một Sinh Mạng Được Giữ Lại Ngày Mai!",
        "Hệ thống sẵn sàng để Hội đồng Giám khảo truy cập và kiểm thử trực tiếp ngay tại phòng thi:",
        badge_color=GOLD_ACCENT,
    )

    add_card(
        s10, 0.65, 1.70, 6.20, 3.65,
        "🌐 THÔNG TIN TRUY CẬP HỆ THỐNG LIVE DEMO",
        [
            ("• Cổng Người dân (PWA 1-Chạm): ", "https://sos-vietnam-2026.onrender.com"),
            ("• Bàn Trực ban Chỉ huy C4ISR: ", "https://sos-vietnam-2026.onrender.com/dispatcher.html"),
            ("• Mã PIN An ninh Gatekeeper: ", "2002  |  Mật khẩu dùng chung BGK: 2002"),
            ("• Tài khoản khảo sát các cấp: ", "admin (Quốc gia) | cahanoi (TP Hà Nội) | cact (TP Cần Thơ) | pcccninhkieu (PCCC) | 115ninhkieu (Y tế 115)"),
            ("• Mã nguồn gốc (GitHub): ", "https://github.com/Tinhhhh/sos-vietnam-2026.git"),
        ],
        accent_color=CYAN_ACCENT,
        body_size=12,
    )

    add_card(
        s10, 7.05, 1.70, 5.60, 3.65,
        "🏆 TÓM TẮT 8 TIÊU CHÍ ĐẠT ĐƯỢC",
        [
            ("1. Vấn đề thực tiễn: ", "Giải bài toán 5 phút vàng & người yếu thế (ASXH-07)."),
            ("2. Giải pháp khác biệt: ", "1 chạm cho dân — 1 bản đồ 5 lực lượng cho cán bộ."),
            ("3. Công nghệ: ", "PWA, SSE 45ms, WebRTC chống hú, Haversine GIS, WAF L7."),
            ("4. Sáng tạo: ", "Kalman <5m, OSRM 2 làn, đa cơ sở 1-to-N, leo thang 15p."),
            ("5. Hoàn thiện: ", "Đạt 80% (TRL 7 — Live Prototype chạy thực tế)."),
            ("6–8. Vận hành, Kiểm chứng & Mở rộng: ", "34 tỉnh, 3.321 xã, 417 trạm HN, 100% PASS E2E, sẵn sàng tích hợp VNeID."),
        ],
        accent_color=GREEN_ACCENT,
        body_size=11.5,
    )

    # Closing Quote Banner
    q_box = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.65), Inches(5.55), Inches(12.0), Inches(1.45))
    q_box.adjustments[0] = 0.08
    q_box.fill.solid()
    q_box.fill.fore_color.rgb = CARD_BG_ALT
    q_box.line.color.rgb = GOLD_ACCENT
    q_box.line.width = Pt(1.5)

    tb_q = s10.shapes.add_textbox(Inches(0.85), Inches(5.65), Inches(11.6), Inches(1.25))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True
    pq1 = tf_q.paragraphs[0]
    pq1.alignment = PP_ALIGN.CENTER
    pq1.text = "“Trong kỷ nguyên chuyển đổi số quốc gia, khi dữ liệu số có thể đi nhanh hơn cả tiếng còi xe cứu thương —"
    pq1.font.name = "Arial"
    pq1.font.size = Pt(13.5)
    pq1.font.bold = True
    pq1.font.italic = True
    pq1.font.color.rgb = GOLD_ACCENT
    pq1.space_after = Pt(4)

    pq2 = tf_q.add_paragraph()
    pq2.alignment = PP_ALIGN.CENTER
    pq2.text = "Liệu chúng ta có thể cho phép bất kỳ người dân nào phải đơn độc trong 5 phút sinh tử của cuộc đời mình chỉ vì một rào cản kết nối?”"
    pq2.font.name = "Arial"
    pq2.font.size = Pt(13.5)
    pq2.font.bold = True
    pq2.font.italic = True
    pq2.font.color.rgb = TEXT_WHITE

    add_speaker_notes(
        s10,
        "Kính thưa Hội đồng Giám khảo, với mức độ hoàn thiện hiện tại đạt 80% và vận hành thực tế ổn định trên dữ liệu 34 tỉnh thành, "
        "3.321 xã phường cùng 417 trụ sở Công an Hà Nội, đội thi sẵn sàng trình diễn Live Demo ngay bây giờ. Xin trân trọng cảm ơn!"
    )

    prs.save(PPTX_OUT)
    print(f"[OK] Generated 8-Criteria PPTX Presentation: {PPTX_OUT}")

    for d in SYNC_DIRS:
        if os.path.isdir(d):
            target = os.path.join(d, os.path.basename(PPTX_OUT))
            shutil.copy2(PPTX_OUT, target)
            print(f"[OK] Synced PPTX to: {target}")


def update_existing_10min_pptx_to_80_percent():
    """Also syncs Slide 6 of SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx to 80% completion."""
    paths = [
        r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT\SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx",
        r"C:\Users\dienv\Desktop\docs\thuyết trình\SLIDE_THUYET_TRINH_10_PHUT_SOS_VIET_NAM_2026.pptx",
    ]
    existing = [p for p in paths if os.path.isfile(p)]
    if not existing:
        return
    prs = Presentation(existing[0])
    if len(prs.slides) >= 6:
        s6 = prs.slides[5]
        for sh in s6.shapes:
            if sh.has_text_frame and "100%" in sh.text:
                for para in sh.text_frame.paragraphs:
                    if "100%" in para.text:
                        para.text = para.text.replace("100%", "80% (TRL 7 - LIVE PROTOTYPE)")
                        para.font.name = "Arial"
                        para.font.size = Pt(12)
                        para.font.bold = True
                        para.font.color.rgb = GREEN_ACCENT
    for p in existing:
        prs.save(p)
        print(f"[OK] Updated completion badge to 80% in: {p}")


def build_docx_presentation_script():
    """Generates a comprehensive Word (.docx) presentation script & Q&A answering all 8 criteria."""
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = DocxCm(1.8)
        s.bottom_margin = DocxCm(1.8)
        s.left_margin = DocxCm(2.2)
        s.right_margin = DocxCm(1.8)

    def add_title_block():
        p0 = doc.add_paragraph()
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = DocxPt(0)
        p0.paragraph_format.space_after = DocxPt(4)
        r0 = p0.add_run("TÀI LIỆU THUYẾT TRÌNH & GIẢI ĐÁP 8 TIÊU CHÍ ĐÁNH GIÁ TRỌNG TÂM\n")
        r0.font.name = "Times New Roman"
        r0.font.size = DocxPt(14)
        r0.bold = True
        r0.font.color.rgb = DocxRGB(0, 51, 102)

        r1 = p0.add_run("HỆ THỐNG DỮ LIỆU VÀ ĐIỀU PHỐI CỨU HỘ KHẨN CẤP ĐA LỰC LƯỢNG SOS VIỆT NAM 2026\n")
        r1.font.name = "Times New Roman"
        r1.font.size = DocxPt(15)
        r1.bold = True
        r1.font.color.rgb = DocxRGB(180, 0, 0)

        r2 = p0.add_run("(Mã đề bài: ASXH-07 | Cuộc thi Data for Life 2026 — Mức độ hoàn thiện hiện tại: 80% - TRL 7)")
        r2.font.name = "Times New Roman"
        r2.font.size = DocxPt(11.5)
        r2.bold = True
        r2.italic = True
        r2.font.color.rgb = DocxRGB(0, 120, 60)

    def add_section_h1(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = DocxPt(10)
        p.paragraph_format.space_after = DocxPt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = DocxPt(13)
        r.bold = True
        r.font.color.rgb = DocxRGB(0, 51, 102)

    def add_bullet(prefix, body):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = DocxPt(0)
        p.paragraph_format.space_after = DocxPt(3)
        p.paragraph_format.line_spacing = 1.15
        r1 = p.add_run(prefix)
        r1.font.name = "Times New Roman"
        r1.font.size = DocxPt(11.5)
        r1.bold = True
        r2 = p.add_run(body)
        r2.font.name = "Times New Roman"
        r2.font.size = DocxPt(11.5)

    add_title_block()

    # 1. VẤN ĐỀ THỰC TIỄN
    add_section_h1("1. VẤN ĐỀ THỰC TIỄN MÀ ĐỘI THI HƯỚNG TỚI GIẢI QUYẾT")
    add_bullet("• Bài toán sinh tử '5 Phút Vàng': ", "Trong cấp cứu y tế, phòng cháy chữa cháy và cứu nạn cứu hộ (CNCH), 5 đến 10 phút đầu tiên quyết định trực tiếp đến sinh mạng của người dân. Tuy nhiên, quy trình báo nạn hiện hành đang gặp 4 điểm nghẽn lớn:")
    add_bullet("  (1) Phân mảnh 3 đầu số (113 - 114 - 115): ", "Hoạt động độc lập, thiếu bản đồ tác chiến chung. Khi xảy ra sự cố liên ngành (tai nạn giao thông liên hoàn, cháy nổ có người mắc kẹt), người dân phải gọi nhiều đầu số, lặp lại thông tin nhiều lần làm mất 3–7 phút vàng.")
    add_bullet("  (2) Mù định vị hiện trường trong ngõ hẻm, sông nước & sau sáp nhập hành chính: ", "Cuộc gọi thoại phụ thuộc vào mô tả miệng của nạn nhân đang hoảng loạn. Đặc biệt tại các địa bàn vừa sáp nhập xã/phường (tháng 10/2026), ngõ hẻm sâu dưới 2m hoặc vùng kênh rạch sông nước, nạn nhân không biết chính xác mình đang thuộc địa bàn cơ sở công an nào.")
    add_bullet("  (3) Vấn nạn báo giả & nghẽn mạng khi thiên tai: ", "40%–60% cuộc gọi ban đêm là cuộc gọi trêu đùa, báo khống gây lãng phí ngân sách xuất xe công vụ; khi bão lũ lớn xảy ra, tổng đài thoại truyền thống dễ bị nghẽn mạch.")
    add_bullet("  (4) Rào cản tuyệt đối với người yếu thế (Mã đề bài ASXH-07): ", "Người câm điếc, người khuyết tật, người cao tuổi đột quỵ một mình hoặc nạn nhân bị ngạt khói không thể giao tiếp bằng giọng nói qua điện thoại.")

    # 2. GIẢI PHÁP VÀ ĐIỂM KHÁC BIỆT
    add_section_h1("2. GIẢI PHÁP VÀ ĐIỂM KHÁC BIỆT CỦA SẢN PHẨM")
    add_bullet("• Kiến trúc 2 phân hệ hợp nhất: ", "SOS Việt Nam 2026 biến điện thoại người dân thành 'Phao cứu sinh 1-chạm' (Cổng Web PWA không cần cài App, không cần đăng ký tài khoản) và trang bị cho lực lượng chức năng 'Bàn chỉ huy tác chiến C4ISR 3D' hợp nhất cả 5 lực lượng: Cảnh sát (113), PCCC & CNCH (114), Y tế (115), CSGT và Cứu hộ dịch vụ.")
    add_bullet("• 5 Điểm khác biệt vượt trội: ", "")
    add_bullet("  + Tính khoảng cách thực tế từ thiết bị người dùng: ", "Hệ thống tự động đo khoảng cách Haversine trực tiếp từ vị trí thiết bị sử dụng App đến từng trụ sở cơ quan xung quanh và gắn nhãn [Cơ sở gần nhất].")
    add_bullet("  + Thích ứng mô hình Đa cơ sở (Multi-Facility 1-to-N) sau sáp nhập: ", "Hiển thị đầy đủ cả Trụ sở chính lẫn các Cơ sở 2, 3, 4 và Điểm tiếp dân trong cùng một phường trên bản đồ, tự động định tuyến SOS về cơ sở có khoảng cách gần nạn nhân nhất.")
    add_bullet("  + Chuyển cấp leo thang tự động 15 phút (Timeout Escalation): ", "Mỗi sự cố có đồng hồ đếm ngược 15 phút; nếu cấp cơ sở quá tải chưa xử lý, hệ thống tự động cảnh báo đỏ và cho phép chuyển cấp lên Công an/PCCC/CSGT cấp Thành phố/Tỉnh.")
    add_bullet("  + Cô lập ca trực độc lập theo từng Đơn vị (Unit-Scoped Duty Shift): ", "Mỗi đơn vị trực ban có không gian quản lý kíp trực, bàn giao ca và nhận cảnh báo riêng biệt.")
    add_bullet("  + Hỗ trợ toàn diện người yếu thế: ", "Thao tác hoàn toàn bằng thẻ hình ảnh tình huống trực quan, gửi kèm ảnh chụp hiện trường và vị trí GPS cho cả trực ban lẫn người thân.")

    # 3. CÔNG NGHỆ SỬ DỤNG
    add_section_h1("3. CÔNG NGHỆ ĐƯỢC SỬ DỤNG")
    add_bullet("• Giao diện & Bản đồ số (Frontend & GIS): ", "HTML5/CSS3/ES6+ Native (Zero-Framework Overhead) kết hợp Progressive Web App (Service Worker Offline-First), đồng bộ nhận diện font chữ Hubot Sans hiện đại; bản đồ số MapLibre GL / Leaflet tích hợp lớp phủ GeoJSON 3.321 xã/phường.")
    add_bullet("• Máy chủ & Truyền dẫn thời gian thực (Backend & Real-time): ", "Node.js Native HTTP/ESM kết hợp Server-Sent Events (SSE) và WebSocket truyền phát sự cố với độ trễ chỉ 45ms.")
    add_bullet("• Đàm thoại WebRTC P2P & Web Audio Graph chống hú: ", "Đàm thoại thoại/video 2 chiều ngang hàng (Multi-STUN + HTTP Long-Polling Fallback). Mạch âm thanh Web Audio API tách kênh Local/Remote với muteGain = 0.0 triệt tiêu 100% tiếng hú, đo cường độ âm thanh RMS 2 chiều và mã hóa MP3 trực tiếp trên RAM trình duyệt bằng lamejs (Zero Server Storage Retention — tuân thủ Nghị định 13/2023/NĐ-CP).")
    add_bullet("• An toàn thông tin & Bảo mật: ", "Tường lửa ứng dụng WAF L7 chặn 27 chữ ký AI Bot/Scraper, thuật toán băm mật khẩu PBKDF2-SHA512 (100.000 vòng lặp) và cơ chế ghi dữ liệu nguyên tử (.tmp -> rename).")

    # 4. TÍNH SÁNG TẠO
    add_section_h1("4. TÍNH SÁNG TẠO CỦA GIẢI PHÁP")
    add_bullet("• Thuật toán lọc nhiễu GPS Kalman Filter 1D/2 trục: ", "Khử 92.25% sai số nhảy tọa độ vệ tinh trong ngõ hẹp hoặc nhà cao tầng, hội tụ vị trí chính xác dưới 5 mét.")
    add_bullet("• Phân tuyến thông minh OSRM 2 làn phương tiện: ", "Tách biệt đường nét đứt màu xanh lá cho xe máy Công an xã/phường luồn ngõ hẹp (<2m) tiếp cận trước 2–4 phút và đường nét liền màu xanh dương cho xe chữa cháy/xe cứu thương cỡ lớn.")
    add_bullet("• Cơ chế truyền tin 3 kênh bất tử: ", "Tự động chuyển đổi mượt mà từ kênh Online (WSS/SSE) sang kênh SMS Fallback nén dưới 70 ký tự khi mất sóng 4G và lưu trữ ngoại tuyến IndexedDB tự đồng bộ lại khi có mạng.")
    add_bullet("• Số hóa pháp lý hiện trường (Nghị định 30 & Nghị định 144): ", "Bảng vẽ chữ ký số cảm ứng HTML5 Canvas xuất biên bản Word (.docx) đúng chuẩn 1 trang A4 Nghị định 30/2020/NĐ-CP; tự động trích xuất chứng cứ số OSINT lập hồ sơ xử phạt hành vi báo giả 4–6 triệu đồng theo Nghị định 144/2021/NĐ-CP.")

    # 5. MỨC ĐỘ HOÀN THIỆN HIỆN TẠI (80%)
    add_section_h1("5. MỨC ĐỘ HOÀN THIỆN HIỆN TẠI CỦA SẢN PHẨM (ĐẠT 80% — TRL 7)")
    add_bullet("• Đánh giá tổng thể — Hoàn thiện 80% (Cấp độ TRL 7 - Hệ thống nguyên mẫu vận hành thực tế): ", "Sản phẩm không dừng ở mức ý tưởng hay thiết kế giao diện mà đã hoàn thiện 80% toàn bộ khối lượng mục tiêu, đang vận hành trực tuyến ổn định và sẵn sàng Live Demo 100% luồng nghiệp vụ cốt lõi:")
    add_bullet("  + Phần 80% ĐÃ HOÀN THIỆN & CHẠY THỰC TẾ: ", "(1) Cổng PWA Người dân 1-chạm; (2) Bàn chỉ huy C4ISR hợp nhất 5 lực lượng; (3) Cơ sở dữ liệu 34 tỉnh/thành, 3.321 xã/phường sau sáp nhập, 548 đơn vị trực ban và 417 điểm Công an TP Hà Nội; (4) Định vị Kalman & tính khoảng cách trực tiếp từ thiết bị đến cơ sở gần nhất; (5) Đàm thoại WebRTC 2 chiều chống hú & ghi âm MP3; (6) Quản lý ca trực độc lập theo đơn vị & chuyển cấp 15 phút; (7) Ký số Canvas xuất biên bản Word Nghị định 30, kho báo khống Nghị định 144 & đồng bộ Excel 4 sheet.")
    add_bullet("  + Phần 20% ĐANG TIẾP TỤC PHÁT TRIỂN HOÀN THIỆN: ", "(1) Đấu nối API định danh điện tử VNeID mức 2 chính thức từ Cục C06 (5%); (2) Huấn luyện sâu mô hình AI Thị giác máy tính & Nhận diện giọng nói tiếng Việt đa phương ngữ (5%); (3) Mở rộng dữ liệu chi tiết từ 34 tỉnh/thành lên trọn vẹn 63/63 tỉnh/thành (5%); (4) Đóng gói ứng dụng Mobile Native độc lập và cổng tích hợp cảm biến IoT/Drone (5%).")

    # 6. KHẢ NĂNG VẬN HÀNH VÀ ỨNG DỤNG THỰC TẾ
    add_section_h1("6. KHẢ NĂNG VẬN HÀNH VÀ ỨNG DỤNG TRONG THỰC TẾ")
    add_bullet("• Sẵn sàng triển khai ngay với chi phí hạ tầng tối thiểu: ", "Người dân truy cập trực tiếp bằng trình duyệt điện thoại không cần cài đặt; cán bộ chiến sĩ vận hành ngay trên máy tính trực ban sẵn có của đơn vị.")
    add_bullet("• Dữ liệu thực tế chuẩn hóa đến cấp cơ sở: ", "Đã tích hợp đầy đủ 417 trụ sở và điểm tiếp dân Công an TP Hà Nội (kèm địa chỉ, số điện thoại trực ban, thủ tục hành chính và tọa độ GPS) cùng 3.321 xã/phường tại 34 tỉnh/thành phố (Hà Nội, TP.HCM, Cần Thơ, Đà Nẵng...).")
    add_bullet("• Thân thiện với cán bộ cơ sở: ", "Hỗ trợ nhập/xuất danh bạ đơn vị qua tệp Excel 4 sheet chỉ trong 12ms; tự động lọc bỏ các thực thể phi tác chiến để giữ sạch dữ liệu chỉ huy.")

    # 7. KẾT QUẢ THỬ NGHIỆM / KIỂM CHỨNG
    add_section_h1("7. KẾT QUẢ THỬ NGHIỆM VÀ KIỂM CHỨNG THỰC NGHIỆM")
    add_bullet("• Hiệu năng Web & Máy chủ (Google Lighthouse & Autocannon): ", "Điểm hiệu năng Lighthouse đạt 98/100; thời gian mở trang lần đầu 0.79 giây (từ bộ nhớ đệm 0.135 giây); độ trễ truyền phát sự cố SSE 45ms; chịu tải 10.000 requests/giây với tỷ lệ lỗi 0.00%.")
    add_bullet("• Độ chính xác định vị & khoảng cách: ", "Sai số thực địa sau lọc Kalman đạt 2.8 – 4.2 mét; kiểm chứng tự động xác nhận tính khoảng cách chính xác từ thiết bị người dùng đến từng cơ sở trong phường.")
    add_bullet("• Kiểm thử tự động toàn diện (Playwright E2E Suite): ", "Đạt 100% PASS trên toàn bộ kịch bản kiểm thử tự động: cô lập ca trực theo đơn vị, hiển thị đa cơ sở trên bản đồ & ngăn kéo chi tiết, đếm ngược 15 phút chuyển cấp Thành phố, đàm thoại WebRTC 2 chiều giữa 2 thiết bị và chuẩn hóa giao diện hiển thị.")

    # 8. TIỀM NĂNG PHÁT TRIỂN VÀ MỞ RỘNG
    add_section_h1("8. TIỀM NĂNG PHÁT TRIỂN VÀ KHẢ NĂNG MỞ RỘNG CỦA SẢN PHẨM")
    add_bullet("• Tích hợp vào ứng dụng VNeID Quốc gia (Đề án 06/CP): ", "Sẵn sàng đóng gói dưới dạng Mini-App tích hợp vào VNeID, giúp xác thực công dân mức 2 tức thì và loại bỏ triệt để tin báo giả.")
    add_bullet("• Mở rộng quy mô 63/63 tỉnh/thành phố & Liên thông Quốc gia: ", "Cấu trúc dữ liệu phân cấp (Quốc gia -> Tỉnh/TP -> Xã/Phường -> Đa cơ sở trực thuộc) cho phép nhân rộng ra toàn quốc mà không phải thay đổi kiến trúc phần mềm.")
    add_bullet("• Tích hợp AI, IoT Đô thị thông minh & Drone cứu nạn: ", "Mở rộng cổng API tiếp nhận cảnh báo tự động từ hệ thống cảm biến báo cháy chung cư, cảm biến mực nước lũ và điều phối thiết bị bay không người lái (UAV/Drone) trinh sát hiện trường vùng cô lập.")

    doc.save(DOCX_OUT)
    print(f"[OK] Generated 8-Criteria DOCX Script: {DOCX_OUT}")

    for d in SYNC_DIRS:
        if os.path.isdir(d):
            target = os.path.join(d, os.path.basename(DOCX_OUT))
            shutil.copy2(DOCX_OUT, target)
            print(f"[OK] Synced DOCX to: {target}")


if __name__ == "__main__":
    build_pptx_deck()
    update_existing_10min_pptx_to_80_percent()
    build_docx_presentation_script()
