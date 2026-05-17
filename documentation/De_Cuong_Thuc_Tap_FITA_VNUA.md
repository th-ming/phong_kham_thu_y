BỘ GIÁO DỤC VÀ ĐÀO TẠO
HỌC VIỆN NÔNG NGHIỆP VIỆT NAM
KHOA CÔNG NGHỆ THÔNG TIN
-----------------------------------------------------

ĐỀ CƯƠNG THỰC TẬP CHUYÊN NGÀNH
ĐỀ TÀI: XÂY DỰNG HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI

Sinh viên thực hiện : Trần Hoàng Minh
Mã sinh viên        : 671688
Lớp                 : K67HTTTB
Ngành học           : Hệ thống thông tin
Mã nguồn GitHub     : https://github.com/tranminh09818/phong_kham_thu_y
Giảng viên hướng dẫn: Nguyễn Thị Lan
Địa điểm thực tập   : CÔNG TY CỔ PHẦN TẬP ĐOÀN NIC GROUP
Thời gian thực tập  : Từ ngày 20/04/2026 đến ngày 31/05/2026

-----------------------------------------------------
HÀ NỘI - 2026

=====================================================

ĐỀ CƯƠNG CHI TIẾT & BÁO CÁO PHÂN TÍCH HỆ THỐNG
Tên đề tài: Xây dựng hệ thống quản lý phòng khám thú y Rexi

I. THÔNG TIN CHUNG VÀ CƠ SỞ THỰC TẬP
- Tên đề tài: Xây dựng hệ thống quản lý phòng khám thú y Rexi.
- Sinh viên thực hiện: Trần Hoàng Minh                        Lớp: K67HTTTB
- Mã nguồn dự án GitHub: https://github.com/tranminh09818/phong_kham_thu_y
- Giảng viên hướng dẫn tại Học viện: Nguyễn Thị Lan
- Cơ sở thực tập: CÔNG TY CỔ PHẦN TẬP ĐOÀN NIC GROUP
- Địa chỉ thực tập: Tòa nhà NIC GROUP, số 3A, Thi Sách, Hai Bà Trưng, Hà Nội
- Thời gian thực tập: Từ ngày 20/04/2026 đến ngày 31/05/2026

Giới thiệu về cơ sở thực tập - Tập đoàn NIC GROUP:
CÔNG TY CỔ PHẦN TẬP ĐOÀN NIC GROUP là một trong những tập đoàn đa ngành hàng đầu Việt Nam, cung cấp các giải pháp chuyên nghiệp về nhân sự (HR Solutions), thuê ngoài quy trình kinh doanh (BPO), vận hành sàn thương mại điện tử và dịch vụ CNTT hỗ trợ quản trị doanh nghiệp. Với môi trường làm việc chuyên nghiệp tại Tòa nhà NIC GROUP số 3A Thi Sách, sinh viên được tiếp cận các bài toán thực tiễn của doanh nghiệp, từ đó phân tích và xây dựng hệ thống phần mềm quản lý hỗ trợ vận hành dịch vụ thực tế.

