# -*- coding: utf-8 -*-
import os
import sys
import shutil
import asyncio
import edge_tts

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VOICE = "vi-VN-NamMinhNeural" # Giọng nam trầm ấm, truyền cảm, dứt khoát
RATE = "-3%"  # Tốc độ vừa phải để rõ chữ, biểu cảm chuẩn video giới thiệu
PITCH = "+0Hz"

TEXT = """
Trong các tình huống khẩn cấp, tai nạn giao thông trong đêm khuya, hỏa hoạn bất ngờ, thiên tai bão lũ, hay một cơn đột quỵ của người già khi ở nhà một mình... tất cả đều có thể ập đến bất cứ lúc nào.
Trong y khoa và cứu hộ cứu nạn, 5 phút đầu tiên chính là năm phút vàng quyết định sự sống còn của nạn nhân.
Thế nhưng hiện nay, khi gặp nguy kịch, người dân trong cơn hoảng loạn thường bối rối không biết phải gọi 113, 114 hay 115; rất khó mô tả chính xác vị trí của mình giữa đường đèo, ngõ hẹp sâu, đặc biệt là tại các địa phương vừa thực hiện sắp xếp, sáp nhập xã phường.
Về phía lực lượng chức năng, các tổng đài vẫn đang hoạt động tách biệt, phải hỏi đi hỏi lại thông tin qua bộ đàm, vừa mất thời gian vàng, vừa dễ trùng lặp hoặc bỏ sót ca cứu nạn.
Từ thực tế cấp bách đó, SOS Việt Nam 2026 ra đời — nền tảng cứu nạn khẩn cấp hợp nhất đa lực lượng, biến chiếc điện thoại của mỗi người dân thành phao cứu sinh một chạm, và kết nối toàn bộ lực lượng phản ứng nhanh trên một bản đồ chỉ huy số duy nhất.

Để cả người dân lẫn cán bộ chiến sĩ đều sử dụng được ngay mà không cần qua đào tạo phức tạp, SOS Việt Nam 2026 được thiết kế với hai phân hệ tác chiến rõ ràng:

Thứ nhất, với người dân — Mở chưa tới một giây, báo nạn trong năm giây:
Không cần tải app, không cần đăng ký: Chỉ cần chạm biểu tượng SOS trên màn hình hoặc quét mã QR, ứng dụng mở ngay trong 0.79 giây. Kể cả mất sóng 4G vẫn mở được nhờ bộ nhớ ngoại tuyến kèm Cẩm nang sinh tồn.
Chạm nút là gửi vị trí: Bà con chỉ cần chạm nút SOS to tròn và bấm hình ảnh tình huống: Cấp cứu, Cháy nổ, Tai nạn hay Mưa lũ. Hệ thống tự động gửi tọa độ GPS chính xác về Trung tâm gần nhất, đồng thời tự động nhắn tin vị trí cho người thân gia đình.

Thứ hai, với cán bộ và lực lượng — Một bản đồ chung kết nối năm lực lượng:
Lần đầu tiên, cả năm lực lượng gồm: Cảnh sát, Cảnh sát giao thông, Phòng cháy chữa cháy và Cứu nạn cứu hộ, Cấp cứu Y tế, và Cứu hộ dịch vụ cùng hiệp đồng tác chiến trên một bản đồ 3D duy nhất.
Đặc biệt, hệ thống đã đồng bộ trực tiếp với Cơ sở dữ liệu Quốc gia bando.com.vn, cập nhật mới nhất tính đến tháng 10 năm 2026, bao phủ toàn bộ 34 tỉnh thành và 3.321 xã phường sau sáp nhập, với 453 tài khoản điều phối trực ban thực tế từ cấp Trung ương, Tỉnh đến tận Xã, Phường.
Hệ thống tự động lọc nhiễu định vị trong ngõ hẹp và vẽ sẵn hai đường đi: đường cho các phương tiện xe nhỏ như xe hai bánh, và đường lớn cho ô tô cứu hỏa, cứu thương di chuyển.

Trong thực tế vận hành, hệ thống giải quyết trọn vẹn bốn nhóm tình huống khẩn cấp điển hình:

Tình huống một: Nhóm yếu thế hoặc không thể nói chuyện. Như người già đột quỵ, người khuyết tật câm điếc, hay nạn nhân ngạt khói không thể nói qua điện thoại. Thay vì phải giải thích, họ chỉ cần chạm nhẹ vào thẻ tình huống trên màn hình là tín hiệu cầu cứu cùng vị trí chính xác đã bay thẳng tới đơn vị gần nhất.

Tình huống hai: Sự cố nghiêm trọng cần nhiều lực lượng cùng lúc. Như tai nạn giao thông liên hoàn hay cháy lớn. Người dân có thể bật video trực tiếp ngay trên màn hình. Chỉ với một cú nhấp chuột, Trung tâm điều động đồng thời cả Cảnh sát giao thông phân luồng, Cứu hỏa dập lửa, Cấp cứu y tế và Cứu hộ giao thông mà không cần gọi bộ đàm vòng vo.

Tình huống ba: Thiên tai bão lũ, khi cấp cơ sở bị quá tải, không bỏ sót ca nào. Nếu lực lượng xã, phường bận ứng cứu nơi khác, hệ thống tự chuyển ca sang đơn vị lân cận. Đặc biệt, quá 15 phút mà chưa có người nhận, hệ thống tự động báo động đỏ và phát loa cảnh báo lên cấp Tỉnh và Trung ương. Không một lời cầu cứu nào của nhân dân bị bỏ quên!

Tình huống bốn: Ngăn chặn báo tin giả và tự động hóa giấy tờ. Kẻ xấu bấm trêu đùa? Cán bộ chỉ cần bấm Báo khống Nghị định 144 — hệ thống tự ghi nhận thiết bị, khóa vĩnh viễn và xuất biên bản xử phạt 4 đến 6 triệu đồng theo Nghị định 144. Còn ca thật khi xong việc, người dân và chiến sĩ ký tên bằng ngón tay trên màn hình để xuất biên bản chuẩn Nghị định 30 trong một giây, kèm tính năng quản lý danh bạ bằng file Excel quen thuộc.

Như vậy, toàn bộ hệ sinh thái SOS Việt Nam 2026 — từ ứng dụng báo nạn siêu nhẹ của người dân đến hệ thống điều phối tác chiến 453 đơn vị trên 34 tỉnh thành và 3.321 xã phường sau sáp nhập, cập nhật mới nhất tính đến tháng 10 năm 2026 — đã được xây dựng hoàn chỉnh, sẵn sàng bảo vệ an toàn cho nhân dân trong mọi tình huống khẩn cấp.

Một chạm giản dị cho dân lúc nguy nan — Một bàn chỉ huy thông minh giúp cán bộ chiến sĩ tiếp cận hiện trường nhanh hơn và bớt vất vả hơn.
Bởi với chúng tôi, mỗi giây dữ liệu được rút ngắn hôm nay chính là một sinh mạng con người được giữ lại ngày mai!

Và câu hỏi lớn đặt ra cho tất cả chúng ta hôm nay là:
Trong kỷ nguyên chuyển đổi số quốc gia, khi dữ liệu số đã có thể đi nhanh hơn cả tiếng còi xe cứu thương — liệu chúng ta có thể cho phép bất kỳ người dân nào phải đơn độc trong 5 phút sinh tử của cuộc đời mình chỉ vì một rào cản kết nối?
"""

async def main():
    out1 = r"C:\Users\dienv\Desktop\Data4Life\02_THUYET_TRINH_10_PHUT\BAI_DOC_THUYET_TRINH_SOS_VIET_NAM_2026.mp3"
    out2 = r"C:\Users\dienv\Desktop\docs\thuyết trình\BAI_DOC_THUYET_TRINH_SOS_VIET_NAM_2026.mp3"

    print("Đang tạo file âm thanh giọng đọc thuyết minh Studio...")
    communicate = edge_tts.Communicate(TEXT, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(out1)
    shutil.copy2(out1, out2)
    print(f"[OK] Đã xuất file MP3 thành công tại:\n - {out1}\n - {out2}")

if __name__ == "__main__":
    asyncio.run(main())
