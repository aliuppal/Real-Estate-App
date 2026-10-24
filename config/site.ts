export const site = {
  name: "Nestly",
  tagline: "Find the home that fits your life.",
  description:
    "Rent, buy or sell property in Lahore and get matched with verified agents who know the neighbourhood.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mainNav: [
    { label: "Buy", href: "/search?purpose=sale" },
    { label: "Rent", href: "/search?purpose=rent" },
    { label: "Sell", href: "/dashboard/listings/new" },
    { label: "Agents", href: "/agents" },
    { label: "Agencies", href: "/agencies" },
  ],
  support: { email: "hello@nestly.pk", phone: "+92 42 111 637 859" },
} as const;
