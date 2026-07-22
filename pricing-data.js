// =====================================================================
//  JCS PRICING — the single source of truth for public pricing.
//  Powers BOTH the booking form (/book) and the pricing page (/pricing).
//
//  ⚠️⚠️ PLACEHOLDER NUMBERS ⚠️⚠️
//  Every dollar figure below was seeded from the reference site while
//  building the pages and MUST be replaced with Jacob's real 2026 JCS
//  rates before this goes live. Edit the numbers only — the structure
//  (7 square-footage tiers per service) stays.
//
//  HOW PRICING WORKS
//  - Each service has `tiers`: 7 prices for 0–2,000 / 2,001–3,000 /
//    3,001–4,000 / 4,001–5,000 / 5,001–6,000 / 6,001–7,000 /
//    7,001–8,000 sqft. Above 8,000 sqft → "please inquire".
//  - `addons` hang off the service they elevate. `unit` add-ons (e.g.
//    per image) are shown but excluded from the estimated total.
//  - `quote: true` services show "Let's talk" instead of a price.
// =====================================================================

(function () {
  var TIER_STEPS = [2000, 3000, 4000, 5000, 6000, 7000, 8000];
  var TIER_LABELS = [
    "0 – 2,000 sqft", "2,001 – 3,000 sqft", "3,001 – 4,000 sqft",
    "4,001 – 5,000 sqft", "5,001 – 6,000 sqft", "6,001 – 7,000 sqft",
    "7,001 – 8,000 sqft"
  ];

  var SERVICES = [
    {
      key: "photography",
      name: "Photography",
      desc: "Editorial, magazine-quality stills — flash-and-ambient frames hand-blended for a true luxury look. Aerial drone included.",
      includes: "Edited high-res images · Aerial drone · Web & print-ready",
      tiers: [800, 950, 1200, 1350, 1500, 1650, 1800],
      addons: [
        { name: "Twilight Photography", price: 350 },
        { name: "Verticals / Vignettes", price: 350 },
        { name: "Virtual Twilight (AI)", price: 150 },
        { name: "Virtual Staging", price: 50, unit: "image" },
        { name: "Lifestyle Elements", price: 250 }
      ]
    },
    {
      key: "film",
      name: "Cinematic Listing Film",
      desc: "A full cinematic property film — complete coverage, detail footage, drone, sound design, and world-class editing.",
      includes: "Aerial drone · Sound design · Branded + unbranded cuts",
      tiers: [1800, 1950, 2100, 2250, 2400, 2550, 2700],
      addons: [
        { name: "Twilight / Day-to-Night", price: 350 },
        { name: "Vertical Reel Crop", price: 200 },
        { name: "Agent On-Camera", price: 150 },
        { name: "Reel Script", price: 100 }
      ]
    },
    {
      key: "reel",
      name: "Social Reel",
      desc: "A vertical, scroll-stopping walkthrough reel of the listing — crafted for Instagram and social-first marketing. No agent on-camera.",
      includes: "Aerial drone · Agent branding · Vertical 60–90s edit",
      tiers: [800, 1000, 1200, 1400, 1600, 1800, 2000],
      addons: [
        { name: "Twilight Video", price: 350 },
        { name: "Agent On-Camera", price: 150 },
        { name: "Reel Script", price: 100 }
      ]
    },
    {
      key: "reel-luxury",
      name: "Luxury Social Reel",
      desc: "The cinematic version — agent on-camera, lifestyle elements, and an elevated edit built to stop the scroll.",
      includes: "Agent on-camera · Lifestyle elements · Cinematic edit",
      tiers: [2000, 2200, 2400, 2600, 2800, 3000, 3200],
      addons: [
        { name: "Twilight Video", price: 350 },
        { name: "Reel Script", price: 100 }
      ]
    },
    {
      key: "design",
      name: "Design & Property Websites",
      desc: "Bespoke listing collateral — single-property websites, brochures, and print. Designed to match the caliber of the home.",
      includes: "Custom scope · Quoted per project",
      quote: true,
      addons: []
    },
    {
      key: "custom",
      name: "Something Else",
      desc: "Not a standard listing shoot? Select this and tell me what you have in mind.",
      includes: "",
      quote: true,
      addons: []
    }
  ];

  // Extras — offered on every shoot regardless of the services chosen.
  var EXTRAS = [
    { name: "2D Floor Plan", price: 100, note: "$200 for homes over 5,000 sqft", bigPrice: 200, bigAt: 5000 },
    { name: "Zillow 3D Tour", tiers: [300, 400, 500, 600, 700, 800, 900] }
  ];

  // Stand-alone / à la carte (pricing page only).
  var ALACARTE = [
    { name: "Exterior Photography only", price: 350 },
    { name: "Aerial Drone Photography only", price: 250 },
    { name: "2D Floor Plan", price: 100 },
    { name: "2D Floor Plan (5,000 sqft +)", price: 200 }
  ];

  // sqft → tier index (0–6), or -1 when above the cap (inquire).
  function tierIndex(sqft) {
    var n = Number(sqft) || 0;
    if (n > TIER_STEPS[TIER_STEPS.length - 1]) return -1;
    for (var i = 0; i < TIER_STEPS.length; i++) if (n <= TIER_STEPS[i]) return i;
    return -1;
  }

  // Price of a tiered thing at a given sqft. null → inquire.
  function priceAt(tiers, sqft) {
    var i = tierIndex(sqft);
    return i === -1 ? null : tiers[i];
  }

  window.JCS_PRICING = {
    year: "2026",
    turnaround: "2–4 days",
    sqftCap: 8000,
    tierLabels: TIER_LABELS,
    services: SERVICES,
    extras: EXTRAS,
    alacarte: ALACARTE,
    tierIndex: tierIndex,
    priceAt: priceAt
  };
})();