II. ĐẶT VẤN ĐỀ VÀ LÝ DO CHỌN ĐỀ TÀI
Trong thời kỳ chuyển đổi số và bùng nổ của ngành dịch vụ chăm sóc sức khỏe thú cưng (Pet Care) tại Việt Nam, các phòng khám thú y đòi hỏi phải số hóa quy trình nghiệp vụ để nâng cao chất lượng điều trị và quản lý vận hành. Qua khảo sát thực trạng tại cơ sở thực tập (Phòng khám Thú y Rexi), quy trình làm việc hiện tại đối mặt với nhiều khó khăn, cụ thể:
1. Quy trình tiếp nhận lâm sàng thủ công: Quy trình tiếp nhận thông tin thú cưng, đặt lịch khám và phân phối lịch hẹn cho các bác sĩ trực chủ yếu dựa vào sổ sách hoặc các công cụ chat rời rạc. Điều này gây nhầm lẫn thông tin bệnh nhân, ùn ứ tại quầy tiếp đón trong giờ cao điểm và thiếu sự liên kết thông tin giữa các ca trực của bác sĩ.
2. Hồ sơ bệnh án điện tử (EMR) chưa được chuẩn hóa: Việc lưu trữ hồ sơ khám lâm sàng, kết quả xét nghiệm cận lâm sàng, toa thuốc điều trị và lịch tiêm chủng phòng ngừa cho vật nuôi bằng sổ giấy hoặc Excel rời rạc gây khó khăn cho việc tra cứu lịch sử bệnh lý lâu dài. Bác sĩ gặp trở ngại lớn khi cần phân tích phác đồ điều trị cũ để đưa ra chẩn đoán chính xác.
3. Kế toán hóa đơn và thanh toán trực tuyến bất tiện: Module thanh toán thủ công dễ xảy ra sai sót khi tính toán tiền thuốc, phí dịch vụ xét nghiệm, dẫn đến đối chiếu dòng tiền thu chi hàng ngày gặp nhiều khó khăn. Hệ thống chưa tích hợp các giải pháp thanh toán không tiền mặt hiện đại như quét mã VietQR động tự động điền số tiền hóa đơn hoặc cổng thanh toán VNPay, làm chậm tốc độ cashiering và gây bất tiện cho chủ thú cưng.
4. Kiểm soát dược phẩm hạn chế: Quản lý kho dược phẩm, nhập kho, tồn kho, theo dõi hạn sử dụng (Expiry Date tracking) của từng lô thuốc thú y chưa được kiểm soát chặt chẽ theo mã số, dẫn đến nguy cơ thất thoát thuốc hoặc sử dụng thuốc cận date/quá hạn gây nguy hiểm cho vật nuôi.
5. Quản lý lịch trực nhân sự phức tạp: Việc xếp ca trực, ca làm việc, ca nghỉ của đội ngũ y bác sĩ, tiếp tân và kế toán hoàn toàn thủ công, dẫn đến thiếu nhân sự trong các ca trực khẩn cấp hoặc chồng chéo lịch làm việc.

Nhận thức được thực trạng nghiệp vụ phức tạp đó, với tư cách là một sinh viên chuyên ngành Hệ thống thông tin của Học viện Nông nghiệp Việt Nam, em lựa chọn đề tài: "Xây dựng hệ thống quản lý phòng khám thú y Rexi" nhằm áp dụng các kiến thức cốt lõi về phân tích thiết kế hệ thống, kiến trúc cơ sở dữ liệu quan hệ Microsoft SQL Server, lập trình REST APIs chuyên sâu với Spring Boot, xây dựng giao diện tương tác React SPA, và kiểm thử tự động Playwright để xây dựng một giải pháp quản lý toàn diện cho phòng khám thú y.

III. MỤC TIÊU VÀ ĐỐI TƯỢNG NGHIÊN CỨU
1. Mục tiêu đề tài:
- Về học thuật: Làm chủ kiến trúc phần mềm 3 lớp (3-tier Architecture) with Backend Spring Boot (Java 17) kết nối CSDL Microsoft SQL Server, Frontend SPA bằng React & TypeScript chạy trên nền Vite, tích hợp kịch bản kiểm thử tự động E2E bằng Playwright.
- Về thực tiễn: Thiết kế hệ thống cơ sở dữ liệu quan hệ (RDBMS) chuẩn hóa với 28 bảng dữ liệu liên kết chặt chẽ (JPA Entity mapped) để quản lý thông tin thú cưng, lịch hẹn, bệnh án lâm sàng, kho thuốc, và kế toán thanh toán. Tích hợp thanh toán quét mã VietQR động ngân hàng MB Bank (Số TK: ***REMOVED***-VIETQR_ACCOUNT_NO - Tên TK: ***REMOVED***-VIETQR_ACCOUNT_NAME) và VNPay Sandbox.
- Về sản phẩm: Triển khai hoàn chỉnh 2 cổng cổng thông tin đồng bộ: Client Portal (cho khách hàng đặt lịch hẹn, xem bệnh án, thanh toán hóa đơn VietQR trực tuyến) và Staff Portal (dành cho Admin, Tiếp tân, Bác sĩ, Kế toán quản trị).

2. Đối tượng nghiên cứu:
- Các nghiệp vụ quản lý lâm sàng, cận lâm sàng (xét nghiệm, tiêm chủng) và phi lâm sàng (kế toán, hóa đơn, quản lý kho thuốc, đặt lịch trực tuyến) tại phòng khám thú y.
- Mô hình dữ liệu thực thể liên kết (ERD) và cơ chế phân quyền người dùng (Role-Based Access Control - RBAC).
- Phương pháp tự động hóa kiểm thử phần mềm bằng Playwright để kiểm soát hồi quy và đảm bảo độ ổn định của hệ thống.

