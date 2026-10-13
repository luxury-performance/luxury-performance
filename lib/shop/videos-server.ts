import 'server-only';
import { cache } from 'react';
import { storefront } from './storefront';
import { PRODUCT_VIDEOS_QUERY } from './queries';
import { publishedVideoIds, videoIds } from './videos';

export const getProductVideos = cache(async (handle: string): Promise<string[]> => {
  if (process.env.SHOPIFY_STOREFRONT_TOKEN) {
    try {
      const data = await storefront<{ product: { videos: { value: string } | null } | null }>(PRODUCT_VIDEOS_QUERY, { handle });
      if (data.product?.videos) return videoIds(data.product.videos.value);
    } catch { /* Preview fallback until the connection has metafield access. */ }
  }
  // Temporary public-theme bridge, like inventory.ts. Replace before domain cutover.
  const origin = process.env.SHOPIFY_INVENTORY_ORIGIN || 'https://lxpforged.com';
  try {
    const response = await fetch(`${origin}/products/${encodeURIComponent(handle)}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];
    return publishedVideoIds(await response.text());
  } catch { return []; }
});
