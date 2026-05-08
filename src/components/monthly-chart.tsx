"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

export type MonthBar = { month: string; entradas: number; saidas: number };

export function MonthlyBarChart({ data }: { data: MonthBar[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#4A4A5C" }} axisLine={{ stroke: "#D5D8DC" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#4A4A5C" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #D5D8DC", fontSize: 12 }}
            formatter={(v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v)}
            labelStyle={{ color: "#1A1A2E", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          <Bar dataKey="entradas" name="Entradas" fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar dataKey="saidas"   name="Saídas"   fill="#C62828" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