IV. NỘI DUNG VÀ PHƯƠNG PHÁP NGHIÊN CỨU CHI TIẾT
Hệ thống được thiết kế với cơ chế phân quyền người dùng chặt chẽ để phục vụ 5 vai trò nghiệp vụ:
1. Admin (Quản trị viên):
  + Quản lý nhân sự: Tạo tài khoản, cấu hình thông tin cá nhân và gán vai trò chuyên môn (TaiKhoan, NhanVien, VaiTroHeThong).
  + Quản lý lịch trực nhân viên: Thiết lập bảng phân ca trực hàng tuần cho từng bác sĩ và y tá trực để đảm bảo phòng khám luôn có người đón tiếp bệnh nhân 24/7 (LichLamViecNhanVien).
  + Quản lý dịch vụ: Thiết lập danh mục dịch vụ điều trị (Khám bệnh lâm sàng, Spa, Siêu âm, Xét nghiệm) kèm đơn giá dịch vụ tiêu chuẩn (DichVu).

2. Tiếp tân (Receptionist):
  + Tiếp nhận bệnh nhân tại quầy: Tìm kiếm thông tin chủ nuôi và thú cưng trên hệ thống qua số điện thoại; nếu là khách hàng mới, tiếp tân tiến hành đăng ký thông tin chủ nuôi (KhachHang) và tạo hồ sơ thú cưng mới (ThuCung).
  + Quản lý lịch hẹn trực tiếp & trực tuyến: Duyệt các yêu cầu đặt lịch trực tuyến của khách hàng trên giao diện quản trị; xếp lịch và chỉ định phòng khám cùng bác sĩ khám lâm sàng phù hợp (LichHen).
  + Quản lý hàng đợi khám bệnh: Cập nhật cân nặng, đo nhiệt độ vật lý ban đầu của thú cưng tại thời điểm đón tiếp, đẩy bệnh nhân vào hàng đợi của bác sĩ tương ứng để điều phối luồng khám khoa học.

3. Bác sĩ (Doctor):
  + Khám lâm sàng và chẩn đoán: Tiếp nhận thú cưng từ hàng đợi khám; tra cứu toàn bộ hồ sơ bệnh án điện tử (EMR) cũ để xem tiền sử dị ứng thuốc và bệnh lý nền (HoSoBenhAn); ghi nhận triệu chứng hiện tại, đưa ra chẩn đoán lâm sàng và phác đồ điều trị chi tiết.
  + Chỉ định cận lâm sàng: Ra lệnh thực hiện các xét nghiệm chuyên sâu (Xét nghiệm máu, Chụp X-quang, Siêu âm ổ bụng) nếu cần thiết; y tá thực hiện xét nghiệm xong sẽ tải trực tiếp file kết quả xét nghiệm và hình ảnh phim chụp đính kèm lên hồ sơ bệnh án của ca khám (LoaiXetNghiem, BenhAn_XetNghiem, file_dinh_kem).
  + Điều trị: Lập đơn thuốc chi tiết (chọn loại thuốc từ kho thuốc khả dụng của phòng khám, nhập số lượng và ghi rõ liều dùng chi tiết) (DonThuoc, DonThuocChiTiet); chỉ định tiêm vaccine ngừa bệnh (TiemChung); hẹn ngày tái khám dự kiến.

4. Kế toán (Accountant):
  + Cashiering (Thanh toán hóa đơn): Khi bác sĩ hoàn thành ca khám lâm sàng và kê toa thuốc, hệ thống sẽ tự động tổng hợp tất cả chi phí dịch vụ sử dụng, chi phí xét nghiệm và tổng tiền thuốc của toa thuốc để tạo hóa đơn chi tiết (HoaDon, HoaDonChiTiet).
  + Hỗ trợ phương thức thanh toán trực tuyến hiện đại: Tích hợp giải pháp quét mã VietQR động kết nối với ngân hàng Quân đội (MB Bank): Tự động sinh mã QR chứa thông tin số tài khoản của phòng khám (Số TK: ***REMOVED***-VIETQR_ACCOUNT_NO - Tên TK: ***REMOVED***-VIETQR_ACCOUNT_NAME), số tiền chính xác cần thanh toán và nội dung giao dịch chứa mã hóa đơn để chủ nuôi chỉ cần quét mã là thanh toán được ngay mà không cần nhập thủ công. Tích hợp cổng thanh toán trực tuyến VNPay Sandbox (ThanhToan).
  + Quản lý kho dược phẩm: Ghi nhận giao dịch nhập kho thuốc mới từ các nhà cung cấp (NhaCungCap, GiaoDichKho); phân chia lô thuốc rõ rệt (LoThuoc); theo dõi số lượng tồn kho thực tế; hệ thống tự động đưa ra cảnh báo khẩn cấp đối với các lô thuốc cận date hoặc hết hạn sử dụng để kịp thời xử lý (Thuoc).
  + Báo cáo doanh thu: Biểu diễn doanh thu hàng ngày, hàng tháng dưới dạng biểu đồ trực quan giúp quản lý theo dõi sát sao tình hình tài chính.

