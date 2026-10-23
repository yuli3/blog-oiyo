import { useState } from 'react';
import { compareForeignExchange } from '../../lib/foreign-exchange-comparison';

// WHY 2026-10-24: locale changes labels, never the selected billing currency or quoted rate.
export const EXCHANGE_COPY = {
  ko: ['해외 결제 비용 비교', '예시·사용자 입력 가정', '결제 통화', '청구 통화', '외화 금액', '입력 환율', '환율 단위', '국제 네트워크 비용 (%)', '발급사 비용 (%)', '발급사 비용 기준', '환산 기준액', '기준액 + 네트워크 비용', 'DCC 비교 방식', '비용 포함 제시 최종금액', '가정한 DCC 가산율 (%)', '환산 기준액', '네트워크 비용', '발급사 비용', '현지 통화 결제 가정 합계', 'DCC 비교금액', '차이 (DCC − 현지 결제)', '값을 모두 올바르게 입력해 주세요. 환율은 0보다 커야 해요.', '실제 청구액과 추가 비용은 카드 약관과 견적을 확인해요. 이 화면은 자동 환율 조회나 실청구 보장이 아니에요. 통화 선택은 금액을 자동 환전하지 않아요. 각 항목은 통화 최소단위로 표시 반올림되어 합계와 작은 차이가 날 수 있어요.'],
  en: ['Foreign payment cost comparison', 'Example / entered assumptions', 'Payment currency', 'Billing currency', 'Foreign amount', 'Entered exchange rate', 'Rate unit', 'Network fee (%)', 'Issuer fee (%)', 'Issuer fee basis', 'Converted base', 'Base + network fee', 'DCC comparison mode', 'Offered final amount, fees included', 'Assumed DCC markup (%)', 'Converted base', 'Network fee', 'Issuer fee', 'Local-currency payment assumption', 'DCC comparison amount', 'Difference (DCC − local)', 'Enter valid values in every field. The exchange rate must be positive.', 'Check card terms and the quote for actual charges and extra fees. This is not a live rate or billing guarantee. Choosing currencies does not convert existing inputs. Values are rounded for display to currency minor units; displayed components may differ slightly from the total.'],
  ja: ['海外決済コスト比較', '例・入力した仮定', '決済通貨', '請求通貨', '外貨金額', '入力為替レート', 'レート単位', 'ネットワーク手数料 (%)', '発行会社手数料 (%)', '発行会社手数料の基準', '換算基準額', '基準額 + ネットワーク手数料', 'DCC比較方式', '手数料込みの提示最終額', '仮定したDCC上乗せ率 (%)', '換算基準額', 'ネットワーク手数料', '発行会社手数料', '現地通貨決済の仮定合計', 'DCC比較金額', '差額 (DCC − 現地通貨)', '各欄に有効な値を入力してください。為替レートは正数です。', '実際の請求額と追加料金はカード規約と見積もりをご確認ください。自動レート取得や請求保証ではありません。通貨選択で入力額は自動換算されません。表示は通貨の最小単位で四捨五入するため、内訳の和と合計に小さな差が出る場合があります。'],
  zh: ['境外支付费用比较', '示例／输入假设', '支付币种', '账单币种', '外币金额', '输入汇率', '汇率单位', '卡组织费用 (%)', '发卡行费用 (%)', '发卡行计费基数', '换算基数', '基数 + 卡组织费用', 'DCC比较方式', '含费用的最终报价', '假设DCC加价率 (%)', '换算基数', '卡组织费用', '发卡行费用', '当地币种支付假设合计', 'DCC比较金额', '差额（DCC − 当地支付）', '请在所有输入框填写有效数值，汇率必须大于零。', '实际入账和额外费用请核对卡片条款及报价。本工具不自动获取汇率，也不保证实际账单金额。选择币种不会自动换算输入值。显示按货币最小单位取整，因此分项之和可能与总额略有差异。'],
  fr: ['Comparaison du coût des paiements étrangers', 'Exemple / hypothèses saisies', 'Devise du paiement', 'Devise de facturation', 'Montant en devise étrangère', 'Taux saisi', 'Unité du taux', 'Frais de réseau (%)', 'Frais émetteur (%)', 'Base des frais émetteur', 'Base convertie', 'Base + frais de réseau', 'Mode de comparaison DCC', 'Montant final proposé, frais inclus', 'Majoration DCC supposée (%)', 'Base convertie', 'Frais de réseau', 'Frais émetteur', 'Total supposé en devise locale', 'Montant de comparaison DCC', 'Écart (DCC − paiement local)', 'Saisissez des valeurs valides partout. Le taux doit être positif.', 'Vérifiez les conditions de votre carte et le devis pour le débit réel et les frais supplémentaires. Aucun taux en direct ni débit garanti. Changer de devise ne convertit pas les saisies. Les montants sont arrondis à l’unité monétaire minimale pour affichage ; les postes peuvent différer légèrement du total.'],
  es: ['Comparación del coste de pagos extranjeros', 'Ejemplo / supuestos introducidos', 'Moneda de pago', 'Moneda de facturación', 'Importe extranjero', 'Tipo de cambio introducido', 'Unidad del cambio', 'Comisión de red (%)', 'Comisión del emisor (%)', 'Base de comisión del emisor', 'Base convertida', 'Base + comisión de red', 'Modo de comparación DCC', 'Importe final ofrecido, gastos incluidos', 'Recargo DCC supuesto (%)', 'Base convertida', 'Comisión de red', 'Comisión del emisor', 'Total supuesto en moneda local', 'Importe comparativo DCC', 'Diferencia (DCC − pago local)', 'Introduce valores válidos en todos los campos. El cambio debe ser positivo.', 'Consulta las condiciones de tu tarjeta y la oferta para el cargo real y costes adicionales. No hay cambio en directo ni garantía del cargo. Cambiar de moneda no convierte los datos introducidos. Los valores se redondean a la unidad monetaria mínima al mostrarse; las partidas pueden diferir ligeramente del total.'],
} as const;

