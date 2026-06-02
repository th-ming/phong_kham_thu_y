/**
 * Reusable Virtual Scrolling Hook
 * 
 * 📌 Usage:
 * 
 * const { visibleItems, containerRef, tableRef, visibleRange, itemHeight } = useVirtualScroll({
 *   items: filteredData,
 *   itemHeight: 60,
 *   containerHeight: 400,
 *   visibleCount: 7
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div ref={tableRef} style={{ position: 'relative', height: filteredData.length * itemHeight }}>
 *       <div style={{ transform: `translateY(${visibleRange.start * itemHeight}px)` }}>
 *         {visibleItems.map((item, idx) => (
 *           <div key={idx} style={{ height: itemHeight }}>
 *             {render item}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 */

import { useState, useRef, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  visibleCount?: number;
  threshold?: number; // Render threshold for items before/after visible area
}

interface UseVirtualScrollReturn<T> {
  visibleItems: T[];
  containerRef: React.RefObject<HTMLDivElement>;
  tableRef: React.RefObject<HTMLDivElement>;
  visibleRange: { start: number; end: number };
  itemHeight: number;
  shouldVirtualize: boolean;
}

export const useVirtualScroll = <T>({
  items,
  itemHeight,
  containerHeight = 400,
  visibleCount = 8,
  threshold = 5,
}: UseVirtualScrollOptions<T>): UseVirtualScrollReturn<T> => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const shouldVirtualize = useMemo(() => items.length > visibleCount * 2, [items.length, visibleCount]);

  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length };
    }

    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - threshold);
    const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + threshold);

    return { start: startIdx, end: endIdx };
  }, [scrollTop, itemHeight, containerHeight, shouldVirtualize, items.length, threshold]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Attach scroll listener
  if (containerRef.current && !containerRef.current.onscroll) {
    containerRef.current.onscroll = handleScroll as any;
  }

  return {
    visibleItems,
    containerRef,
    tableRef,
    visibleRange,
    itemHeight,
    shouldVirtualize,
  };
};

export default useVirtualScroll;
