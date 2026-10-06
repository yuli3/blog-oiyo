import assert from "node:assert/strict";
import { test } from "node:test";
import { QR_MAX_BYTES, emailPayload, escapeWifi, qrByteLength, qrFits, wifiPayload } from "./qr-payload.ts";

const BS = String.fromCharCode(92); // one backslash, spelled out so no tool can eat it

test("wifi payload escapes the characters the format reserves", () => {
  assert.equal(escapeWifi(`a;b,c:d"e${BS}f`), `a${BS};b${BS},c${BS}:d${BS}"e${BS}${BS}f`);
  assert.equal(wifiPayload("Home", "p;ss", "WPA"), `WIFI:T:WPA;S:Home;P:p${BS};ss;;`);
  assert.equal(wifiPayload("Cafe", "ignored", "nopass"), "WIFI:T:nopass;S:Cafe;;");
  assert.equal(wifiPayload("Net", "pw", "WEP", true), "WIFI:T:WEP;S:Net;P:pw;H:true;;");
});

test("email payload encodes subject and body and leaves them out when empty", () => {
  assert.equal(emailPayload(" a@b.co ", "", ""), "mailto:a@b.co");
  assert.equal(emailPayload("a@b.co", "안녕 & hi", "line 1\nline 2"), "mailto:a@b.co?subject=%EC%95%88%EB%85%95%20%26%20hi&body=line%201%0Aline%202");
});

test("capacity is counted in bytes, not characters", () => {
  assert.equal(qrByteLength("abc"), 3);
  assert.equal(qrByteLength("한글"), 6);
  assert.equal(qrFits("a".repeat(QR_MAX_BYTES.H), "H"), true);
  assert.equal(qrFits("a".repeat(QR_MAX_BYTES.H + 1), "H"), false);
  assert.equal(qrFits("가".repeat(985), "L"), false);
});
