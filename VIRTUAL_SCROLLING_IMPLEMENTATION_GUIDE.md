# 🚀 HƯỚNG DẪN THÊM VIRTUAL SCROLLING

**Ngày tạo:** 02/06/2026  
**Mục đích:** Fix performance cho 6 trang có danh sách lớn  
**Phương pháp:** Sử dụng `useVirtualScroll` hook hoặc copy từ `TiepTanDashboard.tsx`

---

## 📝 CÓ 2 CÁCH IMPLEMENT

### **Cách 1: Dùng useVirtualScroll Hook** (Recommend)
✅ Tái sử dụng code  
✅ Clean code  
✅ Dễ maintain  

### **Cách 2: Copy từ TiepTanDashboard.tsx** (Quick)
✅ Nhanh  
✅ Đã tested  
❌ Code trùng lặp  

---

## 🎯 ĐỘ ƯU TIÊN IMPLEMENT

### **Priority 1: VERY HIGH** (Triển khai ngay)

#### 1️⃣ **QuanLyNhanVienPhanQuyen.tsx**
**Đường dẫn:** `/quan-ly/nhan-vien-phan-quyen`  
**File:** [Frontend/src/pages/admin/QuanLyNhanVienPhanQuyen.tsx](Frontend/src/pages/admin/QuanLyNhanVienPhanQuyen.tsx)  
**Vấn đề:** Danh sách nhân viên có thể có 50-200+ items  
**Threshold cần:** 50 items (khi > 50 thì enable virtual scroll)  
**Row Height:** ~80px

**Bước implement:**
```typescript
// 1. Import hook
import useVirtualScroll from "@hooks/useVirtualScroll";

// 2. Thêm state
const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
  items: filteredNhanVien,  // danh sách đã filter
  itemHeight: 80,
  containerHeight: 500,
  visibleCount: 6,
  threshold: 3
});

// 3. Sửa render
return (
  <div ref={containerRef} style={{ height: '500px', overflow: 'auto', border: '1px solid var(--gray-200)' }}>
    <div ref={tableRef} style={{ 
      height: shouldVirtualize ? `${filteredNhanVien.length * 80}px` : 'auto',
      position: 'relative'
    }}>
      <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * 80}px)` : undefined }}>
        {(shouldVirtualize ? visibleItems : filteredNhanVien).map((nv) => (
          <div key={nv.id} style={{ height: '80px' }}>
            {/* render row */}
          </div>
        ))}
      </div>
    </div>
  </div>
);
```

---

#### 2️⃣ **LichSuLichHen.tsx**
**Đường dẫn:** `/khach-hang/lich-su-lich-hen`  
**File:** [Frontend/src/pages/customer/LichSuLichHen.tsx](Frontend/src/pages/customer/LichSuLichHen.tsx)  
**Vấn đề:** Danh sách lịch hẹn lịch sử có thể rất dài (100+ items)  
**Threshold cần:** 30 items  
**Row Height:** ~120px (appointment card)

**Bước implement:**
```typescript
import useVirtualScroll from "@hooks/useVirtualScroll";

const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
  items: lichHenHistory,
  itemHeight: 120,
  containerHeight: 600,
  visibleCount: 5,
  threshold: 3
});

// Render:
<div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
  <div ref={tableRef} style={{ 
    height: shouldVirtualize ? `${lichHenHistory.length * 120}px` : 'auto',
    position: 'relative'
  }}>
    {/* ... virtual items ... */}
  </div>
</div>
```

---

#### 3️⃣ **QuanLyLichHen.tsx**
**Đường dẫn:** `/quan-ly/lich-hen`  
**File:** [Frontend/src/pages/admin/QuanLyLichHen.tsx](Frontend/src/pages/admin/QuanLyLichHen.tsx)  
**Vấn đề:** Danh sách tất cả lịch hẹn (100-500+ items)  
**Threshold cần:** 40 items  
**Row Height:** ~70px

---

#### 4️⃣ **QuanLyHoSoBenhAn.tsx**
**Đường dẫn:** `/quan-ly/ho-so-benh-an`  
**File:** [Frontend/src/pages/admin/QuanLyHoSoBenhAn.tsx](Frontend/src/pages/admin/QuanLyHoSoBenhAn.tsx)  
**Vấn đề:** Danh sách bệnh án (100-300+ items)  
**Threshold cần:** 40 items  
**Row Height:** ~80px

---

### **Priority 2: HIGH** (Nếu có thời gian)

#### 5️⃣ **BaoCaoThongKe.tsx**
**Dùng khi:** Bảng báo cáo có 100+ dòng  
**Row Height:** ~50px (compact table row)

---

#### 6️⃣ **QuanLyKhoThuoc.tsx**
**Dùng khi:** Kho thuốc có 200+ items  
**Row Height:** ~70px

---

## 🔄 MIGRATION STEPS

### Step 1: Prepare
```bash
# 1. Hook đã được tạo:
Frontend/src/hooks/useVirtualScroll.ts

