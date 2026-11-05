import { countingEnabled, isBot, parseDemand } from "@/lib/demand";
import { sendDemand } from "@/lib/porter";

// Always 204: the browser learns nothing, and counting problems never reach visitors.
const done = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  const origin = req.headers.get("origin"), host = req.headers.get("host");
  if (!origin || !host) return done();
  try { if (new URL(origin).host !== host) return done(); } catch { return done(); }
  if (!countingEnabled() || isBot(req.headers.get("user-agent"))) return done();
  const text = await req.text().catch(() => "");
  if (text.length > 2000) return done();
  let raw: unknown = null;
  try { raw = JSON.parse(text); } catch { return done(); }
  const events = parseDemand(raw);
  if (events.length) await sendDemand(events);
  return done();
}
