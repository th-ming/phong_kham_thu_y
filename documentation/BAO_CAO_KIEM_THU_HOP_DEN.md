# Bao cao kiem thu hop den - Rexi Veterinary Management System

Ngay kiem thu: 2026-05-13  
Pham vi: ung dung quan ly phong kham thu y Rexi gom Frontend React/Vite, Backend Spring Boot, SQL Server va Docker Compose.

## 1. Tom tat ket qua

Trang thai hien tai: **UI dat smoke test hop den muc route**, nhung **chua dat dieu kien E2E day du** vi backend khong compile va frontend production build/test runner dang fail. Da thuc hien kiem tra hop den tren giao dien bang Playwright voi Vite dev server tam thoi.

Ket luan nhanh:

| Hang muc | Ket qua | Ghi chu |
| --- | --- | --- |
| Frontend unit test | Fail | Jest thieu `jest-environment-jsdom`, sai ten option `moduleNameMapping` |
| Frontend type-check/build | Fail | TypeScript fail do unused symbols va kieu Chart.js |
| Frontend smoke test Playwright | Pass 11/11 | Route cong khai, route bao ve, 404, dang nhap sai |
| Customer black-box smoke | Pass 9/9 | Gia lap khach hang da dang nhap, di qua cac man khach hang |
| Customer functional black-box | Pass 12/12 | Mock API, thao tac tung chuc nang khach hang: them/sua/xoa, dat lich, huy lich, loc, modal, thanh toan, ca nhan |
| Backend test | Fail truoc khi test | Backend khong compile tai `AuthController.java` |
| Docker Compose | Fail | `docker-compose.yml` bi trung key `depends_on` trong service `frontend` |
| API/DB E2E | Chua chay duoc | Backend chua compile/chua khoi dong duoc |

## 2. Loi/blocker phat hien

### B1 - Docker Compose khong parse duoc

Lenh:

```powershell
docker compose ps
```

Ket qua:

```text
failed to parse ... docker-compose.yml: yaml: unmarshal errors:
line 92: mapping key "depends_on" already defined at line 83
```

Anh huong: Khong dung duoc moi truong tich hop qua Docker, nen khong the kiem thu luong nguoi dung day du tu UI den API va DB.

### B2 - Frontend test runner khong chay

Lenh:

```powershell
npm.cmd test -- --runInBand
```

Ket qua:

```text
Unknown option "moduleNameMapping"
Test environment jest-environment-jsdom cannot be found
```

Nguyen nhan kha nghi: `jest.config.js` dung sai option, phai la `moduleNameMapper`; package `jest-environment-jsdom` chua co trong dependencies/devDependencies.

### B3 - Frontend type-check/build fail

Lenh:

```powershell
npm.cmd run type-check
```

Loi chinh:

| File | Van de |
| --- | --- |
| `Frontend/src/components/home/PhanQuyTrinh.tsx` | Bien `theme` khai bao nhung khong dung |
| `Frontend/src/pages/admin/BaoCaoThongKe.tsx` | Ham/bien khong dung; `font.weight` cua Chart.js truyen string `"700"`, `"800"` khong dung type |
| `Frontend/src/pages/admin/QuanLyBenhAn.tsx` | Import `getUserProfile` khong dung |
| `Frontend/src/pages/admin/QuanLyFileDinhKem.tsx` | Import `useRef` khong dung |
| `Frontend/src/pages/ChiTietDichVu.tsx` | Import/interface khong dung |

Anh huong: Build production khong hoan tat vi script `build` chay `tsc && vite build`.

### B4 - Backend khong compile nen test backend fail

