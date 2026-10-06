import { useEffect, useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { fitToBytes, formatBytes, isHeic, outputName } from "../../lib/image-fit";

/**
 * Convert and compress images in the browser: HEIC, WebP, PNG and JPG in; JPG, WebP or
 * PNG out; several files at once; by quality or down to a size in KB.
 *
 * Nothing is uploaded. Decoding and encoding use the browser's own canvas, HEIC files are
 * decoded by a library that is downloaded only when a HEIC file is added (it is 1.3 MB),
 * and the zip is built in memory. That is the point of the tool: photos are the kind of
 * file people should not have to hand to a server to change a format. 2026-10-07
 */
type Format = "image/jpeg" | "image/webp" | "image/png";
type Mode = "quality" | "size";
type Status = "waiting" | "working" | "done" | "error";
interface Item { id: number; file: File; status: Status; out?: Blob; url?: string; width?: number; height?: number; met?: boolean }

const EXT: Record<Format, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };
const SIDES = [0, 2560, 1920, 1280, 800] as const;
const MAX_FILES = 30;

const COPY: Record<Locale, {
  title: string; drop: string; pick: string; accepts: string; format: string;
  mode: string; byQuality: string; bySize: string; quality: string; target: string;
  side: string; original: string; sidePx: string; pngNote: string;
  convert: string; working: string; saveAll: string; save: string; remove: string; clear: string;
  waiting: string; failed: string; saved: string; bigger: string; notMet: string; tooMany: string; heicLoading: string;
  total: string;
}> = {
  ko: {
    title: "이미지 변환·압축", drop: "여기에 이미지를 끌어다 놓거나", pick: "파일 고르기", accepts: "HEIC · WebP · PNG · JPG, 한 번에 30장까지", format: "저장 형식",
    mode: "압축 방식", byQuality: "화질로 정하기", bySize: "용량에 맞추기", quality: "화질", target: "목표 용량 (KB)",
    side: "긴 변 크기", original: "원본 그대로", sidePx: "{n}px 이하", pngNote: "PNG는 화질을 낮추지 않는 형식이라 크기만 줄일 수 있어요.",
    convert: "변환하기", working: "변환하는 중…", saveAll: "모두 저장 (ZIP)", save: "저장", remove: "빼기", clear: "모두 지우기",
    waiting: "대기 중", failed: "이 파일은 읽지 못했어요", saved: "{p}% 줄었어요", bigger: "원본보다 커졌어요", notMet: "목표 용량까지는 줄이지 못했어요", tooMany: "한 번에 30장까지 넣을 수 있어요.", heicLoading: "HEIC 해석 도구를 불러오는 중…",
    total: "합계 {a} → {b}",
  },
  en: {
    title: "Image Converter and Compressor", drop: "Drop images here, or", pick: "Choose files", accepts: "HEIC · WebP · PNG · JPG, up to 30 at a time", format: "Save as",
    mode: "Compression", byQuality: "Set the quality", bySize: "Fit a file size", quality: "Quality", target: "Target size (KB)",
    side: "Longest side", original: "Keep original", sidePx: "Up to {n}px", pngNote: "PNG does not lose quality, so only the dimensions can make it smaller.",
    convert: "Convert", working: "Converting…", saveAll: "Save all (ZIP)", save: "Save", remove: "Remove", clear: "Clear all",
    waiting: "Waiting", failed: "This file could not be read", saved: "{p}% smaller", bigger: "Larger than the original", notMet: "Could not reach the target size", tooMany: "Up to 30 files at a time.", heicLoading: "Loading the HEIC decoder…",
    total: "Total {a} → {b}",
  },
  ja: {
    title: "画像変換・圧縮", drop: "ここに画像をドラッグするか", pick: "ファイルを選ぶ", accepts: "HEIC・WebP・PNG・JPG、一度に30枚まで", format: "保存形式",
    mode: "圧縮方法", byQuality: "画質で決める", bySize: "容量に合わせる", quality: "画質", target: "目標容量 (KB)",
    side: "長辺のサイズ", original: "元のまま", sidePx: "{n}px以下", pngNote: "PNGは画質を落とさない形式なので、サイズを小さくすることしかできません。",
    convert: "変換する", working: "変換中…", saveAll: "すべて保存 (ZIP)", save: "保存", remove: "外す", clear: "すべて消す",
    waiting: "待機中", failed: "このファイルは読み込めませんでした", saved: "{p}% 小さくなりました", bigger: "元より大きくなりました", notMet: "目標容量までは小さくできませんでした", tooMany: "一度に入れられるのは30枚までです。", heicLoading: "HEICデコーダーを読み込み中…",
    total: "合計 {a} → {b}",
  },
  zh: {
    title: "图片转换·压缩", drop: "把图片拖到这里，或", pick: "选择文件", accepts: "HEIC · WebP · PNG · JPG，一次最多30张", format: "保存格式",
    mode: "压缩方式", byQuality: "按画质", bySize: "按目标大小", quality: "画质", target: "目标大小 (KB)",
    side: "长边尺寸", original: "保持原样", sidePx: "不超过{n}px", pngNote: "PNG是无损格式，只能通过缩小尺寸来减小体积。",
    convert: "开始转换", working: "转换中…", saveAll: "全部保存 (ZIP)", save: "保存", remove: "移除", clear: "全部清除",
    waiting: "等待中", failed: "无法读取这个文件", saved: "缩小了{p}%", bigger: "比原图更大", notMet: "无法压到目标大小", tooMany: "一次最多放入30张。", heicLoading: "正在加载HEIC解码器…",
    total: "合计 {a} → {b}",
  },
  fr: {
    title: "Convertisseur et compresseur d’images", drop: "Déposez des images ici, ou", pick: "Choisir des fichiers", accepts: "HEIC · WebP · PNG · JPG, jusqu’à 30 à la fois", format: "Format de sortie",
    mode: "Compression", byQuality: "Régler la qualité", bySize: "Viser un poids", quality: "Qualité", target: "Poids visé (Ko)",
    side: "Plus grand côté", original: "Garder l’original", sidePx: "Jusqu’à {n}px", pngNote: "Le PNG ne perd pas en qualité : seules les dimensions peuvent le réduire.",
    convert: "Convertir", working: "Conversion…", saveAll: "Tout enregistrer (ZIP)", save: "Enregistrer", remove: "Retirer", clear: "Tout effacer",
    waiting: "En attente", failed: "Ce fichier n’a pas pu être lu", saved: "{p} % de moins", bigger: "Plus lourd que l’original", notMet: "Poids visé impossible à atteindre", tooMany: "30 fichiers au maximum à la fois.", heicLoading: "Chargement du décodeur HEIC…",
    total: "Total {a} → {b}",
  },
  es: {
    title: "Conversor y compresor de imágenes", drop: "Suelta imágenes aquí, o", pick: "Elegir archivos", accepts: "HEIC · WebP · PNG · JPG, hasta 30 a la vez", format: "Guardar como",
    mode: "Compresión", byQuality: "Elegir la calidad", bySize: "Ajustar a un tamaño", quality: "Calidad", target: "Tamaño objetivo (KB)",
    side: "Lado más largo", original: "Mantener el original", sidePx: "Hasta {n}px", pngNote: "El PNG no pierde calidad, así que solo se puede reducir cambiando las dimensiones.",
    convert: "Convertir", working: "Convirtiendo…", saveAll: "Guardar todo (ZIP)", save: "Guardar", remove: "Quitar", clear: "Borrar todo",
    waiting: "En espera", failed: "No se pudo leer este archivo", saved: "{p} % más pequeño", bigger: "Más grande que el original", notMet: "No se pudo llegar al tamaño objetivo", tooMany: "Hasta 30 archivos a la vez.", heicLoading: "Cargando el decodificador HEIC…",
    total: "Total {a} → {b}",
  },
};

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Draws the bitmap at a scale and encodes it. JPEG has no transparency, so it gets a white ground. */
function encode(bitmap: ImageBitmap, scale: number, format: Format, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas"));
  if (format === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), format, format === "image/png" ? undefined : quality));
}

