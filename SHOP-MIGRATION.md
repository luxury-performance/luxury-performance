# Shop preview and migration checklist

The shop reads published products and collections from Shopify Storefront API 2026-07. No draft products are exported. Existing `/products/:handle` and `/collections/:handle` paths are preserved. `/shop` has supplier-specific category and vehicle filters. Supplier mappings support existing `car_`, `car_make_`, `make_`, `car_model_`, `model_`, and `fit_` tags. Valvetronic product kinds currently derive from product titles because reliable subcategory tags are not present; review these before launch.

Cart IDs, including their secret key, stay in an HttpOnly cookie. Prices and stock are fetched by the server; client-supplied prices or stock values are never accepted. Shopify's hosted checkout handles payment. No migration, domain change or order submission is performed by this build.

## Required before the domain cutover

- Exact inventory currently comes from the stock metadata already published by the live LXP theme. Set up Storefront API access with `unauthenticated_read_product_inventory` and replace this bridge with authenticated inventory reads **before redirecting lxpforged.com**. Preserve policy/used-stock restrictions in a supported product data contract. A failed stock read currently blocks add-to-cart safely.
- The 11 Urban draft products are used and stock-only. They must remain draft until separately approved, and must retain tracked inventory and DENY. Do not bulk-enable CONTINUE for used stock.
- Review inventory policies on other used OEM listings. Existing Shopify policies are not changed by this preview.
- Production cart changes need a shared lock/idempotency strategy across application instances; the preview serializes requests within one process. Shopify remains authoritative for stock-only inventory at checkout.
- Audit supplier fitment tags and product descriptions. Do not infer physical compatibility from broad categories. TECHART exact fitment tags are presented separately from model families.
- Inventory-dependent pricing/availability, shipping countries, tax, bundles, installation add-ons, discounts, customer accounts and order tracking need final acceptance testing. The preview supports normal products, variant selection, split stock/supplier quantities, and hosted checkout; Valvetronic installation add-ons are now ported and linked to the selected exhaust configuration.
- Pages default to `noindex` while `SHOP_SEO_LIVE` is false. Use `NEXT_PUBLIC_SITE_URL=https://luxuryperformance.com` and enable indexing only at the agreed launch. Keep studio/API paths out of search. Finish static pages/blog migration and audit the complete old sitemap before cutover.
- Export Search Console baseline and high-value URLs, preserve or map every indexed URL, configure permanent page-to-page redirects on the OLD domain, verify canonical URLs, sitemap and structured data, then submit Change of Address in Search Console. Keep the old domain and redirects.

## Environment

See `.env.example`. The Storefront API supports tokenless catalog/cart requests on this store. A Storefront token is optional for the current fields; never supply an Admin token. Catalog responses revalidate every five minutes; cart and stock checks use no-store.

## Valvetronic installation and product media

`lib/shop/installation.ts` mirrors the eight service mappings in the existing Shopify theme’s `cart-installation-handle.liquid`. Service IDs and prices are resolved from published Shopify products on the server, with a fresh availability check before cart mutations. Installation is optional on product pages and in the bag. Related stock and special-order lines share an internal group; service quantities follow that group and are removed with its last exhaust. Checkout rejects a mismatched service quantity. Do not offer these service products as standalone parts.

The integration uses [Storefront CartLineInput attributes](https://shopify.dev/docs/api/storefront/2026-07/input-objects/CartLineInput) and checks [cart mutation warnings](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/cart-warnings). Regression tests cover all eight configuration mappings, exclusions, linked quantities and HTML sanitization. An isolated Shopify cart test verified real pricing, special-order confirmation, installation removal, and checkout URL generation without submitting an order.

Descriptions retain sanitized HTML formatting. Galleries load up to 250 product photos plus assigned variant images. Selecting a variant restores its assigned photo, or the product photo if unassigned; thumbnails can then select any gallery photo. All three Urus variants currently share the same Shopify image assignment, so configuration changes use that shared photo until distinct images are assigned in the catalog.

## Product videos

Valvetronic product pages show the existing `custom.valvetronic_youtube_videos` links in a click-to-play section. Two clips show initially, with expansion for longer lists; only one player is mounted at a time. Collapsing the list stops any hidden video. Products without assigned clips omit the section. URLs are restricted to valid YouTube IDs and duplicates are removed.

The preview’s tokenless Shopify connection cannot read metafields. `videos-server.ts` therefore reads only the matching video poster links from the published product page, cached for five minutes. Before moving the old domain, configure a Storefront token with `unauthenticated_read_metafields` and public read access for the existing definition, verify direct reads, then remove this fallback. This shares the existing inventory bridge’s origin setting. See [Storefront Metafield access](https://shopify.dev/docs/api/storefront/2026-07/objects/Metafield). No metafield definitions or product values were changed.

## Partner homepages

`/partners` and `/partners/[slug]` cover NOVITEC, TECHART, Valvetronic Designs, FI Exhaust and URBAN. Copy and existing hero assets live in `lib/partners.ts`; published product categories, vehicle links, counts, prices and selected products use the existing catalogue and taxonomy. TECHART links by model; NOVITEC and Valvetronic link by marque. Only departments with published products appear. FI Exhaust uses the existing programme and contact flow. URBAN has a separate limited-stock landing page for the two kits held by LXP, with an availability enquiry when no products are published. It is excluded from the dealer partner directory. Condition is shown only from each product’s own catalogue tags; no inventory or publishing settings were changed.

The header, footer, homepage partner names, shop supplier cards and known product vendor breadcrumbs link to partner pages. Supplier filter tabs still filter the shop. Partner pages have unique titles, descriptions and canonical URLs; indexing and sitemap inclusion follow `SHOP_SEO_LIVE`. Desktop and 390px layouts were checked, along with NOVITEC Wheels (35 results) and TECHART Cayenne (51 results) navigation. Typecheck, lint and production build passed.

## Header shopping menus

The header separates `Shop by brand` (partner homepages) and `Shop by vehicle` (make, then model), configured in `lib/shop-navigation.ts`. Brand names are centred below their logos and move only when the hover arrow appears; Shop all is vertically aligned with the menu triggers. URBAN sits separately under From our stock with Limited stock · 2 kits. Eight featured marques show models from the current catalogue via the read-only `/api/shop-navigation` endpoint, then link to exact make/model filters; customers can also browse all parts for a make. Desktop uses click-to-open panels with Escape, outside-click dismissal and ArrowDown focus; mobile uses two accordions and restores scrolling after selection. Model selection has loading, retry and back navigation with restored focus. Logos are local assets with provenance in `public/brand/navigation/SOURCES.txt`. No store records were changed. Desktop Porsche → 911 returned 204 parts; mobile Lamborghini → Urus returned 29 parts and closed the menu with page scrolling restored. Typecheck, lint and production build passed.

Verified at desktop and 390px mobile: every displayed logo loads, Ferrari returns 193 parts, Lamborghini returns 109, keyboard Escape restores trigger focus, outside click dismisses the panel, and mobile selection closes navigation and restores page scrolling. Typecheck, lint and production build passed.
