import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const redirectsPath = path.join(root, "public/_redirects");
const routeRoot = path.join(root, "src/pages/[...lang]");
const distRoot = path.join(root, "dist");
const failures = [];

const declarations = fs.readFileSync(redirectsPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
const sources = new Map();
let staticCount = 0;
let dynamicCount = 0;

for (const declaration of declarations) {
  const [source, target, status = "302"] = declaration.split(/\s+/);
  if (!source || !target) {
    failures.push(`malformed redirect: ${declaration}`);
    continue;
  }
  if (status === "200") continue;
  const previous = sources.get(source);
  if (previous && previous !== `${target} ${status}`) {
    failures.push(`conflicting source ${source}: ${previous} vs ${target} ${status}`);
  }
  sources.set(source, `${target} ${status}`);
  if (/[\*:]/.test(source)) dynamicCount += 1;
  else staticCount += 1;
}

if (staticCount > 2000) failures.push(`Cloudflare static redirect limit exceeded: ${staticCount}`);
if (dynamicCount > 100) failures.push(`Cloudflare dynamic redirect limit exceeded: ${dynamicCount}`);

for (const entry of fs.readdirSync(routeRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".astro") || entry.name.startsWith("[")) continue;
  const source = fs.readFileSync(path.join(routeRoot, entry.name), "utf8");
  if (/(?:OiyoCanonicalRedirect|BlogCanonicalRedirect|<meta\s+http-equiv=["']refresh)/i.test(source)) {
    failures.push(`redirect-only Astro source remains: ${entry.name}`);
  }
}

function listHtml(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtml(full);
    return entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
  });
}

let refreshHtml = 0;
for (const file of listHtml(distRoot)) {
  if (path.relative(distRoot, file) === "index.html") continue;
  if (/<meta\s+http-equiv=["']refresh["']/i.test(fs.readFileSync(file, "utf8"))) refreshHtml += 1;
}
if (refreshHtml > 0) failures.push(`${refreshHtml} meta-refresh HTML page(s) remain in dist`);

if (failures.length) {
  for (const failure of failures.slice(0, 80)) console.error(`error: ${failure}`);
  console.error(`edge redirect audit failed: ${failures.length} issue(s)`);
  process.exit(1);
}

console.log(`edge redirect audit passed (static=${staticCount}, dynamic=${dynamicCount}, contentRefreshHtml=0)`);
