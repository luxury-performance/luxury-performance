import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/shop/taxonomy.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { updateFilters, filterUrl, fitOptions, filterProducts } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const products = [
  { title: 'Shared wheels', vendor: 'TECHART', productType: 'Wheels', tags: ['make_porsche', 'model_911', 'model_cayenne', 'fit_992_1', 'fit_e3_2'], priceRange: { minVariantPrice: { amount: '2000' } } },
  { title: 'Cayenne spoiler', vendor: 'TECHART', productType: 'Spoiler', tags: ['make_porsche', 'model_cayenne', 'fit_e3_2'], priceRange: { minVariantPrice: { amount: '1000' } } },
];

test('changing vehicle clears dependent selections and returns to page one', () => {
  const current = { brand: 'techart', make: 'porsche', model: '911', fit: '992_1', page: '4', category: 'Wheels' };
  const model = updateFilters(current, { model: 'cayenne' });
  assert.equal(model.fit, undefined);
  assert.equal(model.page, undefined);
  assert.equal(model.category, 'Wheels');
  const make = updateFilters(current, { make: 'ferrari' });
  assert.equal(make.model, undefined);
  assert.equal(make.fit, undefined);
  assert.deepEqual(updateFilters(current, { brand: 'novitec' }), { brand: 'novitec' });
  assert.equal(updateFilters(current, { category: 'Exhaust' }).page, undefined);
});

test('shared TECHART parts do not mix Porsche family fitment options', () => {
  assert.deepEqual(fitOptions(products, { brand: 'techart', model: 'cayenne' }), ['e3_2']);
  assert.deepEqual(fitOptions(products, { brand: 'techart', model: '911' }), ['992_1']);
  assert.deepEqual(fitOptions(products, { brand: 'techart' }), ['992_1', 'e3_2']);
});

test('combined filters and prices produce the matching subset', () => {
  const selection = { brand: 'techart', model: 'cayenne', fit: 'e3_2' };
  assert.equal(filterProducts(products, selection).length, 2);
  assert.equal(filterProducts(products, { ...selection, category: 'Aerodynamics' })[0].title, 'Cayenne spoiler');
  assert.equal(filterProducts(products, { ...selection, sort: 'price-up' })[0].title, 'Cayenne spoiler');
  assert.equal(filterProducts(products, { ...selection, q: 'missing part' }).length, 0);
});

test('filter URLs preserve the collection, encode values, and omit cleared filters', () => {
  assert.equal(filterUrl('/collections/techart', { brand: 'techart', q: ' Turbo S ', model: '', page: undefined }), '/collections/techart?brand=techart&q=Turbo+S');
  assert.equal(filterUrl('/shop', {}), '/shop');
});
