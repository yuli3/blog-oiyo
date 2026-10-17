import { useState, useId } from 'react';

type Gender = 'male' | 'female';
type Activity = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
type Locale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es';

interface Props {
  locale?: Locale;
}

const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
  sedentary: 1.2,       // 운동 거의 안 함 (사무직)
  light: 1.375,        // 주 1~3회 가벼운 운동
  moderate: 1.55,      // 주 3~5회 보통 운동
  heavy: 1.725,        // 주 6~7회 격렬한 운동
  athlete: 1.9,        // 매일 2회 이상 고강도 운동/선수
};

const COPY: Record<Locale, {
  gender: string; male: string; female: string;
  age: string; height: string; weight: string;
  activity: string; activities: Record<Activity, string>;
  bmrTitle: string; tdeeTitle: string;
  goalsTitle: string; maintain: string; mildLoss: string; activeLoss: string; bulk: string;
  macrosTitle: string; carbs: string; protein: string; fat: string;
  unitCal: string; unitGram: string;
}> = {
  ko: {
    gender: '성별', male: '남성', female: '여성',
    age: '나이 (만)', height: '신장 (cm)', weight: '체중 (kg)',
    activity: '활동량 수준',
    activities: {
      sedentary: '좌식 생활 (운동 거의 안 함, 주로 앉아서 근무)',
      light: '가벼운 활동 (주 1~3회 가벼운 운동 / 산책)',
      moderate: '보통 활동 (주 3~5회 중강도 웨이트 / 러닝)',
      heavy: '적극적 운동 (주 6~7회 고강도 트레이닝)',
      athlete: '선수급 활동 (하루 2회 운동 또는 육체노동)',
    },
    bmrTitle: '기초대사량 (BMR)',
    tdeeTitle: '일일 총 에너지 소비량 (TDEE)',
    goalsTitle: '목표별 권장 칼로리 섭취량',
    maintain: '체중 유지',
    mildLoss: '완만한 감량 (-300 kcal)',
    activeLoss: '체지방 컷팅 (-500 kcal)',
    bulk: '근비대 벌크업 (+300 kcal)',
    macrosTitle: '권장 매크로 영양소 비율 (탄 : 단 : 지)',
    carbs: '탄수화물', protein: '단백질', fat: '지방',
    unitCal: 'kcal', unitGram: 'g',
  },
  en: {
    gender: 'Gender', male: 'Male', female: 'Female',
    age: 'Age', height: 'Height (cm)', weight: 'Weight (kg)',
    activity: 'Activity Level',
    activities: {
      sedentary: 'Sedentary (Little or no exercise, desk job)',
      light: 'Light Exercise (1-3 days/week)',
      moderate: 'Moderate Exercise (3-5 days/week)',
      heavy: 'Heavy Exercise (6-7 days/week)',
      athlete: 'Athlete / Physical Job (2x per day)',
    },
    bmrTitle: 'Basal Metabolic Rate (BMR)',
    tdeeTitle: 'Total Daily Energy Expenditure (TDEE)',
    goalsTitle: 'Target Calorie Intake by Goal',
    maintain: 'Maintain Weight',
    mildLoss: 'Mild Weight Loss (-300 kcal)',
    activeLoss: 'Fat Loss Cutting (-500 kcal)',
    bulk: 'Lean Muscle Bulk (+300 kcal)',
    macrosTitle: 'Recommended Macro Distribution (Carbs : Protein : Fat)',
    carbs: 'Carbs', protein: 'Protein', fat: 'Fat',
    unitCal: 'kcal', unitGram: 'g',
  },
  ja: {
    gender: '性別', male: '男性', female: '女性',
    age: '年齢', height: '身長 (cm)', weight: '体重 (kg)',
    activity: '活動レベル',
    activities: {
      sedentary: 'ほぼ座り仕事 (運動なし)',
      light: '軽い運動 (週1〜3回)',
      moderate: '適度な運動 (週3〜5回)',
      heavy: '激しい運動 (週6〜7回)',
      athlete: 'アスリート (1日2回)',
    },
    bmrTitle: '基礎代謝量 (BMR)',
    tdeeTitle: '1日の総消費カロリー (TDEE)',
    goalsTitle: '目的別おすすめ摂取カロリー',
    maintain: '現状維持',
    mildLoss: '緩やかな減量 (-300 kcal)',
    activeLoss: '積極的減量 (-500 kcal)',
    bulk: '筋肉増量バルクアップ (+300 kcal)',
    macrosTitle: 'PFCバランスの目安 (炭水化物 : 蛋白質 : 脂質)',
    carbs: '炭水化物', protein: 'タンパク質', fat: '脂質',
    unitCal: 'kcal', unitGram: 'g',
  },
  zh: {
    gender: '性别', male: '男性', female: '女性',
    age: '年龄', height: '身高 (cm)', weight: '体重 (kg)',
    activity: '日常活动量',
    activities: {
      sedentary: '久坐不动 (缺乏运动，久坐办公)',
      light: '轻度活动 (每周运动 1-3 次)',
      moderate: '中度活动 (每周运动 3-5 次)',
      heavy: '高强度运动 (每周 6-7 次)',
      athlete: '专业运动员 (每天高强度训练两次)',
    },
    bmrTitle: '基础代谢率 (BMR)',
    tdeeTitle: '每日总能量消耗 (TDEE)',
    goalsTitle: '不同目标每日推荐热量摄入',
    maintain: '维持现有体重',
    mildLoss: '温和减脂 (-300 kcal)',
    activeLoss: '快速减脂 (-500 kcal)',
    bulk: '增肌增重 (+300 kcal)',
    macrosTitle: '三大营养素推荐配比 (碳水 : 蛋白质 : 脂肪)',
    carbs: '碳水化合物', protein: '蛋白质', fat: '脂肪',
    unitCal: 'kcal', unitGram: '克',
  },
  fr: {
    gender: 'Sexe', male: 'Homme', female: 'Femme',
    age: 'Âge', height: 'Taille (cm)', weight: 'Poids (kg)',
    activity: 'Niveau d’activité',
    activities: {
      sedentary: 'Sédentaire (peu ou pas d’exercice)',
      light: 'Activité légère (1-3 fois/semaine)',
      moderate: 'Activité modérée (3-5 fois/semaine)',
      heavy: 'Très actif (6-7 fois/semaine)',
      athlete: 'Extrêmement actif (2 entraînements/jour)',
    },
    bmrTitle: 'Métabolisme de Base (BMR)',
    tdeeTitle: 'Dépense Énergétique Quotidienne (TDEE)',
    goalsTitle: 'Apport calorique cible selon l’objectif',
    maintain: 'Maintien du poids',
    mildLoss: 'Perte de poids modérée (-300 kcal)',
    activeLoss: 'Sèche musculaire (-500 kcal)',
    bulk: 'Prise de masse (+300 kcal)',
    macrosTitle: 'Répartition des macronutriments',
    carbs: 'Glucides', protein: 'Protéines', fat: 'Lipides',
    unitCal: 'kcal', unitGram: 'g',
  },
  es: {
    gender: 'Género', male: 'Hombre', female: 'Mujer',
    age: 'Edad', height: 'Altura (cm)', weight: 'Peso (kg)',
    activity: 'Nivel de actividad',
    activities: {
      sedentary: 'Sedentario (poco o ningún ejercicio)',
      light: 'Ejercicio ligero (1-3 días/semana)',
      moderate: 'Ejercicio moderado (3-5 días/semana)',
      heavy: 'Ejercicio intenso (6-7 días/semana)',
      athlete: 'Atleta (2 entrenamientos al día)',
    },
    bmrTitle: 'Tasa Metabólica Basal (BMR)',
    tdeeTitle: 'Gasto Energético Total Diario (TDEE)',
    goalsTitle: 'Ingesta calórica sugerida según objetivo',
    maintain: 'Mantener peso',
    mildLoss: 'Pérdida moderada (-300 kcal)',
    activeLoss: 'Definición (-500 kcal)',
    bulk: 'Volumen muscular (+300 kcal)',
    macrosTitle: 'Distribución de macronutrientes recomendada',
    carbs: 'Carbohidratos', protein: 'Proteínas', fat: 'Grasas',
    unitCal: 'kcal', unitGram: 'g',
  },
};

