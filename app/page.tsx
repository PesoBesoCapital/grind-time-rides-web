import Link from "next/link";
import { FLEET, SERVICES } from "@/lib/catalog";
import { EXPERIENCES, TIER_LABEL, type Tier } from "@/lib/experiences";
import { BUSINESS } from "@/lib/site";
import { TicketStart } from "@/components/TicketStart";

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap">
          <div>
            <h1 id="hero-title">Chicago, on time <span>and in style.</span></h1>
            <p className="tagline">{BUSINESS.tagline}</p>
            <p className="hero-lede">Party buses, stretch limousines, luxury SUVs, DJ and valet for weddings, proms, birthdays, corporate travel and airport runs across Chicagoland.</p>
          </div>
          <TicketStart />
        </div>
      </section>

      <section className="section" id="experiences" aria-labelledby="exp-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="exp-title">Pick your night</h2>
            <p>VIP to just-for-fun: start from an experience and we'll tailor the rest. <Link href="/experiences">See all experiences</Link></p>
          </div>
          <div className="tiers">
            {(["signature", "celebration", "fun"] as Tier[]).map((t) => (
              <div key={t} className={"tier tier-" + t}>
                <h3>{TIER_LABEL[t].name}</h3>
                <p>{TIER_LABEL[t].line}</p>
                <ul>
                  {EXPERIENCES.filter((e) => e.tier === t).map((e) => (
                    <li key={e.slug}><Link href={`/experiences/${e.slug}`}>{e.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="fleet" aria-labelledby="fleet-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="fleet-title">The fleet</h2>
            <p>Nine ways to arrive. Tell us your group size and occasion, and we&apos;ll match you with the right vehicle.</p>
          </div>
          <ul className="lineup">
            {FLEET.map((v) => (
              <li key={v.name}>
                <h3>{v.name}</h3>
                <p>{v.bestFor}</p>
                <Link href={`/quote?service=${v.key}`} aria-label={`Get a quote for ${v.name}`}>Get a quote</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="services" aria-labelledby="services-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="services-title">More than the ride</h2>
            <p>Book the vehicle, the music and the parking from one place.</p>
          </div>
          <div className="services">
            {SERVICES.map((s) => (
              <div key={s.key}>
                <h3>{s.name}</h3>
                <p>{s.line}</p>
                <Link href={`/quote?service=${s.key}`}>{s.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="how-title">How booking works</h2>
            <p>No account and no payment to ask for a price.</p>
          </div>
          <ol className="steps">
            <li><h3>Send your trip details</h3><p>Date, occasion, group size and where you&apos;re going. It takes about two minutes.</p></li>
            <li><h3>Get your quote</h3><p>We contact you the way you prefer, by call, text or email, with availability and a price.</p></li>
            <li><h3>Ride</h3><p>Confirm, and your driver handles the rest. People, places, purpose.</p></li>
          </ol>
        </div>
      </section>

      <section className="section closer" aria-labelledby="closer-title">
        <div className="wrap">
          <h2 id="closer-title">Tell us the date. We&apos;ll handle the ride.</h2>
          <div className="actions">
            <Link className="btn btn-gold" href="/quote">Get a quote</Link>
            <a className="btn btn-line" href={`sms:${BUSINESS.phoneE164}`}>Text {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </section>
    </>
  );
}
