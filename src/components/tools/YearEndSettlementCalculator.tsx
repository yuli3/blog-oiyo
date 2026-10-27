import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';
import {
    HOUSING,
    YEAR_END_AS_OF,
    YOUTH_SME,
    taxSavingPlan,
    type MortgageType,
    type SavingLeverId,
    type YearEndInput,
} from '../../lib/kr-year-end-2026';

type Locale = 'ko' | 'en';

// Every rate, limit and threshold lives in src/lib/kr-year-end-2026.ts (2026년 귀속, checked 2026-10-19,
// housing/donation/youth additions 2026-10-23). This component only collects inputs and shows results.

interface FormState {
    salary: number;
    otherIncome: number;
    withheld: number;
    age: number;
    gender: 'male' | 'female';
    persons: number;
    seniors: number;
    disabled: number;
    womanHead: boolean;
    singleParent: boolean;
    cardChildren: number;
    creditChildren: number;
    birthOrder: number;
    marriage: boolean;
    youthSme: boolean;
    rentEligible: boolean;
    nationalPension: number;
    healthEmployment: number;
    credit: number;
    debit: number;
    culture: number;
    market: number;
    transit: number;
    insurancePremium: number;
    disabledInsurance: number;
    medical: number;
    medicalSpecific: number;
    education: number;
    educationSelf: number;
    donation: number;
    religiousDonation: number;
    politicalDonation: number;
    hometownDonation: number;
    pensionSavings: number;
    irp: number;
    isaTransfer: number;
    rent: number;
    leaseRepaid: number;
    subscriptionPaid: number;
    mortgageInterest: number;
    mortgageType: MortgageType | '';
}

const DEFAULTS: FormState = {
    salary: 50_000_000,
    otherIncome: 0,
    withheld: 2_000_000,
    age: 35,
    gender: 'male',
    persons: 1,
    seniors: 0,
    disabled: 0,
    womanHead: false,
    singleParent: false,
    cardChildren: 0,
    creditChildren: 0,
    birthOrder: 0,
    marriage: false,
    youthSme: false,
    rentEligible: false,
    nationalPension: 2_250_000,
    healthEmployment: 2_150_000,
    credit: 10_000_000,
    debit: 5_000_000,
    culture: 0,
    market: 0,
    transit: 0,
    insurancePremium: 1_200_000,
    disabledInsurance: 0,
    medical: 1_000_000,
    medicalSpecific: 0,
    education: 0,
    educationSelf: 0,
    donation: 0,
    religiousDonation: 0,
    politicalDonation: 0,
    hometownDonation: 0,
    pensionSavings: 3_000_000,
    irp: 0,
    isaTransfer: 0,
    rent: 0,
    leaseRepaid: 0,
    subscriptionPaid: 0,
    mortgageInterest: 0,
    mortgageType: '',
};

const STORAGE_KEY = 'oiyo.year-end-2026.v2';
const MORTGAGE_TYPES = Object.keys(HOUSING.mortgageCaps) as MortgageType[];

/** Keep only known keys with the right type, so a stale or hand-edited file can't break the form. */
function sanitize(raw: unknown): Partial<FormState> {
    if (!raw || typeof raw !== 'object') return {};
    const out: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(DEFAULTS)) {
        const v = (raw as Record<string, unknown>)[key];
        if (typeof def === 'number' && typeof v === 'number' && Number.isFinite(v) && v >= 0) out[key] = v;
        else if (typeof def === 'boolean' && typeof v === 'boolean') out[key] = v;
        else if (key === 'gender' && (v === 'male' || v === 'female')) out[key] = v;
        else if (key === 'mortgageType' && (v === '' || MORTGAGE_TYPES.includes(v as MortgageType))) out[key] = v;
    }
    return out as Partial<FormState>;
}

