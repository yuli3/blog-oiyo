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

async function cf(pathname, options = {}) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok || body.success === false) {
    const msg = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join("; ") || res.statusText;
    throw new Error(`Cloudflare API ${pathname} 실패 (HTTP ${res.status}): ${msg}`);
  }
  return body;
}

async function listItemCount(listId) {
  const r = await cf(`/accounts/${ACCOUNT_ID}/rules/lists/${listId}/items?per_page=1`);
  return r.result_info?.total_count ?? r.result?.length ?? 0;
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
