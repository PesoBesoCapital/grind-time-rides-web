"use client";
import { useEffect } from "react";

type Ev = { event: "home_view" | "experience_view" | "quote_open" | "referral_arrival"; package_key?: string };

/**
 * Sends an anonymous page count once per tab (no cookies, no ids). Honors Global Privacy Control
 * and Do Not Track. The server only forwards known events and our own experience names.
 */
export function CountView({ events }: { events: Ev[] }) {
  const sig = JSON.stringify(events);
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    const list = JSON.parse(sig) as Ev[];
    const fresh = list.filter((e) => {
      const k = "gt-count:" + e.event + ":" + (e.package_key ?? "");
      try { if (sessionStorage.getItem(k)) return false; sessionStorage.setItem(k, "1"); } catch { /* storage blocked: count anyway */ }
      return true;
    });
    if (!fresh.length) return;
    const body = JSON.stringify({ events: fresh });
    try {
      if (!nav.sendBeacon?.("/api/demand", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/demand", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch { /* never affects the page */ }
  }, [sig]);
  return null;
}
