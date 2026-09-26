// Seed data only. Services, categories and photos are managed from the admin panel and stored
// in MongoDB (photos on Cloudinary); these defaults are written the first time the site runs.

export const DEFAULT_SERVICES = [
  {
    slug: "couple-lifestyle",
    category: "Couples", // default category whose hero image the service card shows
    name: "Couple Lifestyle Shoot",
    tag: "Couples",
    duration: "60–90 mins",
    photos: "20–30 edited photos",
    price_min: 6500,
    price_max: 9500,
    people: "Just the two of you",
    add_on: "Optional 30-sec reel add-on",
    blurb:
      "Slow mornings, soft sunlight, quiet glances. A relaxed walk-through of the way you two actually exist together.",
  },
  {
    slug: "family-portraits",
    category: "Families",
    name: "Family Portraits",
    tag: "Families",
    duration: "75–120 mins",
    photos: "30–45 edited photos",
    price_min: 8500,
    price_max: 12500,
    people: "Small families (up to 6)",
    add_on: "Optional family video story",
    blurb:
      "Real laughter, real chaos, the kind of family photos you'll actually frame — not the stiff studio kind.",
  },
  {
    slug: "kids-birthday",
    category: "Kids",
    name: "Kids' Birthday at Home",
    tag: "Birthdays",
    duration: "2–3 hours",
    photos: "40–60 edited photos",
    price_min: 9500,
    price_max: 14000,
    people: "Up to 25 close guests",
    add_on: "Highlight reel add-on",
    blurb:
      "Tiny hands on cake, the candle moment, that one cousin crying — birthdays exactly as they happen.",
  },
  {
    slug: "anniversary",
    category: "Anniversary",
    name: "Intimate Anniversary",
    tag: "Anniversary",
    duration: "90–120 mins",
    photos: "30–40 edited photos",
    price_min: 8000,
    price_max: 11500,
    people: "Couple + close family",
    add_on: "Optional cinematic clip",
    blurb:
      "A return to where it began, or simply the home you've built. Quiet, romantic, unhurried.",
  },
  {
    slug: "kitty-gathering",
    category: "Gatherings",
    name: "Kitty Party / Close Gathering",
    tag: "Gatherings",
    duration: "2 hours",
    photos: "35–50 edited photos",
    price_min: 7500,
    price_max: 10500,
    people: "Up to 15 friends",
    add_on: "Group portrait set",
    blurb:
      "The afternoon stretches. Tea, laughter, gossip — captured without interrupting a single moment.",
  },
];

export const DEFAULT_CATEGORIES = ["Couples", "Families", "Kids", "Anniversary", "Gatherings"];

export const WHATSAPP_NUMBER = "919794747454";
