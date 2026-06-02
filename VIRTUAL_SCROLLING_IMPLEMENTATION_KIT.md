# 🎯 VIRTUAL SCROLLING IMPLEMENTATION KIT

**Status:** Ready to implement  
**Time to implement:** 15-20 minutes per page

---

## 📌 HOW TO IMPLEMENT

For each page below:
1. Add the import at the top
2. Add the virtualization state/refs
3. Wrap the table tbody with virtual scroll container
4. Test

---

## 1️⃣ QuanLyNhanVienPhanQuyen.tsx

### STEP 1: Add Import (after line 7)
```typescript
import useVirtualScroll from "@hooks/useVirtualScroll";
```

### STEP 2: Add State (after line 248 where `filteredNhanViens` is defined)
```typescript
  const VIRTUAL_ITEM_HEIGHT = 80;
  const VIRTUAL_CONTAINER_HEIGHT = 500;
  
  const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: filteredNhanViens,
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 6,
    threshold: 3
  });
```

### STEP 3: Replace Table (line 500-530)
**OLD:**
```html
<tbody>
  {filteredNhanViens.map((b) => (
    <tr key={b.id_nhan_vien} ...>
      {/* row content */}
    </tr>
  ))}
</tbody>
```

**NEW:**
```jsx
<tbody 
  ref={containerRef} 
  style={{
    height: shouldVirtualize ? `${VIRTUAL_CONTAINER_HEIGHT}px` : 'auto',
    overflow: shouldVirtualize ? 'auto' : 'visible',
    display: 'block'
  }}
>
  <tr 
    ref={tableRef} 
    style={{
      display: 'block',
      height: shouldVirtualize ? `${filteredNhanViens.length * VIRTUAL_ITEM_HEIGHT}px` : 'auto',
      position: 'relative'
    }}
  >
    <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px)` : undefined }}>
      {(shouldVirtualize ? visibleItems : filteredNhanViens).map((b) => (
        <tr key={b.id_nhan_vien} style={{ display: 'table', width: '100%', height: `${VIRTUAL_ITEM_HEIGHT}px` }}>
          {/* existing row content - UNCHANGED */}
        </tr>
      ))}
    </div>
  </tr>
</tbody>
```

---

## 2️⃣ LichSuLichHen.tsx

### STEP 1: Add Import (after line 8)
```typescript
import useVirtualScroll from "@hooks/useVirtualScroll";
```

### STEP 2: Add State (after `const currentRows = ...` around line 453)
```typescript
  const VIRTUAL_ITEM_HEIGHT = 120; // AppointmentCard height
  const VIRTUAL_CONTAINER_HEIGHT = 600;
  
  const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: lichHenFiltered || [],
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 5,
    threshold: 3
  });
```

### STEP 3: Replace Render Logic (around line 453)
**OLD:**
```jsx
{currentRows.length === 0 ? (
  <div>Empty state</div>
) : (
  currentRows.map((item) => (
    <AppointmentCard ... />
  ))
)}
```

**NEW:**
```jsx
<div 
  ref={containerRef} 
  style={{
    height: `${VIRTUAL_CONTAINER_HEIGHT}px`,
    overflow: 'auto',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)'
  }}
>
  <div
    ref={tableRef}
    style={{
      position: 'relative',
      height: shouldVirtualize ? `${(lichHenFiltered?.length || 0) * VIRTUAL_ITEM_HEIGHT}px` : 'auto'
    }}
  >
    <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px)` : undefined }}>
      {shouldVirtualize ? (
        visibleItems.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p>Không có lịch hẹn</p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <AppointmentCard key={getAppointmentId(item)} item={item} thuCungs={thuCungs} onCancel={handleCancelAppointment} onRebook={handleRebook} />
          ))
        )
      ) : (
        currentRows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p>Không có lịch hẹn</p>
          </div>
        ) : (
          currentRows.map((item) => (
            <AppointmentCard key={getAppointmentId(item)} item={item} thuCungs={thuCungs} onCancel={handleCancelAppointment} onRebook={handleRebook} />
          ))
        )
      )}
    </div>
  </div>
</div>
```

---

## 3️⃣ QuanLyLichHen.tsx

### STEP 1: Add Import (after line 7)
```typescript
import useVirtualScroll from "@hooks/useVirtualScroll";
```

### STEP 2: Add State (after line 200 where currentRows is defined)
```typescript
  const VIRTUAL_ITEM_HEIGHT = 70;
  const VIRTUAL_CONTAINER_HEIGHT = 500;
  
  const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: currentRows,
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 7,
    threshold: 4
  });
```

### STEP 3: Replace Table (around line 208)
**OLD:**
```html
<tbody>
  {currentRows.map((l) => (
    <tr key={l.id_lich_hen}>
      {/* row content */}
    </tr>
  ))}
</tbody>
```

