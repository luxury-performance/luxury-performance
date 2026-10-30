import type { CatalogProduct } from './types';

export function isUsedPart(product: Pick<CatalogProduct, 'tags' | 'title'>) {
  if (product.tags.includes('condition_unused')) return false;
  return product.tags.some(tag => ['condition_used', 'LXP Used', 'Used Parts'].includes(tag)) || / - Used$/i.test(product.title);
}
export function isFourWheelSet(product: Pick<CatalogProduct, 'tags'>) {
  return product.tags.includes('stockroom_set_only');
}


// Explicit offer size keeps group totals separate from per-wheel prices.
export function wheelGroupSize(product: Pick<CatalogProduct, 'tags'>): number | undefined {
  const tag = product.tags.find(tag => /^stockroom_group_size_[234]$/.test(tag));
  return tag ? Number(tag.split('_').pop()) : isFourWheelSet(product) ? 4 : undefined;
}

export function wheelGroupUnit(size: number): string {
  return size === 2 ? 'pair of 2' : size === 3 ? 'lot of 3' : 'set of 4';
}
