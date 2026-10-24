import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';
import {
    buildPlans,
    COUNTRY_MONEY,
    MONEY_PLAN_AS_OF,
    minimumIncomeFor,
    minimumPay,
    PLAN_COUNTRIES,
    wageRatio,
    type PlanCountry,
    type PlanId,
} from '../../lib/money-plan-countries';
import { COUNTRY_NOTES, pickNote, type NoteLang } from '../../lib/money-plan-notes';

type Locale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es';

// Every wage, threshold and cap lives in src/lib/money-plan-countries.ts and the notes in
// src/lib/money-plan-notes.ts (checked 2026-10-23). This component only collects inputs and shows results.

const NEED_KEYS = ['housing', 'food', 'utilities', 'transport', 'phone', 'insurance', 'otherNeeds'] as const;
type NeedKey = (typeof NEED_KEYS)[number];

interface Amounts {
    netMonthly: number;
    housing: number;
    food: number;
    utilities: number;
    transport: number;
    phone: number;
    insurance: number;
    otherNeeds: number;
    wants: number;
    currentSavings: number;
    hourlyWage: number;
}

interface FormState extends Amounts {
    country: PlanCountry;
    age: number;
    household: number;
    returnPct: number;
    weeklyHours: number;
}

/** Example amounts per country (local currency) so a first look is meaningful; not statistics. */
const PRESETS: Record<PlanCountry, Amounts> = {
    kr: { netMonthly: 3_000_000, housing: 600_000, food: 400_000, utilities: 120_000, transport: 80_000, phone: 50_000, insurance: 80_000, otherNeeds: 50_000, wants: 400_000, currentSavings: 5_000_000, hourlyWage: 12_000 },
    jp: { netMonthly: 250_000, housing: 60_000, food: 35_000, utilities: 10_000, transport: 5_000, phone: 4_000, insurance: 5_000, otherNeeds: 3_000, wants: 30_000, currentSavings: 500_000, hourlyWage: 1_300 },
    cn: { netMonthly: 9_000, housing: 2_000, food: 1_500, utilities: 250, transport: 200, phone: 100, insurance: 200, otherNeeds: 150, wants: 1_200, currentSavings: 30_000, hourlyWage: 30 },
    fr: { netMonthly: 2_400, housing: 700, food: 300, utilities: 80, transport: 40, phone: 20, insurance: 30, otherNeeds: 10, wants: 300, currentSavings: 3_000, hourlyWage: 14 },
    es: { netMonthly: 2_000, housing: 600, food: 250, utilities: 70, transport: 30, phone: 20, insurance: 20, otherNeeds: 10, wants: 250, currentSavings: 3_000, hourlyWage: 10 },
};

const initialState = (country: PlanCountry): FormState => ({
    country,
    age: 30,
    household: 1,
    returnPct: 4,
    weeklyHours: COUNTRY_MONEY[country].minimumWage.fullTimeWeeklyHours,
    ...PRESETS[country],
});

const NUMBER_LOCALE: Record<Locale, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', fr: 'fr-FR', es: 'es-ES' };
const STORAGE_KEY = 'oiyo.money-planner.v1';

interface Copy {
    title: string;
    desc: string;
    countries: Record<PlanCountry, string>;
    sections: { basics: string; spending: string; plans: string; wage: string; tips: string };
    f: {
        country: string; age: string; household: string; netMonthly: string; currentSavings: string; returnPct: string;
        wants: string; hourlyWage: string; weeklyHours: string;
    } & Record<NeedKey, string>;
    living: { mine: string; publicRef: string; noRef: string; vsRef: (pct: number) => string; fullTimeMin: string; afterNeeds: string };
    plans: Record<PlanId, string>;
    planDesc: Record<PlanId, string>;
    needs: string; wantsShort: string; save: string; perMonth: string;
    squeezed: string; negative: string;
    emergency: (amount: string) => string; emergencyDone: string; emergencyIn: (d: string) => string; emergencyNever: string;
    reach: (target: string) => string; never: string; now: string;
    whereToPut: string;
    duration: (months: number) => string;
    wage: { legalMin: string; yours: string; ratio: (x: string) => string; below: string; next: (amount: string, date: string) => string };
    tips: { emergency: string; accounts: string; youth: string; gift: string; eligible: string; notEligible: string };
    actions: { save: string; load: string; export: string; import: string; print: string };
    saved: string; loaded: string; importFailed: string; storageOff: string; privacy: string;
    note: string;
}

const durationKo = (m: number) => (m < 12 ? `${m}개월` : m % 12 === 0 ? `${m / 12}년` : `${Math.floor(m / 12)}년 ${m % 12}개월`);
const durationEn = (m: number) => {
    const y = Math.floor(m / 12);
    const r = m % 12;
    const ys = y ? `${y} yr${y > 1 ? 's' : ''}` : '';
    const ms = r ? `${r} mo` : '';
    return [ys, ms].filter(Boolean).join(' ') || '0 mo';
};

