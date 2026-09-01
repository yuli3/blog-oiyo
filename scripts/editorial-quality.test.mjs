import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyBaseline,
  baselineFromSummary,
  classify,
  inspectArticle,
  isHomepageUrl,
  loadTiersConfig,
  summarize,
} from "./lib/editorial-quality.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tiers = loadTiersConfig(root);

function inspect(rel, text) {
  return inspectArticle({ rel, text, tiers });
}

test("homepage URL detection", () => {
  assert.equal(isHomepageUrl("https://www.fss.or.kr"), true);
  assert.equal(isHomepageUrl("https://www.fss.or.kr/"), true);
  assert.equal(isHomepageUrl("https://fine.fss.or.kr"), true);
  assert.equal(
    isHomepageUrl("https://www.ifrs.org/issued-standards/list-of-standards/conceptual-framework/"),
    false,
  );
  assert.equal(
    isHomepageUrl("https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1"),
    false,
  );
});

test("tier allowlist vs exam default", () => {
  assert.equal(
    classify({ slug: "academy-accounting-basics-ch3", track: "academy" }, tiers),
    "A",
  );
  assert.equal(
    classify({ slug: "academy-ielts-prep-ch1", track: "academy", category: "Exam" }, tiers),
    "B",
  );
  assert.equal(
    classify({ slug: "academy-civil-law-basics-ch1", track: "academy" }, tiers),
    "B",
  );
  assert.equal(
    classify({ slug: "meaning-of-mbti", track: "dictionary" }, tiers),
    "A",
  );
  assert.equal(
    classify({ slug: "dopamine-dependency-test", track: "interactive" }, tiers),
    "C",
  );
});

test("inline fixtures: homepage sources and completeness title", () => {
  const home = inspect(
    "ko/sample.mdx",
    `---
track: academy
title: "회계학 — 손익계산서"
series: 회계 기초
---

## 공식 출처 확인

- [금융감독원](https://www.fss.or.kr)
- [파인](https://fine.fss.or.kr)
`,
  );
  assert.equal(home.tier, "B");
  assert.match(home.axes.homepageSources ?? "", /homepage-only/);

  const complete = inspect(
    "ko/academy-ielts-prep-ch1.mdx",
    `---
track: academy
category: Exam
title: "IELTS 완전 정복 — 시험 구조"
author: OIYO 편집부
---

본문.
`,
  );
  assert.equal(complete.tier, "B");
  assert.match(complete.axes.completenessTitle ?? "", /완전 정복/);
});

test("inline fixtures: gold-style sources pass homepage axis", () => {
  const gold = inspect(
    "ko/academy-accounting-basics-ch1.mdx",
    `---
track: academy
title: "회계학 개론"
author: OIYO 편집부
---

현금 1,000만 원과 차입 400만 원.

## 근거와 읽을거리

1. [IFRS Foundation, Conceptual Framework](https://www.ifrs.org/issued-standards/list-of-standards/conceptual-framework/).
`,
  );
  assert.equal(gold.tier, "A");
  assert.equal(gold.axes.homepageSources, null);
  assert.equal(gold.axes.fakeAuthority, null);
  assert.equal(gold.axes.workedExample, null);
});

test("tier A memorization without amounts fails workedExample", () => {
  const article = inspect(
    "ko/academy-accounting-basics-ch3.mdx",
    `---
track: academy
title: "손익계산서"
author: OIYO 편집부
---

**발생주의 회계** ★★★★★
: 경제적 사건 발생 시점에 인식.
*암기 포인트: 발생주의 = 경제적 사건 발생 시 인식*
`,
  );
  assert.equal(article.tier, "A");
  assert.match(article.axes.workedExample ?? "", /worked numeric example/);
});

test("fake authority flags Research Institute, allows 편집부", () => {
  const fake = inspect(
    "ko/meaning-of-mbti.mdx",
    `---
track: dictionary
title: "MBTI"
author: OIYO Research Institute
reviewer: OIYO Research Institute
---

정의.
`,
  );
  assert.match(fake.axes.fakeAuthority ?? "", /Research Institute/);

  const ok = inspect(
    "ko/meaning-of-cognitive-load.mdx",
    `---
track: dictionary
title: "인지 부하"
author: OIYO 편집부
---

정의.
`,
  );
  assert.equal(ok.axes.fakeAuthority, null);
});

test("ratchet fails only on regrowth", () => {
  const summary = summarize([
    inspect("ko/a.mdx", `---\ntrack: academy\ncategory: Exam\ntitle: "IELTS 완전 정복"\nauthor: OIYO 편집부\n---\n`),
  ]);
  const baseline = baselineFromSummary(summary);
  assert.equal(applyBaseline(summary, baseline).failures.length, 0);
  const grown = summarize([
    inspect("ko/a.mdx", `---\ntrack: academy\ncategory: Exam\ntitle: "IELTS 완전 정복"\nauthor: OIYO 편집부\n---\n`),
    inspect("ko/b.mdx", `---\ntrack: academy\ncategory: Exam\ntitle: "토익 완전 정리"\nauthor: OIYO 편집부\n---\n`),
  ]);
  assert.ok(applyBaseline(grown, baseline).failures.some((item) => item.startsWith("completenessTitle")));
});

function readKo(slug) {
  const rel = path.join("src/content/blog/ko", `${slug}.mdx`);
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return { rel: path.join("ko", `${slug}.mdx`), text: fs.readFileSync(full, "utf8") };
}

test("corpus fixtures: gold sources vs template sources", () => {
  const ch1 = readKo("academy-accounting-basics-ch1");
  const ch3 = readKo("academy-accounting-basics-ch3");
  const tax = readKo("academy-tax-law-basic-ch1");
  const ielts = readKo("academy-ielts-prep-ch1");
  assert.ok(ch1 && ch3 && tax && ielts, "expected ko academy fixtures in this worktree");

  const gold = inspect(ch1.rel, ch1.text);
  assert.equal(gold.tier, "A");
  assert.equal(gold.axes.homepageSources, null, gold.axes.homepageSources);
  assert.equal(gold.axes.fakeAuthority, null);
  assert.equal(gold.axes.workedExample, null);

  const revised = inspect(ch3.rel, ch3.text);
  assert.equal(revised.tier, "A");
  assert.equal(revised.axes.homepageSources, null, revised.axes.homepageSources);
  assert.equal(revised.axes.workedExample, null, revised.axes.workedExample);
  assert.equal(revised.axes.imageAlt.length, 0);

  const taxArticle = inspect(tax.rel, tax.text);
  assert.equal(taxArticle.tier, "A");
  assert.equal(taxArticle.axes.homepageSources, null, taxArticle.axes.homepageSources);

  const exam = inspect(ielts.rel, ielts.text);
  assert.equal(exam.tier, "B");
  assert.equal(exam.axes.completenessTitle, null, exam.axes.completenessTitle);
});