export default function ImageConverter({ locale = "ko" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [mode, setMode] = useState<Mode>("quality");
  const [quality, setQuality] = useState(80);
  const [targetKb, setTargetKb] = useState(200);
  const [side, setSide] = useState<(typeof SIDES)[number]>(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [over, setOver] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => { for (const item of itemsRef.current) if (item.url) URL.revokeObjectURL(item.url); }, []);

  const add = (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = MAX_FILES - itemsRef.current.length;
    if (list.length > room) setNotice(t.tooMany);
    setItems((prev) => [...prev, ...list.slice(0, Math.max(0, room)).map((file) => ({ id: nextId.current++, file, status: "waiting" as Status }))]);
  };
  const patch = (id: number, change: Partial<Item>) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const remove = (id: number) => setItems((prev) => prev.filter((item) => { if (item.id === id && item.url) URL.revokeObjectURL(item.url); return item.id !== id; }));
  const clear = () => { for (const item of itemsRef.current) if (item.url) URL.revokeObjectURL(item.url); setItems([]); setNotice(""); };

  const decode = async (file: File): Promise<ImageBitmap> => {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    let source: Blob = file;
    if (isHeic(file.name, file.type, head)) {
      setNotice(t.heicLoading);
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({ blob: file, toType: "image/png" });
      source = Array.isArray(converted) ? converted[0] : converted;
      setNotice("");
    }
    return createImageBitmap(source, { imageOrientation: "from-image" });
  };

  const convert = async () => {
    if (busy) return;
    setBusy(true);
    for (const item of itemsRef.current) {
      patch(item.id, { status: "working" });
      try {
        const bitmap = await decode(item.file);
        const longest = Math.max(bitmap.width, bitmap.height);
        const base = side > 0 && longest > side ? side / longest : 1;
        let out: Blob;
        let scale = base;
        let met = true;
        if (mode === "size" && format !== "image/png") {
          const fit = await fitToBytes(async (q, s) => (await encode(bitmap, base * s, format, q)).size, Math.max(1, targetKb) * 1024);
          scale = base * fit.scale;
          met = fit.met;
          out = await encode(bitmap, scale, format, fit.quality);
        } else {
          out = await encode(bitmap, base, format, quality / 100);
        }
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        bitmap.close();
        const previous = itemsRef.current.find((entry) => entry.id === item.id)?.url;
        if (previous) URL.revokeObjectURL(previous);
        patch(item.id, { status: "done", out, url: URL.createObjectURL(out), width, height, met });
      } catch {
        setNotice("");
        patch(item.id, { status: "error", out: undefined });
      }
    }
    setBusy(false);
  };

  const saveAll = async () => {
    const done = itemsRef.current.filter((item) => item.out);
    if (done.length === 0) return;
    const { zipSync } = await import("fflate");
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    const used = new Set<string>();
    for (const item of done) {
      let name = outputName(item.file.name, EXT[format]);
      for (let n = 2; used.has(name); n++) name = outputName(item.file.name, EXT[format]).replace(/(\.[^.]+)$/, `-${n}$1`);
      used.add(name);
      // Already-compressed images gain nothing from deflate; storing keeps a 30-photo zip instant.
      files[name] = [new Uint8Array(await item.out!.arrayBuffer()), { level: 0 }];
    }
    download(new Blob([zipSync(files)], { type: "application/zip" }), "images.zip");
  };

  const done = items.filter((item) => item.out);
  const before = done.reduce((sum, item) => sum + item.file.size, 0);
  const after = done.reduce((sum, item) => sum + (item.out?.size ?? 0), 0);
  const field = "mt-1 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const label = "block text-sm font-semibold text-foreground";
  const btn = "min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">{t.title}</h1>

      <div
        className={`mt-4 grid place-items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center ${over ? "border-primary bg-primary/10" : "border-border bg-muted"}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}
      >
        <p className="text-sm text-muted-foreground">{t.drop}</p>
        <button type="button" className={`${btn} border-primary bg-primary text-primary-foreground`} onClick={() => inputRef.current?.click()}>{t.pick}</button>
        <p className="text-xs text-muted-foreground">{t.accepts}</p>
        <input ref={inputRef} type="file" multiple accept="image/*,.heic,.heif" className="sr-only" aria-label={t.pick}
          onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ""; }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={label}>{t.format}
          <select className={field} value={format} onChange={(e) => setFormat(e.target.value as Format)}>
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <label className={label}>{t.side}
          <select className={field} value={side} onChange={(e) => setSide(Number(e.target.value) as (typeof SIDES)[number])}>
            {SIDES.map((s) => <option key={s} value={s}>{s === 0 ? t.original : t.sidePx.replace("{n}", String(s))}</option>)}
          </select>
        </label>
        {format === "image/png" ? (
          <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">{t.pngNote}</p>
        ) : (
          <>
            <label className={label}>{t.mode}
              <select className={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="quality">{t.byQuality}</option>
                <option value="size">{t.bySize}</option>
              </select>
            </label>
            {mode === "quality" ? (
              <label className={label}>{t.quality} {quality}
                <input type="range" min={10} max={95} step={5} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-3 block w-full" />
              </label>
            ) : (
              <label className={label}>{t.target}
                <input type="number" inputMode="numeric" min={5} max={20000} className={field} value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value) || 0)} />
              </label>
            )}
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button type="button" className={`${btn} border-primary bg-primary text-primary-foreground`} disabled={items.length === 0 || busy} onClick={() => void convert()}>{busy ? t.working : t.convert}</button>
        <button type="button" className={btn} disabled={done.length === 0 || busy} onClick={() => void saveAll()}>{t.saveAll}</button>
        <button type="button" className={`${btn} col-span-2 sm:col-span-1`} disabled={items.length === 0 || busy} onClick={clear}>{t.clear}</button>
      </div>

      <p className="mt-2 min-h-5 text-center text-xs text-muted-foreground" role="status" aria-live="polite">
        {notice || (done.length > 0 ? t.total.replace("{a}", formatBytes(before)).replace("{b}", formatBytes(after)) : "")}
      </p>

      {items.length > 0 ? (
        <ul className="mt-2 grid gap-2">
          {items.map((item) => {
            const percent = item.out ? Math.round((1 - item.out.size / item.file.size) * 100) : 0;
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                  {item.url ? <img src={item.url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">{EXT[format].toUpperCase()}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.file.name}</p>
                  <p className={`text-xs ${item.status === "error" || (item.out && item.met === false) ? "text-destructive" : "text-muted-foreground"}`}>
                    {item.status === "waiting" ? `${formatBytes(item.file.size)} · ${t.waiting}` : null}
                    {item.status === "working" ? t.working : null}
                    {item.status === "error" ? t.failed : null}
                    {item.status === "done" && item.out ? `${formatBytes(item.file.size)} → ${formatBytes(item.out.size)} · ${item.width}×${item.height} · ${item.met === false ? t.notMet : percent > 0 ? t.saved.replace("{p}", String(percent)) : t.bigger}` : null}
                  </p>
                </div>
                {item.out ? <button type="button" className={btn} onClick={() => download(item.out!, outputName(item.file.name, EXT[format]))}>{t.save}</button> : null}
                <button type="button" className={btn} disabled={busy} onClick={() => remove(item.id)} aria-label={`${t.remove} ${item.file.name}`}>×</button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
