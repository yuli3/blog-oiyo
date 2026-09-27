import assert from "node:assert/strict";
import test from "node:test";

import { inspectChapter } from "./audit-academy-locales.mjs";

const source = `---
track: academy
locale: ko
category: Business
series: human-resource-management
chapter: 1
contentStage: review
updatedDate: 2026-09-15
---
## 전략적 HRM
개정 본문
`;
const oldEn = `---
track: academy
locale: en
category: Business
series: HRM Basics
chapter: 1
---
## HRM
Old overview
`;

test("a present but stale translation is not counted as missing", () => {
  const row = inspectChapter("academy-hrm-basics-ch1.mdx", source, { en: oldEn });
  assert.equal(row.byLocale.en.status, "present");
  assert.deepEqual(row.byLocale.en.signals, ["series-key", "stage-lag", "source-newer"]);
  assert.equal(row.byLocale.ja.status, "missing");
});

test("local scope is only a candidate, not an automatic exception", () => {
  const row = inspectChapter("local-ch1.mdx", source.replace("category: Business", "category: Exam\nmarket: KR\ncontentScope: local"), {});
  assert.equal(row.localCandidate, true);
  assert.equal(row.byLocale.en.status, "missing");
});

test("redirect and noindex shells are excluded", () => {
  assert.equal(inspectChapter("old.mdx", source.replace("track: academy", "track: academy\nredirectToBlog: /new"), {}), null);
  assert.equal(inspectChapter("old.mdx", source.replace("track: academy", "track: academy\nnoindex: true"), {}), null);
});
