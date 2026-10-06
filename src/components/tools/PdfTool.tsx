import { useRef, useState } from "react";
import type { Locale } from "../../lib/i18n";
import { baseName, everyN, everyPage, pagesOf, parsePageRanges, rangeLabel, type PageRange } from "../../lib/pdf-ranges";

/**
 * Merge PDFs and split a PDF, in the browser.
 *
 * PDFs are contracts, payslips and ID scans: the files people are least willing to upload
 * to a stranger's server, and the usual online tools require exactly that. Here the file
 * is read from disk into memory, rewritten by pdf-lib (downloaded on first use), and saved
 * back. Pages are copied as they are, so text stays selectable and nothing is re-rendered.
 * 2026-10-07
 */
type Tab = "merge" | "split";
type SplitMode = "ranges" | "each" | "every";
interface Doc { id: number; file: File; pages: number }

const MAX_FILES = 30;

const COPY: Record<Locale, {
  title: string; tabs: Record<Tab, string>; drop: string; pick: string; pickOne: string;
  pagesN: string; up: string; down: string; remove: string; clear: string;
  merge: string; mergeNeed: string; working: string; done: string;
  splitHow: string; modes: Record<SplitMode, string>; ranges: string; rangesHint: string; chunk: string; split: string;
  errors: { empty: string; syntax: string; "out-of-range": string }; encrypted: string; unreadable: string; tooMany: string;
  result: string;
}> = {
  ko: {
    title: "PDF 합치기·나누기", tabs: { merge: "합치기", split: "나누기" }, drop: "PDF를 여기에 끌어다 놓거나", pick: "PDF 고르기", pickOne: "나눌 PDF 고르기",
    pagesN: "{n}쪽", up: "위로", down: "아래로", remove: "빼기", clear: "모두 지우기",
    merge: "이 순서로 합치기", mergeNeed: "PDF를 두 개 이상 넣어 주세요.", working: "처리하는 중…", done: "저장했어요",
    splitHow: "나누는 방법", modes: { ranges: "범위를 직접 적기", each: "한 쪽씩 모두 나누기", every: "몇 쪽씩 묶어 나누기" }, ranges: "쪽 범위", rangesHint: "예: 1-3, 5, 8-10 → 파일 세 개가 만들어져요", chunk: "묶을 쪽 수", split: "나누기",
    errors: { empty: "쪽 범위를 적어 주세요.", syntax: "'{part}'은 읽을 수 없어요. 1-3, 5처럼 적어 주세요.", "out-of-range": "'{part}'은 이 문서의 쪽 수({n}쪽)를 벗어나요." },
    encrypted: "암호가 걸린 PDF는 처리할 수 없어요. 암호를 푼 파일을 넣어 주세요.", unreadable: "읽을 수 없는 PDF예요.", tooMany: "한 번에 30개까지 넣을 수 있어요.",
    result: "{n}개 파일을 만들었어요",
  },
  en: {
    title: "Merge and Split PDF", tabs: { merge: "Merge", split: "Split" }, drop: "Drop PDFs here, or", pick: "Choose PDFs", pickOne: "Choose a PDF to split",
    pagesN: "{n} pages", up: "Up", down: "Down", remove: "Remove", clear: "Clear all",
    merge: "Merge in this order", mergeNeed: "Add at least two PDFs.", working: "Working…", done: "Saved",
    splitHow: "How to split", modes: { ranges: "Type the ranges", each: "Every page separately", every: "In groups of pages" }, ranges: "Page ranges", rangesHint: "Example: 1-3, 5, 8-10 makes three files", chunk: "Pages per file", split: "Split",
    errors: { empty: "Type the page ranges.", syntax: "\"{part}\" could not be read. Write it like 1-3, 5.", "out-of-range": "\"{part}\" is outside this document ({n} pages)." },
    encrypted: "Password-protected PDFs cannot be processed. Add a copy with the password removed.", unreadable: "This PDF could not be read.", tooMany: "Up to 30 files at a time.",
    result: "{n} files created",
  },
  ja: {
    title: "PDF結合・分割", tabs: { merge: "結合", split: "分割" }, drop: "ここにPDFをドラッグするか", pick: "PDFを選ぶ", pickOne: "分割するPDFを選ぶ",
    pagesN: "{n}ページ", up: "上へ", down: "下へ", remove: "外す", clear: "すべて消す",
    merge: "この順番で結合", mergeNeed: "PDFを2つ以上入れてください。", working: "処理中…", done: "保存しました",
    splitHow: "分割方法", modes: { ranges: "範囲を入力する", each: "1ページずつすべて分ける", every: "数ページずつまとめて分ける" }, ranges: "ページ範囲", rangesHint: "例: 1-3, 5, 8-10 → 3つのファイルができます", chunk: "まとめるページ数", split: "分割",
    errors: { empty: "ページ範囲を入力してください。", syntax: "「{part}」は読み取れません。1-3, 5 のように入力してください。", "out-of-range": "「{part}」はこの文書のページ数({n}ページ)を超えています。" },
    encrypted: "パスワード付きのPDFは処理できません。パスワードを解除したファイルを入れてください。", unreadable: "読み込めないPDFです。", tooMany: "一度に入れられるのは30個までです。",
    result: "{n}個のファイルを作りました",
  },
  zh: {
    title: "PDF合并·拆分", tabs: { merge: "合并", split: "拆分" }, drop: "把PDF拖到这里，或", pick: "选择PDF", pickOne: "选择要拆分的PDF",
    pagesN: "{n}页", up: "上移", down: "下移", remove: "移除", clear: "全部清除",
    merge: "按此顺序合并", mergeNeed: "请至少放入两个PDF。", working: "处理中…", done: "已保存",
    splitHow: "拆分方式", modes: { ranges: "手动填写范围", each: "每页单独拆开", every: "每几页拆成一份" }, ranges: "页码范围", rangesHint: "例如：1-3, 5, 8-10 → 会生成三个文件", chunk: "每份页数", split: "拆分",
    errors: { empty: "请填写页码范围。", syntax: "无法识别“{part}”。请按 1-3, 5 的形式填写。", "out-of-range": "“{part}”超出了本文档的页数({n}页)。" },
    encrypted: "无法处理加密的PDF。请放入已解除密码的文件。", unreadable: "无法读取这个PDF。", tooMany: "一次最多放入30个。",
    result: "已生成{n}个文件",
  },
  fr: {
    title: "Fusionner et diviser un PDF", tabs: { merge: "Fusionner", split: "Diviser" }, drop: "Déposez des PDF ici, ou", pick: "Choisir des PDF", pickOne: "Choisir un PDF à diviser",
    pagesN: "{n} pages", up: "Monter", down: "Descendre", remove: "Retirer", clear: "Tout effacer",
    merge: "Fusionner dans cet ordre", mergeNeed: "Ajoutez au moins deux PDF.", working: "Traitement…", done: "Enregistré",
    splitHow: "Méthode de division", modes: { ranges: "Saisir les plages", each: "Chaque page séparément", every: "Par groupes de pages" }, ranges: "Plages de pages", rangesHint: "Exemple : 1-3, 5, 8-10 donne trois fichiers", chunk: "Pages par fichier", split: "Diviser",
    errors: { empty: "Saisissez les plages de pages.", syntax: "« {part} » est illisible. Écrivez par exemple 1-3, 5.", "out-of-range": "« {part} » dépasse ce document ({n} pages)." },
    encrypted: "Les PDF protégés par mot de passe ne peuvent pas être traités. Ajoutez une copie sans mot de passe.", unreadable: "Ce PDF est illisible.", tooMany: "30 fichiers au maximum à la fois.",
    result: "{n} fichiers créés",
  },
  es: {
    title: "Unir y dividir PDF", tabs: { merge: "Unir", split: "Dividir" }, drop: "Suelta los PDF aquí, o", pick: "Elegir PDF", pickOne: "Elegir un PDF para dividir",
    pagesN: "{n} páginas", up: "Subir", down: "Bajar", remove: "Quitar", clear: "Borrar todo",
    merge: "Unir en este orden", mergeNeed: "Añade al menos dos PDF.", working: "Procesando…", done: "Guardado",
    splitHow: "Cómo dividir", modes: { ranges: "Escribir los rangos", each: "Cada página por separado", every: "En grupos de páginas" }, ranges: "Rangos de páginas", rangesHint: "Ejemplo: 1-3, 5, 8-10 crea tres archivos", chunk: "Páginas por archivo", split: "Dividir",
    errors: { empty: "Escribe los rangos de páginas.", syntax: "No se pudo leer «{part}». Escríbelo como 1-3, 5.", "out-of-range": "«{part}» queda fuera de este documento ({n} páginas)." },
    encrypted: "No se pueden procesar PDF protegidos con contraseña. Añade una copia sin contraseña.", unreadable: "No se pudo leer este PDF.", tooMany: "Hasta 30 archivos a la vez.",
    result: "{n} archivos creados",
  },
};

