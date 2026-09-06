#!/usr/bin/env node

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const assets = ["academy.jpg", "tool.jpg", "fortune.jpg"];
const expectedWidth = 1200;
const expectedHeight = 630;
const maxBytes = 200 * 1024;

function jpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("not a JPEG");
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found");
}

const failures = [];
for (const asset of assets) {
  const path = join(root, "public", "og", asset);
  try {
    const buffer = readFileSync(path);
    const { width, height } = jpegSize(buffer);
    const bytes = statSync(path).size;
    if (width !== expectedWidth || height !== expectedHeight) {
      failures.push(`${asset}: expected ${expectedWidth}x${expectedHeight}, got ${width}x${height}`);
    }
    if (bytes > maxBytes) {
      failures.push(`${asset}: ${(bytes / 1024).toFixed(1)}KB exceeds ${maxBytes / 1024}KB`);
    }
    console.log(`${asset}: ${width}x${height}, ${(bytes / 1024).toFixed(1)}KB`);
  } catch (error) {
    failures.push(`${asset}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OG image audit PASS");
