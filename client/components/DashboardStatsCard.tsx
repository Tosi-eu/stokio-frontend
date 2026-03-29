import { memo } from "react";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStatsCardProps {
  label: string;
  value: number | string;
  onClick: () => void;
}

export const DashboardStatsCard = memo(function DashboardStatsCard({
  label,
  value,
  onClick,
}: DashboardStatsCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border bg-card text-card-foreground shadow-sm",
        "cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`${label}: ${value}. Clique para ver a lista.`}
    >
      <CardContent className="flex flex-col items-center py-8 p-6 pt-0">
        <p className="text-sm text-muted-foreground mb-2 text-center">
          {label}
        </p>
        <p className="text-5xl font-bold text-primary">{value}</p>
      </CardContent>
    </button>
  );
});
