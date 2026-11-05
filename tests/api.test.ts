import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/quote/route";

const ENV = { PORTER_SUPABASE_URL: "https://porter.test", PORTER_SUPABASE_ANON_KEY: "anon-key", PORTER_INTAKE_SOURCE: "grindtimerides-web", PORTER_INTAKE_TOKEN: "secret-token" };
const inAMonth = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
const body = (over: Record<string, unknown> = {}) => ({
  service: "limousine", event_type: "wedding", event_date: inAMonth(), contact_name: "Test Customer", contact_phone: "2245550100",
  preferred_contact: "text", consent_contact: true, idempotency_key: "0b0e5f0e-1111-4c4c-8888-123456789abc", started_at: Date.now() - 60_000,
  company_website: "", ...over,
});
const req = (b: unknown, origin: string | null = "https://preview.grindtime.test") =>
  new Request("https://preview.grindtime.test/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json", host: "preview.grindtime.test", ...(origin ? { origin } : {}) },
    body: typeof b === "string" ? b : JSON.stringify(b),
  });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  Object.assign(process.env, ENV);
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, reference: "GT-261205-AB12C", duplicate: false }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); for (const k of Object.keys(ENV)) delete process.env[k]; });

describe("POST /api/quote", () => {
  it("forwards a valid request to Porter with the secret only in the server call", async () => {
    const res = await POST(req(body()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, reference: "GT-261205-AB12C" });
    expect(JSON.stringify(json)).not.toContain("secret-token");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://porter.test/rest/v1/rpc/porter_intake_quote_request");
    const sent = JSON.parse(init.body);
    expect(sent.p_source_key).toBe("grindtimerides-web");
    expect(sent.p_token).toBe("secret-token");
    expect(sent.p_idempotency_key).toBe("0b0e5f0e-1111-4c4c-8888-123456789abc");
    expect(sent.p_payload).toMatchObject({ service: "limousine", contact_phone: "+12245550100", consent_contact: true });
    expect(init.headers.apikey).toBe("anon-key");
  });

  it("rejects other websites", async () => {
    expect((await POST(req(body(), "https://evil.test"))).status).toBe(403);
    expect((await POST(req(body(), null))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("quietly drops bots that fill the hidden field", async () => {
    const res = await POST(req(body({ company_website: "http://spam" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, reference: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses forms submitted faster than a person could", async () => {
    expect((await POST(req(body({ started_at: Date.now() })))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns field errors without calling Porter", async () => {
    const res = await POST(req(body({ consent_contact: false, contact_name: "" })));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Object.keys(json.errors).sort()).toEqual(["consent_contact", "contact_name"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and bad idempotency keys", async () => {
    expect((await POST(req("{not json"))).status).toBe(400);
    expect((await POST(req(body({ idempotency_key: "x" })))).status).toBe(400);
  });

  it("gives the phone number when online quotes aren't configured", async () => {
    delete process.env.PORTER_INTAKE_TOKEN;
    const res = await POST(req(body()));
    expect(res.status).toBe(503);
    expect((await res.json()).message).toContain("(224) 600-4550");
  });

  it("maps Porter's answers to customer-friendly responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 200 }));
    expect((await POST(req(body()))).status).toBe(429);
    // A wrong or revoked token is our fault: never tell the customer their request was invalid.
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 200 }));
    expect((await POST(req(body()))).status).toBe(502);
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 500 }));
    expect((await POST(req(body()))).status).toBe(502);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect((await POST(req(body()))).status).toBe(502);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, reference: "GT-261205-AB12C", duplicate: true }), { status: 200 }));
    expect(await (await POST(req(body()))).json()).toEqual({ ok: true, reference: "GT-261205-AB12C" });
  });
});
