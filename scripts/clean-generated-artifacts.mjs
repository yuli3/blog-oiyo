import { rmSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = resolve(process.cwd());
const expectedPackage = resolve(root, "package.json");

if (!expectedPackage.startsWith(`${root}${sep}`)) {
  throw new Error("Refusing to clean outside the project root.");
}

for (const relativePath of [".astro", "dist"]) {
  const target = resolve(root, relativePath);
  if (!target.startsWith(`${root}${sep}`)) {
    throw new Error(`Refusing to clean unsafe path: ${target}`);
  }
  rmSync(target, { recursive: true, force: true });
  console.log(`cleaned ${relativePath}`);
}
