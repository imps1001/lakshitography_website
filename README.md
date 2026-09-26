# Lakshitography

Portfolio and booking site for Lakshitography. One Next.js app serves the public site, the admin
panel (`/admin`) and the API (`/api/*`). Data lives in MongoDB; photos live on Cloudinary.

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URL` | yes | MongoDB connection string (Atlas `mongodb+srv://…` in production) |
| `DB_NAME` | yes | e.g. `lakshitography` |
| `JWT_SECRET` | yes | long random string — `openssl rand -hex 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes | admin login; password must be 8+ characters. The account is created (or its password updated) on first use |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | yes | photo storage |
| `SMTP_USER` / `SMTP_PASS` | for emails | Gmail address + App Password; without them bookings still save, but no emails are sent |
| `NOTIFY_EMAIL` | no | where booking alerts go (defaults to `ADMIN_EMAIL`) |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `SEND_CUSTOMER_CONFIRMATION` | no | see `.env.example` |

On first run the app seeds default categories and services and migrates older data automatically.

## Deploying to Vercel

Framework preset **Next.js**, root directory `./`, default build/output settings, Node 22.x or 24.x.
Add the environment variables above in Project → Settings → Environment Variables. In MongoDB
Atlas, allow network access from `0.0.0.0/0` (Vercel has no fixed IPs).

Photo uploads go from the admin's browser straight to Cloudinary using a server-issued signature,
so Vercel's ~4.5 MB request-body limit doesn't apply (images up to 10 MB).

## What the admin panel manages

- **Bookings** — enquiries from the booking form, with status tracking.
- **Portfolio** — photos, categories (add/rename/reorder/delete), each category's hero image,
  gallery and home-slideshow placement, ordering, and per-photo focal points for cropping.
- **Services** — packages shown on the site and in the booking form: text, prices, card image, visibility and order.

## Code map

| Path | What's there |
|---|---|
| `app/(site)` | public pages: home, services, gallery, booking form |
| `app/admin` | admin login and dashboard |
| `app/api` | route handlers (auth, bookings, portfolio, gallery, categories, services, uploads) |
| `components/admin` | admin panel UI |
| `lib/server` | server-only code: database, auth, Cloudinary, email, portfolio/services data |
| `lib/validation/booking.js` | booking-form rules shared by the browser and the API |
| `data/content.js` | seed defaults (services, categories) and the WhatsApp number |

## Commands

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
```
