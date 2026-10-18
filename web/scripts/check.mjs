// Offline sanity checks (no npm install needed beyond Node + a TypeScript install for syntax parsing):
//  1. every .js/.jsx file parses (TypeScript transpileModule, JSX preserved)
//  2. every relative import resolves to a file
//  3. every named import from a local module is actually exported
//  4. every var(--x) used in CSS/JSX exists in tokens.css (or is defined locally as a custom property)
//  5. every <Icon name="..."> exists in components/Icon.jsx
// Usage: node scripts/check.mjs   (set TS_PATH to a typescript package dir if `typescript` is not resolvable)
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src')
const require = createRequire(import.meta.url)
let ts
for (const p of [process.env.TS_PATH, 'typescript', '/opt/node22/lib/node_modules/typescript'].filter(Boolean)) {
  try { ts = require(p); break } catch { /* next */ }
}
if (!ts) { console.error('typescript not found (set TS_PATH)'); process.exit(2) }

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const files = walk(src)
const code = files.filter((f) => /\.jsx?$/.test(f))
const css = files.filter((f) => f.endsWith('.css'))
let errors = 0
const fail = (msg) => { errors += 1; console.error('✗', msg) }
const rel = (f) => path.relative(root, f)

const exportsOf = new Map()
for (const f of code) {
  const text = fs.readFileSync(f, 'utf8')
  const out = ts.transpileModule(text, { reportDiagnostics: true, fileName: f, compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, allowJs: true } })
  out.diagnostics?.forEach((d) => fail(`${rel(f)}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`))
  const names = new Set()
  if (/export\s+default/.test(text)) names.add('default')
  for (const m of text.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1])
  for (const m of text.matchAll(/export\s*\{([^}]+)\}/g)) m[1].split(',').forEach((s) => { const n = s.trim().split(/\s+as\s+/).pop(); if (n) names.add(n) })
  exportsOf.set(f, names)
}

const resolve = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec)
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js'), path.join(base, 'index.jsx')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  return null
}
for (const f of code) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/(?:import|export)\s+([^'"]*?)\s*from\s*['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
    const spec = m[2] || m[3] || m[4]
    const target = resolve(f, spec)
    if (!target) { fail(`${rel(f)}: cannot resolve '${spec}'`); continue }
    if (!/\.jsx?$/.test(target)) continue
    const clause = m[1]
    if (!clause) continue
    const ex = exportsOf.get(target)
    const def = clause.match(/^([A-Za-z0-9_$]+)\s*(?:,|$)/)
    if (def && !ex.has('default')) fail(`${rel(f)}: '${spec}' has no default export`)
    const named = clause.match(/\{([^}]*)\}/)
    if (named) named[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((n) => { if (!ex.has(n)) fail(`${rel(f)}: '${n}' is not exported by '${spec}'`) })
  }
}

const tokens = fs.readFileSync(path.join(src, 'styles/tokens.css'), 'utf8')
const defined = new Set([...tokens.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]))
for (const f of [...css, ...code]) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(m[1])           // locally defined custom properties
  for (const m of text.matchAll(/['"`](--[a-z0-9-]+)['"`]\s*:/gi)) defined.add(m[1]) // set at runtime via inline style / setProperty
  for (const m of text.matchAll(/setProperty\(\s*['"`](--[a-z0-9-]+)/gi)) defined.add(m[1])
}
for (const f of [...css, ...code]) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    const v = m[1]
    if (!defined.has(v) && v !== '--st-') fail(`${rel(f)}: undefined CSS variable ${v}`)
  }
}

const iconSrc = fs.readFileSync(path.join(src, 'components/Icon.jsx'), 'utf8')
const icons = new Set([...iconSrc.matchAll(/^\s*'?([a-z0-9-]+)'?\s*:\s*'/gim)].map((m) => m[1]))
for (const f of code) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/<Icon[^>]*\sname=["']([a-z0-9-]+)["']/g)) if (!icons.has(m[1])) fail(`${rel(f)}: unknown icon '${m[1]}'`)
  for (const m of text.matchAll(/icon:\s*['"]([a-z0-9-]+)['"]/g)) if (!icons.has(m[1])) fail(`${rel(f)}: unknown icon '${m[1]}'`)
}

console.log(`${code.length} JS/JSX + ${css.length} CSS files checked — ${errors ? `${errors} problem(s)` : 'all good'}`)
process.exit(errors ? 1 : 0)
