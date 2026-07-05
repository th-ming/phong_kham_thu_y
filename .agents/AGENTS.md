# Custom Rules for Vietnamese Document Formatting and Windows Environment

## 1. Vietnamese Output to Standard Output (stdout)
- **Constraint**: Never output raw Vietnamese characters directly to stdout in scripts executed via PowerShell, Command Prompt, or scheduled tasks (`schtasks`).
- **Reason**: The default Windows terminal encoding (typically Windows-1252 or similar) will cause a `UnicodeEncodeError` when trying to print Vietnamese Unicode characters, crashing the script.
- **Solution**: Always log messages containing Vietnamese to a file with UTF-8 encoding (e.g., `open(..., 'w', encoding='utf-8')`).

## 2. File Locking (PermissionError on .docx)
- **Constraint**: Always terminate active word processors (WPS Office, Microsoft Word) before editing or writing to docx files.
- **Solution**: Execute taskkill commands before writing:
  ```powershell
  taskkill /f /im wps.exe
  taskkill /f /im WINWORD.EXE
  ```
  Ensure a sleep period of at least 2 seconds after killing to release locks.

## 3. WPS Office Executable Path
- **WPS Path**: `C:\Users\84916\AppData\Local\Kingsoft\WPS Office\12.1.0.25180\office6\wps.exe`
- When opening or launching WPS Office, prioritize this path.

## 4. Interactive Desktop Actions and Screen Capturing
- **Constraint**: Terminal-initiated processes cannot interact with the user's active GUI session directly or take screenshots of their desktop (headless session issue).
- **Solution**: Always use the Windows Task Scheduler (`schtasks`) with the `/it` (interactive) flag to execute a batch file or command that starts the GUI application and captures the screen.
- **Capture Method**: Use PowerShell `System.Windows.Forms` and `System.Drawing` or Python's `PIL.ImageGrab` within the scheduled task context.

---

## 5. Dự án Rexi – Phòng Khám Thú Y (d:\QLy Phòng Khám Thú Y)

### PowerShell Command Syntax
- **KHÔNG dùng `&&`** để nối lệnh trong PowerShell (chỉ dùng được trong cmd/bash).
- Chạy lệnh trong thư mục con bằng cách đặt `Cwd` đúng thư mục, không dùng `cd && ...`.
- Ví dụ đúng: `Cwd = "d:\QLy Phòng Khám Thú Y\Frontend"`, lệnh = `npm run build`.

### Database SQL Server
- **Server**: `127.0.0.1,1433` (SQL Express: `PC\SQLEXPRESS`), user `sa`, pass `123456`
- **Database name**: `PhongKhamThuY`
- **Bảng auth quan trọng**: `TaiKhoan` (id_tai_khoan, ten_dang_nhap, mat_khau, id_vai_tro), `VaiTroHeThong` (id_vai_tro, ten_vai_tro), `NhanVien` (id_nhan_vien, id_tai_khoan, id_vai_tro, ...)
- **KHÔNG có bảng**: `VaiTro` (tên đúng là `VaiTroHeThong`), không có cột `loai_tai_khoan`, `chuc_vu`

### Tài khoản test (plaintext password):
| Tài khoản | Mật khẩu | Vai trò |
|-----------|-----------|---------|
| `quanly` | `quanly@rexi.com` | Quản lý |
| `bacsi` | `bacsi@rexi.com` | Bác sĩ |
| `ketoan` | `ketoan@rexi.com` | Kế toán |
| `staff` | `staff@rexi.com` | Tiếp tân |
| `admin` | (BCrypt – không đọc được, dùng `quanly` thay thế) | Quản trị |

> **Quy tắc**: Khi cần đăng nhập để kiểm tra, **LUÔN truy vấn DB trước** để lấy đúng tài khoản, không tự đoán mật khẩu.

### Deploy
- **Frontend**: Vercel – project `rexi-vet-clinic`, URL: `https://rexi-vet-clinic.vercel.app`
  - Build: `npm run build` trong thư mục `Frontend`
  - Deploy: `npx vercel --prod --yes` tại root
  - **GitHub auto-deploy chưa kết nối** → vẫn phải deploy thủ công bằng CLI
- **Backend**: Render – URL: `https://phong-kham-thu-y.onrender.com`
  - Cấu hình trong `vercel.json`: `/api/*` và `/ws/*` proxy sang Render

