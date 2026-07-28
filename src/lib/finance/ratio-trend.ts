// Multi-year financial ratio trend calculations for FinancialStatementAnalyzer.
// Pure percentage/ratio math from user-entered sample figures — illustrative
// analysis only, not investment advice.

export interface YearData {
  label: string;
  currentAssets: number;
  currentLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  operatingIncome: number;
  netIncome: number;
  revenue: number;
}

export interface RatioResult {
  name: string;
  nameEn: string;
  unit: string;
  values: number[];
  benchmark: number;
  higherIsBetter: boolean;
}

export function calcRatios(years: YearData[]): RatioResult[] {
  const safe = (n: number, d: number) => (d !== 0 ? (n / d) * 100 : 0);

  return [
    {
      name: '유동비율',
      nameEn: 'Current Ratio',
      unit: '%',
      values: years.map((y) => safe(y.currentAssets, y.currentLiabilities)),
      benchmark: 200,
      higherIsBetter: true,
    },
    {
      name: '부채비율',
      nameEn: 'Debt Ratio',
      unit: '%',
      values: years.map((y) => safe(y.totalLiabilities, y.equity)),
      benchmark: 100,
      higherIsBetter: false,
    },
    {
      name: '자기자본비율',
      nameEn: 'Equity Ratio',
      unit: '%',
      values: years.map((y) => safe(y.equity, y.totalAssets)),
      benchmark: 50,
      higherIsBetter: true,
    },
    {
      name: '총자산이익률(ROA)',
      nameEn: 'ROA',
      unit: '%',
      values: years.map((y) => safe(y.netIncome, y.totalAssets)),
      benchmark: 5,
      higherIsBetter: true,
    },
    {
      name: '자기자본이익률(ROE)',
      nameEn: 'ROE',
      unit: '%',
      values: years.map((y) => safe(y.netIncome, y.equity)),
      benchmark: 10,
      higherIsBetter: true,
    },
    {
      name: '영업이익률',
      nameEn: 'Operating Margin',
      unit: '%',
      values: years.map((y) => safe(y.operatingIncome, y.revenue)),
      benchmark: 10,
      higherIsBetter: true,
    },
    {
      name: '순이익률',
      nameEn: 'Net Margin',
      unit: '%',
      values: years.map((y) => safe(y.netIncome, y.revenue)),
      benchmark: 5,
      higherIsBetter: true,
    },
    {
      name: '총자산회전율',
      nameEn: 'Asset Turnover',
      unit: '회',
      values: years.map((y) => y.totalAssets !== 0 ? y.revenue / y.totalAssets : 0),
      benchmark: 1,
      higherIsBetter: true,
    },
  ];
}
