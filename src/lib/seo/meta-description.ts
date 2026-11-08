/**
 * meta-description.ts — OIYO Blog 통합 SEO(Google·Bing) & AIEO 메타 디스크립션 빌더
 * (Phase A: 단문·누락 방어 및 골든 레인지 CJK 110~140자 / 영문 135~160자 스마트 확장 엔진)
 */

export interface BuildBlogMetaDescriptionOptions {
  title: string;
  description?: string;
  locale: string;
  pathname?: string;
  category?: string;
  track?: string;
}

const LOCALE_TEMPLATES: Record<
  string,
  {
    academySuffix: string;
    toolSuffix: string;
    articleSuffix: string;
    fallback: (title: string) => string;
  }
> = {
  ko: {
    academySuffix:
      "핵심 이론과 실전 공식을 체계적인 강의 노트로 정리하고, 단계별 예제와 자주 묻는 질문(FAQ)을 통해 비전공자도 명확하게 이해할 수 있도록 안내합니다.",
    toolSuffix:
      "표준 환산 공식과 백분위 데이터를 기반으로 브라우저에서 즉시 정확한 계산 결과와 비교 도표를 무료로 확인하세요.",
    articleSuffix:
      "검증된 학술·법령 근거와 실생활 적용 사례를 바탕으로 핵심 개념과 실전 가이드를 알기 쉽게 정리했습니다.",
    fallback: (t) =>
      `${t} — OIYO 블로그의 체계적인 아카데미 강의와 인터랙티브 가이드를 통해 핵심 개념, 공식, 실전 적용 사례를 한눈에 확인하세요.`,
  },
  en: {
    academySuffix:
      "Explore structured lecture notes, step-by-step formulas, and practical examples designed to build clear foundational mastery and real-world analytical skills.",
    toolSuffix:
      "Calculate accurate conversions, percentile distributions, and side-by-side comparisons instantly in your browser for free.",
    articleSuffix:
      "Backed by authoritative references and practical frameworks, this guide breaks down key concepts and actionable takeaways.",
    fallback: (t) =>
      `${t} — Comprehensive guides, structured academy courses, and interactive utilities from OIYO Blog with clear formulas and real-world examples.`,
  },
  ja: {
    academySuffix:
      "基礎理論から実践的な計算式・応用事例まで、体系的な講義シリーズとわかりやすい解説で段階的に理解を深めることができます。",
    toolSuffix:
      "標準的な換算式と統計データに基づき、ブラウザ上で正確な計算結果と比較チャートを今すぐ無料で確認できます。",
    articleSuffix:
      "信頼できる学術・制度的根拠に基づき、重要な概念と実生活に役立つポイントをわかりやすく整理しています。",
    fallback: (t) =>
      `${t} — OIYOブログの体系的なアカデミー講座と実用ガイドで、核心概念から応用までわかりやすく学びましょう。`,
  },
  zh: {
    academySuffix:
      "通过系统化的课程讲义、核心公式推导与实战案例解析，帮助读者从零构建扎实的专业知识体系与应用能力。",
    toolSuffix:
      "基于标准换算公式与权威统计分布数据，在浏览器中即时免费获取精准计算结果与可视化对比图表。",
    articleSuffix:
      "结合权威学术文献与实务指南，深入浅出地拆解核心概念、关键公式与常见疑问。",
    fallback: (t) =>
      `${t} — 探索OIYO博客的系统化课程与互动工具，快速掌握核心原理、计算公式与实务应用指南。`,
  },
  fr: {
    academySuffix:
      "Découvrez des notes de cours structurées, des formules détaillées et des exemples concrets pour maîtriser les concepts fondamentaux pas à pas.",
    toolSuffix:
      "Obtenez des conversions précises, des centiles statistiques et des comparaisons visuelles instantanément et gratuitement dans votre navigateur.",
    articleSuffix:
      "Appuyé par des références fiables et des cas pratiques, ce guide synthétise les concepts clés et les méthodes essentielles.",
    fallback: (t) =>
      `${t} — Guides complets, cours académiques structurés et outils interactifs sur OIYO Blog avec explications claires.`,
  },
  es: {
    academySuffix:
      "Explora lecciones estructuradas, fórmulas detalladas y ejemplos prácticos diseñados para dominar los principios fundamentales paso a paso.",
    toolSuffix:
      "Calcula conversiones precisas, percentiles estadísticos y comparaciones visuales al instante y gratis directamente en tu navegador.",
    articleSuffix:
      "Respaldado por referencias verificadas y casos prácticos, esta guía explica los conceptos clave de forma clara y aplicable.",
    fallback: (t) =>
      `${t} — Guías completas, cursos académicos estructurados y herramientas interactivas en OIYO Blog con ejemplos prácticos.`,
  },
};

function safeTruncate(text: string, maxLen: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;

  const sub = cleaned.slice(0, maxLen);
  const lastPunct = Math.max(sub.lastIndexOf(". "), sub.lastIndexOf("! "), sub.lastIndexOf("? "), sub.lastIndexOf("。"));
  if (lastPunct > maxLen * 0.7) {
    return sub.slice(0, lastPunct + 1).trim();
  }

  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.7) {
    return sub.slice(0, lastSpace).trim() + "...";
  }

  return sub.trim() + "...";
}

export function buildBlogMetaDescription(opts: BuildBlogMetaDescriptionOptions): string {
  const { title, locale, pathname = "", track } = opts;
  let rawDesc = (opts.description ?? "").trim();
  const tpl = LOCALE_TEMPLATES[locale] ?? LOCALE_TEMPLATES.en;
  const isCjk = ["ko", "ja", "zh"].includes(locale);
  const minLength = isCjk ? 70 : 95;
  const targetMax = isCjk ? 145 : 165;

  const cleanTitle = title.split("—")[0].split("|")[0].trim();
  const isTitleDuplicate =
    rawDesc.toLowerCase() === title.toLowerCase() ||
    rawDesc.toLowerCase() === cleanTitle.toLowerCase();

  const path = pathname.toLowerCase();
  const isTool =
    track === "tool" ||
    path.includes("converter") ||
    path.includes("calculator") ||
    path.includes("tool-");
  const isAcademy = track === "academy" || path.includes("academy-") || path.includes("education-");

  if (!rawDesc || isTitleDuplicate) {
    if (isTool) {
      rawDesc = `${cleanTitle} — ${tpl.toolSuffix}`;
    } else if (isAcademy) {
      rawDesc = `${cleanTitle} — ${tpl.academySuffix}`;
    } else {
      rawDesc = tpl.fallback(cleanTitle);
    }
  } else if (rawDesc.length < minLength) {
    const suffix = isTool ? tpl.toolSuffix : isAcademy ? tpl.academySuffix : tpl.articleSuffix;
    rawDesc = `${rawDesc.replace(/[.。]+$/, "")}. ${suffix}`;
  }

  return safeTruncate(rawDesc, targetMax);
}
