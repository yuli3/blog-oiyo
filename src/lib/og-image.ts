export type OgImageKind = "academy" | "tool" | "fortune" | "default";

interface OgImageInput {
  explicitImage?: string;
  track?: string;
  pathname: string;
  siteUrl: string;
}

const OG_PATHS: Record<OgImageKind, string> = {
  academy: "/og/academy.jpg",
  tool: "/og/tool.jpg",
  fortune: "/og/fortune.jpg",
  default: "/og-image.png",
};

const FORTUNE_PATH = /(?:^|[-/])(saju|tarot|astrology|zodiac|fortune|mbti|enneagram|big5|hexaco|tci|personality)(?:[-/]|$)/i;
const TOOL_PATH = /(?:^|[-/])(calculator|converter|analyzer|generator|checker|timer|planner|simulator)(?:[-/]|$)/i;

export function classifyOgImage(track: string | undefined, pathname: string): OgImageKind {
  if (track === "academy") return "academy";
  if (FORTUNE_PATH.test(pathname)) return "fortune";
  if (TOOL_PATH.test(pathname)) return "tool";
  return "default";
}

export function resolveOgImage({ explicitImage, track, pathname, siteUrl }: OgImageInput): string {
  if (explicitImage) return new URL(explicitImage, siteUrl).toString();
  const kind = classifyOgImage(track, pathname);
  return new URL(OG_PATHS[kind], siteUrl).toString();
}
