import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const approvedWheelOffers = require('../lib/shop/used-wheel-offers.json');
function inventory(fetch) {
  const source = readFileSync(new URL('../lib/shop/inventory.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });
  const exports = {};
  new Function('exports', 'require', 'fetch', outputText)(exports, name => name === 'server-only' ? {} : name === './used-wheel-offers' ? { approvedWheelOffers } : require(name), fetch);
  return exports;
}
const product = { handle: 'novitec-race-exhaust-with-flap-ss-purosangue', vendor: 'NOVITEC', tags: ['brand_novitec'] };
const variant = { id: 'gid://shopify/ProductVariant/44908947537973', availableForSale: true, currentlyNotInStock: true, requiresShipping: true };
const stock = { id: 44908947537973, tracked: true, quantity: 2, policy: 'deny', shipping: true };
const bridge = records => ({ ok: true, text: async () => `<lxp-order-data hidden><script type="application/json">${JSON.stringify(records)}</script></lxp-order-data>` });

test('confirmed NOVITEC physical backorders avoid the rate-limited theme fetch', async () => {
  const { getVariantStock } = inventory(() => { throw new Error('Theme fetch must not run'); });
  assert.deepEqual(await getVariantStock(product, variant), { ...stock, quantity: 0, policy: 'continue' });
});

test('in-stock NOVITEC items retain exact stock quantity and DENY policy', async () => {
  let calls = 0;
  const { getVariantStock } = inventory(async (_url, options) => { calls++; assert.equal(options.cache, 'no-store'); return bridge([{ ...stock, id: 1, quantity: 99 }, stock]); });
  assert.deepEqual(await getVariantStock(product, { ...variant, currentlyNotInStock: false }), stock);
  assert.equal(calls, 1);
});

test('URBAN, used and other stock-only products never inherit NOVITEC backorder permission', async () => {
  for (const item of [
    { ...product, vendor: 'URBAN Automotive', tags: ['brand_urban', 'condition_unused'] },
    { ...product, vendor: 'URBAN Automotive' },
    { ...product, tags: ['brand_novitec', 'brand_urban'] },
    ...['condition_used', 'condition_unused', 'stock_only', 'stock-only'].map(tag => ({ ...product, tags: ['brand_novitec', tag] })),
  ]) {
    let calls = 0;
    const { getVariantStock } = inventory(async () => { calls++; return bridge([stock]); });
    assert.deepEqual(await getVariantStock(item, variant), stock);
    assert.equal(calls, 1);
  }
});

test('availability alone and non-shipping items cannot skip stock verification', async () => {
  for (const option of [{ ...variant, currentlyNotInStock: false }, { ...variant, availableForSale: false }, { ...variant, requiresShipping: false }]) {
    const { getVariantStock } = inventory(async () => ({ ok: false }));
    await assert.rejects(getVariantStock(product, option), /Stock could not be checked/);
  }
});

test('a missing or failed stock bridge still blocks stock-only products', async () => {
  for (const response of [{ ok: false }, { ok: true, text: async () => '<html>No stock metadata</html>' }]) {
    const { getVariantStock } = inventory(async () => response);
    await assert.rejects(getVariantStock({ ...product, tags: ['brand_novitec', 'condition_used'] }, variant), /Stock could not be checked/);
  }
});

test('approved wheel offers allow one live group, never individual components or backorders', async () => {
  const { getVariantStock } = inventory(() => { throw new Error('Approved wheel offers do not depend on the old storefront'); });
  const [id, offer] = Object.entries(approvedWheelOffers)[0];
  const wheel = { id, handle: 'wheel-set', vendor: 'Bentley', tags: ['condition_used'] };
  const option = { ...variant, id: offer.variantId, currentlyNotInStock: false };
  assert.equal((await getVariantStock(wheel, option)).quantity, 1);
  assert.equal((await getVariantStock(wheel, option)).policy, 'deny');
  assert.equal((await getVariantStock(wheel, { ...option, availableForSale: false })).quantity, 0);
  assert.equal((await getVariantStock(wheel, { ...option, currentlyNotInStock: true })).quantity, 0);
  assert.equal(await getVariantStock(wheel, { ...option, id: 'gid://shopify/ProductVariant/999' }), undefined);
});
