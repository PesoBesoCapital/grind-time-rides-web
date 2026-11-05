# Grind Time Rides — website (Porter × Cesar OS, Project PORTER-002)

Customer site for Grind Time Enterprise: browse the fleet and services, request a quote.
Quote requests go **server-side** to the Porter ops app (Project 001), where Cesar and Ryan follow up.

**Status: preview.** Not live. Every page sends `noindex` and shows a preview banner until
`NEXT_PUBLIC_SITE_STAGE=live` is set, which happens only after Ryan approves the launch.

## Where quote requests go
**Default: Ryan's Moovs account** (Premium). `/quote` embeds his Moovs request form
(`customer.moovs.app/grind-time-enterprise`), so every request lands in his Moovs **NEW** tab, where he prices,
books and gets paid. When the visitor came from an experience page or a referral link, a short note above the
form ("Experience: Quince Royal · Referral code: MARI7Q2K") asks them to paste it into the Moovs notes, so the
booking can be tied back later. Moovs stays the system of record; Porter is the growth layer on top.

Set `QUOTE_MODE=porter` (server env, no rebuild) to use the site's own form posting to Porter instead. Off by default.

## How the Porter form works (QUOTE_MODE=porter)
1. The customer fills the trip ticket at `/quote`. The form validates as they go.
2. `POST /api/quote` (server): same-origin check, hidden-field and too-fast spam traps, full
   validation, then a call to Porter's `porter_intake_quote_request` with a secret intake token.
3. Porter stores it once (idempotency key = one per filled-in form, so retries and double-clicks
   can't duplicate), sets a same-day follow-up, and shows it in **Quote requests**.
4. The customer sees a reference like `GT-261205-AB12C`. Nothing is sent to them automatically.

## Setup (Vercel environment variables, server-only)
| Name | Value |
|---|---|
| `PORTER_SUPABASE_URL` | `https://gleqwdrhhrzclujjatlf.supabase.co` |
| `PORTER_SUPABASE_ANON_KEY` | Porter's anon/publishable key |
| `PORTER_INTAKE_SOURCE` | `grindtimerides-web` |
| `PORTER_INTAKE_TOKEN` | Issued once in Porter: `select porter_admin_create_intake_source('grindtimerides-web','PORTER-002');` |
| `NEXT_PUBLIC_SITE_STAGE` | `preview` (or `live` after Ryan's sign-off) |

Without the Porter variables the form still renders and tells customers to call or text instead.

## Develop
```bash
npm install
npm run dev            # http://localhost:3000
npm test               # validation + API route (Porter mocked)
npm run build && npm run smoke   # full journey in a real browser against a fake Porter
```

## Experiences (draft until Ryan approves each one)
`lib/experiences.ts` is the single source for the experience pages (`/experiences`, `/experiences/<slug>`),
the quote form (experience banner, add-ons) and **`/experiences.json`**: the brief feed for the Cesar OS ad agents
(audience, hooks, booking season, channels, what ads must avoid). Tiers: **Signature** (VIP night, wedding day,
airport & executive), **Celebrations** (Quince Royal, prom & homecoming safe ride), **Just for fun** (birthday bash,
bachelor & bachelorette, night out, game day & concerts). No prices, capacities or reviews anywhere.

Referral links: `/quote?ref=CODE` pre-fills a customer's referral code; Porter credits the referrer.

## Before launch (needs Ryan)
- GTR monogram file (the header uses a text placeholder), vehicle photos, and capacities per vehicle.
- Verified reviews only, with the "$10 off for a review" wording checked: discounts can't depend on the review being positive.
- Approve each experience, its wording and the ad angles in `/experiences.json`; decide if referrals earn a reward.
- Approve every line of copy. Then point grindtimerides.com to Vercel, keeping the old site as a rollback for 30 days.
