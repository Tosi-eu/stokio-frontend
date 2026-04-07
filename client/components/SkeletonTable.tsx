import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-elevated overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
      <div className="overflow-hidden">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-muted border-b">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-xs font-semibold">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold sticky right-0 bg-muted/95 backdrop-blur-sm z-10 min-w-[120px] border-l border-border/40">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
