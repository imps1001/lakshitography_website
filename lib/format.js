// Price formatting shared by the site, the admin panel and the API.

export function formatPrice(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function priceRange(service) {
  if (service?.price_min == null) return "";
  return service.price_max ? `${formatPrice(service.price_min)} – ${formatPrice(service.price_max)}` : formatPrice(service.price_min);
}

// Compact form for badges: 6500 → "₹6.5k", 8000 → "₹8k".
export function shortPrice(amount) {
  if (amount == null) return "";
  return amount >= 1000 ? `₹${Number((amount / 1000).toFixed(1))}k` : `₹${amount}`;
}

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

export function countWord(n) {
  return NUMBER_WORDS[n] || String(n);
}
