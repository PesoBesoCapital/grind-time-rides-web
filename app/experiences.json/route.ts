// Machine-readable catalogue for the Cesar OS ad agents: what each experience is, who it's for,
// approved angles, seasonality and what ads must avoid. Marketing data only; no customer data.
import { ADD_ONS, EXPERIENCES, TIER_LABEL } from "@/lib/experiences";
import { BUSINESS } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    business: { name: BUSINESS.name, tagline: BUSINESS.tagline, area: BUSINESS.area, phone: BUSINESS.phoneDisplay },
    status: "draft: every experience, hook and claim needs Ryan's approval before an ad runs",
    rules: ["No prices or discounts unless Ryan approved them", "No reviews or testimonials unless real and approved", "Link ads to /experiences/<slug> or /quote?experience=<slug>"],
    tiers: TIER_LABEL,
    addOns: ADD_ONS,
    experiences: EXPERIENCES.map((e) => ({ ...e, url: `/experiences/${e.slug}`, quoteUrl: `/quote?experience=${e.slug}` })),
  }, { headers: { "cache-control": "public, max-age=300" } });
}
