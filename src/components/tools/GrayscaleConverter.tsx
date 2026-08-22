import type { Locale } from "../../lib/i18n";
import ImageProcessor from "./ImageProcessor";

export default function GrayscaleConverter({ locale = "ko" }: { locale?: Locale }) {
  return <ImageProcessor locale={locale} initialMode="grayscale" />;
}
