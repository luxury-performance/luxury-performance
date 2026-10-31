import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../lib/shop/novitec-ferrari-fitment.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { ferrariVersionMatch: match, is812Selection, isSF90Selection } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
test('SF90 shared and exclusive parts', () => {
  assert.equal(match({title:'Front Attachment for Ferrari SF90 Stradale & Spider'}, 'stradale'), 'allowed');
  assert.equal(match({title:'Front Attachment for Ferrari SF90 Stradale & Spider'}, 'spider'), 'allowed');
  assert.equal(match({title:'Triangle Cover for Ferrari SF90 Spider'}, 'stradale'), 'excluded');
  assert.equal(match({title:'Roof Spoiler for Ferrari SF90 Stradale'}, 'spider'), 'excluded');
  assert.equal(match({title:'Part for Ferrari SF90 XX Spider'}, 'spider'), 'review');
});
test('812 titles correct overbroad tags and unknown fitment', () => {
  assert.equal(match({title:'Front Spoiler for 812 Superfast & GTS'}, 'gts'), 'allowed');
  assert.equal(match({title:'Rear Spoiler for Ferrari 812 Superfast'}, 'gts'), 'excluded');
  assert.equal(match({title:'Rear Spoiler for Ferrari 812 GTS'}, 'superfast'), 'excluded');
  assert.equal(match({title:'Part for Ferrari 812'}, 'gts'), 'review');
  assert.equal(match({title:'N-LARGO for 812 Superfast'}, 'superfast'), 'review');
});
test('version filtering is scoped to NOVITEC Ferrari', () => {
 assert.equal(is812Selection({brand:'novitec',make:'ferrari',model:'812_gts'}),true);
 assert.equal(is812Selection({brand:'other',make:'ferrari',model:'812_gts'}),false);
 assert.equal(isSF90Selection({brand:'novitec',make:'ferrari',model:'sf90'}),true);
 assert.equal(isSF90Selection({brand:'novitec',make:'ferrari',model:'f8'}),false);
});
