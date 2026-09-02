import type { Locale } from './i18n';

export type HeightConverterEvent =
  | 'height_conversion_complete'
  | 'height_comparison_view'
  | 'height_tool_reset';

export type HeightConversionDirection = 'cm_to_ft_in' | 'ft_in_to_cm';

interface HeightConverterAnalyticsContext {
  locale: Locale;
  direction?: HeightConversionDirection;
}

export function heightConverterAnalyticsPayload(
  context: HeightConverterAnalyticsContext,
): Record<string, string> {
  const payload: Record<string, string> = {
    tool_id: 'height-converter',
    locale: context.locale,
  };
  if (context.direction) payload.conversion_direction = context.direction;
  return payload;
}