function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isEncrypted = (error: unknown) => /encrypt/i.test(String((error as Error)?.message ?? error));

export default function PdfTool({ locale = "ko" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [tab, setTab] = useState<Tab>("merge");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [single, setSingle] = useState<Doc | null>(null);
  const [mode, setMode] = useState<SplitMode>("ranges");
  const [rangeText, setRangeText] = useState("");
  const [chunk, setChunk] = useState(5);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [bad, setBad] = useState(false);
  const [over, setOver] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (text: string, error = false) => { setNotice(text); setBad(error); };

  /** Reads the page count, which also proves the file opens. */
  const open = async (file: File): Promise<Doc | null> => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      return { id: nextId.current++, file, pages: pdf.getPageCount() };
    } catch (error) {
      say(`${file.name}: ${isEncrypted(error) ? t.encrypted : t.unreadable}`, true);
      return null;
    }
  };

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name));
    if (list.length === 0) return;
    setBusy(true);
    say("");
    if (tab === "split") {
      const doc = await open(list[0]);
      if (doc) setSingle(doc);
    } else {
      const room = MAX_FILES - docs.length;
      if (list.length > room) say(t.tooMany, true);
      const opened: Doc[] = [];
      for (const file of list.slice(0, Math.max(0, room))) { const doc = await open(file); if (doc) opened.push(doc); }
      setDocs((prev) => [...prev, ...opened]);
    }
    setBusy(false);
  };

  const move = (index: number, by: number) => setDocs((prev) => {
    const next = [...prev];
    const to = index + by;
    if (to < 0 || to >= next.length) return prev;
    [next[index], next[to]] = [next[to], next[index]];
    return next;
  });

  const merge = async () => {
    if (docs.length < 2) { say(t.mergeNeed, true); return; }
    setBusy(true);
    say(t.working);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const doc of docs) {
        const source = await PDFDocument.load(await doc.file.arrayBuffer());
        for (const page of await out.copyPages(source, source.getPageIndices())) out.addPage(page);
      }
      download(await out.save(), "merged.pdf", "application/pdf");
      say(t.done);
    } catch (error) {
      say(isEncrypted(error) ? t.encrypted : t.unreadable, true);
    }
    setBusy(false);
  };

  const split = async () => {
    if (!single) return;
    let ranges: PageRange[];
    if (mode === "each") ranges = everyPage(single.pages);
    else if (mode === "every") ranges = everyN(single.pages, chunk);
    else {
      const parsed = parsePageRanges(rangeText, single.pages);
      if (!parsed.ok) { say(t.errors[parsed.error].replace("{part}", parsed.part ?? "").replace("{n}", String(single.pages)), true); return; }
      ranges = parsed.ranges;
    }
    setBusy(true);
    say(t.working);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await single.file.arrayBuffer());
      const name = baseName(single.file.name);
      const files: Record<string, Uint8Array> = {};
      for (const range of ranges) {
        const out = await PDFDocument.create();
        // The library counts pages from 0; ranges are written from 1.
        for (const page of await out.copyPages(source, pagesOf(range).map((n) => n - 1))) out.addPage(page);
        let file = `${name}_${rangeLabel(range)}.pdf`;
        for (let n = 2; files[file]; n++) file = `${name}_${rangeLabel(range)}_${n}.pdf`;
        files[file] = await out.save();
      }
      const names = Object.keys(files);
      if (names.length === 1) download(files[names[0]], names[0], "application/pdf");
      else {
        const { zipSync } = await import("fflate");
        download(zipSync(files, { level: 0 }), `${name}_split.zip`, "application/zip");
      }
      say(t.result.replace("{n}", String(names.length)));
    } catch (error) {
      say(isEncrypted(error) ? t.encrypted : t.unreadable, true);
    }
    setBusy(false);
  };

  const field = "mt-1 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const label = "block text-sm font-semibold text-foreground";
  const btn = "min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const primary = `${btn} border-primary bg-primary text-primary-foreground`;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">{t.title}</h1>

      <div className="mt-4 flex gap-2" role="tablist" aria-label={t.title}>
        {(["merge", "split"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); say(""); }}
            className={`min-h-11 rounded-full border px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tab === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-foreground"}`}>
            {t.tabs[k]}
          </button>
        ))}
      </div>

      <div
        className={`mt-4 grid place-items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center ${over ? "border-primary bg-primary/10" : "border-border bg-muted"}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void add(e.dataTransfer.files); }}
      >
        <p className="text-sm text-muted-foreground">{t.drop}</p>
        <button type="button" className={primary} disabled={busy} onClick={() => inputRef.current?.click()}>{tab === "merge" ? t.pick : t.pickOne}</button>
        <input ref={inputRef} type="file" multiple={tab === "merge"} accept="application/pdf,.pdf" className="sr-only" aria-label={tab === "merge" ? t.pick : t.pickOne}
          onChange={(e) => { if (e.target.files?.length) void add(e.target.files); e.target.value = ""; }} />
      </div>

      {tab === "merge" ? (
        <>
          {docs.length > 0 ? (
            <ol className="mt-4 grid gap-2">
              {docs.map((doc, index) => (
                <li key={doc.id} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-black text-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{doc.file.name}</p>
                    <p className="text-xs text-muted-foreground">{t.pagesN.replace("{n}", String(doc.pages))}</p>
                  </div>
                  <button type="button" className={btn} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`${t.up} ${doc.file.name}`}>↑</button>
                  <button type="button" className={btn} disabled={busy || index === docs.length - 1} onClick={() => move(index, 1)} aria-label={`${t.down} ${doc.file.name}`}>↓</button>
                  <button type="button" className={btn} disabled={busy} onClick={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))} aria-label={`${t.remove} ${doc.file.name}`}>×</button>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className={primary} disabled={busy || docs.length < 2} onClick={() => void merge()}>{busy ? t.working : t.merge}</button>
            <button type="button" className={btn} disabled={busy || docs.length === 0} onClick={() => { setDocs([]); say(""); }}>{t.clear}</button>
          </div>
        </>
      ) : (
        <>
          {single ? (
            <div className="mt-4 rounded-xl border border-border bg-background p-3">
              <p className="truncate text-sm font-semibold text-foreground">{single.file.name}</p>
              <p className="text-xs text-muted-foreground">{t.pagesN.replace("{n}", String(single.pages))}</p>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={label}>{t.splitHow}
              <select className={field} value={mode} onChange={(e) => setMode(e.target.value as SplitMode)}>
                {(["ranges", "each", "every"] as const).map((m) => <option key={m} value={m}>{t.modes[m]}</option>)}
              </select>
            </label>
            {mode === "ranges" ? (
              <label className={label}>{t.ranges}
                <input className={field} value={rangeText} onChange={(e) => setRangeText(e.target.value)} placeholder="1-3, 5, 8-10" inputMode="text" />
                <span className="mt-1 block text-xs font-normal text-muted-foreground">{t.rangesHint}</span>
              </label>
            ) : null}
            {mode === "every" ? (
              <label className={label}>{t.chunk}
                <input type="number" inputMode="numeric" min={1} max={500} className={field} value={chunk} onChange={(e) => setChunk(Number(e.target.value) || 1)} />
              </label>
            ) : null}
          </div>
          <button type="button" className={`${primary} mt-4 w-full`} disabled={busy || !single} onClick={() => void split()}>{busy ? t.working : t.split}</button>
        </>
      )}

      <p className={`mt-3 min-h-5 text-center text-sm ${bad ? "text-destructive" : "text-muted-foreground"}`} role="status" aria-live="polite">{notice}</p>
    </div>
  );
}
