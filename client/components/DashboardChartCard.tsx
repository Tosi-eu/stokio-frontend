import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DashboardChartCardProps {
  title: string;
  data: Array<{ label: string; total: number }>;
  gradientId: string;
  gradientColors: { start: string; end: string };
}

export const DashboardChartCard = memo(function DashboardChartCard({
  title,
  data,
  gradientId,
  gradientColors,
}: DashboardChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 flex justify-center">
          <ResponsiveContainer width="95%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 40, left: 40, bottom: 10 }}
            >
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="label"
                width={80}
                interval={0}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>
              <Bar
                dataKey="total"
                fill={`url(#${gradientId})`}
                radius={[0, 6, 6, 0]}
                barSize={28}
                label={{
                  position: "right",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
