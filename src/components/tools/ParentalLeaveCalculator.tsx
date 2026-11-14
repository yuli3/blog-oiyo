import React, { useState, useMemo } from 'react';

export default function ParentalLeaveCalculator() {
  const [monthlyWage, setMonthlyWage] = useState<number>(3500000); // 통상임금 (원)
  const [leaveDurationMonths, setLeaveDurationMonths] = useState<number>(12); // 휴직 개월수 (1~12개월)
  const [isBothParents, setIsBothParents] = useState<boolean>(true); // 6+6 부모육아휴직제 적용 여부

  // 2026년 개정 고용보험법 기준 육아휴직 급여 계산
  // 통상임금의 100% (상한액 단계별 차등)
  // 1~3개월차: 상한 250만 원 (하한 70만 원)
  // 4~6개월차: 상한 200만 원 (하한 70만 원)
  // 7~12개월차: 상한 160만 원 (하한 70만 원)
  // * 6+6 부모육아휴직제 적용 시 (생후 18개월 내 부모 동시/순차 사용):
  // 1개월차 200만, 2개월차 250만, 3개월차 300만, 4개월차 350만, 5개월차 400만, 6개월차 450만 원까지 상한 상향

  const schedule = useMemo(() => {
    const list: { month: number; standardCap: number; actualBenefit: number; bonusCap?: number }[] = [];
    let totalBenefit = 0;

    for (let m = 1; m <= leaveDurationMonths; m++) {
      let cap = 1600000;
      if (m <= 3) cap = 2500000;
      else if (m <= 6) cap = 2000000;

      // 6+6 특별 상한 (첫 6개월)
      let bonusCap = 0;
      if (isBothParents && m <= 6) {
        // 1m: 200, 2m: 250, 3m: 300, 4m: 350, 5m: 400, 6m: 450
        bonusCap = 1500000 + m * 500000;
        cap = Math.max(cap, bonusCap);
      }

      const benefit = Math.max(700000, Math.min(cap, monthlyWage));
      totalBenefit += benefit;

      list.push({
        month: m,
        standardCap: cap,
        actualBenefit: benefit,
        bonusCap: isBothParents && m <= 6 ? bonusCap : undefined
      });
    }

    return {
      months: list,
      totalBenefit,
      averageMonthly: Math.round(totalBenefit / leaveDurationMonths)
    };
  }, [monthlyWage, leaveDurationMonths, isBothParents]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold tracking-tight">2026 개정 육아휴직 급여 원클릭 계산기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              월 최대 250만 원 인상안 및 6+6 부모육아휴직제 특례를 반영한 실제 매월 통장 입금액 시뮬레이터입니다.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block">총 수령 예상 급여 ({leaveDurationMonths}개월)</span>
            <span className="text-2xl font-extrabold text-foreground">
              ₩{schedule.totalBenefit.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground block">
              (월평균 약 ₩{schedule.averageMonthly.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                월 통상임금 (세전 기본급 + 고정수당)
              </label>
              <span className="text-xs font-bold text-foreground">₩{(monthlyWage).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000000}
              max={7000000}
              step={100000}
              value={monthlyWage}
              onChange={(e) => setMonthlyWage(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                육아휴직 사용 기간
              </label>
              <span className="text-xs font-bold text-foreground">{leaveDurationMonths}개월</span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={leaveDurationMonths}
              onChange={(e) => setLeaveDurationMonths(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2 sm:col-span-2 p-3 bg-muted/40 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-foreground block">6+6 부모함께 육아휴직제 적용</span>
              <span className="text-xs text-muted-foreground">
                생후 18개월 이내 자녀에 대해 부모가 순차/동시 육아휴직을 사용하는 경우 첫 6개월 상한액 상향 (최대 월 450만 원)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBothParents(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                  isBothParents
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                적용 (부모 동시/순차)
              </button>
              <button
                type="button"
                onClick={() => setIsBothParents(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                  !isBothParents
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                단독 휴직
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Payout Schedule Table */}
        <div className="border border-border rounded-lg overflow-hidden mt-6">
          <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">월별 고용보험 지급 일정표 (사후지급금 폐지 전액 실시간 지급)</span>
            <span className="text-xs text-muted-foreground">단위: 원</span>
          </div>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border sticky top-0">
                <tr>
                  <th className="p-3">회차</th>
                  <th className="p-3">적용 상한액</th>
                  <th className="p-3">특례 구분</th>
                  <th className="p-3 text-right">월 실지급액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedule.months.map(item => (
                  <tr key={item.month} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{item.month}개월차</td>
                    <td className="p-3 text-muted-foreground font-mono">
                      월 최대 {item.standardCap.toLocaleString()}원
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {item.bonusCap ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-success/10 text-success">
                          6+6 특례 ({item.month}개월차 상한)
                        </span>
                      ) : item.month <= 3 ? (
                        <span className="text-foreground">초기 1~3개월 집중지원 (상한 250만)</span>
                      ) : item.month <= 6 ? (
                        <span className="text-foreground">4~6개월차 (상한 200만)</span>
                      ) : (
                        <span>7개월 이후 기본구간 (상한 160만)</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      ₩{item.actualBenefit.toLocaleString()}
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
