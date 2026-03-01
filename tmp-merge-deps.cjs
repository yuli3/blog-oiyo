const fs = require("fs");

const srcPkg = JSON.parse(
  fs.readFileSync("/Users/seuncho/coding/ahoxy-astro/package.json", "utf8"),
);
const destPkgFile = "/Users/seuncho/coding/blog-oiyo/package.json";
const destPkg = JSON.parse(fs.readFileSync(destPkgFile, "utf8"));

let changed = false;
const depsToMerge = srcPkg.dependencies || {};

for (const [name, version] of Object.entries(depsToMerge)) {
  if (!destPkg.dependencies[name]) {
    destPkg.dependencies[name] = version;
    changed = true;
    console.log(`Added dependency: ${name}@${version}`);
  }
}

if (changed) {
  fs.writeFileSync(destPkgFile, JSON.stringify(destPkg, null, 2));
  console.log("Merged dependencies.");
} else {
  console.log("No new dependencies to merge.");
}
