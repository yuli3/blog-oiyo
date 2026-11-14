import React, { useState, useMemo } from 'react';

interface LoanProduct {
  name: string;
  category: 'purchase' | 'jeonse';
  eligible: boolean;
  reasons: string[];
  maxLimit: number; // in 10,000 KRW (만원 단위)
  estimatedRate: number; // %
  monthlyPayment: number; // 원
  description: string;
}

export default function HousingLoanSimulator() {
  const [householdType, setHouseholdType] = useState<'single_youth' | 'newlywed' | 'newborn' | 'general'>('newborn');
  const [targetType, setTargetType] = useState<'purchase' | 'jeonse'>('purchase');
  const [annualIncome, setAnnualIncome] = useState<number>(7500); // 만원
  const [netWorth, setNetWorth] = useState<number>(35000); // 만원
  const [housePrice, setHousePrice] = useState<number>(65000); // 만원 (매매가 또는 전세보증금)

  const loanResults = useMemo<LoanProduct[]>(() => {
    const products: LoanProduct[] = [];

    // 1. 신생아 특례 디딤돌/버팀목 (2026 완화 기준: 소득 2.5억원 이하)
    if (householdType === 'newborn') {
      if (targetType === 'purchase') {
        const incomeOk = annualIncome <= 25000;
        const priceOk = housePrice <= 90000; // 9억 이하
        const assetOk = netWorth <= 46900; // 2026 자산기준 ~4.69억
        const eligible = incomeOk && priceOk && assetOk;

        const reasons: string[] = [];
        if (!incomeOk) reasons.push('부부합산 소득 2.5억원 초과');
        if (!priceOk) reasons.push('주택가격 9억원 초과');
        if (!assetOk) reasons.push('순자산 4.69억원 초과');

        const maxLimit = Math.min(50000, Math.floor(housePrice * 0.8)); // 최대 5억, LTV 80%
        const rate = annualIncome <= 8500 ? 2.15 : annualIncome <= 13000 ? 2.75 : 3.3;
        // 월 원리금 균등 (30년 만기 기준 간이 계산)
        const monthlyRate = rate / 100 / 12;
        const months = 360;
        const monthlyPayment = eligible
          ? Math.round((maxLimit * 10000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
          : 0;

        products.push({
          name: '신생아 특례 내집마련 디딤돌대출',
          category: 'purchase',
          eligible,
          reasons: eligible ? ['2년 내 출산 가구 요건 충족', '주택가액 9억원 이하 충족'] : reasons,
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '최대 5억원 한도, 최저 1%대 초저금리 정부 정책 주담대'
        });
      } else {
        // 신생아 특례 버팀목 (전세)
        const incomeOk = annualIncome <= 25000;
        const priceOk = housePrice <= 50000; // 수도권 5억 이하
        const assetOk = netWorth <= 34500;
        const eligible = incomeOk && priceOk && assetOk;

        const maxLimit = Math.min(30000, Math.floor(housePrice * 0.8)); // 최대 3억
        const rate = annualIncome <= 7500 ? 1.8 : 2.5;
        const monthlyPayment = eligible ? Math.round((maxLimit * 10000 * (rate / 100)) / 12) : 0; // 전세는 이자만

        products.push({
          name: '신생아 특례 버팀목 전세자금대출',
          category: 'jeonse',
          eligible,
          reasons: eligible ? ['소득 2.5억원 이하 완화 적용', '보증금 5억원 이하 충족'] : ['소득/보증금 요건 초과'],
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '보증금 최대 80%(최대 3억원), 연 1%대 전세자금 대출'
        });
      }
    }

    // 2. 신혼부부 전용 디딤돌 / 버팀목
    if (householdType === 'newlywed' || householdType === 'newborn') {
      if (targetType === 'purchase') {
        const incomeOk = annualIncome <= 8500;
        const priceOk = housePrice <= 60000;
        const assetOk = netWorth <= 46900;
        const eligible = incomeOk && priceOk && assetOk;

        const maxLimit = Math.min(40000, Math.floor(housePrice * 0.8));
        const rate = 2.7;
        const monthlyRate = rate / 100 / 12;
        const months = 360;
        const monthlyPayment = eligible
          ? Math.round((maxLimit * 10000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
          : 0;

        products.push({
          name: '신혼부부 전용 디딤돌 대출',
          category: 'purchase',
          eligible,
          reasons: eligible ? ['혼인 7년 이내 신혼부부 요건 충족'] : ['부부합산 소득 8,500만원 초과 또는 주택가액 6억원 초과'],
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '신혼가구 대상 주택구입자금 저리 융자'
        });
      } else {
        const incomeOk = annualIncome <= 7500;
        const priceOk = housePrice <= 40000;
        const eligible = incomeOk && priceOk;

        const maxLimit = Math.min(30000, Math.floor(housePrice * 0.8));
        const rate = 2.1;
        const monthlyPayment = eligible ? Math.round((maxLimit * 10000 * (rate / 100)) / 12) : 0;

        products.push({
          name: '신혼부부 전용 버팀목 전세대출',
          category: 'jeonse',
          eligible,
          reasons: eligible ? ['수도권 보증금 4억원 이하 충족'] : ['소득 7,500만원 또는 보증금 한도 초과'],
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '신혼부부 전용 수도권 최대 3억원 임차보증금 대출'
        });
      }
    }

    // 3. 청년 전용 버팀목 / 내집마련 디딤돌 (만 19세~34세 미혼 청년)
    if (householdType === 'single_youth') {
      if (targetType === 'jeonse') {
        const incomeOk = annualIncome <= 5000;
        const priceOk = housePrice <= 30000;
        const eligible = incomeOk && priceOk;

        const maxLimit = Math.min(20000, Math.floor(housePrice * 0.8));
        const rate = 1.8;
        const monthlyPayment = eligible ? Math.round((maxLimit * 10000 * (rate / 100)) / 12) : 0;

        products.push({
          name: '청년전용 버팀목 전세자금대출',
          category: 'jeonse',
          eligible,
          reasons: eligible ? ['만 34세 이하 단독 세대주 요건 충족'] : ['연소득 5,000만원 또는 보증금 3억원 초과'],
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '만 34세 이하 무주택 청년 대상 최대 2억원 최저금리 대출'
        });
      } else {
        // 일반 디딤돌 (청년 단독 세대주 만 30세 이상)
        const incomeOk = annualIncome <= 6000;
        const priceOk = housePrice <= 50000;
        const eligible = incomeOk && priceOk;

        const maxLimit = Math.min(25000, Math.floor(housePrice * 0.7));
        const rate = 3.1;
        const monthlyRate = rate / 100 / 12;
        const months = 360;
        const monthlyPayment = eligible
          ? Math.round((maxLimit * 10000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
          : 0;

        products.push({
          name: '내집마련 디딤돌 대출 (일반/청년)',
          category: 'purchase',
          eligible,
          reasons: eligible ? ['무주택 세대주 주택가격 5억원 이하'] : ['소득 6,000만원 초과'],
          maxLimit,
          estimatedRate: rate,
          monthlyPayment,
          description: '정부 주택도시기금 무주택 서민 주택구입자금 대출'
        });
      }
    }

    return products;
  }, [householdType, targetType, annualIncome, netWorth, housePrice]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="pb-6 border-b border-border">
          <h2 className="text-xl font-bold tracking-tight">2026/2027 정부 주거지원 대출 자격 판별기</h2>
          <p className="text-sm text-muted-foreground mt-1">
            소득·자산·주택가격을 입력하면 신생아특례·신혼부부·청년 버팀목/디딤돌 대출 자격과 예상 월 상환액을 즉시 계산합니다.
          </p>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              가구 유형
            </label>
            <select
              value={householdType}
              onChange={(e) => setHouseholdType(e.target.value as any)}
              className="w-full text-sm bg-muted/40 border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newborn">출산 가구 (2년 내 신생아 출산/입양)</option>
              <option value="newlywed">신혼부부 (혼인 7년 이내 또는 3개월 내 예정)</option>
              <option value="single_youth">청년 단독가구 (만 19세 ~ 34세)</option>
              <option value="general">일반 무주택 가구</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              대출 목적
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('purchase')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                  targetType === 'purchase'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                주택 매매 (구입)
              </button>
              <button
                type="button"
                onClick={() => setTargetType('jeonse')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                  targetType === 'jeonse'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                전세 보증금 (임차)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                부부합산 연소득
              </label>
              <span className="text-xs font-bold text-foreground">{(annualIncome).toLocaleString()}만원</span>
            </div>
            <input
              type="range"
              min={1000}
              max={30000}
              step={500}
              value={annualIncome}
              onChange={(e) => setAnnualIncome(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {targetType === 'purchase' ? '주택 매매가격' : '전세 보증금'}
              </label>
              <span className="text-xs font-bold text-foreground">{(housePrice).toLocaleString()}만원 ({housePrice >= 10000 ? `${(housePrice / 10000).toFixed(1)}억` : ''})</span>
            </div>
            <input
              type="range"
              min={5000}
              max={120000}
              step={1000}
              value={housePrice}
              onChange={(e) => setHousePrice(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                가구 순자산 (부동산 + 금융자산 - 부채)
              </label>
              <span className="text-xs font-bold text-foreground">{(netWorth).toLocaleString()}만원 ({netWorth >= 10000 ? `${(netWorth / 10000).toFixed(1)}억` : ''})</span>
            </div>
            <input
              type="range"
              min={0}
              max={80000}
              step={1000}
              value={netWorth}
              onChange={(e) => setNetWorth(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Results Cards */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground">신청 가능 정부 정책 대출 상품:</h3>
          {loanResults.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/40 text-xs text-muted-foreground text-center">
              선택한 조건에 부합하는 정부 지원 대출 상품이 없습니다. 시중은행 대출을 검토해 보세요.
            </div>
          ) : (
            loanResults.map((loan, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border transition-all ${
                  loan.eligible
                    ? 'bg-card border-border shadow-sm'
                    : 'bg-muted/20 border-border/50 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        loan.eligible
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {loan.eligible ? '✓ 신청 가능' : '✕ 조건 불충족'}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{loan.name}</h4>
                  </div>
                  {loan.eligible && (
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted-foreground block">예상 금리</span>
                      <span className="text-base font-extrabold text-foreground">
                        연 {loan.estimatedRate}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">최대 대출 한도:</span>
                    <span className="font-semibold text-foreground">
                      {loan.eligible ? `${(loan.maxLimit / 10000).toFixed(1)}억원 (${loan.maxLimit.toLocaleString()}만원)` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      {targetType === 'purchase' ? '예상 월 원리금(30년):' : '예상 월 이자:'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {loan.eligible ? `약 ${loan.monthlyPayment.toLocaleString()}원/월` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">판정 사유:</span>
                    <span className="text-muted-foreground">
                      {loan.reasons.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
