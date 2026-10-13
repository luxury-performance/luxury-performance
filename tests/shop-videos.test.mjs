import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../lib/shop/videos.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 } });
const { youtubeId, videoIds, publishedVideoIds } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('YouTube URL formats resolve to the same safe video ID', () => {
  const id = '_6k1ZRUoZ6A';
  for (const url of [`https://www.youtube.com/watch?v=${id}&t=20`, `https://youtu.be/${id}?si=abc`, `https://youtube.com/shorts/${id}`, `https://youtube.com/live/${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) assert.equal(youtubeId(url), id);
  for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=_6k1ZRUoZ6A', 'https://evil.test/_6k1ZRUoZ6A', 'https://www.youtube.com/watch?v=invalid', 'https://user@youtube.com/watch?v=_6k1ZRUoZ6A']) assert.equal(youtubeId(url), null);
});
test('malformed values are ignored and duplicate video links appear once', () => {
  assert.deepEqual(videoIds(JSON.stringify(['https://youtu.be/_6k1ZRUoZ6A', 'https://www.youtube.com/watch?v=_6k1ZRUoZ6A', 'bad', null])), ['_6k1ZRUoZ6A']);
  assert.deepEqual(videoIds('{bad json'), []);
  assert.deepEqual(videoIds({ url: 'https://youtu.be/_6k1ZRUoZ6A' }), []);
});
test('theme bridge only takes links from product video posters', () => {
  const html = `<a href="https://youtube.com/watch?v=9Ouacvw1nRg">Social link</a><a href='https://youtube.com/watch?v=_6k1ZRUoZ6A&amp;t=2' class='other valvetronic-videos__poster'>Play</a><a class="valvetronic-videos__poster" href="https://evil.test/9Ouacvw1nRg">Bad</a>`;
  assert.deepEqual(publishedVideoIds(html), ['_6k1ZRUoZ6A']);
  assert.deepEqual(publishedVideoIds('<p>No videos</p>'), []);
});
