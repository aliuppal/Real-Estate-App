/** Standard amortising loan payment. Rate is annual, in percent. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

export interface MortgageEstimate {
  loan: number;
  monthly: number;
  totalInterest: number;
  /** Monthly income needed if repayments stay under `maxDebtShare` of income. */
  incomeNeeded: number;
}

export function estimateMortgage(price: number, downPct: number, annualRatePct: number, years: number, maxDebtShare = 0.4): MortgageEstimate {
  const loan = Math.max(0, price * (1 - downPct / 100));
  const monthly = monthlyPayment(loan, annualRatePct, years);
  return {
    loan,
    monthly,
    totalInterest: Math.max(0, monthly * years * 12 - loan),
    incomeNeeded: monthly / maxDebtShare,
  };
}

/** Indicative defaults for the teaser. Not financial advice; real rates vary by bank. */
export const MORTGAGE_DEFAULTS = { downPct: 30, ratePct: 13, years: 20 } as const;
