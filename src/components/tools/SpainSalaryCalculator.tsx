import React, { useState } from 'react';
import { GameContainer } from '@/components/ui/game/GamePrimitives';

interface Props {
    locale?: 'es' | 'en';
}

const labels = {
    es: {
        title: 'Calculadora de salario neto España 2026',
        desc: 'Estima tus cotizaciones a la Seguridad Social e IRPF según el baremo 2026.',
        annualGross: 'Salario bruto anual (€)',
        situation: 'Situación familiar',
        single: 'Soltero/a (sin hijos)',
        married: 'Casado/a (sin hijos)',
        married1child: 'Con 1 hijo/a',
        married2children: 'Con 2 hijos/as',
        married3children: 'Con 3 o más hijos/as',
        monthlyGross: 'Bruto mensual',
        monthlyNet: 'Neto mensual (tras IRPF)',
        annualNet: 'Neto anual',
        cotizaciones: 'Cotizaciones a la SS (mensual)',
        contingencias: 'Contingencias comunes (4,70%)',
        desempleo: 'Desempleo (1,55%)',
        fp: 'Formación profesional (0,10%)',
        mei: 'MEI Pensiones (0,15%)',
        solidaridad: 'Cotización de solidaridad (0,19–0,24%)',
        totalCotizaciones: 'Total SS empleado',
        netBeforeIR: 'Salario neto antes de IRPF (mensual)',
        irAnnual: 'IRPF anual estimado',
        irMonthly: 'IRPF mensual estimado',
        note: '* Estimación 2026: Orden PJC/297/2026 (base máxima 5.101,20 €/mes = 61.214,40 €/año, MEI 0,15% trabajador, cotización de solidaridad sobre el exceso), escala estatal del IRPF más la escala autonómica supletoria (igual a la estatal), gastos deducibles de 2.000 €, reducción por rendimientos del trabajo (hasta 7.302 €) y mínimo personal de 5.550 €. Las escalas autonómicas reales varían por comunidad. El importe real depende de otras deducciones y circunstancias personales.',
    },
    en: {
        title: 'Spain Net Salary Calculator 2026',
        desc: 'Estimate your Social Security contributions and IRPF income tax under Spain\'s 2026 scale.',
        annualGross: 'Annual Gross Salary (€)',
        situation: 'Family situation',
        single: 'Single (no children)',
        married: 'Married (no children)',
        married1child: 'With 1 child',
        married2children: 'With 2 children',
        married3children: 'With 3+ children',
        monthlyGross: 'Monthly Gross',
        monthlyNet: 'Monthly Net (after IRPF)',
        annualNet: 'Annual Net',
        cotizaciones: 'Social Security contributions (monthly)',
        contingencias: 'Common contingencies (4.70%)',
        desempleo: 'Unemployment (1.55%)',
        fp: 'Professional training (0.10%)',
        mei: 'MEI Pensions (0.15%)',
        solidaridad: 'Solidarity contribution (0.19–0.24%)',
        totalCotizaciones: 'Total employee SS',
        netBeforeIR: 'Net salary before IRPF (monthly)',
        irAnnual: 'IRPF annual estimate',
        irMonthly: 'IRPF monthly estimate',
        note: '* 2026 estimate: Order PJC/297/2026 (maximum base €5,101.20/month = €61,214.40/year, MEI 0.15% employee, solidarity contribution on pay above the cap), state IRPF scale plus the default regional scale (same as the state one), €2,000 general work expense deduction, work income reduction (up to €7,302) and €5,550 personal minimum. Actual regional scales vary by autonomous community. Actual amount depends on other deductions and personal circumstances.',
    },
} as const;

// SS 2026 (Orden PJC/297/2026): base máxima 5.101,20 €/mes × 12
const SS_BASE_CAP_ANNUAL = 61_214.4;

