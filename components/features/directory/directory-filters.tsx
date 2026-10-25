"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface FilterField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Select filters that write straight to the URL, so directory views are shareable and server-rendered. */
export function DirectoryFilters({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {fields.map((f) => (
        <label key={f.name} className="text-sm">
          <span className="sr-only">{f.label}</span>
          <select value={params.get(f.name) ?? ""} onChange={(e) => set(f.name, e.target.value)}
            className="h-10 rounded-full border border-hairline bg-background px-4 text-sm">
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.value ? o.label : f.label}</option>)}
          </select>
        </label>
      ))}
      {fields.some((f) => params.get(f.name)) && (
        <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="text-sm underline underline-offset-4">Clear</button>
      )}
    </div>
  );
}
