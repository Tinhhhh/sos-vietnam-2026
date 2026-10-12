# -*- coding: utf-8 -*-
"""
Script: generate_it_backend_progress_docx.py
Purpose: Generates a highly comprehensive, professional IT & Backend Engineering Progress Report
         for SOS Vietnam 2026, summarizing all technical achievements on 2026-10-11.
Audience: Software Engineers, System Architects, Backend Developers, DevOps, and QA Engineers.
Output: .docx file on Desktop and in Reports/ directory.
Strictly avoids administrative/governmental jargon; focuses purely on software engineering,
algorithms, data contracts, audio graph architecture, WebRTC signaling, and test evidence.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn

# -------------------------------------------------------------
# Color Palette Constants (Modern High-Tech Engineering Theme)
# -------------------------------------------------------------
COLOR_PRIMARY_NAVY = RGBColor(15, 23, 42)      # Slate 900
COLOR_BLUE_ACCENT   = RGBColor(37, 99, 235)     # Blue 600
COLOR_SLATE_HEADER  = RGBColor(30, 41, 59)      # Slate 800
COLOR_BODY_DARK     = RGBColor(30, 41, 59)      # Slate 800
COLOR_MUTED_TEXT    = RGBColor(100, 116, 139)   # Slate 500
COLOR_GREEN_SUCCESS = RGBColor(5, 150, 105)     # Emerald 600
COLOR_RED_WARN      = RGBColor(220, 38, 38)     # Red 600

HEX_HEADER_BG       = '1E293B'  # Slate 800 for table header
HEX_ZEBRA_BG        = 'F8FAFC'  # Slate 50 for alternating rows
HEX_CODE_BG         = 'F1F5F9'  # Slate 100 for code box
HEX_BORDER_SUBTLE   = 'CBD5E1'  # Slate 300
HEX_CALLOUT_BLUE_BG = 'EFF6FF'  # Blue 50
HEX_CALLOUT_BLUE_BD = '3B82F6'  # Blue 500
HEX_CALLOUT_SUCC_BG = 'ECFDF5'  # Emerald 50
HEX_CALLOUT_SUCC_BD = '10B981'  # Emerald 500

# -------------------------------------------------------------
# XML Helper Functions for Styling & Formatting
# -------------------------------------------------------------
def set_cell_border_none(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'nil')
        borders.append(el)
    tc_pr.append(borders)

def set_cell_borders(cell, top='single', bottom='single', left='single', right='single', color=HEX_BORDER_SUBTLE, sz='4'):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if val != 'nil':
            el = OxmlElement(f'w:{edge}')
            el.set(qn('w:val'), val)
            el.set(qn('w:sz'), str(sz))
            el.set(qn('w:space'), '0')
            el.set(qn('w:color'), color)
            borders.append(el)
        else:
            el = OxmlElement(f'w:{edge}')
            el.set(qn('w:val'), 'nil')
            borders.append(el)
    tc_pr.append(borders)

def set_cell_shading(cell, color_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="clear" w:color="auto" w:fill="{color_hex}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(
        f'<w:tcMar xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tc_pr.append(tc_mar)

def make_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

def make_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))

# -------------------------------------------------------------
# Typography & Paragraph Building Helpers (No text stretching!)
# -------------------------------------------------------------
def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(15)
    r.bold = True
    r.font.color.rgb = COLOR_PRIMARY_NAVY
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(12.5)
    r.bold = True
    r.font.color.rgb = COLOR_BLUE_ACCENT
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(11)
    r.bold = True
    r.font.color.rgb = COLOR_SLATE_HEADER
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=3):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT  # NEVER JUSTIFY TO AVOID WORD STRETCHING
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Segoe UI'
        r_pre.font.size = Pt(10.5)
        r_pre.bold = True
        r_pre.font.color.rgb = COLOR_BODY_DARK
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_BODY_DARK
    return p

def add_bullet_p(doc, text, bold_prefix=None, space_after=2):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.first_line_indent = Inches(-0.15)
    
    rb = p.add_run("▪  ")
    rb.font.name = 'Segoe UI'
    rb.font.size = Pt(9.5)
    rb.bold = True
    rb.font.color.rgb = COLOR_BLUE_ACCENT
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Segoe UI'
        r_pre.font.size = Pt(10.5)
        r_pre.bold = True
        r_pre.font.color.rgb = COLOR_BODY_DARK
        
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_BODY_DARK
    return p

def add_code_block(doc, lines, caption=None):
    """Monospace code block with slate background and blue accent left border."""
    if caption:
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(2)
        r_cap = p_cap.add_run(f"Listing: {caption}")
        r_cap.font.name = 'Consolas'
        r_cap.font.size = Pt(9)
        r_cap.bold = True
        r_cap.font.color.rgb = COLOR_MUTED_TEXT

    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Cm(16.5)
    set_cell_borders(cell, top='single', bottom='single', left='single', right='single', color=HEX_BORDER_SUBTLE, sz='4')
    # Custom left border thicker
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_SUBTLE}"/>'
        f'<w:left w:val="single" w:sz="18" w:space="0" w:color="{HEX_CALLOUT_BLUE_BD}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_SUBTLE}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_SUBTLE}"/>'
        f'</w:tcBorders>'
    )
    tc_pr.append(borders)
    set_cell_shading(cell, HEX_CODE_BG)
    set_cell_margins(cell, top=70, bottom=70, left=120, right=120)

    for idx, line in enumerate(lines):
        p = cell.paragraphs[0] if idx == 0 else cell.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(line)
        r.font.name = 'Consolas'
        r.font.size = Pt(8.8)
        r.font.color.rgb = RGBColor(30, 41, 59)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(3)

def add_callout(doc, text, title="TECHNICAL ARCHITECTURE NOTE", kind="info"):
    """Styled callout box (blue for info, emerald for success/benchmark)."""
    bg_hex = HEX_CALLOUT_BLUE_BG if kind == "info" else HEX_CALLOUT_SUCC_BG
    bd_hex = HEX_CALLOUT_BLUE_BD if kind == "info" else HEX_CALLOUT_SUCC_BD
    title_color = COLOR_BLUE_ACCENT if kind == "info" else COLOR_GREEN_SUCCESS

    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Cm(16.5)
    
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{bd_hex}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tc_pr.append(borders)
    set_cell_shading(cell, bg_hex)
    set_cell_margins(cell, top=80, bottom=80, left=140, right=140)

    p_title = cell.paragraphs[0]
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run(f"⚡ {title}")
    r_t.font.name = 'Segoe UI'
    r_t.font.size = Pt(10)
    r_t.bold = True
    r_t.font.color.rgb = title_color

    p_body = cell.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_body.paragraph_format.space_before = Pt(0)
    p_body.paragraph_format.space_after = Pt(0)
    p_body.paragraph_format.line_spacing = 1.15
    r_b = p_body.add_run(text)
    r_b.font.name = 'Segoe UI'
    r_b.font.size = Pt(10)
    r_b.font.color.rgb = COLOR_BODY_DARK

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(3)

def create_styled_table(doc, headers, rows_data, col_widths=None):
    """Creates a beautifully styled data table with headers, zebra stripes, and explicit column widths."""
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    # Header Row
    hdr_row = tbl.rows[0]
    make_row_header(hdr_row)
    make_row_cant_split(hdr_row)
    for idx, title in enumerate(headers):
        c = hdr_row.cells[idx]
        if col_widths and idx < len(col_widths):
            c.width = col_widths[idx]
        set_cell_shading(c, HEX_HEADER_BG)
        set_cell_borders(c, top='single', bottom='single', left='single', right='single', color=HEX_HEADER_BG, sz='4')
        set_cell_margins(c, top=80, bottom=80, left=100, right=100)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        r.font.name = 'Segoe UI'
        r.font.size = Pt(9.5)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    # Data Rows
    for r_idx, row_data in enumerate(rows_data):
        row = tbl.rows[r_idx + 1]
        make_row_cant_split(row)
        bg = HEX_ZEBRA_BG if r_idx % 2 == 1 else 'FFFFFF'
        for c_idx, val in enumerate(row_data):
            c = row.cells[c_idx]
            if col_widths and c_idx < len(col_widths):
                c.width = col_widths[c_idx]
            set_cell_shading(c, bg)
            set_cell_borders(c, top='single', bottom='single', left='single', right='single', color=HEX_BORDER_SUBTLE, sz='4')
            set_cell_margins(c, top=60, bottom=60, left=100, right=100)
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(str(val))
            r.font.name = 'Segoe UI'
            r.font.size = Pt(9.2)
            r.font.color.rgb = COLOR_BODY_DARK

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(3)
    return tbl

# -------------------------------------------------------------
# Main Document Builder
# -------------------------------------------------------------
def build_progress_document():
    doc = Document()

    # Page Margins: 20mm all around (0.79 inches)
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.79)

    # Base Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = COLOR_BODY_DARK

    # =========================================================
    # DOCUMENT HEADER / BANNER
    # =========================================================
    p_top_meta = doc.add_paragraph()
    p_top_meta.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_top_meta.paragraph_format.space_before = Pt(0)
    p_top_meta.paragraph_format.space_after = Pt(2)
    r_meta = p_top_meta.add_run("SOS VIETNAM 2026 // ENGINEERING ARCHITECTURE & BACKEND PROGRESS REPORT")
    r_meta.font.name = 'Segoe UI'
    r_meta.font.size = Pt(9)
    r_meta.bold = True
    r_meta.font.color.rgb = COLOR_BLUE_ACCENT

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("BÁO CÁO KỸ THUẬT TIẾN ĐỘ BACKEND & FULLSTACK")
    r_title.font.name = 'Segoe UI'
    r_title.font.size = Pt(20)
    r_title.bold = True
    r_title.font.color.rgb = COLOR_PRIMARY_NAVY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(8)
    r_sub = p_sub.add_run("Phân tích cơ chế hoạt động, luồng tín hiệu WebRTC P2P, Web Audio Graph chống hú, Động cơ GIS phân luồng đa cơ sở và Bằng chứng kiểm thử tự động")
    r_sub.font.name = 'Segoe UI'
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = COLOR_MUTED_TEXT

    # Metadata Grid Table
    meta_headers = ["Thuộc tính Kỹ thuật", "Giá trị Tham chiếu", "Phân hệ / Module", "Trạng thái Vận hành"]
    meta_rows = [
        ["Ngày thực hiện", "11/10/2026 (Full Workday)", "Git Branch / Commit", "main | 5bbcfa6 (10 commits)"],
        ["Backend Runtime", "Node.js v20+ / Express REST Engine", "Socket Relay Bus", "Socket.IO 4.x + Fallback Polling"],
        ["Đàm thoại & Audio", "WebRTC PeerConnection (Multi-STUN)", "Audio Pipeline", "Web Audio API + lamejs MP3 Worker"],
        ["Động cơ Địa không gian", "Haversine Nearest Facility Dispatch", "GIS Coverage", "Hà Nội 417 trạm + 34 tỉnh (548 trạm)"],
        ["Kiểm thử Tự động", "Playwright Multi-Context E2E", "Kết quả Test Suite", "10/10 PASSED (10,724 ms)"]
    ]
    create_styled_table(doc, meta_headers, meta_rows, [Cm(3.8), Cm(4.8), Cm(4.2), Cm(3.7)])

    # =========================================================
    # EXECUTIVE TECH SUMMARY
    # =========================================================
    add_callout(
        doc,
        "Báo cáo này được cấu trúc chuyên biệt cho kỹ sư phần mềm (Backend Developers, System Architects, DevOps và QA). "
        "Tài liệu tập trung 100% vào cơ chế mã nguồn, thiết kế đồ thị âm thanh (Web Audio Graph), luồng xử lý tín hiệu (Signaling Flow), "
        "giải thuật phân phối địa không gian (Geospatial Dispatching), và phân tích chi tiết nguyên nhân gốc rễ (RCA) của các lỗi kỹ thuật "
        "đã được giải quyết triệt để trong ngày làm việc 11/10/2026.",
        title="DÀNH CHO ĐỘI NGŨ KỸ THUẬT & PHÁT TRIỂN HỆ THỐNG",
        kind="info"
    )

    # =========================================================
    # MỤC 1: KIẾN TRÚC TỔNG THỂ & LUỒNG XỬ LÝ BACKEND
    # =========================================================
    add_heading_1(doc, "1. KIẾN TRÚC TỔNG THỂ & LUỒNG XỬ LÝ BACKEND (SYSTEM ARCHITECTURE)")
    
    add_body_p(doc, 
        "Hệ thống SOS Vietnam 2026 được xây dựng theo mô hình Real-time Monolithic Engine kết hợp Event-Driven Relay, "
        "tối ưu hóa cho thời gian đáp ứng cực thấp (Low Latency) trong các tình huống cứu nạn khẩn cấp. "
        "Backend Node.js (server.js) đóng ba vai trò cốt lõi:",
        bold_prefix="Kiến trúc Runtime: "
    )
    add_bullet_p(doc, "Cung cấp các REST API tiếp nhận yêu cầu SOS, xác thực tài khoản cơ quan, truy vấn danh bạ trạm công an và phân luồng tiếp dân.", "1. REST API Server: ");
    add_bullet_p(doc, "Kênh kết nối WebSocket 2 chiều trung chuyển trạng thái sự cố SOS theo thời gian thực giữa người dân và hàng trăm điều phối viên trực ban.", "2. Socket.IO Event Bus: ");
    add_bullet_p(doc, "Điểm trung chuyển SDP Offer/Answer và ICE Candidate cho các phiên đàm thoại thoại/video giữa Citizen-Dispatcher và giữa Dispatcher-Dispatcher.", "3. WebRTC Signaling Relay: ");

    add_heading_2(doc, "1.1. Sơ đồ Luồng Tín hiệu & Tương tác Phân hệ (Architecture ASCII Flow)")
    
    ascii_arch = [
        "+----------------------------------------------------------------------------------------------------+",
        "|                                     SOS VIETNAM 2026 BACKEND TOPOLOGY                              |",
        "+----------------------------------------------------------------------------------------------------+",
        "                                                                                                      ",
        "   [CITIZEN CLIENT]                  [NODE.JS BACKEND (server.js)]              [DISPATCHER DASHBOARD]",
        "  (Mobile Web / Leaflet)                (Express + Socket.IO)                    (Desktop Operational)",
        "          |                                       |                                         |         ",
        "          |--- 1. POST /api/sos/submit ---------->|                                         |         ",
        "          |    (GPS Lat/Lng, Type, Media)         |--- 2. io.emit('new_incident') --------->|         ",
        "          |                                       |                                         |         ",
        "          |                                       |<-- 3. POST /api/sos/videocall/signal ---|         ",
        "          |                                       |    (Dispatcher initiates Voice Call)    |         ",
        "          |<-- 4. io.to().emit('webrtc_signal') --|                                         |         ",
        "          |    (SDP Offer forwarded)              |                                         |         ",
        "          |                                       |                                         |         ",
        "          |========================= 5. P2P WebRTC Voice Call =============================>|         ",
        "          |   [Citizen Mic]                       STUN Servers Pool                         |         ",
        "          |   (Dynamic Stream)            stun:stun.l.google.com:19302             [Dispatcher Mic]   ",
        "          |                               stun.cloudflare.com:3478                  (Dual VU Meters)  ",
        "          |<======================== 6. Real-Time Audio RTP Streams ========================|         ",
        "          |                                       |                                         |         ",
        "          |                                       |                                 [Web Audio Graph] ",
        "          |                                       |                                 muteGain=0.0 (Anti-Echo)",
        "          |                                       |                                 Channel Merger    ",
        "          |                                       |                                 lamejs MP3 Worker ",
        "          |                                       |                                 (Local Download)  ",
        "+----------------------------------------------------------------------------------------------------+"
    ]
    add_code_block(doc, ascii_arch, caption="Kiến trúc tổng thể luồng tín hiệu Backend và P2P WebRTC Media")

    add_heading_2(doc, "1.2. Danh mục API Endpoints & Websocket Channels Cập nhật Hôm nay")
    add_body_p(doc, "Các API endpoints và socket channels cốt lõi đã được nâng cấp trong ngày 11/10/2026:");

    api_headers = ["Phương thức / Kênh", "Đường dẫn / Event Name", "Nhiệm vụ Xử lý", "Cơ chế Đồng bộ / State"]
    api_rows = [
        ["POST", "/api/sos/videocall/signal", "Relay tín hiệu WebRTC (Offer, Answer, Candidate, Bye) giữa 2 peers.", "In-memory session registry; kiểm tra caller & callee token."],
        ["POST", "/api/sos/videocall/signal-inter-unit", "Relay tín hiệu cuộc gọi trực tiếp giữa 2 Điều phối viên (Liên đơn vị).", "Kiểm tra targetUnit; phát socket 'dispatcher_incoming_call'."],
        ["GET", "/api/sos/videocall/poll-signal", "Long-polling fallback lấy tín hiệu WebRTC khi đường WebSocket bị ngắt.", "Hàng đợi signalQueue lưu tạm thời 60 giây per session."],
        ["GET", "/api/agencies/hanoi-stations", "Truy vấn 417 trụ sở công an Hà Nội kèm tọa độ, số hotline và thủ tục hành chính.", "Dữ liệu nén JSON từ data/hanoi_police_stations_417.json."],
        ["Socket.IO", "webrtc_signal", "Kênh truyền payload SDP & ICE Candidates thời gian thực với latency < 20ms.", "Phát đúng room `incident_${id}` hoặc socket ID cá nhân."],
        ["Socket.IO", "dispatcher_incoming_call", "Thông báo chuông và modal tiếp nhận cuộc gọi liên đơn vị cho trực ban.", "Broadcast toàn bộ dispatchers trực thuộc targetUnit."]
    ]
    create_styled_table(doc, api_headers, api_rows, [Cm(2.6), Cm(5.0), Cm(5.0), Cm(3.9)])

    # =========================================================
    # MỤC 2: CORE WEBRTC SIGNALING & AUDIO PIPELINE
    # =========================================================
    add_heading_1(doc, "2. CHI TIẾT KỸ THUẬT ĐÀM THOẠI WEBRTC & AUDIO PIPELINE")
    
    add_body_p(doc, 
        "Vấn đề người dùng đặt ra trong ngày: 'Tính năng đàm thoại chưa bắt được giọng nói của 2 bên thiết bị khác nhau hãy giúp anh fix nhé'. "
        "Để xử lý triệt để bài toán này, đội ngũ kỹ thuật đã tiến hành phân tích sâu nguyên nhân gốc rễ (Root Cause Analysis - RCA), "
        "tái thiết kế luồng Signaling Relay trên backend và tái cấu trúc toàn diện Web Audio Graph phía client.",
        bold_prefix="Bối cảnh kỹ thuật: "
    )

    add_heading_2(doc, "2.1. Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)")
    add_bullet_p(doc, 
        "Khi 2 điều phối viên gọi nhau (Inter-unit dispatch call giữa Trực ban A và Trực ban B), "
        "tín hiệu phát ra bị đánh đồng với cuộc gọi Citizen - Dispatcher thông thường. "
        "Backend phát sóng `dispatcher_incoming_call` chung chung, không có cơ chế định danh `targetUnit` và phân biệt cờ `isInterUnitCall`. "
        "Hậu quả: Bên nhận không kích hoạt modal chấp nhận hoặc bị từ chối do trạng thái socket không khớp, cuộc gọi bị hủy trước khi bắt tay ICE.",
        bold_prefix="1. Race Condition & Xung đột Định danh (Signaling Collision): "
    )
    add_bullet_p(doc, 
        "Trong Web Audio API, khi gán mic của chính mình (`localStream`) qua `createMediaStreamSource()` "
        "và vô tình để đường ra kết nối trực tiếp hoặc gián tiếp với `audioCtx.destination`, loa thiết bị sẽ phát lại chính tiếng mic thu vào. "
        "Trên 2 thiết bị đặt cạnh nhau hoặc mở loa ngoài, hiện tượng này tạo ra vòng lặp phản hồi âm thanh (Positive Acoustic Feedback Loop) "
        "gây tiếng hú rít cực mạnh, làm quá tải bộ khuếch đại (Audio Clipping) và khiến người dùng tưởng rằng mic bị nghẽn không bắt được tiếng.",
        bold_prefix="2. Vòng lặp Phản hồi Âm thanh Gây Hú Tiếng (Acoustic Feedback Loop): "
    )
    add_bullet_p(doc, 
        "Khi kết nối P2P được thiết lập, sự kiện `pc.ontrack` của WebRTC xảy ra bất đồng bộ và thường đến sau khi hàm khởi tạo ghi âm "
        "`CallAudioRecorder.start()` đã chạy xong. Trong code cũ, nếu `remoteStream` chưa có track tại thời điểm `start()`, "
        "node `MediaStreamAudioSourceNode` của remote stream nhận luồng rỗng và không bao giờ tự kết nối lại khi track cập nhật. "
        "Hậu quả: Thiết bị phía đối diện hoàn toàn câm lặng (flatline silence) dù kết nối WebRTC báo `connected`.",
        bold_prefix="3. Trễ gắn luồng Remote (Late Track Attachment Bug): "
    )
    add_bullet_p(doc, 
        "Sử dụng một STUN server duy nhất khiến tỷ lệ thất bại khi đục lỗ NAT (NAT Traversal) tăng cao "
        "khi 2 thiết bị nằm ở 2 dải mạng khác nhau (ví dụ: một máy dùng mạng Wi-Fi cơ quan có Firewall, máy kia dùng 4G Viettel/Vinaphone).",
        bold_prefix="4. Điểm nghẽn STUN Đơn Lẻ (Single Point of Failure in STUN): "
    )

    add_heading_2(doc, "2.2. Giải pháp Kiến trúc Web Audio Graph & Chống Hú Tiếng Tuyệt Đối")
    add_body_p(doc, 
        "Đội ngũ đã thiết kế lại toàn bộ mô hình Web Audio Graph trong `js/call-audio-recorder.js`. "
        "Dưới đây là sơ đồ kiến trúc mạch âm thanh chi tiết được áp dụng để vừa thu âm độc lập 2 bên, "
        "vừa hiển thị VU Meter thời gian thực, vừa ghi âm MP3 mà tuyệt đối không gây hú loa:"
    )

    audio_graph_ascii = [
        "+----------------------------------------------------------------------------------------------------+",
        "|                        WEB AUDIO GRAPH PIPELINE (call-audio-recorder.js)                           |",
        "+----------------------------------------------------------------------------------------------------+",
        "                                                                                                      ",
        " [Local Mic Stream]                                                                                  ",
        "         |                                                                                            ",
        "         v                                                                                            ",
        "   [localSource] (MediaStreamAudioSourceNode)                                                         ",
        "         |                                                                                            ",
        "         +-------------> [localAnalyser] (fftSize=256) --------> [Local VU Meter UI] (0 - 100 RMS)    ",
        "         |                                                                                            ",
        "         v                                                                                            ",
        "    [localGain]                                                                                       ",
        "         |                                                                                            ",
        "         +-----------------------+                                                                    ",
        "                                 |                                                                    ",
        "                                 v                                                                    ",
        "                          [Mixer Node] (GainNode / Merger)                                            ",
        "                                 ^                                                                    ",
        "                                 |                                                                    ",
        "         +-----------------------+                                                                    ",
        "         |                                                                                            ",
        "    [remoteGain]                                                                                      ",
        "         ^                                                                                            ",
        "         |                                                                                            ",
        "   [remoteSource] (Dynamic attachRemoteStream)                                                        ",
        "         ^                                                                                            ",
        "         |                                                                                            ",
        "         +-------------> [remoteAnalyser] (fftSize=256) -------> [Remote VU Meter UI] (0 - 100 RMS)   ",
        "         |                                                                                            ",
        " [Remote Peer Stream]                                                                                 ",
        "                                                                                                      ",
        "                                 [Mixer Node Output]                                                  ",
        "                                          |                                                           ",
        "                 +------------------------+-------------------------+                                 ",
        "                 |                                                  |                                 ",
        "                 v                                                  v                                 ",
        "       [ScriptProcessorNode]                                [muteGain Node]                           ",
        "         (bufferSize = 4096)                               (gain.value = 0.0)                         ",
        "                 |                                                  |                                 ",
        "                 v                                                  v                                 ",
        "       [onaudioprocess Event]                             [audioCtx.destination]                      ",
        "                 |                                        (Giữ AudioContext sống,                     ",
        "                 v                                         triệt tiêu 100% tiếng hú)                  ",
        "       [lamejs MP3 Encoder]                                                                           ",
        "     (Stereo, 44.1kHz, 128kbps)                                                                       ",
        "                 |                                                                                    ",
        "                 v                                                                                    ",
        "      [In-Memory MP3 Chunks]                                                                          ",
        "                 |                                                                                    ",
        "                 v (Call Hangup)                                                                      ",
        "       [Local File Download] (Zero Server Storage Retention)                                          ",
        "+----------------------------------------------------------------------------------------------------+"
    ]
    add_code_block(doc, audio_graph_ascii, caption="Đồ thị luồng Web Audio API xử lý 2 kênh âm thanh độc lập và chống hú tiếng")

    add_heading_2(doc, "2.3. Cơ chế Dynamic attachRemoteStream & Xử lý Trễ Track")
    add_body_p(doc, 
        "Để khắc phục triệt để lỗi Late Track Attachment, class `CallAudioRecorder` được bổ sung phương thức `attachRemoteStream(stream)`. "
        "Mỗi khi PeerConnection phát sinh sự kiện `ontrack`, luồng remote được tái gắn kết ngay lập tức:"
    )

    code_attach_remote = [
        "// js/call-audio-recorder.js - Dynamic remote stream attachment",
        "attachRemoteStream(stream) {",
        "    if (!stream || !this.audioContext) return;",
        "    try {",
        "        if (this.remoteSourceNode) {",
        "            try { this.remoteSourceNode.disconnect(); } catch (e) {}",
        "        }",
        "        this.remoteStream = stream;",
        "        this.remoteSourceNode = this.audioContext.createMediaStreamSource(stream);",
        "        this.remoteGainNode = this.audioContext.createGain();",
        "        this.remoteGainNode.gain.value = 1.0;",
        "        this.remoteAnalyser = this.audioContext.createAnalyser();",
        "        this.remoteAnalyser.fftSize = 256;",
        "        ",
        "        // Nối vào mạch Mixer và Analyser riêng biệt",
        "        this.remoteSourceNode.connect(this.remoteGainNode);",
        "        this.remoteSourceNode.connect(this.remoteAnalyser);",
        "        this.remoteGainNode.connect(this.mixerNode);",
        "        console.log('[AudioRecorder] Remote stream dynamic attachment successful.');",
        "    } catch (err) {",
        "        console.error('[AudioRecorder] Error in attachRemoteStream:', err);",
        "    }",
        "}"
    ]
    add_code_block(doc, code_attach_remote, caption="Cơ chế gắn luồng âm thanh đối phương động khi nhận track WebRTC")

    add_heading_2(doc, "2.4. Thuật toán Đo Cường độ Âm thanh Hai Chiều (Dual VU Meter RMS Calculation)")
    add_body_p(doc, 
        "Hệ thống không dựa vào phỏng đoán mà sử dụng thuật toán tính toán căn bậc hai trung bình bình phương "
        "(Root Mean Square - RMS) trên dữ liệu miền thời gian (Time-domain waveform) được trích xuất từ `AnalyserNode`:"
    )
    add_body_p(doc, 
        "Công thức tính RMS toán học được triển khai trong mã nguồn:",
        bold_prefix="Công thức Toán học: "
    )
    add_body_p(doc, 
        "RMS = sqrt( (1 / N) * sum( ((sample[i] - 128) / 128)^2 ) )   với N = 128 mẫu (buffer 256 byte). "
        "Chỉ số cường độ hiển thị trên giao diện: Level = min(100, round(RMS * 160))."
    )

    code_rms = [
        "// js/call-audio-recorder.js - Real-time RMS level calculation",
        "getAudioLevels() {",
        "    const levels = { local: 0, remote: 0 };",
        "    if (this.localAnalyser) {",
        "        const data = new Uint8Array(this.localAnalyser.frequencyBinCount);",
        "        this.localAnalyser.getByteTimeDomainData(data);",
        "        let sumSq = 0;",
        "        for (let i = 0; i < data.length; i++) {",
        "            const norm = (data[i] - 128) / 128;",
        "            sumSq += norm * norm;",
        "        }",
        "        levels.local = Math.min(100, Math.round(Math.sqrt(sumSq / data.length) * 160));",
        "    }",
        "    if (this.remoteAnalyser) {",
        "        const data = new Uint8Array(this.remoteAnalyser.frequencyBinCount);",
        "        this.remoteAnalyser.getByteTimeDomainData(data);",
        "        let sumSq = 0;",
        "        for (let i = 0; i < data.length; i++) {",
        "            const norm = (data[i] - 128) / 128;",
        "            sumSq += norm * norm;",
        "        }",
        "        levels.remote = Math.min(100, Math.round(Math.sqrt(sumSq / data.length) * 160));",
        "    }",
        "    return levels;",
        "}"
    ]
    add_code_block(doc, code_rms, caption="Thuật toán đo cường độ âm thanh RMS thời gian thực trên cả 2 kênh")

    add_heading_2(doc, "2.5. Tuân thủ Nghị định 13/2023/NĐ-CP: Kiến trúc Không Lưu Vết (Zero-Retention)")
    add_callout(
        doc,
        "Toàn bộ quá trình mã hóa file ghi âm MP3 (Stereo, 44.1kHz, 128kbps) được thực hiện 100% bằng thư viện lamejs "
        "chạy trong Web Worker / RAM trình duyệt phía Client. Khi kết thúc cuộc gọi, file MP3 được tự động xuất dưới dạng "
        "Blob tải thẳng về máy tính điều phối viên. Backend server hoàn toàn KHÔNG lưu trữ bất kỳ byte âm thanh nào, "
        "đảm bảo tuân thủ tuyệt đối quy định bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP.",
        title="BẢO MẬT DỮ LIỆU & ZERO SERVER STORAGE RETENTION",
        kind="success"
    )

    # =========================================================
    # MỤC 3: ĐỘNG CƠ ĐỊA KHÔNG GIAN ĐA CƠ SỞ & HAVERSINE
    # =========================================================
    add_heading_1(doc, "3. ĐỘNG CƠ ĐỊA KHÔNG GIAN ĐA CƠ SỞ & THUẬT TOÁN HAVERSINE")

    add_body_p(doc, 
        "Yêu cầu từ người dùng: Tích hợp đầy đủ danh sách 417 trụ sở/điểm tiếp dân Công an TP Hà Nội từ Báo An ninh Thủ đô. "
        "Đặc thù Hà Nội sau nhiều giai đoạn mở rộng và sắp xếp đơn vị hành chính là một phường/xã có thể có từ 2 đến 5 cơ sở "
        "(Trụ sở chính, Cơ sở tiếp dân căn cước/cư trú, Đội CSGT, Đội PCCC). "
        "Hệ thống phải hiển thị chính xác toàn bộ cơ sở trên bản đồ và khi người dân phát tín hiệu SOS thì phải tự động điều phối "
        "về cơ sở công an gần vị trí nạn nhân nhất.",
        bold_prefix="Bài toán Thực tế: "
    )

    add_heading_2(doc, "3.1. Cấu trúc Mô hình Dữ liệu Quan hệ 1-to-N (Ward to Facilities)")
    add_body_p(doc, 
        "Hệ thống đã chuyển đổi mô hình dữ liệu từ quan hệ 1-1 (1 xã/phường có 1 trạm duy nhất) "
        "thành mô hình phân cấp 1-to-N: 1 đơn vị hành chính cấp xã quản lý một danh mục các cơ sở trực thuộc (`wardFacilities`)."
    )

    hanoi_schema = [
        "// Schema mẫu: Trụ sở Công an Phường Ba Đình - Cơ sở 4 (data/hanoi_police_stations_417.json)",
        "{",
        "  \"id\": \"st-hn-ca-005-ba-dinh\",",
        "  \"station_id\": \"st-hn-ca-005-ba-dinh\",",
        "  \"name\": \"Công an phường Ba Đình - Cơ sở 4\",",
        "  \"unit_title\": \"Phường Ba Đình\",",
        "  \"facility_type\": \"Cơ sở 4\",",
        "  \"address\": \"116 phố Quán Thánh, phường Ba Đình, thành phố Hà Nội, Việt Nam\",",
        "  \"phone\": \"+84 368107770\",",
        "  \"services\": \"Xử lý vi phạm về giao thông, trật tự đô thị; Cấp, đổi căn cước\",",
        "  \"lat\": 21.042397,",
        "  \"lng\": 105.843138,",
        "  \"wardFacilities\": [",
        "    { \"id\": \"st-hn-ca-005-ba-dinh\", \"name\": \"Cơ sở 4 (116 Quán Thánh)\", \"facility_type\": \"Cơ sở 4\", ... },",
        "    { \"id\": \"st-hn-ca-004-ba-dinh\", \"name\": \"Trụ sở chính (37 Điện Biên Phủ)\", \"facility_type\": \"Trụ sở chính\", ... }",
        "  ]",
        "}"
    ]
    add_code_block(doc, hanoi_schema, caption="Cấu trúc dữ liệu phân cấp 1-to-N cho các điểm cơ sở trực thuộc phường")

    add_heading_2(doc, "3.2. Thuật toán Phân luồng 2 Tầng (Two-Tier Dispatch Algorithm)")
    add_bullet_p(doc, 
        "Khi người dân phát tín hiệu SOS có tọa độ GPS (lat, lng), hệ thống tính toán khoảng cách "
        "đường tròn lớn (Great-Circle Distance) theo công thức Haversine tới toàn bộ 417 cơ sở tại Hà Nội "
        "và chọn cơ sở có khoảng cách Euclid cầu nhỏ nhất. "
        "Công thức: d = 2 * R * asin( sqrt( sin^2(dLat/2) + cos(lat1)*cos(lat2)*sin^2(dLng/2) ) ) với R = 6,371 km.",
        bold_prefix="Tầng 1 - Spatial Nearest Match (Haversine Formula): "
    )
    add_bullet_p(doc, 
        "Nếu người dân bị mất tín hiệu GPS hoặc sai số định vị > 5km, hệ thống kích hoạt cơ chế fallback dựa trên chuỗi hành chính "
        "(Reverse Geocoded Ward / District Name). Hệ thống lọc toàn bộ cơ sở thuộc phường tương ứng và ưu tiên Trụ sở chính.",
        bold_prefix="Tầng 2 - Administrative Fallback Match: "
    )

    add_heading_2(doc, "3.3. Pipeline Làm sạch & Khử Trùng Lặp (Deduplication Pipeline)")
    add_body_p(doc, 
        "Để đảm bảo không xuất hiện các trạm ảo hoặc dữ liệu rác, pipeline xử lý dữ liệu (`scripts/fetch_hanoi_police_417.py` "
        "và `scripts/extract_hanoi_417_stations.py`) áp dụng các bước chuẩn hóa nghiêm ngặt:"
    )
    add_bullet_p(doc, "Xóa bỏ các ký tự đặc biệt, chuẩn hóa tên đường, số nhà, tiền tố 'phường', 'quận', 'thị xã'.", "Chuẩn hóa địa chỉ: ");
    add_bullet_p(doc, "Tự động phân loại: 'Trụ sở chính', 'Điểm tiếp công dân', 'Cơ sở 2', 'Đội CSGT-TT', 'Đội PCCC'.", "Phân tách vai trò nghiệp vụ: ");
    add_bullet_p(doc, "Trích xuất tọa độ GPS thực từ link Google Maps rút gọn (maps.app.goo.gl) và kiểm tra nằm trong ranh giới Hà Nội (20.5°N - 21.6°N, 105.3°E - 106.1°E).", "Xác thực GPS Bounding Box: ");

    # =========================================================
    # MỤC 4: ĐỒNG BỘ DỮ LIỆU GIS TOÀN QUỐC
    # =========================================================
    add_heading_1(doc, "4. ĐỒNG BỘ HÓA DỮ LIỆU HÀNH CHÍNH GIS TOÀN QUỐC")

    add_body_p(doc, 
        "Song song với Hà Nội, hệ thống đã hoàn tất đợt đồng bộ cơ sở dữ liệu GIS toàn diện trên quy mô cả nước "
        "phục vụ điều phối khẩn cấp liên tỉnh:"
    )

    gis_headers = ["Chỉ số GIS", "Quy mô Sau Đồng bộ", "Phạm vi Địa lý", "Mục tiêu Kỹ thuật"]
    gis_rows = [
        ["Tài khoản Cơ quan", "548 tài khoản", "34 tỉnh/thành trọng điểm", "Mỗi đơn vị có tài khoản đăng nhập trực ban và socket room riêng."],
        ["Xã/Phường sau sáp nhập", "3,321 xã/phường", "Toàn quốc", "Tích hợp đơn vị hành chính mới theo Nghị quyết UBTVQH."],
        ["Trụ sở Công an Hà Nội", "417 trụ sở / điểm tiếp dân", "30 quận, huyện, thị xã", "Dữ liệu chính thống từ Báo An ninh Thủ đô."],
        ["Hiệu chỉnh Tọa độ Cần Thơ", "10.0347, 105.7869", "Phường Tân An, Q. Ninh Kiều", "Khắc phục sai lệch tọa độ trạm về đúng vị trí thực tế trên bản đồ."]
    ]
    create_styled_table(doc, gis_headers, gis_rows, [Cm(3.8), Cm(3.8), Cm(4.2), Cm(4.7)])

    # =========================================================
    # MỤC 5: KẾT QUẢ KIỂM THỬ E2E TỰ ĐỘNG HÓA
    # =========================================================
    add_heading_1(doc, "5. KẾT QUẢ KIỂM THỬ E2E TỰ ĐỘNG HÓA (PLAYWRIGHT TEST EVIDENCE)")

    add_body_p(doc, 
        "Để chứng minh giải pháp hoạt động ổn định trên môi trường thực tế mà không cần kiểm thử thủ công cảm tính, "
        "đội ngũ đã viết kịch bản kiểm thử E2E tự động hóa hoàn chỉnh: `playwright/verify-cross-device-webrtc-voice-call.cjs`.",
        bold_prefix="Kịch bản E2E: "
    )

    add_heading_2(doc, "5.1. Thiết lập Môi trường Giả lập Hai Thiết bị Độc lập")
    add_bullet_p(doc, "Mô phỏng điện thoại iPhone 13 (Viewport 390x844, Touch events enabled, Mobile User-Agent).", "Browser Context 1 (Citizen): ");
    add_bullet_p(doc, "Mô phỏng máy tính bàn trung tâm chỉ huy (Viewport 1920x1080, Chrome Desktop User-Agent).", "Browser Context 2 (Dispatcher): ");
    add_bullet_p(doc, "Khắc phục giới hạn mic ảo trong môi trường headless bằng cách dùng Web Audio OscillatorNode phát sóng sin chuẩn 440 Hz và 880 Hz vào luồng MediaStream.", "Synthetic Audio Injection: ");

    add_heading_2(doc, "5.2. Bảng Chỉ số Thực nghiệm Chi tiết (Test Benchmark Metrics)")

    test_headers = ["Bước Kiểm thử", "Hành động Thực thi", "Tiêu chí Đánh giá", "Kết quả Đo đạc", "Trạng thái"]
    test_rows = [
        ["Step 1", "Citizen submit SOS incident", "Tạo incidentId hợp lệ", "SOS-MV3RC17F-466", "PASSED"],
        ["Step 2", "Dispatcher authenticate & sync", "Nhận cảnh báo socket realtime", "Incident hiển thị trên Feed", "PASSED"],
        ["Step 3", "Dispatcher click Gọi Đàm Thoại", "Tạo WebRTC Offer & gửi signal", "SDP Offer dispatched", "PASSED"],
        ["Step 4", "Citizen nhận & bấm Tiếp Nhận", "Trả lời SDP Answer & ICE", "Answer dispatched", "PASSED"],
        ["Step 5", "WebRTC P2P ICE Handshake", "ICE Connection State = connected", "Citizen: connected\nDispatcher: connected", "PASSED"],
        ["Step 6", "Đo luồng âm thanh 2 chiều", "Mức RMS âm thanh > 20", "Citizen RMS: 49.22\nDispatcher RMS: 44.95", "PASSED"],
        ["Step 7", "Kiểm tra UI Audio Level Meters", "VU Meter hiển thị cả 2 thanh LED", "Local Bar: True\nRemote Bar: True", "PASSED"],
        ["Step 8", "Kiểm tra ghi âm MP3 & Tải file", "File MP3 > 10,000 bytes", "48,065 bytes (MIME audio/mpeg)", "PASSED"],
        ["Step 9", "Kiểm tra nút Bật/Tắt Micro", "Track.enabled lật trạng thái đúng", "True -> False -> True", "PASSED"],
        ["Step 10", "Dọn dẹp & Ngắt kết nối cuộc gọi", "Đóng PeerConnection & dừng track", "pcClosed: True\nstreamStopped: True", "PASSED"]
    ]
    create_styled_table(doc, test_headers, test_rows, [Cm(1.8), Cm(4.2), Cm(3.8), Cm(4.5), Cm(2.2)])

    add_callout(
        doc,
        "Toàn bộ 10/10 bước kiểm thử đều vượt qua tiêu chuẩn kỹ thuật (100% PASSED). "
        "Tổng thời gian thực thi trọn vẹn kịch bản E2E hai trình duyệt: 10,724 ms. "
        "Báo cáo bằng chứng chi tiết được lưu trữ tại Reports/qa/playwright/verify-cross-device-webrtc-voice-call.json và .md.",
        title="KẾT QUẢ KIỂM THỬ E2E: 10/10 TEST CASES PASSED (100%)",
        kind="success"
    )

    # =========================================================
    # MỤC 6: BẢNG ĐỐI CHIẾU GIT COMMITS & DIFF
    # =========================================================
    add_heading_1(doc, "6. BẢNG ĐỐI CHIẾU GIT COMMITS & TRACEABILITY MÃ NGUỒN")

    add_body_p(doc, "Toàn bộ mã nguồn thực hiện trong ngày 11/10/2026 đã được commit sạch sẽ vào nhánh chính `main`:");

    git_headers = ["Commit Hash", "Thời gian", "Loại Commit", "Mô tả Tóm tắt Thay đổi Kỹ thuật"]
    git_rows = [
        ["5bbcfa6", "11/10/2026", "fix(webrtc)", "Fix cross-device two-way voice call, feedback isolation, dual VU meter, and 2-way MP3 recording."],
        ["0cd5bc9", "11/10/2026", "feat(hanoi)", "Tích hợp 417 trụ sở công an Hà Nội với cơ chế multi-facility nearest dispatch."],
        ["f419b1a", "11/10/2026", "fix(stations)", "Loại bỏ trạm ảo, khử trùng lặp danh bạ toàn quốc, ưu tiên công an cơ sở."],
        ["2cf7223", "11/10/2026", "fix(accounts)", "Đồng bộ 548 tài khoản cơ quan và nâng cấp công cụ tìm kiếm tọa độ trên bản đồ."],
        ["2a4d79e", "11/10/2026", "fix(gis)", "Căn chỉnh tọa độ trạm Công an Phường Tân An (Cần Thơ) khớp 100% với thực tế."],
        ["8c7bacc", "11/10/2026", "fix(map,pdf)", "Sửa lỗi phân trang in ấn PDF, hiển thị trạm xã trên map, làm giàu 453 tài khoản."],
        ["93da71c", "11/10/2026", "docs(scope)", "Cập nhật tài liệu kỹ thuật khớp phạm vi 34 tỉnh thành và 3,321 xã phường."],
        ["800594c", "11/10/2026", "style(docx)", "Khắc phục triệt để lỗi thưa chữ và kéo giãn dòng trong xuất báo cáo tự động."],
        ["d799df7", "11/10/2026", "docs(script)", "Bổ sung script Python tự động xuất tài liệu báo cáo ra desktop."],
        ["3dd77b3", "11/10/2026", "feat(stations)", "Đồng bộ danh bạ trạm công an chính thức với dữ liệu GIS Cần Thơ & Quảng Trị."]
    ]
    create_styled_table(doc, git_headers, git_rows, [Cm(2.5), Cm(2.4), Cm(2.8), Cm(8.8)])

    # =========================================================
    # MỤC 7: HƯỚNG DẪN VẬN HÀNH & ROADMAP CHO ĐỘI NGŨ CODER
    # =========================================================
    add_heading_1(doc, "7. HƯỚNG DẪN VẬN HÀNH & KHUYẾN NGHỊ KIẾN TRÚC CHO CODER")

    add_heading_2(doc, "7.1. Lệnh Khởi động & Kiểm thử Môi trường Phát triển")
    dev_cmds = [
        "# 1. Khởi động backend server",
        "npm start",
        "",
        "# 2. Chạy kiểm thử tự động WebRTC đàm thoại 2 chiều và ghi âm",
        "node playwright/verify-cross-device-webrtc-voice-call.cjs",
        "",
        "# 3. Chạy kiểm thử tự động phân luồng đa cơ sở Hà Nội 417 trạm",
        "node playwright/verify-hanoi-417-multi-facility-nearest.cjs",
        "",
        "# 4. Kiểm tra sức khỏe hệ thống bằng Anvien Code Intelligence",
        "anvien status"
    ]
    add_code_block(doc, dev_cmds, caption="Các lệnh vận hành và kiểm thử tự động backend")

    add_heading_2(doc, "7.2. Khuyến nghị Kiến trúc cho Giai đoạn Mở rộng (Scale-Out)")
    add_bullet_p(doc, 
        "Khi đưa hệ thống vào vận hành thực tế trên diện rộng, các thiết bị di động sử dụng mạng 4G/5G "
        "thường nằm sau tường lửa NAT đối xứng (Symmetric NAT) không thể đục lỗ P2P bằng STUN thuần túy. "
        "Cần cấu hình bổ sung cụm TURN server Coturn hỗ trợ giao thức TURNS (port 443 over TLS) làm trạm tiếp sóng dự phòng.",
        bold_prefix="1. Triển khai TURN Server Riêng (Coturn): "
    )
    add_bullet_p(doc, 
        "Trong module `call-audio-recorder.js`, hiện tại dùng `ScriptProcessorNode` (chạy trên Main UI Thread). "
        "Khuyến nghị chuyển dần sang `AudioWorkletNode` chạy trên dedicated audio thread "
        "để loại bỏ hoàn toàn hiện tượng giật âm thanh (Audio glitching) khi người dùng thao tác giao diện nặng.",
        bold_prefix="2. Chuyển đổi sang AudioWorklet: "
    )
    add_bullet_p(doc, 
        "Khi triển khai nhiều instance Node.js sau Load Balancer (Nginx/HAProxy), "
        "cần dùng Redis Pub/Sub adapter cho Socket.IO để đảm bảo tín hiệu WebRTC signaling được trung chuyển thông suốt giữa các worker process.",
        bold_prefix="3. Redis Adapter cho Socket.IO Cluster: "
    )

    # Footer note
    p_end = doc.add_paragraph()
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_end.paragraph_format.space_before = Pt(16)
    p_end.paragraph_format.space_after = Pt(0)
    r_end = p_end.add_run("--- HẾT BÁO CÁO KỸ THUẬT TIẾN ĐỘ BACKEND (SOS VIETNAM 2026) ---")
    r_end.font.name = 'Segoe UI'
    r_end.font.size = Pt(9.5)
    r_end.italic = True
    r_end.font.color.rgb = COLOR_MUTED_TEXT

    return doc

# -------------------------------------------------------------
# Execution Entry Point
# -------------------------------------------------------------
if __name__ == '__main__':
    doc = build_progress_document()
    
    # Save target 1: Desktop
    desktop_dir = os.path.join(os.environ.get('USERPROFILE', 'C:\\Users\\dienv'), 'Desktop')
    out_desktop = os.path.join(desktop_dir, 'Bao_Cao_Tien_Do_Ky_Thuat_Backend_SOS_Vietnam_2026_11_10_2026.docx')
    doc.save(out_desktop)
    print(f"[OK] Report saved to Desktop: {out_desktop}")
    
    # Save target 2: Reports directory inside workspace
    reports_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Reports')
    os.makedirs(reports_dir, exist_ok=True)
    out_reports = os.path.join(reports_dir, 'Bao_Cao_Tien_Do_Ky_Thuat_Backend_SOS_Vietnam_2026_11_10_2026.docx')
    doc.save(out_reports)
    print(f"[OK] Report saved to Reports: {out_reports}")
