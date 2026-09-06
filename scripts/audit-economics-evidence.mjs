#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const policy = JSON.parse(await readFile(path.join(root, "data/evidence/economics-source-policy.json"), "utf8"));
const curriculum = JSON.parse(await readFile(path.join(root, "data/curricula", `${policy.curriculum}.json`), "utf8"));
const coverage = JSON.parse(await readFile(path.join(root, "reports/curriculum-coverage", `${policy.curriculum}.json`), "utf8"));
const coverageRows = new Map(coverage.rows.map((row) => [row.id, row]));
const rules = policy.rules.map((rule) => ({ ...rule, pattern: new RegExp(rule.ids, "i") }));
const patterns = Object.fromEntries(Object.entries(policy.classification).map(([key, value]) => [key, new RegExp(value, "i")]));
const stateRank = {"official-topic-mapped":0,"boundary-source-mapped":1,"model-cross-check-required":2,"pending-primary-source":3};
const errors = [];
const rows = curriculum.topics.map((topic) => {
  const key = `${policy.curriculum}:${topic.id}`;
  const matched = rules.filter((rule) => rule.pattern.test(topic.id));
  const sourceIds = [...new Set(matched.flatMap((rule) => rule.sourceIds))];
  if (sourceIds.length === 0) sourceIds.push("theory-cross-check");
  const evidenceState = matched.length
    ? matched.map((rule) => rule.evidenceState).sort((a,b) => (stateRank[b] ?? 99) - (stateRank[a] ?? 99))[0]
    : "pending-primary-source";
  const unknown = sourceIds.filter((id) => !policy.sources[id]);
  if (unknown.length) errors.push(`${key}: 알 수 없는 출처 ${unknown.join(", ")}`);
  const verification = policy.contentVerifications?.[key] ?? null;
  if (verification) {
    const invalid = verification.sourceIds.filter((id) => !sourceIds.includes(id));
    if (invalid.length) errors.push(`${key}: 검증 출처가 주제 출처에 없음 ${invalid.join(", ")}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(verification.verifiedAt) || !verification.basis) errors.push(`${key}: 검증 정보 불완전`);
  }
  const formula = patterns.formulaPatterns.test(topic.id);
  const policySensitive = patterns.policyPatterns.test(topic.id);
  const confusion = patterns.confusionPatterns.test(topic.id);
  const priority = topic.priority === "high" ? 3 : topic.priority === "medium" ? 2 : 1;
  const evidenceGap = evidenceState === "official-topic-mapped" ? 0 : evidenceState === "boundary-source-mapped" ? 1 : 2;
  const riskScore = priority + (formula ? 2 : 0) + (policySensitive ? 3 : 0) + (confusion ? 2 : 0) + evidenceGap;
  const linked = coverageRows.get(topic.id);
  if (!linked) errors.push(`${key}: curriculum coverage 행 누락`);
  return {key,topicId:topic.id,term:topic.term,priority:topic.priority,sectionFiles:linked?.headingFiles ?? [],claimType:policySensitive?"policy-or-statistic-sensitive":formula?"formula-or-graph":"stable-theory",evidenceState,sourceIds,sourceCheckedAt:sourceIds.every((id)=>id==="theory-cross-check")?null:policy.checkedAt,contentVerifiedAt:verification?.verifiedAt ?? null,verificationBasis:verification?.basis ?? null,riskScore};
});

if (rows.length !== 37) errors.push(`경제학 원장 행 수 ${rows.length}; 기대값 37`);
const priorityIds = new Set(policy.auditPriority);
const unknownPriorityIds = policy.auditPriority.filter((id) => !rows.some((row) => row.topicId === id));
if (unknownPriorityIds.length) errors.push(`감사 우선 ID가 curriculum에 없음: ${unknownPriorityIds.join(", ")}`);
if (priorityIds.size !== 27) errors.push(`감사 우선 큐 ${priorityIds.size}; 기대값 27`);
const highRisk = rows.filter((row) => priorityIds.has(row.topicId)).sort((a,b) => b.riskScore-a.riskScore);
const summary = {
  total: rows.length,
  officialTopicMapped: rows.filter((r)=>r.evidenceState==="official-topic-mapped").length,
  boundarySourceMapped: rows.filter((r)=>r.evidenceState==="boundary-source-mapped").length,
  modelCrossCheckRequired: rows.filter((r)=>r.evidenceState==="model-cross-check-required").length,
  pendingPrimarySource: rows.filter((r)=>r.evidenceState==="pending-primary-source").length,
  contentVerified: rows.filter((r)=>r.contentVerifiedAt).length,
  highRisk: highRisk.length
};
const outputDir = path.join(root, "reports/economics-evidence");
await mkdir(outputDir,{recursive:true});
await writeFile(path.join(outputDir,"economics-source-ledger.json"),`${JSON.stringify({generatedAt:new Date().toISOString(),policyCheckedAt:policy.checkedAt,summary,sources:policy.sources,rows},null,2)}\n`);
await writeFile(path.join(outputDir,"economics-source-ledger.md"),[
  "# 경제학 시험 근거 원장 감사","",`- 전체: ${summary.total}`,`- 공식 직접 매핑: ${summary.officialTopicMapped}`,`- 공식 경계 매핑: ${summary.boundarySourceMapped}`,`- 이론 정본 교차검증 필요: ${summary.modelCrossCheckRequired}`,`- 출처 미매핑: ${summary.pendingPrimarySource}`,`- 문장 대조 완료: ${summary.contentVerified}`,`- 고위험 감사 우선 큐: ${summary.highRisk}`,"- 공식 통계·정책 자료는 이론 산식 전체의 정본을 뜻하지 않는다.","- 문제·퀴즈·오답 해설은 감사 대상이 아니다.","","## 고위험 큐","","| 점수 | 상태 | 항목 | 유형 | 출처 | 전용 절 |","| ---: | --- | --- | --- | --- | --- |",...highRisk.map((r)=>`| ${r.riskScore} | ${r.evidenceState} | ${r.term} (${r.topicId}) | ${r.claimType} | ${r.sourceIds.join(", ")} | ${r.sectionFiles.join(", ")} |`),"","## 구조 오류","",...(errors.length?errors.map((e)=>`- ${e}`):["- 없음"]),""
].join("\n"));
console.log(`economics evidence: ${summary.total} rows; direct ${summary.officialTopicMapped}; boundary ${summary.boundarySourceMapped}; model-check ${summary.modelCrossCheckRequired}; source-pending ${summary.pendingPrimarySource}; content-verified ${summary.contentVerified}; high-risk ${summary.highRisk}`);
if (check && errors.length) { console.error(errors.join("\n")); process.exitCode=1; }
