#!/usr/bin/env node
/**
 * data/redirects/canonical-redirects.txt 를 Cloudflare Bulk Redirects 라이브에
 * 반영한다. export-bulk-redirects.mjs 가 만든 bulk-redirect-items-by-list.json
 * 을 그대로 두 리스트에 통째로 갈아 끼운다("Update all list items" — 리스트를
 * 비우고 준 배열을 다시 채우는 원자적 PUT, 부분 diff 가 아니다).
 *
 * 왜 있나
 * -------
 * 2026-09-03 실측: repo 쪽 리다이렉트는 git push 로 바로 반영되지만, blog 는
 * Cloudflare Bulk Redirects 를 쓴다 — 이건 계정 단위 리소스라 별도로 밀어야
 * 한다. 지금까지는 CSV 를 만들어 대시보드에 손으로 올리거나, 세션 중에만 쓸 수
 * 있는 대화형 MCP 로 옮겨야 했다. 이 스크립트는 credentials.env 의 토큰
 * 하나로 어느 세션에서나 반복 가능하게 만든다.
 *
 * 안전장치
 * --------
 * - 기본은 read-only 진단이다. **--push 없이는 아무것도 바꾸지 않는다.**
 * - 리스트 하나를 통째로 교체하는 작업이라, 밀기 전에 반드시 대상 항목 수와
 *   기존 항목 수를 함께 보여준다. 자릿수가 크게 어긋나면(예: 절반 이하로
 *   줄어듦) --push 라도 확인 프롬프트 없이 진행하지 않고 --force 를 요구한다
 *   — export 가 실패해 빈 배열을 밀어 넣는 사고를 막는다.
 * - 계정당 대기 중인 벌크 작업은 1개뿐이라(API 제약) 두 리스트를 순차로 밀고,
 *   각각 완료를 폴링한 뒤 다음으로 넘어간다.
 *
 * 쓰는 법
 * -------
 *   node scripts/export-bulk-redirects.mjs          # 대상 상태를 먼저 만든다
 *   node scripts/sync-bulk-redirects.mjs             # 진단만 — diff 를 보여준다
 *   node scripts/sync-bulk-redirects.mjs --push      # 실제로 민다
 *
 * 자격증명
 * --------
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID — 환경변수 우선, 없으면
 *   ~/.config/oiyo/credentials.env 에서 읽는다(company-brain/scripts/lib/
 *   credential_guard.py 와 같은 계약 — mode 600·심볼릭 링크 아님·소유자 본인
 *   전용이 아니면 값을 읽지 않는다. 값은 어떤 경로로도 출력하지 않는다).
 */
import { lstatSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const CREDENTIALS_ENV_DEFAULT = path.join(os.homedir(), ".config/oiyo/credentials.env");
const push = process.argv.includes("--push");
const force = process.argv.includes("--force");

// ── 자격증명 (credential_guard.py 와 동일 계약) ─────────────────────────────
function credentialsEnvPath() {
  return process.env.OIYO_CREDENTIALS_FILE
    ? path.resolve(process.env.OIYO_CREDENTIALS_FILE)
    : CREDENTIALS_ENV_DEFAULT;
}

function requirePrivateFile(target) {
  let info;
  try {
    info = lstatSync(target);
  } catch {
    throw new Error(`자격증명 파일을 읽지 않았다: ${target}\n  이유: 파일이 없다`);
  }
  if (info.isSymbolicLink()) {
    throw new Error(`자격증명 파일을 읽지 않았다: ${target}\n  이유: 심볼릭 링크다`);
  }
  if (!info.isFile()) {
    throw new Error(`자격증명 파일을 읽지 않았다: ${target}\n  이유: 정규 파일이 아니다`);
  }
  if (info.uid !== process.getuid()) {
    throw new Error(
      `자격증명 파일을 읽지 않았다: ${target}\n  이유: 소유자가 현재 사용자가 아니다`,
    );
  }
  if (info.mode & 0o077) {
    throw new Error(
      `자격증명 파일을 읽지 않았다: ${target}\n  이유: 소유자 외에 접근 가능하다 (mode ${(info.mode & 0o777).toString(8)})\n  고치기: chmod 600 ${target}`,
    );
  }
}

function loadCredentialsEnv() {
  const target = credentialsEnvPath();
  requirePrivateFile(target);
  const values = {};
  for (const line of readFileSync(target, "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    values[key] = value;
  }
  return values;
}

function requireCredential(name) {
  const fromEnv = (process.env[name] || "").trim();
  if (fromEnv) return fromEnv;
  const value = (loadCredentialsEnv()[name] || "").trim();
  if (!value) {
    throw new Error(
      `${name} 을 찾지 못했다.\n` +
        `  둘 중 하나: 환경변수 ${name}, 또는 ${credentialsEnvPath()} 의 ${name}= 줄\n` +
        `  값을 코드나 문서에 다시 박지 않는다 — 회전할 곳이 늘어난다.`,
    );
  }
  return value;
}

const API_TOKEN = requireCredential("CLOUDFLARE_API_TOKEN");
const ACCOUNT_ID = requireCredential("CLOUDFLARE_ACCOUNT_ID");

// ── 대상 리스트. 2026-09-03 Cloudflare API 로 실측한 ID다(oiyo-astro 계정). ──
const LISTS = {
  canonical: { id: "5b7d0c1f3f304fdf83911b452a1824b9", name: "oiyo_blog_canonical_redirects" },
  expansion: { id: "226e49e185c040b5b3447415e869eaf3", name: "oiyo_blog_locale_expansions" },
};

const API_BASE = "https://api.cloudflare.com/client/v4";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 429 재시도 간격(초). 2026-09-04 실측: canonical 을 PUT 한 직후 expansion 을
 * PUT 하면 `10040: you have been ratelimited` 로 막힌다. Cloudflare 는 계정당
 * 대량 리스트 작업에 쿨다운을 둔다 — 두 리스트를 연달아 밀면 두 번째가
 * 걸린다. 그때 절반만 반영된 채로 죽었다(canonical 만 4,098, expansion 은
 * 1,666 그대로). 죽지 말고 기다렸다 다시 친다.
 */
const RETRY_BACKOFF_S = [20, 45, 90, 180, 300];

async function cf(pathname, options = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(`${API_BASE}${pathname}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const body = await res.json();
    if (res.ok && body.success !== false) return body;

    const msg = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join("; ") || res.statusText;
    const rateLimited = res.status === 429 || (body.errors || []).some((e) => e.code === 10040);
    if (rateLimited && attempt < RETRY_BACKOFF_S.length) {
      const wait = RETRY_BACKOFF_S[attempt];
      console.log(`  레이트리밋 — ${wait}초 뒤 재시도 (${attempt + 1}/${RETRY_BACKOFF_S.length})`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`Cloudflare API ${pathname} 실패 (HTTP ${res.status}): ${msg}`);
  }
}

/**
 * 리스트의 현재 항목 수.
 *
 * 2026-09-04: `/items?per_page=1` 의 `result_info.total_count` 를 읽고 있었는데,
 * 이 엔드포인트는 커서 페이지네이션이라 total_count 를 주지 않는다. 그래서
 * fallback 인 `result.length` 가 잡혀 **라이브가 늘 1건으로 보고됐다.**
 * 실제로는 canonical 2,496 · expansion 1,666 이었다.
 *
 * 이게 위험했던 이유: 축소 가드가 `대상 / 라이브` 비율로 걸리는데, 분모가 1이면
 * 비율이 늘 거대해져 **가드가 절대 발동하지 않는다.** 리스트를 통째로 날리는
 * 사고를 막으라고 만든 장치가 꺼져 있던 셈이다. 반영 후 검증(`after`)도 같은
 * 함수를 쓰니 똑같이 무의미했다.
 *
 * 정확한 출처는 리스트 메타의 `num_items` 다.
 */
async function listItemCount(listId) {
  const r = await cf(`/accounts/${ACCOUNT_ID}/rules/lists/${listId}`);
  const n = r.result?.num_items;
  if (typeof n !== "number") {
    throw new Error(`리스트 ${listId} 의 num_items 를 못 읽었다 — 건수를 모르면 가드가 무의미하다`);
  }
  return n;
}

/** 라이브 항목 전부를 커서로 훑어 온다. */
async function fetchAllItems(listId) {
  const out = [];
  let cursor;
  for (;;) {
    const q = new URLSearchParams({ per_page: "500", ...(cursor ? { cursor } : {}) });
    const r = await cf(`/accounts/${ACCOUNT_ID}/rules/lists/${listId}/items?${q}`);
    out.push(...(r.result || []));
    cursor = r.result_info?.cursors?.after;
    if (!cursor) return out;
  }
}

/** 라이브가 목표와 같은 내용인가. source→target 쌍을 정규화해 대조한다. */
async function sameAsLive(listId, targetItems) {
  const key = (redirect) =>
    `${redirect.source_url} ${redirect.target_url} ${redirect.status_code ?? 301}`;
  const live = new Set((await fetchAllItems(listId)).map((i) => key(i.redirect)));
  if (live.size !== targetItems.length) return false;
  return targetItems.every((i) => live.has(key(i.redirect)));
}

async function putAllItems(listId, items) {
  const r = await cf(`/accounts/${ACCOUNT_ID}/rules/lists/${listId}/items`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
  return r.result?.operation_id;
}

async function waitForOperation(operationId, { timeoutMs = 120_000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await cf(`/accounts/${ACCOUNT_ID}/rules/lists/bulk_operations/${operationId}`);
    const status = r.result?.status;
    if (status === "completed") return { status };
    if (status === "failed") return { status, error: r.result?.error };
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`벌크 작업 ${operationId} 이 ${timeoutMs}ms 안에 끝나지 않았다`);
}

// ── 실행 ──────────────────────────────────────────────────────────────────
const byListPath = path.join(
  process.cwd(),
  "reports/cloudflare-bulk-redirects/bulk-redirect-items-by-list.json",
);
let target;
try {
  target = JSON.parse(readFileSync(byListPath, "utf8"));
} catch {
  console.error(
    `ERROR: ${byListPath} 가 없다. 먼저 실행: node scripts/export-bulk-redirects.mjs`,
  );
  process.exit(1);
}

console.log(`대상: canonical ${target.canonical.length}건 · expansion ${target.expansion.length}건\n`);

for (const [kind, { id, name }] of Object.entries(LISTS)) {
  const targetItems = target[kind];
  const liveCount = await listItemCount(id);
  const delta = targetItems.length - liveCount;
  const shrinkRatio = liveCount > 0 ? targetItems.length / liveCount : 1;
  console.log(
    `${name} (${kind}) — 라이브 ${liveCount}건 → 대상 ${targetItems.length}건 (${delta >= 0 ? "+" : ""}${delta})`,
  );

  if (!push) continue;

  // 이미 목표와 같으면 밀지 않는다. 부분 실패 뒤 재실행할 때(2026-09-04 의
  // 429 처럼) 멀쩡한 리스트를 또 밀어 쿨다운을 소모하는 걸 막는다.
  // 건수만 보고 넘기면 "건수는 같은데 내용이 다른" 경우를 놓치므로 항목을
  // 실제로 대조한다.
  if (liveCount === targetItems.length && (await sameAsLive(id, targetItems))) {
    console.log(`  SKIP — 이미 목표와 같다`);
    continue;
  }

  if (shrinkRatio < 0.5 && !force) {
    console.error(
      `  ERROR: 대상이 라이브의 절반 미만이다(${(shrinkRatio * 100).toFixed(0)}%). export 가 잘못됐을 수 있다.\n` +
        `  실제로 이만큼 줄이려는 것이면 --force 를 더한다.`,
    );
    process.exit(1);
  }

  console.log(`  PUT 중...`);
  const opId = await putAllItems(id, targetItems);
  const result = await waitForOperation(opId);
  if (result.status !== "completed") {
    console.error(`  FAILED: ${JSON.stringify(result.error)}`);
    process.exit(1);
  }
  const after = await listItemCount(id);
  const ok = after === targetItems.length;
  console.log(`  ${ok ? "OK" : "MISMATCH"} — 반영 후 ${after}건 (대상 ${targetItems.length}건)`);
  if (!ok) process.exitCode = 1;
}

if (!push) {
  console.log(`\n진단만 실행했다. 반영하려면: node scripts/sync-bulk-redirects.mjs --push`);
}
