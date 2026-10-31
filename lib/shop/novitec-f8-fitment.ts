import type { CatalogProduct } from './types';

export const f8Bodies = [{ key: 'tributo', name: 'F8 Tributo' }, { key: 'spider', name: 'F8 Spider' }] as const;
export type F8Body = typeof f8Bodies[number]['key'];
export function isF8Body(value?: string): value is F8Body { return value === 'tributo' || value === 'spider'; }

// Product titles explicitly identify each F8 version; unlabelled and N-Largo parts need review.
export function f8BodyMatch(product: Pick<CatalogProduct, 'title'>, body: F8Body): 'allowed' | 'excluded' | 'review' {
  const title = product.title.toLowerCase();
  if (/\bn[\s-]*largo\b/.test(title)) return 'review';
  const tributo = /\btributo\b/.test(title);
  const spider = /\bspider\b/.test(title);
  if (!tributo && !spider) return 'review';
  return (body === 'tributo' ? tributo : spider) ? 'allowed' : 'excluded';
}
export function isF8Selection(filters: { brand?: string; make?: string; model?: string }) {
  return filters.brand === 'novitec' && filters.make === 'ferrari' && filters.model === 'f8';
}
