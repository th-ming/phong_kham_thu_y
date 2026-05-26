# Quy Tắc Làm Việc Cho AI Trong Repo PKTY

## Comment Code Theo Phong Cách Thực Chiến Của Sếp

- Khi viết hoặc sửa code, comment phải bằng tiếng Việt, nói thẳng như đang giải thích cho đồng đội trong dự án "Quản Lý Phòng Khám Thú Y".
- Cấm comment máy móc kiểu `Hàm này dùng để...`, `Xử lý dữ liệu...`, `Kiểm tra quyền...`. Comment phải nói rõ vì sao đoạn đó tồn tại, dữ liệu từ đâu vào, role nào được đụng, lỗi thì hệ thống đi về đâu.
- Với logic nghiệp vụ quan trọng, phải nhắc rõ role/trạng thái bằng CHỮ HOA: `ADMIN`, `BAC_SI`, `TIEP_TAN`, `KE_TOAN`, `QUAN_LY`, `Y_TA`, `KHACH_HANG`, `AGENT`, `NORMAL`, `403_FORBIDDEN`.
- Được dùng teencode tự nhiên trong comment như `cmt`, `sđt`, `db`, `api`, `config`, `ko`, `đk`, `sync`, miễn là câu vẫn rõ và có ích.
- Những thuộc tính/config/flag/magic number khó hiểu thì cmt ngay cạnh dòng code nếu hợp lý, kiểu tự nhắc bản thân mở lại sau vẫn hiểu.
- Khi đụng vào vùng code có comment cũ quá khô hoặc kiểu AI, sửa luôn comment đó theo form này trong phạm vi đang làm.

Ví dụ đúng gu:

```java
// Lưu thô toàn bộ chuỗi JSON Tool Call (gồm tên hàm + đống tham số).
// Đây là mấu chốt để phục vụ việc TEST ĐỘ THÔNG MINH của AGENT.
// Ông nhìn vào cột này trong DB là biết ngay AI bóc tách teencode của khách có chuẩn ko,
// hoặc lỡ AGENT có ngáo gọi sai API thì nhìn phát ra lỗi liền để còn biết đường debug.
```

```java
// Bộ lọc từ khóa thô để phân luồng nhanh 2 CHẾ ĐỘ: NORMAL và AGENT.
// Chấp hết mấy kiểu teencode ko dấu (dat lix, boking, ke don...) của con sen gõ bậy.
// Câu nào hỏi đáp kiến thức tĩnh thì chặn ở NORMAL cho đỡ tốn token,
// khi nào khách thực sự muốn HÀNH ĐỘNG thì mới kích hoạt AGENT.
```

```java
// Bẫy bảo mật quan trọng: ép phân quyền cứng bằng backend cho đủ 7 nhóm người dùng.
// Kịch bản gài bẫy: lỡ AI bị khách JAILBREAK rồi nghe lời gọi nhầm tool lấy doanh thu,
// API này check TOKEN thấy KO PHẢI `KE_TOAN` hoặc `ADMIN` là khóa ngay,
// bắn `403_FORBIDDEN` ra UI, tuyệt đối ko để lọt dữ liệu nhạy cảm từ DB.
```
