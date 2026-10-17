import { useState, useId } from 'react';

type Locale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es';

interface Props {
  locale?: Locale;
}

interface Preset {
  name: string;
  w: number;
  h: number;
  inches: number;
}

const PRESETS: Preset[] = [
  { name: '24" FHD (1080p)', w: 1920, h: 1080, inches: 24 },
  { name: '27" QHD (1440p)', w: 2560, h: 1440, inches: 27 },
  { name: '27" 4K UHD', w: 3840, h: 2160, inches: 27 },
  { name: '32" 4K UHD', w: 3840, h: 2160, inches: 32 },
  { name: '27" 5K (Studio Display)', w: 5120, h: 2880, inches: 27 },
  { name: '34" UWQHD (21:9)', w: 3440, h: 1440, inches: 34 },
];

const COPY: Record<Locale, {
  preset: string; custom: string;
  width: string; height: string; diagonal: string;
  ppiTitle: string; pitchTitle: string; retinaDistTitle: string; scalingTitle: string;
  retinaDesc: string; scalingHint: string;
  sharpness: string;
  sharpnessLevels: {
    low: string;
    good: string;
    high: string;
    retina: string;
  };
}> = {
  ko: {
    preset: '대표 모니터 규격 프리셋', custom: '직접 입력',
    width: '가로 해상도 (px)', height: '세로 해상도 (px)', diagonal: '화면 대각선 크기 (인치)',
    ppiTitle: '인치당 픽셀수 (PPI)', pitchTitle: '픽셀 피치 (도트 간격)',
    retinaDistTitle: '레티나 최소 시청 거리', scalingTitle: '권장 OS 배율 (HiDPI)',
    retinaDesc: '이 거리 이상 떨어져서 보면 사람 눈으로 픽셀을 구분할 수 없어 완벽히 매끄럽게 보입니다.',
    scalingHint: '맥OS(macOS)와 윈도우(Windows)에서 텍스트 가독성이 가장 선명한 설정입니다.',
    sharpness: '선명도 등급',
    sharpnessLevels: {
      low: '일반 사무용 (도트가 다소 보임)',
      good: '표준 고화질 (가독성 쾌적)',
      high: '고선명 HiDPI (매우 선명함)',
      retina: '초고해상도 레티나급 (최상)',
    },
  },
  en: {
    preset: 'Display Presets', custom: 'Custom',
    width: 'Horizontal (px)', height: 'Vertical (px)', diagonal: 'Screen Size (inches)',
    ppiTitle: 'Pixels Per Inch (PPI)', pitchTitle: 'Pixel Pitch (Dot Pitch)',
    retinaDistTitle: 'Retina Viewing Distance', scalingTitle: 'Recommended Scaling',
    retinaDesc: 'Beyond this viewing distance, pixels become indistinguishable to the human 20/20 eye.',
    scalingHint: 'Optimal display scaling setting for crisp text in macOS and Windows.',
    sharpness: 'Sharpness Rating',
    sharpnessLevels: {
      low: 'Basic Office (Visible pixels)',
      good: 'Standard Crisp (Comfortable)',
      high: 'High DPI (Very Sharp)',
      retina: 'Retina Ultra-Sharp (Superb)',
    },
  },
  ja: {
    preset: '代表的なモニター規格', custom: '手動入力',
    width: '横解像度 (px)', height: '縦解像度 (px)', diagonal: '画面サイズ (インチ)',
    ppiTitle: '画素密度 (PPI)', pitchTitle: '画素ピッチ (ドット間隔)',
    retinaDistTitle: 'Retina視認限界距離', scalingTitle: '推奨OSスケーリング',
    retinaDesc: 'この距離以上離れて見ると、肉眼ではドットの粒を判別できず極めて滑らかに見えます。',
    scalingHint: 'macOSおよびWindowsで文字が最もくっきり表示される推奨倍率です。',
    sharpness: '鮮明度評価',
    sharpnessLevels: {
      low: '標準事務用 (ドットが見えやすい)',
      good: '高精細 (快適な可読性)',
      high: '高精細HiDPI (非常に鮮明)',
      retina: '超高精細Retina級 (最高峰)',
    },
  },
  zh: {
    preset: '常见显示器预设', custom: '自定义参数',
    width: '水平分辨率 (px)', height: '垂直分辨率 (px)', diagonal: '屏幕尺寸 (英寸)',
    ppiTitle: '像素密度 (PPI)', pitchTitle: '点距 (Pixel Pitch)',
    retinaDistTitle: '视网膜极限视距', scalingTitle: '推荐系统缩放',
    retinaDesc: '超出此视距观看时，正常视力的人眼将无法分辨单个像素点，画面呈现完全平滑。',
    scalingHint: '在 macOS 与 Windows 系统中文字边缘最清晰的缩放比例。',
    sharpness: '清晰度等级',
    sharpnessLevels: {
      low: '普通办公 (颗粒感较明显)',
      good: '标准高分 (阅读舒适)',
      high: '超清高分HiDPI (非常细腻)',
      retina: '顶级视网膜级 (极致细腻)',
    },
  },
  fr: {
    preset: 'Préréglages d’écrans', custom: 'Personnalisé',
    width: 'Largeur (px)', height: 'Hauteur (px)', diagonal: 'Taille (pouces)',
    ppiTitle: 'Densité de pixels (PPI)', pitchTitle: 'Pas de masque (Pitch)',
    retinaDistTitle: 'Distance de vision Retina', scalingTitle: 'Mise à l’échelle conseillée',
    retinaDesc: 'Au-delà de cette distance, l’œil humain ne peut plus distinguer les pixels individuels.',
    scalingHint: 'Réglage de mise à l’échelle idéal pour des textes ultra-nets sous macOS et Windows.',
    sharpness: 'Niveau de netteté',
    sharpnessLevels: {
      low: 'Bureautique (pixels perceptibles)',
      good: 'Haute définition (confortable)',
      high: 'Très haute densité HiDPI',
      retina: 'Qualité Retina (exceptionnel)',
    },
  },
  es: {
    preset: 'Preajustes de monitor', custom: 'Personalizado',
    width: 'Resolución horizontal (px)', height: 'Resolución vertical (px)', diagonal: 'Tamaño (pulgadas)',
    ppiTitle: 'Píxeles por pulgada (PPI)', pitchTitle: 'Paso de punto (Pitch)',
    retinaDistTitle: 'Distancia visual Retina', scalingTitle: 'Escalado recomendado',
    retinaDesc: 'A partir de esta distancia, el ojo humano no distingue los píxeles individuales.',
    scalingHint: 'Ajuste de escalado óptimo para texto nítido en macOS y Windows.',
    sharpness: 'Grado de nitidez',
    sharpnessLevels: {
      low: 'Ofimática (píxeles visibles)',
      good: 'Estándar nítido (buena lectura)',
      high: 'Alta densidad HiDPI (muy nítido)',
      retina: 'Calidad Retina (insuperable)',
    },
  },
};

