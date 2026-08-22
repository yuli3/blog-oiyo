import type { Locale } from "../../lib/i18n";
import PercentConverter from "./PercentConverter";

export default function PercentageCalculator({ locale }: { locale: Locale }) {
  return <PercentConverter locale={locale} />;
}
