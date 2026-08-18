import { useMemo, useState } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import RefreshCcw from "lucide-react/dist/esm/icons/refresh-ccw";

type ScenarioId = "purchase" | "habit" | "group";
type StrategyId = "behavior" | "attitude" | "trivialize" | "add-cognition";

type Inputs = {
  importance: number;
  mismatch: number;
  justification: number;
};

const scenarios: Array<{
  id: ScenarioId;
  label: string;
  belief: string;
  behavior: string;
  inputs: Inputs;
}> = [
  {
    id: "purchase",
    label: "고가 구매",
    belief: "불필요한 소비는 줄여야 한다",
    behavior: "충동적으로 비싼 제품을 샀다",
    inputs: { importance: 72, mismatch: 78, justification: 22 },
  },
  {
    id: "habit",
    label: "생활 습관",
    belief: "건강을 위해 규칙적으로 자야 한다",
    behavior: "오늘도 늦게까지 영상을 봤다",
    inputs: { importance: 84, mismatch: 66, justification: 18 },
  },
  {
    id: "group",
    label: "집단 의견",
    belief: "내 판단을 솔직하게 말해야 한다",
    behavior: "회의에서 다수 의견에 맞췄다",
    inputs: { importance: 64, mismatch: 58, justification: 48 },
  },
];

const strategies: Array<{
  id: StrategyId;
  label: string;
  description: string;
  apply: (inputs: Inputs) => Inputs;
}> = [
  {
    id: "behavior",
    label: "행동 바꾸기",
    description: "다음 행동을 신념에 맞춰 불일치를 직접 줄입니다.",
    apply: (inputs) => ({ ...inputs, mismatch: Math.max(0, inputs.mismatch - 46) }),
  },
  {
    id: "attitude",
    label: "태도 바꾸기",
    description: "행동과 맞도록 기존 태도를 수정해 불일치를 줄입니다.",
    apply: (inputs) => ({ ...inputs, mismatch: Math.max(0, inputs.mismatch - 34) }),
  },
  {
    id: "trivialize",
    label: "중요도 낮추기",
    description: "갈등하는 신념이 덜 중요하다고 해석합니다.",
    apply: (inputs) => ({ ...inputs, importance: Math.max(0, inputs.importance - 38) }),
  },
  {
    id: "add-cognition",
    label: "새 이유 더하기",
    description: "행동을 설명하는 다른 이유를 추가합니다. 합리화로 이어질 수도 있습니다.",
    apply: (inputs) => ({
      ...inputs,
      justification: Math.min(100, inputs.justification + 44),
    }),
  },
];

function calculateTension({ importance, mismatch, justification }: Inputs) {
  const justificationReduction = 1 - justification * 0.0075;
  return Math.round((importance * mismatch * justificationReduction) / 100);
}

function getTensionBand(score: number) {
  if (score < 25) return { label: "낮은 긴장", color: "bg-green-600", text: "text-green-800" };
  if (score < 55) return { label: "중간 긴장", color: "bg-amber-500", text: "text-amber-800" };
  return { label: "높은 긴장", color: "bg-rose-600", text: "text-rose-800" };
}

function Slider({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </label>
        <output htmlFor={id} className="min-w-12 text-right font-mono text-sm font-bold text-slate-950">
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-2 w-full cursor-pointer accent-lime-700"
      />
      <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

export default function CognitiveDissonanceLab() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("purchase");
  const [inputs, setInputs] = useState<Inputs>(scenarios[0].inputs);
  const [strategyId, setStrategyId] = useState<StrategyId>("behavior");

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const strategy = strategies.find((item) => item.id === strategyId) ?? strategies[0];
  const tension = useMemo(() => calculateTension(inputs), [inputs]);
  const projectedTension = useMemo(
    () => calculateTension(strategy.apply(inputs)),
    [inputs, strategy],
  );
  const tensionBand = getTensionBand(tension);

  const selectScenario = (nextScenario: (typeof scenarios)[number]) => {
    setScenarioId(nextScenario.id);
    setInputs(nextScenario.inputs);
    setStrategyId("behavior");
  };

  const reset = () => selectScenario(scenario);

  return (
    <section
      aria-labelledby="cognitive-dissonance-lab-title"
      className="not-prose my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950"
    >
      <div className="border-b border-slate-200 bg-lime-50 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-lime-800">
              Psychology concept lab
            </p>
            <h3 id="cognitive-dissonance-lab-title" className="text-xl font-bold tracking-tight sm:text-2xl">
              인지 부조화 개념 살펴보기
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              신념과 행동의 간격, 신념의 중요도, 외적 정당화를 움직여 심리적 긴장의 방향을 살펴보세요.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-700"
          >
            <RefreshCcw aria-hidden="true" size={16} />
            초기화
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-6 border-b border-slate-200 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-900">1. 상황 선택</legend>
            <div className="grid grid-cols-3 gap-2">
              {scenarios.map((item) => {
                const selected = item.id === scenarioId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectScenario(item)}
                    className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-700 ${
                      selected
                        ? "border-lime-700 bg-lime-50 text-lime-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">신념</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{scenario.belief}</p>
            </div>
            <ArrowRight aria-hidden="true" className="hidden self-center text-slate-400 sm:block" size={20} />
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">행동</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{scenario.behavior}</p>
            </div>
          </div>

          <div className="space-y-5">
            <Slider
              id="dissonance-importance"
              label="신념의 중요도"
              hint="이 신념이 나에게 중요할수록 갈등의 부담이 커질 수 있습니다."
              value={inputs.importance}
              onChange={(importance) => setInputs((current) => ({ ...current, importance }))}
            />
            <Slider
              id="dissonance-mismatch"
              label="신념과 행동의 불일치"
              hint="두 요소가 서로 어긋난다고 느끼는 정도입니다."
              value={inputs.mismatch}
              onChange={(mismatch) => setInputs((current) => ({ ...current, mismatch }))}
            />
            <Slider
              id="dissonance-justification"
              label="외적 정당화"
              hint="보상, 압력, 상황 제약처럼 행동을 설명할 외부 이유가 충분한 정도입니다."
              value={inputs.justification}
              onChange={(justification) => setInputs((current) => ({ ...current, justification }))}
            />
          </div>
        </div>

        <div className="space-y-6 bg-slate-50/70 p-5 sm:p-7">
          <div aria-live="polite">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">교육용 긴장 지표</p>
                <p className={`mt-1 text-lg font-bold ${tensionBand.text}`}>{tensionBand.label}</p>
              </div>
              <p className="font-mono text-4xl font-black tabular-nums text-slate-950">{tension}</p>
            </div>
            <div
              role="meter"
              aria-label="현재 인지 부조화 긴장 지표"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={tension}
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
            >
              <div className={`h-full rounded-full ${tensionBand.color}`} style={{ width: `${tension}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              이 수치는 이론의 방향을 설명하기 위한 단순화 모델이며, 실제 심리 상태를 측정하거나 진단하지 않습니다.
            </p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-900">2. 해소 전략 비교</legend>
            <div className="grid grid-cols-2 gap-2">
              {strategies.map((item) => {
                const selected = item.id === strategyId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStrategyId(item.id)}
                    className={`min-h-12 rounded-lg border px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-700 ${
                      selected
                        ? "border-lime-700 bg-lime-50 text-lime-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-950">{strategy.label}를 택하면</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-semibold text-slate-600">예상 지표 변화</span>
              <span className="font-mono text-lg font-black text-slate-950">
                {tension} <span aria-hidden="true">→</span> {projectedTension}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
