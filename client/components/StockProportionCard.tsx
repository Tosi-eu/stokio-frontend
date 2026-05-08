import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StockDistributionItem } from "@/interfaces/interfaces";
import { useState, useRef } from "react";

interface StockProportionCardProps {
  title: string;
  data: StockDistributionItem[];
  colors: string[];
  className?: string;
}

export default function StockProportionCard({
  title,
  data,
  colors,
  className,
}: StockProportionCardProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActivePieIndex(index);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActivePieIndex(null);
      timeoutRef.current = null;
    }, 120);
  };

  const renderActiveShape = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    fill?: string;
  }) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      startAngle = 0,
      endAngle = 0,
      fill = "#000",
    } = props;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    const offset = 8;
    const x = cx + offset * cos;
    const y = cy + offset * sin;

    return (
      <g>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor="#000"
              floodOpacity="0.42"
            />
          </filter>
        </defs>

        <Sector
          cx={x}
          cy={y}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter="url(#shadow)"
          style={{
            animation: "cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </g>
    );
  };

  return (
    <Card className={className ?? "h-[360px] w-full"}>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex">
        <div className="flex flex-1 flex-col lg:flex-row items-center justify-center gap-6">
          <div className="w-full lg:w-1/2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  outerRadius={80}
                  activeIndex={activePieIndex ?? undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, i) => handleMouseEnter(i)}
                  onMouseLeave={handleMouseLeave}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={colors[i % colors.length]}
                      opacity={
                        activePieIndex === null || activePieIndex === i
                          ? 1
                          : 0.45
                      }
                      style={{
                        transition: "opacity 200ms ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(
                    _v: unknown,
                    _n: string,
                    p: { payload?: { rawValue?: number } },
                  ) => [p.payload?.rawValue ?? 0, "Quantidade"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-sm text-slate-700 max-h-56 overflow-auto pr-1">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span>
                  {item.name}: <b>{item.value}%</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
