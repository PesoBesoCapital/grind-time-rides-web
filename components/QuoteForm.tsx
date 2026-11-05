"use client";
import { useMemo, useRef, useState } from "react";
import { EVENT_OPTIONS, SERVICE_OPTIONS } from "@/lib/catalog";
import { ADD_ONS, findExperience, type AddOn } from "@/lib/experiences";
import { CONSENT_TEXT, MARKETING_TEXT, todayInChicago, validateQuote, type FieldErrors, type QuoteInput } from "@/lib/quote";

const empty: QuoteInput = {
  service: "", event_type: "", event_date: "", start_time: "", hours: "", passengers: "", pickup_location: "", dropoff_location: "",
  contact_name: "", contact_phone: "", contact_email: "", preferred_contact: "text", notes: "", referral_source: "",
  consent_contact: false, consent_marketing: false, package_key: "", add_ons: [], referral_code: "",
};

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function QuoteForm({ initial }: { initial: Partial<QuoteInput> }) {
  const [v, setV] = useState<QuoteInput>({ ...empty, ...initial });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  // One key per filled-in form: retries and double-clicks can't create a second request.
  const idem = useRef(newKey());
  const startedAt = useRef(Date.now());
  const trap = useRef<HTMLInputElement>(null);
  const today = useMemo(() => todayInChicago(), []);

  const set = <K extends keyof QuoteInput>(k: K, value: QuoteInput[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    // Clear an error as soon as the customer changes that field (and the contact pair together).
    setErrors((prev) => {
      if (!prev[k] && !(k === "preferred_contact" || k === "contact_phone" || k === "contact_email")) return prev;
      const next = { ...prev };
      delete next[k];
      if (k === "preferred_contact" || k === "contact_phone" || k === "contact_email") { delete next.contact_phone; delete next.contact_email; delete next.preferred_contact; }
      if (!Object.keys(next).length) setMessage(null);
      return next;
    });
  };
  const err = (k: keyof QuoteInput) => errors[k];
  const aria = (k: keyof QuoteInput) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateQuote(v, today);
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage("Check the highlighted fields.");
      const first = Object.keys(found)[0];
      document.getElementById(`q-${first}`)?.focus();
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, idempotency_key: idem.current, started_at: startedAt.current, company_website: trap.current?.value ?? "" }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string | null; message?: string; errors?: FieldErrors };
      if (res.ok && body.ok) { setReference(body.reference ?? ""); return; }
      if (body.errors) setErrors(body.errors);
      setMessage(body.message ?? "We couldn't send your request. Please try again.");
    } catch {
      setMessage("Your connection dropped before the request was sent. Try again; you won't be sent a duplicate.");
    } finally {
      setSending(false);
    }
  }

  if (reference !== null) {
    return (
      <div className="ticket done" role="status" aria-live="polite">
        <h2>Request sent</h2>
        {reference && <><p>Your reference</p><p className="ref">{reference}</p></>}
        <p>Grind Time will {v.preferred_contact === "email" ? "email" : v.preferred_contact === "call" ? "call" : "text"} you with availability and a price. Keep the reference handy if you call us.</p>
      </div>
    );
  }

  const Err = ({ k }: { k: keyof QuoteInput }) => (err(k) ? <p className="err" id={`${k}-err`}>{err(k)}</p> : null);
  const experience = v.package_key ? findExperience(v.package_key) : undefined;
  const toggleAddOn = (a: AddOn) => set("add_ons", v.add_ons.includes(a) ? v.add_ons.filter((x) => x !== a) : [...v.add_ons, a]);

  return (
    <form className="ticket ticket-form" onSubmit={submit} noValidate aria-labelledby="qf-title">
      <h2 id="qf-title" className="sr-only">Quote request</h2>
      {experience && <div className="picked">
        <p className="picked-label">Experience</p>
        <p className="picked-name">{experience.name}</p>
        <p>{experience.tagline}</p>
        <button type="button" className="link-btn" onClick={() => set("package_key", "")}>Remove, I'll build my own</button>
      </div>}
      <Err k="package_key" />
      <fieldset>
        <legend>The trip</legend>
        <div className="ticket-grid">
          <div className="field">
            <label htmlFor="q-service">Vehicle or service</label>
            <select id="q-service" value={v.service} onChange={(e) => set("service", e.target.value)} {...aria("service")}>
              <option value="">Choose one</option>
              {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Err k="service" />
          </div>
          <div className="field">
            <label htmlFor="q-event_type">Occasion</label>
            <select id="q-event_type" value={v.event_type} onChange={(e) => set("event_type", e.target.value)} {...aria("event_type")}>
              <option value="">Choose one</option>
              {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Err k="event_type" />
          </div>
          <div className="field">
            <label htmlFor="q-event_date">Date</label>
            <input id="q-event_date" type="date" min={today} value={v.event_date} onChange={(e) => set("event_date", e.target.value)} {...aria("event_date")} />
            <Err k="event_date" />
          </div>
          <div className="field">
            <label htmlFor="q-start_time">Start time <span className="opt">(optional)</span></label>
            <input id="q-start_time" type="time" value={v.start_time} onChange={(e) => set("start_time", e.target.value)} {...aria("start_time")} />
            <Err k="start_time" />
          </div>
          <div className="field">
            <label htmlFor="q-passengers">Guests <span className="opt">(best guess is fine)</span></label>
            <input id="q-passengers" type="number" inputMode="numeric" min={1} max={150} value={v.passengers} onChange={(e) => set("passengers", e.target.value)} {...aria("passengers")} />
            <Err k="passengers" />
          </div>
          <div className="field">
            <label htmlFor="q-hours">Hours needed <span className="opt">(optional)</span></label>
            <input id="q-hours" type="number" inputMode="decimal" min={1} max={24} step={0.5} value={v.hours} onChange={(e) => set("hours", e.target.value)} {...aria("hours")} />
            <Err k="hours" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Extras</legend>
        <p className="opt fieldset-note">Optional. Pick anything you'd like priced into your quote.</p>
        <div className="addons">
          {ADD_ONS.map((a) => (
            <label key={a.key} className={"addon" + (v.add_ons.includes(a.key) ? " on" : "") + (experience?.suggestedAddOns.includes(a.key) ? " suggested" : "")}>
              <input type="checkbox" checked={v.add_ons.includes(a.key)} onChange={() => toggleAddOn(a.key)} />
              <span><strong>{a.label}</strong>{experience?.suggestedAddOns.includes(a.key) ? " · popular with this experience" : ""}<br /><span className="opt">{a.line}</span></span>
            </label>
          ))}
        </div>
        <Err k="add_ons" />
      </fieldset>

      <fieldset>
        <legend>Where</legend>
        <div className="ticket-grid">
          <div className="field">
            <label htmlFor="q-pickup_location">Pickup location <span className="opt">(city or address)</span></label>
            <input id="q-pickup_location" maxLength={200} autoComplete="off" value={v.pickup_location} onChange={(e) => set("pickup_location", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="q-dropoff_location">Destination <span className="opt">(optional)</span></label>
            <input id="q-dropoff_location" maxLength={200} autoComplete="off" value={v.dropoff_location} onChange={(e) => set("dropoff_location", e.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="q-notes">Anything else? <span className="opt">(stops, music, surprises)</span></label>
            <textarea id="q-notes" maxLength={1500} value={v.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Who to contact</legend>
        <div className="ticket-grid">
          <div className="field full">
            <label htmlFor="q-contact_name">Your name</label>
            <input id="q-contact_name" autoComplete="name" maxLength={120} value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} {...aria("contact_name")} />
            <Err k="contact_name" />
          </div>
          <div className="field">
            <label htmlFor="q-contact_phone">Phone</label>
            <input id="q-contact_phone" type="tel" autoComplete="tel" inputMode="tel" value={v.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} {...aria("contact_phone")} />
            <Err k="contact_phone" />
          </div>
          <div className="field">
            <label htmlFor="q-contact_email">Email</label>
            <input id="q-contact_email" type="email" autoComplete="email" value={v.contact_email} onChange={(e) => set("contact_email", e.target.value)} {...aria("contact_email")} />
            <Err k="contact_email" />
          </div>
          <div className="field full">
            <fieldset className="choice" aria-describedby={errors.preferred_contact ? "preferred_contact-err" : undefined}>
              <legend className="sr-only">Best way to reach you</legend>
              <span className="sr-only">Best way to reach you:</span>
              {(["text", "call", "email"] as const).map((m) => (
                <label key={m}><input type="radio" name="preferred" value={m} checked={v.preferred_contact === m} onChange={() => set("preferred_contact", m)} />{m === "text" ? "Text me" : m === "call" ? "Call me" : "Email me"}</label>
              ))}
            </fieldset>
            <Err k="preferred_contact" />
          </div>
          <div className="field">
            <label htmlFor="q-referral_code">Referral code <span className="opt">(optional)</span></label>
            <input id="q-referral_code" maxLength={20} autoComplete="off" value={v.referral_code} onChange={(e) => set("referral_code", e.target.value.toUpperCase())} {...aria("referral_code")} />
            <Err k="referral_code" />
          </div>
          <div className="field">
            <label htmlFor="q-referral_source">How did you hear about us? <span className="opt">(optional)</span></label>
            <input id="q-referral_source" maxLength={120} placeholder="A friend, TikTok, Google…" value={v.referral_source} onChange={(e) => set("referral_source", e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Your OK</legend>
        <div className="field">
          <label className="check"><input id="q-consent_contact" type="checkbox" checked={v.consent_contact} onChange={(e) => set("consent_contact", e.target.checked)} {...aria("consent_contact")} />{CONSENT_TEXT}</label>
          <Err k="consent_contact" />
          <label className="check"><input type="checkbox" checked={v.consent_marketing} onChange={(e) => set("consent_marketing", e.target.checked)} />{MARKETING_TEXT}</label>
        </div>
      </fieldset>

      <div className="trap" aria-hidden="true">
        <label htmlFor="q-website">Leave this empty</label>
        <input id="q-website" ref={trap} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-actions">
        <button className="btn btn-gold" type="submit" disabled={sending}>{sending ? "Sending request…" : "Request my quote"}</button>
      </div>
      {message && <p className="form-msg" role="alert">{message}</p>}
    </form>
  );
}
