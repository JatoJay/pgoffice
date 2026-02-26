"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#059669", "#14b8a6", "#22c55e", "#0d9488", "#34d399"];

type DataPoint = {
  name: string;
  value: number;
  [key: string]: string | number;
};

type ChartProps = {
  data: DataPoint[];
  dataKey?: string;
  height?: number;
};

const chartStyle = {
  fontSize: "0.75rem",
  fontFamily: "Inter, sans-serif",
};

export function KpiLineChart({ data, dataKey = "value", height = 200 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} style={chartStyle}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <YAxis stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#34d399" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function KpiAreaChart({ data, dataKey = "value", height = 200 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} style={chartStyle}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <YAxis stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KpiBarChart({ data, dataKey = "value", height = 200 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} style={chartStyle}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <YAxis stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
        <Bar dataKey={dataKey} fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function KpiPieChart({ data, height = 200 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart style={chartStyle}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: "#8b9e8b" }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

type MultiLineChartProps = {
  data: DataPoint[];
  lines: { key: string; color: string; name: string }[];
  height?: number;
};

export function MultiLineChart({ data, lines, height = 200 }: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} style={chartStyle}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <YAxis stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
        <Legend wrapperStyle={{ color: "#8b9e8b" }} />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            name={line.name}
            dot={{ fill: line.color, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

type StackedBarChartProps = {
  data: DataPoint[];
  bars: { key: string; color: string; name: string }[];
  height?: number;
};

export function StackedBarChart({ data, bars, height = 200 }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} style={chartStyle}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="name" stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <YAxis stroke="#8b9e8b" tick={{ fill: "#8b9e8b" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 25, 15, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#f0f5f0",
          }}
        />
        <Legend wrapperStyle={{ color: "#8b9e8b" }} />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.name}
            stackId="stack"
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
