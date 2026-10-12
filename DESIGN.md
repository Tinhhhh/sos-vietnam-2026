# SOS VIETNAM 2026 - TACTICAL EMERGENCY COMMAND DESIGN SYSTEM
## "Liquid Glassmorphism" National Tactical Standard

---

## 1. Executive Design Philosophy

SOS Việt Nam 2026 kết hợp ngôn ngữ thiết kế **Liquid Glassmorphism** (kính đa tầng siêu thực) theo tiêu chuẩn Apple iOS 26 / Figma Design Systems với phong cách **Tác Chiến Quân Cảnh Hiện Đại** (Tactical Defense HUD).

Hệ thống mang lại:
1. **Khả năng nhận diện tức thì (Sub-second recognition)**: 5 lực lượng phản ứng nhanh mang 5 dải màu quang phổ độc lập, viền thấu kính phát quang rực rỡ nhưng không gây nhức mắt.
2. **Chiều sâu không gian (Spatial Depth)**: Mặt phẳng kính đa lớp với hiệu ứng khúc xạ ánh sáng (refraction), bóng đổ tán sắc (chromatic ambient shadows) và viền phản chiếu ánh sáng (specular rim lighting).
3. **Phản hồi xúc giác mượt mà (Fluid Haptic Micro-interactions)**: Mọi tương tác chạm, di chuột đều có biến thiên tỉ lệ tinh tế (scale 0.98 -> 1.02), gia tốc phần cứng GPU (`will-change: transform`).
4. **Không lỗi hiển thị (Zero Defect & Zero Overflow)**: Mọi cửa sổ, popup, bản đồ và thẻ hàng đợi thích ứng linh hoạt từ Mobile 390px, Tablet 768px đến Desktop 1440px+ không bao giờ tràn lề.

---

## 2. Color Palette & Tactical Force Spectrum

### 2.1. 5 Lực Lượng Tác Chiến (5 Tactical Forces)

| Lực Lượng | Mã Theme | Màu Chủ Đạo (Primary) | Hào Quang (Ambient Glow) | Dải Chuyển Sắc (Gradient) |
|---|---|---|---|---|
| **Công An Nhân Dân (113)** | `theme-police` | `#0088FF` / `#00669A` | `rgba(0, 136, 255, 0.45)` | Baltic Blue -> Cyan Ice (`#00669A` -> `#00ECF3`) |
| **Cảnh Sát Giao Thông (CSGT)** | `theme-csgt` | `#F59E0B` / `#DFB077` | `rgba(245, 158, 11, 0.45)` | Amber Gold -> Sandy Clay (`#DFB077` -> `#F59E0B`) |
| **Cảnh Sát PCCC & CNCH (114)** | `theme-rescue` | `#AC0015` / `#FF3B30` | `rgba(172, 0, 21, 0.55)` | Deep Crimson -> Rescue Flame (`#AC0015` -> `#FF3B30`) |
| **Cấp Cứu Y Tế (115)** | `theme-hospital` | `#10B981` / `#059669` | `rgba(16, 185, 129, 0.45)` | Emerald Mint -> Cyan Aqua (`#10B981` -> `#00ECF3`) |
| **Chỉ Huy Tổng Hợp (Super Admin)** | `theme-admin` | `#8B5CF6` / `#6366F1` | `rgba(139, 92, 246, 0.50)` | Royal Violet -> Galactic Indigo (`#8B5CF6` -> `#6366F1`) |

### 2.2. Màu Nền Kính & Độ Trong Suốt (Glass Surface Tokens)

- **Deep Tactical Canvas**: `#040d1a` (nền đêm tác chiến sâu)
- **Glass Panel Surface**: `rgba(6, 18, 38, 0.72)` (kính nền chính)
- **Glass Card Surface**: `rgba(12, 28, 56, 0.65)` (kính thẻ phần tử)
- **Glass Elevated Hover**: `rgba(20, 42, 80, 0.82)` (kính nổi khi hover)
- **Specular Rim Highlight**: `inset 0 1.5px 1px rgba(255, 255, 255, 0.28), inset 0 -1px 1px rgba(0, 0, 0, 0.35)`

---

## 3. Typography & Hierarchy

- **Phông chữ chủ đạo**: `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Phông số tác chiến (Monospace HUD numbers)**: `'SF Mono', 'Roboto Mono', 'Consolas', monospace`

### Tỷ lệ phân cấp:
- **Display 1 (Tiêu đề quốc gia)**: 28px - 32px | Bold 800 | Letter-spacing: -0.02em
- **Heading 2 (Tiêu đề phân hệ)**: 18px - 22px | SemiBold 700 | Letter-spacing: -0.01em
- **Section Title (Tiêu đề khối)**: 14px - 16px | Medium 600 | Text-transform: uppercase | Tracking: 0.05em
- **Body Text (Nội dung thông tin)**: 13px - 14px | Regular 400 - 500 | Line-height: 1.5
- **Tactical Meta / Badge (Mã số, toạ độ, thời gian)**: 11px - 12px | SemiBold 600 | Monospace

---

## 4. Liquid Glassmorphism Core Specs

```css
/* Chuẩn mực kính đa tầng Liquid Glass */
.liquid-glass {
  background: rgba(8, 20, 44, 0.72);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 
    inset 0 1.5px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.4),
    0 16px 40px rgba(0, 0, 0, 0.55);
  border-radius: 16px;
  position: relative;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.22s ease;
  will-change: transform;
}

.liquid-glass:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 
    inset 0 2px 1.5px rgba(255, 255, 255, 0.35),
    inset 0 -1px 1px rgba(0, 0, 0, 0.4),
    0 20px 48px rgba(0, 0, 0, 0.65),
    0 0 24px var(--theme-glow, rgba(0, 136, 255, 0.25));
}
```

---

## 5. Mobile & Desktop Responsive Layout Invariants

1. **Header & Navigation**:
   - Desktop (>= 1024px): Bố cục ngang đầy đủ, hiển thị logo, badge kíp trực, theme switcher, thống kê tức thời.
   - Mobile (< 768px): Header tinh gọn 56px, logo tự co giãn, theme switcher dạng pill tròn dễ chạm (touch target >= 44x44px).
2. **Dispatcher Sidebar & Incident Queue**:
   - Desktop: Cố định bên phải hoặc trái với độ rộng 380px - 420px, danh sách cuộn mượt mà có thanh cuộn tinh tế.
   - Mobile: Chuyển thành Bottom Sheet (ngăn kéo đáy) hoặc Floating Tab có thể vuốt mở đóng mượt mà.
3. **Thẻ Hàng Đợi (Queue Card)**:
   - Viền trái 4px phát sáng theo loại sự cố và theo màu chủ đạo của lực lượng tiếp nhận.
   - Nút hành động nhanh (Tiếp nhận, Điều phối, Gọi video) có kích thước tối thiểu 38px, font chữ rõ ràng.
4. **Map HUD & Overlays**:
   - Lớp bản đồ Leaflet nằm bên dưới các bảng kính.
   - Các nút zoom, định vị, lớp phủ giao thông đều bọc kính `.liquid-glass` bo tròn đồng nhất.