// Cotización de solidaridad 2026 (parte trabajador) sobre la retribución que excede la base máxima
const SOLIDARIDAD_TRAMOS: [number, number][] = [
    [SS_BASE_CAP_ANNUAL * 0.1, 0.0019], // hasta +10% de la base máxima
    [SS_BASE_CAP_ANNUAL * 0.4, 0.0021], // entre +10% y +50%
    [Infinity, 0.0024],                 // más del +50%
];

interface SSResult {
    cc: number;
    desempleo: number;
    fp: number;
    mei: number;
    solidaridad: number;
    total: number;
}

function calcSS(annualGross: number): SSResult {
    const base = Math.min(annualGross, SS_BASE_CAP_ANNUAL);
    const cc       = Math.round(base * 0.047);
    const desempleo = Math.round(base * 0.0155);
    const fp       = Math.round(base * 0.001);
    const mei      = Math.round(base * 0.0015);

    let exceso = Math.max(0, annualGross - SS_BASE_CAP_ANNUAL);
    let solidaridadRaw = 0;
    for (const [width, rate] of SOLIDARIDAD_TRAMOS) {
        if (exceso <= 0) break;
        const tramo = Math.min(exceso, width);
        solidaridadRaw += tramo * rate;
        exceso -= tramo;
    }
    const solidaridad = Math.round(solidaridadRaw);

    const total    = cc + desempleo + fp + mei + solidaridad;
    return { cc, desempleo, fp, mei, solidaridad, total };
}

// Mínimo personal (5.550 €, sin cambios en 2026)
const MINIMO_PERSONAL_BASE = 5_550;
// Additional mínimo by family situation
const MINIMO_FAMILIAR: Record<number, number> = {
    0: 0,       // sin hijos
    1: 2_400,   // 1 hijo
    2: 2_400 + 2_700, // 2 hijos (2400+2700)
    3: 2_400 + 2_700 + 4_000, // 3+ hijos (add 4000 for 3rd)
};

function calcIRPF(annualGross: number, ssTotal: number, children: number): number {
    const minimoTotal = MINIMO_PERSONAL_BASE + (MINIMO_FAMILIAR[Math.min(children, 3)] ?? 0);
    // Rendimiento neto del trabajo after SS (art. 19.2 a-e LIRPF)
    const rendimiento = Math.max(0, annualGross - ssTotal);

    // Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF, vigente 2026)
    let reduccionTrabajo = 0;
    if (rendimiento <= 14_852) {
        reduccionTrabajo = 7_302;
    } else if (rendimiento <= 17_673.52) {
        reduccionTrabajo = 7_302 - 1.75 * (rendimiento - 14_852);
    } else if (rendimiento <= 19_747.5) {
        reduccionTrabajo = 2_364.34 - 1.14 * (rendimiento - 17_673.52);
    }

    // Otros gastos deducibles: 2.000 € (art. 19.2.f LIRPF)
    const baseLiquidable = Math.max(0, rendimiento - 2_000 - Math.max(0, reduccionTrabajo));

    // Escala estatal + autonómica supletoria (idéntica) combinada, 2026
    const brackets: [number, number][] = [
        [12_450, 0.19],
        [20_200 - 12_450, 0.24],
        [35_200 - 20_200, 0.30],
        [60_000 - 35_200, 0.37],
        [300_000 - 60_000, 0.45],
    ];

    const applyScale = (amount: number): number => {
        let tax = 0;
        let remaining = amount;
        for (const [limit, rate] of brackets) {
            if (remaining <= 0) break;
            const taxable = Math.min(remaining, limit);
            tax += taxable * rate;
            remaining -= taxable;
        }
        if (remaining > 0) tax += remaining * 0.47;
        return tax;
    };

    // El mínimo personal y familiar tributa al tipo 0: se resta la cuota de la escala aplicada al mínimo
    const tax = applyScale(baseLiquidable) - applyScale(Math.min(minimoTotal, baseLiquidable));

    return Math.round(Math.max(0, tax));
}

type FamilySituation = { label: keyof typeof labels['es']; children: number };

const FAMILY_OPTIONS: FamilySituation[] = [
    { label: 'single',           children: 0 },
    { label: 'married',          children: 0 },
    { label: 'married1child',    children: 1 },
    { label: 'married2children', children: 2 },
    { label: 'married3children', children: 3 },
];

