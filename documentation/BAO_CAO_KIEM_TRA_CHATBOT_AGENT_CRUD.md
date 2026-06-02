# Bao cao kiem tra Chatbot/Agent CRUD va toc do

Ngay kiem tra: 2026-06-01

## Pham vi

- Kiem tra backend that qua `http://127.0.0.1:8081`.
- Dung tai khoan `admin` de goi Agent tool co quyen noi bo.
- Tao du lieu test tam co tien to `codexcrud...`, sau do huy/xoa mem lai de tranh anh huong du lieu that.
- Kiem tra cac nhom thao tac: tra cuu, them lich hen, huy lich hen, khoa/mo khoa/xoa mem tai khoan, chan quyen khach hang, va cau hoi ReAct nhanh.

## Ket qua sau khi sua loi

| Hang muc | Ket qua | Thoi gian |
| --- | --- | ---: |
| Dang nhap admin | Thanh cong | 260ms |
| Tao khach test | Thanh cong | 257ms |
| Agent tra cuu khach hang | Thanh cong | 83ms |
| Tao thu cung test lam du lieu nen | Thanh cong | 121ms |
| Agent tim lich trong | Thanh cong | 28ms |
| Agent them lich hen | Thanh cong, tao `LH-F9C26CB5` | 111ms |
| Agent huy lich hen | Thanh cong | 45ms |
| Agent xoa mem khach test | Thanh cong | 29ms |

Kiem tra quyen:

- Khach hang thu goi tool nhay cam `thao_tac_tai_khoan` bi chan `403 Forbidden` trong 154ms.
- ReAct cau `hi` tra loi local, khong goi provider ngoai, 52-100ms.

## Loi phat hien va da sua

1. `dat_lich_hen` loi so sanh `time` voi `datetime` trong SQL kiem tra trung lich.
   - Da sua bang cach quy doi gio bat dau/ket thuc ve so phut trong ngay bang `DATEDIFF`.

2. `dat_lich_hen` insert vao cot `ghi_chu` khong ton tai trong bang `LichHen`.
   - Da doi sang cot dung trong schema/entity la `ly_do`.

3. `LichHenController` co nhanh tu dong chon bac si van dung SQL kiem tra trung lich cu.
   - Da sua dong bo voi Agent de tranh loi kieu thoi gian khi form/dat lich thuong tu chon bac si.

4. Provider AI doc model/API key tu bang `CauHinhHeThong` moi request.
   - Da them cache 30 giay cho Groq, Gemini, OpenRouter de giam query DB tren hot path.

## Danh gia

- Cac tool CRUD truc tiep cua Agent sau khi sua chay nhanh: phan lon duoi 150ms, thao tac dat lich 111ms.
- Quyen backend dang chan dung: khach hang khong the chay tool tai khoan noi bo.
- Luong ReAct phu thuoc LLM ngoai van co the cham: mot lan test tim khach bang ngon ngu tu nhien fallback OpenRouter mat khoang 52s va chon tham so chua chuan. Nen uu tien direct tool/fast-route cho cac lenh noi bo ro rang.

## Kiem tra mo rong sau khi ra soat lai

- Static scan `src/main/java`: khong con mau SQL `DATEADD(minute, ... gio_kham)` cu va khong con insert `LichHen(... ghi_chu, trang_thai)`.
- Backend health sau test: `UP`.
- Nhom test trong tam: `ChatControllerRegressionTest`, `LichHenControllerTest`, `RoleAccessPolicyTest`, `AiToolServiceSourceIndexTest` pass `12/12`.
- Full backend test: pass `18/18`, `Failures: 0`, `Errors: 0`.
- Ghi chu: `EmailServiceTest` co warning moi truong cu ve SQL Server user `sa` va SMTP authentication, nhung test van pass. Day khong phai loi Agent/lich hen.

## Khuyen nghi tiep theo

- Them fast-route trong `ReActAgentService` cho cac cau nhu "tim khach hang email/SĐT/ten", "huy lich ma LH-...", "khoa/mo khoa tai khoan KH-..." de bo qua LLM khi intent va tham so da ro.
- Bo sung test tu dong cho `dat_lich_hen` voi SQL Server mode that hon, gom ca check trung lich theo bac si va thu cung.
- Ghi metric latency theo provider/tool vao log de theo doi P95/P99 khi dung that.
