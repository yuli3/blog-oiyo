import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up'
import Landmark from 'lucide-react/dist/esm/icons/landmark';

/**
 * CAPM (Capital Asset Pricing Model) Calculator
 * Ke = Rf + Beta * (Rm - Rf)
 */
export const CAPMCalculator: React.FC = () => {
    const [rf, setRf] = useState<number>(3.5);
    const [beta, setBeta] = useState<number>(1.2);
    const [rm, setRm] = useState<number>(10);

    const ke = rf + beta * (rm - rf);

    return (
        <Card className="p-6 bg-slate-900 border-slate-800 text-white shadow-xl mt-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <TrendingUp className="text-blue-400" />
                <h3 className="text-xl font-bold font-heading">CAPM (자본자산가격모형) 계산기</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FieldGroup>
                    <Field><FieldLabel htmlFor="capm-rf">무위험수익률 (Rf)</FieldLabel><InputGroup><InputGroupInput id="capm-rf" type="number" value={rf} onChange={e => setRf(Number(e.target.value))}/><InputGroupAddon>%</InputGroupAddon></InputGroup></Field>
                    <Field><FieldLabel htmlFor="capm-beta">베타 (Beta, β)</FieldLabel><InputGroup><InputGroupInput id="capm-beta" type="number" value={beta} onChange={e => setBeta(Number(e.target.value))}/></InputGroup></Field>
                    <Field><FieldLabel htmlFor="capm-rm">시장기대수익률 (Rm)</FieldLabel><InputGroup><InputGroupInput id="capm-rm" type="number" value={rm} onChange={e => setRm(Number(e.target.value))}/><InputGroupAddon>%</InputGroupAddon></InputGroup></Field>
                </FieldGroup>

                <div className="flex flex-col justify-center items-center bg-blue-500/5 rounded-2xl border border-blue-500/20 p-6">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">자기자본비용 (Ke)</span>
                    <div className="text-5xl font-black text-white font-mono">
                        {ke.toFixed(2)}%
                    </div>
                    <div className="mt-4 text-[10px] text-slate-500 text-center">
                        Ke = {rf}% + {beta} × ({rm}% - {rf}%)
                    </div>
                </div>
            </div>
        </Card>
    );
};

/**
 * WACC (Weighted Average Cost of Capital) Calculator
 */
export const WACCCalculator: React.FC = () => {
    const [equity, setEquity] = useState<number>(600);
    const [debt, setDebt] = useState<number>(400);
    const [ke, setKe] = useState<number>(12);
    const [kd, setKd] = useState<number>(5);
    const [tax, setTax] = useState<number>(20);

    const total = equity + debt;
    const wacc = (equity / total) * ke + (debt / total) * kd * (1 - tax / 100);

    return (
        <Card className="p-6 bg-slate-900 border-slate-800 text-white shadow-xl mt-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <Landmark className="text-emerald-400" />
                <h3 className="text-xl font-bold font-heading">WACC (가중평균자본비용) 계산기</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FieldGroup className="gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <Field><FieldLabel htmlFor="wacc-equity">자기자본 (E)</FieldLabel><InputGroup><InputGroupInput id="wacc-equity" type="number" value={equity} onChange={e => setEquity(Number(e.target.value))}/></InputGroup></Field>
                        <Field><FieldLabel htmlFor="wacc-debt">타인자본 (D)</FieldLabel><InputGroup><InputGroupInput id="wacc-debt" type="number" value={debt} onChange={e => setDebt(Number(e.target.value))}/></InputGroup></Field>
                    </div>
                    <Field><FieldLabel htmlFor="wacc-ke">자기자본비용 (Ke)</FieldLabel><InputGroup><InputGroupInput id="wacc-ke" type="number" value={ke} onChange={e => setKe(Number(e.target.value))}/><InputGroupAddon>%</InputGroupAddon></InputGroup></Field>
                    <Field><FieldLabel htmlFor="wacc-kd">세전 부채비용 (Kd)</FieldLabel><InputGroup><InputGroupInput id="wacc-kd" type="number" value={kd} onChange={e => setKd(Number(e.target.value))}/><InputGroupAddon>%</InputGroupAddon></InputGroup></Field>
                    <Field><FieldLabel htmlFor="wacc-tax">법인세율 (Tax)</FieldLabel><InputGroup><InputGroupInput id="wacc-tax" type="number" value={tax} onChange={e => setTax(Number(e.target.value))}/><InputGroupAddon>%</InputGroupAddon></InputGroup></Field>
                </FieldGroup>

                <div className="flex flex-col justify-center items-center bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-6">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">가중평균자본비용 (WACC)</span>
                    <div className="text-5xl font-black text-white font-mono">
                        {wacc.toFixed(2)}%
                    </div>
                    <div className="mt-4 text-[10px] text-slate-500 text-center leading-relaxed">
                        부채비율: {(debt/total*100).toFixed(1)}% | 자기자본비율: {(equity/total*100).toFixed(1)}%
                    </div>
                </div>
            </div>
        </Card>
    );
};
