import React, { useState, useMemo } from 'react';
import { Globe, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  locale: string;
}

const CURRENCY_PRESETS: Record<string, { symbol: string; rate: number; unit: number }> = {
  USD: { symbol: '$', rate: 1385, unit: 1 },
  JPY: { symbol: '¥', rate: 925, unit: 100 },
  EUR: { symbol: '€', rate: 1510, unit: 1 },
  GBP: { symbol: '£', rate: 1795, unit: 1 },
  CNY: { symbol: '¥', rate: 192, unit: 1 },
};

const BRANDS: Record<string, { name: string; rate: number }> = {
  visa: { name: 'VISA (비자)', rate: 1.1 },
  master: { name: 'Mastercard (마스터)', rate: 1.0 },
  amex: { name: 'American Express (아멕스)', rate: 1.4 },
  jcb: { name: 'JCB (면제 0%)', rate: 0.0 },
  unionpay: { name: 'UnionPay (유니온페이)', rate: 0.8 },
};

const UI_TEXT: Record<string, {
  title: string;
  subtitle: string;
  currency: string;
  amount: string;
  exchangeRate: string;
  cardBrand: string;
  issuerFee: string;
  dccMode: string;
  localPay: string;
  krwDccPay: string;
  dccWarning: string;
  baseAmount: string;
  brandFeeAmount: string;
  issuerFeeAmount: string;
  totalFees: string;
  finalBilledAmount: string;
  tipTitle: string;
  tipBody: string;
}> = {
  ko: {
    title: "해외 결제 카드 수수료 & 실청구액 계산기",
    subtitle: "브랜드 수수료(비자·마스터)와 국내 카드사 수수료, 환율 스프레드 및 DCC 차단 실결제액 산출",
    currency: "결제 통화",
    amount: "현지 결제 금액",
    exchangeRate: "전신환 매도 환율",
    cardBrand: "국제 브랜드 카드사",
    issuerFee: "국내 카드사 이용 수수료",
    dccMode: "결제 방식 (DCC 여부)",
    localPay: "현지 통화 결제 (권장)",
    krwDccPay: "원화(KRW) 결제 (DCC 5% 가산)",
    dccWarning: "주의: 해외에서 원화로 결제(DCC)하면 이중 환전 수수료 3~8%가 추가되어 큰 손해를 입습니다. 반드시 현지 통화로 결제하세요!",
    baseAmount: "순수 물품 대금 (환산 원화)",
    brandFeeAmount: "국제 브랜드 수수료",
    issuerFeeAmount: "국내 카드사 수수료",
    totalFees: "총 수수료 합계",
    finalBilledAmount: "최종 카드 명세서 청구 예상액",
    tipTitle: "해외 직구 & 여행 카드 꿀팁",
    tipBody: "신용카드 앱에서 '해외원화결제 차단 서비스'를 켜두면 DCC 이중 수수료를 사전에 100% 원천 차단할 수 있습니다.",
  },
  en: {
    title: "Foreign Transaction Fee & Currency Exchange Calculator",
    subtitle: "Calculate exact credit card billing with network fees (Visa/Mastercard), bank fees, and DCC comparison",
    currency: "Payment Currency",
    amount: "Foreign Amount",
    exchangeRate: "Exchange Rate",
    cardBrand: "Card Network",
    issuerFee: "Bank / Issuer Fee",
    dccMode: "Payment Method",
    localPay: "Local Currency (Recommended)",
    krwDccPay: "Dynamic Currency Conversion (DCC +5%)",
    dccWarning: "Warning: Opting for home currency DCC incurs a 3-8% double-conversion markup. Always pay in local currency!",
    baseAmount: "Converted Base Amount",
    brandFeeAmount: "Network Brand Fee",
    issuerFeeAmount: "Card Issuer Fee",
    totalFees: "Total Fees Added",
    finalBilledAmount: "Estimated Final Billed Amount",
    tipTitle: "Travel & Cross-Border Shopping Tip",
    tipBody: "Always select the local currency of the merchant or destination country to avoid redundant conversion markups.",
  },
  ja: {
    title: "海外決済手数料・為替換算シミュレーター",
    subtitle: "国際ブランド手数料（Visa/Mastercard）と発行カード会社手数料、DCC二重為替の比較計算",
    currency: "決済通貨",
    amount: "現地決済金額",
    exchangeRate: "適用為替レート",
    cardBrand: "国際ブランド",
    issuerFee: "カード会社海外事務手数料",
    dccMode: "決済方式 (DCC)",
    localPay: "現地通貨決済（推奨）",
    krwDccPay: "円建て決済 (DCC +5%加算)",
    dccWarning: "注意: 海外で日本円決済(DCC)を選択すると、3〜8%の不当な二重為替手数料が上乗せされます。必ず現地通貨を選びましょう！",
    baseAmount: "純粋商品代金 (円換算)",
    brandFeeAmount: "国際ブランド手数料",
    issuerFeeAmount: "発行会社事務手数料",
    totalFees: "手数料合計",
    finalBilledAmount: "最終請求予定額",
    tipTitle: "海外決済の知恵",
    tipBody: "海外ショッピングや通販では、必ず現地通貨で決済することで不要なマージンを回避できます。",
  },
  zh: {
    title: "境外刷卡手续费与最终入账金额计算器",
    subtitle: "包含卡组织手续费(Visa/Mastercard)、发卡行跨境费率及DCC动态货币转换对比",
    currency: "结算币种",
    amount: "境外消费金额",
    exchangeRate: "参考汇率",
    cardBrand: "国际卡组织",
    issuerFee: "发卡行跨境交易费率",
    dccMode: "支付通道选择",
    localPay: "当地货币结算 (推荐)",
    krwDccPay: "本币DCC结算 (附加5%汇损)",
    dccWarning: "警告：如果在境外选择本币(DCC)结算，将被强制收取3%~8%的二次货币转换汇损！请务必选择消费当地货币！",
    baseAmount: "商品换算基础本金",
    brandFeeAmount: "卡组织手续费",
    issuerFeeAmount: "发卡行手续费",
    totalFees: "综合手续费总额",
    finalBilledAmount: "最终预计账单入账金额",
    tipTitle: "海淘与出境刷卡贴士",
    tipBody: "在网银中关闭境外外币转本币功能，或刷卡时要求POS机选择当地币种，可省下数倍额外手续费。",
  },
  fr: {
    title: "Calculateur de Frais Bancaires et Paiements Internationaux",
    subtitle: "Frais de réseau Visa/Mastercard, commission bancaire et comparaison DCC",
    currency: "Devise du paiement",
    amount: "Montant étranger",
    exchangeRate: "Taux de change",
    cardBrand: "Réseau de carte",
    issuerFee: "Frais de banque émettrice",
    dccMode: "Mode de paiement",
    localPay: "Devise locale (Recommandé)",
    krwDccPay: "Conversion dynamique (DCC +5%)",
    dccWarning: "Attention : Choisir votre devise d'origine (DCC) entraîne 3 à 8 % de surcoût de change. Payez toujours en devise locale !",
    baseAmount: "Montant brut converti",
    brandFeeAmount: "Frais de réseau",
    issuerFeeAmount: "Commission bancaire",
    totalFees: "Total des frais",
    finalBilledAmount: "Montant final débité estimé",
    tipTitle: "Conseil voyage et achat en ligne",
    tipBody: "Refusez systématiquement la conversion dans votre devise lors du paiement par terminal à l'étranger.",
  },
  es: {
    title: "Calculadora de Comisiones por Pago en el Extranjero",
    subtitle: "Comisión de marca Visa/Mastercard, recargo bancario y comparativa de cambio DCC",
    currency: "Moneda de pago",
    amount: "Importe en divisa",
    exchangeRate: "Tipo de cambio",
    cardBrand: "Red de tarjeta",
    issuerFee: "Comisión bancaria",
    dccMode: "Método de cargo",
    localPay: "Moneda local (Recomendado)",
    krwDccPay: "Conversión de divisa (DCC +5%)",
    dccWarning: "Aviso: Aceptar el pago en tu moneda de origen (DCC) suma entre un 3% y un 8% en comisiones dobles. ¡Paga siempre en moneda local!",
    baseAmount: "Importe base convertido",
    brandFeeAmount: "Comisión de red",
    issuerFeeAmount: "Comisión del banco emisor",
    totalFees: "Comisiones totales",
    finalBilledAmount: "Cargo final estimado en cuenta",
    tipTitle: "Consejo para viajes y compras online",
    tipBody: "Solicita siempre abonar la compra en la moneda original del comercio para no pagar márgenes abusivos.",
  },
};

