import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Shuffle from 'lucide-react/dist/esm/icons/shuffle'
import Heart from 'lucide-react/dist/esm/icons/heart'
import Share2 from 'lucide-react/dist/esm/icons/share-2'
import History from 'lucide-react/dist/esm/icons/history'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import Search from 'lucide-react/dist/esm/icons/search'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import Swords from 'lucide-react/dist/esm/icons/swords';
import menuData, { countryLabels, type CountryType, type MenuItem } from '@/lib/menu-data';
import { mapSearchLinks, mealFromQuery, poolFor, suggestedMeal, type MealMode } from '@/lib/menu-pick';

const MAX_HISTORY = 10;
const STORAGE_KEY_HISTORY = 'menu-history';
const STORAGE_KEY_FAVORITES = 'menu-favorites';

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) ?? '[]');
  } catch {
    return [];
  }
}

function addToHistory(item: string): string[] {
  const h = getHistory();
  if (h[0] === item) return h;
  const updated = [item, ...h].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  return updated;
}

function clearHistory(): void {
  localStorage.setItem(STORAGE_KEY_HISTORY, '[]');
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) ?? '[]');
  } catch {
    return [];
  }
}

function addFavorite(item: string): string[] {
  const favs = getFavorites();
  if (!favs.includes(item)) {
    const updated = [item, ...favs];
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
    return updated;
  }
  return favs;
}

function removeFavorite(item: string): string[] {
  const updated = getFavorites().filter((f) => f !== item);
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  return updated;
}

function useThrottle<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  const lastRun = useRef(0);
  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= ms) {
        lastRun.current = now;
        fn(...args);
      }
    }) as T,
    [fn, ms]
  );
}

// 상황·계절 필터. 점심·저녁은 아래 점메추/저메추 버튼이 맡는다.
const FILTER_TAGS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '야식', label: '🌙 야식' },
  { key: '해장', label: '🍲 해장' },
  { key: '여름', label: '☀️ 여름' },
  { key: '겨울', label: '❄️ 겨울' },
  { key: '다이어트', label: '🥗 다이어트' },
  { key: '혼밥', label: '🧑 혼밥' },
  { key: '회식', label: '🍻 회식' },
];

type MealCopy = {
  random: string;
  lunch: string;
  dinner: string;
  hintLunch: string;
  hintDinner: string;
  mapsTitle: string;
  mapsNote: string;
  kakao: string;
  naver: string;
  google: string;
  shareTitle: string;
  shareAny: string;
  shareLunch: string;
  shareDinner: string;
  placeWord: string;
  emptyTitle: string;
  emptyBody: string;
};

