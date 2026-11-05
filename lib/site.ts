// Public business details (as published on grindtimerides.com) and deployment stage.
export const BUSINESS = {
  name: "Grind Time Enterprise",
  shortName: "Grind Time Rides",
  tagline: "People | Places | Purpose",
  phoneDisplay: "(224) 600-4550",
  phoneE164: "+12246004550",
  email: "ramgtenterprise@gmail.com",
  area: "Chicago and Chicagoland",
};

/** "live" only after Ryan signs off. Anything else is a preview: noindex + banner. */
export const isLive = () => process.env.NEXT_PUBLIC_SITE_STAGE === "live";

/** Ryan's booking system. Every quote request goes into his Moovs account (Premium plan). */
export const MOOVS = {
  origin: "https://customer.moovs.app",
  requestUrl: "https://customer.moovs.app/grind-time-enterprise/request/new",
  iframeUrl: "https://customer.moovs.app/grind-time-enterprise/iframe",
};

/**
 * Where "Get a quote" sends people. "moovs" (default): Ryan's Moovs request form, so requests land
 * in his Moovs NEW tab. "porter": the site's own form posting to Porter (kept for later; off by default).
 * Read at request time, so it can be switched in Vercel without a rebuild.
 */
export const quoteMode = (): "moovs" | "porter" => (process.env.QUOTE_MODE === "porter" ? "porter" : "moovs");
