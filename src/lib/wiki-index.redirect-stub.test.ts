import assert from "node:assert/strict";
import { test } from "node:test";
import { isRedirectStub } from "./redirect-stub.ts";

test("isRedirectStub treats redirectTo and redirectToBlog as menu stubs", () => {
  assert.equal(isRedirectStub({}), false);
  assert.equal(isRedirectStub({ redirectTo: "/personal-color/test" }), true);
  assert.equal(isRedirectStub({ redirectToBlog: "/education-economics-ch41" }), true);
});
