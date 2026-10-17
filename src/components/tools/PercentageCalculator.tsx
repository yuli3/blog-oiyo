import React, { useState, useMemo } from 'react';
import { Percent, ArrowRight, TrendingUp, TrendingDown, Tag, Calculator } from 'lucide-react';

interface Props {
  locale: string;
}

const UI_TEXT: Record<string, {
  title: string;
  subtitle: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
  card3Title: string;
  card3Desc: string;
  card4Title: string;
  card4Desc: string;
  of: string;
  is: string;
  from: string;
  to: string;
  price: string;
  discount: string;
  result: string;
  finalPrice: string;
  savedAmount: string;
  increased: string;
  decreased: string;
}> = {
  ko: {
    title: "퍼센트 계산기 4종 올인원",
    subtitle: "비율, 전체 대비 비중, 증감율(%), 할인율 적용가를 실시간 동시 계산",
    card1Title: "1. 전체의 N%는 얼마?",
    card1Desc: "총 금액이나 수량에서 특정 비율만큼의 값을 구합니다.",
    card2Title: "2. 특정 값은 전체의 몇 %?",
    card2Desc: "전체 수량 중 특정 수량이 차지하는 비율을 계산합니다.",
    card3Title: "3. 이전 값에서 얼마나 증감?",
    card3Desc: "기준값에서 비교값으로 변할 때의 증감률(%)을 계산합니다.",
    card4Title: "4. N% 할인/인상 후 가격",
    card4Desc: "원가에서 할인율을 적용한 최종 가격과 절약 금액을 구합니다.",
    of: "의",
    is: "는",
    from: "기존값",
    to: "변화값",
    price: "원래 가격",
    discount: "할인율(%)",
    result: "결과값",
    finalPrice: "최종 가격",
    savedAmount: "할인 절약액",
    increased: "증가",
    decreased: "감소",
  },
  en: {
    title: "Percentage Calculator All-in-One",
    subtitle: "Calculate percentage of a value, proportion, growth rate, and discount prices in real-time",
    card1Title: "1. What is N% of X?",
    card1Desc: "Calculate the exact portion given a percentage.",
    card2Title: "2. What % is X of Y?",
    card2Desc: "Find the percentage share of a part relative to the whole.",
    card3Title: "3. Percentage Increase / Decrease",
    card3Desc: "Calculate percentage change from initial to final value.",
    card4Title: "4. Discount Price Calculator",
    card4Desc: "Find the discounted final price and money saved.",
    of: "of",
    is: "is",
    from: "From",
    to: "To",
    price: "Original Price",
    discount: "Discount (%)",
    result: "Result",
    finalPrice: "Final Price",
    savedAmount: "You Save",
    increased: "increase",
    decreased: "decrease",
  },
  ja: {
    title: "パーセント計算機 4機能統合",
    subtitle: "割合、比率、増減率(%)、割引後の価格をリアルタイム計算",
    card1Title: "1. 全体のN%はいくら？",
    card1Desc: "合計から指定割合の数値を算出します。",
    card2Title: "2. ある値は全体の何%？",
    card2Desc: "全体に対する一部分の割合を算出します。",
    card3Title: "3. 増減率(%)の計算",
    card3Desc: "以前の値から変化後の増減割合を算出します。",
    card4Title: "4. 割引後の価格計算",
    card4Desc: "元の価格から割引後の支払額と節約額を算出します。",
    of: "の",
    is: "は",
    from: "変化前",
    to: "変化後",
    price: "元価格",
    discount: "割引率(%)",
    result: "計算結果",
    finalPrice: "割引後価格",
    savedAmount: "お得額",
    increased: "増加",
    decreased: "減少",
  },
  zh: {
    title: "多功能百分比计算器",
    subtitle: "实时计算比例数值、占比百分比、增减幅度(%)及折扣后价格",
    card1Title: "1. 某数值的 N% 是多少？",
    card1Desc: "计算指定基数在特定比例下的数值。",
    card2Title: "2. 某数值占总数的百分之几？",
    card2Desc: "计算部分数值在整体中的比例占比。",
    card3Title: "3. 百分比增减率计算",
    card3Desc: "计算数值从初始值变化到终值时的涨跌幅(%)。",
    card4Title: "4. 折扣优惠价格计算",
    card4Desc: "计算打折后的最终到手价格与节省金额。",
    of: "的",
    is: "为",
    from: "初始值",
    to: "变化后",
    price: "原价",
    discount: "折扣率(%)",
    result: "计算结果",
    finalPrice: "折后价格",
    savedAmount: "立省金额",
    increased: "增长",
    decreased: "下降",
  },
  fr: {
    title: "Calculateur de Pourcentage Tout-en-Un",
    subtitle: "Calculez la part, la proportion, le taux d'évolution et le prix après remise en direct",
    card1Title: "1. Combien vaut N% de X ?",
    card1Desc: "Calcule la valeur correspondant au pourcentage.",
    card2Title: "2. Quel pourcentage représente X par rapport à Y ?",
    card2Desc: "Calcule la part proportionnelle d'une quantité.",
    card3Title: "3. Taux d'augmentation / réduction",
    card3Desc: "Calcule l'évolution relative entre deux valeurs.",
    card4Title: "4. Calculateur de réduction / remise",
    card4Desc: "Calcule le prix remisé et l'économie réalisée.",
    of: "de",
    is: "=",
    from: "Valeur initiale",
    to: "Valeur finale",
    price: "Prix d'origine",
    discount: "Remise (%)",
    result: "Résultat",
    finalPrice: "Prix final",
    savedAmount: "Économie",
    increased: "hausse",
    decreased: "baisse",
  },
  es: {
    title: "Calculadora de Porcentajes Todo en Uno",
    subtitle: "Calcula porciones, proporciones, porcentajes de cambio y precios con descuento",
    card1Title: "1. ¿Cuánto es el N% de X?",
    card1Desc: "Calcula la cantidad exacta según el porcentaje.",
    card2Title: "2. ¿Qué porcentaje es X de Y?",
    card2Desc: "Calcula la proporción de una parte frente al total.",
    card3Title: "3. Porcentaje de aumento o reducción",
    card3Desc: "Calcula la variación porcentual entre dos valores.",
    card4Title: "4. Calculadora de descuentos",
    card4Desc: "Calcula el precio final rebajado y el ahorro obtenido.",
    of: "de",
    is: "=",
    from: "Valor inicial",
    to: "Valor final",
    price: "Precio original",
    discount: "Descuento (%)",
    result: "Resultado",
    finalPrice: "Precio final",
    savedAmount: "Ahorro",
    increased: "aumento",
    decreased: "reducción",
  },
};

