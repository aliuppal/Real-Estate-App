"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, MessageSquare, Phone, PhoneCall, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DaySlots } from "@/lib/availability";
import type { Purpose, Role } from "@/lib/data/types";
import { formatPrice, formatResponseTime } from "@/lib/format";
import { initials } from "@/components/layout/user-menu";
import { ContactDialog, type ContactKind } from "./contact-dialogs";

export interface PublicContact {
  kind: "agent" | "owner";
  name: string;
  photo: string | null;
  subtitle: string;
  verified: boolean;
  responseMins: number | null;
  rating: number | null;
  reviewCount: number;
  phone: string | null;
  profileHref: string | null;
}

interface ContactCardProps {
  listingId: string;
  listingTitle: string;
  purpose: Purpose;
  price: number;
  depositMonths: number | null;
  contact: PublicContact | null;
  viewer: { signedIn: boolean; role: Role | null; isOwn: boolean; manageHref: string | null };
  slots: DaySlots[];
}

/** Sticky price + contact card with the four ways to reach the lister. */
export function ContactCard({ listingId, listingTitle, purpose, price, depositMonths, contact, viewer, slots }: ContactCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<ContactKind | null>(null);
  const [showPhone, setShowPhone] = useState(false);

  const open = (kind: ContactKind) => {
    if (!viewer.signedIn) return router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    if (kind === "offer" && viewer.role !== "seeker") return toast("Offers and applications are made from a seeker account.");
    setDialog(kind);
  };

  const actions: { kind: ContactKind; label: string; icon: typeof MessageSquare }[] = [
    { kind: "message", label: "Message", icon: MessageSquare },
    { kind: "viewing", label: "Schedule viewing", icon: CalendarDays },
    { kind: "callback", label: "Request call back", icon: PhoneCall },
    { kind: "offer", label: purpose === "sale" ? "Make an offer" : "Apply to rent", icon: Wallet },
  ];

  return (
    <aside className="rounded-media border border-border bg-card p-6" aria-label="Price and contact">
      <p className="tabular font-display text-4xl tracking-[-0.03em]">{formatPrice(price, { compact: true, purpose })}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatPrice(price, { purpose })}
        {purpose === "rent" && depositMonths ? ` · ${depositMonths} months' deposit` : ""}
      </p>

      {contact && (
        <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
          {contact.photo ? (
            <Image src={contact.photo} alt="" width={52} height={52} className="size-13 rounded-full object-cover" />
          ) : (
            <span className="grid size-13 place-items-center rounded-full bg-secondary text-sm">{initials(contact.name)}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate">
              {contact.profileHref ? <Link href={contact.profileHref} className="underline-offset-4 hover:underline">{contact.name}</Link> : contact.name}
              {contact.verified && <BadgeCheck className="size-4 shrink-0 text-brand dark:text-[#4cc3a4]" aria-label="Verified" />}
            </p>
            <p className="truncate text-sm text-muted-foreground">{contact.subtitle}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {contact.rating ? <span className="inline-flex items-center gap-1"><Star className="size-3 fill-current" aria-hidden />{contact.rating.toFixed(1)} ({contact.reviewCount})</span> : null}
              {contact.responseMins ? <span>Replies {formatResponseTime(contact.responseMins)}</span> : null}
            </p>
          </div>
        </div>
      )}

      {viewer.isOwn ? (
        <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
          <p>This is your listing.</p>
          {viewer.manageHref && <Link href={viewer.manageHref} className="mt-1 inline-block underline underline-offset-4">Manage it from your dashboard</Link>}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {actions.map(({ kind, label, icon: Icon }, i) => (
            <Button key={kind} variant={i === 0 ? "default" : "outline"} size="xl" className="w-full" onClick={() => open(kind)}>
              <Icon className="size-4" aria-hidden /> {label}
            </Button>
          ))}
          {contact?.phone && (
            <button type="button" onClick={() => (viewer.signedIn ? setShowPhone(true) : open("callback"))}
              className="flex w-full items-center justify-center gap-2 pt-2 text-sm underline-offset-4 hover:underline">
              <Phone className="size-4" aria-hidden />
              {showPhone ? <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="tabular">{contact.phone}</a> : "Show phone number"}
            </button>
          )}
        </div>
      )}

      <ContactDialog kind={dialog} onClose={() => setDialog(null)} listingId={listingId} listingTitle={listingTitle}
        contactName={contact?.name ?? "The lister"} purpose={purpose} price={price} slots={slots} />
    </aside>
  );
}
