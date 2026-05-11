import { memo, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function sortKeyNumericLabel(label: string): number {
  const n = Number(String(label).trim());
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

interface DashboardChartCardProps {
  title: string;
  data: Array<{ label: string; total: number; fullLabel?: string }>;
  gradientId: string;
  gradientColors: { start: string; end: string };
  maxItems?: number;
  sortByNumericLabel?: boolean;
}

export const DashboardChartCard = memo(function DashboardChartCard({
  title,
  data,
  gradientId,
  gradientColors,
  maxItems = 10,
  sortByNumericLabel = false,
}: DashboardChartCardProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const rows = (data ?? []).slice();
    if (sortByNumericLabel) {
      return rows.sort(
        (a, b) => sortKeyNumericLabel(a.label) - sortKeyNumericLabel(b.label),
      );
    }
    return rows.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  }, [data, sortByNumericLabel]);

  const top = useMemo(
    () => sorted.slice(0, Math.max(1, maxItems)),
    [sorted, maxItems],
  );

  const filteredAll = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = search.trim()
      ? sorted.filter((d) => {
          const full = (d.fullLabel ?? d.label ?? "").toLowerCase();
          const label = String(d.label ?? "").toLowerCase();
          return full.includes(q) || label.includes(q);
        })
      : sorted;
    if (!sortByNumericLabel) return base;
    return base
      .slice()
      .sort(
        (a, b) => sortKeyNumericLabel(a.label) - sortKeyNumericLabel(b.label),
      );
  }, [sorted, search, sortByNumericLabel]);

  const legendRows = useMemo(() => {
    return (sorted ?? [])
      .map((d) => ({
        key: d.label,
        label: d.label,
        full: (d.fullLabel ?? d.label).trim(),
      }))
      .filter((x) => x.label.trim() !== "" && x.full.trim() !== "");
  }, [sorted]);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className="cursor-pointer transition hover:shadow-md"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
      >
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
          <p className="text-xs text-muted-foreground text-center">
            {sortByNumericLabel
              ? `Ordenado por número (até ${Math.max(1, maxItems)}). Clique para ver todos.`
              : `Mostrando Top ${Math.max(1, maxItems)}. Clique para ver todos.`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
            <div className="w-full h-80 flex justify-center">
              <ResponsiveContainer width="95%" height="100%">
                <BarChart
                  data={top}
                  margin={{ top: 16, right: 12, left: 8, bottom: 16 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    angle={0}
                    textAnchor="middle"
                  />
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
              <p className="text-xs font-medium text-foreground mb-2">
                Legenda
              </p>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar (número/categoria)..."
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
              <div className="rounded-md border p-3 overflow-x-auto">
                <div
                  className="h-96"
                  style={{
                    width: Math.max(900, filteredAll.length * 70),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredAll}
                      margin={{ top: 16, right: 12, left: 8, bottom: 24 }}
                    >
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval={
                          filteredAll.length > 24 ? "preserveStartEnd" : 0
                        }
                        angle={0}
                        textAnchor="middle"
                        height={36}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip
                        formatter={(v: unknown) => [
                          Number(v ?? 0),
                          "Quantidade",
                        ]}
                        labelFormatter={(
                          _l: unknown,
                          payload?: Array<{
                            payload?: { fullLabel?: string; label?: string };
                          }>,
                        ) => {
                          const p = payload?.[0]?.payload;
                          return p?.fullLabel ?? p?.label ?? "";
                        }}
                      />
                      <defs>
                        <linearGradient
                          id={`${gradientId}Modal`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={gradientColors.start} />
                          <stop offset="100%" stopColor={gradientColors.end} />
                        </linearGradient>
                      </defs>
                      <Bar
                        dataKey="total"
                        fill={`url(#${gradientId}Modal)`}
                        radius={[6, 6, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-md border bg-muted/10 p-3">
                <p className="text-xs font-medium text-foreground mb-2">
                  Legenda
                </p>
                <div className="max-h-96 overflow-auto space-y-1 text-xs text-muted-foreground">
                  {legendRows.length === 0 ? (
                    <p>—</p>
                  ) : (
                    legendRows.map((r) => (
                      <div key={r.key} className="flex gap-2">
                        <span className="font-mono tabular-nums text-foreground w-10 shrink-0">
                          {r.label}
                        </span>
                        <span className="min-w-0 truncate">{r.full}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
