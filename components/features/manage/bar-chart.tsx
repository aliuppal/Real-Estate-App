"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BarDatum {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  title: string;
  data: BarDatum[];
  /** Series colour slot from the validated palette (fixed order). */
  slot?: 1 | 2 | 3;
  format?: (v: number) => string;
  valueLabel: string;
}

/**
 * One measure per chart (several measures become small multiples, never a dual axis).
 * Horizontal bars so long labels stay readable; 4px rounded data ends; tooltip and a table view.
 */
export function SimpleBarChart({ title, data, slot = 1, format = (v) => v.toLocaleString("en-PK"), valueLabel }: SimpleBarChartProps) {
  const [asTable, setAsTable] = useState(false);
  const height = Math.max(160, data.length * 34 + 40);
  const color = `var(--chart-${slot})`;

  return (
    <figure className="rounded-xl border border-border bg-card p-5">
      <figcaption className="mb-3 flex items-baseline justify-between gap-4">
        <span className="text-lg">{title}</span>
        <button type="button" onClick={() => setAsTable((t) => !t)} className="text-sm underline underline-offset-4">{asTable ? "Chart" : "Table"}</button>
      </figcaption>
      {asTable ? (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-normal">Item</th><th className="py-2 text-right font-normal">{valueLabel}</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label} className="border-b border-border last:border-0"><td className="py-2">{d.label}</td><td className="tabular py-2 text-right">{format(d.value)}</td></tr>)}</tbody>
        </table>
      ) : (
        <div style={{ height }} role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v: number) => format(v)} />
              <YAxis type="category" dataKey="label" width={150} tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [format(Number(v)), valueLabel]} />
              <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
