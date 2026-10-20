import { useState } from "react";
import {
  chinaPensionSaving,
  chinaPensionWithdrawalTax,
  chinaPlan,
  CN_PERSONAL_PENSION_LIMIT,
  francePerExit,
  francePerSaving,
  francePlan,
  frPerCeilingSalarie,
  frPerCeilingTns,
  japanIdecoSaving,
  japanPlan,
  type JpIdecoCategory,
  type JpIdecoPeriod,
  jpIdecoMonthlyLimit,
  jpLumpSumTax,
  JP_NISA_LIFETIME,
  type PensionCountry,
  type PensionTab,
  spainPensionLimit,
  spainPensionRescue,
  spainPensionSaving,
  spainPlan,
} from "../../lib/pension-countries";
import ChoiceChips from "./payroll/ChoiceChips";
import NumberField from "./payroll/NumberField";

// Private-pension tax relief under each country's own scheme (iDeCo/NISA, 个人养老金, PER, plan de pensiones).
// The three pension pages share this calculator and open on a different tab. The Korean 연금저축·IRP calculators
// stay on ko/en.
interface Props {
  country: PensionCountry;
  initialTab: PensionTab;
}

type YesNo = "yes" | "no";

const fmt = (locale: string, currency: string, n: number, digits = 0) =>
  new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: digits }).format(n);
const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