export default function PercentageCalculator({ locale = 'ko' }: Props) {
  const t = UI_TEXT[locale] ?? UI_TEXT.ko;

  // 1. Portion
  const [total1, setTotal1] = useState<number>(50000);
  const [pct1, setPct1] = useState<number>(15);

  // 2. Proportion
  const [part2, setPart2] = useState<number>(18);
  const [total2, setTotal2] = useState<number>(120);

  // 3. Change rate
  const [initial3, setInitial3] = useState<number>(40000);
  const [final3, setFinal3] = useState<number>(52000);

  // 4. Discount
  const [price4, setPrice4] = useState<number>(89000);
  const [discount4, setDiscount4] = useState<number>(25);

  // Calculations
  const result1 = useMemo(() => {
    return (total1 * (pct1 / 100)).toLocaleString();
  }, [total1, pct1]);

  const result2 = useMemo(() => {
    if (!total2 || total2 === 0) return '0';
    return ((part2 / total2) * 100).toFixed(2);
  }, [part2, total2]);

  const result3 = useMemo(() => {
    if (!initial3 || initial3 === 0) return { pct: '0', isUp: true };
    const diff = final3 - initial3;
    const rate = (diff / initial3) * 100;
    return {
      pct: Math.abs(rate).toFixed(2),
      isUp: rate >= 0,
      diff: diff.toLocaleString(),
    };
  }, [initial3, final3]);

  const result4 = useMemo(() => {
    const saved = Math.round(price4 * (discount4 / 100));
    const finalPrice = Math.max(0, price4 - saved);
    return {
      saved: saved.toLocaleString(),
      finalPrice: finalPrice.toLocaleString(),
    };
  }, [price4, discount4]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Percent className="w-3.5 h-3.5" />
          <span>Real-time Percentage Engine</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* 2x2 Grid of Calculators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Portion */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t.card1Title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t.card1Desc}</p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={total1}
                onChange={(e) => setTotal1(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{t.of}</span>
            <div className="w-24">
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={pct1}
                  onChange={(e) => setPct1(Number(e.target.value))}
                  className="w-full rounded-xl border border-input bg-background pl-3 pr-7 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-2.5 top-2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t.result}</span>
            <span className="text-lg font-black text-primary">{result1}</span>
          </div>
        </div>

        {/* Card 2: Proportion */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t.card2Title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t.card2Desc}</p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={part2}
                onChange={(e) => setPart2(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">/</span>
            <div className="flex-1">
              <input
                type="number"
                value={total2}
                onChange={(e) => setTotal2(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t.result}</span>
            <span className="text-lg font-black text-primary">{result2} %</span>
          </div>
        </div>

        {/* Card 3: Change Rate */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            {result3.isUp ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <h3 className="text-sm font-bold text-foreground">{t.card3Title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t.card3Desc}</p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={initial3}
                onChange={(e) => setInitial3(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t.from}
              />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <input
                type="number"
                value={final3}
                onChange={(e) => setFinal3(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t.to}
              />
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            result3.isUp ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'
          }`}>
            <span className="text-xs font-medium text-muted-foreground">
              {result3.isUp ? `+${result3.diff}` : `${result3.diff}`}
            </span>
            <span className={`text-lg font-black ${result3.isUp ? 'text-success' : 'text-destructive'}`}>
              {result3.isUp ? `+${result3.pct}% ${t.increased}` : `-${result3.pct}% ${t.decreased}`}
            </span>
          </div>
        </div>

        {/* Card 4: Discount Price */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t.card4Title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t.card4Desc}</p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={price4}
                onChange={(e) => setPrice4(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t.price}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">-</span>
            <div className="w-24">
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={discount4}
                  onChange={(e) => setDiscount4(Number(e.target.value))}
                  className="w-full rounded-xl border border-input bg-background pl-3 pr-7 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t.discount}
                />
                <span className="absolute right-2.5 top-2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t.savedAmount}: <span className="text-success font-bold">-{result4.saved}</span>
            </span>
            <span className="text-lg font-black text-primary">
              {result4.finalPrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
