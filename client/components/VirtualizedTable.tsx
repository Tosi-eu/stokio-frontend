import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface VirtualizedTableProps {
  data: unknown[];
  renderRow: (item: unknown, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedTable({
  data,
  renderRow,
  estimateSize = 50,
  overscan = 5,
  className = "",
}: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual API
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%", maxHeight: "600px" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderRow(data[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
