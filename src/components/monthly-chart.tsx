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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.55)" }} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.55)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "#1F1F2A", fontSize: 12, color: "#fff" }}
            itemStyle={{ color: "#fff" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            formatter={(v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v)}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "rgba(255,255,255,0.7)" }}
            iconType="circle"
          />
          <Bar dataKey="entradas" name="Entradas" fill="#34D399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="saidas"   name="Saídas"   fill="#FB7185" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
