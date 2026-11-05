import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isBot, parseDemand } from "@/lib/demand";
import { POST } from "@/app/api/demand/route";

const ENV = { PORTER_SUPABASE_URL: "https://porter.test", PORTER_SUPABASE_ANON_KEY: "anon-key", PORTER_INTAKE_SOURCE: "grindtimerides-web", PORTER_INTAKE_TOKEN: "secret-token", DEMAND_COUNTS: "on" };
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const req = (b: unknown, headers: Record<string, string> = {}) => new Request("https://site.test/api/demand", {
  method: "POST", body: typeof b === "string" ? b : JSON.stringify(b),
  headers: { host: "site.test", origin: "https://site.test", "user-agent": UA, "content-type": "application/json", ...headers },
});

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { Object.assign(process.env, ENV); fetchMock = vi.fn(async () => new Response("{}", { status: 200 })); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); for (const k of Object.keys(ENV)) delete process.env[k]; delete process.env.NEXT_PUBLIC_SITE_STAGE; });

describe("parseDemand", () => {
  it("keeps known events and our own experience names only", () => {
    expect(parseDemand({ events: [
      { event: "experience_view", package_key: "quince-royal" }, { event: "quote_open", package_key: "not-ours" },
      { event: "referral_arrival", package_key: "quince-royal" }, { event: "steal" }, { event: "experience_view" },
    ] })).toEqual([{ event: "experience_view", package_key: "quince-royal" }, { event: "quote_open" }, { event: "referral_arrival" }]);
  });
  it("caps the batch and ignores junk", () => {
    expect(parseDemand({ events: Array(9).fill({ event: "home_view" }) })).toHaveLength(5);
    expect(parseDemand(null)).toEqual([]);
    expect(parseDemand({ events: "home_view" })).toEqual([]);
  });
  it("spots crawlers and link previews", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot(UA)).toBe(false);
  });
});

describe("POST /api/demand", () => {
  it("forwards anonymous counts with the token only in the server call", async () => {
    const res = await POST(req({ events: [{ event: "experience_view", package_key: "quince-royal" }] }));
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://porter.test/rest/v1/rpc/porter_record_site_demand");
    expect(JSON.parse(init.body)).toEqual({ p_source_key: "grindtimerides-web", p_token: "secret-token", p_events: [{ event: "experience_view", package_key: "quince-royal" }] });
    expect(init.body).not.toMatch(/Mozilla|site\.test/);
  });
  it("counts nothing from other sites, bots, or preview traffic", async () => {
    await POST(req({ events: [{ event: "home_view" }] }, { origin: "https://evil.test" }));
    await POST(req({ events: [{ event: "home_view" }] }, { "user-agent": "Googlebot" }));
    delete process.env.DEMAND_COUNTS;
    await POST(req({ events: [{ event: "home_view" }] }));
    expect(fetchMock).not.toHaveBeenCalled();
    process.env.NEXT_PUBLIC_SITE_STAGE = "live";
    await POST(req({ events: [{ event: "home_view" }] }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("stays quiet when Porter is down or the body is bad", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    expect((await POST(req({ events: [{ event: "home_view" }] }))).status).toBe(204);
    expect((await POST(req("not json"))).status).toBe(204);
    expect((await POST(req("x".repeat(3000)))).status).toBe(204);
  });
});