function Result({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

const yesNo = (yes: string, no: string) => [
  { value: "yes" as const, label: yes },
  { value: "no" as const, label: no },
];

function Tabs({ legend, value, onChange, labels }: { legend: string; value: PensionTab; onChange: (t: PensionTab) => void; labels: [string, string, string] }) {
  return (
    <div className="mb-5">
      <ChoiceChips
        legend={legend}
        value={value}
        onChange={onChange}
        options={[
          { value: "contribution", label: labels[0] },
          { value: "withdrawal", label: labels[1] },
          { value: "plan", label: labels[2] },
        ]}
      />
    </div>
  );
}

// ── Japan ────────────────────────────────────────────────────────────────

function Japan({ initialTab }: { initialTab: PensionTab }) {
  const [tab, setTab] = useState<PensionTab>(initialTab);
  const [category, setCategory] = useState<JpIdecoCategory>("employee");
  const [period, setPeriod] = useState<JpIdecoPeriod>("reform");
  const [other, setOther] = useState(0);
  const [monthly, setMonthly] = useState(23_000);
  const [salary, setSalary] = useState(6_000_000);
  const [otherIncome, setOtherIncome] = useState(0);
  const [social, setSocial] = useState(900_000);
  const [spouse, setSpouse] = useState<YesNo>("no");
  const [dependents, setDependents] = useState(0);
  const [lump, setLump] = useState(10_000_000);
  const [lumpYears, setLumpYears] = useState(20);
  const [budget, setBudget] = useState(100_000);
  const [years, setYears] = useState(25);
  const [ret, setRet] = useState(3);
  const [nisaUsed, setNisaUsed] = useState(0);

  const limit = jpIdecoMonthlyLimit(category, period, other);
  const contribution = Math.min(monthly, limit);
  const saving = japanIdecoSaving({ salary, otherIncome, socialInsurance: social, spouse: spouse === "yes", dependents, annualContribution: contribution * 12 });
  const lumpTax = jpLumpSumTax(lump, lumpYears);
  const plan = japanPlan({ monthlyBudget: budget, idecoMonthlyLimit: limit, years, annualReturn: ret / 100, nisaUsed });
  const planSaving = japanIdecoSaving({ salary, otherIncome, socialInsurance: social, spouse: spouse === "yes", dependents, annualContribution: plan.idecoMonthly * 12 });
  const yen = (n: number) => fmt("ja-JP", "JPY", n);
  const showOther = category === "first" || category === "employee-corp";

  const incomeFields = (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <NumberField label="給与収入（年収）" value={salary} onChange={setSalary} suffix="円" step={100_000} />
      <NumberField label="給与以外の所得（事業所得など）" value={otherIncome} onChange={setOtherIncome} suffix="円" step={100_000} />
      <NumberField label="社会保険料（年額）" value={social} onChange={setSocial} suffix="円" step={10_000} />
      <NumberField label="扶養親族（16歳以上）" value={dependents} onChange={setDependents} suffix="人" step={1} />
      <ChoiceChips legend="配偶者控除" value={spouse} onChange={setSpouse} options={yesNo("あり", "なし")} />
    </div>
  );
  const categoryFields = (
    <div className="grid gap-4">
      <ChoiceChips
        legend="加入区分"
        value={category}
        onChange={setCategory}
        options={[
          { value: "employee", label: "会社員（企業年金なし）" },
          { value: "employee-corp", label: "会社員（企業年金あり）・公務員" },
          { value: "first", label: "自営業・フリーランス（第1号）" },
          { value: "third", label: "専業主婦・主夫（第3号）" },
        ]}
      />
      <ChoiceChips
        legend="対象の年分"
        value={period}
        onChange={setPeriod}
        options={[
          { value: "current", label: "令和8年分（現行の限度額）" },
          { value: "reform", label: "令和9年分以降（12月分からの新限度額）" },
        ]}
      />
      {showOther && (
        <NumberField
          label={category === "first" ? "国民年金基金・付加保険料（月額）" : "他制度掛金相当額・企業型DCの事業主掛金（月額）"}
          value={other}
          onChange={setOther}
          suffix="円"
          step={1_000}
        />
      )}
    </div>
  );

  return (
    <>
      <Tabs legend="計算する内容" value={tab} onChange={setTab} labels={["拠出時の節税", "受取時の税金", "iDeCo・NISAの配分"]} />
      {tab === "contribution" && (
        <>
          <p className="text-sm text-muted-foreground">iDeCoの掛金は全額が所得控除（小規模企業共済等掛金控除）になり、所得税と翌年度の住民税が下がります。</p>
          <div className="mt-4">{categoryFields}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="毎月の掛金" value={monthly} onChange={setMonthly} suffix="円" step={1_000} />
          </div>
          {incomeFields}
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="月額の拠出限度額" value={limit ? yen(limit) : "拠出不可"} note={limit ? `年額 ${yen(limit * 12)}` : "限度額が月5,000円未満のため加入できません"} />
            <Result label="所得税の軽減" value={yen(saving.incomeTax)} note={`年間掛金 ${yen(contribution * 12)}（復興特別所得税込み）`} />
            <Result label="住民税の軽減（翌年度）" value={yen(saving.residentTax)} note="所得割10%" />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result label="年間の節税額" value={yen(saving.total)} note={contribution * 12 > 0 ? `掛金の ${pct(saving.total / (contribution * 12), 1)}` : undefined} />
            <Result label="実質負担" value={yen(contribution * 12 - saving.total)} note="年間掛金 − 節税額" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">12月分の掛金は翌年1月に引き落とされるため、令和8年分の控除は現行の限度額（会社員 月2.3万円など）で、新しい限度額（月6.2万円など）が控除に効くのは令和9年分からです。所得がない人（第3号など）は節税になりません。運用益は非課税で、原則60歳まで引き出せません。</p>
        </>
      )}
      {tab === "withdrawal" && (
        <>
          <p className="text-sm text-muted-foreground">iDeCoを一時金で受け取ると退職所得になり、退職所得控除を引いた残りの半分だけに所得税・住民税がかかります（分離課税）。</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="一時金で受け取る額" value={lump} onChange={setLump} suffix="円" step={100_000} />
            <NumberField label="掛金を拠出した年数" value={lumpYears} onChange={setLumpYears} suffix="年" step={1} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="退職所得控除" value={yen(lumpTax.deduction)} note="40万円×年数（20年超は800万円＋70万円×超えた年数）" />
            <Result label="課税退職所得金額" value={yen(lumpTax.taxable)} note="（一時金 − 控除）× 1/2" />
            <Result label="所得税＋住民税" value={yen(lumpTax.total)} note={`所得税 ${yen(lumpTax.incomeTax)} ／ 住民税 ${yen(lumpTax.residentTax)}`} />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result label="手取り" value={yen(lump - lumpTax.total)} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">会社の退職金を同じ年に受け取ると退職所得控除は合算して1回分です。iDeCoの一時金を先に受け取り、後から退職金を受け取る場合、令和7年度改正で調整の対象が前年以前9年内に広がりました。年金で受け取る場合は公的年金等控除を使う雑所得になり、ほかの年金と合算して課税されます。</p>
        </>
      )}
      {tab === "plan" && (
        <>
          <p className="text-sm text-muted-foreground">毎月の積立額を、所得控除があるiDeCoから先に限度額まで、次に新NISA（年360万円・生涯1,800万円）、残りを課税口座に振り分けて、同じ利回りで運用した場合を比べます。</p>
          <div className="mt-4">{categoryFields}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="毎月の積立予算" value={budget} onChange={setBudget} suffix="円" step={10_000} />
            <NumberField label="積立期間" value={years} onChange={setYears} suffix="年" step={1} />
            <NumberField label="想定利回り（年）" value={ret} onChange={setRet} suffix="%" step={0.5} />
            <NumberField label={`使用済みのNISA生涯枠（上限${(JP_NISA_LIFETIME / 10_000).toLocaleString("ja-JP")}万円）`} value={nisaUsed} onChange={setNisaUsed} suffix="円" step={100_000} />
          </div>
          {incomeFields}
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="iDeCo（月額）" value={yen(plan.idecoMonthly)} note={`${years}年後 ${yen(plan.balances.ideco)}`} />
            <Result label="新NISA（月額）" value={yen(plan.nisaMonthly)} note={`${years}年後 ${yen(plan.balances.nisa)}（非課税）`} />
            <Result label="課税口座（月額）" value={yen(Math.max(0, budget - plan.idecoMonthly - plan.nisaMonthly))} note={`${years}年後 ${yen(plan.balances.taxable)}、譲渡益課税 ${yen(plan.taxableGainTax)}`} />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-3">
            <Result label="iDeCoの節税（累計）" value={yen(planSaving.total * years)} note={`年 ${yen(planSaving.total)} × ${years}年（今の所得が続く場合）`} />
            <Result label="iDeCo一時金の税金" value={yen(plan.lumpSum.total)} note={`退職所得控除 ${yen(plan.lumpSum.deduction)}`} />
            <Result label="税引後の資産＋節税額" value={yen(plan.net + planSaving.total * years)} note={`元本 ${yen(budget * 12 * years)}`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">iDeCoは原則60歳まで引き出せず、NISAはいつでも売却できます。教育費や住宅資金など途中で使う予定のお金はNISAに回す方が安全です。NISAの枠は売却した翌年に簿価分が復活しますが、ここでは考慮していません。</p>
        </>
      )}
    </>
  );
}

// ── China ────────────────────────────────────────────────────────────────

function China({ initialTab }: { initialTab: PensionTab }) {
  const [tab, setTab] = useState<PensionTab>(initialTab);
  const [income, setIncome] = useState(240_000);
  const [social, setSocial] = useState(30_000);
  const [special, setSpecial] = useState(24_000);
  const [other, setOther] = useState(0);
  const [contribution, setContribution] = useState(CN_PERSONAL_PENSION_LIMIT);
  const [withdraw, setWithdraw] = useState(200_000);
  const [years, setYears] = useState(20);
  const [ret, setRet] = useState(2.5);
  const s = chinaPensionSaving({ income, socialInsurance: social, specialAdditional: special, otherDeductions: other, contribution });
  const p = chinaPlan({ income, socialInsurance: social, specialAdditional: special, otherDeductions: other, contribution, years, annualReturn: ret / 100 });
  const cny = (n: number) => fmt("zh-CN", "CNY", n, 2);
  const incomeFields = (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <NumberField label="全年工资薪金等综合所得收入额" value={income} onChange={setIncome} suffix="元" step={1_000} />
      <NumberField label="专项扣除（个人缴纳的社保、公积金）" value={social} onChange={setSocial} suffix="元" step={1_000} />
      <NumberField label="专项附加扣除全年合计" value={special} onChange={setSpecial} suffix="元" step={1_000} />
      <NumberField label="其他扣除（商业健康险等）" value={other} onChange={setOther} suffix="元" step={100} />
      <NumberField label="个人养老金年缴费" value={contribution} onChange={setContribution} suffix="元" step={1_000} />
    </div>
  );
  return (
    <>
      <Tabs legend="计算内容" value={tab} onChange={setTab} labels={["缴费节税", "领取纳税", "长期测算"]} />
      {tab === "contribution" && (
        <>
          <p className="text-sm text-muted-foreground">向个人养老金资金账户缴费，每年最多12,000元可以在综合所得中据实扣除，按你的边际税率少缴个税。</p>
          {incomeFields}
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="可扣除金额" value={cny(s.deduction)} note={`限额 ${cny(CN_PERSONAL_PENSION_LIMIT)}/年`} />
            <Result label="少缴个税" value={cny(s.saving)} note={`应纳税额 ${cny(s.before)} → ${cny(s.after)}`} />
            <Result label="边际税率" value={pct(s.marginal)} note={`应纳税所得额 ${cny(s.taxableBefore)}`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{s.marginal <= 0.03 ? "你的边际税率不超过3%，缴费省下的税不多于领取时要交的3%，单看税收不划算。" : `领取时按3%缴税，边际税率 ${pct(s.marginal)} 与3%的差就是净节税。`} 经营所得也可扣除，本表按综合所得计算。</p>
        </>
      )}
      {tab === "withdrawal" && (
        <>
          <p className="text-sm text-muted-foreground">领取个人养老金时不并入综合所得，全额单独按3%计税，由开户银行代扣代缴。</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="领取金额" value={withdraw} onChange={setWithdraw} suffix="元" step={1_000} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
            <Result label="代扣个税" value={cny(chinaPensionWithdrawalTax(withdraw))} note="领取金额 × 3%（本金和收益都计税）" />
            <Result label="实际到手" value={cny(withdraw - chinaPensionWithdrawalTax(withdraw))} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">一般要达到领取基本养老金年龄、完全丧失劳动能力、出国（境）定居等条件才能领取，可按月、分次或一次性领取。领取方式不影响3%的税率。</p>
        </>
      )}
      {tab === "plan" && (
        <>
          <p className="text-sm text-muted-foreground">每年按同样的金额缴费、按同一收益率滚存到退休，比较累计少缴的个税和领取时的3%。</p>
          {incomeFields}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="缴费年数" value={years} onChange={setYears} suffix="年" step={1} />
            <NumberField label="预期年化收益率" value={ret} onChange={setRet} suffix="%" step={0.5} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="退休时账户余额" value={cny(p.balance)} note={`累计缴费 ${cny(p.principal)}`} />
            <Result label="累计少缴个税" value={cny(p.savings)} note={`每年 ${cny(p.saving)}（收入不变时）`} />
            <Result label="领取时缴税" value={cny(p.withdrawalTax)} note="余额 × 3%" />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result label="税收净收益" value={cny(p.net)} note="累计少缴的个税 − 领取时的税" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">投资收益在账户内暂不征税。账户资金一般要到退休才能取出，收益率取决于所选的储蓄、理财、基金或保险产品。</p>
        </>
      )}
    </>
  );
}

// ── France ───────────────────────────────────────────────────────────────

type FrStatus = "salarie" | "tns";

function France({ initialTab }: { initialTab: PensionTab }) {
  const [tab, setTab] = useState<PensionTab>(initialTab);
  const [status, setStatus] = useState<FrStatus>("salarie");
  const [revPro, setRevPro] = useState(45_000);
  const [employer, setEmployer] = useState(0);
  const [carry, setCarry] = useState(0);
  const [revenu, setRevenu] = useState(40_500);
  const [couple, setCouple] = useState<YesNo>("no");
  const [children, setChildren] = useState(0);
  const [versement, setVersement] = useState(4_000);
  const [deducted, setDeducted] = useState(60_000);
  const [notDeducted, setNotDeducted] = useState(0);
  const [gains, setGains] = useState(25_000);
  const [retIncome, setRetIncome] = useState(24_000);
  const [spread, setSpread] = useState(1);
  const [budget, setBudget] = useState(6_000);
  const [years, setYears] = useState(20);
  const [ret, setRet] = useState(4);
  const ceiling = status === "salarie" ? frPerCeilingSalarie(revPro, employer) : frPerCeilingTns(revPro);
  const plafond = ceiling + Math.max(0, carry);
  const s = francePerSaving({ revenu, couple: couple === "yes", children, versement, plafond });
  const e = francePerExit({ deducted, notDeducted, gains, retirementIncome: retIncome, couple: couple === "yes", spreadYears: spread });
  const p = francePlan({ revenu, couple: couple === "yes", children, annualBudget: budget, plafond, years, annualReturn: ret / 100, retirementIncome: retIncome, spreadYears: spread });
  const eur = (n: number) => fmt("fr-FR", "EUR", n);
  const plafondFields = (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <ChoiceChips legend="Statut" value={status} onChange={setStatus} options={[{ value: "salarie", label: "Salarié" }, { value: "tns", label: "Indépendant (TNS)" }]} />
      <NumberField label={status === "salarie" ? "Revenus professionnels nets 2025 (après abattement de 10 %)" : "Bénéfice imposable 2026"} value={revPro} onChange={setRevPro} suffix="€" step={1_000} />
      {status === "salarie" && <NumberField label="Cotisations employeur PERCOL / PER obligatoire 2025" value={employer} onChange={setEmployer} suffix="€" step={100} />}
      <NumberField label="Plafonds non utilisés reportables (avis d'impôt)" value={carry} onChange={setCarry} suffix="€" step={100} />
      <NumberField label="Revenu net imposable du foyer" value={revenu} onChange={setRevenu} suffix="€" step={1_000} />
      <ChoiceChips legend="Imposition commune (couple)" value={couple} onChange={setCouple} options={yesNo("Oui", "Non")} />
      <NumberField label="Enfants à charge" value={children} onChange={setChildren} suffix="enfants" step={1} />
    </div>
  );
  return (
    <>
      <Tabs legend="Que voulez-vous calculer ?" value={tab} onChange={setTab} labels={["Économie d'impôt", "Fiscalité de sortie", "Projection PER"]} />
      {tab === "contribution" && (
        <>
          <p className="text-sm text-muted-foreground">Les versements volontaires sur un PER se déduisent du revenu imposable dans la limite du plafond épargne retraite : l'économie d'impôt dépend de votre tranche marginale (TMI).</p>
          {plafondFields}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Versement PER en 2026" value={versement} onChange={setVersement} suffix="€" step={100} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="Plafond de déduction 2026" value={eur(plafond)} note={status === "salarie" ? "10 % des revenus 2025, entre 4 710 € et 37 680 €" : "10 % du bénéfice + 15 % entre 1 et 8 PASS"} />
            <Result label="Économie d'impôt" value={eur(s.saving)} note={`Impôt ${eur(s.before)} → ${eur(s.after)}`} />
            <Result label="Tranche marginale" value={pct(s.tmi)} note={`Montant déduit ${eur(s.deduction)}`} />
          </div>
          {s.excess > 0 && <p className="mt-3 text-sm text-foreground">{eur(s.excess)} dépassent le plafond et ne sont pas déductibles cette année.</p>}
          <p className="mt-3 text-sm text-muted-foreground">Le plafond 2026 figure sur l'avis d'impôt 2025. Depuis la loi de finances 2026, les plafonds non utilisés à partir de 2026 se reportent sur 5 ans (3 ans pour ceux de 2023 à 2025), et les versements faits après 70 ans ne sont plus déductibles. Un couple peut mutualiser ses plafonds (case 6QR).</p>
        </>
      )}
      {tab === "withdrawal" && (
        <>
          <p className="text-sm text-muted-foreground">Sortie en capital à la retraite : la part des versements déduits est imposée au barème, les gains au prélèvement forfaitaire de 12,8 % plus 18,6 % de prélèvements sociaux.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Versements déduits" value={deducted} onChange={setDeducted} suffix="€" step={1_000} />
            <NumberField label="Versements non déduits" value={notDeducted} onChange={setNotDeducted} suffix="€" step={1_000} />
            <NumberField label="Plus-values et produits" value={gains} onChange={setGains} suffix="€" step={1_000} />
            <NumberField label="Revenu net imposable à la retraite (hors PER)" value={retIncome} onChange={setRetIncome} suffix="€" step={1_000} />
            <NumberField label="Retrait fractionné sur" value={spread} onChange={setSpread} suffix="ans" step={1} />
            <ChoiceChips legend="Imposition commune (couple)" value={couple} onChange={setCouple} options={yesNo("Oui", "Non")} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="Impôt sur les versements" value={eur(e.principalTax)} note="Hausse du barème, sans abattement de 10 %" />
            <Result label="Impôt et prélèvements sur les gains" value={eur(e.gainsIr + e.gainsSocial)} note={`12,8 % ${eur(e.gainsIr)} + 18,6 % ${eur(e.gainsSocial)}`} />
            <Result label="Capital net" value={eur(e.net)} note={`Sur ${eur(e.gross)} retirés`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Fractionner le retrait sur plusieurs années limite la hausse de tranche. Les versements non déduits ressortent sans impôt ; leurs gains restent taxés. En rente, la part issue des versements déduits suit le régime des pensions (abattement de 10 %). Le déblocage anticipé pour l'achat de la résidence principale est imposé comme une sortie en capital.</p>
        </>
      )}
      {tab === "plan" && (
        <>
          <p className="text-sm text-muted-foreground">Votre épargne annuelle va d'abord sur le PER jusqu'au plafond, le reste sur un placement hors PER (gains au PFU de 31,4 %). Les deux ont le même rendement.</p>
          {plafondFields}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Épargne annuelle" value={budget} onChange={setBudget} suffix="€" step={500} />
            <NumberField label="Durée jusqu'à la retraite" value={years} onChange={setYears} suffix="ans" step={1} />
            <NumberField label="Rendement annuel" value={ret} onChange={setRet} suffix="%" step={0.5} />
            <NumberField label="Revenu imposable à la retraite (hors PER)" value={retIncome} onChange={setRetIncome} suffix="€" step={1_000} />
            <NumberField label="Sortie fractionnée sur" value={spread} onChange={setSpread} suffix="ans" step={1} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="Versement PER / an" value={eur(p.perYearly)} note={`Capital ${eur(p.perBalance)}, impôt de sortie ${eur(p.exit.total)}`} />
            <Result label="Hors PER / an" value={eur(p.outsideYearly)} note={`Capital ${eur(p.outsideBalance)}, PFU ${eur(p.outsideTax)}`} />
            <Result label="Économies d'impôt cumulées" value={eur(p.savings)} note={`${eur(p.saving)} par an à TMI ${pct(p.tmi)}`} />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result label="Total net après impôts" value={eur(p.net)} note={`Effort d'épargne ${eur(budget * years)}`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Le PER est gagnant surtout quand la TMI à la retraite est plus basse que pendant la vie active. L'argent est bloqué jusqu'à la retraite, sauf cas de déblocage anticipé.</p>
        </>
      )}
    </>
  );
}

// ── Spain ────────────────────────────────────────────────────────────────

function Spain({ initialTab }: { initialTab: PensionTab }) {
  const [tab, setTab] = useState<PensionTab>(initialTab);
  const [gross, setGross] = useState(40_000);
  const [ss, setSs] = useState(2_600);
  const [activity, setActivity] = useState(0);
  const [children, setChildren] = useState(0);
  const [individual, setIndividual] = useState(1_500);
  const [employer, setEmployer] = useState(0);
  const [workerEmp, setWorkerEmp] = useState(0);
  const [over60k, setOver60k] = useState<YesNo>("no");
  const [autonomo, setAutonomo] = useState(0);
  const [amount, setAmount] = useState(40_000);
  const [pre2007, setPre2007] = useState(0);
  const [otherBase, setOtherBase] = useState(18_000);
  const [spread, setSpread] = useState(1);
  const [budget, setBudget] = useState(1_500);
  const [years, setYears] = useState(20);
  const [ret, setRet] = useState(3);
  const base = spainPensionSaving({ grossSalary: gross, socialSecurity: ss, employer, activityNet: activity, children, over65: false, reduction: 0 });
  const lim = spainPensionLimit({ individual, employer, workerEmployment: workerEmp, workIncomeOver60k: over60k === "yes", autonomo, netIncome: base.netIncome });
  const s = spainPensionSaving({ grossSalary: gross, socialSecurity: ss, employer, activityNet: activity, children, over65: false, reduction: lim.reduction });
  const r = spainPensionRescue({ amount, pre2007, otherBase, over65: true, spreadYears: spread });
  const planLim = spainPensionLimit({ individual: budget, employer: 0, workerEmployment: 0, workIncomeOver60k: false, autonomo: 0, netIncome: base.netIncome });
  const planSaving = spainPensionSaving({ grossSalary: gross, socialSecurity: ss, employer: 0, activityNet: activity, children, over65: false, reduction: planLim.reduction });
  const p = spainPlan({ annualBudget: budget, deductible: planLim.reduction, annualSaving: planSaving.saving, years, annualReturn: ret / 100, otherBase, over65: true, spreadYears: spread });
  const eur = (n: number) => fmt("es-ES", "EUR", n, 2);
  const incomeFields = (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <NumberField label="Salario bruto anual" value={gross} onChange={setGross} suffix="€" step={500} />
      <NumberField label="Cotizaciones a la Seguridad Social del trabajador" value={ss} onChange={setSs} suffix="€" step={100} />
      <NumberField label="Rendimiento neto de actividades (autónomos)" value={activity} onChange={setActivity} suffix="€" step={500} />
      <NumberField label="Hijos que dan derecho al mínimo por descendientes" value={children} onChange={setChildren} suffix="hijos" step={1} />
    </div>
  );
  const rescueFields = (
    <>
      <NumberField label="Base liquidable general en la jubilación sin el plan (pensión pública, etc.)" value={otherBase} onChange={setOtherBase} suffix="€" step={500} />
      <NumberField label="Rescate repartido en" value={spread} onChange={setSpread} suffix="años" step={1} />
    </>
  );
  return (
    <>
      <Tabs legend="¿Qué quieres calcular?" value={tab} onChange={setTab} labels={["Ahorro en el IRPF", "Rescate", "Plan frente a fondo"]} />
      {tab === "contribution" && (
        <>
          <p className="text-sm text-muted-foreground">Las aportaciones a planes de pensiones reducen la base imponible general del IRPF: ahorras el tipo marginal de cada euro aportado dentro del límite.</p>
          {incomeFields}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Aportación a planes individuales" value={individual} onChange={setIndividual} suffix="€" step={100} />
            <NumberField label="Contribución de la empresa al plan de empleo" value={employer} onChange={setEmployer} suffix="€" step={100} />
            <NumberField label="Tu aportación al plan de empleo de la empresa" value={workerEmp} onChange={setWorkerEmp} suffix="€" step={100} />
            <ChoiceChips legend="Rendimientos del trabajo de esa empresa > 60.000 €" value={over60k} onChange={setOver60k} options={yesNo("Sí", "No")} />
            <NumberField label="Aportación como autónomo a un plan de empleo simplificado o mutualidad" value={autonomo} onChange={setAutonomo} suffix="€" step={100} />
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="Reducción en la base" value={eur(lim.reduction)} note={`Límite ${eur(lim.absolute)}; 30 % de rendimientos ${eur(lim.thirtyPercent)}`} />
            <Result label="Ahorro en el IRPF" value={eur(s.saving)} note={`Cuota ${eur(s.before)} → ${eur(s.after)}`} />
            <Result label="Tipo marginal" value={pct(s.marginal)} note={`Base general ${eur(s.base)}`} />
          </div>
          {lim.excess > 0 && <p className="mt-3 text-sm text-foreground">{eur(lim.excess)} no se reducen este año; puedes pedir aplicarlos en los cinco ejercicios siguientes.</p>}
          <p className="mt-3 text-sm text-muted-foreground">La contribución de la empresa tributa primero como salario en especie y después se reduce, así que tu ahorro real viene de tus propias aportaciones. Tu aportación al plan de empleo cuenta en el incremento hasta {eur(lim.workerCap)} con esta contribución empresarial; el resto entra en el límite de 1.500 €. Escala autonómica supletoria; las aportaciones al plan del cónyuge (hasta 1.000 €) no se incluyen.</p>
        </>
      )}
      {tab === "withdrawal" && (
        <>
          <p className="text-sm text-muted-foreground">Lo que cobras de un plan de pensiones (aportaciones y rentabilidad) tributa como rendimiento del trabajo y se suma a tu base general del año en que lo cobras.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Importe del rescate" value={amount} onChange={setAmount} suffix="€" step={1_000} />
            <NumberField label="Parte procedente de aportaciones anteriores a 2007" value={pre2007} onChange={setPre2007} suffix="€" step={1_000} />
            {rescueFields}
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="IRPF por el rescate" value={eur(r.tax)} note={`Tipo medio ${pct(r.effective, 1)}`} />
            <Result label="Reducción del 40 %" value={eur(r.reduction)} note={spread === 1 ? "Solo en capital y para aportaciones anteriores a 2007" : "No aplica al rescate fraccionado"} />
            <Result label="Neto" value={eur(r.net)} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Repartir el rescate en varios años evita saltar de tramo. La reducción del 40 % solo se puede usar en capital, en un único ejercicio y dentro del plazo transitorio. Puedes rescatar al jubilarte, por incapacidad, dependencia, paro de larga duración, enfermedad grave o, para aportaciones con más de 10 años, a partir de 2025.</p>
        </>
      )}
      {tab === "plan" && (
        <>
          <p className="text-sm text-muted-foreground">Compara aportar cada año a un plan de pensiones individual (con reducción en el IRPF) con invertir lo mismo en un fondo de inversión (ganancia en la base del ahorro al final).</p>
          {incomeFields}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberField label="Ahorro anual" value={budget} onChange={setBudget} suffix="€" step={100} />
            <NumberField label="Años hasta la jubilación" value={years} onChange={setYears} suffix="años" step={1} />
            <NumberField label="Rentabilidad anual" value={ret} onChange={setRet} suffix="%" step={0.5} />
            {rescueFields}
          </div>
          <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Result label="Plan de pensiones / año" value={eur(p.planYearly)} note={`Saldo ${eur(p.planBalance)}, IRPF al rescatar ${eur(p.rescue.tax)}`} />
            <Result label="Fondo de inversión / año" value={eur(p.outsideYearly)} note={`Saldo ${eur(p.outsideBalance)}, IRPF del ahorro ${eur(p.outsideTax)}`} />
            <Result label="Ahorro de IRPF acumulado" value={eur(p.savings)} note={`${eur(planSaving.saving)} al año`} />
          </div>
          <div aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result label="Total neto tras impuestos" value={eur(p.net)} note={`Aportado ${eur(budget * years)}`} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">El plan compensa si tu tipo marginal al aportar es mayor que al rescatar. En el plan tributa todo el rescate (no solo la ganancia) en la base general; en el fondo, solo la ganancia y a los tipos del ahorro (19 %–30 %).</p>
        </>
      )}
    </>
  );
}

export default function PensionCountryCalculator({ country, initialTab }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {country === "jp" && <Japan initialTab={initialTab} />}
      {country === "cn" && <China initialTab={initialTab} />}
      {country === "fr" && <France initialTab={initialTab} />}
      {country === "es" && <Spain initialTab={initialTab} />}
    </div>
  );
}
