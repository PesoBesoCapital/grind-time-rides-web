// Server-only: forwards a validated quote request to Porter's intake function.
// Needs PORTER_SUPABASE_URL, PORTER_SUPABASE_ANON_KEY, PORTER_INTAKE_SOURCE and PORTER_INTAKE_TOKEN
// (Vercel environment variables, never NEXT_PUBLIC_*).
import "server-only";

export type PorterResult =
  | { kind: "ok"; reference: string; duplicate: boolean }
  | { kind: "not_configured" }
  | { kind: "rate_limited" }
  | { kind: "rejected"; message: string }
  | { kind: "unavailable" };

export async function sendToPorter(idempotencyKey: string, payload: Record<string, unknown>, fetchImpl: typeof fetch = fetch): Promise<PorterResult> {
  const url = process.env.PORTER_SUPABASE_URL;
  const anon = process.env.PORTER_SUPABASE_ANON_KEY;
  const source = process.env.PORTER_INTAKE_SOURCE;
  const token = process.env.PORTER_INTAKE_TOKEN;
  if (!url || !anon || !source || !token) return { kind: "not_configured" };

  let res: Response;
  try {
    res = await fetchImpl(`${url.replace(/\/$/, "")}/rest/v1/rpc/porter_intake_quote_request`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anon, authorization: `Bearer ${anon}` },
      body: JSON.stringify({ p_source_key: source, p_token: token, p_idempotency_key: idempotencyKey, p_payload: payload }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    return { kind: "unavailable" };
  }
  if (!res.ok) return { kind: "unavailable" };
  const body = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; duplicate?: boolean; error?: string } | null;
  if (body?.ok && body.reference) return { kind: "ok", reference: body.reference, duplicate: !!body.duplicate };
  if (body?.error === "rate_limited") return { kind: "rate_limited" };
  // "unauthorized" means our token is wrong or revoked: that's our problem, not the customer's.
  if (!body || body.error === "unauthorized") return { kind: "unavailable" };
  return { kind: "rejected", message: body.error ?? "Request not accepted" };
}
