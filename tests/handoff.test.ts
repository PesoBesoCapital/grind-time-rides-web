import { describe, expect, it } from "vitest";
import { buildHandoff, handoffNote } from "@/lib/handoff";
import { MOOVS, quoteMode } from "@/lib/site";

describe("Moovs hand-off", () => {
  it("builds the note Ryan sees in Moovs from experience, extras and referral", () => {
    const h = buildHandoff({ experience: "quince-royal", addons: "red_carpet,decor,bogus", ref: "mari-7q2k", event: "quinceanera", date: "2027-03-20", passengers: "18" });
    expect(handoffNote(h)).toBe("Experience: Quince Royal · Extras: Red carpet arrival, Decor in your colors · Referral code: MARI7Q2K");
    expect(h.occasion).toBe("Quinceañera");
    expect(h.guests).toBe("18");
  });
  it("is empty when there's nothing to pass on, and ignores junk", () => {
    expect(handoffNote(buildHandoff({}))).toBe("");
    const h = buildHandoff({ experience: "<script>", ref: "x", date: "tomorrow", passengers: "lots" });
    expect(handoffNote(h)).toBe("");
    expect(h.date).toBeUndefined();
    expect(h.guests).toBeUndefined();
  });
  it("points at Ryan's Moovs account and defaults to Moovs", () => {
    expect(MOOVS.requestUrl).toBe("https://customer.moovs.app/grind-time-enterprise/request/new");
    expect(MOOVS.iframeUrl.startsWith(MOOVS.origin)).toBe(true);
    delete process.env.QUOTE_MODE;
    expect(quoteMode()).toBe("moovs");
    process.env.QUOTE_MODE = "porter";
    expect(quoteMode()).toBe("porter");
    delete process.env.QUOTE_MODE;
  });
});
