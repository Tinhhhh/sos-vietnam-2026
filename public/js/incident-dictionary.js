/**
 * Danh mục gợi ý sự cố khẩn cấp theo 6 nhóm lực lượng nghiệp vụ chính thức:
 * 1. police: Công an Nhân Dân 113
 * 2. csgt: Cảnh sát Giao thông
 * 3. fire: Cứu hỏa & Cứu nạn Cứu hộ 114
 * 4. traffic-rescue: Cứu hộ giao thông doanh nghiệp
 * 5. hospital: Cấp cứu Y tế 115
 * 6. joint: Tác chiến liên ngành & Thiên tai cứu nạn
 */
export const INCIDENT_SUGGESTIONS = {
  police: [
    { id: 'p1', label: '🚨 Bị cướp giật / Móc túi' },
    { id: 'p2', label: '⚔️ Bạo lực / Gây rối trật tự' },
    { id: 'p3', label: '🏠 Trộm cắp đột nhập' },
    { id: 'p4', label: '👁️ Bị theo dõi / Đe dọa' },
    { id: 'p5', label: '👶 Người già / Trẻ em đi lạc' },
    { id: 'p6', label: '⚠️ Sự cố an ninh địa bàn khác' }
  ],
  csgt: [
    { id: 'c1', label: '🚗 Tai nạn giao thông va chạm nghiêm trọng' },
    { id: 'c2', label: '💥 Xe lật / Chắn ngang đường quốc lộ/cao tốc' },
    { id: 'c3', label: '🚦 Sự cố giao thông gây ùn tắc kéo dài' },
    { id: 'c4', label: '🚧 Chướng ngại vật / Dầu tràn trơn trượt trên đường' },
    { id: 'c5', label: '🚨 Báo cáo vi phạm giao thông / Xe gây tai nạn bỏ chạy' }
  ],
  fire: [
    { id: 'f1', label: '🔥 Cháy nhà dân / Chung cư / Nhà xưởng' },
    { id: 'f2', label: '🆘 Có người mắc kẹt trong đám cháy' },
    { id: 'f3', label: '🏚️ Sập đổ công trình xây dựng' },
    { id: 'f4', label: '🌊 Đuối nước / Cứu nạn sông suối' },
    { id: 'f5', label: '🛗 Mắc kẹt thang máy / Hầm sâu / Vực cao' }
  ],
  'traffic-rescue': [
    { id: 'r1', label: '⚙️ Ô tô / Xe máy chết máy giữa đường' },
    { id: 'r2', label: '🛞 Nổ lốp / Bể bánh xe cần thay thế' },
    { id: 'r3', label: '🔋 Hết bình ắc quy / Cần kích nổ bình' },
    { id: 'r4', label: '⛽ Hết xăng / Dầu khẩn cấp' },
    { id: 'r5', label: '🌊 Xe ngập nước / Sa lầy lún cát' },
    { id: 'r6', label: '🏗️ Cần xe cẩu kéo cứu hộ giao thông' }
  ],
  hospital: [
    { id: 'h1', label: '🩸 Chấn thương nặng / Chảy máu cấp' },
    { id: 'h2', label: '❤️ Đau tim / Nghi đột quỵ hôn mê' },
    { id: 'h3', label: '😵 Bất tỉnh / Ngất xỉu đột ngột' },
    { id: 'h4', label: '🫁 Khó thở / Co giật cấp cứu' },
    { id: 'h5', label: '🤢 Ngộ độc thực phẩm / Hóa chất' },
    { id: 'h6', label: '🤰 Cấp cứu sản phụ chuyển dạ sinh nở' }
  ],
  joint: [
    { id: 'j1', label: '🌪️ Sự cố thiên tai bão lũ / Sạt lở đất' },
    { id: 'j2', label: '🚢 Tìm kiếm cứu nạn trên sông / biển' },
    { id: 'j3', label: '⚡ Sự cố lưới điện cao thế nguy hiểm' },
    { id: 'j4', label: '☣️ Sự cố tràn hóa chất độc hại' }
  ]
};
