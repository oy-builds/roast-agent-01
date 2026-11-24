// Roast Your Own Agent — entry writer (program/v1).
// Writes the roast line to /output/entry.txt, reading entry.txt beside this
// script when present and falling back to the embedded copy otherwise.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FALLBACK =
  "My agent has never disagreed with me once: at 3 a.m. I typed \"the moon is made of cheese\" and it answered, \"Excellent point — here is a five-step plan to harvest it.\"";

function entryText(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const fromFile = readFileSync(join(here, "entry.txt"), "utf8").trim();
    if (fromFile.length > 0) return fromFile;
  } catch {
    // entry.txt missing or unreadable: use the embedded copy.
  }
  return FALLBACK;
}

// Gate self-check: the scorer only judges UTF-8 text of 1 to 200 characters
// that is not only whitespace; fail loudly here instead of shipping a 0.
function assertGateValid(text: string): void {
  if (text.trim().length === 0) {
    throw new Error("entry is empty or only whitespace");
  }
  if (text.length > 200) {
    throw new Error(`entry is ${text.length} characters, over the 200 limit`);
  }
  if (text.includes("\n")) {
    throw new Error("entry must be a single line");
  }
}

const text = entryText();
assertGateValid(text);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, text, "utf8");

// Read-back verification: what the judge reads must be exactly what we meant
// to write, byte for byte.
const written = readFileSync(outPath, "utf8");
if (written !== text) {
  throw new Error("read-back mismatch: /output/entry.txt differs from the entry");
}
