/**
 * Reusable Virtual Scrolling Hook
 *
 * 📌 Usage:
 *
 * const { visibleItems, containerRef, onScrollHandler, visibleRange, shouldVirtualize } = useVirtualScroll({
 *   items: filteredData,
 *   itemHeight: 80,
 *   containerHeight: 520,
 *   visibleCount: 7
 * });
 *
 * return (
 *   <div
 *     ref={containerRef}
 *     onScroll={onScrollHandler}
 *     style={{ height: containerHeight, overflowY: 'auto' }}
 *   >
 *     <table>
 *       <tbody>
 *         {shouldVirtualize && visibleRange.start > 0 && (
 *           <tr style={{ height: visibleRange.start * itemHeight }}><td /></tr>
 *         )}
 *         {(shouldVirtualize ? visibleItems : filteredData).map(item => (
 *           <tr style={{ height: itemHeight }}>{...}</tr>
 *         ))}
 *         {shouldVirtualize && visibleRange.end < filteredData.length && (
 *           <tr style={{ height: (filteredData.length - visibleRange.end) * itemHeight }}><td /></tr>
 *         )}
 *       </tbody>
 *     </table>
 *   </div>
 * );
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  visibleCount?: number;
  threshold?: number; // extra rows to render beyond visible viewport
}

interface UseVirtualScrollReturn<T> {
  visibleItems: T[];
  containerRef: React.RefObject<HTMLDivElement>;
  /** @deprecated use containerRef + onScrollHandler instead */
  tableRef: React.RefObject<HTMLDivElement>;
  onScrollHandler: (e: React.UIEvent<HTMLDivElement>) => void;
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

  // Auto-reset scroll position when filtered list changes (search/filter applied)
  const prevItemsLengthRef = useRef(items.length);
  useEffect(() => {
    if (items.length !== prevItemsLengthRef.current) {
      prevItemsLengthRef.current = items.length;
      setScrollTop(0);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [items.length]);

  // Only activate virtual scroll when list is large enough to benefit
  const shouldVirtualize = useMemo(
    () => items.length > visibleCount * 2,
    [items.length, visibleCount]
  );

  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length };
    }
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - threshold);
    const endIdx = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + threshold
    );
    return { start: startIdx, end: endIdx };
  }, [scrollTop, itemHeight, containerHeight, shouldVirtualize, items.length, threshold]);

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  );

  // Correct React pattern: use onScroll prop instead of directly touching DOM
  const onScrollHandler = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    containerRef,
    tableRef,
    onScrollHandler,
    visibleRange,
    itemHeight,
    shouldVirtualize,
  };
};

export default useVirtualScroll;
