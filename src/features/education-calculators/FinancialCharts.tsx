import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';

interface CVPChartProps {
    sellingPrice: number;
    variableCost: number;
    fixedCost: number;
    maxVolume?: number;
    lang?: 'ko' | 'en';
}

const CVP_CHART_COPY = {
    ko: { title: 'CVP 분석 시각화: 매출과 총원가의 교차', q: '판매량(Q)', amount: '금액(원)', money: (v: number) => v.toLocaleString('ko-KR') + '원', qty: (q: unknown) => `판매량: ${q}개`, revenue: '총매출액', total: '총원가', fixed: '고정비', note: '* 파란색 선(매출)과 주황색 선(원가)이 만나는 지점이 손익분기점(BEP)입니다.' },
    en: { title: 'CVP chart: where revenue meets total cost', q: 'Units sold (Q)', amount: 'Amount (KRW)', money: (v: number) => '₩' + v.toLocaleString('en-US'), qty: (q: unknown) => `Units: ${q}`, revenue: 'Revenue', total: 'Total cost', fixed: 'Fixed cost', note: '* The break-even point (BEP) is where the blue revenue line crosses the orange cost line.' },
} as const;

export const CVPChart: React.FC<CVPChartProps> = ({ 
    sellingPrice = 1000, 
    variableCost = 600, 
    fixedCost = 400000,
    maxVolume = 1500,
    lang = 'ko'
}) => {
    const c = CVP_CHART_COPY[lang];
    const data = [];
    const step = maxVolume / 10;
    
    for (let q = 0; q <= maxVolume; q += step) {
        data.push({
            volume: q,
            revenue: q * sellingPrice,
            totalCost: fixedCost + (q * variableCost),
            fixedCost: fixedCost
        });
    }

    const bep = Math.ceil(fixedCost / (sellingPrice - variableCost));

    return (
        <Card className="p-4 sm:p-6 bg-card border-border mt-5 sm:mt-8">
            <h4 className="text-lg font-bold text-foreground mb-4 text-center">{c.title}</h4>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="volume" 
                            label={{ value: c.q, position: 'insideBottom', offset: -5 }} 
                            stroke="#64748b"
                            fontSize={12}
                        />
                        <YAxis 
                            label={{ value: c.amount, angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => `${value/1000}k`}
                        />
                        <Tooltip 
                            formatter={((value: number) => c.money(value)) as any}
                            labelFormatter={(label) => c.qty(label)}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <ReferenceLine x={bep} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: `BEP: ${bep}`, fill: '#ef4444', fontSize: 12 }} />
                        <Line type="monotone" dataKey="revenue" name={c.revenue} stroke="#3b82f6" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="totalCost" name={c.total} stroke="#f59e0b" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="fixedCost" name={c.fixed} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic text-center">
                {c.note}
            </p>
        </Card>
    );
};
