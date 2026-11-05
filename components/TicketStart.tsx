"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT_OPTIONS } from "@/lib/catalog";

/** Hero trip ticket: three quick answers, then the full quote form with them filled in. */
export function TicketStart() {
  const router = useRouter();
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [pax, setPax] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (event) q.set("event", event);
    if (date) q.set("date", date);
    if (pax) q.set("passengers", pax);
    router.push("/quote" + (q.size ? "?" + q.toString() : ""));
  }

  return (
    <form className="ticket" onSubmit={go} aria-labelledby="ticket-title">
      <h2 id="ticket-title">Trip ticket</h2>
      <p className="ticket-sub">Start a quote. Free, no account needed.</p>
      <div className="ticket-grid">
        <div className="field full">
          <label htmlFor="ts-event">What&apos;s the occasion?</label>
          <select id="ts-event" value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="">Choose one</option>
            {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ts-date">Date</label>
          <input id="ts-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ts-pax">Guests</label>
          <input id="ts-pax" type="number" inputMode="numeric" min={1} max={150} value={pax} onChange={(e) => setPax(e.target.value)} />
        </div>
        <div className="full">
          <button className="btn btn-gold" type="submit" style={{ width: "100%" }}>Continue to quote</button>
        </div>
      </div>
    </form>
  );
}
