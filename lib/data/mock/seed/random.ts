/** Deterministic PRNG so the seed is identical on every boot and in the DB seed script. */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    bool: (p = 0.5) => next() < p,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    sample: <T>(items: readonly T[], count: number): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, Math.min(count, copy.length));
    },
  };
}

export type Random = ReturnType<typeof createRandom>;

const DAY = 86_400_000;
export const daysAgo = (days: number, now = Date.now()) => new Date(now - days * DAY).toISOString();
export const daysFromNow = (days: number, now = Date.now()) => new Date(now + days * DAY).toISOString();

export const roundTo = (value: number, step: number) => Math.round(value / step) * step;
