import type { Locale } from "../i18n";

export interface CategoryHubData {
  overviewParagraphs: string[];
  faqs: { q: string; a: string }[];
  faqJsonLd: {
    "@context": string;
    "@type": string;
    mainEntity: {
      "@type": string;
      name: string;
      acceptedAnswer: {
        "@type": string;
        text: string;
      };
    }[];
  };
}

/**
 * 2026-11-08: 블로그 카테고리 허브(blog.oiyo.net/category/*) 씬 콘텐츠(Thin Content) 전면 해소기.
 * 단순 링크 나열형 인덱스 페이지에서 검색엔진(Google/Bing) 및 AI(Perplexity/SGE)가
 * 높은 정보 가치와 권위(E-E-A-T)를 가진 허브 문서로 평가하도록
 * 분야별 300~500자 Answer-First 개요문과 FAQPage JSON-LD 구조화 데이터를 자동 합성한다.
 */

interface CategorySpec {
  koDesc: string[];
  enDesc: string[];
}

const CATEGORY_SPECS: Record<string, CategorySpec> = {
  Economics: {
    koDesc: [
      "경제학 카테고리는 미시경제학의 소비자·기업 의사결정 이론부터 거시경제학의 통화·재정 정책, 행동경제학의 심리적 편향까지 폭넓은 지식을 체계적으로 다룹니다.",
      "복잡한 수식과 시장 메커니즘을 실제 경제 현상과 연결하여 비전공자도 명확히 이해할 수 있도록 단계별 강의와 실무 가이드를 제공합니다.",
    ],
    enDesc: [
      "The Economics category provides a structured foundation spanning microeconomic consumer theory, macroeconomic monetary policy, and behavioral economics.",
      "We bridge theoretical models with real-world market dynamics, offering step-by-step lecture series and practical analytical frameworks.",
    ],
  },
  Law: {
    koDesc: [
      "법학 카테고리는 민법, 형법, 행정법 및 생활법률의 핵심 법리와 판례를 체계적으로 해설하는 학술·실용 지식의 허브입니다.",
      "각 조문의 입법 취지와 최신 대법원 판례의 흐름을 챕터별 코스로 정리하여 시험 대비와 실생활 법적 판단에 실질적인 도움을 제공합니다.",
    ],
    enDesc: [
      "The Law category serves as an authoritative guide to civil, penal, administrative, and statutory frameworks and jurisprudence.",
      "Each series organizes statutes and leading precedents into progressive chapters to support academic study and practical legal reasoning.",
    ],
  },
  Tax: {
    koDesc: [
      "세법학 카테고리는 소득세, 부가가치세, 법인세, 상속·증여세 등 복잡한 조세 체계와 계산 공식을 명확하게 정리한 실전 지침서입니다.",
      "매년 개정되는 세법 개정안과 비과세·감면 규정, 절세 전략을 시나리오별 예시와 함께 제공하여 신뢰할 수 있는 세무 의사결정을 돕습니다.",
    ],
    enDesc: [
      "The Tax category demystifies direct and indirect taxation, including income tax, corporate tax, VAT, and wealth transfers.",
      "Updated regularly with statutory amendments and compliance rules, our guides provide actionable tax planning calculations and scenarios.",
    ],
  },
  Accounting: {
    koDesc: [
      "회계학 카테고리는 재무회계의 분개와 재무제표 작성 원리부터 관리회계의 원가 배부, 세무회계 조정까지 완결된 학습 경로를 제시합니다.",
      "회계기준(K-IFRS / 일반기업회계기준)에 맞춘 계정과목별 회계처리와 실무 예제를 통해 재무 분석 역량을 극대화합니다.",
    ],
    enDesc: [
      "The Accounting category offers a comprehensive curriculum covering financial statement preparation, cost allocation, and managerial accounting.",
      "Aligned with recognized GAAP and IFRS standards, each course provides clear ledger entries, adjustments, and analysis methods.",
    ],
  },
  Finance: {
    koDesc: [
      "금융 카테고리는 자본시장과 금리 구조, 채권·주식·파생상품의 밸류에이션 원리와 자산배분 전략을 심도 있게 탐구합니다.",
      "거시 지표 분석과 리스크 관리 프레임워크를 기반으로 개인 투자자와 금융 실무자 모두에게 검증된 금융 통찰을 전달합니다.",
    ],
    enDesc: [
      "The Finance category explores capital markets, interest rate term structures, asset valuation, and modern portfolio allocation.",
      "Built on rigorous quantitative methods and macroeconomic signals, our series deliver high-trust insights for investors and professionals.",
    ],
  },
  "Computer Science": {
    koDesc: [
      "컴퓨터과학 카테고리는 자료구조, 알고리즘, 컴퓨터 구조, 운영체제, 네트워크 및 최신 인공지능 엔지니어링의 본질을 파고듭니다.",
      "단순한 문법을 넘어 컴퓨터 시스템의 근본적인 작동 원리와 효율적인 소프트웨어 아키텍처 설계를 위한 체계적 강의를 제공합니다.",
    ],
    enDesc: [
      "The Computer Science category examines core computational principles including data structures, algorithms, operating systems, and AI systems.",
      "Beyond syntax, we focus on foundational system architecture, computational complexity, and scalable software design.",
    ],
  },
  Psychology: {
    koDesc: [
      "심리학 카테고리는 인지심리학, 성격심리학, 발달심리학 및 임상적 자기 이해를 돕는 학술적 연구 성과를 깊이 있게 조명합니다.",
      "과학적으로 검증된 심리학 이론과 척도를 통해 인간의 사고와 감정, 행동 메커니즘을 객관적으로 이해할 수 있는 렌즈를 제공합니다.",
    ],
    enDesc: [
      "The Psychology category highlights empirical research across cognitive, personality, social, and developmental psychology.",
      "Using validated psychological instruments and clinical frameworks, we provide clear perspectives on human cognition and behavior.",
    ],
  },
  Philosophy: {
    koDesc: [
      "철학 카테고리는 고대 그리스 사상부터 현대 인식론, 윤리학, 실존주의 철학에 이르는 지적 탐구의 여정을 담고 있습니다.",
      "삶의 근본적인 질문과 가치 판단의 기준을 사유하며, 복잡한 현대 사회를 살아가는 데 필요한 깊이 있는 성찰의 힘을 길러줍니다.",
    ],
    enDesc: [
      "The Philosophy category chronicles intellectual history from classical metaphysics to modern epistemology, ethics, and existential thought.",
      "We examine foundational philosophical inquiries, empowering critical reflection and principled judgment in contemporary life.",
    ],
  },
  Health: {
    koDesc: [
      "건강 카테고리는 인체 생리학, 영양학, 운동역학 및 예방의학에 기반한 신뢰할 수 있는 웰니스 지식을 종합적으로 제공합니다.",
      "근거 중심 의학(EBM) 문헌을 바탕으로 일상에서 즉시 실천할 수 있는 건강 관리 지침과 신체 지표 분석법을 명쾌하게 안내합니다.",
    ],
    enDesc: [
      "The Health category synthesizes evidence-based insights across human physiology, nutrition science, exercise biomechanics, and preventative care.",
      "Grounded in peer-reviewed clinical research, our articles guide personal wellness metrics and sustainable lifestyle practices.",
    ],
  },
  Tools: {
    koDesc: [
      "도구 카테고리는 금융 계산기, 건강·영양 산출기, 생산성 변환 도구 등 실생활에 즉시 활용할 수 있는 인터랙티브 유틸리티를 집대성했습니다.",
      "모든 계산 공식과 법정 기준 요율을 명확히 공개하며, 100% 브라우저 클라이언트 사이드에서 안전하고 빠르게 동작합니다.",
    ],
    enDesc: [
      "The Tools category gathers interactive calculators, financial simulators, and lifestyle utilities built for immediate browser-side execution.",
      "All algorithms and statutory baseline rates are fully transparent, running securely in your browser with zero installation.",
    ],
  },
};

