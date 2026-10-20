export type PpiLocale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es';
export interface PpiCopy {
  title: string;
  description: string;
  eyebrow: string;
  presets: string;
  width: string;
  height: string;
  diagonal: string;
  ppi: string;
  pitch: string;
  size: string;
  angle: string;
  invalid: string;
  overflow: string;
  assumptions: string;
  angleNote: string;
  mathTitle: string;
  math: string;
  example: string;
  scalingTitle: string;
  scaling: string;
  sources: string;
  nist: string;
  apple: string;
  note: string;
  loading: string;
}

export const monitorPpiCopy: Record<PpiLocale, PpiCopy> = {
  "en": {
    "title": "Monitor PPI, pixel pitch and screen size calculator",
    "description": "Calculate pixel density, pixel pitch, active screen dimensions and a one-arcminute geometric distance. No sharpness rating or automatic OS scaling advice.",
    "eyebrow": "Display geometry",
    "presets": "Display presets",
    "width": "Horizontal pixels",
    "height": "Vertical pixels",
    "diagonal": "Active diagonal (inches)",
    "ppi": "Pixels per inch (PPI)",
    "pitch": "Pixel pitch",
    "size": "Active width × height",
    "angle": "One-arcminute geometric distance",
    "invalid": "Enter positive whole-number pixel dimensions and a positive, finite diagonal in inches. Empty values are not replaced automatically.",
    "overflow": "These values cannot produce a finite, positive result at the supported numeric precision. Please check the dimensions.",
    "assumptions": "Assumes a flat rectangular active area and square pixels. Use native panel pixels, not the OS logical workspace. Bezel dimensions, curved panels and rounded manufacturer sizes may differ.",
    "angleNote": "A chosen geometry: a single pixel viewed face-on at the centre subtends one arcminute. This is not a recommended viewing distance, eye-health assessment, pixel-visibility guarantee or Retina certification.",
    "mathTitle": "How the numbers are calculated",
    "math": "PPI = hypot(horizontal pixels, vertical pixels) ÷ diagonal inches. Pixel pitch (mm) = 25.4 ÷ PPI. Active dimensions follow the same pixel aspect ratio. One arcminute is π/10800 radians; distance = pitch ÷ [2 tan(angle/2)]. Convert millimetres to centimetres before displaying distance.",
    "example": "Worked example: 300 × 400 pixels over a 5-inch diagonal gives 100 PPI, 0.254 mm pitch and an active area 7.62 × 10.16 cm. Its one-arcminute distance is about 87.32 cm; this does not assess anyone's vision.",
    "scalingTitle": "PPI does not choose an OS scaling setting",
    "scaling": "Scaling changes logical workspace and interface size. Available settings and rendering depend on the operating system and display. Choose a readable size in system settings; PPI alone does not establish an optimal percentage or text quality.",
    "sources": "Sources and assumptions",
    "nist": "NIST: exact inch and metric length conversion",
    "apple": "Apple: changing display resolution and text size",
    "note": "Higher PPI means smaller pixels at a given physical scale. Perceived clarity also depends on distance, rendering, contrast and panel structure; this tool does not score those factors.",
    "loading": "Editing becomes available when the calculator loads. JavaScript is required for changes."
  },
  "ko": {
    "title": "모니터 PPI·픽셀 간격·화면 크기 계산기",
    "description": "픽셀 밀도, 픽셀 간격, 실제 표시 영역과 1분각 기하거리를 계산해요. 선명도 등급이나 OS 최적 배율을 보장하지 않아요.",
    "eyebrow": "화면 규격의 기하 계산",
    "presets": "대표 화면 규격",
    "width": "가로 픽셀 수",
    "height": "세로 픽셀 수",
    "diagonal": "표시 영역 대각선 (인치)",
    "ppi": "인치당 픽셀 수 (PPI)",
    "pitch": "픽셀 간격",
    "size": "표시 영역 가로 × 세로",
    "angle": "1분각 기하거리",
    "invalid": "픽셀 수는 양의 정수, 대각선은 양의 유한한 인치 값으로 입력해 주세요. 빈 입력을 다른 수로 자동 보정하지 않아요.",
    "overflow": "이 값은 지원하는 숫자 정밀도에서 유한한 양의 결과로 계산할 수 없어요. 규격을 확인해 주세요.",
    "assumptions": "평평한 직사각형 표시 영역과 정사각 픽셀을 가정해요. OS 작업 공간이 아닌 패널의 기본 픽셀 수를 입력해 주세요. 테두리 포함 치수·곡면·제조사 반올림 규격과는 다를 수 있어요.",
    "angleNote": "화면 중앙의 픽셀 하나를 정면에서 보아 1분각을 이루는 기하 계산이에요. 권장 시청 거리·눈 건강·픽셀 식별 가능 여부·Retina 인증을 판정하지 않아요.",
    "mathTitle": "계산 방법과 전제",
    "math": "PPI = hypot(가로 픽셀 수, 세로 픽셀 수) ÷ 대각선 인치. 픽셀 간격(mm) = 25.4 ÷ PPI. 표시 영역 길이는 같은 픽셀 비율로 구해요. 1분각은 π/10800 라디안이고, 거리 = 간격 ÷ [2 tan(각도/2)]예요. 거리 표시는 mm를 cm로 변환해요.",
    "example": "계산 예제: 300 × 400픽셀·대각선 5인치면 100 PPI, 픽셀 간격 0.254mm, 표시 영역 7.62 × 10.16cm예요. 1분각 거리는 약 87.32cm지만 개인의 시력을 평가하는 값은 아니에요.",
    "scalingTitle": "PPI만으로 OS 배율을 정하지 않아요",
    "scaling": "배율은 논리 작업 공간과 UI 크기를 바꿔요. 지원 설정과 렌더링은 OS·디스플레이에 따라 달라요. 시스템 설정에서 읽기 편한 크기를 고르되, PPI만으로 최적 배율이나 글자 품질을 보장하지 않아요.",
    "sources": "출처와 가정",
    "nist": "NIST: 정확한 인치·미터법 길이 변환",
    "apple": "Apple: 디스플레이 해상도와 글자 크기 변경",
    "note": "같은 물리적 길이에서 PPI가 높으면 픽셀이 작아져요. 실제 선명도에는 거리·렌더링·대비·패널 구조도 영향을 주며, 이 도구는 그 요소를 평가하지 않아요.",
    "loading": "계산 모듈이 준비되면 입력할 수 있어요. 입력 변경에는 JavaScript가 필요해요."
  },
  "ja": {
    "title": "モニターPPI・画素ピッチ・画面サイズ計算機",
    "description": "画素密度、画素ピッチ、表示領域と1分角の幾何学的距離を計算します。鮮明度評価やOSの最適倍率を保証しません。",
    "eyebrow": "画面の幾何計算",
    "presets": "画面規格のプリセット",
    "width": "横方向の画素数",
    "height": "縦方向の画素数",
    "diagonal": "表示領域の対角線（インチ）",
    "ppi": "1インチ当たりの画素数（PPI）",
    "pitch": "画素ピッチ",
    "size": "表示領域の幅 × 高さ",
    "angle": "1分角の幾何学的距離",
    "invalid": "画素数は正の整数、対角線は有限の正数で入力してください。空欄を別の数値へ自動補正しません。",
    "overflow": "この値では対応する数値精度で有限の正の結果を得られません。寸法を確認してください。",
    "assumptions": "平らな長方形の表示領域と正方形の画素を仮定します。OSの論理作業領域ではなくパネルのネイティブ画素数を使ってください。枠込み寸法、曲面、メーカーの丸めた寸法とは異なる場合があります。",
    "angleNote": "画面中央の1画素を正面から見たとき1分角となる幾何計算です。推奨視距離、目の健康、画素の識別可否、Retina認証の判定ではありません。",
    "mathTitle": "計算方法と前提",
    "math": "PPI = hypot（横画素数, 縦画素数）÷ 対角インチ。画素ピッチ（mm）= 25.4 ÷ PPI。表示領域は同じ画素比から求めます。1分角はπ/10800ラジアン、距離 = ピッチ ÷ [2 tan（角度/2）]です。距離表示ではmmをcmに変換します。",
    "example": "計算例：300 × 400画素・対角5インチなら100 PPI、ピッチ0.254mm、表示領域7.62 × 10.16cmです。1分角の距離は約87.32cmですが、個人の視力を評価する値ではありません。",
    "scalingTitle": "PPIだけでOSの倍率は決まりません",
    "scaling": "倍率は論理作業領域とUIサイズを変えます。利用できる設定や描画はOSと画面で異なります。設定で読みやすい大きさを選んでください。PPIだけで最適倍率や文字品質は保証できません。",
    "sources": "出典と仮定",
    "nist": "NIST：インチとメートル法の正確な長さ換算",
    "apple": "Apple：画面解像度と文字サイズの変更",
    "note": "同じ物理的な長さならPPIが高いほど画素は小さくなります。見え方には距離、描画、コントラスト、パネル構造も関わり、このツールはそれらを採点しません。",
    "loading": "計算機の準備ができると入力できます。変更にはJavaScriptが必要です。"
  },
  "zh": {
    "title": "显示器PPI、像素间距与屏幕尺寸计算器",
    "description": "计算像素密度、像素间距、有效显示区域及1角分几何距离。不评定清晰度等级，也不保证最佳系统缩放。",
    "eyebrow": "屏幕几何计算",
    "presets": "屏幕规格预设",
    "width": "水平像素数",
    "height": "垂直像素数",
    "diagonal": "有效显示区对角线（英寸）",
    "ppi": "每英寸像素数（PPI）",
    "pitch": "像素间距",
    "size": "有效显示区宽 × 高",
    "angle": "1角分几何距离",
    "invalid": "像素数请输入正整数，对角线请输入有限的正数。空白输入不会自动替换成其他数值。",
    "overflow": "这些值无法在支持的数值精度内得到有限的正数结果，请检查尺寸。",
    "assumptions": "假设显示区为平面矩形、像素为正方形。应输入面板原生像素数，而非系统逻辑工作区。含边框尺寸、曲面和厂商取整尺寸可能不同。",
    "angleNote": "计算的是从正面看屏幕中央一个像素恰好张成1角分时的几何距离，不是推荐视距、眼健康评估、像素可辨认保证或Retina认证。",
    "mathTitle": "计算方式与前提",
    "math": "PPI = hypot（水平像素数，垂直像素数）÷ 对角线英寸。像素间距（mm）= 25.4 ÷ PPI。显示区宽高按相同像素比例推算。1角分为π/10800弧度，距离 = 间距 ÷ [2 tan（角度/2）]；显示距离时把mm换算为cm。",
    "example": "计算示例：300 × 400像素、5英寸对角线得到100 PPI、0.254mm间距和7.62 × 10.16cm有效显示区。1角分距离约87.32cm，但这不是个人视力测评。",
    "scalingTitle": "PPI不能单独决定系统缩放",
    "scaling": "缩放会改变逻辑工作区与界面大小，可用设置和渲染取决于系统及显示器。请在系统设置中选择易读的大小；PPI本身不能保证最佳百分比或文字质量。",
    "sources": "来源与假设",
    "nist": "NIST：英寸与米制长度的精确换算",
    "apple": "Apple：调整显示器分辨率与文字大小",
    "note": "在相同物理长度上，PPI越高像素越小。视觉清晰度还受距离、渲染、对比度和面板结构影响，本工具不对这些因素评分。",
    "loading": "计算模块准备好后即可输入，更改数值需要JavaScript。"
  },
  "fr": {
    "title": "Calculateur PPI, pas de pixel et dimensions d’écran",
    "description": "Calculer densité, pas de pixel, zone active et distance géométrique d’une minute d’arc, sans note de netteté ni réglage optimal garanti.",
    "eyebrow": "Géométrie de l’écran",
    "presets": "Préréglages d’écran",
    "width": "Pixels horizontaux",
    "height": "Pixels verticaux",
    "diagonal": "Diagonale active (pouces)",
    "ppi": "Pixels par pouce (PPI)",
    "pitch": "Pas de pixel",
    "size": "Largeur × hauteur actives",
    "angle": "Distance géométrique à une minute d’arc",
    "invalid": "Saisissez des dimensions en pixels entières et positives, et une diagonale finie positive. Une valeur vide n’est pas remplacée automatiquement.",
    "overflow": "Ces valeurs ne donnent pas de résultat fini positif avec la précision numérique prise en charge. Vérifiez les dimensions.",
    "assumptions": "Hypothèses : zone active rectangulaire plane et pixels carrés. Utilisez les pixels natifs de la dalle, pas l’espace logique du système. Bordures, courbure et dimensions arrondies du fabricant peuvent différer.",
    "angleNote": "Géométrie choisie : un pixel central vu de face sous-tend une minute d’arc. Ce n’est ni une distance conseillée, ni un bilan visuel, ni une garantie d’invisibilité des pixels, ni une certification Retina.",
    "mathTitle": "Méthode de calcul et hypothèses",
    "math": "PPI = hypot(pixels horizontaux, pixels verticaux) ÷ diagonale en pouces. Pas (mm) = 25,4 ÷ PPI. Les dimensions actives suivent le même rapport de pixels. Une minute d’arc vaut π/10800 radians ; distance = pas ÷ [2 tan(angle/2)]. Les millimètres sont convertis en centimètres pour l’affichage.",
    "example": "Exemple : 300 × 400 pixels sur une diagonale de 5 pouces donnent 100 PPI, un pas de 0,254 mm et une zone active de 7,62 × 10,16 cm. La distance à une minute d’arc vaut environ 87,32 cm ; ce n’est pas une évaluation de la vue.",
    "scalingTitle": "Le PPI ne choisit pas la mise à l’échelle",
    "scaling": "L’échelle modifie l’espace logique et la taille de l’interface. Réglages et rendu dépendent du système et de l’écran. Choisissez une taille lisible dans les paramètres ; le PPI seul ne garantit ni pourcentage optimal ni qualité du texte.",
    "sources": "Sources et hypothèses",
    "nist": "NIST : conversion exacte entre pouces et unités métriques",
    "apple": "Apple : résolution d’écran et taille du texte",
    "note": "À longueur physique égale, un PPI supérieur signifie des pixels plus petits. Netteté perçue : distance, rendu, contraste et structure de dalle comptent aussi. Cet outil ne les évalue pas.",
    "loading": "La saisie sera disponible au chargement du calculateur. JavaScript est nécessaire pour modifier les valeurs."
  },
  "es": {
    "title": "Calculadora de PPI, paso de píxel y tamaño de pantalla",
    "description": "Calcula densidad, paso de píxel, área activa y distancia geométrica de un minuto de arco, sin calificaciones de nitidez ni escalado óptimo garantizado.",
    "eyebrow": "Geometría de pantalla",
    "presets": "Preajustes de pantalla",
    "width": "Píxeles horizontales",
    "height": "Píxeles verticales",
    "diagonal": "Diagonal activa (pulgadas)",
    "ppi": "Píxeles por pulgada (PPI)",
    "pitch": "Paso de píxel",
    "size": "Ancho × alto activos",
    "angle": "Distancia geométrica de un minuto de arco",
    "invalid": "Introduce dimensiones de píxeles enteras positivas y una diagonal finita positiva. Los campos vacíos no se sustituyen automáticamente.",
    "overflow": "Estos valores no producen un resultado finito positivo con la precisión numérica admitida. Revisa las dimensiones.",
    "assumptions": "Supone un área activa rectangular plana y píxeles cuadrados. Usa los píxeles nativos del panel, no el espacio lógico del sistema. Bordes, curvatura y medidas redondeadas del fabricante pueden diferir.",
    "angleNote": "Geometría elegida: un píxel central visto de frente abarca un minuto de arco. No es una distancia recomendada, evaluación de salud visual, garantía de invisibilidad de píxeles ni certificación Retina.",
    "mathTitle": "Método de cálculo y supuestos",
    "math": "PPI = hypot(píxeles horizontales, píxeles verticales) ÷ diagonal en pulgadas. Paso (mm) = 25,4 ÷ PPI. Las dimensiones activas siguen la misma proporción de píxeles. Un minuto de arco equivale a π/10800 radianes; distancia = paso ÷ [2 tan(ángulo/2)]. Se convierten milímetros a centímetros para mostrar la distancia.",
    "example": "Ejemplo: 300 × 400 píxeles y 5 pulgadas de diagonal dan 100 PPI, un paso de 0,254 mm y un área activa de 7,62 × 10,16 cm. La distancia de un minuto de arco es de unos 87,32 cm; no evalúa la visión personal.",
    "scalingTitle": "El PPI no determina el escalado del sistema",
    "scaling": "El escalado cambia el espacio lógico y el tamaño de la interfaz. Las opciones y el renderizado dependen del sistema y la pantalla. Elige un tamaño legible en los ajustes; el PPI solo no garantiza un porcentaje óptimo ni la calidad del texto.",
    "sources": "Fuentes y supuestos",
    "nist": "NIST: conversión exacta entre pulgadas y unidades métricas",
    "apple": "Apple: resolución de pantalla y tamaño del texto",
    "note": "A igual longitud física, un PPI mayor significa píxeles más pequeños. La nitidez percibida también depende de distancia, renderizado, contraste y estructura del panel. La herramienta no los puntúa.",
    "loading": "Podrás editar cuando se cargue la calculadora. Los cambios requieren JavaScript."
  }
};
