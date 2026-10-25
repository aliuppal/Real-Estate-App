# Nestly

A real estate marketplace for Lahore: rent, buy or sell property and get matched with verified agents.
Built with Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui (Base UI), Auth.js v5 and Framer Motion.
The visual system follows Cohere's 2026 design language: white editorial canvas, near-black pill CTAs,
deep-green feature bands, soft stone surfaces and 22px media cards.

> **Status: Phase 2 of 4.** The full product runs end to end on mock data: search with a clustered map and
> draw-to-search, listing detail, agent matching, directories, messaging and notifications, every role's
> dashboard, and the listing wizard. Phase 3 connects Neon Postgres.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET (npx auth secret)
npm run dev                  # http://localhost:3000
```

The app runs entirely on in-memory mock data until `DATABASE_URL` is set (Phase 3 adds the Neon implementation).
Mock data resets when the dev server restarts.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Vitest (roles, filters, URL params, formatting, mortgage maths, plain-English parser) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Demo accounts

All demo accounts use the password **`Demo@1234`**. The login page has a one-click "Demo accounts" card;
hide it in production with `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`.

| Role | Email | Lands on |
|---|---|---|
| Seeker | seeker@demo.com | `/dashboard/seeker` |
| Owner / Seller | owner@demo.com | `/dashboard/owner` |
| Agent | agent@demo.com | `/dashboard/agent` |
| Agency Admin | agency@demo.com | `/dashboard/agency` |
| Platform Admin | admin@demo.com | `/dashboard/admin` |

## Architecture

```
app/
  (site)/          public pages: landing, search, listings, agents, agencies, match
  (auth)/          login, signup, agency signup, forgot/reset password + server actions
  dashboard/       role dashboards; [...slug] guards Phase 2 sections
  api/auth/        Auth.js route handler
components/
  ui/              shadcn/ui primitives (Base UI)
  layout/          header, footer, mobile tab bar, logo, theme toggle
  features/        auth, landing, listings
  dashboard/       sidebar, nav config, stat cards
config/            locale (currency, area units, city), site, demo accounts
lib/
  data/            types.ts, repository.ts (interface), mock/ (in-memory + seed), db/ (Phase 3 stub), index.ts
  auth/            roles.ts (edge-safe route rules), session.ts (requireUser / requireRole)
  search/          filter.ts, params.ts (URL ⇄ filters), nl-parser.ts (plain-English search)
  validation/      Zod schemas shared by forms and server actions
auth.ts, auth.config.ts, middleware.ts
tests/             Vitest
```

**Data layer.** Every read and write goes through the `Repository` interface (`lib/data/repository.ts`).
`lib/data/index.ts` returns the Neon implementation when `DATABASE_URL` is set and the mock otherwise.
The seed (`lib/data/mock/seed`) is deterministic: 64 listings across 5 neighbourhoods, 5 agencies,
15 agents, 30 users, plus reviews, saved searches, collections, conversations, viewings, leads, offers,
notifications and reports. Phase 3's DB seed script will load the same data.

**Auth and roles.** Credentials sign-in (bcrypt), with Google OAuth when `AUTH_GOOGLE_ID`/`SECRET` are set.
Sessions are JWTs carrying `id` and `role`, and the role always comes from the repository, never the client.
`middleware.ts` enforces the rules in `lib/auth/roles.ts` at the edge, and every dashboard page and server action
re-checks with `requireRole`. Users who try another role's area are sent to their own dashboard with a notice.

**Plain-English search.** `lib/search/nl-parser.ts` turns text like "3 bed house near a school under 2 crore with
a garden" into `SearchFilters` using keywords and regexes. It sits behind a `NaturalLanguageParser` interface so an
LLM can replace it without touching callers. Listing descriptions use the same pattern (`lib/listing-copy.ts`).

**Server actions.** Every mutation lives in `app/actions/*` and goes through `runAction` + `actionUser`
(`lib/auth/action.ts`): the user comes from the session, input is validated with Zod, and ownership is checked
(`canManageListing`). Side effects such as notifications, CRM leads and saved-search alerts are in `lib/notify.ts`.

**Realtime.** Messages and notifications poll through `useLiveQuery` (`lib/realtime.ts`). Switching to
Pusher or Ably means subscribing there and invalidating queries; components don't change.

**Matching and pricing.** `lib/matching.ts` scores agents on area (25), budget (20), specialty (15), track
record (15), language (10), responsiveness (10) and rating (5), with reasons for each match.
`lib/pricing.ts` suggests a listing price from the median rate of comparable listings nearby.

**Uploads.** `/api/uploads` stores photos through `lib/storage` (local `public/uploads` in development).
Add a Cloudinary or UploadThing driver behind the same interface for production.

**Locale.** Currency (PKR, with USD conversion), area units (sq ft, sq m, marla, kanal) and the map centre live in
`config/locale.ts`. Prices are stored in PKR and areas in square feet.

**Motion.** Animations only touch `transform` and `opacity`: masked line reveals, a parallax image moved with
`translateY`, FLIP tab indicators via Framer `layoutId`, card shadows that fade in on a pre-painted pseudo-element
(`.lift`), a carousel progress bar driven by `scaleX`, and counters that write text from rAF at a fixed width.
Everything respects `prefers-reduced-motion`.

## Environment variables

See `.env.example`. `AUTH_SECRET` is required; everything else is optional in development.

## Roadmap

1. **Foundation** ✅ project setup, design tokens, layout, mock data, auth, role middleware, landing page
2. **Core experience** ✅ search with map and filters, listing detail, agent matching, directories, full dashboards, messaging, listing wizard
3. **Neon database** Drizzle schema, migrations, seed script, `lib/data/db` implementation
4. **Polish** SEO and Open Graph, sitemap, performance and Lighthouse pass

Listings, agents, agencies, reviews and prices in the seed are fictional demo data.
