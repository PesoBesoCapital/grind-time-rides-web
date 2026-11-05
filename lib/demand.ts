// Anonymous demand counts for Porter (migration 202611050008): which experiences people look at and
// how many reach the booking form. No ids, cookies, IPs or referral codes ever leave the browser.
import { EXPERIENCES } from "@/lib/experiences";

export type DemandEvent = { event: "home_view" | "experience_view" | "quote_open" | "referral_arrival"; package_key?: string };
const EVENTS = new Set(["home_view", "experience_view", "quote_open", "referral_arrival"]);
const SLUGS = new Set(EXPERIENCES.map((e) => e.slug));

/** Accepts only known events and our own experience slugs; anything else is dropped. Max 5. */
export function parseDemand(raw: unknown): DemandEvent[] {
  const list = (raw as { events?: unknown } | null)?.events;
  if (!Array.isArray(list)) return [];
  const out: DemandEvent[] = [];
  for (const item of list.slice(0, 5)) {
    const e = item as { event?: unknown; package_key?: unknown };
    if (typeof e?.event !== "string" || !EVENTS.has(e.event)) continue;
    const key = typeof e.package_key === "string" && SLUGS.has(e.package_key) ? e.package_key : undefined;
    if (e.event === "experience_view" && !key) continue;
    out.push(key && e.event !== "home_view" && e.event !== "referral_arrival" ? { event: e.event as DemandEvent["event"], package_key: key } : { event: e.event as DemandEvent["event"] });
  }
  return out;
}

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|bingpreview/i;
export const isBot = (ua: string | null) => !ua || BOTS.test(ua);

/** Counting runs only on the live site (preview traffic is us testing), or when DEMAND_COUNTS=on. */
export const countingEnabled = () => process.env.NEXT_PUBLIC_SITE_STAGE === "live" || process.env.DEMAND_COUNTS === "on";
