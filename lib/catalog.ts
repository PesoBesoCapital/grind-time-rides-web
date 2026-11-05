// What Grind Time offers. Keys must match the values Porter accepts
// (porter_quote_requests.service / event_type in migration 202611050003).

export const SERVICES = [
  { key: "party_bus", cta: "Request a party bus", name: "Party buses", line: "Mini, standard and premium buses for birthdays, proms, weddings and nights out." },
  { key: "limousine", cta: "Request a limousine", name: "Stretch limousines", line: "The classic arrival for weddings, anniversaries and big nights." },
  { key: "suv_sedan", cta: "Request an SUV or sedan", name: "Luxury SUVs and sedans", line: "Airport runs, corporate travel and smaller groups." },
  { key: "dj", cta: "Book a DJ", name: "DJ service", line: "Music for weddings, birthdays, corporate events and private parties." },
  { key: "valet", cta: "Book valet attendants", name: "Valet parking", line: "Attendants for weddings, restaurants, hotels and private events." },
  { key: "custom_build", cta: "Ask about a custom build", name: "Custom builds", line: "Coach builds, conversions and fleet vehicles for sale." },
] as const;

// The fleet as listed by Grind Time. Capacities and photos come from Ryan before launch.
export const FLEET = [
  { key: "suv_sedan", name: "Luxury SUVs", bestFor: "Airport transfers, executives, small wedding parties" },
  { key: "limousine", name: "Stretch limousines", bestFor: "Weddings, anniversaries, prom" },
  { key: "limo_sprinter", name: "Limo Sprinters", bestFor: "Mid-size groups who want a limo interior with headroom" },
  { key: "stretch_hummer", name: "Stretch Hummers", bestFor: "Making an entrance: birthdays, bachelor and bachelorette parties" },
  { key: "party_bus", name: "Mini party bus", bestFor: "Smaller celebrations that still want the party-bus feel" },
  { key: "party_bus", name: "Standard party bus", bestFor: "Birthdays, homecoming, concerts and nights out" },
  { key: "party_bus", name: "Premium party bus", bestFor: "Weddings and big groups who want the full setup" },
  { key: "trolley", name: "Trolleys", bestFor: "Wedding guest shuttles and city tours" },
  { key: "motor_coach", name: "Motor coaches", bestFor: "Large groups, corporate outings and long-distance trips" },
] as const;

export const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: "party_bus", label: "Party bus" },
  { value: "limousine", label: "Stretch limousine" },
  { value: "suv_sedan", label: "Luxury SUV or sedan" },
  { value: "limo_sprinter", label: "Limo Sprinter" },
  { value: "stretch_hummer", label: "Stretch Hummer" },
  { value: "trolley", label: "Trolley" },
  { value: "motor_coach", label: "Motor coach" },
  { value: "dj", label: "DJ service" },
  { value: "valet", label: "Valet parking" },
  { value: "custom_build", label: "Custom build" },
  { value: "not_sure", label: "Not sure yet, help me choose" },
];

export const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "prom_homecoming", label: "Prom or homecoming" },
  { value: "birthday", label: "Birthday" },
  { value: "quinceanera", label: "Quinceañera" },
  { value: "bachelor_bachelorette", label: "Bachelor or bachelorette" },
  { value: "night_out", label: "Night out" },
  { value: "concert_sports", label: "Concert or game" },
  { value: "corporate", label: "Corporate" },
  { value: "airport", label: "Airport transfer" },
  { value: "funeral", label: "Funeral" },
  { value: "other", label: "Something else" },
];

export const SERVICE_KEYS = SERVICE_OPTIONS.map((o) => o.value);
export const EVENT_KEYS = EVENT_OPTIONS.map((o) => o.value);
