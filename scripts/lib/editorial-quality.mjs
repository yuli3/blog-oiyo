import fs from "node:fs";
import path from "node:path";

export const AXES = [
  "completenessTitle",
  "homepageSources",
  "fakeAuthority",
  "imageAlt",
  "workedExample",
];

const COMPLETENESS_TITLE =
  /완전\s*정복|완전정복|완전\s*정리|완전정리|취업\s*시험과\s*시사\s*경제\s*완전/;

const FAKE_AUTHORITY =
  /Research Institute|Research Team|OIYO Research|Dr\.\s|Psychiatrist|Clinical Psychologist|CBT Therapist|Neuroscientist|Sleep Scientist|Jungian Analyst|Oiyo Expert/i;

const SOURCE_HEADING =
  /^##[^\n]*(출처|근거|참고문헌|읽을거리)[^\n]*$/m;

const WORKED_AMOUNT = /\d[\d,]*(?:\.\d+)?\s*(?:만\s*원|억원|원|USD|달러)/;

const ALLOWED_AUTHOR_FALLBACK = ["OIYO 편집부", "Oiyo", "OIYO", "Oiyo Editorial"];

export function frontmatterOf(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

export function field(frontmatter, name) {
  const match = frontmatter.match(
    new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, "m"),
  );
  return match?.[1]?.trim() ?? "";
}

export function bodyOf(text) {
  return text.replace(/^---\n[\s\S]*?\n---\s*/, "");
}

export function withoutFences(text) {
  return text.replace(/```[\s\S]*?```/g, "\n");
}

