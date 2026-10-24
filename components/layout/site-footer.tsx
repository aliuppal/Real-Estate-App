import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { locale } from "@/config/locale";
import { Logo } from "./logo";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Homes for sale", href: "/search?purpose=sale" },
      { label: "Homes to rent", href: "/search?purpose=rent" },
      { label: "New this week", href: "/search?listedWithinDays=7" },
      { label: "Plots", href: "/search?purpose=sale&types=plot" },
    ],
  },
  {
    title: "Sell & let",
    links: [
      { label: "List a property", href: "/dashboard/listings/new" },
      { label: "Find my agent", href: "/match" },
      { label: "Browse agents", href: "/agents" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { label: "Agencies", href: "/agencies" },
      { label: "Register your agency", href: "/signup/agency" },
      { label: "Join as an agent", href: "/signup?role=agent" },
    ],
  },
];

/** Cohere-style dark footer: muted link columns, one alerts sign-up line, quiet legal microcopy. */
export function SiteFooter() {
  return (
    <footer className="bg-footer text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)] lg:px-8">
        <div className="max-w-sm space-y-6">
          <Logo />
          <p className="mono-label text-cta">New homes move fast</p>
          <p className="text-2xl leading-tight tracking-[-0.01em]">Get matching listings the day they go live.</p>
          <Link href="/signup" className="group flex items-center justify-between border-b border-white/25 pb-2 text-sm text-white/70 hover:text-white">
            Create a free account for alerts
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 text-sm text-white">{col.title}</h2>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#93939f] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-[#93939f] sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {site.name} · {locale.city}, {locale.country}. Listings, agents and prices shown are demo data.</p>
          <p>
            <a href={`mailto:${site.support.email}`} className="hover:text-white">{site.support.email}</a>
            <span className="mx-2">·</span>
            <a href={`tel:${site.support.phone.replace(/\s/g, "")}`} className="hover:text-white">{site.support.phone}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
