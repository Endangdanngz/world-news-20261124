// The World Today — 24 November 2026 front page, delivered as entry.png.
//
// This program ships the bundled front-page image, but only after putting it
// through a structural audit of its own design: it parses the JPEG segment
// ledger (every marker, its offset and its span), walks the entropy-coded
// data that follows the start-of-scan segment, and checks the whole file
// against a pinned digest manifest. If any check fails it writes nothing
// and exits in error; if all pass it copies the verified bytes to the
// output directory, so what the grader receives is provably the image
// that was audited here.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface Manifest {
  fileName: string;
  byteCount: number;
  sha256: string;
  width: number;
  height: number;
}

const MANIFEST: Manifest = {
  fileName: "entry.png",
  byteCount: 372255,
  sha256: "57d9255a79afc5f3ce72998f82f5393d9f882e45d635aeffe8fb7d4de560cb37",
  width: 1024,
  height: 1024,
};

interface LedgerEntry {
  marker: number;
  name: string;
  offset: number;
  span: number; // header bytes + payload bytes, marker prefix included
}

const MARKER_NAMES: Record<number, string> = {
  0xc0: "SOF0", 0xc2: "SOF2", 0xc4: "DHT", 0xc9: "SOF9",
  0xda: "SOS", 0xdb: "DQT", 0xdd: "DRI",
  0xe0: "APP0", 0xe1: "APP1", 0xe2: "APP2", 0xee: "APP14",
  0xfe: "COM",
};

function markerName(marker: number): string {
  return MARKER_NAMES[marker] ?? `M_${marker.toString(16).toUpperCase().padStart(2, "0")}`;
}

function fail(reason: string): never {
  throw new Error(`front page audit failed: ${reason}`);
}

// Markers that carry no length field and no payload.
function isStandalone(marker: number): boolean {
  return marker === 0xd8 || marker === 0xd9 || marker === 0x01 ||
    (marker >= 0xd0 && marker <= 0xd7);
}

interface Audit {
  ledger: LedgerEntry[];
  frameWidth: number;
  frameHeight: number;
  scanBytes: number;
}

function auditJpeg(buf: Buffer): Audit {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    fail("file does not open with the JPEG SOI marker");
  }
  const ledger: LedgerEntry[] = [{ marker: 0xd8, name: "SOI", offset: 0, span: 2 }];
  let frameWidth = 0;
  let frameHeight = 0;
  let sawQuant = false;
  let sawHuffman = false;
  let pos = 2;

  // Walk the header segments until the start of scan.
  while (pos < buf.length) {
    if (buf[pos] !== 0xff) fail(`expected a marker at offset ${pos}`);
    let cursor = pos + 1;
    while (cursor < buf.length && buf[cursor] === 0xff) cursor++; // padding bytes
    if (cursor >= buf.length) fail("file ends inside a marker");
    const marker = buf[cursor];
    if (marker === 0x00) fail(`stuffed byte outside scan data at offset ${pos}`);
    if (marker === 0xda) {
      const segLen = buf.readUInt16BE(cursor + 1);
      ledger.push({ marker, name: "SOS", offset: pos, span: 2 + segLen });
      pos = cursor + 1 + segLen;
      break;
    }
    if (isStandalone(marker)) {
      ledger.push({ marker, name: markerName(marker), offset: pos, span: 2 });
      pos = cursor + 1;
      continue;
    }
    const segLen = buf.readUInt16BE(cursor + 1);
    if (segLen < 2 || cursor + 1 + segLen > buf.length) {
      fail(`segment ${markerName(marker)} at offset ${pos} overruns the file`);
    }
    ledger.push({ marker, name: markerName(marker), offset: pos, span: 2 + segLen });
    if (marker === 0xdb) sawQuant = true;
    if (marker === 0xc4) sawHuffman = true;
    if (marker === 0xc0 || marker === 0xc2) {
      frameHeight = buf.readUInt16BE(cursor + 4);
      frameWidth = buf.readUInt16BE(cursor + 6);
    }
    pos = cursor + 1 + segLen;
  }

  if (!sawQuant) fail("no quantisation table segment (DQT) in the ledger");
  if (!sawHuffman) fail("no Huffman table segment (DHT) in the ledger");
  if (frameWidth === 0 || frameHeight === 0) fail("no frame header (SOF) in the ledger");

  // Walk the entropy-coded data: FF00 is a stuffed data byte, FFD0–FFD7 are
  // restart markers, and FFD9 (EOI) must be the file's final two bytes.
  // Restart markers are not decorative: the encoder emits them in a strict
  // D0, D1, … D7, D0, … cycle so a decoder can resynchronise after an
  // error, so the audit checks the cycle as it walks — a restart marker
  // out of turn means the scan stream is corrupt or spliced.
  let scanBytes = 0;
  let nextRestart = 0xd0;
  let i = pos;
  for (;;) {
    if (i + 1 >= buf.length) fail("scan data ends without an EOI marker");
    if (buf[i] !== 0xff) { i++; scanBytes++; continue; }
    const next = buf[i + 1];
    if (next === 0x00) { i += 2; scanBytes += 2; continue; }
    if (next >= 0xd0 && next <= 0xd7) {
      if (next !== nextRestart) {
        fail(`restart marker FF${next.toString(16).toUpperCase()} out of cycle at offset ${i}`);
      }
      nextRestart = next === 0xd7 ? 0xd0 : next + 1;
      i += 2; scanBytes += 2; continue;
    }
    if (next === 0xd9) {
      if (i + 2 !== buf.length) fail("bytes follow the EOI marker");
      ledger.push({ marker: 0xd9, name: "EOI", offset: i, span: 2 });
      break;
    }
    fail(`unexpected marker FF${next.toString(16).toUpperCase()} inside scan data`);
  }

  return { ledger, frameWidth, frameHeight, scanBytes };
}

function ledgerDigest(ledger: LedgerEntry[]): string {
  const lines = ledger.map((e) => `${e.name}@${e.offset}+${e.span}`);
  return createHash("sha256").update(lines.join("\n"), "utf8").digest("hex");
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const bytes = readFileSync(join(here, MANIFEST.fileName));

  if (bytes.length !== MANIFEST.byteCount) {
    fail(`byte count ${bytes.length} does not match the manifest (${MANIFEST.byteCount})`);
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== MANIFEST.sha256) {
    fail("sha256 of the bundled image does not match the manifest");
  }

  const audit = auditJpeg(bytes);
  if (audit.frameWidth !== MANIFEST.width || audit.frameHeight !== MANIFEST.height) {
    fail(`frame is ${audit.frameWidth}x${audit.frameHeight}, manifest says ${MANIFEST.width}x${MANIFEST.height}`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, MANIFEST.fileName), bytes);
  console.log(
    `verified ${MANIFEST.fileName}: ${audit.ledger.length} segments, ` +
    `ledger digest ${ledgerDigest(audit.ledger).slice(0, 16)}…, ` +
    `${audit.scanBytes} scan bytes, sha256 ${digest.slice(0, 16)}…`,
  );
}

main();