export default function ForeignExchangeFeeCalculator({ locale = 'ko' }: { locale: string }) {
  const t = EXCHANGE_COPY[locale as keyof typeof EXCHANGE_COPY] ?? EXCHANGE_COPY.en;
  const currencies = ['USD', 'KRW', 'JPY', 'EUR', 'GBP', 'CNY'];
  const [payment, setPayment] = useState('USD');
  const [billing, setBilling] = useState('KRW');
  const [amount, setAmount] = useState('100');
  const [rate, setRate] = useState('1400');
  const [unit, setUnit] = useState('1');
  const [network, setNetwork] = useState('0');
  const [issuer, setIssuer] = useState('0');
  const [basis, setBasis] = useState<'base' | 'base_plus_network'>('base');
  const [mode, setMode] = useState<'offered_final' | 'assumed_markup'>('offered_final');
  const [offered, setOffered] = useState('147000');
  const [markup, setMarkup] = useState('5');
  const parse = (text: string) => text.trim() === '' ? NaN : Number(text);
  let result: ReturnType<typeof compareForeignExchange> | null = null;
  try {
    result = compareForeignExchange({ foreignAmount: parse(amount), enteredRate: parse(rate), rateUnit: Number(unit), networkPercent: parse(network), issuerPercent: parse(issuer), issuerBasis: basis, mode, offeredFinalAmount: parse(offered), assumedDccMarkupPercent: parse(markup) });
  } catch { /* WHY 2026-10-24: incomplete edits show an error instead of stale or invented zero amounts. */ }
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: billing }).format(value);
  const numeric = (label: string, value: string, change: (value: string) => void, suffix = '') => (
    <label className="grid gap-1 text-sm">{label} {suffix}
      <input type="number" min="0" step="any" value={value} onChange={(e) => change(e.target.value)} className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2" />
    </label>
  );
  return <section className="space-y-4 rounded-lg border border-border bg-card p-4" aria-label={t[0]}>
    <h2 className="text-xl font-bold">{t[0]}</h2><p>{t[1]}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1">{t[2]}<select value={payment} onChange={(e) => setPayment(e.target.value)}>{currencies.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="grid gap-1">{t[3]}<select value={billing} onChange={(e) => setBilling(e.target.value)}>{currencies.map((c) => <option key={c}>{c}</option>)}</select></label>
      {numeric(t[4], amount, setAmount, payment)}{numeric(t[5], rate, setRate, `${billing} / ${unit} ${payment}`)}
      <label className="grid gap-1">{t[6]}<select value={unit} onChange={(e) => setUnit(e.target.value)}><option>1</option><option>100</option></select></label>
      {numeric(t[7], network, setNetwork)}{numeric(t[8], issuer, setIssuer)}
      <label className="grid gap-1">{t[9]}<select value={basis} onChange={(e) => setBasis(e.target.value === 'base' ? 'base' : 'base_plus_network')}><option value="base">{t[10]}</option><option value="base_plus_network">{t[11]}</option></select></label>
      <label className="grid gap-1">{t[12]}<select value={mode} onChange={(e) => setMode(e.target.value === 'offered_final' ? 'offered_final' : 'assumed_markup')}><option value="offered_final">{t[13]}</option><option value="assumed_markup">{t[14]}</option></select></label>
      {mode === 'offered_final' ? numeric(t[13], offered, setOffered, billing) : numeric(t[14], markup, setMarkup)}
    </div>
    <div aria-live="polite">{result ? <>
      <dl className="grid gap-2 sm:grid-cols-3">{[result.base, result.networkFee, result.issuerFee].map((value, i) => <div key={i}><dt>{t[15 + i]}</dt><dd>{money(value)}</dd></div>)}</dl>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-md border border-border p-3"><dt>{t[18]}</dt><dd>{money(result.localScenario)}</dd></div><div className="rounded-md border border-border p-3"><dt>{t[19]}</dt><dd>{money(result.dccScenario)}</dd></div></dl>
      <p className="mt-3 font-semibold">{t[20]}: {money(result.delta)}</p>
    </> : <p role="alert">{t[21]}</p>}</div>
    <p className="text-sm text-muted-foreground">{t[22]}</p>
  </section>;
}