5. Khách hàng (Customer Portal):
  + Quản lý hồ sơ thú cưng: Khách hàng đăng ký tài khoản có thể thêm mới và quản lý thông tin chi tiết của nhiều thú cưng mình nuôi dưỡng (Tên, loài, giống, giới tính, ngày sinh, cân nặng, hình ảnh).
  + Đặt lịch hẹn khám trực tuyến: Khách hàng chủ động chọn dịch vụ cần khám, chọn bác sĩ thú y mong muốn và lựa chọn khung giờ trống phù hợp với thời gian cá nhân. Hệ thống tự động kiểm tra ca trực của bác sĩ để tránh xung đột lịch.
  + Tra cứu lịch sử bệnh án & Thanh toán: Khách hàng tra cứu nhanh kết quả bệnh án cũ của vật nuôi, xem hướng dẫn đơn thuốc của bác sĩ từ bất kỳ đâu, và quét mã VietQR thanh toán nhanh chóng đối với các hóa đơn chưa thanh toán.

V. THIẾT KẾ CƠ SỞ DỮ LIỆU SƠ BỘ
Hệ thống cơ sở dữ liệu được thiết kế chuẩn hóa cao (3NF) trên Microsoft SQL Server, gồm 28 bảng dữ liệu quan hệ được chia thành 7 nhóm phân hệ:
1. Nhóm Xác thực & Phân quyền: VaiTroHeThong, TaiKhoan, ChucNang, PhanQuyen.
2. Nhóm Nhân sự & Lịch trực: NhanVien, LichLamViecNhanVien, PhanCongNhanVien.
3. Nhóm Khách hàng & Thú cưng: KhachHang, ThuCung, DangKyNhanTin.
4. Nhóm Khám chữa bệnh & Lâm sàng: LichHen, DichVuLichHen, HoSoBenhAn, LoaiXetNghiem, BenhAn_XetNghiem, KetQuaXetNghiem_ChiTiet, TiemChung, file_dinh_kem.
5. Nhóm Kê đơn & Dược phẩm: DonThuoc, DonThuocChiTiet, Thuoc, LoThuoc, GiaoDichKho, NhaCungCap.
6. Nhóm Tài chính & Thanh toán: HoaDon, HoaDonChiTiet, ThanhToan, DanhGiaDichVu.
7. Nhóm Tương tác & Tiện ích: NhatKyChat, LichSuTuVan, ThongBao, EmailMarketing, CauHinhHeThong, NhatKyHeThong.

Hệ thống thiết lập 8 chỉ mục phi cụm (Non-Clustered Indexes) để tối ưu hiệu năng tìm kiếm và xây dựng các SQL Views (v_LichHenHomNay, v_HoSoBenhAn_GanDay, v_DoanhThu_TheoThang, v_ThuocSapHetHan) cùng các Stored Procedures nghiệp vụ (sp_CapNhatTonKho sử dụng Database Transaction, sp_LapHoaDon tự động gom chi phí, sp_TaoThongBaoTiemChung).

VI. KẾ HOẠCH THỰC HIỆN CHI TIẾT (THEO TIẾN ĐỘ 6 TUẦN THỰC TẾ)

