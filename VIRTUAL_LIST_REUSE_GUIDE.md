# 🚀 HƯỚNG DẪN TÁI SỬ DỤNG CÔNG NGHỆ DANH SÁCH ẢO (VIRTUAL LIST)
> **Tác giả:** Rexi AI & Sếp
> **Mục tiêu:** Giúp sếp dễ dàng copy-paste và áp dụng giải pháp cuộn danh sách hàng chục ngàn dòng siêu mượt (60 FPS, không tốn RAM) vào bất kỳ dự án React/Vite/Next.js nào sau này trong vòng 1 phút!

---

## 🗂️ 1. Component Mẫu Tái Sử Dụng Toàn Diện (`VirtualScrollList.tsx`)

Sếp chỉ cần copy đoạn code này, tạo một file tên `VirtualScrollList.tsx` ở bất kỳ dự án nào sau này. Nó được viết dưới dạng **Generic Component (TypeScript)** để truyền được mọi loại kiểu dữ liệu!

```tsx
import React, { useState } from "react";

// Định nghĩa các cổng kết nối (Props) cho Component
interface VirtualScrollListProps<T> {
  items: T[]; // Mảng dữ liệu đầu vào (ví dụ: danh sách khách hàng, hóa đơn...)
  rowHeight: number; // Chiều cao cố định của 1 dòng (ví dụ: 72)
  visibleHeight: number; // Chiều cao tối đa của khung hiển thị (ví dụ: 400)
  className?: string; // Tên class CSS tùy chọn
  style?: React.CSSProperties; // Style tùy chọn cho container ngoài
  
  // Hàm chỉ định cách render giao diện của mỗi dòng
  renderRow: (item: T, globalIndex: number, style: React.CSSProperties) => React.ReactNode;
}

export function VirtualScrollList<T>({
  items,
  rowHeight,
  visibleHeight,
  className = "",
  style = {},
  renderRow
}: VirtualScrollListProps<T>) {
  // State lưu trữ vị trí cuộn chuột hiện tại (đơn vị: pixel)
  const [scrollTop, setScrollTop] = useState(0);

  // 1. Tính toán tổng chiều cao giả lập cho toàn bộ danh sách
  const totalHeight = items.length * rowHeight;

  // 2. Tính toán các chỉ số dòng trong tầm mắt của người dùng
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + visibleHeight) / rowHeight) + 1);

  // 3. Cắt lát mảng dữ liệu (Chỉ lấy những dòng đang nhìn thấy)
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      className={`virtual-scroll-container ${className}`}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{
        height: `${visibleHeight}px`,
        overflowY: "auto",
        position: "relative",
        boxSizing: "border-box",
        ...style
      }}
    >
      {items.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
          Không có dữ liệu hiển thị.
        </div>
      ) : (
        // Thẻ div khổng lồ để tạo thanh cuộn giả vờ
        <div style={{ height: `${totalHeight}px`, position: "relative", width: "100%" }}>
          {visibleItems.map((item, idx) => {
            const globalIndex = startIndex + idx;
            
            // Định vị dòng bằng Absolute Positioning
            const rowStyle: React.CSSProperties = {
              position: "absolute",
              top: `${globalIndex * rowHeight}px`,
              left: 0,
              width: "100%",
              height: `${rowHeight}px`,
              boxSizing: "border-box"
            };

            return renderRow(item, globalIndex, rowStyle);
          })}
        </div>
      )}
    </div>
  );
}
```

---

## 💻 2. Cách Sử Dụng Trong Dự Án Khác (Ví Dụ Thực Tế)

Khi đã có component trên, ở trang hiển thị danh sách của dự án mới, sếp chỉ việc lôi ra dùng như sau:

```tsx
import React from "react";
import { VirtualScrollList } from "./components/VirtualScrollList";

interface User {
  id: number;
  name: string;
  phone: string;
}

const MyNewPage: React.FC = () => {
  // Giả sử có mảng 20,000 người dùng
  const usersList: User[] = Array.from({ length: 20000 }, (_, i) => ({
    id: i + 1,
    name: `Khách hàng thứ ${i + 1}`,
    phone: `0981.888.${String(i).padStart(3, '0')}`
  }));

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
      <h2>Danh sách thành viên ({usersList.length} người)</h2>
      
      {/* KHAI BÁO VIRTUAL LIST SIÊU NHANH */}
      <VirtualScrollList
        items={usersList}
        rowHeight={60} // Mỗi dòng cao 60px
        visibleHeight={300} // Cả khung cuộn cao 300px (hiển thị 5 dòng cùng lúc)
        style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}
        
        // Cách vẽ giao diện của mỗi dòng
        renderRow={(user, globalIndex, rowStyle) => (
          <div 
            key={user.id} 
            style={{ 
              ...rowStyle, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: "1px solid #f1f5f9"
            }}
          >
            <div>
              <strong style={{ color: "#0f172a" }}>{user.name}</strong>
              <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "10px" }}>#{user.id}</span>
            </div>
            <span style={{ color: "#0d9488", fontWeight: "bold" }}>{user.phone}</span>
          </div>
        )}
      />
    </div>
  );
};

export default MyNewPage;
```

---

## 💡 3. Các lưu ý quan trọng để tối ưu hóa tối đa:
1. **Chiều cao dòng phải cố định (`rowHeight`):** Thuật toán hoạt động hoàn hảo khi các dòng có chiều cao bằng nhau tuyệt đối.
2. **Khai báo `box-sizing: border-box`:** Luôn khai báo thuộc tính này trong style của dòng để đảm bảo các khoảng đệm (`padding`) không làm phình chiều cao dòng ra ngoài tính toán `rowHeight`.
3. **Thêm style hover mượt mà:** Sếp nên định nghĩa thêm transition background trong CSS để tạo cảm giác chuyển động trơn tru khi rê chuột qua các dòng ảo.