const COPY: Record<string, MealCopy> = {
  ko: {
    random: '랜덤 메뉴',
    lunch: '점메추',
    dinner: '저메추',
    hintLunch: '지금은 점심 시간이에요.',
    hintDinner: '지금은 저녁 시간이에요.',
    mapsTitle: '지도에서 이 메뉴 찾기',
    mapsNote: '지도 앱의 검색만 열어요. 위치는 보내지 않아요.',
    kakao: '카카오맵',
    naver: '네이버 지도',
    google: '구글 지도',
    shareTitle: '오늘 뭐 먹지?',
    shareAny: '오늘 메뉴는 "{name}"이에요.',
    shareLunch: '점메추는 "{name}"이에요.',
    shareDinner: '저메추는 "{name}"이에요.',
    placeWord: '맛집',
    emptyTitle: '점메추, 저메추, 또는 랜덤 메뉴를 눌러 보세요.',
    emptyBody: '점심과 저녁은 그 끼니 메뉴 안에서만 고릅니다.',
  },
  en: {
    random: 'Random menu',
    lunch: 'Lunch pick',
    dinner: 'Dinner pick',
    hintLunch: 'It is lunchtime on this device.',
    hintDinner: 'It is dinnertime on this device.',
    mapsTitle: 'Find this dish on a map',
    mapsNote: 'Opens a map search. Your location is not sent.',
    kakao: 'Kakao Map',
    naver: 'Naver Map',
    google: 'Google Maps',
    shareTitle: 'What should we eat?',
    shareAny: 'Today\'s menu is "{name}".',
    shareLunch: 'Lunch pick: "{name}".',
    shareDinner: 'Dinner pick: "{name}".',
    placeWord: 'restaurant',
    emptyTitle: 'Try a lunch pick, a dinner pick, or a random menu.',
    emptyBody: 'Lunch and dinner stay inside dishes tagged for that meal.',
  },
  ja: {
    random: 'ランダムメニュー',
    lunch: '昼ごはん',
    dinner: '夕ごはん',
    hintLunch: 'この端末の時刻は昼です。',
    hintDinner: 'この端末の時刻は夜です。',
    mapsTitle: '地図でこのメニューを探す',
    mapsNote: '地図アプリの検索を開きます。位置情報は送りません。',
    kakao: 'カカオマップ',
    naver: 'ネイバー地図',
    google: 'Google マップ',
    shareTitle: '今日は何を食べる？',
    shareAny: '今日のメニューは「{name}」です。',
    shareLunch: '昼ごはんは「{name}」です。',
    shareDinner: '夕ごはんは「{name}」です。',
    placeWord: 'レストラン',
    emptyTitle: '昼ごはん、夕ごはん、またはランダムを押してください。',
    emptyBody: '昼と夜は、その食事向けのメニューだけから選びます。',
  },
  zh: {
    random: '随机菜单',
    lunch: '午餐推荐',
    dinner: '晚餐推荐',
    hintLunch: '这台设备现在是午餐时间。',
    hintDinner: '这台设备现在是晚餐时间。',
    mapsTitle: '在地图上找这道菜',
    mapsNote: '只打开地图搜索。不会发送你的位置。',
    kakao: 'Kakao 地图',
    naver: 'Naver 地图',
    google: '谷歌地图',
    shareTitle: '今天吃什么？',
    shareAny: '今天的菜单是「{name}」。',
    shareLunch: '午餐推荐是「{name}」。',
    shareDinner: '晚餐推荐是「{name}」。',
    placeWord: '餐厅',
    emptyTitle: '选午餐、晚餐，或随机菜单。',
    emptyBody: '午餐和晚餐只从对应餐次的菜里抽。',
  },
  fr: {
    random: 'Menu au hasard',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    hintLunch: 'Sur cet appareil, c\'est l\'heure du déjeuner.',
    hintDinner: 'Sur cet appareil, c\'est l\'heure du dîner.',
    mapsTitle: 'Chercher ce plat sur une carte',
    mapsNote: 'Ouvre une recherche de carte. Votre position n\'est pas envoyée.',
    kakao: 'Kakao Map',
    naver: 'Naver Map',
    google: 'Google Maps',
    shareTitle: 'On mange quoi ?',
    shareAny: 'Le menu du jour est « {name} ».',
    shareLunch: 'Pour le déjeuner : « {name} ».',
    shareDinner: 'Pour le dîner : « {name} ».',
    placeWord: 'restaurant',
    emptyTitle: 'Choisissez un déjeuner, un dîner, ou un menu au hasard.',
    emptyBody: 'Le déjeuner et le dîner restent dans les plats de ce repas.',
  },
  es: {
    random: 'Menú al azar',
    lunch: 'Comida',
    dinner: 'Cena',
    hintLunch: 'En este dispositivo es hora de comer.',
    hintDinner: 'En este dispositivo es hora de cenar.',
    mapsTitle: 'Buscar este plato en un mapa',
    mapsNote: 'Abre una búsqueda en el mapa. No se envía tu ubicación.',
    kakao: 'Kakao Map',
    naver: 'Naver Map',
    google: 'Google Maps',
    shareTitle: '¿Qué comemos?',
    shareAny: 'El menú de hoy es «{name}».',
    shareLunch: 'Para comer: «{name}».',
    shareDinner: 'Para cenar: «{name}».',
    placeWord: 'restaurante',
    emptyTitle: 'Prueba comida, cena o un menú al azar.',
    emptyBody: 'La comida y la cena salen solo de platos de esa comida.',
  },
};

