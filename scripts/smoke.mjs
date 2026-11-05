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
  env: { ...process.env, QUOTE_MODE: "porter", DEMAND_COUNTS: "on", PORTER_SUPABASE_URL: PORTER, PORTER_SUPABASE_ANON_KEY: "anon", PORTER_INTAKE_SOURCE: "grindtimerides-web", PORTER_INTAKE_TOKEN: "smoke-token" },
  stdio: ["ignore", "pipe", "pipe"],
});
const BASE = `http://localhost:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const quoteCalls = () => received.filter((r) => r.url === "/rest/v1/rpc/porter_intake_quote_request");
const demandCalls = () => received.filter((r) => r.url === "/rest/v1/rpc/porter_record_site_demand");
const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };
const browser = await chromium.launch();
try {
  const head = await fetch(BASE);
  check(head.headers.get("x-robots-tag")?.includes("noindex"), "preview must send X-Robots-Tag noindex");
  check((await (await fetch(BASE + "/robots.txt")).text()).includes("Disallow: /"), "preview robots.txt must disallow");
  const feed = await (await fetch(BASE + "/experiences.json")).json();
  check(feed.experiences?.length === 9 && feed.status.startsWith("draft") && feed.experiences.every((e) => e.adBrief?.hooks?.length), "experiences.json feed for ad agents");

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
    const before = quoteCalls().length;
    await page.getByRole("button", { name: "Request my quote" }).click();
    await page.getByText("Check the highlighted fields.").waitFor();
    check(await page.getByText("Choose a vehicle or service.").isVisible(), `${label}: missing service error`);
    check(await page.getByText("We need your OK").isVisible(), `${label}: missing consent error`);
    check(quoteCalls().length === before, `${label}: invalid form reached Porter`);

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

    const sent = quoteCalls().at(-1);
    check(sent.url === "/rest/v1/rpc/porter_intake_quote_request", `${label}: wrong Porter endpoint ${sent.url}`);
    check(sent.body.p_token === "smoke-token" && sent.headers.apikey === "anon", `${label}: credentials not sent server-side`);
    check(sent.body.p_payload.contact_phone === "+12245550100", `${label}: phone not normalised`);
    check(sent.body.p_payload.event_type === "wedding" && sent.body.p_payload.passengers === "14", `${label}: prefilled values not sent`);
    check(/^[0-9a-f-]{36}$/.test(sent.body.p_idempotency_key), `${label}: idempotency key missing`);
    const html = await page.content();
    check(!html.includes("smoke-token"), `${label}: token leaked into the page`);
    check(!errors.length, `${label}: console/page errors: ${errors.join(" | ")}`);
    // Experience journey: catalogue -> detail -> quote with the experience, add-ons and a friend's referral code.
    await page.goto(BASE + "/experiences");
    check((await page.locator(".exp-row").count()) === 9, `${label}: 9 experiences listed`);
    check((await over()) <= 1, `${label}: experiences page overflows sideways`);
    await page.getByRole("link", { name: /Quince Royal/ }).click();
    await page.getByRole("heading", { level: 1, name: "Quince Royal" }).waitFor();
    if (viewport.width > 1000) await page.screenshot({ path: "smoke-experience.png", fullPage: true });
    await page.getByRole("link", { name: "Request Quince Royal" }).click();
    await page.waitForURL(/experience=quince-royal/);
    await page.goto(page.url() + "&ref=mari-7q2k");
    check(await page.locator(".picked-name", { hasText: "Quince Royal" }).isVisible(), `${label}: experience banner missing`);
    check((await page.getByLabel("Occasion", { exact: true }).inputValue()) === "quinceanera", `${label}: occasion not prefilled from experience`);
    check((await page.getByLabel(/Referral code/).inputValue()) === "MARI7Q2K", `${label}: referral code not prefilled`);
    await page.getByLabel(/Red carpet arrival/).check();
    await page.getByLabel(/Decor in your colors/).check();
    const d2 = new Date(); d2.setDate(d2.getDate() + 120);
    await page.getByLabel("Date", { exact: true }).fill(d2.toISOString().slice(0, 10));
    await page.getByLabel("Your name").fill("Sofia Test");
    await page.getByLabel("Phone").fill("312-555-0142");
    await page.getByLabel(/I agree that Grind Time/).check();
    if (viewport.width > 1000) await page.screenshot({ path: "smoke-quote-experience.png", fullPage: true });
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Request my quote" }).click();
    await page.getByText("GT-261205-SMOKE").waitFor();
    const sent2 = quoteCalls().at(-1).body.p_payload;
    check(sent2.package_key === "quince-royal" && sent2.referral_code === "MARI7Q2K" && sent2.event_type === "quinceanera", `${label}: experience/referral not sent: ${JSON.stringify(sent2)}`);
    check(JSON.stringify(sent2.add_ons) === JSON.stringify(["red_carpet", "decor"]), `${label}: add-ons not sent: ${JSON.stringify(sent2.add_ons)}`);
    console.log(`ok  ${label}: home, prefill, validation, submit -> Porter`);
    console.log(`ok  ${label}: experiences -> Quince Royal -> quote with add-ons and referral -> Porter`);
    // Anonymous demand counts: what reached Porter, and nothing personal in it.
    await page.waitForTimeout(800);
    const counted = demandCalls().flatMap((r) => r.body.p_events.map((e) => e.event + ":" + (e.package_key ?? "")));
    for (const want of ["home_view:", "experience_view:quince-royal", "quote_open:quince-royal", "referral_arrival:", "quote_open:"]) {
      check(counted.includes(want), `${label}: demand count ${want} missing (got ${counted.join(", ")})`);
    }
    const demandText = JSON.stringify(demandCalls().map((r) => r.body));
    check(!/MARI|Sofia|555|Mozilla|cookie/i.test(demandText.replace(/"p_token":"smoke-token"/g, "")), `${label}: demand counts must be anonymous: ${demandText}`);
    check(demandCalls().every((r) => r.body.p_token === "smoke-token" && !("p_payload" in r.body)), `${label}: demand call shape`);
    console.log(`ok  ${label}: anonymous demand counts (home, experience, quote page, referral visit) -> Porter`);
    await page.close();
  }
  // ---- Moovs mode (the default): /quote embeds Ryan's Moovs request form ----
  app.kill();
  const PORT2 = 3918, BASE2 = `http://localhost:${PORT2}`;
  const app2 = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT2)], { env: { ...process.env, QUOTE_MODE: "", DEMAND_COUNTS: "", PORTER_SUPABASE_URL: PORTER, PORTER_SUPABASE_ANON_KEY: "anon", PORTER_INTAKE_SOURCE: "grindtimerides-web", PORTER_INTAKE_TOKEN: "smoke-token" }, stdio: "ignore" });
  const demandBefore = demandCalls().length;
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE2)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }
    const csp = (await fetch(BASE2 + "/quote")).headers.get("content-security-policy") ?? "";
    check(csp.includes("frame-src https://customer.moovs.app") && csp.includes("frame-ancestors 'none'"), "CSP must allow exactly the Moovs frame");
    for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
      const label = `moovs @ ${viewport.width}px`;
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      let framed = false;
      await page.route("https://customer.moovs.app/**", (route) => { framed = true; return route.fulfill({ status: 200, contentType: "text/html", body: "<html><body><h1>Moovs request form (stand-in)</h1></body></html>" }); });
      await page.goto(BASE2 + "/experiences/quince-royal");
      await page.getByRole("link", { name: "Request Quince Royal" }).click();
      await page.waitForURL(/experience=quince-royal/);
      await page.goto(page.url() + "&ref=mari-7q2k");
      const frame = page.locator("iframe.moovs-frame");
      await frame.waitFor();
      check((await frame.getAttribute("src")) === "https://customer.moovs.app/grind-time-enterprise/iframe", `${label}: iframe src`);
      await page.frameLocator("iframe.moovs-frame").getByText("Moovs request form (stand-in)").waitFor();
      check(framed, `${label}: Moovs frame never requested`);
      check((await page.locator("#handoff-note").textContent()) === "Experience: Quince Royal · Referral code: MARI7Q2K", `${label}: handoff note`);
      check((await page.getByRole("link", { name: "Open the booking form in a new tab" }).getAttribute("href")) === "https://customer.moovs.app/grind-time-enterprise/request/new", `${label}: fallback link`);
      check((await page.locator("form.ticket-form").count()) === 0, `${label}: Porter form must be off in Moovs mode`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${label}: sideways overflow`);
      check(!errors.length, `${label}: errors: ${errors.join(" | ")}`);
      await page.screenshot({ path: `smoke-moovs-${viewport.width}.png`, fullPage: false });
      console.log(`ok  ${label}: experience -> quote page embeds Ryan's Moovs form with the hand-off note`);
      await page.close();
    }
    await new Promise((r) => setTimeout(r, 800));
    check(demandCalls().length === demandBefore, "preview site (not live, DEMAND_COUNTS off) must not count visits");
    console.log("ok  preview traffic is not counted");
  } finally { app2.kill(); }
} finally {
  await browser.close();
  app.kill();
  porter.close();
}
if (failures.length) { console.error("SMOKE FAILURES:\n- " + failures.join("\n- ")); process.exit(1); }
console.log("== smoke passed");
