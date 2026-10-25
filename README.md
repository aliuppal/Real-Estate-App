# Nestly

A real estate marketplace for Lahore: rent, buy or sell property and get matched with verified agents.
Built with Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui (Base UI), Auth.js v5 and Framer Motion.
The visual system follows Cohere's 2026 design language: white editorial canvas, near-black pill CTAs,
deep-green feature bands, soft stone surfaces and 22px media cards.

**Live:** https://nestly-flame-three.vercel.app (Vercel + Neon Postgres). Sign in with any [demo account](#demo-accounts).

> **Status: all four phases complete.** Search with a clustered map and draw-to-search, listing detail, agent
> matching, directories, messaging, notifications, every role's dashboard and the listing wizard, on Neon Postgres
> (Drizzle) or, without `DATABASE_URL`, on mock data. Phase 4 added empty and error states, per-listing SEO and
> Open Graph images, a sitemap and a performance and Lighthouse pass.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET (npx auth secret)
npm run dev                  # http://localhost:3000
```

Without `DATABASE_URL` the app runs on in-memory mock data (resets on restart). To use Neon Postgres:

```bash
# put your Neon connection string in .env.local as DATABASE_URL, then:
npm run db:migrate   # create the tables (drizzle/*.sql)
npm run db:seed      # load the demo data, including hashed demo passwords (empties the tables first)
npm run dev
```

| Script | What it does |
|---|---|
| `npm run db:generate` | Generate a migration after editing `lib/data/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Reset and load the demo dataset |
| `npm run db:studio` | Browse the database in Drizzle Studio |

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Vitest (roles, filters, URL params, formatting, mortgage maths, plain-English parser, matching, pricing). With `DATABASE_URL` set it also checks the Neon repository returns the same results as the mock |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Demo accounts

All demo accounts use the password **`Demo@1234`**, locally and on the live site. The login page has a one-click "Demo accounts" card;
hide it in production with `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`.

| Role | Email | Lands on |
|---|---|---|
| Seeker | seeker@demo.com | `/dashboard/seeker` |
| Owner / Seller | owner@demo.com | `/dashboard/owner` |
| Agent | agent@demo.com | `/dashboard/agent` |
| Agency Admin | agency@demo.com | `/dashboard/agency` |
| Platform Admin | admin@demo.com | `/dashboard/admin` |

Every other seeded agent and agency admin also signs in with `Demo@1234`; their emails are listed in
Admin → Users.

## Architecture

```
app/
  (site)/          public pages: landing, search, listings (+ per-listing OG image), agents, agencies, match
  (auth)/          login, signup, agency signup, forgot/reset password + server actions
  dashboard/       role dashboards (seeker, owner, agent, agency, admin), messages, notifications, settings
  actions/         server actions for every mutation
  api/             Auth.js, live-polling endpoints, uploads
  sitemap.ts, robots.ts, opengraph-image.tsx, not-found.tsx, error.tsx, global-error.tsx
components/
  ui/              shadcn/ui primitives (Base UI)
  layout/          header, footer, mobile tab bar, logo, theme toggle
  features/        auth, landing, search, listing, listings, match, directory, messages, manage, wizard
  dashboard/       sidebar, nav config, stat cards
config/            locale (currency, area units, city), site, demo accounts
lib/
  data/            types.ts, repository.ts (interface), mock/ (in-memory + seed), db/ (Drizzle + Neon), index.ts
  auth/            roles.ts (edge-safe route rules), session.ts (requireUser / requireRole)
  search/          filter.ts, params.ts (URL ⇄ filters), nl-parser.ts (plain-English search)
  validation/      Zod schemas shared by forms and server actions
auth.ts, auth.config.ts, middleware.ts
drizzle/           SQL migrations          scripts/seed.ts   loads the seed into Neon
tests/             Vitest
```

**Data layer.** Every read and write goes through the `Repository` interface (`lib/data/repository.ts`).
`lib/data/index.ts` returns the Neon implementation when `DATABASE_URL` is set and the mock otherwise.
The seed (`lib/data/mock/seed`) is deterministic: 64 listings across 5 neighbourhoods, 5 agencies,
15 agents, 30 users, plus reviews, saved searches, collections, conversations, viewings, leads, offers,
notifications and reports. `npm run db:seed` loads the same data into Neon, so both back ends behave alike
(`tests/db-parity.test.ts` checks this).

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
Vercel's filesystem is read-only, so on the live site photo upload in the listing wizard returns 501 until a
Cloudinary or UploadThing driver is added behind the same interface and selected with `STORAGE_DRIVER`.

**Locale.** Currency (PKR, with USD conversion), area units (sq ft, sq m, marla, kanal) and the map centre live in
`config/locale.ts`. Prices are stored in PKR and areas in square feet.

**Motion.** Animations only touch `transform` and `opacity`: masked line reveals, a parallax image moved with
`translateY`, FLIP tab indicators via Framer `layoutId`, card shadows that fade in on a pre-painted pseudo-element
(`.lift`), a carousel progress bar driven by `scaleX`, and counters that write text from rAF at a fixed width.
Above-the-fold entrances on the landing page are CSS keyframes (`.enter`, `.enter-mask`) so the hero is visible
on first paint rather than after hydration. Everything respects `prefers-reduced-motion`.

**SEO and performance.** Each listing has a canonical URL, Open Graph and Twitter tags, a generated preview
image (photo, price, key facts) and `RealEstateListing` JSON-LD. `sitemap.xml` covers public listings, verified
agents and agencies (revalidated hourly); `robots.txt` keeps crawlers out of dashboards and auth pages. Listing
views are counted after the response is sent (`after()`), and the page's data is fetched once per request
(`cache()`). The home page has no Suspense boundary, because streaming it would hide the hero until the
whole document was parsed. Lighthouse (mobile): Accessibility, Best Practices and SEO 100 on the home and listing
pages. Home LCP is about 2.9s under 4× CPU and Fast 4G throttling; most of that is server time to the database.

## Environment variables

See `.env.example`. `AUTH_SECRET` is required; everything else is optional in development.

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs session JWTs. Required |
| `AUTH_TRUST_HOST` | `true` behind Vercel or any proxy |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google sign-in |
| `DATABASE_URL` | Neon connection string; empty means mock data |
| `NEXT_PUBLIC_APP_URL` | Absolute base URL for canonical links, Open Graph and the sitemap |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | Show the demo-accounts card on `/login` |
| `STORAGE_DRIVER` | Upload driver (`local` by default) |

## Deploying to Vercel

```bash
npx vercel link
npx vercel env add DATABASE_URL production        # plus AUTH_SECRET, AUTH_TRUST_HOST, NEXT_PUBLIC_APP_URL
npm run db:migrate && npm run db:seed             # once, against the same database
npx vercel deploy --prod
```

## Roadmap

1. **Foundation** ✅ project setup, design tokens, layout, mock data, auth, role middleware, landing page
2. **Core experience** ✅ search with map and filters, listing detail, agent matching, directories, full dashboards, messaging, listing wizard
3. **Neon database** ✅ Drizzle schema, migrations, seed script, `lib/data/db` implementation
4. **Polish** ✅ empty and error states, SEO and Open Graph per listing, sitemap and robots, performance and Lighthouse pass, deployment

Listings, agents, agencies, reviews and prices in the seed are fictional demo data.
