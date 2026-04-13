const fs = require("fs");
const path = require("path");

const dirs = [
  "/Users/seuncho/coding/blog-oiyo/src/content/articles",
  "/Users/seuncho/coding/blog-oiyo/src/content/education",
];

const importsByFile = {};

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const match = line.match(
          /^import\s+\{([^}]+)\}\s+from\s+['"](@\/[^'"]+)['"]/,
        );
        if (match) {
          const imports = match[1].split(",").map((s) => s.trim());
          const target = match[2];
          if (!importsByFile[target]) importsByFile[target] = new Set();
          imports.forEach((i) => importsByFile[target].add(i));
        }
      }
    }
  }
}

dirs.forEach(scanDir);

for (const [target, symbols] of Object.entries(importsByFile)) {
  console.log(`${target}: ${Array.from(symbols).join(", ")}`);
}
