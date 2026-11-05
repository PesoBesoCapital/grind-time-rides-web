// Quote request validation shared by the form (instant feedback) and the API route (the real check).
// Mirrors the rules Porter enforces in porter_intake_quote_request so customers see clear errors early.
import { EVENT_KEYS, SERVICE_KEYS } from "./catalog";
import { ADD_ONS, EXPERIENCE_KEYS, type AddOn } from "./experiences";

const ADD_ON_KEYS = ADD_ONS.map((a) => a.key) as string[];

export const CONSENT_TEXT =
  "I agree that Grind Time Enterprise may call, text or email me about this quote request. Message and data rates may apply.";
export const MARKETING_TEXT = "Send me occasional offers and member discounts. I can opt out anytime.";

export type QuoteInput = {
  service: string;
  event_type: string;
  event_date: string;
  start_time: string;
  hours: string;
  passengers: string;
  pickup_location: string;
  dropoff_location: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  preferred_contact: string;
  notes: string;
  referral_source: string;
  consent_contact: boolean;
  consent_marketing: boolean;
  package_key: string;
  add_ons: AddOn[];
  referral_code: string;
};

export type FieldErrors = Partial<Record<keyof QuoteInput, string>>;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max) : "");

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9+]/g, "");
  if (/^[0-9]{10}$/.test(digits)) return "+1" + digits;
  if (/^1[0-9]{10}$/.test(digits)) return "+" + digits;
  if (/^\+[0-9]{10,15}$/.test(digits)) return digits;
  return null;
}

export function todayInChicago(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Coerces untrusted input (JSON body or form state) into a clean QuoteInput. */
export function readQuoteInput(body: Record<string, unknown>): QuoteInput {
  return {
    service: str(body.service, 40),
    event_type: str(body.event_type, 40),
    event_date: str(body.event_date, 10),
    start_time: str(body.start_time, 5),
    hours: str(body.hours, 4),
    passengers: str(body.passengers, 3),
    pickup_location: str(body.pickup_location, 200),
    dropoff_location: str(body.dropoff_location, 200),
    contact_name: str(body.contact_name, 120),
    contact_phone: str(body.contact_phone, 30),
    contact_email: str(body.contact_email, 200).toLowerCase(),
    preferred_contact: str(body.preferred_contact, 10) || "text",
    notes: str(body.notes, 1500),
    referral_source: str(body.referral_source, 120),
    consent_contact: body.consent_contact === true,
    consent_marketing: body.consent_marketing === true,
    package_key: str(body.package_key, 40).toLowerCase(),
    add_ons: Array.isArray(body.add_ons) ? ([...new Set(body.add_ons.filter((x): x is string => typeof x === "string").map((x) => x.toLowerCase()))].slice(0, 6) as AddOn[]) : [],
    referral_code: str(body.referral_code, 20).toUpperCase().replace(/[^A-Z0-9]/g, ""),
  };
}

export function validateQuote(q: QuoteInput, today = todayInChicago()): FieldErrors {
  const e: FieldErrors = {};
  if (!SERVICE_KEYS.includes(q.service)) e.service = "Choose a vehicle or service.";
  if (!EVENT_KEYS.includes(q.event_type)) e.event_type = "Choose the occasion.";
  if (!q.event_date) e.event_date = "Add the date of your event.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(q.event_date) || Number.isNaN(Date.parse(q.event_date))) e.event_date = "Use a valid date.";
  else if (q.event_date < today) e.event_date = "Pick today or a later date.";
  else if (q.event_date > addDays(today, 730)) e.event_date = "We book up to two years ahead.";
  if (q.start_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(q.start_time)) e.start_time = "Use a valid time.";
  if (q.hours) { const h = Number(q.hours); if (!Number.isFinite(h) || h < 1 || h > 24) e.hours = "Between 1 and 24 hours."; }
  if (q.passengers) { const p = Number(q.passengers); if (!Number.isInteger(p) || p < 1 || p > 150) e.passengers = "Between 1 and 150 passengers."; }
  if (!q.contact_name) e.contact_name = "Add your name so we know who to ask for.";
  const phone = q.contact_phone ? normalizePhone(q.contact_phone) : null;
  if (q.contact_phone && !phone) e.contact_phone = "Use a 10-digit phone number.";
  if (q.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.contact_email)) e.contact_email = "Check your email address.";
  if (!q.contact_phone && !q.contact_email) e.contact_phone = "Add a phone number or email so we can reach you.";
  if (!["call", "text", "email"].includes(q.preferred_contact)) e.preferred_contact = "Choose how to reach you.";
  if (q.preferred_contact === "email" && !q.contact_email) e.contact_email = "Add your email, or choose call or text.";
  if ((q.preferred_contact === "call" || q.preferred_contact === "text") && !q.contact_phone) e.contact_phone = "Add your phone number, or choose email.";
  if (!q.consent_contact) e.consent_contact = "We need your OK to contact you about this quote.";
  if (q.package_key && !EXPERIENCE_KEYS.includes(q.package_key)) e.package_key = "Choose an experience from the list, or leave it blank.";
  if (q.add_ons.some((a) => !ADD_ON_KEYS.includes(a))) e.add_ons = "One of the add-ons isn't available.";
  if (q.referral_code && !/^[A-Z0-9]{4,12}$/.test(q.referral_code)) e.referral_code = "Referral codes are 4-12 letters and numbers.";
  return e;
}

/** The exact payload Porter's intake function expects. */
export function toPorterPayload(q: QuoteInput) {
  return {
    service: q.service,
    event_type: q.event_type,
    event_date: q.event_date || null,
    start_time: q.start_time || null,
    hours: q.hours || null,
    passengers: q.passengers || null,
    pickup_location: q.pickup_location || null,
    dropoff_location: q.dropoff_location || null,
    contact_name: q.contact_name,
    contact_phone: q.contact_phone ? normalizePhone(q.contact_phone) : null,
    contact_email: q.contact_email || null,
    preferred_contact: q.preferred_contact,
    notes: q.notes || null,
    referral_source: q.referral_source || null,
    consent_contact: q.consent_contact,
    consent_marketing: q.consent_marketing,
    consent_text: q.consent_marketing ? `${CONSENT_TEXT} ${MARKETING_TEXT}` : CONSENT_TEXT,
    package_key: q.package_key || null,
    add_ons: q.add_ons,
    referral_code: q.referral_code || null,
  };
}
