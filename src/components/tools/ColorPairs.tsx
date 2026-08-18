import { useEffect, useMemo, useState } from "react";
import catalog from "../../data/color-pairs.json";

type Locale = "ko" | "en" | "ja" | "zh" | "fr" | "es";
type Use = "fashion" | "ui";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").padStart(6, "0");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r: number, g: number, b: number) {
  return [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}
function hslToHex(h: number, s: number, l: number) {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [C, X, 0];
  else if (h < 120) [r, g, b] = [X, C, 0];
  else if (h < 180) [r, g, b] = [0, C, X];
  else if (h < 240) [r, g, b] = [0, X, C];
  else if (h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function relLum(hex: string) {
  const lin = (n: number) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string) {
  const L1 = relLum(a), L2 = relLum(b);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function cleanHex(value: string) {
  const h = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return h.toUpperCase();
}

export default function ColorPairs({ locale = "ko" }: { locale?: Locale }) {
  const lang: "en" | "ko" = locale === "ko" ? "ko" : "en";
  const [a, setA] = useState("808080");
  const [b, setB] = useState("F5F5F5");
  const [use, setUse] = useState<Use>("fashion");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qa = cleanHex(q.get("a") ?? "");
    const qb = cleanHex(q.get("b") ?? "");
    if (qa.length === 6) setA(qa);
    if (qb.length === 6) setB(qb);
    if (q.get("use") === "ui") setUse("ui");
  }, []);

  const ratio = useMemo(() => contrast(a, b), [a, b]);
  const suggestions = useMemo(() => {
    const hsl = hexToHsl(a);
    return [
      { id: "comp", hex: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l), label: lang === "ko" ? "보색" : "Complement" },
      { id: "analog", hex: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l), label: lang === "ko" ? "유사색" : "Analogous" },
      { id: "split", hex: hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l), label: lang === "ko" ? "분할보색" : "Split" },
    ];
  }, [a, lang]);
  const match = catalog.pairs.find((row) => row.a === a && row.b === b);

  const apply = (nextA: string, nextB: string, nextUse = use) => {
    setA(nextA);
    setB(nextB);
    setUse(nextUse);
    const url = new URL(window.location.href);
    url.searchParams.set("a", nextA);
    url.searchParams.set("b", nextB);
    url.searchParams.set("use", nextUse);
    window.history.replaceState({}, "", url);
  };
  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[{ key: "a", value: a, set: setA }, { key: "b", value: b, set: setB }].map((well) => (
          <label key={well.key} className="block text-sm font-bold text-slate-700">
            {well.key.toUpperCase()}
            <span className="mt-2 flex items-center gap-3">
              <input type="color" value={`#${well.value}`} onChange={(event) => apply(well.key === "a" ? cleanHex(event.target.value) : a, well.key === "b" ? cleanHex(event.target.value) : b)} className="h-12 w-16 cursor-pointer rounded-xl border" />
              <input value={well.value} maxLength={6} onChange={(event) => well.set(cleanHex(event.target.value))} className="h-12 flex-1 rounded-xl border px-3 font-mono uppercase" />
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        {(["fashion", "ui"] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => apply(a, b, mode)} className={`min-h-11 rounded-full px-4 text-sm font-black ${use === mode ? "bg-slate-900 text-white" : "border bg-white"}`}>{mode === "fashion" ? (lang === "ko" ? "패션" : "Fashion") : "UI"}</button>
        ))}
      </div>
      {use === "fashion" ? (
        <div className="overflow-hidden rounded-3xl border">
          <div className="grid h-40 grid-cols-2">
            <div style={{ background: `#${a}` }} />
            <div style={{ background: `#${b}` }} />
          </div>
          <div className="flex h-10">
            <div className="flex-1" style={{ background: `#${a}` }} />
            <div className="flex-1" style={{ background: `#${b}` }} />
            <div className="flex-1" style={{ background: `#${a}` }} />
            <div className="flex-1" style={{ background: `#${b}` }} />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border p-6" style={{ background: `#${a}`, color: `#${b}` }}>
          <p className="text-2xl font-black">Aa</p>
          <p className="mt-2 text-sm">{lang === "ko" ? "본문처럼 읽히는지 보세요." : "See if this reads as body text."}</p>
          <button type="button" className="mt-4 rounded-full px-4 py-2 text-sm font-black" style={{ background: `#${b}`, color: `#${a}` }}>{lang === "ko" ? "버튼" : "Button"}</button>
          <p className="mt-3 text-xs font-mono">contrast {ratio.toFixed(2)} {ratio >= 4.5 ? "AA body" : ratio >= 3 ? "AA large" : "fail"}</p>
        </div>
      )}
      <p className="text-sm leading-6 text-slate-600">{match ? (match.mood[lang] ?? match.mood.en) : (lang === "ko" ? "큐레이션 밖의 짝입니다. 취향·참고." : "Not in the curated list. Taste, not science.")}</p>
      <div className="flex flex-wrap gap-2">
        {catalog.pairs.map((row) => (
          <button key={row.id} type="button" onClick={() => apply(row.a, row.b)} className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold">
            <span className="h-4 w-4 rounded-full" style={{ background: `#${row.a}` }} />
            <span className="h-4 w-4 rounded-full" style={{ background: `#${row.b}` }} />
            {row.name[lang] ?? row.name.en}
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{lang === "ko" ? "자동 제안" : "Auto suggestions"}</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((row) => (
            <button key={row.id} type="button" onClick={() => apply(a, row.hex)} className="rounded-full border px-3 py-2 text-xs font-bold">
              <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: `#${row.hex}` }} />
              {row.label} #{row.hex}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyText(`#${a} / #${b}`, "hex")} className="min-h-11 rounded-xl border px-4 text-sm font-bold">#{a} / #{b}</button>
        <button type="button" onClick={() => void copyText(`background:#${a};color:#${b};`, "css")} className="min-h-11 rounded-xl border px-4 text-sm font-bold">CSS</button>
        <button type="button" onClick={() => void copyText(window.location.href, "url")} className="min-h-11 rounded-xl border px-4 text-sm font-bold">{lang === "ko" ? "공유 URL" : "Share URL"}</button>
        {copied && <span className="self-center text-xs font-bold text-green-700">{copied}</span>}
      </div>
    </div>
  );
}
