// What to tell Ryan in the Moovs request so the booking can be tied back to an experience,
// the extras and a referral (Porter reads these later from Moovs). Pure, testable.
import { ADD_ONS, findExperience } from "./experiences";
import { EVENT_OPTIONS } from "./catalog";

export type Handoff = { experience?: string; addOns: string[]; referral?: string; occasion?: string; date?: string; guests?: string };

export function buildHandoff(params: Record<string, string>): Handoff {
  const exp = findExperience(params.experience ?? "");
  const addOns = (params.addons ?? "").split(",").map((a) => ADD_ONS.find((x) => x.key === a.trim())?.label).filter((x): x is string => !!x);
  const ref = (params.ref ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const occasion = EVENT_OPTIONS.find((o) => o.value === params.event)?.label;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : undefined;
  const guests = /^\d{1,3}$/.test(params.passengers ?? "") ? params.passengers : undefined;
  return { experience: exp?.name, addOns, referral: ref.length >= 4 ? ref : undefined, occasion, date, guests };
}

/** One line the customer can paste into the Moovs notes field. Empty when there's nothing to pass on. */
export function handoffNote(h: Handoff): string {
  const parts = [
    h.experience && `Experience: ${h.experience}`,
    h.addOns.length > 0 && `Extras: ${h.addOns.join(", ")}`,
    h.referral && `Referral code: ${h.referral}`,
  ].filter(Boolean);
  return parts.join(" · ");
}
