import assert from "node:assert/strict";
import test from "node:test";
import { classifyOgImage, resolveOgImage } from "./og-image.ts";

test("academy content uses the shared academy image", () => {
  assert.equal(classifyOgImage("academy", "/ko/academy-management-core-ch3/"), "academy");
});

test("fortune routes win over generic calculator matching", () => {
  assert.equal(classifyOgImage(undefined, "/ko/saju-calculator/"), "fortune");
});

test("calculator and converter routes use the tool image", () => {
  assert.equal(classifyOgImage(undefined, "/ko/height-converter/"), "tool");
  assert.equal(classifyOgImage(undefined, "/en/salary-calculator/"), "tool");
});

test("unmatched pages retain the legacy default image", () => {
  assert.equal(classifyOgImage("magazine", "/ko/magazine-work-guide/"), "default");
});

test("an explicit hero image always has priority and becomes absolute", () => {
  assert.equal(
    resolveOgImage({
      explicitImage: "/images/custom.jpg",
      track: "academy",
      pathname: "/ko/academy-example/",
      siteUrl: "https://blog.oiyo.net",
    }),
    "https://blog.oiyo.net/images/custom.jpg",
  );
});