const COPY: Record<Locale, Copy> = {
    ko: {
        title: '월급 나누기·저축 플래너',
        desc: '나라를 고르고 한 달 수입과 지출을 넣으면 얼마나 모을 수 있는지, 월급을 어떻게 나눌지, 목표 금액에 언제 닿는지 알려 줘요.',
        countries: { kr: '대한민국', jp: '일본', cn: '중국', fr: '프랑스', es: '스페인' },
        sections: { basics: '기본 정보', spending: '한 달 지출과 최저생계비', plans: '월급 나누기 A·B·C안', wage: '최저임금 계산기', tips: '이 나라에서 돈 모으는 법' },
        f: {
            country: '나라', age: '나이(만)', household: '가구원 수', netMonthly: '월 실수령액', currentSavings: '지금 모아 둔 돈', returnPct: '기대 연 수익률(%)',
            wants: '외식·취미·여행 등 선택지출', hourlyWage: '내 시급', weeklyHours: '주 근무시간',
            housing: '주거비(월세·관리비·대출이자)', food: '식비', utilities: '공과금(전기·가스·수도)', transport: '교통비', phone: '통신비', insurance: '보험료', otherNeeds: '기타 필수지출',
        },
        living: {
            mine: '내 최저생계비(필수지출 합계)', publicRef: '공적 최저생활 기준', noRef: '이 나라는 지역·나이에 따라 정해져 단일 기준이 없어요.',
            vsRef: (pct) => `공적 기준의 ${pct}%예요.`, fullTimeMin: '전일제 최저임금 월급', afterNeeds: '필수지출을 빼고 남는 돈',
        },
        plans: { current: '지금 그대로', stable: 'A안 안정형', balanced: 'B안 균형형', aggressive: 'C안 공격형' },
        planDesc: { current: '지금 쓰는 대로', stable: '필수 50 · 선택 30 · 저축 20', balanced: '필수 50 · 선택 20 · 저축 30', aggressive: '필수 45 · 선택 10 · 저축 45' },
        needs: '필수', wantsShort: '선택', save: '저축', perMonth: '/월',
        squeezed: '필수지출이 비율보다 커서 선택지출과 저축을 줄였어요.', negative: '지출이 수입보다 많아요. 필수지출부터 점검하세요.',
        emergency: (a) => `비상금 목표 ${a}`, emergencyDone: '비상금은 이미 채웠어요', emergencyIn: (d) => `${d} 뒤 비상금 완성`, emergencyNever: '이 저축액으로는 비상금을 채울 수 없어요',
        reach: (t) => `${t} 달성`, never: '50년 안에 어려워요', now: '이미 달성',
        whereToPut: '비상금을 채운 뒤 매달 넣을 곳',
        duration: durationKo,
        wage: {
            legalMin: '이 근무시간의 법정 최저 월급', yours: '내 월급(시급 × 근무시간)', ratio: (x) => `최저임금의 ${x}배`, below: '최저임금보다 낮아요. 근로계약과 임금명세서를 확인하세요.',
            next: (a, d) => `${d}부터 시급 ${a}`,
        },
        tips: { emergency: '비상금', accounts: '저축·투자 계좌', youth: '청년·나이별 혜택', gift: '증여·상속세 줄이기', eligible: '내 나이로 가입할 수 있어요', notEligible: '내 나이로는 가입할 수 없어요' },
        actions: { save: '이 브라우저에 저장', load: '불러오기', export: '파일로 내보내기', import: '파일 가져오기', print: '인쇄·PDF' },
        saved: '저장했어요.', loaded: '불러왔어요.', importFailed: '파일을 읽지 못했어요.', storageOff: '이 브라우저에서는 저장을 쓸 수 없어요.',
        privacy: '입력값은 서버로 보내지 않아요. 저장은 이 브라우저에만, 내보내기는 내 기기 파일로만 남아요.',
        note: `* 기준일 ${MONEY_PLAN_AS_OF}. 금액 예시는 나라별 출발점일 뿐 통계가 아니에요. 수익률은 매달 복리로 가정했고 세금·물가는 반영하지 않았어요. 제도와 한도는 바뀔 수 있으니 가입 전에 공식 안내를 확인하세요.`,
    },
    en: {
        title: 'Paycheck Split & Savings Planner',
        desc: 'Pick a country, enter your monthly income and spending, and see how much you can save, how to split your pay and when you reach each savings goal.',
        countries: { kr: 'South Korea', jp: 'Japan', cn: 'China', fr: 'France', es: 'Spain' },
        sections: { basics: 'Basics', spending: 'Monthly spending and minimum living cost', plans: 'Split your pay: plans A, B, C', wage: 'Minimum wage calculator', tips: 'How to save in this country' },
        f: {
            country: 'Country', age: 'Age', household: 'Household size', netMonthly: 'Monthly take-home pay', currentSavings: 'Savings so far', returnPct: 'Expected annual return (%)',
            wants: 'Wants: eating out, hobbies, travel', hourlyWage: 'Your hourly wage', weeklyHours: 'Hours per week',
            housing: 'Housing (rent, fees, loan interest)', food: 'Food', utilities: 'Utilities', transport: 'Transport', phone: 'Phone and internet', insurance: 'Insurance', otherNeeds: 'Other essentials',
        },
        living: {
            mine: 'Your minimum living cost (essentials)', publicRef: 'Public minimum income reference', noRef: 'This country sets it by region and age, so there is no single figure.',
            vsRef: (pct) => `${pct}% of the public reference.`, fullTimeMin: 'Full-time minimum wage, monthly', afterNeeds: 'Left after essentials',
        },
        plans: { current: 'As you spend now', stable: 'Plan A · Steady', balanced: 'Plan B · Balanced', aggressive: 'Plan C · Aggressive' },
        planDesc: { current: 'Your actual spending', stable: 'Needs 50 · Wants 30 · Save 20', balanced: 'Needs 50 · Wants 20 · Save 30', aggressive: 'Needs 45 · Wants 10 · Save 45' },
        needs: 'Needs', wantsShort: 'Wants', save: 'Save', perMonth: '/mo',
        squeezed: 'Your essentials exceed this plan’s share, so wants and savings were scaled down.', negative: 'You spend more than you earn. Review your essentials first.',
        emergency: (a) => `Emergency fund target ${a}`, emergencyDone: 'Emergency fund already full', emergencyIn: (d) => `Emergency fund full in ${d}`, emergencyNever: 'This saving rate never fills the emergency fund',
        reach: (t) => `Reach ${t}`, never: 'Not within 50 years', now: 'Already there',
        whereToPut: 'Where to put it each month once the emergency fund is full',
        duration: durationEn,
        wage: {
            legalMin: 'Legal minimum monthly pay for these hours', yours: 'Your monthly pay (wage × hours)', ratio: (x) => `${x}× the minimum`, below: 'This is below the minimum wage. Check your contract and payslips.',
            next: (a, d) => `${a} an hour from ${d}`,
        },
        tips: { emergency: 'Emergency fund', accounts: 'Savings and investment accounts', youth: 'Youth and age-based perks', gift: 'Keeping gift and inheritance tax down', eligible: 'Open to your age', notEligible: 'Not open to your age' },
        actions: { save: 'Save in this browser', load: 'Load', export: 'Export file', import: 'Import file', print: 'Print / PDF' },
        saved: 'Saved.', loaded: 'Loaded.', importFailed: 'Could not read that file.', storageOff: 'Saving is not available in this browser.',
        privacy: 'Nothing is sent to a server. Saving stays in this browser; exporting writes a file to your device.',
        note: `* As of ${MONEY_PLAN_AS_OF}. Example amounts are starting points, not statistics. Returns compound monthly; taxes and inflation are not included. Rules and caps change, so check official guidance before opening an account.`,
    },
    ja: {
        title: '給料の分け方・貯蓄プランナー',
        desc: '国を選んで毎月の収入と支出を入れると、いくら貯められるか、給料をどう分けるか、目標額にいつ届くかがわかります。',
        countries: { kr: '韓国', jp: '日本', cn: '中国', fr: 'フランス', es: 'スペイン' },
        sections: { basics: '基本情報', spending: '毎月の支出と最低生活費', plans: '給料の分け方 A・B・C案', wage: '最低賃金計算機', tips: 'この国でお金を貯める方法' },
        f: {
            country: '国', age: '年齢', household: '世帯人数', netMonthly: '毎月の手取り', currentSavings: '現在の貯蓄', returnPct: '想定年利回り（%）',
            wants: '外食・趣味・旅行などの変動費', hourlyWage: '自分の時給', weeklyHours: '週の労働時間',
            housing: '住居費（家賃・管理費・ローン利息）', food: '食費', utilities: '水道光熱費', transport: '交通費', phone: '通信費', insurance: '保険料', otherNeeds: 'その他の必需支出',
        },
        living: {
            mine: '自分の最低生活費（必需支出の合計）', publicRef: '公的な最低生活の基準', noRef: '地域や年齢で決まるため、単一の基準はありません。',
            vsRef: (pct) => `公的基準の${pct}%です。`, fullTimeMin: 'フルタイム最低賃金の月額', afterNeeds: '必需支出を引いた残り',
        },
        plans: { current: '今のまま', stable: 'A案 安定型', balanced: 'B案 バランス型', aggressive: 'C案 積極型' },
        planDesc: { current: '実際の支出どおり', stable: '必需50・変動30・貯蓄20', balanced: '必需50・変動20・貯蓄30', aggressive: '必需45・変動10・貯蓄45' },
        needs: '必需', wantsShort: '変動', save: '貯蓄', perMonth: '/月',
        squeezed: '必需支出がこの案の割合を超えるため、変動費と貯蓄を減らしました。', negative: '支出が収入を上回っています。まず必需支出を見直しましょう。',
        emergency: (a) => `生活防衛資金の目標 ${a}`, emergencyDone: '生活防衛資金はすでに確保済み', emergencyIn: (d) => `${d}で生活防衛資金が完成`, emergencyNever: 'この貯蓄額では生活防衛資金に届きません',
        reach: (t) => `${t}に到達`, never: '50年以内は困難', now: '達成済み',
        whereToPut: '生活防衛資金が貯まったあとの毎月の積立先',
        duration: (m) => (m < 12 ? `${m}か月` : m % 12 === 0 ? `${m / 12}年` : `${Math.floor(m / 12)}年${m % 12}か月`),
        wage: {
            legalMin: 'この労働時間の法定最低月給', yours: '自分の月給（時給×時間）', ratio: (x) => `最低賃金の${x}倍`, below: '最低賃金を下回っています。雇用契約と給与明細を確認してください。',
            next: (a, d) => `${d}から時給${a}`,
        },
        tips: { emergency: '生活防衛資金', accounts: '貯蓄・投資の口座', youth: '若者・年齢別の制度', gift: '贈与税・相続税を抑える', eligible: 'この年齢で利用できます', notEligible: 'この年齢では利用できません' },
        actions: { save: 'このブラウザーに保存', load: '読み込む', export: 'ファイルに書き出す', import: 'ファイルを読み込む', print: '印刷・PDF' },
        saved: '保存しました。', loaded: '読み込みました。', importFailed: 'ファイルを読み込めませんでした。', storageOff: 'このブラウザーでは保存できません。',
        privacy: '入力内容はサーバーに送信されません。保存はこのブラウザーだけ、書き出しは自分の端末のファイルにだけ残ります。',
        note: `* 基準日 ${MONEY_PLAN_AS_OF}。金額の例は国ごとの出発点で、統計ではありません。利回りは月複利で計算し、税金と物価は含めていません。制度や上限は変わるため、口座開設前に公式情報を確認してください。`,
    },
    zh: {
        title: '工资分配与储蓄规划器',
        desc: '选择国家，输入每月收入和支出，看看能存多少钱、工资怎么分配、什么时候达到储蓄目标。',
        countries: { kr: '韩国', jp: '日本', cn: '中国', fr: '法国', es: '西班牙' },
        sections: { basics: '基本信息', spending: '每月支出与最低生活费', plans: '工资分配 A·B·C 方案', wage: '最低工资计算器', tips: '在这个国家怎么存钱' },
        f: {
            country: '国家', age: '年龄', household: '家庭人数', netMonthly: '每月到手收入', currentSavings: '现有存款', returnPct: '预期年收益率（%）',
            wants: '外出就餐、爱好、旅行等可选支出', hourlyWage: '我的时薪', weeklyHours: '每周工作时间',
            housing: '住房（房租、物业费、贷款利息）', food: '餐饮', utilities: '水电燃气', transport: '交通', phone: '通讯', insurance: '保险', otherNeeds: '其他必要支出',
        },
        living: {
            mine: '我的最低生活费（必要支出合计）', publicRef: '官方最低生活标准', noRef: '该国按地区和年龄确定，没有统一标准。',
            vsRef: (pct) => `为官方标准的${pct}%。`, fullTimeMin: '全日制最低工资月薪', afterNeeds: '扣除必要支出后剩余',
        },
        plans: { current: '保持现状', stable: 'A 方案 稳健型', balanced: 'B 方案 平衡型', aggressive: 'C 方案 积极型' },
        planDesc: { current: '按实际支出', stable: '必要50·可选30·储蓄20', balanced: '必要50·可选20·储蓄30', aggressive: '必要45·可选10·储蓄45' },
        needs: '必要', wantsShort: '可选', save: '储蓄', perMonth: '/月',
        squeezed: '必要支出超过该方案比例，已相应减少可选支出和储蓄。', negative: '支出超过收入，请先检查必要支出。',
        emergency: (a) => `应急资金目标 ${a}`, emergencyDone: '应急资金已存够', emergencyIn: (d) => `${d}后存够应急资金`, emergencyNever: '按此储蓄额无法存够应急资金',
        reach: (t) => `达到 ${t}`, never: '50年内难以达到', now: '已达到',
        whereToPut: '存够应急资金后每月的去向',
        duration: (m) => (m < 12 ? `${m}个月` : m % 12 === 0 ? `${m / 12}年` : `${Math.floor(m / 12)}年${m % 12}个月`),
        wage: {
            legalMin: '该工作时间的法定最低月薪', yours: '我的月薪（时薪×工时）', ratio: (x) => `为最低工资的${x}倍`, below: '低于最低工资，请检查劳动合同和工资条。',
            next: (a, d) => `${d}起时薪${a}`,
        },
        tips: { emergency: '应急资金', accounts: '储蓄与投资账户', youth: '青年及年龄相关福利', gift: '减少赠与税与遗产税', eligible: '按年龄可以开户', notEligible: '按年龄不能开户' },
        actions: { save: '保存到此浏览器', load: '读取', export: '导出文件', import: '导入文件', print: '打印 / PDF' },
        saved: '已保存。', loaded: '已读取。', importFailed: '无法读取该文件。', storageOff: '此浏览器无法保存。',
        privacy: '输入内容不会发送到服务器。保存只在本浏览器中，导出只生成本机文件。',
        note: `* 截至 ${MONEY_PLAN_AS_OF}。示例金额只是各国的起点，并非统计数据。收益按月复利计算，未计入税费和通胀。制度和额度可能变化，开户前请查看官方说明。`,
    },
    fr: {
        title: 'Planificateur de budget et d’épargne',
        desc: 'Choisissez un pays, saisissez vos revenus et dépenses du mois, et voyez combien vous pouvez épargner, comment répartir votre salaire et quand vous atteindrez chaque objectif.',
        countries: { kr: 'Corée du Sud', jp: 'Japon', cn: 'Chine', fr: 'France', es: 'Espagne' },
        sections: { basics: 'Informations de base', spending: 'Dépenses du mois et minimum vital', plans: 'Répartir son salaire : plans A, B, C', wage: 'Calculateur du salaire minimum', tips: 'Épargner dans ce pays' },
        f: {
            country: 'Pays', age: 'Âge', household: 'Personnes au foyer', netMonthly: 'Salaire net mensuel', currentSavings: 'Épargne actuelle', returnPct: 'Rendement annuel attendu (%)',
            wants: 'Envies : restaurants, loisirs, voyages', hourlyWage: 'Votre salaire horaire', weeklyHours: 'Heures par semaine',
            housing: 'Logement (loyer, charges, intérêts)', food: 'Alimentation', utilities: 'Énergie et eau', transport: 'Transports', phone: 'Téléphone et internet', insurance: 'Assurances', otherNeeds: 'Autres dépenses essentielles',
        },
        living: {
            mine: 'Votre minimum vital (dépenses essentielles)', publicRef: 'Référence publique de revenu minimum', noRef: 'Ce pays la fixe selon la région et l’âge : pas de chiffre unique.',
            vsRef: (pct) => `${pct} % de la référence publique.`, fullTimeMin: 'Salaire minimum mensuel à temps plein', afterNeeds: 'Reste après les dépenses essentielles',
        },
        plans: { current: 'Comme aujourd’hui', stable: 'Plan A · Prudent', balanced: 'Plan B · Équilibré', aggressive: 'Plan C · Ambitieux' },
        planDesc: { current: 'Vos dépenses réelles', stable: 'Besoins 50 · Envies 30 · Épargne 20', balanced: 'Besoins 50 · Envies 20 · Épargne 30', aggressive: 'Besoins 45 · Envies 10 · Épargne 45' },
        needs: 'Besoins', wantsShort: 'Envies', save: 'Épargne', perMonth: '/mois',
        squeezed: 'Vos dépenses essentielles dépassent la part du plan : envies et épargne ont été réduites.', negative: 'Vous dépensez plus que vous ne gagnez. Revoyez d’abord vos dépenses essentielles.',
        emergency: (a) => `Épargne de précaution visée : ${a}`, emergencyDone: 'Épargne de précaution déjà constituée', emergencyIn: (d) => `Épargne de précaution constituée en ${d}`, emergencyNever: 'Ce rythme ne permet pas de constituer l’épargne de précaution',
        reach: (t) => `Atteindre ${t}`, never: 'Pas avant 50 ans', now: 'Déjà atteint',
        whereToPut: 'Où placer chaque mois une fois l’épargne de précaution constituée',
        duration: (m) => {
            const y = Math.floor(m / 12);
            const r = m % 12;
            return [y ? `${y} an${y > 1 ? 's' : ''}` : '', r ? `${r} mois` : ''].filter(Boolean).join(' ') || '0 mois';
        },
        wage: {
            legalMin: 'Salaire minimum mensuel pour ces heures', yours: 'Votre salaire mensuel (taux × heures)', ratio: (x) => `${x} fois le minimum`, below: 'Inférieur au salaire minimum. Vérifiez votre contrat et vos bulletins de paie.',
            next: (a, d) => `${a} de l’heure à partir du ${d}`,
        },
        tips: { emergency: 'Épargne de précaution', accounts: 'Comptes d’épargne et d’investissement', youth: 'Avantages jeunes et selon l’âge', gift: 'Réduire les droits de donation et de succession', eligible: 'Ouvert à votre âge', notEligible: 'Pas ouvert à votre âge' },
        actions: { save: 'Enregistrer dans ce navigateur', load: 'Charger', export: 'Exporter un fichier', import: 'Importer un fichier', print: 'Imprimer / PDF' },
        saved: 'Enregistré.', loaded: 'Chargé.', importFailed: 'Impossible de lire ce fichier.', storageOff: 'L’enregistrement n’est pas disponible dans ce navigateur.',
        privacy: 'Rien n’est envoyé à un serveur. L’enregistrement reste dans ce navigateur ; l’export crée un fichier sur votre appareil.',
        note: `* Données au ${MONEY_PLAN_AS_OF}. Les montants d’exemple sont des points de départ, pas des statistiques. Rendement capitalisé chaque mois, hors impôts et inflation. Les règles et plafonds changent : vérifiez les informations officielles avant d’ouvrir un compte.`,
    },
    es: {
        title: 'Planificador de nómina y ahorro',
        desc: 'Elige un país, introduce tus ingresos y gastos del mes y descubre cuánto puedes ahorrar, cómo repartir tu sueldo y cuándo alcanzarás cada meta.',
        countries: { kr: 'Corea del Sur', jp: 'Japón', cn: 'China', fr: 'Francia', es: 'España' },
        sections: { basics: 'Datos básicos', spending: 'Gastos del mes y mínimo vital', plans: 'Reparte tu sueldo: planes A, B, C', wage: 'Calculadora del salario mínimo', tips: 'Cómo ahorrar en este país' },
        f: {
            country: 'País', age: 'Edad', household: 'Personas en el hogar', netMonthly: 'Sueldo neto mensual', currentSavings: 'Ahorro actual', returnPct: 'Rentabilidad anual esperada (%)',
            wants: 'Caprichos: restaurantes, ocio, viajes', hourlyWage: 'Tu salario por hora', weeklyHours: 'Horas semanales',
            housing: 'Vivienda (alquiler, comunidad, intereses)', food: 'Comida', utilities: 'Suministros', transport: 'Transporte', phone: 'Teléfono e internet', insurance: 'Seguros', otherNeeds: 'Otros gastos esenciales',
        },
        living: {
            mine: 'Tu mínimo vital (gastos esenciales)', publicRef: 'Referencia pública de ingreso mínimo', noRef: 'Este país lo fija por región y edad; no hay una cifra única.',
            vsRef: (pct) => `${pct} % de la referencia pública.`, fullTimeMin: 'Salario mínimo mensual a tiempo completo', afterNeeds: 'Queda tras los gastos esenciales',
        },
        plans: { current: 'Como ahora', stable: 'Plan A · Estable', balanced: 'Plan B · Equilibrado', aggressive: 'Plan C · Ambicioso' },
        planDesc: { current: 'Tus gastos reales', stable: 'Necesidades 50 · Caprichos 30 · Ahorro 20', balanced: 'Necesidades 50 · Caprichos 20 · Ahorro 30', aggressive: 'Necesidades 45 · Caprichos 10 · Ahorro 45' },
        needs: 'Necesidades', wantsShort: 'Caprichos', save: 'Ahorro', perMonth: '/mes',
        squeezed: 'Tus gastos esenciales superan la parte del plan, así que se redujeron caprichos y ahorro.', negative: 'Gastas más de lo que ingresas. Revisa primero los gastos esenciales.',
        emergency: (a) => `Fondo de emergencia objetivo: ${a}`, emergencyDone: 'Fondo de emergencia ya completo', emergencyIn: (d) => `Fondo de emergencia completo en ${d}`, emergencyNever: 'Con este ahorro no se completa el fondo de emergencia',
        reach: (t) => `Llegar a ${t}`, never: 'No en 50 años', now: 'Ya alcanzado',
        whereToPut: 'Dónde ponerlo cada mes con el fondo de emergencia completo',
        duration: (m) => {
            const y = Math.floor(m / 12);
            const r = m % 12;
            return [y ? `${y} año${y > 1 ? 's' : ''}` : '', r ? `${r} mes${r > 1 ? 'es' : ''}` : ''].filter(Boolean).join(' ') || '0 meses';
        },
        wage: {
            legalMin: 'Salario mínimo mensual para esas horas', yours: 'Tu sueldo mensual (salario × horas)', ratio: (x) => `${x} veces el mínimo`, below: 'Está por debajo del salario mínimo. Revisa tu contrato y tus nóminas.',
            next: (a, d) => `${a} por hora desde el ${d}`,
        },
        tips: { emergency: 'Fondo de emergencia', accounts: 'Cuentas de ahorro e inversión', youth: 'Ventajas para jóvenes y por edad', gift: 'Reducir el impuesto de donaciones y sucesiones', eligible: 'Disponible a tu edad', notEligible: 'No disponible a tu edad' },
        actions: { save: 'Guardar en este navegador', load: 'Cargar', export: 'Exportar archivo', import: 'Importar archivo', print: 'Imprimir / PDF' },
        saved: 'Guardado.', loaded: 'Cargado.', importFailed: 'No se pudo leer el archivo.', storageOff: 'No se puede guardar en este navegador.',
        privacy: 'Nada se envía a un servidor. Lo guardado queda en este navegador; al exportar se crea un archivo en tu dispositivo.',
        note: `* Datos a ${MONEY_PLAN_AS_OF}. Los importes de ejemplo son un punto de partida, no estadísticas. La rentabilidad se capitaliza cada mes, sin impuestos ni inflación. Las reglas y límites cambian: consulta la información oficial antes de abrir una cuenta.`,
    },
};

