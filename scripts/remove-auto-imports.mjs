#!/usr/bin/env node
// Removes every import that the generated declaration files say is
// auto-provided, then verifies that claim. Idempotent: run it again and it
// reports zero changes.
//
// Usage: `npm run cleanup-imports` from the repo root.
//
// Contract sources (parsed, not hardcoded):
// - auto-imports.d.ts: `const X: typeof import('P')` = value X from package P
//   is auto-imported; `export type {...} from 'P'` = those types are global.
// - components.d.ts: GlobalComponents / GlobalDirectives = names the
//   Components plugin resolves in templates.
//
// When P is a local module rather than a package - the `dirs` option, which
// points the plugin at src/composables - the name is not tied to that one
// specifier. The barrel re-exports it from somewhere else, and the files that
// use it import it from that origin (or from a further barrel: `useAuthStore`
// arrives via '@/features/auth' as often as '@/features/auth/store'). So every
// module that re-exports the name is resolved to a file path, and an import
// from any of them is dropped - they are all the same binding. The providers
// themselves are skipped, which is also what keeps the barrel from importing
// from itself.
//
// Rules per file under src/ (skips generated src/api and *.d.ts):
// - value specifier X from P: dropped iff the contract maps X -> P.
// - type specifier (`type X`, or X inside `import type {...}`): dropped iff
//   the contract maps type X -> P, or X is a local type and P is one of its
//   providers (same resolution as for values, below).
// - `X as Y` aliases: kept (the global name differs from local use) + reported.
// - component/directive names (B*, IBi*, RouterLink/View, vBModal): dropped
//   iff template-only, i.e. absent from <script> AND from template
//   *expressions* (`:is="BFormInput"` needs a real binding; only pure tag
//   usage like <BButton> is auto-resolved).
// - `useToast` and friends need no special case: they are in the contract
//   as values from their packages.
// - @/components/*.vue and relative imports: left alone (tests stub them
//   by component name, which only works with explicit local imports).
// - the app entry modules (the `<script type="module">` of each HTML entry)
//   are skipped entirely; see ENTRY_MODULES below.
//
// After running, verify with `npm run typecheck` and `npm test`.
import fs from 'node:fs'
import path from 'node:path'

const REPO = process.cwd()
// `--dry` reports what would change without writing; the verify pass then
// necessarily fails, which is the point of looking first.
const DRY = process.argv.includes('--dry')

// ---- contract ----
function parseContract() {
  const auto = fs.readFileSync(path.join(REPO, 'auto-imports.d.ts'), 'utf8')
  const values = new Map() // name -> package
  for (const m of auto.matchAll(/const ([\w$]+): typeof import\('([^']+)'\)/g)) {
    values.set(m[1], m[2])
  }
  const types = new Map() // name -> package
  for (const m of auto.matchAll(/export type \{([^}]*)\} from '([^']+)'/g)) {
    for (const n of m[1].split(',').map(s => s.trim()).filter(Boolean)) {
      types.set(n, m[2])
    }
  }
  const comp = fs.readFileSync(path.join(REPO, 'components.d.ts'), 'utf8')
  const components = new Set()
  const compBlock = comp.slice(comp.indexOf('GlobalComponents'))
  for (const m of compBlock.matchAll(/(\w+): typeof import/g)) components.add(m[1])
  const directives = new Set()
  const dirIdx = comp.indexOf('GlobalDirectives')
  if (dirIdx > 0) {
    for (const m of comp.slice(dirIdx).matchAll(/(\w+): typeof import/g)) directives.add(m[1])
  }
  return { values, types, components, directives }
}
const { values, types, components, directives } = parseContract()
console.log(`contract: ${values.size} values, ${types.size} types, ${components.size} components, ${directives.size} directives`)

// ---- local module resolution ----
const SRC = path.join(REPO, 'src')