export default function MonitorPpiCalculator({ locale = 'ko' }: Props) {
  const t = COPY[locale] ?? COPY.ko;
  const widthId = useId();
  const heightId = useId();
  const diagonalId = useId();

  const [w, setW] = useState(3840);
  const [h, setH] = useState(2160);
  const [inches, setInches] = useState(27);

  // PPI = sqrt(w^2 + h^2) / inches
  const diagonalPixels = Math.hypot(w, h);
  const ppi = inches > 0 ? diagonalPixels / inches : 0;
  const pixelPitchMm = ppi > 0 ? (25.4 / ppi) : 0;

  // Retina minimum distance: distance = 3438 / PPI (inches) -> cm
  const retinaDistCm = ppi > 0 ? Math.round((3438 / ppi) * 2.54) : 0;

  // Recommended scaling
  let recommendedScaling = '100%';
  if (ppi >= 200) {
    recommendedScaling = '200% (HiDPI 2x Retina)';
  } else if (ppi >= 150) {
    recommendedScaling = '150% ~ 175%';
  } else if (ppi >= 120) {
    recommendedScaling = '125%';
  }

  // Sharpness level
  let sharpnessLevel = t.sharpnessLevels.low;
  let sharpnessColor = 'text-muted-foreground';
  if (ppi >= 200) {
    sharpnessLevel = t.sharpnessLevels.retina;
    sharpnessColor = 'text-primary';
  } else if (ppi >= 140) {
    sharpnessLevel = t.sharpnessLevels.high;
    sharpnessColor = 'text-info';
  } else if (ppi >= 105) {
    sharpnessLevel = t.sharpnessLevels.good;
    sharpnessColor = 'text-foreground';
  }

  const applyPreset = (p: Preset) => {
    setW(p.w);
    setH(p.h);
    setInches(p.inches);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Preset Chips */}
      <div>
        <label className="text-xs font-bold text-foreground block mb-2">{t.preset}</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => {
            const isSelected = w === p.w && h === p.h && inches === p.inches;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={widthId} className="text-xs font-bold text-foreground block mb-1.5">{t.width}</label>
          <input
            id={widthId}
            type="number"
            value={w}
            onChange={(e) => setW(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
        <div>
          <label htmlFor={heightId} className="text-xs font-bold text-foreground block mb-1.5">{t.height}</label>
          <input
            id={heightId}
            type="number"
            value={h}
            onChange={(e) => setH(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
        <div>
          <label htmlFor={diagonalId} className="text-xs font-bold text-foreground block mb-1.5">{t.diagonal}</label>
          <input
            id={diagonalId}
            type="number"
            step="0.1"
            value={inches}
            onChange={(e) => setInches(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground"
          />
        </div>
      </div>

      {/* Results Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <span className="text-xs font-bold text-muted-foreground uppercase">{t.ppiTitle}</span>
        <div className="text-4xl sm:text-5xl font-black text-primary font-mono my-2">
          {ppi.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">PPI</span>
        </div>
        <div className={`text-sm font-bold ${sharpnessColor}`}>
          {t.sharpness}: {sharpnessLevel}
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-background p-4 text-center">
          <span className="text-xs font-bold text-muted-foreground block">{t.pitchTitle}</span>
          <span className="text-lg font-black text-foreground font-mono mt-1 block">
            {pixelPitchMm.toFixed(4)} mm
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">도트와 도트 사이의 물리적 거리</span>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 text-center">
          <span className="text-xs font-bold text-muted-foreground block">{t.retinaDistTitle}</span>
          <span className="text-lg font-black text-foreground font-mono mt-1 block">
            {retinaDistCm} cm <span className="text-xs font-normal text-muted-foreground">({Math.round(retinaDistCm / 2.54)} in)</span>
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">시력 1.0 기준 픽셀 분간 불가 거리</span>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 text-center">
          <span className="text-xs font-bold text-muted-foreground block">{t.scalingTitle}</span>
          <span className="text-lg font-black text-primary font-mono mt-1 block">
            {recommendedScaling}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5 block">텍스트 왜곡 없는 최적 화면 배율</span>
        </div>
      </div>

      {/* Helper Explanation */}
      <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground leading-relaxed">
        <p>💡 <strong>{t.retinaDistTitle}란?</strong> {t.retinaDesc}</p>
        <p className="mt-1">💡 <strong>{t.scalingTitle} 가이드</strong>: {t.scalingHint}</p>
      </div>
    </div>
  );
}
