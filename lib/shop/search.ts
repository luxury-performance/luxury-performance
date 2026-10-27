import type { CatalogProduct } from './types';

export const normalizeSearch = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function matchesSearch(product: CatalogProduct, query: string) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  const text = normalizeSearch([product.title, product.vendor, product.productType, ...product.tags].join(' '));
  return terms.every(term => text.includes(term));
}

export function searchProducts(products: CatalogProduct[], query: string) {
  const phrase = normalizeSearch(query);
  const terms = phrase.split(' ').filter(Boolean);
  const score = (product: CatalogProduct) => {
    const title = normalizeSearch(product.title);
    const titleMatches = terms.filter(term => title.includes(term)).length;
    return titleMatches * 4 + (title === phrase ? 3 : title.startsWith(phrase) ? 2 : title.includes(phrase) ? 1 : 0);
  };
  return products.filter(product => matchesSearch(product, query)).sort((a, b) => score(b) - score(a));
}