export default function ForeignExchangeFeeCalculator({ locale = 'ko' }: Props) {
  const t = UI_TEXT[locale] ?? UI_TEXT.ko;

  const [curr, setCurr] = useState<string>('USD');
  const [foreignAmount, setForeignAmount] = useState<number>(100);
  const [rate, setRate] = useState<number>(CURRENCY_PRESETS.USD.rate);
  const [brandKey, setBrandKey] = useState<string>('visa');
  const [issuerRate, setIssuerRate] = useState<number>(0.2); // 0.2%
  const [isDcc, setIsDcc] = useState<boolean>(false);

  const handleCurrencyChange = (c: string) => {
    setCurr(c);
    const preset = CURRENCY_PRESETS[c];
    if (preset) {
      setRate(preset.rate);
    }
  };

  const calculation = useMemo(() => {
    const preset = CURRENCY_PRESETS[curr] ?? CURRENCY_PRESETS.USD;
    // Base amount in KRW
    const baseKrw = (foreignAmount / preset.unit) * rate;

    // Brand fee (e.g. Visa 1.1% on USD)
    const brandRate = BRANDS[brandKey]?.rate ?? 1.1;
    const brandFeeKrw = baseKrw * (brandRate / 100);

    // Issuer fee (e.g. 0.2% on total or base)
    const issuerFeeKrw = (baseKrw + brandFeeKrw) * (issuerRate / 100);

    // DCC penalty (5% average markup if DCC enabled)
    const dccPenaltyKrw = isDcc ? baseKrw * 0.05 : 0;

    const totalFeesKrw = brandFeeKrw + issuerFeeKrw + dccPenaltyKrw;
    const finalTotalKrw = baseKrw + totalFeesKrw;

    return {
      baseKrw: Math.round(baseKrw),
      brandFeeKrw: Math.round(brandFeeKrw),
      issuerFeeKrw: Math.round(issuerFeeKrw),
      dccPenaltyKrw: Math.round(dccPenaltyKrw),
      totalFeesKrw: Math.round(totalFeesKrw),
      finalTotalKrw: Math.round(finalTotalKrw),
      feePercent: baseKrw > 0 ? ((totalFeesKrw / baseKrw) * 100).toFixed(2) : '0',
    };
  }, [curr, foreignAmount, rate, brandKey, issuerRate, isDcc]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Globe className="w-3.5 h-3.5" />
          <span>Cross-Border Payment Simulator</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          {/* Currency & Amount */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t.currency} & {t.amount}
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2.5">
              {Object.keys(CURRENCY_PRESETS).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurrencyChange(c)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    curr === c
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted text-foreground border-transparent hover:border-border'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                step="5"
                value={foreignAmount}
                onChange={(e) => setForeignAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background pl-8 pr-4 py-2.5 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                {CURRENCY_PRESETS[curr]?.symbol}
              </span>
            </div>
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t.exchangeRate} ({curr === 'JPY' ? '100엔당' : `1${curr}당`} KRW)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-4 top-2.5 text-xs text-muted-foreground">원</span>
            </div>
          </div>

          {/* Card Network Brand */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t.cardBrand}
            </label>
            <select
              value={brandKey}
              onChange={(e) => setBrandKey(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(BRANDS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name} (+{item.rate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Issuer Fee */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t.issuerFee}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setIssuerRate(0.0)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  issuerRate === 0.0
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-transparent'
                }`}
              >
                0.0% (무료)
              </button>
              <button
                type="button"
                onClick={() => setIssuerRate(0.18)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  issuerRate === 0.18
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-transparent'
                }`}
              >
                0.18% (우대)
              </button>
              <button
                type="button"
                onClick={() => setIssuerRate(0.20)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  issuerRate === 0.20
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-transparent'
                }`}
              >
                0.20% (표준)
              </button>
              <button
                type="button"
                onClick={() => setIssuerRate(0.25)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  issuerRate === 0.25
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-transparent'
                }`}
              >
                0.25%
              </button>
            </div>
          </div>

          {/* DCC Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t.dccMode}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDcc(false)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  !isDcc
                    ? 'bg-success/10 border-success text-success'
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t.localPay}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDcc(true)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  isDcc
                    ? 'bg-destructive/10 border-destructive text-destructive'
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{t.krwDccPay}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center justify-between">
              <span>카드 청구 예상액 명세서</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                총 수수료 +{calculation.feePercent}%
              </span>
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{t.baseAmount}</span>
                <span className="font-bold text-foreground">{calculation.baseKrw.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{t.brandFeeAmount} ({BRANDS[brandKey]?.name})</span>
                <span className="font-bold text-foreground">+{calculation.brandFeeKrw.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{t.issuerFeeAmount} ({issuerRate}%)</span>
                <span className="font-bold text-foreground">+{calculation.issuerFeeKrw.toLocaleString()}원</span>
              </div>
              {isDcc && (
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm text-destructive">
                  <span className="font-semibold">원화결제(DCC) 이중환전 수수료 (5%)</span>
                  <span className="font-bold">+{calculation.dccPenaltyKrw.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                <span className="text-muted-foreground">{t.totalFees}</span>
                <span className="font-bold text-warning">+{calculation.totalFeesKrw.toLocaleString()}원</span>
              </div>
            </div>

            {isDcc && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{t.dccWarning}</p>
              </div>
            )}
          </div>

          {/* Total Final Charge Box */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 text-center mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t.finalBilledAmount}</p>
            <p className="text-3xl font-black text-primary tracking-tight">
              {calculation.finalTotalKrw.toLocaleString()}원
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-2">
              순수 원화 대비 <span className="text-warning font-bold">+{calculation.totalFeesKrw.toLocaleString()}원</span> 추가 결제
            </p>
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="p-5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-foreground">{t.tipTitle}</p>
          <p className="text-muted-foreground leading-relaxed">{t.tipBody}</p>
        </div>
      </div>
    </div>
  );
}
