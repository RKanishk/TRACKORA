#!/usr/bin/env node
/**
 * Dependency-free static import/export checker for the Trackora frontend.
 * Not a substitute for `tsc`, but it catches the most likely build-breakers
 * when the toolchain can't be installed: unresolved modules and named imports
 * that don't correspond to a real export in the target module.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const EXTERNAL_OK = new Set([
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react-router-dom",
  "lucide-react",
]);

/** Recursively list .ts/.tsx files under a dir. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Resolve a module specifier from a file to an on-disk path (or null). */
function resolveSpecifier(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return { external: true };

  // Non-code assets (css etc.) — resolve by existence only.
  if (/\.(css|svg|png|jpg|jpeg|json)$/.test(spec)) {
    return existsSync(base) ? { file: base, assets: true } : null;
  }

  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return { file: c };
  }
  return null;
}

/** Collect exported binding names from a module's source. */
function collectExports(src) {
  const names = new Set();
  let hasDefault = false;
  const reexports = [];

  // export default ...
  if (/\bexport\s+default\b/.test(src)) hasDefault = true;

  // export function/const/let/var/class/interface/type/enum NAME
  const declRe =
    /\bexport\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = declRe.exec(src))) names.add(m[1]);

  // export { a, b as c } [from "..."]
  const groupRe = /\bexport\s*\{([^}]*)\}\s*(?:from\s*["']([^"']+)["'])?/g;
  while ((m = groupRe.exec(src))) {
    const from = m[2];
    for (const part of m[1].split(",")) {
      const seg = part.trim();
      if (!seg) continue;
      const asMatch = seg.match(/\bas\s+([A-Za-z_$][\w$]*)/);
      const exported = asMatch ? asMatch[1] : seg.replace(/^type\s+/, "").trim();
      if (exported === "default") {
        hasDefault = true;
      } else if (exported) {
        names.add(exported);
      }
    }
    if (from) reexports.push(from);
  }

  // export * from "..."
  const starRe = /\bexport\s*\*\s*(?:as\s+[A-Za-z_$][\w$]*\s*)?from\s*["']([^"']+)["']/g;
  while ((m = starRe.exec(src))) reexports.push(m[1]);

  return { names, hasDefault, reexports };
}

/** Parse import statements → list of { spec, default, namespace, named[] }. */
function collectImports(src) {
  const imports = [];
  // import <clause> from "spec";  and  import "spec";
  const re = /\bimport\s+(?:type\s+)?([^;]*?)\s+from\s*["']([^"']+)["']|(?:\bimport\s*["']([^"']+)["'])/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[3]) {
      imports.push({ spec: m[3], default: null, namespace: null, named: [] });
      continue;
    }
    const clause = m[1].trim();
    const spec = m[2];
    let def = null;
    let namespace = null;
    const named = [];

    // namespace: * as ns
    const ns = clause.match(/\*\s*as\s+([A-Za-z_$][\w$]*)/);
    if (ns) namespace = ns[1];

    // named group { ... }
    const grp = clause.match(/\{([^}]*)\}/);
    if (grp) {
      for (const part of grp[1].split(",")) {
        const seg = part.trim().replace(/^type\s+/, "");
        if (!seg) continue;
        const asM = seg.match(/([A-Za-z_$][\w$]*)\s+as\s+/);
        const orig = asM ? asM[1] : seg;
        named.push(orig.trim());
      }
    }

    // default: leading identifier before { or , (not the namespace)
    const defM = clause.match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (defM && defM[1] !== "type") def = defM[1];

    imports.push({ spec, default: def, namespace, named });
  }
  return imports;
}

// ---- Run ----
const files = walk(SRC);
const exportCache = new Map();
function exportsOf(file) {
  if (!exportCache.has(file)) {
    exportCache.set(file, collectExports(readFileSync(file, "utf8")));
  }
  return exportCache.get(file);
}

/** Resolve whether `name` is exported by `file`, following re-exports. */
function isExported(file, name, seen = new Set()) {
  if (seen.has(file)) return false;
  seen.add(file);
  const ex = exportsOf(file);
  if (name === "default") return ex.hasDefault;
  if (ex.names.has(name)) return true;
  for (const rspec of ex.reexports) {
    const r = resolveSpecifier(rspec, file);
    if (r && r.file && isExported(r.file, name, seen)) return true;
  }
  return false;
}

const problems = [];
const externals = new Set();

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(ROOT + "/", "");
  for (const imp of collectImports(src)) {
    const r = resolveSpecifier(imp.spec, file);
    if (r && r.external) {
      externals.add(imp.spec);
      if (!EXTERNAL_OK.has(imp.spec)) {
        problems.push(`${rel}: imports unknown external "${imp.spec}" (not in allowed deps)`);
      }
      continue;
    }
    if (!r) {
      problems.push(`${rel}: cannot resolve module "${imp.spec}"`);
      continue;
    }
    if (r.assets) continue;
    // Check named + default bindings exist.
    if (imp.default && !isExported(r.file, "default")) {
      problems.push(`${rel}: no default export in "${imp.spec}"`);
    }
    for (const n of imp.named) {
      if (!isExported(r.file, n)) {
        problems.push(`${rel}: "${n}" is not exported by "${imp.spec}"`);
      }
    }
  }
}

console.log(`Scanned ${files.length} files.`);
console.log(`External modules used: ${[...externals].sort().join(", ")}`);
if (problems.length === 0) {
  console.log("\n✅ No unresolved imports or missing exports found.");
} else {
  console.log(`\n❌ ${problems.length} problem(s):`);
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
}
