import React, { useEffect } from "react";
import { Preloader } from "@components/Preloader";
import { useRef } from "react";
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
import HomeGsapMotion from "@components/home/HomeGsapMotion";

// trang chủ chính
const TrangChu: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {

    document.title = "Rexi - Sức Khoẻ Trọn Vẹn Cho Người Bạn Nhỏ";
  }, []);

  return (
    <>
      <Preloader />

      <main ref={mainRef}>
        <HomeGsapMotion scopeRef={mainRef} />

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

        {/* phần bs */}
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

      <MemeCat />
      <ScrollToTop />
    </>
  );
};

export default React.memo(TrangChu);
