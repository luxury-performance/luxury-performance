import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiled = ts.transpileModule(readFileSync(resolve(root, 'lib/intro-bootstrap.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exported = {};
runInNewContext(compiled, { exports: exported });

function page({ storage = new Map(), reduced = false, reload = false, storageError, scrollError = false, hash = '#novitec', history: sharedHistory } = {}) {
  const dataset = {};
  const timers = [];
  const scrolls = [];
  const listeners = [];
  const replacements = [];
  const history = sharedHistory ?? { scrollRestoration: 'auto', state: null, replaceState: (...args) => replacements.push(args) };
  const context = {
    document: { documentElement: { dataset } },
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: {
      getItem: key => { if (storageError === 'read') throw Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (storageError === 'write') throw Error('Storage full'); storage.set(key, value); },
    },
    performance: { getEntriesByType: () => [{ type: reload ? 'reload' : 'navigate' }] },
    location: { hash, pathname: '/', search: '?ref=test' },
    history,
    scrollTo: options => { if (scrollError) throw Error('Scroll unavailable'); scrolls.push(options); },
    addEventListener: (...args) => listeners.push(args),
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
  };
  runInNewContext(exported.introBootstrap, context);
  return { dataset, timers, scrolls, listeners, replacements, history, storage };
}

test('first visit starts the full intro while preserving fresh deep links', () => {
  const result = page();
  assert.equal(result.dataset.lxpIntro, 'tracing');
  assert.equal(result.storage.get('lxp:intro-played:v1'), '1');
  assert.equal(result.scrolls.length, 0);
  assert.equal(result.replacements.length, 0);
  assert.equal(result.history.scrollRestoration, 'auto');
  assert.equal(result.timers[0].delay, 5000);
});

test('later full navigations and reloads skip intro and retain native scroll and anchors', () => {
  const first = page();
  for (const reload of [false, true]) {
    const later = page({ storage: first.storage, reload });
    assert.equal(later.dataset.lxpIntro, undefined);
    assert.equal(later.dataset.lxpReload, undefined);
    assert.equal(later.scrolls.length, 0);
    assert.equal(later.listeners.length, 0);
    assert.equal(later.replacements.length, 0);
    assert.equal(later.timers.length, 0);
    assert.equal(later.history.scrollRestoration, 'auto');
  }
});

test('reloading during the first animation does not replay it', () => {
  const first = page({ reload: true });
  assert.equal(first.dataset.lxpIntro, 'tracing');
  assert.equal(first.history.scrollRestoration, 'manual');
  const later = page({ storage: first.storage, reload: true, history: first.history });
  assert.equal(later.dataset.lxpIntro, undefined);
  assert.equal(later.history.scrollRestoration, 'auto');
});

test('a new tab session can play the full intro again', () => {
  page();
  assert.equal(page().dataset.lxpIntro, 'tracing');
});

test('reduced motion leaves the page visible and does not consume the entrance', () => {
  const result = page({ reduced: true, reload: true, history: { scrollRestoration: 'manual' } });
  assert.deepEqual(result.dataset, {});
  assert.equal(result.storage.size, 0);
  assert.equal(result.scrolls.length, 0);
  assert.equal(result.timers.length, 0);
  assert.equal(result.history.scrollRestoration, 'auto');
});

test('an error after a first reload starts still releases native scroll restoration', () => {
  const result = page({ reload: true, scrollError: true });
  assert.deepEqual(result.dataset, {});
  assert.equal(result.history.scrollRestoration, 'auto');
});

test('unavailable or full session storage fails open without hiding or resetting the page', () => {
  for (const storageError of ['read', 'write']) {
    const result = page({ storageError, reload: true });
    assert.deepEqual(result.dataset, {});
    assert.equal(result.scrolls.length, 0);
    assert.equal(result.timers.length, 0);
  }
});

test('a first-session reload preserves the existing entrance-at-top behavior', () => {
  const result = page({ reload: true });
  assert.equal(result.dataset.lxpIntro, 'tracing');
  assert.equal(result.dataset.lxpReload, 'true');
  assert.equal(result.history.scrollRestoration, 'manual');
  assert.equal(result.replacements[0][2], '/?ref=test');
  assert.equal(result.scrolls.length, 1);
  assert.equal(result.listeners[0][0], 'pageshow');
  result.listeners[0][1]();
  assert.equal(result.scrolls.length, 2);
});

test('bootstrap releases the page if hydration never arrives', () => {
  const result = page({ reload: true });
  result.timers[0].callback();
  assert.equal(result.dataset.lxpIntro, undefined);
  assert.equal(result.dataset.lxpReload, undefined);
  assert.equal(result.history.scrollRestoration, 'auto');
});
