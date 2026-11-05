import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADD_ONS, EXPERIENCES, findExperience, TIER_LABEL } from "@/lib/experiences";

export function generateStaticParams() {
  return EXPERIENCES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = findExperience((await params).slug);
  return e ? { title: e.name, description: `${e.tagline} ${e.forWho}` } : {};
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const e = findExperience((await params).slug);
  if (!e) notFound();
  const addOns = ADD_ONS.filter((a) => e.suggestedAddOns.includes(a.key));
  return (
    <section className="exp-detail">
      <div className="wrap">
        <p className="crumb"><Link href="/experiences">Experiences</Link> / {TIER_LABEL[e.tier].name}</p>
        <h1>{e.name}</h1>
        <p className="exp-lede">{e.tagline}</p>
        <div className="exp-grid">
          <div>
            <h2>Made for</h2>
            <p>{e.forWho}</p>
            <h2>What's planned</h2>
            <ul className="ticks">{e.includes.map((i) => <li key={i}>{i}</li>)}</ul>
            <h2>Good to know</h2>
            <ul className="ticks">{e.goodToKnow.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <aside className="ticket">
            <h2>Ride options</h2>
            <p className="ticket-sub">We'll match the vehicle to your group size.</p>
            <ul className="plain">{e.vehicles.map((v) => <li key={v}>{v}</li>)}</ul>
            {addOns.length > 0 && <>
              <h3>Popular extras</h3>
              <ul className="plain">{addOns.map((a) => <li key={a.key}>{a.label}</li>)}</ul>
            </>}
            <Link className="btn btn-gold" href={`/quote?experience=${e.slug}`} style={{ width: "100%", marginTop: 16 }}>Request {e.name}</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
