import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { heightConverterAnalyticsPayload } from './height-converter-analytics.ts';

describe('height converter analytics contract', () => {
  it('records the conversion mode without the entered height', () => {
    assert.deepEqual(heightConverterAnalyticsPayload({ locale: 'en', direction: 'cm_to_ft_in' }), {
      tool_id: 'height-converter',
      locale: 'en',
      conversion_direction: 'cm_to_ft_in',
    });
  });

  it('records comparison use without height or gender', () => {
    assert.deepEqual(heightConverterAnalyticsPayload({ locale: 'ko' }), {
      tool_id: 'height-converter',
      locale: 'ko',
    });
  });
});
