// =====================================================================
//  JCS PRICING — the single source of truth for public pricing.
//  Powers BOTH the booking form (/book) and the pricing page (/pricing).
//
//  Rates confirmed by Jacob 2026-07-22 (JCS-Pricing sheet). To change a
//  price, edit the number here — never in the pages.
//
//  HOW PRICING WORKS
//  - `tiers`: 5 prices for 0–2,000 / 2,000–3,000 / 3,000–4,000 /
//    4,000–5,000 / 5,000+ sqft (top bracket is open-ended).
//  - Flat services/add-ons use `price`. `unit` add-ons (per image) are
//    shown but excluded from the estimated total.
//  - `quote: true` shows "Let's talk" instead of a price.
// =====================================================================

(function () {
  var TIER_STEPS = [2000, 3000, 4000, 5000, Infinity];
  var TIER_LABELS = [
    "0 – 2,000 sqft", "2,000 – 3,000 sqft", "3,000 – 4,000 sqft",
    "4,000 – 5,000 sqft", "5,000+ sqft"
  ];

  var SERVICES = [
    {
      key: "photography",
      name: "Flash / Ambient Photography",
      desc: "Editorial, magazine-quality stills — flash-and-ambient frames hand-blended for a true luxury look. Priced by property size.",
      includes: "Edited high-res images · Web & print-ready",
      tiers: [500, 750, 1000, 1250, 1500],
      addons: [
        { name: "Aerial Photography", price: 150, note: "Drone stills" },
        { name: "Vertical / Vignette Images", price: 200, note: "Social-crop set" },
        { name: "Twilight Photography", price: 250, note: "Golden-hour / dusk session" },
        { name: "Virtual Staging", price: 25, unit: "image" },
        { name: "Virtual Twilight", price: 25, unit: "image" }
      ]
    },
    {
      key: "film",
      name: "Cinematic Film",
      desc: "A horizontal listing film that tells the property's story — drone coverage, licensed music, and world-class editing.",
      includes: "Aerial drone · Licensed music · Branded + unbranded cuts",
      price: 950,
      addons: [
        { name: "Twilight Videography", price: 250, note: "Dusk film add-on" }
      ]
    },
    {
      key: "reel",
      name: "Social Reel",
      desc: "A vertical 9:16 reel of the listing, cut for Instagram and social-first marketing.",
      includes: "Vertical 60–90s edit · Social-ready",
      price: 950,
      addons: [
        { name: "Twilight Videography", price: 250, note: "Dusk film add-on" }
      ]
    },
    {
      key: "custom",
      name: "Something Else",
      desc: "Design work or something not listed? Select this and tell me what you have in mind.",
      includes: "",
      quote: true,
      addons: []
    }
  ];

  // Extras — offered on every shoot regardless of the services chosen.
  var EXTRAS = [
    { name: "Zillow 3D Tour", tiers: [250, 300, 350, 400, 500] },
    { name: "2D Floor Plan", price: 50, note: "Branded schematic" },
    { name: "Property Website", price: 350, note: "Single-listing site" }
  ];

  // Stand-alone / à la carte (pricing page only).
  var ALACARTE = [
    { name: "2D Floor Plan", price: 50 },
    { name: "Virtual Staging (per image)", price: 25 },
    { name: "Virtual Twilight (per image)", price: 25 },
    { name: "Property Website", price: 350 }
  ];

  // sqft → tier index (0–4). The top bracket is open-ended, so every
  // square footage resolves to a price (no "inquire" cap).
  function tierIndex(sqft) {
    var n = Number(sqft) || 0;
    for (var i = 0; i < TIER_STEPS.length; i++) if (n <= TIER_STEPS[i]) return i;
    return TIER_STEPS.length - 1;
  }

  // Price of a service/extra at a given sqft — flat `price` wins,
  // otherwise the sqft tier. null → quote.
  function priceAt(thing, sqft) {
    if (thing == null) return null;
    if (typeof thing.price === "number") return thing.price;
    var tiers = thing.tiers || thing;
    if (!tiers || !tiers.length) return null;
    return tiers[tierIndex(sqft)];
  }

  window.JCS_PRICING = {
    year: "2026",
    turnaround: "2–4 days",
    tierLabels: TIER_LABELS,
    services: SERVICES,
    extras: EXTRAS,
    alacarte: ALACARTE,
    tierIndex: tierIndex,
    priceAt: priceAt
  };
})();
