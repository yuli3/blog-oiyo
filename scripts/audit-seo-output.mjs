import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://blog.oiyo.net";
const requiredSitemaps = [
  "sitemap-index.xml",
  "sitemap-0.xml",
  "sitemap-1.xml",
  "sitemap-2.xml",
];

const failures = [];
const sitemapUrls = new Set();

if (!fs.existsSync(dist)) {
  failures.push("dist directory is missing; run npm run build first");
} else {
  for (const file of requiredSitemaps) {
    if (!fs.existsSync(path.join(dist, file))) {
      failures.push(`missing ${file}`);
    }
  }

  const sitemapIndex = path.join(dist, "sitemap-index.xml");
  if (fs.existsSync(sitemapIndex)) {
    const indexXml = fs.readFileSync(sitemapIndex, "utf8");
    for (const file of requiredSitemaps.filter((file) => file !== "sitemap-index.xml")) {
      if (!indexXml.includes(`${siteUrl}/${file}`)) {
        failures.push(`sitemap-index.xml does not reference ${file}`);
      }
    }
  }

  for (const file of requiredSitemaps.filter((file) => file !== "sitemap-index.xml")) {
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
  if (isNoindex && canonical?.startsWith("https://game.oiyo.net/")) {
    const refreshTarget = html.match(
      /<meta http-equiv="refresh" content="0;\s*url=([^"]+)"/,
    )?.[1];
    if (refreshTarget !== canonical) {
      failures.push(`${rel}: game redirect stub refresh target does not match canonical`);
    } else {
      intentionalGameStubs += 1;
    }
    const pageUrl = `${siteUrl}/${rel.replace(/index\.html$/, "")}`;
    if (sitemapUrls.has(pageUrl)) {
      failures.push(`${rel}: game redirect stub must not appear in sitemap`);
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
