import { useMemo, useState } from "react";

type SupportedLocale = "ko" | "en" | "ja";

const COPY = {
  ko: {
    title: "장 정원 살펴보기",
    intro: "최근 일주일의 식사와 생활을 움직여 장내 환경에 어떤 방향의 신호를 주는지 살펴보세요. 의료 검사나 진단은 아닙니다.",
    plants: "일주일 동안 먹은 식물성 식재료 수",
    fermented: "발효 식품",
    processed: "초가공식품·단 음료",
    stress: "스트레스",
    rarely: "거의 없음",
    sometimes: "가끔",
    often: "자주",
    low: "낮음",
    medium: "보통",
    high: "높음",
    diversity: "다양성 신호",
    barrier: "장벽 부담 신호",
    steadiness: "생활 리듬 신호",
    strong: "좋은 편",
    mixed: "엇갈림",
    weak: "돌봄 필요",
    next: "이번 주에 해볼 일",
    notes: ["식물성 식재료를 한 가지 더 추가해보세요.", "김치·요거트처럼 익숙한 발효 식품을 식사에 곁들여보세요.", "단 음료나 초가공 간식 한 번을 덜어보세요.", "수면과 스트레스가 소화 상태와 함께 움직이는지 기록해보세요."],
    notice: "복통, 출혈, 지속적인 설사·변비, 급격한 체중 변화가 있다면 이 결과와 관계없이 의료진에게 상담하세요.",
  },
  en: {
    title: "Explore your gut garden",
    intro: "Adjust your past week's food and routine to see what direction they may signal for the gut environment. This is not a medical test or diagnosis.",
    plants: "Different plant foods this week",
    fermented: "Fermented foods",
    processed: "Ultra-processed food and sugary drinks",
    stress: "Stress",
    rarely: "Rarely",
    sometimes: "Sometimes",
    often: "Often",
    low: "Low",
    medium: "Medium",
    high: "High",
    diversity: "Diversity signal",
    barrier: "Gut burden signal",
    steadiness: "Routine signal",
    strong: "Supportive",
    mixed: "Mixed",
    weak: "Needs care",
    next: "One thing to try this week",
    notes: ["Add one more type of plant food.", "Pair a meal with a familiar fermented food such as yogurt or kimchi.", "Replace one sugary drink or ultra-processed snack.", "Track whether sleep and stress move with digestive symptoms."],
    notice: "Seek medical advice for pain, bleeding, persistent diarrhea or constipation, or rapid weight change regardless of this result.",
  },
  ja: {
    title: "腸の庭を見てみる",
    intro: "直近1週間の食事と生活を動かし、腸内環境にどの方向のサインを与えるか確認します。医療検査や診断ではありません。",
    plants: "1週間に食べた植物性食材の種類",
    fermented: "発酵食品",
    processed: "超加工食品・甘い飲み物",
    stress: "ストレス",
    rarely: "ほぼなし",
    sometimes: "時々",
    often: "頻繁",
    low: "低い",
    medium: "普通",
    high: "高い",
    diversity: "多様性のサイン",
    barrier: "腸への負担サイン",
    steadiness: "生活リズムのサイン",
    strong: "良い傾向",
    mixed: "混在",
    weak: "ケアが必要",
    next: "今週試すこと",
    notes: ["植物性食材をもう1種類加えてみましょう。", "ヨーグルトやキムチなど身近な発酵食品を添えましょう。", "甘い飲み物や超加工のおやつを1回減らしましょう。", "睡眠・ストレスと消化状態を一緒に記録しましょう。"],
    notice: "腹痛、出血、長引く下痢・便秘、急な体重変化がある場合は、この結果にかかわらず医療機関に相談してください。",
  },
};

export const GutGardenSimulator = ({ locale = "ko" }: { locale?: string }) => {
  const language: SupportedLocale = locale === "en" || locale === "ja" ? locale : "ko";
  const t = COPY[language];
  const [plants, setPlants] = useState(12);
  const [fermented, setFermented] = useState(1);
  const [processed, setProcessed] = useState(1);
  const [stress, setStress] = useState(1);

  const result = useMemo(() => {
    const diversity = Math.min(2, Math.floor(plants / 10) + (fermented === 2 ? 1 : 0));
    const burden = Math.max(0, 2 - processed - (stress === 2 ? 1 : 0));
    const rhythm = Math.max(0, 2 - stress + (processed === 0 ? 1 : 0));
    const lowest = Math.min(diversity, burden, rhythm);
    const recommendation = diversity === lowest ? 0 : fermented === 0 ? 1 : processed >= stress ? 2 : 3;
    return { scores: [diversity, burden, rhythm], recommendation };
  }, [plants, fermented, processed, stress]);

  const options = [t.rarely, t.sometimes, t.often];
  const levels = [t.weak, t.mixed, t.strong];
  const Select = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => <label className="block text-sm font-semibold text-foreground">{label}<select className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" value={value} onChange={(event) => onChange(Number(event.target.value))}>{options.map((option, index) => <option key={option} value={index}>{option}</option>)}</select></label>;

  return <section className="my-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <h3 className="text-xl font-bold text-foreground">{t.title}</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.intro}</p>
    <div className="mt-6 space-y-5">
      <label className="block text-sm font-semibold text-foreground">{t.plants}: <strong>{plants}</strong><input className="mt-3 block w-full" type="range" min="0" max="40" step="1" value={plants} onChange={(event) => setPlants(Number(event.target.value))} /></label>
      <div className="grid gap-4 sm:grid-cols-3"><Select label={t.fermented} value={fermented} onChange={setFermented} /><Select label={t.processed} value={processed} onChange={setProcessed} /><Select label={t.stress} value={stress} onChange={setStress} /></div>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">{[t.diversity, t.barrier, t.steadiness].map((label, index) => <div key={label} className="rounded-xl border border-border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold text-primary">{levels[result.scores[index]]}</p></div>)}</div>
    <div className="mt-5 rounded-xl bg-muted/50 p-4"><p className="text-sm font-bold text-foreground">{t.next}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{t.notes[result.recommendation]}</p></div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">{t.notice}</p>
  </section>;
};
