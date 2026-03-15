import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  itemHeight?: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  itemHeight = 200,
  gap = 24,
  overscan = 5,
  className = "",
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(items.length / columns);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual API
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%", maxHeight: "800px" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const endIndex = Math.min(startIndex + columns, items.length);
          const rowItems = items.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                padding: `${gap / 2}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
