#!/usr/bin/env node
/**
 * OIYO 패밀리 교차 사이트 링크 감사.
 *
 * 왜 있나
 * -------
 * scripts/link-audit.py 는 `href="(/...)"` 정규식으로 **상대 경로만** 본다.
 * 2026-09-03 실측: blog dist 의 절대 링크가 107,529개인데(blog 38,251 ·
 * game 26,680 · oiyo 16,225 · wiki 15,841 · news 10,532) 그중 단 하나도
 * 기존 감사를 거치지 않았다.
 *
 * 게다가 link-audit.py 의 redirect_covers() 는 **규칙이 존재하는지만** 본다.
 * 규칙의 목적지가 실제로 사는지는 확인하지 않는다 — 같은 날 발견한
 * `blog → 301 → oiyo.net/{loc}/adhd-screening-test → 404` 가 정확히 그
 * 사각지대였다. 규칙이 있으니 "안 깨졌다"고 보고됐다.
 *
 * 이 스크립트는 그 둘을 메운다:
 *   1. 절대 링크를 도메인별로 모아 각 사이트의 로컬 dist 로 실물 확인한다.
 *   2. 리다이렉트를 따라간 **최종 목적지**가 존재하는지 확인한다.
 *
 * 쓰는 법
 * -------
 *   node scripts/cross-site-link-audit.mjs
 *   node scripts/cross-site-link-audit.mjs --json      # 기계 판독용
 *
 * 각 사이트의 dist 는 미리 빌드돼 있어야 한다. 없는 사이트는 "검증 불가"로
 * 따로 세어 보고한다 — 조용히 통과시키지 않는다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = "/Users/seuncho/coding";
const asJson = process.argv.includes("--json");

/** 도메인 → 그 사이트의 dist 경로와 리다이렉트 SSOT. 없으면 검증 불가로 센다. */
const SITES = {
  "blog.oiyo.net": {
    dist: path.join(ROOT, ".worktrees/blog-category-sort/dist"),
    redirects: [
      path.join(ROOT, ".worktrees/blog-category-sort/data/redirects/canonical-redirects.txt"),
      path.join(ROOT, ".worktrees/blog-category-sort/public/_redirects"),
    ],
  },
  "oiyo.net": {
    dist: path.join(ROOT, ".worktrees/oiyo-mysticism/dist"),
    redirects: [path.join(ROOT, ".worktrees/oiyo-mysticism/public/_redirects")],
  },
  "wiki.oiyo.net": {
    dist: path.join(ROOT, "wiki/dist"),
    redirects: [path.join(ROOT, "wiki/public/_redirects")],
  },
  "game.oiyo.net": { dist: path.join(ROOT, "game/dist"), redirects: [] },
  "news.oiyo.net": { dist: path.join(ROOT, "news/dist"), redirects: [] },
};

function loadPages(dist) {
  if (!dist || !existsSync(dist)) return null;
  const pages = new Set();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name === "index.html") {
        const rel = "/" + path.relative(dist, path.dirname(p));
        pages.add(rel === "/." ? "/" : rel);
      }
    }
  };
  walk(dist);
  return pages;
}

/** `/:lang/foo*` 같은 규칙을 정규식으로. 목적지도 함께 돌려준다. */
function loadRedirects(files) {
  const rules = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const raw of readFileSync(f, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const [src, dst] = line.split(/\s+/);
      if (!src || !dst) continue;
      rules.push({ src, dst });
    }
  }
  return rules;
}

function resolveRedirect(rules, pathname) {
  for (const { src, dst } of rules) {
    if (src.includes("*") || src.includes(":")) {
      let pattern = src.replace(/\*/g, "(.*)");
      pattern = pattern.replace(/:[A-Za-z][A-Za-z0-9_]*/g, "([^/]+)");
      const m = new RegExp(`^${pattern}/?$`).exec(pathname);
      if (m) {
        // :lang·:splat 치환은 정확히 복원하기 어렵다 — 목적지에 자리표시자가
        // 남으면 "검증 불가"로 넘긴다. 있지도 않은 경로를 만들어 내지 않는다.
        if (/[:*]/.test(dst)) return { to: null, unresolvable: true };
        return { to: dst };
      }
    } else if (src.replace(/\/$/, "") === pathname.replace(/\/$/, "")) {
      return { to: dst };
    }
  }
  return null;
}

// ── dist·리다이렉트 적재 ────────────────────────────────────────────────
const loaded = {};
for (const [host, cfg] of Object.entries(SITES)) {
  loaded[host] = { pages: loadPages(cfg.dist), rules: loadRedirects(cfg.redirects) };
}