# 2. Test hook cấu trúc:
- import { useVirtualScroll } from "@hooks/useVirtualScroll"
- Verify compile
```

### Step 2: Implement cho 1 trang (QuanLyNhanVienPhanQuyen.tsx)
```typescript
// A. Tìm phần render danh sách
const filterednhanvien = /* current filter logic */;

// B. Thêm virtual scroll
const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
  items: filterednhanvien,
  itemHeight: 80,
  containerHeight: 500,
  visibleCount: 6
});

// C. Sửa JSX
// OLD: <div>{filterednhanvien.map(...)}</div>
// NEW: <div ref={containerRef}><div ref={tableRef}>...</div></div>

// D. Test:
// - Scroll danh sách
// - Check DevTools → Elements → verify render count (should be < 20)
// - No lag khi scroll
```

### Step 3: Apply template cho 5 trang khác
```typescript
// Sử dụng template:
// <Cách 1> Copy useVirtualScroll implementation
// <Cách 2> Adjust itemHeight, containerHeight
// <Cách 3> Test
```

### Step 4: Verify
```bash
# Check performance
# - Page load time < 2s
# - Scroll smooth (60 FPS)
# - Memory usage not spike
```

---

## 💾 CODE TEMPLATE (COPY-PASTE)

```typescript
import { useVirtualScroll } from "@hooks/useVirtualScroll";

const MyListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  
  // ... fetch data ...
  
  // THÊM VIRTUAL SCROLL
  const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: data,
    itemHeight: 80,           // ⚠️ ADJUST THIS
    containerHeight: 500,     // ⚠️ ADJUST THIS
    visibleCount: 6,          // ⚠️ ADJUST THIS
    threshold: 3
  });

  const ITEM_HEIGHT = 80;    // ⚠️ MUST MATCH itemHeight

  return (
    <>
      <div 
        ref={containerRef} 
        style={{
          height: '500px',
          overflow: 'auto',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'white'
        }}
      >
        <div
          ref={tableRef}
          style={{
            height: shouldVirtualize ? `${data.length * ITEM_HEIGHT}px` : 'auto',
            position: 'relative',
            backgroundColor: 'white'
          }}
        >
          <div
            style={{
              transform: shouldVirtualize ? `translateY(${visibleRange.start * ITEM_HEIGHT}px)` : undefined
            }}
          >
            {(shouldVirtualize ? visibleItems : data).map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--gray-100)',
                  backgroundColor: idx % 2 === 0 ? 'white' : 'var(--gray-50)'
                }}
              >
                {/* YOUR ROW CONTENT HERE */}
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
```

---

## 📊 QUICK REFERENCE

| Trang | Items | Item Height | Container H | Visible Count | Threshold |
|-------|-------|-------------|-------------|---------------|-----------|
| QuanLyNhanVienPhanQuyen | 50-200 | 80 | 500 | 6 | 3 |
| LichSuLichHen | 30-100 | 120 | 600 | 5 | 3 |
| QuanLyLichHen | 40-500 | 70 | 500 | 7 | 4 |
| QuanLyHoSoBenhAn | 40-300 | 80 | 500 | 6 | 3 |
| BaoCaoThongKe | 20-200 | 50 | 600 | 12 | 5 |
| QuanLyKhoThuoc | 50-200 | 70 | 500 | 7 | 4 |

---

## ✅ TESTING CHECKLIST

- [ ] Page loads without errors
- [ ] List renders correctly
- [ ] Scroll is smooth (60 FPS)
- [ ] Items visible when scrolling
- [ ] Search/filter still works
- [ ] Can see `threshold` items before/after viewport
- [ ] DevTools Performance → FPS stays high
- [ ] Memory doesn't spike on scroll
- [ ] Mobile responsive (adjust containerHeight)
- [ ] Works with both virtualized & non-virtualized

---

## 🐛 TROUBLESHOOTING

### Problem: Items not rendering
**Solution:** Check `visibleRange.start` and `visibleRange.end` in React DevTools

### Problem: Scroll is jumpy
**Solution:** Ensure all items have exact same `itemHeight`

### Problem: Blank space when scrolling
**Solution:** Increase `threshold` value (e.g., from 3 to 5)

### Problem: Still too slow
**Solution:** 
- Reduce re-renders with `React.memo()`
- Use `useMemo()` for filtered list
- Check DevTools Profiler

---

## 📚 RESOURCES

- [React Virtual Scrolling Best Practices](https://react-window.vercel.app/)
- [Example: TiepTanDashboard.tsx](Frontend/src/pages/admin/TiepTanDashboard.tsx#L104-L112)
- [Hook: useVirtualScroll.ts](Frontend/src/hooks/useVirtualScroll.ts)

---

_Last updated: 02/06/2026_
