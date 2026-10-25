"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint, Purpose } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { shortPrice } from "@/lib/search/describe";
import { cn } from "@/lib/utils";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

interface PriceHistoryProps {
  history: PricePoint[];
  purpose: Purpose;
  /** This listing's and the neighbourhood's price per sq ft. */
  perSqft: { own: number; reference: number; neighbourhood: string };
}

/**
 * Single series, so no legend: the heading names it. Step line (prices change in steps), 2px stroke,
 * recessive grid, crosshair tooltip, and a table view so the numbers never depend on the chart alone.
 */
export function PriceHistory({ history, purpose, perSqft }: PriceHistoryProps) {
  const [asTable, setAsTable] = useState(false);
  const data = [...history, { date: new Date().toISOString(), price: history.at(-1)!.price }].map((p) => ({ ...p, label: dateLabel(p.date) }));
  const first = history[0].price;
  const last = history.at(-1)!.price;
  const change = last - first;
  const ratio = perSqft.reference ? perSqft.own / perSqft.reference : 1;
  const diffPct = Math.round((ratio - 1) * 100);
  const unit = purpose === "rent" ? " / sq ft / mo" : " / sq ft";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {history.length === 1 ? (
              <>No price changes since it was listed on {dateLabel(history[0].date)}.</>
            ) : (
              <>
                {change < 0 ? "Reduced" : "Raised"} by <span className="text-foreground">{formatPrice(Math.abs(change), { compact: true })}</span>{" "}
                ({Math.round((Math.abs(change) / first) * 100)}%) since it was listed.
              </>
            )}
          </p>
          {history.length > 1 && (
            <button type="button" onClick={() => setAsTable((t) => !t)} className="shrink-0 text-sm underline underline-offset-4">
              {asTable ? "Show chart" : "Show table"}
            </button>
          )}
        </div>

        {history.length === 1 ? null : asTable ? (
          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">Asking price history</caption>
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-normal">Date</th><th className="py-2 text-right font-normal">Asking price</th></tr></thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.date} className="border-b border-border"><td className="py-2">{new Date(p.date).toLocaleDateString("en-PK", { dateStyle: "medium" })}</td><td className="tabular py-2 text-right">{formatPrice(p.price, { purpose })}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-4 h-56" role="img" aria-label={`Asking price over time, from ${formatPrice(first, { compact: true })} to ${formatPrice(last, { compact: true })}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10}tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} minTickGap={24} />
                <YAxis width={52} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickCount={4} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v: number) => shortPrice(v)} />
                <Tooltip
                  cursor={{ stroke: "var(--meta)", strokeDasharray: "3 3" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(v) => [formatPrice(Number(v), { purpose }), "Asking price"]}
                />
                <Line type="stepAfter" dataKey="price" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                  activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two numbers, so a stat comparison rather than a chart. */}
      <div className="rounded-xl bg-muted p-5">
        <p className="mono-label text-[0.6875rem] text-meta">Price per sq ft</p>
        <p className="tabular mt-3 font-display text-4xl tracking-[-0.03em]">{formatPrice(perSqft.own)}</p>
        <p className="text-sm text-muted-foreground">{unit.trim()}</p>
        <p className={cn("mt-4 text-sm")}>
          {Math.abs(diffPct) < 3 ? "In line with" : diffPct < 0 ? `${Math.abs(diffPct)}% below` : `${diffPct}% above`} the typical rate in {perSqft.neighbourhood}
          {" "}(<span className="tabular">{formatPrice(perSqft.reference)}</span>).
        </p>
        <div className="mt-4 space-y-2" aria-hidden>
          {[{ label: "This home", v: perSqft.own }, { label: "Area typical", v: perSqft.reference }].map((b) => (
            <div key={b.label} className="flex items-center gap-3 text-xs">
              <span className="w-20 text-muted-foreground">{b.label}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-hairline">
                <span className="absolute inset-0 origin-left rounded-full bg-[var(--chart-1)]" style={{ transform: `scaleX(${Math.min(1, b.v / Math.max(perSqft.own, perSqft.reference))})` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
