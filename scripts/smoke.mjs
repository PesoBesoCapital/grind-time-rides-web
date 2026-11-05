// End-to-end smoke test: built site + a fake Porter that records what it receives.
// Usage: npm run build && npm run smoke
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
const { chromium } = createRequire(import.meta.url)("playwright");

const received = [];
const porter = createServer((req, res) => {
  let data = "";
  req.on("data", (c) => (data += c));
  req.on("end", () => {
    received.push({ url: req.url, headers: req.headers, body: JSON.parse(data || "{}") });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, reference: "GT-261205-SMOKE", duplicate: received.length > 1 }));
  });
}).listen(0);
const PORTER = `http://127.0.0.1:${porter.address().port}`;
const PORT = 3917;
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
  env: { ...process.env, PORTER_SUPABASE_URL: PORTER, PORTER_SUPABASE_ANON_KEY: "anon", PORTER_INTAKE_SOURCE: "grindtimerides-web", PORTER_INTAKE_TOKEN: "smoke-token" },
  stdio: ["ignore", "pipe", "pipe"],
});
const BASE = `http://localhost:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };
const browser = await chromium.launch();
try {
  const head = await fetch(BASE);
  check(head.headers.get("x-robots-tag")?.includes("noindex"), "preview must send X-Robots-Tag noindex");
  check((await (await fetch(BASE + "/robots.txt")).text()).includes("Disallow: /"), "preview robots.txt must disallow");

  for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
    const label = `${viewport.width}px`;
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(BASE);
    await page.getByRole("heading", { level: 1 }).waitFor();
    const over = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check((await over()) <= 1, `${label}: home overflows sideways`);
    check(await page.getByText("Preview of the new Grind Time site").isVisible(), `${label}: preview banner missing`);
    check((await page.locator(".lineup li").count()) === 9, `${label}: fleet should list 9 vehicles`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `smoke-home-${viewport.width}.png`, fullPage: viewport.width > 1000 });

    // Hero trip ticket carries answers into the full form.
    await page.getByLabel("What's the occasion?").selectOption("wedding");
    await page.getByLabel("Guests").fill("14");
    await page.getByRole("button", { name: "Continue to quote" }).click();
    await page.waitForURL(/\/quote\?event=wedding&passengers=14/);
    check((await page.getByLabel("Occasion", { exact: true }).inputValue()) === "wedding", `${label}: occasion not prefilled`);
    check((await page.getByLabel(/Guests/).inputValue()) === "14", `${label}: guests not prefilled`);
    check((await over()) <= 1, `${label}: quote page overflows sideways`);

    // Empty submit shows field errors and sends nothing.
    const before = received.length;
    await page.getByRole("button", { name: "Request my quote" }).click();
    await page.getByText("Check the highlighted fields.").waitFor();
    check(await page.getByText("Choose a vehicle or service.").isVisible(), `${label}: missing service error`);
    check(await page.getByText("We need your OK").isVisible(), `${label}: missing consent error`);
    check(received.length === before, `${label}: invalid form reached Porter`);

    // Fill and send.
    const d = new Date(); d.setDate(d.getDate() + 45);
    await page.getByLabel("Vehicle or service").selectOption("limousine");
    await page.getByLabel("Date", { exact: true }).fill(d.toISOString().slice(0, 10));
    await page.getByLabel(/^Pickup location/).fill("Arlington Heights, IL");
    await page.getByLabel("Your name").fill("Smoke Test");
    await page.getByLabel("Phone").fill("(224) 555-0100");
    await page.getByLabel(/I agree that Grind Time/).check();
    if (viewport.width > 1000) await page.screenshot({ path: "smoke-quote-filled.png", fullPage: true });
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Request my quote" }).click();
    await page.getByText("GT-261205-SMOKE").waitFor();
    check(await page.getByText("Grind Time will text you").isVisible(), `${label}: confirmation should follow preferred contact`);
    if (viewport.width < 500) await page.screenshot({ path: "smoke-quote-done-390.png" });

    const sent = received.at(-1);
    check(sent.url === "/rest/v1/rpc/porter_intake_quote_request", `${label}: wrong Porter endpoint ${sent.url}`);
    check(sent.body.p_token === "smoke-token" && sent.headers.apikey === "anon", `${label}: credentials not sent server-side`);
    check(sent.body.p_payload.contact_phone === "+12245550100", `${label}: phone not normalised`);
    check(sent.body.p_payload.event_type === "wedding" && sent.body.p_payload.passengers === "14", `${label}: prefilled values not sent`);
    check(/^[0-9a-f-]{36}$/.test(sent.body.p_idempotency_key), `${label}: idempotency key missing`);
    const html = await page.content();
    check(!html.includes("smoke-token"), `${label}: token leaked into the page`);
    check(!errors.length, `${label}: console/page errors: ${errors.join(" | ")}`);
    console.log(`ok  ${label}: home, prefill, validation, submit -> Porter`);
    await page.close();
  }
} finally {
  await browser.close();
  app.kill();
  porter.close();
}
if (failures.length) { console.error("SMOKE FAILURES:\n- " + failures.join("\n- ")); process.exit(1); }
console.log("== smoke passed");
