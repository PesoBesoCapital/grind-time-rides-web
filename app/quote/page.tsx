import type { Metadata } from "next";
import { QuoteForm } from "@/components/QuoteForm";
import { BUSINESS, quoteMode } from "@/lib/site";
import { MoovsRequest } from "@/components/MoovsRequest";
import { buildHandoff, handoffNote } from "@/lib/handoff";
import { EVENT_KEYS, SERVICE_KEYS } from "@/lib/catalog";
import { findExperience } from "@/lib/experiences";
import { CountView } from "@/components/CountView";

export const metadata: Metadata = { title: "Get a quote", description: "Request a quote for a party bus, limousine, SUV, DJ or valet service in Chicagoland." };

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function QuotePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const service = one(sp.service), event = one(sp.event), date = one(sp.date), pax = one(sp.passengers);
  const exp = findExperience(one(sp.experience));
  const ref = one(sp.ref).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const initial = {
    package_key: exp?.slug ?? "",
    referral_code: ref.length >= 4 ? ref : "",
    service: SERVICE_KEYS.includes(service) ? service : exp?.service ?? "",
    event_type: EVENT_KEYS.includes(event) ? event : exp?.event ?? "",
    event_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    passengers: /^\d{1,3}$/.test(pax) ? pax : "",
  };
  const counts = [
    exp ? { event: "quote_open" as const, package_key: exp.slug } : { event: "quote_open" as const },
    ...(initial.referral_code ? [{ event: "referral_arrival" as const }] : []),
  ];
  if (quoteMode() === "moovs") {
    const h = buildHandoff({ experience: one(sp.experience), addons: one(sp.addons), ref: one(sp.ref), event: one(sp.event), date, passengers: pax });
    const summary = [h.occasion, h.date, h.guests && `${h.guests} guests`].filter((x): x is string => !!x);
    return (
      <section className="quote-page">
        <CountView events={counts} />
        <div className="wrap">
          <div className="quote-aside">
            <h1>Get a quote</h1>
            <p>Tell us about the trip and we&apos;ll come back with availability and a price. Requests go straight to the Grind Time booking team.</p>
            <p>Planning something last-minute? Call or text <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>.</p>
          </div>
          <MoovsRequest note={handoffNote(h)} summary={summary} />
        </div>
      </section>
    );
  }
  return (
    <section className="quote-page">
      <CountView events={counts} />
      <div className="wrap">
        <div className="quote-aside">
          <h1>Get a quote</h1>
          <p>Tell us about the trip and we&apos;ll come back with availability and a price, by call, text or email, whichever you prefer.</p>
          <p>Planning something last-minute? Call or text <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>.</p>
        </div>
        <QuoteForm initial={initial} />
      </div>
    </section>
  );
}