Lenh:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-22'
mvn.cmd test
```

Ket qua:

```text
[ERROR] /Backend/src/main/java/com/rexi/pkty/controller/AuthController.java:[97,9] 'try' without 'catch', 'finally' or resource declarations
[ERROR] /Backend/src/main/java/com/rexi/pkty/controller/AuthController.java:[230,10] illegal start of type
[ERROR] ... 100 errors
```

Nguyen nhan nhin thay: trong `AuthController.java`, block `try` bat dau o dong 97 bi dong ngoac sai quanh dong 149, lam bien `tk` vuot scope va block `catch` o dong 230 bi parse sai. Cac loi sau do la loi day chuyen.

Ghi chu moi truong: Maven wrapper cua repo loi khi goi truc tiep trong PowerShell sandbox, nen da dung Maven wrapper distribution da co san trong user home va dat `JAVA_HOME` thu cong.

Anh huong: Chua the khoi dong backend hoac chay test API/backend.

### B5 - Vite dev server chay duoc cho smoke test, nhung co console error do API/backend

Lenh smoke test:

```powershell
node scratch/blackbox-smoke.cjs
```

Ket qua:

```text
SUMMARY | passed=11 | failed=0 | total=11
```

Chi tiet:

| ID | Kich ban | Ket qua |
| --- | --- | --- |
| UI01 | Mo `/` | Pass |
| UI02 | Mo `/ve-chung-toi` | Pass |
| UI03 | Mo `/bang-gia` | Pass |
| UI04 | Mo `/lien-he` | Pass |
| UI05 | Mo `/bac-si` | Pass |
| UI06 | Mo `/dang-nhap` | Pass |
| UI07 | Mo `/quen-mat-khau` | Pass |
| UI08 | Khach chua dang nhap vao `/khach-hang/dashboard` | Pass, redirect `/dang-nhap` |
| UI09 | Nguoi dung chua dang nhap vao `/quan-ly/dashboard` | Pass, redirect `/dang-nhap` |
| UI10 | URL khong ton tai `/blackbox-khong-ton-tai` | Pass, hien trang 404 |
| UI11 | Dang nhap sai thong tin | Pass, UI hien thi loi |

Ghi chu: cac trang public render duoc, nhung console co nhieu loi do goi API/backend hoac tai nguyen ngoai trong luc backend chua chay. Day la rui ro can test lai sau khi backend compile va database san sang.

### B6 - Frontend production build fail

Lenh:

```powershell
npm.cmd run build
```

Ket qua: fail o `tsc`, loi chinh nam trong `BaoCaoThongKe.tsx` do `font.weight` truyen string `"700"`/`"800"` khong dung type Chart.js; ngoai ra co cac import/bien khong dung.

## 2.1. Ket qua kiem thu duoi tu cach khach hang

Ngay chay: 2026-05-13  
Script: `scratch/customer-blackbox.cjs`  
Cach chay: gia lap localStorage cua khach hang da dang nhap voi `loai_tai_khoan = "khach_hang"`, sau do dung Playwright truy cap cac man khach hang nhu nguoi dung that.

Ket qua tong hop:

```text
SUMMARY | passed=9 | failed=0 | total=9
```

Chi tiet:

| ID | Kich ban khach hang | Ket qua | Ghi chu |
| --- | --- | --- | --- |
| KH01 | Vao dashboard khach hang | Pass | Render dung route `/khach-hang/dashboard`; co API 4xx/5xx |
| KH02 | Vao quan ly thu cung | Pass | Render dung route, hien shell khach hang; co API 4xx/5xx |
| KH03 | Vao dat lich hen | Pass | Render form dat lich; co API 4xx/5xx do thieu backend |
| KH04 | Vao lich su lich hen | Pass | Render dung route; co API 4xx/5xx |
| KH05 | Vao ho so benh an | Pass | Render dung route; co API 4xx/5xx |
| KH06 | Vao hoa don thanh toan | Pass | Render dung route; co API 4xx/5xx |
| KH07 | Vao thong tin ca nhan | Pass | Render dung route; co API 4xx/5xx |
| KH08 | Bam them thu cung va submit du lieu co ban | Pass co dieu kien | Form mo duoc; request API bi 4xx/5xx vi backend chua san sang |
| KH09 | Vao dat lich khi chua co du lieu API | Pass co dieu kien | UI khong crash, hien trang dat lich/trang thai thieu du lieu |

Nhan xet theo goc nhin khach hang:

- Khach hang da dang nhap co the vao cac route `/khach-hang/*`, khong bi day ve trang dang nhap neu localStorage hop le.
- Sidebar va khung giao dien khach hang render duoc tren cac man chinh.
- Cac nghiep vu can backend nhu danh sach thu cung, lich hen, ho so benh an, hoa don, submit them thu cung va dat lich chua the xac nhan thanh cong thuc su vi backend hien khong compile/khoi dong duoc.
- Tat ca trang khach hang co console/API error do endpoint `/api/*` tra loi loi hoặc khong co backend that. Can chay lai bo nay sau khi sua `AuthController.java` va khoi dong DB/backend.

## 2.2. Kiem thu chuc nang chi tiet duoi tu cach khach hang

Ngay chay: 2026-05-13  
Script: `scratch/customer-functional-blackbox.cjs`  
Cach chay: gia lap khach hang da dang nhap va mock cac API `/api/*` bang du lieu mau de kiem tra tung thao tac UI nhu nguoi dung that. Cach nay kiem tra duoc hanh vi giao dien va request API duoc goi dung, trong khi backend that dang chua compile.

Ket qua tong hop:

```text
SUMMARY | passed=12 | failed=0 | total=12
```

Chi tiet:

| ID | Trang/chuc nang | Thao tac da kiem | Ket qua |
| --- | --- | --- | --- |
| KH-F01 | Dashboard khach hang | Hien thong ke, lich sap toi, mo modal meo cham soc | Pass |
| KH-F02 | Quan ly thu cung | Bam them thu cung, nhap ten/loai/giong/can nang, submit POST `/api/thu-cung` | Pass |
| KH-F03 | Quan ly thu cung | Bam sua, doi ten thu cung, submit PUT `/api/thu-cung/{id}` | Pass |
| KH-F04 | Quan ly thu cung | Bam xoa, confirm, goi DELETE `/api/thu-cung/{id}` | Pass |
| KH-F05 | Dat lich hen | Chon thu cung, dich vu, bac si, ngay, gio, ghi chu, submit POST `/api/lich-hen` | Pass |
| KH-F06 | Lich su lich hen | Loc trang thai, mo chi tiet lich, bam huy lich, goi PUT `/api/lich-hen/{id}/status` | Pass |
| KH-F07 | Ho so benh an | Tim theo bac si, loc theo thu cung, xem thong tin chan doan/phac do | Pass |
| KH-F08 | Hoa don | Loc hoa don cho thanh toan, xem chi tiet hoa don, tao VietQR | Pass |
| KH-F09 | Hoa don | Xuat bao cao CSV | Pass |
| KH-F10 | Thong tin ca nhan | Bam chinh sua, doi ten, luu PUT `/api/khach-hang/{id}` | Pass |
| KH-F11 | Thong tin ca nhan | Doi mat khau voi xac nhan khong khop, dam bao khong goi API | Pass |
| KH-F12 | Thong tin ca nhan | Doi mat khau hop le, goi POST `/api/auth/change-password` | Pass |

Gioi han cua lan kiem thu nay:

- Day la kiem thu hop den o tang UI voi API mock. No xac nhan cac nut/form/bo loc/modal/luong request cua frontend hoat dong, nhung chua xac nhan backend that co luu DB dung hay khong.
- De ket luan “them/sua/xoa that su duoc trong he thong”, can sua backend compile, khoi dong DB, sau do chay lai cung bo test voi API that va doi chieu du lieu trong DB.

## 2.3. Kiem tra lai toan du an sau yeu cau xac nhan

Ngay chay: 2026-05-13

Ket qua:

| Hang muc | Lenh | Ket qua | Loi chinh |
| --- | --- | --- | --- |
| Frontend unit test | `npm.cmd test -- --runInBand` | Fail | Thieu `jest-environment-jsdom`; `jest.config.js` dung sai option `moduleNameMapping` |
| Frontend production build | `npm.cmd run build` | Fail | `tsconfig.json`: `Invalid value for '--ignoreDeprecations'` |
| Docker Compose config | `docker compose config` | Fail | Sai interpolation `${DB_PASSWORD:123456}` trong healthcheck, can dung format compose hop le |
| Backend compile/test | `mvn.cmd test` | Fail | 39 loi compile: controller/repository/entity khong khop method |
| Customer functional Playwright | `node scratch/customer-functional-blackbox.cjs` | Blocked lan chay lai | Playwright Chromium bi thieu; cai lai browser fail vi may het dung luong `ENOSPC` |

Loi backend compile dang con:

- `KhoiTaoDuLieuMau.java`: goi setter `DichVu` khong ton tai nhu `setId_dich_vu`, `setTen_dich_vu`, `setGia`.
- `AuthController.java`: goi `TaiKhoan.getEmail()` khong ton tai.
- `TaiChinhController.java`: goi cac method repository chua co nhu `calculateRevenueByService`, `calculateRevenueByDay`, `findFullInvoices`.
- `XacThucController.java`: goi nhieu method repository/entity khong ton tai nhu `findAccountByKhachHangId`, `findAccountByNhanVienId`, `NhanVien.setHo_ten`, `KhachHang.setNgay_dang_ky`.

Ket luan cap nhat: khong the ket luan du an da het loi. Phan UI khach hang da pass o lan kiem thu mock truoc do, nhung build/test/deploy/backend hien van fail.

## 3. Bo ca kiem thu hop den de chay khi moi truong san sang

### Nhom A - Trang cong khai

| ID | Muc tieu | Buoc kiem thu | Ket qua mong doi | Trang thai |
| --- | --- | --- | --- | --- |
| A01 | Mo trang chu | Vao `/` | Trang load, hien logo/ten Rexi, menu, CTA dat lich | Pass smoke |
| A02 | Dieu huong gioi thieu | Tu menu vao `/ve-chung-toi` | Trang gioi thieu hien noi dung, khong loi console nghiem trong | Pass smoke, co console error |
| A03 | Bang gia dich vu | Vao `/bang-gia` | Danh sach dich vu/gia hien dung, CTA dat lich hoat dong | Pass smoke, co console error |
| A04 | Danh sach bac si | Vao `/bac-si` | Hien thong tin bac si, anh khong vo layout | Pass smoke, co console error |
| A05 | Lien he | Vao `/lien-he` | Hien thong tin lien he/form, validate truong bat buoc | Pass smoke |
| A06 | 404 | Vao URL khong ton tai | Hien trang 404 va nut quay ve trang chu | Pass smoke |

### Nhom B - Xac thuc tai khoan

| ID | Muc tieu | Du lieu | Ket qua mong doi | Trang thai |
| --- | --- | --- | --- | --- |
| B01 | Dang nhap sai | username/password sai | Hien thong bao loi, khong tao session | Pass smoke |
| B02 | Dang nhap dung khach hang | Tai khoan seed hop le | Chuyen den dashboard khach hang, luu token | Blocked |
| B03 | Dang nhap dung admin | Tai khoan admin hop le | Chuyen den `/quan-ly/dashboard`, hien menu quan tri | Blocked |
| B04 | Dang ky khach hang | Ten, email, SDT, mat khau hop le | Tao tai khoan, co the dang nhap | Blocked |
| B05 | Dang ky trung email/SDT | Email/SDT da ton tai | Bi tu choi voi thong bao ro rang | Blocked |
| B06 | Quen mat khau | Username/email ton tai | Qua duoc buoc xac minh, reset thanh cong | Blocked |
| B07 | Het han token | Token het han/sai | Redirect ve dang nhap, xoa session cuc bo | Blocked |

### Nhom C - Khach hang

| ID | Muc tieu | Buoc kiem thu | Ket qua mong doi | Trang thai |
| --- | --- | --- | --- | --- |
| C01 | Xem dashboard | Dang nhap khach hang, vao `/khach-hang/dashboard` | Hien tong quan lich hen/thu cung/hoa don | Blocked |
| C02 | Them thu cung | Vao quan ly thu cung, them moi | Thu cung xuat hien trong danh sach | Blocked |
| C03 | Sua thu cung | Cap nhat ten/giong/ngay sinh | Du lieu moi duoc luu va hien lai | Blocked |
| C04 | Xoa thu cung | Xoa thu cung test | Danh sach cap nhat, co confirm truoc khi xoa | Blocked |
| C05 | Dat lich hen | Chon thu cung, dich vu, ngay gio, bac si | Tao lich hen thanh cong, hien trong lich su | Blocked |
| C06 | Dat trung gio | Dat lich vao slot da kin | He thong tu choi hoac an slot da kin | Blocked |
| C07 | Xem ho so benh an | Vao `/khach-hang/ho-so-benh-an` | Chi hien ho so cua khach dang nhap | Blocked |
| C08 | Xem hoa don | Vao hoa don thanh toan | Hoa don dung khach hang, trang thai thanh toan ro rang | Blocked |

### Nhom D - Quan ly/phong kham

| ID | Muc tieu | Buoc kiem thu | Ket qua mong doi | Trang thai |
| --- | --- | --- | --- | --- |
| D01 | Dashboard quan ly | Dang nhap admin/quan ly | Hien thong ke va shortcut khong loi API | Blocked |
| D02 | Quan ly lich hen | Tao/sua trang thai lich hen | Trang thai cap nhat dung, co audit neu ho tro | Blocked |
| D03 | Quan ly khach hang | Tim kiem khach hang theo ten/SDT | Ket qua loc dung | Blocked |
| D04 | Quan ly ho so benh an | Tao benh an cho lich hen | Benh an luu duoc va mo chi tiet duoc | Blocked |
| D05 | Ke don thuoc | Them thuoc vao don | Don thuoc luu, so luong/hien thi dung | Blocked |
| D06 | Chot hoa don | Tao hoa don tu benh an/don thuoc | Tong tien dung, hoa don co chi tiet | Blocked |
| D07 | Kho thuoc | Them lo thuoc, xem thuoc sap het han | So luong/hansd hien dung, canh bao dung | Blocked |
| D08 | Lich lam viec | Tao ca truc bac si | Slot dat lich cap nhat theo ca truc | Blocked |

### Nhom E - Phan quyen va bao mat

| ID | Muc tieu | Buoc kiem thu | Ket qua mong doi | Trang thai |
| --- | --- | --- | --- | --- |
| E01 | Khach vao trang admin | Dang nhap khach, vao `/quan-ly/dashboard` | Bi chan/redirect | Blocked |
| E02 | Ke toan vao cau hinh he thong | Dang nhap ke toan, vao `/quan-ly/cau-hinh` | Bi chan do chi admin duoc phep | Blocked |
| E03 | Bac si vao hoa don/kho | Dang nhap bac si, vao route ke toan | Bi chan theo role | Blocked |
| E04 | Goi API khong token | Request endpoint can auth | Tra 401/403, khong lo du lieu | Blocked |
| E05 | Upload file qua gioi han | Upload file > 50MB | Bi tu choi voi thong bao ro rang | Blocked |
| E06 | Chatbot khong API key | Gui cau hoi khi thieu key AI | Hien fallback, khong lam sap UI | Blocked |

## 4. Uu tien sua de tiep tuc kiem thu

1. Sua `Backend/src/main/java/com/rexi/pkty/controller/AuthController.java` de backend compile duoc.
2. Sua `docker-compose.yml`: giu lai mot key `depends_on` duy nhat trong service `frontend`.
3. Sua Jest: doi `moduleNameMapping` thanh `moduleNameMapper`, cai `jest-environment-jsdom`.
4. Sua TypeScript frontend: bo import/bien khong dung, doi `font.weight` Chart.js sang number `700/800` hoac literal hop le.
5. Chay lai smoke test `node scratch/blackbox-smoke.cjs` sau khi backend va DB da san sang de xac minh cac console error/API.

## 5. Dieu kien de kiem thu lai

Moi truong can co:

- Docker Compose parse duoc va dung thanh cong SQL Server, backend, frontend, nginx.
- Backend healthcheck tra 200 tai `/api/lich-hen/count`.
- Frontend mo duoc tai `http://localhost` hoac `http://localhost:3001`.
- Co it nhat mot tai khoan cho moi vai tro: khach hang, admin/quan ly, bac si, ke toan.
- Co du lieu mau: dich vu, bac si, lich lam viec, thuoc, khach hang, thu cung.