| Tuần | Nội dung công việc dự kiến | Sản phẩm đạt được | Phương pháp kiểm chứng |
| :--- | :--- | :--- | :--- |
| Tuần 1 | Khảo sát thực tế quy trình nghiệp vụ tiếp đón, khám lâm sàng và kế toán tại Phòng khám Rexi. Tìm hiểu cơ cấu tổ chức và thu thập tài liệu nghiệp vụ mẫu. | Bản đặc tả yêu cầu nghiệp vụ (SRS). Tài liệu khảo sát hiện trạng phòng khám thú y. | Giảng viên hướng dẫn duyệt đặc tả. Kiểm tra tính đầy đủ của tài liệu nghiệp vụ mẫu. |
| Tuần 2 | Phân tích hệ thống hướng đối tượng. Vẽ sơ đồ Use Case chi tiết. Thiết kế sơ đồ thực thể liên kết (ERD) chuẩn hóa với 28 bảng dữ liệu quan hệ trên Microsoft SQL Server. | Bản vẽ sơ đồ Use Case. Bản thiết kế cơ sở dữ liệu quan hệ (ERD 3NF). | Đánh giá tính chuẩn hóa cơ sở dữ liệu (3NF). Duyệt cấu trúc khóa chính, khóa ngoại chặt chẽ. |
| Tuần 3 | Cài đặt môi trường phát triển (JDK 17, Node.js, SQL Server). Lập trình cấu trúc khung mã nguồn Backend (Spring Boot Maven) & Frontend (React TS Vite). Cấu hình bảo mật JWT Token và cơ chế phân quyền RBAC. | Mã nguồn khung dự án hoạt động ổn định. Kết nối thành công CSDL SQL Server 2012. | Chạy khởi động dự án ở cổng 8081 & 3005. Test API đăng ký/đăng nhập qua Postman đạt HTTP Status 200. |
| Tuần 4 | Lập trình các module lâm sàng cốt lõi: Quản lý khách hàng, thú cưng; Đặt lịch hẹn khám bệnh; Khám lâm sàng, chẩn đoán cận lâm sàng và kê toa thuốc điện tử. | Giao diện và hệ thống API RESTful hoàn chỉnh cho phân hệ khám chữa bệnh của Bác sĩ và Tiếp tân. | Kiểm thử thủ công luồng thông tin: Đón tiếp thú cưng -> Phân phòng khám -> Bác sĩ chuẩn chẩn đoán lâm sàng -> Lưu hồ sơ bệnh án thành công. |
| Tuần 5 | Lập trình module quản trị kho thuốc theo lô và tài chính: Lập hóa đơn, tích hợp mã quét ngân hàng VietQR động MB Bank, thanh toán VNPay Sandbox; Viết bộ kịch bản kiểm thử E2E Playwright (.spec.ts). | Giao diện Accountant Dashboard trực quan. Cổng quét thanh toán tự động. Bộ kịch bản test tự động Playwright hoàn chỉnh. | Kiểm thử tính toán hóa đơn tự động từ toa thuốc. Chạy thử Playwright suite và đạt tỷ lệ 100% kịch bản kiểm thử thành công (Green Tests). |
| Tuần 6 | Kiểm thử toàn diện hệ thống, tối ưu hóa giao diện/hiệu năng; Hoàn thiện Quyển báo cáo thực tập tốt nghiệp chi tiết và xin nhận xét, đóng dấu đỏ xác nhận của Tập đoàn NIC GROUP. | Quyển báo cáo thực tập tốt nghiệp hoàn chỉnh có dấu đỏ của NIC GROUP. Bản phát hành phần mềm ổn định. | Quyển báo cáo đạt chuẩn định dạng của Khoa CNTT VNUA. Xin đầy đủ chữ ký và dấu đỏ tròn của cơ sở thực tập trên phiếu đánh giá. |

VII. DỰ KIẾN KẾT QUẢ ĐẠT ĐƯỢC
- Xây dựng thành công hệ thống phần mềm quản lý phòng khám thú y Rexi toàn diện, chạy mượt mà, đồng bộ dữ liệu thời gian thực giữa các phân hệ nghiệp vụ.
- Thiết kế hệ thống dữ liệu Microsoft SQL Server hoàn chỉnh, chuẩn hóa cao (3NF), đảm bảo tính toàn vẹn và bảo mật cao của hồ sơ bệnh án lâm sàng.
- Chứng minh năng lực phát triển phần mềm và QA/QC chuyên nghiệp bằng bộ kịch bản kiểm thử tự động hóa Playwright với kết quả chạy thành công 100%.
- Một quyển báo cáo thực tập chi tiết, trình bày khoa học, đúng chuẩn định dạng quy định của Khoa Công nghệ thông tin - Học viện Nông nghiệp Việt Nam.

Hà Nội, ngày ..... tháng ..... năm 2026

      GIẢNG VIÊN HƯỚNG DẪN                     SINH VIÊN THỰC HIỆN
         Nguyễn Thị Lan                           Trần Hoàng Minh
