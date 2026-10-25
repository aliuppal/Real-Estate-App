"use client";

import { useId, useMemo, useState } from "react";
import type { Purpose } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { estimateMortgage, MORTGAGE_DEFAULTS, monthlyPayment } from "@/lib/mortgage";

const field = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm tabular";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "tabular text-base font-medium" : "tabular"}>{value}</dd>
    </div>
  );
}

export function MortgageCalculator({ price }: { price: number }) {
  const ids = useId();
  const [downPct, setDownPct] = useState<number>(MORTGAGE_DEFAULTS.downPct);
  const [rate, setRate] = useState<number>(MORTGAGE_DEFAULTS.ratePct);
  const [years, setYears] = useState<number>(MORTGAGE_DEFAULTS.years);
  const est = useMemo(() => estimateMortgage(price, downPct, rate, years), [price, downPct, rate, years]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label htmlFor={`${ids}-d`} className="flex justify-between text-sm"><span>Down payment</span><span className="tabular">{downPct}%</span></label>
          <input id={`${ids}-d`} type="range" min={10} max={80} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-hairline accent-[var(--chart-1)]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Interest rate (%)
            <input type="number" step={0.25} min={0} max={40} value={rate} onChange={(e) => setRate(Math.min(40, Math.max(0, Number(e.target.value) || 0)))} className={`${field} mt-1.5`} />
          </label>
          <label className="text-sm">Tenure
            <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={`${field} mt-1.5`}>
              {[5, 10, 15, 20, 25].map((y) => <option key={y} value={y}>{y} years</option>)}
            </select>
          </label>
        </div>
      </div>
      <dl aria-live="polite">
        <Row label="Monthly repayment" value={formatPrice(est.monthly)} strong />
        <Row label="Down payment" value={formatPrice(price * (downPct / 100), { compact: true })} />
        <Row label="Loan" value={formatPrice(est.loan, { compact: true })} />
        <Row label="Total interest" value={formatPrice(est.totalInterest, { compact: true })} />
        <Row label="Income needed" value={`${formatPrice(est.incomeNeeded, { compact: true })}/mo`} />
      </dl>
    </div>
  );
}

export function MoveInCalculator({ rent, depositMonths, advanceMonths, agentListed }: { rent: number; depositMonths: number; advanceMonths: number; agentListed: boolean }) {
  const [deposit, setDeposit] = useState(depositMonths);
  const [advance, setAdvance] = useState(advanceMonths);
  // Agency commission in Lahore is commonly half to one month's rent; we assume one month.
  const fee = agentListed ? rent : 0;
  const total = rent * (deposit + advance) + fee;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="grid grid-cols-2 gap-3 self-start">
        <label className="text-sm">Security deposit
          <select value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className={`${field} mt-1.5`}>
            {[0, 1, 2, 3, 4, 6].map((m) => <option key={m} value={m}>{m} month{m === 1 ? "" : "s"}</option>)}
          </select>
        </label>
        <label className="text-sm">Advance rent
          <select value={advance} onChange={(e) => setAdvance(Number(e.target.value))} className={`${field} mt-1.5`}>
            {[0, 1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month{m === 1 ? "" : "s"}</option>)}
          </select>
        </label>
      </div>
      <dl aria-live="polite">
        <Row label="Due before move-in" value={formatPrice(total)} strong />
        <Row label={`Deposit (${deposit} × rent)`} value={formatPrice(rent * deposit)} />
        <Row label={`Advance (${advance} × rent)`} value={formatPrice(rent * advance)} />
        <Row label="Agent commission" value={agentListed ? formatPrice(fee) : "None, listed by owner"} />
      </dl>
    </div>
  );
}

/** Indicative comparison over ten years. Assumes 7% yearly rent increases; ignores appreciation and upkeep. */
export function RentVsBuy({ purpose, price, estimatedRent, estimatedPrice }: { purpose: Purpose; price: number; estimatedRent: number; estimatedPrice: number }) {
  const salePrice = purpose === "sale" ? price : estimatedPrice;
  const rent = purpose === "rent" ? price : estimatedRent;
  const down = salePrice * (MORTGAGE_DEFAULTS.downPct / 100);
  const buyMonthly = monthlyPayment(salePrice - down, MORTGAGE_DEFAULTS.ratePct, MORTGAGE_DEFAULTS.years);
  const tenYearRent = Array.from({ length: 10 }, (_, y) => rent * 12 * 1.07 ** y).reduce((a, b) => a + b, 0);
  const tenYearBuy = down + buyMonthly * 120;
  const cheaper = tenYearRent < tenYearBuy ? "renting" : "buying";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: purpose === "rent" ? "Renting this home" : "Renting a similar home", monthly: rent, ten: tenYearRent },
          { label: purpose === "sale" ? "Buying this home" : "Buying a similar home", monthly: buyMonthly, ten: tenYearBuy },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="tabular mt-2 text-2xl">{formatPrice(c.monthly, { compact: true })}<span className="text-sm text-muted-foreground">/mo</span></p>
            <p className="tabular mt-1 text-xs text-muted-foreground">{formatPrice(c.ten, { compact: true })} over 10 years</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">Over ten years, <span className="font-medium">{cheaper}</span> costs less on these assumptions.</p>
      <p className="mt-1 text-xs text-meta">Indicative: {MORTGAGE_DEFAULTS.downPct}% down at {MORTGAGE_DEFAULTS.ratePct}%, rent rising 7% a year, before property value changes and upkeep.</p>
    </div>
  );
}