function toInput(f: FormState): YearEndInput {
    return {
        salary: f.salary,
        persons: f.persons,
        otherIncome: f.otherIncome,
        withheld: f.withheld,
        additional: {
            seniors: f.seniors,
            disabled: f.disabled,
            womanHead: f.gender === 'female' && f.womanHead,
            singleParent: f.singleParent,
        },
        nationalPension: f.nationalPension,
        healthEmployment: f.healthEmployment,
        housing: {
            leaseRepaid: f.leaseRepaid,
            subscriptionPaid: f.subscriptionPaid,
            mortgageInterest: f.mortgageInterest,
            mortgageType: f.mortgageType || undefined,
        },
        card: { credit: f.credit, debit: f.debit, culture: f.culture, market: f.market, transit: f.transit },
        cardChildren: f.cardChildren,
        creditChildren: f.creditChildren,
        birthOrder: f.birthOrder,
        insurancePremium: f.insurancePremium,
        disabledInsurance: f.disabledInsurance,
        medical: f.medical,
        medicalSpecific: f.medicalSpecific,
        education: f.education,
        educationSelf: f.educationSelf,
        donation: f.donation,
        religiousDonation: f.religiousDonation,
        politicalDonation: f.politicalDonation,
        hometownDonation: f.hometownDonation,
        pensionSavings: f.pensionSavings,
        irp: f.irp,
        isaTransfer: f.isaTransfer,
        rent: f.rent,
        rentEligible: f.rentEligible,
        marriage: f.marriage,
        youthSme: f.youthSme && f.age <= YOUTH_SME.maxAge + 6,
    };
}

