import type { CatalogProduct } from './types';
import { filterProducts, filterUrl, type Filters } from './taxonomy';
import { filterBodyProducts, is911Fit, isBodyStyle } from './techart-fitment';

export type CatalogSearchParams = Record<string, string | string[] | undefined>;
const facetKeys = ['brand', 'make', 'model', 'fit', 'body', 'category', 'q', 'sort'] as const;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export function catalogSeo(basePath: string, query: CatalogSearchParams, products: CatalogProduct[], live: boolean) {
  const filters = Object.fromEntries(facetKeys.map(key => [key, first(query[key])])) as Filters;
  // Match the catalogue's fitment filtering and 24-card pagination, including its clamped aliases.
  const fit = filters.brand === 'techart' && filters.model === '911' && is911Fit(filters.fit) ? filters.fit : undefined;
  const body = fit && isBodyStyle(filters.body) ? filters.body : undefined;
  const matches = filterBodyProducts(filterProducts(products, filters), fit, body);
  const maxPage = Math.max(1, Math.ceil(matches.length / 24));
  const rawPage = first(query.page);
  const number = Number(rawPage);
  const page = Math.min(maxPage, Math.max(1, Math.floor(number) || 1));
  const validPage = !rawPage || (Number.isInteger(number) && number >= 1 && number <= maxPage);
  const filtered = facetKeys.some(key => Boolean(filters[key]));

  return {
    page,
    alternates: { canonical: filterUrl(basePath, { ...filters, page: page > 1 ? String(page) : undefined }) },
    robots: { index: live && !filtered && validPage, follow: true },
  };
}
