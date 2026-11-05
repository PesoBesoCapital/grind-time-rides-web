import { describe, expect, it } from "vitest";
import { normalizePhone, readQuoteInput, toPorterPayload, todayInChicago, validateQuote, CONSENT_TEXT } from "@/lib/quote";
import { EVENT_KEYS, SERVICE_KEYS } from "@/lib/catalog";

const TODAY = "2026-11-05";
const good = () => readQuoteInput({
  service: "party_bus", event_type: "birthday", event_date: "2026-12-05", start_time: "19:30", hours: "5", passengers: "20",
  pickup_location: "Schaumburg", dropoff_location: "River North", contact_name: "Test Customer", contact_phone: "(224) 555-0100",
  contact_email: "", preferred_contact: "text", notes: "Surprise", referral_source: "TikTok", consent_contact: true, consent_marketing: false,
});

describe("validateQuote", () => {
  it("accepts a complete request", () => expect(validateQuote(good(), TODAY)).toEqual({}));
  it("requires service, occasion, date, name, consent", () => {
    const e = validateQuote(readQuoteInput({}), TODAY);
    expect(Object.keys(e).sort()).toEqual(["consent_contact", "contact_name", "contact_phone", "event_date", "event_type", "service"].sort());
  });
  it("rejects past dates and dates over two years out", () => {
    expect(validateQuote({ ...good(), event_date: "2026-11-01" }, TODAY).event_date).toMatch(/today or a later/);
    expect(validateQuote({ ...good(), event_date: "2029-01-01" }, TODAY).event_date).toMatch(/two years/);
    expect(validateQuote({ ...good(), event_date: TODAY }, TODAY)).toEqual({});
  });
  it("needs the contact method that was chosen", () => {
    expect(validateQuote({ ...good(), preferred_contact: "email" }, TODAY).contact_email).toBeTruthy();
    expect(validateQuote({ ...good(), contact_phone: "", contact_email: "a@b.co", preferred_contact: "text" }, TODAY).contact_phone).toBeTruthy();
  });
  it("rejects bad numbers, times, emails and phones", () => {
    const e = validateQuote({ ...good(), passengers: "1.5", hours: "30", start_time: "25:00", contact_email: "nope", contact_phone: "123" }, TODAY);
    expect(Object.keys(e).sort()).toEqual(["contact_email", "contact_phone", "hours", "passengers", "start_time"]);
  });
  it("only accepts consent when it is literally true", () => {
    expect(readQuoteInput({ consent_contact: "true" }).consent_contact).toBe(false);
  });
  it("strips control characters and trims", () => {
    expect(readQuoteInput({ contact_name: "  Ana\u0007 \u0000Ruiz " }).contact_name).toBe("Ana Ruiz");
  });
});

describe("toPorterPayload", () => {
  it("normalises the phone and records the exact consent wording", () => {
    const p = toPorterPayload(good());
    expect(p.contact_phone).toBe("+12245550100");
    expect(p.consent_text).toBe(CONSENT_TEXT);
    expect(p.contact_email).toBeNull();
    expect(toPorterPayload({ ...good(), consent_marketing: true }).consent_text).toContain("offers");
  });
});

describe("helpers", () => {
  it("normalizes phones", () => {
    expect(normalizePhone("224-555-0100")).toBe("+12245550100");
    expect(normalizePhone("1 224 555 0100")).toBe("+12245550100");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("555")).toBeNull();
  });
  it("uses Chicago's date", () => expect(todayInChicago(new Date("2026-11-06T03:00:00Z"))).toBe("2026-11-05"));
  it("only offers values Porter accepts (migration 202611050003)", () => {
    expect(SERVICE_KEYS).toEqual(["party_bus", "limousine", "suv_sedan", "limo_sprinter", "stretch_hummer", "trolley", "motor_coach", "dj", "valet", "custom_build", "not_sure"]);
    expect([...EVENT_KEYS].sort()).toEqual(["airport", "bachelor_bachelorette", "birthday", "concert_sports", "corporate", "funeral", "night_out", "other", "prom_homecoming", "quinceanera", "wedding"]);
  });
});
