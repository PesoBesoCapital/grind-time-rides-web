import { NextResponse } from "next/server";
import { readQuoteInput, toPorterPayload, validateQuote } from "@/lib/quote";
import { sendToPorter } from "@/lib/porter";
import { BUSINESS } from "@/lib/site";

const FALLBACK = `Call or text ${BUSINESS.phoneDisplay} and we'll take your request directly.`;
const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  // Only accept submissions from our own pages.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { ok: false, message: "This form can only be sent from the Grind Time site." });

  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return json(400, { ok: false, message: "Something was missing from the form. Please try again." });

  // Spam traps: a hidden field people never fill, and forms completed faster than a person can type.
  const startedAt = Number(raw.started_at);
  if (typeof raw.company_website === "string" && raw.company_website.trim() !== "") return json(200, { ok: true, reference: null });
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 3000) return json(400, { ok: false, message: "That was quick. Please check your details and send again." });

  const idem = typeof raw.idempotency_key === "string" ? raw.idempotency_key : "";
  if (!/^[A-Za-z0-9-]{8,100}$/.test(idem)) return json(400, { ok: false, message: "Please reload the page and try again." });

  const input = readQuoteInput(raw);
  const errors = validateQuote(input);
  if (Object.keys(errors).length) return json(400, { ok: false, message: "Check the highlighted fields.", errors });

  const result = await sendToPorter(idem, toPorterPayload(input));
  switch (result.kind) {
    case "ok":
      return json(200, { ok: true, reference: result.reference });
    case "rate_limited":
      return json(429, { ok: false, message: `We're getting a lot of requests right now. ${FALLBACK}` });
    case "rejected":
      return json(400, { ok: false, message: `We couldn't accept that request. Check the details, or ${FALLBACK.charAt(0).toLowerCase()}${FALLBACK.slice(1)}` });
    case "not_configured":
      return json(503, { ok: false, message: `Online quotes aren't switched on yet. ${FALLBACK}` });
    default:
      return json(502, { ok: false, message: `We couldn't send your request just now. ${FALLBACK}` });
  }
}
