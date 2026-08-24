import fs from "node:fs";

const layout = fs.readFileSync("src/layouts/BaseLayout.astro", "utf8");
const drawer = fs.readFileSync("src/components/DrawerCategories.astro", "utf8");

if (!layout.includes("<DrawerCategories")) {
  throw new Error("Audit assumption changed: BaseLayout no longer renders DrawerCategories");
}

if (drawer.includes('from "astro:content"') || drawer.includes("getCollection(")) {
  console.error(
    "FAIL: DrawerCategories is rendered by BaseLayout and queries the full content collection per page",
  );
  process.exit(1);
}

console.log("PASS: global layout components do not query the full content collection per page");
