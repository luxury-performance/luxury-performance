import 'server-only';
import type { Product, Variant } from './types';
export type StockVariant = { id: number; tracked: boolean; quantity: number; policy: 'continue' | 'deny'; shipping: boolean };
// Temporary bridge to our existing theme's public stock metadata. This must be
// replaced with scoped Storefront inventory access before the old domain moves.
export async function getStock(handle: string): Promise<StockVariant[]> {
  const base = process.env.SHOPIFY_INVENTORY_ORIGIN || 'https://lxpforged.com';
  const response = await fetch(`${base}/products/${encodeURIComponent(handle)}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Stock could not be checked. Please try again.');
  const html = await response.text();
  const match = html.match(/<lxp-order-data\b[^>]*>\s*<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Stock could not be checked. Please try again.');
  const variants: StockVariant[] = JSON.parse(match[1]);
  if (!Array.isArray(variants) || variants.some(v=>!Number.isFinite(v.quantity)||!['continue','deny'].includes(v.policy))) throw new Error('Stock could not be checked. Please try again.');
  return variants;
}

// Only NOVITEC supplier items with Shopify's explicit backorder confirmation may
// use the API result instead of the public theme bridge. Never infer permission
// from availability alone, and retain stock checks for used/unused one-off stock.
export async function getVariantStock(product: Pick<Product, 'handle' | 'vendor' | 'tags'>, variant: Pick<Variant, 'id' | 'availableForSale' | 'currentlyNotInStock' | 'requiresShipping'>): Promise<StockVariant | undefined> {
  const brands = product.tags.filter(tag => tag.startsWith('brand_'));
  const novitec = /^novitec$/i.test(product.vendor.trim()) && brands.length === 1 && brands[0] === 'brand_novitec';
  const stockOnly = product.tags.some(tag => ['condition_used', 'condition_unused', 'stock_only', 'stock-only'].includes(tag));
  if (novitec && !stockOnly && variant.availableForSale && variant.currentlyNotInStock && variant.requiresShipping) {
    return { id: Number(variant.id.split('/').pop()), tracked: true, quantity: 0, policy: 'continue', shipping: true };
  }
  return (await getStock(product.handle)).find(item => String(item.id) === variant.id.split('/').pop());
}
