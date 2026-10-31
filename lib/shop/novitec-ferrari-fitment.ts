import type { CatalogProduct } from './types';

type Match = 'allowed' | 'excluded' | 'review';
export const sf90Bodies = [{ key: 'stradale', name: 'SF90 Stradale' }, { key: 'spider', name: 'SF90 Spider' }] as const;
export type SF90Body = typeof sf90Bodies[number]['key'];
export function isSF90Body(value?: string): value is SF90Body { return value === 'stradale' || value === 'spider'; }
export function isSF90Selection(f: { brand?: string; make?: string; model?: string }) { return f.brand === 'novitec' && f.make === 'ferrari' && f.model === 'sf90'; }
export function is812Selection(f: { brand?: string; make?: string; model?: string }) { return f.brand === 'novitec' && f.make === 'ferrari' && (f.model === '812_gts' || f.model === '812_superfast'); }

// Catalogue tags can include both models even when the title specifies only one.
// Keep uncertain and special-programme listings separate for fitment confirmation.
export function ferrariVersionMatch(product: Pick<CatalogProduct, 'title'>, version: 'stradale' | 'spider' | 'gts' | 'superfast'): Match {
  const title = product.title.toLowerCase();
  if (/\bn[\s-]*largo\b|\bxx\b|\bcompetizione\b/.test(title)) return 'review';
  const sf90 = version === 'stradale' || version === 'spider';
  const first = sf90 ? /\bstradale\b/.test(title) : /\bsuperfast\b/.test(title);
  const second = sf90 ? /\bspider\b/.test(title) : /\bgts\b/.test(title);
  if (!first && !second) return 'review';
  return (version === 'stradale' || version === 'superfast' ? first : second) ? 'allowed' : 'excluded';
}
