/**
 * What goes inside the QR code for each kind of content. Kept apart from the
 * component so the escaping rules can be tested: a Wi-Fi code with an unescaped
 * semicolon in the password joins the wrong network name or none at all.
 */
export type QrKind = "text" | "wifi" | "email";
export type WifiSecurity = "WPA" | "WEP" | "nopass";

/** Wi-Fi codes escape backslash, semicolon, comma, colon and double quote with a backslash. */
export const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");

export function wifiPayload(ssid: string, password: string, security: WifiSecurity, hidden = false): string {
  const pass = security === "nopass" ? "" : `P:${escapeWifi(password)};`;
  return `WIFI:T:${security};S:${escapeWifi(ssid)};${pass}${hidden ? "H:true;" : ""};`;
}

export function emailPayload(to: string, subject: string, body: string): string {
  const params = [subject ? `subject=${encodeURIComponent(subject)}` : "", body ? `body=${encodeURIComponent(body)}` : ""].filter(Boolean).join("&");
  return `mailto:${to.trim()}${params ? `?${params}` : ""}`;
}

/** Largest byte payload a QR code can hold (version 40) at each error-correction level. */
export const QR_MAX_BYTES = { L: 2953, M: 2331, Q: 1663, H: 1273 } as const;
export type QrLevel = keyof typeof QR_MAX_BYTES;
export const qrByteLength = (text: string) => new TextEncoder().encode(text).length;
export const qrFits = (text: string, level: QrLevel) => qrByteLength(text) <= QR_MAX_BYTES[level];
