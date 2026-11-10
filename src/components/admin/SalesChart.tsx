"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SalesChart({ data }: { data: { day: string; sales: number; orders: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6dccb" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <Tooltip
            cursor={{ fill: "#f6efe3" }}
            formatter={(value, name) => (name === "sales" ? [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"] : [value, "Orders"])}
            contentStyle={{ borderRadius: 12, border: "1px solid #e6dccb", fontSize: 13 }}
          />
          <Bar dataKey="sales" fill="#b08d57" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
