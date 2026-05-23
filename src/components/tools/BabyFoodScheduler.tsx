import { useState } from "react";
import type { Locale } from "../../lib/i18n";

interface Props {
  locale: Locale;
}

type Stage = "early" | "mid" | "late" | "finish";

interface FoodStage {
  stage: Stage;
  monthRange: [number, number]; // inclusive
  timesPerDay: number;
  amountPerMealMl: number;
  texture: Record<Locale, string>;
  stageName: Record<Locale, string>;
  veggies: Record<Locale, string[]>;
  proteins: Record<Locale, string[]>;
  grains: Record<Locale, string[]>;
  cautions: Record<Locale, string[]>;
  avoidFoods: Record<Locale, string[]>;
}

const STAGES: FoodStage[] = [
  {
    stage: "early",
    monthRange: [4, 6],
    timesPerDay: 1,
    amountPerMealMl: 30,
    stageName: {
      ko: "초기 이유식",
      en: "Early Weaning",
      ja: "離乳食初期",
      fr: "Diversification précoce",
      es: "Alimentación complementaria temprana",
      zh: "辅食初期",
      cn: "副食初期",
    },
    texture: {
      ko: "완전 퓨레 (10배죽 수준, 매끄럽게 갈기)",
      en: "Smooth purée (10:1 water ratio porridge)",
      ja: "なめらかなペースト（10倍がゆレベル）",
      fr: "Purée lisse (bouillie 10 volumes d'eau)",
      es: "Puré liso (papilla proporción 10:1 agua)",
      zh: "全泥状（10倍粥水平，打磨光滑）",
      cn: "全泥狀（10倍粥水準，打磨光滑）",
    },
    veggies: {
      ko: ["애호박", "당근", "감자", "브로콜리", "완두콩"],
      en: ["Zucchini", "Carrot", "Potato", "Broccoli", "Peas"],
      ja: ["ズッキーニ", "にんじん", "じゃがいも", "ブロッコリー", "グリーンピース"],
      fr: ["Courgette", "Carotte", "Pomme de terre", "Brocoli", "Petits pois"],
      es: ["Calabacín", "Zanahoria", "Papa", "Brócoli", "Arvejas"],
      zh: ["西葫芦", "胡萝卜", "土豆", "西兰花", "豌豆"],
      cn: ["西葫蘆", "胡蘿蔔", "土豆", "西蘭花", "豌豆"],
    },
    proteins: {
      ko: ["소고기 (처음엔 소량)", "닭가슴살", "두부"],
      en: ["Beef (small amount at first)", "Chicken breast", "Tofu"],
      ja: ["牛肉（最初は少量）", "鶏むね肉", "豆腐"],
      fr: ["Bœuf (petite quantité d'abord)", "Blanc de poulet", "Tofu"],
      es: ["Carne de res (pequeña cantidad al inicio)", "Pechuga de pollo", "Tofu"],
      zh: ["牛肉（初期少量）", "鸡胸肉", "豆腐"],
      cn: ["牛肉（初期少量）", "雞胸肉", "豆腐"],
    },
    grains: {
      ko: ["쌀 미음", "오트밀 미음", "보리 미음"],
      en: ["Rice porridge", "Oatmeal porridge", "Barley porridge"],
      ja: ["お米のお粥", "オートミールがゆ", "大麦がゆ"],
      fr: ["Bouillie de riz", "Bouillie d'avoine", "Bouillie d'orge"],
      es: ["Papilla de arroz", "Papilla de avena", "Papilla de cebada"],
      zh: ["米糊", "燕麦糊", "大麦糊"],
      cn: ["米糊", "燕麥糊", "大麥糊"],
    },
    cautions: {
      ko: [
        "한 번에 한 가지 식재료씩 3~5일 간격으로 도입",
        "알레르기 반응 확인 후 다음 재료 도입",
        "소금·설탕·꿀 절대 금지",
        "모유나 분유 수유 계속 유지",
      ],
      en: [
        "Introduce one ingredient at a time, 3-5 days apart",
        "Check for allergy reactions before adding next ingredient",
        "No salt, sugar, or honey",
        "Continue breastfeeding or formula",
      ],
      ja: [
        "1種類ずつ3〜5日間隔で導入する",
        "アレルギー反応を確認してから次の食材を導入",
        "塩・砂糖・はちみつは絶対禁止",
        "母乳またはミルクを継続",
      ],
      fr: [
        "Introduire un aliment à la fois, 3 à 5 jours d'intervalle",
        "Vérifier les réactions allergiques avant d'ajouter le prochain aliment",
        "Pas de sel, sucre, ni miel",
        "Continuer l'allaitement ou le lait maternisé",
      ],
      es: [
        "Introducir un alimento a la vez con 3-5 días de intervalo",
        "Verificar reacciones alérgicas antes de agregar el siguiente",
        "Sin sal, azúcar ni miel",
        "Continuar con lactancia materna o fórmula",
      ],
      zh: [
        "每次引入一种食材，间隔3-5天",
        "确认无过敏反应后再引入下一种食材",
        "严禁盐、糖、蜂蜜",
        "继续母乳或配方奶喂养",
      ],
      cn: [
        "每次引入一種食材，間隔3-5天",
        "確認無過敏反應後再引入下一種食材",
        "嚴禁鹽、糖、蜂蜜",
        "繼續母乳或配方奶哺育",
      ],
    },
    avoidFoods: {
      ko: ["꿀", "생우유", "달걀흰자", "견과류", "생선회", "짠 음식", "가공식품", "카페인"],
      en: ["Honey", "Cow's milk (whole)", "Egg whites", "Nuts", "Raw fish", "Salty foods", "Processed foods", "Caffeine"],
      ja: ["はちみつ", "牛乳（生）", "卵白", "ナッツ類", "生魚", "塩辛い食べ物", "加工食品", "カフェイン"],
      fr: ["Miel", "Lait de vache (entier)", "Blancs d'œufs", "Noix", "Poisson cru", "Aliments salés", "Aliments transformés", "Caféine"],
      es: ["Miel", "Leche de vaca (entera)", "Claras de huevo", "Nueces", "Pescado crudo", "Alimentos salados", "Alimentos procesados", "Cafeína"],
      zh: ["蜂蜜", "全脂牛奶", "蛋清", "坚果", "生鱼片", "含盐食品", "加工食品", "咖啡因"],
      cn: ["蜂蜜", "全脂牛奶", "蛋清", "堅果", "生魚片", "含鹽食品", "加工食品", "咖啡因"],
    },
  },
  {
    stage: "mid",
    monthRange: [7, 9],
    timesPerDay: 2,
    amountPerMealMl: 80,
    stageName: {
      ko: "중기 이유식",
      en: "Mid-stage Weaning",
      ja: "離乳食中期",
      fr: "Diversification intermédiaire",
      es: "Alimentación complementaria intermedia",
      zh: "辅食中期",
      cn: "副食中期",
    },
    texture: {
      ko: "부드러운 으깨기 (7배죽, 혀로 으깰 수 있는 정도)",
      en: "Soft mash (7:1 porridge, mashable with tongue)",
      ja: "柔らかいつぶし（7倍がゆ、舌でつぶせる硬さ）",
      fr: "Purée molle (bouillie 7:1, écrasable avec la langue)",
      es: "Puré suave (papilla 7:1, triturada con lengua)",
      zh: "软烂泥状（7倍粥，可用舌头压碎）",
      cn: "軟爛泥狀（7倍粥，可用舌頭壓碎）",
    },
    veggies: {
      ko: ["시금치", "단호박", "아욱", "청경채", "파프리카"],
      en: ["Spinach", "Butternut squash", "Mallow", "Bok choy", "Bell pepper"],
      ja: ["ほうれん草", "かぼちゃ", "アオイ", "チンゲン菜", "パプリカ"],
      fr: ["Épinards", "Courge butternut", "Mauve", "Bok choy", "Poivron"],
      es: ["Espinaca", "Calabaza mantequilla", "Malva", "Col china", "Pimiento"],
      zh: ["菠菜", "南瓜", "苋菜", "青菜", "彩椒"],
      cn: ["菠菜", "南瓜", "莧菜", "青菜", "彩椒"],
    },
    proteins: {
      ko: ["소고기 다짐육", "닭고기 다짐육", "연두부"],
      en: ["Minced beef", "Minced chicken", "Soft silken tofu"],
      ja: ["牛ひき肉", "鶏ひき肉", "絹ごし豆腐"],
      fr: ["Bœuf haché", "Poulet haché", "Tofu soyeux"],
      es: ["Carne de res molida", "Pollo molido", "Tofu sedoso"],
      zh: ["牛肉末", "鸡肉末", "嫩豆腐"],
      cn: ["牛肉末", "雞肉末", "嫩豆腐"],
    },
    grains: {
      ko: ["쌀죽 (7배죽)", "찹쌀죽", "현미죽"],
      en: ["Rice porridge (7:1)", "Glutinous rice porridge", "Brown rice porridge"],
      ja: ["7倍がゆ", "もち米がゆ", "玄米がゆ"],
      fr: ["Bouillie de riz 7:1", "Bouillie de riz gluant", "Bouillie de riz brun"],
      es: ["Papilla de arroz 7:1", "Papilla de arroz glutinoso", "Papilla de arroz integral"],
      zh: ["7倍粥", "糯米粥", "糙米粥"],
      cn: ["7倍粥", "糯米粥", "糙米粥"],
    },
    cautions: {
      ko: [
        "달걀노른자 도입 가능 (흰자는 아직 금지)",
        "생선 흰살부터 도입 (연어·등푸른생선 주의)",
        "물이나 보리차로 수분 보충 가능",
        "다양한 채소로 철분 섭취 신경 쓰기",
      ],
      en: [
        "Egg yolk can be introduced (not whites yet)",
        "White fish can be introduced (caution with fatty fish)",
        "Can supplement with water or barley tea",
        "Pay attention to iron intake with varied vegetables",
      ],
      ja: [
        "卵黄は導入可（卵白はまだ禁止）",
        "白身魚から導入（青魚には注意）",
        "水や麦茶で水分補給可",
        "様々な野菜で鉄分摂取に気を付ける",
      ],
      fr: [
        "Le jaune d'œuf peut être introduit (pas les blancs)",
        "Poisson blanc possible (attention aux poissons gras)",
        "Supplémenter avec eau ou thé d'orge",
        "Attention à l'apport en fer avec des légumes variés",
      ],
      es: [
        "La yema de huevo puede introducirse (no las claras aún)",
        "El pescado blanco puede introducirse (cuidado con el graso)",
        "Se puede suplementar con agua o té de cebada",
        "Atención al hierro con verduras variadas",
      ],
      zh: [
        "可引入蛋黄（蛋清暂不可）",
        "可引入白肉鱼（油性鱼类要注意）",
        "可用水或大麦茶补充水分",
        "多种蔬菜注意铁质摄入",
      ],
      cn: [
        "可引入蛋黃（蛋清暫不可）",
        "可引入白肉魚（油性魚類要注意）",
        "可用水或大麥茶補充水分",
        "多種蔬菜注意鐵質攝入",
      ],
    },
    avoidFoods: {
      ko: ["꿀", "생우유", "달걀흰자", "견과류 (분태 제외)", "날것의 음식", "짠 음식", "가공식품"],
      en: ["Honey", "Cow's milk", "Egg whites", "Whole nuts", "Raw foods", "Salty foods", "Processed foods"],
      ja: ["はちみつ", "牛乳", "卵白", "丸ごとのナッツ", "生食", "塩辛い食べ物", "加工食品"],
      fr: ["Miel", "Lait de vache", "Blancs d'œufs", "Noix entières", "Aliments crus", "Aliments salés", "Aliments transformés"],
      es: ["Miel", "Leche de vaca", "Claras de huevo", "Nueces enteras", "Alimentos crudos", "Alimentos salados", "Alimentos procesados"],
      zh: ["蜂蜜", "牛奶", "蛋清", "整粒坚果", "生食", "含盐食品", "加工食品"],
      cn: ["蜂蜜", "牛奶", "蛋清", "整粒堅果", "生食", "含鹽食品", "加工食品"],
    },
  },
  {
    stage: "late",
    monthRange: [10, 12],
    timesPerDay: 3,
    amountPerMealMl: 120,
    stageName: {
      ko: "후기 이유식",
      en: "Late-stage Weaning",
      ja: "離乳食後期",
      fr: "Diversification avancée",
      es: "Alimentación complementaria avanzada",
      zh: "辅食后期",
      cn: "副食後期",
    },
    texture: {
      ko: "작은 덩어리 (5배죽, 잇몸으로 으깰 수 있는 정도)",
      en: "Small chunks (5:1 porridge, crushable with gums)",
      ja: "小さい塊（5倍がゆ、歯茎でつぶせる硬さ）",
      fr: "Petits morceaux (bouillie 5:1, écrasable avec les gencives)",
      es: "Pequeños trozos (papilla 5:1, aplastable con encías)",
      zh: "小块状（5倍粥，牙龈可压碎）",
      cn: "小塊狀（5倍粥，牙齦可壓碎）",
    },
    veggies: {
      ko: ["무", "우엉", "연근", "양배추", "버섯"],
      en: ["Radish", "Burdock root", "Lotus root", "Cabbage", "Mushroom"],
      ja: ["大根", "ごぼう", "れんこん", "キャベツ", "きのこ"],
      fr: ["Radis", "Bardane", "Racine de lotus", "Chou", "Champignon"],
      es: ["Rábano", "Bardana", "Raíz de loto", "Repollo", "Champiñón"],
      zh: ["白萝卜", "牛蒡", "莲藕", "卷心菜", "蘑菇"],
      cn: ["白蘿蔔", "牛蒡", "蓮藕", "捲心菜", "蘑菇"],
    },
    proteins: {
      ko: ["소고기 잘게 다진 것", "흰살 생선", "달걀 (노른자+흰자)"],
      en: ["Finely minced beef", "White fish", "Whole egg (yolk + white)"],
      ja: ["牛肉の細かいみじん切り", "白身魚", "全卵（卵黄＋卵白）"],
      fr: ["Bœuf finement haché", "Poisson blanc", "Œuf entier (jaune + blanc)"],
      es: ["Carne de res finamente picada", "Pescado blanco", "Huevo entero (yema + clara)"],
      zh: ["牛肉细末", "白肉鱼", "全蛋（蛋黄+蛋清）"],
      cn: ["牛肉細末", "白肉魚", "全蛋（蛋黃+蛋清）"],
    },
    grains: {
      ko: ["진밥 (5배죽)", "수제비", "부드러운 빵"],
      en: ["Soft rice (5:1)", "Soft dumplings", "Soft bread"],
      ja: ["軟飯（5倍がゆ）", "すいとん", "やわらかいパン"],
      fr: ["Riz mou (5:1)", "Pâtes molles", "Pain mou"],
      es: ["Arroz suave (5:1)", "Masa blanda", "Pan suave"],
      zh: ["软饭（5倍粥）", "面疙瘩", "软面包"],
      cn: ["軟飯（5倍粥）", "麵疙瘩", "軟麵包"],
    },
    cautions: {
      ko: [
        "달걀 전체 도입 가능 (알레르기 확인 필수)",
        "천천히 씹는 연습을 시작할 수 있음",
        "손가락 음식 (핑거푸드) 도입 고려",
        "모유/분유는 계속 유지하되 비중을 줄임",
      ],
      en: [
        "Whole eggs can now be introduced (allergy check required)",
        "Can start practicing slow chewing",
        "Consider introducing finger foods",
        "Continue breast milk/formula but reduce proportion",
      ],
      ja: [
        "全卵の導入が可能（アレルギー確認必須）",
        "ゆっくり噛む練習を始めることができる",
        "フィンガーフード（手づかみ食べ）を検討",
        "母乳・ミルクは継続するが割合を減らす",
      ],
      fr: [
        "Les œufs entiers peuvent maintenant être introduits (vérification allergies)",
        "Commencer à pratiquer la mastication lente",
        "Envisager les aliments à manger avec les doigts",
        "Continuer lait maternel/formule mais réduire proportion",
      ],
      es: [
        "Los huevos enteros ya pueden introducirse (verificar alergias)",
        "Empezar a practicar masticación lenta",
        "Considerar alimentos para comer con los dedos",
        "Continuar leche materna/fórmula pero reducir proporción",
      ],
      zh: [
        "可引入全蛋（必须检查过敏）",
        "可开始练习慢慢咀嚼",
        "考虑引入手抓食物",
        "继续母乳/配方奶但减少比例",
      ],
      cn: [
        "可引入全蛋（必須檢查過敏）",
        "可開始練習慢慢咀嚼",
        "考慮引入手抓食物",
        "繼續母乳/配方奶但減少比例",
      ],
    },
    avoidFoods: {
      ko: ["꿀 (만 1세 전)", "생우유 (주 음료로)", "딱딱한 견과류", "짠 음식", "가공식품", "자극적 양념"],
      en: ["Honey (before 1 year)", "Cow's milk as main drink", "Hard whole nuts", "Salty foods", "Processed foods", "Spicy seasonings"],
      ja: ["はちみつ（1歳前）", "牛乳（主な飲み物として）", "固いナッツ", "塩辛い食べ物", "加工食品", "刺激的な調味料"],
      fr: ["Miel (avant 1 an)", "Lait de vache comme boisson principale", "Noix dures entières", "Aliments salés", "Aliments transformés", "Assaisonnements épicés"],
      es: ["Miel (antes del año)", "Leche de vaca como bebida principal", "Nueces duras enteras", "Alimentos salados", "Alimentos procesados", "Condimentos picantes"],
      zh: ["蜂蜜（1岁前）", "牛奶（作为主要饮料）", "整粒硬坚果", "含盐食品", "加工食品", "刺激性调味料"],
      cn: ["蜂蜜（1歲前）", "牛奶（作為主要飲料）", "整粒硬堅果", "含鹽食品", "加工食品", "刺激性調味料"],
    },
  },
  {
    stage: "finish",
    monthRange: [13, 24],
    timesPerDay: 3,
    amountPerMealMl: 200,
    stageName: {
      ko: "완료기 이유식",
      en: "Finishing Stage",
      ja: "離乳食完了期",
      fr: "Alimentation de transition finale",
      es: "Etapa final de alimentación complementaria",
      zh: "辅食完成期",
      cn: "副食完成期",
    },
    texture: {
      ko: "부드러운 어른 음식 수준 (잘게 썬 음식, 부드럽게 조리)",
      en: "Soft adult food texture (finely cut, softly cooked)",
      ja: "柔らかい大人食レベル（細かく切った、柔らかく調理）",
      fr: "Texture d'aliments adultes mous (finement coupés, cuits doucement)",
      es: "Textura de comida adulta suave (finamente cortada, cocida suavemente)",
      zh: "软烂成人食物水平（细切，软煮）",
      cn: "軟爛成人食物水準（細切，軟煮）",
    },
    veggies: {
      ko: ["다양한 채소 (잘게 썰기)", "브로콜리", "당근", "시금치", "콩나물"],
      en: ["Various vegetables (finely cut)", "Broccoli", "Carrot", "Spinach", "Bean sprouts"],
      ja: ["様々な野菜（細かく切る）", "ブロッコリー", "にんじん", "ほうれん草", "もやし"],
      fr: ["Légumes variés (finement coupés)", "Brocoli", "Carotte", "Épinards", "Pousses de soja"],
      es: ["Verduras variadas (finamente cortadas)", "Brócoli", "Zanahoria", "Espinaca", "Brotes de soja"],
      zh: ["各种蔬菜（细切）", "西兰花", "胡萝卜", "菠菜", "豆芽"],
      cn: ["各種蔬菜（細切）", "西蘭花", "胡蘿蔔", "菠菜", "豆芽"],
    },
    proteins: {
      ko: ["소고기·돼지고기 잘게 썬 것", "닭고기 잘게 찢은 것", "달걀 요리"],
      en: ["Finely cut beef/pork", "Shredded chicken", "Cooked eggs"],
      ja: ["牛肉・豚肉の細かい切り身", "鶏肉の細かく裂いたもの", "卵料理"],
      fr: ["Bœuf/porc finement coupé", "Poulet effiloché", "Œufs cuits"],
      es: ["Carne de res/cerdo finamente cortada", "Pollo desmenuzado", "Huevos cocidos"],
      zh: ["细切牛猪肉", "细丝鸡肉", "熟蛋料理"],
      cn: ["細切牛豬肉", "細絲雞肉", "熟蛋料理"],
    },
    grains: {
      ko: ["진밥 → 보통 밥으로 이행", "부드러운 국수", "식빵"],
      en: ["Soft rice → transitioning to regular rice", "Soft noodles", "White bread"],
      ja: ["軟飯→普通のご飯への移行", "柔らかい麺", "食パン"],
      fr: ["Riz mou → transition vers riz normal", "Nouilles molles", "Pain de mie"],
      es: ["Arroz suave → transición a arroz normal", "Fideos suaves", "Pan blanco"],
      zh: ["软饭→过渡到普通饭", "软面条", "白面包"],
      cn: ["軟飯→過渡到普通飯", "軟麵條", "白麵包"],
    },
    cautions: {
      ko: [
        "생우유 하루 400~500ml 가능 (만 1세 이후)",
        "가족과 같은 음식 먹기 시작 (간 적게)",
        "스스로 숟가락 쓰기 연습 격려",
        "다양한 식재료로 편식 예방",
      ],
      en: [
        "Cow's milk 400-500ml/day possible (after 1 year)",
        "Start sharing family meals (less seasoning)",
        "Encourage self-feeding with spoon",
        "Prevent picky eating with varied ingredients",
      ],
      ja: [
        "牛乳1日400〜500ml可能（1歳以降）",
        "家族と同じ食事を食べ始める（薄味で）",
        "スプーンで自分で食べる練習を促す",
        "様々な食材で偏食予防",
      ],
      fr: [
        "Lait de vache 400-500ml/jour possible (après 1 an)",
        "Commencer à partager les repas familiaux (moins salés)",
        "Encourager l'auto-alimentation à la cuillère",
        "Prévenir les préférences alimentaires avec des ingrédients variés",
      ],
      es: [
        "Leche de vaca 400-500ml/día posible (después del año)",
        "Comenzar a compartir comidas familiares (menos condimentado)",
        "Fomentar la autoalimentación con cuchara",
        "Prevenir selectividad con ingredientes variados",
      ],
      zh: [
        "1岁后可每天喝400-500ml牛奶",
        "开始与家人共享餐食（少调味）",
        "鼓励自己用勺子吃饭",
        "用多样食材预防挑食",
      ],
      cn: [
        "1歲後可每天喝400-500ml牛奶",
        "開始與家人共享餐食（少調味）",
        "鼓勵自己用湯匙吃飯",
        "用多樣食材預防挑食",
      ],
    },
    avoidFoods: {
      ko: ["꿀 (영아 보툴리즘 주의, 만 1세 이후 소량 가능)", "딱딱한 견과류 (통째)", "매운 음식", "카페인", "고염분 가공식품"],
      en: ["Honey (infant botulism caution, small amounts ok after 1yr)", "Hard whole nuts", "Spicy food", "Caffeine", "High-salt processed foods"],
      ja: ["はちみつ（乳児ボツリヌス症注意、1歳以降少量可）", "固いナッツ（丸ごと）", "辛い食べ物", "カフェイン", "高塩分加工食品"],
      fr: ["Miel (botulisme infantile, petites quantités ok après 1 an)", "Noix entières dures", "Nourriture épicée", "Caféine", "Aliments transformés salés"],
      es: ["Miel (botulismo infantil, pequeñas cantidades ok después del año)", "Nueces enteras duras", "Comida picante", "Cafeína", "Alimentos procesados con alto contenido en sal"],
      zh: ["蜂蜜（婴儿肉毒杆菌注意，1岁后少量可）", "整粒硬坚果", "辣食", "咖啡因", "高盐加工食品"],
      cn: ["蜂蜜（嬰兒肉毒桿菌注意，1歲後少量可）", "整粒硬堅果", "辣食", "咖啡因", "高鹽加工食品"],
    },
  },
];

