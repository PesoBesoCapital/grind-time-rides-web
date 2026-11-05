"use client";
import { useState } from "react";
import { MOOVS } from "@/lib/site";

/** Ryan's Moovs request form, embedded, with a copyable note and a new-tab fallback. */
export function MoovsRequest({ note, summary }: { note: string; summary: string[] }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(note); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* user can select the text */ }
  }
  return (
    <div className="moovs">
      {(note || summary.length > 0) && <div className="picked">
        <p className="picked-label">Your trip so far</p>
        {summary.length > 0 && <p>{summary.join(" · ")}</p>}
        {note && <>
          <p className="handoff-ask">Add this to the notes in the form below so we price it right:</p>
          <p className="handoff-note" id="handoff-note">{note}</p>
          <button type="button" className="link-btn" onClick={copy} aria-describedby="handoff-note">{copied ? "Copied" : "Copy note"}</button>
        </>}
      </div>}
      <iframe className="moovs-frame" src={MOOVS.iframeUrl} title="Request a quote from Grind Time (secure booking form)" loading="eager" />
      <p className="moovs-fallback">Form not loading? <a href={MOOVS.requestUrl} target="_blank" rel="noopener noreferrer">Open the booking form in a new tab</a>.</p>
    </div>
  );
}
