import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginWrite } from "./same-origin.ts";

const req = (url: string, origin?: string) => new Request(url, { method: "POST", headers: origin ? { Origin: origin } : {} });

test("accepts the page's own origin (custom domain and pages.dev preview)", () => {
  assert.equal(isSameOriginWrite(req("https://blog.oiyo.net/api/share", "https://blog.oiyo.net")), true);
  assert.equal(isSameOriginWrite(req("https://abc.blog-oiyo.pages.dev/api/share", "https://abc.blog-oiyo.pages.dev")), true);
});

test("refuses a missing or foreign Origin", () => {
  assert.equal(isSameOriginWrite(req("https://blog.oiyo.net/api/share")), false);
  assert.equal(isSameOriginWrite(req("https://blog.oiyo.net/api/share", "https://evil.example")), false);
  assert.equal(isSameOriginWrite(req("https://blog.oiyo.net/api/share", "https://blog.oiyo.net.evil.example")), false);
});
