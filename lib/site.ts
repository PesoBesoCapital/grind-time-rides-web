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
