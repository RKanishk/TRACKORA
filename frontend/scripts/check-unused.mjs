#!/usr/bin/env node
/**
 * Flags imported bindings that are never referenced in the rest of the file.
 * With tsconfig `noUnusedLocals`, an unused import fails `tsc`, so this is a
 * cheap proxy for that class of build error. Heuristic (regex word-boundary),
 * so it can have rare false positives — reported for manual confirmation.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Return { names:Set, importSpanEnd:index } — all imported local identifiers. */
function importedNames(src) {
  const names = [];
  const re = /\bimport\s+(?:type\s+)?([^;]*?)\s+from\s*["'][^"']+["']/g;
  let m;
  let lastEnd = 0;
  while ((m = re.exec(src))) {
    lastEnd = Math.max(lastEnd, m.index + m[0].length);
    const clause = m[1];
    const ns = clause.match(/\*\s*as\s+([A-Za-z_$][\w$]*)/);
    if (ns) names.push(ns[1]);
    const grp = clause.match(/\{([^}]*)\}/);
    if (grp) {
      for (const part of grp[1].split(",")) {
        const seg = part.trim().replace(/^type\s+/, "");
        if (!seg) continue;
        const asM = seg.match(/\bas\s+([A-Za-z_$][\w$]*)/);
        names.push((asM ? asM[1] : seg).trim());
      }
    }
    // default import (leading identifier)
    const defM = clause.trim().match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (defM && defM[1] !== "type") names.push(defM[1]);
  }
  return { names, lastEnd };
}

const unused = [];
for (const file of walk(SRC)) {
  const src = readFileSync(file, "utf8");
  const { names, lastEnd } = importedNames(src);
  const body = src.slice(lastEnd); // everything after the import block
  const rel = file.replace(process.cwd() + "/", "");
  for (const n of names) {
    const re = new RegExp(`\\b${n.replace(/[$]/g, "\\$")}\\b`);
    if (!re.test(body)) unused.push(`${rel}: imported "${n}" appears unused`);
  }
}

if (unused.length === 0) {
  console.log("✅ No obviously-unused imports.");
} else {
  console.log(`⚠️  ${unused.length} possibly-unused import(s):`);
  for (const u of unused) console.log("  - " + u);
  process.exitCode = 1;
}
