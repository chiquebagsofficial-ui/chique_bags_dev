# Chique Bags

Custom e-commerce website for **Chique Bags** (owner: Priyanka Vora), built by Priyank Bohra.
Handcrafted sling and crossbody bags: storefront, checkout, customer accounts, automated emails and an admin panel.

- **Quotation:** [docs/quotation/Chique-Bags-Quotation.pdf](docs/quotation/Chique-Bags-Quotation.pdf)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma · iron-session · Razorpay · Cloudinary · Nodemailer (SMTP) · Upstash Redis (optional, rate limiting)

## What is in it

**Storefront:** home, shop (filters, sort, search, pagination), product page (colour stock, reviews, JSON-LD), bag drawer and page, checkout (guest email-code or account, saved addresses, coupons, Razorpay or COD), order success/failed, favourites, login / sign-up with email verification / password reset, account (profile, addresses, orders, invoices, cancel), track order, about, contact, policy pages, sitemap and robots.

**Admin (`/admin`):** dashboard (revenue, 7-day chart, low stock, alerts), products (colours, stock, Cloudinary photo upload), orders (status flow, tracking, cancel with refund, invoice), customers, categories, coupons, contact messages, store settings.

**Payments & shipping:** prepaid orders only, paid through Razorpay (UPI, cards, net banking, wallets). Shipping is free on every order. Pincodes are validated at checkout against India Post and the city and state are filled in automatically.

**WhatsApp:** a floating chat button on every page, and an "Enquire about this bag on WhatsApp" button on each product that opens a chat pre-filled with the bag's name, price and link. Set the number (with country code, digits only) in Admin > Settings, or with `NEXT_PUBLIC_WHATSAPP_NUMBER`.

**Returns & refunds:** customers report a damaged, defective or wrong item within 7 days of delivery, with photos, from their order page. The store reviews it in Admin > Returns (requested, approved, item received, refunded or rejected), issues the refund through Razorpay and every step, amount and reference is recorded on the request and on the order. The store can also record a return on a customer's behalf.

**GST invoices:** numbered per financial year (CB/26-27/00001), with the seller's GSTIN, HSN code, taxable value and CGST + SGST (same state) or IGST (other states), and the amount in words. Set the business name, GSTIN, state, HSN and GST rate in Admin > Settings (the page is at `/admin/settings`). Order contact details, delivery address and private notes can be edited from the admin order page.

**Instagram strip:** the footer shows our bestselling bags in an Instagram-style grid linking to the Instagram profile.

**Homepage banners:** two or three full-width slides (photo, headline, text, buttons) managed in Admin > Banners, with swipe and auto-play.

**Gifting:** a gift box and a handwritten note (up to 200 characters) can be added to any order at checkout. The owner sets the price, on/off and the gift box photo in Admin > Settings. Gift orders are highlighted in the admin order screen with the note to write.

**Emails:** verification codes, welcome, order confirmation, shipped, delivered, cancelled, owner new-order alert, contact messages.

## Getting started

```bash
npm install
cp .env.example .env        # then fill in the values
npm run db:local            # optional: throw-away local Postgres on port 5544 (Windows, needs PostgreSQL installed)
npx prisma migrate deploy   # create the tables
npm run db:seed             # owner account, categories, sample products, CHIQUE15 / CHIQUE150 coupons
npm run dev                 # http://localhost:3020
```

Sign in to the admin panel at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

### Environment

See [.env.example](.env.example). The database variables are named `PRISMA_DATABASE_URL` and `PRISMA_DATABASE_URL_UNPOOLED` (not `DATABASE_URL`, which many machines already have set globally). Use the pooled Neon URL for the first and the direct (non-`-pooler`) URL for the second.

Without SMTP credentials, emails are printed to the server log. Without Razorpay keys (development only), checkout shows a built-in **test payment** so the whole order flow can be tried; this is disabled in production.

### Photos

The sample products, banners and gift box use real stock photographs (Unsplash, free licence) as placeholders. They are uploaded to Cloudinary by `node scripts/stock-photos.mjs` (Cloudinary fetches them by URL) and listed in `prisma/seed-images.json`. Replace them with the client's own photos: product photos in Admin > Products, homepage slides in Admin > Banners, gift box and story photos in Admin > Settings.

### Backups and recovery

- **Database (Neon):** Neon keeps a continuous history of the database and can restore it to an earlier point in time (or branch from it) from the Neon console. How far back you can go depends on the Neon plan, so confirm the history window on the plan you use. For an independent copy, export it from time to time:
  ```bash
  pg_dump "<PRISMA_DATABASE_URL_UNPOOLED>" -Fc -f chique-backup.dump
  # restore into an empty database with: pg_restore -d "<new database url>" chique-backup.dump
  ```
- **Photos:** stored on Cloudinary.
- **Code:** stored on GitHub; the site can be redeployed on Vercel from any commit.

### Setting up the Neon database

Put the Neon URLs in `.env` (`PRISMA_DATABASE_URL` pooled, `PRISMA_DATABASE_URL_UNPOOLED` direct), then:

```bash
npx prisma migrate deploy
npm run db:seed
```

### Razorpay webhook

Point a webhook at `https://<your-domain>/api/webhooks/razorpay` for the `payment.captured` and `payment.failed` events and put its secret in `RAZORPAY_WEBHOOK_SECRET`. It confirms orders when a customer pays and then closes the tab.

## Order and stock rules

- Prices, coupons, shipping and stock are always recalculated on the server; the browser is never trusted.
- Stock is reduced when an order is confirmed (COD at placement, online after payment verification) with a `stock >= quantity` guard, so it can never go negative. If two customers pay for the last piece, the second order is flagged "needs attention" on the dashboard.
- Cancelling an order restores stock, releases the coupon and refunds online payments through Razorpay.

## Deploying

Vercel + Neon. Set the environment variables, run `npx prisma migrate deploy` and `npm run db:seed` once against the production database, then add the Razorpay webhook.
