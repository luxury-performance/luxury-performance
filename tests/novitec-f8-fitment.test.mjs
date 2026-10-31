import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/shop/novitec-f8-fitment.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { f8BodyMatch, isF8Body, isF8Selection } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('F8 body choices retain shared parts and exclude the other version', () => {
  const shared = { title: 'NOVITEC - Wheels for Ferrari F8 Tributo & Spider' };
  const spider = { title: 'NOVITEC - Cover B-Pillar for Ferrari F8 Spider' };
  const tributo = { title: 'NOVITEC - Cover Engine Bonnet for Ferrari F8 Tributo' };
  for (const body of ['tributo', 'spider']) assert.equal(f8BodyMatch(shared, body), 'allowed');
  assert.equal(f8BodyMatch(spider, 'spider'), 'allowed');
  assert.equal(f8BodyMatch(spider, 'tributo'), 'excluded');
  assert.equal(f8BodyMatch(tributo, 'tributo'), 'allowed');
  assert.equal(f8BodyMatch(tributo, 'spider'), 'excluded');
});

test('unspecified and N-Largo listings need separate fitment confirmation', () => {
  for (const title of ['NOVITEC F8 performance part', 'NOVITEC N-Largo part for Ferrari F8 Tributo / F8 Spider']) {
    assert.equal(f8BodyMatch({ title }, 'tributo'), 'review');
    assert.equal(f8BodyMatch({ title }, 'spider'), 'review');
  }
});

test('F8 body filtering applies only to the intended NOVITEC Ferrari model', () => {
  assert.equal(isF8Selection({ brand: 'novitec', make: 'ferrari', model: 'f8' }), true);
  assert.equal(isF8Selection({ brand: 'techart', make: 'porsche', model: '911' }), false);
  assert.equal(isF8Body('tributo'), true);
  assert.equal(isF8Body('spider'), true);
  assert.equal(isF8Body('coupe'), false);
});
