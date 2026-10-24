"use client";

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/config/demo-accounts";

/** One-click fill for the seeded demo logins. */
export function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <section aria-labelledby="demo-accounts" className="rounded-xl bg-secondary p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="demo-accounts" className="mono-label text-foreground">Demo accounts</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Password <code className="rounded bg-background px-1.5 py-0.5 font-mono">{DEMO_PASSWORD}</code>
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email}>
            <button
              type="button"
              onClick={() => onPick(a.email, DEMO_PASSWORD)}
              className="w-full rounded-lg border border-transparent bg-background px-3 py-2 text-left transition-colors hover:border-hairline focus-visible:border-ring"
            >
              <span className="block text-sm">{a.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.email} · {a.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