/** A module specifier as an absolute file path, or null for a bare package. */
function resolveSpecifier(spec, fromFile) {
  let base
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('./') || spec.startsWith('../')) base = path.resolve(path.dirname(fromFile), spec)
  else return null
  for (const c of [base, `${base}.ts`, `${base}.js`, `${base}.vue`,
                   path.join(base, 'index.ts'), path.join(base, 'index.js')]) {
    try { if (fs.statSync(c).isFile()) return c } catch { /* next candidate */ }
  }
  return null
}

/**
 * `export { a, default as b } from 'X'` in one file, type-only forms included
 * (`export type { T }`, `export { type T }`): [[exportedName, localKind], ...]
 */
function reExportsOf(src) {
  const out = []
  for (const m of src.matchAll(/^export(?:\s+type)?\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm)) {
    for (const raw of m[1].split(',').map(x => x.trim().replace(/^type\s+/, '')).filter(Boolean)) {
      const aliased = raw.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
      const source = aliased ? aliased[1] : raw
      const exported = aliased ? aliased[2] : raw
      out.push([exported, source === 'default' ? 'default' : 'named', m[2]])
    }
  }
  return out
}

// name -> Map<absolute file, 'named'|'default'>: every module the name can
// legitimately be imported from, because they all hand back the same binding.
const providers = new Map()
const addProvider = (name, file, kind) => {
  if (!providers.has(name)) providers.set(name, new Map())
  providers.get(name).set(file, kind)
}

// Seed: the names the plugin serves out of a local module - types too, since
// the barrel re-exports those from their origin just the same.
for (const [name, spec] of [...values, ...types]) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) continue
  const abs = resolveSpecifier(spec, path.join(REPO, '_.ts'))
  if (abs) addProvider(name, abs, 'named')
}

// Fixpoint: a module that re-exports a provided name is itself a provider.
const allFiles = []
for (let pass = 0; ; pass++) {
  let grew = false
  if (!allFiles.length) for (const f of walk(SRC)) allFiles.push(f)
  for (const file of allFiles) {
    const src = fs.readFileSync(file, 'utf8')
    if (!src.includes('export')) continue
    for (const [exported, kind, spec] of reExportsOf(src)) {
      const known = providers.get(exported)
      if (!known) continue
      const target = resolveSpecifier(spec, file)
      if (!target) continue
      // down: this file serves the name, so the module behind it does too
      if (known.has(file) && !known.has(target)) {
        addProvider(exported, target, kind)
        grew = true
      }
      // up: the module behind it serves the name, so this file re-serves it -
      // always as a named export, whatever it was called on the way in
      if (known.get(target) === kind && !known.has(file)) {
        addProvider(exported, file, 'named')
        grew = true
      }
    }
  }
  if (!grew || pass > 8) break
}

// A provider must keep its own imports: stripping them would make it
// auto-import the name it is itself the source of.
const PROVIDER_FILES = new Set([...providers.values()].flatMap(m => [...m.keys()]))
if (providers.size) {
  console.log(`local names: ${[...providers.keys()].join(', ')}`)
  console.log(`provider modules (left untouched):`)
  for (const f of [...PROVIDER_FILES].sort()) console.log(`  ${path.relative(REPO, f)}`)
}

/** Is `name`, imported from `spec` by `file`, already auto-provided? */
function providedLocally(name, spec, file, wantDefault) {
  const known = providers.get(name)
  if (!known) return false
  const target = resolveSpecifier(spec, file)
  if (!target) return false
  return known.get(target) === (wantDefault ? 'default' : 'named')
}

/**
 * The modules each HTML entry loads - `src/main.ts`, via index.html's
 * `/src/main.js`.
 *
 * Their imports stay, auto-provided or not. Vite pre-bundles dependencies by
 * crawling the entry with esbuild, and that scan does not run the auto-import
 * transform: a package the entry only reaches through an injected import is
 * never discovered, and the optimized graph comes out inconsistent with what
 * the served modules expect. It surfaces as 504 "Outdated Optimize Dep" and a
 * `TypeError` from inside a `node_modules/.vite/deps` chunk, which reads as a
 * broken install rather than as a missing import. `createApp` in main.ts is
 * the one that bit us; the rule is the entry, not that one name.
 */
