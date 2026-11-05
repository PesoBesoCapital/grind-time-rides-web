import type { Metadata } from "next";
import Link from "next/link";
import { EXPERIENCES, TIER_LABEL, type Tier } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Experiences",
  description: "VIP nights, quinceañeras, weddings, prom, birthdays, game days and more. Pick your night and request a quote.",
};

const ORDER: Tier[] = ["signature", "celebration", "fun"];

export default function ExperiencesPage() {
  return (
    <>
      <section className="exp-hero">
        <div className="wrap">
          <h1>Pick your night</h1>
          <p>From a red-carpet anniversary to a game-day crew, every Grind Time experience is planned around your occasion and confirmed in your quote.</p>
        </div>
      </section>
      {ORDER.map((tier) => (
        <section className="section exp-tier" key={tier} aria-labelledby={`tier-${tier}`}>
          <div className="wrap">
            <div className="section-head">
              <h2 id={`tier-${tier}`}>{TIER_LABEL[tier].name}</h2>
              <p>{TIER_LABEL[tier].line}</p>
            </div>
            <ul className="exp-list">
              {EXPERIENCES.filter((e) => e.tier === tier).map((e) => (
                <li key={e.slug}>
                  <Link href={`/experiences/${e.slug}`} className="exp-row">
                    <h3>{e.name}</h3>
                    <p className="exp-tag">{e.tagline}</p>
                    <p className="exp-for">{e.forWho}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </>
  );
}
