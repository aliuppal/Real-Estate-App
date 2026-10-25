import { locale } from "@/config/locale";
import type { Viewing } from "@/lib/data/types";

/** Default viewing hours for agents and owners: Monday–Saturday, 10:00–18:00 Lahore time, hourly slots. */
export const VIEWING_HOURS = { days: [1, 2, 3, 4, 5, 6], start: 10, end: 18, slotMins: 60 } as const;

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface DaySlots {
  /** yyyy-mm-dd in Lahore time. */
  date: string;
  slots: Slot[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** yyyy-mm-dd and weekday of an instant, as seen in Lahore. */
function localDay(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: locale.timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday };
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/**
 * Viewing slots for the next `days` days, starting tomorrow. A slot is unavailable if it overlaps a
 * requested or confirmed viewing for the same agent/owner, or if it's less than two hours away.
 */
export function viewingSlots(booked: Pick<Viewing, "start" | "end" | "status">[], days = 7, now = new Date()): DaySlots[] {
  const busy = booked
    .filter((v) => v.status === "requested" || v.status === "confirmed")
    .map((v) => [new Date(v.start).getTime(), new Date(v.end).getTime()] as const);
  const earliest = now.getTime() + 2 * 3_600_000;
  const result: DaySlots[] = [];

  for (let offset = 1; result.length < days && offset <= days * 2; offset++) {
    const { date, weekday } = localDay(new Date(now.getTime() + offset * 86_400_000));
    if (!(VIEWING_HOURS.days as readonly number[]).includes(weekday)) continue;
    const slots: Slot[] = [];
    for (let h = VIEWING_HOURS.start; h < VIEWING_HOURS.end; h += VIEWING_HOURS.slotMins / 60) {
      const start = new Date(`${date}T${pad(h)}:00:00${locale.utcOffset}`);
      const end = new Date(start.getTime() + VIEWING_HOURS.slotMins * 60_000);
      const taken = busy.some(([s, e]) => overlaps(start.getTime(), end.getTime(), s, e));
      slots.push({ start: start.toISOString(), end: end.toISOString(), available: !taken && start.getTime() > earliest });
    }
    result.push({ date, slots });
  }
  return result;
}

export const formatInLahore = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-PK", { timeZone: locale.timeZone, ...opts });