const ENTRY_MODULES = new Set()
for (const html of fs.readdirSync(REPO).filter((f) => f.endsWith('.html'))) {
  const markup = fs.readFileSync(path.join(REPO, html), 'utf8')
  for (const m of markup.matchAll(/<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/g)) {
    // index.html names `/src/main.js`; the file on disk is main.ts.
    const spec = m[1].replace(/^\//, './')
    const abs = resolveSpecifier(spec, path.join(REPO, '_.ts'))
      || resolveSpecifier(spec.replace(/\.js$/, ''), path.join(REPO, '_.ts'))
    if (abs) ENTRY_MODULES.add(abs)
  }
}
console.log(`entry modules (left untouched): ${[...ENTRY_MODULES].map((f) => path.relative(REPO, f)).join(', ') || 'none found'}`)

// vue-router registers these globally at runtime AND in its own
// GlobalComponents augmentation; the Components plugin no longer emits them.
const ROUTER_COMP = new Set(['RouterLink', 'RouterView'])
for (const n of ROUTER_COMP) components.add(n)

// ---- walk ----
function* walk(dir, rel = 'src') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    const r = path.join(rel, e.name)
    if (e.isDirectory()) {
      if (r === 'src/api') continue
      yield* walk(p, r)
    } else if (/\.(vue|ts|js)$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      yield p
    }
  }
}

function scriptBodyWithoutImports(fileSrc, isVue) {
  const strip = (s) => s.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '\n')
  if (!isVue) return strip(fileSrc)
  const parts = []
  for (const m of fileSrc.matchAll(/<script[\s\S]*?<\/script\s*>/gi)) {
    parts.push(strip(m[0].replace(/^<script[^>]*>/i, '').replace(/<\/script\s*>$/i, '')))
  }
  return parts.join('\n')
}

function templateExpressions(fileSrc) {
  const tpls = fileSrc.match(/<template[\s\S]*?<\/template\s*>/gi) || []
  return tpls.join(' ').replace(/<\/?[A-Za-z][\w-]*/g, ' ')
}

const word = (body, name) => new RegExp(`\\b${name}\\b`).test(body)

// ---- transform ----
let changed = 0
const aliases = []
const report = []

