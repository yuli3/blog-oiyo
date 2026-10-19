import { useState, useMemo } from 'react';
import type { Locale } from '../../lib/i18n';
import { Calendar, Clock, DollarSign, HelpCircle, Briefcase, AlertCircle } from 'lucide-react';

interface Props {
  locale: Locale;
}

const UI_TEXT: Record<Locale, {
  title: string;
  subtitle: string;
  yearsService: string;
  hourlyWage: string;
  dailyHours: string;
  unusedDays: string;
  statutoryDays: string;
  dailyWage: string;
  totalAllowance: string;
  formulaNote: string;
  promotionTitle: string;
  promotionDesc: string;
  accountingNote: string;
}> = {
  ko: {
    title: "연차 발생일수 & 미사용 연차수당 계산기",
    subtitle: "근속연수에 따른 근로기준법 법정 연차 휴가 일수(최대 25일)와 미사용 연차에 대한 통상임금 보상 수당을 정밀 산출합니다.",
    yearsService: "근속연수 (입사 연차)",
    hourlyWage: "통상시급 (원)",
    dailyHours: "1일 소정 근로시간",
    unusedDays: "미사용 잔여 연차일수",
    statutoryDays: "법정 발생 연차일수",
    dailyWage: "1일 통상임금",
    totalAllowance: "미사용 연차수당 총액",
    formulaNote: "근로기준법 제60조: 1년 미만 매월 1일(최대 11일), 1년 이상 15일, 이후 매 2년마다 1일 가산(최대 25일).",
    promotionTitle: "연차유급휴가 사용촉진제도 주의사항",
    promotionDesc: "회사가 법정 절차에 따라 서면으로 연차 사용을 촉진하고 시기를 지정하였음에도 근로자가 사용하지 않은 경우, 회사는 미사용 연차수당 지급 의무가 면제됩니다.",
    accountingNote: "회계연도 기준(1월 1일)과 입사일 기준 정산 시 퇴사 시점에는 근로자에게 더 유리한 일수를 보장해야 합니다.",
  },
  en: {
    title: "Annual Paid Leave & Allowance Calculator",
    subtitle: "Calculate your statutory annual leave entitlement (up to 25 days) and unused leave cash-out allowance based on ordinary wages.",
    yearsService: "Years of Service",
    hourlyWage: "Ordinary Hourly Wage",
    dailyHours: "Contractual Daily Hours",
    unusedDays: "Unused Leave Days",
    statutoryDays: "Statutory Leave Entitlement",
    dailyWage: "Daily Ordinary Wage",
    totalAllowance: "Total Unused Leave Allowance",
    formulaNote: "Korean Labor Standards Act, Art. 60: 1 day per month in the first year (max 11), 15 days after 1 year, +1 day every 2 years thereafter (capped at 25 days).",
    promotionTitle: "Leave Promotion Scheme Note",
    promotionDesc: "If the employer formally initiates the statutory leave promotion process in writing and the employee fails to use the leave, the employer may be exempt from paying cash-out allowances.",
    accountingNote: "When calculating by fiscal year vs. hire date, the method more advantageous to the employee must be guaranteed upon departure.",
  },
  ja: {
    title: "年次有給休暇 日数・未消化手当 計算機",
    subtitle: "勤続年数に応じた法定有給休暇の付与日数（最大25日）と、未消化日数に応じた換算手当を計算します。",
    yearsService: "勤続年数",
    hourlyWage: "時間給（通常賃金）",
    dailyHours: "1日の所定労働時間",
    unusedDays: "未消化の有休日数",
    statutoryDays: "法定有給付与日数",
    dailyWage: "1日あたり通常賃金",
    totalAllowance: "未消化有給手当 合計",
    formulaNote: "韓国の勤労基準法第60条：1年未満は毎月1日（最大11日）、1年以上は15日、以後2年ごとに1日加算（上限25日）。日本の労働基準法とは基準が異なります。",
    promotionTitle: "有休取得促進制度の注意点",
    promotionDesc: "企業が書面で法定の有休取得促進を行ったにもかかわらず労働者が取得しなかった場合、未消化手当の支払義務が免除される場合があります。",
    accountingNote: "入社日基準と会計年度基準の精算において、退職時は労働者に有利な日数が保障されます。",
  },
  zh: {
    title: "法定年假天数与未休年假折算补偿计算器",
    subtitle: "根据工龄计算法定带薪年假天数（最高25天）以及未休年休假按日折算的全额工资补偿。",
    yearsService: "累计工作年限（工龄）",
    hourlyWage: "小时正常工作报酬",
    dailyHours: "日法定工作小时数",
    unusedDays: "未休年假天数",
    statutoryDays: "法定应享年假天数",
    dailyWage: "日正常工作工资",
    totalAllowance: "未休年假工资报酬总额",
    formulaNote: "韩国《劳动基准法》第60条：未满1年每月1天（最多11天），满1年15天，此后每满2年增加1天，最多25天。与中国《职工带薪年休假条例》标准不同。",
    promotionTitle: "年休假统筹与休假促进说明",
    promotionDesc: "按韩国法律，用人单位依法定程序书面催促使用年假并指定休假时间后，劳动者仍未使用的，用人单位可免除未休年假补偿的支付义务。",
    accountingNote: "按韩国法律，入职日计算法与会计年度计算法在离职结算时，以对劳动者更为有利的结果为准。",
  },
  fr: {
    title: "Calculateur de Congés Payés & Indemnités",
    subtitle: "Calculez vos jours de congés légaux acquis selon l'ancienneté et le montant de l'indemnité compensatrice de congés non pris.",
    yearsService: "Années d'Ancienneté",
    hourlyWage: "Salaire Horaire de Base",
    dailyHours: "Heures Journalières",
    unusedDays: "Jours de Congés Non Pris",
    statutoryDays: "Jours de Congés Légaux",
    dailyWage: "Salaire Journalier de Référence",
    totalAllowance: "Indemnité Compensatrice Totale",
    formulaNote: "Loi coréenne sur les normes du travail, art. 60 : 1 jour par mois la première année (11 max), 15 jours dès 1 an, +1 jour tous les 2 ans (plafond 25). Différent du droit français.",
    promotionTitle: "Régime d'Incitation aux Congés",
    promotionDesc: "Lorsque l'employeur met en œuvre la procédure formelle d'incitation aux congés et que le salarié ne les pose pas, l'indemnité peut ne pas être due.",
    accountingNote: "Le calcul doit toujours garantir la modalité la plus favorable au salarié lors de son départ.",
  },
  es: {
    title: "Calculadora de Vacaciones y Compensación",
    subtitle: "Calcula los días de vacaciones según tu antigüedad y la compensación económica por días de descanso no disfrutados.",
    yearsService: "Años de Antigüedad",
    hourlyWage: "Salario Ordinario por Hora",
    dailyHours: "Horas de la Jornada Diaria",
    unusedDays: "Días No Disfrutados",
    statutoryDays: "Días de Vacaciones Reconocidos",
    dailyWage: "Salario Diario Base",
    totalAllowance: "Compensación Total por Vacaciones",
    formulaNote: "Ley coreana de normas laborales, art. 60: 1 día por mes el primer año (máx. 11), 15 días tras 1 año, +1 día cada 2 años (máx. 25). Distinto de la legislación española.",
    promotionTitle: "Aviso sobre Promoción del Descanso",
    promotionDesc: "Si la empresa notifica formalmente los periodos para disfrutar las vacaciones y el trabajador no las toma, puede extinguirse la compensación económica.",
    accountingNote: "En la liquidación final debe garantizarse siempre el criterio más beneficioso para el trabajador.",
  },
};