export function loadTiersConfig(root) {
  const file = path.join(root, "config/editorial-quality-tiers.json");
  if (!fs.existsSync(file)) {
    throw new Error(`missing ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function classify({ slug, track, category, series, localeDir }, tiers) {
  if (track === "dictionary") return "A";
  if (track === "magazine" || track === "interactive") return "C";

  const prefixes = tiers.knowledgeSeriesPrefixes ?? [];
  if (
    prefixes.some((prefix) => slug === prefix || slug.startsWith(`${prefix}-ch`))
  ) {
    return "A";
  }

  const examSlug = new RegExp(tiers.examSlugPattern ?? "a^", "i");
  const examSeries = new RegExp(tiers.examSeriesPattern ?? "a^", "i");
  if (category === "Exam" || examSlug.test(slug) || examSeries.test(series)) {
    return "B";
  }

  if (track === "academy" || track === "education") return "B";
  if (localeDir && (slug.startsWith("academy-") || slug.startsWith("education-"))) {
    return "B";
  }
  return "C";
}

export function isHomepageUrl(url) {
  try {
    const parsed = new URL(url);
    const trimmed = parsed.pathname.replace(/\/+$/, "");
    const path = trimmed === "" ? "/" : trimmed;
    if (path !== "/" && !/^\/(?:index|main|home)(?:\.(?:html?|php|asp|aspx|do|jsp))?$/i.test(path)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function extractMarkdownLinks(block) {
  const links = [];
  const re = /\[([^\]]*)\]\((https?:[^)\s]+)\)/g;
  let match;
  while ((match = re.exec(block))) {
    links.push({ text: match[1], url: match[2] });
  }
  return links;
}

function sourceSections(body) {
  const lines = body.split(/\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (current) sections.push(current);
      current = SOURCE_HEADING.test(line) ? { heading: line, lines: [] } : null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections.map((section) => ({
    heading: section.heading,
    text: section.lines.join("\n"),
  }));
}

function homepageSourceViolation(body) {
  const sections = sourceSections(withoutFences(body));
  if (!sections.length) return null;
  const official = sections.filter((section) => /공식\s*출처\s*확인/.test(section.heading));
  const targets = official.length ? official : [];
  if (!targets.length) return null;

  for (const section of targets) {
    const links = extractMarkdownLinks(section.text);
    if (!links.length) {
      return "official-source section has no URLs";
    }
    const allHome = links.every((link) => isHomepageUrl(link.url));
    const hasLocator = /(제\s*\d+\s*조|문단|DOI|쪽|절|accessed|확인 대상)/i.test(section.text);
    if (allHome && !hasLocator) {
      return `homepage-only sources: ${links.map((link) => link.url).join(", ")}`;
    }
  }
  return null;
}

function fakeAuthorityViolation(frontmatter, tiers) {
  const allowed = new Set(tiers.allowedAuthors ?? ALLOWED_AUTHOR_FALLBACK);
  const author = field(frontmatter, "author");
  const reviewer = field(frontmatter, "reviewer");
  for (const value of [author, reviewer]) {
    if (!value) continue;
    if (allowed.has(value)) continue;
    if (FAKE_AUTHORITY.test(value)) {
      return `fake authority byline: ${value}`;
    }
  }
  return null;
}

function imageAltViolations(body) {
  const text = withoutFences(body);
  const hits = [];
  const md = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = md.exec(text))) {
    if (!match[1].trim()) hits.push(`empty markdown alt for ${match[2]}`);
  }
  const img = /<(?:img|Image|IMG)\b([^>]*)>/g;
  while ((match = img.exec(text))) {
    const attrs = match[1];
    if (/\balt\s*=\s*(['"])\s*\1/.test(attrs) || !/\balt\s*=/.test(attrs)) {
      hits.push("image tag missing alt");
    }
  }
  return hits;
}

function workedExampleViolation(body) {
  const text = withoutFences(body);
  if (!text.includes("암기 포인트")) return null;
  if (WORKED_AMOUNT.test(text)) return null;
  return "tier A article uses memorization cards without a worked numeric example";
}

export function inspectArticle({ rel, text, tiers }) {
  const frontmatter = frontmatterOf(text);
  const body = bodyOf(text);
  const localeDir = rel.split(path.sep)[0];
  const slug = path.basename(rel, ".mdx");
  const track = field(frontmatter, "track");
  const category = field(frontmatter, "category");
  const series = field(frontmatter, "series");
  const title = field(frontmatter, "title");
  const redirectOnly = Boolean(
    field(frontmatter, "redirectTo") || field(frontmatter, "redirectToBlog"),
  );
  const tier = classify({ slug, track, category, series, localeDir }, tiers);
  const axes = {
    completenessTitle: null,
    homepageSources: null,
    fakeAuthority: null,
    imageAlt: [],
    workedExample: null,
  };

  if (redirectOnly) {
    return { rel, slug, localeDir, track, category, series, title, tier, redirectOnly, axes };
  }

  const description = field(frontmatter, "description");
  const completenessHit = [title, description].find((value) => COMPLETENESS_TITLE.test(value));
  if (completenessHit) {
    axes.completenessTitle = `completeness marketing: ${completenessHit}`;
  }
  if (tier === "A" || tier === "B") {
    axes.homepageSources = homepageSourceViolation(body);
  }
  axes.fakeAuthority = fakeAuthorityViolation(frontmatter, tiers);
  axes.imageAlt = imageAltViolations(body);
  if (tier === "A") {
    axes.workedExample = workedExampleViolation(body);
  }

  return { rel, slug, localeDir, track, category, series, title, tier, redirectOnly, axes };
}

export function summarize(results) {
  const counts = {
    files: results.length,
    tiers: { A: 0, B: 0, C: 0 },
    completenessTitle: 0,
    homepageSources: 0,
    fakeAuthority: 0,
    imageAlt: 0,
    workedExample: 0,
  };
  const violations = {
    completenessTitle: [],
    homepageSources: [],
    fakeAuthority: [],
    imageAlt: [],
    workedExample: [],
  };
  for (const result of results) {
    counts.tiers[result.tier] = (counts.tiers[result.tier] ?? 0) + 1;
    if (result.redirectOnly) continue;
    for (const axis of AXES) {
      const value = result.axes[axis];
      const hit = Array.isArray(value) ? value.length > 0 : Boolean(value);
      if (!hit) continue;
      counts[axis] += 1;
      violations[axis].push({
        rel: result.rel,
        tier: result.tier,
        detail: Array.isArray(value) ? value[0] : value,
      });
    }
  }
  return { counts, violations };
}

export function emptyBaseline() {
  return {
    recordedOn: new Date().toISOString().slice(0, 10),
    source: "scripts/lib/editorial-quality.mjs",
    note: "Ceiling, not a target. Existing violations are not bulk-rewritten by adding this gate.",
    axes: Object.fromEntries(AXES.map((axis) => [axis, { maxViolations: 0 }])),
  };
}

export function applyBaseline(summary, baseline) {
  const failures = [];
  if (!baseline?.axes) {
    return { failures, missingBaseline: true };
  }
  for (const axis of AXES) {
    const max = baseline.axes[axis]?.maxViolations;
    const actual = summary.counts[axis];
    if (typeof max !== "number") {
      failures.push(`${axis}: baseline missing maxViolations`);
      continue;
    }
    if (actual > max) {
      const extras = summary.violations[axis]
        .slice(0, 12)
        .map((item) => `    ${item.rel}: ${item.detail}`)
        .join("\n");
      failures.push(
        `${axis} regrowth: ${actual} articles violate, ceiling is ${max} (recorded ${baseline.recordedOn}).\n${extras}`,
      );
    }
  }
  return { failures, missingBaseline: false };
}

export function baselineFromSummary(summary) {
  const recordedOn = new Date().toISOString().slice(0, 10);
  return {
    recordedOn,
    source: "scripts/lib/editorial-quality.mjs",
    note: "Ceiling, not a target. Do not raise these numbers to make an audit pass.",
    axes: Object.fromEntries(
      AXES.map((axis) => [axis, { maxViolations: summary.counts[axis] }]),
    ),
    tiers: summary.counts.tiers,
  };
}