for (const file of walk(path.join(REPO, 'src'))) {
  if (PROVIDER_FILES.has(file) || ENTRY_MODULES.has(file)) continue
  const src = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')
  const scriptBody = scriptBodyWithoutImports(src, isVue)
  const tplExpr = isVue ? templateExpressions(src) : ''
  const templateOnly = (local) => !word(scriptBody, local) && !word(tplExpr, local)

  let out = src
  const notes = []
  for (const m of [...src.matchAll(/^import(\s+type)?\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm)]) {
    const [stmt, typeMod, list, source] = m
    const specs = list.split(',').map(s => s.trim()).filter(Boolean)
    const keep = []
    for (const raw of specs) {
      const aliasM = raw.match(/^(\w+)\s+as\s+(\w+)$/)
      if (aliasM) {
        keep.push(raw)
        aliases.push(`${path.relative(REPO, file)}: ${raw} from '${source}'`)
        continue
      }
      const typeM = raw.match(/^type\s+(\w+)$/)
      const name = typeM ? typeM[1] : raw
      const isType = Boolean(typeM) || Boolean(typeMod)
      if (isType) {
        if (types.get(name) === source) continue // globally typed -> drop
        if (types.has(name) && providedLocally(name, source, file, false)) continue // same type via a barrel -> drop
        keep.push(raw); continue
      }
      // value specifier
      if (values.get(name) === source) continue // auto-imported -> drop
      if (providedLocally(name, source, file, false)) continue // same binding via a barrel -> drop
      if (components.has(name) || directives.has(name)) {
        if (templateOnly(name)) continue // pure template tag usage -> drop
        keep.push(raw); continue
      }
      keep.push(raw)
    }
    if (keep.length === specs.length) continue
    if (keep.length === 0) {
      out = out.replace(stmt, '')
      notes.push(`- ${stmt.trim().slice(0, 110)}`)
    } else {
      out = out.replace(stmt, stmt.replace(list, ` ${keep.join(', ')} `))
      notes.push(`~ ${stmt.trim().slice(0, 90)}`)
    }
  }
  // default imports: ~icons/* component defaults, and a local default the
  // barrel re-exports under a name (`export { default as my24 }`).
  for (const m of [...src.matchAll(/^import\s+(\w+)\s+from\s*['"]([^'"]+)['"]\s*;?/gm)]) {
    const [stmt, local, source] = m
    const isIcon = source.startsWith('~icons') && (components.has(local) || /^IBi[A-Z]/.test(local))
    if (isIcon ? templateOnly(local) : providedLocally(local, source, file, true)) {
      out = out.replace(stmt, '')
      notes.push(`- ${stmt.trim().slice(0, 110)}`)
    }
  }
  if (notes.length) {
    out = out.replace(/\n{3,}/g, '\n\n')
    // Dropping the first import in a block leaves the tag hanging over a blank
    // line; the run above cannot see it because the tag is only one newline away.
    out = out.replace(/(<script[^>]*>)\n\s*\n/g, '$1\n')
    if (!DRY) fs.writeFileSync(file, out)
    changed++
    report.push(`${path.relative(REPO, file)}:\n  ${notes.join('\n  ')}`)
  }
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} files`)
console.log(report.join('\n'))

// ---- verify: re-scan with the same contract; anything still covered is a bug ----
const remaining = []
for (const file of walk(path.join(REPO, 'src'))) {
  if (PROVIDER_FILES.has(file) || ENTRY_MODULES.has(file)) continue
  const src = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')
  const rel = path.relative(REPO, file)
  const scriptBody = scriptBodyWithoutImports(src, isVue)
  const tplExpr = isVue ? templateExpressions(src) : ''
  const templateOnly = (local) => !word(scriptBody, local) && !word(tplExpr, local)
  for (const m of [...src.matchAll(/^import(\s+type)?\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm)]) {
    const [, typeMod, list, source] = m
    for (const raw of list.split(',').map(s => s.trim()).filter(Boolean)) {
      if (/\bas\b/.test(raw)) continue // aliases: kept by design
      const typeM = raw.match(/^type\s+(\w+)$/)
      const name = typeM ? typeM[1] : raw
      if (typeM || typeMod) {
        if (types.get(name) === source || (types.has(name) && providedLocally(name, source, file, false))) {
          remaining.push(`${rel}: type ${name} from '${source}'`)
        }
      } else if (values.get(name) === source || providedLocally(name, source, file, false)) {
        remaining.push(`${rel}: ${name} from '${source}'`)
      } else if ((components.has(name) || directives.has(name)) && templateOnly(name)) {
        remaining.push(`${rel}: template-only component ${name} from '${source}'`)
      }
    }
  }
  for (const m of [...src.matchAll(/^import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/gm)]) {
    const [, local, source] = m
    if (source.startsWith('~icons')) {
      if ((components.has(local) || /^IBi[A-Z]/.test(local)) && templateOnly(local)) {
        remaining.push(`${rel}: template-only icon ${local}`)
      }
    } else if (providedLocally(local, source, file, true)) {
      remaining.push(`${rel}: default ${local} from '${source}'`)
    }
  }
}
console.log('---')
if (remaining.length) {
  console.log(`VERIFY FAILED: ${remaining.length} covered imports remain:`)
  console.log(remaining.join('\n'))
  process.exitCode = 1
} else {
  console.log('VERIFY OK: zero covered imports remain in src/ (outside generated src/api)')
}
if (aliases.length) {
  console.log(`note: ${aliases.length} aliased specifiers kept by design:`)
  console.log(aliases.join('\n'))
}
