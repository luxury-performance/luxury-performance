import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const offers = require('../lib/shop/used-wheel-offers.json');
const source = readFileSync(new URL('../lib/shop/used-wheel-offers.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } });
const api = {};
new Function('exports', 'require', outputText)(api, () => offers);

test('only the approved selling offer remains, with live price and availability', () => {
  for (const [id, offer] of Object.entries(offers)) {
    const chosen = { id: offer.variantId, availableForSale: false, price: { amount: '12345.00', currencyCode: 'AED' } };
    const product = { id, tags: [], priceRange: { minVariantPrice: { amount: '100.00', currencyCode: 'AED' } }, availableForSale: true, variants: { nodes: [{ id: 'component', availableForSale: true }, chosen], pageInfo: { hasNextPage: false } } };
    const result = api.applyWheelOffer(product);
    assert.deepEqual(result.variants.nodes, [chosen]);
    assert.equal(result.priceRange.minVariantPrice.amount, '12345.00');
    assert.equal(result.availableForSale, false);
    if (offer.wheelCount > 1) assert.ok(result.tags.includes(`stockroom_group_size_${offer.wheelCount}`));
  }
});
test('missing selling variant never falls back to a cheaper stock component', () => {
  const [id] = Object.keys(offers);
  const result = api.applyWheelOffer({ id, tags: [], variants: { nodes: [{ id: 'component' }] } });
  assert.equal(result.variants.nodes.length, 0);
  assert.equal(api.wheelOfferCard({ id }, result), null);
});
test('other products retain existing offers', () => {
  const product = { id: 'other' };
  assert.equal(api.applyWheelOffer(product), product);
});
