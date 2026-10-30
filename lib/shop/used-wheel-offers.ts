import offers from './used-wheel-offers.json';
import type { CatalogProduct, Product } from './types';

export const approvedWheelOffers: Record<string, { variantId: string; wheelCount: number }> = offers;

export function applyWheelOffer(product: Product): Product {
  const offer = approvedWheelOffers[product.id];
  if (!offer) return product;
  const variant = product.variants.nodes.find(v => v.id === offer.variantId);
  // Fail closed if a configured selling offer has been removed from Shopify.
  if (!variant) return { ...product, availableForSale: false, variants: { nodes: [], pageInfo: { hasNextPage: false } } };
  return {
    ...product,
    availableForSale: variant.availableForSale,
    priceRange: { minVariantPrice: variant.price },
    tags: [...product.tags, ...(offer.wheelCount > 1 ? [`stockroom_group_size_${offer.wheelCount}`] : [])],
    variants: { nodes: [variant], pageInfo: { hasNextPage: false } },
  };
}

export function wheelOfferCard(card: CatalogProduct, product: Product | null): CatalogProduct | null {
  if (!approvedWheelOffers[card.id]) return card;
  if (!product || !product.variants.nodes.length) return null;
  return { ...card, title: product.title, tags: product.tags, priceRange: product.priceRange, availableForSale: product.availableForSale };
}
