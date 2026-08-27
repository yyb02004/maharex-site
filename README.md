# Maharex Industrial Website

Modern Korean-first B2B website concept for Maharex, built with Next.js, TypeScript, and Tailwind CSS.

## Pages

- `/ko`
- `/ko/about`
- `/ko/products`
- `/ko/products/[slug]`
- `/ko/references`
- `/ko/engineering`
- `/ko/contact`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Korean content is exposed first. English copy remains in `lib/site-data.ts` for a later language rollout.
- Product detail pages are generated from shared product data.
- Every product page includes RFQ calls to action.
- Equipment visuals currently use remote industrial photo placeholders.

## Security and deployment

- Set `MAHAREX_ADMIN_SECRET` in Vercel Production and Preview to a long random value. The RFQ rate limiter reuses the configured `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables.
- The application rejects cross-origin writes, limits RFQ and admin-login attempts, validates request sizes, and filters automated RFQ spam before storage or Telegram notification.
- In Vercel Firewall, add a rate-limit rule for `POST /api/rfq`. Start in Log mode, review legitimate traffic, then enforce a fixed-window limit appropriate for the site.