const COPY = {
    ko: {
        title: '연말정산·종합소득세 시뮬레이터',
        desc: '가족, 주택, 연금, 카드, 기부까지 넣으면 예상 환급액과 더 줄일 수 있는 세금을 함께 보여줘요.',
        sections: {
            income: '소득과 기납부 세액',
            person: '나와 가족',
            insurance: '4대보험',
            card: '카드 사용액',
            housing: '주택',
            pension: '연금·ISA',
            special: '보험·의료·교육',
            donation: '기부',
        },
        f: {
            salary: '총급여 (연, 비과세 제외)',
            otherIncome: '다른 종합소득금액 (사업·기타, 없으면 0)',
            withheld: '이미 낸 근로소득세 (지방세 제외)',
            age: '나이 (만)',
            gender: '성별',
            male: '남성',
            female: '여성',
            persons: '기본공제 인원 (본인 포함)',
            seniors: '그중 70세 이상',
            disabled: '그중 장애인',
            womanHead: '부녀자 공제 (배우자 있음 또는 부양가족 있는 여성 세대주)',
            singleParent: '한부모 (배우자 없이 자녀 부양)',
            cardChildren: '기본공제 자녀 수 (카드 한도 상향)',
            creditChildren: '자녀세액공제: 9~20세·2017년생 제외·기본공제 확인',
            birthOrder: '올해 출생·입양한 자녀',
            birthNone: '없음',
            birthNth: (n: number) => (n >= 3 ? '셋째 이상' : n === 2 ? '둘째' : '첫째'),
            marriage: '2024~2026년 혼인신고 (결혼세액공제를 아직 안 받음)',
            youthSme: '중소기업 취업 청년 감면 (계약 당시 만 34세 이하, 군복무 최대 6년 차감)',
            nationalPension: '국민연금 (본인 부담)',
            healthEmployment: '건강·장기요양·고용보험 (본인 부담)',
            credit: '신용카드',
            debit: '체크카드·현금영수증',
            culture: '도서·공연·체육시설 등 문화',
            market: '전통시장',
            transit: '대중교통',
            rent: '월세 (무주택 세대주, 연 합계)',
            rentEligible: '한국 월세 세액공제 요건을 확인했어요 (무주택 세대·주택 기준·계약·전입·지급 증빙 등)',
            rentEligibleNote: '확인 전 적용 공제는 0이에요. 체크는 본인 확인이며 자격 자동 판정이 아니에요.',
            leaseRepaid: '전세대출 원리금 상환액',
            subscriptionPaid: '주택청약종합저축 납입액 (총급여 7,000만 이하 무주택 세대주)',
            mortgageInterest: '주택담보대출 이자 상환액',
            mortgageType: '주택담보대출 상환 조건',
            mortgageNone: '없음',
            mortgageLabels: {
                fixedAndNoGrace15: '15년 이상 · 고정금리 + 비거치 (2,000만 한도)',
                fixedOrNoGrace15: '15년 이상 · 고정금리 또는 비거치 (1,800만)',
                other15: '15년 이상 · 그 외 (800만)',
                fixedOrNoGrace10: '10년 이상 · 고정금리 또는 비거치 (600만)',
            } as Record<MortgageType, string>,
            pensionSavings: '연금저축',
            irp: 'IRP·퇴직연금(DC) 개인 추가 납입',
            isaTransfer: '올해 연금계좌로 옮긴 ISA 만기금',
            insurancePremium: '보장성 보험료',
            disabledInsurance: '장애인전용 보장성 보험료',
            medical: '부양가족 의료비 (700만 한도)',
            medicalSpecific: '본인·65세 이상·장애인·6세 이하 의료비 (한도 없음)',
            education: '부양가족 교육비: 개인별 자격·한도 적용 후 확인된 합계',
            educationSelf: '본인 교육비',
            donation: '일반 기부금 (종교단체 외)',
            religiousDonation: '종교단체 기부금',
            politicalDonation: '정치후원금',
            hometownDonation: '고향사랑기부금',
        },
        result: '예상 결과',
        refund: '환급 예상액',
        additionalTax: '추가 납부 예상액',
        refundNote: '국세와 지방소득세를 합친 금액이에요.',
        breakdown: '계산 내역',
        rows: {
            totalIncome: '종합소득금액 (근로소득금액 포함)',
            personal: '기본공제',
            additional: '추가공제 (경로·장애인·부녀자·한부모)',
            card: '신용카드 등 소득공제',
            housing: '주택자금·청약 공제',
            taxBase: '과세표준',
            calculatedTax: '산출세액',
            youth: '청년 중소기업 감면',
            earned: '근로소득세액공제',
            child: '자녀·출산 세액공제',
            pension: '연금계좌 세액공제',
            special: '보험·의료·교육 세액공제',
            donation: '기부금 세액공제 (정치·고향사랑 포함)',
            marriage: '결혼세액공제',
            rent: '월세 세액공제',
            standard: '표준세액공제 (특별공제 대신)',
            finalTax: '결정세액',
            localTax: '지방소득세',
            totalTax: '총 세금',
        },
        plan: {
            title: '세금을 더 줄이는 방법',
            empty: '지금 입력으로는 더 줄일 세금이 없어요. 결정세액이 0이거나 공제 한도를 이미 채웠어요.',
            lever: '방법',
            extra: '더 낼 돈',
            saved: '줄어드는 세금',
            ratio: '낸 돈 대비',
            all: '모두 적용하면',
            names: {
                pension: '연금저축·IRP에 더 넣기',
                subscription: '청약저축에 더 넣기 (연 300만 원 한도)',
                political: '정치후원금 10만 원',
                hometown: '고향사랑기부 20만 원 (답례품 30% 별도)',
                debit: '신용카드 대신 체크카드·현금영수증 쓰기',
            } as Record<SavingLeverId, string>,
            caution: '더 낼 돈은 줄일 수 있는 세금을 다 받는 최소 금액(만 원 단위)이에요. 세액공제는 결정세액이 0이 되면 더 돌려주지 않아요. 연금은 55세 전에 찾으면 기타소득세 16.5%를 다시 내요. 기부·청약은 요건을 먼저 확인하세요.',
            keeps: '내 자산으로 남아요',
            spends: '기부라 돌아오지 않아요',
            capNote: (cap: string) => `한도(${cap})까지 넣어도 세금은 더 줄지 않아요`,
        },
        actions: { save: '이 브라우저에 저장', load: '불러오기', export: '파일로 내보내기', import: '파일 가져오기', print: '인쇄·PDF', reset: '초기화' },
        saved: '저장했어요.',
        loaded: '불러왔어요.',
        importFailed: '파일을 읽지 못했어요.',
        storageOff: '이 브라우저에서는 저장을 쓸 수 없어요.',
        privacy: '입력값은 서버로 보내지 않아요. 저장은 이 브라우저에만, 내보내기는 내 기기 파일로만 남아요.',
        note: `* 2026년 귀속(2027년 1~2월 정산) 간이 계산이에요(법령 확인 ${YEAR_END_AS_OF}, 주택·기부·청년 감면 2026-10-23). 특별공제와 표준세액공제 13만 원 중 유리한 쪽을 골라요. 교육비는 개인별 자격·한도를 적용한 공제대상액만 입력해요. 난임·미숙아 의료비, 기부금 이월, 2026 세제개편안은 반영하지 않았어요. 정확한 세액은 홈택스에서 확인하세요.`,
    },
    en: {
        title: 'Korea Year-End Tax & Income Tax Simulator',
        desc: 'Enter family, housing, pension, card and donation details to see your expected refund and how much more tax you could save.',
        sections: {
            income: 'Income and tax withheld',
            person: 'You and your family',
            insurance: 'Social insurance',
            card: 'Card spending',
            housing: 'Housing',
            pension: 'Pension and ISA',
            special: 'Insurance, medical, education',
            donation: 'Donations',
        },
        f: {
            salary: 'Gross salary (annual, excl. non-taxable)',
            otherIncome: 'Other global income amount (business etc., 0 if none)',
            withheld: 'Income tax already withheld (excl. local tax)',
            age: 'Age',
            gender: 'Gender',
            male: 'Male',
            female: 'Female',
            persons: 'Basic deduction persons (incl. you)',
            seniors: 'Of whom aged 70+',
            disabled: 'Of whom with a disability',
            womanHead: 'Working-woman deduction (married, or female head with dependents)',
            singleParent: 'Single parent',
            cardChildren: 'Dependent children (raises card limit)',
            creditChildren: 'Confirmed child-credit dependents (9–20; born in 2017 excluded)',
            birthOrder: 'Child born or adopted this year',
            birthNone: 'None',
            birthNth: (n: number) => (n >= 3 ? 'Third or later' : n === 2 ? 'Second' : 'First'),
            marriage: 'Marriage registered 2024–2026 (credit not yet claimed)',
            youthSme: 'Youth SME employee reduction (aged 34 or under at hire, up to 6 years of military service excluded)',
            nationalPension: 'National Pension (employee share)',
            healthEmployment: 'Health, long-term care, employment insurance (employee share)',
            credit: 'Credit card',
            debit: 'Debit card / cash receipts',
            culture: 'Books, performances, sports facilities',
            market: 'Traditional markets',
            transit: 'Public transit',
            rent: 'Monthly rent (homeless household head, annual total)',
            rentEligible: 'I checked the Korean rent-credit eligibility conditions (non-homeowning household, qualifying home, contract, residence registration and payment evidence).',
            rentEligibleNote: 'No rent credit is applied before confirmation. This is self-confirmation, not an automatic eligibility decision.',
            leaseRepaid: 'Jeonse loan principal + interest repaid',
            subscriptionPaid: 'Housing subscription savings paid (salary ≤ ₩70M, homeless head)',
            mortgageInterest: 'Mortgage interest paid',
            mortgageType: 'Mortgage terms',
            mortgageNone: 'None',
            mortgageLabels: {
                fixedAndNoGrace15: '15+ years · fixed rate and no grace period (₩20M cap)',
                fixedOrNoGrace15: '15+ years · fixed rate or no grace period (₩18M)',
                other15: '15+ years · other (₩8M)',
                fixedOrNoGrace10: '10+ years · fixed rate or no grace period (₩6M)',
            } as Record<MortgageType, string>,
            pensionSavings: 'Pension savings account',
            irp: 'IRP / DC pension voluntary contributions',
            isaTransfer: 'Matured ISA moved to a pension account this year',
            insurancePremium: 'Protection-type insurance premiums',
            disabledInsurance: 'Disability-only insurance premiums',
            medical: 'Dependents’ medical expenses (₩7M cap)',
            medicalSpecific: 'Medical for you, 65+, disabled, under 6 (no cap)',
            education: 'Confirmed dependents’ education base after individual eligibility and caps',
            educationSelf: 'Your own education',
            donation: 'General donations (non-religious)',
            religiousDonation: 'Religious donations',
            politicalDonation: 'Political donations',
            hometownDonation: 'Hometown Love donations',
        },
        result: 'Estimated result',
        refund: 'Estimated refund',
        additionalTax: 'Estimated additional tax',
        refundNote: 'National income tax and local income tax combined.',
        breakdown: 'Breakdown',
        rows: {
            totalIncome: 'Global income amount (incl. earned income)',
            personal: 'Basic deduction',
            additional: 'Additional deductions (senior, disability, woman, single parent)',
            card: 'Card spending deduction',
            housing: 'Housing and subscription deductions',
            taxBase: 'Tax base',
            calculatedTax: 'Calculated tax',
            youth: 'Youth SME reduction',
            earned: 'Earned income tax credit',
            child: 'Child and birth credits',
            pension: 'Pension account credit',
            special: 'Insurance, medical, education credits',
            donation: 'Donation credits (incl. political, hometown)',
            marriage: 'Marriage credit',
            rent: 'Monthly rent credit',
            standard: 'Standard credit (instead of itemized)',
            finalTax: 'Final income tax',
            localTax: 'Local income tax',
            totalTax: 'Total tax',
        },
        plan: {
            title: 'Ways to pay less tax',
            empty: 'Nothing more to save with these inputs: your tax is already zero or the limits are full.',
            lever: 'Move',
            extra: 'Extra outlay',
            saved: 'Tax saved',
            ratio: 'Per won paid',
            all: 'All combined',
            names: {
                pension: 'Pay more into pension savings or IRP',
                subscription: 'Pay more into housing subscription (₩3M a year cap)',
                political: 'Political donation of ₩100,000',
                hometown: 'Hometown Love donation of ₩200,000 (plus 30% gift)',
                debit: 'Pay by debit card or cash receipt instead of credit card',
            } as Record<SavingLeverId, string>,
            caution: 'Extra outlay is the smallest amount (in ₩10,000 steps) that captures the full saving; credits stop once your tax reaches zero. Pension withdrawals before 55 are taxed 16.5% again. Check eligibility before donating or saving.',
            keeps: 'Stays your money',
            spends: 'Donation, not returned',
            capNote: (cap: string) => `Paying up to the cap (${cap}) saves no more tax`,
        },
        actions: { save: 'Save in this browser', load: 'Load', export: 'Export file', import: 'Import file', print: 'Print / PDF', reset: 'Reset' },
        saved: 'Saved.',
        loaded: 'Loaded.',
        importFailed: 'Could not read that file.',
        storageOff: 'Saving is not available in this browser.',
        privacy: 'Nothing is sent to a server. Saving stays in this browser; exporting writes a file to your device.',
        note: `* Simplified estimate under Korean rules for tax year 2026 (settled Jan–Feb 2027; law checked ${YEAR_END_AS_OF}, housing/donation/youth items 2026-10-23). Picks the better of itemized credits or the ₩130,000 standard credit. Enter education amounts only after individual eligibility and caps are confirmed. Infertility medical rates, donation carry-forward and the 2026 tax reform bill are not included. Use NTS Hometax for exact figures.`,
    },
};