const UI: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    sliderLabel: string;
    monthUnit: string;
    timesPerDay: string;
    amountPerMeal: string;
    texture: string;
    veggiesLabel: string;
    proteinsLabel: string;
    grainsLabel: string;
    cautionsLabel: string;
    avoidLabel: string;
    disclaimer: string;
  }
> = {
  ko: {
    title: "이유식 스케줄러",
    subtitle: "아이 개월 수에 맞는 이유식 정보를 확인하세요",
    sliderLabel: "아이 개월 수",
    monthUnit: "개월",
    timesPerDay: "하루 횟수",
    amountPerMeal: "1회 섭취량",
    texture: "질감",
    veggiesLabel: "추천 채소",
    proteinsLabel: "추천 단백질",
    grainsLabel: "추천 곡류",
    cautionsLabel: "주의사항",
    avoidLabel: "피해야 할 음식",
    disclaimer: "* 모든 정보는 참고용입니다. 소아과 전문의와 상담을 권장합니다.",
  },
  en: {
    title: "Baby Food Scheduler",
    subtitle: "Get weaning food information tailored to your baby's age",
    sliderLabel: "Baby's age",
    monthUnit: "months",
    timesPerDay: "Times per day",
    amountPerMeal: "Amount per meal",
    texture: "Texture",
    veggiesLabel: "Recommended Vegetables",
    proteinsLabel: "Recommended Proteins",
    grainsLabel: "Recommended Grains",
    cautionsLabel: "Important Notes",
    avoidLabel: "Foods to Avoid",
    disclaimer: "* All information is for reference only. Consult your pediatrician.",
  },
  ja: {
    title: "離乳食スケジューラー",
    subtitle: "お子様の月齢に合った離乳食情報を確認しましょう",
    sliderLabel: "お子様の月齢",
    monthUnit: "ヶ月",
    timesPerDay: "1日の回数",
    amountPerMeal: "1回の量",
    texture: "食感",
    veggiesLabel: "おすすめ野菜",
    proteinsLabel: "おすすめたんぱく質",
    grainsLabel: "おすすめ穀物",
    cautionsLabel: "注意事項",
    avoidLabel: "避けるべき食べ物",
    disclaimer: "* すべての情報は参考用です。小児科医に相談することをお勧めします。",
  },
  fr: {
    title: "Planificateur d'Alimentation Bébé",
    subtitle: "Obtenez des informations sur la diversification adaptées à l'âge de votre bébé",
    sliderLabel: "Âge du bébé",
    monthUnit: "mois",
    timesPerDay: "Fois par jour",
    amountPerMeal: "Quantité par repas",
    texture: "Texture",
    veggiesLabel: "Légumes recommandés",
    proteinsLabel: "Protéines recommandées",
    grainsLabel: "Céréales recommandées",
    cautionsLabel: "Notes importantes",
    avoidLabel: "Aliments à éviter",
    disclaimer: "* Toutes les informations sont à titre indicatif seulement. Consultez votre pédiatre.",
  },
  es: {
    title: "Planificador de Alimentación del Bebé",
    subtitle: "Obtén información sobre alimentación complementaria según la edad de tu bebé",
    sliderLabel: "Edad del bebé",
    monthUnit: "meses",
    timesPerDay: "Veces al día",
    amountPerMeal: "Cantidad por comida",
    texture: "Textura",
    veggiesLabel: "Verduras recomendadas",
    proteinsLabel: "Proteínas recomendadas",
    grainsLabel: "Cereales recomendados",
    cautionsLabel: "Notas importantes",
    avoidLabel: "Alimentos a evitar",
    disclaimer: "* Toda la información es solo de referencia. Consulte a su pediatra.",
  },
  zh: {
    title: "辅食调度器",
    subtitle: "获取适合宝宝月龄的辅食信息",
    sliderLabel: "宝宝月龄",
    monthUnit: "个月",
    timesPerDay: "每日次数",
    amountPerMeal: "每餐用量",
    texture: "食物质地",
    veggiesLabel: "推荐蔬菜",
    proteinsLabel: "推荐蛋白质",
    grainsLabel: "推荐谷物",
    cautionsLabel: "注意事项",
    avoidLabel: "避免食物",
    disclaimer: "* 所有信息仅供参考。请咨询儿科医生。",
  },
  cn: {
    title: "副食調度器",
    subtitle: "獲取適合寶寶月齡的副食資訊",
    sliderLabel: "寶寶月齡",
    monthUnit: "個月",
    timesPerDay: "每日次數",
    amountPerMeal: "每餐用量",
    texture: "食物質地",
    veggiesLabel: "推薦蔬菜",
    proteinsLabel: "推薦蛋白質",
    grainsLabel: "推薦穀物",
    cautionsLabel: "注意事項",
    avoidLabel: "避免食物",
    disclaimer: "* 所有資訊僅供參考。請諮詢兒科醫生。",
  },
};

