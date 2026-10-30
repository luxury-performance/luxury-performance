import 'server-only';
import { cache } from 'react';
import { formatDescription } from './description';
import { approvedWheelOffers, applyWheelOffer, wheelOfferCard } from './used-wheel-offers';
import type { CatalogProduct, Product } from './types';
import { CATALOG_QUERY, COLLECTION_QUERY, COLLECTIONS_QUERY, PRODUCT_QUERY } from './queries';
const domain = process.env.SHOPIFY_STORE_DOMAIN || 'krtymq-v4.myshopify.com';
export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, fresh = false): Promise<T> {
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  const response = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Shopify-Storefront-Access-Token': token } : {}) },
    body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15000),
    ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
  });
  if (!response.ok) throw new Error('The shop is temporarily unavailable. Please try again.');
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error('Could not load the shop. Please try again.');
  return result.data as T;
}
type Connection<T> = { nodes: T[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
export const getCatalog = cache(async () => {
  const products: CatalogProduct[] = []; let after: string | null = null;
  do {
    const data: { products: Connection<CatalogProduct> } = await storefront(CATALOG_QUERY, { after });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return hydrateWheelCards(products.filter(p => p.productType !== 'Installation Service' && p.vendor !== 'Luxury Performance Parts' && !p.tags.includes('stockroom_set_components')));
});
export const getProduct = cache(async (handle: string, fresh = false) => {
  const product = (await storefront<{ product: Product | null }>(PRODUCT_QUERY, { handle }, fresh)).product;
  if (product?.descriptionHtml) product.descriptionHtml = formatDescription(product.descriptionHtml);
  const offer = product ? applyWheelOffer(product) : null;
  return offer?.variants.nodes.length ? offer : null;
});
async function hydrateWheelCards(products: CatalogProduct[]): Promise<CatalogProduct[]> {
  const cards = await Promise.all(products.map(async p => approvedWheelOffers[p.id] ? wheelOfferCard(p, await getProduct(p.handle)) : p));
  return cards.filter((p): p is CatalogProduct => p !== null);
}
type CollectionInfo = { title: string; description: string; seo: { title: string | null; description: string | null } };
export const getCollection = cache(async (handle: string) => {
  let after: string | null = null; const products: CatalogProduct[] = [];
  let info: CollectionInfo | null = null;
  do {
    const data: { collection: (CollectionInfo & { products: Connection<CatalogProduct> }) | null } = await storefront(COLLECTION_QUERY, { handle, after });
    if (!data.collection) return null;
    const { products: page, ...rest } = data.collection; info = rest;
    products.push(...page.nodes); after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return { ...info!, products: await hydrateWheelCards(products) };
});
export const getCollections = cache(async () => {
  const result: { handle: string; title: string }[] = []; let after: string | null = null;
  do {
    const data: { collections: Connection<{ handle: string; title: string }> } = await storefront(COLLECTIONS_QUERY, { after });
    result.push(...data.collections.nodes); after = data.collections.pageInfo.hasNextPage ? data.collections.pageInfo.endCursor : null;
  } while (after);
  return result;
});
