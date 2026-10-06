import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { Locale } from "../../lib/i18n";
import { QR_MAX_BYTES, emailPayload, qrByteLength, qrFits, wifiPayload, type QrKind, type QrLevel, type WifiSecurity } from "../../lib/qr-payload";

/**
 * QR code generator. Everything is drawn in the browser by the `qrcode` package: the
 * text, the Wi-Fi password and the image never leave the page, which is the reason to
 * use this instead of a hosted generator that keeps the link behind its own redirect.
 * The codes are static: they hold the content itself and do not expire. 2026-10-07
 */
const COPY: Record<Locale, {
  title: string; kinds: Record<QrKind, string>;
  text: string; textHint: string;
  ssid: string; password: string; security: string; open: string; hidden: string;
  to: string; subject: string; body: string;
  options: string; size: string; level: string; levels: Record<QrLevel, string>; fg: string; bg: string;
  empty: string; tooLong: string; bytes: string;
  png: string; svg: string; copy: string; copied: string; copyFail: string; alt: string; contrast: string;
}> = {
  ko: {
    title: "QR 코드 생성기", kinds: { text: "링크·글자", wifi: "와이파이", email: "이메일" },
    text: "링크나 글자", textHint: "https:// 로 시작하면 찍었을 때 바로 열려요",
    ssid: "와이파이 이름 (SSID)", password: "비밀번호", security: "보안 방식", open: "비밀번호 없음", hidden: "숨겨진 네트워크",
    to: "받는 사람 이메일", subject: "제목", body: "내용",
    options: "모양 설정", size: "크기", level: "오류 복원", levels: { L: "낮음 7%", M: "보통 15%", Q: "높음 25%", H: "최고 30%" }, fg: "코드 색", bg: "바탕 색",
    empty: "내용을 입력하면 QR 코드가 여기에 나와요.", tooLong: "내용이 너무 길어요. 이 복원 수준에서는 {max}바이트까지 담을 수 있어요.", bytes: "{n}바이트",
    png: "PNG 저장", svg: "SVG 저장", copy: "이미지 복사", copied: "복사했어요", copyFail: "이 브라우저에서는 복사가 안 돼요. PNG로 저장해 주세요.", alt: "만들어진 QR 코드",
    contrast: "코드 색과 바탕 색이 비슷하면 카메라가 읽지 못해요. 어두운 코드에 밝은 바탕을 권해요.",
  },
  en: {
    title: "QR Code Generator", kinds: { text: "Link or text", wifi: "Wi-Fi", email: "Email" },
    text: "Link or text", textHint: "Start with https:// and the code opens the page when scanned",
    ssid: "Network name (SSID)", password: "Password", security: "Security", open: "No password", hidden: "Hidden network",
    to: "Recipient email", subject: "Subject", body: "Message",
    options: "Appearance", size: "Size", level: "Error correction", levels: { L: "Low 7%", M: "Medium 15%", Q: "High 25%", H: "Highest 30%" }, fg: "Code colour", bg: "Background",
    empty: "Type something and the QR code appears here.", tooLong: "That is too long. This correction level holds up to {max} bytes.", bytes: "{n} bytes",
    png: "Save PNG", svg: "Save SVG", copy: "Copy image", copied: "Copied", copyFail: "This browser cannot copy images. Save the PNG instead.", alt: "Generated QR code",
    contrast: "A camera cannot read a code whose colour is close to its background. A dark code on a light background works best.",
  },
  ja: {
    title: "QRコード作成", kinds: { text: "リンク・文字", wifi: "Wi-Fi", email: "メール" },
    text: "リンクまたは文字", textHint: "https:// で始めると、読み取ったときにそのまま開きます",
    ssid: "ネットワーク名 (SSID)", password: "パスワード", security: "セキュリティ", open: "パスワードなし", hidden: "非公開ネットワーク",
    to: "宛先メールアドレス", subject: "件名", body: "本文",
    options: "見た目の設定", size: "サイズ", level: "誤り訂正", levels: { L: "低 7%", M: "中 15%", Q: "高 25%", H: "最高 30%" }, fg: "コードの色", bg: "背景の色",
    empty: "内容を入力すると、ここにQRコードが表示されます。", tooLong: "内容が長すぎます。この訂正レベルでは{max}バイトまで入ります。", bytes: "{n}バイト",
    png: "PNGで保存", svg: "SVGで保存", copy: "画像をコピー", copied: "コピーしました", copyFail: "このブラウザーでは画像をコピーできません。PNGで保存してください。", alt: "作成したQRコード",
    contrast: "コードの色と背景の色が近いとカメラで読み取れません。暗いコードに明るい背景がおすすめです。",
  },
  zh: {
    title: "二维码生成器", kinds: { text: "链接·文字", wifi: "Wi-Fi", email: "邮件" },
    text: "链接或文字", textHint: "以 https:// 开头，扫码后会直接打开",
    ssid: "网络名称 (SSID)", password: "密码", security: "加密方式", open: "无密码", hidden: "隐藏网络",
    to: "收件人邮箱", subject: "主题", body: "正文",
    options: "外观设置", size: "尺寸", level: "容错级别", levels: { L: "低 7%", M: "中 15%", Q: "高 25%", H: "最高 30%" }, fg: "二维码颜色", bg: "背景颜色",
    empty: "输入内容后，二维码会显示在这里。", tooLong: "内容太长了。这个容错级别最多可容纳{max}字节。", bytes: "{n}字节",
    png: "保存PNG", svg: "保存SVG", copy: "复制图片", copied: "已复制", copyFail: "此浏览器无法复制图片，请保存为PNG。", alt: "生成的二维码",
    contrast: "二维码颜色和背景颜色太接近时相机无法识别。建议深色二维码配浅色背景。",
  },
  fr: {
    title: "Générateur de QR code", kinds: { text: "Lien ou texte", wifi: "Wi-Fi", email: "E-mail" },
    text: "Lien ou texte", textHint: "Commencez par https:// pour que le code ouvre la page au scan",
    ssid: "Nom du réseau (SSID)", password: "Mot de passe", security: "Sécurité", open: "Sans mot de passe", hidden: "Réseau masqué",
    to: "E-mail du destinataire", subject: "Objet", body: "Message",
    options: "Apparence", size: "Taille", level: "Correction d’erreur", levels: { L: "Faible 7 %", M: "Moyenne 15 %", Q: "Haute 25 %", H: "Maximale 30 %" }, fg: "Couleur du code", bg: "Fond",
    empty: "Saisissez un contenu et le QR code apparaît ici.", tooLong: "C’est trop long. Ce niveau de correction contient jusqu’à {max} octets.", bytes: "{n} octets",
    png: "Enregistrer en PNG", svg: "Enregistrer en SVG", copy: "Copier l’image", copied: "Copié", copyFail: "Ce navigateur ne peut pas copier l’image. Enregistrez le PNG.", alt: "QR code généré",
    contrast: "Un appareil photo ne lit pas un code dont la couleur est proche du fond. Préférez un code sombre sur fond clair.",
  },
  es: {
    title: "Generador de códigos QR", kinds: { text: "Enlace o texto", wifi: "Wi-Fi", email: "Correo" },
    text: "Enlace o texto", textHint: "Empieza por https:// y el código abrirá la página al escanearlo",
    ssid: "Nombre de la red (SSID)", password: "Contraseña", security: "Seguridad", open: "Sin contraseña", hidden: "Red oculta",
    to: "Correo del destinatario", subject: "Asunto", body: "Mensaje",
    options: "Apariencia", size: "Tamaño", level: "Corrección de errores", levels: { L: "Baja 7 %", M: "Media 15 %", Q: "Alta 25 %", H: "Máxima 30 %" }, fg: "Color del código", bg: "Fondo",
    empty: "Escribe algo y el código QR aparecerá aquí.", tooLong: "Es demasiado largo. Este nivel de corrección admite hasta {max} bytes.", bytes: "{n} bytes",
    png: "Guardar PNG", svg: "Guardar SVG", copy: "Copiar imagen", copied: "Copiado", copyFail: "Este navegador no puede copiar imágenes. Guarda el PNG.", alt: "Código QR generado",
    contrast: "Una cámara no lee un código cuyo color se parece al fondo. Lo mejor es un código oscuro sobre fondo claro.",
  },
};