const STAGE_COLORS: Record<Stage, string> = {
  early: "from-green-400 to-emerald-500",
  mid: "from-blue-400 to-cyan-500",
  late: "from-orange-400 to-amber-500",
  finish: "from-purple-400 to-pink-500",
};

const STAGE_BORDER: Record<Stage, string> = {
  early: "border-emerald-300 dark:border-emerald-700",
  mid: "border-blue-300 dark:border-blue-700",
  late: "border-amber-300 dark:border-amber-700",
  finish: "border-purple-300 dark:border-purple-700",
};

function getStage(months: number): FoodStage {
  return STAGES.find((s) => months >= s.monthRange[0] && months <= s.monthRange[1]) ?? STAGES[STAGES.length - 1];
}

export default function BabyFoodScheduler({ locale }: Props) {
  const t = UI[locale] ?? UI.en;
  const [months, setMonths] = useState(6);

  const stage = getStage(months);
  const gradientClass = STAGE_COLORS[stage.stage];
  const borderClass = STAGE_BORDER[stage.stage];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.title}</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{t.subtitle}</p>
      </div>

      {/* Slider */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.sliderLabel}</label>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {months}
              <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-1">{t.monthUnit}</span>
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={24}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-green-300 via-blue-300 via-orange-300 to-purple-300"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>4{t.monthUnit}</span>
            <span>6{t.monthUnit}</span>
            <span>9{t.monthUnit}</span>
            <span>12{t.monthUnit}</span>
            <span>24{t.monthUnit}</span>
          </div>
        </div>
      </div>

      {/* Stage badge */}
      <div className={`rounded-2xl bg-gradient-to-r ${gradientClass} p-5 text-white text-center shadow-lg`}>
        <div className="text-xl font-bold">{stage.stageName[locale] ?? stage.stageName.en}</div>
        <div className="text-sm opacity-90 mt-1">
          {stage.monthRange[0]}~{stage.monthRange[1]}{t.monthUnit}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl border ${borderClass} bg-white dark:bg-gray-800 p-4 text-center`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stage.timesPerDay}회</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.timesPerDay}</div>
        </div>
        <div className={`rounded-xl border ${borderClass} bg-white dark:bg-gray-800 p-4 text-center`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stage.amountPerMealMl}ml</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.amountPerMeal}</div>
        </div>
      </div>

      {/* Texture */}
      <div className={`rounded-xl border ${borderClass} bg-white dark:bg-gray-800 p-4`}>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.texture}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{stage.texture[locale] ?? stage.texture.en}</p>
      </div>

      {/* Ingredients */}
      <div className="grid grid-cols-1 gap-4">
        {[
          { label: t.veggiesLabel, items: stage.veggies[locale] ?? stage.veggies.en, color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800", badge: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
          { label: t.proteinsLabel, items: stage.proteins[locale] ?? stage.proteins.en, color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" },
          { label: t.grainsLabel, items: stage.grains[locale] ?? stage.grains.en, color: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800", badge: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" },
        ].map(({ label, items, color, badge }) => (
          <div key={label} className={`rounded-xl border ${color} p-4`}>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span key={item} className={`text-xs px-2 py-1 rounded-full ${badge} font-medium`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cautions */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">{t.cautionsLabel}</div>
        <ul className="space-y-1">
          {(stage.cautions[locale] ?? stage.cautions.en).map((c) => (
            <li key={c} className="text-xs text-blue-600 dark:text-blue-400 flex gap-1.5">
              <span className="mt-0.5">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avoid foods */}
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
        <div className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">{t.avoidLabel}</div>
        <div className="flex flex-wrap gap-2">
          {(stage.avoidFoods[locale] ?? stage.avoidFoods.en).map((f) => (
            <span key={f} className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">{t.disclaimer}</p>
    </div>
  );
}