function fillName(template: string, name: string): string {
  return template.replace('{name}', name);
}

export default function MenuGenerator({ locale = 'ko' }: { locale?: string }) {
  const copy = COPY[locale] ?? COPY.en;
  const [selectedCountry, setSelectedCountry] = useState<CountryType>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [meal, setMeal] = useState<MealMode>('any');
  const [suggestion, setSuggestion] = useState<Exclude<MealMode, 'any'> | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [spinText, setSpinText] = useState('');
  const [battleMode, setBattleMode] = useState(false);
  const [battleOptions, setBattleOptions] = useState<[string, string] | null>(null);
  const [imgError, setImgError] = useState(false);
  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(getHistory());
    setFavorites(getFavorites());
    const fromUrl = new URLSearchParams(window.location.search).get('meal');
    if (fromUrl) setMeal(mealFromQuery(fromUrl));
    setSuggestion(suggestedMeal(new Date().getHours()));
    return () => {
      if (spinTimer.current) clearInterval(spinTimer.current);
    };
  }, []);

  const rememberMeal = useCallback((next: MealMode) => {
    const url = new URL(window.location.href);
    if (next === 'any') url.searchParams.delete('meal');
    else url.searchParams.set('meal', next);
    window.history.replaceState(null, '', url);
  }, []);

  const spin = useCallback((pool: MenuItem[]) => {
    if (pool.length === 0) return;
    if (spinTimer.current) clearInterval(spinTimer.current);
    setIsGenerating(true);
    setSelectedMenu(null);
    setSelectedImage(null);
    setImgError(false);
    setSpinText('');
    setBattleMode(false);
    setBattleOptions(null);

    const duration = 2000;
    const interval = 100;
    const count = duration / interval;
    let i = 0;

    spinTimer.current = setInterval(() => {
      const r = pool[Math.floor(Math.random() * pool.length)];
      setSpinText(r.menu.split(' ')[0]);
      i++;
      if (i >= count) {
        if (spinTimer.current) clearInterval(spinTimer.current);
        spinTimer.current = null;
        const final = pool[Math.floor(Math.random() * pool.length)];
        setSelectedMenu(final.menu);
        setSelectedImage(final.image);
        setSearchQuery(final.menu.split(' ')[0]);
        setSpinText('');
        setIsGenerating(false);
        const h = addToHistory(final.menu);
        setHistory(h);
      }
    }, interval);
  }, []);

  const pick = useThrottle(
    useCallback((next: MealMode) => {
      setMeal(next);
      rememberMeal(next);
      spin(poolFor(selectedCountry, next, selectedTag));
    }, [rememberMeal, selectedCountry, selectedTag, spin]),
    1000
  );

  const generateSurprise = useThrottle(
    useCallback(() => {
      setMeal('any');
      rememberMeal('any');
      spin(menuData.all);
    }, [rememberMeal, spin]),
    1000
  );

  const startBattle = useCallback(() => {
    const pool = poolFor(selectedCountry, meal, selectedTag);
    if (pool.length < 2) return;
    let i1 = Math.floor(Math.random() * pool.length);
    let i2 = Math.floor(Math.random() * pool.length);
    while (i2 === i1) i2 = Math.floor(Math.random() * pool.length);
    setBattleOptions([pool[i1].menu, pool[i2].menu]);
    setBattleMode(true);
  }, [meal, selectedCountry, selectedTag]);

  const chooseBattle = useCallback((winner: string) => {
    setSelectedMenu(winner);
    const item = menuData.all.find((m) => m.menu === winner);
    if (item) {
      setSelectedImage(item.image);
      setSearchQuery(winner.split(' ')[0]);
      setImgError(false);
    }
    const h = addToHistory(winner);
    setHistory(h);
    setBattleMode(false);
    setBattleOptions(null);
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!selectedMenu) return;
    const isFav = favorites.includes(selectedMenu);
    const updated = isFav ? removeFavorite(selectedMenu) : addFavorite(selectedMenu);
    setFavorites(updated);
  }, [selectedMenu, favorites]);

  const handleShare = useCallback(async () => {
    if (!selectedMenu) return;
    const name = selectedMenu.split(' ')[0];
    const template = meal === 'lunch' ? copy.shareLunch : meal === 'dinner' ? copy.shareDinner : copy.shareAny;
    const data = { title: copy.shareTitle, text: fillName(template, name), url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); alert('클립보드에 복사했어요!'); }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e);
    }
  }, [copy.shareAny, copy.shareDinner, copy.shareLunch, copy.shareTitle, meal, selectedMenu]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) window.open(`https://www.google.com/search?q=${encodeURIComponent(`${searchQuery} ${copy.placeWord}`)}`, '_blank');
  }, [copy.placeWord, searchQuery]);

  const isFav = selectedMenu ? favorites.includes(selectedMenu) : false;

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Cuisine selector */}
      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">음식 종류</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(countryLabels) as CountryType[]).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCountry === c
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {countryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Situation / meal-time / season selector */}
      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">상황 · 계절</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_TAGS.map((tg) => (
            <button
              key={tg.key}
              onClick={() => setSelectedTag(tg.key)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedTag === tg.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {tg.label}
            </button>
          ))}
        </div>
      </div>

      {meal === 'any' && suggestion && (
        <p className="text-sm text-muted-foreground">
          {suggestion === 'lunch' ? copy.hintLunch : copy.hintDinner}{' '}
          <button
            type="button"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
            aria-label={suggestion === 'lunch' ? `${copy.hintLunch} ${copy.lunch}` : `${copy.hintDinner} ${copy.dinner}`}
            onClick={() => pick(suggestion)}
          >
            {suggestion === 'lunch' ? copy.lunch : copy.dinner}
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button
          onClick={() => pick('any')}
          disabled={isGenerating}
          size="lg"
          aria-pressed={meal === 'any'}
          variant={meal === 'any' ? 'default' : 'outline'}
          className="text-base py-4 sm:py-6"
        >
          <Shuffle className="mr-2 size-5" />
          {copy.random}
        </Button>
        <Button
          onClick={() => pick('lunch')}
          disabled={isGenerating}
          size="lg"
          aria-pressed={meal === 'lunch'}
          variant={meal === 'lunch' ? 'default' : 'outline'}
          className="text-base py-4 sm:py-6"
        >
          {copy.lunch}
        </Button>
        <Button
          onClick={() => pick('dinner')}
          disabled={isGenerating}
          size="lg"
          aria-pressed={meal === 'dinner'}
          variant={meal === 'dinner' ? 'default' : 'outline'}
          className="text-base py-4 sm:py-6"
        >
          {copy.dinner}
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={generateSurprise}
          disabled={isGenerating}
          size="lg"
          variant="outline"
          className="flex-1 text-base py-4 sm:py-6"
        >
          <Shuffle className="mr-2 size-5" />
          깜짝 메뉴 (전체)
        </Button>
        <Button
          onClick={startBattle}
          disabled={isGenerating}
          size="lg"
          variant="secondary"
          className="flex-1 text-base py-4 sm:py-6"
        >
          <Swords className="mr-2 size-5" />
          메뉴 배틀 ⚔️
        </Button>
      </div>

      {/* Spin animation */}
      {isGenerating && spinText && (
        <Card>
          <CardContent className="py-6 sm:py-10 text-center">
            <p className="text-4xl font-bold animate-pulse">{spinText}</p>
            <p className="text-sm text-muted-foreground mt-2">메뉴를 고르는 중...</p>
          </CardContent>
        </Card>
      )}

      {/* Battle mode */}
      {battleMode && battleOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">⚔️ 메뉴 배틀</CardTitle>
            <CardDescription className="text-center">먹고 싶은 메뉴를 선택하세요!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {battleOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => chooseBattle(opt)}
                  className="group min-h-[160px] rounded-xl border-2 border-border p-4 sm:p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="text-4xl mb-3">{idx === 0 ? '👈' : '👉'}</div>
                  <div className="text-xl font-bold">{opt.split(' ')[0]}</div>
                  {opt.includes(' ') && (
                    <div className="text-xs text-muted-foreground mt-1">{opt.split(' ').slice(1).join(' ')}</div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setBattleMode(false); setBattleOptions(null); }}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {selectedMenu && !isGenerating && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">오늘의 메뉴 결정!</CardTitle>
            <CardDescription>맛있게 드세요 😊</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {selectedImage && !imgError && (
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={selectedImage}
                  alt={selectedMenu.split(' ')[0]}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              </div>
            )}
            <div className="p-4 sm:p-6 text-center space-y-4">
              <p className="text-3xl font-bold">{selectedMenu.split(' ')[0]}</p>
              {selectedMenu.includes(' ') && (
                <p className="text-sm text-muted-foreground">{selectedMenu.split(' ').slice(1).join(' ')}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={toggleFavorite}
                  variant="outline"
                  size="lg"
                  className={`flex-1 ${isFav ? 'border-destructive bg-destructive/10 text-destructive' : ''}`}
                >
                  <Heart className={`mr-2 size-4 ${isFav ? 'fill-current' : ''}`} />
                  {isFav ? '즐겨찾기 해제' : '즐겨찾기'}
                </Button>
                <Button onClick={handleShare} variant="outline" size="lg" className="flex-1">
                  <Share2 className="mr-2 size-4" />
                  공유
                </Button>
              </div>
              <div className="space-y-2 text-left">
                <p className="text-sm font-semibold">{copy.mapsTitle}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {mapSearchLinks(selectedMenu.split(' ')[0], copy.placeWord, locale).map((link) => (
                    <Button key={link.id} variant="outline" size="sm" asChild>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.id === 'kakao' ? copy.kakao : link.id === 'naver' ? copy.naver : copy.google}
                      </a>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{copy.mapsNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedMenu && !isGenerating && !battleMode && (
        <div className="my-5 sm:my-8 rounded-xl border-2 border-dashed border-border py-16 text-center text-muted-foreground">
          <Shuffle className="mx-auto mb-3 size-8 opacity-40" />
          <p className="font-medium">{copy.emptyTitle}</p>
          <p className="text-sm mt-1">{copy.emptyBody}</p>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" />
            맛집 검색
          </CardTitle>
          <CardDescription>메뉴 이름으로 웹 검색을 열어요. 위치는 보내지 않아요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="메뉴명 입력..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" size="default">
              <Search className="size-4" />
              <span className="ml-1">구글 검색</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Heart className="size-5 text-destructive" />
            즐겨찾기
          </h3>
          <Card>
            <CardContent className="p-4">
              <ul className="max-h-52 space-y-1 overflow-y-auto">
                {favorites.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                    <span className="text-sm">{item.split(' ')[0]}</span>
                    <button
                      onClick={() => setFavorites(removeFavorite(item))}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="즐겨찾기 삭제"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <History className="size-5 text-primary" />
            최근 기록
          </h3>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { clearHistory(); setHistory([]); }}
            >
              <Trash2 className="mr-1 size-3.5" />
              초기화
            </Button>
          )}
        </div>
        {history.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <ol className="max-h-52 list-decimal list-inside space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {history.map((item, i) => (
                  <li key={i} className="truncate">{item.split(' ')[0]}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">아직 기록이 없어요. 메뉴를 골라보세요!</p>
        )}
      </div>
    </div>
  );
}
