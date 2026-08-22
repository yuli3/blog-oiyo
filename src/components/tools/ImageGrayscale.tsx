import type { Locale } from "../../lib/i18n";
import ImageProcessor from "./ImageProcessor";

export default function ImageGrayscale({ locale }: { locale: Locale }) {
  return <ImageProcessor locale={locale} initialMode="grayscale" />;
}
