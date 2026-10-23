// Country notes for the money planner: what each savings account is for, youth accounts and how
// to keep gift/inheritance tax down. Every note has ko, en and the country's own language; the
// component shows the page language when it is one of those and English otherwise.
// Checked 2026-10-23 alongside money-plan-countries.ts. These are rules of thumb, not advice.

import type { PlanCountry } from "./money-plan-countries.ts";

export type NoteLang = "ko" | "en" | "ja" | "zh" | "fr" | "es";
export type Note = Partial<Record<NoteLang, string>> & { ko: string; en: string };

export interface CountryNotes {
  emergency: Note;
  accounts: Record<string, Note>;
  youth: Note;
  gift: Note[];
  minimumIncome: Note | null;
  minimumWage: Note;
}

export const NATIVE_LANG: Record<PlanCountry, NoteLang> = { kr: "ko", jp: "ja", cn: "zh", fr: "fr", es: "es" };

/** 페이지 언어가 그 나라 말이거나 한국어·영어면 그 언어로, 아니면 영어로 보여 준다. */
export function pickNote(note: Note, lang: NoteLang): string {
  return note[lang] ?? note.en;
}

export const COUNTRY_NOTES: Record<PlanCountry, CountryNotes> = {
  kr: {
    emergency: {
      ko: "비상금은 언제든 꺼낼 수 있는 파킹통장·CMA에 먼저 모아요.",
      en: "Keep the emergency fund in an instant-access parking account or CMA first.",
    },
    accounts: {
      "kr-youth": {
        ko: "청년미래적금: 만 19~34세, 월 50만 원까지 3년. 정부 기여금 6~12%와 이자 비과세(소득 요건 있음).",
        en: "Youth Future Savings: ages 19–34, up to ₩500,000 a month for 3 years, 6–12% government match, tax-free interest (income limits apply).",
      },
      "kr-pension": {
        ko: "연금저축: 연 600만 원까지 세액공제 13.2~16.5%. 55세 이후 연금으로 받으면 3.3~5.5%만 과세.",
        en: "Pension savings: up to ₩6M a year earns a 13.2–16.5% tax credit; taxed only 3.3–5.5% when drawn as a pension after 55.",
      },
      "kr-irp": {
        ko: "IRP: 연금저축과 합쳐 연 900만 원까지 세액공제. 중도 인출이 어려워요.",
        en: "IRP: together with pension savings, up to ₩9M a year earns the tax credit. Hard to withdraw early.",
      },
      "kr-isa": {
        ko: "ISA: 연 2,000만 원까지 납입. 3년 뒤 이익 200만 원(서민형 400만 원)까지 비과세, 넘는 부분은 9.9% 분리과세.",
        en: "ISA: up to ₩20M a year. After 3 years, gains up to ₩2M (₩4M for low earners) are tax-free and the rest is taxed at 9.9%.",
      },
      "kr-taxable": {
        ko: "일반 계좌: 한도 없음. 국내 주식 매매차익은 비과세, 이자·배당은 15.4%.",
        en: "Taxable account: no limit. Korean stock gains are untaxed; interest and dividends pay 15.4%.",
      },
    },
    youth: {
      ko: "만 19~34세면 청년미래적금을 먼저 검토하세요. 병역 기간만큼 나이 기준이 늘어날 수 있어요.",
      en: "If you are 19–34, check Youth Future Savings first. Military service can extend the age limit.",
    },
    gift: [
      {
        ko: "증여재산공제는 10년 합산이에요: 배우자 6억, 성년 자녀 5,000만(미성년 2,000만), 부모 5,000만, 그 밖의 친족 1,000만 원.",
        en: "Gift allowances run over 10 years: spouse ₩600M, adult child ₩50M (minor ₩20M), parent ₩50M, other relatives ₩10M.",
      },
      {
        ko: "혼인·출산 증여공제로 부모가 자녀에게 1억 원을 더 줄 수 있어요(혼인신고 전후 2년, 출생·입양 후 2년).",
        en: "Marriage and birth gifts let parents give a further ₩100M (within 2 years of marriage registration or a birth).",
      },
      {
        ko: "세율은 10~50%. 증여한 달 말일부터 3개월 안에 신고하면 3%를 공제받아요. 상속세를 줄이려면 10년 단위로 일찍 나눠 주되, 상속 전 10년(상속인)·5년(그 외) 안의 증여는 다시 합산된다는 점을 계산하세요.",
        en: "Rates are 10–50%, with a 3% credit for filing within 3 months of the month-end. To cut inheritance tax, give early in 10-year blocks, remembering gifts within 10 years (heirs) or 5 years (others) of death are added back.",
      },
    ],
    minimumIncome: {
      ko: "기준: 2026년 생계급여 선정기준(기준중위소득 32%). 실제 수급은 재산을 환산한 소득인정액으로 판단해요.",
      en: "Reference: 2026 livelihood benefit threshold (32% of the standard median income). Eligibility counts assets converted into income.",
    },
    minimumWage: {
      ko: "2026년 시간급 10,320원, 2027년 1월부터 10,700원. 주 15시간 이상이면 주휴수당이 붙어요(주 40시간 = 월 209시간).",
      en: "₩10,320 an hour in 2026, ₩10,700 from January 2027. From 15 hours a week, paid weekly rest is added (40 h/week = 209 paid hours a month).",
    },
  },
  jp: {
    emergency: {
      ko: "생활방위자금(비상금)은 보통예금·인터넷 은행에 먼저 모아요.",
      en: "Build the living-defence fund in an ordinary or online bank account first.",
      ja: "生活防衛資金は、まず普通預金やネット銀行に貯めます。",
    },
    accounts: {
      "jp-ideco": {
        ko: "iDeCo: 납입금 전액 소득공제. 한도는 근무 형태마다 달라 기업연금이 없는 회사원은 월 2.3만 엔(제도 개정 예정). 60세까지 인출 불가.",
        en: "iDeCo: contributions are fully deductible. The cap depends on your work; employees without a company pension can pay ¥23,000 a month (reform pending). Locked until 60.",
        ja: "iDeCo：掛金は全額所得控除。上限は働き方で異なり、企業年金のない会社員は月2.3万円（制度改正予定）。60歳まで引き出せません。",
      },
      "jp-nisa-tsumitate": {
        ko: "NISA 적립투자 한도: 연 120만 엔, 운용 이익 비과세. 18세 이상.",
        en: "NISA tsumitate allowance: ¥1.2M a year, gains tax-free. Age 18+.",
        ja: "NISAつみたて投資枠：年120万円まで、運用益は非課税。18歳以上。",
      },
      "jp-nisa-growth": {
        ko: "NISA 성장투자 한도: 연 240만 엔. 평생 비과세 한도는 합계 1,800만 엔(성장 한도 1,200만 엔).",
        en: "NISA growth allowance: ¥2.4M a year. Lifetime tax-free cap ¥18M in total (¥12M growth).",
        ja: "NISA成長投資枠：年240万円まで。生涯の非課税保有限度額は合計1,800万円（うち成長枠1,200万円）。",
      },
      "jp-taxable": {
        ko: "특정계좌: 한도 없음. 이익에 20.315% 과세.",
        en: "Taxable (tokutei) account: no limit, gains taxed at 20.315%.",
        ja: "特定口座：上限なし。利益に20.315%課税。",
      },
    },
    youth: {
      ko: "18세부터 NISA를 쓸 수 있어요. 생활방위자금을 먼저 채우고 적립투자 한도부터 시작하는 것이 기본이에요.",
      en: "NISA opens at 18. Fill the living-defence fund first, then start with the tsumitate allowance.",
      ja: "NISAは18歳から使えます。生活防衛資金を先に確保し、つみたて投資枠から始めるのが基本です。",
    },
    gift: [
      {
        ko: "연간 증여(暦年贈与)는 받는 사람 1명당 연 110만 엔까지 비과세예요.",
        en: "Annual gifts are tax-free up to ¥1.1M per recipient per year.",
        ja: "暦年贈与は受贈者1人あたり年110万円まで非課税です。",
      },
      {
        ko: "상속시정산과세는 누계 2,500만 엔까지 증여세가 없고, 2024년부터 연 110만 엔 기초공제가 따로 붙어요.",
        en: "Under settlement-at-inheritance taxation, gifts up to ¥25M in total are free of gift tax, plus a separate ¥1.1M annual allowance since 2024.",
        ja: "相続時精算課税は累計2,500万円まで贈与税がかからず、2024年からは年110万円の基礎控除が別枠で使えます。",
      },
      {
        ko: "연간 증여의 상속 전 합산 기간은 7년으로 단계적으로 늘고 있어요. 일찍, 계획적으로 나눠 주는 것이 기본이에요.",
        en: "Annual gifts made within 7 years of death (phasing in) are added back to the estate, so give early and on a plan.",
        ja: "暦年贈与の持ち戻し期間は相続開始前7年へ段階的に延長中です。早めに計画的に贈与するのが基本です。",
      },
    ],
    minimumIncome: null,
    minimumWage: {
      ko: "2026년도 지역별 최저임금 전국 가중평균 1,177엔(도쿄 1,280엔), 2026년 10월~12월 사이 지역별로 발효. 내 지역 금액을 확인하세요.",
      en: "FY2026 regional minimum wages average ¥1,177 an hour (Tokyo ¥1,280), taking effect by prefecture between October and December 2026.",
      ja: "令和8年度の地域別最低賃金は全国加重平均1,177円（東京1,280円）。2026年10月〜12月に都道府県ごとに発効します。",
    },
  },
  cn: {
    emergency: {
      ko: "비상금은 수시 입출금 예금이나 MMF에 먼저 모아요.",
      en: "Keep the emergency fund in a demand deposit or money-market fund first.",
      zh: "应急资金先放在活期存款或货币基金。",
    },
    accounts: {
      "cn-pension": {
        ko: "개인양로금: 연 12,000위안까지 소득세 전 공제, 수령할 때 3% 과세.",
        en: "Private pension: up to ¥12,000 a year is deducted before income tax and taxed at 3% on withdrawal.",
        zh: "个人养老金：每年缴存上限12,000元，可在个税前扣除，领取时按3%缴税。",
      },
      "cn-fund": {
        ko: "펀드 적립식·예금: 한도 없음. 위험 감수 능력에 맞춰 나눠요.",
        en: "Fund plans or deposits: no limit; split by how much risk you can take.",
        zh: "基金定投或存款：无额度限制，按风险承受能力分配。",
      },
    },
    youth: {
      ko: "중국에는 나이별 전용 저축 계좌가 없어요. 비상금을 먼저 채운 뒤 개인양로금을 검토하세요.",
      en: "China has no age-specific savings account; build the emergency fund, then consider the private pension.",
      zh: "中国没有按年龄设置的专门储蓄账户，先存够应急资金再考虑个人养老金。",
    },
    gift: [
      {
        ko: "중국은 현재 상속세·증여세를 걷지 않아요.",
        en: "China currently levies no inheritance or gift tax.",
        zh: "中国目前不征收遗产税和赠与税。",
      },
      {
        ko: "직계 가족 사이의 주택 증여는 개인소득세가 면제되지만 받는 쪽이 계세 등을 내요. 가족이 아닌 사람에게 받은 주택은 20% 개인소득세 대상이에요.",
        en: "Gifting a home between close family is exempt from individual income tax, though the recipient pays deed tax; homes received from non-relatives are taxed at 20%.",
        zh: "直系亲属间赠与房产免征个人所得税，但受赠方需缴纳契税等；非亲属赠与房产按20%缴纳个人所得税。",
      },
    ],
    minimumIncome: {
      ko: "기준: 상하이 최저생활보장(低保) 1인 월 1,690위안(2026년 7월부터). 지역마다 달라요.",
      en: "Reference: Shanghai minimum living guarantee (dibao) ¥1,690 per person a month from July 2026; it varies by city.",
      zh: "参考：上海城乡居民最低生活保障标准每人每月1,690元（2026年7月1日起），各地不同。",
    },
    minimumWage: {
      ko: "상하이 월 최저임금 2,740위안, 단시간 근로 시간당 25위안(2025년 7월부터). 베이징은 월 2,540위안. 도시마다 달라요.",
      en: "Shanghai: ¥2,740 a month, ¥25 an hour for part-time work (since July 2025). Beijing: ¥2,540 a month. Each city sets its own.",
      zh: "上海月最低工资2,740元，非全日制小时最低工资25元（2025年7月1日起）；北京月最低工资2,540元。各地标准不同。",
    },
  },
  fr: {
    emergency: {
      ko: "비상금은 비과세 Livret A(한도 22,950유로)와 LDDS(12,000유로)에 먼저 모아요.",
      en: "Keep the emergency fund in the tax-free Livret A (cap €22,950) and LDDS (€12,000) first.",
      fr: "L'épargne de précaution se place d'abord sur le Livret A (plafond 22 950 €) et le LDDS (12 000 €), sans impôt.",
    },
    accounts: {
      "fr-per": {
        ko: "PER: 납입액을 과세소득에서 공제(한도는 근로소득의 약 10%). 은퇴 전에는 원칙적으로 묶여 있어요.",
        en: "PER: contributions reduce taxable income (cap about 10% of earnings); locked until retirement except in set cases.",
        fr: "PER : versements déductibles du revenu imposable (plafond d'environ 10 % des revenus professionnels), bloqués jusqu'à la retraite sauf cas particuliers.",
      },
      "fr-pea": {
        ko: "PEA: 유럽 주식, 납입 15만 유로까지. 5년이 지나면 이익에 소득세가 없어요(사회보장분담금은 냄).",
        en: "PEA: European shares, up to €150,000 paid in; after 5 years gains are free of income tax (social charges still due).",
        fr: "PEA : actions européennes, versements jusqu'à 150 000 €, gains exonérés d'impôt sur le revenu après 5 ans (prélèvements sociaux dus).",
      },
    },
    youth: {
      ko: "12~25세는 Livret Jeune(한도 1,600유로)을 쓸 수 있고 금리는 Livret A 이상이에요.",
      en: "Ages 12–25 can open a Livret Jeune (cap €1,600), paying at least the Livret A rate.",
      fr: "De 12 à 25 ans, le Livret Jeune (plafond 1 600 €) rapporte au moins autant que le Livret A.",
    },
    gift: [
      {
        ko: "부모 각자가 자녀 1명에게 10만 유로를 세금 없이 줄 수 있고, 15년마다 다시 쓸 수 있어요.",
        en: "Each parent can give each child €100,000 tax-free, renewable every 15 years.",
        fr: "Chaque parent peut donner 100 000 € à chaque enfant en franchise de droits, renouvelable tous les 15 ans.",
      },
      {
        ko: "현금 가족 증여는 31,865유로를 더 줄 수 있어요(주는 사람 80세 미만, 받는 사람 성년).",
        en: "A family cash gift adds €31,865 (giver under 80, recipient an adult).",
        fr: "Le don familial de sommes d'argent ajoute 31 865 € (donateur de moins de 80 ans, bénéficiaire majeur).",
      },
      {
        ko: "생명보험(assurance-vie)은 70세 전 납입분에 대해 수익자 1인당 152,500유로까지 상속세 밖에서 넘겨줄 수 있어요.",
        en: "Life insurance passes up to €152,500 per beneficiary outside the estate for premiums paid before 70.",
        fr: "L'assurance-vie transmet jusqu'à 152 500 € par bénéficiaire hors succession pour les versements avant 70 ans.",
      },
    ],
    minimumIncome: {
      ko: "기준: RSA 기본액(1인 651.69유로, 2026년 4월부터). 2인은 50%, 그 뒤로는 1인당 30% 더해요.",
      en: "Reference: RSA base amount (€651.69 for one person from April 2026), +50% for a second person and +30% for each one after.",
      fr: "Référence : montant forfaitaire du RSA (651,69 € pour une personne seule au 1er avril 2026), +50 % pour la 2e personne, +30 % par personne ensuite.",
    },
    minimumWage: {
      ko: "SMIC 시간당 12.31유로(2026년 6월 자동 인상), 주 35시간 = 월 151.67시간 1,867.02유로(세전).",
      en: "SMIC €12.31 an hour (automatic rise in June 2026); 35 h/week = 151.67 h = €1,867.02 gross a month.",
      fr: "SMIC à 12,31 € brut de l'heure (revalorisation automatique de juin 2026) ; 35 h = 151,67 h = 1 867,02 € brut par mois.",
    },
  },
  es: {
    emergency: {
      ko: "비상금은 이자가 붙는 수시 입출금 계좌에 3~6개월치를 모아요.",
      en: "Keep 3–6 months of costs in an interest-paying instant-access account.",
      es: "Guarda entre 3 y 6 meses de gastos en una cuenta remunerada de acceso inmediato.",
    },
    accounts: {
      "es-pension": {
        ko: "개인연금(Plan de pensiones): 연 1,500유로까지 소득세 과세표준에서 공제.",
        en: "Individual pension plan: up to €1,500 a year reduces the IRPF tax base.",
        es: "Plan de pensiones individual: aportación máxima de 1.500 € al año, reduce la base imponible del IRPF.",
      },
      "es-index": {
        ko: "인덱스 펀드: 펀드 간 이동(traspaso)은 과세되지 않고, 찾을 때 이익에 19~30% 과세.",
        en: "Index funds: switches between funds are not taxed; gains pay 19–30% when you cash out.",
        es: "Fondo indexado: los traspasos entre fondos no tributan; las ganancias tributan al rescatar (19–30 %).",
      },
    },
    youth: {
      ko: "나이별 전용 저축 계좌는 없어요. 3~6개월치 비상금부터 만드세요.",
      en: "There is no age-specific savings account; start with a 3–6 month emergency fund.",
      es: "No hay una cuenta de ahorro específica por edad; empieza por un fondo de emergencia de 3 a 6 meses.",
    },
    gift: [
      {
        ko: "상속·증여세는 자치주가 운영하고 감면율이 크게 달라요(여러 자치주에서 부모·자녀 사이 99% 감면).",
        en: "Inheritance and gift tax is run by the autonomous communities and reliefs vary widely (several give 99% between parents and children).",
        es: "El Impuesto sobre Sucesiones y Donaciones lo gestionan las comunidades autónomas y las bonificaciones cambian mucho (varias aplican el 99 % entre padres e hijos).",
      },
      {
        ko: "현금 증여는 공증 문서로 남겨야 감면을 받을 수 있어요. 증여 전에 자치주 규정을 확인하세요.",
        en: "Cash gifts usually need a notarial deed to qualify for reliefs; check your community's rules first.",
        es: "Las donaciones de dinero suelen exigir escritura pública para aplicar las bonificaciones; consulta la normativa de tu comunidad antes de donar.",
      },
    ],
    minimumIncome: {
      ko: "기준: 최저생활소득(IMV) 성인 1인 약 733.60유로, 추가 1인당 30% 더해요.",
      en: "Reference: Minimum Living Income (IMV) about €733.60 for one adult, +30% per extra member.",
      es: "Referencia: Ingreso Mínimo Vital de unos 733,60 € para un adulto, +30 % por cada miembro adicional.",
    },
    minimumWage: {
      ko: "2026년 SMI 월 1,221유로 × 14회 = 연 17,094유로(주 40시간). 12개월로 나누면 1,424.50유로.",
      en: "2026 SMI: €1,221 a month × 14 payments = €17,094 a year (40 h/week), or €1,424.50 spread over 12 months.",
      es: "SMI 2026: 1.221 € al mes en 14 pagas = 17.094 € al año (40 h semanales), 1.424,50 € prorrateado en 12 pagas.",
    },
  },
};