// ── blog dist 에서 링크 수집 ────────────────────────────────────────────
const blogDist = SITES["blog.oiyo.net"].dist;
const links = new Map(); // "host|pathname" → Set(출처 페이지)
const HREF = /href="(https?:\/\/[^"]+|\/[^"#?]*)/g;

function collect(dist) {
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name === "index.html") {
        const from = "/" + path.relative(dist, path.dirname(p));
        const text = readFileSync(p, "utf8");
        for (const m of text.matchAll(HREF)) {
          const href = m[1];
          let host, pathname;
          if (href.startsWith("/")) {
            host = "blog.oiyo.net";
            pathname = href.split("#")[0].split("?")[0];
          } else {
            let u;
            try { u = new URL(href); } catch { continue; }
            host = u.host;
            pathname = u.pathname;
          }
          if (!SITES[host]) continue; // 패밀리 밖 외부 링크는 이 감사의 대상이 아니다
          if (/\.(xml|txt|png|jpe?g|svg|webp|ico|json|js|css|pdf|woff2?)$/.test(pathname)) continue;
          const key = `${host}|${pathname.replace(/\/$/, "") || "/"}`;
          if (!links.has(key)) links.set(key, new Set());
          if (links.get(key).size < 3) links.get(key).add(from);
        }
      }
    }
  };
  walk(dist);
}
collect(blogDist);

// ── 판정 ────────────────────────────────────────────────────────────────
const result = {
  ok: 0,
  viaRedirect: 0,
  brokenDirect: [],       // 페이지도 없고 규칙도 없다
  brokenAfterRedirect: [], // 규칙은 있는데 그 목적지가 없다 ← 오늘 잡은 부류
  unverifiable: [],       // 해당 사이트 dist 가 없어 확인 못 함
};

for (const [key, froms] of links) {
  const [host, pathname] = key.split("|");
  const site = loaded[host];
  if (!site.pages) {
    result.unverifiable.push({ host, pathname, from: [...froms][0] });
    continue;
  }
  const norm = pathname.replace(/\/$/, "") || "/";
  if (site.pages.has(norm) || site.pages.has(pathname)) { result.ok++; continue; }

  const r = resolveRedirect(site.rules, pathname);
  if (!r) { result.brokenDirect.push({ host, pathname, from: [...froms] }); continue; }
  if (r.unresolvable) { result.unverifiable.push({ host, pathname, from: [...froms][0], reason: "자리표시자 목적지" }); continue; }

  // 목적지가 실제로 사는지 본다 — 여기가 link-audit.py 의 사각지대였다.
  let dHost = host, dPath = r.to;
  if (/^https?:\/\//.test(r.to)) {
    try { const u = new URL(r.to); dHost = u.host; dPath = u.pathname; } catch { /* noop */ }
  }
  const dSite = loaded[dHost];
  if (!dSite?.pages) { result.unverifiable.push({ host, pathname, to: r.to, from: [...froms][0], reason: "목적지 사이트 dist 없음" }); continue; }
  const dNorm = dPath.replace(/\/$/, "") || "/";
  if (dSite.pages.has(dNorm) || dSite.pages.has(dPath)) { result.viaRedirect++; continue; }
  result.brokenAfterRedirect.push({ host, pathname, to: r.to, from: [...froms] });
}

// ── 출력 ────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.brokenDirect.length || result.brokenAfterRedirect.length ? 1 : 0);
}

const total = links.size;
console.log(`## 교차 사이트 링크 감사\n`);
console.log(`- 검사한 고유 링크 대상: **${total.toLocaleString()}**`);
console.log(`- 바로 존재: **${result.ok.toLocaleString()}**`);
console.log(`- 리다이렉트를 거쳐 존재: **${result.viaRedirect.toLocaleString()}**`);
console.log(`- ❌ 깨짐(규칙도 페이지도 없음): **${result.brokenDirect.length.toLocaleString()}**`);
console.log(`- ❌ 리다이렉트 목적지가 없음: **${result.brokenAfterRedirect.length.toLocaleString()}**`);
console.log(`- ⚠️ 검증 불가: **${result.unverifiable.length.toLocaleString()}**\n`);

const byHost = (arr) => {
  const m = {};
  for (const x of arr) m[x.host] = (m[x.host] ?? 0) + 1;
  return m;
};
if (result.brokenDirect.length) {
  console.log(`### ❌ 깨진 링크 — 도메인별 ${JSON.stringify(byHost(result.brokenDirect))}\n`);
  for (const b of result.brokenDirect.slice(0, 25)) {
    console.log(`- \`${b.host}${b.pathname}\` ← ${b.from[0]}`);
  }
  if (result.brokenDirect.length > 25) console.log(`- …외 ${result.brokenDirect.length - 25}건`);
  console.log("");
}
if (result.brokenAfterRedirect.length) {
  console.log(`### ❌ 리다이렉트 목적지 없음 — 도메인별 ${JSON.stringify(byHost(result.brokenAfterRedirect))}\n`);
  for (const b of result.brokenAfterRedirect.slice(0, 25)) {
    console.log(`- \`${b.host}${b.pathname}\` → \`${b.to}\` ← ${b.from[0]}`);
  }
  if (result.brokenAfterRedirect.length > 25) console.log(`- …외 ${result.brokenAfterRedirect.length - 25}건`);
  console.log("");
}
if (result.unverifiable.length) {
  console.log(`### ⚠️ 검증 불가 — 도메인별 ${JSON.stringify(byHost(result.unverifiable))}`);
  console.log(`(해당 사이트를 빌드하면 확인된다)\n`);
}

process.exit(result.brokenDirect.length || result.brokenAfterRedirect.length ? 1 : 0);
