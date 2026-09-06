#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const policyPath = path.join(root, "data/evidence/accounting-source-policy.json");
const outputDir = path.join(root, "reports/accounting-evidence");
const check = process.argv.includes("--check");
const policy = JSON.parse(await readFile(policyPath, "utf8"));

const patterns = Object.fromEntries(
  Object.entries(policy.classification).map(([key, value]) => [key, new RegExp(value, "i")]),
);
const rulePatterns = policy.rules.map((rule) => ({ ...rule, pattern: new RegExp(rule.ids, "i") }));
const stateRank = {
  "official-topic-mapped": 0,
  "boundary-source-mapped": 1,
  "pending-provision-pinpoint": 2,
  "scope-unresolved": 3,
  "pending-primary-source": 4,
};
const ledgers = [];
const errors = [];

for (const curriculumId of policy.curricula) {
  const curriculum = JSON.parse(
    await readFile(path.join(root, "data/curricula", `${curriculumId}.json`), "utf8"),
  );
  const coveragePath = path.join(root, "reports/curriculum-coverage", `${curriculumId}.json`);
  let coverageRows = new Map();
  try {
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    coverageRows = new Map(coverage.rows.map((row) => [row.id, row]));
  } catch {
    errors.push(`${curriculumId}: curriculum coverage 보고서가 없습니다. npm run audit:curriculum을 먼저 실행하세요.`);
  }

  for (const topic of curriculum.topics) {
    const key = `${curriculumId}:${topic.id}`;
    const matchedRules = rulePatterns.filter((rule) => rule.pattern.test(topic.id));
    const sourceIds = [...new Set(matchedRules.flatMap((rule) => rule.sourceIds))];
    if (sourceIds.length === 0) sourceIds.push("internal-model-check");
    const invalidSources = sourceIds.filter((sourceId) => !policy.sources[sourceId]);
    if (invalidSources.length > 0) errors.push(`${key}: 알 수 없는 출처 ${invalidSources.join(", ")}`);

    const evidenceState = matchedRules.length > 0
      ? matchedRules
          .map((rule) => rule.evidenceState)
          .sort((a, b) => (stateRank[b] ?? 99) - (stateRank[a] ?? 99))[0]
      : "pending-primary-source";
    const claimType = patterns.standardSensitivePatterns.test(topic.id)
      ? "standard-sensitive"
      : patterns.formulaPatterns.test(topic.id)
        ? "formula-calculation"
        : "stable-definition";
    const errorImpact = topic.priority === "high" ? 3 : topic.priority === "medium" ? 2 : 1;
    const changeLikelihood = claimType === "standard-sensitive" ? 3 : claimType === "formula-calculation" ? 1 : 0;
    const confusionRisk = patterns.highConfusionPatterns.test(topic.id) ? 3 : 1;
    const crossExposure = patterns.crossExposurePatterns.test(topic.id) ? 2 : 0;
    const evidenceGap = evidenceState === "official-topic-mapped" ? 0 : evidenceState === "boundary-source-mapped" ? 1 : 3;
    const riskScore = errorImpact + changeLikelihood + confusionRisk + crossExposure + evidenceGap;
    const coverage = coverageRows.get(topic.id);
    if (!coverage) errors.push(`${key}: curriculum coverage 행과 연결되지 않았습니다.`);
    const verification = policy.contentVerifications?.[key] ?? null;
    if (verification) {
      const unknownVerificationSources = verification.sourceIds.filter((sourceId) => !sourceIds.includes(sourceId));
      if (unknownVerificationSources.length > 0) {
        errors.push(`${key}: 검증 출처가 주제 출처에 없음 ${unknownVerificationSources.join(", ")}`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(verification.verifiedAt) || !verification.basis) {
        errors.push(`${key}: 검증일 또는 검증 근거가 불완전합니다.`);
      }
    }

    ledgers.push({
      key,
      curriculumId,
      subject: curriculum.subject,
      topicId: topic.id,
      term: topic.term,
      priority: topic.priority,
      sectionFiles: coverage?.headingFiles ?? [],
      claimType,
      evidenceState,
      sourceIds,
      sourceCheckedAt: sourceIds.includes("internal-model-check") ? null : policy.checkedAt,
      contentVerifiedAt: verification?.verifiedAt ?? null,
      verificationBasis: verification?.basis ?? null,
      scopeNote:
        evidenceState === "official-topic-mapped"
          ? "공식 기준서의 직접 적용 주제에 연결됨. 개별 문장·문단 번호 대조는 별도 감사 대상."
          : evidenceState === "boundary-source-mapped"
            ? "공식 자료는 적용 범위 또는 학습영역의 경계만 제공한다. 세부 산식·부기 절차는 별도 정본 대조가 필요함."
            : evidenceState === "pending-provision-pinpoint"
              ? "공식 법령 진입점은 확인했으나 적용 조문·시행일을 아직 고정하지 않음."
              : evidenceState === "scope-unresolved"
                ? "법적 형태와 적용 보고기준을 먼저 정해야 하며 IFRS 일반 규칙을 그대로 적용할 수 없음."
                : "권위 있는 원전과 개별 문장 대조가 남아 있음.",
      risk: { errorImpact, changeLikelihood, confusionRisk, crossExposure, evidenceGap, total: riskScore },
    });
  }
}

const duplicateKeys = ledgers
  .map((row) => row.key)
  .filter((key, index, keys) => keys.indexOf(key) !== index);
if (duplicateKeys.length > 0) errors.push(`중복 ledger key: ${[...new Set(duplicateKeys)].join(", ")}`);

const expectedCount = 165;
if (ledgers.length !== expectedCount) errors.push(`회계 원장 행 수 ${ledgers.length}; 기대값 ${expectedCount}`);

const highRisk = ledgers.filter((row) => row.risk.total >= 9).sort((a, b) => b.risk.total - a.risk.total);
const summary = {
  total: ledgers.length,
  officialTopicMapped: ledgers.filter((row) => row.evidenceState === "official-topic-mapped").length,
  boundarySourceMapped: ledgers.filter((row) => row.evidenceState === "boundary-source-mapped").length,
  pendingProvisionPinpoint: ledgers.filter((row) => row.evidenceState === "pending-provision-pinpoint").length,
  scopeUnresolved: ledgers.filter((row) => row.evidenceState === "scope-unresolved").length,
  pendingPrimarySource: ledgers.filter((row) => row.evidenceState === "pending-primary-source").length,
  contentVerified: ledgers.filter((row) => row.contentVerifiedAt).length,
  highRisk: highRisk.length,
  bySubject: Object.fromEntries(
    [...new Set(ledgers.map((row) => row.subject))].map((subject) => [subject, ledgers.filter((row) => row.subject === subject).length]),
  ),
};

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "accounting-source-ledger.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), policyCheckedAt: policy.checkedAt, summary, sources: policy.sources, rows: ledgers }, null, 2)}\n`,
);
const markdown = [
  "# 회계 4과목 근거 원장 감사",
  "",
  `- 전체: ${summary.total}`,
  `- 공식 기준서 직접 주제 매핑: ${summary.officialTopicMapped}`,
  `- 공식 경계 출처 매핑: ${summary.boundarySourceMapped}`,
  `- 법령 조문·시행일 확정 대기: ${summary.pendingProvisionPinpoint}`,
  `- 적용 범위 선결 대기: ${summary.scopeUnresolved}`,
  `- 1차 출처 확정 대기: ${summary.pendingPrimarySource}`,
  `- 문장 단위 대조 완료: ${summary.contentVerified}`,
  `- 고위험 큐(9점 이상): ${summary.highRisk}`,
  "- 공식 출처 주제 매핑은 문장별 검증 완료를 뜻하지 않는다.",
  "- 문제·퀴즈·오답 해설은 이 감사의 대상이 아니다.",
  "",
  "## 과목별 원장 행",
  "",
  ...Object.entries(summary.bySubject).map(([subject, count]) => `- ${subject}: ${count}`),
  "",
  "## 고위험 큐",
  "",
  "| 점수 | 상태 | 과목 | 항목 | 유형 | 출처 | 전용 절 |",
  "| ---: | --- | --- | --- | --- | --- | --- |",
  ...highRisk.map((row) => `| ${row.risk.total} | ${row.evidenceState} | ${row.subject} | ${row.term} (${row.topicId}) | ${row.claimType} | ${row.sourceIds.join(", ")} | ${row.sectionFiles.join(", ")} |`),
  "",
  "## 구조 오류",
  "",
  ...(errors.length > 0 ? errors.map((error) => `- ${error}`) : ["- 없음"]),
  "",
].join("\n");
await writeFile(path.join(outputDir, "accounting-source-ledger.md"), markdown);

console.log(
  `accounting evidence: ${summary.total} rows; direct ${summary.officialTopicMapped}; boundary ${summary.boundarySourceMapped}; provision-pending ${summary.pendingProvisionPinpoint}; scope-unresolved ${summary.scopeUnresolved}; source-pending ${summary.pendingPrimarySource}; content-verified ${summary.contentVerified}; high-risk ${summary.highRisk}`,
);
if (check && errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
}
