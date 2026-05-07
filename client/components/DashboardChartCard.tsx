import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DashboardChartCardProps {
  title: string;
  data: Array<{ label: string; total: number; fullLabel?: string }>;
  gradientId: string;
  gradientColors: { start: string; end: string };
}

export const DashboardChartCard = memo(function DashboardChartCard({
  title,
  data,
  gradientId,
  gradientColors,
}: DashboardChartCardProps) {
  const legendRows = useMemo(() => {
    return (data ?? [])
      .map((d) => ({
        key: d.label,
        label: d.label,
        full: (d.fullLabel ?? d.label).trim(),
      }))
      .filter((x) => x.label.trim() !== "" && x.full.trim() !== "");
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
          <div className="w-full h-80 flex justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 16, right: 12, left: 8, bottom: 16 }}
              >
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(v: unknown) => [Number(v ?? 0), "Quantidade"]}
                  labelFormatter={(
                    _l: unknown,
                    payload?: Array<{ payload?: { fullLabel?: string } }>,
                  ) => {
                    const p = payload?.[0]?.payload;
                    return p?.fullLabel ?? "";
                  }}
                />
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="total"
                  fill={`url(#${gradientId})`}
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  label={{ position: "top", fontSize: 12, fontWeight: 600 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border bg-muted/10 p-3">
            <p className="text-xs font-medium text-foreground mb-2">Legenda</p>
            <div className="max-h-72 overflow-auto space-y-1 text-xs text-muted-foreground">
              {legendRows.length === 0 ? (
                <p>—</p>
              ) : (
                legendRows.map((r) => (
                  <div key={r.key} className="flex gap-2">
                    <span className="font-mono tabular-nums text-foreground w-8 shrink-0">
                      {r.label}
                    </span>
                    <span className="min-w-0 truncate">{r.full}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