**NEW:**
```jsx
<tbody 
  ref={containerRef}
  style={{
    height: shouldVirtualize ? `${VIRTUAL_CONTAINER_HEIGHT}px` : 'auto',
    overflow: shouldVirtualize ? 'auto' : 'visible',
    display: 'block'
  }}
>
  <tr 
    ref={tableRef}
    style={{
      display: 'block',
      height: shouldVirtualize ? `${currentRows.length * VIRTUAL_ITEM_HEIGHT}px` : 'auto',
      position: 'relative'
    }}
  >
    <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px)` : undefined }}>
      {visibleItems.map((l) => (
        <tr key={l.id_lich_hen} style={{ display: 'table', width: '100%', height: `${VIRTUAL_ITEM_HEIGHT}px` }}>
          {/* existing row content - UNCHANGED */}
        </tr>
      ))}
    </div>
  </tr>
</tbody>
```

---

## 4️⃣ QuanLyHoSoBenhAn.tsx

### STEP 1: Add Import (after line 5)
```typescript
import useVirtualScroll from "@hooks/useVirtualScroll";
```

### STEP 2: Add State (after line 74 where currentRows is defined)
```typescript
  const VIRTUAL_ITEM_HEIGHT = 80;
  const VIRTUAL_CONTAINER_HEIGHT = 500;
  
  const { visibleItems, containerRef, tableRef, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: currentRows,
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 6,
    threshold: 3
  });
```

### STEP 3: Replace Table (around line 117)
**OLD:**
```html
<tbody>
  {currentRows.map((h) => (
    <tr key={h.id_ho_so}>
      {/* row content */}
    </tr>
  ))}
</tbody>
```

**NEW:**
```jsx
<tbody
  ref={containerRef}
  style={{
    height: shouldVirtualize ? `${VIRTUAL_CONTAINER_HEIGHT}px` : 'auto',
    overflow: shouldVirtualize ? 'auto' : 'visible',
    display: 'block'
  }}
>
  <tr 
    ref={tableRef}
    style={{
      display: 'block',
      height: shouldVirtualize ? `${currentRows.length * VIRTUAL_ITEM_HEIGHT}px` : 'auto',
      position: 'relative'
    }}
  >
    <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px)` : undefined }}>
      {visibleItems.map((h) => (
        <tr key={h.id_ho_so} style={{ display: 'table', width: '100%', height: `${VIRTUAL_ITEM_HEIGHT}px` }}>
          {/* existing row content - UNCHANGED */}
        </tr>
      ))}
    </div>
  </tr>
</tbody>
```

---

## ⚙️ PARAMETER TUNING

If scroll feels jerky, adjust these:

```typescript
// FOR LARGER ITEMS
{
  itemHeight: 100,        // ↑ Increase if items taller
  containerHeight: 600,   // ↑ More visible area
  visibleCount: 5,        // ↓ Fewer items visible at once
  threshold: 5            // ↑ More buffer items
}

// FOR BETTER PERFORMANCE
{
  threshold: 1,           // ↓ Less buffer (faster)
  visibleCount: 10        // ↑ Show more items
}
```

---

## ✅ TESTING CHECKLIST

After each implementation:

- [ ] Page loads without errors
- [ ] List displays correctly
- [ ] Scroll is smooth (no jank)
- [ ] Filter/search still works
- [ ] Pagination removed (or hidden if needed)
- [ ] Open DevTools → Performance → scroll and check FPS (should stay 55-60)
- [ ] Check DevTools → Elements → verify only ~15 rows rendered (not all)

---

## 🐛 IF IT BREAKS

**Issue: Items not showing**
- Check `itemHeight` matches actual row height
- Verify containerRef is attached to correct element

**Issue: Scroll is jumpy**
- Increase `threshold` from 3 to 5
- Ensure all rows have EXACT same height

**Issue: Memory still high**
- Check if old pagination logic still running
- Remove pagination state if not needed

---

## 📋 ORDER TO IMPLEMENT

1. **QuanLyNhanVienPhanQuyen.tsx** (Staff list - 50-200 items)
2. **LichSuLichHen.tsx** (Appointment history - 30-100 items)
3. **QuanLyLichHen.tsx** (All appointments - 40-500 items)
4. **QuanLyHoSoBenhAn.tsx** (Medical records - 40-300 items)

---

## 🚀 QUICK START (5 minutes)

1. Copy the hook import
2. Add virtual scroll state (COPY from above)
3. Find the `{items.map(...)}` in render
4. Wrap with `<div ref={containerRef}>` + scroll container
5. Change `items.map()` to `visibleItems.map()`
6. Test in browser

Done! ✅

---

_Implementation Kit v1.0 | 02/06/2026_