/** Keep only known keys with the right type, so a stale or hand-edited file can't break the form. */
function sanitize(raw: unknown): Partial<FormState> {
    if (!raw || typeof raw !== 'object') return {};
    const out: Record<string, unknown> = {};
    const template = initialState('kr');
    for (const [key, def] of Object.entries(template)) {
        const v = (raw as Record<string, unknown>)[key];
        if (key === 'country') {
            if (PLAN_COUNTRIES.includes(v as PlanCountry)) out[key] = v;
        } else if (typeof def === 'number' && typeof v === 'number' && Number.isFinite(v) && v >= 0) out[key] = v;
    }
    return out as Partial<FormState>;
}

const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-success/30';
const buttonClass = 'min-h-11 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted';

const MoneyPlanner: React.FC<{ locale?: Locale; defaultCountry?: PlanCountry }> = ({ locale = 'ko', defaultCountry = 'kr' }) => {
    const t = COPY[locale] ?? COPY.en;
    const lang: NoteLang = locale;
    const [form, setForm] = useState<FormState>(() => initialState(defaultCountry));
    const [status, setStatus] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const country = COUNTRY_MONEY[form.country];
    const notes = COUNTRY_NOTES[form.country];
    const money = useMemo(() => {
        const whole = new Intl.NumberFormat(NUMBER_LOCALE[locale], { style: 'currency', currency: country.currency, maximumFractionDigits: 0 });
        // Euro amounts keep cents only when there are some (1 424,50 €, not 1 424,5 € or 1 200,00 €).
        const cents = new Intl.NumberFormat(NUMBER_LOCALE[locale], { style: 'currency', currency: country.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (n: number) => {
            const v = Math.round(n * 100) / 100;
            return country.currency === 'EUR' && !Number.isInteger(v) ? cents.format(v) : whole.format(v);
        };
    }, [locale, country.currency]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
    const switchCountry = (c: PlanCountry) =>
        setForm((f) => ({ ...initialState(c), age: f.age, household: f.household, returnPct: f.returnPct }));

    const needs = NEED_KEYS.reduce((sum, k) => sum + form[k], 0);
    const plans = buildPlans({
        country: form.country,
        age: form.age,
        netMonthly: form.netMonthly,
        needs,
        wants: form.wants,
        currentSavings: form.currentSavings,
        annualReturn: form.returnPct / 100,
    });
    const publicMin = minimumIncomeFor(form.country, form.household);
    const fullTime = minimumPay(form.country, country.minimumWage.fullTimeWeeklyHours);
    const legal = minimumPay(form.country, form.weeklyHours);
    const ratio = wageRatio(form.country, form.hourlyWage);
    // Same paid-hours basis as the legal minimum, averaged over 12 months (Spain pays the SMI in 14),
    // so the two monthly figures compare like for like.
    const yourMonthly = form.hourlyWage * (legal.monthlyHours || 0);

    useEffect(() => {
        if (!status) return;
        const id = window.setTimeout(() => setStatus(''), 2500);
        return () => window.clearTimeout(id);
    }, [status]);

    const save = () => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
            setStatus(t.saved);
        } catch {
            setStatus(t.storageOff);
        }
    };
    const load = () => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = sanitize(JSON.parse(raw));
            setForm({ ...initialState(parsed.country ?? form.country), ...parsed });
            setStatus(t.loaded);
        } catch {
            setStatus(t.storageOff);
        }
    };
    const exportFile = () => {
        const blob = new Blob([JSON.stringify({ kind: 'oiyo.money-planner.v1', form }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'money-planner.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    const importFile = async (file: File | undefined) => {
        if (!file) return;
        try {
            const parsed = sanitize(JSON.parse(await file.text())?.form);
            setForm({ ...initialState(parsed.country ?? form.country), ...parsed });
            setStatus(t.loaded);
        } catch {
            setStatus(t.importFailed);
        }
    };

    const num = (key: keyof FormState, label: string, opts: { step?: number; max?: number } = {}) => (
        <div className="flex flex-col gap-2" key={key}>
            <label htmlFor={`mp-${key}`} className="text-sm font-bold text-foreground">{label}</label>
            <input
                id={`mp-${key}`}
                type="number"
                inputMode="decimal"
                value={form[key] as number}
                min={0}
                max={opts.max}
                step={opts.step ?? 'any'}
                onChange={(e) => {
                    const v = Math.max(0, Number(e.target.value) || 0);
                    set(key, (opts.max !== undefined ? Math.min(v, opts.max) : v) as never);
                }}
                className={inputClass}
            />
        </div>
    );
    const section = (title: string, children: React.ReactNode) => (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-6 print:break-inside-avoid">
            <legend className="px-2 text-sm font-bold text-foreground">{title}</legend>
            {children}
        </fieldset>
    );
    const line = (label: string, value: string, strong = false) => (
        <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`shrink-0 text-right ${strong ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{value}</span>
        </div>
    );
    const ageOk = (minAge?: number, maxAge?: number) => (minAge === undefined || form.age >= minAge) && (maxAge === undefined || form.age <= maxAge);

    return (
        <GameContainer title={t.title} subtitle="Money Planner" onReset={() => setForm(initialState(form.country))}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-center text-sm font-medium text-muted-foreground">{t.desc}</p>

                {section(t.sections.basics, (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="mp-country" className="text-sm font-bold text-foreground">{t.f.country}</label>
                            <select id="mp-country" value={form.country} onChange={(e) => switchCountry(PLAN_COUNTRIES.find((c) => c === e.target.value) ?? form.country)} className={inputClass}>
                                {PLAN_COUNTRIES.map((c) => <option key={c} value={c}>{t.countries[c]}</option>)}
                            </select>
                        </div>
                        {num('age', t.f.age, { step: 1, max: 120 })}
                        {num('household', t.f.household, { step: 1, max: 10 })}
                        {num('netMonthly', t.f.netMonthly)}
                        {num('currentSavings', t.f.currentSavings)}
                        {num('returnPct', t.f.returnPct, { step: 0.5, max: 30 })}
                    </div>
                ))}

                {section(t.sections.spending, (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {NEED_KEYS.map((k) => num(k, t.f[k]))}
                            {num('wants', t.f.wants)}
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-4">
                            {line(t.living.mine, money(needs), true)}
                            {publicMin !== null
                                ? <>
                                    {line(t.living.publicRef, money(publicMin))}
                                    <p className="text-xs text-muted-foreground">{t.living.vsRef(Math.round((needs / publicMin) * 100))}</p>
                                </>
                                : <p className="text-xs text-muted-foreground">{t.living.noRef}</p>}
                            {line(t.living.fullTimeMin, money(fullTime.monthlyAvg))}
                            {line(t.living.afterNeeds, money(form.netMonthly - needs), true)}
                            {notes.minimumIncome && <p className="text-xs text-muted-foreground">{pickNote(notes.minimumIncome, lang)}</p>}
                        </div>
                    </>
                ))}

                {section(t.sections.plans, (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {plans.map((p) => (
                            <article key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 print:break-inside-avoid">
                                <header>
                                    <h4 className="text-base font-bold text-foreground">{t.plans[p.id]}</h4>
                                    <p className="text-xs text-muted-foreground">{t.planDesc[p.id]}</p>
                                </header>
                                <div className="flex flex-col gap-1">
                                    {line(t.needs, money(p.needs))}
                                    {line(t.wantsShort, money(p.wants))}
                                    {line(t.save, `${money(p.save)}${t.perMonth}`, true)}
                                </div>
                                {p.squeezed && <p className="text-xs text-warning">{t.squeezed}</p>}
                                {p.id === 'current' && p.save <= 0 && <p className="text-xs text-warning">{t.negative}</p>}
                                <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
                                    <p className="text-xs text-muted-foreground">{t.emergency(money(p.emergencyTarget))}</p>
                                    <p className="font-medium text-foreground">
                                        {p.emergencyMonths === 0 ? t.emergencyDone : p.emergencyMonths === null ? t.emergencyNever : t.emergencyIn(t.duration(p.emergencyMonths))}
                                    </p>
                                    {country.seedTargets.map((target, i) => {
                                        const m = p.milestones[i];
                                        return line(t.reach(money(target)), m === 0 ? t.now : m === null ? t.never : t.duration(m));
                                    })}
                                </div>
                                {p.allocation.length > 0 && (
                                    <div className="flex flex-col gap-1 border-t border-border pt-3">
                                        <p className="text-xs text-muted-foreground">{t.whereToPut}</p>
                                        {p.allocation.map((a) => line(a.name, `${money(a.monthly)}${t.perMonth}`))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                ))}

                {section(t.sections.wage, (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {num('hourlyWage', t.f.hourlyWage)}
                            {num('weeklyHours', t.f.weeklyHours, { step: 1, max: 80 })}
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-4">
                            {line(t.wage.legalMin, money(legal.monthlyAvg), true)}
                            {line(t.wage.yours, money(yourMonthly), true)}
                            <p className={`text-sm font-bold ${ratio < 1 ? 'text-warning' : 'text-success'}`}>{t.wage.ratio(ratio.toFixed(2))}</p>
                            {ratio < 1 && <p className="text-xs text-warning">{t.wage.below}</p>}
                            {country.minimumWage.next && <p className="text-xs text-muted-foreground">{t.wage.next(money(country.minimumWage.next.hourly), country.minimumWage.next.effective)}</p>}
                            <p className="text-xs text-muted-foreground">{pickNote(notes.minimumWage, lang)}</p>
                        </div>
                    </>
                ))}

                {section(t.sections.tips, (
                    <div className="flex flex-col gap-4 text-sm leading-6 text-foreground">
                        <div>
                            <h4 className="font-bold">{t.tips.emergency}</h4>
                            <p className="text-muted-foreground">{pickNote(notes.emergency, lang)}</p>
                        </div>
                        <div>
                            <h4 className="font-bold">{t.tips.accounts}</h4>
                            <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
                                {country.accounts.map((a) => (
                                    <li key={a.id}>
                                        {pickNote(notes.accounts[a.id], lang)}
                                        {(a.minAge !== undefined || a.maxAge !== undefined) && (
                                            <span className={`ml-1 font-bold ${ageOk(a.minAge, a.maxAge) ? 'text-success' : 'text-warning'}`}>
                                                ({ageOk(a.minAge, a.maxAge) ? t.tips.eligible : t.tips.notEligible})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold">{t.tips.youth}</h4>
                            <p className="text-muted-foreground">{pickNote(notes.youth, lang)}</p>
                        </div>
                        <div>
                            <h4 className="font-bold">{t.tips.gift}</h4>
                            <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
                                {notes.gift.map((g, i) => <li key={i}>{pickNote(g, lang)}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}

                <div className="flex flex-col gap-3 print:hidden">
                    <div className="flex flex-wrap justify-center gap-2">
                        <button type="button" onClick={save} className={buttonClass}>{t.actions.save}</button>
                        <button type="button" onClick={load} className={buttonClass}>{t.actions.load}</button>
                        <button type="button" onClick={exportFile} className={buttonClass}>{t.actions.export}</button>
                        <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass}>{t.actions.import}</button>
                        <button type="button" onClick={() => window.print()} className={buttonClass}>{t.actions.print}</button>
                        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void importFile(e.target.files?.[0]); e.target.value = ''; }} />
                    </div>
                    <p className="text-center text-xs text-muted-foreground" role="status">{status || t.privacy}</p>
                </div>

                <p className="text-center text-xs text-muted-foreground">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default MoneyPlanner;
