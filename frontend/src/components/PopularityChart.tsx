"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PopularitySnapshot } from "@/lib/api";

interface Props {
  data: PopularitySnapshot[];
  color?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PopularityChart({
  data,
  color = "#1DB954",
}: Props) {
  const chartData = data.map((s) => ({
    date: formatDate(s.snappedAt),
    popularity: s.popularity,
    followers: s.followers,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            stroke="#535353"
            tick={{ fill: "#B3B3B3", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#535353"
            tick={{ fill: "#B3B3B3", fontSize: 11 }}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E1E1E",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelStyle={{ color: "#B3B3B3", marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="popularity"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace("#", "")})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