const SpainSalaryCalculator: React.FC<Props> = ({ locale = 'es' }) => {
    const t = labels[locale === 'es' ? 'es' : 'en'];

    const [annualGross, setAnnualGross] = useState(30_000);
    const [familyIdx, setFamilyIdx] = useState(0);

    const situation = FAMILY_OPTIONS[familyIdx];
    const monthlyGross = Math.round(annualGross / 12);
    const ss = calcSS(annualGross);

    const netBeforeIRAnnual = Math.max(0, annualGross - ss.total);
    const netBeforeIRMonthly = Math.round(netBeforeIRAnnual / 12);

    const irAnnual = calcIRPF(annualGross, ss.total, situation.children);
    const irMonthly = Math.round(irAnnual / 12);

    const annualNet = Math.max(0, netBeforeIRAnnual - irAnnual);
    const monthlyNet = Math.round(annualNet / 12);

    const fmtEuro = (n: number) => `${n.toLocaleString('es-ES')} €`;

    const handleReset = () => {
        setAnnualGross(30_000);
        setFamilyIdx(0);
    };

    const monthlySSRows = [
        { label: t.contingencias, value: Math.round(ss.cc / 12) },
        { label: t.desempleo,     value: Math.round(ss.desempleo / 12) },
        { label: t.fp,            value: Math.round(ss.fp / 12) },
        { label: t.mei,           value: Math.round(ss.mei / 12) },
        ...(ss.solidaridad > 0
            ? [{ label: t.solidaridad, value: Math.round(ss.solidaridad / 12) }]
            : []),
    ];

    return (
        <GameContainer title={t.title} subtitle="Simulador salario neto — España 2026" onReset={handleReset}>
            <div className="flex flex-col gap-5 sm:gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center">{t.desc}</p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.annualGross}</label>
                        <input
                            type="number"
                            value={annualGross}
                            onChange={(e) => setAnnualGross(Math.max(0, Number(e.target.value)))}
                            step={1_000}
                            min={0}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
                            aria-label={t.annualGross}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-foreground">{t.situation}</label>
                        <select
                            value={familyIdx}
                            onChange={(e) => setFamilyIdx(Number(e.target.value))}
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
                            aria-label={t.situation}
                        >
                            {FAMILY_OPTIONS.map((opt, i) => (
                                <option key={i} value={i}>
                                    {t[opt.label] as string}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-destructive uppercase tracking-wide">{t.monthlyGross}</span>
                        <span className="text-2xl font-bold text-destructive">{fmtEuro(monthlyGross)}</span>
                    </div>
                    <div className="rounded-2xl bg-destructive p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-destructive uppercase tracking-wide">{t.monthlyNet}</span>
                        <span className="text-2xl font-bold text-white">{fmtEuro(monthlyNet)}</span>
                    </div>
                    <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-destructive uppercase tracking-wide">{t.annualNet}</span>
                        <span className="text-2xl font-bold text-destructive">{fmtEuro(annualNet)}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-foreground">{t.cotizaciones}</h4>
                    <div className="flex flex-col gap-2">
                        {monthlySSRows.map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">{label}</span>
                                <span className="font-bold text-foreground">{fmtEuro(value)}</span>
                            </div>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">{t.totalCotizaciones}</span>
                            <span className="text-sm font-bold text-destructive">{fmtEuro(Math.round(ss.total / 12))}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">{t.netBeforeIR}</span>
                        <span className="font-bold text-foreground">{fmtEuro(netBeforeIRMonthly)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">{t.irAnnual}</span>
                        <span className="font-bold text-destructive">{fmtEuro(irAnnual)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-1">
                        <span className="font-bold text-foreground">{t.irMonthly}</span>
                        <span className="font-bold text-destructive">{fmtEuro(irMonthly)}</span>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t.note}</p>
            </div>
        </GameContainer>
    );
};

export default SpainSalaryCalculator;
