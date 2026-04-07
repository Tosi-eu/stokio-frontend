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
        "group w-full rounded-2xl border border-border/60 bg-card text-card-foreground shadow-elevated overflow-hidden text-left",
        "relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brand-strip before:opacity-90",
        "cursor-pointer hover:shadow-brand-glow hover:border-primary/20 active:scale-[0.99] transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={`${label}: ${value}. Clique para ver a lista.`}
    >
      <CardContent className="flex flex-col items-center py-8 px-6 pt-7">
        <p className="text-sm text-muted-foreground mb-3 text-center leading-snug max-w-[14rem]">
          {label}
        </p>
        <p className="text-5xl font-bold tracking-tight text-primary tabular-nums group-hover:text-primary/95">
          {value}
        </p>
      </CardContent>
    </button>
  );
});
