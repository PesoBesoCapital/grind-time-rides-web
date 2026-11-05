// Grind Time experiences: the bookable "nights" built from the fleet and services.
// DRAFT until Ryan approves each one (Project 4: commercial offerings need his sign-off).
// No prices, capacities or guarantees here: every detail is confirmed in the customer's quote.
// The adBrief fields feed the Cesar OS ad agents via /experiences.json.

export type Tier = "signature" | "celebration" | "fun";
export type AddOn = "red_carpet" | "photo_stop" | "decor" | "dj" | "valet" | "extra_hour";

export const ADD_ONS: { key: AddOn; label: string; line: string }[] = [
  { key: "red_carpet", label: "Red carpet arrival", line: "A carpet rolled out at the door for the big entrance." },
  { key: "photo_stop", label: "Photo stop", line: "A planned stop at a Chicago backdrop for pictures." },
  { key: "decor", label: "Decor in your colors", line: "Ribbons, balloons or signage to match your theme." },
  { key: "dj", label: "DJ", line: "Music for the party once you arrive." },
  { key: "valet", label: "Valet attendants", line: "Parking handled for your guests at the venue." },
  { key: "extra_hour", label: "Extra hour", line: "More time on the clock, so nobody has to rush." },
];

export type Experience = {
  slug: string;
  name: string;
  tier: Tier;
  tagline: string;
  forWho: string;
  includes: string[];
  goodToKnow: string[];
  vehicles: string[];          // fleet names shown to customers
  service: string;             // default service key for the quote form (lib/catalog.ts)
  event: string;               // default occasion key
  suggestedAddOns: AddOn[];
  adBrief: { audience: string; hooks: string[]; season: string; channels: string[]; avoid: string[] };
};

export const TIER_LABEL: Record<Tier, { name: string; line: string }> = {
  signature: { name: "Signature", line: "The full VIP treatment, planned to the minute." },
  celebration: { name: "Celebrations", line: "Milestones the whole family will remember." },
  fun: { name: "Just for fun", line: "Easy, loud and good value for the group." },
};

const COMMON_AVOID = ["Prices or discounts not approved by Ryan", "Claims about capacity or vehicle features not confirmed", "Fake urgency or invented reviews"];

