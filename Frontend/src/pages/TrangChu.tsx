import React, { useEffect } from "react";
import { ChatBot } from "@components/ChatBot";
import { Preloader } from "@components/Preloader";
import { MemeCat, ScrollToTop } from "@components/SpecialEffects";

import PhanGioiThieu from "@components/home/PhanGioiThieu";
import PhanTienIch from "@components/home/PhanTienIch";
import PhanDichVu from "@components/home/PhanDichVu";
import PhanThongKe from "@components/home/PhanThongKe";
import PhanQuyTrinh from "@components/home/PhanQuyTrinh";
import PhanBacSi from "@components/home/PhanBacSi";
import PhanDoiTac from "@components/home/PhanDoiTac";
import PhanDanhGia from "@components/home/PhanDanhGia";
import PhanHoiDap from "@components/home/PhanHoiDap";
import PhanCTA from "@components/home/PhanCTA";
import PhanLienHe from "@components/home/PhanLienHe";

/* trang chủ chính */
const TrangChu: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Rexi - Sức Khoẻ Trọn Vẹn Cho Người Bạn Nhỏ";
  }, []);

  return (
    <>
      <Preloader />

      <main>
        {/* phần banner chính */}
        <PhanGioiThieu />

        {/* phần tiện ích nổi bật */}
        <PhanTienIch />

        {/* phần dịch vụ */}
        <PhanDichVu />

        {/* phần thống kê */}
        <PhanThongKe />

        {/* phần quy trình */}
        <PhanQuyTrinh />

        {/* phần bác sĩ */}
        <PhanBacSi />

        {/* phần đối tác */}
        <PhanDoiTac />

        {/* phần đánh giá */}
        <PhanDanhGia />

        {/* phần hỏi đáp */}
        <PhanHoiDap />

        {/* phần kêu gọi hành động */}
        <PhanCTA />

        {/* phần liên hệ */}
        <PhanLienHe />
      </main>

      <ChatBot />
      <MemeCat />
      <ScrollToTop />
    </>
  );
};

export default React.memo(TrangChu);