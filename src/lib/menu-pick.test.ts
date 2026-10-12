import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapSearchLinks } from './menu-pick';

test('Korean diners can search the selected dish in three map providers', () => {
  const links = mapSearchLinks('비빔밥', '맛집', 'ko');
  assert.deepEqual(links.map(({ id }) => id), ['kakao', 'naver', 'google']);
  assert.equal(links[0].href, 'https://map.kakao.com/link/search/%EB%B9%84%EB%B9%94%EB%B0%A5%20%EB%A7%9B%EC%A7%91');
  assert.equal(links[1].href, 'https://map.naver.com/p/search/%EB%B9%84%EB%B9%94%EB%B0%A5%20%EB%A7%9B%EC%A7%91');
  assert.equal(new URL(links[2].href).searchParams.get('query'), '비빔밥 맛집');
});

for (const [locale, placeWord] of [
  ['en', 'restaurant'], ['ja', 'レストラン'], ['zh', '餐厅'],
  ['fr', 'restaurant'], ['es', 'restaurante'],
] as const) {
  test(`${locale} diners receive a localized Google Maps query, not Korean-only providers`, () => {
    const links = mapSearchLinks('비빔밥', placeWord, locale);
    assert.equal(links.length, 1);
    assert.equal(links[0].id, 'google');
    const url = new URL(links[0].href);
    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.pathname, '/maps/search/');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(url.searchParams.get('query'), `비빔밥 ${placeWord}`);
  });
}

test('dish punctuation stays inside the search query instead of injecting URL parameters', () => {
  const [link] = mapSearchLinks('Fish & chips #1?', 'restaurant', 'en');
  const url = new URL(link.href);
  assert.equal(url.searchParams.get('query'), 'Fish & chips #1? restaurant');
  assert.equal(url.searchParams.size, 2);
  assert.equal(url.hash, '');
});
