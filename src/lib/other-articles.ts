import type { CollectionEntry } from "astro:content";
import { isRedirectStub } from "./wiki-index";

export const OTHER_GROUPS = ["life-money", "career-credentials", "general-interest"] as const;
export type OtherGroup = (typeof OTHER_GROUPS)[number];

const LIFE_MONEY = new Set(["Finance", "Real Estate", "Tax"]);
const CAREER = new Set(["Exam", "Business", "Education"]);
// Legacy category labels are not always the article's reading intent.
const CAREER_ARTICLE_OVERRIDES = new Set([
  "magazine-qualification-strategy-guide",
  "magazine-naeiljabeum-card-guide",
  "magazine-naeiljacheum-fund-guide",
  "magazine-senior-jobs-guide",
  "magazine-care-worker-certification",
]);

export function isOtherArticle(post: CollectionEntry<"blog">): boolean {
  return post.data.draft !== true && !isRedirectStub(post.data) &&
    post.data.track !== "academy" && post.data.track !== "education";
}

// 2026-09-28 2-6: 학문 카테고리 밑에 낱개 글로 남아 있던 두 시리즈를 D1 결정(2026-09-25)대로 기타로 옮겼다.
// 카테고리 라벨(Accounting·Law·Medicine·Lifestyle)만으로는 묶음이 틀리게 나와 시리즈로 정한다.
const CAREER_SLUG_PREFIXES = ["academy-qualification-roadmaps-"];
const LIFE_MONEY_SLUG_PREFIXES = ["magazine-checklist-"];

export function otherGroupOf(post: CollectionEntry<"blog">): OtherGroup {
  const base = post.slug.split("/").at(-1) ?? "";
  if (CAREER_ARTICLE_OVERRIDES.has(base) || CAREER_SLUG_PREFIXES.some((prefix) => base.startsWith(prefix))) return "career-credentials";
  if (LIFE_MONEY_SLUG_PREFIXES.some((prefix) => base.startsWith(prefix))) return "life-money";
  const category = post.data.category ?? "";
  if (LIFE_MONEY.has(category)) return "life-money";
  if (CAREER.has(category)) return "career-credentials";
  return "general-interest";
}

export const OTHER_COPY: Record<string, {
  title: string;
  intro: string;
  all: string;
  empty: string;
  groups: Record<OtherGroup, { title: string; intro: string }>;
}> = {
  ko: { title: "기타 읽을거리", intro: "대학 과목과 별도로, 생활에 쓰는 정보와 교양 글을 주제별로 모았어요.", all: "글 모두 보기", empty: "아직 공개된 글이 없어요.", groups: {
    "life-money": { title: "생활·돈", intro: "재테크, 세금, 부동산처럼 일상에서 판단할 때 참고할 글이에요." },
    "career-credentials": { title: "커리어·자격", intro: "일과 자격 준비에 관련된 글을 모았어요." },
    "general-interest": { title: "교양", intro: "과학, 철학, 역사, 건강 등 폭넓은 주제를 읽어 보세요." },
  } },
  en: { title: "More to read", intro: "Practical guides and general-interest articles, separate from university courses.", all: "View all articles", empty: "No published articles yet.", groups: {
    "life-money": { title: "Life & money", intro: "Guides to finance, tax, property, and everyday decisions." },
    "career-credentials": { title: "Careers & qualifications", intro: "Reading on work and professional preparation." },
    "general-interest": { title: "General interest", intro: "Explore science, philosophy, history, health, and more." },
  } },
  ja: { title: "その他の読みもの", intro: "大学の科目とは分けて、暮らしに役立つ情報や教養記事をテーマ別にまとめました。", all: "記事をすべて見る", empty: "公開中の記事はまだありません。", groups: {
    "life-money": { title: "暮らしとお金", intro: "家計、税金、不動産など、日々の判断に役立つ記事です。" },
    "career-credentials": { title: "キャリアと資格", intro: "仕事や資格の準備に関する記事です。" },
    "general-interest": { title: "教養", intro: "科学、哲学、歴史、健康などを幅広く読めます。" },
  } },
  zh: { title: "更多阅读", intro: "将生活指南和通识文章按主题整理，与大学课程分开展示。", all: "查看全部文章", empty: "目前还没有已发布的文章。", groups: {
    "life-money": { title: "生活与理财", intro: "有关理财、税务、房产和日常决策的文章。" },
    "career-credentials": { title: "职业与资格", intro: "有关工作和资格准备的文章。" },
    "general-interest": { title: "通识阅读", intro: "阅读科学、哲学、历史、健康等主题。" },
  } },
  fr: { title: "Autres lectures", intro: "Des guides pratiques et des articles de culture générale, distincts des cours universitaires.", all: "Voir tous les articles", empty: "Aucun article publié pour le moment.", groups: {
    "life-money": { title: "Vie quotidienne et argent", intro: "Des repères sur les finances, la fiscalité, l'immobilier et les choix du quotidien." },
    "career-credentials": { title: "Carrière et qualifications", intro: "Des articles sur le travail et la préparation aux qualifications." },
    "general-interest": { title: "Culture générale", intro: "Explorez les sciences, la philosophie, l'histoire, la santé et d'autres sujets." },
  } },
  es: { title: "Otras lecturas", intro: "Guías prácticas y artículos de cultura general, separados de los cursos universitarios.", all: "Ver todos los artículos", empty: "Todavía no hay artículos publicados.", groups: {
    "life-money": { title: "Vida y dinero", intro: "Artículos sobre finanzas, impuestos, vivienda y decisiones cotidianas." },
    "career-credentials": { title: "Carrera y cualificaciones", intro: "Lecturas sobre el trabajo y la preparación profesional." },
    "general-interest": { title: "Cultura general", intro: "Explora ciencias, filosofía, historia, salud y otros temas." },
  } },
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ko: { Tax: "생활 세금", Finance: "금융 생활", "Real Estate": "주거·부동산", Exam: "시험·자격", Business: "일·조직", Education: "학습·교육", Law: "법·제도" },
  en: { Tax: "Everyday tax", Finance: "Personal finance", "Real Estate": "Housing & property", Exam: "Exams & qualifications", Business: "Work & organizations", Education: "Learning & education", Law: "Law in everyday life" },
  ja: { Tax: "暮らしの税金", Finance: "暮らしと金融", "Real Estate": "住まいと不動産", Exam: "試験と資格", Business: "仕事と組織", Education: "学びと教育", Law: "暮らしの法律" },
  zh: { Tax: "生活税务", Finance: "个人理财", "Real Estate": "住房与房产", Exam: "考试与资格", Business: "工作与组织", Education: "学习与教育", Law: "日常法律" },
  fr: { Tax: "Fiscalité au quotidien", Finance: "Finances personnelles", "Real Estate": "Logement et immobilier", Exam: "Examens et qualifications", Business: "Travail et organisations", Education: "Apprentissage et éducation", Law: "Droit au quotidien" },
  es: { Tax: "Impuestos cotidianos", Finance: "Finanzas personales", "Real Estate": "Vivienda e inmuebles", Exam: "Exámenes y cualificaciones", Business: "Trabajo y organizaciones", Education: "Aprendizaje y educación", Law: "Derecho cotidiano" },
};

export function otherCategoryLabel(locale: string, category: string, fallback: string): string {
  return CATEGORY_LABELS[locale]?.[category] ?? fallback;
}
