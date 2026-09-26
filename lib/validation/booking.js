// Booking form rules, shared by the browser (instant feedback) and the API (the real gatekeeper),
// so both always agree. Everything here must stay free of server-only imports.

export const LIMITS = {
  name: 80,
  email: 254,
  location: 120,
  message: 1000,
  peopleMin: 1,
  peopleMax: 200,
  dateMonthsAhead: 18,
};

export const FIELD_ORDER = ["service", "name", "email", "phone", "preferred_date", "people_count", "location", "message"];

const str = (value) => (typeof value === "string" ? value : value == null ? "" : String(value));

// ---------- Name ----------
export function checkName(raw) {
  const name = str(raw).replace(/\s+/g, " ").trim();
  if (!name) return { error: "Please tell me your name." };
  if (name.length < 2) return { error: "Name looks too short." };
  if (name.length > LIMITS.name) return { error: `Please keep your name under ${LIMITS.name} characters.` };
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(name)) return { error: "Use letters only — spaces, dots, apostrophes and hyphens are fine." };
  return { value: name };
}

// ---------- Email ----------
const EMAIL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const DOMAIN_TYPOS = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com",
  "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmaill.com": "gmail.com", "gnail.com": "gmail.com", "gmail.in": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com", "outlook.con": "outlook.com", "iclod.com": "icloud.com", "icloud.con": "icloud.com",
  "rediffmail.con": "rediffmail.com", "redifmail.com": "rediffmail.com",
};

export function checkEmail(raw) {
  const email = str(raw).trim().toLowerCase();
  if (!email) return { error: "Please add your email so I can reply." };
  if (email.length > LIMITS.email || !EMAIL_RE.test(email) || email.split("@")[0].length > 64) {
    return { error: "That email doesn't look right — e.g. name@gmail.com." };
  }
  const [local, domain] = email.split("@");
  const fix = DOMAIN_TYPOS[domain];
  return { value: email, suggestion: fix ? `${local}@${fix}` : null };
}

// ---------- Phone ----------
// Accepts Indian mobiles in any common format (98765 43210, +91-98765-43210, 09876543210) or an
// international number with a country code. Returns E.164 (+919876543210).
export function checkPhone(raw) {
  const input = str(raw).trim();
  if (!input) return { error: "Please add a phone number." };
  if (/[^\d\s()+.-]/.test(input) || (input.match(/\+/g) || []).length > 1 || input.indexOf("+") > 0) {
    return { error: "Use digits only (spaces, dashes and a leading + are fine)." };
  }
  let digits = input.replace(/\D/g, "");
  const international = input.startsWith("+") || input.startsWith("00");
  if (input.startsWith("00")) digits = digits.slice(2);

  const indian = (local) => {
    if (local.length !== 10) return { error: "Indian mobile numbers have 10 digits." };
    if (!/^[6-9]/.test(local)) return { error: "Indian mobile numbers start with 6, 7, 8 or 9." };
    if (/^(\d)\1{9}$/.test(local)) return { error: "Please enter your real mobile number." };
    return { value: `+91${local}` };
  };

  if (!international) {
    if (digits.length === 11 && digits.startsWith("0")) return indian(digits.slice(1));
    if (digits.length === 12 && digits.startsWith("91")) return indian(digits.slice(2));
    if (digits.length === 10) return indian(digits);
    return { error: "Enter a 10-digit mobile number, or add your country code (e.g. +44…)." };
  }
  if (digits.startsWith("91")) return indian(digits.slice(2));
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    return { error: "Enter a valid number with country code, e.g. +44 7911 123456." };
  }
  return { value: `+${digits}` };
}

export function formatPhone(e164) {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164 || "");
  return m ? `+91 ${m[1]} ${m[2]}` : e164 || "";
}

// ---------- Date ----------
// "Today" is measured in India time on both server and browser so the rules never disagree.
export function todayInIndia(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function latestBookableDate(today = todayInIndia()) {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + LIMITS.dateMonthsAhead, d));
  return date.toISOString().slice(0, 10);
}

export function checkDate(raw, today = todayInIndia()) {
  const value = str(raw).trim();
  if (!value) return { value: null }; // optional: "flexible"
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match && new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (!match || date.toISOString().slice(0, 10) !== value) return { error: "Please pick a valid date." };
  if (value < today) return { error: "That date has already passed — pick today or later." };
  if (value > latestBookableDate(today)) return { error: `I take bookings up to ${LIMITS.dateMonthsAhead} months ahead.` };
  return { value };
}

// ---------- People ----------
export function checkPeople(raw) {
  const value = str(raw).trim();
  if (!value) return { value: null };
  if (!/^\d+$/.test(value)) return { error: "Please enter a number, e.g. 4." };
  const n = Number(value);
  if (n < LIMITS.peopleMin) return { error: "At least 1 person, please!" };
  if (n > LIMITS.peopleMax) return { error: `For groups over ${LIMITS.peopleMax}, message me on WhatsApp.` };
  return { value: n };
}

// ---------- Free text ----------
function checkText(raw, { max, min = 0, label }) {
  const value = str(raw).replace(/\r\n/g, "\n").trim();
  if (!value) return { value: null };
  if (value.length < min) return { error: `${label} looks too short.` };
  if (value.length > max) return { error: `Please keep ${label.toLowerCase()} under ${max} characters.` };
  return { value };
}

export const checkLocation = (raw) => checkText(str(raw).replace(/\s+/g, " "), { max: LIMITS.location, min: 2, label: "Location" });
export const checkMessage = (raw) => checkText(raw, { max: LIMITS.message, label: "Your message" });

export function checkService(raw) {
  const value = str(raw).trim();
  return value && /^[a-z0-9-]{1,80}$/.test(value) ? { value } : { error: "Pick what we're shooting." };
}

const CHECKS = {
  service: checkService,
  name: checkName,
  email: checkEmail,
  phone: checkPhone,
  preferred_date: (v, today) => checkDate(v, today),
  people_count: checkPeople,
  location: checkLocation,
  message: checkMessage,
};

export function validateField(field, value, today) {
  return CHECKS[field] ? CHECKS[field](value, today) : { value };
}

// Validates the whole form. Returns normalized values and a { field: message } map of errors.
export function validateBooking(input, { today = todayInIndia() } = {}) {
  const values = {};
  const errors = {};
  for (const field of FIELD_ORDER) {
    const result = validateField(field, input?.[field], today);
    if (result.error) errors[field] = result.error;
    else values[field] = result.value;
  }
  if (values.message == null) values.message = "";
  return { values, errors, valid: Object.keys(errors).length === 0 };
}
