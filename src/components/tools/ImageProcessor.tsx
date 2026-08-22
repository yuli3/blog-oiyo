import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Locale } from "../../lib/i18n";
import { GameContainer } from "../ui/game/GamePrimitives";

type Mode = "optimize" | "grayscale";
type Format = "image/webp" | "image/jpeg" | "image/png";

const COPY = {
  ko: ["이미지 편집기", "압축·포맷 변환·흑백 처리를 한 화면에서 합니다.", "용량·포맷", "흑백", "이미지 선택", "다른 이미지", "결과 다운로드", "원본", "처리 결과", "품질", "저장 형식", "이미지를 고르면 원본과 결과를 바로 비교할 수 있습니다.", "올바른 이미지 파일을 선택하세요.", "이미지는 서버로 보내지 않고 이 브라우저에서만 처리합니다."],
  en: ["Image Studio", "Optimize, convert, and grayscale images in one place.", "Optimize & format", "Grayscale", "Choose image", "Choose another", "Download result", "Original", "Result", "Quality", "Output format", "Choose an image to compare the original and result.", "Please select a valid image file.", "Your image stays in this browser and is not uploaded to a server."],
  ja: ["画像スタジオ", "圧縮・形式変換・グレースケールを一画面で処理します。", "圧縮・形式", "グレースケール", "画像を選択", "別の画像", "結果をダウンロード", "元画像", "処理結果", "品質", "保存形式", "画像を選ぶと元画像と結果を比較できます。", "有効な画像ファイルを選択してください。", "画像はサーバーへ送らず、このブラウザ内だけで処理します。"],
  fr: ["Studio d'image", "Optimisez, convertissez et passez une image en gris au même endroit.", "Optimiser et convertir", "Niveaux de gris", "Choisir une image", "Choisir une autre", "Télécharger le résultat", "Original", "Résultat", "Qualité", "Format de sortie", "Choisissez une image pour comparer l'original et le résultat.", "Veuillez sélectionner une image valide.", "L'image reste dans ce navigateur et n'est pas envoyée à un serveur."],
  es: ["Estudio de imágenes", "Optimiza, convierte y pasa imágenes a gris en un solo lugar.", "Optimizar y convertir", "Escala de grises", "Seleccionar imagen", "Elegir otra", "Descargar resultado", "Original", "Resultado", "Calidad", "Formato de salida", "Elige una imagen para comparar el original y el resultado.", "Selecciona un archivo de imagen válido.", "La imagen permanece en este navegador y no se sube a un servidor."],
  zh: ["图片工作室", "在一个界面完成压缩、格式转换和灰度处理。", "压缩与格式", "灰度", "选择图片", "选择另一张", "下载结果", "原图", "处理结果", "质量", "输出格式", "选择图片后即可比较原图和处理结果。", "请选择有效的图片文件。", "图片只在此浏览器中处理，不会上传到服务器。"],
} satisfies Record<Locale, string[]>;

const EXT: Record<Format, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const bytes = (size: number) => size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1048576).toFixed(1)} MB`;

export default function ImageProcessor({ locale = "ko", initialMode = "optimize" }: { locale?: Locale; initialMode?: Mode }) {
  const t = COPY[locale] ?? COPY.en;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [source, setSource] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState(0);
  const [quality, setQuality] = useState(82);
  const [format, setFormat] = useState<Format>(initialMode === "grayscale" ? "image/png" : "image/webp");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      if (mode === "grayscale") {
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const gray = pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114;
          pixels.data[i] = gray; pixels.data[i + 1] = gray; pixels.data[i + 2] = gray;
        }
        context.putImageData(pixels, 0, 0);
      }
      const output = mode === "grayscale" ? "image/png" : format;
      canvas.toBlob((blob) => {
        if (!blob || cancelled) return;
        setResult((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return { url: URL.createObjectURL(blob), size: blob.size };
        });
      }, output, output === "image/png" ? undefined : quality / 100);
    };
    image.src = source;
    return () => { cancelled = true; };
  }, [source, mode, quality, format]);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t[12]); return; }
    setError(null); setSourceSize(file.size);
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && setSource(reader.result);
    reader.readAsDataURL(file);
  };
  const download = () => {
    if (!result) return;
    const output = mode === "grayscale" ? "image/png" : format;
    const link = document.createElement("a");
    link.href = result.url; link.download = `${mode === "grayscale" ? "grayscale" : "optimized"}-image.${EXT[output]}`; link.click();
  };
  const reset = () => { if (result) URL.revokeObjectURL(result.url); setSource(null); setResult(null); setError(null); if (inputRef.current) inputRef.current.value = ""; };
  const tab = (active: boolean) => `rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`;

  return <GameContainer title={t[0]} subtitle={t[1]} onReset={reset}>
    <div className="space-y-5">
      <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{t[13]}</p>
      <div className="flex flex-wrap gap-2"><button type="button" className={tab(mode === "optimize")} onClick={() => setMode("optimize")}>{t[2]}</button><button type="button" className={tab(mode === "grayscale")} onClick={() => setMode("grayscale")}>{t[3]}</button></div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={choose} />
      {!source ? <button type="button" className="w-full rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-12" onClick={() => inputRef.current?.click()}><span className="block font-semibold">{t[4]}</span><span className="mt-2 block text-sm text-muted-foreground">{t[11]}</span></button> : <>
        <div className="grid gap-4 md:grid-cols-2"><figure className="rounded-xl border border-border bg-card p-3"><figcaption className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t[7]}</figcaption><img src={source} alt={t[7]} className="max-h-80 w-full rounded-lg object-contain" /></figure><figure className="rounded-xl border border-border bg-card p-3"><figcaption className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t[8]}</figcaption><canvas ref={canvasRef} className="max-h-80 w-full rounded-lg object-contain" /></figure></div>
        {mode === "optimize" && <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2"><label className="text-sm font-semibold">{t[9]}: {quality}%<input className="mt-2 block w-full" type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} /></label><div><p className="text-sm font-semibold">{t[10]}</p><div className="mt-2 flex gap-2">{(Object.keys(EXT) as Format[]).map((value) => <button key={value} type="button" className={tab(format === value)} onClick={() => setFormat(value)}>{EXT[value].toUpperCase()}</button>)}</div></div></div>}
        <div className="flex flex-wrap items-center gap-3"><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" onClick={download} disabled={!result}>{t[6]}</button><button type="button" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold" onClick={() => inputRef.current?.click()}>{t[5]}</button>{result && <span className="text-sm text-muted-foreground">{bytes(sourceSize)} → {bytes(result.size)}</span>}</div>
      </>}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p>}
    </div>
  </GameContainer>;
}