export function buildCategoryHubData(params: {
  category: string;
  displayName: string;
  locale: Locale;
  track: string;
  itemCount: number;
}): CategoryHubData {
  const { category, displayName, locale, track, itemCount } = params;
  const spec = CATEGORY_SPECS[category];

  const overviewParagraphs: string[] = [];

  if (locale === "ko") {
    if (spec) {
      overviewParagraphs.push(...spec.koDesc);
    } else {
      overviewParagraphs.push(
        `${displayName} 카테고리는 ${track === "academy" ? "아카데미 강의 및 체계적인 커리큘럼" : "심층 아티클과 실용적인 인사이트"}를 제공하는 지식 허브입니다.`,
        `현재 총 ${itemCount}개의 엄선된 챕터와 아티클이 등록되어 있으며, 기초 개념의 정립부터 실무·일상 적용까지 단계적으로 탐구할 수 있습니다.`,
      );
    }
  } else if (locale === "ja") {
    overviewParagraphs.push(
      `${displayName}カテゴリーは、体系的な学習ガイドと深い洞察を提供する知識ハブです。基礎概念から実践的な応用まで、段階的に学べるコンテンツを揃えています。`,
      `現在${itemCount}件の厳選された記事とシリーズが公開されており、信頼できる情報をもとに深い理解をサポートします。`,
    );
  } else if (locale === "zh") {
    overviewParagraphs.push(
      `${displayName} 专栏是提供系统化知识与深度洞察的学习枢纽。从核心基本概念到实务应用，循序渐进地构建完整知识体系。`,
      `目前已收录 ${itemCount} 篇精选章节与文章，致力于为读者提供高可信度且可实操的参考内容。`,
    );
  } else if (locale === "fr") {
    overviewParagraphs.push(
      `La catégorie ${displayName} constitue un pôle de connaissances offrant des cours structurés et des analyses approfondies.`,
      `Avec ${itemCount} chapitres et articles sélectionnés, cette section vous guide des principes fondamentaux jusqu'aux applications concrètes.`,
    );
  } else if (locale === "es") {
    overviewParagraphs.push(
      `La categoría ${displayName} es un centro de conocimiento que ofrece lecciones estructuradas e información rigurosa.`,
      `Con un total de ${itemCount} artículos y capítulos publicados, esta sección abarca desde los conceptos esenciales hasta su aplicación práctica.`,
    );
  } else {
    // English default
    if (spec) {
      overviewParagraphs.push(...spec.enDesc);
    } else {
      overviewParagraphs.push(
        `The ${displayName} category serves as a comprehensive knowledge hub offering curated lecture series and practical insights.`,
        `Featuring ${itemCount} structured chapters and articles, this section guides learners from foundational theory to real-world applications.`,
      );
    }
  }

  // Multilingual FAQs (3 questions)
  const faqData = {
    ko: [
      {
        q: `${displayName} 카테고리에서는 어떤 내용을 다루나요?`,
        a: `${displayName} 분야의 핵심 이론과 실제 적용 사례를 체계적인 챕터와 강의 시리즈로 다루며, 비전공자도 쉽게 이해할 수 있도록 구성되어 있습니다.`,
      },
      {
        q: `어떤 순서로 학습하거나 읽는 것이 가장 효과적인가요?`,
        a: `상단의 첫 번째 코스나 개요 아티클부터 순서대로 읽으시는 것을 추천합니다. 각 시리즈는 기초 원리에서 심화 주제로 유기적으로 연결되어 있습니다.`,
      },
      {
        q: `콘텐츠의 신뢰성과 최신 개정 사항은 어떻게 관리되나요?`,
        a: `공인된 학술 표준과 관련 법령, 공식 가이드라인을 바탕으로 집필되며, 변경 사항이 있을 때 정기적인 검증과 업데이트를 거칩니다.`,
      },
    ],
    en: [
      {
        q: `What topics are covered in the ${displayName} category?`,
        a: `It covers foundational principles and practical applications in ${displayName}, organized into clear, accessible chapter series.`,
      },
      {
        q: `What is the recommended reading order?`,
        a: `We recommend starting from the introductory overview or first course in the curriculum, as each lesson builds progressively on prior concepts.`,
      },
      {
        q: `How is the content kept accurate and up to date?`,
        a: `Articles are grounded in established academic standards and official regulations, undergoing periodic reviews and fact-checking updates.`,
      },
    ],
    ja: [
      {
        q: `${displayName}カテゴリーではどのような内容を扱っていますか？`,
        a: `${displayName}の基本理論から実践的な応用まで、わかりやすい講義シリーズと記事で網羅しています。`,
      },
      {
        q: `どのような順序で読むのがおすすめですか？`,
        a: `基礎となる最初のコースまたは導入記事から順に読み進めることで、体系的に理解を深めることができます。`,
      },
      {
        q: `内容の正確性と最新情報はどのように維持されていますか？`,
        a: `公式な学術基準や法制度に基づき、定期的な確認と更新を実施して信頼性を維持しています。`,
      },
    ],
    zh: [
      {
        q: `${displayName} 分类主要涵盖哪些内容？`,
        a: `涵盖 ${displayName} 领域的基础理论与实务案例，以条理分明的课程章节形式呈现，通俗易懂。`,
      },
      {
        q: `推荐按怎样的顺序进行阅读与学习？`,
        a: `建议从基础概览或第一门核心系列课程开始，循序渐进地阅读后续进阶章节。`,
      },
      {
        q: `内容的权威性与时效性是如何保障的？`,
        a: `文章基于公认的学术标准与权威法规编写，并进行定期核对与动态更新以确保准确性。`,
      },
    ],
    fr: [
      {
        q: `Quels sujets sont abordés dans la catégorie ${displayName} ?`,
        a: `Elle couvre les concepts clés et les applications pratiques de ${displayName} à travers des séries de cours progressifs.`,
      },
      {
        q: `Quel est l'ordre de lecture recommandé ?`,
        a: `Nous conseillons de débuter par les cours d'introduction avant d'aborder les chapitres spécialisés.`,
      },
      {
        q: `Comment la rigueur des informations est-elle assurée ?`,
        a: `Les contenus reposent sur des standards académiques et réglementaires stricts, avec des mises à jour régulières.`,
      },
    ],
    es: [
      {
        q: `¿Qué temas se tratan en la categoría ${displayName}?`,
        a: `Abarca los fundamentos teóricos y las aplicaciones prácticas de ${displayName} en lecciones accesibles y estructuradas.`,
      },
      {
        q: `¿Cuál es el orden de lectura sugerido?`,
        a: `Se recomienda iniciar por la visión general o el primer curso de la serie, avanzando progresivamente hacia temas más avanzados.`,
      },
      {
        q: `¿Cómo se mantiene actualizada la información?`,
        a: `Los contenidos se elaboran a partir de normas académicas y normativas oficiales, con revisiones periódicas continuas.`,
      },
    ],
  };

  const faqs = faqData[locale] ?? faqData.en;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return {
    overviewParagraphs,
    faqs,
    faqJsonLd,
  };
}
