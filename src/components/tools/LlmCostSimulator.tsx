import React, { useState, useMemo } from 'react';

interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputPerMillion: number; // USD
  outputPerMillion: number; // USD
  cacheReadPerMillion?: number; // USD
}

const MODELS: ModelPricing[] = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', inputPerMillion: 0.075, outputPerMillion: 0.30, cacheReadPerMillion: 0.01875 },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', inputPerMillion: 1.25, outputPerMillion: 5.00, cacheReadPerMillion: 0.3125 },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPerMillion: 3.00, outputPerMillion: 15.00, cacheReadPerMillion: 0.30 },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', inputPerMillion: 0.80, outputPerMillion: 4.00, cacheReadPerMillion: 0.08 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', inputPerMillion: 2.50, outputPerMillion: 10.00, cacheReadPerMillion: 1.25 },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', inputPerMillion: 0.15, outputPerMillion: 0.60, cacheReadPerMillion: 0.075 },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', inputPerMillion: 0.14, outputPerMillion: 0.28, cacheReadPerMillion: 0.014 },
];

const EXCHANGE_RATE = 1380; // USD to KRW

export default function LlmCostSimulator() {
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet');
  const [dailyRequests, setDailyRequests] = useState<number>(1000);
  const [inputTokens, setInputTokens] = useState<number>(2500); // 프롬프트 토큰
  const [outputTokens, setOutputTokens] = useState<number>(800); // 생성 토큰
  const [agentLoops, setAgentLoops] = useState<number>(3); // 에이전트 툴 루프 횟수
  const [cacheRatio, setCacheRatio] = useState<number>(40); // % 캐시 적중률

  const comparison = useMemo(() => {
    return MODELS.map(model => {
      const loops = Math.max(1, agentLoops);
      const totalInputTokensPerReq = inputTokens * loops;
      const totalOutputTokensPerReq = outputTokens * loops;

      const cachedTokens = (totalInputTokensPerReq * cacheRatio) / 100;
      const uncachedInputTokens = totalInputTokensPerReq - cachedTokens;

      const cacheRate = model.cacheReadPerMillion ?? (model.inputPerMillion * 0.25);

      const singleReqCostUsd =
        (uncachedInputTokens / 1_000_000) * model.inputPerMillion +
        (cachedTokens / 1_000_000) * cacheRate +
        (totalOutputTokensPerReq / 1_000_000) * model.outputPerMillion;

      const dailyCostUsd = singleReqCostUsd * dailyRequests;
      const monthlyCostUsd = dailyCostUsd * 30;
      const monthlyCostKrw = Math.round(monthlyCostUsd * EXCHANGE_RATE);

      return {
        model,
        singleReqCostUsd,
        dailyCostUsd,
        monthlyCostUsd,
        monthlyCostKrw,
        isCurrent: model.id === selectedModelId
      };
    });
  }, [selectedModelId, dailyRequests, inputTokens, outputTokens, agentLoops, cacheRatio]);

  const currentResult = useMemo(() => {
    return comparison.find(c => c.isCurrent) || comparison[0];
  }, [comparison]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI 에이전트 LLM 토큰 & API 비용 계산기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              에이전트 멀티턴 루프와 프롬프트 캐싱을 반영하여 실제 청구될 월간 API 비용을 예측합니다.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">예상 월간 API 비용</span>
            <span className="text-2xl font-extrabold text-foreground">
              ₩{currentResult.monthlyCostKrw.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground block">
              (${currentResult.monthlyCostUsd.toFixed(2)} USD / 월)
            </span>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              기준 모델 선택
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full text-sm bg-muted/40 border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider}) — In ${m.inputPerMillion} / Out ${m.outputPerMillion}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                일일 에이전트 실행 횟수 (Tasks/Day)
              </label>
              <span className="text-xs font-bold text-foreground">{dailyRequests.toLocaleString()}회/일</span>
            </div>
            <input
              type="range"
              min={50}
              max={50000}
              step={50}
              value={dailyRequests}
              onChange={(e) => setDailyRequests(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                요청당 평균 입력 토큰 (Prompt)
              </label>
              <span className="text-xs font-bold text-foreground">{inputTokens.toLocaleString()} 토큰</span>
            </div>
            <input
              type="range"
              min={200}
              max={30000}
              step={200}
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                요청당 평균 생성 토큰 (Completion)
              </label>
              <span className="text-xs font-bold text-foreground">{outputTokens.toLocaleString()} 토큰</span>
            </div>
            <input
              type="range"
              min={100}
              max={4000}
              step={50}
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                에이전트 도구 루프 횟수 (Turn Iterations)
              </label>
              <span className="text-xs font-bold text-foreground">{agentLoops}회 반복</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={agentLoops}
              onChange={(e) => setAgentLoops(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                프롬프트 캐싱 적용률 (Prompt Caching)
              </label>
              <span className="text-xs font-bold text-foreground">{cacheRatio}% 캐시</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={cacheRatio}
              onChange={(e) => setCacheRatio(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Cost Comparison Table */}
        <div className="border border-border rounded-lg overflow-hidden mt-6">
          <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">주요 모델별 예상 월 비용 비교</span>
            <span className="text-xs text-muted-foreground">환율 1,380원 기준</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">모델명</th>
                  <th className="p-3">제공사</th>
                  <th className="p-3">1회 실행 원가</th>
                  <th className="p-3">일일 비용 (USD)</th>
                  <th className="p-3 text-right">월간 예상 청구액 (KRW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.map(c => (
                  <tr
                    key={c.model.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      c.isCurrent ? 'bg-primary/5 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 text-foreground flex items-center gap-1.5">
                      {c.isCurrent && <span className="text-primary font-bold">●</span>}
                      {c.model.name}
                    </td>
                    <td className="p-3 text-muted-foreground">{c.model.provider}</td>
                    <td className="p-3 font-mono text-muted-foreground">${c.singleReqCostUsd.toFixed(4)}</td>
                    <td className="p-3 font-mono text-muted-foreground">${c.dailyCostUsd.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      ₩{c.monthlyCostKrw.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
