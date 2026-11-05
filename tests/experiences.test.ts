import { describe, expect, it } from "vitest";
import { ADD_ONS, EXPERIENCES, findExperience } from "@/lib/experiences";
import { EVENT_KEYS, SERVICE_KEYS } from "@/lib/catalog";
import { readQuoteInput, toPorterPayload, validateQuote } from "@/lib/quote";

describe("experience catalogue", () => {
  it("has unique, URL-safe slugs that Porter accepts", () => {
    const slugs = EXPERIENCES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9][a-z0-9-]{1,39}$/);
  });
  it("covers VIP, celebrations and casual fun, including quinceañeras", () => {
    const tiers = new Set(EXPERIENCES.map((e) => e.tier));
    expect([...tiers].sort()).toEqual(["celebration", "fun", "signature"]);
    expect(findExperience("quince-royal")?.event).toBe("quinceanera");
  });
  it("only uses services, occasions and add-ons Porter accepts (migrations 0003, 0007)", () => {
    const addOnKeys = ADD_ONS.map((a) => a.key).sort();
    expect(addOnKeys).toEqual(["decor", "dj", "extra_hour", "photo_stop", "red_carpet", "valet"]);
    for (const e of EXPERIENCES) {
      expect(SERVICE_KEYS).toContain(e.service);
      expect(EVENT_KEYS).toContain(e.event);
      for (const a of e.suggestedAddOns) expect(addOnKeys).toContain(a);
    }
  });
  it("never states a price, discount or invented figure", () => {
    const text = JSON.stringify(EXPERIENCES) + JSON.stringify(ADD_ONS);
    expect(text).not.toMatch(/\$\s?\d|\d+\s?%|percent off|(?<!alcohol-)\bfree\b|guarantee/i);
  });
  it("gives every experience a complete ad brief with things to avoid", () => {
    for (const e of EXPERIENCES) {
      expect(e.adBrief.hooks.length).toBeGreaterThan(0);
      expect(e.adBrief.audience.length).toBeGreaterThan(10);
      expect(e.adBrief.season.length).toBeGreaterThan(5);
      expect(e.adBrief.avoid.join(" ")).toMatch(/price/i);
    }
    expect(findExperience("prom-safe-ride")?.adBrief.avoid.join(" ")).toMatch(/minors/);
  });
});

describe("quote input with experiences, add-ons and referrals", () => {
  const base = { service: "limousine", event_type: "quinceanera", event_date: "2027-01-10", contact_name: "Sofia", contact_phone: "3125550142", preferred_contact: "text", consent_contact: true };
  it("normalises and accepts valid values", () => {
    const q = readQuoteInput({ ...base, package_key: "Quince-Royal", add_ons: ["red_carpet", "RED_CARPET", "photo_stop"], referral_code: "mari-7q2k" });
    expect(q.package_key).toBe("quince-royal");
    expect(q.add_ons).toEqual(["red_carpet", "photo_stop"]);
    expect(q.referral_code).toBe("MARI7Q2K");
    expect(validateQuote(q, "2026-11-05")).toEqual({});
    expect(toPorterPayload(q)).toMatchObject({ package_key: "quince-royal", add_ons: ["red_carpet", "photo_stop"], referral_code: "MARI7Q2K" });
  });
  it("rejects unknown experiences, add-ons and malformed codes", () => {
    const q = readQuoteInput({ ...base, package_key: "yacht-party", add_ons: ["helicopter"], referral_code: "x1" });
    expect(Object.keys(validateQuote(q, "2026-11-05")).sort()).toEqual(["add_ons", "package_key", "referral_code"]);
  });
  it("sends nulls when nothing was chosen", () => {
    expect(toPorterPayload(readQuoteInput(base))).toMatchObject({ package_key: null, add_ons: [], referral_code: null });
  });
});