export default function AnnualLeaveCalculator({ locale }: Props) {
  const [yearsService, setYearsService] = useState<number>(3);
  const [hourlyWage, setHourlyWage] = useState<number>(12000);
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [unusedDays, setUnusedDays] = useState<number>(5);

  const t = UI_TEXT[locale] ?? UI_TEXT.en;

  const result = useMemo(() => {
    const years = Math.max(0, yearsService);
    const wage = Math.max(0, hourlyWage);
    const hours = Math.max(1, Math.min(12, dailyHours));
    const unused = Math.max(0, unusedDays);

    let statutoryDays = 0;
    if (years < 1) {
      statutoryDays = 11;
    } else {
      const extra = Math.floor((years - 1) / 2);
      statutoryDays = Math.min(25, 15 + extra);
    }

    const dailyWage = wage * hours;
    const totalAllowance = Math.floor(unused * dailyWage);

    return {
      statutoryDays,
      dailyWage,
      totalAllowance,
    };
  }, [yearsService, hourlyWage, dailyHours, unusedDays]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Inputs Panel */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>{t.yearsService}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="40"
                value={yearsService}
                onChange={(e) => setYearsService(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">년차</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>{t.hourlyWage}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="500"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">원</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t.dailyHours}</span>
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(parseInt(e.target.value) || 8)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="8">8시간 (전일제)</option>
              <option value="7">7시간</option>
              <option value="6">6시간</option>
              <option value="5">5시간</option>
              <option value="4">4시간 (단시간)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{t.unusedDays}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={unusedDays}
                onChange={(e) => setUnusedDays(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-medium">일</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Results */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block">{t.statutoryDays}</span>
          <div className="mt-2 text-3xl font-black text-foreground font-mono">
            {result.statutoryDays}
            <span className="text-base font-bold text-muted-foreground ml-1">일</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {yearsService < 1 ? "1년 미만 월차 기준" : "기본 15일 + 근속가산"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block">{t.dailyWage}</span>
          <div className="mt-2 text-3xl font-black text-foreground font-mono">
            {result.dailyWage.toLocaleString()}
            <span className="text-base font-bold text-muted-foreground ml-1">원</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            시급 × 1일 {dailyHours}시간
          </p>
        </div>

        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-primary block">{t.totalAllowance}</span>
          <div className="mt-2 text-3xl font-black text-primary font-mono">
            {result.totalAllowance.toLocaleString()}
            <span className="text-base font-bold text-foreground ml-1">원</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            잔여 {unusedDays}일 × 1일 통상임금
          </p>
        </div>
      </div>

      {/* Legal & Educational Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{t.promotionTitle}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.promotionDesc}
            </p>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.accountingNote}
          </p>
        </div>
      </div>
    </div>
  );
}
