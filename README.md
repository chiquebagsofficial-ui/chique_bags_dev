# Chique Bags

Custom e-commerce website for **Chique Bags** (owner: Priyanka Vora), built by Priyank Bohra.
Handcrafted sling and crossbody bags: storefront, checkout, customer accounts, automated emails and an admin panel.

- **Quotation:** [docs/quotation/Chique-Bags-Quotation.pdf](docs/quotation/Chique-Bags-Quotation.pdf)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma · iron-session · Razorpay · Cloudinary · Nodemailer (SMTP) · Upstash Redis (optional, rate limiting)

## What is in it

**Storefront:** home, shop (filters, sort, search, pagination), product page (colour stock, reviews, JSON-LD), bag drawer and page, checkout (guest email-code or account, saved addresses, coupons, Razorpay or COD), order success/failed, favourites, login / sign-up with email verification / password reset, account (profile, addresses, orders, invoices, cancel), track order, about, contact, policy pages, sitemap and robots.

**Admin (`/admin`):** dashboard (revenue, 7-day chart, low stock, alerts), products (colours, stock, Cloudinary photo upload), orders (status flow, tracking, cancel with refund, invoice), customers, categories, coupons, contact messages, store settings.

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

### Razorpay webhook

Point a webhook at `https://<your-domain>/api/webhooks/razorpay` for the `payment.captured` and `payment.failed` events and put its secret in `RAZORPAY_WEBHOOK_SECRET`. It confirms orders when a customer pays and then closes the tab.

## Order and stock rules

- Prices, coupons, shipping and stock are always recalculated on the server; the browser is never trusted.
- Stock is reduced when an order is confirmed (COD at placement, online after payment verification) with a `stock >= quantity` guard, so it can never go negative. If two customers pay for the last piece, the second order is flagged "needs attention" on the dashboard.
- Cancelling an order restores stock, releases the coupon and refunds online payments through Razorpay.

## Deploying

Vercel + Neon. Set the environment variables, run `npx prisma migrate deploy` and `npm run db:seed` once against the production database, then add the Razorpay webhook.
