"use client";

import { useId, useMemo, useState } from "react";
import type { CurrencyCode } from "@/config/locale";
import { formatPrice } from "@/lib/format";
import { estimateMortgage, MORTGAGE_DEFAULTS } from "@/lib/mortgage";
import { cn } from "@/lib/utils";

const range = "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-hairline accent-[var(--brand)] dark:accent-[#4cc3a4]";

export function MortgageTeaser() {
  const ids = useId();
  const [price, setPrice] = useState(3e7);
  const [downPct, setDownPct] = useState<number>(MORTGAGE_DEFAULTS.downPct);
  const [years, setYears] = useState<number>(MORTGAGE_DEFAULTS.years);
  const [rate, setRate] = useState<number>(MORTGAGE_DEFAULTS.ratePct);
  const [currency, setCurrency] = useState<CurrencyCode>("PKR");

  const est = useMemo(() => estimateMortgage(price, downPct, rate, years), [price, downPct, rate, years]);
  const money = (n: number) => formatPrice(n, { compact: true, currency });

  return (
    <div className="grid gap-10 rounded-media bg-secondary p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14">
      <div className="flex flex-col">
        <p className="mono-label text-meta">Affordability</p>
        <h2 className="mt-4 text-[2.25rem] leading-[1.1] sm:text-5xl sm:leading-[1.1]">What would it cost each month?</h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
          Move the sliders for a quick estimate. Every listing has a full mortgage or move-in cost calculator.
        </p>
        <div className="mt-auto pt-10">
          <p className="text-sm text-muted-foreground">Estimated monthly repayment</p>
          <p className="tabular font-display text-5xl tracking-[-0.03em] sm:text-6xl" aria-live="polite">
            {formatPrice(est.monthly, { currency })}
          </p>
          <div className="mt-4 inline-flex rounded-full border border-hairline p-0.5 text-xs" role="group" aria-label="Currency">
            {(["PKR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                onClick={() => setCurrency(c)}
                className={cn("rounded-full px-3 py-1 transition-colors", currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-7 rounded-xl bg-card p-6 sm:p-8">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${ids}-price`} className="text-sm">Home price</label>
            <span className="tabular text-sm">{money(price)}</span>
          </div>
          <input id={`${ids}-price`} type="range" min={5e6} max={2.5e8} step={5e5} value={price} onChange={(e) => setPrice(Number(e.target.value))} className={cn(range, "mt-3")} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${ids}-down`} className="text-sm">Down payment</label>
            <span className="tabular text-sm">{downPct}% · {money(price * (downPct / 100))}</span>
          </div>
          <input id={`${ids}-down`} type="range" min={10} max={70} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className={cn(range, "mt-3")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${ids}-years`} className="text-sm">Tenure</label>
            <select id={`${ids}-years`} value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
              {[5, 10, 15, 20, 25].map((y) => <option key={y} value={y}>{y} years</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-rate`} className="text-sm">Interest rate</label>
            <div className="relative mt-2">
              <input id={`${ids}-rate`} type="number" inputMode="decimal" min={0} max={40} step={0.25} value={rate}
                onChange={(e) => setRate(Math.min(40, Math.max(0, Number(e.target.value) || 0)))}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-sm tabular" />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 border-t border-hairline pt-6 text-sm">
          <div><dt className="text-muted-foreground">Loan</dt><dd className="tabular mt-1">{money(est.loan)}</dd></div>
          <div><dt className="text-muted-foreground">Total interest</dt><dd className="tabular mt-1">{money(est.totalInterest)}</dd></div>
          <div><dt className="text-muted-foreground">Income needed</dt><dd className="tabular mt-1">{money(est.incomeNeeded)}/mo</dd></div>
        </dl>
        <p className="text-xs text-meta">Indicative only. Assumes repayments stay under 40% of income; bank rates and terms vary.</p>
      </div>
    </div>
  );
}
