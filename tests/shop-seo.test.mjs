import { readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

// Load the real TypeScript modules, including fitment JSON, without a browser or API.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modules = new Map();
function load(path) {
  if (extname(path) === '.json') return JSON.parse(readFileSync(path, 'utf8'));
  if (!extname(path)) path += '.ts';
  if (modules.has(path)) return modules.get(path).exports;
  const compiled = { exports: {} }; modules.set(path, compiled);
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
  new Function('require', 'module', 'exports', outputText)(specifier => load(resolve(dirname(path), specifier)), compiled, compiled.exports);
  return compiled.exports;
}
const { catalogSeo } = load(resolve(root, 'lib/shop/catalog-seo.ts'));
const products = Array.from({ length: 78 }, (_, i) => ({
  id: String(i), handle: `part-${i}`, title: `Part ${i}`, vendor: i < 54 ? 'Novitec' : 'TECHART', productType: 'Exhaust',
  tags: i < 54 ? ['brand_novitec', 'make_ferrari', 'model_purosangue'] : ['brand_techart', 'make_porsche', 'model_911'],
  availableForSale: i < 25, featuredImage: null, priceRange: { minVariantPrice: { amount: '100', currencyCode: 'AED' } },
}));
const seo = (query = {}, live = true) => catalogSeo('/shop', query, products, live);

test('each real catalogue page is indexable with its own canonical', () => {
  for (const page of [1, 2, 3, 4]) {
    const result = seo({ page: String(page) });
    assert.equal(result.robots.index, true);
    assert.equal(result.alternates.canonical, page === 1 ? '/shop' : `/shop?page=${page}`);
  }
});

test('invalid page aliases canonicalize to the displayed page and are not indexed', () => {
  for (const [input, output] of [['999', 4], ['0', 1], ['-2', 1], ['1.5', 1], ['NaN', 1], ['Infinity', 4]]) {
    const result = seo({ page: input });
    assert.equal(result.page, output, input);
    assert.equal(result.alternates.canonical, output === 1 ? '/shop' : `/shop?page=${output}`, input);
    assert.equal(result.robots.index, false, input);
  }
});

test('filtered pages keep their context and use their filtered page count', () => {
  const result = seo({ brand: 'novitec', make: 'ferrari', page: '999' });
  assert.equal(result.page, 3);
  assert.equal(result.alternates.canonical, '/shop?brand=novitec&make=ferrari&page=3');
  assert.deepEqual(result.robots, { index: false, follow: true });
});

test('search and sort views are noindex but remain followable', () => {
  for (const query of [{ q: 'missing' }, { sort: 'price-up' }, { category: 'Exhaust' }]) {
    assert.deepEqual(seo(query).robots, { index: false, follow: true });
  }
  assert.equal(seo({ q: '' }).robots.index, true);
  assert.equal(seo({ q: 'carbon & exhaust' }).alternates.canonical, '/shop?q=carbon+%26+exhaust');
});

test('tracking parameters are excluded without blocking real catalogue pages', () => {
  const result = seo({ page: '2', utm_source: 'instagram', gclid: 'tracking' });
  assert.equal(result.alternates.canonical, '/shop?page=2');
  assert.equal(result.robots.index, true);
});

test('collection canonicals retain their path and actual in-stock page count', () => {
  const stock = products.filter(product => product.availableForSale);
  const result = catalogSeo('/collections/in-stock', { page: '4' }, stock, true);
  assert.equal(result.page, 2);
  assert.equal(result.alternates.canonical, '/collections/in-stock?page=2');
  assert.equal(result.robots.index, false);
});

test('first query value matches the catalogue selection and preview stays noindex', () => {
  assert.equal(seo({ page: ['2', '4'] }).alternates.canonical, '/shop?page=2');
  assert.equal(seo({ page: '2' }, false).robots.index, false);
  assert.equal(catalogSeo('/collections/empty', {}, [], true).alternates.canonical, '/collections/empty');
});
