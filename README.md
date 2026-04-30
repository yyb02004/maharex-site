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