const SIZES = [256, 512, 1024] as const;
const LEVELS: QrLevel[] = ["L", "M", "Q", "H"];
const KINDS: QrKind[] = ["text", "wifi", "email"];

/** Relative luminance of a #rrggbb colour, for the readability warning. */
function luminance(hex: string) {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function save(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
}

export default function QrGenerator({ locale = "ko" }: { locale?: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [kind, setKind] = useState<QrKind>("text");
  const [text, setText] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [hidden, setHidden] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [size, setSize] = useState<(typeof SIZES)[number]>(512);
  const [level, setLevel] = useState<QrLevel>("M");
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");
  const [png, setPng] = useState("");
  const [notice, setNotice] = useState("");

  const payload = useMemo(() => {
    if (kind === "wifi") return ssid.trim() ? wifiPayload(ssid.trim(), password, security, hidden) : "";
    if (kind === "email") return to.trim() ? emailPayload(to, subject, body) : "";
    return text.trim();
  }, [kind, text, ssid, password, security, hidden, to, subject, body]);

  const fits = payload ? qrFits(payload, level) : true;
  const lowContrast = Math.abs(luminance(fg) - luminance(bg)) < 0.4 || luminance(fg) > luminance(bg);
  const options = useMemo(() => ({ errorCorrectionLevel: level, margin: 2, width: size, color: { dark: fg, light: bg } }), [level, size, fg, bg]);

  useEffect(() => {
    if (!payload || !fits) { setPng(""); return; }
    let live = true;
    QRCode.toDataURL(payload, options).then((url) => { if (live) setPng(url); }).catch(() => { if (live) setPng(""); });
    return () => { live = false; };
  }, [payload, fits, options]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(id);
  }, [notice]);

  const saveSvg = async () => {
    const svg = await QRCode.toString(payload, { ...options, type: "svg" });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    save(url, "qr-code.svg");
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyImage = async () => {
    try {
      const blob = await (await fetchLocal(png)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setNotice(t.copied);
    } catch {
      setNotice(t.copyFail);
    }
  };

  const field = "mt-1 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const label = "block text-sm font-semibold text-foreground";
  const btn = "min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h1 className="text-2xl font-black tracking-tight text-foreground">{t.title}</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={t.title}>
        {KINDS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={`min-h-11 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-foreground"}`}>
            {t.kinds[k]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="grid content-start gap-3">
          {kind === "text" ? (
            <label className={label}>{t.text}
              <textarea className={`${field} py-2`} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://" />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">{t.textHint}</span>
            </label>
          ) : null}
          {kind === "wifi" ? (
            <>
              <label className={label}>{t.ssid}<input className={field} value={ssid} onChange={(e) => setSsid(e.target.value)} autoComplete="off" /></label>
              <label className={label}>{t.security}
                <select className={field} value={security} onChange={(e) => setSecurity(e.target.value as WifiSecurity)}>
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{t.open}</option>
                </select>
              </label>
              {security !== "nopass" ? (
                <label className={label}>{t.password}<input className={field} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" /></label>
              ) : null}
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground">
                <input type="checkbox" className="size-5" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />{t.hidden}
              </label>
            </>
          ) : null}
          {kind === "email" ? (
            <>
              <label className={label}>{t.to}<input type="email" className={field} value={to} onChange={(e) => setTo(e.target.value)} autoComplete="off" /></label>
              <label className={label}>{t.subject}<input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
              <label className={label}>{t.body}<textarea className={`${field} py-2`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></label>
            </>
          ) : null}

          <fieldset className="mt-1 grid gap-3 rounded-xl border border-border p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.options}</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>{t.size}
                <select className={field} value={size} onChange={(e) => setSize(Number(e.target.value) as (typeof SIZES)[number])}>
                  {SIZES.map((s) => <option key={s} value={s}>{s} × {s}px</option>)}
                </select>
              </label>
              <label className={label}>{t.level}
                <select className={field} value={level} onChange={(e) => setLevel(e.target.value as QrLevel)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{t.levels[l]}</option>)}
                </select>
              </label>
              <label className={label}>{t.fg}<input type="color" className="mt-1 block h-11 w-full rounded-lg border border-border bg-background" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
              <label className={label}>{t.bg}<input type="color" className="mt-1 block h-11 w-full rounded-lg border border-border bg-background" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
            </div>
            {lowContrast ? <p className="text-xs leading-relaxed text-destructive">{t.contrast}</p> : null}
          </fieldset>
        </div>

        <div className="grid content-start gap-3">
          <div className="grid aspect-square w-full place-items-center rounded-xl border border-border bg-muted p-3">
            {png ? (
              <img src={png} alt={t.alt} width={size} height={size} className="h-full w-full object-contain" />
            ) : (
              <p className="px-4 text-center text-sm leading-relaxed text-muted-foreground">{payload && !fits ? t.tooLong.replace("{max}", String(QR_MAX_BYTES[level])) : t.empty}</p>
            )}
          </div>
          <p className="min-h-5 text-center text-xs text-muted-foreground" role="status" aria-live="polite">
            {notice || (payload ? t.bytes.replace("{n}", String(qrByteLength(payload))) : "")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className={`${btn} border-primary bg-primary text-primary-foreground`} disabled={!png} onClick={() => save(png, "qr-code.png")}>{t.png}</button>
            <button type="button" className={btn} disabled={!png} onClick={() => void saveSvg()}>{t.svg}</button>
            <button type="button" className={btn} disabled={!png} onClick={() => void copyImage()}>{t.copy}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Turns the data: URL back into bytes. No request leaves the browser: a data URL is read from memory. */
function fetchLocal(dataUrl: string) {
  const [head, base] = dataUrl.split(",");
  const mime = head.slice(5, head.indexOf(";"));
  const bytes = Uint8Array.from(atob(base), (ch) => ch.charCodeAt(0));
  return Promise.resolve(new Response(new Blob([bytes], { type: mime })));
}