const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-success/30';
const buttonClass =
    'min-h-11 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted';

const YearEndSettlementCalculator: React.FC<{ locale?: Locale }> = ({ locale = 'ko' }) => {
    const t = COPY[locale === 'ko' ? 'ko' : 'en'];
    const [form, setForm] = useState<FormState>(DEFAULTS);
    const [status, setStatus] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    const checkedPlan = useMemo(() => {
        try { return taxSavingPlan(toInput(form)); } catch { return null; }
    }, [form]);
    // WHY 2026-10-27: keep the form editable, but never render fallback or stale tax results.
    const plan = checkedPlan ?? taxSavingPlan(toInput(DEFAULTS));
    const inputError = !checkedPlan;
    const r = plan.base;
    const refund = r.refund?.total ?? 0;
    const isRefund = refund >= 0;
    const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString('ko-KR');

    useEffect(() => {
        if (!status) return;
        const id = window.setTimeout(() => setStatus(''), 2500);
        return () => window.clearTimeout(id);
    }, [status]);

    const save = () => {
        if (inputError) return;
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
            if (raw) {
                setForm({ ...DEFAULTS, ...sanitize(JSON.parse(raw)) });
                setStatus(t.loaded);
            }
        } catch {
            setStatus(t.storageOff);
        }
    };
    const exportFile = () => {
        if (inputError) return;
        const blob = new Blob([JSON.stringify({ kind: 'oiyo.year-end-2026.v2', form }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'year-end-2026.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    const importFile = async (file: File | undefined) => {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            if (parsed?.kind !== 'oiyo.year-end-2026.v2') throw new Error('Reconfirm education bases before importing legacy records');
            setForm({ ...DEFAULTS, ...sanitize(parsed?.form ?? parsed) });
            setStatus(t.loaded);
        } catch {
            setStatus(t.importFailed);
        }
    };

    const num = (key: keyof FormState, label: string, opts: { step?: number; max?: number } = {}) => (
        <div className="flex flex-col gap-2" key={key}>
            <label htmlFor={`ye-${key}`} className="text-sm font-bold text-foreground">{label}</label>
            <input
                id={`ye-${key}`}
                type="number"
                inputMode="numeric"
                value={Number.isFinite(form[key] as number) ? form[key] as number : ''}
                min={0}
                max={opts.max}
                step={opts.step ?? 100000}
                onChange={(e) => {
                    const v = e.target.value === '' ? NaN : Number(e.target.value);
                    set(key, v as never);
                }}
                className={inputClass}
            />
        </div>
    );
    const check = (key: 'womanHead' | 'singleParent' | 'marriage' | 'youthSme' | 'rentEligible', label: string) => (
        <label key={key} className="flex min-h-11 items-start gap-3 text-sm font-medium text-foreground">
            <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="mt-1 size-5" />
            <span>{label}</span>
        </label>
    );
    const section = (title: string, children: React.ReactNode) => (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-6 print:break-inside-avoid">
            <legend className="px-2 text-sm font-bold text-foreground">{title}</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
        </fieldset>
    );

    type Row = { label: string; value: number; sign: '' | '-' };
    const allRows: Row[] = [
        { label: t.rows.totalIncome, value: r.totalIncome, sign: '' },
        { label: t.rows.personal, value: r.personalDeduction, sign: '-' },
        { label: t.rows.additional, value: r.additionalDeduction, sign: '-' },
        { label: t.rows.card, value: r.cardDeduction, sign: '-' },
        { label: t.rows.housing, value: r.housing.total, sign: '-' },
        { label: t.rows.taxBase, value: r.taxBase, sign: '' },
        { label: t.rows.calculatedTax, value: r.calculatedTax, sign: '' },
        { label: t.rows.youth, value: r.youthReduction, sign: '-' },
        { label: t.rows.earned, value: r.earnedTaxCredit, sign: '-' },
        { label: t.rows.child, value: r.childCredit + r.birthCredit, sign: '-' },
        { label: t.rows.pension, value: r.pensionCredit, sign: '-' },
        ...(r.usedStandard
            ? [{ label: t.rows.standard, value: r.standardCredit, sign: '-' } as Row]
            : [
                { label: t.rows.special, value: r.insuranceCredit + r.medicalCredit + r.educationCredit, sign: '-' } as Row,
                { label: t.rows.rent, value: r.rentCredit, sign: '-' } as Row,
            ]),
        { label: t.rows.donation, value: r.donationCredit + r.politicalCredit + r.hometownCredit, sign: '-' },
        { label: t.rows.marriage, value: r.marriageCredit, sign: '-' },
    ];
    const rows = allRows.filter((row) => row.value > 0 || row.label === t.rows.taxBase || row.label === t.rows.calculatedTax);

    return (
        <GameContainer title={t.title} subtitle="Year-End Tax Simulator" onReset={() => setForm(DEFAULTS)}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-center text-sm font-medium text-muted-foreground">{t.desc}</p>

                {section(t.sections.income, <>
                    {num('salary', t.f.salary, { step: 1000000 })}
                    {num('withheld', t.f.withheld)}
                    {num('otherIncome', t.f.otherIncome, { step: 1000000 })}
                </>)}

                {section(t.sections.person, <>
                    {num('age', t.f.age, { step: 1, max: 120 })}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="ye-gender" className="text-sm font-bold text-foreground">{t.f.gender}</label>
                        <select id="ye-gender" value={form.gender} onChange={(e) => set('gender', e.target.value === 'female' ? 'female' : 'male')} className={inputClass}>
                            <option value="male">{t.f.male}</option>
                            <option value="female">{t.f.female}</option>
                        </select>
                    </div>
                    {num('persons', t.f.persons, { step: 1, max: 20 })}
                    {num('seniors', t.f.seniors, { step: 1, max: 20 })}
                    {num('disabled', t.f.disabled, { step: 1, max: 20 })}
                    {num('cardChildren', t.f.cardChildren, { step: 1, max: 10 })}
                    {num('creditChildren', t.f.creditChildren, { step: 1, max: 10 })}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="ye-birth" className="text-sm font-bold text-foreground">{t.f.birthOrder}</label>
                        <select id="ye-birth" value={form.birthOrder} onChange={(e) => set('birthOrder', Number(e.target.value))} className={inputClass}>
                            <option value={0}>{t.f.birthNone}</option>
                            {[1, 2, 3].map((n) => <option key={n} value={n}>{t.f.birthNth(n)}</option>)}
                        </select>
                    </div>
                    {form.gender === 'female' && check('womanHead', t.f.womanHead)}
                    {check('singleParent', t.f.singleParent)}
                    {check('marriage', t.f.marriage)}
                    {form.age <= YOUTH_SME.maxAge + 6 && check('youthSme', t.f.youthSme)}
                </>)}

                {section(t.sections.insurance, <>
                    {num('nationalPension', t.f.nationalPension)}
                    {num('healthEmployment', t.f.healthEmployment)}
                </>)}

                {section(t.sections.card, <>
                    {num('credit', t.f.credit, { step: 500000 })}
                    {num('debit', t.f.debit, { step: 500000 })}
                    {num('culture', t.f.culture)}
                    {num('market', t.f.market)}
                    {num('transit', t.f.transit)}
                </>)}

                {section(t.sections.housing, <>
                    {num('rent', t.f.rent)}
                    <div className="flex flex-col gap-1">
                        {check('rentEligible', t.f.rentEligible)}
                        <p className="text-xs text-muted-foreground">{t.f.rentEligibleNote}</p>
                    </div>
                    {num('leaseRepaid', t.f.leaseRepaid)}
                    {num('subscriptionPaid', t.f.subscriptionPaid)}
                    {num('mortgageInterest', t.f.mortgageInterest)}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="ye-mortgage" className="text-sm font-bold text-foreground">{t.f.mortgageType}</label>
                        <select id="ye-mortgage" value={form.mortgageType} onChange={(e) => set('mortgageType', (MORTGAGE_TYPES.find((m) => m === e.target.value) ?? '') as FormState['mortgageType'])} className={inputClass}>
                            <option value="">{t.f.mortgageNone}</option>
                            {MORTGAGE_TYPES.map((m) => <option key={m} value={m}>{t.f.mortgageLabels[m]}</option>)}
                        </select>
                    </div>
                </>)}

                {section(t.sections.pension, <>
                    {num('pensionSavings', t.f.pensionSavings)}
                    {num('irp', t.f.irp)}
                    {num('isaTransfer', t.f.isaTransfer, { step: 1000000 })}
                </>)}

                {section(t.sections.special, <>
                    {num('insurancePremium', t.f.insurancePremium)}
                    {num('disabledInsurance', t.f.disabledInsurance)}
                    {num('medical', t.f.medical)}
                    {num('medicalSpecific', t.f.medicalSpecific)}
                    <p className="text-sm text-muted-foreground md:col-span-2">{locale === 'ko' ? '교육비: 사람별 자격 확인 → 해당 한도 적용 → 확인된 합계 입력. 일반 학원비를 모두 넣지 마세요. 초등 예체능은 연령·학년·시설·과정 조건을 따로 확인해요. 특별재난지역 고향사랑 특례와 주택 차입 경과규정은 자동 판정하지 않아요. 기존 v1 저장본은 보존하지만 이 화면에 자동 불러오지 않아요.' : 'Education: verify each person → apply their limit → enter the confirmed combined base. Not all academy fees qualify. Elementary arts/sports require separate age/grade, provider and course checks. Special-disaster donations and historical housing-loan rules are not determined. Existing v1 records are preserved, not automatically reinterpreted.'}</p>
                    {num('education', t.f.education)}
                    {num('educationSelf', t.f.educationSelf)}
                </>)}

                {section(t.sections.donation, <>
                    {num('donation', t.f.donation)}
                    {num('religiousDonation', t.f.religiousDonation)}
                    {num('politicalDonation', t.f.politicalDonation, { step: 10000 })}
                    {num('hometownDonation', t.f.hometownDonation, { step: 10000 })}
                </>)}

                {inputError ? <p role="alert" className="rounded-lg border border-border p-3 text-sm">{locale === 'ko' ? '입력값을 확인해 주세요. 금액은 유한한 0 이상 숫자, 인원은 정수여야 하며 공제자녀는 본인을 제외한 기본공제 인원을 넘을 수 없어요. 이전 결과는 표시하지 않아요.' : 'Check the inputs: finite non-negative amounts, whole person counts, and eligible children no greater than dependents excluding yourself. Previous results are hidden.'}</p> : <>
                <div className={`rounded-2xl border-2 p-4 text-center sm:p-6 print:break-inside-avoid ${isRefund ? 'border-success bg-success/10' : 'border-warning bg-warning/10'}`} aria-live="polite">
                    <p className={`mb-2 text-sm font-bold uppercase tracking-wide ${isRefund ? 'text-success' : 'text-warning'}`}>{isRefund ? t.refund : t.additionalTax}</p>
                    <p className={`text-4xl font-bold ${isRefund ? 'text-success' : 'text-warning'}`}>{isRefund ? '+' : '-'}₩{fmt(refund)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t.refundNote}</p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 print:break-inside-avoid">
                    <h4 className="text-sm font-bold text-foreground">{t.breakdown}</h4>
                    {rows.map(({ label, value, sign }) => (
                        <div key={label} className="flex items-center justify-between gap-4 text-sm">
                            <span className="font-medium text-muted-foreground">{label}</span>
                            <span className="shrink-0 font-bold text-foreground">{sign}₩{fmt(value)}</span>
                        </div>
                    ))}
                    <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
                        {[
                            { label: t.rows.finalTax, value: r.finalTax },
                            { label: t.rows.localTax, value: r.localTax },
                            { label: t.rows.totalTax, value: r.totalTax },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between text-sm font-bold text-foreground">
                                <span>{label}</span>
                                <span>₩{fmt(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:p-6 print:break-inside-avoid">
                    <h4 className="text-sm font-bold text-foreground">{t.plan.title}</h4>
                    {plan.levers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.plan.empty}</p>
                    ) : (
                        <>
                            {/* Card list instead of a table so the move name gets the full width on a phone. */}
                            <ul className="flex flex-col divide-y divide-border">
                                {[
                                    ...plan.levers.map((l) => ({ key: l.id, name: t.plan.names[l.id], extra: l.extraPayment, saved: l.taxSaved, lever: l, total: false })),
                                    { key: 'all', name: t.plan.all, extra: plan.bestExtraPayment, saved: plan.bestTaxSaved, lever: null, total: true },
                                ].map(({ key, name, extra, saved, lever, total }) => (
                                    <li key={key} className="flex flex-col gap-2 py-3">
                                        <div className="flex flex-col">
                                            <span className={`text-sm text-foreground ${total ? 'font-bold' : 'font-medium'}`}>{name}</span>
                                            {lever && lever.extraPayment > 0 && <span className={`text-xs ${lever.keepsMoney ? 'text-success' : 'text-warning'}`}>{lever.keepsMoney ? t.plan.keeps : t.plan.spends}</span>}
                                            {lever && lever.capExtra > lever.extraPayment && <span className="text-xs text-muted-foreground">{t.plan.capNote(`₩${fmt(lever.capExtra)}`)}</span>}
                                        </div>
                                        <dl className="grid grid-cols-3 gap-2 text-sm">
                                            <div><dt className="text-xs text-muted-foreground">{t.plan.extra}</dt><dd className="font-medium text-foreground">₩{fmt(extra)}</dd></div>
                                            <div><dt className="text-xs text-muted-foreground">{t.plan.saved}</dt><dd className="font-bold text-success">₩{fmt(saved)}</dd></div>
                                            <div><dt className="text-xs text-muted-foreground">{t.plan.ratio}</dt><dd className="text-muted-foreground">{extra > 0 ? `${Math.round((saved / extra) * 100)}%` : '—'}</dd></div>
                                        </dl>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-muted-foreground">{t.plan.caution}</p>
                        </>
                    )}
                </div>

                </>}
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
                <nav aria-label={locale==='ko'?'공식 근거':'Official sources'} className="flex flex-wrap gap-3 text-sm"><a className="min-h-11 text-primary underline" href="https://law.go.kr/LSW/lsRvsDocListP.do?lsId=001565">{locale==='ko'?'소득세법 개정·자녀 출생연도 예외':'Income Tax Act: child birth-year exception'}</a><a className="min-h-11 text-primary underline" href="https://www.law.go.kr/법령/소득세법/제59조의4">{locale==='ko'?'교육비 자격·한도':'Education eligibility and limits'}</a><a className="min-h-11 text-primary underline" href="https://www.law.go.kr/법령/조세특례제한법/제58조">{locale==='ko'?'고향사랑 일반·특례 구분':'Hometown donation rules'}</a></nav>
            </div>
        </GameContainer>
    );
};

export default YearEndSettlementCalculator;