export default function TdeeCalculator({ locale = 'ko' }: Props) {
  const t = COPY[locale] ?? COPY.ko;
  const ageId = useId();
  const heightId = useId();
  const weightId = useId();
  const activityId = useId();

  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(30);
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [activity, setActivity] = useState<Activity>('moderate');

  // Mifflin-St Jeor Formula
  // Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
  // Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
  const bmr = Math.round(
    10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161)
  );

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);

  const goals = [
    { label: t.maintain, cals: tdee, color: 'text-foreground' },
    { label: t.mildLoss, cals: Math.max(1200, tdee - 300), color: 'text-primary' },
    { label: t.activeLoss, cals: Math.max(1200, tdee - 500), color: 'text-warning' },
    { label: t.bulk, cals: tdee + 300, color: 'text-info' },
  ];

  // Standard 4:3:3 macro split for active loss or maintenance
  const targetCal = tdee;
  const carbGrams = Math.round((targetCal * 0.45) / 4);
  const proteinGrams = Math.round((targetCal * 0.3) / 4);
  const fatGrams = Math.round((targetCal * 0.25) / 9);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Gender toggle */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-2">{t.gender}</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition border ${
              gender === 'male'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
            }`}
          >
            {t.male}
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition border ${
              gender === 'female'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
            }`}
          >
            {t.female}
          </button>
        </div>
      </div>

      {/* Numerical inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={ageId} className="text-xs font-bold text-foreground block mb-1.5">{t.age}</label>
          <input
            id={ageId}
            type="number"
            value={age}
            onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
        <div>
          <label htmlFor={heightId} className="text-xs font-bold text-foreground block mb-1.5">{t.height}</label>
          <input
            id={heightId}
            type="number"
            value={height}
            onChange={(e) => setHeight(Math.max(50, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
        <div>
          <label htmlFor={weightId} className="text-xs font-bold text-foreground block mb-1.5">{t.weight}</label>
          <input
            id={weightId}
            type="number"
            value={weight}
            onChange={(e) => setWeight(Math.max(20, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
      </div>

      {/* Activity selector */}
      <div>
        <label htmlFor={activityId} className="text-xs font-bold text-foreground block mb-1.5">{t.activity}</label>
        <select
          id={activityId}
          value={activity}
          onChange={(e) => setActivity(e.target.value as Activity)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground"
        >
          {Object.entries(t.activities).map(([key, desc]) => (
            <option key={key} value={key}>
              {desc} (×{ACTIVITY_MULTIPLIERS[key as Activity]})
            </option>
          ))}
        </select>
      </div>

      {/* Big Results Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase">{t.bmrTitle}</span>
          <div className="text-3xl font-black text-foreground font-mono mt-1">
            {bmr.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t.unitCal}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">생명 유지에 필요한 최소 열량</p>
        </div>
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase">{t.tdeeTitle}</span>
          <div className="text-3xl font-black text-primary font-mono mt-1">
            {tdee.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t.unitCal}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">현재 체중을 유지하는 하루 총 소비량</p>
        </div>
      </div>

      {/* Target Goals Grid */}
      <div>
        <h3 className="text-xs font-bold text-foreground mb-3">{t.goalsTitle}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <span className="text-xs font-medium text-foreground">{g.label}</span>
              <span className={`text-base font-bold font-mono ${g.color}`}>
                {g.cals.toLocaleString()} {t.unitCal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Macronutrient breakdown */}
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        <h4 className="text-xs font-bold text-foreground mb-2">{t.macrosTitle}</h4>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-card p-2 border border-border">
            <span className="text-muted-foreground block">{t.carbs} (45%)</span>
            <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{carbGrams}{t.unitGram}</span>
          </div>
          <div className="rounded-lg bg-card p-2 border border-border">
            <span className="text-muted-foreground block">{t.protein} (30%)</span>
            <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{proteinGrams}{t.unitGram}</span>
          </div>
          <div className="rounded-lg bg-card p-2 border border-border">
            <span className="text-muted-foreground block">{t.fat} (25%)</span>
            <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{fatGrams}{t.unitGram}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
