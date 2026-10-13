import 'server-only';
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
