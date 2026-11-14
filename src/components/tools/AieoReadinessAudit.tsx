import React, { useState, useMemo } from 'react';

interface AuditRule {
  id: string;
  category: 'crawler' | 'schema' | 'content' | 'structure';
  title: string;
  weight: number;
  passed: boolean;
  message: string;
  recommendation: string;
}

const DEFAULT_SAMPLE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>OIYO Lab — Zero-Dependency AI Agent Infrastructure</title>
  <meta name="description" content="Production-ready sub-millisecond AI agent safety guards and developer tools.">
  <link rel="canonical" href="https://oiyo.net/">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "OIYO Agent Tools",
    "url": "https://oiyo.net",
    "applicationCategory": "DeveloperApplication"
  }
  </script>
</head>
<body>
  <h1>OIYO AI Agent Ecosystem</h1>
  <p>OIYO delivers sub-millisecond, zero-dependency tools for autonomous coding agents.</p>
  <h2>Core Architectural Principles</h2>
  <p>Every tool runs with pure standard library code without external runtime overhead.</p>
</body>
</html>`;

export default function AieoReadinessAudit() {
  const [markupInput, setMarkupInput] = useState<string>(DEFAULT_SAMPLE_HTML);
  const [robotsAllowed, setRobotsAllowed] = useState<boolean>(true);

  const auditReport = useMemo(() => {
    const startTime = performance.now();
    const rules: AuditRule[] = [];

    // 1. Crawler Accessibility
    rules.push({
      id: 'ai-crawler-access',
      category: 'crawler',
      title: 'AI Search Crawler Access (robots.txt)',
      weight: 25,
      passed: robotsAllowed,
      message: robotsAllowed ? 'OAI-SearchBot, PerplexityBot, ClaudeBot allowed' : 'AI search bots blocked in robots.txt',
      recommendation: robotsAllowed ? 'Maintain public allow rules for citation crawlers' : 'Remove Disallow: / for OAI-SearchBot and ClaudeBot'
    });

    // 2. Schema.org JSON-LD
    const hasJsonLd = /<script\s+type=["']application\/ld\+json["']/i.test(markupInput);
    const hasSchemaType = /"@type"\s*:\s*["'][A-Za-z0-9]+["']/.test(markupInput);
    const schemaPassed = hasJsonLd && hasSchemaType;
    rules.push({
      id: 'schema-structured-data',
      category: 'schema',
      title: 'Schema.org JSON-LD Structured Data',
      weight: 25,
      passed: schemaPassed,
      message: schemaPassed ? 'Valid Schema.org JSON-LD structured data detected' : 'Missing Schema.org JSON-LD snippet',
      recommendation: schemaPassed ? 'Keep structured data updated with author and datePublished' : 'Add WebSite or WebApplication JSON-LD in <head>'
    });

    // 3. Canonical Tag
    const hasCanonical = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(markupInput);
    rules.push({
      id: 'canonical-tag',
      category: 'structure',
      title: 'Canonical URL Verification',
      weight: 15,
      passed: hasCanonical,
      message: hasCanonical ? 'Rel=canonical tag present' : 'Missing canonical link tag',
      recommendation: hasCanonical ? 'Ensure canonical URL matches the primary host' : 'Add <link rel="canonical" href="..."> to prevent duplicate indexing'
    });

    // 4. Meta Description & Title
    const hasTitle = /<title>[^<]+<\/title>/i.test(markupInput);
    const hasMetaDesc = /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(markupInput);
    const metaPassed = hasTitle && hasMetaDesc;
    rules.push({
      id: 'meta-tags',
      category: 'structure',
      title: 'Title & Meta Description Quality',
      weight: 15,
      passed: metaPassed,
      message: metaPassed ? 'Meta title and description present' : 'Missing or empty title/meta description',
      recommendation: 'Provide concise 50-160 character description answering search queries'
    });

    // 5. Semantic Heading Hierarchy (H1 and H2)
    const hasH1 = /<h1[^>]*>[^<]+<\/h1>/i.test(markupInput);
    const hasH2 = /<h2[^>]*>[^<]+<\/h2>/i.test(markupInput);
    const headingsPassed = hasH1 && hasH2;
    rules.push({
      id: 'semantic-hierarchy',
      category: 'content',
      title: 'Semantic Heading Hierarchy (H1 & H2)',
      weight: 20,
      passed: headingsPassed,
      message: headingsPassed ? 'H1 main topic and H2 section headings present' : 'Missing clear H1 or H2 semantic hierarchy',
      recommendation: 'Use single H1 for primary concept, followed by logical H2 subsections'
    });

    // Calculate Score (0 - 100)
    let score = 0;
    for (const r of rules) {
      if (r.passed) score += r.weight;
    }

    const durationMs = Math.round((performance.now() - startTime) * 1000) / 1000;
    return {
      score,
      rules,
      durationMs
    };
  }, [markupInput, robotsAllowed]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">AIEO / GEO 검색 노출 준비도 진단기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Google AI Overviews, ChatGPT Search, Perplexity 인용을 위한 구조화 데이터 및 크롤러 접근성을 1초 만에 진단합니다.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">AIEO 종합 준비도 점수</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-3xl font-extrabold ${
                  auditReport.score >= 80
                    ? 'text-success'
                    : auditReport.score >= 50
                    ? 'text-foreground'
                    : 'text-destructive'
                }`}
              >
                {auditReport.score}
              </span>
              <span className="text-sm text-muted-foreground">/ 100점</span>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="my-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border border-border">
            <span className="text-xs font-semibold text-foreground">
              robots.txt AI 크롤러 (OAI-SearchBot, ClaudeBot, PerplexityBot)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRobotsAllowed(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                  robotsAllowed
                    ? 'bg-success/10 text-success border-success/30'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                ✓ 크롤러 허용 (Allow)
              </button>
              <button
                type="button"
                onClick={() => setRobotsAllowed(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                  !robotsAllowed
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                ✕ 크롤러 차단 (Disallow)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              웹페이지 HTML 소스코드 (헤드 및 본문 구조)
            </label>
            <textarea
              value={markupInput}
              onChange={(e) => setMarkupInput(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs bg-muted/30 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Paste HTML source snippet to inspect..."
            />
          </div>
        </div>

        {/* Audit Checklist Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">AI 검색 인용 핵심 진단 리포트</span>
            <span className="text-xs text-muted-foreground">진단 시간: {auditReport.durationMs}ms</span>
          </div>
          <div className="divide-y divide-border">
            {auditReport.rules.map(rule => (
              <div key={rule.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        rule.passed
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {rule.passed ? '✓ PASS' : '✕ FAIL'}
                    </span>
                    <span className="font-bold text-foreground">{rule.title}</span>
                    <span className="text-muted-foreground font-mono">({rule.weight}점)</span>
                  </div>
                  <p className="text-muted-foreground">{rule.message}</p>
                </div>
                <div className="text-left sm:text-right sm:max-w-xs shrink-0">
                  <span className="text-muted-foreground block text-xs">개선 권고사항:</span>
                  <span className="text-foreground font-medium">{rule.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