export const EXPERIENCES: Experience[] = [
  {
    slug: "signature-night", name: "The Signature", tier: "signature",
    tagline: "A night that starts the moment the door opens.",
    forWho: "Anniversaries, proposals, galas and the nights you want to feel like a headliner.",
    includes: ["A chauffeur dressed for the occasion", "Door-to-door pickup and a planned route", "Time built in for the stops that matter"],
    goodToKnow: ["Tell us about a proposal or surprise: we'll keep it quiet.", "Every detail is confirmed in your quote."],
    vehicles: ["Stretch limousine", "Luxury SUV"], service: "limousine", event: "other",
    suggestedAddOns: ["red_carpet", "photo_stop", "extra_hour"],
    adBrief: { audience: "Couples 25-55 in Chicagoland planning an anniversary, proposal or gala night", hooks: ["The night starts before you arrive", "Planning a proposal? We'll drive the moment there", "Skip the parking. Make the entrance."], season: "Peaks around Valentine's Day, New Year's Eve and spring gala season", channels: ["Instagram", "TikTok", "Google Search"], avoid: COMMON_AVOID },
  },
  {
    slug: "wedding-day", name: "Wedding Day", tier: "signature",
    tagline: "Getaway car for the couple, smooth rides for everyone else.",
    forWho: "Couples who want the timeline handled: ceremony, photos, reception and the exit.",
    includes: ["A ride plan built around your wedding timeline", "Options for the couple, the wedding party and guest shuttles", "One contact for your planner or coordinator"],
    goodToKnow: ["Most couples book a few months ahead.", "Every detail is confirmed in your quote."],
    vehicles: ["Stretch limousine", "Limo Sprinter", "Trolley", "Premium party bus"], service: "limousine", event: "wedding",
    suggestedAddOns: ["red_carpet", "decor", "photo_stop", "valet"],
    adBrief: { audience: "Engaged couples and wedding planners in Chicagoland", hooks: ["One less thing on the wedding checklist", "From 'I do' to the reception, on time", "Guest shuttles so nobody drives after the toast"], season: "Weddings run May-October; couples book 3-9 months ahead, so ads run January-June", channels: ["Instagram", "Facebook", "Google Search", "Wedding planners"], avoid: COMMON_AVOID },
  },
  {
    slug: "airport-executive", name: "Airport & Executive", tier: "signature",
    tagline: "On time, quiet, and ready when you land.",
    forWho: "Executives, visiting clients and anyone who wants the airport run handled.",
    includes: ["Scheduled pickup at the curb or the door", "A clean, quiet ride to O'Hare, Midway or downtown", "Accounts for repeat business travel on request"],
    goodToKnow: ["Share your flight details in the quote and we'll plan around them."],
    vehicles: ["Luxury SUV", "Sedan"], service: "suv_sedan", event: "airport",
    suggestedAddOns: [],
    adBrief: { audience: "Business travellers, executive assistants and office managers in Chicagoland", hooks: ["Land. Walk out. Your ride is there.", "The airport run your clients will notice"], season: "Year-round, busier around trade shows at McCormick Place", channels: ["Google Search", "LinkedIn"], avoid: COMMON_AVOID },
  },
  {
    slug: "quince-royal", name: "Quince Royal", tier: "celebration",
    tagline: "Her day, from the church steps to the last dance.",
    forWho: "Families planning a quinceañera who want the quinceañera and her court to arrive together, in style.",
    includes: ["A ride for the quinceañera and a separate one for her court", "Church, photo session and salon in one plan", "Coordination with the family so nobody is left waiting"],
    goodToKnow: ["Families often book well ahead for spring and summer dates.", "Tell us her colors and we'll match the decor.", "Every detail is confirmed in your quote."],
    vehicles: ["Stretch limousine", "Stretch Hummer", "Premium party bus"], service: "limousine", event: "quinceanera",
    suggestedAddOns: ["decor", "red_carpet", "photo_stop", "dj"],
    adBrief: { audience: "Hispanic families in Chicagoland planning a daughter's quinceañera; parents and padrinos", hooks: ["Her entrance, her colors, her court", "From misa to the salon, everyone arrives together", "Una entrada que nunca va a olvidar"], season: "Year-round with a spring-summer peak; families plan 6-12 months ahead", channels: ["TikTok", "Instagram", "Facebook"], avoid: [...COMMON_AVOID, "Stereotypes; keep the focus on her and her family"] },
  },
  {
    slug: "prom-safe-ride", name: "Prom & Homecoming Safe Ride", tier: "celebration",
    tagline: "The big night for them. Peace of mind for you.",
    forWho: "Students and the parents who plan (and pay for) prom and homecoming.",
    includes: ["Pickup and drop-off times agreed with parents in writing", "One group, one vehicle, one plan", "Photo stop before the dance"],
    goodToKnow: ["Alcohol-free rides for under-21 groups.", "Parents can be the contact on the booking."],
    vehicles: ["Stretch limousine", "Limo Sprinter", "Mini party bus", "Standard party bus"], service: "party_bus", event: "prom_homecoming",
    suggestedAddOns: ["photo_stop", "red_carpet"],
    adBrief: { audience: "Parents of high-school juniors and seniors in Chicagoland suburbs; students as secondary", hooks: ["Prom night, parent-approved", "Pickup and drop-off in writing, before the night", "Split one ride with the whole group"], season: "Prom April-May (ads February-April); homecoming September-October (ads August-September)", channels: ["Facebook", "Instagram", "TikTok"], avoid: [...COMMON_AVOID, "Anything that suggests drinking or partying for minors"] },
  },
  {
    slug: "birthday-bash", name: "Birthday Bash", tier: "fun",
    tagline: "The party starts at pickup.",
    forWho: "Milestone birthdays: 16, 21, 30, 40 and every one worth celebrating.",
    includes: ["A party bus with room to move", "Your playlist, your stops", "Door-to-door so the group stays together"],
    goodToKnow: ["Under-21 groups ride alcohol-free.", "Every detail is confirmed in your quote."],
    vehicles: ["Mini party bus", "Standard party bus", "Premium party bus", "Stretch Hummer"], service: "party_bus", event: "birthday",
    suggestedAddOns: ["decor", "photo_stop", "extra_hour"],
    adBrief: { audience: "Friends and partners planning a milestone birthday (21, 30, 40) in Chicagoland", hooks: ["Your birthday deserves a bigger ride", "Everyone in one place, from the first stop to the last", "The group chat already agreed"], season: "Year-round; summer and holiday weekends book first", channels: ["TikTok", "Instagram"], avoid: COMMON_AVOID },
  },
  {
    slug: "bachelor-bachelorette", name: "Bachelor & Bachelorette", tier: "fun",
    tagline: "One last night out, nobody driving.",
    forWho: "The wedding party planning the send-off.",
    includes: ["A bus or limo for the whole crew", "Multiple stops across the city", "Pickup and drop-off at the hotel or Airbnb"],
    goodToKnow: ["Share the plan in the quote and we'll map the route."],
    vehicles: ["Standard party bus", "Premium party bus", "Limo Sprinter", "Stretch Hummer"], service: "party_bus", event: "bachelor_bachelorette",
    suggestedAddOns: ["decor", "photo_stop", "extra_hour"],
    adBrief: { audience: "Maids of honor, best men and wedding parties planning a Chicago night out", hooks: ["The send-off, sorted", "One ride, every stop, no designated driver"], season: "Spring and summer, ahead of wedding season", channels: ["TikTok", "Instagram"], avoid: COMMON_AVOID },
  },
  {
    slug: "night-out", name: "Night Out", tier: "fun",
    tagline: "Round up the group. We'll handle the driving.",
    forWho: "Friends, coworkers and holiday parties heading out on the town.",
    includes: ["A party bus or Sprinter for the group", "As many stops as the night needs", "Everyone home safe at the end"],
    goodToKnow: ["Holiday party season books up early."],
    vehicles: ["Limo Sprinter", "Mini party bus", "Standard party bus", "Trolley"], service: "party_bus", event: "night_out",
    suggestedAddOns: ["extra_hour", "dj"],
    adBrief: { audience: "Groups of friends and office party planners in Chicagoland", hooks: ["Nobody has to be the designated driver", "Holiday party? Get everyone there and back"], season: "Year-round; office holiday parties November-December", channels: ["Instagram", "TikTok", "Facebook"], avoid: COMMON_AVOID },
  },
  {
    slug: "game-day", name: "Game Day & Concerts", tier: "fun",
    tagline: "Skip the parking. Keep the tailgate.",
    forWho: "Fans heading to Soldier Field, Wrigley, the United Center or a big show.",
    includes: ["Group pickup from one spot", "Drop-off close to the gate", "A ride home when it's over"],
    goodToKnow: ["Tell us the event and start time; we'll plan around traffic."],
    vehicles: ["Standard party bus", "Trolley", "Motor coach", "Limo Sprinter"], service: "party_bus", event: "concert_sports",
    suggestedAddOns: ["extra_hour"],
    adBrief: { audience: "Groups of fans and corporate outings going to Chicago games and concerts", hooks: ["Skip the stadium parking lines", "The tailgate rides with you"], season: "Bears September-January, Cubs and Sox April-September, concerts all summer", channels: ["TikTok", "Instagram", "Facebook"], avoid: [...COMMON_AVOID, "Team or venue logos, or implying an official partnership"] },
  },
];

export const EXPERIENCE_KEYS = EXPERIENCES.map((e) => e.slug);
export const findExperience = (slug: string) => EXPERIENCES.find((e) => e.slug === slug);
