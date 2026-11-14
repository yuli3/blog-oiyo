import assert from 'node:assert/strict';
import test from 'node:test';
import { toolCtaHref, TOOL_CTA_BLOG_SLUGS, TOOL_CTA_FAMILY_OVERRIDES } from './tool-cta-href.ts';

test('never points at ahoxy.com', () => {
  const samples = [
    ...Object.keys(TOOL_CTA_FAMILY_OVERRIDES),
    ...Object.keys(TOOL_CTA_BLOG_SLUGS),
    'crypto-tax-calculator',
    'totally-unknown-tool',
  ];
  for (const tool of samples) {
    const href = toolCtaHref(tool, 'ko');
    assert.equal(href.includes('ahoxy.com'), false, href);
    assert.match(href, /^https:\/\/((blog|game|tools)\.)?oiyo\.net\//, href);
  }
});

test('maps used calculators to live blog tool slugs', () => {
  assert.equal(
    toolCtaHref('bmi', 'ko'),
    'https://tools.oiyo.net/ko/bmi-calculator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('cron-expression', 'ko'),
    'https://blog.oiyo.net/ko/cron-expression-calculator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('markdown-table', 'ko'),
    'https://blog.oiyo.net/ko/markdown-table-formatter/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('diff-visualizer', 'ko'),
    'https://blog.oiyo.net/ko/diff-visualizer/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('housing-loan', 'ko'),
    'https://blog.oiyo.net/ko/housing-loan-simulator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('llm-cost', 'en'),
    'https://blog.oiyo.net/en/llm-cost-simulator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('aieo-audit', 'ko'),
    'https://blog.oiyo.net/ko/aieo-readiness-audit/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('compound', 'en'),
    'https://tools.oiyo.net/en/compound-interest-calculator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('calorie', 'ko'),
    'https://tools.oiyo.net/ko/nutrition-calculator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
  assert.equal(
    toolCtaHref('savings', 'ko'),
    'https://tools.oiyo.net/ko/deposit-calculator/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
});

test('keeps oiyo/game overrides and hubs unknown tools', () => {
  assert.match(toolCtaHref('adhd-screening', 'ko'), /^https:\/\/oiyo\.net\/ko\/adhd\/test\?/);
  assert.equal(toolCtaHref('chess', 'ko'), 'https://game.oiyo.net/ko/chess/');
  assert.equal(
    toolCtaHref('crypto-tax-calculator', 'ko'),
    'https://blog.oiyo.net/ko/tools/?utm_source=blog_oiyo&utm_medium=referral&utm_campaign=tool_cta',
  );
});

test('tools moved to tools.oiyo.net link there directly, renamed ones included', () => {
  assert.ok(toolCtaHref('latte-factor', 'en').startsWith('https://tools.oiyo.net/en/latte-factor-calculator/?'));
});
