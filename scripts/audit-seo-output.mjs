import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://blog.oiyo.net";
const sitemapIndexName = "sitemap-index.xml";

const failures = [];
const sitemapUrls = new Set();
const explicitNoindexUrls = new Set();

function listMdxFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdxFiles(full);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [full] : [];
  });
}

const contentRoot = path.join(root, "src/content/blog");
for (const file of listMdxFiles(contentRoot)) {
  const source = fs.readFileSync(file, "utf8");
  const frontmatter = source.match(/^---\n[\s\S]*?\n---/)?.[0] ?? "";
  if (!/^noindex:\s*true\s*$/m.test(frontmatter)) continue;
  const route = path.relative(contentRoot, file).split(path.sep).join("/").replace(/\.mdx$/, "");
  explicitNoindexUrls.add(`${siteUrl}/${route}/`);
}

if (!fs.existsSync(dist)) {
  failures.push("dist directory is missing; run npm run build first");
} else {
  const sitemapIndex = path.join(dist, sitemapIndexName);
  if (!fs.existsSync(sitemapIndex)) failures.push(`missing ${sitemapIndexName}`);
  const sitemapFiles = fs.readdirSync(dist).filter((file) => /^sitemap-\d+\.xml$/.test(file)).sort();
  if (sitemapFiles.length === 0) failures.push("no sitemap chunk files found");
  if (fs.existsSync(sitemapIndex)) {
    const indexXml = fs.readFileSync(sitemapIndex, "utf8");
    for (const file of sitemapFiles) {
      if (!indexXml.includes(`${siteUrl}/${file}`)) {
        failures.push(`sitemap-index.xml does not reference ${file}`);
      }
    }
  }

  for (const file of sitemapFiles) {
    const sitemapPath = path.join(dist, file);
    if (!fs.existsSync(sitemapPath)) continue;
    const xml = fs.readFileSync(sitemapPath, "utf8");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapUrls.add(match[1]);
    }
  }
}

function listHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(full);
    return entry.isFile() && entry.name === "index.html" ? [full] : [];
  });
}

function urlToDistPath(url) {
  if (!url.startsWith(siteUrl)) return null;
  const pathname = new URL(url).pathname;
  return path.join(dist, pathname, "index.html");
}

let checkedHtml = 0;
let intentionalGameStubs = 0;
for (const file of listHtmlFiles(dist)) {
  checkedHtml += 1;
  const rel = path.relative(dist, file);
  const html = fs.readFileSync(file, "utf8");

  // Bridge stubs are noindex and canonicalize cross-domain to the family
  // canonical host — any OIYO family canonical is valid there.
  const isNoindex = /<meta name="robots" content="noindex/.test(html);
  const canonicalRe = isNoindex
    ? /<link rel="canonical" href="https:\/\/(blog\.|wiki\.|game\.)?oiyo\.net\//
    : /<link rel="canonical" href="https:\/\/blog\.oiyo\.net\//;
  if (!canonicalRe.test(html)) {
    failures.push(`${rel}: missing canonical link`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const pageUrl = `${siteUrl}/${rel.replace(/index\.html$/, "")}`;
  if (isNoindex && sitemapUrls.has(pageUrl)) {
    failures.push(`${rel}: noindex page must not appear in sitemap`);
  }
  if (explicitNoindexUrls.has(pageUrl) && sitemapUrls.has(pageUrl)) {
    failures.push(`${rel}: explicit frontmatter noindex page must not appear in sitemap`);
  }
  if (isNoindex && canonical?.startsWith("https://game.oiyo.net/")) {
    const refreshTarget = html.match(
      /<meta http-equiv="refresh" content="0;\s*url=([^"]+)"/,
    )?.[1];
    if (refreshTarget !== canonical) {
      failures.push(`${rel}: game redirect stub refresh target does not match canonical`);
    } else {
      intentionalGameStubs += 1;
    }
  }

  for (const match of html.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"\/?>/g)) {
    const target = urlToDistPath(match[1]);
    if (target && !fs.existsSync(target)) {
      failures.push(`${rel}: hreflang target does not exist: ${match[1]}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures.slice(0, 80)) {
    console.error(`error: ${failure}`);
  }
  if (failures.length > 80) {
    console.error(`error: ${failures.length - 80} more SEO failures omitted`);
  }
  console.error(`SEO output audit failed: ${failures.length} issue(s)`);
  process.exit(1);
}

console.log(
  `SEO output audit passed (${checkedHtml} HTML file(s) checked; ${intentionalGameStubs} intentional game redirect stub(s))`,
);
