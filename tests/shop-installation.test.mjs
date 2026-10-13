import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(name) {
  const source = readFileSync(new URL(`../lib/shop/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, require);
  return exports;
}
const { installationHandle, linkedInstallationUpdates } = load('installation');
const { formatDescription } = load('description');
const product = { title: 'Valvetronic Lamborghini Urus Exhaust', tags: ['brand_valvetronic', 'category_exhaust'] };
const variant = value => ({ selectedOptions: [{ name: 'Configuration', value }] });
test('existing Valvetronic configurations select all eight installation packages', () => {
  for (const [configuration, handle] of [
    ['Catback','catback'], ['Catback + RACE Free-Flow','catback-free-flow'], ['Catback + 400-Cell Catted Downpipes','catback-catted-downpipes'],
    ['Midpipe','midpipe'], ['Axleback','axleback-rear-section'], ['Exhaust + Headers','exhaust-headers'],
    ['Exhaust + Front Pipes + Headers','exhaust-front-test-pipes-headers'], ['Rear Section + Over Axle Pipes','rear-section-over-axle-pipes'],
  ]) assert.equal(installationHandle(product, variant(configuration)), `${handle}-installation-service`);
  assert.equal(installationHandle(product, variant('Catback without headers')), 'catback-installation-service');
  assert.equal(installationHandle(product, variant('Front pipes only')), null);
  assert.equal(installationHandle({ ...product, title: 'Universal Muffler Kit' }, variant('Catback')), null);
  assert.equal(installationHandle({ ...product, tags: [] }, variant('Catback')), null);
});
test('installation quantity follows split stock and special-order parents only in its group', () => {
  const parent = { id: 'stock', quantity: 1, attributes: [{ key: '_lxp_installation_group', value: 'group-a' }] };
  const special = { ...parent, id: 'special', quantity: 2 };
  const service = { id: 'install-a', quantity: 3, attributes: [{ key: '_installation_for', value: 'group-a' }] };
  const other = { id: 'install-b', quantity: 1, attributes: [{ key: '_installation_for', value: 'group-b' }] };
  assert.deepEqual(linkedInstallationUpdates([parent, special, service, other], parent, 0), [{ id: 'install-a', quantity: 2 }]);
  assert.deepEqual(linkedInstallationUpdates([parent, service, other], parent, 0), [{ id: 'install-a', quantity: 0 }]);
  assert.deepEqual(linkedInstallationUpdates([parent, service], service, 0), []);
});
test('description preserves useful formatting and removes executable content', () => {
  const html = formatDescription('<h4>Features</h4><ul><li><strong>Titanium</strong></li></ul><table><tr><td>2018–2024</td></tr></table><script>alert(1)</script><img src="https://cdn.shopify.com/test.jpg" onerror="alert(1)"><a href="javascript:alert(1)">Click</a>');
  assert(html.includes('<h4>Features</h4>'));
  assert(html.includes('<li><strong>Titanium</strong></li>'));
  assert(html.includes('<td>2018–2024</td>'));
  assert(!/script|onerror|javascript:|alert\(1\)/.test(html));
});
