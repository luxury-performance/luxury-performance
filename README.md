# Luxury Performance — company website

A bespoke Next.js App Router website for Luxury Performance. This is a company and enquiry site, separate from the Shopify store.

## Run locally

Requires Node 20.9 or newer. From this directory:

```sh
npm install
npm run dev
```

Open http://localhost:3002. Port 3002 avoids the existing Shopify and stockroom previews.

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Pages and interactions

- Home: editorial introduction, keyboard-accessible expertise panels, selected programmes, company and contact sections.
- `/programmes`: filter by marque.
- `/programmes/[slug]`: four brand programme pages with contextual enquiry links.
- `/about`: company, approach and Dubai location.
- `/contact`: vehicle enquiry builder. No database or email service is required. The user reviews the composed enquiry and chooses to send it in WhatsApp. The website does not store the form or automatically send a message.
- Responsive navigation, keyboard focus, reduced-motion support, local font and optimised local photos.

## Brand and imagery

The approved LXP lettering SVG and P-flow artwork are copied unchanged from the parent Luxury Performance brand directory. Montserrat is self-hosted from the approved brand assets. The emblem is an exact crop of the supplied original artwork. No logo was regenerated.

Photographs are sourced from the existing public LXP Shopify site with the owner's permission and the supplied headquarters photo, optimised as WebP for this website. Programme photographs represent partner programmes, not claims of completed LXP builds. Business information is grounded in https://lxpforged.com and https://lxpforged.com/pages/about, checked 9 October 2026.

Image source filenames under https://lxpforged.com/cdn/shop/files/:
- hero-luxury-group.webp — user-supplied 3200 × 1800 headquarters photograph (9 October 2026), encoded as WebP at quality 95 without resizing
- hero.webp — Screenshot_2026-01-29_at_12.37.33.png (Ferrari programme detail only)
- porsche.webp — Screenshot_2026-06-05_at_14.43.54.png
- workshop.webp — A7400504.webp
- lamborghini.webp — IMG_0829.jpg
- mclaren.webp — IMG_0790_2.jpg
- ferrari.webp — IMG_0835.jpg
- purosangue.webp — IMG_0831.jpg
- sf90.webp — LAC_-_Az-33.jpg
- headquarters.webp — IMG_5104.jpg
- carbon.webp — IMG_2728.jpg
- wheel.webp — IMG_2729.jpg

## Editing

- `lib/content.ts`: contact details, programmes, expertise content.
- `app/globals.css`: responsive visual system.
- `components/`: navigation, interactive content, enquiry and shared components.
- `public/brand/`: exact approved brand artwork.

## Before public launch

Choose the company website domain/hosting separately from the Shopify store. Set NEXT_PUBLIC_SITE_URL to that final origin (metadataBase already reads it), then add canonical URLs, a sitemap and robots policy. Verify business details and contact destinations. This project has only been run locally; the Shopify storefront and existing brand guideline files are not modified.

## Verification — 9 October 2026

- Production build and ESLint passed.
- All eight content pages checked in Chromium at 1440, 768, 390 and 320 px widths: 32 route/layout checks, with no horizontal overflow, missing images or browser exceptions.
- Expertise tab interaction and arrow-key navigation checked.
- Programme filters, contextual enquiry prefill, WhatsApp URL/message composition, mobile menu/Escape/route changes, 404 recovery and reduced-motion behaviour checked.
- No enquiry messages were sent during testing.
